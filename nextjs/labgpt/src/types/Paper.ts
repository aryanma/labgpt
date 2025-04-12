export interface Paper {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    workspace_id: string | null;
} 