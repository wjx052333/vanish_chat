# Burn-After-Reading Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page ephemeral chat app where every message auto-deletes after 10 seconds, with an admin panel and key-based user access.

**Architecture:** Static React+Vite SPA deployed to Vercel. Firebase Realtime Database for messages and user keys; Firebase Auth (Email/Password for admin, Anonymous for users). No backend server. All routing via `?key=` query param.

**Tech Stack:** React 18, Vite 5, Firebase 10 (Realtime DB + Auth), Vitest + React Testing Library, CSS (no framework)

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/firebase.js` | Firebase app init, export `db` and `auth` |
| `src/sha1.js` | SHA1 hash utility (Web Crypto API) |
| `src/auth.js` | Admin key check, Firebase signIn functions |
| `src/keys.js` | CRUD for user keys in Firebase DB |
| `src/messages.js` | Send, subscribe, delete messages in Firebase DB |
| `src/hooks/useMessageQueue.js` | 1-second stagger queue for incoming messages |
| `src/hooks/useBurnTimer.js` | 10s countdown + Firebase delete per message |
| `src/components/MessageBubble.jsx` | Single message with burn progress bar |
| `src/components/MessageInput.jsx` | Text input + send button |
| `src/components/UserList.jsx` | Admin sidebar: list of users with meta |
| `src/components/GenerateKeyModal.jsx` | Admin modal: create new user key |
| `src/components/AdminView.jsx` | Admin panel (UserList + chat thread) |
| `src/components/UserView.jsx` | User chat view (messages + input) |
| `src/ChatPage.jsx` | Top-level: parse key, route to admin/user view |
| `src/App.jsx` | Path guard: `/chat` → ChatPage, else 404 |
| `src/main.jsx` | ReactDOM entry point |
| `src/index.css` | Global styles + burn animation |
| `database.rules.json` | Firebase Realtime DB security rules |
| `vercel.json` | SPA rewrite rule |
| `.env.example` | Required environment variables with docs |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `src/setupTests.js`, `index.html`, `src/main.jsx` (stub)

- [ ] **Step 1: Scaffold Vite React project**

```bash
cd /home/wjx/llm_chat/chat
npm create vite@latest . -- --template react
```
When prompted "Current directory is not empty" → select "Ignore files and continue".

- [ ] **Step 2: Install dependencies**

```bash
npm install firebase
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Configure Vitest in vite.config.js**

Replace `vite.config.js` entirely:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
```

- [ ] **Step 4: Create setupTests.js**

```js
// src/setupTests.js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify scaffold works**

```bash
npm run dev
```
Expected: Vite dev server starts on `http://localhost:5173`. Ctrl+C to stop.

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold React+Vite project with Vitest"
```

---

## Task 2: SHA1 Utility

**Files:**
- Create: `src/sha1.js`
- Create: `src/__tests__/sha1.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/__tests__/sha1.test.js
import { sha1 } from '../sha1.js'

describe('sha1', () => {
  it('hashes known input correctly', async () => {
    const result = await sha1('hello')
    expect(result).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
  })

  it('returns lowercase hex string of length 40', async () => {
    const result = await sha1('test')
    expect(result).toMatch(/^[0-9a-f]{40}$/)
  })

  it('produces different hashes for different inputs', async () => {
    const a = await sha1('abc')
    const b = await sha1('def')
    expect(a).not.toBe(b)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- sha1
```
Expected: FAIL — "Cannot find module '../sha1.js'"

- [ ] **Step 3: Implement sha1.js**

```js
// src/sha1.js
export async function sha1(str) {
  const buf = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(str)
  )
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- sha1
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/sha1.js src/__tests__/sha1.test.js
git commit -m "feat: add SHA1 utility using Web Crypto API"
```

---

## Task 3: Firebase Init

**Files:**
- Create: `src/firebase.js`
- Create: `.env.example`
- Create: `.env.local` (developer fills in)

- [ ] **Step 1: Create firebase.js**

```js
// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})

export const db = getDatabase(app)
export const auth = getAuth(app)
```

- [ ] **Step 2: Create .env.example**

```bash
# .env.example

# Firebase project config (from Firebase Console > Project Settings > Your apps)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Admin access
# 1. Choose an admin key string (any random text, e.g. openssl rand -hex 16)
# 2. Compute its SHA1: echo -n "YOUR_KEY" | sha1sum
# 3. Paste the hash below (40 hex chars, no spaces)
VITE_ADMIN_KEY_HASH=

# Firebase Auth credentials for admin account
# Create this account in Firebase Console > Authentication > Users
VITE_ADMIN_EMAIL=
VITE_ADMIN_PASSWORD=
```

- [ ] **Step 3: Create .env.local from example and fill in real values**

```bash
cp .env.example .env.local
# Edit .env.local with your actual Firebase project values
```

- [ ] **Step 4: Add .env.local to .gitignore**

Open `.gitignore` and verify `.env.local` is listed (Vite scaffold includes it by default).

- [ ] **Step 5: Commit**

```bash
git add src/firebase.js .env.example .gitignore
git commit -m "feat: add Firebase init and env config"
```

---

## Task 4: Auth Module

**Files:**
- Create: `src/auth.js`
- Create: `src/__tests__/auth.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/__tests__/auth.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../sha1.js', () => ({
  sha1: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signInAnonymously: vi.fn(),
}))

vi.mock('../firebase.js', () => ({ auth: {} }))

import { adminKeyMatch, adminSignIn, userSignIn } from '../auth.js'
import { sha1 } from '../sha1.js'
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth'

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('adminKeyMatch', () => {
  it('returns true when SHA1 of key matches env var', async () => {
    vi.stubEnv('VITE_ADMIN_KEY_HASH', 'abc123hash')
    sha1.mockResolvedValue('abc123hash')
    expect(await adminKeyMatch('somekey')).toBe(true)
  })

  it('returns false when SHA1 does not match', async () => {
    vi.stubEnv('VITE_ADMIN_KEY_HASH', 'abc123hash')
    sha1.mockResolvedValue('differenthash')
    expect(await adminKeyMatch('wrongkey')).toBe(false)
  })
})

describe('adminSignIn', () => {
  it('calls Firebase signInWithEmailAndPassword', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'admin1' } })
    await adminSignIn('admin@test.com', 'pass')
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'admin@test.com', 'pass')
  })
})

