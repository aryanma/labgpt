import { createClient } from '@supabase/supabase-js';

// Make sure these match your Supabase project settings exactly
const supabaseUrl = 'https://jbwxgkcicfjseqqgmntr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impid3hna2NpY2Zqc2VxcWdtbnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzODU5NjQsImV4cCI6MjA1Njk2MTk2NH0.tsIoN4A7m6rNp8-kFwtkNUiSv1lzQikWuR1jr59QoHo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);