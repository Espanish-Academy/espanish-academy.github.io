# Tutorial / promo video

Vertical 1080×1920, ~65 s, short-form (TikTok / Reels) style: English narration with easy Spanish words, spoken by the ElevenLabs voice "Claudia" (Spanish-European accent), word-by-word captions, whip transitions on the beat, camera push-in on every tap, confetti, and a synthesised Spanish-guitar music bed ducked under the voice. Student screens in English, teacher screens in Spanish.

1. Run both dev servers: demo on :5175 (`.claude/launch.json` → `espanish-demo`) and real on :5174 (only the sign-up screen is captured, nothing is submitted).
2. In a scratch folder: `npm i puppeteer-core`, a Python venv with `numpy scipy`, copy these files there, add `abanico.webp` (src/assets), `appicon.png` (public/icon-maskable-512.png), `audio/click.wav`.
3. `node capture.mjs` → real app screenshots in `shots/` + tap positions in `rects.json` (dev-only URL switches `?as=student|teacher&lang=en|es`, `localStorage['espanish-dev-push']`).
4. `python3 tts.py [voice_id] [ids…]` → ElevenLabs `/with-timestamps` for each line in `narration.json` (default voice Claudia `cw0sQ4mVjT9BbISUtO51`, `eleven_multilingual_v2`, `mp3_44100_128`) → `audio/<id>.wav`, `durations.json`, `words.json` (word timings for the captions). Needs the API key in `.el_key` — keep it out of the repo.
5. `node render.mjs` renders `video.html` frame by frame (30 fps) → `video_noaudio.mp4` + `timing.json` (scene starts on a 110 BPM beat grid, taps, cuts, pops). `node render.mjs --preview 3 10.5` writes single frames to `preview/`.
6. `python music.py <total_seconds>` (venv) → `audio/music.wav` (nylon guitar Am–G–F–E, palmas, soft dembow, bass at 110 BPM) + `whoosh/pop/ding.wav`.
7. `python3 mix.py` → `audio/mix.wav` (voice, music side-chain ducked, SFX, loudnorm −14 LUFS), then
   `ffmpeg -i video_noaudio.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart Espanish_tutorial.mp4`.
