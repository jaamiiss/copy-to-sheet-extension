let currentRow = { title: "", message: "" };

const WEBAPP_URL = "";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveTitle",
    title: "Save as Title",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "saveMessage",
    title: "Save as Message",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "sendToSheet",
    title: "Send Title + Message to Sheet",
    contexts: ["all"]
  });
  chrome.contextMenus.create({
    id: "showPanel",
    title: "Show Floating Panel",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveTitle") {
    currentRow.title = info.selectionText;
    safeSend(tab.id, { type: "updatePanel", ...currentRow });
  }
  if (info.menuItemId === "saveMessage") {
    currentRow.message = info.selectionText;
    safeSend(tab.id, { type: "updatePanel", ...currentRow });
  }
  if (info.menuItemId === "showPanel") {
    safeSend(tab.id, { type: "updatePanel", ...currentRow });
  }
  if (info.menuItemId === "sendToSheet") {
    sendToSheet();
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "submit") {
    sendToSheet();
  }
});

function safeSend(tabId, message) {
  chrome.tabs.sendMessage(tabId, message, () => {
    if (chrome.runtime.lastError) {
      console.warn("Panel not active on this tab yet.");
    }
  });
}

function sendToSheet() {
  console.log("Sending to sheet:", currentRow);
  fetch(WEBAPP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: currentRow.title,
      message: currentRow.message
    })
  })
  .then(() => {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon128.png",
      title: "Copy to Sheet",
      message: "Title + Message sent successfully!"
    });
    currentRow.title = "";
    currentRow.message = "";
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        safeSend(tabs[0].id, { type: "updatePanel", title: "", message: "" });
         safeSend(tabs[0].id, { type: "confirmation" });
      }
    });
  })
  .catch((error) => {
    console.error(error);
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon128.png",
      title: "Copy to Sheet",
      message: "Failed to send to Sheet!"
    });
  });
}

