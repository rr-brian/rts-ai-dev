/**
 * Frontend API routes for direct access from the client
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Direct frontend config endpoint
router.get('/frontend-config', (req, res) => {
  console.log('Direct frontend config endpoint called');
  
  // Only provide the minimum necessary configuration
  // No API keys are exposed here
  const frontendConfig = {
    azureOpenAI: {
      endpoint: process.env.REACT_APP_AZURE_OPENAI_ENDPOINT || '',
      deploymentName: process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME || '',
      apiVersion: process.env.REACT_APP_AZURE_OPENAI_API_VERSION || ''
    },
    apiUrl: process.env.REACT_APP_API_URL || '',
    features: {
      fileUpload: true,
      conversationSaving: true
    }
  };
  
  res.json(frontendConfig);
});

// Direct conversation save endpoint
router.post('/fn-conversationsave', (req, res) => {
  console.log('Direct conversation save endpoint called');
  
  try {
    const { conversation_id, messages, timestamp } = req.body;
    
    if (!conversation_id || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid conversation data' });
    }
    
    // In a real implementation, this would save to a database or call an Azure Function
    // For now, we'll just acknowledge receipt
    console.log(`Saving conversation ${conversation_id} with ${messages.length} messages`);
    
    res.status(200).json({ 
      success: true, 
      conversation_id: conversation_id,
      message: 'Conversation saved successfully'
    });
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

module.exports = router;
