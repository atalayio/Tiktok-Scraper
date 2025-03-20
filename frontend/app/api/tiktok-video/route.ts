import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tiktokUrl = searchParams.get('url');

    if (!tiktokUrl) {
      return NextResponse.json(
        { success: false, message: 'TikTok URL is required' },
        { status: 400 }
      );
    }

    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/tiktok-video?url=${encodeURIComponent(tiktokUrl)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to process TikTok video',
          status: 'error',
          code: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing TikTok video request:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error'
      },
      { status: 500 }
    );
  }
} 