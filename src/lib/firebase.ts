import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as fbSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  deleteDoc,
  getDocFromServer,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  UserProfile,
  ClassDoc,
  DeckDoc,
  FlashcardDoc,
  AssignmentDoc,
  AssignmentSubmissionDoc,
  QuizDoc,
  PromptTemplateDoc,
  FileSearchStoreDoc,
  WorkbookDoc,
  OnlineExamDoc,
} from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with auto-detect long polling fallback to avoid WebChannel / proxy connection drops
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// List of Initial Bootstrap Admin Emails
export const PRIMARY_OWNER_EMAIL = 'babysharkkk123@gmail.com';
export const BOOTSTRAP_ADMIN_EMAILS: string[] = [PRIMARY_OWNER_EMAIL];

// In-memory cache of dynamic admin emails retrieved from Firestore
let dynamicAdminEmailsCache: Set<string> = new Set([PRIMARY_OWNER_EMAIL]);

// Listener for Firestore System Admins / Dynamic Roles
export function listenToDynamicAdmins(onUpdate?: (emails: string[]) => void) {
  try {
    const adminDocRef = doc(db, 'system_config', 'admins');
    return onSnapshot(
      adminDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const list: string[] = Array.isArray(data?.admin_emails) ? data.admin_emails : [];
          const updated = new Set([
            PRIMARY_OWNER_EMAIL,
            ...list.map((e) => String(e).toLowerCase().trim()).filter(Boolean),
          ]);
          dynamicAdminEmailsCache = updated;
          if (onUpdate) onUpdate(Array.from(updated));
        } else if (auth.currentUser && auth.currentUser.email && (auth.currentUser.email.toLowerCase().trim() === PRIMARY_OWNER_EMAIL)) {
          // Initialize system_config/admins doc only if authenticated as primary owner
          setDoc(
            adminDocRef,
            {
              admin_emails: [PRIMARY_OWNER_EMAIL],
              updatedAt: new Date().toISOString(),
              note: 'Danh sách email Quản trị viên được phân quyền trực tiếp từ giao diện Admin Portal.',
            },
            { merge: true }
          ).catch(() => {});
        }
      },
      (error) => {
        // Silently tolerate offline/unavailable status as Firestore operates offline cache
        if (error?.code !== 'unavailable') {
          console.info('Admin config listener info:', error?.message);
        }
      }
    );
  } catch (err) {
    return () => {};
  }
}

// Start listener
listenToDynamicAdmins();

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === PRIMARY_OWNER_EMAIL || dynamicAdminEmailsCache.has(clean);
}

