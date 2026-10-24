/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@marketplace/shared-types',
    '@marketplace/design-tokens',
    '@marketplace/validation-schemas',
  ],
};

export default nextConfig;
