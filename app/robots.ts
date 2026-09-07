import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/track', '/'],
        disallow: ['/dashboard', '/api', '/settings', '/mitra', '/transactions', '/customers', '/outlets', '/services', '/reports', '/users'],
      },
    ],
    sitemap: 'https://laundrypos.id/sitemap.xml',
  };
}
