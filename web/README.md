# TinyOps Web

A minimal dashboard for TinyOps API. Built with React, Vite, and shadcn/ui.

## Tech Stack

- ⚡ **Vite** - Dev server and bundler
- ⚛️ **React 19** - UI
- 🔄 **TanStack Query** - Data fetching, caching, and polling
- 🎨 **shadcn/ui + Tailwind CSS v4** - Components and styling
- 🔷 **TypeScript** - Type safety

## Getting Started

### 1. Install dependencies

```bash
cd web
npm install
```

### 2. Start the API

The dev server proxies `/api` to `http://localhost:3000`, so the API must be running. From the root:

```bash
npm run dev
```

### 3. Start the dashboard

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Available Scripts

| Script            | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start dev server         |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
