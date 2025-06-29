/**
 * M&E Toolkit Google Apps Script Backend
 * Handles receiving form data and appending it to the correct Google Sheet tab.
 */

// --- Configuration ---
// It's good practice to define your Spreadsheet ID here if it's fixed,
// or you can use SpreadsheetApp.getActiveSpreadsheet() if the script is bound to the sheet.
// const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; // Optional: Use if script is standalone

// --- Web App Entry Points ---

/**
 * doGet: Called when the Web App URL is accessed via GET request.
 * Useful for testing if the web app is live.
 */
function doGet(e) {
  return ContentService.createTextOutput("M&E Toolkit Web App is Live. Ready to receive POST data.");
}

/**
 * doPost: Called when data is POSTed to the Web App URL.
 * This function will handle incoming form submissions.
 *
 * Expected incoming JSON structure (from forms.js):
 * {
 *   "submissions": [
 *     {
 *       "id": "localSubmissionId-xyz", // Local ID from client, for tracking if needed
 *       "formId": "SupervisorVerifications", // Matches a config key in forms.js
 *       "sheetName": "SupervisorVerifications", // Target sheet name from config.js
 *       "payload": {
 *         "fieldName1": "value1",
 *         "fieldName2": "value2",
 *         // ... other form fields
 *       },
 *       "submittedAt": "ISO_timestamp_string"
 *     },
 *     // ... more submissions
 *   ]
 * }
 */
function doPost(e) {
  let response = {
    status: "error",
    message: "Unknown error occurred.",
    successfullySyncedIds: [] // To track which specific submissions succeeded in a batch
  };

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No data received in POST request.");
    }

    const requestBody = e.postData.contents;
    const data = JSON.parse(requestBody);

    if (!data.submissions || !Array.isArray(data.submissions) || data.submissions.length === 0) {
      throw new Error("Invalid or empty 'submissions' array in request body.");
    }

    // const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    // For simplicity, using getActiveSpreadsheet() assuming the script is bound to the spreadsheet.
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error("Could not open or access the active spreadsheet. Ensure the script is bound to a spreadsheet or SPREADSHEET_ID is set.");
    }

    let allSuccessful = true;
    let errorsEncountered = [];

    data.submissions.forEach(submission => {
      try {
        if (!submission.sheetName || !submission.payload) {
          throw new Error(`Missing sheetName or payload for submission ID: ${submission.id || 'N/A'}`);
        }

        const sheet = ss.getSheetByName(submission.sheetName);
        if (!sheet) {
          // Optionally, create the sheet if it doesn't exist and if that's desired behavior.
          // For now, we'll treat it as an error.
          // Example: sheet = ss.insertSheet(submission.sheetName);
          //          sheet.appendRow(Object.keys(submission.payload)); // Add header row
          throw new Error(`Sheet named "${submission.sheetName}" not found for submission ID: ${submission.id}. Please create it with correct headers.`);
        }

        // Get headers from the sheet (1st row)
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        if (!headers || headers.length === 0) {
            throw new Error(`Sheet "${submission.sheetName}" has no header row defined. Please add headers in the first row.`);
        }

        // Create an ordered row based on sheet headers
        const newRow = headers.map(header => {
            // Ensure consistent timestamp formatting for Sheets if 'timestamp' or 'date' like fields are present
            if (submission.payload[header] !== undefined && submission.payload[header] !== null) {
                if (typeof submission.payload[header] === 'string') {
                    // Basic check for ISO date/datetime strings that Sheets can parse
                    if (submission.payload[header].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?Z?$/) || // ISO with T and optional Z
                        submission.payload[header].match(/^\d{4}-\d{2}-\d{2}$/)) { // ISO Date only
                        return new Date(submission.payload[header]);
                    }
                }
                return submission.payload[header];
            }
            return ""; // Default to empty string if data for a header is missing
        });

        sheet.appendRow(newRow);
        response.successfullySyncedIds.push(submission.id); // Track successful sync by local ID

      } catch (err) {
        allSuccessful = false;
        const errorMessage = `Error processing submission (local ID: ${submission.id || 'N/A'}, form: ${submission.formId || 'N/A'}): ${err.message}`;
        Logger.log(errorMessage);
        errorsEncountered.push(errorMessage);
      }
    }); // End of forEach submission

    if (allSuccessful) {
      response.status = "success";
      response.message = `${data.submissions.length} submission(s) processed and saved to Google Sheets successfully.`;
    } else {
      response.status = "partial_success"; // Or "error" if all failed
      if (response.successfullySyncedIds.length === 0) response.status = "error";
      response.message = `Processed ${data.submissions.length} submissions. ${response.successfullySyncedIds.length} saved successfully. Errors: ${errorsEncountered.join("; ")}`;
    }

  } catch (error) {
    Logger.log(`Error in doPost: ${error.toString()}\nStack: ${error.stack || 'N/A'}\nRequestBody: ${e ? e.postData.contents.substring(0,500) : 'N/A'}`);
    response.status = "error";
    response.message = `Server error: ${error.message}. Check Apps Script logs for details.`;
    // response.successfullySyncedIds will remain empty or contain those processed before the major error
  }

  // Return a JSON response
  // Important: Must use ContentService for web apps to return proper content type.
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}


