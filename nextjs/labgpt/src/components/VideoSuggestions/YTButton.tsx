import { Button } from "@/components/ui/button";
import { VideoIcon } from "lucide-react";
import { useState } from "react";
import SuggestionsPopup from "./SuggestionsPopup";
export function YTButton() {
    const [showSuggestions, setShowSuggestions] = useState(false);

    return (
        <div>
            <Button variant="outline" size="icon" onClick={() => setShowSuggestions(!showSuggestions)}>
                <VideoIcon className="h-5 w-5" />
            </Button>
            <SuggestionsPopup isOpen={showSuggestions} onClose={() => setShowSuggestions(false)} />
        </div>
    );
}
