document.addEventListener('DOMContentLoaded', () => {
    // Authentication check
    const loggedInUser = localStorage.getItem('loggedInUser');
    const userRole = localStorage.getItem('userRole');

    if (!loggedInUser || !userRole) {
        window.location.href = 'index.html'; // Redirect to login if not authenticated
        return;
    }

    // Display user role
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    if (userRoleDisplay) {
        userRoleDisplay.textContent = `Role: ${userRole}`;
    }

    // Logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (typeof handleLogout === 'function') {
                handleLogout();
            } else { // Fallback
                localStorage.removeItem('loggedInUser');
                localStorage.removeItem('userRole');
                localStorage.removeItem('pendingSubmissions');
                window.location.href = 'index.html';
            }
        });
    }

    const formTabsContainer = document.getElementById('formTabsContainer')?.querySelector('ul');
    const formDisplayArea = document.getElementById('formDisplayArea');
    const initialMessage = document.getElementById('initialMessage');
    const offlineStatusDiv = document.getElementById('offlineStatus');
    const syncNotificationDiv = document.getElementById('syncNotification');
    const syncCountSpan = document.getElementById('syncCount');
    const retrySyncButton = document.getElementById('retrySyncButton');
    const viewPendingButton = document.getElementById('viewPendingButton');
    const syncStatusDiv = document.getElementById('syncStatus');

    let pendingSubmissions = JSON.parse(localStorage.getItem('pendingSubmissions')) || [];
    let currentFormId = null; // To keep track of which form is currently displayed/active

    // --- Initialize ---
    populateFormTabs();
    updateSyncNotification();
    checkOnlineStatus();

    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    if (retrySyncButton) {
        retrySyncButton.addEventListener('click', () => attemptSyncSubmissions(true));
    }
    if(viewPendingButton) {
        viewPendingButton.addEventListener('click', displayPendingSubmissions);
    }


    // --- Tab Generation & Handling ---
    function populateFormTabs() {
        if (!formTabsContainer || !window.APP_CONFIG || !window.APP_CONFIG.forms) return;
        formTabsContainer.innerHTML = ''; // Clear existing tabs

        Object.keys(window.APP_CONFIG.forms).forEach(formId => {
            const formConfig = window.APP_CONFIG.forms[formId];
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = formConfig.title;
            link.dataset.formid = formId;
            link.classList.add('tab-link');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                handleTabClick(formId, link);
            });
            listItem.appendChild(link);
            formTabsContainer.appendChild(listItem);
        });
    }

    function handleTabClick(formId, clickedLink) {
        currentFormId = formId;
        if (initialMessage) initialMessage.style.display = 'none';

        document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
        clickedLink.classList.add('active');

        renderForm(formId);
    }

    // --- Form Rendering ---
    function renderForm(formId, existingData = null, submissionIdToEdit = null) {
        if (!formDisplayArea || !window.APP_CONFIG || !window.APP_CONFIG.forms[formId]) return;

        const formConfig = window.APP_CONFIG.forms[formId];
        formDisplayArea.innerHTML = ''; // Clear previous form

        const formElement = document.createElement('form');
        formElement.id = `${formId}-form`;
        formElement.dataset.formid = formId; // Store formId for submission logic

        const formTitle = document.createElement('h2');
        formTitle.textContent = existingData ? `Edit: ${formConfig.title}` : formConfig.title;
        formElement.appendChild(formTitle);

        formConfig.fields.forEach(field => {
            const group = document.createElement('div');
            group.classList.add('form-group');

            const label = document.createElement('label');
            label.setAttribute('for', field.name);
            label.textContent = field.label + (field.required ? ' *' : '');
            group.appendChild(label);

            if (field.type === 'calculated') {
                const display = document.createElement('p');
                display.id = field.name + 'Display'; // e.g., dqaCalculatedScoreDisplay
                display.textContent = existingData?.[field.name] || '0';
                if (field.readonly) display.classList.add('read-only-field'); // Optional styling
                group.appendChild(display);
                // Hidden input to store the value if needed, though calculated might not be submitted directly
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.id = field.name;
                hiddenInput.name = field.name;
                hiddenInput.value = existingData?.[field.name] || '0';
                group.appendChild(hiddenInput);

            } else if (field.type === 'textarea') {
                const textarea = document.createElement('textarea');
                textarea.id = field.name;
                textarea.name = field.name;
                if (field.required) textarea.required = true;
                if (field.placeholder) textarea.placeholder = field.placeholder;
                textarea.value = existingData?.[field.name] || '';
                group.appendChild(textarea);
            } else if (field.type === 'select') {
                const select = document.createElement('select');
                select.id = field.name;
                select.name = field.name;
                if (field.required) select.required = true;

                // Add a default blank option
                const defaultOption = document.createElement('option');
                defaultOption.value = "";
                defaultOption.textContent = `-- Select ${field.label} --`;
                if (field.required) defaultOption.disabled = true; // Make it unselectable if required
                if (!existingData?.[field.name]) defaultOption.selected = true; // Select by default if no value
                select.appendChild(defaultOption);


                field.options.forEach(optValue => {
                    const option = document.createElement('option');
                    option.value = optValue;
                    option.textContent = optValue;
                    if (existingData?.[field.name] === optValue) option.selected = true;
                    select.appendChild(option);
                });
                group.appendChild(select);
            } else { // input types: text, date, datetime-local, number
                const input = document.createElement('input');
                input.type = field.type;
                input.id = field.name;
                input.name = field.name;
                if (field.required) input.required = true;
                if (field.placeholder) input.placeholder = field.placeholder;
                if (field.min) input.min = field.min;
                if (field.max) input.max = field.max;
                if (field.readonlyOnEdit && existingData) input.readOnly = true;


                // Auto-population logic
                let defaultValue = '';
                if (field.autoPopulate && !existingData) { // Only auto-populate for new forms
                    if (field.autoPopulate === 'date') defaultValue = getCurrentDate();
                    else if (field.autoPopulate === 'datetime') defaultValue = getCurrentDateTimeLocal();
                }
                if (field.fromUser === 'username' && !existingData) {
                     defaultValue = localStorage.getItem('loggedInUser') || '';
                }

                input.value = existingData?.[field.name] || defaultValue;

                if (field.isId && !existingData) { // Auto-generate ID for new forms if it's an ID field
                    input.value = generateUniqueId(formId.substring(0,3).toLowerCase());
                    input.readOnly = true; // Usually, IDs are not user-editable once generated
                } else if (field.isId && existingData) {
                    input.readOnly = true; // ID should not be editable
                }


                group.appendChild(input);
                if (field.isDqaScore) { // For DQA score fields, add event listener to calculate total
                    input.addEventListener('input', () => calculateDqaScore(formElement, formConfig.fields));
                }
            }
            formElement.appendChild(group);
        });

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = existingData ? 'Update Submission' : 'Submit Form';
        submitButton.classList.add('button');
        formElement.appendChild(submitButton);

        if (existingData && submissionIdToEdit) { // If editing a pending submission
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.textContent = 'Cancel Edit';
            cancelButton.classList.add('button', 'secondary');
            cancelButton.style.marginLeft = '10px';
            cancelButton.addEventListener('click', () => {
                displayPendingSubmissions(); // Go back to pending list
            });
            formElement.appendChild(cancelButton);
        }


        formElement.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(formElement);
            const data = Object.fromEntries(formData.entries());

            // Ensure calculated fields are included
            formConfig.fields.forEach(field => {
                if (field.type === 'calculated') {
                    const displayElement = document.getElementById(field.name + 'Display');
                    if (displayElement) data[field.name] = displayElement.textContent;
                    // Also update the hidden input if it exists
                     const hiddenInput = document.getElementById(field.name);
                     if(hiddenInput) data[field.name] = hiddenInput.value;
                }
            });


            // If editing, submissionIdToEdit will be the original localSubmissionId
            // If new, it will be null.
            handleFormSubmission(formId, data, submissionIdToEdit);
            formElement.reset(); // Reset form after processing
            renderForm(formId); // Re-render the blank form for next entry
        });

        formDisplayArea.appendChild(formElement);

        // Initial DQA score calculation if it's a DQA form and editing/viewing
        if (formConfig.fields.some(f => f.isDqaScore) && (existingData || formId === "DQAChecklists")) {
            calculateDqaScore(formElement, formConfig.fields);
        }
    }

    // --- DQA Score Calculation ---
    function calculateDqaScore(formElement, fields) {
        if (!formElement || !fields) return;
        const scoreFields = fields.filter(f => f.isDqaScore);
        let totalScore = 0;
        let count = 0;
        scoreFields.forEach(field => {
            const inputElement = formElement.elements[field.name];
            if (inputElement && inputElement.value) {
                const value = parseFloat(inputElement.value);
                if (!isNaN(value)) {
                    totalScore += value;
                    count++;
                }
            }
        });
        const averageScore = count > 0 ? (totalScore / count).toFixed(2) : 0;
        const calculatedScoreDisplay = formElement.querySelector('#dqaCalculatedScoreDisplay');
        const calculatedScoreInput = formElement.elements['dqaCalculatedScore']; // Hidden input

        if (calculatedScoreDisplay) {
            calculatedScoreDisplay.textContent = `${averageScore}%`;
        }
        if (calculatedScoreInput) {
            calculatedScoreInput.value = averageScore;
        }
    }


    // --- Form Submission & Offline Handling ---
    function handleFormSubmission(formId, data, editingSubmissionId = null) {
        const submission = {
            id: editingSubmissionId || generateUniqueId('sub'), // Use existing ID if editing, else new
            formId: formId, // e.g., "SupervisorVerifications"
            sheetName: window.APP_CONFIG.forms[formId].sheetName, // Get sheetName from config
            payload: data,
            submittedAt: new Date().toISOString()
        };

        if (editingSubmissionId) { // If we are editing an existing PENDING submission
            const index = pendingSubmissions.findIndex(s => s.id === editingSubmissionId);
            if (index > -1) {
                pendingSubmissions[index] = submission; // Update it
            }
        } else {
            pendingSubmissions.push(submission);
        }

        localStorage.setItem('pendingSubmissions', JSON.stringify(pendingSubmissions));
        updateSyncNotification();
        showStatusMessage(`Form '${window.APP_CONFIG.forms[formId].title}' data ${editingSubmissionId ? 'updated locally' : 'saved locally'}. Attempting to sync...`, 'info');

        attemptSyncSubmissions();

        // After submission (new or edit), if it was an edit, go back to pending list.
        // If it was a new submission, the form re-renders blank.
        if (editingSubmissionId) {
            displayPendingSubmissions();
        } else {
             // Re-render the current form blank for a new entry
            const activeTabLink = formTabsContainer.querySelector('.tab-link.active');
            if (activeTabLink) {
                 renderForm(activeTabLink.dataset.formid);
            } else if (currentFormId) { // Fallback if no active tab somehow (should not happen)
                 renderForm(currentFormId);
            }
        }
    }

    async function attemptSyncSubmissions(isManualRetry = false) {
        if (!navigator.onLine) {
            showStatusMessage('Offline. Sync will be attempted when online.', 'warning');
            if (isManualRetry) alert('You are offline. Please connect to the internet to sync.');
            updateSyncNotification(); // Ensure notification reflects pending items
            return;
        }

        if (pendingSubmissions.length === 0) {
            if (isManualRetry) showStatusMessage('No pending submissions to sync.', 'success');
            updateSyncNotification();
            return;
        }

        const syncUrl = window.APP_CONFIG.googleWebAppUrl;
        if (!syncUrl || syncUrl === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
            showStatusMessage('Google Apps Script URL not configured. Cannot sync.', 'error');
            if (isManualRetry) alert('Sync URL is not configured in config.js.');
            return;
        }

        // Show spinner on sync button during sync attempt
        if(retrySyncButton && isManualRetry){
            retrySyncButton.innerHTML = '<span class="spinner"></span> Syncing...';
            retrySyncButton.disabled = true;
        }


        // Create a batch of submissions to send
        // The backend will expect an object with a "submissions" key, which is an array of submission objects
        const batchToSend = { submissions: [...pendingSubmissions] };


        try {
            showStatusMessage(`Syncing ${batchToSend.submissions.length} submission(s)...`, 'info', true);
            const response = await fetch(syncUrl, {
                method: 'POST',
                mode: 'cors', // Required for cross-origin requests to GAS web app
                headers: {
                    'Content-Type': 'application/json', // Sending as JSON
                },
                // body: JSON.stringify(pendingSubmissions[0]) // Send one by one initially
                body: JSON.stringify(batchToSend) // Send as a batch
            });

            // GAS web apps often return text/plain for redirects, handle this
            const responseText = await response.text();
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                // If parsing fails, it might be a non-JSON response (e.g. HTML error page from GAS or simple text)
                // Check if the response indicates success based on status and known GAS behavior
                if (response.ok && responseText.toLowerCase().includes("success")) { // A simple success message might be returned
                     responseData = { status: "success", message: responseText };
                } else if (response.ok && responseText.includes("M&E Toolkit Web App is Live")) { // doGet response
                     responseData = { status: "error", message: "Received doGet response. Check GAS doPost." };
                }
                else {
                    throw new Error(`Non-JSON response from server: ${responseText.substring(0,100)}`);
                }
            }


            if (response.ok && responseData.status === 'success') {
                // Successful sync of the batch
                const successfullySyncedIds = responseData.successfullySyncedIds || pendingSubmissions.map(s => s.id); // Assume all if no specific IDs returned

                // Filter out successfully synced items
                pendingSubmissions = pendingSubmissions.filter(s => !successfullySyncedIds.includes(s.id));

                localStorage.setItem('pendingSubmissions', JSON.stringify(pendingSubmissions));
                showStatusMessage(responseData.message || `${successfullySyncedIds.length} submission(s) synced successfully!`, 'success');
                updateSyncNotification();

                // If viewing pending submissions, refresh the list
                if (formDisplayArea.querySelector('#pending-submissions-list')) {
                    displayPendingSubmissions();
                }

            } else {
                // Handle partial success or specific errors if backend provides details
                if (responseData.successfullySyncedIds && responseData.successfullySyncedIds.length > 0) {
                    const SucceededCount = responseData.successfullySyncedIds.length;
                     pendingSubmissions = pendingSubmissions.filter(s => !responseData.successfullySyncedIds.includes(s.id));
                     localStorage.setItem('pendingSubmissions', JSON.stringify(pendingSubmissions));
                     showStatusMessage(`${SucceededCount} submission(s) synced. Others failed: ${responseData.message || 'Unknown server error'}`, 'warning');
                } else {
                    showStatusMessage(`Sync failed: ${responseData.message || 'Unknown server error'}`, 'error');
                }
                updateSyncNotification();
            }

        } catch (error) {
            console.error('Sync error:', error);
            showStatusMessage(`Sync error: ${error.message}. Data remains local.`, 'error');
            updateSyncNotification();
        } finally {
             if(retrySyncButton && isManualRetry){
                retrySyncButton.innerHTML = 'Sync Now';
                retrySyncButton.disabled = false;
            }
             checkOnlineStatus(); // Update online status display after attempt
        }
    }

    // --- UI Updates (Status, Notifications) ---
    function checkOnlineStatus() {
        const isOnline = navigator.onLine;
        if (offlineStatusDiv) {
            offlineStatusDiv.style.display = isOnline ? 'none' : 'block';
        }
        if (isOnline) {
            showStatusMessage('Connection restored. You are online.', 'info');
            if (pendingSubmissions.length > 0) {
                showStatusMessage(`You have ${pendingSubmissions.length} pending submissions. Attempting to sync.`, 'info');
                attemptSyncSubmissions(); // Attempt to sync when back online
            }
        } else {
            showStatusMessage('Connection lost. You are offline. Submissions will be saved locally.', 'warning');
        }
        updateSyncNotification(); // Also update the sync notification based on online status
    }

    function updateSyncNotification() {
        if (!syncNotificationDiv || !syncCountSpan || !retrySyncButton || !viewPendingButton) return;

        const count = pendingSubmissions.length;
        syncCountSpan.textContent = count;

        if (count > 0) {
            syncNotificationDiv.style.display = 'block';
            retrySyncButton.disabled = !navigator.onLine; // Disable sync if offline
            if(!navigator.onLine) {
                retrySyncButton.innerHTML = 'Sync (Offline)';
            } else {
                 retrySyncButton.innerHTML = 'Sync Now';
            }
        } else {
            syncNotificationDiv.style.display = 'none';
        }
    }

    function showStatusMessage(message, type = 'info', persist = false) {
        if (!syncStatusDiv) return;
        syncStatusDiv.textContent = message;
        syncStatusDiv.className = `status-${type}`; // Use classes for styling: status-info, status-success, status-warning, status-error
        syncStatusDiv.style.display = 'block';

        // Clear message after a delay, unless persist is true
        if (!persist) {
            setTimeout(() => {
                syncStatusDiv.style.display = 'none';
            }, type === 'error' || type === 'warning' ? 7000 : 4000); // Longer for errors/warnings
        }
    }

    // --- View/Edit Pending Submissions ---
    function displayPendingSubmissions() {
        if (!formDisplayArea) return;
        if (initialMessage) initialMessage.style.display = 'none';
        document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active')); // Deactivate form tabs
        currentFormId = null; // No specific form is "active" when viewing pending list

        formDisplayArea.innerHTML = ''; // Clear current form
        const title = document.createElement('h2');
        title.textContent = 'Pending Submissions';
        formDisplayArea.appendChild(title);

        if (pendingSubmissions.length === 0) {
            formDisplayArea.innerHTML += '<p>No pending submissions.</p>';
            return;
        }

        const list = document.createElement('ul');
        list.id = 'pending-submissions-list';
        list.style.listStyle = 'none';
        list.style.padding = '0';

        pendingSubmissions.forEach((submission, index) => {
            const listItem = document.createElement('li');
            listItem.style.marginBottom = '10px';
            listItem.style.padding = '10px';
            listItem.style.border = '1px solid #eee';
            listItem.style.borderRadius = '4px';

            const formTitle = window.APP_CONFIG.forms[submission.formId]?.title || submission.formId;
            const submissionTime = new Date(submission.submittedAt).toLocaleString();

            // Attempt to find a primary display field (e.g., an ID or a name)
            let primaryDisplay = `ID: ${submission.payload.id || submission.payload.caseId || 'N/A'}`;
            if (submission.payload.activity) primaryDisplay += `, Activity: ${submission.payload.activity}`;
            else if (submission.payload.dqaSite) primaryDisplay += `, Site: ${submission.payload.dqaSite}`;


            listItem.innerHTML = `
                <strong>${formTitle}</strong> - <em>${primaryDisplay}</em><br>
                <small>Saved: ${submissionTime}</small>
            `;

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('button');
            editButton.style.marginRight = '5px';
            editButton.style.padding = '5px 10px';
            editButton.onclick = () => {
                // submission.id is the local unique ID for this pending item
                renderForm(submission.formId, submission.payload, submission.id);
            };

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('button', 'secondary');
            deleteButton.style.padding = '5px 10px';
            deleteButton.onclick = () => {
                if (confirm('Are you sure you want to delete this pending submission? This cannot be undone.')) {
                    pendingSubmissions.splice(index, 1);
                    localStorage.setItem('pendingSubmissions', JSON.stringify(pendingSubmissions));
                    updateSyncNotification();
                    displayPendingSubmissions(); // Refresh the list
                    showStatusMessage('Submission deleted locally.', 'info');
                }
            };

            const actionsDiv = document.createElement('div');
            actionsDiv.style.marginTop = '5px';
            actionsDiv.appendChild(editButton);
            actionsDiv.appendChild(deleteButton);
            listItem.appendChild(actionsDiv);

            list.appendChild(listItem);
        });
        formDisplayArea.appendChild(list);
    }


    // --- Auto-sync on interval (optional, use with caution for battery) ---
    // setInterval(attemptSyncSubmissions, 60000 * 5); // Sync every 5 minutes if online

    // Initial population if a form is specified in URL hash (e.g. forms.html#SupervisorVerifications)
    if (window.location.hash) {
        const formIdFromHash = window.location.hash.substring(1);
        const tabLink = formTabsContainer?.querySelector(`.tab-link[data-formid="${formIdFromHash}"]`);
        if (tabLink && window.APP_CONFIG.forms[formIdFromHash]) {
             setTimeout(()=> tabLink.click(), 0); // Ensure DOM is ready
        }
    } else if (formTabsContainer?.firstChild?.firstChild) {
        // Optionally, auto-click the first tab
        // setTimeout(()=> formTabsContainer.firstChild.firstChild.click(), 0);
    }

});
console.log("forms.js loaded");
