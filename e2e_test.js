// End-to-End Verification Script
// Run via: node e2e_test.js <API_URL> <FRONTEND_URL>
// Example: node e2e_test.js http://localhost:5000/api http://localhost:5173

const API_URL = process.argv[2] || 'http://localhost:5000/api';
const identifier = 'e2e_test_' + Date.now() + '@example.com';
const password = 'Password123!';
let token = '';

async function fetchApi(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Cookie': `token=${token}` } : {}), // For simple fetch test we send it in cookie header manually or we can expect auth header.
      ...options.headers,
    },
  });
  
  // Note: Since this is fetch in Node without a cookie jar, we simulate token by extracting it from Set-Cookie and passing it back, OR we can just use Authorization header if supported.
  // Our backend uses cookies.
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    token = setCookie.split('token=')[1].split(';')[0];
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function run() {
  console.log(`Starting E2E tests against ${API_URL}...`);

  try {
    console.log('\n1. Testing Signup (Email + Password)...');
    await fetchApi('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: identifier, password, confirmPassword: password })
    });
    console.log('Signup successful. Logged in.');

    console.log('\n2. Testing Prompt Builder...');
    const prompt = await fetchApi('/prompts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'E2E Test Prompt',
        taskType: 'Custom',
        detailsInput: 'This is a test prompt with enough characters.',
        generatedBody: 'Generated body here.'
      })
    });
    console.log('Prompt created with ID:', prompt._id);

    console.log('\n3. Testing Library Search & Trash...');
    const library = await fetchApi('/prompts');
    if (!library.some(p => p._id === prompt._id)) throw new Error('Prompt not found in library');
    
    await fetchApi(`/prompts/${prompt._id}`, { method: 'DELETE' });
    console.log('Prompt soft-deleted.');
    
    const trash = await fetchApi('/prompts/trash');
    if (!trash.some(p => p._id === prompt._id)) throw new Error('Prompt not found in trash');
    
    await fetchApi(`/prompts/${prompt._id}/restore`, { method: 'PUT' });
    console.log('Prompt restored from trash.');

    console.log('\n4. Testing Settings & Export...');
    const exportData = await fetchApi('/settings/export');
    if (!exportData.prompts) throw new Error('Export failed');
    console.log('Export JSON is valid. Total prompts:', exportData.prompts.length);

    console.log('\n5. Testing Security (Change Password & Logout)...');
    const newPassword = 'NewPassword123!';
    await fetchApi('/settings/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: password, newPassword })
    });
    console.log('Password changed successfully.');

    await fetchApi('/auth/logout', { method: 'POST' });
    token = ''; // Clear token
    console.log('Logged out.');

    console.log('\n6. Testing Login & Account Deletion...');
    await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: identifier, password: newPassword })
    });
    console.log('Logged back in with new password.');

    await fetchApi('/settings/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmWord: 'DELETE' })
    });
    console.log('Account deleted successfully.');

    console.log('\n✅ ALL E2E TESTS PASSED!');

  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    process.exit(1);
  }
}

run();