// --- Utility Functions (Optional, for testing or direct script execution) ---

/**
 * Helper function to test appending data to a specific sheet.
 * Not directly used by the web app, but useful for development.
 */
function testAppendData() {
  const testSubmission = {
    id: "test-local-id-001",
    formId: "SupervisorVerifications",
    sheetName: "SupervisorVerifications", // Make sure this sheet exists with headers
    payload: {
      // Ensure these field names match the headers in your "SupervisorVerifications" sheet
      "id": "SV-Test-001",
      "timestamp": new Date().toISOString(),
      "date": new Date().toLocaleDateString(),
      "supervisorName": "Test Supervisor",
      "sector": "Health",
      "location": "Test Payam",
      "activity": "Test Activity Verification",
      "observations": "All seems okay.",
      "recommendations": "Continue good work.",
      "verifiedBy": "Test Supervisor"
    },
    submittedAt: new Date().toISOString()
  };

  const mockEvent = {
    postData: {
      contents: JSON.stringify({ submissions: [testSubmission] })
    }
  };

  // Simulate doPost call
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

/**
 * Function to set up initial sheets with headers if they don't exist.
 * Run this manually once from the Apps Script editor.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formConfigs = { // Simplified version of APP_CONFIG.forms for headers
    "SupervisorVerifications": ["id", "timestamp", "date", "supervisorName", "sector", "location", "activity", "observations", "recommendations", "verifiedBy"],
    "DQAChecklists": ["id", "timestamp", "dqaDate", "dqaReviewer", "dqaSite", "dqaSector", "q1Accuracy", "q1Comment", "q2Completeness", "q2Comment", "q3Consistency", "q3Comment", "q4Timeliness", "q4Comment", "dqaCalculatedScore", "dqaOverallComments"],
    "Health": ["id", "submissionTimestamp", "reportingDate", "healthSite", "reportingOfficer", "healthIndicator", "indicatorValue", "comments"],
    "WASH": ["id", "submissionTimestamp", "activityDate", "washLocation", "washActivity", "activityStatus", "numberOfParticipants", "comments"],
    "GBV": ["caseId", "intakeTimestamp", "intakeDate", "survivorLocation", "typeOfIncident", "interventionProvided", "reportedBy", "consentGiven"],
    "OtherGeneral": ["id", "submissionTimestamp", "formDate", "dataCollector", "category", "field1", "field2", "field3", "field4", "notes"]
  };

  for (const sheetName in formConfigs) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`Sheet "${sheetName}" created.`);
    } else {
      Logger.log(`Sheet "${sheetName}" already exists.`);
    }

    // Check if headers exist, if not, add them
    const firstRow = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
    const headersExist = firstRow.some(cell => cell !== ""); // Simple check if first row is not empty

    if (!headersExist) {
      const headers = formConfigs[sheetName];
      sheet.appendRow(headers); // Appends headers to the first empty row, or row 1 if sheet is new/empty
      // If sheet might have data but no headers, you might need to insert row 1: sheet.insertRowBefore(1).getRange(1, 1, 1, headers.length).setValues([headers]);
      Logger.log(`Headers added to "${sheetName}".`);
    } else {
      Logger.log(`Headers seem to exist in "${sheetName}". Skipping header addition.`);
    }
  }
  SpreadsheetApp.flush(); // Apply all pending changes
  Logger.log("Sheet setup process complete.");
}
