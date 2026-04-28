import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishStory } from '@/lib/meta'
import { generateStoryWithCTA } from '@/lib/story-generator'

const DELAY_MS = 3000

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { accountIds, imageUrl, linkUrl, ctaText, buttonColor, textColor } = await request.json()

  // Buscar imagem original
  const imageRes = await fetch(imageUrl)
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer())

  // Gerar criativo com CTA desenhado
  const storyBuffer = await generateStoryWithCTA({
    imageBuffer,
    ctaText,
    linkUrl,
    buttonColor: buttonColor || '#FF0066',
    textColor: textColor || '#FFFFFF',
  })

  // Upload do criativo gerado para o Supabase Storage
  const fileName = `stories/${user.id}/${Date.now()}.jpg`
  const { data: upload, error: uploadError } = await supabase.storage
    .from('media')
    .upload(fileName, storyBuffer, { contentType: 'image/jpeg' })

  if (uploadError) {
    return NextResponse.json({ error: 'Erro no upload do criativo' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName)

  // Buscar contas
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .in('id', accountIds)
    .eq('user_id', user.id)
    .eq('is_active', true)

  const results = []

  for (const account of accounts || []) {
    const { data: post } = await supabase
      .from('posts_queue')
      .insert({
        user_id: user.id,
        account_id: account.id,
        post_type: 'story',
        media_url: publicUrl,
        link_url: linkUrl,
        cta_text: ctaText,
        status: 'processing',
      })
      .select()
      .single()

    try {
      const token = account.page_access_token || account.access_token
      // Publica com link oficial via API
      const published = await publishStory(account.instagram_id, token, publicUrl, linkUrl)

      await supabase
        .from('posts_queue')
        .update({
          status: 'published',
          instagram_media_id: published.id,
          published_at: new Date().toISOString(),
        })
        .eq('id', post.id)

      results.push({ account: account.username, status: 'published' })
    } catch (err: any) {
      await supabase
        .from('posts_queue')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', post.id)

      results.push({ account: account.username, status: 'failed', error: err.message })
    }

    await new Promise(r => setTimeout(r, DELAY_MS))
  }

  return NextResponse.json({ results, creativeUrl: publicUrl })
}
