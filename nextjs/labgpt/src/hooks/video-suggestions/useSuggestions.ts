import { VideoSuggestion } from "@/types/VideoSuggestions";
import { useEffect, useState } from "react";
import { ytService } from '@/services/client/yt-service';

export const useSuggestions = (isOpen: boolean) => {
    const [suggestions, setSuggestions] = useState<VideoSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = async () => {
        setLoading(true);
        const response = await ytService.findVideos("123");

        setLoading(false);
        return response;
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