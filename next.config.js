/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the AME logo and any other remote images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.amesouth.com' },
    ],
  },
}

module.exports = nextConfig
