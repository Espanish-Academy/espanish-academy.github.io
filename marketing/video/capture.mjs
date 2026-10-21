// Captures real screens of the app (dev servers) for the tutorial video, plus tap-target positions.
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const D = 'http://localhost:5175' // demo data
const R = 'http://localhost:5174' // real sign-up screen (not submitted)
const OUT = new URL('./shots/', import.meta.url).pathname
fs.mkdirSync(OUT, { recursive: true })
const rects = {}
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--hide-scrollbars', '--font-render-hinting=none'],
})

async function fresh() {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
  return { ctx, page }
}
async function shot(page, name, { full = false } = {}) {
  await sleep(900)
  // full-page shots: hide the fixed bottom bar (the video draws it fixed on top while scrolling)
  if (full) await page.addStyleTag({ content: 'nav{display:none!important}' })
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage: full })
  if (full) await page.evaluate(() => document.querySelectorAll('style').forEach(s => s.textContent.includes('nav{display:none') && s.remove()))
  process.stdout.write(name + ' ')
}
async function rectOf(page, name, finder) {
  const r = await page.evaluate(finder)
  if (r) rects[name] = r
  return r
}
const byText = (sel, text) => `(() => { const el = [...document.querySelectorAll('${sel}')].find(e => e.textContent.trim().includes(${JSON.stringify(text)})); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y + window.scrollY, w: b.width, h: b.height } })()`
async function click(page, sel, text) {
  await page.evaluate(`(() => { const el = [...document.querySelectorAll('${sel}')].find(e => e.textContent.trim().includes(${JSON.stringify(text)})); el && el.click() })()`)
  await sleep(700)
}
async function type(page, nth, value) {
  const inputs = await page.$$('input')
  await inputs[nth].click(); await inputs[nth].type(value, { delay: 10 })
}

// 1 · sign-up screen
{
  const { ctx, page } = await fresh()
  await page.goto(`${R}/?lang=es&tab=up`, { waitUntil: 'networkidle0' })
  await shot(page, 'signup_empty')
  await type(page, 0, 'Ana'); await type(page, 1, 'ana@ejemplo.com'); await type(page, 2, 'mipassword')
  await rectOf(page, 'signup_btn', byText('button', 'Crear mi cuenta'))
  await shot(page, 'signup_filled')
  await ctx.close()
}

