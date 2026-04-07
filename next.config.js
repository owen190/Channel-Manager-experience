/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Generate unique build IDs to bust caches on deploy
  generateBuildId: async () => `build-${Date.now()}`,
};
module.exports = nextConfig;
