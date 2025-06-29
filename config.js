// Configuration for the M&E Toolkit App

const config = {
    // Replace this URL with your actual Google Apps Script Web App URL after deployment
    googleWebAppUrl: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE',

    // Form definitions - used by forms.js to render forms
    // Each key is a formId, which will also be the tab name and potentially part of the sheet name.
    forms: {
        "SupervisorVerifications": {
            title: "Supervisor Verifications",
            fields: [
                { name: "id", label: "ID", type: "text", required: true, isId: true, readonlyOnEdit: true }, // 'isId' helps identify the unique field
                { name: "timestamp", label: "Timestamp", type: "datetime-local", required: true, autoPopulate: 'datetime' }, // 'autoPopulate' helps with default values
                { name: "date", label: "Date of Verification", type: "date", required: true, autoPopulate: 'date' },
                { name: "supervisorName", label: "Supervisor Name", type: "text", required: true, fromUser: 'username' }, // 'fromUser' can prefill from logged in user
                { name: "sector", label: "Sector", type: "select", required: true, options: ["Health", "WASH", "GBV", "Nutrition", "Education", "CCCM", "Protection", "FSL", "Other"] },
                { name: "location", label: "Location (Payam/Boma)", type: "text", required: true },
                { name: "activity", label: "Activity Verified", type: "text", required: true },
                { name: "observations", label: "Observations", type: "textarea", required: true },
                { name: "recommendations", label: "Recommendations", type: "textarea", required: true },
                { name: "verifiedBy", label: "Verified By (Name)", type: "text", required: true, fromUser: 'username'}
            ],
            sheetName: "SupervisorVerifications" // Explicitly define sheet name
        },
        "DQAChecklists": {
            title: "DQA Checklists",
            fields: [
                { name: "id", label: "ID", type: "text", required: true, isId: true, readonlyOnEdit: true },
                { name: "timestamp", label: "Timestamp", type: "datetime-local", required: true, autoPopulate: 'datetime' },
                { name: "dqaDate", label: "DQA Date", type: "date", required: true, autoPopulate: 'date' },
                { name: "dqaReviewer", label: "DQA Reviewer", type: "text", required: true, fromUser: 'username' },
                { name: "dqaSite", label: "DQA Site (Facility/Location)", type: "text", required: true },
                { name: "dqaSector", label: "DQA Sector", type: "select", required: true, options: ["Health", "WASH", "GBV", "Nutrition", "Education", "CCCM", "Protection", "FSL", "Other"] },
                { name: "q1Accuracy", label: "Q1. Accuracy (0-100%)", type: "number", required: true, min:0, max:100, isDqaScore: true },
                { name: "q1Comment", label: "Q1 Comment", type: "textarea" },
                { name: "q2Completeness", label: "Q2. Completeness (0-100%)", type: "number", required: true, min:0, max:100, isDqaScore: true },
                { name: "q2Comment", label: "Q2 Comment", type: "textarea" },
                { name: "q3Consistency", label: "Q3. Consistency (0-100%)", type: "number", required: true, min:0, max:100, isDqaScore: true },
                { name: "q3Comment", label: "Q3 Comment", type: "textarea" },
                { name: "q4Timeliness", label: "Q4. Timeliness (0-100%)", type: "number", required: true, min:0, max:100, isDqaScore: true },
                { name: "q4Comment", label: "Q4 Comment", type: "textarea" },
                { name: "dqaCalculatedScore", label: "DQA Calculated Score (%)", type: "calculated", readonly: true, formula: 'calculateDqaScore'}, // 'formula' points to a function in forms.js
                { name: "dqaOverallComments", label: "DQA Overall Comments/Action Plan", type: "textarea" }
            ],
            sheetName: "DQAChecklists"
        },
        "Health": {
            title: "Health Monitoring",
            fields: [
                { name: "id", label: "Entry ID", type: "text", required: true, isId: true, readonlyOnEdit: true },
                { name: "submissionTimestamp", label: "Submission Time", type: "datetime-local", required: true, autoPopulate: 'datetime' },
                { name: "reportingDate", label: "Reporting Date", type: "date", required: true, autoPopulate: 'date' },
                { name: "healthSite", label: "Health Site/Facility", type: "text", required: true },
                { name: "reportingOfficer", label: "Reporting Officer", type: "text", required: true, fromUser: 'username' },
                { name: "healthIndicator", label: "Indicator", type: "select", required: true, options: ["OPD Consultations", "Child Immunizations", "ANC Visits", "Deliveries by SBA", "Other"] },
                { name: "indicatorValue", label: "Value", type: "number", required: true },
                { name: "comments", label: "Comments/Notes", type: "textarea" }
            ],
            sheetName: "Health"
        },
        "WASH": {
            title: "WASH Monitoring",
            fields: [
                { name: "id", label: "Entry ID", type: "text", required: true, isId: true, readonlyOnEdit: true },
                { name: "submissionTimestamp", label: "Submission Time", type: "datetime-local", required: true, autoPopulate: 'datetime' },
                { name: "activityDate", label: "Activity Date", type: "date", required: true, autoPopulate: 'date' },
                { name: "washLocation", label: "Location (Village/Camp)", type: "text", required: true },
                { name: "washActivity", label: "Activity Type", type: "select", required: true, options: ["Hygiene Promotion Session", "Latrine Construction", "Water Point Rehabilitation", "Solid Waste Management", "Other"] },
                { name: "activityStatus", label: "Status", type: "select", required: true, options: ["Completed", "Ongoing", "Pending", "Cancelled"] },
                { name: "numberOfParticipants", label: "Number of Participants (if applicable)", type: "number", min:0 },
                { name: "comments", label: "Comments/Challenges", type: "textarea" }
            ],
            sheetName: "WASH"
        },
        "GBV": {
            title: "GBV Case Intake (Sample)",
            fields: [
                { name: "caseId", label: "Case ID", type: "text", required: true, isId: true, readonlyOnEdit: true }, // Using caseId as specific ID field
                { name: "intakeTimestamp", label: "Intake Time", type: "datetime-local", required: true, autoPopulate: 'datetime' },
                { name: "intakeDate", label: "Intake Date", type: "date", required: true, autoPopulate: 'date' },
                { name: "survivorLocation", label: "Location of Survivor (General)", type: "text", required: true, placeholder: "e.g., PoC Site Section A" },
                { name: "typeOfIncident", label: "Type of Incident", type: "select", required: true, options: ["Sexual Assault", "Physical Assault", "Psychological/Emotional Abuse", "Denial of Resources/Opportunities", "Forced Marriage", "Other"] },
                { name: "interventionProvided", label: "Intervention Provided", type: "textarea", required: true, placeholder: "e.g., Psychosocial support, Medical referral, Legal aid" },
                { name: "reportedBy", label: "Case Worker", type: "text", required: true, fromUser: 'username' },
                { name: "consentGiven", label: "Consent for Data Collection", type: "select", required: true, options: ["Yes", "No"] }
            ],
            sheetName: "GBV"
        },
        // Add more forms here following the same structure
        // Example for a generic "Other" form
        "OtherGeneral": {
            title: "Other Data Collection",
            fields: [
                { name: "id", label: "Entry ID", type: "text", required: true, isId: true, readonlyOnEdit: true },
                { name: "submissionTimestamp", label: "Submission Time", type: "datetime-local", required: true, autoPopulate: 'datetime' },
                { name: "formDate", label: "Date", type: "date", required: true, autoPopulate: 'date' },
                { name: "dataCollector", label: "Data Collector", type: "text", required: true, fromUser: 'username' },
                { name: "category", label: "Category/Sector", type: "text", required: true, placeholder: "e.g., Nutrition, Admin, Logistics" },
                { name: "field1", label: "Custom Field 1", type: "text" },
                { name: "field2", label: "Custom Field 2 (Numeric)", type: "number" },
                { name: "field3", label: "Custom Field 3 (Date)", type: "date" },
                { name: "field4", label: "Custom Field 4 (Select)", type: "select", options: ["Option A", "Option B", "Option C"]},
                { name: "notes", label: "Additional Notes", type: "textarea" }
            ],
            sheetName: "OtherGeneral"
        }
    },

    // Hardcoded users - this should match login.js for consistency, but ideally fetched from a secure source
    // For frontend purposes, it's mainly for display or minor role-based UI tweaks if needed beyond login.
    // The actual login validation happens in login.js.
    users: {
        "admin": { role: "Admin" },
        "meofficer": { role: "M&E Officer" },
        "supervisor": { role: "Supervisor" }
    }
};

// Make config globally accessible
window.APP_CONFIG = config;
console.log("APP_CONFIG loaded:", window.APP_CONFIG);

// Function to generate a unique ID (simple version)
// In a real app, consider more robust UUID generation if needed, especially for offline scenarios.
function generateUniqueId(prefix = 'item') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
// Example: generateUniqueId('sv') for Supervisor Verification
//          generateUniqueId('dqa') for DQA Checklist

// Function to get current date in YYYY-MM-DD format
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Function to get current datetime in YYYY-MM-DDTHH:mm format
function getCurrentDateTimeLocal() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust for local timezone
    return now.toISOString().slice(0, 16);
}
