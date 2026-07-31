import type { MetadataRoute } from "next";

/**
 * Generates /robots.txt at build time.
 *
 * Everything here is public and developer-authored, so there is nothing to hide
 * from a crawler and no `disallow` rules. The file exists to state that
 * deliberately and to advertise the sitemap, which is the part crawlers actually
 * benefit from.
 *
 * Note this governs INDEXING, not access. It is a request that well-behaved
 * crawlers honour, never an access control, so it must not be treated as one.
 * The preview deployments are kept private by Vercel authentication, not by this.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // Absolute by specification: a Sitemap directive in robots.txt must be a
    // full URL, unlike the relative paths metadataBase resolves elsewhere.
    sitemap: "https://www.jacobjchoi.xyz/sitemap.xml",
  };
}
