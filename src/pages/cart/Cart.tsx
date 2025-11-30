import { useState, type FC } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react'
import { useCart } from '../../features/products/context/CartContext'
import { Card, CardContent, CardHeader, CardTitle, Input } from '../../components/ui'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

const CartPage: FC = () => {
  const navigate = useNavigate()
  const { cart, removeItem, updateQuantity, clearCart, setTableNumber, setClientName } = useCart()
  const [tableNum, setTableNum] = useState(cart.tableNumber?.toString() || '')
  const [clientNameInput, setClientNameInput] = useState(cart.clientName || '')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleTableChange = (value: string) => {
    setTableNum(value)
    const num = parseInt(value)
    if (!isNaN(num) && num > 0) {
      setTableNumber(num)
    }
  }

  const handleClientNameChange = (value: string) => {
    setClientNameInput(value)
    setClientName(value)
  }

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    if (!tableNum || parseInt(tableNum) <= 0) {
      toast.error('Por favor ingresa el número de mesa')
      return
    }

    if (!clientNameInput.trim()) {
      toast.error('Por favor ingresa tu nombre')
      return
    }

    setIsProcessing(true)
    
    try {
      // Here you would call the API to create the order
      // await orderService.create({
      //   clientName: clientNameInput,
      //   tableNumber: parseInt(tableNum),
      //   waiterId: 'default', // Would come from auth context
      //   orderItems: cart.items.map(item => ({
      //     productCode: item.product.code,
      //     quantity: item.quantity
      //   }))
      // })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success('¡Pedido realizado con éxito!')
      clearCart()
      navigate('/orders')
    } catch (error) {
      toast.error('Error al procesar el pedido')
    } finally {
      setIsProcessing(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Tu carrito está vacío</h2>
          <p className="text-slate-400 mb-8">¡Agrega algunos productos para comenzar!</p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Ver Menú
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/menu"
              className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Tu Carrito</h1>
              <p className="text-slate-400">{cart.items.length} producto{cart.items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <Card key={item.product.id} className="!p-4">
                  <div className="flex items-center gap-4">
                    {/* Product Image Placeholder */}
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-8 h-8 text-emerald-400" />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">{item.product.name}</h3>
                      <p className="text-slate-400 text-sm truncate">{item.product.description}</p>
                      <p className="text-emerald-400 font-semibold mt-1">${item.price.toFixed(2)} c/u</p>
                    </div>

                    {/* Quantity and Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center bg-slate-700 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            removeItem(item.product.id)
                            toast.success('Producto eliminado')
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Clear Cart Button */}
              <button
                onClick={() => {
                  clearCart()
                  toast.success('Carrito vaciado')
                }}
                className="text-sm text-slate-500 hover:text-red-400 transition-colors"
              >
                Vaciar carrito
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Resumen del Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Customer Info */}
                  <div className="space-y-4">
                    <Input
                      label="Número de Mesa"
                      type="number"
                      placeholder="Ej: 5"
                      value={tableNum}
                      onChange={(e) => handleTableChange(e.target.value)}
                      min={1}
                    />
                    <Input
                      label="Tu Nombre"
                      type="text"
                      placeholder="Ej: Juan García"
                      value={clientNameInput}
                      onChange={(e) => handleClientNameChange(e.target.value)}
                    />
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t border-slate-700 pt-4 space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>${cart.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Impuestos (10%)</span>
                      <span>${(cart.total * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-slate-700">
                      <span>Total</span>
                      <span className="text-emerald-400">${(cart.total * 1.1).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    isLoading={isProcessing}
                    className="w-full"
                    size="lg"
                    leftIcon={<CreditCard className="w-5 h-5" />}
                  >
                    {isProcessing ? 'Procesando...' : 'Realizar Pedido'}
                  </Button>

                  <p className="text-center text-slate-500 text-xs">
                    Al realizar el pedido, aceptas nuestros términos de servicio
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CartPage
