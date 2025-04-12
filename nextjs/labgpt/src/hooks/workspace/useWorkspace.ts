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

 
type Workspace = {
    id: string;
    name: string;
    description: string;
    created_by: string;
    created_at: string;
}

export default function useWorkspace(
    workspaceId: string | undefined,
    shouldLoadWorkspaces: boolean = false
) {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [isLoadingPapers, setIsLoadingPapers] = useState(false);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);

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


    const loadWorkspaces = useCallback(async () => {
        setIsLoadingWorkspaces(true);
        try {
            const supabase = createClient();
            const { data } = await supabase.from('workspaces').select('*');
            return data as Workspace[];
        } catch (error) {
            console.error("Error loading workspaces: ", error);
        } finally {
            setIsLoadingWorkspaces(false);
        }
    }, []);

    useEffect(() => {
        if (shouldLoadWorkspaces) {
            loadWorkspaces().then((data) => {
                if (data) {
                    setWorkspaces(data);
                }
            });
        }
    }, [loadWorkspaces, shouldLoadWorkspaces]);

    return { papers, isLoadingPapers, workspaces, isLoadingWorkspaces };
}