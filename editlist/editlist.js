document.getElementById('block-site-button').addEventListener('click', blockSite);
document.getElementById('schedule-unblocking-button').addEventListener('click', scheduleUnBlocking);
document.getElementById('schedule-blocking-button').addEventListener('click', scheduleBlocking);
// document.getElementById('user-input2').addEventListener('input', startInputValidation);
// document.getElementById('user-input3').addEventListener('input', endInputValidation);
var start = document.getElementById('user-input2');
var end = document.getElementById('user-input3');
var inputIsValid = true;

const ul = document.getElementById('block-list');
let rules = [];
var uniqueID;
var value;
var date;
// outputs domains of the blocked sites from ruleset
chrome.declarativeNetRequest.getDynamicRules({}, function(rules) {  
    for (let index = 0; index < rules.length; index++) {
        var li = document.createElement('li');
        var span = document.createElement('span');
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

// block a site by adding to the ruleset
async function blockSite(){
    if (document.getElementById('user-input').value != ""){
        await chrome.storage.local.get(["id"]).then((result) => {
            uniqueID = result.id || 0;  
            uniqueID++;
            chrome.storage.local.set({"id": uniqueID})
            });
    
        rules.push({"id": uniqueID, "priority": 1, 
        "action": {"type": "block"}, 
        "condition": {"urlFilter": document.getElementById('user-input').value, 
        "resourceTypes": ["main_frame"]}})
    
        await chrome.declarativeNetRequest.updateDynamicRules({addRules: rules});
    }
    else{
        console.error("User input cannot be empty. Please enter a website")
    }

}

// unblocks a site from the ruleset
async function unBlockSite (event){
    console.log(event)
    console.log(`unblocking ${event.target.parentElement.firstChild.textContent}...`);
    console.log(event.target.parentElement.attributes[1].textContent);
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [parseInt(event.target.parentElement.attributes[1].textContent)]
    })
    event.target.parentElement.remove();
    event.target.remove();
}

// function startInputValidation() {
//         if (start.value != "" && end.value != "" && parseInt(start.value.substring(0,2)) > parseInt(end.value.substring(0,2))){  
//         start.setCustomValidity('Start time must be smaller than end time!');
//         start.reportValidity();
//         inputIsValid  = false;

//     }
//     else if (start.value != "" && end.value != "" && parseInt(start.value.substring(0,2)) == parseInt(end.value.substring(0,2))){
//         if (parseInt(start.value.substring(3,5)) == parseInt(end.value.substring(3,5))){
//             start.setCustomValidity('Start time should not be equal to end time');
//             start.reportValidity();
//             inputIsValid  = false;
//         }
//     }
//     else{
//         start.setCustomValidity('');
//         inputIsValid = true;
//     }
// }

// function endInputValidation() {
//     if (start.value != "" && end.value != "" && parseInt(start.value.substring(0,2)) > parseInt(end.value.substring(0,2))){  
//         end.setCustomValidity('Start time must be smaller than end time!');
//          end.reportValidity();
//          inputIsValid  = false;
//      }
//      else if (start.value != "" && end.value != "" && parseInt(start.value.substring(0,2)) == parseInt(end.value.substring(0,2))){
//          if (parseInt(start.value.substring(3,5)) == parseInt(end.value.substring(3,5))){
//              end.setCustomValidity('Start time should not be equal to end time');
//              end.reportValidity();
//              inputIsValid  = false;
//          }
//          else if (parseInt(start.value.substring(3,5)) > parseInt(end.value.substring(3,5))){
//             end.setCustomValidity('Start time should not be greater than end time');
//             end.reportValidity();
//             inputIsValid  = false;
//          }
//      }
//      else{
//          end.setCustomValidity('');
//          inputIsValid = true;
//      }
// }


chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name == "unblockingAlarm"){
        console.log("unblocking alaram has been created");
    }
    else if (alaram.name == "blockingAlarm"){
        console.log("blocking alaram has been created");

    }
})

function scheduleUnBlocking(){
    // check if input is valid before executing logic
    if (!inputIsValid) { 
        console.error('Invalid input, cannot schedule unblocking');
        return;
    }
    var from = document.getElementById('start-time-input').value;
    var to = document.getElementById('end-time-input').value;
    var currentDate = new Date();
    var currentTimestamp = currentDate.getTime();
    var unblockFromHour = parseInt(from.substring(0, 2));
    var unblockFromMinute = parseInt(from.substring(3, 5));
    var unblockToHour = parseInt(to.substring(0, 2));
    var unblockToMinute = parseInt(to.substring(3, 5));
    var startUnblockTime = new Date();
    startUnblockTime.setHours(unblockFromHour, unblockFromMinute, 0);
    // in ms since the first 1st epoch
    var startUnblockTimestamp = startUnblockTime.getTime();
    var endUnblockTime = new Date();
    endUnblockTime.setHours(unblockToHour, unblockToMinute, 0);
    // in ms since the first 1st epoch
    var endUnblockTimestamp = endUnblockTime.getTime();
    var delayInMinutes;
    
    // Set the period to repeat daily
    var periodInMinutes = 24 * 60;
  
    if (currentTimestamp >= startUnblockTimestamp && currentTimestamp < endUnblockTimestamp) {
        delayInMinutes = 0;
        var intervalDuration = Math.ceil((endUnblockTimestamp - currentTimestamp) / (1000 * 60));
        chrome.alarms.create('unblockingAlarm', { 'delayInMinutes': intervalDuration, 'periodInMinutes': periodInMinutes });
    } 
    else if (currentTimestamp < startUnblockTimestamp) {
        delayInMinutes = Math.ceil((startUnblockTimestamp - currentTimestamp) / (1000 * 60));
        chrome.alarms.create('blockingAlarm', { 'delayInMinutes': delayInMinutes });
    } 
    else {
        var nextDayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, unblockFromHour, unblockFromMinute, 0);
        delayInMinutes = Math.ceil((nextDayStart.getTime() - currentTimestamp) / (1000 * 60));
        chrome.alarms.create('unblockingAlarm', { 'delayInMinutes': delayInMinutes });
    }
}

function scheduleBlocking(){
    alert("schedule blocking");
    chrome.alarms.create("blockingSiteSchedule",{"delayInMinutes": 1,})

}

function blockSite(){

}

function unBlockSite(){

}
