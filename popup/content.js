var EXTENSION_ID = "ifheepmbphobjfebkjdhfefhcbhdaikj";
function injectionScript(){
  navigator.serviceWorker.getRegistration().then(function(registration) {
    if (registration) {
      console.log("Service worker is installed.");
      chrome.runtime.sendMessage(EXTENSION_ID,{"serviceWorker": true})
    } else {
      console.log("Service worker is not installed.");
      chrome.runtime.sendMessage(EXTENSION_ID,{"serviceWorker": false})
      
    }
  });
}
injectionScript();