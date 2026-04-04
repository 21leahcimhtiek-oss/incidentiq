interface SeverityBadgeProps {
  severity: string | null
  size?: 'sm' | 'md' | 'lg'
}

const SEVERITY_STYLES: Record<string, string> = {
  P0: 'bg-red-100 text-red-700 border-red-200',
  P1: 'bg-orange-100 text-orange-700 border-orange-200',
  P2: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  P3: 'bg-green-100 text-green-700 border-green-200',
}

const SIZE_STYLES = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  if (!severity) return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded text-sm border border-gray-200">Unknown</span>
  return (
    <span className={`rounded border font-bold ${SEVERITY_STYLES[severity] || 'bg-gray-100 text-gray-700'} ${SIZE_STYLES[size]}`}>
      {severity}
    </span>
  )
}