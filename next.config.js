/**
 * Local development against a deployed backend: the backend only allows CORS
 * from the deployed frontend's origin, so a browser on localhost is blocked.
 * Setting DEV_API_PROXY_TARGET (server-side, not NEXT_PUBLIC_) makes Next proxy
 * `/api-proxy/*` to that URL, and server-to-server requests are not subject to
 * CORS. Pair it with NEXT_PUBLIC_API_URL=/api-proxy. Unset, nothing changes.
 */
const proxyTarget = process.env.DEV_API_PROXY_TARGET?.replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!proxyTarget) return [];
    return [{ source: '/api-proxy/:path*', destination: `${proxyTarget}/:path*` }];
  },
};

module.exports = nextConfig;