export async function fetchDynamicAdminEmails(): Promise<string[]> {
  try {
    const adminDocRef = doc(db, 'system_config', 'admins');
    const snap = await getDoc(adminDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const list: string[] = Array.isArray(data?.admin_emails) ? data.admin_emails : [];
      const merged = Array.from(
        new Set([
          PRIMARY_OWNER_EMAIL,
          ...list.map((e) => String(e).toLowerCase().trim()).filter(Boolean),
        ])
      );
      dynamicAdminEmailsCache = new Set(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Could not fetch dynamic admin emails:', err);
  }
  return Array.from(dynamicAdminEmailsCache);
}

export async function addAdminEmailToFirestore(newEmail: string): Promise<{ success: boolean; message: string }> {
  try {
    const clean = newEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      return { success: false, message: 'Địa chỉ email không hợp lệ.' };
    }
    const currentList = await fetchDynamicAdminEmails();
    if (currentList.includes(clean)) {
      return { success: true, message: `Email ${clean} đã có quyền Quản trị viên từ trước.` };
    }
    const updatedList = Array.from(new Set([...currentList, clean]));
    const adminDocRef = doc(db, 'system_config', 'admins');
    await setDoc(
      adminDocRef,
      {
        admin_emails: updatedList,
        updatedAt: new Date().toISOString(),
        last_added_by: auth.currentUser?.email || 'admin',
      },
      { merge: false }
    );
    dynamicAdminEmailsCache.add(clean);

    // Also update user profile in `users` collection if user exists
    const snapAll = await getDocs(collection(db, 'users'));
    if (!snapAll.empty) {
      for (const d of snapAll.docs) {
        const data = d.data();
        if ((data.email || '').toLowerCase().trim() === clean) {
          await updateDoc(d.ref, { role: 'admin', updatedAt: new Date().toISOString() });
        }
      }
    }

    return {
      success: true,
      message: `Đã cấp quyền Quản trị viên (Admin) cho email "${clean}" thành công!`,
    };
  } catch (err: any) {
    console.error('Error adding admin email:', err);
    return { success: false, message: err?.message || 'Không thể lưu quyền Admin.' };
  }
}

export async function removeAdminEmailFromFirestore(
  targetEmail: string,
  targetRole: 'user' | 'teacher' = 'user'
): Promise<{ success: boolean; message: string }> {
  try {
    const clean = targetEmail.trim().toLowerCase();
    if (clean === PRIMARY_OWNER_EMAIL) {
      return { success: false, message: 'Không thể xóa quyền Quản trị viên gốc của chủ dự án.' };
    }
    const currentList = await fetchDynamicAdminEmails();
    const updatedList = currentList.filter((e) => e !== clean);
    const adminDocRef = doc(db, 'system_config', 'admins');
    await setDoc(
      adminDocRef,
      {
        admin_emails: updatedList,
        updatedAt: new Date().toISOString(),
      },
      { merge: false }
    );
    dynamicAdminEmailsCache = new Set(updatedList);

    // Update user profile in `users` collection if user exists
    const snapAll = await getDocs(collection(db, 'users'));
    if (!snapAll.empty) {
      for (const d of snapAll.docs) {
        const data = d.data();
        if ((data.email || '').toLowerCase().trim() === clean) {
          await updateDoc(d.ref, { role: targetRole, updatedAt: new Date().toISOString() });
        }
      }
    }

    return {
      success: true,
      message: `Đã thu hồi quyền Admin của "${clean}" và chuyển về ${targetRole === 'teacher' ? 'Giáo viên' : 'Học viên'}.`,
    };
  } catch (err: any) {
    console.error('Error removing admin email:', err);
    return { success: false, message: err?.message || 'Không thể cập nhật quyền.' };
  }
}

export const ADMIN_EMAILS = [PRIMARY_OWNER_EMAIL];

// Error handler adhering strictly to Firebase Skill specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (
      error?.code === 'unavailable' ||
      error?.message?.includes('unavailable') ||
      error?.message?.includes('the client is offline') ||
      error?.message?.includes('Could not reach Cloud Firestore')
    ) {
      console.info('Firestore initialized (client operating with local cache / awaiting backend handshake).');
    } else {
      console.warn('Firestore connection check note:', error?.message || error);
    }
  }
}
testConnection();

// Helper to recursively strip undefined properties before saving to Firestore
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
}

// Authentication Helpers
export function getAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc sử dụng tính năng quên mật khẩu.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không đúng định dạng.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Vui lòng nhập tối thiểu 6 ký tự.';
    case 'auth/user-not-found':
      return 'Không tìm thấy tài khoản với email này. Vui lòng đăng ký tài khoản mới.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
    case 'auth/too-many-requests':
      return 'Quá nhiều lần thử không thành công. Vui lòng thử lại sau ít phút.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền Internet.';
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.';
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập Email/Password chưa được kích hoạt trong Firebase Console (Authentication -> Sign-in method).';
    default:
      return error?.message || 'Có lỗi xảy ra trong quá trình xác thực.';
  }
}

export async function registerWithEmailPassword(
  email: string,
  pass: string,
  displayName: string
): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = cred.user;

  if (displayName.trim()) {
    try {
      await updateProfile(user, { displayName: displayName.trim() });
    } catch (e) {
      console.warn('Could not update profile displayName immediately:', e);
    }
  }

  const isAdmin = isUserAdmin(user.email);

  const newProfile: UserProfile = {
    id: user.uid,
    email: user.email || '',
    displayName: displayName.trim() || user.displayName || 'Học viên Minnese',
    role: isAdmin ? 'admin' : 'user',
    current_level: 1,
    words_per_day: 15,
    streak_count: 1,
    last_study_date: new Date().toISOString(),
    exp_points: 50,
    badges: ['badge_first_step'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, newProfile, { merge: true });
  return newProfile;
}

export async function loginWithEmailPassword(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = cred.user;

  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);

  const isAdmin = isUserAdmin(user.email);

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    // Auto-update role if configured in ADMIN_EMAILS
    if (isAdmin && existing.role !== 'admin') {
      const updated = { ...existing, role: 'admin' as const };
      await setDoc(userDocRef, updated, { merge: true });
      return updated;
    }
    return existing;
  } else {
    const newProfile: UserProfile = {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Học viên Minnese',
      role: isAdmin ? 'admin' : 'user',
      current_level: 1,
      words_per_day: 15,
      streak_count: 1,
      last_study_date: new Date().toISOString(),
      exp_points: 50,
      badges: ['badge_first_step'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, newProfile, { merge: true });
    return newProfile;
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; message: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return {
      success: true,
      message: 'Đã gửi liên kết khôi phục mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư đến hoặc mục Thư rác (Spam).',
    };
  } catch (err: any) {
    return {
      success: false,
      message: getAuthErrorMessage(err),
    };
  }
}

