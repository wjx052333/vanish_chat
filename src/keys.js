// src/keys.js
import { db } from './firebase.js'
import { ref, get, set, update } from 'firebase/database'

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
  await update(ref(db, `keys/${keyId}`), {
    uid,
    lastLoginAt: Date.now(),
    lastLoginIp: ip,
  })
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
