# TikTok Video Downloader & Scraper

**Download TikTok videos without watermarks, no account required, no CAPTCHA solving needed!**

This lightweight tool allows you to easily download TikTok videos without any watermarks. It provides direct access to downloadable URLs, making it perfect for both developers and casual users who need a simple way to save TikTok content.

## ✨ Key Features

- **No Account Required** - Download TikTok videos without creating an account
- **No CAPTCHA Solving** - Advanced browser automation bypasses verification challenges
- **Watermark-Free Videos** - Get clean videos without the TikTok watermark
- **Direct URL Access** - Get direct access to video download URLs
- **Modern UI** - Clean, responsive interface built with Next.js and shadcn/ui
- **API Support** - Well-documented API for developers to integrate into their projects

## 🚀 Getting Started

### Prerequisites

- Node.js (v22.11.0 or higher recommended)
- pnpm package manager (`npm install -g pnpm`)

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The frontend will be available at http://localhost:8080

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The backend API will be available at http://localhost:3000

## 📋 Available Scripts

The project uses pnpm workspaces to manage both frontend and backend. Here are the main commands available in the root `package.json`:

- `pnpm frontend:dev` - Run the frontend in development mode
- `pnpm backend:dev` - Run the backend in development mode
- `pnpm dev` - Run both frontend and backend concurrently
- `pnpm frontend:build` - Build the frontend for production
- `pnpm backend:build` - Build the backend for production
- `pnpm build` - Build both frontend and backend
- `pnpm frontend:start` - Start the frontend in production mode
- `pnpm backend:start` - Start the backend in production mode
- `pnpm start` - Start both frontend and backend in production mode
- `pnpm lint` - Run linting for all packages

## 📚 API Documentation

The backend API is documented using Swagger. When running the backend, you can access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

This provides an interactive way to explore and test the available API endpoints.

### API Client Generation

The project uses OpenAPI Generator to automatically create TypeScript clients from the Swagger specification. If you make changes to the backend API, you can update the frontend types with these commands:

```bash
# Save the latest API specification from the running backend
pnpm --filter frontend save-api-spec

# Generate TypeScript client code from the specification
pnpm --filter frontend generate-api-client-online
```

This ensures that the frontend TypeScript types always match the backend API, providing type safety across the entire application.

## 🔍 How It Works

The application uses Puppeteer with stealth plugins to scrape TikTok videos. It navigates to TikTok video pages, bypasses protections, and extracts the direct video URL without watermarks.

The backend provides RESTful APIs that the frontend consumes to present a user-friendly interface for entering TikTok URLs and downloading videos.

## 🛣️ Roadmap

- **Backend TypeScript Migration** - Convert the backend to TypeScript for better type safety
- **Scraper Optimization** - Improve performance and reliability of the video extraction
- **CLI Interface** - Add a command-line interface to use without the frontend
- **Backend Framework Update** - Consider migrating to NestJS for better architecture
- **Enhanced Logging** - Implement more detailed logging service for better debugging

## 🤝 Contributing

Contributions are welcome! If you'd like to improve this project, feel free to:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

For bugs, feature requests, or questions, please open an issue.

## 📞 Contact

If you encounter any issues or have questions, feel free to reach out:

- Discord: **atalayio**
- GitHub Issues: Open an issue in this repository

## ⚠️ Disclaimer

This tool is provided for educational purposes only. It is intended to demonstrate web scraping techniques and API development. Please respect TikTok's terms of service and copyright laws when using this tool. Do not use this tool to download content that you do not have the right to download.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
