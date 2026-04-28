'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

const CTA_PRESETS = [
  { label: 'Comprar agora', color: '#FF0066' },
  { label: 'Ver oferta', color: '#FF4500' },
  { label: 'Entrar hoje', color: '#6C5CE7' },
  { label: 'Últimas vagas', color: '#E17055' },
  { label: 'Acessar promoção', color: '#00B894' },
]

export default function Stories() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [ctaText, setCtaText] = useState('Comprar agora')
  const [buttonColor, setButtonColor] = useState('#FF0066')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(d => setAccounts(d.accounts || []))
  }, [])

  const toggleAccount = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const publish = async () => {
    if (!imageUrl || !selected.length) return
    setLoading(true)
    setResults([])
    const res = await fetch('/api/publish/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountIds: selected, imageUrl, linkUrl, ctaText, buttonColor, textColor: '#FFFFFF' }),
    })
    const data = await res.json()
    setResults(data.results || [])
    setLoading(false)
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <h1 className="page-title">Stories</h1>
        <p className="page-sub">Publique Stories com link e CTA customizado</p>

        <div className="grid grid-2" style={{ gap: 24 }}>
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>Conteúdo</h3>
              <div className="field">
                <label>URL da imagem do Story</label>
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://exemplo.com/story.jpg" />
              </div>
              <div className="field">
                <label>Link de destino (URL de venda)</label>
                <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://seu-site.com/oferta" />
              </div>

              <div className="field">
                <label>CTA — Texto do botão</label>
                <input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Comprar agora" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ marginBottom: 8, display: 'block' }}>Presets de CTA</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CTA_PRESETS.map(p => (
                    <button
                      key={p.label}
                      className="btn"
                      style={{ background: p.color, color: 'white', fontSize: 12, padding: '6px 12px', opacity: ctaText === p.label ? 1 : 0.6 }}
                      onClick={() => { setCtaText(p.label); setButtonColor(p.color) }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Cor do botão</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={buttonColor} onChange={e => setButtonColor(e.target.value)} style={{ width: 48, height: 40, padding: 4, cursor: 'pointer' }} />
                  <input value={buttonColor} onChange={e => setButtonColor(e.target.value)} style={{ flex: 1 }} />
                </div>
              </div>
            </div>

            {/* Preview do CTA */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>Preview do CTA</h3>
              <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: '100%', height: 120, background: 'var(--surface2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  {imageUrl ? '✓ Imagem configurada' : 'Prévia da imagem'}
                </div>
                <button style={{ background: buttonColor, color: 'white', border: 'none', borderRadius: 24, padding: '10px 32px', fontWeight: 800, fontSize: 14, cursor: 'default', fontFamily: 'Arial Black, sans-serif', letterSpacing: 1 }}>
                  {ctaText.toUpperCase()}
                </button>
                {linkUrl && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{linkUrl.replace(/^https?:\/\//, '')}</span>}
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 14 }}
              onClick={publish}
              disabled={loading || !imageUrl || !selected.length}
            >
              {loading ? '⏳ Publicando...' : `🚀 Publicar Story em ${selected.length} conta(s)`}
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
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setSelected(selected.length === accounts.length ? [] : accounts.map(a => a.id))}>
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
                  <div key={acc.id} className={`account-card ${selected.includes(acc.id) ? 'selected' : ''}`} onClick={() => toggleAccount(acc.id)}>
                    <div className="account-avatar">{acc.username?.[0]?.toUpperCase()}</div>
                    <div className="account-info"><div className="account-name">@{acc.username}</div></div>
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
