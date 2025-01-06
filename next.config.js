/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  compiler: {
    removeConsole: false,
  },
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
