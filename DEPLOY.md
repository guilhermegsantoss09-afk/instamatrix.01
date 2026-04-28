# InstaMatrix — Guia de Deploy Completo

## PRÉ-REQUISITOS
- Node.js 18+
- Conta na Vercel (vercel.com)
- Projeto no Supabase (supabase.com)
- App no Meta Developers (developers.facebook.com)

---

## FASE 1 — Configurar Supabase

1. Crie um projeto em supabase.com
2. Vá em **SQL Editor** e cole todo o conteúdo de `supabase/schema.sql`
3. Execute o SQL
4. Vá em **Storage > Buckets** e crie um bucket chamado `media` (público)
5. Copie as credenciais:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## FASE 2 — Configurar o App Meta

1. Acesse developers.facebook.com
2. No seu app **GerenciadorMatriz**, vá em **Configurações Básicas**
3. Copie:
   - **ID do Aplicativo** → `META_APP_ID`
   - **Chave Secreta** → `META_APP_SECRET`
4. Vá em **Login do Facebook > Configurações**
5. Em **URIs de redirecionamento OAuth válidos**, adicione:
   `https://SEU-DOMINIO.vercel.app/api/auth/callback`
6. Certifique-se que as permissões estão ativas:
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_comments`
   - `pages_show_list`
   - `pages_read_engagement`

---

## FASE 3 — Instalar e Rodar Localmente

```bash
# Clonar / criar o projeto
git init instamatrix && cd instamatrix

# Copiar todos os arquivos gerados para este diretório

# Instalar dependências
npm install

# Copiar e preencher o .env
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Rodar em desenvolvimento
npm run dev
# Acesse http://localhost:3000
```

---

## FASE 4 — Deploy na Vercel

```bash
# Instalar CLI da Vercel
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Configurar variáveis de ambiente na Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add META_APP_ID
vercel env add META_APP_SECRET
vercel env add META_REDIRECT_URI
vercel env add NEXT_PUBLIC_APP_URL

# Deploy de produção
vercel --prod
```

Ou configure as env vars pelo painel em vercel.com/seu-projeto/settings/environment-variables

---

## FASE 5 — Conectar Contas do Instagram

1. Acesse seu app em produção
2. Vá em **Contas**
3. Clique em **+ Adicionar conta**
4. Faça login com o Facebook
5. Autorize as permissões
6. As contas vinculadas aparecem automaticamente

---

## FLUXO OAuth (resumo)

```
Usuário clica "Conectar"
  → Redireciona para Meta OAuth
  → Meta redireciona para /api/auth/callback?code=xxx
  → Troca code por short token
  → Troca short token por long token (60 dias)
  → Busca páginas e contas do Instagram
  → Salva no Supabase
  → Redireciona para /contas
```

---

## FLUXO DE PUBLICAÇÃO DE STORY (resumo)

```
Upload da imagem
  → Sharp gera criativo com CTA desenhado (1080x1920)
  → Upload do criativo para Supabase Storage
  → Para cada conta selecionada:
      → POST /api/publish/story
      → Cria media container no Meta
      → Publica via media_publish com link_url oficial
      → Salva status no posts_queue
      → Aguarda 3s (anti rate-limit)
      → Próxima conta
```

---

## OBSERVAÇÕES IMPORTANTES

### Tokens
- Tokens de usuário duram **60 dias** → renove antes de expirar
- Tokens de página são **permanentes** → prefira usar page_access_token
- O endpoint `/api/token/refresh` renova tokens próximos do vencimento

### CTA em Stories
- A Meta API **não suporta texto customizado** no link sticker nativo
- A solução adotada: **gerar o criativo com o CTA desenhado via Sharp**
- O link oficial é passado via `link_url` na API (sticker de link padrão do Instagram)
- Resultado: botão visual personalizado + link funcional

### Rate Limits
- Delay de 3s entre publicações por conta
- Em caso de falha, o status fica `failed` no banco para retry manual
- O Meta permite ~200 posts por hora por conta

### Publicação do App
- Para uso pessoal (suas próprias contas): não precisa publicar o app
- Para uso com contas de terceiros: precisa da revisão do Meta
