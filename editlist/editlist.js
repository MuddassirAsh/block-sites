// document.getElementById('block-site-button').addEventListener('click', blockSite);
// document.getElementById('schedule-unblocking-button').addEventListener('click', scheduleUnBlocking);
// document.getElementById('schedule-blocking-button').addEventListener('click', scheduleBlocking);
// var start = document.getElementById('user-input2');
// var end = document.getElementById('user-input3');
var inputIsValid = true;

const ul = document.getElementById('block-list');
let rules = [];
var uniqueID;
var value;
var date;
var delayInMinutes;
var intervalDuration;
const sites = [];


// outputs domains of the blocked sites from ruleset
chrome.declarativeNetRequest.getDynamicRules({}, function(rules) {
    console.log(rules);
    for (let index = 0; index < rules.length; index++) {
        var li = document.createElement('li');
        var but = document.createElement('input');

        li.classList.add('list-item');
        li.innerHTML = rules[index].condition.urlFilter;
        li.setAttribute('data-id', rules[index].id)
        
        but.classList.add('remove-site')
        but.setAttribute('type','submit');
        but.setAttribute('value', 'Remove');
        but.addEventListener('click', unBlockSite);

        ul.appendChild(li)
        li.appendChild(but);
    }
})


/**
 * Currently this function is not working as expected because of difficulty
 * of calling a content script to a page/tab that isn't opened, may need to
 * rework this in the future to work as expected
 */
// block a site by adding to the ruleset
// async function blockSite(){
//     if (document.getElementById('user-input').value != ""){
//         await chrome.storage.local.get(["id"]).then((result) => {
//             uniqueID = result.id || 0;  
//             uniqueID++;
//             chrome.storage.local.set({"id": uniqueID})
//             });
    
//         rules.push({"id": uniqueID, "priority": 1, 
//         "action": {"type": "block"}, 
//         "condition": {"urlFilter": document.getElementById('user-input').value, 
//         "resourceTypes": ["main_frame"]}})
    
//         await chrome.declarativeNetRequest.updateDynamicRules({addRules: rules});
//     }
// }

// unblocks a site from the ruleset
async function unBlockSite (event){
    console.log(`unblocking ${event.target.parentElement.firstChild.textContent}...`);
    console.log(event.target.parentElement.attributes[1].textContent);
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [parseInt(event.target.parentElement.attributes[1].textContent)]
    })
    event.target.parentElement.remove();
    event.target.remove();
}