describe('userSignIn', () => {
  it('calls Firebase signInAnonymously', async () => {
    signInAnonymously.mockResolvedValue({ user: { uid: 'anon1' } })
    const result = await userSignIn()
    expect(signInAnonymously).toHaveBeenCalledWith({})
    expect(result.user.uid).toBe('anon1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- auth
```
Expected: FAIL — "Cannot find module '../auth.js'"

- [ ] **Step 3: Implement auth.js**

```js
// src/auth.js
import { sha1 } from './sha1.js'
import { auth } from './firebase.js'
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth'

export async function adminKeyMatch(key) {
  const hash = await sha1(key)
  return hash === import.meta.env.VITE_ADMIN_KEY_HASH
}

export function adminSignIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function userSignIn() {
  return signInAnonymously(auth)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- auth
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/auth.js src/__tests__/auth.test.js
git commit -m "feat: add auth module with admin key check and Firebase sign-in"
```

---

## Task 5: Keys Module

**Files:**
- Create: `src/keys.js`
- Create: `src/__tests__/keys.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/__tests__/keys.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({ path })),
  get: vi.fn(),
  set: vi.fn(),
}))

vi.mock('../firebase.js', () => ({ db: {} }))

import { getKey, createKey, updateKeyLogin, getAllKeys } from '../keys.js'
import { get, set } from 'firebase/database'

beforeEach(() => vi.clearAllMocks())

describe('getKey', () => {
  it('returns null when key does not exist', async () => {
    get.mockResolvedValue({ exists: () => false })
    expect(await getKey('missing')).toBeNull()
  })

  it('returns key data when key exists', async () => {
    const data = { username: 'alice', createdAt: 1000 }
    get.mockResolvedValue({ exists: () => true, val: () => data })
    expect(await getKey('abc')).toEqual(data)
  })
})

describe('createKey', () => {
  it('writes key to Firebase and returns keyId', async () => {
    set.mockResolvedValue()
    const keyId = await createKey('bob')
    expect(set).toHaveBeenCalledOnce()
    expect(typeof keyId).toBe('string')
    expect(keyId.length).toBe(32)
  })
})

describe('getAllKeys', () => {
  it('returns empty array when no keys exist', async () => {
    get.mockResolvedValue({ exists: () => false })
    expect(await getAllKeys()).toEqual([])
  })

  it('returns array of keys with id field', async () => {
    get.mockResolvedValue({
      exists: () => true,
      val: () => ({
        key1: { username: 'alice', createdAt: 1000 },
        key2: { username: 'bob', createdAt: 2000 },
      }),
    })
    const result = await getAllKeys()
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('id')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- keys
```
Expected: FAIL — "Cannot find module '../keys.js'"

- [ ] **Step 3: Implement keys.js**

```js
// src/keys.js
import { db } from './firebase.js'
import { ref, get, set } from 'firebase/database'

export async function getKey(keyId) {
  const snap = await get(ref(db, `keys/${keyId}`))
  return snap.exists() ? snap.val() : null
}

export async function createKey(username) {
  const keyId = generateRandomKey(32)
  await set(ref(db, `keys/${keyId}`), {
    username,
    createdAt: Date.now(),
    uid: null,
    lastLoginAt: null,
    lastLoginIp: null,
  })
  return keyId
}

export async function updateKeyLogin(keyId, uid, ip) {
  await set(ref(db, `keys/${keyId}/uid`), uid)
  await set(ref(db, `keys/${keyId}/lastLoginAt`), Date.now())
  await set(ref(db, `keys/${keyId}/lastLoginIp`), ip)
}

export async function getAllKeys() {
  const snap = await get(ref(db, 'keys'))
  if (!snap.exists()) return []
  return Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }))
}

function generateRandomKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(b => chars[b % chars.length])
    .join('')
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- keys
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/keys.js src/__tests__/keys.test.js
git commit -m "feat: add keys module for user key CRUD"
```

---

## Task 6: Messages Module

**Files:**
- Create: `src/messages.js`
- Create: `src/__tests__/messages.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/__tests__/messages.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({ path })),
  push: vi.fn(),
  onChildAdded: vi.fn(),
  remove: vi.fn(),
  get: vi.fn(),
}))

