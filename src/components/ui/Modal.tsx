import type { FC, ReactNode } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'md', footer }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-slate-900 rounded-2xl w-full ${maxWidthClasses[maxWidth]} border border-slate-700 flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="!p-1.5">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-700 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
