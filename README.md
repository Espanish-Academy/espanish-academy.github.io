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

Pushing to `main` builds and publishes automatically (`.github/workflows/deploy.yml`).

1. In the repo, go to **Settings → Pages → Source: GitHub Actions**.
2. Go to **Settings → Secrets and variables → Actions → Variables** and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. In Supabase, go to **Authentication → URL Configuration** and set the Site URL to `https://<user>.github.io/<repo>/`.

The app is then at `https://<user>.github.io/<repo>/`. Students open it and choose **Add to Home Screen**.

## Hebrew later

All UI text goes through `t()` in `src/lib/i18n.ts`. Fill the `he` dictionary and the layout flips to RTL: spacing uses logical start/end classes throughout.
