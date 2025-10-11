# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `bun run dev` - Start development server with Vite

### Package Management
- Uses Bun as the primary package manager
- Has both `yarn.lock` and `bun.lock` - project supports both Yarn and Bun
- README indicates Bun is preferred for development

## Architecture & Structure

### Framework
- **SvelteKit** application using Svelte 5 with TypeScript
- **TailwindCSS** for styling with @tailwindcss/vite plugin
- **Zod** for schema validation
- **Sveltekit Superforms** for form handling
- **Svelecte** component for advanced select inputs

### Core Configuration
- Environment-based configuration system in `src/lib/config/index.ts`
- Requires `VITE_API_BASE_URL` environment variables
- Configuration throws errors if required environment variables are missing
- Example config in `src/lib/config.example.ts` 

### Application Structure
This is a warehouse management frontend with the following domain areas:

**Core Entities:**
- **Storage** - Central concept linking items to containers with quantities
- **Items** - Products/inventory managed in the warehouse  
- **Containers** - Storage locations (identified by fastCode)
- **Categories** - Item classification system

**Route Structure:**
- `/` - Home page
- `/item/[slug]` - Individual item details and storage management
- `/container/[slug]` - Container details
- `/category/[slug]` - Category browsing
- `/storage/` - Storage management with add/edit functionality

### Key Components & Patterns

**StorageForm Component** (`src/lib/components/StorageForm.svelte`):
- Dual-mode component supporting both 'add' and 'edit' operations
- Uses Svelecte for container selection with fastCode labels
- Integrates with SvelteKit form actions via `use:enhance`
- Handles item SKU display and container selection

**Server-side Actions:**
- Form handling follows SvelteKit patterns with `+page.server.ts` files
- API communication uses the centralized config system
- POST requests to backend API endpoints at `/warehouse/api/`
- Redirects after successful operations (e.g., back to item page after storage creation)

**Data Flow:**
- Frontend fetches data from backend API using configured base URLs
- Forms submit to SvelteKit actions which proxy to backend API
- Uses TypeScript interfaces for type safety (e.g., `ContainerBriefID`)

### Navigation & Layout
- Simple navigation bar in `+layout.svelte` with links to main sections
- Uses SvelteKit's file-based routing system
- Layout includes global CSS imports

## Development Notes

### Configuration Setup
1. Copy `src/lib/config.example.ts` to understand required environment variables
2. Set up `VITE_API_BASE_URL` environment variables
3. Backend API expected to be available at configured endpoints

### API Integration
- All API calls go through the config system - never hardcode URLs
- Backend is a separate service providing python REST API endpoints under like`/warehouse/api/`
- Image serving also handled by backend at configured IMAGE_BASE_URL

### Component Development
- Use Svelte 5 syntax (`$props()`, `$state()`, etc.)
- Follow existing patterns for form components with dual add/edit modes
- Utilize Svelecte for complex select inputs
- Implement proper TypeScript interfaces for props and data structures