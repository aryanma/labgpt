import { VideoSuggestion } from "@/types/VideoSuggestions";

type SearchItem = {
    id: { videoId: string };
    snippet: { title: string };
}

type VideoListResponse = {
    items: VideoItem[];
}

type VideoItem = {
    id: string;
    snippet: {
        title: string;
    };
    statistics: {
        viewCount: string;
    };
    contentDetails: {
        duration: string;
    };
}

export const ytService = {
    async findVideos(text: string): Promise<VideoSuggestion[]> {
        if (!process.env.YOUTUBE_API_KEY) {
            throw new Error('YouTube API key is not configured');
        }

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(text)}&type=video&maxResults=3&key=${process.env.YOUTUBE_API_KEY}`
        );
        const data: { items: SearchItem[] } = await response.json();

        if (!data.items || data.items.length === 0) {
            console.log('No videos found');
            return [];
        }

        const videoIds = data.items.map((item) => item.id.videoId).join(',');

        const detailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
        );

        const detailsData: VideoListResponse = await detailsResponse.json();

        const suggestions: VideoSuggestion[] = detailsData.items.map((item) => ({
            id: item.id,
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.id}`,
            view_count: parseInt(item.statistics.viewCount, 10),
            duration: item.contentDetails.duration
        }));
        
        return suggestions;
    }
    
}