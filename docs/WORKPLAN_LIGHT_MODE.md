# WORKPLAN: Light Mode Implementation for DocLoq

> **Created:** 2026-03-10  
> **Status:** Planning  
> **Estimated effort:** ~3–4 days (full implementation + QA)

---

## 1. Current State Analysis

### ✅ What Already Works
- **ThemeProvider** exists in `src/app/providers/ThemeProvider.jsx` with `useTheme()` hook
- **Theme toggle button** exists in sidebar (`DashboardLayout.jsx`) with sun/moon icons
- Tailwind `darkMode: 'class'` is configured in `tailwind.config.js`
- **`body`** in `main.css` already has light/dark gradient: `from-slate-50 ... dark:from-slate-950 ...`
- `.glass` utility supports both modes
- **~20 pages/components** already have `dark:` class variants (Dashboard, Documents, Forms, Settings, Tasks, Trash, etc.)

### ❌ What's Missing
- **~13 files are dark-only** — hardcoded dark backgrounds/text without light alternatives
- **Sidebar/Nav** is hardcoded `bg-slate-900` in both themes
- **Hardcoded hex/rgba** colors in inline styles (LandingPage, RotatingGlobe, SparklesCore, main.css scrollbar)
- **No CSS custom properties** — all colors are Tailwind classes or hardcoded values

---

## 2. Color Mapping Reference

### Backgrounds
| Dark Mode (current) | Light Mode (proposed) | Usage |
|---|---|---|
| `bg-slate-950` | `bg-white` | Page backgrounds, deep containers |
| `bg-slate-900` | `bg-slate-50` or `bg-white` | Cards, sidebar, panels |
| `bg-slate-800` | `bg-slate-100` | Inputs, secondary panels, hover |
| `bg-slate-700` | `bg-slate-200` | Interactive elements, dividers |
| `bg-white/5` | `bg-slate-900/5` | Transparent overlays in dark → light |
| `bg-white/10` | `bg-slate-900/10` | Transparent overlays |

### Text
| Dark Mode (current) | Light Mode (proposed) | Usage |
|---|---|---|
| `text-white` | `text-slate-900` | Primary text |
| `text-slate-300` | `text-slate-600` | Secondary text |
| `text-slate-400` | `text-slate-500` | Muted text |
| `text-slate-500` | `text-slate-400` | Disabled/tertiary |
| `text-slate-200` | `text-slate-700` | Chat bubbles, subtitles |

### Borders
| Dark Mode (current) | Light Mode (proposed) | Usage |
|---|---|---|
| `border-slate-700` | `border-slate-200` | Card borders |
| `border-slate-800` | `border-slate-200` | Input borders |
| `border-white/10` | `border-slate-200` | Subtle separators |
| `border-white/20` | `border-slate-300` | Stronger separators |

### Shadows
| Dark Mode (current) | Light Mode (proposed) | Usage |
|---|---|---|
| `shadow-black/50` | `shadow-slate-200` | General card shadow |
| `shadow-2xl` | `shadow-lg` | Large elevation (tone down in light) |
| Colored shadows stay the same but may need opacity adjustment |

### Accent Colors (No change needed — work on both)
- `violet-400/500/600` — brand primary
- `indigo-500/600` — sidebar active, buttons
- `purple-500/600` — gradients
- `cyan-400/500/600` — secondary brand
- `emerald-400/500` — success states
- `red-400/500` — error states
- `amber-400/500` — warning states

---

## 3. Implementation Phases

### Phase 1: Foundation & Layout (Day 1)
Priority: **Critical** — everything else depends on this

| # | Task | File(s) | Details |
|---|---|---|---|
| 1.1 | Add CSS custom properties for scrollbar & inline styles | `src/styles/main.css` | Create `--color-scrollbar-*`, `--color-glow-*` vars that switch with `.dark` class |
| 1.2 | Fix sidebar light mode | `src/components/layout/DashboardLayout.jsx` | Change `bg-slate-900` → `bg-white dark:bg-slate-900`, update text/border/nav-item colors, ensure logo & nav items are readable on light bg |
| 1.3 | Fix mobile top bar | `src/components/layout/DashboardLayout.jsx` | Same treatment as sidebar |
| 1.4 | Verify base UI components | `src/components/ui/Button.jsx`, `Input.jsx`, `Card.jsx` | Already have `dark:` — audit readability on light bg |
| 1.5 | Fix scrollbar colors | `src/styles/main.css` | Use CSS vars or `dark:` selectors for scrollbar track/thumb |

### Phase 2: Auth & Public Pages (Day 1–2)
Priority: **High** — first pages users see

