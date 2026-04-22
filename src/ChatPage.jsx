import { useState, useEffect } from 'react'
import { adminKeyMatch, adminSignIn, userSignIn } from './auth.js'
import { getKey, updateKeyLogin } from './keys.js'
import { AdminView } from './components/AdminView.jsx'
import { UserView } from './components/UserView.jsx'

export function ChatPage() {
  const params = new URLSearchParams(window.location.search)
  const key = params.get('key')

  // 'loading' | 'admin-login' | 'admin-chat' | 'user-chat' | 'error'
  const [phase, setPhase] = useState('loading')
  const [keyId, setKeyId] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!key) { setPhase('error'); return }
    ;(async () => {
      const isAdmin = await adminKeyMatch(key)
      if (isAdmin) { setPhase('admin-login'); return }

      const keyData = await getKey(key)
      if (!keyData) { setPhase('error'); return }

      const cred = await userSignIn()
      const ip = await fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(d => d.ip)
        .catch(() => 'unknown')
      await updateKeyLogin(key, cred.user.uid, ip)
      setKeyId(key)
      setPhase('user-chat')
    })()
  }, [])

  async function handleAdminLogin(e) {
    e.preventDefault()
    setLoginError('')
    setSubmitting(true)
    try {
      await adminSignIn(email, password)
      setPhase('admin-chat')
    } catch {
      setLoginError('邮箱或密码错误')
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === 'loading') return <div className="page-center">加载中...</div>
  if (phase === 'error') return <div className="page-center">无效的访问链接</div>
  if (phase === 'user-chat') return <UserView keyId={keyId} />
  if (phase === 'admin-chat') return <AdminView />
  if (phase === 'admin-login') return (
    <div className="page-center">
      <form className="login-form" onSubmit={handleAdminLogin}>
        <h1 className="login-form__title">管理员登录</h1>
        <input
          className="login-form__input"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="邮箱"
          required
          autoFocus
        />
        <input
          className="login-form__input"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="密码"
          required
        />
        {loginError && <p className="login-form__error">{loginError}</p>}
        <button
          className="btn btn--primary"
          type="submit"
          disabled={submitting}
        >
          {submitting ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  )
}
