import type { FC } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Clock, ArrowLeft } from 'lucide-react'

const OrderConfirmationPage: FC = () => {
  const { mesa } = useParams<{ mesa: string }>()
  const tableNumber = mesa || '?'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          ¡Pedido Confirmado!
        </h1>
        
        <p className="text-slate-400 mb-4">
          Tu pedido ha sido recibido y está siendo preparado.
        </p>
        
        <div className="inline-block bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full mb-8">
          Mesa {tableNumber}
        </div>

        {/* Estimated Time */}
        <div className="bg-slate-800/50 rounded-2xl p-4 mb-8 border border-slate-700/50">
          <div className="flex items-center justify-center gap-3">
            <Clock className="w-6 h-6 text-amber-400" />
            <div className="text-left">
              <p className="text-white font-medium">Tiempo estimado</p>
              <p className="text-slate-400 text-sm">10-15 minutos</p>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-emerald-500/10 rounded-2xl p-4 mb-8 border border-emerald-500/20 text-left">
          <h3 className="text-emerald-400 font-medium mb-2">¿Qué sigue?</h3>
          <ul className="text-slate-300 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">1.</span>
              Nuestro bartender preparará tu pedido
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">2.</span>
              Un mesero te lo llevará a tu mesa
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">3.</span>
              Pagas directamente con el mesero
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">4.</span>
              ¡Disfruta tu bebida! 🍹
            </li>
          </ul>
        </div>

        {/* Back to Menu */}
        <Link
          to={`/pedido/${tableNumber}`}
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Hacer otro pedido
        </Link>
      </div>
    </div>
  )
}

export default OrderConfirmationPage
