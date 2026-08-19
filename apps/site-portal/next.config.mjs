/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nexussecure/agent'],
  env: {
    NEXT_PUBLIC_HUB_URL: process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
