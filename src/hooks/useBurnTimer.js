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
