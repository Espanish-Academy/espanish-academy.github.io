# Mixes narration + music (ducked under the voice) + SFX (taps, whooshes on cuts, pops) → audio/mix.wav
# Uses timing.json written by render.mjs. Run music.py <total> first.
import json, subprocess, os
V = os.path.dirname(os.path.abspath(__file__))
t = json.load(open(f'{V}/timing.json')); total = t['total']
inputs, filt = [], []
def inp(path):
    inputs.extend(['-i', path]); return len(inputs) // 2 - 1
def place(path, at, gain, label, bus):
    i = inp(path); filt.append(f"[{i}:a]volume={gain},adelay={max(0, int(at * 1000))}:all=1[{label}]"); bus.append(f'[{label}]')
voice, sfx = [], []
for s in t['scenes']:
    wav = f"{V}/audio/{s['id']}.wav"
    if os.path.exists(wav): place(wav, s['voice'], 1.0, f"v{len(voice)}", voice)
for k, x in enumerate(t['taps']): place(f'{V}/audio/click.wav', x, 0.5, f'c{k}', sfx)
for k, x in enumerate(t['cuts']): place(f'{V}/audio/whoosh.wav', x - 0.21, 0.35, f'w{k}', sfx)
for k, x in enumerate(t['pops']): place(f'{V}/audio/pop.wav', x, 0.35, f'p{k}', sfx)
for k, x in enumerate(t.get('dings', [])): place(f'{V}/audio/ding.wav', x, 0.3, f'd{k}', sfx)
m = inp(f'{V}/audio/music.wav')
filt.append(f"{''.join(voice)}amix=inputs={len(voice)}:normalize=0,apad,atrim=0:{total:.3f},asplit=2[vo][key]")
filt.append(f"[{m}:a]volume=0.33,apad,atrim=0:{total:.3f}[mu]")
filt.append("[mu][key]sidechaincompress=threshold=0.015:ratio=7:attack=25:release=420:makeup=1[duck]")
filt.append(f"{''.join(sfx)}amix=inputs={len(sfx)}:normalize=0,apad,atrim=0:{total:.3f}[fx]")
filt.append(f"[vo][duck][fx]amix=inputs=3:normalize=0,atrim=0:{total:.3f},loudnorm=I=-14:TP=-1.2:LRA=11[out]")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(filt), '-map', '[out]', '-ar', '48000', '-ac', '2', f'{V}/audio/mix.wav'], check=True)
print('mixed', len(voice), 'voice,', len(sfx), 'sfx,', round(total, 2), 's')
