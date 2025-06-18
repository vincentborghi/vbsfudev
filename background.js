// background.js - With Unified Data Model for Notes and Emails

console.log("Background service worker started (with unified data model).");

/**
 * Parses a date string into a Date object.
 * Handles "DD/MM/YYYY HH:MM" format first, then falls back to generic parsing.
 * @param {string} dateString - The date string to parse.
 * @returns {Date|null} - A Date object or null if parsing fails.
 */
function parseDateString(dateString) {
    if (!dateString) return null;

    // Regex specifically for DD/MM/YYYY HH:MM format
    const match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (match) {
        try {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // JS months are 0-indexed
            const year = parseInt(match[3]);
            const hour = parseInt(match[4]);
            const minute = parseInt(match[5]);

            if (year > 1970 && month >= 0 && month < 12 && day >= 1 && day <= 31 && hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
                const dateObject = new Date(Date.UTC(year, month, day, hour, minute));
                if (!isNaN(dateObject.getTime())) {
                    return dateObject;
                }
            }
        } catch (e) {
            console.error(`Background: Error parsing matched date parts "${dateString}":`, e);
        }
    }

    // Fallback for other formats
    const parsedFallback = Date.parse(dateString);
    if (!isNaN(parsedFallback)) {
        console.warn(`Background: Used Date.parse fallback for "${dateString}"`);
        return new Date(parsedFallback);
    }

    console.warn(`Background: Could not parse date format "${dateString}"`);
    return null;
}

/**
 * Processes a list of items (Notes or Emails) by opening them in concurrent tabs,
 * scraping their details, and returning a map of the processed data.
 * @param {Array<Object>} itemsToFetch - The items to process.
 * @param {string} itemType - The type of item ('Note' or 'Email').
 * @param {number} senderTabId - The ID of the tab that initiated the request.
 * @returns {Promise<Object>} - A promise that resolves to a map of results.
 */
async function fetchAllDetailsViaTabs(itemsToFetch, itemType, senderTabId) {
    console.log(`Background: Starting CONCURRENT tab automation for ${itemsToFetch.length} ${itemType}(s) from sender tab ${senderTabId}.`);
    const resultsMap = {};
    const scraperScript = itemType === 'Note' ? 'note_scraper.js' : 'email_scraper.js';

    const CONCURRENCY_LIMIT = 4;
    const taskQueue = [...itemsToFetch]; // Clone the array to create a mutable queue
    let itemIndex = 0;

    const processNextItem = async () => {
        // This function will now be called by one of the concurrent runners.
        const itemInfo = taskQueue.shift(); // Get the next item from the shared queue
        if (!itemInfo) return; // No more items left for this runner.

        const currentIndex = ++itemIndex;
        const itemUrl = itemInfo.url;
        let tempTab = null;

        try {
            // Log progress to the original tab
            if (senderTabId) {
                chrome.tabs.sendMessage(senderTabId, {
                    action: "logUrlProcessing",
                    url: itemUrl, itemType: itemType,
                    index: currentIndex, total: itemsToFetch.length
                }).catch(err => console.warn(`Could not send log to tab ${senderTabId}: ${err.message}`));
            }

            console.log(`Background: Processing ${itemType} ${currentIndex}/${itemsToFetch.length}: ${itemUrl}`);
            
            // Create a new, inactive tab for scraping
            tempTab = await chrome.tabs.create({ url: itemUrl, active: false });
            const tempTabId = tempTab.id;
            if (!tempTabId) throw new Error("Failed to create temp tab.");

            // Wait for the tab to fully load
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    chrome.tabs.onUpdated.removeListener(listener);
                    reject(new Error(`Timeout waiting for tab ${tempTabId} to load`));
                }, 30000);
                const listener = (tabId, changeInfo) => {
                    if (tabId === tempTabId && changeInfo.status === 'complete') {
                        clearTimeout(timeout);
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                };
                chrome.tabs.onUpdated.addListener(listener);
            });

            // Set up a promise to listen for the result from the scraper script
            const resultPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    chrome.runtime.onMessage.removeListener(listener);
                    reject(new Error(`Timeout waiting for scrape result from tab ${tempTabId}`));
                }, 20000);
                const expectedResponseType = itemType === 'Note' ? 'noteScrapeResult' : 'emailScrapeResult';
                const listener = (message, sender) => {
                    if (sender.tab?.id === tempTabId && message.type === expectedResponseType) {
                        clearTimeout(timeout);
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(message);
                    }
                    return true; // Keep listener active for other messages
                };
                chrome.runtime.onMessage.addListener(listener);
            });

            // Inject the scraper script and wait for the result
            await chrome.scripting.executeScript({ target: { tabId: tempTabId }, files: [scraperScript] });
            const scrapeResult = await resultPromise;
            
            const parsedDate = parseDateString(itemInfo.dateStr);
            let unifiedResult;

            if (itemType === 'Note') {
                // Unified model for Note
                unifiedResult = {
                    type: 'Note',
                    title: scrapeResult.title || 'Note',
                    author: scrapeResult.author || 'Unknown Author',
                    content: scrapeResult.description || '[No Content]',
                    isPublic: scrapeResult.isPublic,
                    dateObject: parsedDate
                };
            } else { // Email
                // Unified model for Email
                unifiedResult = {
                    type: 'Email',
                    title: scrapeResult.subject || 'Email Subject Not Found',
                    author: scrapeResult.from || 'Unknown Sender',
                    content: scrapeResult.bodyHTML || '[Email Body Not Found]',
                    to: scrapeResult.to || 'Unknown Recipient(s)',
                    isPublic: null,
                    dateObject: parsedDate
                };
            }
            // Store the unified result in the map
            resultsMap[itemUrl] = unifiedResult;

        } catch (error) {
            console.error(`Background: Error processing ${itemType} ${itemUrl} in tab ${tempTab?.id}:`, error);
            resultsMap[itemUrl] = {
                type: itemType,
                title: `[Error processing item]`,
                author: 'System',
                content: error.message,
                dateObject: parseDateString(itemInfo.dateStr) || new Date()
            };
        } finally {
            // Close the temporary tab after processing
            if (tempTab?.id) {
                try {
                    await chrome.tabs.remove(tempTab.id);
                } catch (e) {
                    console.warn(`Background: Error closing temp tab ${tempTab.id}:`, e.message);
                }
            }
        }
    };

    // *** START OF MODIFIED SECTION ***
    // This is the new, corrected concurrency logic.
    // It creates a pool of "runners" that will each process items from the queue
    // until the queue is empty.

    const runners = [];
    // The main runner function. Each runner will pull tasks until the queue is exhausted.
    const runner = async () => {
        while (taskQueue.length > 0) {
            await processNextItem();
        }
    };

    // Start the runners.
    for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
        runners.push(runner());
    }

    // Wait for all runners to complete their work.
    await Promise.all(runners);
    // *** END OF MODIFIED SECTION ***

    console.log(`Background: Finished processing all ${itemsToFetch.length} ${itemType}(s) via tabs.`);
    return resultsMap;
}


