import { withSerwist } from "@serwist/turbopack";

// const revisvion =
//   spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout ??
//   crypto.randomUUID();

// const withSerwist = withSerwistInit({
//   additionalPrecacheEntries: [{ url: "/~offline", revision }],
//   // Note: This is only an example. If you use Pages Router,
//   // use something else that works, such as "service-worker/index.ts".
//   swSrc: "app/sw.ts",
//   swDest: "public/sw.js",
// });

// NOTE: according useded serwist/turbopack for PWA , 'withSerwist' will instead of default 'nextConfig'
// const nextConfig: NextConfig = {
//   /* config options here */
// };

export default withSerwist({});
