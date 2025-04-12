import { useEffect, useState } from "react";

interface VideoSuggestion {
    id: string;
    paper_id: string;
    user_id: string;
    workspace_id: string;
    video_id: string;
    title: string;
    duration: string;
    view_count: string;
    timestamp: string;
    is_pinned: boolean;
    thumbnail: string;
}

export const useSuggestions = (isOpen: boolean) => {
    const [suggestions, setSuggestions] = useState<VideoSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = async (paperId: string) => {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockSuggestions = [
            {
                id: "1",
                paper_id: paperId,
                user_id: "user123",
                workspace_id: "workspace1",
                video_id: "dQw4w9WgXcQ",
                title: "Understanding Machine Learning Concepts",
                duration: "10:30",
                view_count: "1000000",
                timestamp: new Date().toISOString(),
                is_pinned: false,
                thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg`
            },
            {
                id: "2", 
                paper_id: paperId,
                user_id: "user123",
                workspace_id: "workspace1",
                video_id: "xvFZjo5PgG0",
                title: "Deep Learning Explained Simply",
                duration: "15:45",
                view_count: "500000",
                timestamp: new Date().toISOString(),
                is_pinned: false,
                thumbnail: `https://img.youtube.com/vi/xvFZjo5PgG0/maxresdefault.jpg`
            }
        ];

        setLoading(false);
        return mockSuggestions;
    };

    useEffect(() => {
        const fetchData = async () => {
            const mockSuggestions = await fetchSuggestions("123");
            setSuggestions(mockSuggestions);
        };
        fetchData();
    }, [isOpen]);

    return { suggestions, loading };
};