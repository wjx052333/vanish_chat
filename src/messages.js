import { db } from './firebase.js'
import { ref, push, update, onChildAdded, onChildChanged, remove, get } from 'firebase/database'

export const MESSAGE_TTL = 10000

export function sendMessage(keyId, text, sender) {
  return push(ref(db, `chats/${keyId}/messages`), {
    text,
    sender,
    createdAt: Date.now(),
  })
}

// Subscribe to new messages (for user and admin)
export function subscribeMessages(keyId, onMessage) {
  return onChildAdded(ref(db, `chats/${keyId}/messages`), (snap) => {
    onMessage({ id: snap.key, ...snap.val() })
  })
}

// Subscribe to message updates (for admin to see burnedAt changes in real time)
export function subscribeMessageUpdates(keyId, onUpdate) {
  return onChildChanged(ref(db, `chats/${keyId}/messages`), (snap) => {
    onUpdate({ id: snap.key, ...snap.val() })
  })
}

// Mark a message as burned (user has read it) instead of deleting
export function burnMessage(keyId, msgId) {
  return update(ref(db, `chats/${keyId}/messages/${msgId}`), { burnedAt: Date.now() })
}

export async function cleanExpiredMessages(keyId) {
  const snap = await get(ref(db, `chats/${keyId}/messages`))
  if (!snap.exists()) return
  const deletions = []
  snap.forEach((child) => {
    if (child.val().burnedAt) {
      deletions.push(remove(ref(db, `chats/${keyId}/messages/${child.key}`)))
    }
  })
  await Promise.all(deletions)
}
