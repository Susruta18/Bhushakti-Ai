// @ts-nocheck
import { config } from 'dotenv';
config();

const BASE_URL = 'http://localhost:5000/api';

const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return data.data?.token;
};

const testRoute = async (token, path, expectedStatus) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const res = await fetch(`${BASE_URL}/test/${path}`, { headers });
  console.log(`[${res.status === expectedStatus ? 'PASS' : 'FAIL'}] GET /api/test/${path} expected ${expectedStatus}, got ${res.status}`);
};

const runTests = async () => {
  console.log('--- Logging in users ---');
  const auth_token = await login(process.env.SEED_AUTHORITY_EMAIL, process.env.SEED_AUTHORITY_PASSWORD);
  const off_token = await login(process.env.SEED_OFFICER_EMAIL, process.env.SEED_OFFICER_PASSWORD);
  const cit_token = await login(process.env.SEED_CITIZEN_EMAIL, process.env.SEED_CITIZEN_PASSWORD);
  
  if (!auth_token || !off_token || !cit_token) {
    console.error('Failed to get all tokens');
    return;
  }

  console.log('--- 1. Authenticated Route ---');
  await testRoute(auth_token, 'authenticated', 200);
  await testRoute(off_token, 'authenticated', 200);
  await testRoute(cit_token, 'authenticated', 200);
  
  console.log('--- 2. Authority Route ---');
  await testRoute(auth_token, 'authority', 200);
  await testRoute(off_token, 'authority', 403);
  await testRoute(cit_token, 'authority', 403);
  
  console.log('--- 3. Field Officer Route ---');
  await testRoute(auth_token, 'field-officer', 200);
  await testRoute(off_token, 'field-officer', 200);
  await testRoute(cit_token, 'field-officer', 403);
  
  console.log('--- 4. Citizen Route ---');
  await testRoute(auth_token, 'citizen', 403);
  await testRoute(off_token, 'citizen', 403);
  await testRoute(cit_token, 'citizen', 200);
  
  console.log('--- 5. Unauthenticated/Invalid ---');
  await testRoute(null, 'authenticated', 401);
  await testRoute('invalid.token.here', 'authenticated', 401);
};

runTests();
