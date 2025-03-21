# Frontend Deployment Instructions

This document explains how to deploy the frontend to Vercel.

## Vercel Deployment Steps

1. Create an account on [Vercel](https://vercel.com) (you can sign in with your GitHub account)

2. Create a new project:
   - Use the "Import Git Repository" option
   - Select your GitHub repository
   - Click the "Import" button

3. Configure the project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` (since the project is a monorepo, you need to specify the frontend directory)
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://tiktok-scraper-backend.vercel.app/api`

5. Click the "Deploy" button

## Manual Deployment

To deploy manually using the Vercel CLI:

```bash
# Install Vercel CLI
pnpm add -g vercel

# Navigate to frontend directory
cd frontend

# Log in to Vercel
vercel login

# Deploy
vercel
```

Vercel will ask you some questions:
- Set up and deploy? → Yes
- Which scope? → Select your account
- Link to existing project? → No (or Yes if you've created one before)
- What's your project name? → tiktok-scraper-frontend
- In which directory is your code located? → ./
- Want to override the settings? → Yes
- Framework preset → Next.js
- Build Command → pnpm run build
- Development Command → pnpm run dev
- Output Directory → .next
- Environment variables → NEXT_PUBLIC_API_URL=https://tiktok-scraper-backend.vercel.app/api

When the deployment is complete, Vercel will provide you with the URL of your frontend. 