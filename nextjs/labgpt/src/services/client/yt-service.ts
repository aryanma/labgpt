export const ytService = {
    async findVideos(paperId: string): Promise<[]> {
        const response = await fetch(`/api/suggestions?paperId=${paperId}`);
        console.log(response);
        if (!response.ok) {
            throw new Error('Failed to fetch videos');
        }
        const data = await response.json();
        return data.data;
    }
};