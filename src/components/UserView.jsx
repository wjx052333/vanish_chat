// src/components/UserView.jsx
import { useEffect, useRef, useState } from 'react'
import { MessageBubble } from './MessageBubble.jsx'
import { MessageInput } from './MessageInput.jsx'
import { subscribeMessages, sendMessage, cleanExpiredMessages } from '../messages.js'
import { useMessageQueue } from '../hooks/useMessageQueue.js'
import { useSession } from '../hooks/useSession.js'

export function UserView({ keyId }) {
  const { displayed, enqueue, removeDisplayed } = useMessageQueue()
  const bottomRef = useRef(null)
  const [kicked, setKicked] = useState(false)
  useSession(keyId, () => setKicked(true))

  useEffect(() => {
    cleanExpiredMessages(keyId)
    const unsub = subscribeMessages(keyId, enqueue)
    return unsub
  }, [keyId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayed])

  function handleSend(text) {
    sendMessage(keyId, text, 'user')
  }

  if (kicked) return (
    <div className="page-center">此链接已在其他设备打开，当前会话已断开</div>
  )

  return (
    <div className="user-view">
      <div className="messages">
        {displayed.map(msg => (
          <MessageBubble
            key={msg.id}
            keyId={keyId}
            message={msg}
            onBurned={removeDisplayed}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={handleSend} />
    </div>
  )
}