| # | Task | File(s) | Details |
|---|---|---|---|
| 2.1 | Login page light mode | `src/features/auth/login.jsx` | Convert ~5 dark-only bg/text classes to dual-mode |
| 2.2 | OTP verification page | `src/features/auth/OTPVerification.jsx` | Convert ~6 dark-only classes |
| 2.3 | Admin login page | `src/features/admin/AdminLogin.jsx` | Convert ~7 dark-only classes |
| 2.4 | Contact page | `src/features/contact/Contact.jsx` | Heavy — ~19 dark bg instances, form inputs, text |
| 2.5 | Landing page | `src/features/landing/LandingPage.jsx` | Heaviest — ~20+ dark-only backgrounds, **multiple inline `rgba()` values** need CSS vars or conditional logic. Consider keeping landing page dark-only with forced `dark` class on its wrapper, OR convert fully. |

### Phase 3: Admin Pages (Day 2)
Priority: **High** — admin uses these daily

| # | Task | File(s) | Details |
|---|---|---|---|
| 3.1 | Admin Dashboard | `src/features/admin/AdminDashboard.jsx` | ~24 dark-only classes — cards, stats, charts |
| 3.2 | Admin Dashboard New | `src/features/admin/AdminDashboardNew.jsx` | ~24 dark-only classes (duplicate/alternative version) |
| 3.3 | AI Management | `src/features/admin/AIManagement.jsx` | Heaviest admin file — ~45 instances. Tabs, cards, stats, modals |
| 3.4 | Blockchain Settings | `src/features/admin/BlockchainSettings.jsx` | ~27 instances — settings panels, toggles |
| 3.5 | Role Management | `src/features/roles/RoleManagement.jsx` | ~21 instances — table, modals, badges |

### Phase 4: Audit & Fix Existing dual-mode Pages (Day 2–3)
Priority: **Medium** — these mostly work but may have gaps

| # | Task | File(s) | Details |
|---|---|---|---|
| 4.1 | Dashboard | `src/features/dashboard/Dashboard.jsx` | 111 `dark:` — audit for missed spots, readability |
| 4.2 | Documents | `src/features/documents/Documents.jsx` | 158 `dark:` — large file, check modals & dropdowns |
| 4.3 | Forms | `src/features/forms/Forms.jsx` | 198 `dark:` — most complete, quick audit |
| 4.4 | Settings | `src/features/settings/Settings.jsx` | 220 `dark:` — most complete, quick audit |
| 4.5 | Tasks | `src/features/tasks/Tasks.jsx` | 109 `dark:` — audit task cards, status badges |
| 4.6 | Trash | `src/features/documents/Trash.jsx` | 56 `dark:` — audit restore modal, empty state |
| 4.7 | Folder Hierarchy | `src/features/documents/FolderHierarchy.jsx` | 61 `dark:` — check hardcoded folder hex colors |
| 4.8 | Verification | `src/features/documents/Verification.jsx` | 102 `dark:` — audit QR code display bg |
| 4.9 | AI Analysis | `src/features/ai-analysis/AIDocumentAnalysis.jsx` | 72 `dark:` — audit analysis results panel |
| 4.10 | OSINT Tracker | `src/features/osint-tracker/OSINTTracker.jsx` | Only 1 `dark:` — needs full conversion |

### Phase 5: Chatbot & Shared Components (Day 3)
Priority: **Medium**

| # | Task | File(s) | Details |
|---|---|---|---|
| 5.1 | Chatbot page | `src/features/chatbot/Chatbot.jsx` | 30 `dark:` — audit bubbles, input, header |
| 5.2 | DoKi Widget | `src/components/chatbot/DokiWidget.jsx` | 51 `dark:` — floating widget, chat window |
| 5.3 | AI Assistant | `src/components/ai-assistant/AIAssistant.jsx` | 10 `dark:` — sidebar panel |
| 5.4 | OnlyOffice Editor | `src/components/onlyoffice/OnlyOfficeEditor.jsx` | 7 `dark:` — editor wrapper |
| 5.5 | Container Scroll | `src/components/ui/ContainerScrollAnimation.jsx` | 2 dark-only — hardcoded box-shadow |
| 5.6 | Display Cards | `src/components/ui/DisplayCards.jsx` | 1 dark bg — minor |
| 5.7 | ShiningText | `src/components/ui/ShiningText.jsx` | Hardcoded hex gradients — needs CSS vars |
| 5.8 | SparklesCore | `src/components/ui/SparklesCore.jsx` | Hardcoded `#ffffff` — conditional for theme |

### Phase 6: Special Handling & Polish (Day 3–4)
Priority: **Low** — visual polish

