// content.js - Generated on Mon Jun 17 2025 18:20:00 GMT+0200 (Central European Summer Time)
// Full Sequential Processing with Detailed Scraping

console.log("Salesforce Full View: Core Logic Loaded.");

// --- Helper Functions ---
function waitForElement(selector, baseElement = document, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const element = baseElement.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        console.warn(`waitForElement: Timeout waiting for "${selector}"`);
        clearInterval(interval);
        resolve(null);
      }
    }, 300);
  });
}

function waitForElementToDisappear(selector, baseElement = document, timeout = 5000) {
    console.log(`[DEBUG] Starting to wait for "${selector}" to disappear.`);
    return new Promise((resolve) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (!baseElement.querySelector(selector)) {
                console.log(`[DEBUG] Element "${selector}" has disappeared successfully.`);
                clearInterval(interval);
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                console.warn(`[DEBUG] TIMEOUT waiting for "${selector}" to disappear.`);
                clearInterval(interval);
                resolve(false);
            }
        }, 300);
    });
}

function sendMessagePromise(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.error("sendMessagePromise failed:", chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
      return unsafe === null || typeof unsafe === 'undefined' ? '' : String(unsafe);
  }
  return unsafe
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function parseDateStringFromTable(dateString) {
  if (!dateString) return null;
  let match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (match) {
    try {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
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
      console.error(`CS Error creating Date from matched parts: "${dateString}"`, e);
      return null;
    }
  }
  console.warn(`CS Could not parse date format: "${dateString}"`);
  return null;
}


// --- Functions to Extract Salesforce Record Details ---
function findSubjectInContainer(container) {
    if (!container) return 'N/A';
    const element = container.querySelector('support-output-case-subject-field lightning-formatted-text');
    return element ? element.textContent?.trim() : 'N/A (Subject)';
}

function findCaseNumberSpecific(baseElement) {
    const itemSelector = 'records-highlights-details-item:has(p[title="Case Number"])';
    const textSelector = 'lightning-formatted-text';
    const detailsItem = baseElement.querySelector(itemSelector);

    if (detailsItem) {
        const textElement = detailsItem.querySelector(textSelector);
        if (textElement) {
            const recordNum = textElement.textContent?.trim();
            if (recordNum && /^\d+$/.test(recordNum)) {
                 return recordNum;
            }
        }
    }
    return null;
}

function findStatusInContainer(container) {
    if (!container) return 'N/A';
    const statusItem = container.querySelector('records-highlights-details-item:has(records-formula-output lightning-formatted-rich-text)');
    const element = statusItem?.querySelector('lightning-formatted-rich-text span[part="formatted-rich-text"]');
    return element ? element.textContent?.trim() : 'N/A (Status)';
}

async function findCreatorName(baseElement) {
    const createdByItem = await waitForElement('records-record-layout-item[field-label="Created By"]', baseElement);
    if (!createdByItem) { return 'N/A (Creator)'; }
    const nameElement = createdByItem.querySelector('force-lookup a');
    return nameElement ? nameElement.textContent?.trim() : 'N/A (Creator)';
}

async function findCreatedDate(baseElement) {
    const createdByItem = await waitForElement('records-record-layout-item[field-label="Created By"]', baseElement);
    if (!createdByItem) { return 'N/A (Created Date)'; }
    const dateElement = createdByItem.querySelector('records-modstamp lightning-formatted-text');
    return dateElement ? dateElement.textContent?.trim() : 'N/A (Created Date)';
}

function findOwnerInContainer(container) {
     if (!container) return 'N/A';
     const ownerItem = container.querySelector('records-highlights-details-item:has(force-lookup)');
     const element = ownerItem?.querySelector('force-lookup a');
     return element ? element.textContent?.trim() : 'N/A (Owner)';
}

async function findAccountName(baseElement) {
    const accountItem = await waitForElement('records-record-layout-item[field-label="Account Name"]', baseElement);
    if (!accountItem) {
        return 'N/A (Account)';
    }
    const nameElement = accountItem.querySelector('force-lookup a');
    return nameElement ? nameElement.textContent?.trim() : 'N/A (Account)';
}

async function findCaseDescription(baseElement) {
     const descriptionContainer = await waitForElement('article.cPSM_Case_Description', baseElement);
     if (!descriptionContainer) { return ''; }
     let textElement = descriptionContainer.querySelector('lightning-formatted-text.txtAreaReadOnly') || descriptionContainer.querySelector('lightning-formatted-text');
     if (!textElement) { return ''; }
     const viewMoreButton = descriptionContainer.querySelector('button.slds-button:not([disabled])');
     let descriptionHTML = '';
     if (viewMoreButton && (viewMoreButton.textContent.includes('View More') || viewMoreButton.textContent.includes('Show More'))) {
        viewMoreButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        let updatedTextElement = descriptionContainer.querySelector('lightning-formatted-text.txtAreaReadOnly') || descriptionContainer.querySelector('lightning-formatted-text');
        descriptionHTML = updatedTextElement?.innerHTML?.trim() || '';
     } else {
        descriptionHTML = textElement?.innerHTML?.trim() || '';
     }
     return descriptionHTML;
}

// --- SEQUENTIAL RELATED LIST PROCESSORS ---

async function processNotesList(baseElement) {
    console.log("Processing Related List: Notes");
    const containerSelector = 'lst-related-list-view-manager:has(span[title="Notes"])';
    const closeButtonSelector = 'button.slds-button_icon[title^="Close Notes"]';
    
    const listContainer = await waitForElement(containerSelector, baseElement);
    if (!listContainer) { return []; }

    let didClickViewAll = false;
    const viewAllLink = listContainer.querySelector('a.slds-card__footer');
    
    if (viewAllLink && viewAllLink.offsetParent !== null) {
        console.log("Notes: 'View All' link is visible. Clicking...");
        viewAllLink.click();
        didClickViewAll = true;
        await new Promise(resolve => setTimeout(resolve, 1500)); 
    }
    
    if (!didClickViewAll) { return []; }

    const activeViewContainer = document.querySelector('.oneAlohaPage');
    const dataTable = await waitForElement('lightning-datatable', activeViewContainer || document, 5000);
    if (!dataTable) {
        console.warn("Notes data table not found.");
        const closeButton = await waitForElement(closeButtonSelector, document, 5000);
        if (closeButton) { closeButton.click(); await waitForElementToDisappear(`button[title="${closeButton.title}"]`); }
        return [];
    }

    const rows = Array.from(dataTable.querySelectorAll('tr[data-row-key-value]'));
    const processedData = rows.map(row => {
        const urlElement = row.querySelector('th[data-label="PSM Note Name"] a');
        const dateElement = row.querySelector('td[data-label="Created Date"] lst-formatted-text span');
        if (!urlElement || !dateElement) return null;
        return { type: 'Note', url: new URL(urlElement.getAttribute('href'), window.location.origin).href, dateStr: (dateElement.title || dateElement.textContent?.trim()) };
    }).filter(Boolean);

    const closeButton = await waitForElement(closeButtonSelector, document, 5000);
    if (closeButton) {
        console.log(`[DEBUG] Close button for Notes found. Clicking it.`);
        closeButton.click();
        await waitForElementToDisappear(`button[title="Close Notes"]`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return processedData;
}

async function processEmailsList(baseElement) {
    console.log("Processing Related List: Emails");
    // const containerSelector = '.forceRelatedListSingleContainer:has(span[title="Emails"])';
    const containerSelector = '.forceRelatedListPreviewAdvancedGrid:has(span[title="Emails"])';
    const closeButtonSelector = 'button.slds-button_icon[title^="Close Emails"]';
    
    const listContainer = await waitForElement(containerSelector, baseElement);
    if (!listContainer) { return []; }

    let didClickViewAll = false;
    const viewAllLink = listContainer.querySelector('.slds-card__footer'); // VB
    
    if (viewAllLink && viewAllLink.offsetParent !== null) {
        console.log("Emails: 'View All' link is visible. Clicking...");
        viewAllLink.click();
        didClickViewAll = true;
        await new Promise(resolve => setTimeout(resolve, 1500)); 
    }
    
    if (!didClickViewAll) { return []; }

    const activeViewContainer = document.querySelector('.oneAlohaPage');
    const dataTable = await waitForElement('table.uiVirtualDataTable', activeViewContainer || document, 5000);
    if (!dataTable) {
        console.warn("Emails data table not found.");
        if(didClickViewAll) {
             const closeButton = await waitForElement(closeButtonSelector, document, 5000);
             if (closeButton) closeButton.click();
        }
        return [];
    }

    const rows = Array.from(dataTable.querySelectorAll('tbody tr'));
    const processedData = rows.map(row => {
        const urlElement = row.querySelector('th a.outputLookupLink');
        const dateElement = row.querySelector('td span.uiOutputDateTime');
        if (!urlElement || !dateElement) return null;
        return { type: 'Email', url: new URL(urlElement.getAttribute('href'), window.location.origin).href, dateStr: dateElement.textContent?.trim() };
    }).filter(Boolean);
    
    const closeButton = await waitForElement(closeButtonSelector, document, 5000);
    if (closeButton) {
        console.log(`[DEBUG] Close button for Emails found. Clicking it.`);
        closeButton.click();
        await waitForElementToDisappear(`button[title="Close Emails"]`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return processedData;
}


async function processWorkOrdersList(baseElement) {
    console.log("Processing Related List: Work Orders");
    const containerSelector = 'lst-related-list-view-manager:has(span[title="Work Orders"])';
    const closeButtonSelector = 'button.slds-button_icon[title^="Close Work Orders"]';
    
    const listContainer = await waitForElement(containerSelector, baseElement);
    if (!listContainer) { return null; }

    let didClickViewAll = false;
    const viewAllLink = listContainer.querySelector('a.slds-card__footer');

    if (viewAllLink && viewAllLink.offsetParent !== null) {
        console.log("Work Orders: 'View All' link is visible. Clicking...");
        viewAllLink.click();
        didClickViewAll = true;
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    if (!didClickViewAll) { return null; }

    const activeViewContainer = document.querySelector('.oneAlohaPage');
    const dataTable = await waitForElement('table[lightning-datatable_table]', activeViewContainer || document, 5000);
    if (!dataTable) {
        console.warn("Work Orders data table not found.");
        if (didClickViewAll) {
             const closeButton = await waitForElement(closeButtonSelector, document, 5000);
             if (closeButton) closeButton.click();
        }
        return null;
    }

    const headers = Array.from(dataTable.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows = Array.from(dataTable.querySelectorAll('tbody tr'));
    
    let tableHtml = '<table class="slds-table slds-table_bordered">';
    tableHtml += '<thead><tr>';
    headers.forEach(header => tableHtml += `<th>${escapeHtml(header)}</th>`);
    tableHtml += '</tr></thead>';
    
    tableHtml += '<tbody>';
    rows.forEach(row => {
        tableHtml += '<tr>';
        const cells = row.querySelectorAll('th, td');
        cells.forEach(cell => {
            let cellContent = '';
            const link = cell.querySelector('a');
            if (link) {
                const relativeUrl = link.getAttribute('href');
                const absoluteUrl = new URL(relativeUrl, window.location.origin).href;
                cellContent = `<a href="${absoluteUrl}" target="_blank">${escapeHtml(link.textContent.trim())}</a>`;
            } else {
                cellContent = escapeHtml(cell.textContent.trim());
            }
            tableHtml += `<td>${cellContent}</td>`;
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';
    
    const closeButton = await waitForElement(closeButtonSelector, document, 5000);
    if (closeButton) {
        console.log(`[DEBUG] Close button for Work Orders found. Clicking.`);
        closeButton.click();
        await waitForElementToDisappear(`button[title="Close Work Orders"]`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { html: tableHtml, count: rows.length };
}


// --- Main Function to Orchestrate Extraction and Generate HTML (CONTEXT-AWARE) ---
async function generateCaseViewHtml(generatedTime) {
    const statusDiv = document.getElementById('vbsfu-status');

    const activeTabButton = await waitForElement('li.slds-is-active[role="presentation"] a[role="tab"]');
    if (!activeTabButton) {
        console.error("FATAL: Could not find the active Salesforce tab button.");
        return `<html><body><h1>Extraction Error</h1><p>Could not find the active Salesforce tab.</p></body></html>`;
    }
    
    const panelId = activeTabButton.getAttribute('aria-controls');
    if (!panelId) {
        console.error("FATAL: Active tab button has no 'aria-controls' ID.");
        return `<html><body><h1>Extraction Error</h1><p>Could not identify the content panel for the active tab.</p></body></html>`;
    }

    const activeTabPanel = document.getElementById(panelId);
    if (!activeTabPanel) {
        console.error(`FATAL: Could not find tab panel with ID: ${panelId || 'undefined'}`);
        return `<html><body><h1>Extraction Error</h1><p>Could not find the content for the active tab (ID: ${panelId}).</p></body></html>`;
    }
    
    console.log("Starting async HTML generation for the active tab...");
    let objectType = window.location.href.includes('/Case/') ? 'Case' : 'WorkOrder';

    statusDiv.textContent = 'Extracting Details...';
    const highlightsContainerElement = await waitForElement('records-highlights2', activeTabPanel);
    if (!highlightsContainerElement) {
      console.error(`FATAL: Highlights container not found in the active tab.`);
      return `<html><body><h1>Extraction Error</h1><p>Could not find the main details section.</p></body></html>`;
    }

    const subject = findSubjectInContainer(highlightsContainerElement);
    const recordNumber = findCaseNumberSpecific(activeTabPanel);
    const status = findStatusInContainer(highlightsContainerElement);
    const owner = findOwnerInContainer(highlightsContainerElement);
    const creatorName = await findCreatorName(activeTabPanel);
    const accountName = await findAccountName(activeTabPanel);
    const createdDateStr = await findCreatedDate(activeTabPanel);
    const description = await findCaseDescription(activeTabPanel);
    
    // --- SEQUENTIALLY PROCESS RELATED LISTS ---
    
    statusDiv.textContent = 'Processing Notes...';
    const notesToFetch = await processNotesList(activeTabPanel);
    
    statusDiv.textContent = 'Processing Emails...';
    const emailsToFetch = await processEmailsList(activeTabPanel);
    
    statusDiv.textContent = 'Processing Work Orders...';
    const workOrdersData = await processWorkOrdersList(activeTabPanel);
    
    // --- Fetch Details in Parallel ---
    statusDiv.textContent = 'Fetching Details...';
    const allItemsToFetch = [...notesToFetch, ...emailsToFetch];
    let fetchedDetails = {};
    if (allItemsToFetch.length > 0) {
        const response = await sendMessagePromise({ action: "fetchItemDetails", items: allItemsToFetch });
        if (response?.status === 'success') {
            fetchedDetails = response.details;
        }
    }
    
    // --- Combine and Sort Data ---
    const allTimelineItems = allItemsToFetch.map(item => {
        const details = fetchedDetails[item.url] || {};
        return {
            ...item,
            ...details,
            dateObject: new Date(details.dateObject || item.dateStr)
        };
    }); // .filter(item => item.dateObject && !isNaN(item.dateObject.getTime()));

    allTimelineItems.sort((a, b) => a.dateObject - b.dateObject);

    // --- Build HTML ---
    statusDiv.textContent = 'Generating HTML...';
    const safeRecordNumber = escapeHtml(recordNumber || 'N/A');
    const safeSubject = escapeHtml(subject || 'N/A');
    const safeObjectType = escapeHtml(objectType);
    const safeAccountName = escapeHtml(accountName || 'N/A');

    let workOrdersSummary = '';
    if (workOrdersData && workOrdersData.count > 0) {
        workOrdersSummary = `<div class="work-orders-summary"><a href="#work-orders">${workOrdersData.count} Work Order(s)</a></div>`;
    }
    
    let workOrdersSection = '';
    if (workOrdersData && workOrdersData.html) {
        workOrdersSection = `<div class="work-orders-section"><h2 id="work-orders">Work Orders</h2>${workOrdersData.html}</div>`;
    }
    
   
    let debugInfoSection = `
        <div class="debug-info-section">
            <h2>Debug Info</h2>
            <details>
                <summary>Fetched Notes Data (${notesToFetch.length} items)</summary>
                <pre>${escapeHtml(JSON.stringify(notesToFetch.map(n => ({...n, content: undefined})), null, 2))}</pre>
            </details>
            <details>
                <summary>Fetched Emails Data (${emailsToFetch.length} items)</summary>
                <pre>${escapeHtml(JSON.stringify(emailsToFetch.map(e => ({...e, content: undefined})), null, 2))}</pre>
            </details>
            <details>
                <summary>Work Orders Table Data (${workOrdersData ? workOrdersData.count : 0} items)</summary>
                <pre>${escapeHtml(JSON.stringify(workOrdersData, null, 2))}</pre>
            </details>
        </div>
    `;
    
    let htmlOutput = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${safeObjectType} ${safeRecordNumber}: ${safeSubject}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.4; padding: 15px 25px; margin: 0; color: #333; background-color: #f9f9f9; }
            h1, h2 { border-bottom: 1px solid #ccc; padding-bottom: 6px; margin-top: 25px; margin-bottom: 15px; color: #1a5f90; font-weight: 600; }
            h1 { font-size: 1.7em; } h2 { font-size: 1.4em; }
            .meta-info-bar { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; margin-bottom: 25px; border-radius: 5px; background-color: #eef3f8; border: 1px solid #d1e0ee; flex-wrap: wrap; }
            .customer-account-info { font-size: 1.1em; font-weight: 600; color: #005a9e; }
            .generation-info { font-size: 0.85em; color: #555; text-align: right; }
            .work-orders-summary a { font-weight: 600; color: #c25205; text-decoration: none; }
            .work-orders-summary a:hover { text-decoration: underline; }
            .record-details { background-color: #fff; border: 1px solid #e1e5eb; padding: 15px 20px; border-radius: 5px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .record-details h2 { margin-top: 0; margin-bottom: 12px; }
            .details-grid { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; margin-bottom: 15px; align-items: start; }
            .details-grid dt { grid-column: 1; font-weight: 600; color: #005fb2; text-align: right; padding-right: 8px; white-space: nowrap; }
            .details-grid dd { grid-column: 2; margin-left: 0; word-wrap: break-word; text-align: left; }
            .description-label { font-weight: 600; color: #005fb2; margin-bottom: 5px; display: block; }
            .record-details .description-content { white-space: pre-wrap; word-wrap: break-word; margin-top: 0px; padding: 10px 12px; background-color: #f1f1f1; border-radius: 4px; font-size: 0.95em; max-height: 400px; overflow-y: auto; border: 1px solid #e0e0e0; }
            .timeline-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 6px; margin-bottom: 15px; }
            .timeline-header h2 { margin: 0; border: none; padding: 0; }
            #toggle-all-timeline { cursor: pointer; font-size: 0.9em; color: #007bff; text-decoration: none; }
            #toggle-all-timeline:hover { text-decoration: underline; }
            .timeline-item { border: 1px solid #e1e5eb; padding: 12px 18px; margin-bottom: 10px; border-radius: 5px; background-color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.04); position: relative; }
            .timeline-item.type-note { border-left: 5px solid #6b92dc; }
            .timeline-item.type-email { border-left: 5px solid #5cb85c; }
            .item-header { font-size: 0.95em; color: #444; margin-bottom: 8px; border-bottom: 1px dashed #eee; padding-bottom: 6px; line-height: 1.4; background-color: #fffbe6; cursor: pointer; }
            .timeline-item.collapsed .item-content, .timeline-item.collapsed .item-attachments { display: none; }
            .item-timestamp { color: #555; font-family: monospace; margin-right: 10px; font-weight: bold; font-size: 1.2em; background-color:#f0f0f0; padding: 1px 4px; border-radius: 3px; }
            .item-type-label { font-weight: bold; text-transform: uppercase; font-size: 0.85em; margin-right: 5px; }
            .item-type-label.type-note { color: #6b92dc; }
            .item-type-label.type-email { color: #5cb85c; }
            .item-subject-title { font-weight: 600; color: #222; margin-left: 4px; font-size: 1.05em; }
            .item-meta { display: block; font-size: 0.85em; color: #666; margin-top: 3px; }
            .item-meta-label { color: #005fb2; font-weight: 600; }
            .item-meta-info { color: #555; margin-left: 3px; }
            .item-content { white-space: normal; word-wrap: break-word; overflow-wrap: break-word; color: #333; margin-top: 10px; font-size: 0.95em; line-height: 1.45; }
            .item-content p, .item-content ul, .item-content ol { margin-top: 0; margin-bottom: 0.5em; }
            .item-content a { color: #007bff; text-decoration: underline; }
            .item-content blockquote { border-left: 3px solid #ccc; padding-left: 10px; margin-left: 5px; color: #666; font-style: italic; }
            .item-content pre, .item-content code { font-family: monospace; background-color: #eee; padding: 1px 3px; border-radius: 2px; white-space: pre-wrap; }
            .item-attachments { font-style: italic; color: #888; font-size: 0.85em; margin-top: 10px; }
            .error-message { color: red; font-weight: bold; background-color: #ffebeb; border: 1px solid red; padding: 5px 8px; border-radius: 3px; display: inline-block; margin-top: 5px; }
            .item-visibility { margin-left: 8px; font-size: 0.9em; font-weight: bold; text-transform: lowercase; padding: 1px 5px; border-radius: 3px; border: 1px solid transparent; }
            .item-visibility.public { color: #8e1b03; background-color: #fdd; border-color: #fbb; }
            .item-visibility.internal { color: #333; background-color: #eee; border-color: #ddd; }
            .work-orders-section, .debug-info-section { margin-top: 25px; }
            .slds-table { width: 100%; border-collapse: collapse; background: #fff; }
            .slds-table th, .slds-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #dddbda; }
            .slds-table th { background-color: #f3f2f2; font-weight: 600; }
            .debug-info-section details { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; background: #fafafa; border-radius: 4px;}
            .debug-info-section summary { font-weight: bold; cursor: pointer; }
            .debug-info-section pre { background-color: #eee; padding: 10px; border-radius: 3px; white-space: pre-wrap; word-wrap: break-word; }
        </style>
    </head>
    <body>
        <h1>${safeObjectType} ${safeRecordNumber}: ${safeSubject}</h1>
        
        <div class="meta-info-bar">
            <div class="customer-account-info"><strong>Customer Account:</strong> ${safeAccountName}</div>
            ${workOrdersSummary}
            <div class="generation-info">Generated: ${escapeHtml(generatedTime)}</div>
        </div>
    
        <div class="record-details">
            <h2>Details</h2>
            <dl class="details-grid">
                <dt>Date Created:</dt><dd>${escapeHtml(createdDateStr || 'N/A')}</dd>
                <dt>Created By:</dt><dd>${escapeHtml(creatorName || 'N/A')}</dd>
                <dt>Status:</dt><dd>${escapeHtml(status || 'N/A')}</dd>
                <dt>Owner:</dt><dd>${escapeHtml(owner || 'N/A')}</dd>
            </dl>
            <div class="description-label">Description:</div>
            <div class="description-content">${description || '<p><i>Description empty or not found.</i></p>'}</div>
        </div>
        <div class="timeline-header">
            <h2>Timeline (${allTimelineItems.length} items)</h2>
            <a href="#" id="toggle-all-timeline">Collapse All</a>
        </div>
    `;

    if (allTimelineItems.length === 0) {
        htmlOutput += "<p>No Notes or Emails found or extracted successfully.</p>";
    } else {
        allTimelineItems.forEach(item => {
            let contentHtml = '';
            if (item.content && (item.content.startsWith('Error:') || item.content.startsWith('[Fetch Error') || item.content.startsWith('[Body Fetch Error') || item.content.startsWith('[Content'))) {
               contentHtml = `<span class="error-message">${escapeHtml(item.content)}</span>`;
            } else {
               contentHtml = item.content || '<i>[Content Missing]</i>';
            }

            let visibilityLabel = '';
            if (item.type === 'Note') {
                if (item.isPublic === true) visibilityLabel = `<span class="item-visibility public">(public)</span>`;
                else if (item.isPublic === false) visibilityLabel = `<span class="item-visibility internal">(internal)</span>`;
            }

            let formattedTimestamp = 'N/A';
            if (item.dateObject && !isNaN(item.dateObject.getTime())) {
                formattedTimestamp = item.dateObject.toLocaleString(undefined, {
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: false
                });
            } else {
                formattedTimestamp = escapeHtml(item.dateStr || 'Date Error');
            }

            const itemTypeClass = `type-${escapeHtml(item.type?.toLowerCase() || 'unknown')}`;
            const itemTypeLabel = escapeHtml(item.type || 'Item');
            const itemTitle = escapeHtml(item.title || 'N/A');
            const itemAuthor = escapeHtml(item.author || 'N/A');
            const itemTo = escapeHtml(item.to || 'N/A');

            let headerMetaDetails = (item.type === 'Email')
                ? `<span class="item-meta"><span class="item-meta-label">From:</span> <span class="item-meta-info">${itemAuthor}</span> | <span class="item-meta-label">To:</span> <span class="item-meta-info">${itemTo}</span></span>`
                : `<span class="item-meta"><span class="item-meta-label">By:</span> <span class="item-meta-info"><strong>${itemAuthor}</strong></span></span>`;

            htmlOutput += `
            <div class="timeline-item">
                <div class="item-header">
                    <strong class="item-type-label ${itemTypeClass}">${itemTypeLabel}</strong>
                    ${visibilityLabel} <span class="item-timestamp">[${formattedTimestamp}]</span> -
                    <span class="item-subject-title">${itemTitle}</span>
                    ${headerMetaDetails}
                </div>
                <div class="item-content">${contentHtml}</div>
                <div class="item-attachments">Attachments: ${escapeHtml(item.attachments || 'N/A')}</div>
            </div>`;
        });
    }

    // Add the work orders section and debug info at the end
    htmlOutput += workOrdersSection;
    htmlOutput += debugInfoSection;

    htmlOutput += `
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const headers = document.querySelectorAll('.item-header');
            headers.forEach(header => {
                header.addEventListener('click', () => {
                    header.closest('.timeline-item').classList.toggle('collapsed');
                });
            });

            const toggleAllButton = document.getElementById('toggle-all-timeline');
            if (toggleAllButton) {
                toggleAllButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    const timelineItems = document.querySelectorAll('.timeline-item');
                    if (timelineItems.length === 0) return;

                    const shouldCollapse = !timelineItems[0].classList.contains('collapsed');
                    
                    timelineItems.forEach(item => {
                        if (shouldCollapse) {
                            item.classList.add('collapsed');
                        } else {
                            item.classList.remove('collapsed');
                        }
                    });

                    e.target.textContent = shouldCollapse ? 'Expand All' : 'Collapse All';
                });
            }
        });
    </script>
</body></html>`;
    return htmlOutput;
}


// --- Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`Content Script: Received message action="${message.action}"`);

    if (message.action === "generateFullCaseView") {
        console.log("Content Script: Handling 'generateFullCaseView' command.");
        const now = new Date();
        const generatedTime = now.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' });
        const statusDiv = document.getElementById('vbsfu-status');
        if (statusDiv) {
            statusDiv.textContent = 'Extracting data...';
            statusDiv.style.color = 'orange';
        }

        generateCaseViewHtml(generatedTime)
          .then(fullHtml => {
            console.log("Content Script: HTML generation complete. Sending to background.");
            if (statusDiv) {
                statusDiv.textContent = 'Opening results...';
                statusDiv.style.color = 'green';
            }
            chrome.runtime.sendMessage({ action: "openFullViewTab", htmlContent: fullHtml });

            setTimeout(() => {
                const currentStatusDiv = document.getElementById('vbsfu-status');
                if (currentStatusDiv) {
                    currentStatusDiv.textContent = 'Ready.';
                    currentStatusDiv.style.color = ''; 
                }
            }, 4000);
          })
          .catch(error => {
            console.error("Content Script: Error during HTML generation:", error);
            if (statusDiv) {
                statusDiv.textContent = 'Error generating view!';
                statusDiv.style.color = 'red';
            }
            chrome.runtime.sendMessage({
                action: "openFullViewTab",
                htmlContent: `<html><body><h1>Error Generating View</h1><pre>${escapeHtml(error.message)}</pre></body></html>`
            });
          });

        return true; 
    }

    if (message.action === "getCaseNumberAndUrl") {
        const activeTabButton = document.querySelector('li.slds-is-active[role="presentation"] a[role="tab"]');
        if (!activeTabButton) {
             sendResponse({ status: "error", message: "Could not find active tab button." });
             return false;
        }
        const panelId = activeTabButton.getAttribute('aria-controls');
        const activeTabPanel = panelId ? document.getElementById(panelId) : null;
        
        const recordNumber = activeTabPanel ? findCaseNumberSpecific(activeTabPanel) : null;
        const currentUrl = window.location.href;
        if (recordNumber) {
          sendResponse({ status: "success", caseNumber: recordNumber, url: currentUrl });
        } else {
          sendResponse({ status: "error", message: "Could not find Record Number in active tab." });
        }
        return false;
    }

    if (message.action === "logUrlProcessing") {
        console.log(`[BACKGROUND] Progress: Fetching ${message.itemType} ${message.index}/${message.total}`);
        const statusDiv = document.getElementById('vbsfu-status');
        if (statusDiv) {
            statusDiv.textContent = `Fetching ${message.itemType} ${message.index}/${message.total}...`;
            statusDiv.style.color = 'orange';
        }
        return false;
    }

    return false;
});
