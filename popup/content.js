var EXTENSION_ID = chrome.runtime.id;
function injectionScript() {
  if (location.protocol == "http:"){
    chrome.runtime.sendMessage(EXTENSION_ID, {"serviceWorker": false});
    return;
  }

  navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration) {
      chrome.runtime.sendMessage(EXTENSION_ID, {"serviceWorker": true});
      console.log(Date.now());
    }
     else {
      chrome.runtime.sendMessage(EXTENSION_ID, {"serviceWorker": false});
      console.log(Date.now());
     }
  });
}

injectionScript();