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
- **Αγορά / Ενοικίαση / Πουλήθηκε**: Σελίδες με υποκατηγορίες και φίλτρα
- **Λεπτομέρεια αγγελίας**: Photo gallery, περιγραφή, τιμή, ενσωματωμένο YouTube video, τηλέφωνο
- **Το Γραφείο**: Πληροφορίες, λογότυπο, χάρτης, social links
- **Δύο γλώσσες**: Ελληνικά (default) & Αγγλικά στο `/en/` με language switcher
- **Πλήρως responsive**: Mobile-first, hamburger menu, dropdowns

### Admin Panel (`/admin`)
- **Login** με email/password (Supabase Auth)
- **Dashboard**: Στατιστικά, πρόσφατες αγγελίες
- **Αγγελίες**: CRUD, upload φωτογραφιών (drag & drop), YouTube URL, "Προτεινόμενο" toggle, "Πουλήθηκε" status, αγγλικά πεδία + αυτόματη μετάφραση
- **Μαζική Εισαγωγή**: Εισαγωγή πολλών αγγελιών από JSON/CSV (π.χ. από xe.gr) με φωτογραφίες
- **Slideshow**: Ανέβασμα πολλών εικόνων μαζί, σειρά, ενεργό/ανενεργό, ρυθμίσεις διάρκειας & εφέ (crossfade/ολίσθηση/zoom/όλα)
- **Κατηγορίες**: Add/edit/delete (Αγορά, Ενοικίαση, Πουλήθηκε) με ελληνικό & αγγλικό όνομα
- **Ρυθμίσεις Γραφείου**: Όνομα, λογότυπο + μέγεθος λογότυπου, τηλέφωνο, email, social links (Ελληνικά/Αγγλικά)

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
