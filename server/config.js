/**
 * Server configuration module
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

/**
 * Load environment variables and configuration
 */
async function loadConfig(app) {
  console.log('Loading environment variables from config module...');
  
  // Look for .env file in the project root
  const envPath = path.resolve(process.cwd(), '.env');
  const altEnvPath = path.resolve(process.cwd(), '.env');
  
  console.log(`Looking for .env file at: ${envPath}`);
  console.log(`Looking for alternative .env file at: ${altEnvPath}`);
  
  // Load environment variables from .env file if it exists
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Environment variables loaded from .env file');
  } else if (fs.existsSync(altEnvPath)) {
    dotenv.config({ path: altEnvPath });
    console.log('Environment variables loaded from alternative .env file');
  } else {
    console.log('No .env file found, using environment variables as is');
  }
  
  // Log loaded environment variables (without exposing sensitive values)
  console.log('Environment variables loaded:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('PORT:', process.env.PORT || 'not set (using default 3000)');
  console.log('WEBSITE_SITE_NAME:', process.env.WEBSITE_SITE_NAME || 'not set');
  
  // Log sensitive variables as "set" or "not set" without exposing values
  console.log('REACT_APP_CONVERSATION_FUNCTION_URL:', process.env.REACT_APP_CONVERSATION_FUNCTION_URL ? 'set' : 'not set');
  console.log('REACT_APP_FUNCTION_KEY:', process.env.REACT_APP_FUNCTION_KEY ? 'set (redacted)' : 'not set');
  
  // Check for critical files
  const currentDir = process.cwd();
  console.log('Current directory:', currentDir);
  
  console.log('Checking for critical files:');
  const criticalFiles = [
    path.join(currentDir, 'package.json'),
    path.join(currentDir, '.env'),
    path.join(currentDir, 'build', 'index.html')
  ];
  
  criticalFiles.forEach(file => {
    console.log(`${file}: ${fs.existsSync(file) ? 'exists' : 'missing'}`);
  });
}

module.exports = { loadConfig };
