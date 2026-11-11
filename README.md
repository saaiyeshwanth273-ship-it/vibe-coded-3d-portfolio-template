# Vibe Coded 3D Portfolio Universe — Open-Source Template

An interactive **3D Isometric Circuit Command Hub & Full-Stack Portfolio Template** built with **React 19, Three.js, TypeScript, Tailwind CSS v4, Express, and PostgreSQL (Drizzle ORM)**.

Designed with a high-contrast **Black, Crimson Red, and Pure White Neon** aesthetic, this template lets developers, AI engineers, students, and builders launch their own interactive 3D spatial portfolio with zero external 3D model dependencies, a dynamic vector PDF 1.4 resume generator, and a zero-trust owner CMS.

---

## Key Features

1. **Interactive 3D Circuit Command Floor (Three.js)**
   - Procedural silicon die textures, glowing circuit traces, and interactive 3D stations (`ABOUT`, `SKILLS`, `AI LAB`, `PROJECTS`, `LEADERSHIP`, `RESUME`, `CONNECT`).
   - Smooth orbital scroll-linked camera choreography, keyboard navigation (`WASD` / Arrow keys), and software-WebGL fallback for instant 60 FPS performance on any device.

2. **Bespoke Architectural PDF 1.4 Resume Engine**
   - Dynamically generates a 2-page vector PDF resume (`/api/resume/download`) directly from your portfolio configuration or database records.
   - Features an Obsidian & Crimson executive masthead, geometric monogram emblem, numbered section badges (`01`–`08`), and embedded `/Subtype /Link` clickable URI annotations for Email, LinkedIn, GitHub, and project repositories.

3. **Full-Stack Control Plane & Optional Owner CMS (`/admin`)**
   - Works out-of-the-box with deterministic starter data or backed by PostgreSQL with Row-Level Security (RLS).
   - Hardened authentication: `scrypt` password hashing, optional TOTP 2FA, signed `HttpOnly` session cookies, CSRF origin enforcement, rate limiting, and magic-byte file upload validation.

---

## Quick Start (Customize for Your Own Portfolio)

### 1. Clone the Template Repository
```bash
git clone https://github.com/your-username/vibe-coded-3d-portfolio-template.git my-3d-portfolio
cd my-3d-portfolio
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your own settings (all external integrations are optional for local development):
```bash
cp .env.example .env
cp firebase-applet-config.example.json firebase-applet-config.json
```

### 3. Customize Your Profile, Projects & Skills
Edit your profile identity, projects, skills, AI models, leadership roles, and achievements in:
- `src/db/seed.ts` (for database-backed or fallback starter data)
- Or sign in to `/admin` once your `OWNER_EMAIL` is configured in `.env` to edit your portfolio live through the CMS.

### 4. Run in Development or Production
```bash
# Start full-stack dev server on http://localhost:3000
npm run dev

# Run unit & security test suite
npx tsx --test src/server/security.test.ts src/three/sceneMath.test.ts

# Build for production
npm run build
npm start
```

---

## Security & Privacy Architecture

- **Zero Secrets in Repository**: All API keys, database passwords, session secrets, and Firebase credentials are excluded via `.gitignore` and loaded strictly from server-side environment variables.
- **Strict Input & Upload Validation**: Every API route enforces strict Zod schemas (`.strict()`), HTML/header injection sanitization, honeypot & timing bot guards, and magic-byte binary signature verification (`PNG`, `JPEG`, `WEBP`, `PDF`).
- **Proxy-Aware Rate Limiting & CSRF Defense**: Mutating routes enforce same-site `Origin`/`Referer` validation and sliding-window rate limiters.

---

## License

MIT License — Free to fork, customize, and deploy for your own personal portfolio.
