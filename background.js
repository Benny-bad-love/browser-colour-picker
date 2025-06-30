chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startColorPick") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["content.js"]
        }, () => {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: "requestColorPick", 
            slotIndex: request.slotIndex 
          });
        });
      } else {
        console.error("No active tab found");
      }
    });
  } else if (request.action === "colorPicked") {
    chrome.storage.local.get("currentCollection", (result) => {
      const currentCollection = result.currentCollection || "default";
      chrome.storage.local.set({ 
        [`${currentCollection}-color-${request.slotIndex}`]: request.color 
      });
    });
  } else if (request.action === "saveCollection") {
    chrome.storage.local.set({ 
      collections: request.collections,
      currentCollection: request.currentCollection
    });
  } else if (request.action === "switchCollection") {
    chrome.storage.local.set({ currentCollection: request.collection });
  }
});