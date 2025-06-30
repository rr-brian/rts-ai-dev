/**
 * Main server entry point - modular version
 */
const express = require('express');
const path = require('path');
const http = require('http');

// Import modules
const config = require('./config');
const middleware = require('./middleware');
const routes = require('./routes');
const errorHandlers = require('./error-handlers');
const staticFiles = require('./static-files');
const fileHandlers = require('./file-handlers');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize server
async function initializeServer() {
  try {
    // Load configuration
    await config.loadConfig(app);
    
    // Set up middleware
    middleware.setupMiddleware(app);
    
    // Register routes
    routes.registerRoutes(app);
    
    // Set up file upload routes
    fileHandlers.setupFileRoutes(app);
    
    // Serve static files
    staticFiles.setupStaticFiles(app);
    
    // Register error handlers
    errorHandlers.setupErrorHandlers(app);
    
    // Start server
    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Static files served from: ${path.resolve(process.cwd(), 'build')}`);
      console.log('Server started successfully');
    });
    
    return server;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  initializeServer();
}

module.exports = { app, initializeServer };
