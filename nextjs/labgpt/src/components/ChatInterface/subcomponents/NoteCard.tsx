"use client"

import { Pin, Trash2 } from "lucide-react"
import type { Note } from "@/services/client/note-service"
import ReactMarkdown from "react-markdown"

interface NoteCardProps {
  note: Note
  onTogglePinAction: (noteId: string, isPinned: boolean) => void
  onDeleteAction: (noteId: string) => void
}

export function NoteCard({ note, onTogglePinAction, onDeleteAction }: NoteCardProps) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">

        {/* Pin and Delete buttons */}
        <div className="flex gap-2">
          <button
            className={`${note.is_pinned ? "text-primary border-primary hover:text-gray-400 hover:border-gray-400" : "text-gray-400 border-gray-400 hover:text-primary hover:border-primary"} inline-flex items-center gap-1 py-1.5 px-2.5 text-xs bg-transparent border rounded-md cursor-pointer transition-all duration-200 active:scale-95 active:bg-gray-100`}
            onClick={() => onTogglePinAction(note.id, note.is_pinned)}
            aria-label={note.is_pinned ? "Unpin note" : "Pin note"}
          >
            <Pin size={16} />
          </button>
          <button
            className={`hover:text-destructive inline-flex items-center gap-1 py-1.5 px-2.5 text-xs text-gray-500 bg-transparent border rounded-md cursor-pointer transition-all duration-200 active:scale-95 active:bg-gray-100`}
            onClick={() => onDeleteAction(note.id)}
            aria-label="Delete note"
          >
            <Trash2 size={16} />
          </button>
        </div> 

        {/* Page number */}
        <span className="text-sm text-gray-500">Page {note.page}</span>
      </div>

      {/* Highlight */}
      <div className="mb-2">
        <p className="text-sm font-medium">Highlight:</p>
        <p className="text-[#111827] bg-white p-3 rounded-lg text-sm leading-relaxed my-3 border border-[#e7e7eb] font-mono">{note.highlight}</p>
      </div>

      {/* Response */}
      <div className="text-[#111827] leading-relaxed text-sm p-3 bg-white rounded-lg border border-[#e5e7eb]">
        <p className="text-sm font-medium">Response:</p>
        <div className="text-sm text-gray-600 prose prose-sm max-w-none">
          <ReactMarkdown>{note.response}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export default NoteCard;
