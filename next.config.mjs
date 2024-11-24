/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: ''
      }
    ]
  }
    // env: {
    //     // NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
    //     // CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",
    //   }
};

export default nextConfig;
