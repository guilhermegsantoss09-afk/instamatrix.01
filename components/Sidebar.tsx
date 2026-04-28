'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬛' },
  { href: '/contas', label: 'Contas', icon: '👤' },
  { href: '/reels', label: 'Reels', icon: '🎬' },
  { href: '/stories', label: 'Stories', icon: '⭕' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="sidebar">
      <div className="logo">InstaMatrix</div>
      <nav className="nav">
        {links.map(l => (
          <Link key={l.href} href={l.href} className={path.startsWith(l.href) ? 'active' : ''}>
            <span>{l.icon}</span> {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
