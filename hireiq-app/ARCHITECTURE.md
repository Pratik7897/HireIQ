# HireIQ Architecture

HireIQ is a modern recruiting platform built with a full-stack Next.js application, Supabase, and a custom Python AI backend.

## Tech Stack
* **Frontend:** Next.js 16 (App Router), React 19, Vanilla CSS (with CSS variables for theming).
* **Backend:** Next.js Serverless API routes.
* **Database:** Supabase (PostgreSQL) for relational data and Row-Level Security (RLS).
* **Storage:** Supabase Storage for secure resume and job description document storage.
* **AI Engine:** A separate FastAPI Python backend using `all-MiniLM-L6-v2` for generating embeddings and computing semantic similarities.

## System Design
The application handles resume and job description (JD) uploads as follows:
1. User uploads a PDF/DOCX via the Next.js frontend.
2. Next.js API route calls the Python AI backend (`/parse`) to extract text and generate an embedding vector.
3. The original file is stored in Supabase Storage.
4. The extracted JSON data and embedding vector are stored in the Supabase PostgreSQL database.
5. Background or ad-hoc processes call the AI backend (`/score`) to compute a percentage match between a candidate's embedding and a JD's embedding.

## Component Architecture
We prioritize reusable, accessible, and high-performance UI primitives.
* **Primitives (`src/components/ui/Primitives.tsx`):** Standard components such as Avatars, Badges, Loaders, and Buttons.
* **Layout (`src/components/layout/ClientLayout.tsx`):** Global application shell including the sidebar navigation and mobile header.
* **Modals (`src/components/ui/Modal.tsx`):** Dialog and Drawer components that utilize React portals and manage document focus/body scroll.

## Code Guidelines
1. **Performance:** Utilize `React.memo` and `useCallback` for heavy UI components (like the Pipeline board).
2. **Accessibility:** Ensure semantic HTML, ARIA labels for icon-only buttons, and proper keyboard navigation traps in Modals.
3. **Styles:** Stick to global CSS (`globals.css`) using CSS variables. Avoid generic class names without scope, and prefer BEM-like conventions if complex styling is required.
