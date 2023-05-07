document.getElementById('block-button').addEventListener('click', blockSite);
chrome.tabs.query({ active: true, currentWindow: true }, getSiteInfo); 
var tabId;
var origin;
var url;
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
  if (domainName.length > 25){
    document.getElementById('domain').textContent = domainName.slice(0,20) + "...";
  }
}

// currently this function works sometimes and sometime it complains
// about receiving a number, when only integers are allowed...
// function generateUniqueID(){
//   const timestamp = Date.now();
//   const data = timestamp.toString() + url;
//   // convert data to string because hash functon requires string
//   const hash = CryptoJS.SHA256(data);
//   //convert hash world array object into hex
//   const hexString = hash.toString(CryptoJS.enc.Hex);
//   // convert the first 8 digits of hex string into decimal (base 10)
//   const id = parseInt(hexString.substr(0, 8), 16);
//   // js represents all ints as floating points, chrome's api updateDynamicRules 
//   // method complains about this and so we need to convert this number into a integer 
//   // ensure that the generated integer is >= 1 and return it
//    return Math.trunc(id);
// }

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


