import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { ProductDto, CartItem, Cart } from '../../../types'

interface CartContextType {
  cart: Cart
  addItem: (product: ProductDto, price: number, quantity?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  setTableNumber: (tableNumber: number) => void
  setClientName: (clientName: string) => void
  itemCount: number
}

const CartContext = createContext<CartContextType | null>(null)

const initialCart: Cart = {
  items: [],
  total: 0,
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(initialCart)

  const calculateTotal = useCallback((items: CartItem[]): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [])

  const addItem = useCallback((product: ProductDto, price: number, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.items.findIndex((item) => item.product.id === product.id)

      let newItems: CartItem[]
      if (existingIndex >= 0) {
        newItems = prevCart.items.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        )
      } else {
        newItems = [...prevCart.items, { product, price, quantity }]
      }

      return {
        ...prevCart,
        items: newItems,
        total: calculateTotal(newItems),
      }
    })
  }, [calculateTotal])

  const removeItem = useCallback((productId: number) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter((item) => item.product.id !== productId)
      return {
        ...prevCart,
        items: newItems,
        total: calculateTotal(newItems),
      }
    })
  }, [calculateTotal])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
      return {
        ...prevCart,
        items: newItems,
        total: calculateTotal(newItems),
      }
    })
  }, [calculateTotal, removeItem])

  const clearCart = useCallback(() => {
    setCart(initialCart)
  }, [])

  const setTableNumber = useCallback((tableNumber: number) => {
    setCart((prevCart) => ({ ...prevCart, tableNumber }))
  }, [])

  const setClientName = useCallback((clientName: string) => {
    setCart((prevCart) => ({ ...prevCart, clientName }))
  }, [])

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setTableNumber,
        setClientName,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
