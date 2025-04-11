"use client"

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/supabaseClient";

type Paper = {
    id: string;
    title: string;
    file_path: string;
    user_id: string;
    date_added: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Workspace = {
    id: string;
    name: string;
    description: string;
    created_by: string;
    created_at: string;
}

export default function useWorkspace(workspaceId: string | undefined) {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [isLoadingPapers, setIsLoadingPapers] = useState(false);

    const loadWorkspacePapers = useCallback(async (workspaceId: string) => {
        setIsLoadingPapers(true);
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('papers')
                .select(`
                    id, 
                    title, 
                    file_path, 
                    user_id, 
                    date_added
                `)
                .eq('workspace_id', workspaceId);
        
            setPapers(data as Paper[]);
        } catch (error) {
            console.error("Error loading workspace papers: ", error);
        } finally {
            setIsLoadingPapers(false);
        }
    }, []);

    useEffect(() => {
        if (workspaceId) {
            loadWorkspacePapers(workspaceId);
        }
    }, [workspaceId, loadWorkspacePapers]);

    return { papers, isLoadingPapers };
}