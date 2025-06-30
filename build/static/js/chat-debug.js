/**
 * Enhanced Chat Interface for Azure OpenAI
 * With file upload support and improved UI
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const loadingIndicator = document.getElementById('loading-indicator');
    const clearButton = document.getElementById('clear-button');
    const uploadButton = document.getElementById('upload-button');
    const fileInput = document.getElementById('file-input');
    const saveButton = document.getElementById('save-button');
    const testButton = document.getElementById('test-api-button');
    
    // State variables
    let messages = [];
    let isLoading = false;
    let configPromise = null;
    
    // Initialize with system message
    messages.push({
        role: 'system',
        content: 'You are a helpful assistant powered by Azure OpenAI.'
    });
    
    // Function to test API connections
    async function testAPIConnections() {
        const testDiv = document.createElement('div');
        testDiv.style.position = 'fixed';
        testDiv.style.top = '20px';
        testDiv.style.right = '20px';
        testDiv.style.padding = '20px';
        testDiv.style.backgroundColor = '#f0f0f0';
        testDiv.style.border = '1px solid #ccc';
        testDiv.style.borderRadius = '5px';
        testDiv.style.zIndex = '1000';
        testDiv.style.maxHeight = '80%';
        testDiv.style.overflow = 'auto';
        testDiv.innerHTML = '<h3>API Test Results</h3><p>Testing connection...</p>';
        document.body.appendChild(testDiv);
        
        try {
            console.log('Testing frontend config endpoint');
            // Test frontend config endpoint
            const configResponse = await fetch('/api/frontend-config');
            const configData = await configResponse.json();
            console.log('Config response:', configData);
            testDiv.innerHTML += '<p>Config API: ✅ Success</p>';
            
            // Test Azure OpenAI endpoint with minimal message
            const testMessage = { messages: [{role: 'system', content: 'You are a helpful assistant.'}, {role: 'user', content: 'Hello'}] };
            testDiv.innerHTML += '<p>Sending test message to Azure OpenAI API...</p>';
            console.log('Sending test message:', testMessage);
            
            const response = await fetch('/api/azure-openai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testMessage)
            });
            
            console.log('Response status:', response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Azure OpenAI API error:', errorText);
                testDiv.innerHTML += '<p>Azure OpenAI API: ❌ Error ' + response.status + '</p>';
                testDiv.innerHTML += '<p>Error details: ' + errorText + '</p>';
            } else {
                const data = await response.json();
                console.log('API response:', data);
                testDiv.innerHTML += '<p>Azure OpenAI API: ✅ Success</p>';
                testDiv.innerHTML += '<p>Response: ' + JSON.stringify(data) + '</p>';
            }
        } catch (error) {
            console.error('Test error:', error);
            testDiv.innerHTML += '<p>Test Error: ' + error.message + '</p>';
        }
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.onclick = () => document.body.removeChild(testDiv);
        testDiv.appendChild(closeButton);
    }
    
    // Function to get frontend configuration
    async function getConfig() {
        if (!configPromise) {
            console.log('Fetching frontend config');
            configPromise = fetch('/api/frontend-config')
                .then(response => {
                    console.log('Config response status:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Config data received:', data);
                    return data;
                })
                .catch(error => {
                    console.error('Error loading configuration:', error);
                    return {};
                });
        }
        return configPromise;
    }
    
    // Function to generate UUID for conversation IDs
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Function to send a message to Azure OpenAI API via backend proxy
    async function sendMessageToAzureOpenAI(messages, fileContext = null) {
        try {
            console.log('Getting config for API call');
            const config = await getConfig();
            console.log('Config received:', config);
            
            // Determine which endpoint to use based on whether we have file context
            const endpoint = fileContext ? '/api/files/chat' : '/api/azure-openai/chat';
            console.log('Using endpoint:', endpoint);
            
            // Prepare request payload
            const payload = fileContext ? 
                { message: messages[messages.length - 1].content, fileContext } :
                { messages };
            
            console.log('Sending payload:', payload);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            console.log('Response status:', response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('API response data:', data);
            
            if (data.message) {
                console.log('Using message format from response');
                return data.message;
            } else if (data.response) {
                console.log('Using response format from response');
                return { role: 'assistant', content: data.response };
            } else if (data.choices && data.choices.length > 0) {
                console.log('Using choices format from response');
                return data.choices[0].message;
            } else {
                console.error('No valid response format in API response:', data);
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('Error sending message to API:', error);
            return {
                role: 'assistant',
                content: "I'm sorry, there was an error communicating with the Azure OpenAI service. Please check the browser console for more details."
            };
        }
    }
    
    // Function to save conversation to the server and download as file
    async function saveConversation(messageList) {
        try {
            console.log('Saving conversation');
            const conversationId = generateUUID();
            const timestamp = new Date().toISOString();
            const payload = {
                conversation_id: conversationId,
                messages: messageList,
                timestamp: timestamp
            };
            
            console.log('Save payload:', payload);
            
            // Create a downloadable file
            const fileName = `conversation-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
            const fileContent = JSON.stringify(payload, null, 2);
            const blob = new Blob([fileContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link and trigger download
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Also save to server if available
            try {
                // Save to fn-conversationsave endpoint
                const response = await fetch('/api/fn-conversationsave', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                console.log('Save response status:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Conversation also saved to server:', data);
                }
            } catch (serverError) {
                console.log('Could not save to server, but file download should work:', serverError);
                // We don't throw here since the download already worked
            }
            
            return { success: true, fileName };
        } catch (error) {
            console.error('Error saving conversation:', error);
            throw error;
        }
    }
    
    // Function to show loading indicator
    function showLoadingIndicator() {
        loadingIndicator.style.display = 'block';
    }
    
    // Function to hide loading indicator
    function hideLoadingIndicator() {
        loadingIndicator.style.display = 'none';
    }
    
    // Function to add a message to the UI
    function addMessageToUI(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.textContent = role === 'user' ? '👤' : '🤖';
        messageDiv.appendChild(avatarDiv);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        
        // Handle markdown-like formatting
        if (role === 'assistant') {
            let processedContent = content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                .replace(/`([\s\S]*?)`/g, '<code>$1</code>') // Code blocks
                .replace(/([^]+)/g, '<code>$1</code>') // Inline code
                .replace(/#{3}\s*(.*)/g, '<h3>$1</h3>') // H3
                .replace(/#{2}\s*(.*)/g, '<h2>$1</h2>') // H2
                .replace(/#{1}\s*(.*)/g, '<h1>$1</h1>'); // H1
            
            // Handle line breaks
            processedContent = processedContent.replace(/\n/g, '<br>');
            
            contentDiv.innerHTML = processedContent;
        } else {
            contentDiv.textContent = content;
        }
        
        // Append content div to message div
        messageDiv.appendChild(contentDiv);
        
        // Append to chat messages
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userMessage = userInput.value.trim();
        console.log('Submit button clicked with message:', userMessage);
        if (!userMessage || isLoading) {
            console.log('Empty message or already loading, ignoring submit');
            return;
        }
        
        // Clear input
        userInput.value = '';
        
        // Add user message to UI and messages array
        addMessageToUI('user', userMessage);
        messages.push({ role: 'user', content: userMessage });
        
        // Show loading indicator and disable input
        isLoading = true;
        userInput.disabled = true;
        sendButton.disabled = true;
        showLoadingIndicator();
        
        try {
            console.log('Processing user message');
            let response;
            
            // Check if we have file context
            if (window.currentFileContext) {
                console.log('Using file context:', window.currentFileContext);
                // Send message with file context
                response = await sendMessageToAzureOpenAI(messages, window.currentFileContext);
            } else {
                console.log('No file context, sending regular message');
                // Send regular message without file context
                response = await sendMessageToAzureOpenAI(messages);
            }
            
            console.log('Response received:', response);
            // Hide loading indicator
            hideLoadingIndicator();
            
            // Add assistant response to UI and messages array
            addMessageToUI('assistant', response.content);
            messages.push(response);
        } catch (error) {
            console.error('Error in chat process:', error);
            hideLoadingIndicator();
            addMessageToUI('assistant', "I'm sorry, there was an error processing your request. Please try again.");
        } finally {
            // Re-enable input
            isLoading = false;
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    });
    
    // Handle clear button click
    clearButton.addEventListener('click', () => {
        console.log('Clear button clicked');
        // Clear messages except system message
        messages = messages.slice(0, 1);
        // Clear chat UI
        chatMessages.innerHTML = '';
        // Clear file context if any
        if (window.currentFileContext) {
            window.currentFileContext = null;
            document.getElementById('file-context-indicator').style.display = 'none';
        }
    });
    
    // Handle file upload
    uploadButton.addEventListener('click', () => {
        console.log('Upload button clicked');
        fileInput.click();
    });
    
    fileInput.addEventListener('change', async (e) => {
        if (!e.target.files.length) return;
        
        const file = e.target.files[0];
        console.log('File selected:', file.name, file.type, file.size);
        
        // Show loading indicator
        showLoadingIndicator();
        
        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            
            console.log('Uploading file to /api/upload');
            // First upload the file to get its metadata
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
                // No Content-Type header - browser will set it with boundary for FormData
            });
            
            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.text();
                throw new Error(`Upload error: ${uploadResponse.status} - ${errorData}`);
            }
            
            const uploadResult = await uploadResponse.json();
            console.log('File uploaded successfully:', uploadResult);
            
            // Now process the uploaded file
            console.log('Processing file with /api/files/process');
            const processResponse = await fetch('/api/files/process', {
                method: 'POST',
                body: JSON.stringify({ file: uploadResult.file }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!processResponse.ok) {
                const errorData = await processResponse.text();
                throw new Error(`Processing error: ${processResponse.status} - ${errorData}`);
            }
            
            const processResult = await processResponse.json();
            console.log('File processed successfully:', processResult);
            
            // Store file context for chat
            window.currentFileContext = {
                fileId: processResult.result.fileId || uploadResult.file.filename,
                filename: file.name,
                contentType: file.type,
                text: processResult.result.text || 'File content processed successfully'
            };
            
            // Show file context indicator
            const fileIndicator = document.getElementById('file-context-indicator') || document.createElement('div');
            fileIndicator.id = 'file-context-indicator';
            fileIndicator.style.padding = '5px 10px';
            fileIndicator.style.backgroundColor = '#e0f7fa';
            fileIndicator.style.borderRadius = '5px';
            fileIndicator.style.margin = '10px 0';
            fileIndicator.style.display = 'flex';
            fileIndicator.style.alignItems = 'center';
            fileIndicator.style.justifyContent = 'space-between';
            
            fileIndicator.innerHTML = `
                <span>📄 Using context from: ${file.name}</span>
                <button id="remove-file-context" style="background: none; border: none; cursor: pointer;">❌</button>
            `;
            
            if (!document.getElementById('file-context-indicator')) {
                chatForm.insertBefore(fileIndicator, userInput);
            }
            
            // Add event listener to remove file context
            document.getElementById('remove-file-context').addEventListener('click', () => {
                window.currentFileContext = null;
                fileIndicator.style.display = 'none';
            });
            
            // Add system message about the file
            addMessageToUI('assistant', `I've processed the file "${file.name}". You can now ask me questions about its contents.`);
            messages.push({ 
                role: 'assistant', 
                content: `I've processed the file "${file.name}". You can now ask me questions about its contents.` 
            });
            
        } catch (error) {
            console.error('Error processing file:', error);
            addMessageToUI('assistant', `Error processing file: ${error.message}`);
        } finally {
            // Hide loading indicator
            hideLoadingIndicator();
            // Reset file input
            fileInput.value = '';
        }
    });
    
    // Handle save button click
    saveButton.addEventListener('click', async () => {
        console.log('Save button clicked');
        if (messages.length <= 1) {
            console.log('No messages to save');
            alert('No conversation to save. Please chat with the AI first.');
            return; // Only system message, nothing to save
        }
        
        try {
            const result = await saveConversation(messages);
            
            // Show a toast notification instead of an alert
            const toast = document.createElement('div');
            toast.className = 'save-confirmation';
            toast.textContent = `Conversation downloaded as ${result.fileName}`;
            document.body.appendChild(toast);
            
            // Remove the toast after animation completes
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 3000);
        } catch (error) {
            console.error('Error saving conversation:', error);
            alert('Error saving conversation: ' + error.message);
        }
    });
    
    // Handle test API button
    testButton.addEventListener('click', () => {
        console.log('Test API button clicked');
        testAPIConnections();
    });
    
    // Initial setup
    hideLoadingIndicator();
    userInput.focus();
    
    // Load configuration
    getConfig().then(() => {
        console.log('Initial configuration loaded');
    });
    
    // Convert buttons to icons
    function convertButtonsToIcons() {
        // Update clear button
        clearButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        clearButton.title = 'Clear Chat';
        clearButton.className = 'icon-button';
        
        // Update upload button
        uploadButton.innerHTML = '<i class="fas fa-file-upload"></i>';
        uploadButton.title = 'Upload File';
        uploadButton.className = 'icon-button';
        
        // Update save button
        saveButton.innerHTML = '<i class="fas fa-save"></i>';
        saveButton.title = 'Save Conversation';
        saveButton.className = 'icon-button';
        
        // Add Font Awesome if not already present
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
            document.head.appendChild(link);
        }
        
        // Add some styling
        const style = document.createElement('style');
        style.textContent = `
            .icon-button {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                margin: 0 5px;
                padding: 8px;
                border-radius: 50%;
                transition: background-color 0.3s;
            }
            .icon-button:hover {
                background-color: #f0f0f0;
            }
            #send-button {
                background-color: #0078d4;
                color: white;
                border: none;
                border-radius: 20px;
                padding: 8px 16px;
                cursor: pointer;
            }
            #send-button:hover {
                background-color: #0069c0;
            }
            #send-button:disabled {
                background-color: #cccccc;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Call the function to convert buttons to icons
    convertButtonsToIcons();
});
