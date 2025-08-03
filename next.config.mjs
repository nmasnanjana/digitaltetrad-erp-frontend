/** @type {import('next').NextConfig} */
const config = {
  // Configure webpack to handle fetch timeouts
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Increase timeout for development
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    // Add fallback for node modules that might cause fetch issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  
  // Disable build activity indicator to reduce network calls
  devIndicators: {
    buildActivity: false,
  },
};

export default config;
