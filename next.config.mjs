/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  experimental: {
    // optimizePackageImports mempercepat compile: hanya import icon/komponen yang
    // benar-benar dipakai, bukan seluruh barrel file library.
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
