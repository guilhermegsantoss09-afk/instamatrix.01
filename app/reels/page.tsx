'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

export default function Reels() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(d => setAccounts(d.accounts || []))
  }, [])

  const toggleAccount = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const selectAll = () => {
    setSelected(selected.length === accounts.length ? [] : accounts.map(a => a.id))
  }

  const publish = async () => {
    if (!videoUrl || !selected.length) return
    setLoading(true)
    setResults([])
    const res = await fetch('/api/publish/reel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountIds: selected, videoUrl, caption }),
    })
    const data = await res.json()
    setResults(data.results || [])
    setLoading(false)
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <h1 className="page-title">Reels</h1>
        <p className="page-sub">Publique Reels em múltiplas contas simultaneamente</p>

        <div className="grid grid-2" style={{ gap: 24 }}>
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>Vídeo</h3>
              <div className="field">
                <label>URL do vídeo (Reels)</label>
                <input
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://exemplo.com/video.mp4"
                />
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                  O vídeo deve estar hospedado publicamente (Dropbox, Drive, etc.)
                </p>
              </div>
              <div className="field">
                <label>Legenda</label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Escreva a legenda do Reel..."
                  rows={4}
                />
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 14 }}
              onClick={publish}
              disabled={loading || !videoUrl || !selected.length}
            >
              {loading ? '⏳ Publicando...' : `🚀 Publicar em ${selected.length} conta(s)`}
            </button>

            {results.length > 0 && (
              <div className="card" style={{ marginTop: 16 }}>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 12 }}>Resultados</h3>
                {results.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14 }}>@{r.account}</span>
                    <span className={`badge badge-${r.status === 'published' ? 'success' : 'error'}`}>
                      {r.status === 'published' ? '✓ Publicado' : '✗ Erro'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700 }}>Selecionar contas</h3>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={selectAll}>
                {selected.length === accounts.length ? 'Desmarcar' : 'Todas'}
              </button>
            </div>
            {!accounts.length ? (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                <a href="/contas" style={{ color: 'var(--accent)' }}>Conecte uma conta primeiro →</a>
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {accounts.map(acc => (
                  <div
                    key={acc.id}
                    className={`account-card ${selected.includes(acc.id) ? 'selected' : ''}`}
                    onClick={() => toggleAccount(acc.id)}
                  >
                    <div className="account-avatar">{acc.username?.[0]?.toUpperCase()}</div>
                    <div className="account-info">
                      <div className="account-name">@{acc.username}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected.includes(acc.id) ? 'var(--accent)' : 'var(--border)'}`, background: selected.includes(acc.id) ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      {selected.includes(acc.id) && '✓'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
