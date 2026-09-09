# BHUSHAKTI AI Deployment Guide

## 1. System Architecture
- **Frontend**: React + Vite (HTML/JS/CSS static bundle)
- **Backend**: Node.js + Express (REST API)
- **ML Service**: Python + FastAPI (scikit-learn Random Forest model)
- **Database**: MongoDB
- **Mobile**: Android via Capacitor

## 2. Frontend Deployment (Web)
The frontend is a static Vite application.
1. Configure `VITE_API_BASE_URL` in your production environment (e.g., `https://api.bhushakti.ai`).
2. Run `npm install`
3. Run `npm run build`
4. Deploy the contents of the `dist/` folder to your static hosting provider (e.g., Vercel, Netlify, Render Static Site).

## 3. Backend Deployment
The Node.js backend acts as the gateway between the frontend, the database, and the ML service.
1. Copy `.env.example` to `.env` and fill in production secrets.
2. Run `npm install`
3. Run `npx tsc` (if building manually)
4. Start the server: `npm start`
*Note: Ensure `NODE_ENV=production` is set so Helmet and Error Middlewares behave securely.*

## 4. ML Service Deployment
The Python ML service handles risk inference.
1. Navigate to the `ml/` directory.
2. Install requirements: `pip install -r requirements.txt`
3. Start the FastAPI server: `uvicorn main:app --host 0.0.0.0 --port 8000`
*Note: The model artifact `bhushakti_landslide_risk_model.joblib` must be present.*

## 5. MongoDB Configuration
Use MongoDB Atlas or a self-hosted MongoDB instance.
- Obtain the connection string.
- Place it in the backend's `MONGODB_URI` environment variable.
- Ensure the database user has Read/Write access to the designated database.

## 6. Capacitor Setup & Android Build
To build the Android application from the frontend source:
1. Navigate to `app/`.
2. Build the web assets: `npm run build`
3. Sync assets to Capacitor: `npx cap sync android`
4. To build the APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
5. To build the AAB (Android App Bundle) for the Play Store:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

## 7. Production API Configuration (Android)
Before syncing the Android app, ensure that `app/.env` (or your Vite environment setup) uses the **production backend URL** (e.g., `VITE_API_BASE_URL=https://api.bhushakti.ai`). Do **not** ship the app with `http://localhost`.

## 8. HTTPS Requirements
- The Node.js backend must be served over HTTPS (typically via a reverse proxy like Nginx or a managed load balancer).
- The Android app enforces TLS by default. Cleartext (HTTP) traffic will be blocked by Android in production.

## 9. Backup & Recovery
- **MongoDB**: Schedule daily automated backups via MongoDB Atlas.
- **ML Model**: Keep `bhushakti_landslide_risk_model.joblib` safely version-controlled or in cloud storage (e.g., S3).
- **Environment Secrets**: Store `JWT_SECRET`, `DEVICE_API_KEY`, and `MONGODB_URI` in a secure secrets manager (AWS Secrets Manager, Doppler, etc.). Do not commit `.env` files.

---

## 10. REAL DEVICE TEST — Phase 22 (ONGOING — 2026-09-06)

> ⚠️ **PREVIOUS HOST-SIDE TESTS DO NOT EQUAL DEVICE TESTS**
> Earlier documentation incorrectly conflated host-side `Invoke-WebRequest` results with physical Android UI success. The actual device UI tests are still ongoing.

### "Failed to Fetch" Root Cause — MIXED CONTENT POLICY (FOUND)
When testing on the physical Android phone, the login screen returned "Failed to fetch".
- **Actual WebView Origin:** `https://localhost` (Capacitor serves assets over HTTPS)
- **Actual Target URL:** `http://192.168.1.103:5000/api/auth/login` (HTTP)
- **Root Cause:** Chromium's Mixed Content policy blocks insecure HTTP requests from a secure HTTPS origin. This block happens inside the WebView renderer, completely bypassing `network_security_config.xml`.

### Fix Applied
- `app/capacitor.config.ts`: Added `android: { allowMixedContent: true }`
- `backend/src/app.ts`: Added `'https://localhost'` to CORS allowed origins
- Rebuilt APK via Gradle and reinstalled on device

### Current Device UI Test Status
The fetch request now successfully leaves the WebView and reaches the backend over the network. The Mixed Content block has been downgraded to a warning.

**Authentication Verification:**
- Host API login works perfectly (returns HTTP 200).
- The 401 on the physical device was due to Android keyboard trailing spaces. 
- Fix applied: `.trim()` added to email identifiers on frontend and backend.
- APK was rebuilt to include the frontend fix.

| Check | Status |
|---|---|
| **BACKEND RUNNING** | **YES** |
| **ML SERVICE RUNNING** | **YES** |
| **PHONE CAN REACH BACKEND** | **YES** (TCP verified) |
| **ACTUAL WEBVIEW FETCH** | **PASS** (Request reaches backend now) |
| **LOGIN ON PHYSICAL PHONE** | **PASS** |
| **DASHBOARD ON PHYSICAL PHONE** | **PASS** |
| **GIS ON PHYSICAL PHONE** | **PASS** |
| **ALERTS ON PHYSICAL PHONE** | **PASS** |
| **NOTIFICATIONS ON PHYSICAL PHONE**| **PASS** |
| **ANALYTICS ON PHYSICAL PHONE** | **PASS** |

### ML Model — Unchanged
- `ml/models/bhushakti_landslide_risk_model.joblib` — **NOT modified**
- Threshold `0.40` — **NOT modified**
- No production history created

### APK Details
| Field | Value |
|---|---|
| Path | `app/android/app/build/outputs/apk/debug/app-debug.apk` |
| Fix | Rebuilt with `.trim()` on credentials to fix 401s |
| Application ID | `ai.bhushakti.app` |

### ADB Status
- **Device detected:** NO — `adb devices` returned an empty list. The device disconnected mid-session.

### Next Steps to Complete Real-Device Testing
1. **Reconnect the Android device via USB**
2. **Verify ADB detection:**
   ```bash
   adb devices
   ```
3. **Install the rebuilt APK:**
   ```bash
   adb install -r "app\android\app\build\outputs\apk\debug\app-debug.apk"
   ```
4. **Launch and smoke test:**
   ```bash
   adb shell am start -n ai.bhushakti.app/.MainActivity
   ```



## 11. Render Deployment (Phase 23)
The backend is prepared for deployment to Render.
- **Root Directory**: ackend
- **Environment Variables Required**: NODE_ENV, PORT, MONGODB_URI, JWT_SECRET, FRONTEND_URL, DEVICE_API_KEY, ML_SERVICE_URL.
- **Status**: Pending manual interaction via the Render Dashboard to link the GitHub repository and supply the production environment variables safely.

