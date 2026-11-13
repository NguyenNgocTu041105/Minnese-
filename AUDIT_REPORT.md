# BÁO CÁO KIỂM TOÁN TOÀN DIỆN VỀ LOGIC, BẢO MẬT VÀ TRẢI NGHIỆM NGƯỜI DÙNG (UX) CỦA HỆ THỐNG XÁC THỰC & ĐĂNG KÝ MINNESE
**Đơn vị thực hiện**: Ban Giám sát & Kiểm toán An toàn Thông tin Tối cao ("Cụ tổ bắt bẻ")  
**Hệ thống mục tiêu**: MinNese Chinese Learning Platform (Web Frontend & Express Backend)  
**Phạm vi tập tin kiểm toán**: `src/components/Auth/AuthModal.tsx`, `src/lib/firebase.ts`, `src/types.ts`, `server.ts`, `src/utils/`, cùng các liên kết ủy quyền tại `src/App.tsx`, `src/components/Admin/AdminDashboard.tsx`, `firestore.rules`.  
**Thời gian lập báo cáo**: 2026-11-12T23:00:00Z  
**Phân loại mức độ nghiêm trọng tổng thể**: **CRITICAL (THẢM HỌA BẢO MẬT & LỖ HỔNG LOGIC TỒN TẠI TRÊN MÔI TRƯỜNG PRODUCTION)**

---

## I. TỔNG QUAN & LỜI PHÊ CỦA "CỤ TỔ BẮT BẺ"

> *"Nhìn vào luồng xác thực này, tôi không khỏi kinh hoàng. Đây không phải là một hệ thống bảo mật, mà là một 'ngôi nhà hoang mở toang cửa sổ, cửa chính không khóa, lại còn treo thêm biển chỉ đường vào kho vàng'! Làm sao một ứng dụng đưa lên production (`minnese.onrender.com`) lại có thể để một nút bấm công khai cho phép bất kỳ ai trên Internet bấm một nhát là biến thành Admin tối cao? Làm sao lại có chuyện hệ thống gặp lỗi đăng nhập thì dâng tận tay một nút bấm 'Đăng nhập trực tiếp' giúp kẻ tấn công mạo danh bất kỳ tài khoản nào mà không cần biết mật khẩu? Làm sao mật khẩu '123456' lại vượt qua kiểm tra ngon ơ không một chút kháng cự? Các người xây dựng hệ thống xác thực hay đang dựng màn kịch tấu hài cho tin tặc thưởng thức?"*

Báo cáo này được lập để bóc trần toàn bộ các lỗ hổng chết người, sai phạm logic, cẩu thả về kiến trúc và yếu kém về trải nghiệm người dùng hiện diện trong mã nguồn của MinNese. Toàn bộ các phát hiện dưới đây đều đi kèm dữ chứng nguyên văn từ mã nguồn, phân tích cơ chế tấn công và yêu cầu kỹ thuật khắc phục triệt để.

---

## II. MA TRẬN TỔNG HỢP CÁC PHÁT HIỆN KIỂM TOÁN

