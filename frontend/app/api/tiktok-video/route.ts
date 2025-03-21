import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tiktokUrl = searchParams.get('url');

    if (!tiktokUrl) {
      return NextResponse.json(
        { error: 'Missing TikTok URL parameter' },
        { status: 400 }
      );
    }

    console.log(`Fetching TikTok video: ${tiktokUrl}`);

    const response = await fetch(`${BACKEND_URL}/tiktok-video?url=${encodeURIComponent(tiktokUrl)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching TikTok video:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch TikTok video' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing TikTok video request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 