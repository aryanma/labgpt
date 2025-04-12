import { useNotes } from "@/hooks/page-viewer/useNotes"
import { NotesContainer } from "@/components/ChatInterface/subcomponents/NotesContainer"
import { StatusContainer } from "@/components/ChatInterface/subcomponents/StatusContainer"

interface ChatInterfaceProps {
  paperId: string
}

export default function ChatInterface({ paperId }: ChatInterfaceProps) {
  const { notes, loading, error, togglePinNote, deleteNote } = useNotes(paperId)

  return (
    <div className="w-full min-w-[360px] flex flex-col gap-4 h-full sticky overflow-hidden">
      {loading ? (
        <StatusContainer loading={true} />
      ) : error ? (
        <StatusContainer error={error} />
      ) : (
        <NotesContainer notes={notes} onTogglePin={togglePinNote} onDelete={deleteNote} />
      )}
    </div>
  )
}
