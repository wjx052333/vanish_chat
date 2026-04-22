import { useState, useRef, useCallback } from 'react'

export function useMessageQueue() {
  const [displayed, setDisplayed] = useState([])
  const queue = useRef([])
  const processing = useRef(false)

  const processNext = useCallback(() => {
    if (queue.current.length === 0) {
      processing.current = false
      return
    }
    const msg = queue.current.shift()
    setDisplayed(prev => [...prev, msg])
    setTimeout(processNext, 1000)
  }, [])

  const enqueue = useCallback((message) => {
    queue.current.push(message)
    if (!processing.current) {
      processing.current = true
      processNext()
    }
  }, [processNext])

  const removeDisplayed = useCallback((id) => {
    setDisplayed(prev => prev.filter(m => m.id !== id))
  }, [])

  return { displayed, enqueue, removeDisplayed }
}
