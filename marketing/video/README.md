# Tutorial / promo video

Vertical 1080×1920 video, Spanish narration (macOS voice "Mónica"), ~100 s.

1. Run both dev servers: demo on :5175 (`.claude/launch.json` → `espanish-demo`) and real on :5174 (only the sign-up screen is captured, nothing is submitted).
2. `npm i puppeteer-core` in a scratch folder, copy these files there, add `abanico.webp` (src/assets) and `appicon.png` (public/icon-maskable-512.png).
3. `node capture.mjs` → real app screenshots in `shots/` + tap positions in `rects.json` (uses dev-only URL switches `?as=student|teacher&lang=es`, `localStorage['espanish-dev-push']`).
4. Narration: `say -v Mónica -r 168` for each line in `narration.json` → `audio/<id>.wav`, durations in `durations.json`.
5. `node render.mjs` renders `video.html` frame by frame (30 fps) to `video_noaudio.mp4` and writes `timing.json`.
6. Mix narration + tap clicks with ffmpeg (adelay per scene start + 0.35 s) and mux.
