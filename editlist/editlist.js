// outputs domains of the blocked sites from ruleset
chrome.declarativeNetRequest.getDynamicRules({}, function(rules) {
    const ul = document.getElementById('block-list');
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

// unblocks a site from the ruleset
async function unBlockSite (event) {
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [parseInt(event.target.parentElement.attributes[1].textContent)]
    })
    event.target.parentElement.remove();
    event.target.remove();
}


