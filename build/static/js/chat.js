// Chat interface JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Debug button for testing API connection
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Test API Connection';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '10px';
    debugButton.style.right = '10px';
    debugButton.style.zIndex = '1000';
    debugButton.style.padding = '8px 16px';
    debugButton.style.backgroundColor = '#007bff';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '4px';
    debugButton.style.cursor = 'pointer';
    
    debugButton.addEventListener('click', async function() {
        console.log('Testing API connection...');
        const testDiv = document.createElement('div');
        testDiv.style.position = 'fixed';
        testDiv.style.top = '50%';
        testDiv.style.left = '50%';
        testDiv.style.transform = 'translate(-50%, -50%)';
        testDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        testDiv.style.color = 'white';
        testDiv.style.padding = '20px';
        testDiv.style.borderRadius = '5px';
        testDiv.style.zIndex = '2000';
        testDiv.style.maxWidth = '80%';
        testDiv.style.maxHeight = '80%';
        testDiv.style.overflow = 'auto';
        testDiv.innerHTML = 'API Test ResultsTesting connection...';
        document.body.appendChild(testDiv);
        
        try {
            // Test frontend config endpoint
            const configResponse = await fetch('/api/config/frontend-config');
            const configData = await configResponse.json();
            testDiv.innerHTML += 'Config API: âœ… Success';
            
            // Test Azure OpenAI endpoint with minimal message
            const testMessage = { messages: [{role: 'system', content: 'You are a helpful assistant.'}, {role: 'user', content: 'Hello'}] };
            testDiv.innerHTML += 'Sending test message to Azure OpenAI API...';
            
            const response = await fetch('/api/azure-openai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testMessage)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                testDiv.innerHTML += 'Azure OpenAI API: âŒ Error ';
            } else {
                const data = await response.json();
                testDiv.innerHTML += 'Azure OpenAI API: âœ… Success';
            }
        } catch (error) {
            testDiv.innerHTML += 'Test Error: ';
        }
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.marginTop = '10px';
        closeButton.style.padding = '5px 10px';
        closeButton.addEventListener('click', () => testDiv.remove());
        testDiv.appendChild(closeButton);
    });
    
    document.body.appendChild(debugButton);

    // Initialize variables
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const clearButton = document.getElementById('clearButton');
    const saveButton = document.getElementById('saveButton');
    let messageList = [];
    let isLoading = false;

    // System message for context
    const systemMessage = {
        role: 'system',
        content: 'You are an AI assistant for RTS AI Platform, helping users understand our enterprise AI solutions and services.'
    };

    // Initialize messages array with system message and greeting
    const messages = [
        systemMessage,
        { role: 'assistant', content: "Hello! I'm your RTS AI assistant. How can I help you today?" }
    ];

    // Function to set loading state
    function setIsLoading(loading) {
        isLoading = loading;
        if (loading) {
            showLoadingIndicator();
        } else {
            hideLoadingIndicator();
        }
    }

    // Function to show loading indicator
    function showLoadingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.add('active');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Function to hide loading indicator
    function hideLoadingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.remove('active');
        }
    }
    
    // Function to load configuration from the server
    let configPromise = null;
    async function getConfig() {
        if (!configPromise) {
            configPromise = fetch('/api/frontend-config')
                .then(response => response.json())
                .catch(error => {
                    console.error('Error loading configuration:', error);
                    return {};
                });
        }
        return configPromise;
    }
    
    // Function to send a message to Azure OpenAI API via backend proxy
    async function sendMessageToAzureOpenAI(messages, fileContext = null) {
        try {
            const config = await getConfig();
            
            // Determine which endpoint to use based on whether we have file context
            const endpoint = fileContext ? '/api/files/chat' : '/api/azure-openai/chat';
            
            // Prepare request payload
            const payload = fileContext ? 
                { message: messages[messages.length - 1].content, fileContext } :
                { messages };
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            
            if (data.message) {
                return data.message;
            } else if (data.response) {
                return { role: 'assistant', content: data.response };
            } else if (data.choices && data.choices.length > 0) {
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
    
    // Function to save conversation to the server
    async function saveConversation(messageList) {
        try {
            const conversationId = generateUUID();
            const timestamp = new Date().toISOString();
            const payload = {
                conversation_id: conversationId,
                messages: messageList,
                timestamp: timestamp
            };
            
            // Save only to fn-conversationsave endpoint
            await fetch('/api/fn-conversationsave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            console.log('Conversation saved successfully to /api/fn-conversationsave');
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    }
    
    // Generate a UUID for conversation tracking
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Function to add a message to the chat UI
    function addMessageToUI(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(role === 'user' ? 'user-message' : 'assistant-message');
        
        // Create message content container
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        // Process markdown in assistant messages
        if (role === 'assistant') {
            // Simple markdown processing
            let processedContent = content
                .replace(/\*\*(.*?)\*\*/g, '') // Bold
                .replace(/\*(.*?)\*/g, '') // Italic
                .replace(/`([\s\S]*?)`/g, '') // Code blocks
                .replace(/([^]+)/g, '') // Inline code
                .replace(/#{3}\s*(.*)/g, '') // H3
                .replace(/#{2}\s*(.*)/g, '') // H2
                .replace(/#{1}\s*(.*)/g, ''); // H1
            
            // Handle line breaks
            processedContent = processedContent.replace(/\n/g, '');
            
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
        if (!userMessage || isLoading) return;
        
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
            let response;
            
            // Check if we have file context
            if (window.currentFileContext) {
                // Send message with file context
                response = await sendMessageToAzureOpenAI(messages, window.currentFileContext);
            } else {
                // Send regular message without file context
                response = await sendMessageToAzureOpenAI(messages);
            }
            
            // Hide loading indicator
            hideLoadingIndicator();
            
            // Add assistant response to UI and messages array
            addMessageToUI('assistant', response.content);
            messages.push(response);
            
            // Save conversation to the server
            saveConversation(messages);
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
        // Clear all messages except the first assistant greeting
        while (chatMessages.children.length > 1) {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        // Reset messages array to initial state
        messages.length = 0;
        messages.push(systemMessage);
        messages.push({ role: 'assistant', content: "Hello! I'm your RTS AI assistant. How can I help you today?" });
        
        // Focus on input
        userInput.focus();
    });
    
    // Handle save button click
    saveButton.addEventListener('click', () => {
        if (messages.length > 2) { // Only save if there are actual user messages
            saveConversation(messages);
            
            // Show feedback to user
            const saveConfirmation = document.createElement('div');
            saveConfirmation.classList.add('save-confirmation');
            saveConfirmation.textContent = 'Conversation saved successfully!';
            document.body.appendChild(saveConfirmation);
            
            // Remove confirmation after 3 seconds
            setTimeout(() => {
                saveConfirmation.remove();
            }, 3000);
        }
    });
    
    // Initialize the chat interface
    addMessageToUI('assistant', "Hello! I'm your RTS AI assistant. How can I help you today?");
});