import { usePathname } from "next/navigation";
import { useState } from "react";

export default function useVidSuggestion() {
    const [isLoading, setIsLoading] = useState(false)
    const [showingVideos, setShowingVideos] = useState(false)
    const pathname = usePathname()

    const handleFindVideos = async () => {
        setIsLoading(true);
        setShowingVideos(!showingVideos);
        
        try {
            const paperId = pathname?.split("/").pop();
            
            console.log(`Finding YouTube videos for paper ID: ${paperId}`);

            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error("Error fetching YouTube videos:", error);
        } finally {
            setIsLoading(false);
        }
    };



    return {
        isLoading,
        showingVideos,
        setShowingVideos,
        handleFindVideos
    }
}