export async function loginWithGoogle(): Promise<UserProfile | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (!user) return null;

    // Check if user document already exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    const isAdmin = isUserAdmin(user.email);

    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      if (isAdmin && existing.role !== 'admin') {
        const updated = { ...existing, role: 'admin' as const };
        await setDoc(userDocRef, updated, { merge: true });
        return updated;
      }
      return existing;
    } else {
      const newProfile: UserProfile = {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Học viên Minnese',
        role: isAdmin ? 'admin' : 'user',
        current_level: 1,
        words_per_day: 15,
        streak_count: 1,
        last_study_date: new Date().toISOString(),
        exp_points: 50,
        badges: ['badge_first_step'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newProfile, { merge: true });
      return newProfile;
    }
  } catch (err) {
    console.error('Google Sign-in failed:', err);
    throw err;
  }
}

export async function logoutUser() {
  await fbSignOut(auth);
}

// ---------------------------------------------------------------------------
// SEED DEMO DATA (Idempotent seed helper)
// ---------------------------------------------------------------------------
export async function seedDemoData(targetUserId?: string): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date();
    const todayISO = now.toISOString();
    const in3DaysISO = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const in7DaysISO = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const userId = targetUserId || auth.currentUser?.uid || 'demo-user-123';

    // 1. Seed Demo User Profile if needed
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        id: userId,
        email: auth.currentUser?.email || 'demo@minnese.app',
        displayName: auth.currentUser?.displayName || 'Demo Học Viên',
        role: 'user',
        current_level: 1,
        words_per_day: 15,
        streak_count: 5,
        last_study_date: todayISO,
        exp_points: 320,
        badges: ['badge_streak_5', 'badge_vocab_master_1', 'badge_first_quiz'],
        updatedAt: todayISO,
      },
      { merge: true }
    );

    // 2. Seed Official & Demo Decks
    const deckId = `deck_hsk1_basic_${userId.slice(0, 8)}`;
    const deckRef = doc(db, 'decks', deckId);
    await setDoc(
      deckRef,
      {
        id: deckId,
        owner_id: userId,
        name: 'Giao tiếp cơ bản HSK 1',
        description: '10 từ vựng cốt lõi thường gặp nhất trong giao tiếp hàng ngày HSK 1 kèm phát âm và nét viết.',
        card_count: 10,
        is_official_content: true,
        hsk_level: 1,
        createdAt: todayISO,
        updatedAt: todayISO,
      },
      { merge: true }
    );

    // 3. Seed 10 Real Flashcards with Spaced Repetition Dates
    const demoCardsData = [
      {
        hanzi: '你好',
        pinyin: 'nǐ hǎo',
        han_viet: 'ni hảo',
        meaning_vi: 'Xin chào',
        example_sentence: '你好，很高兴认识你。',
        example_translation: 'Xin chào, rất vui được làm quen với bạn.',
        dueDate: todayISO, // Due today
      },
      {
        hanzi: '谢谢',
        pinyin: 'xièxie',
        han_viet: 'tạ tạ',
        meaning_vi: 'Cảm ơn',
        example_sentence: '谢谢你的帮助。',
        example_translation: 'Cảm ơn sự giúp đỡ của bạn.',
        dueDate: todayISO, // Due today
      },
      {
        hanzi: '再见',
        pinyin: 'zàijiàn',
        han_viet: 'tái kiến',
        meaning_vi: 'Tạm biệt',
        example_sentence: '再见，明天见。',
        example_translation: 'Tạm biệt, hẹn ngày mai gặp.',
        dueDate: todayISO, // Due today
      },
      {
        hanzi: '老师',
        pinyin: 'lǎoshī',
        han_viet: 'lão sư',
        meaning_vi: 'Giáo viên',
        example_sentence: '我的老师很好。',
        example_translation: 'Giáo viên của tôi rất tốt.',
        dueDate: in3DaysISO,
      },
      {
        hanzi: '学生',
        pinyin: 'xuéshēng',
        han_viet: 'học sinh',
        meaning_vi: 'Học sinh',
        example_sentence: '他是一个好学生。',
        example_translation: 'Cậu ấy là một học sinh giỏi.',
        dueDate: in3DaysISO,
      },
      {
        hanzi: '朋友',
        pinyin: 'péngyou',
        han_viet: 'bằng hữu',
        meaning_vi: 'Bạn bè',
        example_sentence: '她是我的好朋友。',
        example_translation: 'Cô ấy là bạn thân của tôi.',
        dueDate: in3DaysISO,
      },
      {
        hanzi: '家',
        pinyin: 'jiā',
        han_viet: 'gia',
        meaning_vi: 'Nhà / Gia đình',
        example_sentence: '我家有三个人。',
        example_translation: 'Nhà tôi có ba người.',
        dueDate: in3DaysISO,
      },
      {
        hanzi: '喜欢',
        pinyin: 'xǐhuan',
        han_viet: 'hỉ hoan',
        meaning_vi: 'Thích',
        example_sentence: '我喜欢学中文。',
        example_translation: 'Tôi thích học tiếng Trung.',
        dueDate: in7DaysISO,
      },
      {
        hanzi: '现在',
        pinyin: 'xiànzài',
        han_viet: 'hiện tại',
        meaning_vi: 'Bây giờ',
        example_sentence: '现在几点了？',
        example_translation: 'Bây giờ là mấy giờ rồi?',
        dueDate: in7DaysISO,
      },
      {
        hanzi: '工作',
        pinyin: 'gōngzuò',
        han_viet: 'công tác',
        meaning_vi: 'Công việc / Làm việc',
        example_sentence: '我的工作很忙。',
        example_translation: 'Công việc của tôi rất bận.',
        dueDate: in7DaysISO,
      },
    ];

    for (let i = 0; i < demoCardsData.length; i++) {
      const item = demoCardsData[i];
      const cardId = `card_${userId.slice(0, 6)}_${i + 1}`;
      const cardRef = doc(db, 'flashcards', cardId);
      await setDoc(
        cardRef,
        {
          id: cardId,
          deck_id: deckId,
          user_id: userId,
          hanzi: item.hanzi,
          pinyin: item.pinyin,
          han_viet: item.han_viet,
          meaning_vi: item.meaning_vi,
          example_sentence: item.example_sentence,
          example_translation: item.example_translation,
          source_citation: 'Giáo trình HSK 1 Chuẩn - Bài 1-3',
          stroke_order_ref: item.hanzi[0],
          srs_data: {
            ease_factor: 2.5,
            interval_days: i < 3 ? 0 : i < 7 ? 3 : 7,
            due_date: item.dueDate,
            last_reviewed: todayISO,
            review_count: i < 3 ? 1 : 3,
          },
          createdAt: todayISO,
          updatedAt: todayISO,
        },
        { merge: true }
      );
    }

    // 4. Seed 1 Sample Quiz (5 Questions, 4/5 scored)
    const quizId = `quiz_sample_${userId.slice(0, 6)}`;
    const quizRef = doc(db, 'quizzes', quizId);
    await setDoc(
      quizRef,
      {
        id: quizId,
        user_id: userId,
        hsk_level: 1,
        type: 'vocab',
        score: 4,
        created_at: todayISO,
        questions: [
          {
            id: 'q1',
            type: 'pinyin',
            prompt: 'Pinyin chính xác của chữ "老师" là gì?',
            questionChinese: '老师',
            options: ['lǎoshī', 'lǎoshì', 'lǎosī', 'láoshī'],
            correctAnswer: 'lǎoshī',
            explanation: '老师 (giáo viên) gồm thanh 3 (lǎo) và thanh 1 (shī).',
            source_citation: 'HSK 1 Chuẩn',
          },
          {
            id: 'q2',
            type: 'meaning',
            prompt: 'Nghĩa tiếng Việt của "喜欢" là gì?',
            questionChinese: '喜欢',
            options: ['Thích', 'Ghét', 'Nhớ', 'Xem'],
            correctAnswer: 'Thích',
            explanation: '喜欢 (xǐhuan) có nghĩa là thích hoặc yêu mến.',
            source_citation: 'HSK 1 Chuẩn',
          },
          {
            id: 'q3',
            type: 'meaning',
            prompt: 'Điền từ thích hợp: "我____学中文" (Tôi thích học tiếng Trung)',
            questionChinese: '我____学中文',
            options: ['喜欢', '再见', '谢谢', '学生'],
            correctAnswer: '喜欢',
            explanation: '喜欢 đóng vai trò là động từ biểu thị sở thích.',
            source_citation: 'HSK 1 Ngữ pháp',
          },
          {
            id: 'q4',
            type: 'meaning',
            prompt: 'Nghĩa của câu "现在几点了？" là:',
            questionChinese: '现在几点了？',
            options: ['Bây giờ là mấy giờ rồi?', 'Hôm nay là thứ mấy?', 'Bạn đi đâu đấy?', 'Nhà bạn ở đâu?'],
            correctAnswer: 'Bây giờ là mấy giờ rồi?',
            explanation: '现在 (bây giờ) + 几点 (mấy giờ) + 了 (trợ từ ngữ khí).',
            source_citation: 'HSK 1 Giao tiếp',
          },
          {
            id: 'q5',
            type: 'pinyin',
            prompt: 'Phát âm của "再见":',
            questionChinese: '再见',
            options: ['zàijiàn', 'zàijiān', 'zāijiàn', 'zàitiān'],
            correctAnswer: 'zàijiàn',
            explanation: '再 (zài - thanh 4) + 见 (jiàn - thanh 4).',
            source_citation: 'HSK 1 Ngữ âm',
          },
        ],
      },
      { merge: true }
    );

    // 5. Seed Sample Classes & Assignments
    const sampleClassId = 'class_hsk1_a7x2';
    const classRef = doc(db, 'classes', sampleClassId);
    await setDoc(
      classRef,
      {
        id: sampleClassId,
        class_name: 'HSK 1 - Lớp sáng T3-T5',
        class_code: 'HSK1-A7X2',
        hsk_level: 1,
        teacher_id: 'teacher-system',
        teacher_name: 'Cô Lý (Li Laoshi)',
        created_by: 'admin-system',
        created_at: todayISO,
        student_count: 8,
        is_active: true,
      },
      { merge: true }
    );

    const assignmentId = 'assign_demo_hsk1';
    const assignRef = doc(db, 'assignments', assignmentId);
    await setDoc(
      assignRef,
      {
        id: assignmentId,
        title: 'Bài tập tuần 1: Ôn tập 10 từ vựng cốt lõi HSK 1',
        description: 'Hoàn thành bài kiểm tra trắc nghiệm 5 câu và ôn tập các từ chào hỏi, giáo viên, học sinh.',
        target_type: 'class',
        target_class_id: sampleClassId,
        hsk_level: 1,
        content_type: 'quiz',
        content_ref_id: quizId,
        due_date: in3DaysISO,
        created_by: 'admin-system',
        created_at: todayISO,
        is_active: true,
      },
      { merge: true }
    );

    // 6. Seed Sample Prompt Templates
    const templates = [
      {
        id: 'flashcard_generation',
        name: 'flashcard_generation',
        system_prompt:
          'Bạn là chuyên gia sư phạm tiếng Trung HSK cho người Việt. Dựa trên tài liệu File Search được cung cấp, hãy phân tích đoạn văn và trích xuất danh sách từ vựng/ngữ pháp chuẩn HSK. Luôn trả về đúng schema JSON gồm hanzi, pinyin, han_viet, meaning_vi, example_sentence, example_translation, source_citation.',
        variables: ['{{user_text}}', '{{hsk_level}}'],
        target_store_names: ['store-tuvung-hsk', 'store-nguphap-hsk'],
        version: 1,
        is_active: true,
      },
      {
        id: 'quiz_generation',
        name: 'quiz_generation',
        system_prompt:
          'Bạn là giám khảo biên soạn đề thi HSK. Dựa trên File Search store của level được chọn, hãy tạo các câu hỏi trắc nghiệm kiểm tra từ vựng, ngữ pháp, ngữ âm kèm giải thích chi tiết có trích dẫn nguồn.',
        variables: ['{{hsk_level}}', '{{count}}', '{{topic}}'],
        target_store_names: ['store-nguphap-hsk'],
        version: 1,
        is_active: true,
      },
    ];

    for (const t of templates) {
      await setDoc(doc(db, 'prompt_templates', t.id), t, { merge: true });
    }

    return { success: true, message: 'Khởi tạo dữ liệu mẫu thành công!' };
  } catch (err: any) {
    console.error('Seed demo data error:', err);
    return { success: false, message: err?.message || String(err) };
  }
}

