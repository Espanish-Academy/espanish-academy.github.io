# Espanish 🌿

A calm, private Spanish-learning space between one teacher and her students.

## What's inside

**Student**
- **Opening questionnaire**: one friendly question per screen covering why they're learning, pace, current level (with listening and reading checks), how they learn, and interests. The questions are based on the teacher's own list, and each one shows her original Spanish wording.
- **Home**: always shows one big "next step" card (class today, a new message, homework due…).
- **Chat** with the teacher: text, photos, links (YouTube previews). Only for Spanish.
- **Tasks**: homework (PDFs, links, a photo of the work), interactive exercises and tests, Duolingo-style with instant feedback.
- **My journey**: every class from the first one, with topics, summary, new words (tap to hear them), materials and recordings.
- **Practise**: flashcards with every word learned so far.
- **Calendar**: upcoming classes and due dates, plus "add to my phone calendar".

**Teacher**
- **Today**: what's waiting (class summaries to write, messages, homework to review).
- **Student portfolio**: questionnaire summary, estimated level, what they love, how they learn, where they struggle (collected across class notes), and ideas for the next class.
- **Class log**: date, topics, vocabulary, a summary for the student, materials, recording link, and **private notes** (struggles, work on next, skip for now) that only the teacher sees.
- **Task builder**: templates, PDFs/links, multiple-choice / fill-the-gap / open questions, grading, and feedback.
- **Messages** and **calendar** covering all students.

## Languages, mascot and notebook

- **Languages:** the teacher always sees Spanish. Each student picks Spanish or English (at the start, or in their profile). Anything people write (lessons, homework, chat) stays in the language it was written in. Chat messages have a **Translate** button (Spanish / English / Hebrew) that uses the free MyMemory API — only the tapped message's text is sent.
- **Abanico** (the fan mascot, `src/assets/abanico.webp`, component `components/Mascot.tsx`) appears in greetings, celebrations, reminders, empty states and toasts, with a different animation per mood.
- **Notebook:** a private, auto-saving page per student (to improve, to practise, homework, free notes), shown to the teacher when she plans the next class.
- **View as student:** the teacher can open the app exactly as a student sees it (read-only), in Spanish or English.

## Run it

```bash
npm install
npm run dev
```

With no `.env` it runs in **demo mode**: sample data, saved only in this browser.

## Connect Supabase (real use)

1. Create a Supabase project.
2. Apply `supabase/migrations/` (`supabase link` then `supabase db push`, or paste them into the SQL Editor in order).
3. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
4. Optional: Authentication → Providers → Email → turn off "Confirm email" so sign-up is instant.
5. Register the teacher's email once (before she signs up):
   ```sql
   insert into public.teacher_emails (email, name) values ('HER_EMAIL', 'Profe');
   ```
6. Students sign up with the same link. They see only their own data. Private notes are protected by row-level security.

## Deploy (GitHub Pages)

```bash
npm run deploy
```

This builds with the Supabase keys from `.env` and publishes to the `gh-pages` branch. The app lives at `https://<user>.github.io/<repo>/`. Students open that link and choose **Add to Home Screen**.

## Hebrew later

All UI text goes through `t()` in `src/lib/i18n.ts`. Fill the `he` dictionary and the layout flips to RTL: spacing uses logical start/end classes throughout.
