import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three"],
  reactStrictMode: true,
  // Pin the workspace root so a stray lockfile in a parent folder is never picked up
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url))
  }
};

export default nextConfig;
