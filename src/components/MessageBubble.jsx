import { useBurnTimer } from '../hooks/useBurnTimer.js'
import { MESSAGE_TTL } from '../messages.js'

export function MessageBubble({ keyId, message, onBurned, adminView = false, skipBurn = false }) {
  const noTimer = adminView || skipBurn
  useBurnTimer(noTimer ? null : keyId, noTimer ? null : message, onBurned ?? (() => {}))

  const elapsed = Date.now() - message.createdAt
  const remaining = Math.max(0, MESSAGE_TTL - elapsed)
  const isAdminSender = message.sender === 'admin'
  const burned = Boolean(message.burnedAt)

  return (
    <div className={`bubble ${isAdminSender ? 'bubble--admin' : 'bubble--user'} ${burned ? 'bubble--burned' : ''}`}>
      <p className="bubble__text">{message.text}</p>
      {adminView ? (
        <div className="bubble__status">{burned ? '已阅' : '未读'}</div>
      ) : (
        <div className="bubble__burn-track">
          <div
            className="bubble__burn-bar"
            style={{ animationDuration: `${remaining}ms` }}
          />
        </div>
      )}
    </div>
  )
}
