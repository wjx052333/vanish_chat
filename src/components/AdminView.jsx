import { useState, useEffect } from 'react'
import { UserList } from './UserList.jsx'
import { GenerateKeyModal } from './GenerateKeyModal.jsx'
import { MessageBubble } from './MessageBubble.jsx'
import { MessageInput } from './MessageInput.jsx'
import { getAllKeys } from '../keys.js'
import { subscribeMessages, sendMessage, cleanExpiredMessages } from '../messages.js'
import { useMessageQueue } from '../hooks/useMessageQueue.js'

export function AdminView() {
  const [users, setUsers] = useState([])
  const [selectedKeyId, setSelectedKeyId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const { displayed, enqueue, removeDisplayed } = useMessageQueue()

  useEffect(() => {
    getAllKeys().then(setUsers)
  }, [])

  useEffect(() => {
    if (!selectedKeyId) return
    cleanExpiredMessages(selectedKeyId)
    const unsub = subscribeMessages(selectedKeyId, enqueue)
    return unsub
  }, [selectedKeyId])

  function handleSend(text) {
    sendMessage(selectedKeyId, text, 'admin')
  }

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
          <>
            <div className="messages">
              {displayed.map(msg => (
                <MessageBubble
                  key={msg.id}
                  keyId={selectedKeyId}
                  message={msg}
                  onBurned={removeDisplayed}
                />
              ))}
            </div>
            <MessageInput onSend={handleSend} />
          </>
        ) : (
          <div className="admin-view__empty">← 选择一个用户开始聊天</div>
        )}
      </div>
      {showModal && <GenerateKeyModal onClose={handleKeyGenerated} />}
    </div>
  )
}
