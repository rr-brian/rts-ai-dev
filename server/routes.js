/**
 * Server routes registration
 */
const express = require('express');

/**
 * Register all API routes for the Express app
 */
function registerRoutes(app) {
  // Import route modules with fallbacks
  const apiRoutes = safeRequire('../routes/api', express.Router());
  const conversationRoutes = safeRequire('../routes/conversations', express.Router());
  const azureOpenAIRoutes = safeRequire('../routes/azure-openai', express.Router());
  const configRoutes = safeRequire('../routes/config', express.Router());
  const fileUploadRoutes = safeRequire('../routes/file-upload', express.Router());
  const frontendApiRoutes = safeRequire('../routes/frontend-api', express.Router());
  
  // Register API routes
  app.use('/api', apiRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/azure-openai', azureOpenAIRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/files', fileUploadRoutes);
  
  // Register direct frontend API routes
  app.use('/api', frontendApiRoutes);
  
  // Log registered routes
  console.log('Registered API routes:');
  console.log('- /api');
  console.log('- /api/conversations');
  console.log('- /api/azure-openai');
  console.log('- /api/config');
  console.log('- /api/files');
  console.log('- /api/frontend-config (direct)');
  console.log('- /api/fn-conversationsave (direct)');
}

/**
 * Helper function to safely require modules with fallbacks
 */
function safeRequire(modulePath, fallback) {
  try {
    return require(modulePath);
  } catch (error) {
    console.error(`Failed to load module ${modulePath}:`, error.message);
    return fallback || null;
  }
}

module.exports = { registerRoutes };
