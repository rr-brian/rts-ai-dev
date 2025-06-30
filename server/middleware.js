/**
 * Server middleware setup
 */
const cors = require('cors');
const express = require('express');

/**
 * Set up all middleware for the Express app
 */
function setupMiddleware(app) {
  // Import middleware setup if available
  try {
    const middlewareSetup = require('../middleware/setup');
    middlewareSetup(app);
    console.log('Full middleware setup loaded successfully');
    return;
  } catch (error) {
    console.log('Custom middleware setup not found, using default middleware');
  }

  // Default middleware setup if custom setup is not available
  
  // CORS middleware
  app.use(cors());
  console.log('CORS module loaded successfully');
  
  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
  
  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Cache control middleware to prevent browser caching
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '-1');
    next();
  });
}

module.exports = { setupMiddleware };
