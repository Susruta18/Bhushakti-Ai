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

const makeRequest = async (token, method, path, body = null) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  if (body) headers['Content-Type'] = 'application/json';
  
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  return { status: res.status, data };
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

  const sampleZone = {
    name: 'Test Zone Alpha',
    code: 'TZ-ALPHA',
    description: 'A test zone for API validation',
    riskLevel: 'HIGH',
    currentProbability: 0.85,
    location: { type: 'Point', coordinates: [75.123, 12.456] },
    populationExposure: 5000,
    criticalAssetCount: 2,
    isActive: true
  };

  console.log('\n--- 1. POST /api/risk-zones ---');
  let res = await makeRequest(cit_token, 'POST', '/risk-zones', sampleZone);
  console.log(`CITIZEN create: expected 403, got ${res.status}`);
  
  res = await makeRequest(off_token, 'POST', '/risk-zones', sampleZone);
  console.log(`FIELD_OFFICER create: expected 403, got ${res.status}`);
  
  res = await makeRequest(auth_token, 'POST', '/risk-zones', sampleZone);
  console.log(`AUTHORITY create: expected 201, got ${res.status}`);
  
  const createdZoneId = res.data?.data?._id;
  if (!createdZoneId) {
    console.error('Failed to create zone, skipping remaining tests');
    return;
  }

  console.log('\n--- 2. GET /api/risk-zones ---');
  res = await makeRequest(cit_token, 'GET', '/risk-zones');
  console.log(`CITIZEN read all: expected 200, got ${res.status}`);
  
  console.log('\n--- 3. GET /api/risk-zones/:id ---');
  res = await makeRequest(cit_token, 'GET', `/risk-zones/${createdZoneId}`);
  console.log(`CITIZEN read one: expected 200, got ${res.status}`);
  
  res = await makeRequest(cit_token, 'GET', `/risk-zones/invalid-id`);
  console.log(`CITIZEN read invalid ID: expected 400, got ${res.status}`);
  
  res = await makeRequest(cit_token, 'GET', `/risk-zones/5f8d04f1c1f7a0b3f8a4e1a2`);
  console.log(`CITIZEN read nonexistent ID: expected 404, got ${res.status}`);

  console.log('\n--- 4. PATCH /api/risk-zones/:id ---');
  const patchData = { riskLevel: 'CRITICAL' };
  res = await makeRequest(cit_token, 'PATCH', `/risk-zones/${createdZoneId}`, patchData);
  console.log(`CITIZEN patch: expected 403, got ${res.status}`);
  
  res = await makeRequest(off_token, 'PATCH', `/risk-zones/${createdZoneId}`, patchData);
  console.log(`FIELD_OFFICER patch: expected 403, got ${res.status}`);
  
  res = await makeRequest(auth_token, 'PATCH', `/risk-zones/${createdZoneId}`, patchData);
  console.log(`AUTHORITY patch: expected 200, got ${res.status}`);

  console.log('\n--- 5. GET /api/risk-zones/nearby ---');
  res = await makeRequest(cit_token, 'GET', '/risk-zones/nearby?latitude=12.456&longitude=75.123&radius=5000');
  console.log(`Valid nearby query: expected 200, got ${res.status}`);
  
  res = await makeRequest(cit_token, 'GET', '/risk-zones/nearby?latitude=999&longitude=75.123&radius=5000');
  console.log(`Invalid nearby query (lat): expected 400, got ${res.status}`);
};

runTests();
