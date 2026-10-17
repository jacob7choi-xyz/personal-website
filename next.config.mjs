/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Hardening headers on every response. The site is static with no user input,
     forms or third-party scripts, so none of these closes a known exploit path;
     they narrow what a future mistake could expose. A full script-restricting
     CSP is deliberately absent: Next inlines its own scripts, so it would need
     a nonce or hash strategy, and a wrong policy can stop the page rendering. The CSP below only
     sets frame-ancestors, which restricts who may embed the site and nothing
     the page itself loads. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
