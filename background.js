let currentRow = { title: "", message: "", date: "" };

const WEBAPP_URL = "";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveTitle",
    title: "Save as Title",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "saveMessage",
    title: "Save as Message",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "sendToSheet",
    title: "Send Title + Message to Sheet",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    id: "showPanel",
    title: "Show Floating Panel",
    contexts: ["all"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "saveTitle":
      currentRow.title = info.selectionText || "";
      chrome.tabs.sendMessage(tab.id, {
        type: "updatePanel",
        title: currentRow.title,
        preserve: "message",
      });
      break;

    case "saveMessage":
      currentRow.message = info.selectionText || "";
      chrome.tabs.sendMessage(tab.id, {
        type: "updatePanel",
        message: currentRow.message,
        preserve: "title",
      });
      break;

    case "sendToSheet":
      sendToSheet(tab);
      break;

    case "showPanel":
      safeSend(tab.id, { type: "updatePanel", ...currentRow });
      break;
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "submit") {
    currentRow.title = msg.title || currentRow.title;
    currentRow.message = msg.message || currentRow.message;
    currentRow.date = msg.date || currentRow.date;

    sendToSheet(sender.tab);
    sendResponse({ success: true });

    return true;
  }
});

function safeSend(tabId, message) {
  chrome.tabs.sendMessage(tabId, message, () => {
    if (chrome.runtime.lastError) {
      console.warn("Panel not active on this tab yet.");
    }
  });
}

function sendToSheet(tab) {
  if (!WEBAPP_URL) {
    console.error("WEBAPP_URL is not set. Please set your Google Sheets web app URL.");
    if (tab?.id) {
      safeSend(tab.id, { type: "showStatus", message: "❌ Web app URL not set", statusType: "error" });
    }
    return;
  }

  console.log("Sending to sheet:", currentRow);

  fetch(WEBAPP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(currentRow),
  })
    .then(() => {
      currentRow = { title: "", message: "", date: "" };

      if (tab?.id) {
        safeSend(tab.id, { type: "updatePanel", title: "", message: "", date: "" });
        safeSend(tab.id, { type: "confirmation" });
        safeSend(tab.id, {
          type: "showStatus",
          message: "✔️ Sent to Sheet!",
          statusType: "success"
        });
      }
    })
    .catch((error) => {
      console.error("Failed to send to Sheet:", error);
      if (tab?.id) {
        safeSend(tab.id, {
          type: "showStatus",
          message: "❌ Failed to send to Sheet!",
          statusType: "error"
        });
      }
    });
}