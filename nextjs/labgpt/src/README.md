# Source Directory Structure

## `/app`
Next.js application pages and routing components. Contains the main page layouts and routes.

## `/global`
Global application code including:
- `/hooks` - Custom React hooks like `useWorkspace` for managing workspace state
- Other shared utilities and components used across the application

## `/utils`
Utility functions and service configurations:
- `/supabase` - Supabase client configuration and database interaction utilities

# Creating a new page

## First create a new page under `pages/{pageName}`
- here, all non-routing elements of a page go. 
- i.e. Hooks, components, styling, etc. 