| Mã số | Mức độ | Tập tin & Dòng mã | Tên lỗ hổng / Sai phạm | Hậu quả / Rủi ro |
|---|---|---|---|---|
| **SEC-01** | **CRITICAL** | `AuthModal.tsx:499-509`, `firebase.ts:1272-1303` | Cửa hậu Admin một chạm công khai (`babysharkkk123@gmail.com`) | Bất kỳ ai cũng có thể chiếm đoạt toàn quyền Admin tối cao mà không cần mật khẩu hay token. |
| **SEC-02** | **CRITICAL** | `AuthModal.tsx:280-289` | Nút mạo danh tài khoản cài cắm trong thông báo lỗi (`handleDirectLogin`) | Bất kỳ ai chỉ cần nhập email của nạn nhân rồi kích hoạt lỗi là có thể đăng nhập thẳng vào tài khoản đó. |
| **SEC-03** | **CRITICAL** | `App.tsx:562, 789-792`, `AdminDashboard.tsx:105-112` | Phân quyền chạy bằng niềm tin ở LocalStorage & Tự động fallback về Admin | Sửa LocalStorage hoặc để `currentAdmin` rỗng là tự động có quyền Quản trị viên. |
| **SEC-04** | **CRITICAL** | `server.ts:1-3668`, `package.json`, `firestore.rules:34-106` | Backend vắng bóng Firebase Admin SDK & Firestore Rules mở toang quyền ghi | Server không xác minh ID Token; Firestore cho phép đọc/ghi toàn bộ bảng `users` và `system_config`. |
| **SEC-05** | **HIGH** | `server.ts:543-548` | Cơ chế bỏ qua Rate-Limiter bằng Header tùy tiện (`Boolean(req.headers.authorization)`) | Kẻ tấn công chỉ cần truyền bất kỳ chuỗi rác nào trong header `Authorization` là vượt qua Rate Limiting. |
| **SEC-06** | **HIGH** | `server.ts:609-659, 717-760` | Các Endpoint sửa đổi dữ liệu RAG, Từ điển & Parse Workbook mở tự do | Cho phép bất kỳ ai thêm/xóa dữ liệu máy chủ và làm cạn kiệt Quota Gemini với payload 50MB. |
| **VAL-01** | **HIGH** | `AuthModal.tsx:96-99, 363` | Kiểm tra mật khẩu hời hợt, chấp nhận "123456" & Thiếu thước đo độ mạnh | Tài khoản người dùng dễ dàng bị tấn công brute-force / từ điển; thiếu phản hồi trực quan real-time. |
| **CFG-01** | **HIGH** | `AuthModal.tsx:117-121, 143-147`, `firebase.ts:335-336` | Rò rỉ lỗi cấu hình hạ tầng Firebase & Mồi chài dùng nút bypass | Phơi bày hướng dẫn Firebase Console cho người dùng cuối và kích động bấm nút bypass cửa sau. |
| **SES-01** | **HIGH** | `App.tsx:599-669`, `firebase.ts` | Phân rã phiên (Dual Source of Truth) & Không khai thác Firebase ID Token | Người dùng chưa đăng nhập vẫn lưu phiên giả Admin trong LocalStorage; không thể gửi token xác thực lên API. |
| **UX-01** | **MEDIUM** | `AuthModal.tsx:56-64` | Rò rỉ trạng thái biểu mẫu khi chuyển tab Đăng nhập / Đăng ký | Không reset trường mật khẩu gây lỗi không khớp xác nhận mật khẩu khi chuyển tab. |
| **UX-02** | **MEDIUM** | `AuthModal.tsx:300-489` | Thiếu vô hiệu hóa trường nhập khi đang submit (Race Condition) | Cho phép người dùng chỉnh sửa dữ liệu, spam submit hoặc bấm nút khác khi request đang bay. |
| **A11Y-01**| **MEDIUM** | `AuthModal.tsx:209-226` | Vi phạm nghiêm trọng chuẩn trợ năng WCAG 2.1 AA | Thiếu `role="dialog"`, không đóng modal khi bấm Escape hay backdrop, thiếu `aria-label` và `role="alert"`. |
| **ERR-01** | **MEDIUM** | `firebase.ts:315-340` | Ánh xạ mã lỗi thiếu hụt, rò rỉ ngoại lệ kỹ thuật tiếng Anh ra màn hình | Người dùng thấy các chuỗi lỗi khó hiểu dạng `Firebase: Error (auth/internal-error)`. |
| **SEC-07** | **LOW** | `byokStorage.ts:50` | Lưu trữ API Key cá nhân (BYOK) dạng văn bản thuần trong LocalStorage | Dễ bị đánh cắp bởi các tập lệnh XSS hoặc tiện ích mở rộng trình duyệt độc hại. |
| **UX-03** | **LOW** | `AuthModal.tsx:313-396` | Thiếu thuộc tính `autoComplete` chuẩn trên các ô nhập liệu | Vô hiệu hóa tính năng tự động điền an toàn của trình duyệt và trình quản lý mật khẩu. |
| **UX-04** | **LOW** | `AuthModal.tsx:171-206` | Xử lý im lặng khi hủy Google Auth & Sinh ID Khách có độ hỗn loạn (Entropy) thấp | Người dùng đóng popup Google thì modal bị treo; ID khách dùng `Math.random` dễ đoán. |

---

