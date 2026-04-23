import { useEffect } from 'react'
import { burnMessage, MESSAGE_TTL } from '../messages.js'

export function useBurnTimer(keyId, message, onBurned) {
  useEffect(() => {
    if (!keyId || !message) return
    const timer = setTimeout(async () => {
      await burnMessage(keyId, message.id)
      onBurned(message.id)
    }, MESSAGE_TTL)
    return () => clearTimeout(timer)
  }, [message?.id])
}
