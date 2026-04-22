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
