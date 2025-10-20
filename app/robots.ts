import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/fa/', '/api/'],
      },
    ],
    sitemap: 'https://www.footylimited.com/sitemap.xml',
  }
}
