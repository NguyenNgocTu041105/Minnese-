import {
  getApps,
  initializeApp,
  cert,
  applicationDefault,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_ADMIN_EMAILS = ['babysharkkk123@gmail.com'];

let initialized = false;
let initAttempted = false;

function parseServiceAccountFromEnv(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;

  try {
    // Support both raw JSON string and base64-encoded JSON string
    const jsonText = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf-8');
    const parsed = JSON.parse(jsonText);
    if (parsed && parsed.project_id && parsed.private_key && parsed.client_email) {
      return parsed as ServiceAccount;
    }
  } catch (err: any) {
    console.warn('[Firebase Admin Auth] Failed to parse FIREBASE_SERVICE_ACCOUNT:', err?.message || err);
  }
  return null;
}

function ensureFirebaseAdminInitialized(): boolean {
  if (initialized) return true;
  try {
    const existingApps = getApps();
    if (Array.isArray(existingApps) && existingApps.length > 0) {
      initialized = true;
      return true;
    }
  } catch {
    // Ignore getApps check failure and attempt initialization
  }

  if (initAttempted) return false;
  initAttempted = true;

  const serviceAccount = parseServiceAccountFromEnv();
  if (serviceAccount) {
    try {
      initializeApp({
        credential: cert(serviceAccount),
      });
      initialized = true;
      return true;
    } catch (err: any) {
      console.warn('[Firebase Admin Auth] Service account initialization failed:', err?.message || err);
      return false;
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
    try {
      initializeApp({
        credential: applicationDefault(),
      });
      initialized = true;
      return true;
    } catch (err: any) {
      console.warn('[Firebase Admin Auth] ADC initialization failed:', err?.message || err);
      return false;
    }
  }

  return false;
}

export function isFirebaseAdminConfigured(): boolean {
  return ensureFirebaseAdminInitialized();
}

function getAllowedAdminEmails(): Set<string> {
  const extra = (process.env.QBANK_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ADMIN_EMAILS, ...extra]);
}

export interface FirebaseAdminVerifyResult {
  authorized: boolean;
  email?: string;
  uid?: string;
  reason?: string;
}

/**
 * Cryptographically verifies a Firebase ID Token and checks whether the
 * authenticated user holds Admin privileges (allowlisted admin email or Firestore users/{uid}.role === 'admin').
 */
export async function verifyFirebaseAdminIdToken(
  idToken: string
): Promise<FirebaseAdminVerifyResult> {
  if (!idToken || typeof idToken !== 'string') {
    return { authorized: false, reason: 'Thiếu Firebase ID Token.' };
  }

  if (!ensureFirebaseAdminInitialized()) {
    return {
      authorized: false,
      reason: 'FIREBASE_SERVICE_ACCOUNT chưa được cấu hình trên máy chủ backend.',
    };
  }

  try {
    const decoded = await getAuth().verifyIdToken(idToken, true);
    const email = (decoded.email || '').trim().toLowerCase();
    const uid = decoded.uid;

    if (!email || decoded.email_verified === false) {
      return {
        authorized: false,
        uid,
        email,
        reason: 'Email tài khoản Firebase chưa được xác minh.',
      };
    }

    const allowedEmails = getAllowedAdminEmails();
    if (allowedEmails.has(email)) {
      return { authorized: true, uid, email };
    }

    // Check Firestore user profile role if not in static allowlist
    try {
      const userSnap = await getFirestore().collection('users').doc(uid).get();
      const role = userSnap.exists ? String(userSnap.data()?.role || '').toLowerCase() : '';
      if (role === 'admin') {
        return { authorized: true, uid, email };
      }
    } catch (fsErr: any) {
      console.warn('[Firebase Admin Auth] Firestore role lookup failed:', fsErr?.message || fsErr);
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
