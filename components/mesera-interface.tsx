"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Product = {
  id: string;
  name: string;
  price: number;
  display_stock: number;
  requires_inventory: boolean;
  category_id: string;
};

type Category = {
  id: string;
  name: string;
};

type UsedIngredient = {
  product_id: string;
  product_name: string;
  quantity: number;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  display_stock: number;
  requires_inventory: boolean;
  usedIngredients: UsedIngredient[];
};

type CashRegister = {
  id: string;
  date: string;
  opening_balance: number;
  status: string;
};

type PaymentMethod = "cash" | "card" | "transfer";

export default function MeseraInterface({
  register,
  initialProducts,
  categories,
}: {
  register: CashRegister;
  initialProducts: Product[];
  categories: Category[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  // id del item del carrito cuyo panel de ingredientes está abierto
  const [expandedIngredients, setExpandedIngredients] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogout() {
    const client = createSupabaseBrowserClient();
    await client.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Productos del enfriador disponibles como ingredientes
  const inventoryProducts = products.filter((p) => p.requires_inventory);

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category_id === selectedCategory);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ── CARRITO ──────────────────────────────────────────────────────────────

  function addToCart(product: Product) {
    if (product.requires_inventory) {
      const inCart = cart.find((i) => i.id === product.id)?.quantity || 0;
      if (inCart >= product.display_stock) {
        alert(`Sin stock. Solo hay ${product.display_stock} en el enfriador.`);
        return;
      }
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          display_stock: product.display_stock,
          requires_inventory: product.requires_inventory,
          usedIngredients: [],
        },
      ];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((i) => i.id !== productId);
      return prev.map((i) =>
        i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }

  function deleteFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.id !== productId));
    if (expandedIngredients === productId) setExpandedIngredients(null);
  }

  function getCartQty(productId: string) {
    return cart.find((i) => i.id === productId)?.quantity || 0;
  }

  // ── INGREDIENTES ─────────────────────────────────────────────────────────

  function getIngredientQty(cartItemId: string, ingredientId: string) {
    return (
      cart
        .find((i) => i.id === cartItemId)
        ?.usedIngredients.find((ing) => ing.product_id === ingredientId)
        ?.quantity || 0
    );
  }

  function addIngredient(cartItemId: string, ingredientProduct: Product) {
    // Verificar stock disponible del ingrediente
    const totalUsedElsewhere = cart.reduce((sum, cartItem) => {
      if (cartItem.id === cartItemId) return sum;
      const ing = cartItem.usedIngredients.find(
        (i) => i.product_id === ingredientProduct.id
      );
      return sum + (ing?.quantity || 0);
    }, 0);
    const alreadyInThisItem = getIngredientQty(cartItemId, ingredientProduct.id);
    const totalUsed = totalUsedElsewhere + alreadyInThisItem + 1;

    if (totalUsed > ingredientProduct.display_stock) {
      alert(`Sin stock de ${ingredientProduct.name}. Solo hay ${ingredientProduct.display_stock}.`);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartItemId) return item;
        const existing = item.usedIngredients.find(
          (i) => i.product_id === ingredientProduct.id
        );
        if (existing) {
          return {
            ...item,
            usedIngredients: item.usedIngredients.map((i) =>
              i.product_id === ingredientProduct.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          };
        }
        return {
          ...item,
          usedIngredients: [
            ...item.usedIngredients,
            {
              product_id: ingredientProduct.id,
              product_name: ingredientProduct.name,
              quantity: 1,
            },
          ],
        };
      })
    );
  }

  function removeIngredient(cartItemId: string, ingredientId: string) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartItemId) return item;
        const existing = item.usedIngredients.find(
          (i) => i.product_id === ingredientId
        );
        if (!existing) return item;
        if (existing.quantity === 1) {
          return {
            ...item,
            usedIngredients: item.usedIngredients.filter(
              (i) => i.product_id !== ingredientId
            ),
          };
        }
        return {
          ...item,
          usedIngredients: item.usedIngredients.map((i) =>
            i.product_id === ingredientId
              ? { ...i, quantity: i.quantity - 1 }
              : i
          ),
        };
      })
    );
  }

  // ── REGISTRAR VENTA ──────────────────────────────────────────────────────

  async function registrarVenta() {
    if (cart.length === 0) return;
    setLoading(true);

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        cash_register_id: register.id,
        total: cartTotal,
        payment_method: paymentMethod,
      })
      .select()
      .single();

    if (saleError || !sale) {
      alert("Error al registrar la venta. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    // Insertar items de la venta
    const items = cart.map((item) => ({
      sale_id: sale.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }));
    await supabase.from("sale_items").insert(items);

    // Calcular qué descontar del stock de cada producto del enfriador
    const stockChanges: Record<string, number> = {};

    for (const item of cart) {
      // Productos de inventario vendidos directamente
      if (item.requires_inventory) {
        stockChanges[item.id] = (stockChanges[item.id] || 0) + item.quantity;
      }
      // Ingredientes usados en productos preparados
      for (const ing of item.usedIngredients) {
        stockChanges[ing.product_id] =
          (stockChanges[ing.product_id] || 0) + ing.quantity;
      }
    }

    // Aplicar descuentos en BD
    for (const [productId, qty] of Object.entries(stockChanges)) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        await supabase
          .from("products")
          .update({ display_stock: product.display_stock - qty })
          .eq("id", productId);
      }
    }

    // Actualizar stock local
    setProducts((prev) =>
      prev.map((p) => {
        const change = stockChanges[p.id];
        if (change) return { ...p, display_stock: p.display_stock - change };
        return p;
      })
    );

    setCart([]);
    setExpandedIngredients(null);
    setShowPayment(false);
    setShowCart(false);
    setLoading(false);

    const metodoPago =
      paymentMethod === "cash"
        ? "efectivo"
        : paymentMethod === "card"
          ? "tarjeta"
          : "transferencia";
    setSuccessMessage(
      `✅ Venta de $${cartTotal.toFixed(2)} registrada (${metodoPago})`
    );
    setTimeout(() => setSuccessMessage(""), 3000);
  }

  // ── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-20">
        <div>
          <h1 className="text-lg font-bold">🍺 Bar Control</h1>
          <p className="text-xs text-slate-400">Toma de pedidos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowCart(true); setShowPayment(false); }}
            className="relative bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            🛒 Carrito
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white text-xl px-2 py-1"
            title="Cerrar sesión"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="bg-green-600 text-white text-center py-3 px-4 font-semibold text-sm">
          {successMessage}
        </div>
      )}

      {/* Categorías */}
      <div className="bg-slate-800 px-4 py-2 flex gap-2 overflow-x-auto sticky top-[60px] z-10">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-amber-500 text-black"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? "bg-amber-500 text-black"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      <div className="flex-1 p-4 grid grid-cols-2 gap-3 pb-24">
        {filteredProducts.map((product) => {
          const qty = getCartQty(product.id);
          const sinStock = product.requires_inventory && product.display_stock === 0;

          return (
            <div
              key={product.id}
              className={`bg-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-md transition-all ${
                sinStock ? "opacity-40" : ""
              }`}
            >
              <div className="flex-1">
                <p className="font-semibold text-base leading-tight">{product.name}</p>
                <p className="text-amber-400 font-bold text-xl mt-1">
                  ${product.price.toFixed(2)}
                </p>
                {product.requires_inventory && (
                  <p className={`text-xs mt-1 ${product.display_stock <= 3 ? "text-red-400" : "text-slate-400"}`}>
                    Stock: {product.display_stock}
                  </p>
                )}
              </div>

              {qty === 0 ? (
                <button
                  onClick={() => addToCart(product)}
                  disabled={sinStock}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {sinStock ? "Sin stock" : "+ Agregar"}
                </button>
              ) : (
                <div className="flex items-center justify-between bg-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="px-4 py-2.5 text-lg font-bold hover:bg-slate-600 transition-colors"
                  >
                    −
                  </button>
                  <span className="font-bold text-lg">{qty}</span>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.requires_inventory && qty >= product.display_stock}
                    className="px-4 py-2.5 text-lg font-bold hover:bg-slate-600 disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra inferior */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-black p-4 z-20 shadow-2xl">
          <button
            onClick={() => { setShowCart(true); setShowPayment(false); }}
            className="w-full flex items-center justify-between font-bold text-base"
          >
            <span>{cartCount} producto(s)</span>
            <span>Ver carrito → ${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Panel del carrito */}
      {showCart && (
        <div className="fixed inset-0 bg-black/70 z-30 flex flex-col justify-end">
          <div className="bg-slate-800 rounded-t-3xl max-h-[90vh] flex flex-col">
            {/* Header carrito */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
              <h2 className="text-lg font-bold">🛒 Carrito ({cartCount})</h2>
              <button
                onClick={() => { setShowCart(false); setShowPayment(false); setExpandedIngredients(null); }}
                className="text-slate-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Lista carrito */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-slate-400 text-center py-8">El carrito está vacío</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="bg-slate-700 rounded-2xl overflow-hidden">
                    {/* Fila del producto */}
                    <div className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-amber-400 text-xs">${item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-600 rounded-lg overflow-hidden">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="px-2.5 py-1.5 hover:bg-slate-500 font-bold text-sm"
                        >
                          −
                        </button>
                        <span className="font-bold w-5 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => { const p = products.find((p) => p.id === item.id); if (p) addToCart(p); }}
                          className="px-2.5 py-1.5 hover:bg-slate-500 font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                        <button onClick={() => deleteFromCart(item.id)} className="text-red-400 text-xs">
                          Quitar
                        </button>
                      </div>
                    </div>

                    {/* Sección de ingredientes — solo para productos NO de inventario */}
                    {!item.requires_inventory && inventoryProducts.length > 0 && (
                      <div className="border-t border-slate-600">
                        {/* Ingredientes ya añadidos */}
                        {item.usedIngredients.length > 0 && (
                          <div className="px-3 pt-2 flex flex-wrap gap-1.5">
                            {item.usedIngredients.map((ing) => (
                              <div
                                key={ing.product_id}
                                className="flex items-center gap-1 bg-blue-900/60 border border-blue-600 rounded-lg px-2 py-1"
                              >
                                <span className="text-xs text-blue-200">{ing.product_name}</span>
                                <div className="flex items-center gap-0.5 ml-1">
                                  <button
                                    onClick={() => removeIngredient(item.id, ing.product_id)}
                                    className="text-blue-300 hover:text-white w-4 h-4 flex items-center justify-center text-xs"
                                  >
                                    −
                                  </button>
                                  <span className="text-blue-100 font-bold text-xs w-3 text-center">{ing.quantity}</span>
                                  <button
                                    onClick={() => {
                                      const p = inventoryProducts.find((p) => p.id === ing.product_id);
                                      if (p) addIngredient(item.id, p);
                                    }}
                                    className="text-blue-300 hover:text-white w-4 h-4 flex items-center justify-center text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Botón expandir / lista de ingredientes disponibles */}
                        <button
                          onClick={() =>
                            setExpandedIngredients(
                              expandedIngredients === item.id ? null : item.id
                            )
                          }
                          className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                        >
                          <span>{expandedIngredients === item.id ? "▲" : "▼"}</span>
                          <span>
                            {item.usedIngredients.length === 0
                              ? "🧪 Agregar ingredientes del enfriador"
                              : "🧪 Editar ingredientes"}
                          </span>
                        </button>

                        {expandedIngredients === item.id && (
                          <div className="px-3 pb-3">
                            <div className="flex flex-wrap gap-2">
                              {inventoryProducts.map((inv) => {
                                const ingQty = getIngredientQty(item.id, inv.id);
                                return (
                                  <button
                                    key={inv.id}
                                    onClick={() => addIngredient(item.id, inv)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                                      ingQty > 0
                                        ? "bg-blue-700 border-blue-500 text-white"
                                        : "bg-slate-600 border-slate-500 text-slate-200 hover:bg-slate-500"
                                    }`}
                                  >
                                    {inv.name}
                                    {ingQty > 0 && (
                                      <span className="ml-1 bg-blue-500 rounded-full px-1">×{ingQty}</span>
                                    )}
                                    <span className="ml-1 text-slate-400">({inv.display_stock})</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Total y pago */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-700 space-y-4 flex-shrink-0">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-amber-400">${cartTotal.toFixed(2)}</span>
                </div>

                {!showPayment ? (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
                  >
                    Cobrar →
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-400 font-medium">Método de pago:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { value: "cash", label: "💵 Efectivo" },
                          { value: "card", label: "💳 Tarjeta" },
                          { value: "transfer", label: "📱 Transfer" },
                        ] as { value: PaymentMethod; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setPaymentMethod(opt.value)}
                          className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                            paymentMethod === opt.value
                              ? "bg-green-500 text-white"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={registrarVenta}
                      disabled={loading}
                      className="w-full bg-green-500 hover:bg-green-400 disabled:bg-slate-600 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
                    >
                      {loading ? "Guardando..." : "✅ Confirmar venta"}
                    </button>
                    <button
                      onClick={() => setShowPayment(false)}
                      className="w-full text-slate-400 text-sm py-2"
                    >
                      ← Volver al carrito
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
