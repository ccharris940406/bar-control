'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'

type Product = {
  id: string
  name: string
  price: number
  display_stock: number
  requires_inventory: boolean
}

type UsedIngredient = {
  product_id: string
  product_name: string
  quantity: number
}

type CartItem = Product & {
  quantity: number
  subtotal: number
  usedIngredients: UsedIngredient[]
}

type CashRegister = {
  id: string
  date: string
  opening_balance: number
  status: string
}

export default function CreateSaleDialog({ register }: { register: CashRegister }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [ingredientProduct, setIngredientProduct] = useState('')
  const [ingredientQuantity, setIngredientQuantity] = useState('1')

  const router = useRouter()

  async function loadProducts() {
    setLoadingProducts(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, price, display_stock, requires_inventory')
      .eq('active', true)
    setProducts(data || [])
    setLoadingProducts(false)
  }

  function addToCart() {
    if (!selectedProduct || !quantity) return

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    const qty = parseInt(quantity)

    // Validar stock si requiere inventario
    if (product.requires_inventory) {
      const alreadyInCart = cart.find((item) => item.id === selectedProduct)
      const totalQty = (alreadyInCart?.quantity || 0) + qty
      if (totalQty > product.display_stock) {
        alert(`Stock insuficiente. Solo hay ${product.display_stock} unidades de ${product.name} en el enfriador.`)
        return
      }
    }

    const subtotal = product.price * qty

    const existingItem = cart.find((item) => item.id === selectedProduct)
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === selectedProduct
            ? {
                ...item,
                quantity: item.quantity + qty,
                subtotal: (item.quantity + qty) * item.price,
              }
            : item
        )
      )
    } else {
      setCart([...cart, { ...product, quantity: qty, subtotal, usedIngredients: [] }])
    }

    setSelectedProduct('')
    setQuantity('1')
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.id !== productId))
  }

  function addIngredient(cartIndex: number) {
    if (!ingredientProduct || !ingredientQuantity) return

    const ingredient = products.find((p) => p.id === ingredientProduct)
    if (!ingredient) return

    const newCart = [...cart]
    const existingIng = newCart[cartIndex].usedIngredients.find(
      (i) => i.product_id === ingredientProduct
    )

    if (existingIng) {
      existingIng.quantity += parseInt(ingredientQuantity)
    } else {
      newCart[cartIndex].usedIngredients.push({
        product_id: ingredientProduct,
        product_name: ingredient.name,
        quantity: parseInt(ingredientQuantity),
      })
    }

    setCart(newCart)
    setIngredientProduct('')
    setIngredientQuantity('1')
    setEditingIndex(null)
  }

  function removeIngredient(cartIndex: number, ingredientId: string) {
    const newCart = [...cart]
    newCart[cartIndex].usedIngredients = newCart[cartIndex].usedIngredients.filter(
      (i) => i.product_id !== ingredientId
    )
    setCart(newCart)
  }

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0)

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (cart.length === 0) return

    setLoading(true)

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        cash_register_id: register.id,
        total,
        payment_method: paymentMethod,
      })
      .select()
      .single()

    if (!saleError && sale) {
      const items = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.subtotal,
      }))

      await supabase.from('sale_items').insert(items)

      // Descontar ingredientes usados del display_stock
      for (const cartItem of cart) {
        for (const ingredient of cartItem.usedIngredients) {
          const product = products.find((p) => p.id === ingredient.product_id)
          if (product) {
            await supabase
              .from('products')
              .update({
                display_stock: product.display_stock - ingredient.quantity,
              })
              .eq('id', ingredient.product_id)
          }
        }

        // Descontar el producto vendido del display_stock
        const product = products.find((p) => p.id === cartItem.id)
        if (product) {
          await supabase
            .from('products')
            .update({
              display_stock: product.display_stock - cartItem.quantity,
            })
            .eq('id', cartItem.id)
        }
      }
    }

    setLoading(false)
    if (!saleError) {
      setCart([])
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" onClick={loadProducts}>
          + Nueva venta
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva venta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="mb-1 block">Producto</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (${p.price}) - Stock: {p.display_stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div>
              <Label className="mb-1 block text-sm">Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="col-span-2 md:col-span-1 flex items-end">
              <Button type="button" onClick={addToCart} className="w-full text-sm">
                Agregar
              </Button>
            </div>
          </div>

          {cart.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Carrito</h3>
              {cart.map((item, index) => (
                <Card key={item.id} className="border">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity} x ${item.price.toFixed(2)} = ${item.subtotal.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          ✕
                        </Button>
                      </div>

                      {editingIndex === index ? (
                        <div className="bg-slate-50 p-2 rounded space-y-2">
                          <Select value={ingredientProduct} onValueChange={setIngredientProduct}>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Ingrediente usado" />
                            </SelectTrigger>
                            <SelectContent>
                              {products
                                .filter((p) => p.id !== item.id)
                                .map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={ingredientQuantity}
                              onChange={(e) => setIngredientQuantity(e.target.value)}
                              placeholder="Cant"
                              className="text-sm w-16"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => addIngredient(index)}
                              className="text-sm"
                            >
                              Agregar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingIndex(null)}
                              className="text-sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingIndex(index)}
                          className="w-full text-xs"
                        >
                          {item.usedIngredients.length === 0
                            ? '+ Agregar ingredientes'
                            : `${item.usedIngredients.length} ingrediente(s)`}
                        </Button>
                      )}

                      {item.usedIngredients.length > 0 && (
                        <div className="bg-blue-50 p-2 rounded space-y-1">
                          {item.usedIngredients.map((ing) => (
                            <div key={ing.product_id} className="flex justify-between items-center text-xs">
                              <span>{ing.product_name} x{ing.quantity}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 px-1"
                                onClick={() => removeIngredient(index, ing.product_id)}
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <Label className="mb-1 block">Método de pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Guardando...' : 'Registrar venta'}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
