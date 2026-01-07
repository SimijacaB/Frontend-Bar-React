import { type FC } from 'react'
import { Link } from 'react-router-dom'
import { 
  QrCode, 
  Wine, 
  Beer, 
  Martini, 
  Clock, 
  MapPin,
  Sparkles,
  Instagram,
  Phone,
  ChevronRight
} from 'lucide-react'

const PublicLanding: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-md mx-auto px-4 pt-16 pb-8">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold text-4xl mb-4 shadow-xl shadow-emerald-500/30">
              PB
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Project Bar</h1>
            <p className="text-slate-400 text-lg">Tu experiencia, nuestro compromiso</p>
          </div>

          {/* Main CTA - Ver Carta */}
          <Link
            to="/carta"
            className="block bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl p-5 mb-6 shadow-lg shadow-emerald-500/20 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Wine className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Ver Carta</h2>
                  <p className="text-white/80 text-sm">Explora y haz tu pedido</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* QR Info */}
          <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">¿Tienes un QR?</p>
                <p className="text-slate-400 text-sm">Escanéalo para ir directo a tu mesa</p>
              </div>
            </div>
          </div>

          {/* Categories Preview */}
          <div className="mb-8">
            <h3 className="text-slate-400 text-sm font-medium mb-4 text-center">Lo que ofrecemos</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: Martini, label: 'Cócteles', color: 'from-pink-500 to-rose-500' },
                { icon: Beer, label: 'Cervezas', color: 'from-amber-500 to-yellow-500' },
                { icon: Wine, label: 'Vinos', color: 'from-purple-500 to-violet-500' },
                { icon: Sparkles, label: 'Especiales', color: 'from-cyan-500 to-emerald-500' },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-2 shadow-lg`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-slate-400 text-xs">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Location/Hours Info */}
          <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Ubicación</p>
                <p className="text-slate-500 text-sm">Calle Principal #123, Ciudad</p>
              </div>
            </div>
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Horario</p>
                <p className="text-slate-500 text-sm">Lun - Sáb: 5:00 PM - 2:00 AM</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Reservaciones</p>
                <p className="text-slate-500 text-sm">+57 300 123 4567</p>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <a href="#" className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full text-slate-400 hover:text-white transition-colors">
              <Instagram className="w-5 h-5" />
              <span className="text-sm">@projectbar</span>
            </a>
          </div>

          {/* Staff Access */}
          <Link
            to="/login"
            className="block text-center py-3 text-slate-600 hover:text-slate-400 text-sm transition-colors"
          >
            Acceso Personal →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-800">
        <p className="text-slate-600 text-sm">
          © 2026 Project Bar • Todos los derechos reservados
        </p>
      </footer>
    </div>
  )
}

export default PublicLanding
