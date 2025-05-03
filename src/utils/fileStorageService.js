import { supabase } from './supabaseClient';

const fileStorageService = {
  // Generate a unique filename
  generateFilename: (prefix = 'document') => {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}.tex`;
  },

  // Upload file to Supabase storage
  uploadFile: async (content, filename) => {
    try {
      // Convert string content to Blob
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], filename, { type: 'text/plain' });

      const { data, error } = await supabase.storage
        .from('latex-files')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('latex-files')
        .getPublicUrl(filename);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Delete file after some time (optional)
  scheduleDeletion: async (filename) => {
    try {
      // Delete after 1 hour
      setTimeout(async () => {
        const { error } = await supabase.storage
          .from('latex-files')
          .remove([filename]);
        
        if (error) {
          console.error('Error deleting file:', error);
        }
      }, 3600000); // 1 hour
      
      return filename;
    } catch (error) {
      console.error('Error scheduling deletion:', error);
      return filename;
    }
  }
};

export default fileStorageService; 