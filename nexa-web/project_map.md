# Nexa Enterprise Portal — Project Map & Architectural Source of Truth

**Project:** Nexa Enterprise Knowledge & Engineering Portal  
**System Architecture:** Next.js (App Router), React 19, TypeScript, Tailwind CSS, TanStack Query, Zustand  
**Theme Standard:** Futuristic "AI Product Design"  
- **Background:** Deep Dark (`#090D16` / `#0B0F19`)  
- **Accent Gradients:** Electric Purple (`#A855F7`) ↔ Neon Cyan (`#22D3EE`)  
- **Visual Effects:** Radial Aurora Glow, Glassmorphic Surfaces (`backdrop-blur-xl`, `border-white/10`)  
- **Typography:** Modern clean sans-serif with monospace accents for code & metrics

---

## 1. Directory State & Route Map

```
w:/Nexa/nexa-web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/                 # Authentication portal
│   │   │   ├── register/              # User onboarding
│   │   │   ├── forgot-password/       # Password recovery
│   │   │   └── verify-account/        # Email confirmation
│   │   ├── admin/                     # Enterprise Governance Module
│   │   │   ├── article-reviews/       # Editorial review queue
│   │   │   ├── audit-logs/            # Immutable system audit trail
│   │   │   ├── categories/            # Taxonomy categories management
│   │   │   ├── moderation/            # Flagged content reports & decisions
│   │   │   ├── tags/                  # Global taxonomy tags
│   │   │   ├── users/                 # Enterprise User Directory & RBAC
│   │   │   │   └── [id]/              # User Detail & role management
│   │   │   ├── layout.tsx             # Admin Navigation Shell
│   │   │   └── page.tsx               # Admin Platform KPI Analytics
│   │   ├── articles/                  # Knowledge Base & Stream Module
│   │   │   ├── [slug]/                # Article detail, TOC, comments, related
│   │   │   └── page.tsx               # Stream discovery (Latest, Trending, Popular, Feed)
│   │   ├── contributors/              # Leaderboard & Top Contributors
│   │   ├── dashboard/                 # Author Studio Module
│   │   │   ├── bookmarks/             # Saved bookmarks repository
│   │   │   ├── following-tags/        # Followed taxonomy streams
│   │   │   ├── likes/                 # Liked articles archive
│   │   │   ├── media/                 # Digital asset manager
│   │   │   ├── profile/               # Public identity & biography editor
│   │   │   ├── security/              # Password change & credentials
│   │   │   ├── series/                # Multi-part article series manager
│   │   │   └── page.tsx               # Author metrics & published/drafts manager
│   │   ├── editor/                    # CMS & Markdown Studio
│   │   │   ├── [id]/                  # Block & Markdown editor with live preview
│   │   │   │   ├── revisions/         # Revision snapshot history
│   │   │   │   │   └── [revisionId]/  # Point-in-time snapshot & restore
│   │   │   └── new/                   # New draft initialization
│   │   ├── notifications/             # Notification inbox & action drawer
│   │   ├── search/                    # Global search index (Articles, Users, Tags)
│   │   ├── series/                    # Curated series view
│   │   │   └── [slug]/                # Multi-part article sequence & roadmap
│   │   ├── u/                         # User profile view
│   │   │   └── [userName]/            # Public portfolio & author articles
│   │   ├── globals.css                # AI Product Design design tokens
│   │   ├── layout.tsx                 # Root layout with Header, Footer, Providers
│   │   ├── not-found.tsx              # Resilient custom 404
│   │   └── page.tsx                   # Futuristic AI-inspired Landing Page
│   ├── components/
│   │   ├── articles/                  # ArticleCard, MarkdownViewer, NotebookEditor
│   │   ├── home/                      # Hero CTA controllers, metrics components
│   │   ├── layout/                    # Global Header, Footer, Sidebar controllers
│   │   └── ui/                        # Reusable Atomic UI Kit
│   ├── hooks/                         # useToast, useDebounce, etc.
│   ├── lib/
│   │   ├── api/                       # Typed client layer connecting to ASP.NET Core
│   │   ├── stores/                    # Zustand: auth.store, csrf.store, ui.store
│   │   ├── types/                     # Enterprise TypeScript DTO contracts
│   │   └── utils/                     # Formatters, sluggers, date utilities
│   └── next.config.ts                 # Next.js configuration & TLS dev resilience
└── project_map.md                     # Absolute architectural source of truth
```

---

## 2. 4-Phase Roadmap & Milestones

