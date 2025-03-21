"use client";

import React from 'react';
import { VideoDownloader } from '@/components/video-downloader';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-3xl mb-10 space-y-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
          TikTok Video Downloader
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-prose mx-auto">
          Fast and easy download tool for TikTok videos. Paste the video URL and download instantly.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 max-w-prose mx-auto italic">
          This tool is for educational purposes only. No profit is being made from this service.
        </p>
      </div>
      
      <VideoDownloader />
      
      <div className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} TikTok Downloader. All rights reserved.</p>
        <p className="mt-1">
          This site is not affiliated with TikTok. For educational purposes only.
        </p>
      </div>
    </main>
  );
}
