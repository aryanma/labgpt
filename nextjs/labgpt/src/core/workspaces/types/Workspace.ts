export type Workspace = {
    id: string;
    name: string;
    description: string;
    created_by: string;
    created_at: string;
}

export type Paper = {
    id: string;
    user_id: string;
    title: string;
    file_path: string;
    date_added: string;
}