import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  getApps,
  initializeApp,
  cert,
  applicationDefault,
  type App,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_ADMIN_EMAILS = ['babysharkkk123@gmail.com', 'admin@minnese.app'];
const DEFAULT_FIREBASE_PROJECT_ID = 'total-shield-jlcf1';
const DEFAULT_FIRESTORE_DATABASE_ID = 'ai-studio-minnese-6a8d9b78-9d45-4d29-adcd-7c68ee8dd7d6';
const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface FirebaseClientConfig {
  projectId: string;
  firestoreDatabaseId: string;
}

let cachedClientConfig: FirebaseClientConfig | null = null;

function loadFirebaseClientConfig(): FirebaseClientConfig {
  if (cachedClientConfig) return cachedClientConfig;

  let projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
  let firestoreDatabaseId = (process.env.FIREBASE_DATABASE_ID || '').trim();

  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
      if (!projectId && parsed?.projectId) {
        projectId = String(parsed.projectId).trim();
      }
      if (!firestoreDatabaseId && parsed?.firestoreDatabaseId) {
        firestoreDatabaseId = String(parsed.firestoreDatabaseId).trim();
      }
    }
  } catch (err: any) {
    console.warn('[Firebase Admin Auth] Could not read firebase-applet-config.json:', err?.message || err);
  }

  cachedClientConfig = {
    projectId: projectId || DEFAULT_FIREBASE_PROJECT_ID,
    firestoreDatabaseId: firestoreDatabaseId || DEFAULT_FIRESTORE_DATABASE_ID,
  };
  return cachedClientConfig;
}

let adminSdkApp: App | null = null;
let sdkInitialized = false;
let sdkInitAttempted = false;

function parseServiceAccountJson(raw: string): ServiceAccount | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '{}') return null;
  try {
    const jsonText = trimmed.startsWith('{') ? trimmed : Buffer.from(trimmed, 'base64').toString('utf-8');
    const parsed = JSON.parse(jsonText);
    if (parsed && parsed.project_id && parsed.private_key && parsed.client_email) {
      return parsed as ServiceAccount;
    }
  } catch {
    // Ignore malformed env JSON
  }
  return null;
}

function parseServiceAccountFromEnv(): ServiceAccount | null {
  const fromServiceAccount = parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT || '');
  if (fromServiceAccount) return fromServiceAccount;

  const fromCredsJson = parseServiceAccountJson(process.env.FIREBASE_CREDENTIALS_JSON || '');
  if (fromCredsJson) return fromCredsJson;

  const credsPathRaw = (process.env.FIREBASE_CREDENTIALS_PATH || '').trim();
  if (credsPathRaw) {
    const resolvedPath = path.resolve(process.cwd(), credsPathRaw);
    if (fs.existsSync(resolvedPath)) {
      try {
        const content = fs.readFileSync(resolvedPath, 'utf-8');
        const fromFile = parseServiceAccountJson(content);
        if (fromFile) return fromFile;
      } catch (err: any) {
        console.warn('[Firebase Admin Auth] Failed to read FIREBASE_CREDENTIALS_PATH:', err?.message || err);
      }
    }
  }

  return null;
}

function ensureFirebaseAdminSdkInitialized(): boolean {
  if (sdkInitialized) return true;
  try {
    const existingApps = getApps();
    if (Array.isArray(existingApps) && existingApps.length > 0) {
      adminSdkApp = existingApps[0];
      sdkInitialized = true;
      return true;
    }
  } catch {
    // Ignore getApps failure
  }

  if (sdkInitAttempted) return false;
  sdkInitAttempted = true;

  const serviceAccount = parseServiceAccountFromEnv();
  if (serviceAccount) {
    try {
      adminSdkApp = initializeApp({
        credential: cert(serviceAccount),
      });
      sdkInitialized = true;
      return true;
    } catch (err: any) {
      console.warn('[Firebase Admin Auth] Service account initialization failed:', err?.message || err);
      return false;
    }
  }

  const adcPath = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  if (adcPath && fs.existsSync(path.resolve(process.cwd(), adcPath))) {
    try {
      adminSdkApp = initializeApp({
        credential: applicationDefault(),
      });
      sdkInitialized = true;
      return true;
    } catch (err: any) {
      console.warn('[Firebase Admin Auth] ADC initialization failed:', err?.message || err);
      return false;
    }
  }

  return false;
}

