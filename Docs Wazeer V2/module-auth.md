# 𓂀 Auth Module — Technical Reference

> **Module ID:** `auth`
> **Owner:** Core Infrastructure
> **Status:** Active (with known issues)
> **Security Level:** Critical

---

## Table of Contents

1. [Module Overview & Responsibilities](#module-overview--responsibilities)
2. [Public API](#public-api)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [IndexedDB Records Used](#indexeddb-records-used)
5. [Security Considerations](#security-considerations)
6. [Known Issues & Fixes](#known-issues--fixes)
7. [Integration Points](#integration-points)

---

## Module Overview & Responsibilities

The Auth module manages user identity, authentication, and authorization for Wazeer OS. It operates **entirely on-device** — there is no backend auth server. All user data, passwords (hashed), and session tokens live in IndexedDB.

### Responsibilities

| Responsibility | Description |
|----------------|-------------|
| User Registration | Create new user accounts with SHA-256 hashed passwords |
| Email/Password Login | Authenticate existing users against stored hashes |
| Google OAuth | Authenticate via Firebase GoogleAuthProvider |
| Session Management | Generate and validate UUID session tokens |
| Session Persistence | Restore sessions across page reloads via `silentReAuth` |
| Admin Detection | Identify admin users by hardcoded emails or first-registration |
| Auth Logging | Record all auth events to `auth_logs` store |
| Preference Loading | Load user preferences on successful authentication |

### Design Decisions

- **No server-side auth:** All data is local (IndexedDB). The Express proxy server does not handle authentication.
- **SHA-256 client-side:** Passwords are hashed before storage. This is a client-side protection measure, not a replacement for proper server-side hashing (which isn't applicable in this local-only architecture).
- **Firebase Auth only for OAuth:** Firebase is exclusively used for Google OAuth sign-in. Email/password auth is fully local.
- **Admin by email:** Admin status is determined by hardcoded email list plus first-registered-user flag.

---

## Public API

### `AuthService`

**File:** `client/src/services/authService.ts`

#### `registerUser(email, rawPassword, displayName)`

```typescript
/**
 * Registers a new user account.
 *
 * @param email - Valid email address.
 * @param rawPassword - Plain text password (will be SHA-256 hashed).
 * @param displayName - User's display name.
 * @returns The created user object with session token.
 * @throws {AuthError} If email is already registered.
 * @throws {AuthError} If email format is invalid.
 */
export async function registerUser(
  email: string,
  rawPassword: string,
  displayName: string
): Promise<AuthenticatedUser>
```

**Behavior:**
1. Validates email format and password length (minimum 6 characters).
2. Checks for duplicate email in `users` store.
3. Hashes password with SHA-256.
4. Creates user record in `users` store.
5. Sets as `wazir_user` (current user).
6. Generates UUID session token, stores in `localStorage`.
7. Logs registration to `auth_logs`.
8. If this is the first user ever registered, sets `isAdmin: true`.
9. Returns the `AuthenticatedUser` object.

#### `loginUser(email, rawPassword)`

```typescript
/**
 * Authenticates an existing user with email and password.
 *
 * @param email - Registered email address.
 * @param rawPassword - Plain text password (will be SHA-256 hashed for comparison).
 * @returns The authenticated user object with session token.
 * @throws {AuthError} If email not found or password doesn't match.
 */
export async function loginUser(
  email: string,
  rawPassword: string
): Promise<AuthenticatedUser>
```

**Behavior:**
1. Looks up user by email in `users` store.
2. Hashes the provided password with SHA-256.
3. Compares hash against stored hash.
4. Generates new UUID session token, stores in `localStorage`.
5. Updates `wazir_user` in config store.
6. Logs login attempt to `auth_logs`.
7. Returns `AuthenticatedUser`.

#### `loginOAuth()`

```typescript
/**
 * Initiates Google OAuth sign-in via Firebase.
 *
 * Uses GoogleAuthProvider with 'select_account' prompt to force
 * account selection every time.
 *
 * @returns The authenticated user from Google, merged with local user record.
 * @throws {AuthError} If Firebase sign-in fails or is cancelled.
 */
export async function loginOAuth(): Promise<AuthenticatedUser>
```

**Behavior:**
1. Creates `GoogleAuthProvider` with `customParameters: { prompt: 'select_account' }`.
2. Calls `signInWithPopup(auth, provider)`.
3. Extracts email, displayName, photoURL from Firebase user.
4. Checks if local user record exists; creates one if not.
5. Generates session token, stores in `localStorage`.
6. Updates `wazir_user`.
7. Logs OAuth login to `auth_logs`.
8. Returns `AuthenticatedUser`.

#### `silentReAuth()`

```typescript
/**
 * Attempts to restore the user session on app bootstrap.
 *
 * Checks localStorage for a session token, validates it against
 * the stored user record in IndexedDB.
 *
 * @returns The authenticated user if session is valid, null otherwise.
 */
export async function silentReAuth(): Promise<AuthenticatedUser | null>
```

**Behavior:**
1. Reads session token from `localStorage` (`wazir_session_token`).
2. If no token exists, returns `null`.
3. Reads `wazir_user` from config store.
4. If user record exists and matches token, returns user.
5. Otherwise, clears token and returns `null`.

#### `logoutUser()`

```typescript
/**
 * Logs out the current user and clears all session data.
 *
 * Does NOT delete the user account — only clears the active session.
 */
export async function logoutUser(): Promise<void>
```

**Behavior:**
1. Removes session token from `localStorage`.
2. Removes `wazir_user` from config store.
3. Logs logout to `auth_logs`.
4. Resets auth-related UI state.

#### `getCurrentUser()`

```typescript
/**
 * Returns the currently authenticated user without re-authentication.
 *
 * @returns The current user or null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null>
```

#### `updateUserPreferences(updates)`

```typescript
/**
 * Updates the current user's preferences.
 *
 * @param updates - Partial preference object to merge into existing preferences.
 */
export async function updateUserPreferences(
  updates: Partial<UserPreferences>
): Promise<void>
```

### Types

```typescript
interface User {
  id: string;              // UUID
  email: string;
  displayName: string;
  passwordHash: string;    // SHA-256 hex string
  photoURL?: string;
  isAdmin: boolean;
  isFirstUser: boolean;
  preferences: UserPreferences;
  createdAt: number;
  lastLoginAt: number;
}

interface AuthenticatedUser extends User {
  sessionToken: string;    // UUID v4
}

interface UserPreferences {
  theme: 'dark';
  language: 'ar' | 'en';
  defaultModel: string;
  voiceGender: 'male' | 'female';
  fontSize: 'small' | 'medium' | 'large';
}

interface AuthLog {
  id: string;
  userId: string;
  action: 'register' | 'login' | 'login_oauth' | 'logout' | 'failed_login';
  timestamp: number;
  details?: string;
  ip?: string;
}
```

---

## Data Flow Diagrams

### Registration Flow

```
User fills form
    │
    ▼
LoginModal (UI)
    │  email, password, displayName
    ▼
AuthService.registerUser()
    │
    ├──► validateEmail(email) ── invalid ──► throw AuthError
    │
    ├──► checkDuplicate(email) ── exists ──► throw AuthError
    │
    ├──► SHA-256 hash password
    │
    ├──► Create User record
    │
    ├──► Save to IndexedDB 'users' store
    │
    ├──► Save to IndexedDB 'wazir_user' (current user)
    │
    ├──► Generate UUID token → localStorage
    │
    ├──► Log to 'auth_logs' store
    │
    └──► Return AuthenticatedUser
            │
            ▼
        Update UI: close modal, show TopBar avatar
```

### Email/Password Login Flow

```
User clicks "Login"
    │
    ▼
LoginModal (UI)
    │  email, password
    ▼
AuthService.loginUser()
    │
    ├──► Find user in 'users' store by email
    │       └── not found ──► throw AuthError('User not found')
    │
    ├──► SHA-256 hash provided password
    │
    ├──► Compare with stored passwordHash
    │       └── mismatch ──► throw AuthError('Invalid credentials')
    │
    ├──► Generate new UUID session token
    │       └── Store in localStorage('wazir_session_token')
    │
    ├──► Update 'wazir_user' in config store
    │
    ├──► Log success to 'auth_logs'
    │
    └──► Return AuthenticatedUser
            │
            ▼
        Update UI state, load preferences
```

### Google OAuth Flow

```
User clicks Google button
    │
    ▼
LoginModal (UI)
    ▼
AuthService.loginOAuth()
    │
    ├──► new GoogleAuthProvider()
    │       └── customParameters: { prompt: 'select_account' }
    │
    ├──► signInWithPopup(firebaseAuth, provider)
    │       └── user cancels ──► throw AuthError('OAuth cancelled')
    │       └── Firebase error ──► throw AuthError(firebaseError.message)
    │
    ├──► Extract: email, displayName, photoURL
    │
    ├──► Check if local user exists for this email
    │       ├── YES ──► Load existing user record
    │       └── NO  ──► Create new user (no password needed for OAuth)
    │
    ├──► Generate session token → localStorage
    │
    ├──► Update 'wazir_user'
    │
    ├──► Log to 'auth_logs'
    │
    └──► Return AuthenticatedUser
```

### Session Persistence (Bootstrap) Flow

```
App loads (main.tsx bootstrap)
    │
    ▼
AuthService.silentReAuth()
    │
    ├──► Read localStorage('wazir_session_token')
    │       └── no token ──► return null → show login
    │
    ├──► Read IndexedDB 'wazir_user'
    │       └── no user ──► clear token, return null
    │
    ├──► Validate token matches user
    │       └── mismatch ──► clear token, return null
    │
    ├──► Update user.lastLoginAt
    │
    └──► Return AuthenticatedUser
            │
            ▼
        Restore UI: show TopBar avatar, load workspace
```

### Logout Flow

```
User clicks logout (TopBar menu)
    │
    ▼
AuthService.logoutUser()
    │
    ├──► Remove localStorage('wazir_session_token')
    │
    ├──► Remove IndexedDB 'wazir_user'
    │
    ├──► Log to 'auth_logs'
    │
    └──► Return
            │
            ▼
        Reset UI state, show LoginModal
```

---

## IndexedDB Records Used

### Store: `wazir-config` (via `configStore`)

| Key | Type | Description |
|-----|------|-------------|
| `wazir_user` | `User` | Currently authenticated user record |

### Store: `wazir-users` (via `usersStore`)

| Key | Type | Description |
|-----|------|-------------|
| `{email}` | `User` | All registered users, keyed by email |

### Store: `wazir-auth-logs` (via `authLogsStore`)

| Key | Type | Description |
|-----|------|-------------|
| `{uuid}` | `AuthLog` | All authentication events |

### localStorage

| Key | Type | Description |
|-----|------|-------------|
| `wazir_session_token` | `string` | UUID v4 session token |

---

## Security Considerations

### Password Hashing

- **Algorithm:** SHA-256 via `crypto.subtle.digest()`
- **Process:** Hash is computed on the client before storage. Raw password is never stored or transmitted.
- **Limitation:** SHA-256 is not a password hashing algorithm (it's designed for data integrity). A proper PBKDF2/Argon2 implementation should be considered for future versions.

### Token Generation

- **Algorithm:** `crypto.randomUUID()` — cryptographically random UUID v4
- **Storage:** `localStorage` (accessible to JavaScript on same origin)
- **Validation:** Token is checked against user record on bootstrap
- **Limitation:** `localStorage` is vulnerable to XSS. HorusGuard mitigates this by sanitizing AI output.

### Admin Detection

```typescript
const ADMIN_EMAILS = [
  'hello.simple.ai@gmail.com',
  'ayman.abdelmohsen@gmail.com',
] as const;
```

Admin status is granted to:
1. Users whose email matches the hardcoded list above.
2. The first user ever registered (determined by checking if `users` store is empty before registration).

### OAuth Security

- Firebase `signInWithPopup` opens a secure Google sign-in window.
- `prompt: 'select_account'` prevents automatic sign-in without user awareness.
- OAuth tokens are managed by Firebase SDK, never exposed to application code.
- Firebase API keys are in environment variables, not in source code.

### Data Isolation

- Each user's data is isolated by session. When no user is authenticated, only public-facing UI is accessible.
- Chat sessions, tasks, and memories are scoped to the authenticated user (future enhancement: currently keyed by session, not user).

---

## Known Issues & Fixes

### Issue 1: Login Doesn't Persist After Page Reload

**Status:** 🔴 Known Bug (v0.x) — Fix planned for v2.0

**Description:** After a successful email/password login, refreshing the page shows the login modal again. The `silentReAuth` function runs during bootstrap but fails to restore the session properly.

**Root Cause:** The session token is saved to `localStorage`, and the user is saved to the config store, but `silentReAuth` either:
- Doesn't properly read the config store, or
- Doesn't update the React state/UI after restoring the session, or
- The `wazir_user` key in the config store is not being set correctly during login.

**Proposed Fix:**
1. Verify `loginUser()` calls `set('wazir_user', user, configStore)` with the full user object.
2. Verify `silentReAuth()` reads from the same store key and sets the auth state in the UI store.
3. Add `isAuthenticated` flag to a Zustand store that both `loginUser` and `silentReAuth` set.
4. Ensure the bootstrap sequence in `main.tsx` awaits `silentReAuth()` before rendering.

### Issue 2: No Registration Flow in LoginModal UI

**Status:** 🔴 Known Bug (v0.x) — Fix planned for v2.0

**Description:** The `LoginModal` component only shows email/password login and Google OAuth. There is no UI for new user registration — the `registerUser` service function exists but has no corresponding UI.

**Proposed Fix:**
1. Add a toggle in `LoginModal`: "Don't have an account? Register"
2. Show registration form with: email, password, confirm password, display name
3. Wire to `AuthService.registerUser()`
4. On success, auto-login and close modal.

---

## Integration Points

### Components Using Auth Module

| Component | Usage |
|-----------|-------|
| `LoginModal` | Calls `loginUser()`, `loginOAuth()`, and (in v2.0) `registerUser()` |
| `TopBar` | Displays user avatar/name from `getCurrentUser()`, logout button calls `logoutUser()` |
| `App` (bootstrap) | Calls `silentReAuth()` on mount to restore session |
| `SettingsView` | Calls `updateUserPreferences()` for theme, language, model settings |

### Stores Integrated With

| Store | Integration |
|-------|-------------|
| `configStore` | Stores `wazir_user` current user record |
| `uiStore` | Controls `isLoginModalOpen`, `isAuthenticated` state |

### Services Depending On Auth

| Service | Dependency |
|---------|------------|
| `AIGateway` | Reads active model from user preferences |
| `MemoryEngine` | Scopes memories to current user (future) |
| `TaskScheduler` | Requires authenticated session for auto-execution |

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com
>
> 𓂀 Wazeer OS — Egyptian Cyberpunk AI Assistant