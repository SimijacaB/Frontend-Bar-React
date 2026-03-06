import type { FC } from 'react'

interface PaginationProps {
  page: number
  totalPages: number
  total?: number
  itemsPerPage?: number
  label?: string
  onPageChange: (p: number) => void
}

const Pagination: FC<PaginationProps> = ({ page, totalPages, total, itemsPerPage, label = 'registros', onPageChange }) => {
  if (totalPages <= 1) return null

  const showRange = total !== undefined && itemsPerPage !== undefined
  const start = showRange ? (page - 1) * itemsPerPage + 1 : null
  const end = showRange ? Math.min(page * itemsPerPage, total) : null

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800">
      <p className="text-slate-400 text-sm">
        {showRange ? (
          <>Mostrando <span className="text-white">{start}–{end}</span> de <span className="text-white">{total}</span> {label}</>
        ) : (
          <>Página <span className="text-white">{page}</span> de <span className="text-white">{totalPages}</span></>
        )}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        {pageNumbers.map((p, idx) =>
          p === '...' ? (
            <span key={`e-${idx}`} className="text-slate-500 px-1 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                page === p
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

export default Pagination
