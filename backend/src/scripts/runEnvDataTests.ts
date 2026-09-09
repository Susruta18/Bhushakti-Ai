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

  // First create a risk zone to link the data to
  const sampleZone = {
    name: 'Env Test Zone',
    code: 'ENV-TZ',
    description: 'A test zone',
    riskLevel: 'HIGH',
    currentProbability: 0.85,
    location: { type: 'Point', coordinates: [75.123, 12.456] },
    populationExposure: 5000,
    criticalAssetCount: 2,
    isActive: true
  };
  
  const zoneRes = await makeRequest(auth_token, 'POST', '/risk-zones', sampleZone);
  const zoneId = zoneRes.data?.data?._id;

  if (!zoneId) {
    console.error('Failed to create zone for testing', zoneRes.data);
    return;
  }

  const sampleData = {
    zoneId: zoneId,
    location: { type: 'Point', coordinates: [75.123, 12.456] },
    rainfall: 15.5,
    rainfallDuration: 2,
    soilMoisture: 45,
    slope: 20,
    elevation: 1500,
    landUse: 'FOREST',
    recordedAt: new Date().toISOString(),
    source: 'SENSOR'
  };

  console.log('\n--- 1. POST /api/environmental-data ---');
  let res = await makeRequest(cit_token, 'POST', '/environmental-data', sampleData);
  console.log(`CITIZEN create: expected 403, got ${res.status}`);
  
  res = await makeRequest(off_token, 'POST', '/environmental-data', sampleData);
  console.log(`FIELD_OFFICER create: expected 201, got ${res.status}`);
  
  res = await makeRequest(auth_token, 'POST', '/environmental-data', sampleData);
  console.log(`AUTHORITY create: expected 201, got ${res.status}`);

  const createdDataId = res.data?.data?._id;

  console.log('\n--- 2. GET /api/environmental-data ---');
  res = await makeRequest(cit_token, 'GET', '/environmental-data');
  console.log(`CITIZEN read all: expected 200, got ${res.status}`);
  
  console.log('\n--- 3. GET /api/environmental-data/:id ---');
  res = await makeRequest(cit_token, 'GET', `/environmental-data/${createdDataId}`);
  console.log(`CITIZEN read one: expected 200, got ${res.status}`);
  
  res = await makeRequest(cit_token, 'GET', `/environmental-data/invalid-id`);
  console.log(`CITIZEN read invalid ID: expected 400, got ${res.status}`);
  
  res = await makeRequest(cit_token, 'GET', `/environmental-data/5f8d04f1c1f7a0b3f8a4e1a2`);
  console.log(`CITIZEN read nonexistent ID: expected 404, got ${res.status}`);

  console.log('\n--- 4. GET /api/environmental-data/zone/:zoneId ---');
  res = await makeRequest(cit_token, 'GET', `/environmental-data/zone/${zoneId}`);
  console.log(`CITIZEN read by zone: expected 200, got ${res.status}`);

  console.log('\n--- 5. GET /api/environmental-data/latest/:zoneId ---');
  res = await makeRequest(cit_token, 'GET', `/environmental-data/latest/${zoneId}`);
  console.log(`CITIZEN read latest by zone: expected 200, got ${res.status}`);

  console.log('\n--- 6. Invalid Validation Checks ---');
  const invalidData = { ...sampleData, rainfall: -10 };
  res = await makeRequest(auth_token, 'POST', '/environmental-data', invalidData);
  console.log(`AUTHORITY create negative rainfall: expected 400, got ${res.status}`);

  const invalidZoneData = { ...sampleData, zoneId: '5f8d04f1c1f7a0b3f8a4e1a2' }; // Doesn't exist
  res = await makeRequest(auth_token, 'POST', '/environmental-data', invalidZoneData);
  console.log(`AUTHORITY create nonexistent zoneId: expected 404, got ${res.status}`);
};

runTests();
