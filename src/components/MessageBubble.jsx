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
