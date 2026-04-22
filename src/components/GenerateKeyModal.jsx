// src/components/GenerateKeyModal.jsx
import { useState } from 'react'
import { createKey } from '../keys.js'

export function GenerateKeyModal({ onClose, onKeyCreated }) {
  const [username, setUsername] = useState('')
  const [generatedKey, setGeneratedKey] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!username.trim()) return
    setLoading(true)
    const key = await createKey(username.trim())
    setGeneratedKey(key)
    setLoading(false)
    onKeyCreated?.()
  }

  async function handleCopy() {
    const url = `${window.location.origin}/chat?key=${generatedKey}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {!generatedKey ? (
          <>
            <h2 className="modal__title">生成新密钥</h2>
            <input
              className="modal__input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="用户名"
              autoFocus
            />
            <button
              className="btn btn--primary"
              onClick={handleGenerate}
              disabled={!username.trim() || loading}
            >
              {loading ? '生成中...' : '生成'}
            </button>
          </>
        ) : (
          <>
            <h2 className="modal__title">密钥已生成</h2>
            <p className="modal__key">{generatedKey}</p>
            <button className="btn btn--primary" onClick={handleCopy}>
              {copied ? '已复制!' : '复制链接'}
            </button>
            <p className="modal__warning">此密钥只显示一次，请立即复制</p>
            <button className="btn btn--ghost" onClick={onClose}>关闭</button>
          </>
        )}
      </div>
    </div>
  )
}
