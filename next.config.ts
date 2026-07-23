import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  assetPrefix: '/pagopa-ecommerce-watchdog-deadletter-fe',
  /* Use this configuration locally with the UAT API, and update the environment configuration accordingly. */
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api-proxy/:path*',
  //       destination: 'https://weuuat.ecommerce.internal.uat.platform.pagopa.it/:path*',
  //     },
  //   ];
  // },
};

export default nextConfig;
