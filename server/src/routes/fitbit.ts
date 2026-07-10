import { Router } from 'express';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  isConnected,
  disconnect,
  sync,
  getDailySteps,
  debugSessions,
  debugSteps,
} from '../services/fitbitService';

const router = Router();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

router.get('/auth-url', (_req, res) => {
  const url = getAuthorizationUrl();
  res.json({ url });
});

router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query as Record<string, string | undefined>;

  if (error || !code || !state) {
    return res.redirect(`${FRONTEND_ORIGIN}/fitbit?error=access_denied`);
  }

  try {
    await exchangeCodeForTokens(code, state);
    res.redirect(`${FRONTEND_ORIGIN}/fitbit?connected=true`);
  } catch (err) {
    console.error('Fitbit OAuth callback error:', err);
    res.redirect(`${FRONTEND_ORIGIN}/fitbit?error=auth_failed`);
  }
});

router.get('/status', (_req, res) => {
  res.json(isConnected());
});

router.post('/sync', async (_req, res) => {
  try {
    const result = await sync(30);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Sync failed' });
  }
});

router.delete('/disconnect', (_req, res) => {
  disconnect();
  res.json({ success: true });
});

router.get('/debug-steps', async (_req, res) => {
  try {
    const data = await debugSteps(7);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Debug failed' });
  }
});

router.get('/debug', async (_req, res) => {
  try {
    const data = await debugSessions(30);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Debug failed' });
  }
});

router.get('/steps', (req, res) => {
  const days = parseInt((req.query.days as string) ?? '7') || 7;
  const steps = getDailySteps(Math.min(days, 90));
  res.json({ steps });
});

export default router;
