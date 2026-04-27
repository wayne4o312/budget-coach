import './config';
import { Hono } from 'hono';
import { readEnv } from './env';
import { auth } from './auth/auth';
import { requireAuth, sessionMiddleware } from './middlewares/session';
import quickAddRouter from './modules/quickAdd/quickAdd.routes';
import transactionsRouter from './modules/transactions/transactions.routes';
import notificationsRouter from './modules/notifications/notifications.routes';
import meRouter from "./modules/me/me.routes";

const env = readEnv();

const app = new Hono();

app.get('/health', (c) => c.json({ ok: true }));

// Better Auth handlers
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

// Inject session/user to all API routes
app.use('/api/*', sessionMiddleware);

app.route('/api/quick-add', quickAddRouter);
app.route('/api/transactions', transactionsRouter);
app.route('/api/notifications', notificationsRouter);
app.route("/api/me", meRouter);

app.get('/auth/wechat/start', (c) => {
  // MVP: scaffold only. Real flow:
  // - redirect to WeChat OAuth with redirect_uri = WECHAT_REDIRECT_URI
  // - callback gets code -> exchange for openid/unionid
  // - issue our JWT/session
  return c.json({
    ok: false,
    message:
      'Not implemented. Provide WECHAT_APP_ID/WECHAT_APP_SECRET/WECHAT_REDIRECT_URI then implement OAuth redirect + callback.',
  });
});

app.post('/sync/push', requireAuth, async (c) => {
  const body = await c.req.json();
  // TODO: validate with zod; apply LWW upsert
  return c.json({ ok: true, received: body, note: 'Scaffold: implement validation + upsert.' });
});

app.get('/sync/pull', requireAuth, async (c) => {
  const since = Number(c.req.query('since') ?? '0');
  // TODO: fetch updated rows by updated_at > since
  return c.json({ ok: true, since, note: 'Scaffold: implement pull queries.' });
});

export default app;

// Local dev server (Node)
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = env.PORT ?? 8787;
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import('@hono/node-server').then(({ serve }) => serve({ fetch: app.fetch, port }));
}

