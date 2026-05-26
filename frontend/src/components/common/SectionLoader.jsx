export default function SectionLoader({ className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden animate-pulse ${className}`}>
      <div className="aspect-square bg-dark-300" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-dark-300 rounded w-1/3" />
        <div className="h-4 bg-dark-300 rounded w-3/4" />
        <div className="h-4 bg-dark-300 rounded w-1/2" />
        <div className="h-5 bg-dark-300 rounded w-1/4 mt-3" />
      </div>
    </div>
  )
}
