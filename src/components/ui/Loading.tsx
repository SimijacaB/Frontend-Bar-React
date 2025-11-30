import type { FC } from 'react'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Spinner: FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <Loader2
      className={`animate-spin text-emerald-500 ${sizeClasses[size]} ${className}`}
    />
  )
}

interface LoadingOverlayProps {
  message?: string
}

const LoadingOverlay: FC<LoadingOverlayProps> = ({ message = 'Cargando...' }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-300 text-lg">{message}</p>
      </div>
    </div>
  )
}

interface LoadingStateProps {
  message?: string
}

const LoadingState: FC<LoadingStateProps> = ({ message = 'Cargando...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="lg" />
      <p className="text-slate-400 mt-4">{message}</p>
    </div>
  )
}

export { Spinner, LoadingOverlay, LoadingState }
