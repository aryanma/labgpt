"use client";

import { YTButton } from "@/components/VideoSuggestions/YTButton";
import SearchBtn from "../Workspaces/Search/SearchBtn";

export function ToolBar({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="flex items-center justify-between p-2 border-b">
      <div className="flex items-center gap-2">
      </div>

      {/* Right side toolbar */}
      <div className="flex items-center gap-2">
        <YTButton />
        <SearchBtn workspaceId={workspaceId} />
      </div>
    </div>
  );
}

export default ToolBar;
