"use client";
import { Workspace } from "@/types/Workspace";
import styles from "@/styles/MainHeaderStyles.module.css";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePathname } from "next/navigation";

type MainHeaderProps = {
    currentWorkspace: Workspace | null;
}


export default function MainHeader({ currentWorkspace } : MainHeaderProps) {
    const [showingVideos, setShowingVideos] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    
    // Check if we're viewing a paper
    const isPaperView = pathname?.includes("/workspaces/paper/");
    
    const handleFindVideos = async () => {
        if (!isPaperView) {
            alert("Please open a paper first to find related YouTube videos");
            return;
        }
        
        setIsLoading(true);
        setShowingVideos(!showingVideos);
        
        try {
            // Extract paper ID from URL
            const paperId = pathname?.split("/").pop();
            
            // Here we would call the YouTube API or service to fetch videos
            console.log(`Finding YouTube videos for paper ID: ${paperId}`);
            
            // For now this is just a placeholder for the future API call
            // In a real implementation, we'd:
            // 1. Get the paper title/abstract from usePaper hook or pass it as a prop
            // 2. Call an API endpoint to search YouTube
            // 3. Display the results in a modal or sidebar
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Toggle video panel or display results
            // This would connect to a video results component that we'd need to create
        } catch (error) {
            console.error("Error fetching YouTube videos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className={styles.mainHeader}>
                <h1>LabGPT</h1>
                <div className={styles.toolbar}>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleFindVideos}
                        className={showingVideos ? styles.activeToolbarButton : ""}
                        disabled={!isPaperView || isLoading}
                    >
                        {isLoading ? "Loading..." : "Find YouTube Videos"}
                    </Button>
                </div>
                <div className={styles.headerActions}>
                    <span className={styles.headerSubtitle}>Your AI-powered research assistant</span>
                    {currentWorkspace && (
                        <div className="current-workspace">
                            <span>Workspace: {currentWorkspace.name}</span>
                        </div>
                    )}
                </div>
            </div>
            
            {showingVideos && (
                <div className={styles.videoSuggestionsPopup}>
                    <div className={styles.videoPopupHeader}>
                        <h3>YouTube Video Suggestions</h3>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowingVideos(false)}
                        >
                            ×
                        </Button>
                    </div>
                    <div className={styles.videoPlaceholders}>
                        <div className={styles.videoItem}></div>
                        <div className={styles.videoItem}></div>
                        <div className={styles.videoItem}></div>
                    </div>
                </div>
            )}
        </>
    );
}