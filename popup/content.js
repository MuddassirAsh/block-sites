var EXTENSION_ID = chrome.runtime.id;
function injectionScript() {
  if (location.protocol == "http:"){
    chrome.runtime.sendMessage(EXTENSION_ID, {"serviceWorker": false});
    return;
  }

  navigator.serviceWorker.getRegistration().then((registration) => {
    console.log(registration);
    if (registration) {
      chrome.runtime.sendMessage(EXTENSION_ID, {"serviceWorker": true});
    }
    else {
      chrome.runtime.sendMessage(EXTENSION_ID, {"serviceWorker": false});
     }
  });
}

injectionScript();