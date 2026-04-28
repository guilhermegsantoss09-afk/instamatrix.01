import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Buscar contas com token expirando em menos de 7 dias
  const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .lt('token_expires_at', sevenDays)

  const results = []

  for (const account of accounts || []) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${account.access_token}`
      )
      const { access_token } = await res.json()

      if (access_token) {
        await supabase
          .from('accounts')
          .update({
            access_token,
            token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', account.id)

        results.push({ account: account.username, status: 'refreshed' })
      }
    } catch {
      results.push({ account: account.username, status: 'failed' })
    }
  }

  return NextResponse.json({ results })
}