## III. CHI TIẾT TỪNG PHÁT HIỆN KIỂM TOÁN ("BẮT BẺ TẬN GỐC RỄ")

### 1. SEC-01 [CRITICAL]: Cửa hậu Admin một chạm công khai ("Cửa sau mở toang mời trộm vào xơi")
- **Vị trí mã nguồn**: `src/components/Auth/AuthModal.tsx`, Dòng 499–509 & `src/lib/firebase.ts`, Dòng 1272–1303.
- **Dữ chứng nguyên văn**:
  ```tsx
  {/* Fast Admin Login Shortcut for Project Owner */}
  <div className="pt-2 border-t border-[var(--color-border)]/50 text-center">
    <button
      type="button"
      onClick={() => handleDirectLogin('babysharkkk123@gmail.com', 'Admin BabyShark')}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>Đăng nhập nhanh với quyền Admin (babysharkkk123@gmail.com)</span>
    </button>
  </div>
  ```
- **Cơ chế & Rủi ro bảo mật**:
  Nút bấm này nằm sờ sờ ngay dưới chân modal đăng nhập trên cả production (`minnese.onrender.com`). Khi người dùng click, hàm `handleDirectLogin` gọi `loginWithDirectSession('babysharkkk123@gmail.com')`. Hàm này không hề gọi Firebase Authentication, không kiểm tra mật khẩu, không gửi OTP, mà tự ý bịa ra một đối tượng `UserProfile` với `role: 'admin'`, ghi thẳng vào Firestore và đẩy vào `localStorage`. Bất kỳ đứa trẻ nào bấm vào cũng lập tức nắm quyền kiểm soát toàn bộ hệ thống!
- **Yêu cầu khắc phục**:
  Xóa sổ hoàn toàn khối UI nút bypass này khỏi `AuthModal.tsx`. Xóa hoặc bảo vệ nghiêm ngặt hàm `loginWithDirectSession` trong `firebase.ts`. Quyền Admin chỉ được cấp khi người dùng hoàn thành đăng nhập Firebase hợp lệ và email đó nằm trong danh sách admin được định cấu hình an toàn trên máy chủ.

---

### 2. SEC-02 [CRITICAL]: Cửa hậu chiếm đoạt tài khoản cài cắm trong thông báo lỗi
- **Vị trí mã nguồn**: `src/components/Auth/AuthModal.tsx`, Dòng 280–289.
- **Dữ chứng nguyên văn**:
  ```tsx
  {errorMessage && (
    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs space-y-2 animate-in fade-in">
      ...
      {email.trim() && (
        <button
          type="button"
          onClick={() => handleDirectLogin(email.trim(), displayName)}
          className="w-full mt-1.5 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Đăng nhập trực tiếp với email "{email.trim()}"</span>
        </button>
      )}
    </div>
  )}
  ```
- **Cơ chế & Rủi ro bảo mật**:
  Khi người dùng nhập sai mật khẩu hoặc Firebase gặp lỗi, thay vì bảo vệ hệ thống, giao diện lại tử tế hiện lên một nút bấm mời gọi: *"Đăng nhập trực tiếp với email..."*. Kẻ tấn công chỉ cần gõ email của bất kỳ ai (kể cả email admin `babysharkkk123@gmail.com`), gõ mật khẩu bừa để kích hoạt lỗi, rồi thong dong nhấn nút này để vào thẳng tài khoản của nạn nhân! Đây là một lỗ hổng mạo danh tài khoản (Account Takeover) không thể biện minh.
- **Yêu cầu khắc phục**:
  Tiêu hủy vĩnh viễn nút "Đăng nhập trực tiếp với email..." bên trong khối hiển thị `errorMessage`. Khối lỗi chỉ được phép hiển thị nội dung thông báo lỗi bằng tiếng Việt chuẩn hóa, tuyệt đối không đính kèm bất kỳ nút bypass nào.

---