- [x] **Protocol 0:** Established `project_map.md` & Blueprint Proposal Artifact.
- [x] **Phase 1: Blueprint & Baseline System Design (Atomic UI Kit)**
  - [x] Standardized Tailwind theme tokens (Deep dark backgrounds `#090D16`, Neon Cyan `#22D3EE`, Electric Purple `#A855F7`, Glass surfaces).
  - [x] Implemented & verified atomic components in `@/components/ui/` (`Button` with `neonCyan`, `neonPurple`, `glassOutline` variants, `Badge` with `neonCyan`, `neonPurple`, `glass` variants, `Input`, `Card`, `Tooltip`, `Skeleton`).
- [x] **Phase 2: Global Architecture & System Layout**
  - [x] Fixed Intelligent Top Navbar with Aurora glow branding, live search suggestions popover, and responsive controls.
  - [x] Hierarchical Multi-tier Left Sidebar (`global-sidebar.tsx`) with dynamic collapse/expand and role-based sections (Hub Tri Thức, Studio Tác Giả, Quản Trị Hệ Thống).
  - [x] Decoupled Main Viewport with independent scroll and dynamic left padding transitions (`md:pl-64` / `md:pl-18`).
  - [x] Assembly layout component `RootLayoutShell` (`src/components/layout/root-layout.tsx`) seamlessly binding Navbar, Sidebar, Viewport, Footer, and Toaster into `src/app/layout.tsx`.
  - [x] Zero-regression build verification (`npm run build`: 29/29 routes compiled cleanly).
- [x] **Phase 3: Modular Sub-Systems & AI Design Integration**
  - [x] Tách lập cấu trúc phân hệ ứng dụng độc lập (`src/apps/knowledge`, `src/apps/author`, `src/apps/admin`).
  - [x] **Phân hệ Knowledge Hub:**
    - [x] `/articles`: Grid Layout thẻ bài viết kính mờ Glassmorphism phát sáng nhẹ, badge đa sắc, phân loại tab Khám phá / Xu hướng / Đọc nhiều.
    - [x] `/search`: Giao diện tìm kiếm nâng cao với Sidebar bộ lọc đa chiều (Tags, Tech Stack/Ngôn ngữ, Tác giả, Thời gian) & kết quả trực tiếp.
    - [x] `/series`: Bản đồ lộ trình học tập, thanh tiến trình % hoàn thành và dòng thời gian (Timeline) các bài học.
  - [x] **Phân hệ Author Studio & CMS:**
    - [x] `/editor` & `/editor/new`: Trình soạn thảo 2 cột song song (Split-screen), live CSS preview thời gian thực, hỗ trợ Markdown & Code Syntax.
    - [x] `/dashboard`: Bảng điều khiển tác giả với biểu đồ tương tác 7 ngày qua, quản lý Media Assets và lịch sử phiên bản (Version History).
  - [x] **Phân hệ Enterprise Governance:**
    - [x] `/admin`: Giao diện bảng quản trị 3 Tab thông minh: Tab 1 Quản lý Users (Data Table, tìm kiếm, khóa/mở tài khoản), Tab 2 RBAC Matrix (ma trận phân quyền chi tiết cho Admin, Editor, Author, User), Tab 3 Hàng đợi kiểm duyệt vi phạm (Duyệt nhanh / Từ chối kèm lý do).
  - [x] Thiết lập kho dữ liệu mô phỏng (`src/lib/mock/mock-data.ts`) chuẩn TypeScript DTO contracts kết hợp fallback tự thích ứng.
- [x] **Phase 4: Global State, Self-Healing Regulation & Validation**
  - [x] Zustand state synchronization (`auth.store`, `csrf.store`, `ui.store`).
  - [x] TLS dev certificate self-healing (`undici Agent` + `NODE_TLS_REJECT_UNAUTHORIZED=0`).
  - [x] Zero-error TypeScript verification (`npx tsc --noEmit`: 0 errors).
  - [x] 100% clean production build (`npm run build`: 29/29 routes compiled successfully).

---

## 3. Design Tokens & Visual Specifications
- **Background Light:** `oklch(0.985 0.005 247)`
- **Background Dark:** Deep Dark `#090D16` / `oklch(0.11 0.025 255)`
- **Hero Title Gradient:** `linear-gradient(135deg, #C084FC 0%, #A855F7 35%, #38BDF8 70%, #22D3EE 100%)`
- **Neon Glow Cyan:** `box-shadow: 0 0 28px -4px rgba(34, 211, 238, 0.65)`
- **Neon Glow Purple:** `box-shadow: 0 0 32px -4px rgba(168, 85, 247, 0.45)`
- **Glassmorphic Surface:** `background: rgba(14, 19, 32, 0.55); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.07);`
