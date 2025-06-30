/**
 * File upload functionality for Azure OpenAI Chatbot
 */

// File upload modal handling
const uploadModal = document.getElementById('uploadModal');
const uploadButton = document.getElementById('uploadButton');
const closeButton = document.querySelector('.close');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const fileUploadForm = document.getElementById('fileUploadForm');
const uploadStatus = document.getElementById('uploadStatus');
let currentFile = null;

// Open the upload modal when the upload button is clicked
uploadButton.addEventListener('click', () => {
    uploadModal.style.display = 'block';
    resetUploadForm();
});

// Close the modal when the close button is clicked
closeButton.addEventListener('click', () => {
    uploadModal.style.display = 'none';
});

// Close the modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === uploadModal) {
        uploadModal.style.display = 'none';
    }
});

// Update the file name display when a file is selected
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        fileName.textContent = file.name;
        currentFile = file;
    } else {
        fileName.textContent = 'No file chosen';
        currentFile = null;
    }
});

// Handle file upload form submission
fileUploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    if (!currentFile) {
        showUploadStatus('error', 'Please select a file to upload.');
        return;
    }
    
    // Show loading status
    showUploadStatus('loading', 'Uploading file...');
    
    // Create FormData and append the file
    const formData = new FormData();
    formData.append('file', currentFile);
    
    try {
        // Upload the file
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Show success message
        showUploadStatus('success', 'File uploaded successfully! Processing file...');
        
        // Process the uploaded file
        await processUploadedFile(data.file);
        
    } catch (error) {
        console.error('File upload error:', error);
        showUploadStatus('error', `Upload failed: ${error.message}`);
    }
});

/**
 * Show upload status message
 * @param {string} type - Status type: 'loading', 'success', or 'error'
 * @param {string} message - Status message to display
 */
function showUploadStatus(type, message) {
    uploadStatus.textContent = message;
    uploadStatus.className = 'upload-status ' + type;
    uploadStatus.style.display = 'block';
}

/**
 * Reset the upload form
 */
function resetUploadForm() {
    fileInput.value = '';
    fileName.textContent = 'No file chosen';
    uploadStatus.style.display = 'none';
    currentFile = null;
}

/**
 * Process the uploaded file
 * @param {Object} fileInfo - File information from the server
 */
async function processUploadedFile(fileInfo) {
    try {
        // Process the file on the server
        const processResponse = await fetch('/api/files/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file: fileInfo })
        });
        
        if (!processResponse.ok) {
            throw new Error(`File processing failed with status: ${processResponse.status}`);
        }
        
        const processData = await processResponse.json();
        
        // Show success message
        showUploadStatus('success', 'File processed successfully! You can now ask questions about the document.');
        
        // Close the modal after a delay
        setTimeout(() => {
            uploadModal.style.display = 'none';
            
            // Add file info to the chat
            addFileMessageToChat(fileInfo, processData.result);
        }, 1500);
        
    } catch (error) {
        console.error('File processing error:', error);
        showUploadStatus('error', `File processing failed: ${error.message}`);
    }
}

/**
 * Add file information message to the chat
 * @param {Object} fileInfo - File information
 * @param {Object} processResult - File processing result
 */
function addFileMessageToChat(fileInfo, processResult) {
    const chatMessages = document.getElementById('chat-messages');
    
    // Create file message element
    const fileMessage = document.createElement('div');
    fileMessage.className = 'file-message';
    
    // Get file icon based on file type
    const fileIcon = getFileIcon(fileInfo.mimetype);
    
    // Create file message content
    fileMessage.innerHTML = `
        <div class="file-info">
            <div class="file-icon">${fileIcon}</div>
            <div>
                <div class="file-name">${fileInfo.originalName}</div>
                <div class="file-meta">${formatFileSize(fileInfo.size)} · ${getFileType(fileInfo.mimetype)}</div>
            </div>
        </div>
        <div>I've uploaded a document. You can now ask me questions about "${fileInfo.originalName}".</div>
    `;
    
    // Add to chat
    chatMessages.appendChild(fileMessage);
    
    // Store file data in the chat context
    window.currentFileContext = {
        fileInfo: fileInfo,
        fileContent: processResult.text,
        metadata: processResult.metadata
    };
    
    // Scroll to the bottom of the chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Get file icon based on MIME type
 * @param {string} mimetype - File MIME type
 * @returns {string} - Icon HTML
 */
function getFileIcon(mimetype) {
    if (mimetype.includes('pdf')) {
        return '📄';
    } else if (mimetype.includes('word') || mimetype.includes('document')) {
        return '📝';
    } else if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) {
        return '📊';
    } else if (mimetype.includes('csv')) {
        return '📋';
    } else {
        return '📁';
    }
}

/**
 * Get friendly file type name
 * @param {string} mimetype - File MIME type
 * @returns {string} - Friendly file type name
 */
function getFileType(mimetype) {
    if (mimetype.includes('pdf')) {
        return 'PDF Document';
    } else if (mimetype.includes('word') || mimetype.includes('document')) {
        return 'Word Document';
    } else if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) {
        return 'Excel Spreadsheet';
    } else if (mimetype.includes('csv')) {
        return 'CSV File';
    } else if (mimetype.includes('text/plain')) {
        return 'Text File';
    } else {
        return 'Document';
    }
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
    } else {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}
