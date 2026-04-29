import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function Contas() {
  const supabase = createClient()
  const { data: accounts } = await supabase.from('accounts').select('*')

  const oauthUrl = `https://www.facebook.com/v25.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.META_REDIRECT_URI}&scope=pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,instagram_manage_comments,business_management&response_type=code`

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 className="page-title">Contas</h1>
            <p className="page-sub">{accounts?.length || 0}/10 contas conectadas</p>
          </div>
          <a href={oauthUrl} className="btn btn-primary">
            + Adicionar conta
          </a>
        </div>
        {!accounts?.length ? (
          <div className="card" style={{ textAlign: 'center', padding: 64 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Nenhuma conta conectada
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
              Conecte suas contas do Instagram para começar a publicar
            </p>
            <a href={oauthUrl} className="btn btn-primary">
              Conectar Instagram
            </a>
          </div>
        ) : (
          <div className="grid grid-3">
            {accounts.map(acc => (
              <div key={acc.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div className="account-avatar">
                    {acc.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="account-info">
                    <div className="account-name">{acc.display_name || acc.username}</div>
                    <div className="account-username">@{acc.username}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-success">● Ativa</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Expira: {acc.token_expires_at ? new Date(acc.token_expires_at).toLocaleDateString('pt-BR') : 'Nunca'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
