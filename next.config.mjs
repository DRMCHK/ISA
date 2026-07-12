/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  // Fixed: serverComponentsExternalPackages was renamed in Next.js 14.2+
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default nextConfig;
