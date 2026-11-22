import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { runMigrations } from './src/server/db/migrations.ts';
import { seedDatabaseIfEmpty } from './src/server/db/seed.ts';
import { attachSession } from './src/server/middleware/security.ts';
import authRoutes from './src/server/routes/auth.ts';
import publicRoutes from './src/server/routes/public.ts';
import portalRoutes from './src/server/routes/portal.ts';
import adminRoutes from './src/server/routes/admin.ts';
import documentRoutes from './src/server/routes/documents.ts';

async function startServer() {
  // Initialize SQLite relational database, run migrations, and seed initial records
  runMigrations();
  seedDatabaseIfEmpty();

  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: false, // Allows preview inside AI Studio iframe
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(attachSession);

  // SEO robots.txt & sitemap.xml
  app.get('/robots.txt', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /portal/',
        'Disallow: /admin/',
        'Disallow: /api/',
        `Sitemap: ${baseUrl}/sitemap.xml`,
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const paths = [
      '/',
      '/about',
      '/divisions',
      '/capabilities',
      '/why-partner',
      '/opportunities',
      '/partnerships',
      '/compare',
      '/what-we-offer',
      '/what-we-expect',
      '/process',
      '/directory',
      '/case-studies',
      '/faq',
      '/contact',
      '/request-meeting',
      '/apply',
      '/legal/privacy',
      '/legal/terms',
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${baseUrl}${p}</loc></url>`).join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/portal', portalRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/documents', documentRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Error handler for multer & unexpected API errors
  app.use('/api', (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(400).json({ error: err.message || 'Request failed.' });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output missing. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HelzerX Corporate Partnerships Portal listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start HelzerX server:', err);
  process.exit(1);
});
