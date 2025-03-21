# Backend Deployment Instructions

This document explains how to deploy the backend to Vercel.

## Vercel Deployment Steps

1. Create an account on [Vercel](https://vercel.com) (you can sign in with your GitHub account)

2. Create a new project:
   - Use the "Import Git Repository" option
   - Select your GitHub repository
   - Click the "Import" button

3. Configure the project settings:
   - **Framework Preset**: Other
   - **Root Directory**: `backend` (since the project is a monorepo, you need to specify the backend directory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. If needed, add Environment Variables:
   - No specific environment variables are required for the basic backend functionality
   - You may want to add `NODE_ENV=production` for production environment

5. Click the "Deploy" button

## Configuration Files

The backend repository already contains the necessary configuration files for Vercel deployment:

### vercel.json

The `vercel.json` file is configured to handle the backend deployment:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": "{services/**,utils/**,routes/**,*.js,*.json}",
        "maxLambdaSize": "50mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/api-docs/swagger-ui.css",
      "dest": "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css"
    },
    {
      "src": "/api-docs/swagger-ui-bundle.js",
      "dest": "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js"
    },
    {
      "src": "/api-docs/swagger-ui-standalone-preset.js",
      "dest": "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js"
    },
    {
      "src": "/api-docs/swagger-ui-init.js",
      "dest": "app.js"
    },
    {
      "src": "/api-docs.json",
      "dest": "app.js"
    },
    {
      "src": "/(.*)",
      "dest": "app.js"
    }
  ]
}
```

## Manual Deployment

To deploy manually using the Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to backend directory
cd backend

# Log in to Vercel
vercel login

# Deploy
vercel
```

Vercel will ask you some questions:
- Set up and deploy? → Yes
- Which scope? → Select your account
- Link to existing project? → No (or Yes if you've created one before)
- What's your project name? → tiktok-scraper-backend
- In which directory is your code located? → ./
- Want to override the settings? → No (use the config from vercel.json)

When the deployment is complete, Vercel will provide you with the URL of your backend.

## Important Notes

1. **Puppeteer on Vercel**: The backend uses Puppeteer for scraping TikTok videos. Vercel's serverless environment has some limitations with Puppeteer, but the configuration in `vercel.json` has been optimized to work with these limitations.

2. **Serverless Function Limitations**: Be aware that Vercel serverless functions have execution time limits (60 seconds by default). The `maxDuration` setting in the Vercel dashboard can be adjusted if needed.

3. **File System Access**: The backend code has been modified to work with Vercel's read-only file system. Any file operations (logs, downloads) are conditionally executed only in development environment. 