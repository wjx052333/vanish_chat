import { ChatPage } from './ChatPage.jsx'

export function App() {
  const path = window.location.pathname
  if (path === '/chat') return <ChatPage />
  return <div className="page-center">404</div>
}
