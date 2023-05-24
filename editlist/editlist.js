document.getElementById('block-site-button').addEventListener('click', blockSite);
document.getElementById('schedule-unblocking-button').addEventListener('click', scheduleUnBlocking);
document.getElementById('schedule-blocking-button').addEventListener('click', scheduleBlocking);
document.getElementById('user-input2').addEventListener('input', startInputValidation);
document.getElementById('user-input3').addEventListener('input', endInputValidation);
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

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name == "unBlockingSiteSchedule"){
        console.log("onalarm event listener function outside has ran");
        console.log(date);
    }
})

function startInputValidation() {
        if (start.value != "" && end.value != "" && parseInt(start.value.substring(0,2)) > parseInt(end.value.substring(0,2))){  
        start.setCustomValidity('Start time must be smaller than end time!');
        start.reportValidity();
        inputIsValid  = false;

    }
    else if (start.value != "" && end.value != "" && parseInt(start.value.substring(0,2)) == parseInt(end.value.substring(0,2))){
        if (parseInt(start.value.substring(3,5)) == parseInt(end.value.substring(3,5))){
            start.setCustomValidity('Start time should not be equal to end time');
            start.reportValidity();
            inputIsValid  = false;
        }
    }
    else{
        start.setCustomValidity('');
        inputIsValid = true;
    }
}

function endInputValidation() {
    if (start.value != "" && end.value != "" && parseInt(start.value.substring(0,2)) > parseInt(end.value.substring(0,2))){  
        end.setCustomValidity('Start time must be smaller than end time!');
         end.reportValidity();
         inputIsValid  = false;
     }
     else if (start.value != "" && end.value != "" && parseInt(start.value.substring(0,2)) == parseInt(end.value.substring(0,2))){
         if (parseInt(start.value.substring(3,5)) == parseInt(end.value.substring(3,5))){
             end.setCustomValidity('Start time should not be equal to end time');
             end.reportValidity();
             inputIsValid  = false;
         }
         else if (parseInt(start.value.substring(3,5)) > parseInt(end.value.substring(3,5))){
            end.setCustomValidity('Start time should not be greater than end time');
            end.reportValidity();
            inputIsValid  = false;
         }
     }
     else{
         end.setCustomValidity('');
         inputIsValid = true;
     }
}

function scheduleUnBlocking(){
    // check if input is valid before executing logic
    if (!inputIsValid) { 
        console.error('Invalid input, cannot schedule unblocking');
        return;
    }
    date = new Date();
    // console.log(date);
    //TODO: save submitted form values in localstorage so we can set them as default views on subesquent refresh
    var from = document.getElementById('user-input2').value
    var to = document.getElementById('user-input3').value

    // console.log(from.substring(0,2));
    var hourDiff = Math.abs(date.getHours() - parseInt(from.substring(0,2)));
    // console.log(hourDiff+"hourDiff");
    // var minDiff = Math.abs(date.getMinutes() - 60) + parseInt(from[3] + from[4]);
    // console.log(hourDiff);
    // console.log(minDiff);
    // var startTimer = hourDiff * 60 + minDiff
    // console.log(startTimer);
    chrome.alarms.create("unBlockingSiteSchedule",{"delayInMinutes": 1,})
    // there is 1440 minutes in 1 day
}

function scheduleBlocking(){
    alert("schedule blocking");
    chrome.alarms.create("blockingSiteSchedule",{"delayInMinutes": 1,})

}
