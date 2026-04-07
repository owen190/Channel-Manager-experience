/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
      ],
    },
  ],
};
module.exports = nextConfig;
