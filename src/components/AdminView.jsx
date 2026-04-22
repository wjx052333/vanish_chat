import { useState, useEffect } from 'react'
import { UserList } from './UserList.jsx'
import { GenerateKeyModal } from './GenerateKeyModal.jsx'
import { MessageBubble } from './MessageBubble.jsx'
import { MessageInput } from './MessageInput.jsx'
import { getAllKeys } from '../keys.js'
import { subscribeMessages, sendMessage, cleanExpiredMessages } from '../messages.js'
import { useMessageQueue } from '../hooks/useMessageQueue.js'

function ChatPanel({ keyId }) {
  const { displayed, enqueue, removeDisplayed } = useMessageQueue()

  useEffect(() => {
    cleanExpiredMessages(keyId)
    const unsub = subscribeMessages(keyId, enqueue)
    return unsub
  }, [keyId])

  return (
    <>
      <div className="messages">
        {displayed.map(msg => (
          <MessageBubble
            key={msg.id}
            keyId={keyId}
            message={msg}
            onBurned={removeDisplayed}
          />
        ))}
      </div>
      <MessageInput onSend={text => sendMessage(keyId, text, 'admin')} />
    </>
  )
}

export function AdminView() {
  const [users, setUsers] = useState([])
  const [selectedKeyId, setSelectedKeyId] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    getAllKeys().then(setUsers)
  }, [])

  function handleKeyGenerated() {
    setShowModal(false)
    getAllKeys().then(setUsers)
  }

  return (
    <div className="admin-view">
      <div className="admin-view__sidebar">
        <button className="btn btn--generate" onClick={() => setShowModal(true)}>
          + 生成密钥
        </button>
        <UserList
          users={users}
          selectedKeyId={selectedKeyId}
          onSelect={setSelectedKeyId}
        />
      </div>
      <div className="admin-view__chat">
        {selectedKeyId ? (
          <ChatPanel key={selectedKeyId} keyId={selectedKeyId} />
        ) : (
          <div className="admin-view__empty">← 选择一个用户开始聊天</div>
        )}
      </div>
      {showModal && <GenerateKeyModal onClose={handleKeyGenerated} />}
    </div>
  )
}
