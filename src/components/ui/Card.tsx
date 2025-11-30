import type { FC } from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

const Card: FC<CardProps> = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div
      className={`
        bg-slate-800/60 backdrop-blur-sm 
        border border-slate-700/50 
        rounded-2xl p-5
        ${hover ? 'hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer transition-all duration-300' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

const CardHeader: FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
)

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

const CardTitle: FC<CardTitleProps> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>
)

interface CardDescriptionProps {
  children: React.ReactNode
  className?: string
}

const CardDescription: FC<CardDescriptionProps> = ({ children, className = '' }) => (
  <p className={`text-sm text-slate-400 mt-1 ${className}`}>{children}</p>
)

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

const CardContent: FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
)

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const CardFooter: FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-slate-700/50 ${className}`}>{children}</div>
)

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
