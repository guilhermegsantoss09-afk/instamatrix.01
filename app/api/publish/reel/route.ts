import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishReel } from '@/lib/meta'

const DELAY_BETWEEN_ACCOUNTS_MS = 3000 // 3s anti rate-limit

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { accountIds, videoUrl, caption } = await request.json()

  if (!accountIds?.length || !videoUrl) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // Buscar contas do banco
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .in('id', accountIds)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (!accounts?.length) {
    return NextResponse.json({ error: 'Contas não encontradas' }, { status: 404 })
  }

  const results = []

  for (const account of accounts) {
    // Inserir na fila com status 'processing'
    const { data: post } = await supabase
      .from('posts_queue')
      .insert({
        user_id: user.id,
        account_id: account.id,
        post_type: 'reel',
        media_url: videoUrl,
        caption,
        status: 'processing',
      })
      .select()
      .single()

    try {
      const token = account.page_access_token || account.access_token
      const published = await publishReel(account.instagram_id, token, videoUrl, caption)

      await supabase
        .from('posts_queue')
        .update({
          status: 'published',
          instagram_media_id: published.id,
          published_at: new Date().toISOString(),
        })
        .eq('id', post.id)

      results.push({ account: account.username, status: 'published', mediaId: published.id })
    } catch (err: any) {
      await supabase
        .from('posts_queue')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', post.id)

      results.push({ account: account.username, status: 'failed', error: err.message })
    }

    // Delay anti rate-limit entre contas
    await new Promise(r => setTimeout(r, DELAY_BETWEEN_ACCOUNTS_MS))
  }

  return NextResponse.json({ results })
}
