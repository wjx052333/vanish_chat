import { useState, useEffect } from 'react'
import { UserList } from './UserList.jsx'
import { GenerateKeyModal } from './GenerateKeyModal.jsx'
import { MessageBubble } from './MessageBubble.jsx'
import { MessageInput } from './MessageInput.jsx'
import { getAllKeys, deleteKey } from '../keys.js'
import { subscribeMessages, subscribeMessageUpdates, sendMessage, cleanExpiredMessages } from '../messages.js'

function ChatPanel({ keyId }) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    cleanExpiredMessages(keyId)
    const unsubAdd = subscribeMessages(keyId, (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })
    const unsubChange = subscribeMessageUpdates(keyId, (msg) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
    })
    return () => { unsubAdd(); unsubChange() }
  }, [keyId])

  return (
    <>
      <div className="messages">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            keyId={keyId}
            message={msg}
            adminView
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

  function refreshUsers() {
    getAllKeys().then(setUsers)
  }

  function handleModalClose() {
    setShowModal(false)
  }

  async function handleDelete(keyId) {
    await deleteKey(keyId)
    if (selectedKeyId === keyId) setSelectedKeyId(null)
    setUsers(prev => prev.filter(u => u.id !== keyId))
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
          onDelete={handleDelete}
        />
      </div>
      <div className="admin-view__chat">
        {selectedKeyId ? (
          <ChatPanel key={selectedKeyId} keyId={selectedKeyId} />
        ) : (
          <div className="admin-view__empty">← 选择一个用户开始聊天</div>
        )}
      </div>
      {showModal && <GenerateKeyModal onClose={handleModalClose} onKeyCreated={refreshUsers} />}
    </div>
  )
}
