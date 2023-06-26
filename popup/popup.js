var domainText;
var idToRemove;
document.getElementById('block-button').addEventListener('click', blockSite);
document.getElementById('unblock-button').addEventListener('click', unblockSite);
chrome.tabs.query({ active: true, currentWindow: true }, getSiteInfo); 
var tabId;
var origin;
var validURL;
var url;

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
  var url = tabs[0].url;
  var favIcon = tabs[0].favIconUrl;
  var domainName = new URL(url).hostname;
  origin = new URL(url).origin

  if (tabs[0].hasOwnProperty('favIconUrl')){
      document.getElementById('logo').setAttribute("src", favIcon);
  }
  if (tabs[0].hasOwnProperty('url')){
      document.getElementById('domain').textContent = domainName;
  }
  if (!isValidHttpUrl(url)){
    console.log("valid URL")
    document.getElementById('domain').textContent =  "Not available on this page.";
  }

  if (domainName.length > 25){
    document.getElementById('domain').textContent = domainName.slice(0,20) + "...";
  }
}

// adds domain to ruleset
async function blockSite(){
  let uniqueID;
  let rules = [];
  let duplicate = false;
  let domainName;
  // const unprotectedWeb = false;
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
  else{
    console.log(`${domainName} has already been blocked!`);
  }
}


async function unblockSite(){
 domainText = document.getElementById("domain").textContent;
 console.log(domainText);
  chrome.declarativeNetRequest.getDynamicRules({}, function(rules) {
    console.log(rules)
    for (let index = 0; index < rules.length; index++) {
       if (rules[index].condition.urlFilter == domainText){
          console.log(`unblocking ${domainText} with id ${rules[index].id}`)
          chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [parseInt(rules[index].id)]
      }, () => chrome.tabs.reload(tabId))
       }
  }  })

}