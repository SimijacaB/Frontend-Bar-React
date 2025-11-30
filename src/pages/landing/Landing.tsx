import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, Clock, Users, Wine, UtensilsCrossed, QrCode, Bell } from 'lucide-react'

const Landing: FC = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30" />
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
              <Star className="w-4 h-4 fill-emerald-400" />
              El mejor bar de la ciudad
            </div>
            
            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Bienvenido a{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Project Bar
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Disfruta de nuestros cócteles artesanales preparados con pasión y tapas frescas en un ambiente único e inolvidable.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/menu"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                Ver Menú
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/reservations"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-slate-700 text-white font-semibold text-lg hover:border-emerald-500 hover:bg-emerald-500/10 transition-all"
              >
                Reservar Mesa
              </Link>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
          <span className="text-sm">Descubre más</span>
          <div className="w-6 h-10 rounded-full border-2 border-slate-700 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-slate-500 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Staff Quick Access */}
          <div className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Acceso Rápido - Staff</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/meseros"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 font-medium hover:bg-amber-500/30 transition-all"
              >
                <Bell className="w-5 h-5" />
                Panel de Meseros
              </Link>
              <Link
                to="/admin/qr"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-all"
              >
                <QrCode className="w-5 h-5" />
                Generar QR por Mesa
              </Link>
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium hover:bg-blue-500/30 transition-all"
              >
                <Clock className="w-5 h-5" />
                Gestión de Pedidos
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Wine,
                title: 'Cócteles Artesanales',
                description: 'Preparados por bartenders expertos con ingredientes premium',
              },
              {
                icon: UtensilsCrossed,
                title: 'Tapas Frescas',
                description: 'Recetas tradicionales con un toque moderno',
              },
              {
                icon: Clock,
                title: 'Ambiente Único',
                description: 'Música en vivo y decoración acogedora',
              },
              {
                icon: Users,
                title: 'Eventos Privados',
                description: 'Espacios exclusivos para tus celebraciones',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Nuestras Especialidades
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Descubre los favoritos de nuestros clientes, preparados con los mejores ingredientes
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Mojito Clásico',
                description: 'Ron blanco, lima fresca, hierbabuena, azúcar y soda',
                price: '$8.50',
                category: 'Cócteles',
                popular: true,
              },
              {
                name: 'Negroni',
                description: 'Ginebra premium, Campari y Vermut rojo',
                price: '$10.00',
                category: 'Cócteles',
              },
              {
                name: 'Old Fashioned',
                description: 'Bourbon, azúcar, angostura y twist de naranja',
                price: '$11.00',
                category: 'Cócteles',
              },
              {
                name: 'Patatas Bravas',
                description: 'Con salsa brava casera y alioli',
                price: '$6.50',
                category: 'Tapas',
                popular: true,
              },
              {
                name: 'Croquetas de Jamón',
                description: 'Jamón serrano con bechamel cremosa',
                price: '$7.00',
                category: 'Tapas',
              },
              {
                name: 'Pinchos de Pollo',
                description: 'Marinados al chimichurri y a la plancha',
                price: '$8.00',
                category: 'Tapas',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300"
              >
                {item.popular && (
                  <span className="absolute top-4 right-4 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/30">
                    Popular
                  </span>
                )}
                <span className="inline-block px-3 py-1 rounded-full bg-slate-700/50 text-slate-400 text-xs font-medium mb-4">
                  {item.category}
                </span>
                <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {item.price}
                  </span>
                  <button className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-emerald-500 text-emerald-400 font-semibold hover:bg-emerald-500 hover:text-white transition-all"
            >
              Ver Menú Completo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjLTEuNSAwLTMgMS01IDMtMiAyLTQgMi00IDJzMiAyIDQgMmMxLjUgMCAzLTEgNS0zeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              ¿Listo para una experiencia única?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Reserva tu mesa ahora y disfruta de la mejor noche con nosotros
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/reservations"
                className="px-8 py-4 rounded-2xl bg-white text-emerald-600 font-semibold text-lg hover:bg-slate-100 transition-colors shadow-xl"
              >
                Reservar Ahora
              </Link>
              <a
                href="tel:+1234567890"
                className="px-8 py-4 rounded-2xl border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                Llamar: +1 (234) 567-890
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Landing
