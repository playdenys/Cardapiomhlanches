import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
};

type Settings = {
  brandName: string;
  slogan: string;
  whatsappNumber: string;
  deliveryFee: number;
  minOrderValue: number;
  accessPin: string;
};

type Order = {
  id: string;
  createdAt: string;
  customerName: string;
  serviceType: "delivery" | "retirada";
  subtotal: number;
  total: number;
  itemsLabel: string;
};

const SETTINGS_KEY = "delivery-ecosystem-settings";
const PRODUCTS_KEY = "delivery-ecosystem-products";
const ORDERS_KEY = "delivery-ecosystem-orders";

const defaultSettings: Settings = {
  brandName: "ChefExpress",
  slogan: "Seu delivery digital de baixo custo com experiência premium.",
  whatsappNumber: "5511999999999",
  deliveryFee: 6,
  minOrderValue: 20,
  accessPin: "1234",
};

const defaultProducts: Product[] = [
  {
    id: "p1",
    name: "Smash Burger Artesanal",
    description: "Pão brioche, blend 160g, cheddar e maionese da casa.",
    category: "Burgers",
    price: 29.9,
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "p2",
    name: "Pizza Marguerita Premium",
    description: "Molho italiano, muçarela de búfala e manjericão fresco.",
    category: "Pizzas",
    price: 49.9,
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "p3",
    name: "Combo Executivo",
    description: "Prato do dia + bebida 350ml com montagem rápida.",
    category: "Combos",
    price: 34,
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [mode, setMode] = useState<"shop" | "admin">("shop");
  const [settings, setSettings] = useState<Settings>(() => readStorage(SETTINGS_KEY, defaultSettings));
  const [products, setProducts] = useState<Product[]>(() => readStorage(PRODUCTS_KEY, defaultProducts));
  const [orders, setOrders] = useState<Order[]>(() => readStorage(ORDERS_KEY, []));
  const [cart, setCart] = useState<Record<string, number>>({});
  const [serviceType, setServiceType] = useState<"delivery" | "retirada">("delivery");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [adminPinInput, setAdminPinInput] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [productDraft, setProductDraft] = useState<Omit<Product, "id">>({
    name: "",
    description: "",
    category: "",
    price: 0,
    image: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  const categories = useMemo(() => {
    const set = new Set(products.map((product) => product.category));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const sameCategory = activeCategory === "Todos" || product.category === activeCategory;
      const query = search.trim().toLowerCase();
      const hasSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);
      return sameCategory && hasSearch;
    });
  }, [activeCategory, products, search]);

  const cartItems = useMemo(() => {
    return products
      .map((product) => ({ ...product, quantity: cart[product.id] ?? 0 }))
      .filter((product) => product.quantity > 0);
  }, [cart, products]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const deliveryFee = serviceType === "delivery" ? settings.deliveryFee : 0;
  const total = subtotal + deliveryFee;
  const isOrderValid = subtotal >= settings.minOrderValue && customerName.trim().length >= 3;

  const updateQuantity = (productId: string, delta: number) => {
    setCart((current) => {
      const nextQuantity = (current[productId] ?? 0) + delta;
      if (nextQuantity <= 0) {
        const { [productId]: _, ...rest } = current;
        return rest;
      }
      return { ...current, [productId]: nextQuantity };
    });
  };

  const clearOrderState = () => {
    setCart({});
    setCustomerName("");
    setCustomerAddress("");
    setNote("");
    setPaymentMethod("Pix");
    setMobileCartOpen(false);
  };

  const sanitizePhone = (phone: string) => phone.replace(/\D/g, "");

  const buildMessage = () => {
    const lines: string[] = [];
    lines.push(`*Novo pedido - ${settings.brandName}*`);
    lines.push("");
    lines.push("*Itens:*");
    cartItems.forEach((item) => {
      lines.push(`- ${item.quantity}x ${item.name} (${formatCurrency(item.price * item.quantity)})`);
    });
    lines.push("");
    lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
    lines.push(`Taxa de entrega: ${formatCurrency(deliveryFee)}`);
    lines.push(`*Total: ${formatCurrency(total)}*`);
    lines.push("");
    lines.push(`Cliente: ${customerName}`);
    lines.push(`Tipo: ${serviceType === "delivery" ? "Entrega" : "Retirada"}`);
    if (serviceType === "delivery") {
      lines.push(`Endereço: ${customerAddress || "Não informado"}`);
    }
    lines.push(`Pagamento: ${paymentMethod}`);
    if (note.trim()) {
      lines.push(`Observações: ${note}`);
    }
    return lines.join("\n");
  };

  const checkoutOnWhatsApp = () => {
    if (!isOrderValid || cartItems.length === 0) {
      return;
    }

    const message = buildMessage();
    const encodedMessage = encodeURIComponent(message);
    const phone = sanitizePhone(settings.whatsappNumber);
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;

    const order: Order = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(),
      customerName,
      serviceType,
      subtotal,
      total,
      itemsLabel: cartItems.map((item) => `${item.quantity}x ${item.name}`).join(", "),
    };

    setOrders((current) => [order, ...current].slice(0, 30));
    window.open(url, "_blank", "noopener,noreferrer");
    clearOrderState();
  };

  const startEditProduct = (product: Product) => {
    setEditingId(product.id);
    setProductDraft({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      image: product.image,
    });
  };

  const resetProductDraft = () => {
    setEditingId(null);
    setProductDraft({ name: "", description: "", category: "", price: 0, image: "" });
  };

  const handleSaveProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!productDraft.name.trim() || !productDraft.category.trim() || productDraft.price <= 0) {
      return;
    }

    if (editingId) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingId ? { ...product, ...productDraft, price: Number(productDraft.price) } : product,
        ),
      );
      resetProductDraft();
      return;
    }

    const next: Product = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
      ...productDraft,
      price: Number(productDraft.price),
    };
    setProducts((current) => [next, ...current]);
    resetProductDraft();
  };

  const removeProduct = (id: string) => {
    setProducts((current) => current.filter((product) => product.id !== id));
    setCart((current) => {
      const { [id]: _, ...rest } = current;
      return rest;
    });
  };

  const CartContent = (
    <div className="flex h-full flex-col bg-zinc-950/95 p-4 pb-6 backdrop-blur md:p-5">
      <h3 className="text-lg font-semibold text-white">Resumo do pedido</h3>
      <p className="mt-1 text-sm text-zinc-400">Subtotal automático e envio direto para WhatsApp.</p>

      <div className="mt-4 space-y-3 overflow-y-auto pr-1">
        {cartItems.length === 0 && <p className="text-sm text-zinc-500">Adicione itens para começar.</p>}
        {cartItems.map((item) => (
          <div key={item.id} className="border-b border-zinc-800 pb-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-zinc-100">{item.name}</p>
              <p className="text-sm text-zinc-300">{formatCurrency(item.price * item.quantity)}</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateQuantity(item.id, -1)}
                className="h-10 w-10 rounded-full border border-zinc-700 text-zinc-200 transition hover:border-red-400"
              >
                -
              </button>
              <span className="text-sm text-zinc-300">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.id, 1)}
                className="h-10 w-10 rounded-full border border-zinc-700 text-zinc-200 transition hover:border-emerald-400"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-4 border-t border-zinc-800 pt-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-900 p-1 text-xs">
          <button
            type="button"
            onClick={() => setServiceType("delivery")}
            className={`rounded-lg py-2 transition ${
              serviceType === "delivery" ? "bg-emerald-500 text-zinc-950" : "text-zinc-300"
            }`}
          >
            Entrega
          </button>
          <button
            type="button"
            onClick={() => setServiceType("retirada")}
            className={`rounded-lg py-2 transition ${
              serviceType === "retirada" ? "bg-emerald-500 text-zinc-950" : "text-zinc-300"
            }`}
          >
            Retirada
          </button>
        </div>

        <input
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="Nome do cliente"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />
        {serviceType === "delivery" && (
          <input
            value={customerAddress}
            onChange={(event) => setCustomerAddress(event.target.value)}
            placeholder="Endereço de entrega"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
          />
        )}
        <input
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
          placeholder="Forma de pagamento"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="Observações"
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>

      <div className="mt-5 space-y-1 border-t border-zinc-800 pt-4 text-sm">
        <div className="flex items-center justify-between text-zinc-300">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-zinc-300">
          <span>Taxa</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold text-white">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <p className="text-xs text-zinc-500">Pedido mínimo: {formatCurrency(settings.minOrderValue)}</p>
      </div>

      <div className="mt-4 pb-2 md:pb-0">
        <button
          type="button"
          onClick={checkoutOnWhatsApp}
          disabled={!isOrderValid || cartItems.length === 0}
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          Finalizar no WhatsApp
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">{settings.brandName}</p>
            <p className="text-xs text-zinc-400">Ecossistema de delivery em GitHub com painel admin</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:items-center">
            <button
              type="button"
              onClick={() => setMode("shop")}
              className={`rounded-full px-4 py-2.5 text-xs font-medium transition ${
                mode === "shop" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-900 text-zinc-300"
              }`}
            >
              Loja
            </button>
            <button
              type="button"
              onClick={() => setMode("admin")}
              className={`rounded-full px-4 py-2.5 text-xs font-medium transition ${
                mode === "admin" ? "bg-white text-zinc-950" : "bg-zinc-900 text-zinc-300"
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      {mode === "shop" && (
        <main className="mx-auto grid w-full max-w-7xl gap-0 md:grid-cols-[1fr_360px]">
          <div>
            <section className="relative overflow-hidden border-b border-zinc-800">
              <img
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1600&q=80"
                alt="Cozinha profissional"
                className="h-[250px] w-full object-cover opacity-45 md:h-[340px]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent" />
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 flex flex-col justify-center px-4 md:px-8"
              >
                <p className="text-3xl font-bold tracking-tight text-white md:text-5xl">{settings.brandName}</p>
                <p className="mt-2 max-w-xl text-sm text-zinc-200 md:mt-3 md:text-base">{settings.slogan}</p>
                <p className="mt-3 text-xs text-zinc-300 md:mt-4">Controle total de catálogo, preços e pedidos pelo painel admin.</p>
              </motion.div>
            </section>

            <section className="px-4 py-5 pb-24 md:px-8 md:pb-5">
              <div className="flex flex-col gap-3">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar no cardápio"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`shrink-0 rounded-full px-3 py-2 text-xs transition ${
                        activeCategory === category
                          ? "bg-emerald-500 text-zinc-950"
                          : "border border-zinc-700 text-zinc-300"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <motion.ul
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
                }}
                className="mt-5 space-y-5"
              >
                {filteredProducts.map((product) => {
                  const quantity = cart[product.id] ?? 0;
                  return (
                    <motion.li
                      key={product.id}
                      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                      className="grid grid-cols-[84px_1fr] gap-3 border-b border-zinc-800 pb-4 md:grid-cols-[96px_1fr_auto] md:gap-4"
                    >
                      <img src={product.image} alt={product.name} className="h-20 w-[84px] rounded-lg object-cover md:w-24" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{product.name}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{product.description}</p>
                        <p className="mt-2 text-sm font-medium text-emerald-300">{formatCurrency(product.price)}</p>
                        <div className="mt-3 flex items-center gap-2 md:hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            className="h-10 w-10 rounded-full border border-zinc-700 text-zinc-200"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-sm text-zinc-200">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            className="h-10 w-10 rounded-full border border-zinc-700 text-zinc-200"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="hidden items-center gap-2 self-center md:flex">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, -1)}
                          className="h-8 w-8 rounded-full border border-zinc-700 text-zinc-200"
                        >
                          -
                        </button>
                        <span className="w-4 text-center text-sm text-zinc-200">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, 1)}
                          className="h-8 w-8 rounded-full border border-zinc-700 text-zinc-200"
                        >
                          +
                        </button>
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </section>
          </div>

          <aside className="hidden border-l border-zinc-800 md:block">{CartContent}</aside>

          {cartItems.length > 0 && (
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-800 bg-zinc-950 p-3 pb-4 md:hidden">
              <button
                type="button"
                onClick={() => setMobileCartOpen(true)}
                className="flex w-full items-center justify-between rounded-xl bg-emerald-500 px-4 py-3 text-zinc-950"
              >
                <span className="text-sm font-medium">Ver pedido ({cartItemCount})</span>
                <span className="text-sm font-semibold">{formatCurrency(total)}</span>
              </button>
            </div>
          )}

          <AnimatePresence>
            {mobileCartOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-zinc-950/70 md:hidden"
                onClick={() => setMobileCartOpen(false)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 24, stiffness: 220 }}
                  className="absolute inset-x-0 bottom-0 h-[90vh] rounded-t-2xl border-t border-zinc-700"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                    <p className="text-sm font-medium text-zinc-300">Seu pedido</p>
                    <button
                      type="button"
                      onClick={() => setMobileCartOpen(false)}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200"
                    >
                      Fechar
                    </button>
                  </div>
                  {CartContent}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {mode === "admin" && (
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
          {!adminUnlocked ? (
            <section className="mx-auto mt-8 max-w-md border border-zinc-800 bg-zinc-900/60 p-6">
              <h2 className="text-xl font-semibold text-white">Acesso do administrador</h2>
              <p className="mt-1 text-sm text-zinc-400">Entre com seu PIN para editar todo o ecossistema.</p>
              <input
                type="password"
                value={adminPinInput}
                onChange={(event) => setAdminPinInput(event.target.value)}
                placeholder="PIN"
                className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setAdminUnlocked(adminPinInput === settings.accessPin)}
                className="mt-4 w-full rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-950"
              >
                Entrar
              </button>
            </section>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              <section>
                <h2 className="text-xl font-semibold text-white">Configurações da operação</h2>
                <p className="mt-1 text-sm text-zinc-400">Tudo salvo no navegador para deploy simples no GitHub Pages.</p>
                <div className="mt-4 space-y-3 border border-zinc-800 bg-zinc-900/50 p-4">
                  <input
                    value={settings.brandName}
                    onChange={(event) => setSettings((current) => ({ ...current, brandName: event.target.value }))}
                    placeholder="Nome da marca"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                  <input
                    value={settings.slogan}
                    onChange={(event) => setSettings((current) => ({ ...current, slogan: event.target.value }))}
                    placeholder="Slogan"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                  <input
                    value={settings.whatsappNumber}
                    onChange={(event) => setSettings((current) => ({ ...current, whatsappNumber: event.target.value }))}
                    placeholder="WhatsApp com DDI e DDD"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min={0}
                      value={settings.deliveryFee}
                      onChange={(event) =>
                        setSettings((current) => ({ ...current, deliveryFee: Number(event.target.value) || 0 }))
                      }
                      placeholder="Taxa de entrega"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      value={settings.minOrderValue}
                      onChange={(event) =>
                        setSettings((current) => ({ ...current, minOrderValue: Number(event.target.value) || 0 }))
                      }
                      placeholder="Pedido mínimo"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    />
                  </div>
                  <input
                    type="password"
                    value={settings.accessPin}
                    onChange={(event) => setSettings((current) => ({ ...current, accessPin: event.target.value }))}
                    placeholder="PIN do admin"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">Gestão de cardápio</h2>
                <p className="mt-1 text-sm text-zinc-400">Crie, edite e remova itens sem depender de plataforma paga.</p>

                <form onSubmit={handleSaveProduct} className="mt-4 space-y-3 border border-zinc-800 bg-zinc-900/50 p-4">
                  <input
                    value={productDraft.name}
                    onChange={(event) => setProductDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Nome do produto"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                  <textarea
                    rows={2}
                    value={productDraft.description}
                    onChange={(event) => setProductDraft((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Descrição"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={productDraft.category}
                      onChange={(event) => setProductDraft((current) => ({ ...current, category: event.target.value }))}
                      placeholder="Categoria"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={productDraft.price}
                      onChange={(event) =>
                        setProductDraft((current) => ({ ...current, price: Number(event.target.value) || 0 }))
                      }
                      placeholder="Preço"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    />
                  </div>
                  <input
                    value={productDraft.image}
                    onChange={(event) => setProductDraft((current) => ({ ...current, image: event.target.value }))}
                    placeholder="URL da imagem"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950">
                      {editingId ? "Atualizar" : "Adicionar"}
                    </button>
                    <button
                      type="button"
                      onClick={resetProductDraft}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
                    >
                      Limpar
                    </button>
                  </div>
                </form>

                <div className="mt-4 space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="border border-zinc-800 bg-zinc-900/40 p-3">
                      <p className="font-medium text-zinc-100">{product.name}</p>
                      <p className="text-xs text-zinc-400">{product.category}</p>
                      <p className="mt-1 text-sm text-emerald-300">{formatCurrency(product.price)}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditProduct(product)}
                          className="rounded-lg border border-zinc-700 px-3 py-1 text-xs"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => removeProduct(product.id)}
                          className="rounded-lg border border-red-500/40 px-3 py-1 text-xs text-red-300"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="md:col-span-2">
                <h2 className="text-xl font-semibold text-white">Últimos pedidos gerados</h2>
                <p className="mt-1 text-sm text-zinc-400">Histórico local para acompanhar operação rápida.</p>
                <div className="mt-4 overflow-x-auto border border-zinc-800">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-zinc-900 text-zinc-300">
                      <tr>
                        <th className="px-3 py-2">Data</th>
                        <th className="px-3 py-2">Cliente</th>
                        <th className="px-3 py-2">Itens</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-zinc-500">
                            Nenhum pedido registrado ainda.
                          </td>
                        </tr>
                      )}
                      {orders.map((order) => (
                        <tr key={order.id} className="border-t border-zinc-800 text-zinc-200">
                          <td className="px-3 py-2">{new Date(order.createdAt).toLocaleString("pt-BR")}</td>
                          <td className="px-3 py-2">{order.customerName}</td>
                          <td className="px-3 py-2">{order.itemsLabel}</td>
                          <td className="px-3 py-2">{order.serviceType}</td>
                          <td className="px-3 py-2">{formatCurrency(order.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
