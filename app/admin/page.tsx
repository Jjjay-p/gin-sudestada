"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  ShoppingBag,
  Mail,
  RefreshCw,
  CheckCircle,
  Clock,
  LogOut,
  Lock,
  ShoppingCart,
  Boxes,
  Plus,
  Minus,
  Save,
  AlertCircle,
  Check,
  Truck,
  MapPin,
  PackageCheck,
  X,
  Send,
} from "lucide-react";

type EstadoEnvio = "pendiente" | "preparando" | "enviado" | "entregado";

interface Venta {
  id: number;
  cliente_email: string;
  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  tipo_entrega?: "envio" | "retiro" | null;
  direccion?: string | null;
  ciudad?: string | null;
  codigo_postal?: string | null;
  estado_envio?: EstadoEnvio | null;
  tracking_code?: string | null;
  tracking_url?: string | null;
  total: number;
  estado_pago: string;
  created_at: string;
}

interface Suscriptor {
  id: number;
  email: string;
  created_at: string;
}

interface ProductoStock {
  id: string;
  size: string;
  label: string;
  stock: number;
}

const money = (val: number) =>
  "$" + Number(val || 0).toLocaleString("es-AR", { minimumFractionDigits: 0 });

const ENVIO_BADGES: Record<EstadoEnvio, { label: string; classes: string }> = {
  pendiente: {
    label: "Pendiente",
    classes: "bg-amber-100 text-amber-800 border-amber-300",
  },
  preparando: {
    label: "Preparando",
    classes: "bg-sky-100 text-sky-800 border-sky-300",
  },
  enviado: {
    label: "Enviado / Listo",
    classes: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  entregado: {
    label: "Entregado",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
};

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [newsletter, setNewsletter] = useState<Suscriptor[]>([]);
  const [productosStock, setProductosStock] = useState<ProductoStock[]>([]);
  const [totalCarritos, setTotalCarritos] = useState<number>(0);
  const [dataLoading, setDataLoading] = useState(false);

  const [savingStockId, setSavingStockId] = useState<string | null>(null);
  const [savedStockSuccessId, setSavedStockSuccessId] = useState<string | null>(null);
  const [updatingVentaId, setUpdatingVentaId] = useState<number | null>(null);

  const [tab, setTab] = useState<"ventas" | "newsletter" | "stock">("ventas");
  const [filtroEnvio, setFiltroEnvio] = useState<"todos" | EstadoEnvio>("todos");

  // Modal de gestión logística
  const [ventaEnvioModal, setVentaEnvioModal] = useState<Venta | null>(null);
  const [formEstadoEnvio, setFormEstadoEnvio] = useState<EstadoEnvio>("enviado");
  const [formTrackingCode, setFormTrackingCode] = useState("");
  const [formTrackingUrl, setFormTrackingUrl] = useState("");
  const [notificarPorMail, setNotificarPorMail] = useState(true);
  const [guardandoEnvio, setGuardandoEnvio] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      cargarDatos();
    }
  }, [session]);

  const cargarDatos = async () => {
    setDataLoading(true);
    try {
      const { data: ventasData, error: ventasErr } = await supabase
        .from("ventas")
        .select("*")
        .order("created_at", { ascending: false });

      if (ventasErr) console.error("Error al cargar ventas:", ventasErr.message);

      const { data: newsletterData, error: newsErr } = await supabase
        .from("newsletter")
        .select("*")
        .order("created_at", { ascending: false });

      if (newsErr) console.error("Error al cargar newsletter:", newsErr.message);

      const { data: stockData, error: stockErr } = await supabase
        .from("stock_productos")
        .select("*")
        .order("id", { ascending: true });

      if (stockErr) console.error("Error al cargar stock:", stockErr.message);

      const { count, error: cartErr } = await supabase
        .from("carritos_creados")
        .select("*", { count: "exact", head: true });

      if (cartErr) console.error("Error al contar carritos:", cartErr.message);

      if (ventasData) setVentas(ventasData);
      if (newsletterData) setNewsletter(newsletterData);
      if (stockData) setProductosStock(stockData);
      if (count !== null) setTotalCarritos(count);
    } catch (err) {
      console.error("Error general cargando datos:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError("Credenciales inválidas. Verifica tu correo y contraseña.");
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const cambiarEstadoVenta = async (id: number, estadoActual: string) => {
    const nuevoEstado =
      estadoActual === "approved" || estadoActual === "completado"
        ? "pending"
        : "approved";

    setUpdatingVentaId(id);

    const { error } = await supabase
      .from("ventas")
      .update({ estado_pago: nuevoEstado })
      .eq("id", id);

    if (!error) {
      setVentas((prev) =>
        prev.map((v) => (v.id === id ? { ...v, estado_pago: nuevoEstado } : v))
      );
    } else {
      alert("Error al actualizar el estado de la venta: " + error.message);
    }
    setUpdatingVentaId(null);
  };

  const abrirModalEnvio = (venta: Venta) => {
    setVentaEnvioModal(venta);
    setFormEstadoEnvio(
      venta.estado_envio && venta.estado_envio !== "pendiente"
        ? venta.estado_envio
        : "enviado"
    );
    setFormTrackingCode(venta.tracking_code || "");
    setFormTrackingUrl(venta.tracking_url || "");
    setNotificarPorMail(true);
  };

  const guardarLogisticaVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ventaEnvioModal) return;

    setGuardandoEnvio(true);
    try {
      const { error } = await supabase
        .from("ventas")
        .update({
          estado_envio: formEstadoEnvio,
          tracking_code: formTrackingCode.trim() || null,
          tracking_url: formTrackingUrl.trim() || null,
        })
        .eq("id", ventaEnvioModal.id);

      if (error) throw new Error(error.message);

      if (notificarPorMail && formEstadoEnvio === "enviado") {
        const res = await fetch("/api/send-tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: ventaEnvioModal.cliente_email,
            cliente_nombre: ventaEnvioModal.cliente_nombre,
            venta_id: ventaEnvioModal.id,
            tracking_code: formTrackingCode.trim(),
            tracking_url: formTrackingUrl.trim(),
            tipo_entrega: ventaEnvioModal.tipo_entrega || "envio",
          }),
        });

        if (!res.ok) {
          console.warn("El estado se guardó, pero falló el envío del correo.");
        }
      }

      setVentas((prev) =>
        prev.map((v) =>
          v.id === ventaEnvioModal.id
            ? {
                ...v,
                estado_envio: formEstadoEnvio,
                tracking_code: formTrackingCode.trim() || null,
                tracking_url: formTrackingUrl.trim() || null,
              }
            : v
        )
      );

      setVentaEnvioModal(null);
    } catch (err: any) {
      alert("Error guardando datos de envío: " + err.message);
    } finally {
      setGuardandoEnvio(false);
    }
  };

  const modificarStockLocal = (id: string, delta: number) => {
    setProductosStock((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      )
    );
  };

  const guardarStock = async (id: string, nuevoStock: number) => {
    setSavingStockId(id);
    const { error } = await supabase
      .from("stock_productos")
      .update({ stock: nuevoStock, updated_at: new Date().toISOString() })
      .eq("id", id);

    setSavingStockId(null);

    if (error) {
      alert("Error guardando el stock: " + error.message);
    } else {
      setSavedStockSuccessId(id);
      setTimeout(() => setSavedStockSuccessId(null), 2500);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4EFE3] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-[#102C3A]" />
        <p className="text-xs uppercase tracking-[.2em] text-[#102C3A]">
          Cargando sesión...
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F4EFE3] text-[#102C3A] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/90 border border-[#102C3A]/20 p-8 shadow-xl">
          <div className="flex justify-center mb-4 text-[#102C3A]">
            <Lock className="h-8 w-8 text-[#8d774b]" />
          </div>
          <p className="text-center text-[10px] uppercase tracking-[.3em] text-[#8d774b] mb-1">
            Sudestada Gin
          </p>
          <h1 className="font-serif text-2xl text-center mb-6">
            Acceso Administrador
          </h1>

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 mb-4 rounded flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#102C3A]/70 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sudestada.com"
                className="w-full border border-[#102C3A]/20 bg-white p-3 text-xs outline-none focus:border-[#102C3A]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#102C3A]/70 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#102C3A]/20 bg-white p-3 text-xs outline-none focus:border-[#102C3A]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="mt-2 w-full bg-[#102C3A] text-white py-3.5 text-xs uppercase tracking-[.2em] hover:bg-[#214858] transition disabled:opacity-50 font-medium"
            >
              {isLoggingIn ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const ventasFiltradas =
    filtroEnvio === "todos"
      ? ventas
      : ventas.filter((v) => (v.estado_envio || "pendiente") === filtroEnvio);

  const pendientesDespacho = ventas.filter(
    (v) =>
      (v.estado_pago === "approved" || v.estado_pago === "completado") &&
      (v.estado_envio || "pendiente") === "pendiente"
  ).length;

  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#102C3A] p-6 sm:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#102C3A]/20 pb-6 mb-8 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[.3em] text-[#8d774b]">
              Sudestada Gin · Panel Control
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl mt-1">
              Gestor de Tienda & Logística
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={cargarDatos}
              disabled={dataLoading}
              className="flex items-center gap-2 border border-[#102C3A]/30 bg-white/50 px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-[#102C3A] hover:text-[#F4EFE3] transition"
            >
              <RefreshCw
                className={`h-4 w-4 ${dataLoading ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-900 text-white px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-red-800 transition"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/80 border border-[#102C3A]/15 p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#8d774b] mb-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold">
                Carritos Iniciados
              </span>
              <ShoppingCart className="h-4 w-4" />
            </div>
            <p className="font-serif text-3xl text-[#102C3A]">
              {totalCarritos}
            </p>
          </div>

          <div className="bg-white/80 border border-[#102C3A]/15 p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#8d774b] mb-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold">
                Ventas Totales
              </span>
              <ShoppingBag className="h-4 w-4" />
            </div>
            <p className="font-serif text-3xl text-[#102C3A]">
              {ventas.length}
            </p>
          </div>

          <div className="bg-white/80 border border-[#102C3A]/15 p-5 shadow-sm">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold">
                Por Despachar
              </span>
              <Truck className="h-4 w-4" />
            </div>
            <p className="font-serif text-3xl text-[#102C3A]">
              {pendientesDespacho}
            </p>
          </div>

          <div className="bg-white/80 border border-[#102C3A]/15 p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#8d774b] mb-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold">
                Stock Botellas
              </span>
              <Boxes className="h-4 w-4" />
            </div>
            <p className="font-serif text-3xl text-[#102C3A]">
              {productosStock.reduce((acc, p) => acc + (p.stock || 0), 0)}
            </p>
          </div>

          <div className="bg-white/80 border border-[#102C3A]/15 p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#8d774b] mb-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold">
                Newsletter
              </span>
              <Mail className="h-4 w-4" />
            </div>
            <p className="font-serif text-3xl text-[#102C3A]">
              {newsletter.length}
            </p>
          </div>
        </div>

        {/* PESTAÑAS */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setTab("ventas")}
            className={`flex items-center gap-2 border px-6 py-3 text-xs uppercase tracking-widest font-medium transition ${
              tab === "ventas"
                ? "bg-[#102C3A] text-[#F4EFE3] border-[#102C3A]"
                : "border-[#102C3A]/20 bg-white/40 hover:bg-white"
            }`}
          >
            <ShoppingBag className="h-4 w-4" /> Ventas & Envíos ({ventas.length})
          </button>
          <button
            onClick={() => setTab("stock")}
            className={`flex items-center gap-2 border px-6 py-3 text-xs uppercase tracking-widest font-medium transition ${
              tab === "stock"
                ? "bg-[#102C3A] text-[#F4EFE3] border-[#102C3A]"
                : "border-[#102C3A]/20 bg-white/40 hover:bg-white"
            }`}
          >
            <Boxes className="h-4 w-4" /> Stock de Productos
          </button>
          <button
            onClick={() => setTab("newsletter")}
            className={`flex items-center gap-2 border px-6 py-3 text-xs uppercase tracking-widest font-medium transition ${
              tab === "newsletter"
                ? "bg-[#102C3A] text-[#F4EFE3] border-[#102C3A]"
                : "border-[#102C3A]/20 bg-white/40 hover:bg-white"
            }`}
          >
            <Mail className="h-4 w-4" /> Newsletter ({newsletter.length})
          </button>
        </div>

        {/* TAB STOCK */}
        {tab === "stock" && (
          <div className="bg-white/80 border border-[#102C3A]/15 shadow-sm p-6">
            <h2 className="font-serif text-xl mb-4">Gestión de Inventario</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {productosStock.map((prod) => {
                const stockBajo = prod.stock < 5;
                return (
                  <div
                    key={prod.id}
                    className={`bg-white border p-5 flex flex-col justify-between shadow-sm relative ${
                      stockBajo ? "border-red-400" : "border-[#102C3A]/15"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-[#8d774b]">
                          Presentación
                        </span>
                        {stockBajo && (
                          <span className="text-[9px] uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 font-semibold">
                            Stock bajo
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-2xl mt-1">{prod.size}</h3>
                      <p className="text-xs text-[#102C3A]/60 mb-4">
                        {prod.label || `Sudestada Gin ${prod.size}`}
                      </p>
                    </div>

                    <div className="border-t border-[#102C3A]/10 pt-4">
                      <p className="text-[10px] uppercase tracking-wider text-[#102C3A]/70 mb-2">
                        Unidades Disponibles
                      </p>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => modificarStockLocal(prod.id, -5)}
                            className="px-2 py-1 border border-[#102C3A]/30 text-xs font-mono hover:bg-[#102C3A] hover:text-white transition"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => modificarStockLocal(prod.id, -1)}
                            className="p-1.5 border border-[#102C3A]/30 text-xs hover:bg-[#102C3A] hover:text-white transition"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        </div>

                        <span
                          className={`font-serif text-2xl px-2 ${
                            stockBajo ? "text-red-700 font-bold" : ""
                          }`}
                        >
                          {prod.stock}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => modificarStockLocal(prod.id, 1)}
                            className="p-1.5 border border-[#102C3A]/30 text-xs hover:bg-[#102C3A] hover:text-white transition"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => modificarStockLocal(prod.id, 5)}
                            className="px-2 py-1 border border-[#102C3A]/30 text-xs font-mono hover:bg-[#102C3A] hover:text-white transition"
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => guardarStock(prod.id, prod.stock)}
                        disabled={savingStockId === prod.id}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs uppercase tracking-wider text-white transition disabled:opacity-50 ${
                          savedStockSuccessId === prod.id
                            ? "bg-emerald-700"
                            : "bg-[#102C3A] hover:bg-[#214858]"
                        }`}
                      >
                        {savedStockSuccessId === prod.id ? (
                          <>
                            <Check className="h-4 w-4" /> Guardado
                          </>
                        ) : savingStockId === prod.id ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" /> Guardar Stock
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB VENTAS & ENVÍOS */}
        {tab === "ventas" && (
          <div className="bg-white/80 border border-[#102C3A]/15 shadow-sm overflow-hidden">
            {/* FILTROS LOGÍSTICOS */}
            <div className="flex flex-wrap items-center gap-2 p-4 bg-white/60 border-b border-[#102C3A]/10">
              <span className="text-[10px] uppercase tracking-widest text-[#8d774b] mr-2">
                Filtrar envío:
              </span>
              {(
                [
                  { id: "todos", label: "Todos" },
                  { id: "pendiente", label: "Pendientes" },
                  { id: "preparando", label: "Preparando" },
                  { id: "enviado", label: "Enviados" },
                  { id: "entregado", label: "Entregados" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroEnvio(f.id)}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border transition ${
                    filtroEnvio === f.id
                      ? "bg-[#102C3A] text-white border-[#102C3A]"
                      : "bg-white text-[#102C3A] border-[#102C3A]/20 hover:bg-[#F4EFE3]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#102C3A] text-[#F4EFE3] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Entrega / Dirección</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Pago</th>
                    <th className="p-4">Logística</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#102C3A]/10">
                  {ventasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#102C3A]/60">
                        {dataLoading
                          ? "Cargando ventas..."
                          : "No hay ventas en esta categoría."}
                      </td>
                    </tr>
                  ) : (
                    ventasFiltradas.map((v) => {
                      const isApproved =
                        v.estado_pago === "approved" ||
                        v.estado_pago === "completado";
                      const estadoEnvio = (v.estado_envio || "pendiente") as EstadoEnvio;
                      const badgeEnvio = ENVIO_BADGES[estadoEnvio] || ENVIO_BADGES.pendiente;

                      return (
                        <tr key={v.id} className="hover:bg-white transition align-top">
                          <td className="p-4 font-mono font-medium">
                            <div>#{v.id}</div>
                            <div className="text-[10px] text-[#102C3A]/50 mt-1">
                              {new Date(v.created_at).toLocaleDateString("es-AR")}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-semibold">
                              {v.cliente_nombre || "Sin nombre"}
                            </div>
                            <div className="text-[#102C3A]/75">{v.cliente_email}</div>
                            {v.cliente_telefono && (
                              <div className="text-[11px] text-[#8d774b] mt-0.5">
                                Tel: {v.cliente_telefono}
                              </div>
                            )}
                          </td>

                          <td className="p-4 max-w-[230px]">
                            {v.tipo_entrega === "retiro" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[#102C3A] bg-[#EBE3D3] px-2 py-0.5">
                                <PackageCheck className="h-3 w-3 text-[#8d774b]" />
                                Retiro en punto
                              </span>
                            ) : v.direccion ? (
                              <div className="space-y-0.5">
                                <div className="flex items-start gap-1 font-medium">
                                  <MapPin className="h-3.5 w-3.5 text-[#8d774b] shrink-0 mt-0.5" />
                                  <span>{v.direccion}</span>
                                </div>
                                <div className="text-[11px] text-[#102C3A]/65 pl-4">
                                  {[v.ciudad, v.codigo_postal ? `CP ${v.codigo_postal}` : ""]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#102C3A]/45 italic">
                                Sin dirección cargada
                              </span>
                            )}
                          </td>

                          <td className="p-4 font-serif text-sm font-semibold">
                            {money(v.total)}
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-sm ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {isApproved ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {v.estado_pago}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold border rounded-sm ${badgeEnvio.classes}`}
                            >
                              <Truck className="h-3 w-3" />
                              {badgeEnvio.label}
                            </span>
                            {v.tracking_code && (
                              <div className="mt-1.5 font-mono text-[11px] text-[#102C3A]/80">
                                Track: {v.tracking_code}
                              </div>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                              <button
                                onClick={() => abrirModalEnvio(v)}
                                className="inline-flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider bg-[#102C3A] text-white px-3 py-1.5 hover:bg-[#214858] transition"
                              >
                                <Truck className="h-3 w-3 text-[#c8b17b]" />
                                Envío
                              </button>
                              <button
                                onClick={() => cambiarEstadoVenta(v.id, v.estado_pago)}
                                disabled={updatingVentaId === v.id}
                                className="text-[10px] uppercase tracking-wider border border-[#102C3A]/30 px-2.5 py-1.5 bg-white hover:bg-[#102C3A] hover:text-white transition disabled:opacity-50"
                              >
                                {updatingVentaId === v.id ? "..." : "Pago"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB NEWSLETTER */}
        {tab === "newsletter" && (
          <div className="bg-white/80 border border-[#102C3A]/15 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#102C3A] text-[#F4EFE3] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Email del Suscriptor</th>
                    <th className="p-4">Fecha de Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#102C3A]/10">
                  {newsletter.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-[#102C3A]/60">
                        {dataLoading
                          ? "Cargando suscriptores..."
                          : "No hay suscriptores aún."}
                      </td>
                    </tr>
                  ) : (
                    newsletter.map((n) => (
                      <tr key={n.id} className="hover:bg-white transition">
                        <td className="p-4 font-mono font-medium">#{n.id}</td>
                        <td className="p-4 font-medium">{n.email}</td>
                        <td className="p-4 text-[#102C3A]/60">
                          {new Date(n.created_at).toLocaleString("es-AR")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL GESTIÓN LOGÍSTICA DE PEDIDO */}
      {ventaEnvioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102C3A]/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#F4EFE3] border border-[#102C3A]/20 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setVentaEnvioModal(null)}
              className="absolute right-4 top-4 p-1 text-[#102C3A]/70 hover:text-[#102C3A]"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="text-[10px] uppercase tracking-[.25em] text-[#8d774b]">
              Pedido #{ventaEnvioModal.id}
            </span>
            <h3 className="font-serif text-2xl mt-1 mb-4">
              Gestionar Logística
            </h3>

            <div className="bg-white/80 border border-[#102C3A]/10 p-3.5 text-xs mb-5 space-y-1">
              <p className="font-semibold">
                {ventaEnvioModal.cliente_nombre || ventaEnvioModal.cliente_email}
              </p>
              {ventaEnvioModal.tipo_entrega === "retiro" ? (
                <p className="text-[#8d774b] font-medium">
                  Modalidad: Retiro en punto de entrega
                </p>
              ) : (
                <p className="text-[#102C3A]/75">
                  {ventaEnvioModal.direccion || "Sin dirección"} ·{" "}
                  {ventaEnvioModal.ciudad || ""}{" "}
                  {ventaEnvioModal.codigo_postal
                    ? `(CP ${ventaEnvioModal.codigo_postal})`
                    : ""}
                </p>
              )}
            </div>

            <form onSubmit={guardarLogisticaVenta} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#102C3A]/70 mb-1">
                  Estado del Envío
                </label>
                <select
                  value={formEstadoEnvio}
                  onChange={(e) =>
                    setFormEstadoEnvio(e.target.value as EstadoEnvio)
                  }
                  className="w-full border border-[#102C3A]/20 bg-white p-3 text-xs outline-none focus:border-[#102C3A]"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="preparando">Preparando pedido</option>
                  <option value="enviado">Enviado / Listo para retirar</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#102C3A]/70 mb-1">
                  Código de Seguimiento (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: AND-984512345AR"
                  value={formTrackingCode}
                  onChange={(e) => setFormTrackingCode(e.target.value)}
                  className="w-full border border-[#102C3A]/20 bg-white p-3 text-xs outline-none focus:border-[#102C3A]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#102C3A]/70 mb-1">
                  Link de Seguimiento (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://seguimiento.andreani.com/..."
                  value={formTrackingUrl}
                  onChange={(e) => setFormTrackingUrl(e.target.value)}
                  className="w-full border border-[#102C3A]/20 bg-white p-3 text-xs outline-none focus:border-[#102C3A]"
                />
              </div>

              {formEstadoEnvio === "enviado" && (
                <label className="flex items-center gap-2.5 text-xs bg-white p-3 border border-[#102C3A]/15 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificarPorMail}
                    onChange={(e) => setNotificarPorMail(e.target.checked)}
                    className="accent-[#102C3A]"
                  />
                  <span>
                    Enviar email automático al cliente con el tracking
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={guardandoEnvio}
                className="w-full flex items-center justify-center gap-2 bg-[#102C3A] text-white py-3.5 text-xs uppercase tracking-[.2em] hover:bg-[#214858] transition disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {guardandoEnvio ? "Guardando..." : "Guardar y Actualizar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}