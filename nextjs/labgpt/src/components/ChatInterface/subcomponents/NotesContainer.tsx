import { Pencil } from "lucide-react"
import type { Note } from "@/services/client/note-service"
import { NoteCard } from "@/components/ChatInterface/subcomponents/NoteCard"

interface NotesContainerProps {
  notes: Note[]
  onTogglePin: (noteId: string, isPinned: boolean) => void
  onDelete: (noteId: string) => void
}

export function NotesContainer({ notes, onTogglePin, onDelete }: NotesContainerProps) {
  return (
    <div className="bg-white p-5 h-full border border-[#e5e7eb] flex flex-col shadow-sm">
      <div className="border-accent">
        <div className="border-line"></div>
        <div className="border-line-2"></div>
      </div>
      <h3 className="flex items-center gap-2 mb-4">
        <Pencil size={16} />
        AI-Generated Notes
      </h3>
      <div className="flex flex-col gap-4 overflow-y-auto ">
        {notes.length > 0 ? (
          notes.map((note) => <NoteCard key={note.id} note={note} onTogglePinAction={onTogglePin} onDeleteAction={onDelete} />)
        ) : (
          <p className="text-gray-500 text-center py-4">No notes available</p>
        )}
      </div>
    </div>
  )
}

export default NotesContainer;
