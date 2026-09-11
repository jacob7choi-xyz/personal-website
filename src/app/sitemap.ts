import type { MetadataRoute } from "next";

/**
 * Generates /sitemap.xml at build time.
 *
 * One entry, because the site is genuinely one page. The numbered sections are
 * anchors within it, not routes, and listing fragments would misrepresent the
 * structure. Do not add /opengraph-image here: it is a metadata asset for link
 * scrapers, not a page a person should land on.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.jacobjchoi.com/",
      // BUILD time, not content-change time, and the difference is real: a
      // dependency bump redeploys and moves this without a word of copy changing.
      // Accepted because crawlers treat lastModified as a hint rather than a
      // guarantee, and the alternatives are worse (a hand-maintained constant
      // goes stale silently; omitting it discards the signal when copy DOES
      // change). Deriving it from git history would be the accurate fix if this
      // ever grows past one page.
      //
      // This is NOT the footer-year hazard. That bug was a value rendered to a
      // visitor that became WRONG as time passed. "This deployment was built at
      // T" stays true forever; it only becomes less current.
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