### 3. SEC-03 [CRITICAL]: Phân quyền chạy bằng niềm tin ở LocalStorage & Tự động fallback về Admin
- **Vị trí mã nguồn**: `src/App.tsx`, Dòng 562–567 & 789–792; `src/components/Admin/AdminDashboard.tsx`, Dòng 105–112.
- **Dữ chứng nguyên văn**:
  ```typescript
  // src/App.tsx:789-792
  const isAuthorizedAdminOrTeacher =
    userProfile?.role === 'admin' ||
    userProfile?.role === 'teacher' ||
    userProfile?.email === 'babysharkkk123@gmail.com';

  // src/components/Admin/AdminDashboard.tsx:105-107
  const currentAdminEmail = (currentAdmin?.email || 'babysharkkk123@gmail.com').toLowerCase();
  const isAuthorized =
    currentAdmin?.role === 'admin' ||
    currentAdmin?.role === 'teacher' ||
    currentAdminEmail === 'babysharkkk123@gmail.com';
  ```
- **Cơ chế & Rủi ro bảo mật**:
  1. Trong `AdminDashboard.tsx`, nếu `currentAdmin` là `null` hoặc `undefined`, code tự động gán email mặc định là `'babysharkkk123@gmail.com'` và đánh giá `isAuthorized = true`! Tức là người chưa đăng nhập mở Dashboard lên tự khắc được làm Admin!
  2. Việc phân quyền chỉ kiểm tra thuộc tính trong state client/localStorage vốn dễ dàng bị sửa đổi qua DevTools (`localStorage.setItem('minnese_auth_profile', JSON.stringify({role: 'admin'}))`).
- **Yêu cầu khắc phục**:
  Xóa bỏ ngay lập tức đoạn fallback email mặc định `|| 'babysharkkk123@gmail.com'` trong `AdminDashboard.tsx`. Nếu không có thông tin xác thực hợp lệ, `isAuthorized` PHẢI là `false` và từ chối truy cập.

---

### 4. SEC-04 [CRITICAL]: Backend vắng bóng Firebase Admin SDK & Firestore Rules mở toang quyền ghi
- **Vị trí mã nguồn**: `server.ts` (3668 dòng), `package.json`, `firestore.rules` (dòng 34–106).
- **Dữ chứng nguyên văn**:
  - `package.json`: Hoàn toàn không cài đặt `firebase-admin`.
  - `server.ts`: Không hề có logic `verifyIdToken()` từ Firebase.
  - `firestore.rules`:
    ```
    match /users/{userId} {
      allow read: if true;
      allow write: if true;
    }
    match /system_config/{configId} {
      allow read: if true;
      allow write: if true;
    }
    ```
- **Cơ chế & Rủi ro bảo mật**:
  Toàn bộ cơ sở dữ liệu Firestore mở toang cho cả thế giới đọc và ghi mà không cần đăng nhập. Bất kỳ ai cũng có thể dùng REST API của Firestore để ghi đè danh sách `system_config/admins` nhằm tự phong quyền Admin cho mình. Bên cạnh đó, Express server không thể xác thực token người dùng gửi lên.
- **Yêu cầu khắc phục**:
  Khóa chặt các rules nhạy cảm của Firestore (chỉ cho phép user cập nhật profile của chính mình qua `request.auth.uid == userId`, cấm công chúng ghi vào `system_config`). Chuẩn bị cơ chế đính kèm Firebase ID Token vào client headers khi gọi API.

---

### 5. SEC-05 [HIGH]: Bypass Rate-Limiter của máy chủ bằng Header "ma"
- **Vị trí mã nguồn**: `server.ts`, Dòng 543–548.
- **Dữ chứng nguyên văn**:
  ```typescript
  skip: (req) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('127.0.0.1');
    const hasAdminAuth = Boolean(req.headers['x-qbank-token'] || req.headers['authorization']);
    return isLoopback || hasAdminAuth || req.path.startsWith('/qbank/scheduler');
  },
  ```
- **Cơ chế & Rủi ro bảo mật**:
  Biến `hasAdminAuth` được tính bằng `Boolean(req.headers['authorization'])`. Nghĩa là kẻ tấn công chỉ cần truyền header rác như `Authorization: foo` hay `Authorization: Bearer null` là server tự động coi là Admin và MIỄN PHÍ RATE LIMITING! Kẻ tấn công có thể spam hàng triệu request làm sập máy chủ.
