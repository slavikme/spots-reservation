/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: false,
  },
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
