"use client";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import { YTButton } from "@/components/VideoSuggestions/YTButton";

export function ToolBar() {
  return (
    <div className="flex items-center justify-between p-2 border-b">
      <div className="flex items-center gap-2">
        <Link href="/workspaces">
          <Button variant="ghost" size="icon">
            <HomeIcon className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Right side toolbar */}
      <div className="flex items-center gap-2">
        <YTButton />
      </div>
    </div>
  );
}

export default ToolBar;