- **Yêu cầu khắc phục**:
  Xóa bỏ điều kiện kiểm tra lỏng lẻo `Boolean(req.headers['authorization'])`. Phải so khớp với token bí mật thực sự (`process.env.ADMIN_API_SECRET` hoặc token hợp lệ) nếu muốn bỏ qua rate limit cho admin nội bộ.

---

### 6. SEC-06 [HIGH]: Các Endpoint sửa đổi tri thức RAG, Từ điển & Parse Workbook mở tự do
- **Vị trí mã nguồn**: `server.ts`, Dòng 609–659 & 717–760.
- **Dữ chứng nguyên văn**:
  - `POST /api/rag/documents`: Thêm tài liệu vào bộ nhớ chia sẻ không cần xác thực.
  - `DELETE /api/rag/documents/:id`: Xóa tài liệu RAG không cần xác thực.
  - `POST /api/vocabulary`: Thêm từ vựng vào hệ thống không cần xác thực.
  - `DELETE /api/vocabulary/:id`: Xóa từ vựng không cần xác thực.
  - `POST /api/workbooks/parse-and-remix`: Cho phép đẩy payload lên tới 50MB và gọi trực tiếp Gemini API không cần xác thực.
- **Cơ chế & Rủi ro bảo mật**:
  Bất kỳ ai trên Internet cũng có thể gửi request DELETE làm rỗng toàn bộ dữ liệu từ điển và tài liệu RAG của ứng dụng, hoặc liên tục gửi request parse workbook 50MB để vắt kiệt hạn ngạch Gemini API của chủ sở hữu hệ thống.
- **Yêu cầu khắc phục**:
  Thiết lập middleware bảo vệ các endpoint này, yêu cầu xác thực hoặc giới hạn chỉ cho phép truy cập nội bộ (loopback) hoặc có token quản trị hợp lệ.

---

### 7. VAL-01 [HIGH]: Kiểm tra mật khẩu hời hợt, chấp nhận "123456" & Thiếu thước đo độ mạnh
- **Vị trí mã nguồn**: `src/components/Auth/AuthModal.tsx`, Dòng 96–99 & 363.
- **Dữ chứng nguyên văn**:
  ```tsx
  if (password.length < 6) {
    setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự.');
    return;
  }
  ```
- **Cơ chế & Rủi ro**:
  Chỉ kiểm tra duy nhất độ dài `>= 6`. Mật khẩu như "123456", "aaaaaa", "111111", "qwerty" hoàn toàn hợp lệ và được gửi thẳng lên Firebase!
  Không có thanh đo độ mạnh (Password Strength Meter) theo dõi thời gian thực. Người dùng không hề biết mật khẩu mình đặt mạnh hay yếu.
  Không kiểm tra so khớp mật khẩu xác nhận real-time khi gõ, chỉ quẳng lỗi ra khi bấm nút Đăng ký.
- **Yêu cầu khắc phục**:
  1. Xây dựng tiện ích đánh giá độ phức tạp mật khẩu chuyên nghiệp trong `src/utils/authValidation.ts`: Kiểm tra tối thiểu 8 ký tự, phải có chữ hoa, chữ thường, chữ số và/hoặc ký tự đặc biệt, kiểm tra danh sách đen mật khẩu phổ biến ("123456", "password", "qwerty", "111111", "admin123").
  2. Tích hợp thanh đo độ mạnh mật khẩu (Password Strength Meter) 4 mức (Yếu, Trung bình, Tốt, Rất mạnh) hiển thị trực quan sinh động trên UI.
  3. Kiểm tra và báo trạng thái khớp của ô Xác nhận mật khẩu ngay khi người dùng nhập liệu.

---

### 8. CFG-01 [HIGH]: Rò rỉ lỗi cấu hình hạ tầng Firebase & Mồi chài dùng nút bypass
- **Vị trí mã nguồn**: `src/components/Auth/AuthModal.tsx`, Dòng 117–121 & 143–147; `src/lib/firebase.ts`, Dòng 335–336.
- **Dữ chứng nguyên văn**:
  ```tsx
  if (err?.code === 'auth/operation-not-allowed') {
    setErrorMessage('Phương thức đăng nhập Email/Password chưa bật trong Firebase Console. Bạn có thể nhấn nút "Đăng nhập trực tiếp" bên dưới để tiếp tục ngay.');
  }
  ```
