// Renders video.html frame by frame (deterministic) and pipes the frames to ffmpeg.
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import { spawn } from 'node:child_process'

const dir = new URL('.', import.meta.url).pathname
const FPS = 30
const preview = process.argv.includes('--preview')
const rects = JSON.parse(fs.readFileSync(dir + 'rects.json', 'utf8'))
const durs = JSON.parse(fs.readFileSync(dir + 'durations.json', 'utf8'))
const words = JSON.parse(fs.readFileSync(dir + 'words.json', 'utf8'))

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--hide-scrollbars', '--allow-file-access-from-files', '--font-render-hinting=none'] })
const page = await browser.newPage()
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 })
await page.evaluateOnNewDocument((r, d, w) => { window.RECTS = r; window.DUR = d; window.WORDS = w }, rects, durs, words)
await page.goto(`file://${dir}video.html`, { waitUntil: 'networkidle0' })
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r }))) })
const TOTAL = await page.evaluate(() => window.TOTAL)
const timing = await page.evaluate(() => window.timing())
fs.writeFileSync(dir + 'timing.json', JSON.stringify(timing, null, 1))
console.log('total seconds', TOTAL.toFixed(2))

if (preview) {
  fs.mkdirSync(dir + 'preview', { recursive: true })
  const times = process.argv.slice(3).map(Number)
  page.on('pageerror', e => console.log('PAGE ERROR', e.message))
  for (const t of times) { await page.evaluate(t => window.render(t), t); await page.screenshot({ path: `${dir}preview/t${t.toFixed(1)}.jpg`, type: 'jpeg', quality: 85 }) }
  await browser.close(); process.exit(0)
}

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), dir + 'video_noaudio.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] })
const frames = Math.ceil(TOTAL * FPS)
for (let i = 0; i < frames; i++) {
  await page.evaluate(t => window.render(t), i / FPS)
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 })
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r))
  if (i % 300 === 0) console.log(`frame ${i}/${frames}`)
}
ff.stdin.end()
await new Promise(r => ff.on('close', r))
await browser.close()
console.log('done')
