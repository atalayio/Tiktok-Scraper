"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Clipboard, ExternalLink, X, TrendingUp, Info, Play, Pause, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { VideoUrl } from '../api/generated/models';

export function VideoDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoUrl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a TikTok video URL');
      return;
    }

    if (!url.includes('tiktok.com')) {
      setError('Please enter a valid TikTok URL');
      return;
    }

    setError(null);
    setLoading(true);
    setVideoData(null);

    try {
      const response = await fetch(`/api/tiktok-video?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error processing TikTok video');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to get video information');
      }

      // Store the raw response data
      setVideoData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes('tiktok.com')) {
        setUrl(text);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to access clipboard:', err);
    }
  };

  const handleClear = () => {
    setUrl('');
    setVideoData(null);
    setError(null);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const downloadVideo = () => {
    // Using direct data structure from backend API response
    if (!videoData?.data?.video_url) return;
    
    const downloadLink = document.createElement('a');
    downloadLink.href = videoData.data.video_url;
    downloadLink.download = `tiktok-${videoData.data.video_id || 'video'}.mp4`;
    downloadLink.target = '_blank';
    downloadLink.rel = 'noopener noreferrer';
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    
    downloadLink.click();
    
    setTimeout(() => {
      document.body.removeChild(downloadLink);
    }, 100);
  };

  const openVideo = () => {
    // Using direct data structure from backend API response
    if (!videoData?.data?.video_url) return;
    window.open(videoData.data.video_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border-0 shadow-lg bg-white/5 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-pink-500" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              TikTok Video Downloader
            </CardTitle>
          </div>
          <CardDescription>
            Paste the URL to download any TikTok video
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-4 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative flex space-x-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste TikTok video URL here..."
                  className="pr-8 pl-3"
                />
                {url && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <Button 
                type="button" 
                onClick={handlePaste}
                variant="outline"
                className="gap-1"
              >
                <Clipboard className="h-4 w-4" />
                <span>Paste</span>
              </Button>
              
              <Button 
                type="submit"
                disabled={loading}
                className="gap-1 bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </>
                )}
              </Button>
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <AnimatePresence>
            {videoData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 500 }}
              >
                <Card className="border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <CardHeader className="pb-3 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-medium">
                          Video Information
                        </CardTitle>
                        {videoData.data?.metadata?.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {videoData.data.metadata.description}
                          </CardDescription>
                        )}
                      </div>
                      {videoData.data?.video_id && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                          ID: {videoData.data.video_id}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    {videoData.data?.metadata?.username && (
                      <div className="flex items-center gap-2 mb-4">
                        <Avatar className="h-8 w-8 bg-gradient-to-br from-pink-500 to-orange-400">
                          <span className="text-xs font-semibold text-white">
                            {videoData.data.metadata.username.substring(0, 2).toUpperCase()}
                          </span>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            @{videoData.data.metadata.username}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Video Preview Section */}
                    {videoData.data?.video_url && (
                      <div className="mt-2 mb-4 relative w-full rounded-lg overflow-hidden bg-black aspect-[9/16] max-h-[400px]">
                        <video
                          ref={videoRef}
                          src={videoData.data.video_url}
                          className="w-full h-full object-contain"
                          controls={false}
                          playsInline
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                        
                        <div 
                          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/20 transition-colors"
                          onClick={togglePlayPause}
                        >
                          <div className="bg-white/80 rounded-full p-3">
                            {isPlaying ? (
                              <Pause className="h-6 w-6 text-pink-600" />
                            ) : (
                              <Play className="h-6 w-6 text-pink-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <Button
                      onClick={downloadVideo}
                      className="flex-1 gap-2 bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Video</span>
                    </Button>
                    <Button
                      onClick={openVideo}
                      variant="outline"
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Open in New Tab</span>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        
        <CardFooter className="pt-0 flex flex-col gap-4">
          <div className="w-full text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex items-center gap-1 mb-1">
              <Info className="h-4 w-4 text-blue-500" />
              <p className="font-medium">Tips:</p>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Make sure your TikTok URL is correct</li>
              <li>If download doesn&apos;t start, right-click on the Download button and select &quot;Save Link As...&quot;</li>
              <li>Some videos may be protected and cannot be downloaded</li>
              <li>Click on the video preview to play/pause</li>
            </ul>
          </div>
          
          {/* GitHub Star Section */}
          <div className="w-full mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <a 
              href="https://github.com/atalayio/Tiktok-Scraper" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 text-sm text-gray-600 dark:text-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
              <span>If you found this tool helpful, please consider giving it a star on GitHub!</span>
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 