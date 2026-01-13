// Test script for authentication endpoints
// Node.js 18+ has built-in fetch
const API_URL = 'http://localhost:5000/api';

async function testRegister(email, password) {
  console.log(`\n🧪 Testing registration for: ${email}`);
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration SUCCESS');
      console.log('   User ID:', data.data.user.id);
      console.log('   Email:', data.data.user.email);
      console.log('   Has token:', !!data.data.accessToken);
      return data.data;
    } else {
      console.log('❌ Registration FAILED');
      console.log('   Status:', response.status);
      console.log('   Message:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

async function testLogin(email, password) {
  console.log(`\n🔑 Testing login for: ${email}`);
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login SUCCESS');
      console.log('   User ID:', data.data.user.id);
      console.log('   Email:', data.data.user.email);
      console.log('   Name:', data.data.user.name || 'Not set');
      console.log('   Has token:', !!data.data.accessToken);
      return data.data;
    } else {
      console.log('❌ Login FAILED');
      console.log('   Status:', response.status);
      console.log('   Message:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🎯 Starting authentication tests...\n');
  
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Test1234';
  
  // Test 1: Register new user
  const registerResult = await testRegister(testEmail, testPassword);
  
  if (!registerResult) {
    console.log('\n❌ Registration failed, cannot proceed with login test');
    return;
  }
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 2: Login with same credentials
  const loginResult = await testLogin(testEmail, testPassword);
  
  if (!loginResult) {
    console.log('\n❌ Login failed');
    return;
  }
  
  console.log('\n✅ All tests passed!');
}

runTests();
