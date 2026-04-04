'use client'

interface OrgSwitcherProps {
  orgName: string
  plan: string
}

export function OrgSwitcher({ orgName, plan }: OrgSwitcherProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
        <span className="text-white text-xs font-bold">{orgName[0]?.toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{orgName}</p>
        <p className="text-xs text-gray-500 capitalize">{plan}</p>
      </div>
    </div>
  )
}