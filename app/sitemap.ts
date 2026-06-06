import { MetadataRoute } from "next"
import { LANDING_PAGES } from "@/lib/landing/seo-content"
import { TOOL_LANDING_PAGES } from "@/lib/tools/seo-content"

export default function sitemap(): MetadataRoute.Sitemap {
  const landingPages = LANDING_PAGES.map((page) => ({
    url: `https://docuhive.com/landing/${page.type}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const toolLandingPages = TOOL_LANDING_PAGES.map((page) => ({
    url: `https://docuhive.com/tools/landing/${page.type}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [
    {
      url: "https://docuhive.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://docuhive.com/pricing",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://docuhive.com/tools",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...landingPages,
    ...toolLandingPages,
  ]
}
