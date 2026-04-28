import sharp from 'sharp'

interface StoryOptions {
  imageBuffer: Buffer
  ctaText: string
  buttonColor: string
  textColor: string
  linkUrl: string
}

// Gera o criativo do Story com CTA desenhado na imagem
// Isso é necessário pois a API não suporta texto customizado no link sticker
export async function generateStoryWithCTA({
  imageBuffer,
  ctaText,
  buttonColor,
  textColor,
  linkUrl,
}: StoryOptions): Promise<Buffer> {
  const width = 1080
  const height = 1920

  // Resize da imagem para formato Story (9:16)
  const resized = await sharp(imageBuffer)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .toBuffer()

  // SVG do botão CTA sobreposto na imagem
  const ctaSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Gradient escuro no fundo para legibilidade do CTA -->
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="black" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.6"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="400" y="${height - 400}" fill="url(#grad)"/>
      
      <!-- Botão CTA -->
      <rect
        x="${width / 2 - 260}"
        y="${height - 220}"
        width="520"
        height="100"
        rx="50"
        fill="${buttonColor}"
      />
      
      <!-- Texto do CTA -->
      <text
        x="${width / 2}"
        y="${height - 155}"
        text-anchor="middle"
        font-family="Arial Black, Arial, sans-serif"
        font-size="46"
        font-weight="900"
        fill="${textColor}"
        letter-spacing="1"
      >${ctaText.toUpperCase()}</text>
      
      <!-- URL abaixo (pequena) -->
      <text
        x="${width / 2}"
        y="${height - 90}"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="28"
        fill="rgba(255,255,255,0.8)"
      >${linkUrl.replace(/^https?:\/\//, '')}</text>
    </svg>
  `

  // Compor a imagem com o SVG do CTA
  const result = await sharp(resized)
    .composite([
      {
        input: Buffer.from(ctaSvg),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 95 })
    .toBuffer()

  return result
}
