const META_BASE = 'https://graph.facebook.com/v25.0'

export async function getInstagramAccounts(userToken: string) {
  const res = await fetch(
    `${META_BASE}/me/accounts?fields=id,name,instagram_business_account{id,name,username,profile_picture_url}&access_token=${userToken}`
  )
  return res.json()
}

export async function getLongLivedToken(shortToken: string) {
  const res = await fetch(
    `${META_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${shortToken}`
  )
  return res.json()
}

export async function getPageToken(pageId: string, userToken: string) {
  const res = await fetch(
    `${META_BASE}/${pageId}?fields=access_token&access_token=${userToken}`
  )
  return res.json()
}

// Publica Reel via API oficial
export async function publishReel(
  igAccountId: string,
  pageToken: string,
  videoUrl: string,
  caption: string
) {
  // 1. Criar media container
  const container = await fetch(`${META_BASE}/${igAccountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: pageToken,
    }),
  }).then(r => r.json())

  if (container.error) throw new Error(container.error.message)

  // 2. Aguardar processamento (polling)
  await waitForMedia(container.id, pageToken)

  // 3. Publicar
  const publish = await fetch(`${META_BASE}/${igAccountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: container.id,
      access_token: pageToken,
    }),
  }).then(r => r.json())

  if (publish.error) throw new Error(publish.error.message)
  return publish
}

// Publica Story via API oficial
export async function publishStory(
  igAccountId: string,
  pageToken: string,
  imageUrl: string,
  linkUrl?: string
) {
  const body: Record<string, string> = {
    media_type: 'IMAGE',
    image_url: imageUrl,
    access_token: pageToken,
  }

  // Link sticker oficial (suportado pela API)
  if (linkUrl) body.link = linkUrl

  const container = await fetch(`${META_BASE}/${igAccountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json())

  if (container.error) throw new Error(container.error.message)

  const publish = await fetch(`${META_BASE}/${igAccountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: container.id,
      access_token: pageToken,
    }),
  }).then(r => r.json())

  if (publish.error) throw new Error(publish.error.message)
  return publish
}

// Polling para aguardar o vídeo ser processado pelo Meta
async function waitForMedia(containerId: string, token: string, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const status = await fetch(
      `${META_BASE}/${containerId}?fields=status_code&access_token=${token}`
    ).then(r => r.json())

    if (status.status_code === 'FINISHED') return
    if (status.status_code === 'ERROR') throw new Error('Falha no processamento do vídeo')
  }
  throw new Error('Timeout no processamento do vídeo')
}
