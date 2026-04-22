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