vi.mock('../firebase.js', () => ({ db: {} }))

import { sendMessage, deleteMessage, cleanExpiredMessages, MESSAGE_TTL } from '../messages.js'
import { push, remove, get } from 'firebase/database'

beforeEach(() => vi.clearAllMocks())

describe('MESSAGE_TTL', () => {
  it('is 10000ms', () => {
    expect(MESSAGE_TTL).toBe(10000)
  })
})

describe('sendMessage', () => {
  it('pushes message to correct Firebase path', async () => {
    push.mockResolvedValue()
    await sendMessage('key1', 'hello', 'admin')
    expect(push).toHaveBeenCalledOnce()
    const [, payload] = push.mock.calls[0]
    expect(payload.text).toBe('hello')
    expect(payload.sender).toBe('admin')
    expect(typeof payload.createdAt).toBe('number')
  })
})

describe('deleteMessage', () => {
  it('removes message from Firebase', async () => {
    remove.mockResolvedValue()
    await deleteMessage('key1', 'msg1')
    expect(remove).toHaveBeenCalledOnce()
  })
})

describe('cleanExpiredMessages', () => {
  it('deletes messages older than MESSAGE_TTL', async () => {
    const old = Date.now() - 20000
    const fresh = Date.now() - 1000
    get.mockResolvedValue({
      exists: () => true,
      forEach: (cb) => {
        cb({ key: 'msg1', val: () => ({ createdAt: old }) })
        cb({ key: 'msg2', val: () => ({ createdAt: fresh }) })
      },
    })
    remove.mockResolvedValue()
    await cleanExpiredMessages('key1')
    expect(remove).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- messages
```
Expected: FAIL — "Cannot find module '../messages.js'"

- [ ] **Step 3: Implement messages.js**

```js
// src/messages.js
import { db } from './firebase.js'
import { ref, push, onChildAdded, remove, get } from 'firebase/database'

export const MESSAGE_TTL = 10000

export function sendMessage(keyId, text, sender) {
  return push(ref(db, `chats/${keyId}/messages`), {
    text,
    sender,
    createdAt: Date.now(),
  })
}

export function subscribeMessages(keyId, onMessage) {
  return onChildAdded(ref(db, `chats/${keyId}/messages`), (snap) => {
    onMessage({ id: snap.key, ...snap.val() })
  })
}

export function deleteMessage(keyId, msgId) {
  return remove(ref(db, `chats/${keyId}/messages/${msgId}`))
}

export async function cleanExpiredMessages(keyId) {
  const snap = await get(ref(db, `chats/${keyId}/messages`))
  if (!snap.exists()) return
  const cutoff = Date.now() - MESSAGE_TTL
  const deletions = []
  snap.forEach((child) => {
    if (child.val().createdAt < cutoff) {
      deletions.push(remove(ref(db, `chats/${keyId}/messages/${child.key}`)))
    }
  })
  await Promise.all(deletions)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- messages
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/messages.js src/__tests__/messages.test.js
git commit -m "feat: add messages module with send/subscribe/delete/clean"
```

---

## Task 7: useMessageQueue Hook

**Files:**
- Create: `src/hooks/useMessageQueue.js`
- Create: `src/__tests__/useMessageQueue.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
// src/__tests__/useMessageQueue.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageQueue } from '../hooks/useMessageQueue.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useMessageQueue', () => {
  it('starts with no displayed messages', () => {
    const { result } = renderHook(() => useMessageQueue())
    expect(result.current.displayed).toEqual([])
  })

  it('displays first message immediately on enqueue', () => {
    const { result } = renderHook(() => useMessageQueue())
    act(() => {
      result.current.enqueue({ id: '1', text: 'hello' })
    })
    expect(result.current.displayed).toHaveLength(1)
    expect(result.current.displayed[0].id).toBe('1')
  })

  it('delays second message by 1 second', async () => {
    const { result } = renderHook(() => useMessageQueue())
    act(() => {
      result.current.enqueue({ id: '1', text: 'first' })
      result.current.enqueue({ id: '2', text: 'second' })
    })
    expect(result.current.displayed).toHaveLength(1)
    await act(async () => vi.advanceTimersByTime(1000))
    expect(result.current.displayed).toHaveLength(2)
  })

  it('removeDisplayed removes message by id', () => {
    const { result } = renderHook(() => useMessageQueue())
    act(() => {
      result.current.enqueue({ id: '1', text: 'hello' })
    })
    act(() => {
      result.current.removeDisplayed('1')
    })
    expect(result.current.displayed).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- useMessageQueue
```
Expected: FAIL — "Cannot find module '../hooks/useMessageQueue.js'"

- [ ] **Step 3: Implement useMessageQueue.js**

```js
// src/hooks/useMessageQueue.js
import { useState, useRef, useCallback } from 'react'

export function useMessageQueue() {
  const [displayed, setDisplayed] = useState([])
  const queue = useRef([])
  const processing = useRef(false)

  const processNext = useCallback(() => {
    if (queue.current.length === 0) {
      processing.current = false
      return
    }
    const msg = queue.current.shift()
    setDisplayed(prev => [...prev, msg])
    setTimeout(processNext, 1000)
  }, [])

  const enqueue = useCallback((message) => {
    queue.current.push(message)
    if (!processing.current) {
      processing.current = true
      processNext()
    }
  }, [processNext])

  const removeDisplayed = useCallback((id) => {
    setDisplayed(prev => prev.filter(m => m.id !== id))
  }, [])

  return { displayed, enqueue, removeDisplayed }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- useMessageQueue
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
mkdir -p src/hooks
git add src/hooks/useMessageQueue.js src/__tests__/useMessageQueue.test.jsx
git commit -m "feat: add useMessageQueue hook with 1s stagger"
```

---

## Task 8: useBurnTimer Hook

**Files:**
- Create: `src/hooks/useBurnTimer.js`
- Create: `src/__tests__/useBurnTimer.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
// src/__tests__/useBurnTimer.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBurnTimer } from '../hooks/useBurnTimer.js'

vi.mock('../messages.js', () => ({
  deleteMessage: vi.fn().mockResolvedValue(),
  MESSAGE_TTL: 10000,
}))

import { deleteMessage } from '../messages.js'

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})
afterEach(() => vi.useRealTimers())

describe('useBurnTimer', () => {
  it('calls deleteMessage and onBurned after TTL', async () => {
    const onBurned = vi.fn()
    const msg = { id: 'msg1', createdAt: Date.now() }
    renderHook(() => useBurnTimer('key1', msg, onBurned))

    await act(async () => vi.advanceTimersByTime(10000))
    expect(deleteMessage).toHaveBeenCalledWith('key1', 'msg1')
    expect(onBurned).toHaveBeenCalledWith('msg1')
  })

  it('accounts for already-elapsed time', async () => {
    const onBurned = vi.fn()
    const msg = { id: 'msg2', createdAt: Date.now() - 8000 }
    renderHook(() => useBurnTimer('key1', msg, onBurned))

    await act(async () => vi.advanceTimersByTime(2000))
    expect(deleteMessage).toHaveBeenCalledWith('key1', 'msg2')
  })

  it('fires immediately if message is already expired', async () => {
    const onBurned = vi.fn()
    const msg = { id: 'msg3', createdAt: Date.now() - 15000 }
    renderHook(() => useBurnTimer('key1', msg, onBurned))

    await act(async () => vi.advanceTimersByTime(0))
    expect(deleteMessage).toHaveBeenCalledWith('key1', 'msg3')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- useBurnTimer
```
Expected: FAIL — "Cannot find module '../hooks/useBurnTimer.js'"

- [ ] **Step 3: Implement useBurnTimer.js**

```js
// src/hooks/useBurnTimer.js
import { useEffect } from 'react'
import { deleteMessage, MESSAGE_TTL } from '../messages.js'

export function useBurnTimer(keyId, message, onBurned) {
  useEffect(() => {
    if (!message) return
    const elapsed = Date.now() - message.createdAt
    const remaining = Math.max(0, MESSAGE_TTL - elapsed)
    const timer = setTimeout(async () => {
      await deleteMessage(keyId, message.id)
      onBurned(message.id)
    }, remaining)
    return () => clearTimeout(timer)
  }, [message?.id])
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- useBurnTimer
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useBurnTimer.js src/__tests__/useBurnTimer.test.jsx
git commit -m "feat: add useBurnTimer hook with elapsed-time accounting"
```

---

## Task 9: MessageBubble Component

**Files:**
- Create: `src/components/MessageBubble.jsx`
- Create: `src/__tests__/MessageBubble.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
// src/__tests__/MessageBubble.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageBubble } from '../components/MessageBubble.jsx'

vi.mock('../hooks/useBurnTimer.js', () => ({ useBurnTimer: vi.fn() }))
vi.mock('../messages.js', () => ({ MESSAGE_TTL: 10000 }))

const msg = { id: 'msg1', text: 'hello world', sender: 'user', createdAt: Date.now() }

describe('MessageBubble', () => {
  it('renders message text', () => {
    render(<MessageBubble keyId="key1" message={msg} onBurned={vi.fn()} />)
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('applies admin class for admin messages', () => {
    const adminMsg = { ...msg, sender: 'admin' }
    const { container } = render(
      <MessageBubble keyId="key1" message={adminMsg} onBurned={vi.fn()} />
    )
    expect(container.firstChild).toHaveClass('bubble--admin')
  })

  it('applies user class for user messages', () => {
    const { container } = render(
      <MessageBubble keyId="key1" message={msg} onBurned={vi.fn()} />
    )
    expect(container.firstChild).toHaveClass('bubble--user')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- MessageBubble
```
Expected: FAIL — "Cannot find module '../components/MessageBubble.jsx'"

- [ ] **Step 3: Implement MessageBubble.jsx**

```jsx
// src/components/MessageBubble.jsx
import { useBurnTimer } from '../hooks/useBurnTimer.js'
import { MESSAGE_TTL } from '../messages.js'

export function MessageBubble({ keyId, message, onBurned }) {
  useBurnTimer(keyId, message, onBurned)

  const elapsed = Date.now() - message.createdAt
  const remaining = Math.max(0, MESSAGE_TTL - elapsed)
  const isAdmin = message.sender === 'admin'

  return (
    <div className={`bubble ${isAdmin ? 'bubble--admin' : 'bubble--user'}`}>
      <p className="bubble__text">{message.text}</p>
      <div className="bubble__burn-track">
        <div
          className="bubble__burn-bar"
          style={{ animationDuration: `${remaining}ms` }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- MessageBubble
```
Expected: PASS (3 tests)

- [ ] **Step 5: Create src/components directory and commit**

```bash
mkdir -p src/components
git add src/components/MessageBubble.jsx src/__tests__/MessageBubble.test.jsx
git commit -m "feat: add MessageBubble with burn progress bar"
```

---

## Task 10: MessageInput Component

**Files:**
- Create: `src/components/MessageInput.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/__tests__/MessageInput.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageInput } from '../components/MessageInput.jsx'

describe('MessageInput', () => {
  it('calls onSend with trimmed text and clears input', async () => {
    const onSend = vi.fn()
    render(<MessageInput onSend={onSend} />)
    const input = screen.getByPlaceholderText('输入消息...')
    await userEvent.type(input, '  hello  ')
    await userEvent.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith('hello')
    expect(input).toHaveValue('')
  })

  it('does not call onSend for whitespace-only input', async () => {
    const onSend = vi.fn()
    render(<MessageInput onSend={onSend} />)
    await userEvent.type(screen.getByPlaceholderText('输入消息...'), '   ')
    await userEvent.keyboard('{Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- MessageInput
```
Expected: FAIL

- [ ] **Step 3: Implement MessageInput.jsx**

```jsx
// src/components/MessageInput.jsx
import { useState } from 'react'

export function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <form className="input-bar" onSubmit={handleSubmit}>
      <input
        className="input-bar__field"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="输入消息..."
        disabled={disabled}
        autoComplete="off"
      />
      <button
        className="input-bar__send"
        type="submit"
        disabled={disabled || !text.trim()}
      >
        发送
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- MessageInput
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/MessageInput.jsx src/__tests__/MessageInput.test.jsx
git commit -m "feat: add MessageInput component"
```

---

## Task 11: UserList and GenerateKeyModal Components

**Files:**
- Create: `src/components/UserList.jsx`
- Create: `src/components/GenerateKeyModal.jsx`

- [ ] **Step 1: Implement UserList.jsx**

```jsx
// src/components/UserList.jsx
export function UserList({ users, selectedKeyId, onSelect }) {
  return (
    <div className="user-list">
      {users.length === 0 && (
        <p className="user-list__empty">暂无用户</p>
      )}
      {users.map(user => (
        <div
          key={user.id}
          className={`user-list__item ${user.id === selectedKeyId ? 'user-list__item--active' : ''}`}
          onClick={() => onSelect(user.id)}
        >
          <div className="user-list__name">{user.username}</div>
          <div className="user-list__meta">
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleString('zh-CN')
              : '从未登录'}
          </div>
          {user.lastLoginIp && (
            <div className="user-list__ip">{user.lastLoginIp}</div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Implement GenerateKeyModal.jsx**

```jsx
// src/components/GenerateKeyModal.jsx
import { useState } from 'react'
import { createKey } from '../keys.js'

export function GenerateKeyModal({ onClose }) {
  const [username, setUsername] = useState('')
  const [generatedKey, setGeneratedKey] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!username.trim()) return
    setLoading(true)
    const key = await createKey(username.trim())
    setGeneratedKey(key)
    setLoading(false)
  }

  async function handleCopy() {
    const url = `${window.location.origin}/chat?key=${generatedKey}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {!generatedKey ? (
          <>
            <h2 className="modal__title">生成新密钥</h2>
            <input
              className="modal__input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="用户名"
              autoFocus
            />
            <button
              className="btn btn--primary"
              onClick={handleGenerate}
              disabled={!username.trim() || loading}
            >
              {loading ? '生成中...' : '生成'}
            </button>
          </>
        ) : (
          <>
            <h2 className="modal__title">密钥已生成</h2>
            <p className="modal__key">{generatedKey}</p>
            <button className="btn btn--primary" onClick={handleCopy}>
              {copied ? '已复制!' : '复制链接'}
            </button>
            <p className="modal__warning">此密钥只显示一次，请立即复制</p>
            <button className="btn btn--ghost" onClick={onClose}>关闭</button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run all tests to verify nothing broke**

```bash
npm test
```
Expected: All previous tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/UserList.jsx src/components/GenerateKeyModal.jsx
git commit -m "feat: add UserList and GenerateKeyModal components"
```

---

## Task 12: AdminView Component

**Files:**
- Create: `src/components/AdminView.jsx`

- [ ] **Step 1: Implement AdminView.jsx**

```jsx
// src/components/AdminView.jsx
import { useState, useEffect } from 'react'
import { UserList } from './UserList.jsx'
import { GenerateKeyModal } from './GenerateKeyModal.jsx'
import { MessageBubble } from './MessageBubble.jsx'
import { MessageInput } from './MessageInput.jsx'
import { getAllKeys } from '../keys.js'
import { subscribeMessages, sendMessage, cleanExpiredMessages } from '../messages.js'
import { useMessageQueue } from '../hooks/useMessageQueue.js'

export function AdminView() {
  const [users, setUsers] = useState([])
  const [selectedKeyId, setSelectedKeyId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const { displayed, enqueue, removeDisplayed } = useMessageQueue()

  useEffect(() => {
    getAllKeys().then(setUsers)
  }, [])

  useEffect(() => {
    if (!selectedKeyId) return
    cleanExpiredMessages(selectedKeyId)
    const unsub = subscribeMessages(selectedKeyId, enqueue)
    return unsub
  }, [selectedKeyId])

  function handleSend(text) {
    sendMessage(selectedKeyId, text, 'admin')
  }

  function handleKeyGenerated() {
    setShowModal(false)
    getAllKeys().then(setUsers)
  }

  return (
    <div className="admin-view">
      <div className="admin-view__sidebar">
        <button className="btn btn--generate" onClick={() => setShowModal(true)}>
          + 生成密钥
        </button>
        <UserList
          users={users}
          selectedKeyId={selectedKeyId}
          onSelect={setSelectedKeyId}
        />
      </div>
      <div className="admin-view__chat">
        {selectedKeyId ? (
          <>
            <div className="messages">
              {displayed.map(msg => (
                <MessageBubble
                  key={msg.id}
                  keyId={selectedKeyId}
                  message={msg}
                  onBurned={removeDisplayed}
                />
              ))}
            </div>
            <MessageInput onSend={handleSend} />
          </>
        ) : (
          <div className="admin-view__empty">← 选择一个用户开始聊天</div>
        )}
      </div>
      {showModal && <GenerateKeyModal onClose={handleKeyGenerated} />}
    </div>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```
Expected: All previous tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/AdminView.jsx
git commit -m "feat: add AdminView component"
```

---

## Task 13: UserView Component

**Files:**
- Create: `src/components/UserView.jsx`

- [ ] **Step 1: Implement UserView.jsx**

```jsx
// src/components/UserView.jsx
import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble.jsx'
import { MessageInput } from './MessageInput.jsx'
import { subscribeMessages, sendMessage, cleanExpiredMessages } from '../messages.js'
import { useMessageQueue } from '../hooks/useMessageQueue.js'

export function UserView({ keyId }) {
  const { displayed, enqueue, removeDisplayed } = useMessageQueue()
  const bottomRef = useRef(null)

  useEffect(() => {
    cleanExpiredMessages(keyId)
    const unsub = subscribeMessages(keyId, enqueue)
    return unsub
  }, [keyId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayed])

  function handleSend(text) {
    sendMessage(keyId, text, 'user')
  }

  return (
    <div className="user-view">
      <div className="messages">
        {displayed.map(msg => (
          <MessageBubble
            key={msg.id}
            keyId={keyId}
            message={msg}
            onBurned={removeDisplayed}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={handleSend} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/UserView.jsx
git commit -m "feat: add UserView component"
```

---

## Task 14: ChatPage, App, and main

**Files:**
- Create: `src/ChatPage.jsx`
- Create: `src/App.jsx`
- Modify: `src/main.jsx`

- [ ] **Step 1: Implement ChatPage.jsx**

```jsx
// src/ChatPage.jsx
import { useState, useEffect } from 'react'
import { adminKeyMatch, adminSignIn, userSignIn } from './auth.js'
import { getKey, updateKeyLogin } from './keys.js'
import { AdminView } from './components/AdminView.jsx'
import { UserView } from './components/UserView.jsx'

export function ChatPage() {
  const params = new URLSearchParams(window.location.search)
  const key = params.get('key')

  // 'loading' | 'admin-login' | 'admin-chat' | 'user-chat' | 'error'
  const [phase, setPhase] = useState('loading')
  const [keyId, setKeyId] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!key) { setPhase('error'); return }
    ;(async () => {
      const isAdmin = await adminKeyMatch(key)
      if (isAdmin) { setPhase('admin-login'); return }

      const keyData = await getKey(key)
      if (!keyData) { setPhase('error'); return }

      const cred = await userSignIn()
      const ip = await fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(d => d.ip)
        .catch(() => 'unknown')
      await updateKeyLogin(key, cred.user.uid, ip)
      setKeyId(key)
      setPhase('user-chat')
    })()
  }, [])

  async function handleAdminLogin(e) {
    e.preventDefault()
    setLoginError('')
    setSubmitting(true)
    try {
      await adminSignIn(email, password)
      setPhase('admin-chat')
    } catch {
      setLoginError('邮箱或密码错误')
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === 'loading') return <div className="page-center">加载中...</div>
  if (phase === 'error') return <div className="page-center">无效的访问链接</div>
  if (phase === 'user-chat') return <UserView keyId={keyId} />
  if (phase === 'admin-chat') return <AdminView />
  if (phase === 'admin-login') return (
    <div className="page-center">
      <form className="login-form" onSubmit={handleAdminLogin}>
        <h1 className="login-form__title">管理员登录</h1>
        <input
          className="login-form__input"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="邮箱"
          required
          autoFocus
        />
        <input
          className="login-form__input"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="密码"
          required
        />
        {loginError && <p className="login-form__error">{loginError}</p>}
        <button
          className="btn btn--primary"
          type="submit"
          disabled={submitting}
        >
          {submitting ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Implement App.jsx**

```jsx
// src/App.jsx
import { ChatPage } from './ChatPage.jsx'

export function App() {
  const path = window.location.pathname
  if (path === '/chat') return <ChatPage />
  return <div className="page-center">404</div>
}
```

- [ ] **Step 3: Update main.jsx**

```jsx
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/ChatPage.jsx src/App.jsx src/main.jsx
git commit -m "feat: add ChatPage routing and App entry"
```

---

## Task 15: Styles

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace index.css with application styles**

```css
/* src/index.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0d1117;
  --surface: #161b22;
  --border: #30363d;
  --text: #e6edf3;
  --text-muted: #7d8590;
  --accent: #58a6ff;
  --danger: #f85149;
  --success: #3fb950;
  --bubble-admin: #1f2d3d;
  --bubble-user: #1a2d1a;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  height: 100vh;
  overflow: hidden;
}

#root { height: 100vh; display: flex; flex-direction: column; }

/* Utility */
.page-center {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: var(--text-muted);
  font-size: 1.1rem;
}

/* Buttons */
.btn {
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.15s;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: var(--accent); color: #000; font-weight: 600; }
.btn--ghost { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }
.btn--generate {
  width: 100%;
  background: transparent;
  color: var(--accent);
  border: 1px dashed var(--border);
  padding: 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}
.btn--generate:hover { border-color: var(--accent); }

/* Login form */
.login-form {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.login-form__title { font-size: 1.2rem; font-weight: 600; margin-bottom: 0.4rem; }
.login-form__input {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  padding: 0.6rem 0.8rem;
  font-size: 0.95rem;
  outline: none;
}
.login-form__input:focus { border-color: var(--accent); }
.login-form__error { color: var(--danger); font-size: 0.85rem; }

/* Admin layout */
.admin-view {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.admin-view__sidebar {
  width: 240px;
  min-width: 240px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 0.8rem;
  overflow-y: auto;
}
.admin-view__chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.admin-view__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

/* User list */
.user-list__empty { color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem; }
.user-list__item {
  padding: 0.6rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
}
.user-list__item:hover { background: rgba(255,255,255,0.04); }
.user-list__item--active { background: rgba(88,166,255,0.1); }
.user-list__name { font-weight: 500; font-size: 0.9rem; }
.user-list__meta { color: var(--text-muted); font-size: 0.75rem; margin-top: 2px; }
.user-list__ip { color: var(--text-muted); font-size: 0.7rem; font-family: monospace; }

/* User view */
.user-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* Messages area */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Message bubble */
.bubble {
  max-width: 65%;
  border-radius: 10px;
  padding: 0.6rem 0.9rem 0.4rem;
  position: relative;
}
.bubble--admin {
  background: var(--bubble-admin);
  align-self: flex-start;
  border-bottom-left-radius: 2px;
}
.bubble--user {
  background: var(--bubble-user);
  align-self: flex-end;
  border-bottom-right-radius: 2px;
}
.bubble__text { font-size: 0.95rem; line-height: 1.4; word-break: break-word; }
.bubble__burn-track {
  height: 2px;
  background: var(--border);
  border-radius: 1px;
  margin-top: 0.4rem;
  overflow: hidden;
}
.bubble__burn-bar {
  height: 100%;
  background: var(--success);
  border-radius: 1px;
  animation: burnDown linear forwards;
}

@keyframes burnDown {
  from { width: 100%; background: var(--success); }
  50% { background: #e3b341; }
  to { width: 0%; background: var(--danger); }
}

/* Input bar */
.input-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border);
  background: var(--surface);
}
.input-bar__field {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  padding: 0.55rem 0.8rem;
  font-size: 0.95rem;
  outline: none;
}
.input-bar__field:focus { border-color: var(--accent); }
.input-bar__send {
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 6px;
  padding: 0.55rem 1rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}
.input-bar__send:disabled { opacity: 0.5; cursor: not-allowed; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  width: 340px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.modal__title { font-size: 1.1rem; font-weight: 600; }
.modal__input {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  padding: 0.6rem 0.8rem;
  font-size: 0.95rem;
  outline: none;
}
.modal__input:focus { border-color: var(--accent); }
.modal__key {
  font-family: monospace;
  font-size: 0.85rem;
  background: var(--bg);
  padding: 0.6rem;
  border-radius: 6px;
  word-break: break-all;
  border: 1px solid var(--border);
}
.modal__warning { color: var(--danger); font-size: 0.8rem; }
```

- [ ] **Step 2: Verify styles compile**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add dark theme styles with burn-bar animation"
```

---

## Task 16: Firebase Security Rules

**Files:**
- Create: `database.rules.json`

- [ ] **Step 1: Create database.rules.json**

Replace `ADMIN_EMAIL_HERE` with the actual admin Firebase Auth email before deploying.

```json
{
  "rules": {
    "keys": {
      "$keyId": {
        ".read": "auth != null && (auth.uid == root.child('keys').child($keyId).child('uid').val() || auth.token.email == 'ADMIN_EMAIL_HERE')",
        ".write": "auth != null && auth.token.email == 'ADMIN_EMAIL_HERE'"
      }
    },
    "chats": {
      "$keyId": {
        ".read": "auth != null && (auth.uid == root.child('keys').child($keyId).child('uid').val() || auth.token.email == 'ADMIN_EMAIL_HERE')",
        ".write": "auth != null && (auth.uid == root.child('keys').child($keyId).child('uid').val() || auth.token.email == 'ADMIN_EMAIL_HERE')"
      }
    }
  }
}
```

- [ ] **Step 2: Deploy rules to Firebase**

In Firebase Console → Realtime Database → Rules tab, paste the contents of `database.rules.json` (with the real admin email substituted) and click **Publish**.

- [ ] **Step 3: Commit**

```bash
git add database.rules.json
git commit -m "feat: add Firebase Realtime DB security rules"
```

---

## Task 17: Deployment Config

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json for SPA routing**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Run final build**

```bash
npm run build
```
Expected: `dist/` directory created, no errors.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel SPA rewrite config"
```

- [ ] **Step 5: Deploy to Vercel**

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy (first time: follow prompts to link project)
vercel --prod
```

In Vercel dashboard → Project Settings → Environment Variables, add all variables from `.env.example` with real values.

- [ ] **Step 6: Verify deployment**

Visit `https://your-project.vercel.app/chat?key=YOUR_ADMIN_KEY`.
- Expected: Admin login form appears
- Log in → admin panel with user list and "生成密钥" button
- Generate a user key → visit `/chat?key=<generated_key>` in another browser → user chat view appears
- Send a message from admin → appears in user view after 1s stagger, burns in 10s

---

## Self-Review

**Spec coverage check:**
- ✅ Single `/chat` route, all other paths → 404
- ✅ Admin key SHA1 check → Firebase Auth login
- ✅ User key → DB lookup → Anonymous Auth → IP/time logging
- ✅ Messages stored in Firebase Realtime DB
- ✅ 10s burn timer with elapsed-time accounting
- ✅ 1s stagger queue for message display
- ✅ Admin panel: user list with name/lastLogin/IP
- ✅ Key generation modal (displayed once)
- ✅ Firebase Security Rules scoping access per keyId
- ✅ `cleanExpiredMessages` on page load
- ✅ Vercel SPA deployment

**No placeholders:** All steps contain actual code.

**Type consistency:** `deleteMessage(keyId, msgId)` used consistently across `useBurnTimer`, `messages.js` tests, and spec.
