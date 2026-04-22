# Burn-After-Reading Chat — Design Spec

Date: 2026-04-22

## Overview

A single-page web app for ephemeral one-on-one chat between an admin and multiple users. Every message auto-deletes after 10 seconds. No backend server required — purely static frontend (React + Vite) deployed to Vercel, backed by Firebase.

---

## Architecture

**Stack:**
- React + Vite (static frontend, deployed to Vercel)
- Firebase Realtime Database (messages + user keys + login logs)
- Firebase Authentication (Email/Password for admin; Anonymous for users)
- api.ipify.org (client-side IP detection on user login)

**Environment variables (compiled into bundle, Vite):**
- `VITE_FIREBASE_*` — Firebase project config
- `VITE_ADMIN_KEY` — the SHA1 hash of the admin key string
- `VITE_ADMIN_EMAIL` / `VITE_ADMIN_PASSWORD` — Firebase Auth credentials for admin

---

## Routing

Only one public route: `/chat?key=<key>`

All other paths (`/`, `/admin`, etc.) render a blank 404 page — no entry points exposed.

---

## Authentication Flow

### Admin
1. Visit `/chat?key=<admin_key>`
2. Frontend computes SHA1 of `admin_key`, compares to `VITE_ADMIN_KEY`
3. If match → show username/password login form
4. User submits → `signInWithEmailAndPassword(email, password)`
5. Firebase Auth session established → render admin view

### User
1. Visit `/chat?key=<user_key>`
2. Frontend reads `/keys/<user_key>` from Firebase DB
3. If key exists → `signInAnonymously()` → store anonymous UID back to `/keys/<user_key>/uid`
4. Fetch client IP from `api.ipify.org` → write to `/keys/<user_key>/lastLoginAt` and `lastLoginIp`
5. Render user chat view

---

## Firebase Data Structure

```
/keys/{keyId}
  username:      string
  createdAt:     timestamp
  uid:           string (anonymous UID, set on first login)
  lastLoginAt:   timestamp
  lastLoginIp:   string

/chats/{keyId}/messages/{msgId}
  text:          string
  sender:        "admin" | "user"
  createdAt:     timestamp
```

No `expiresAt` field needed — expiry is computed as `createdAt + 10000ms` client-side.

---

## Firebase Security Rules

```json
{
  "rules": {
    "keys": {
      "$keyId": {
        ".read": "auth != null && (auth.uid == root.child('keys').child($keyId).child('uid').val() || auth.token.email == 'ADMIN_EMAIL')",
        ".write": "auth != null && auth.token.email == 'ADMIN_EMAIL'"
      }
    },
    "chats": {
      "$keyId": {
        ".read": "auth != null && (auth.uid == root.child('keys').child($keyId).child('uid').val() || auth.token.email == 'ADMIN_EMAIL')",
        ".write": "auth != null && (auth.uid == root.child('keys').child($keyId).child('uid').val() || auth.token.email == 'ADMIN_EMAIL')"
      }
    }
  }
}
```

---

## Message Lifecycle

**Sending:** Message written to `/chats/{keyId}/messages/{msgId}` with `createdAt = Date.now()`.

**Receiving:** Firebase `onChildAdded` listener fires. Message enters a local display queue.

**Display queue:** Messages render one at a time with 1s interval between each. Even if 100 messages arrive at once, they appear over 100 seconds.

**Burn timer:** When a message renders on screen, a 10s countdown progress bar starts. At 0, `firebase.remove()` deletes the node. Both admin and user run the timer — first to reach 0 deletes.

**On page load / reconnect:** Query all messages for the key. Filter out any where `createdAt < Date.now() - 10000`. Batch-delete expired nodes silently, never render them.

---

## UI

### User View (`/chat?key=<user_key>`)
- Full-screen chat: scrollable message list + input bar at bottom
- Each message bubble has a thin countdown progress bar (10s, red near end)
- Messages slide in from the queue one by one (1s stagger)
- No message history visible after 10s

### Admin View (`/chat?key=<admin_key>` after login)
- Left sidebar: list of all users (username, last login time, IP, unread count)
- Right panel: selected user's chat thread, same burn mechanics as user view
- Top bar: "Generate Key" button — opens a modal, admin enters username → generates random 32-char key → displays once for copying (never shown again)

---

## Key Generation

- 32-character random alphanumeric string
- Written to `/keys/{keyId}` by admin (Firebase Auth session allows this)
- Displayed once in a copy modal — not stored in plaintext anywhere retrievable

---

## Security Considerations

- SHA1 admin key check is frontend-only (client-side, extractable from bundle) — serves as UX gate only
- Real security enforcement is Firebase Auth + Security Rules (server-side, cannot be bypassed)
- Anonymous user sessions are scoped to their keyId via Security Rules
- IP logging is client-reported (via api.ipify.org) — spoofable but sufficient for audit purposes
- Messages live max 10s in Firebase; even a direct DB query window is narrow

---

## Deployment

1. Create Firebase project, enable Realtime Database + Auth (Email/Password)
2. Create admin Firebase Auth user in Firebase Console
3. Set Firebase Security Rules (see above)
4. Set Vite env vars in Vercel project settings
5. `vite build` → deploy `dist/` to Vercel as static site