- **Cơ chế & Rủi ro**:
  Thông báo lỗi kỹ thuật của hạ tầng ("chưa bật trong Firebase Console") bị tuồn trực tiếp ra cho người dùng thông thường, kèm theo lời xúi giục bấm nút bypass cửa sau. Điều này gây bối rối tột độ cho người dùng và làm lộ bí mật kiến trúc backend cho kẻ tò mò.
- **Yêu cầu khắc phục**:
  Chuyển đổi thông báo thành thông điệp thân thiện, chuyên nghiệp: *"Hệ thống đăng nhập bằng Email tạm thời đang bảo trì cấu hình. Vui lòng thử lại sau hoặc đăng nhập bằng Google."* Tuyệt đối không nhắc đến Firebase Console hay nút bypass.

---

### 9. SES-01 [HIGH]: Quản lý phiên phân rã (Dual Source of Truth) & Không dùng Firebase ID Token
- **Vị trí mã nguồn**: `src/App.tsx`, Dòng 599–669; `src/lib/firebase.ts`.
- **Dữ chứng nguyên văn**:
  Hệ thống duy trì song song 2 trạng thái người dùng: Firebase Auth State và một bản ghi trong LocalStorage mang tên `minnese_auth_profile`. Trong `onAuthStateChanged`, nếu `user` là `null`, code không dọn dẹp triệt để `userProfile`, khiến phiên giả mạo từ LocalStorage vẫn ung dung tồn tại. Hệ thống cũng không hề trích xuất `getIdToken()` từ Firebase User để lưu trữ hay gửi kèm các request API.
- **Yêu cầu khắc phục**:
  Đồng bộ hóa chặt chẽ giữa Firebase Auth State và LocalStorage. Khi Firebase Auth báo `user == null`, nếu không phải chế độ khách (Guest) có chủ đích, phải dọn sạch profile và token để tránh phiên ma lọt qua mặt kiểm tra.

---

### 10. UX-01 [MEDIUM]: Rò rỉ trạng thái biểu mẫu khi chuyển tab Đăng nhập / Đăng ký
- **Vị trí mã nguồn**: `src/components/Auth/AuthModal.tsx`, Dòng 56–64.
- **Dữ chứng nguyên văn**:
  ```tsx
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };
  ```
  Tuy nhiên ở Dòng 248–254 khi người dùng click chuyển giữa tab 'login' và 'register', code chỉ gọi `setMode(newMode); setErrorMessage(null); setSuccessMessage(null);` mà KHÔNG reset hoặc kiểm tra lại giá trị mật khẩu / confirmPassword. Dẫn đến việc chuyển từ tab Đăng nhập sang Đăng ký với mật khẩu đang gõ dở sẽ làm kích hoạt lỗi không khớp mật khẩu ngay lập tức.
- **Yêu cầu khắc phục**:
  Dọn sạch các cảnh báo lỗi và đồng bộ hóa trạng thái biểu mẫu khi chuyển tab, bảo đảm trải nghiệm chuyển tab mượt mà, không sót lỗi thừa.

---

### 11. UX-02 [MEDIUM]: Thiếu vô hiệu hóa trường nhập khi đang submit (Race Condition)
- **Vị trí mã nguồn**: `src/components/Auth/AuthModal.tsx`, Dòng 300–489.
- **Dữ chứng nguyên văn**:
  Các ô `<input>` email, password, confirmPassword, displayName và nút đăng nhập Google KHÔNG hề có thuộc tính `disabled={isLoading}`.
- **Cơ chế & Rủi ro**:
  Khi mạng chậm và request đăng nhập đang được gửi đi, người dùng có thể thoải mái sửa đổi email trong ô input, liên tục bấm Enter để spam gửi nhiều request cùng lúc, hoặc bấm đồng thời nút Đăng nhập Google, gây ra xung đột trạng thái (Race Condition) và các ngoại lệ không mong muốn.
- **Yêu cầu khắc phục**:
  Thêm `disabled={isLoading}` cho toàn bộ các ô input và các nút chuyển đổi, nút submit, nút Google Auth trong suốt quá trình `isLoading === true`.

---

