import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Que `next dev` no genere un AGENTS.md en el repo.
  agentRules: false,
};

export default nextConfig;
