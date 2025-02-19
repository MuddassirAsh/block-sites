document.getElementById('block-button').addEventListener('click', blockSite);
document.getElementById('unblock-button').addEventListener('click', unblockSite);

// incase favicon request has high latency, it is inserted when tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === tab.id && changeInfo.favIconUrl) {
    document.getElementById('logo').setAttribute("src", changeInfo.favIconUrl);
  }
});

async function getCurrentPageData() {
  const queryOptions = { active: true, currentWindow: true };
  const tab = await chrome.tabs.query(queryOptions);
  return tab;
}


async function populatePage() {
  const tab = await getCurrentPageData();
  const url = tab[0].url;
  const favIcon = tab[0].favIconUrl;
  const domainName = new URL(url).hostname;
  const protocol = tab[0].url.split([":"])[0];

  if (tab[0].hasOwnProperty('favIconUrl'))
    document.getElementById('logo').setAttribute("src", favIcon);

  if (tab[0].hasOwnProperty('url'))
    document.getElementById('domain').textContent = domainName;

  if (!isValidProtocol(protocol))
    document.getElementById('domain').textContent =  "Not available on this page.";

  if (domainName.length > 25)
    document.getElementById('domain').textContent = domainName.slice(0,20) + "...";
}


async function generateUniqueID() {
    result = await chrome.storage.local.get(["id"]);
    uniqueID = (result.id || 0) + 1;
    return uniqueID;
}


async function setUniqueID(val) {
  chrome.storage.local.set({"id": val});
}


function isValidProtocol(protocol) {
  return protocol === "http" || protocol === "https";
}


async function addRule(origin, tabId){
  const rules = []
  const uniqueID = await generateUniqueID();
  await setUniqueID(uniqueID);

  rules.push({"id": uniqueID, "priority": 1, 
              "action": {"type": "block"}, 
              "condition": {"urlFilter": origin, 
              "resourceTypes": ["main_frame"]
            }})
  await chrome.declarativeNetRequest.updateDynamicRules({addRules: rules}, 
    () => chrome.tabs.reload(tabId))
}


// adds domain to ruleset
async function blockSite() {
  const tab = await getCurrentPageData();
  const tabId = tab[0].id;
  const url = tab[0].url;
  const origin = new URL(url).origin
  const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();

  // check if domain hasn't already been blocked
  for (let index = 0; index < dynamicRules.length; index++) {
    if (dynamicRules[index].condition.urlFilter == origin)
      return;
  }

  // remove service worker if it exist as it impedes with chrome's API for blocking some sites e.g. Youtube
  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.serviceWorker == true){
        await chrome.browsingData.removeServiceWorkers({origins:[origin]});
    };
    addRule(origin, tabId);
  });

  // run content script to send message regarding service worker status
  await chrome.scripting
  .executeScript({
    target : {tabId : tabId},
    files : ["./popup/content.js" ]
  })
}


async function unblockSite() {
  const tab = await getCurrentPageData();
  const url = tab[0].url;
  const origin = new URL(url).origin
  const tabId = tab[0].id;
  const domainName = document.getElementById('domain').textContent

  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  for (let index = 0; index < rules.length; index++) {
     if (rules[index].condition.urlFilter == origin){
        await chrome.declarativeNetRequest.updateDynamicRules(
        {removeRuleIds:[parseInt(rules[index].id)]})
        await chrome.tabs.reload(tabId);
        await chrome.runtime.reload();
        return;
    }
  }
  alert("Cannot find" + " " + domainName + " " + "in your block list. Click the Edit Block List button to change your block list.");
}

populatePage();