import { useState } from 'react'

export function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <form className="input-bar" onSubmit={handleSubmit}>
      <input
        className="input-bar__field"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="输入消息..."
        disabled={disabled}
        autoComplete="off"
      />
      <button
        className="input-bar__send"
        type="submit"
        disabled={disabled || !text.trim()}
      >
        发送
      </button>
    </form>
  )
}
