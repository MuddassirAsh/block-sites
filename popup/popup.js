document.getElementById('block-button').addEventListener('click', blockSite);
document.getElementById('unblock-button').addEventListener('click', unblockSite);
chrome.tabs.query({ active: true, currentWindow: true }, getSiteInfo); 
var validURL;
var tabId;
var url;
var favIcon;
var domainName;
var origin;
var uniqueID;
var rules = [];
var duplicate = false;
var match = false;

function isValidHttpUrl(string) {
  try {
    validURL = new URL(string);
  } catch (error) {
    console.log(error);
    return false;  
  }
  return validURL.protocol === "http:" || validURL.protocol === "https:";
}

function getSiteInfo(tabs){
  tabId = tabs[0].id;
  url = tabs[0].url;
  favIcon = tabs[0].favIconUrl;
  domainName = new URL(url).hostname;
  origin = new URL(url).origin
  console.log(favIcon);

  if (tabs[0].hasOwnProperty('favIconUrl')){
      document.getElementById('logo').setAttribute("src", favIcon);
  }
  if (tabs[0].hasOwnProperty('url')){
      document.getElementById('domain').textContent = domainName;
  }
  if (!isValidHttpUrl(url)){
    document.getElementById('domain').textContent =  "Not available on this page.";
  }
  if (domainName.length > 25){
    document.getElementById('domain').textContent = domainName.slice(0,20) + "...";
  }
}

// in case favIcon doesn't get loaded in time, this runs when tab finishes loading
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tabId === tab.id && changeInfo.favIconUrl) {
    favIcon = changeInfo.favIconUrl;
    var logo = document.getElementById('logo');
    logo.setAttribute("src", favIcon);
  }
});

// adds domain to ruleset
async function blockSite(){
  domainName = document.getElementById('domain').textContent

  // removes service worker if it exists
  await chrome.scripting
    .executeScript({
      target : {tabId : tabId},
      files : ["./popup/content.js" ]
    })
   
  await chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>{
    if (message.serviceWorker == true){
      chrome.browsingData.removeServiceWorkers({origins:[origin]})
    }
  })

  await chrome.storage.local.get(["id"]).then((result) => {
    uniqueID = result.id || 0;  
    uniqueID++;
    chrome.storage.local.set({"id": uniqueID})
  });

  // check if domain doesn't already exist in ruleset
  const dynamicRules = await new Promise((resolve,reject) => {
    chrome.declarativeNetRequest.getDynamicRules({}, function(rules) {
      resolve(rules)
      })
    })
  for (let index = 0; index < dynamicRules.length; index++) {
    if (dynamicRules[index].condition.urlFilter == domainName){
       duplicate = true;
       break;
    }
  }
  if (duplicate == false){
      rules.push({"id": uniqueID, "priority": 1, 
    "action": {"type": "block"}, 
    "condition": {"urlFilter": domainName, 
    "resourceTypes": ["main_frame"]}})
    await chrome.declarativeNetRequest.updateDynamicRules({addRules: rules}, 
      () => chrome.tabs.reload(tabId))
  }
}

function unblockSite(){
  chrome.declarativeNetRequest.getDynamicRules({}, function(rules) {
    for (let index = 0; index < rules.length; index++) {
       if (rules[index].condition.urlFilter == domainName){
          match = true;
          console.log(`unblocking ${domainName} with id ${rules[index].id}`)
          chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [parseInt(rules[index].id)]
        }, () => {
          // reloads current tab and pop up extension
          chrome.tabs.reload(tabId);
          chrome.runtime.reload();
        });
      }
    }
    if (match == false) {
      alert("Cannot Find" + " " + domainName + " " + "In Your Block List.\nClick The Edit Block List Button To Change Your Block List.");
    }
  });
}