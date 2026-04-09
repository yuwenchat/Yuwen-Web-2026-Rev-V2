/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@yuwen/protocol",
    "@yuwen/chat-core",
    "@yuwen/design-system",
    "@yuwen/crypto"
  ]
};

export default nextConfig;

