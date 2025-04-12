"use client";
import { Workspace } from "@/types/Workspace";
import styles from "@/styles/MainHeaderStyles.module.css";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import useVidSuggestion from "@/hooks/page-viewer/useVidSuggestion";
import SuggestionsPopup from "@/components/VideoSuggestions/SuggestionsPopup";
type MainHeaderProps = {
    currentWorkspace: Workspace | null;
}

export default function MainHeader({ currentWorkspace } : MainHeaderProps) {
    const pathname = usePathname();
    
    // Check if we're viewing a paper
    const isPaperView = pathname?.includes("/workspaces/paper/");

    const { isLoading, showingVideos, handleFindVideos, setShowingVideos } = useVidSuggestion();

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
            
            <SuggestionsPopup isOpen={showingVideos} onClose={() => setShowingVideos(false)} />
        </>
    );
}