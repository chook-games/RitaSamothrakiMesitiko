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
- **Αρχική**: Hero slideshow με φωτογραφίες, Προτεινόμενες αγγελίες, Κατηγορίες, Πρόσφατες αγγελίες
- **Αγορά / Ενοικίαση**: Σελίδες με υποκατηγορίες και φίλτρα
- **Λεπτομέρεια αγγελίας**: Photo gallery, περιγραφή, τιμή, ενσωματωμένο YouTube video, τηλέφωνο
- **Το Γραφείο**: Πληροφορίες, λογότυπο, χάρτης, social links
- **Δύο γλώσσες**: Ελληνικά (default) & Αγγλικά στο `/en/` με language switcher
- **Πλήρως responsive**: Mobile-first, οριζόντιο μενού στο κινητό, dropdowns

### Admin Panel (`/admin`)
- **Login** με email/password (Supabase Auth)
- **Dashboard**: Στατιστικά, πρόσφατες αγγελίες
- **Αγγελίες**: CRUD, upload φωτογραφιών (drag & drop), YouTube URL, "Προτεινόμενο" toggle, αγγλικά πεδία + αυτόματη μετάφραση
- **Μαζική Εισαγωγή**: Εισαγωγή πολλών αγγελιών από JSON/CSV (π.χ. από xe.gr) με φωτογραφίες
- **Slideshow**: Ανέβασμα πολλών εικόνων μαζί, σειρά, ενεργό/ανενεργό, ρυθμίσεις διάρκειας & εφέ (crossfade/ολίσθηση/zoom/όλα)
- **Κατηγορίες**: Add/edit/delete (Αγορά, Ενοικίαση) με ελληνικό & αγγλικό όνομα
- **Ρυθμίσεις Γραφείου**: Όνομα, λογότυπο + μέγεθος λογότυπου, πολλαπλά τηλέφωνα (σταθερό/κινητό), email, social links (Facebook/Instagram/YouTube/TikTok) Ελληνικά/Αγγλικά

## 🔐 Admin Login

Ο λογαριασμός διαχειριστή **δημιουργείται στο Supabase** (δεν είναι σταθερός κωδικός τύπου `admin`):

1. Άνοιξε το project στο [supabase.com](https://supabase.com) → **Authentication → Users**.
2. **Add user** → βάλε email + κωδικό, και ενεργοποίησε **Auto Confirm User**.
   (ή άνοιξε υπάρχοντα χρήστη → **Reset password**)
3. Συνδέσου στο `/admin/` με αυτό το email/κωδικό.

Αν ο κωδικός χαθεί, η φόρμα σύνδεσης έχει **«Ξέχασα τον κωδικό»** (στέλνει email επαναφοράς, εφόσον υπάρχει ο λογαριασμός).

## 🗄️ Database Schema

Tables: `office_settings`, `categories`, `listings`, `listing_images`
- **RLS**: Public = SELECT μόνο, Authenticated (admin) = full CRUD
- **Storage buckets**: `listings` (φωτογραφίες αγγελιών), `office` (λογότυπο)
- Migration: `supabase/migration.sql`
- i18n + import metadata: `supabase/migrations/20260920000000_i18n_and_import.sql`
- Hero slideshow + logo size: `supabase/migrations/20260920010000_hero_slides.sql`
- Hero slideshow settings (duration/effect): `supabase/migrations/20260920020000_hero_settings.sql`
- Multiple phone numbers: `supabase/migrations/20260920030000_phones.sql`
- Phone types (mobile/landline): `supabase/migrations/20260920040000_phone_types.sql`
- Image titles + primary image: `supabase/migrations/20260920050000_image_titles.sql`

## 📥 Μαζική Εισαγωγή Αγγελιών (xe.gr / Χρυσή Ευκαιρία)

Στο Admin Panel → **Μαζική Εισαγωγή** επικολλάς JSON ή CSV. Υποστηρίζονται ελληνικά και αγγλικά ονόματα στηλών.

Παράδειγμα JSON:

```json
[
  {
    "external_id": "xe-12345",
    "code": "RS-001",
    "title": "Διαμέρισμα 80τμ, κέντρο",
    "description": "Περιγραφή ακινήτου...",
    "price": 150000,
    "type": "agora",
    "category": "diamerisma",
    "phone": "6970000000",
    "images": ["https://.../1.jpg", "https://.../2.jpg"],
    "youtube_url": "",
    "is_featured": false,
    "status": "active"
  }
]
```

Στήλες CSV: `external_id, code, title, description, price, type, category, phone, images, youtube_url, is_featured, status`
(τα `images` χωρίζονται με `|`)

- `type`: `agora`, `enoikiasi`, `poulithike` (ή αγορά/ενοικίαση/πουλήθηκε)
- Χρησιμοποιείται το `external_id` για αποφυγή διπλοεγγραφών σε επαναληπτική εισαγωγή.
- Οι εικόνες μεταφορτώνονται στο Supabase Storage (αν το CORS του xe.gr το επιτρέψει), αλλιώς αποθηκεύεται το εξωτερικό URL.

## 🤖 Αυτόματη Μετάφραση (AI)

Η μετάφραση Ελληνικών → Αγγλικών γίνεται από το Supabase Edge Function `translate` (υποστηρίζει OpenAI ή DeepL).

```bash
# Deploy
supabase functions deploy translate

# Secrets (ένα από τα δύο)
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set DEEPL_API_KEY=xxxxxxxx:fx

# Προαιρετικά
supabase secrets set OPENAI_MODEL=gpt-4o-mini
```

Χωρίς ρυθμισμένο provider, η μετάφραση απενεργοποιείται και χρησιμοποιούνται τα ελληνικά κείμενα.


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

### Cloudflare Pages (production — root domain)

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → διάλεξε το repo.
2. Build settings: Framework **Astro**, Build command `npm run build`, Output directory `dist`.
3. Environment variables:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - (προαιρετικά) `PUBLIC_SITE_URL=https://realestate.samothraki.gr`
   - `NODE_VERSION=22`
4. Custom domain: Pages project → **Custom domains** → πρόσθεσε το domain (CNAME στο DNS σου).
5. Κάθε push στο `master` κάνει αυτόματα deploy.

Το `astro.config.mjs` χρησιμοποιεί `base: '/'` όταν το `DEPLOY_TARGET` δεν είναι `ghpages` — άρα Cloudflare σερβίρει στη ρίζα του domain.

### GitHub Pages (προσωρινά / εναλλακτικά)

Κάθε push στο `master` κάνει build & deploy μέσω GitHub Actions (`.github/workflows/deploy.yml`) με `DEPLOY_TARGET=ghpages`, ώστε να κρατάει το base `/RitaSamothrakiMesitiko`.

Secrets που χρειάζονται στο repo:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

### Supabase (καινούργιο domain)

Authentication → URL Configuration:
- **Site URL**: `https://realestate.samothraki.gr`
- **Redirect URLs**: `https://realestate.samothraki.gr/**`

## 🎯 Μελλοντικές Βελτιώσεις

- SEO optimization (meta tags, sitemap, robots.txt)
- Contact form
- Property alerts
- Custom domain
