interface StatusContainerProps {
  loading?: boolean
  error?: string | null
}

export function StatusContainer({ loading, error }: StatusContainerProps) {
  return (
    <div className="bg-white rounded-2xl p-5 h-[calc(50%-0.5rem)] border border-[#e5e7eb] overflow-y-auto flex flex-col shadow-sm">
      <div className="flex items-center justify-center h-full">
        {loading ? (
          <p className="text-gray-500">Loading notes...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : null}
      </div>
    </div>
  )
}
