# Mukyala Day Spa – Web Application

Welcome to the codebase for **Mukyala Day Spa**, a modern React + Vite application that delivers the spa’s timeless luxury and old-school customer service in a digital experience.

---

## 🧭 Project Purpose

The goal of this repository is to rebuild the exported Webflow marketing site as clean, maintainable React components while adding true application features such as routing, booking, commerce, and AI-powered recommendations.

*Tech stack*

• Vite 7 + React 19 + TypeScript 5  
• TanStack Router & React-Query  
• Framer-Motion for animations  
• ESLint 9 flat-config with @typescript-eslint

---

## ✨ Brand Values

Mukyala isn’t just another spa; it is an ethos built on respect, timeless elegance, and nurturing technology. These values drive both our in-person service and every line of code in this app.

| Pillar | What it means | Real-world example |
|-------|---------------|--------------------|
| **Old-School Customer Service for Everyone** | We know our guests by name and treat each with genuine respect. | The receptionist greets a long-time guest by name and remembers their favourite treatment. |
| **Luxury & Timeless Experiences** | Every interaction should feel indulgent and enduring. | Warm essential-oil towels are offered during a massage to elevate relaxation. |
| **Technology that Enhances, not Hurries** | AI and notifications encourage, never pressure. | A push reminder says *“We think your skin will love this!”* instead of a hard sell. |
| **Consistency through Positive Reinforcement** | Gentle, celebratory nudges help guests stay on track. | *“Great job! Your skin is glowing after 3 facials – let’s keep the momentum!”* |
| **Competent, Cordial & Human** | Knowledgeable, polite, never insincere. | Staff research an answer rather than give a vague response. |
| **Attraction, not Chase** | Quality & authenticity draw people in; loyalty is earned. | Invitation-only events replace frequent discount blasts. |
| **Timeless Elegance in Every Detail** | Classic décor, quality products, refined UX. | Treatment rooms feature classic art and natural fragrances. |
| **Unwavering Respect for All** | Inclusivity & confidentiality are non-negotiable. | Personal details shared in treatment remain private. |

These principles influence UI copy, notification tone, colour selection, and even performance budgets (luxury feels smooth, never rushed).

---

## 🚀 Getting Started

```bash
# Install deps
npm install

# Start dev server
npm run dev

# Lint
npm run lint

# Production build
npm run build
```

### Folder overview

```
src/
  assets/            Static images, svg, video referenced by components
  components/
    layout/          Header, Footer, etc.
    sections/        Hero, ServicesGrid, … (see TODO.md)
  pages/             Route entry components (Home, About, …)
  router.tsx         TanStack Router config
public/              Global CSS, fonts, favicon, Webflow assets
TODO.md              Detailed migration checklist
```

---

## 🛣️ Roadmap

The step-by-step migration plan lives in **TODO.md**. High-level milestones:

1. Asset + global-style import (Phase 0) ✔️  
2. Layout shell: Header & Footer 🛠️  
3. Home-page sections converted to JSX (Hero → CTA)  
4. Routing + page scaffolds  
5. Replace Webflow interactions with Framer-Motion  
6. Extract UI primitives & clean unused CSS  
7. Connect real booking & product APIs

---

## 📜 License

Internal project – all rights reserved.
