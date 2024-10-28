// Function to capture salary details from the button element
function captureSalaryDetails() {
    analyzeJobPostings();
}
// Function to check if the job contains a dollar sign ($)
function containsSalary(text) {
    return text.includes('$');
}

function analyzeJobPostings() {
    // Select the <p> tag that contains the job details
    let jobDetailsElement = document.querySelector('.jobs-description-content__text p');
    let jobDetailsText = jobDetailsElement ? (jobDetailsElement.innerText || jobDetailsElement.textContent) : '';


    // Select the job age information
    let jobAgeElement = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container .t-black--light');
    let jobAgeText = jobAgeElement ? (jobAgeElement.innerText || jobAgeElement.textContent) : '';

    let salaryButtonElement = document.querySelector('.job-details-preferences-and-skills');
    let salaryText = salaryButtonElement ? salaryButtonElement.innerText || salaryButtonElement.textContent : "";
    console.log('salaryText: ', salaryText);

    // Check if job has a salary
    const hasSalary = containsSalary(jobDetailsText) || containsSalary(salaryText);

    // Check for grammatical errors using LanguageTool

    const ageScore = evaluateJobAge(jobAgeText);
    const score = calculateScore(hasSalary, ageScore);
    addGhostJobButton(score);
}

// Function to evaluate job age
function evaluateJobAge(jobAgeText) {
    // Updated regex to include years
    const regex = /(\d+)\s+(years?|months?|weeks?|days?)/;
    const match = jobAgeText.match(regex);

    if (match) {
        const num = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();

        // Check for years
        if (unit.startsWith('year') && num > 0) {
            return 30; // More than 1 year (considering any number of years as over 2 months)
        } else if (unit.startsWith('month') && num > 2) {
            return 30; // More than 2 months
        } else if (unit.startsWith('week') && num >= 8) {
            return 30; // 8 weeks is approximately 2 months
        }
    }
    return 0; // Not older than 2 months
}

// Function to check for grammatical errors using LanguageTool
async function checkForGrammaticalErrors(text) {
    const response = await fetch('https://api.languagetoolplus.com/v2/check', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'text': text,
            'language': 'en-US'
        })
    });

    const data = await response.json();
    return data.matches.length > 0; // If there are matches, errors exist
}

// Function to calculate the final score based on conditions
function calculateScore(hasSalary, hasErrors, ageScore) {
    let score = 0;

    if (!hasSalary) score += 70; // No salary found
    // if (hasErrors) score += 10;  // Grammatical error found
    if (ageScore > 0) score += 30; // Job older than 2 months

    return score;
}

// Add ghost job button function
function addGhostJobButton(score) {
    // Remove existing ghost job button if it exists
    const existingButton = document.querySelector('.ghost-button');
    if (existingButton) {
        existingButton.remove();
    }

    if (score == 0) {
        return
    }
    // Create a new button element with score
    let ghostJobButton = document.createElement('button');
    ghostJobButton.textContent = `Ghost Job (${score}%)`;
    ghostJobButton.style.backgroundColor = 'red';
    ghostJobButton.style.color = 'white';
    ghostJobButton.style.marginLeft = '10px';
    ghostJobButton.className = 'ghost-button artdeco-button artdeco-button--primary';

    // Append button to the job details section
    const targetDiv = document.querySelector('.mt4 .display-flex');
    if (targetDiv) {
        targetDiv.appendChild(ghostJobButton);
    }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "captureSalary") {
        captureSalaryDetails();
        sendResponse({ salary: true });
    }
});