// --- Main Listener for Messages from Content Scripts ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`Background: Received message action="${message.action}" from sender:`, sender.tab?.id, sender.url);

    if (message.action === "initiateGenerateFullCaseView") {
        if (sender.tab?.id) {
            chrome.tabs.sendMessage(sender.tab.id, { action: "generateFullCaseView" });
        } else {
            console.error("Background: Cannot initiate generation - sender tab ID is missing.");
        }
        return false; // No response needed from here
    }

    if (message.action === "openFullViewTab" && message.htmlContent) {
        const dataUrl = 'data:text/html;charset=UTF-8,' + encodeURIComponent(message.htmlContent);
        chrome.tabs.create({ url: dataUrl });
        return false; // No response needed
    }

    if (message.action === "fetchItemDetails" && message.items && message.items.length > 0) {
        const itemType = message.items[0].type;
        const itemsToFetch = message.items;
        const senderTabId = sender.tab?.id;

        if (!senderTabId) {
            console.error(`Background: Cannot process 'fetchItemDetails' - sender tab ID missing.`);
            sendResponse({ status: "error", message: "Could not identify sender tab." });
            return false;
        }

        console.log(`Background: Handling 'fetchItemDetails' for ${itemsToFetch.length} ${itemType}(s) from tab ${senderTabId}.`);

        fetchAllDetailsViaTabs(itemsToFetch, itemType, senderTabId)
            .then(resultsMap => {
                console.log(`Background: Finished ${itemType} batch for tab ${senderTabId}. Sending success response.`);
                sendResponse({ status: "success", details: resultsMap });
            })
            .catch(error => {
                console.error(`Background: Error during 'fetchItemDetails' for tab ${senderTabId}:`, error);
                sendResponse({ status: "error", message: error.message });
            });

        return true; // Indicates that sendResponse will be called asynchronously
    }

    console.log(`Background: Received unhandled message action="${message.action}"`);
    return false; // No async response
});

console.log("Background: Service worker listeners attached and ready.");
