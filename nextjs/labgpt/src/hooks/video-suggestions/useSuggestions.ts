import { VideoSuggestion } from "@/types/VideoSuggestions";
import { useEffect, useState } from "react";

const hardcodedSuggestions: VideoSuggestion[] = [
    {
        id: "1",
        title: "Video 1",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        view_count: 1000,
        duration: "10:00"
    },
    {
        id: "2",
        title: "Video 2",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        view_count: 2000,
        duration: "10:00"
    },
    {
        id: "3",
        title: "Video 3",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        view_count: 2000,
        duration: "10:00"
    },
    {
        id: "4",
        title: "Video 4",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        view_count: 2000,
        duration: "10:00"
    }
]

export const useSuggestions = (isOpen: boolean) => {
    const [suggestions, setSuggestions] = useState<VideoSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = async () => {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        setLoading(false);
        return hardcodedSuggestions;
    };

    useEffect(() => {
        const fetchData = async () => {
            const mockSuggestions = await fetchSuggestions();
            setSuggestions(mockSuggestions);
        };
        fetchData();
    }, [isOpen]);

    return { suggestions, loading };
};