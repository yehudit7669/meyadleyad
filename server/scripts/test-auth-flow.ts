import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testAuthFlow() {
  try {
    console.log('🔐 Step 1: Login as Super Admin...\n');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'superadmin@meyadleyad.com',
      password: 'Admin123!@#',
    });

    console.log('✅ Login successful!');
    console.log('Full response:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.data?.accessToken;
    
    if (!token) {
      console.error('❌ No token in response!');
      return;
    }
    
    console.log('\nToken:', token.substring(0, 50) + '...\n');

    console.log('📋 Step 2: Fetch users list...\n');
    
    const usersResponse = await axios.get(`${API_URL}/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Users fetched successfully!');
    console.log('Total users:', usersResponse.data.data.users.length);
    console.log('Pagination:', usersResponse.data.data.pagination);

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

testAuthFlow();
