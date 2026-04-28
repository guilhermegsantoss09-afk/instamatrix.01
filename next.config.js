/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['graph.facebook.com', 'cdninstagram.com', 'scontent.cdninstagram.com'],
  },
  // Sharp precisa ser externalized no Vercel
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
}

module.exports = nextConfig
