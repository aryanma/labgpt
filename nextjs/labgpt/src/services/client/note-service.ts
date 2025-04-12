import { createClient } from "@/utils/supabase/supabaseClient"

export interface Note {
  id: string
  user_id: string
  paper_id: string
  page: number
  highlight: string
  message: string
  response: string
  is_pinned: boolean
  timestamp: string
  workspace_id: string
}

export const noteService = {
  async fetchNotes(paperId: string): Promise<{ data: Note[] | null; error: Error | null }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("notes").select("*").eq("paper_id", paperId)

      if (error) {
        return { data: null, error: new Error(error.message) }
      }

      return { data, error: null }
    } catch (error) {
      console.error("Error fetching notes:", error)
      return { data: null, error: new Error("An unexpected error occurred") }
    }
  },

  async togglePinNote(noteId: string, isPinned: boolean): Promise<{ success: boolean; error: Error | null }> {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("notes").update({ is_pinned: isPinned }).eq("id", noteId)

      if (error) {
        return { success: false, error: new Error(error.message) }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error("Error toggling pin note:", error)
      return { success: false, error: new Error("An unexpected error occurred") }
    }
  },

  async deleteNote(noteId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("notes").delete().eq("id", noteId)

      if (error) {
        return { success: false, error: new Error(error.message) }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error("Error deleting note:", error)
      return { success: false, error: new Error("An unexpected error occurred") }
    }
  },
}