### 12. A11Y-01 [MEDIUM]: Vi phạm nghiêm trọng chuẩn trợ năng WCAG 2.1 AA
- **Vị trí mã nguồn**: `src/components/Auth/AuthModal.tsx`, Dòng 209–226.
- **Dữ chứng nguyên văn**:
  Modal container thiếu `role="dialog"`, thiếu `aria-modal="true"`, thiếu `aria-labelledby`.
  Bấm phím Escape trên bàn phím không đóng modal.
  Bấm chuột ra ngoài vùng backdrop (overlay) không đóng modal.
  Nút hiện/ẩn mật khẩu thiếu `aria-label` (chỉ có icon `Eye`/`EyeOff`).
  Khối thông báo lỗi thiếu `role="alert"`, khiến người khiếm thị dùng trình đọc màn hình (Screen Reader) không biết vừa có lỗi gì xảy ra.
- **Yêu cầu khắc phục**:
  Bổ sung đầy đủ các thuộc tính chuẩn ARIA, lắng nghe sự kiện phím Escape và click backdrop để đóng modal một cách tự nhiên theo đúng tiêu chuẩn trải nghiệm người dùng hiện đại.

---

### 13. ERR-01 [MEDIUM]: Ánh xạ mã lỗi thiếu hụt, rò rỉ ngoại lệ kỹ thuật tiếng Anh
- **Vị trí mã nguồn**: `src/lib/firebase.ts`, Dòng 315–340.
- **Dữ chứng nguyên văn**:
  Hàm `getAuthErrorMessage` bỏ sót các mã lỗi phổ biến: `auth/user-disabled`, `auth/unauthorized-domain`, `auth/popup-blocked`, `auth/cancelled-popup-request`, `auth/account-exists-with-different-credential`, `auth/configuration-not-found`, `auth/requires-recent-login`, `auth/invalid-credential`. Nhánh `default` trả về nguyên xi `error?.message` chứa các chuỗi thô kệch `Firebase: Error (auth/...)`.
- **Yêu cầu khắc phục**:
  Mở rộng bảng tra cứu mã lỗi đầy đủ trong `firebase.ts`, lọc bỏ tiền tố `Firebase: Error`, đảm bảo 100% thông báo lỗi trả về cho học viên đều là tiếng Việt trong sáng, dễ hiểu, hướng dẫn cách khắc phục cụ thể.

---

### 14. SEC-07 [LOW]: Lưu trữ API Key cá nhân (BYOK) dạng văn bản thuần trong LocalStorage
- **Vị trí mã nguồn**: `src/utils/byokStorage.ts`, Dòng 50–70.
- **Dữ chứng**:
  Khóa API Gemini của người dùng được lưu trữ thô trực tiếp vào `localStorage.setItem('minnese_byok_api_keys', JSON.stringify(...))`.
- **Yêu cầu khắc phục**:
  Mã hóa cơ bản (hoặc obfuscation) và cảnh báo người dùng về việc lưu trữ khóa API trên thiết bị dùng chung.

---

### 15. UX-03 & UX-04 [LOW]: Thiếu thuộc tính `autoComplete` & Xử lý đóng Popup Google
- **Vị trí mã nguồn**: `src/components/Auth/AuthModal.tsx`, Dòng 171–206, 313–396.
- **Dữ chứng**:
  - Thiếu `autoComplete="email"`, `autoComplete="current-password"`, `autoComplete="new-password"`.
  - Khi người dùng đóng popup Google (`auth/popup-closed-by-user`), modal im bặt, không đưa ra phản hồi hoặc giữ trạng thái chờ.
  - Sinh ID khách: `const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);` có entropy rất thấp.
- **Yêu cầu khắc phục**:
  Bổ sung đầy đủ `autoComplete`, xử lý lỗi hủy popup mượt mà, và sử dụng `crypto.randomUUID()` để sinh định danh an toàn.

---

## IV. ĐẶC TẢ KỸ THUẬT KHẮC PHỤC (REMEDIATION ACTION PLAN - MILESTONE M2)

Để tuân thủ nghiêm ngặt chỉ thị của người dùng: **"chỉ sửa những hạn chế trong báo cáo, cấm sửa lung tung"**, toàn bộ công tác khắc phục tại Milestone M2 sẽ được đóng khung tuyệt đối trong phạm vi sau:

