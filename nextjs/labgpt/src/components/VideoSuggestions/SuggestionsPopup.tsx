import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import styles from "@/styles/VideoSuggestionStyles.module.css";
import { useSuggestions } from "@/hooks/video-suggestions/useSuggestions";

interface VideoSuggestion {
    id: string;
    title: string;
    url: string;
    view_count: number;
    duration: string;
}

type SuggestionsPopupProps = {
    isOpen: boolean;
    onClose: () => void;
}


const VideoItem = ({ suggestion }: { suggestion: VideoSuggestion }) => {
    const videoId = suggestion.url.split('v=')[1]?.split('&')[0] || '';
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    
    return (
        <div className="flex p-3 rounded-lg hover:bg-gray-100 cursor-pointer" key={suggestion.id}>
            <div className="relative w-32 h-20 mr-3 rounded-md overflow-hidden flex-shrink-0">
                <Image 
                    src={thumbnailUrl} 
                    alt={suggestion.title}
                    width={128}
                    height={80}
                    className="object-cover"
                    unoptimized
                />
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                    {suggestion.duration}
                </div>
            </div>
            <div className="flex flex-col justify-between flex-1">
                <h4 className="text-sm font-medium line-clamp-2 text-gray-800">{suggestion.title}</h4>
                <div className="flex items-center text-xs text-gray-500">
                    <span className="flex items-center">{suggestion.view_count.toLocaleString()} views</span>
                </div>
            </div>
        </div>
    );
}

const OpenSuggestions = ({ suggestions }: { suggestions: VideoSuggestion[] }) => {
    return (
        <div className={styles.videoPlaceholders}>
            {suggestions.map((suggestion) => (
                <VideoItem suggestion={suggestion} key={suggestion.id} />
            ))}
        </div>
    )
}

const LoadingSuggestions = () => {
    return (
        <div className={styles.videoPlaceholders}>
            {[...Array(4)].map((_, index) => (
                <div key={index} className="flex p-3 rounded-lg">
                    <Skeleton className="w-32 h-20 mr-3 rounded-md" />
                    <div className="flex flex-col justify-between flex-1">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function SuggestionsHeader({ onClose }: { onClose: () => void }) {
    return (
        <div className={styles.videoPopupHeader}>
            <h3>YouTube Suggestions</h3>
            <Button variant="ghost" size="sm" onClick={onClose}> × </Button>
        </div>
    )
}

export default function SuggestionsPopup({ isOpen, onClose }: SuggestionsPopupProps) {
    const { suggestions, loading } = useSuggestions(isOpen);

    if (!isOpen) return null;

    return (
        <div className={styles.videoSuggestionsPopup}>
            <SuggestionsHeader onClose={onClose} />
            {loading ? <LoadingSuggestions /> : <OpenSuggestions suggestions={suggestions} />}
        </div>
    );
}