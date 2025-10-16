/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build configuration
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/emineon/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
  },
  
  // Experimental features
  experimental: {
    optimizeCss: false, // Disable this as it can cause issues
    optimizePackageImports: ['lucide-react'],
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/puppeteer-core/.local-chromium/**/*'],
    },
  },
  
  // Performance optimizations  
  poweredByHeader: false,
  generateEtags: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Webpack configuration for stable builds
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Handle PDF files
    config.module.rules.push({
      test: /\.pdf$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/files/',
          outputPath: 'static/files/',
        },
      },
    });
    
    if (isServer) {
      config.externals.push({
        'puppeteer-core': 'commonjs puppeteer-core',
        '@sparticuz/chromium-min': 'commonjs @sparticuz/chromium-min'
      });
    }
    
    return config;
  },
  
  // Output configuration for deployment
  output: 'standalone',
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_VERCEL_ENVIRONMENT: process.env.VERCEL_ENV === 'production' ? 'production' : 'development',
    CUSTOM_KEY: 'my-value',
  },

  async rewrites() {
    return [
      {
        source: '/outlook-addin/:path*',
        destination: '/api/outlook-addin/:path*',
      },
    ];
  },

  // Note: serverExternalPackages not supported in Next.js 14.2.30
};

module.exports = nextConfig; 