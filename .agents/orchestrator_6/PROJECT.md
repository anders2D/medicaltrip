# Project: Medical Trip Colombia S.A.S. — UI/UX Overhaul & Multi-Device Responsive Architecture

## Architecture
- **Framework**: React 19 + TypeScript (`strict: true`), Vite toolchain, Tailwind CSS, Lucide icons, Dexie IndexedDB, Web Workers.
- **Pattern**: Dual-Paradigm Responsive Layout Architecture (Desktop >= 1024px, Tablet 768px–1023px, Mobile < 768px).
- **Core Domain**: Hexagonal Architecture (Domain layer with BigInt integer cents `Money`, `OperativeTerritory` invariant, CQRS event stream).
- **State & Concurrency**: React state hooks + LocalStorage + Dexie DB + Decentralized Actor Swarms in Web Workers (`DRV`, `GUIA`, `NURSE`, `FIN`).

## Feature Inventory
| # | Feature | Description | Milestone | Status |
|---|---------|-------------|-----------|:------:|
| F1 | Desktop High-Density Layout | Top navigation bar (date range, Today, Prev/Next, view switcher tabs, patient archetype pills, "+ Nueva Cita" CTA), right slide-over drawers (480px), fixed bottom settlement dock | M1 | DONE |
| F2 | Mobile Native Ergonomics | Touch-optimized header, horizontal swipeable patient pills, 5-tab bottom navigation bar (`Mes`, `Semana`, `Día`, `Agenda`, `Balance`), floating action button (+) for quick event creation, swipe-to-dismiss bottom sheet drawer | M1 | DONE |
| F3 | Tablet Adaptive Layout | Adaptive 3-day / 5-day week views with split master-detail view capabilities (768px–1023px) | M1 | DONE |
| F4 | Telemetry Relocation & Clutter Elimination | Move Swarm Web Worker inspector from primary header to subtle secondary dropdown / footer toggle modal, keeping consumer UI 100% clean | M1 | DONE |
| F5 | Typography & WCAG AAA Contrast | `tabular-nums` for all financial figures, dates, times, and accessible contrast in both Light and Dark modes | M1 | DONE |
| F6 | Month View Responsive Ergonomics | Responsive 7-column grid with dynamic height scaling on desktop; mobile collapses into interactive dot-indicator mini calendar + below-grid day agenda | M2 | DONE |
| F7 | Week View Ergonomics & Time Indicator | 06:00 to 22:00 time grid with proportional event blocks, current-time indicator line across Today column, and touch-drag rescheduling | M2 | DONE |
| F8 | Day View & Agenda Ergonomics | High-density timeline cards displaying clinical specialty tags, doctor names, geofenced clinic locations, and companion/driver status badges | M2 | DONE |
| F9 | UI Micro-Interactions | Event hover cards with quick actions, optimistic drag-and-drop feedback with dashed ghost placeholders, fluid bottom-sheet transitions, confetti on settlement completion | M2 | DONE |
| F10 | Mobile Bottom-Sheet Settlement Bar | Compact bottom strip showing Net Balance that expands upward into full financial ledger breakdown on tap/swipe | M3 | DONE |
| F11 | Mobile-Optimized Receipt OCR Scanner | Direct camera/file upload with instant itemized extraction preview and ledger debit commit | M3 | DONE |
| F12 | Retina Digital Signature Pad | High-DPI canvas with smooth touch/stylus interpolation, palm-rejection simulation, legal consent certification, and clear/sign actions | M3 | DONE |
| F13 | Responsive Layout Matrix E2E Test Suite | Automated test suites verifying layout rendering, touch targets, and visual containers across 375px (iPhone), 768px (iPad), 1280px (Desktop), and 1920px (Widescreen) | M4 | DONE |
| F14 | 100% Vitest Pass Rate & Zero Type Errors | Maintain 100% test pass rate across all Vitest test suites (55 suites, 484 tests) with 0 TypeScript compilation errors under `strict: true` | M4 | DONE |
| F15 | Production Build & PWA Capabilities | Clean Vite production build in `dist/` with PWA service worker precaching, manifest, and standalone mobile app capabilities | M4 | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|:------:|
| M1 | Dual-Paradigm Layout & Telemetry | App layout shell, desktop top nav, mobile bottom nav (5 tabs), patient selector pill carousel, FAB (+), subtle telemetry relocation, and typography/contrast tokens | none | DONE |
| M2 | Responsive Calendar Views & Micro-Interactions | Month View (7-col grid + mobile dot indicator + day agenda), Week View (adaptive columns + live current-time indicator line), Day/Agenda views, hover cards, optimistic drag-and-drop ghost placeholders | M1 | DONE |
| M3 | Touch-First Settlement, OCR & Signature Pad | Collapsible bottom-sheet settlement drawer, mobile OCR scanner preview, high-DPI retina signature pad with palm rejection, and confetti celebrations | M1 | DONE |
| M4 | Final Integration, Multi-Device E2E Pass & Build | Execute full E2E responsive test suites (375px, 768px, 1280px, 1920px), 100% Vitest pass rate, 0 type errors, clean `dist/` build | M1, M2, M3 | DONE |

## Interface Contracts
### Layout Container & Responsive Context
```typescript
export type ViewportMode = 'mobile' | 'tablet' | 'desktop';
export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

export interface ResponsiveLayoutProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  selectedArchetypeId: string;
  onSelectArchetype: (id: string) => void;
  onOpenCreateModal: () => void;
  onOpenSettlement: () => void;
  isSettlementOpen: boolean;
}
```

## Code Layout
```
apps/medicaltrip_react_app/
├── src/
│   ├── domain/               # Pure DDD Entities, Value Objects (Money, OperativeTerritory), Ports
│   ├── application/          # Use Cases (CQRS event stream, settlement)
│   ├── infrastructure/       # Storage Adapters, Dexie IndexedDB, Archetypes Data
│   ├── presentation/         # UI Components
│   │   ├── components/
│   │   │   ├── calendar/     # MonthView, WeekView, DayView, AgendaView, EventCard, EventHoverCard, GhostDropIndicator, CalendarHeader
│   │   │   ├── navigation/   # MobileBottomNav, FloatingActionButton
│   │   │   ├── switcher/     # ArchetypeSwitcherBar (responsive pills carousel)
│   │   │   ├── drawer/       # EventDetailDrawer (slide-over right desktop / bottom-sheet mobile)
│   │   │   ├── settlement/   # DockedSettlementBar (compact pill / bottom sheet), ReceiptOcrModal, DigitalSignaturePad
│   │   │   └── swarm/        # SwarmStatusModal / Telemetry micro-indicator
│   │   ├── hooks/            # useMediaQuery, useConfetti
│   │   └── styles/           # Tailwind tokens, tabular-nums, WCAG AAA contrast
│   ├── App.tsx               # Root App Layout wiring
│   └── main.tsx
├── tests/                    # 55 Vitest test suites (484 tests passing)
├── dist/                     # Optimized production bundle
└── public/                   # PWA Manifest, Service Worker, Icons
```
