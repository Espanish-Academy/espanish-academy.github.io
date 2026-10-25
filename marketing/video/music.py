# Synthesises a light Spanish-pop bed (nylon guitar on the Andalusian cadence Am–G–F–E, palmas, soft
# dembow kick, shaker, bass) at 110 BPM so scene cuts can land on the beat. Also writes small SFX.
# usage: python music.py <total_seconds>
import sys, numpy as np
from scipy.signal import lfilter, butter, sosfilt, fftconvolve
from scipy.io import wavfile
SR = 48000; BPM = 110; BEAT = 60 / BPM; BAR = 4 * BEAT
rng = np.random.default_rng(7)
V = __file__.rsplit('/', 1)[0]
total = float(sys.argv[1]) if len(sys.argv) > 1 else 60
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)

_cache = {}
def pluck(m, bright=0.5, length=1.8):
    key = (m, round(bright, 1), length)
    if key in _cache: return _cache[key]
    f = mtof(m); N = int(SR / f); n = int(length * SR)
    exc = lp(rng.uniform(-1, 1, N), 1500 + bright * 5000)
    x = np.zeros(n); x[:N] = exc
    g = 0.996 if m < 52 else 0.993
    a = np.zeros(N + 2); a[0] = 1; a[N] = -g / 2; a[N + 1] = -g / 2
    y = lfilter([1], a, x)
    # retune: integer delay is slightly sharp → stretch to the exact pitch
    real = SR / (N + 0.5); ratio = f / real
    idx = np.arange(n) * ratio; idx = idx[idx < n - 1]
    y = np.interp(idx, np.arange(n), y)
    y = y + 0.25 * bp(y, 90, 260)          # a little guitar body
    y *= np.exp(-np.arange(len(y)) / SR * 1.4)
    y /= (np.abs(y).max() + 1e-9)
    _cache[key] = y; return y

n_total = int((total + 0.05) * SR)
gtr = np.zeros(n_total + SR * 3); lead = np.zeros_like(gtr); drums = np.zeros_like(gtr); bass = np.zeros_like(gtr)
def add(buf, sig, t, gain):
    i = int(t * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig)); buf[i:j] += sig[:j - i] * gain

CH = {'Am': [45, 52, 57, 60, 64], 'G': [43, 47, 50, 55, 59, 67], 'F': [41, 48, 53, 57, 60, 65], 'E': [40, 47, 52, 56, 59, 64]}
ROOT = {'Am': 33, 'G': 31, 'F': 29, 'E': 28}
PROG = ['Am', 'G', 'F', 'E']
RIFF = {'Am': [76, 72, 69, 72, 76, 77, 76, 72], 'G': [74, 71, 67, 71, 74, 76, 74, 71],
        'F': [72, 69, 65, 69, 72, 74, 72, 69], 'E': [71, 68, 64, 68, 71, 72, 71, 68]}
def strum(chord, t, down=True, vel=1.0, mute=None):
    notes = CH[chord] if down else CH[chord][::-1][:4]
    for k, m in enumerate(notes):
        s = pluck(m, 0.35 + 0.3 * vel)
        if mute: s = s[:int(mute * SR)] * np.linspace(1, 0, int(mute * SR)) ** 0.5 if len(s) > mute * SR else s
        add(gtr, s, t + k * (0.011 if down else 0.008), 0.22 * vel)

def kick(t, g=1.0):
    n = int(0.28 * SR); tt = np.arange(n) / SR
    f = 50 + 70 * np.exp(-tt * 30); ph = 2 * np.pi * np.cumsum(f) / SR
    add(drums, np.sin(ph) * np.exp(-tt * 13), t, 0.55 * g)
def clap(t, g=1.0):
    n = int(0.16 * SR); tt = np.arange(n) / SR
    env = np.exp(-tt * 30)
    x = bp(rng.uniform(-1, 1, n), 900, 3200) * env
    for d in (0.008, 0.016): add(drums, x[: int(0.01 * SR)] * 0.6, t - d, 0.3 * g)
    add(drums, x, t, 0.32 * g)
def shaker(t, g=1.0):
    n = int(0.07 * SR); tt = np.arange(n) / SR
    add(drums, hp(rng.uniform(-1, 1, n), 6500) * np.sin(np.pi * tt / 0.07) ** 2, t, 0.09 * g)