### 1. Tập tin `src/components/Auth/AuthModal.tsx`:
- **Loại bỏ vĩnh viễn**: Nút Bypass Admin lộ thiên (`Dòng 499-509`) và nút "Đăng nhập trực tiếp với email..." bên trong thông báo lỗi (`Dòng 280-289`).
- **Tích hợp tiện ích kiểm tra mật khẩu**: Nhập khẩu và sử dụng hàm xác thực độ mạnh mật khẩu chuẩn từ `src/utils/authValidation.ts`.
- **Bổ sung UI Password Strength Meter**: Hiển thị thanh tiến trình 4 nấc (Yếu - Cam, Trung bình - Vàng, Tốt - Xanh lá, Rất mạnh - Emerald) kèm danh sách tiêu chuẩn (>=8 ký tự, chữ hoa, chữ số/ký tự đặc biệt) và kiểm tra so khớp mật khẩu real-time.
- **Chuẩn hóa thông báo lỗi**: Thay thế các câu văn rò rỉ "chưa bật trong Firebase Console / bấm nút đăng nhập trực tiếp" bằng thông báo bảo trì cấu hình thân thiện.
- **Khóa tương tác khi loading**: Gán `disabled={isLoading}` cho tất cả các input và button.
- **Nâng cấp chuẩn Accessibility WCAG 2.1 AA**: Thêm `role="dialog"`, xử lý phím Escape, click backdrop, `aria-label` cho nút xem mật khẩu, `role="alert"` cho thông báo lỗi, bổ sung `autoComplete`.

### 2. Tập tin `src/lib/firebase.ts`:
- **Vô hiệu hóa hoặc bảo vệ cửa sau**: Loại bỏ logic tự cấp `role: 'admin'` khi truyền email tùy tiện trong `loginWithDirectSession`.
- **Mở rộng bảng ánh xạ lỗi `getAuthErrorMessage`**: Thêm đầy đủ các mã lỗi `auth/invalid-credential`, `auth/user-disabled`, `auth/unauthorized-domain`, `auth/popup-blocked`, `auth/operation-not-allowed`, `auth/configuration-not-found` với thông điệp tiếng Việt lịch sự, chuyên nghiệp.

### 3. Tập tin `src/utils/authValidation.ts` (Tạo mới tiện ích xác thực chuyên dụng):
- Cung cấp các hàm kiểm tra độ mạnh mật khẩu (`evaluatePasswordStrength`), regex kiểm tra email hợp lệ, kiểm tra blacklist mật khẩu yếu ("123456", "password", "qwerty", etc.).

### 4. Tập tin `src/components/Admin/AdminDashboard.tsx` & `src/App.tsx`:
- Loại bỏ đoạn fallback tự phong Admin `|| 'babysharkkk123@gmail.com'` khi `currentAdmin` là rỗng.

### 5. Tập tin `server.ts`:
- Loại bỏ điều kiện rate-limiter bypass rác `Boolean(req.headers['authorization'])` mà không kiểm tra tính hợp lệ của token.

---

## V. TIÊU CHÍ NGHIỆM THU ĐỘC LẬP (VERIFICATION CRITERIA)
1. **Kiểm tra trực quan & DOM**: Nút "Đăng nhập nhanh với quyền Admin (babysharkkk123@gmail.com)" và nút "Đăng nhập trực tiếp..." biến mất hoàn toàn khỏi DOM của `AuthModal.tsx`.
2. **Kiểm tra Validation**: Nhập mật khẩu "123456" bị từ chối với thông báo rõ ràng yêu cầu tối thiểu 8 ký tự và độ phức tạp; thanh đo độ mạnh hiển thị chính xác theo từng phím gõ.
3. **Kiểm tra Phân quyền Admin**: Người dùng chưa đăng nhập hoặc đăng nhập bằng tài khoản học viên thông thường không thể truy cập giao diện Quản trị viên dưới bất kỳ hình thức nào.
4. **Kiểm tra Biên dịch & Hồi quy**: `npx tsc --noEmit` và `npm test` thực thi thành công 100%, không phát sinh bất kỳ lỗi cú pháp hoặc cảnh báo kiểu dữ liệu nào.