/**
 * Returns true if either Firebase Admin SDK is configured OR public-key RS256 verification
 * can run using the Firebase projectId from firebase-applet-config.json / FIREBASE_PROJECT_ID.
 */
export function isFirebaseAdminConfigured(): boolean {
  if (ensureFirebaseAdminSdkInitialized()) return true;
  const cfg = loadFirebaseClientConfig();
  return Boolean(cfg.projectId);
}

function getAllowedAdminEmails(): Set<string> {
  const extra = (process.env.QBANK_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ADMIN_EMAILS, ...extra]);
}

// ============================================================================
// Google Public X.509 Certificate Cache for Cryptographic RS256 JWT Verification
// ============================================================================
let googleCertsCache: Record<string, string> | null = null;
let googleCertsExpiresAt = 0;

async function fetchGooglePublicCerts(forceRefresh = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && googleCertsCache && now < googleCertsExpiresAt) {
    return googleCertsCache;
  }

  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) {
    throw new Error(`Không thể tải chứng chỉ công khai Google (${res.status}).`);
  }

  const certs = (await res.json()) as Record<string, string>;
  let maxAgeSec = 3600;
  const cc = res.headers.get('cache-control') || '';
  const match = cc.match(/max-age=(\d+)/i);
  if (match && match[1]) {
    maxAgeSec = Math.max(60, parseInt(match[1], 10));
  }

  googleCertsCache = certs;
  googleCertsExpiresAt = now + maxAgeSec * 1000;
  return certs;
}

