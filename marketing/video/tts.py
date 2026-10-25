# ElevenLabs TTS with character timestamps → audio/<id>.wav, durations.json, words.json
import json, subprocess, wave, urllib.request, base64, sys, re
V = '/private/tmp/claude-501/-Users-orelpartuk-Downloads-Claude-Espanish/ff1c4284-5b59-4236-9a7d-006343bd0d9a/scratchpad/video'
key = open(f'{V}/.el_key').read().strip()
VOICE = sys.argv[1] if len(sys.argv) > 1 else 'cw0sQ4mVjT9BbISUtO51'  # Claudia — bubbly, Spanish-European accent
only = sys.argv[2:]
d = json.load(open(f'{V}/narration.json'))
durs = json.load(open(f'{V}/durations.json')) if only else {}
words = json.load(open(f'{V}/words.json')) if only else {}
for s in d:
    if only and s['id'] not in only: continue
    body = json.dumps({"text": s['text'], "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.4, "similarity_boost": 0.8, "style": 0.45, "use_speaker_boost": True}}).encode()
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128',
        data=body, headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r: res = json.load(r)
    mp3 = f"{V}/audio/{s['id']}.mp3"; wav = f"{V}/audio/{s['id']}.wav"
    open(mp3, 'wb').write(base64.b64decode(res['audio_base64']))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp3, '-ar', '48000', '-ac', '2', wav], check=True)
    with wave.open(wav) as f: durs[s['id']] = round(f.getnframes() / f.getframerate(), 2)
    al = res['alignment']; ch, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    ws, cur = [], None
    for c, a, b in zip(ch, st, en):
        if c.isspace():
            if cur: ws.append(cur); cur = None
            continue
        if cur is None: cur = {'w': '', 's': a, 'e': b}
        cur['w'] += c; cur['e'] = b
    if cur: ws.append(cur)
    ws = [w for w in ws if re.search(r'\w', w['w'])]  # drop lone dashes
    words[s['id']] = [{'w': w['w'], 's': round(w['s'], 3), 'e': round(w['e'], 3)} for w in ws]
    print(s['id'], durs[s['id']], len(ws), flush=True)
json.dump(durs, open(f'{V}/durations.json', 'w'), indent=1)
json.dump(words, open(f'{V}/words.json', 'w'), ensure_ascii=False)
print('total', round(sum(durs.values()), 1))
