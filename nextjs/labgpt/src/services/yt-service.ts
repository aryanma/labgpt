export const ytService = {
    async findVideos(paperId: string): Promise<[]> {
        const response = await fetch(`/api/yt?paperId=${paperId}`);
        return response.json();
    }
};