// ---------------------------------------------------------------------------
// JOIN CLASS BY CODE
// ---------------------------------------------------------------------------
export async function joinClassByCode(
  code: string,
  userId: string
): Promise<{ success: boolean; message: string; classData?: any }> {
  try {
    const formattedCode = code.trim().toUpperCase();
    if (!formattedCode) {
      return { success: false, message: 'Vui lòng nhập mã lớp.' };
    }

    // Query class with matching class_code
    const q = query(collection(db, 'classes'), where('class_code', '==', formattedCode), where('is_active', '==', true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'Mã lớp không hợp lệ hoặc lớp học đã kết thúc. Vui lòng kiểm tra lại mã với giáo viên.',
      };
    }

    const classDocSnap = querySnapshot.docs[0];
    const classData = classDocSnap.data();

    // Update user profile with joined class information
    const userRef = doc(db, 'users', userId);
    const updatePayload: Partial<UserProfile> = {
      class_id: classDocSnap.id,
      class_code: classData.class_code,
      class_joined_at: new Date().toISOString(),
      current_level: classData.hsk_level,
      current_level_updated_at: new Date().toISOString(),
      current_level_updated_by: `class_code:${classData.class_code}`,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, updatePayload, { merge: true });

    // Increment class student count
    await updateDoc(classDocSnap.ref, {
      student_count: (classData.student_count || 0) + 1,
    });

    return {
      success: true,
      message: `Chúc mừng bạn đã gia nhập lớp "${classData.class_name}" (Trình độ: HSK ${classData.hsk_level})!`,
      classData: { id: classDocSnap.id, ...classData },
    };
  } catch (err: any) {
    console.error('Join class error:', err);
    return { success: false, message: err?.message || 'Có lỗi xảy ra khi tham gia lớp.' };
  }
}

