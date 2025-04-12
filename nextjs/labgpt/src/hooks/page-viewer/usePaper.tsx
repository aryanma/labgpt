import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/supabaseClient";
import { Paper } from "@/types/Workspace";

export default function usePaper(paperId: string) {
    const [paper, setPaper] = useState<Paper | null>(null);
    const [paperUrl, setPaperUrl] = useState<string | null>(null);
    const [isLoadingPaper, setIsLoadingPaper] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        
        async function fetchPaper() {
            try {
                const { data, error } = await supabase
                    .from('papers')
                    .select('*')
                    .eq('id', paperId)
                    .single();

                if (error) {
                    throw error;
                }
                
                setPaper(data);

                if (data) {
                    const { data: urlData, error: urlError } = await supabase
                        .storage
                        .from('pdfs')
                        .createSignedUrl(`${data.file_path}`, 3600);

                    if (urlError) {
                        throw urlError;
                    }

                    setPaperUrl(urlData.signedUrl);
                }
            } catch (error) {
                console.error('Error fetching paper:', error);
            } finally {
                setIsLoadingPaper(false);
            }
        }

        if (paperId) {
            fetchPaper();
        }
    }, [paperId]);

    return {
        paper,
        paperUrl,
        isLoadingPaper,
    };
}
