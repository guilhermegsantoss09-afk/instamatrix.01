import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLongLivedToken, getInstagramAccounts, getPageToken } from '@/lib/meta'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/contas?error=oauth_failed', request.url))
  }

  // Trocar code por short-lived token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v25.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${process.env.META_REDIRECT_URI}&code=${code}`
  )
  const { access_token: shortToken } = await tokenRes.json()

  if (!shortToken) {
    return NextResponse.redirect(new URL('/contas?error=token_failed', request.url))
  }

  // Trocar por long-lived token (60 dias)
  const longTokenData = await getLongLivedToken(shortToken)
  const longToken = longTokenData.access_token

  // Buscar contas do Instagram vinculadas
  const accountsData = await getInstagramAccounts(longToken)
  const pages = accountsData.data || []

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Salvar cada conta no Supabase
  for (const page of pages) {
    const igAccount = page.instagram_business_account
    if (!igAccount) continue

    // Pegar token da página (não expira)
    const pageTokenData = await getPageToken(page.id, longToken)

    await supabase.from('accounts').upsert({
      user_id: user.id,
      instagram_id: igAccount.id,
      username: igAccount.username,
      display_name: igAccount.name,
      profile_picture: igAccount.profile_picture_url,
      access_token: longToken,
      token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      page_id: page.id,
      page_access_token: pageTokenData.access_token,
    }, { onConflict: 'instagram_id' })
  }

  return NextResponse.redirect(new URL('/contas?success=connected', request.url))
}