function base64UrlDecodeToBuffer(segment: string): Buffer {
  const pad = segment.length % 4 === 0 ? '' : '='.repeat(4 - (segment.length % 4));
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

interface VerifiedJwtPayload {
  uid: string;
  email: string;
  emailVerified: boolean;
  customRole?: string;
  customAdmin?: boolean;
}

async function verifyFirebaseIdTokenWithPublicCerts(
  idToken: string,
  projectId: string
): Promise<VerifiedJwtPayload> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Định dạng Firebase ID Token không hợp lệ.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64UrlDecodeToBuffer(headerB64).toString('utf-8'));
  const payload = JSON.parse(base64UrlDecodeToBuffer(payloadB64).toString('utf-8'));

  if (header?.alg !== 'RS256' || typeof header?.kid !== 'string' || !header.kid) {
    throw new Error('Thuật toán hoặc khóa ký Firebase ID Token không hợp lệ.');
  }

  let certs = await fetchGooglePublicCerts(false);
  let certPem = certs[header.kid];
  if (!certPem) {
    certs = await fetchGooglePublicCerts(true);
    certPem = certs[header.kid];
  }
  if (!certPem) {
    throw new Error('Không tìm thấy chứng chỉ công khai tương ứng cho Firebase ID Token.');
  }

  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = base64UrlDecodeToBuffer(signatureB64);
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingInput);
  verifier.end();

  if (!verifier.verify(certPem, signature)) {
    throw new Error('Chữ ký mã hóa của Firebase ID Token không hợp lệ.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  if (payload.aud !== projectId) {
    throw new Error('Firebase ID Token không thuộc dự án này.');
  }
  if (payload.iss !== expectedIssuer) {
    throw new Error('Nguồn phát hành Firebase ID Token không hợp lệ.');
  }
  if (typeof payload.sub !== 'string' || !payload.sub.trim() || payload.sub.length > 128) {
    throw new Error('Thiếu mã người dùng (sub) trong Firebase ID Token.');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Firebase ID Token đã hết hạn.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Thời gian phát hành Firebase ID Token không hợp lệ.');
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const emailVerified = payload.email_verified !== false;
  const customRole = typeof payload.role === 'string' ? payload.role.trim().toLowerCase() : undefined;
  const customAdmin = payload.admin === true;

  return {
    uid: payload.sub.trim(),
    email,
    emailVerified,
    customRole,
    customAdmin,
  };
}

// ============================================================================
// Dynamic Granted-Admin Verification via Firestore (system_config/admins & users/{uid})
// ============================================================================
let cachedDynamicAdminEmails: Set<string> | null = null;
let dynamicAdminCacheExpiresAt = 0;

function extractStringArrayFromFirestoreField(field: any): string[] {
  const values = field?.arrayValue?.values;
  if (!Array.isArray(values)) return [];
  return values
    .map((v: any) => (typeof v?.stringValue === 'string' ? v.stringValue.trim().toLowerCase() : ''))
    .filter(Boolean);
}

async function checkAdminViaFirestoreRest(
  idToken: string,
  uid: string,
  email: string,
  projectId: string,
  databaseId: string
): Promise<boolean> {
  const encodedDb = encodeURIComponent(databaseId);
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodedDb}/documents`;
  const headers = {
    Authorization: `Bearer ${idToken}`,
    Accept: 'application/json',
  };

  // 1. Check cached dynamic admin emails from system_config/admins first
  const now = Date.now();
  if (cachedDynamicAdminEmails && now < dynamicAdminCacheExpiresAt && cachedDynamicAdminEmails.has(email)) {
    return true;
  }

  // 2. Fetch fresh system_config/admins doc (where Admin Portal stores granted admins)
  try {
    let adminsRes = await fetch(`${baseUrl}/system_config/admins`, { headers });
    if (!adminsRes.ok) {
      adminsRes = await fetch(`${baseUrl}/system_config/admins`, { headers: { Accept: 'application/json' } });
    }
    if (adminsRes.ok) {
      const docJson = (await adminsRes.json()) as any;
      const list = extractStringArrayFromFirestoreField(docJson?.fields?.admin_emails);
      cachedDynamicAdminEmails = new Set(list);
      dynamicAdminCacheExpiresAt = Date.now() + 60_000;
      if (cachedDynamicAdminEmails.has(email)) {
        return true;
      }
    }
  } catch (err: any) {
    console.warn('[Firebase Admin Auth] Firestore REST system_config/admins lookup failed:', err?.message || err);
  }

  // 3. Fallback: check users/{uid}.role === 'admin' or 'teacher'
  try {
    let userRes = await fetch(`${baseUrl}/users/${encodeURIComponent(uid)}`, { headers });
    if (!userRes.ok) {
      userRes = await fetch(`${baseUrl}/users/${encodeURIComponent(uid)}`, { headers: { Accept: 'application/json' } });
    }
    if (userRes.ok) {
      const docJson = (await userRes.json()) as any;
      const role = String(docJson?.fields?.role?.stringValue || '').trim().toLowerCase();
      if (role === 'admin' || role === 'teacher') {
        return true;
      }
    }
  } catch (err: any) {
    console.warn('[Firebase Admin Auth] Firestore REST users/{uid} lookup failed:', err?.message || err);
  }

  return false;
}

async function checkAdminViaAdminSdk(uid: string, email: string, databaseId: string): Promise<boolean> {
  try {
    const fsDb =
      adminSdkApp && databaseId && databaseId !== '(default)'
        ? getFirestore(adminSdkApp, databaseId)
        : getFirestore();

    // 1. Check system_config/admins -> admin_emails
    const adminsSnap = await fsDb.collection('system_config').doc('admins').get();
    if (adminsSnap.exists) {
      const rawList = adminsSnap.data()?.admin_emails;
      if (Array.isArray(rawList)) {
        const normalized = rawList.map((e: any) => String(e).trim().toLowerCase()).filter(Boolean);
        if (normalized.includes(email)) {
          return true;
        }
      }
    }

    // 2. Check users/{uid} -> role === 'admin' or 'teacher'
    const userSnap = await fsDb.collection('users').doc(uid).get();
    const role = userSnap.exists ? String(userSnap.data()?.role || '').trim().toLowerCase() : '';
    if (role === 'admin' || role === 'teacher') {
      return true;
    }
  } catch (fsErr: any) {
    console.warn('[Firebase Admin Auth] Admin SDK Firestore role lookup failed:', fsErr?.message || fsErr);
  }
  return false;
}

export interface FirebaseAdminVerifyResult {
  authorized: boolean;
  email?: string;
  uid?: string;
  reason?: string;
}

/**
 * Cryptographically verifies a Firebase ID Token and checks whether the
 * authenticated user holds Admin privileges:
 * 1. Primary owner / static allowlist (babysharkkk123@gmail.com or QBANK_ADMIN_EMAILS)
 * 2. Granted admins in Firestore system_config/admins.admin_emails
 * 3. Firestore users/{uid}.role === 'admin'
 *
 * Works BOTH with Firebase Admin SDK credentials AND out-of-the-box via Google's official
 * RS256 public certificates + Firestore REST API using the verified ID token.
 */
export async function verifyFirebaseAdminIdToken(
  idToken: string
): Promise<FirebaseAdminVerifyResult> {
  if (!idToken || typeof idToken !== 'string') {
    return { authorized: false, reason: 'Thiếu Firebase ID Token.' };
  }

  const cfg = loadFirebaseClientConfig();
  const useSdk = ensureFirebaseAdminSdkInitialized();

  if (!useSdk && !cfg.projectId) {
    return {
      authorized: false,
      reason: 'Chưa cấu hình dự án Firebase (firebase-applet-config.json hoặc FIREBASE_SERVICE_ACCOUNT).',
    };
  }

  try {
    let uid = '';
    let email = '';
    let customRole = '';
    let customAdmin = false;

    if (useSdk) {
      const decoded = await getAuth().verifyIdToken(idToken, true);
      uid = decoded.uid;
      email = (decoded.email || '').trim().toLowerCase();
      customRole = typeof (decoded as any).role === 'string' ? String((decoded as any).role).trim().toLowerCase() : '';
      customAdmin = (decoded as any).admin === true;
    } else {
      const verified = await verifyFirebaseIdTokenWithPublicCerts(idToken, cfg.projectId);
      uid = verified.uid;
      email = verified.email;
      customRole = verified.customRole || '';
      customAdmin = Boolean(verified.customAdmin);
    }

    if (!email) {
      return {
        authorized: false,
        uid,
        email,
        reason: 'Tài khoản Firebase không có địa chỉ email hợp lệ.',
      };
    }

    // 0. Custom claims check
    if (customAdmin || customRole === 'admin' || customRole === 'teacher') {
      return { authorized: true, uid, email };
    }

    // 1. Primary owner / static allowlist check
    const allowedEmails = getAllowedAdminEmails();
    if (allowedEmails.has(email)) {
      return { authorized: true, uid, email };
    }

    // 2. Dynamic granted admin check (system_config/admins + users/{uid})
    const isDynamicAdmin = useSdk
      ? await checkAdminViaAdminSdk(uid, email, cfg.firestoreDatabaseId)
      : await checkAdminViaFirestoreRest(idToken, uid, email, cfg.projectId, cfg.firestoreDatabaseId);

    if (isDynamicAdmin) {
      return { authorized: true, uid, email };
    }

    return {
      authorized: false,
      uid,
      email,
      reason: `Tài khoản ${email} không có quyền Quản trị viên (Admin).`,
    };
  } catch (err: any) {
    return {
      authorized: false,
      reason: err?.message || 'Firebase ID Token không hợp lệ hoặc đã hết hạn.',
    };
  }
}
