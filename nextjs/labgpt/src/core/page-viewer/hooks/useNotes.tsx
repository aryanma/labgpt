"use client"

import { useState, useEffect } from "react"
import { type Note, noteService } from "../services/note-service"

export function useNotes(paperId: string) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = async () => {
    setLoading(true)
    const { data, error } = await noteService.fetchNotes(paperId)

    if (error) {
      setError(error.message)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotes()
  }, [paperId])

  const togglePinNote = async (noteId: string, isPinned: boolean) => {
    const { success } = await noteService.togglePinNote(noteId, !isPinned)
    if (success) {
      setNotes(notes.map((note) => (note.id === noteId ? { ...note, is_pinned: !isPinned } : note)))
    }
  }

  const deleteNote = async (noteId: string) => {
    const { success } = await noteService.deleteNote(noteId)
    if (success) {
      setNotes(notes.filter((note) => note.id !== noteId))
    }
  }

  return {
    notes,
    loading,
    error,
    togglePinNote,
    deleteNote,
    refreshNotes: fetchNotes,
  }
}
