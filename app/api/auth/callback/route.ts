import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  const tokenData = await tokenRes.json()
  const shortToken = tokenData.access_token

  if (!shortToken) {
    return NextResponse.redirect(new URL('/contas?error=token_failed', request.url))
  }

  // Trocar por long-lived token (60 dias)
  const longTokenRes = await fetch(
    `https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${shortToken}`
  )
  const longTokenData = await longTokenRes.json()
  const longToken = longTokenData.access_token

  if (!longToken) {
    return NextResponse.redirect(new URL('/contas?error=token_failed', request.url))
  }

  // Buscar páginas do usuário com instagram_business_account
  const pagesRes = await fetch(
    `https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username,profile_picture_url}&access_token=${longToken}`
  )
  const pagesData = await pagesRes.json()
  const pages = pagesData.data || []

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let savedCount = 0

  for (const page of pages) {
    const igAccount = page.instagram_business_account
    if (!igAccount) continue

    await supabase.from('accounts').upsert({
      user_id: user.id,
      instagram_id: igAccount.id,
      username: igAccount.username,
      display_name: igAccount.name,
      profile_picture: igAccount.profile_picture_url,
      access_token: longToken,
      token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      page_id: page.id,
      page_access_token: page.access_token,
    }, { onConflict: 'instagram_id' })

    savedCount++
  }

  if (savedCount === 0) {
    return NextResponse.redirect(new URL('/contas?error=no_instagram_account', request.url))
  }

  return NextResponse.redirect(new URL('/contas?success=connected', request.url))
}
