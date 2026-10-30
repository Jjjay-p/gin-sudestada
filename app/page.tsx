"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Anchor,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
  Mail,
  GlassWater,
  Sparkles,
  Droplets,
  Leaf,
  HelpCircle,
} from "lucide-react";
import { registrarVenta, suscribirNewsletter, registrarNuevoCarrito } from "@/lib/db";

interface Product {
  id: string;
  size: string;
  label: string;
  price: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const PRODUCTS: Product[] = [
  {
    id: "500ml",
    size: "500ml",
    label: "Edición Náutica Compacta",
    price: 18500,
  },
  {
    id: "750ml",
    size: "750ml",
    label: "Botella Estándar Premium",
    price: 24900,
  },
  {
    id: "1 Litro",
    size: "1 Litro",
    label: "Edición Velero Colección",
    price: 31000,
  },
];

const BOTANICALS = [
  { name: "Enebro de la Patagonia", role: "Estructura y notas pino" },
  { name: "Piel de Pomelo Rosado", role: "Frescura cítrica vibrante" },
  { name: "Coriandro en Grano", role: "Toque especiado y herbal" },
  { name: "Flores de Cedrón", role: "Perfil aromático rioplatense" },
  { name: "Cardamomo Verde", role: "Elegancia y persistencia" },
];

const COCKTAILS = [
  {
    id: "perfect-serve",
    title: "Sudestada Perfect Serve",
    glass: "Copa Balón",
    ingredients: [
      "2 oz Sudestada Gin",
      "4 oz Tónica Premium",
      "Piel de pomelo fresco",
      "Una ramita de romero quemado",
    ],
    steps: [
      "Llená la copa balón con abundante hielo roca bien cristalino.",
      "Serví 2 oz de Sudestada Gin en un movimiento continuo sobre el hielo.",
      "Sumá la tónica deslizándola suavemente con una cuchara bailarina.",
      "Decorá con piel de pomelo expresada y la ramita de romero.",
    ],
  },
  {
    id: "rio-negroni",
    title: "Negroni del Río",
    glass: "Vaso de Trago Corto",
    ingredients: [
      "1 oz Sudestada Gin",
      "1 oz Vermut Rojo Artesanal",
      "1 oz Campari",
      "Piel de naranja expresada",
    ],
    steps: [
      "Enfriá el vaso corto con un cubo de hielo de gran tamaño.",
      "Serví partes iguales de Sudestada Gin, Vermut y Campari.",
      "Refrescá suavemente con la cuchara durante 15 segundos.",
      "Exprimí los aceites de la piel de naranja sobre la superficie.",
    ],
  },
  {
    id: "south-side",
    title: "Sudestada Southside",
    glass: "Copa Coupette / Martini",
    ingredients: [
      "2 oz Sudestada Gin",
      "3/4 oz Jugo de Lima Fresco",
      "3/4 oz Almíbar Simple",
      "6-8 Hojas de Menta Fresca",
    ],
    steps: [
      "Golpeá la menta en la palma de tu mano para liberar sus aromas.",
      "Colocá la menta, gin, jugo de lima y almíbar en la coctelera con hielo.",
      "Batí enérgicamente durante 10 a 12 segundos.",
      "Serví con doble colado en una copa previa enfriada.",
    ],
  },
];

const MOMENTS = [
  {
    title: "La última luz",
    subtitle: "RÍO DE LA PLATA",
    description: "El sol baja, el río cambia de color y nadie tiene apuro por volver.",
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=85",
  },
  {
    title: "Entre amigos",
    subtitle: "BUENOS AIRES",
    description: "Una mesa larga, hielo abundante y esas charlas que se extienden hasta tarde.",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=85",
  },
  {
    title: "El ritual",
    subtitle: "GIN TONIC, SIN APURO",
    description: "Buenos ingredientes, una buena copa y el tiempo necesario para disfrutarla.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765edfd7?auto=format&fit=crop&w=1600&q=85",
  },
];

const ANNOUNCEMENTS = [
  "🔥 ¡PROMO IMPERDIBLE! LLEVANDO 2 BOTELLAS, LA 3RA ES GRATIS",
  "🚚 ENVIOS A CABA Y AMBA EN EL DIA COMPRANDO ANTES DE LAS 14 HS",
  "💳 MERCADO PAGO Y TARJETAS HASTA EN 3 CUOTAS SIN INTERÉS",
];

const FAQS = [
  {
    q: "¿Cómo funciona la promoción 3x2?",
    a: "Agregá 3 botellas de cualquiera de nuestras presentaciones al carrito. Al momento de procesar tu pedido te tomaremos la 3ra unidad sin costo.",
  },
  {
    q: "¿Cuánto tardan los envíos a CABA y AMBA?",
    a: "Si hacés tu compra de lunes a viernes antes de las 14:00 hs, recibís tu pedido en el día a través de nuestra mensajería privada. Compras posteriores a esa hora se entregan al día hábil siguiente.",
  },
  {
    q: "¿Hacen envíos al interior del país?",
    a: "Sí, despachamos a todo el país vía Correo Argentino / Andreani. El plazo de entrega estimado es de 2 a 5 días hábiles según la provincia.",
  },
  {
    q: "¿Qué medios de pago aceptan?",
    a: "Aceptamos dinero en cuenta de Mercado Pago, tarjetas de débito, crédito y transferencia bancaria directa.",
  },
  {
    q: "¿Tienen ventas mayoristas o para eventos?",
    a: "¡Sí! Si tenés un bar, un evento privado o querés hacer un regalo corporativo, escribinos directo por WhatsApp y te armamos un presupuesto a medida.",
  },
];

type PaymentStatus = "success" | "failure" | "pending" | null;

const money = (value: number) => "$" + value.toLocaleString("es-AR");

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Bottle({ small = false }: { small?: boolean }) {
  return (
    <img
      src="/sudestada-bottle.png?v=3"
      alt="Botella Sudestada Gin"
      className={
        small
          ? "h-56 w-auto object-contain drop-shadow-md"
          : "h-full w-auto max-h-full object-contain drop-shadow-2xl scale-125 sm:scale-135 transition-transform duration-300"
      }
    />
  );
}

export default function Home() {
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // ESTADO DEL CARRITO
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hasRecordedCart, setHasRecordedCart] = useState(false);

