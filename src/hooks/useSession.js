import { useEffect, useRef } from 'react'
import { db } from '../firebase.js'
import { ref, set, onValue, onDisconnect, remove } from 'firebase/database'

function randomId() {
  return Math.random().toString(36).slice(2, 10)
}

export function useSession(keyId, onKicked) {
  const sessionId = useRef(randomId())

  useEffect(() => {
    if (!keyId) return
    const sid = sessionId.current
    const sessionRef = ref(db, `chats/${keyId}/session`)

    set(sessionRef, { sid, at: Date.now() })
    onDisconnect(sessionRef).remove()

    const unsub = onValue(sessionRef, (snap) => {
      if (!snap.exists()) return
      if (snap.val().sid !== sid) onKicked()
    })

    return () => {
      unsub()
      remove(sessionRef)
    }
  }, [keyId])
}
