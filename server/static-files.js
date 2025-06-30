/**
 * Static files serving configuration
 */
const express = require('express');
const path = require('path');

/**
 * Set up static file serving for the Express app
 */
function setupStaticFiles(app) {
  const buildDir = path.resolve(process.cwd(), 'build');
  
  // Serve static files from build directory
  app.use(express.static(buildDir));
  console.log('Serving static files from build directory');
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.url.startsWith('/api')) {
      return next();
    }
    
    // Serve index.html for all other routes (SPA fallback)
    res.sendFile(path.join(buildDir, 'index.html'));
  });
}

module.exports = { setupStaticFiles };
