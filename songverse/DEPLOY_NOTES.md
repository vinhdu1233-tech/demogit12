# SongVerse 3D V5 — deployment staging

This branch is separate from `main`. The application source must be copied into this `songverse/` directory from the verified `SongVerse_3D_V5_RENDER_NEON` archive; the game is **not deployed** by this commit alone.

Production requirements:
- Render Free web service (Node.js, Singapore)
- Neon Postgres Free for durable user/XP data
- `DATABASE_URL` on Render (secret)
- `SESSION_SECRET` with >=32 random characters (secret)
- WebSocket and HTTP served by the same Node process
- Never commit `.env`, `data/users.json`, `data/secret.key`, or student credentials
- Verify `/api/health` reports `storage:postgres`
- Test multiplayer, logout/login, and redeploy persistence before sharing with pupils

Free services may sleep after inactivity. Avoid student real names in chat; supervision is required.
