// src/components/UserView.jsx
import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble.jsx'
import { MessageInput } from './MessageInput.jsx'
import { subscribeMessages, sendMessage, cleanExpiredMessages } from '../messages.js'
import { useMessageQueue } from '../hooks/useMessageQueue.js'

export function UserView({ keyId }) {
  const { displayed, enqueue, removeDisplayed } = useMessageQueue()
  const bottomRef = useRef(null)

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
