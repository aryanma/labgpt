# LabGPT

A modern web application built with Next.js for managing and viewing documents with AI capabilities.

## Project Structure

```
/src
  /app            → Next.js app directory (pages, layouts, routes)
  /core           → Core application logic and components
    /auth         → Authentication related components and logic
    /global       → Global components and utilities
    /page-viewer  → Document viewing functionality
    /workspaces   → Workspace management features
  /utils          → General-purpose utility functions
```

### Additional Project Directories
```
/.next           → Next.js build output
/public          → Static files
/node_modules    → Project dependencies
```

## Tech Stack

- **Framework**: Next.js 15.3.0
- **Language**: TypeScript
- **UI**: 
  - Tailwind CSS
  - Radix UI components
  - Lucide React icons
- **Database**: Supabase
- **PDF Viewer**: React PDF Viewer
- **Markdown**: React Markdown
- **Notifications**: Sonner
- **Date Handling**: date-fns

## Features

- Document viewing and management
- Authentication system
- Workspace organization
- PDF file handling
- Markdown support
- Modern UI with responsive design

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory with the necessary Supabase credentials.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Dependencies

The project uses modern versions of key packages:
- React 19
- Next.js 15.3.0
- TypeScript 5
- Tailwind CSS 4
