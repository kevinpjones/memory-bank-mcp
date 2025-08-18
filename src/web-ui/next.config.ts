import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Transpile packages from the parent directory
  transpilePackages: [],
  
  // Server external packages
  serverExternalPackages: [],
  
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure webpack to handle imports from parent directories
  webpack: (config, { isServer }) => {
    // Allow imports from parent directories
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };
    
    // Handle .js imports as ES modules
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    
    return config;
  },
  
  // Output configuration
  output: 'standalone',
  
  // Enable static optimization
  poweredByHeader: false,
};

export default nextConfig;
