import { NextRequest, NextResponse } from 'next/server';
import { ytService } from '@/services/server/yt-service';

export async function GET(
    request: NextRequest
) {
    try {
        const searchParams = request.nextUrl.searchParams
        const paperId = searchParams.get('paperId')
        
    if (!paperId) {
        return NextResponse.json({
        success: false,
        error: 'Query parameter is required'
        }, { status: 400 })
    }

        const videoSuggestions = await ytService.findVideos("machine learning");

        return NextResponse.json({
            success: true,
            data: videoSuggestions
        });
    } catch {
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch videos'
        }, { status: 500 })
    }
}
