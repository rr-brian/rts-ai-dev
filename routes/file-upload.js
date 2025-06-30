/**
 * File upload and processing routes
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { processFile } = require('../server/file-processors');

// File upload processing endpoint
router.post('/process', async (req, res) => {
  try {
    if (!req.body.file) {
      return res.status(400).json({ error: 'No file information provided' });
    }
    
    const fileInfo = req.body.file;
    const result = await processFile(fileInfo);
    
    res.status(200).json({
      message: 'File processed successfully',
      result
    });
  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({ error: 'File processing failed', message: error.message });
  }
});

// File upload to Azure OpenAI chat endpoint
router.post('/chat', async (req, res) => {
  try {
    if (!req.body.message || !req.body.fileContext) {
      return res.status(400).json({ error: 'Missing message or file context' });
    }
    
    const { message, fileContext } = req.body;
    const fileContent = fileContext.fileContent;
    const metadata = fileContext.metadata;
    
    // Create a prompt that includes file content and user's question
    const systemPrompt = `You are an AI assistant that helps users understand documents. 
The following text was extracted from a ${metadata.fileType} file named "${metadata.originalName}".
Please analyze this content and respond to the user's question.`;
    
    const prompt = `
File Content:
${fileContent}

User Question: ${message}
`;
    
    // Call Azure OpenAI API
    const azureOpenAIEndpoint = process.env.REACT_APP_AZURE_OPENAI_API_ENDPOINT;
    const azureOpenAIKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;
    const apiVersion = process.env.REACT_APP_AZURE_OPENAI_API_VERSION;
    
    if (!azureOpenAIEndpoint || !azureOpenAIKey || !deploymentName || !apiVersion) {
      return res.status(500).json({ error: 'Azure OpenAI configuration missing' });
    }
    
    const apiUrl = `${azureOpenAIEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureOpenAIKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Azure OpenAI API error: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    res.status(200).json({
      message: 'File analyzed successfully',
      response: data.choices[0].message.content,
      metadata: fileContext.metadata
    });
  } catch (error) {
    console.error('File chat error:', error);
    res.status(500).json({ error: 'File analysis failed', message: error.message });
  }
});

module.exports = router;
