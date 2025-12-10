import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts'); // Ruta actualizada

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      { // Añadido para Supabase Storage
        protocol: 'https',
        hostname: 'rchjjagmmnidkgzzmusp.supabase.co',
        port: '',
        pathname: '/**',
      },
      { // Añadido para imágenes de bancos
        protocol: 'https',
        hostname: 'www.kardmatch.com.mx',
        port: '',
        pathname: '/**',
      },
      { // Añadido para imágenes de Pinterest
        protocol: 'https',
        hostname: 'i.pinimg.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);