// 2 · level check
{
  const { ctx, page } = await fresh()
  await page.goto(`${D}/nivel`, { waitUntil: 'networkidle0' })
  await type(page, 0, 'Ana'); await type(page, 1, 'ana@ejemplo.com')
  await rectOf(page, 'nivel_start', byText('button', 'Start'))
  await shot(page, 'nivel_intro')
  await click(page, 'button', 'Start')
  await shot(page, 'nivel_about')
  await rectOf(page, 'nivel_about_opt', byText('button', 'Travel'))
  await click(page, 'button', 'Travel')
  await shot(page, 'nivel_about_sel')
  // run through the rest of "about you"
  for (let i = 0; i < 12; i++) {
    const h = await page.evaluate(() => document.querySelector('h1')?.textContent || '')
    if (/Thank you/.test(h)) break
    await page.evaluate(() => {
      const ta = document.querySelector('textarea')
      if (ta) { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, 'Flamenco'); ta.dispatchEvent(new Event('input', { bubbles: true })); return }
      const opt = [...document.querySelectorAll('button')].find(b => b.className.includes('border-b-4') && b.className.includes('rounded-3xl') && !/Continue/.test(b.textContent))
      if (opt && !/bg-sage-50/.test(opt.className)) opt.click()
    })
    await sleep(250)
    await click(page, 'button', 'Continue')
  }
  await shot(page, 'nivel_between')
  await click(page, 'button', 'Continue')
  await shot(page, 'nivel_q')
  await rectOf(page, 'nivel_q_opt', `(() => { const el = [...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Hello'); const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } })()`)
  await page.evaluate(() => [...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Hello').click())
  await shot(page, 'nivel_q_sel')
  await ctx.close()
}

// 3 · first screen after sign-up (new student)
{
  const { ctx, page } = await fresh()
  await page.goto(`${D}/?lang=es`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => localStorage.setItem('espanish-locale', 'es'))
  await page.goto(`${D}/?lang=es`, { waitUntil: 'networkidle0' })
  await click(page, 'button', 'alumno nuevo')
  await sleep(800)
  await shot(page, 'onboard_intro')
  await ctx.close()
}

// 4 · the student app (demo student, Spanish)
{
  const { ctx, page } = await fresh()
  await page.goto(`${D}/?as=student&lang=es`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => { localStorage.setItem('espanish-dev-push', 'off'); localStorage.setItem('espanish-locale', 'es') })
  await page.goto(`${D}/?as=student&lang=es`, { waitUntil: 'networkidle0' })
  await shot(page, 'home')
  await shot(page, 'home_full', { full: true })
  await rectOf(page, 'home_push', byText('button', 'Activar avisos'))
  await rectOf(page, 'home_next', `(() => { const el = document.querySelector('a.animate-soft-pulse-berry, a.animate-soft-pulse'); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y + scrollY, w: b.width, h: b.height } })()`)
  // a version of home without the notifications card (for the "after" state)
  await page.evaluate(() => localStorage.setItem('espanish-dev-push', 'on'))
  await page.goto(`${D}/?as=student&lang=es`, { waitUntil: 'networkidle0' })
  await shot(page, 'home_on')

  await page.goto(`${D}/chat?as=student&lang=es`, { waitUntil: 'networkidle0' })
  await shot(page, 'chat')
  await rectOf(page, 'chat_translate', `(() => { const els = [...document.querySelectorAll('button')].filter(e => e.textContent.includes('Traducir')); const el = els.at(-1); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } })()`)
  await page.evaluate(() => { const els = [...document.querySelectorAll('button')].filter(e => e.textContent.includes('Traducir')); els.at(-1)?.click() })
  await sleep(500)
  await shot(page, 'chat_translate_menu')

  await page.goto(`${D}/tasks?as=student&lang=es`, { waitUntil: 'networkidle0' })
  await shot(page, 'tasks')
  await rectOf(page, 'tasks_row', byText('a', 'práctica rápida'))
  await click(page, 'a', 'práctica rápida')
  await shot(page, 'task_view')
  await rectOf(page, 'task_start', byText('button', 'Empezar'))
  await click(page, 'button', 'Empezar')
  await shot(page, 'player_q')
  await rectOf(page, 'player_opt', `(() => { const el = [...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'sister'); const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } })()`)
  await page.evaluate(() => [...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'sister').click())
  await sleep(300)
  await shot(page, 'player_sel')
  await rectOf(page, 'player_check', byText('button', 'Comprobar'))
  await click(page, 'button', 'Comprobar')
  await shot(page, 'player_ok')

  await page.goto(`${D}/journey?as=student&lang=es`, { waitUntil: 'networkidle0' })
  await shot(page, 'journey')
  await rectOf(page, 'journey_row', byText('a', 'Mi familia'))
  await click(page, 'a', 'Mi familia')
  await shot(page, 'lesson', { full: true })

  await page.goto(`${D}/practice?as=student&lang=es`, { waitUntil: 'networkidle0' })
  await shot(page, 'practice')
  await page.evaluate(() => [...document.querySelectorAll('button')].find(e => e.textContent.includes('Mostrar'))?.click())
  await sleep(500)
  await shot(page, 'practice_flip')

  await page.goto(`${D}/calendar?as=student&lang=es`, { waitUntil: 'networkidle0' })
  await shot(page, 'calendar')

  await page.goto(`${D}/my-folder?as=student&lang=es`, { waitUntil: 'networkidle0' })
  await shot(page, 'folder')
  await rectOf(page, 'folder_card', byText('a', 'Teoría'))
  await click(page, 'a', 'Teoría')
  await shot(page, 'folder_theory')
  await ctx.close()
}

// 5 · teacher side
{
  const { ctx, page } = await fresh()
  await page.goto(`${D}/?as=teacher&lang=es`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => localStorage.removeItem('espanish-dev-push'))
  await page.goto(`${D}/?as=teacher&lang=es`, { waitUntil: 'networkidle0' })
  await shot(page, 'teacher_today')
  await page.goto(`${D}/students/demo-student?tab=files&as=teacher&lang=es`, { waitUntil: 'networkidle0' })
  await shot(page, 'teacher_files')
  await page.goto(`${D}/students/demo-student?tab=notebook&as=teacher&lang=es`, { waitUntil: 'networkidle0' })
  await shot(page, 'teacher_notebook')
  await ctx.close()
}

fs.writeFileSync(new URL('./rects.json', import.meta.url), JSON.stringify(rects, null, 2))
await browser.close()
console.log('\nrects:', Object.keys(rects).join(', '))
