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

  // 1. Create a Risk Zone
  const sampleZone = {
    name: 'Feature Test Zone',
    code: 'FTZ-01',
    description: 'Zone for feature testing',
    riskLevel: 'HIGH',
    currentProbability: 0.9,
    location: { type: 'Point', coordinates: [75.123, 12.456] },
    populationExposure: 5000,
    criticalAssetCount: 2,
    slope: 35,
    elevation: 1200,
    landUse: 'FOREST',
    historicalSusceptibility: 0.75,
    isActive: true
  };
  
  const zoneRes = await makeRequest(auth_token, 'POST', '/risk-zones', sampleZone);
  const zoneId = zoneRes.data?.data?._id;

  if (!zoneId) {
    console.error('Failed to create zone for testing');
    return;
  }

  // 2. Create an incomplete zone (missing some features)
  const incompleteZone = {
    name: 'Incomplete Test Zone',
    code: 'ITZ-01',
    description: 'Zone for feature testing with missing data',
    riskLevel: 'LOW',
    currentProbability: 0.1,
    location: { type: 'Point', coordinates: [75.123, 12.456] },
    populationExposure: 100,
    criticalAssetCount: 0,
    isActive: true
  };
  const incompleteZoneRes = await makeRequest(auth_token, 'POST', '/risk-zones', incompleteZone);
  const incompleteZoneId = incompleteZoneRes.data?.data?._id;

  // 3. Test Feature endpoint on empty incomplete zone
  console.log('\n--- GET /api/environmental-data/features/:zoneId (Empty Incomplete) ---');
  let res = await makeRequest(auth_token, 'GET', `/environmental-data/features/${incompleteZoneId}`);
  console.log(`AUTHORITY read features (incomplete): expected 200, got ${res.status}`);
  console.log(`Complete flag (should be false): ${res.data?.data?.dataQuality?.complete}`);
  console.log(`Missing features: ${res.data?.data?.dataQuality?.missingFeatures?.join(', ')}`);

  // 4. Insert Environmental Data
  const sampleData = {
    zoneId: zoneId,
    location: { type: 'Point', coordinates: [75.123, 12.456] },
    rainfall: 15.5,
    rainfallDuration: 2,
    soilMoisture: 45,
    slope: 20,
    elevation: 1500,
    landUse: 'AGRICULTURE',
    recordedAt: new Date().toISOString(),
    source: 'SENSOR'
  };

  await makeRequest(auth_token, 'POST', '/environmental-data', sampleData);

  console.log('\n--- GET /api/environmental-data/features/:zoneId ---');
  res = await makeRequest(cit_token, 'GET', `/environmental-data/features/${zoneId}`);
  console.log(`CITIZEN read features: expected 403, got ${res.status}`);
  
  res = await makeRequest(off_token, 'GET', `/environmental-data/features/${zoneId}`);
  console.log(`FIELD_OFFICER read features: expected 200, got ${res.status}`);

  res = await makeRequest(auth_token, 'GET', `/environmental-data/features/${zoneId}`);
  console.log(`AUTHORITY read features: expected 200, got ${res.status}`);
  console.log(`Complete flag (should be true): ${res.data?.data?.dataQuality?.complete}`);
  console.log(`Missing features: ${res.data?.data?.dataQuality?.missingFeatures?.join(', ') || 'None'}`);

  console.log('\n--- Invalid Window Hours ---');
  res = await makeRequest(auth_token, 'GET', `/environmental-data/features/${zoneId}?windowHours=-5`);
  console.log(`Invalid windowHours (-5): expected 400, got ${res.status}`);
  
  res = await makeRequest(auth_token, 'GET', `/environmental-data/features/${zoneId}?windowHours=9999`);
  console.log(`Invalid windowHours (9999): expected 400, got ${res.status}`);

  console.log('\n--- Nonexistent Zone ---');
  res = await makeRequest(auth_token, 'GET', `/environmental-data/features/5f8d04f1c1f7a0b3f8a4e1a2`);
  console.log(`Nonexistent zone: expected 404, got ${res.status}`);
};

runTests();
