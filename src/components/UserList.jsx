// src/components/UserList.jsx
export function UserList({ users, selectedKeyId, onSelect }) {
  return (
    <div className="user-list">
      {users.length === 0 && (
        <p className="user-list__empty">暂无用户</p>
      )}
      {users.map(user => (
        <div
          key={user.id}
          className={`user-list__item ${user.id === selectedKeyId ? 'user-list__item--active' : ''}`}
          onClick={() => onSelect(user.id)}
        >
          <div className="user-list__name">{user.username}</div>
          <div className="user-list__meta">
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleString('zh-CN')
              : '从未登录'}
          </div>
          {user.lastLoginIp && (
            <div className="user-list__ip">{user.lastLoginIp}</div>
          )}
        </div>
      ))}
    </div>
  )
}
