import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = createClient()
  const { data: accounts } = await supabase.from('accounts').select('*')
  const { data: posts } = await supabase.from('posts_queue').select('*')

  const published = posts?.filter(p => p.status === 'published').length || 0
  const failed = posts?.filter(p => p.status === 'failed').length || 0
  const total = accounts?.length || 0

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Visão geral do seu gerenciador</p>

        <div className="grid grid-4" style={{ marginBottom: 32 }}>
          <div className="card stat-card">
            <div className="stat-number" style={{ color: 'var(--accent)' }}>{total}</div>
            <div className="stat-label">Contas conectadas</div>
          </div>
          <div className="card stat-card">
            <div className="stat-number">{posts?.length || 0}</div>
            <div className="stat-label">Posts enviados</div>
          </div>
          <div className="card stat-card">
            <div className="stat-number" style={{ color: 'var(--success)' }}>{published}</div>
            <div className="stat-label">Publicados</div>
          </div>
          <div className="card stat-card">
            <div className="stat-number" style={{ color: 'var(--error)' }}>{failed}</div>
            <div className="stat-label">Com erro</div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Contas ativas
          </h2>
          {!accounts?.length ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              Nenhuma conta conectada.{' '}
              <a href="/contas" style={{ color: 'var(--accent)' }}>Conectar agora →</a>
            </p>
          ) : (
            <div className="grid grid-3">
              {accounts.map(acc => (
                <div key={acc.id} className="account-card">
                  <div className="account-avatar">
                    {acc.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="account-info">
                    <div className="account-name">{acc.display_name || acc.username}</div>
                    <div className="account-username">@{acc.username}</div>
                  </div>
                  <span className="badge badge-success">Ativa</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