// ---------------------------------------------------------------------------
// ADMIN: FETCH REAL USERS / STUDENTS FROM FIRESTORE
// ---------------------------------------------------------------------------
export async function fetchAllStudentsFromFirestore(): Promise<UserProfile[]> {
  try {
    const q = collection(db, 'users');
    const snap = await getDocs(q);
    const users: UserProfile[] = [];
    snap.forEach((d) => {
      const data = d.data() as UserProfile;
      users.push({ ...data, id: d.id });
    });
    return users;
  } catch (err) {
    console.warn('Could not fetch real users from firestore:', err);
    return [];
  }
}

export async function updateStudentInFirestore(
  studentId: string,
  updateData: Partial<UserProfile>
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', studentId);
    await setDoc(userRef, { ...updateData, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to update student in Firestore:', err);
    return false;
  }
}

export async function deleteStudentInFirestore(studentId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', studentId);
    await deleteDoc(userRef);
    return true;
  } catch (err) {
    console.error('Failed to delete student in Firestore:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// ADMIN & TEACHER: CLASSES CRUD IN FIRESTORE
// ---------------------------------------------------------------------------
export async function fetchClassesFromFirestore(): Promise<ClassDoc[]> {
  try {
    const q = collection(db, 'classes');
    const snap = await getDocs(q);
    const list: ClassDoc[] = [];
    snap.forEach((d) => {
      const data = d.data() as ClassDoc;
      list.push({ ...data, id: d.id });
    });
    return list;
  } catch (err) {
    console.warn('Could not fetch classes from firestore:', err);
    return [];
  }
}

export async function saveClassToFirestore(classDoc: ClassDoc): Promise<boolean> {
  try {
    const ref = doc(db, 'classes', classDoc.id);
    await setDoc(ref, sanitizeForFirestore(classDoc), { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save class to Firestore:', err);
    return false;
  }
}

export async function deleteClassInFirestore(classId: string): Promise<boolean> {
  try {
    const ref = doc(db, 'classes', classId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error('Failed to delete class from Firestore:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// ADMIN & TEACHER: ASSIGNMENTS CRUD IN FIRESTORE
// ---------------------------------------------------------------------------
export async function fetchAssignmentsFromFirestore(): Promise<AssignmentDoc[]> {
  try {
    const q = collection(db, 'assignments');
    const snap = await getDocs(q);
    const list: AssignmentDoc[] = [];

    snap.forEach((d) => {
      const data = d.data() as AssignmentDoc;
      const assign = { ...data, id: d.id };
      list.push(assign);
    });

    list.sort(
      (a, b) =>
        new Date(a.due_date || 0).getTime() -
        new Date(b.due_date || 0).getTime()
    );

    return list;
  } catch (err) {
    console.warn('Could not fetch assignments from firestore:', err);
    return [];
  }
}

export function subscribeAssignmentsFromFirestore(
  callback: (assignments: AssignmentDoc[]) => void
): () => void {
  try {
    const q = collection(db, 'assignments');
    return onSnapshot(
      q,
      (snap) => {
        const list: AssignmentDoc[] = [];

        snap.forEach((d) => {
          const data = d.data() as AssignmentDoc;
          const assign = { ...data, id: d.id };
          list.push(assign);
        });

        list.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        callback(list);
      },
      (err) => {
        console.warn('subscribeAssignmentsFromFirestore error:', err);
      }
    );
  } catch (err) {
    console.warn('Could not setup assignments subscription:', err);
    return () => {};
  }
}

export async function saveAssignmentToFirestore(assignDoc: AssignmentDoc): Promise<boolean> {
  try {
    const ref = doc(db, 'assignments', assignDoc.id);
    await setDoc(ref, sanitizeForFirestore(assignDoc), { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save assignment to Firestore:', err);
    return false;
  }
}

export async function deleteAssignmentInFirestore(assignId: string): Promise<boolean> {
  try {
    const ref = doc(db, 'assignments', assignId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error('Failed to delete assignment from Firestore:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// FILE SEARCH STORES & DOCUMENTS CRUD IN FIRESTORE
// ---------------------------------------------------------------------------
export async function fetchFileSearchStoresFromFirestore(): Promise<FileSearchStoreDoc[]> {
  try {
    const q = collection(db, 'file_search_stores');
    const snap = await getDocs(q);
    const list: FileSearchStoreDoc[] = [];
    snap.forEach((d) => {
      const data = d.data() as FileSearchStoreDoc;
      list.push({ ...data, id: d.id });
    });
    return list;
  } catch (err) {
    console.warn('Could not fetch file search stores from firestore:', err);
    return [];
  }
}

export async function saveFileSearchStoreToFirestore(storeDoc: FileSearchStoreDoc): Promise<boolean> {
  try {
    const ref = doc(db, 'file_search_stores', storeDoc.id);
    await setDoc(ref, sanitizeForFirestore(storeDoc), { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save file store to Firestore:', err);
    return false;
  }
}

export async function deleteFileSearchStoreInFirestore(storeId: string): Promise<boolean> {
  try {
    const ref = doc(db, 'file_search_stores', storeId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error('Failed to delete file store from Firestore:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// ASSIGNMENT SUBMISSIONS CRUD IN FIRESTORE
// ---------------------------------------------------------------------------
export async function fetchSubmissionsFromFirestore(): Promise<AssignmentSubmissionDoc[]> {
  try {
    const q = collection(db, 'assignment_submissions');
    const snap = await getDocs(q);
    const list: AssignmentSubmissionDoc[] = [];
    snap.forEach((d) => {
      const data = d.data() as AssignmentSubmissionDoc;
      list.push({ ...data, id: d.id });
    });
    return list;
  } catch (err) {
    console.warn('Could not fetch submissions from firestore:', err);
    return [];
  }
}

export function subscribeSubmissionsFromFirestore(
  onUpdate: (submissions: AssignmentSubmissionDoc[]) => void
): () => void {
  try {
    const q = collection(db, 'assignment_submissions');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AssignmentSubmissionDoc[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as AssignmentSubmissionDoc;
          list.push({ ...data, id: d.id });
        });
        onUpdate(list);
      },
      (err) => {
        console.warn('Submissions snapshot error:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Could not setup submissions subscription:', err);
    return () => {};
  }
}

export async function saveSubmissionToFirestore(subDoc: AssignmentSubmissionDoc): Promise<boolean> {
  try {
    const ref = doc(db, 'assignment_submissions', subDoc.id);
    await setDoc(ref, sanitizeForFirestore(subDoc), { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save submission to Firestore:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// WORKBOOKS CRUD IN FIRESTORE
// ---------------------------------------------------------------------------
export async function fetchWorkbooksFromFirestore(): Promise<WorkbookDoc[]> {
  try {
    const q = collection(db, 'workbooks');
    const snap = await getDocs(q);
    const list: WorkbookDoc[] = [];
    snap.forEach((d) => {
      const data = d.data() as WorkbookDoc;
      list.push({ ...data, id: d.id });
    });
    return list;
  } catch (err) {
    console.warn('Could not fetch workbooks from Firestore:', err);
    return [];
  }
}

export async function saveWorkbookToFirestore(workbook: WorkbookDoc): Promise<boolean> {
  try {
    const ref = doc(db, 'workbooks', workbook.id);
    await setDoc(ref, sanitizeForFirestore(workbook), { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save workbook to Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, 'workbooks/' + workbook.id);
    return false;
  }
}

export async function deleteWorkbookInFirestore(workbookId: string): Promise<boolean> {
  try {
    const ref = doc(db, 'workbooks', workbookId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error('Failed to delete workbook from Firestore:', err);
    handleFirestoreError(err, OperationType.DELETE, 'workbooks/' + workbookId);
    return false;
  }
}

// ---------------------------------------------------------------------------
// ONLINE EXAMS CRUD IN FIRESTORE
// ---------------------------------------------------------------------------
export async function fetchOnlineExamsFromFirestore(): Promise<OnlineExamDoc[]> {
  const merged: OnlineExamDoc[] = [];
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();

  const addExam = (exam: OnlineExamDoc) => {
    if (!exam) return;
    const idKey = (exam.id || '').trim();
    const codeKey = (exam.exam_code || '').trim().toUpperCase();
    if (idKey && seenIds.has(idKey)) return;
    if (codeKey && seenCodes.has(codeKey)) return;
    if (idKey) seenIds.add(idKey);
    if (codeKey) seenCodes.add(codeKey);
    merged.push(exam);
  };

  try {
    const q = collection(db, 'online_exams');
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data() as OnlineExamDoc;
      addExam({ ...data, id: d.id });
    });
  } catch (err) {
    console.warn('Could not fetch online exams from Firestore:', err);
  }

  // Local storage fallback and merge
  try {
    if (typeof localStorage !== 'undefined') {
      const localExams: OnlineExamDoc[] = JSON.parse(localStorage.getItem('minnese_local_online_exams') || '[]');
      if (Array.isArray(localExams)) {
        localExams.forEach((e) => {
          if (e && (e.id || e.exam_code)) {
            addExam(e);
          }
        });
      }
    }
  } catch (localErr) {
    console.warn('Could not load local online exams from localStorage:', localErr);
  }

  return merged;
}

export async function saveOnlineExamToFirestore(exam: OnlineExamDoc): Promise<boolean> {
  // Always update local cache so students can immediately access the exam
  try {
    const localExams: OnlineExamDoc[] = JSON.parse(localStorage.getItem('minnese_local_online_exams') || '[]');
    const filtered = localExams.filter((e) => e.id !== exam.id && e.exam_code !== exam.exam_code);
    filtered.unshift(exam);
    localStorage.setItem('minnese_local_online_exams', JSON.stringify(filtered.slice(0, 50)));
  } catch (localErr) {}

  try {
    const ref = doc(db, 'online_exams', exam.id);
    await setDoc(ref, sanitizeForFirestore(exam), { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save online exam to Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, 'online_exams/' + exam.id);
    return false;
  }
}

export async function deleteOnlineExamInFirestore(examId: string): Promise<boolean> {
  try {
    const ref = doc(db, 'online_exams', examId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error('Failed to delete online exam from Firestore:', err);
    handleFirestoreError(err, OperationType.DELETE, 'online_exams/' + examId);
    return false;
  }
}

export async function getOnlineExamByCode(examCode: string): Promise<OnlineExamDoc | null> {
  const cleanCode = examCode.trim().toUpperCase();
  try {
    const q = query(collection(db, 'online_exams'), where('exam_code', '==', cleanCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { ...(d.data() as OnlineExamDoc), id: d.id };
    }
  } catch (err) {
    console.warn('Could not fetch exam by code from Firestore:', err);
  }

  // Local fallback cache
  try {
    const localExams: OnlineExamDoc[] = JSON.parse(localStorage.getItem('minnese_local_online_exams') || '[]');
    const found = localExams.find((e) => (e.exam_code || '').trim().toUpperCase() === cleanCode);
    if (found) return found;
  } catch (localErr) {}

  return null;
}

export const getOnlineExamByCodeFromFirestore = getOnlineExamByCode;

export async function loginWithDirectSession(
  email: string,
  displayName?: string
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const isAdmin = isUserAdmin(cleanEmail);
  const uid = `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const profile: UserProfile = {
    id: uid,
    email: cleanEmail,
    displayName: displayName || (cleanEmail === 'babysharkkk123@gmail.com' ? 'Admin BabyShark' : cleanEmail.split('@')[0]),
    role: isAdmin ? 'admin' : 'user',
    current_level: 1,
    words_per_day: 15,
    streak_count: 5,
    last_study_date: new Date().toISOString(),
    exp_points: 350,
    badges: ['badge_first_step'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, profile, { merge: true });
  } catch (e) {
    console.warn('Could not sync fallback profile to Firestore:', e);
  }

  return profile;
}