def bassnote(m, t, d):
    n = int(d * SR); tt = np.arange(n) / SR; f = mtof(m)
    x = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)
    env = np.minimum(1, tt / 0.01) * np.exp(-tt * 2.2) * np.minimum(1, (d - tt) / 0.03)
    add(bass, np.tanh(1.5 * x * env), t, 0.35)

nbars = int(np.ceil(total / BAR))
for b in range(nbars):
    t0 = b * BAR; ch = PROG[b % 4]; last = b == nbars - 1
    intro = b == 0
    if last:
        strum('Am', t0, vel=1.1); kick(t0); clap(t0, 0.8); bassnote(ROOT['Am'], t0, 2.5)
        for k, m in enumerate([69, 72, 76, 81]): add(lead, pluck(m, 0.7, 2.5), t0 + 0.06 * k, 0.16)
        continue
    # strum pattern: D . D U . U D U  (8ths)
    pat = [(0, True, 1.0), (2, True, .7), (3, False, .55), (5, False, .6), (6, True, .8), (7, False, .5)]
    for e, dn, v in pat: strum(ch, t0 + e * BEAT / 2, dn, v * (0.8 if intro else 1))
    if not intro:
        # dembow-lite: kick on every beat, palmas on the "a" of 1 and the "&" of 2 (per half bar)
        for q in range(4): kick(t0 + q * BEAT, 0.85 if q % 2 else 1)
        for h in (0, 2): clap(t0 + (h + 0.75) * BEAT, 0.7); clap(t0 + (h + 1.5) * BEAT, 0.9)
        for s in range(16): shaker(t0 + s * BEAT / 4, 1.0 if s % 2 else 0.55)
        r = ROOT[ch]
        bassnote(r, t0, BEAT * 1.4); bassnote(r, t0 + BEAT * 1.5, BEAT * 0.45); bassnote(r + 12 if ch != 'E' else r + 7, t0 + BEAT * 2, BEAT * 0.9); bassnote(r, t0 + BEAT * 3, BEAT * 0.9)
    # lead riff every other 4-bar phrase, plus the very start
    if (b // 4) % 2 == 1 or b < 2:
        for k, m in enumerate(RIFF[ch]): add(lead, pluck(m, 0.6, 1.0), t0 + k * BEAT / 2, 0.11 if k % 2 else 0.14)

def reverb(x, secs=1.6, wet=0.18):
    n = int(secs * SR); ir = rng.normal(0, 1, n) * np.exp(-np.arange(n) / SR * 4.5); ir = lp(ir, 5000); ir /= np.abs(ir).sum() ** 0.5 * 4
    return x + wet * fftconvolve(x, ir)[:len(x)]
mix = reverb(gtr * 1.0 + lead * 1.0, wet=0.22) + drums + lp(bass, 400)
mix = mix[:n_total]
fade = int(1.2 * SR); mix[-fade:] *= np.linspace(1, 0, fade) ** 2
mix /= np.abs(mix).max() / 0.8
st = np.stack([mix, np.roll(mix, int(0.011 * SR)) * 0.96 + mix * 0.04], 1)  # tiny stereo width
wavfile.write(f'{V}/audio/music.wav', SR, (st * 32767).astype(np.int16))

# ── SFX ──
def save(name, x): x = x / (np.abs(x).max() + 1e-9) * 0.9; wavfile.write(f'{V}/audio/{name}.wav', SR, (np.stack([x, x], 1) * 32767).astype(np.int16))
n = int(0.42 * SR); tt = np.arange(n) / SR
noise = rng.uniform(-1, 1, n); env = np.sin(np.pi * tt / 0.42) ** 3
fc = 600 + 3800 * np.sin(np.pi * tt / 0.42) ** 2
w = np.zeros(n); blk = 480
for i in range(0, n, blk): w[i:i + blk] = bp(noise[max(0, i - 2000):i + blk], fc[i] * 0.6, fc[i] * 1.4)[-len(w[i:i + blk]):]
save('whoosh', w * env)
n = int(0.12 * SR); tt = np.arange(n) / SR; f = 500 + 900 * (tt / 0.12)
save('pop', np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 28))
n = int(0.6 * SR); tt = np.arange(n) / SR
save('ding', (np.sin(2 * np.pi * 1318 * tt) + 0.5 * np.sin(2 * np.pi * 1976 * tt) * np.exp(-tt * 4)) * np.exp(-tt * 6))
print('music', round(len(mix) / SR, 2), 's,', nbars, 'bars')
