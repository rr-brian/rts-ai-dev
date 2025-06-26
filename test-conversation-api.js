const fetch = require('node-fetch');

// Test conversation payload
const payload = {
  conversationId: null, // null for new conversation
  userId: 'test-user',
  userEmail: 'test@example.com',
  chatType: 'general',
  messages: [
    { role: 'user', content: 'Hello, this is a test message' },
    { role: 'assistant', content: 'Hello! This is a test response.' }
  ],
  totalTokens: 25,
  metadata: {
    testRun: true,
    timestamp: new Date().toISOString()
  }
};

async function testConversationAPI() {
  try {
    console.log('Testing /api/conversations/update endpoint...');
    
    const response = await fetch('http://localhost:3000/api/conversations/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const contentType = response.headers.get('content-type');
    const status = response.status;
    
    console.log(`Status: ${status}, Content-Type: ${contentType || 'unknown'}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const text = await response.text();
      console.log('Response text:', text.substring(0, 1000));
      return text;
    }
  } catch (error) {
    console.error('Error testing conversation API:', error);
  }
}

// Run the test
testConversationAPI()
  .then(result => {
    console.log('Test completed');
    if (result && result.conversationId) {
      console.log('Success! Conversation saved with ID:', result.conversationId);
    }
  })
  .catch(error => {
    console.error('Test failed:', error);
  });