| # | Task | Details |
|---|---|---|
| 6.1 | RotatingGlobe canvas colors | Hardcoded `#000000`, `#ffffff`, `#999999` — make dynamic with theme prop or keep dark always |
| 6.2 | HeroShutterText theme variants | Currently white text — needs dark text for light mode |
| 6.3 | Landing page inline gradients | `rgba(139, 92, 246, ...)` etc. — use CSS vars or conditional rendering |
| 6.4 | Scrollbar appearance | `main.css` scrollbar uses hex colors — add `.dark` selector variant |
| 6.5 | Global animated backgrounds | Cyber-grid glow in `main.css` uses hardcoded `rgba()` — parameterize |
| 6.6 | Favicon / meta theme-color | Update `<meta name="theme-color">` for light/dark |

---

## 4. Conversion Pattern (Reference)

For every dark-only element, apply this pattern:

```jsx
// BEFORE (dark-only):
className="bg-slate-900 text-white border-slate-700"

// AFTER (dual-mode):
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
```

For inline styles with hardcoded colors, use CSS variables:

```css
/* main.css */
:root {
  --glow-primary: rgba(139, 92, 246, 0.15);
  --bg-deep: rgb(248, 250, 252);        /* slate-50 */
  --scrollbar-track: #f1f5f9;           /* slate-100 */
  --scrollbar-thumb: #8b5cf6;           /* violet-500 */
}
.dark {
  --glow-primary: rgba(139, 92, 246, 0.25);
  --bg-deep: rgb(2, 6, 23);             /* slate-950 */
  --scrollbar-track: #0f172a;           /* slate-900 */
  --scrollbar-thumb: #818cf8;           /* indigo-400 */
}
```

---

## 5. Font Readability Rules

| Element | Light Mode | Dark Mode |
|---|---|---|
| Page heading (h1) | `text-slate-900` (contrast ≥ 12:1) | `text-white` |
| Section heading (h2, h3) | `text-slate-800` (contrast ≥ 10:1) | `text-white` or `text-slate-100` |
| Body text | `text-slate-700` (contrast ≥ 7:1) | `text-slate-300` |
| Secondary/muted text | `text-slate-500` (contrast ≥ 4.5:1) | `text-slate-400` |
| Disabled text | `text-slate-400` (contrast ≥ 3:1) | `text-slate-500` |
| Links | `text-indigo-600` | `text-indigo-400` |
| Error text | `text-red-600` | `text-red-400` |
| Success text | `text-emerald-600` | `text-emerald-400` |
| Warning text | `text-amber-600` | `text-amber-400` |
| Placeholder text | `text-slate-400` | `text-slate-500` |

All contrast ratios follow **WCAG AA** (minimum 4.5:1 for normal text, 3:1 for large text).

---

## 6. Testing Checklist

After each phase, verify:
- [ ] Toggle between light/dark — no flash of wrong theme (FOUC)
- [ ] All text is readable (no white-on-white or dark-on-dark)
- [ ] All input fields have visible borders and text
- [ ] All modals/dialogs/dropdowns inherit correct theme
- [ ] Charts & visualizations are visible
- [ ] Hover/focus states are visible in both themes
- [ ] Scrollbar colors match theme
- [ ] Brand accent colors (violet/indigo) maintain consistency
- [ ] No stray dark patches in light mode
- [ ] No stray bright patches in dark mode

---

## 7. Decision Points

| Question | Options | Recommended |
|---|---|---|
| Landing page | (A) Convert to dual-mode, (B) Force dark-only | **A** — full conversion for consistency |
| RotatingGlobe canvas | (A) Dynamic colors via theme prop, (B) Always dark | **B** — globe is cosmetic, dark bg looks better |
| SparklesCore particles | (A) White in dark / dark in light, (B) Always white | **A** — pass color prop based on theme |
| Sidebar style | (A) White sidebar, (B) Keep dark sidebar always | **A** — full white sidebar for clean light mode |
| Admin pages | (A) Convert all, (B) Admin stays dark-only | **A** — admins use the toggle too |

---

## 8. File Impact Summary

| Category | Files | Effort |
|---|---|---|
| Dark-only → needs full conversion | ~13 | High |
| Has `dark:` → needs audit/fixes | ~12 | Medium |
| Neutral/canvas → optional | ~5 | Low |
| CSS/config files | 2–3 | Medium |
| **Total unique files** | **~33** | |

---

## 9. Suggested Execution Order

1. **Start with Phase 1** (layout/sidebar) — this unlocks visual feedback for all other pages
2. **Phase 2 next** (auth/public) — user-facing pages first  
3. **Phase 3** (admin) — admin sees the toggle but can't use it without this
4. **Phase 4** (audit existing) — quick pass, these mostly work already
5. **Phase 5** (chatbot/components) — shared components affect many pages
6. **Phase 6** (polish) — final visual refinements

> **Note:** Each phase can be tested independently. The theme toggle already works — after Phase 1, switching to light mode will show a working sidebar + layout even if inner pages still have dark patches.