  const [clientEmail, setClientEmail] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeCocktail, setActiveCocktail] = useState(COCKTAILS[0]);

  // Carrusel de anuncios superior
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

  // FAQ Acordeón
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Newsletter
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const heroBottleY = useTransform(scrollYProgress, [0, 0.3], [0, 90]);
  const heroBottleRotate = useTransform(scrollYProgress, [0, 0.3], [0, -4]);

  // Rotación del carrusel de anuncios
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");

    if (payment === "success" || payment === "failure" || payment === "pending") {
      setPaymentStatus(payment);
      setIsCartOpen(false);
      setIsProcessingPayment(false);
    }
  }, []);

  const trackCartCreation = () => {
    if (!hasRecordedCart) {
      registrarNuevoCarrito();
      setHasRecordedCart(true);
    }
  };

  const addToCart = (product: Product) => {
    trackCartCreation();
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const closePaymentStatus = () => {
    setPaymentStatus(null);
    window.history.replaceState({}, "", window.location.origin + window.location.pathname);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);
      const emailToSave = clientEmail.trim() || "cliente_web@sudestada.com";

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.product.id,
            size: item.product.size,
            title: `Sudestada Gin ${item.product.size}`,
            price: item.product.price,
            quantity: item.quantity,
          })),
          email: emailToSave,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.init_point) {
        throw new Error(data.error || "No se pudo iniciar el pago.");
      }

      try {
        for (const item of cart) {
          await registrarVenta(
            item.product.size,
            item.quantity,
            item.product.price * item.quantity,
            emailToSave
          );
        }
      } catch (dbError) {
        console.warn("Aviso al registrar la venta:", dbError);
      }

      setIsCartOpen(false);
      window.location.href = data.init_point;
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo iniciar el pago.");
      setIsProcessingPayment(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    try {
      setIsSubscribing(true);
      await suscribirNewsletter(newsletterEmail);
      alert("¡Gracias por suscribirte al newsletter de Sudestada!");
      setNewsletterEmail("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ocurrió un error al suscribirte.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const nextSlide = () => setCurrentSlide((current) => (current + 1) % MOMENTS.length);
  const previousSlide = () => setCurrentSlide((current) => (current - 1 + MOMENTS.length) % MOMENTS.length);

  const navLinks = [
    ["Colección", "#productos"],
    ["Historia", "#historia"],
    ["Botánicos", "#botanicos"],
    ["Tragos", "#tragos"],
    ["FAQ", "#faq"],
    ["Newsletter", "#newsletter"],
  ];

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#F4EFE3] text-[#102C3A] selection:bg-[#b7a16f] selection:text-[#102C3A]"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <motion.div
        style={{ width: progressWidth }}
        className="fixed left-0 top-0 z-[100] h-[3px] bg-[#9f8b5d]"
      />

      {/* BANNER CARRUSEL SUPERIOR DE ANUNCIOS */}
      <div className="bg-[#102C3A] text-[#F4EFE3] text-[10px] font-medium uppercase tracking-[.25em] py-2.5 px-4 text-center overflow-hidden border-b border-white/10 relative z-50">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentAnnouncement}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center gap-2"
          >
            {ANNOUNCEMENTS[currentAnnouncement]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* MODAL EDAD */}
      <AnimatePresence>
        {!isAgeVerified && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-[#102C3A]/95 p-5 text-center text-[#F4EFE3]"
          >
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md border border-[#b7a16f]/50 px-8 py-12"
            >
              <Anchor className="mx-auto mb-5 h-8 w-8 text-[#b7a16f]" />
              <p className="mb-3 text-[10px] uppercase tracking-[.35em] text-[#b7a16f]">
                Buenos Aires · Argentina
              </p>
              <h2 className="font-serif text-4xl tracking-[.12em]">SUDESTADA</h2>
              <p className="mb-8 mt-2 text-xs uppercase tracking-[.35em]">Gin rioplatense</p>
              <p className="mb-8 text-sm leading-7 text-white/70">
                Una historia de amigos, río y buenos momentos.
                Para ingresar, confirmá que sos mayor de 18 años.
              </p>
              <button
                onClick={() => setIsAgeVerified(true)}
                className="w-full bg-[#F4EFE3] px-5 py-4 text-xs font-semibold uppercase tracking-[.2em] text-[#102C3A] transition hover:bg-white"
              >
                Soy mayor de 18 años <ArrowRight className="ml-2 inline h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL CARRITO */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-[80] bg-[#102C3A]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-[85] flex w-full max-w-md flex-col bg-[#F4EFE3] p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-center justify-between border-b border-[#102C3A]/15 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  <h3 className="font-serif text-2xl">Tu Pedido ({totalCartItems})</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-[#102C3A]/70 hover:text-[#102C3A]"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="my-6 flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="mx-auto h-12 w-12 text-[#102C3A]/30 mb-3" />
                    <p className="text-xs uppercase tracking-wider text-[#102C3A]/60">
                      Tu carrito está vacío.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between border border-[#102C3A]/15 bg-white p-4 shadow-sm"
                      >
                        <div className="flex-1 pr-3">
                          <p className="font-serif text-base">{item.product.size}</p>
                          <p className="text-[10px] text-[#102C3A]/60">{item.product.label}</p>
                          <p className="font-serif text-xs mt-1">{money(item.product.price)} c/u</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="flex h-7 w-7 items-center justify-center border border-[#102C3A]/20 hover:bg-[#102C3A] hover:text-white transition"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-serif text-sm w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="flex h-7 w-7 items-center justify-center border border-[#102C3A]/20 hover:bg-[#102C3A] hover:text-white transition"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-2 text-red-700 hover:text-red-900 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cart.length > 0 && (
                  <div className="mt-6 border-t border-[#102C3A]/15 pt-4">
                    <label className="mb-2 block text-[10px] uppercase tracking-[.2em] text-[#8d774b]">
                      Tu Email (para el recibo)
                    </label>
                    <input
                      type="email"
                      placeholder="ejemplo@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full border border-[#102C3A]/20 bg-white px-4 py-3 text-xs outline-none focus:border-[#102C3A]"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-[#102C3A]/15 pt-4">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[.15em]">Total:</span>
                  <span className="font-serif text-3xl">{money(totalCartPrice)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isProcessingPayment}
                  className="w-full bg-[#102C3A] py-4 text-center text-xs uppercase tracking-[.2em] text-white transition hover:bg-[#214858] disabled:opacity-50"
                >
                  {isProcessingPayment ? "Procesando..." : "Ir a pagar con Mercado Pago"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ESTADO DE PAGO */}
      <AnimatePresence>
        {paymentStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-[#102C3A]/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full max-w-md bg-[#F4EFE3] p-8 text-center sm:p-10"
            >
              <button onClick={closePaymentStatus} className="absolute right-4 top-4 p-2">
                <X className="h-5 w-5" />
              </button>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#b7a16f]">
                {paymentStatus === "success" ? (
                  <Check className="h-6 w-6" />
                ) : paymentStatus === "pending" ? (
                  <Compass className="h-6 w-6" />
                ) : (
                  <X className="h-6 w-6" />
                )}
              </div>
              <h2 className="mt-3 font-serif text-3xl">
                {paymentStatus === "success"
                  ? "Gracias por elegirnos"
                  : paymentStatus === "pending"
                    ? "Pago pendiente"
                    : "El pago no se completó"}
              </h2>
              <button
                onClick={closePaymentStatus}
                className="mt-7 w-full bg-[#102C3A] px-5 py-4 text-xs uppercase tracking-[.2em] text-white"
              >
                Continuar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAV */}
      <nav className="relative z-40 border-b border-white/30 text-[#102C3A]">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-10">
          <a href="#inicio" className="leading-none">
            <span className="block font-serif text-xl tracking-[.16em]">SUDESTADA</span>
            <span className="mt-1 block text-center text-[9px] tracking-[.45em]">GIN</span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-[10px] uppercase tracking-[.17em] transition hover:text-[#9b8050]"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                trackCartCreation();
                setIsCartOpen(true);
              }}
              className="relative flex items-center gap-2 border border-[#102C3A]/25 px-4 py-2.5 text-[10px] uppercase tracking-[.15em] transition hover:bg-[#102C3A] hover:text-white"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Carrito</span>
              {totalCartItems > 0 && (
                <span className="ml-1 bg-[#9b8050] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {totalCartItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenu((v) => !v)}
              className="p-2 md:hidden"
            >
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="inicio" className="relative flex min-h-[760px] items-center overflow-hidden bg-[#c4b59b] sm:min-h-[850px]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2200&q=90"
            alt="Agua y horizonte al atardecer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f4efe3]/90 via-[#f4efe3]/55 to-[#102c3a]/10" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-4 px-6 pb-24 pt-14 sm:px-12 md:grid-cols-[1fr_.8fr] md:px-16">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="max-w-xl"
          >
            <p className="mb-6 text-[10px] uppercase tracking-[.38em]">
              Gin rioplatense · Buenos Aires
            </p>
            <h1 className="font-serif text-6xl leading-[.92] tracking-[-.045em] sm:text-8xl lg:text-[110px]">
              El espíritu
              <br />
              del <span className="italic">sur.</span>
            </h1>
            <div className="my-7 h-px w-20 bg-[#9b8050]" />
            <p className="max-w-sm text-sm leading-7 text-[#102C3A]/80 sm:text-base">
              Cuatro amigos, una misma ciudad y una debilidad por el río.
              Sudestada nace de Buenos Aires, de sus sobremesas y de las ganas
              de hacer algo propio.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <button
                onClick={() => addToCart(PRODUCTS[1])}
                className="group inline-flex items-center gap-4 bg-[#102C3A] px-6 py-4 text-[10px] uppercase tracking-[.2em] text-[#F4EFE3] transition hover:bg-[#244858]"
              >
                Comprá la tuya (750ml)
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>

          <motion.div
            style={{ y: heroBottleY, rotate: heroBottleRotate }}
            className="relative mx-auto flex h-[520px] w-full max-w-[420px] items-center justify-center sm:h-[700px]"
          >
            <div className="relative z-10 flex h-[480px] w-auto items-center justify-center sm:h-[620px]">
              <Bottle />
            </div>
          </motion.div>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section id="productos" className="relative overflow-hidden bg-[#F4EFE3] px-6 py-20 sm:px-12 sm:py-28">
        <div className="relative mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[.7fr_1.8fr] lg:gap-16">
          <Reveal className="flex flex-col justify-center">
            <Anchor className="mb-6 h-7 w-7 text-[#9b8050]" strokeWidth={1.2} />
            <p className="text-[10px] uppercase tracking-[.3em] text-[#8d774b]">La colección</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
              Una misma esencia.
              <br />
              <span className="italic">Tres maneras.</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-4">
            {PRODUCTS.map((product, index) => (
              <Reveal key={product.size} delay={index * 0.12}>
                <div className="group relative flex h-full w-full flex-col items-center border border-[#102C3A]/10 bg-white/25 px-4 pb-6 pt-7 text-center transition duration-500 hover:-translate-y-2 hover:bg-white/70">
                  <div className="flex h-[245px] items-end justify-center transition-transform duration-500 group-hover:scale-[1.04]">
                    <Bottle small />
                  </div>
                  <span className="mt-4 font-serif text-2xl">{product.size}</span>
                  <span className="mt-2 text-[9px] uppercase tracking-[.14em] text-[#102C3A]/60">{product.label}</span>
                  <span className="mt-4 font-serif text-xl">{money(product.price)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="mt-5 inline-flex items-center gap-2 border-b border-[#102C3A] pb-1 text-[9px] uppercase tracking-[.18em] hover:text-[#9b8050] transition"
                  >
                    Agregar al carrito <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HISTORIA */}
      <section id="historia" className="bg-[#EBE3D3] px-6 py-20 sm:px-12 sm:py-28 border-y border-[#102C3A]/10">
        <div className="mx-auto max-w-[1280px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[.3em] text-[#8d774b]">Nuestra Historia</p>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl leading-tight">
              Nacido de las charlas mirando al agua.
            </h2>
            <div className="my-6 h-px w-16 bg-[#9b8050]" />
            <p className="text-sm leading-7 text-[#102C3A]/80 mb-4">
              Sudestada empezó como una búsqueda personal entre cuatro amigos apasionados por la destilación artesanal. Queríamos capturar el frescor del viento del sudeste y las tardes compartidas en las orillas del Río de la Plata.
            </p>
            <p className="text-sm leading-7 text-[#102C3A]/80">
              Cada lote es elaborado en alambiques de cobre en partidas limitadas, combinando la tradición botánica clásica con notas autóctonas rioplatenses.
            </p>
          </Reveal>
          <Reveal delay={0.2} className="relative h-[400px] overflow-hidden rounded-sm shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80"
              alt="Destilería artesanal"
              className="h-full w-full object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* BOTÁNICOS */}
      <section id="botanicos" className="px-6 py-20 sm:px-12 sm:py-28 bg-[#F4EFE3]">
        <div className="mx-auto max-w-[1280px]">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <Leaf className="mx-auto h-8 w-8 text-[#9b8050] mb-3" />
            <p className="text-[10px] uppercase tracking-[.3em] text-[#8d774b]">Ingredientes Seleccionados</p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Botánica & Alquimia</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {BOTANICALS.map((bot, index) => (
              <Reveal key={bot.name} delay={index * 0.1}>
                <div className="bg-white/40 border border-[#102C3A]/10 p-6 text-center hover:border-[#9b8050] transition duration-300">
                  <Sparkles className="mx-auto h-5 w-5 text-[#9b8050] mb-3" />
                  <h3 className="font-serif text-lg mb-2">{bot.name}</h3>
                  <p className="text-xs text-[#102C3A]/70">{bot.role}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TRAGOS */}
      <section id="tragos" className="bg-[#102C3A] text-[#F4EFE3] px-6 py-20 sm:px-12 sm:py-28">
        <div className="mx-auto max-w-[1280px]">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <GlassWater className="mx-auto h-8 w-8 text-[#c8b17b] mb-3" />
            <p className="text-[10px] uppercase tracking-[.3em] text-[#c8b17b]">Coctelería en Casa</p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Recetario & Ritual</h2>
          </Reveal>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {COCKTAILS.map((cocktail) => (
              <button
                key={cocktail.id}
                onClick={() => setActiveCocktail(cocktail)}
                className={`px-6 py-3 text-xs uppercase tracking-widest border transition ${
                  activeCocktail.id === cocktail.id
                    ? "bg-[#c8b17b] text-[#102C3A] border-[#c8b17b] font-bold"
                    : "border-white/20 text-white/70 hover:border-white/60"
                }`}
              >
                {cocktail.title}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCocktail.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white/5 border border-white/10 p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-4xl mx-auto"
            >
              <div>
                <span className="text-[10px] uppercase tracking-[.25em] text-[#c8b17b]">
                  {activeCocktail.glass}
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl mt-1 mb-6">{activeCocktail.title}</h3>
                <h4 className="text-xs uppercase tracking-wider text-[#c8b17b] mb-3 font-semibold">
                  Ingredientes:
                </h4>
                <ul className="space-y-2 text-xs text-white/80 mb-8">
                  {activeCocktail.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Droplets className="h-3 w-3 text-[#c8b17b]" /> {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t lg:border-t-0 lg:border-l border-white/10 pt-8 lg:pt-0 lg:pl-12">
                <h4 className="text-xs uppercase tracking-wider text-[#c8b17b] mb-4 font-semibold">
                  Paso a paso:
                </h4>
                <ol className="space-y-4">
                  {activeCocktail.steps.map((step, index) => (
                    <li key={index} className="flex gap-4 text-xs text-white/80">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#c8b17b] text-[10px] font-mono text-[#c8b17b]">
                        {index + 1}
                      </span>
                      <p className="leading-5">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* MOMENTOS */}
      <section id="momentos" className="px-6 py-20 sm:px-12 sm:py-28 bg-[#F4EFE3]">
        <div className="mx-auto max-w-[1280px]">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[10px] uppercase tracking-[.3em] text-[#8d774b]">Estilo de Vida</p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Momentos Sudestada</h2>
          </Reveal>

          <div className="relative max-w-4xl mx-auto overflow-hidden shadow-2xl">
            <div className="relative h-[480px] w-full">
              <img
                src={MOMENTS[currentSlide].image}
                alt={MOMENTS[currentSlide].title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102C3A]/90 via-[#102C3A]/30 to-transparent flex flex-col justify-end p-8 sm:p-12 text-white">
                <span className="text-[10px] uppercase tracking-[.3em] text-[#c8b17b] mb-2">
                  {MOMENTS[currentSlide].subtitle}
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl mb-3">{MOMENTS[currentSlide].title}</h3>
                <p className="text-sm text-white/80 max-w-lg">{MOMENTS[currentSlide].description}</p>
              </div>
            </div>

            <button
              onClick={previousSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#102C3A]/60 text-white p-3 hover:bg-[#102C3A] transition"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#102C3A]/60 text-white p-3 hover:bg-[#102C3A] transition"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ (PREGUNTAS FRECUENTES) */}
      <section id="faq" className="px-6 py-20 sm:px-12 sm:py-28 bg-[#EBE3D3] border-t border-[#102C3A]/10">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center mb-16">
            <HelpCircle className="mx-auto h-8 w-8 text-[#8d774b] mb-3" />
            <p className="text-[10px] uppercase tracking-[.3em] text-[#8d774b]">Respuesta Inmediata</p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Preguntas Frecuentes</h2>
          </Reveal>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white/60 border border-[#102C3A]/15 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-serif text-lg text-[#102C3A]">{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-[#8d774b] transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 pt-0 text-xs text-[#102C3A]/80 leading-6 border-t border-[#102C3A]/5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section id="newsletter" className="bg-[#F4EFE3] border-t border-[#102C3A]/10 px-6 py-20 sm:px-12 sm:py-24 text-center">
        <div className="mx-auto max-w-xl">
          <Reveal>
            <Mail className="mx-auto h-8 w-8 text-[#8d774b] mb-4" />
            <p className="text-[10px] uppercase tracking-[.3em] text-[#8d774b]">Novedades & Ediciones Limitadas</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl mb-4">Sumate al Club Sudestada</h2>
            <p className="text-xs text-[#102C3A]/70 leading-6 mb-8">
              Recibí lanzamientos exclusivos, invitaciones a catas privadas y recetas de coctelería antes que nadie.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="Ingresá tu correo electrónico"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 bg-white border border-[#102C3A]/20 px-4 py-3 text-xs outline-none focus:border-[#102C3A]"
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="bg-[#102C3A] text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-[#214858] transition disabled:opacity-50"
              >
                {isSubscribing ? "Guardando..." : "Suscribirse"}
              </button>
            </form>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#102C3A] text-[#F4EFE3] px-6 py-12 text-center text-xs border-t border-white/10">
        <div className="mx-auto max-w-[1280px] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <span className="block font-serif text-lg tracking-[.16em]">SUDESTADA GIN</span>
            <span className="text-[9px] text-white/50 tracking-[.2em]">BUENOS AIRES · ARGENTINA</span>
          </div>

          <div className="flex gap-6 text-[10px] uppercase tracking-widest text-white/70">
            <Link href="/admin" className="hover:text-[#c8b17b] transition">Panel Admin</Link>
          </div>

          <p className="text-[10px] text-white/40">
            Beber con moderación. Prohibida su venta a menores de 18 años.
          </p>
        </div>
      </footer>

      {/* BOTÓN WHATSAPP */}
      <a
        href="https://wa.me/5491112345678?text=Hola!%20Quiero%20hacer%20una%20consulta%20sobre%20Sudestada%20Gin"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition hover:scale-110"
        aria-label="Contacto por WhatsApp"
      >
        <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.892 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.002 3.66 3.745-.983z"/>
        </svg>
      </a>
    </main>
  );
}