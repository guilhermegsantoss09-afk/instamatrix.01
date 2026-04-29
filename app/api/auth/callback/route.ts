import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/contas?error=oauth_failed', request.url))
  }

  // Trocar code por short-lived token via API do Instagram
  const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri: process.env.META_REDIRECT_URI!,
      code,
    }),
  })

  const tokenData = await tokenRes.json()
  const shortToken = tokenData.access_token
  const igUserId = tokenData.user_id

  if (!shortToken) {
    return NextResponse.redirect(new URL('/contas?error=token_failed', request.url))
  }

  // Trocar por long-lived token (60 dias)
  const longTokenRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.META_APP_SECRET}&access_token=${shortToken}`
  )
  const longTokenData = await longTokenRes.json()
  const longToken = longTokenData.access_token

  if (!longToken) {
    return NextResponse.redirect(new URL('/contas?error=token_failed', request.url))
  }

  // Buscar informações da conta do Instagram
  const profileRes = await fetch(
    `https://graph.instagram.com/v25.0/${igUserId}?fields=id,name,username,profile_picture_url&access_token=${longToken}`
  )
  const profile = await profileRes.json()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Salvar conta no Supabase
  await supabase.from('accounts').upsert({
    user_id: user.id,
    instagram_id: profile.id,
    username: profile.username,
    display_name: profile.name,
    profile_picture: profile.profile_picture_url,
    access_token: longToken,
    token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    page_id: null,
    page_access_token: null,
  }, { onConflict: 'instagram_id' })

  return NextResponse.redirect(new URL('/contas?success=connected', request.url))
}
