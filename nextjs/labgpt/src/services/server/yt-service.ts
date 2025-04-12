import { VideoSuggestion } from "@/types/VideoSuggestions";

const hardcodedSuggestions: VideoSuggestion[] = [
    {
        id: "1",
        title: "Introduction to Machine Learning",
        url: "https://www.youtube.com/watch?v=example1",
        view_count: 1000,
        duration: "10:00"
    }
]   

export const ytService = {
    async findVideos(text: string) {
        if (!process.env.YOUTUBE_API_KEY) {
            throw new Error('YouTube API key is not configured');
        }

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(text)}&type=video&maxResults=3&key=${process.env.YOUTUBE_API_KEY}`
        );
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            console.log('No videos found');
            return;
        }

        const videoIds = data.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(',');

        const detailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
        );

        const detailsData = await detailsResponse.json();

        // const suggestions: VideoSuggestion[] = detailsData.items.map((item: { id: string, snippet: { title: string }, statistics: { viewCount: string }, contentDetails: { duration: string } }) => ({
        //     id: item.id,
        //     title: item.snippet.title,
        //     url: `https://www.youtube.com/watch?v=${item.id}`,
        //     view_count: parseInt(item.statistics.viewCount, 10),
        //     duration: item.contentDetails.duration
        // }));
        // console.log(suggestions);
        return hardcodedSuggestions;
    }
}