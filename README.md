# Rita Samothraki - Μεσιτικό Γραφείο

Σύγχρονη ιστοσελίδα για μεσιτικό γραφείο, χτισμένη με **Astro + React + Tailwind CSS** και **Supabase** (database, auth, storage).

## 🌐 Live

- **Site:** https://chook-games.github.io/RitaSamothrakiMesitiko/
- **Admin Panel:** https://chook-games.github.io/RitaSamothrakiMesitiko/admin/

## 🏗️ Τεχνολογίες

| Επίπεδο | Τεχνολογία |
|---------|-----------|
| Static Site | Astro 5 (SSG) |
| UI Framework | React 19 |
| Styling | Tailwind CSS 4 |
| Database & Auth | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Deployment | GitHub Actions → GitHub Pages |

## 📋 Λειτουργίες

### Δημόσιο Site
- **Αρχική**: Hero section, Προτεινόμενες αγγελίες, Κατηγορίες, Πρόσφατες αγγελίες
- **Αγορά / Ενοικίαση / Πουλήθηκε**: Σελίδες με υποκατηγορίες και φίλτρα
- **Λεπτομέρεια αγγελίας**: Photo gallery, περιγραφή, τιμή, ενσωματωμένο YouTube video, τηλέφωνο
- **Το Γραφείο**: Πληροφορίες, λογότυπο, χάρτης, social links
- **Πλήρως responsive**: Mobile-first, hamburger menu, dropdowns

### Admin Panel (`/admin`)
- **Login** με email/password (Supabase Auth)
- **Dashboard**: Στατιστικά, πρόσφατες αγγελίες
- **Αγγελίες**: CRUD, upload φωτογραφιών (drag & drop), YouTube URL, "Προτεινόμενο" toggle, "Πουλήθηκε" status
- **Κατηγορίες**: Add/edit/delete (Αγορά, Ενοικίαση, Πουλήθηκε)
- **Ρυθμίσεις Γραφείου**: Όνομα, λογότυπο, τηλέφωνο, email, social links

## 🔐 Admin Login

- **Email:** `g.tsouhnikas@gmail.com`
- **Password:** (ορίστηκε κατά τη δημιουργία — Supabase Auth)

## 🗄️ Database Schema

Tables: `office_settings`, `categories`, `listings`, `listing_images`
- **RLS**: Public = SELECT μόνο, Authenticated (admin) = full CRUD
- **Storage buckets**: `listings` (φωτογραφίες αγγελιών), `office` (λογότυπο)
- Migration: `supabase/migration.sql`

## 💻 Τοπική Ανάπτυξη

```bash
# 1. Εγκατάσταση dependencies
npm install

# 2. Δημιουργία .env (βλέπε .env.example)
PUBLIC_SUPABASE_URL=https://obshrelxpvqszxzqdvcn.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 3. Dev server
npm run dev

# 4. Build
npm run build
```

## 🚀 Deployment

Κάθε push στο `master` κάνει αυτόματα build & deploy μέσω GitHub Actions (`.github/workflows/deploy.yml`).

Secrets που χρειάζονται στο repo:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

## 🎯 Μελλοντικές Βελτιώσεις

- SEO optimization (meta tags, sitemap, robots.txt)
- Μετάβαση σε Vercel/Netlify για SSR & καλύτερο SEO
- Contact form
- Property alerts
- Custom domain
