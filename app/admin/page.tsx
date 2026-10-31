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
} from "lucide-react";

interface Venta {
  id: number;
  cliente_email: string;
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

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Formulario de login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Estados del Dashboard
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [newsletter, setNewsletter] = useState<Suscriptor[]>([]);
  const [productosStock, setProductosStock] = useState<ProductoStock[]>([]);
  const [totalCarritos, setTotalCarritos] = useState<number>(0);
  const [dataLoading, setDataLoading] = useState(false);
  
  // Feedback visual para stock y ventas
  const [savingStockId, setSavingStockId] = useState<string | null>(null);
  const [savedStockSuccessId, setSavedStockSuccessId] = useState<string | null>(null);
  const [updatingVentaId, setUpdatingVentaId] = useState<number | null>(null);

  const [tab, setTab] = useState<"ventas" | "newsletter" | "stock">("ventas");

  // 1. Escuchar sesión activa de Supabase
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

  // 2. Cargar datos cuando hay sesión iniciada
  useEffect(() => {
    if (session) {
      cargarDatos();
    }
  }, [session]);

  const cargarDatos = async () => {
    setDataLoading(true);
    try {
      // Ventas
      const { data: ventasData, error: ventasErr } = await supabase
        .from("ventas")
        .select("*")
        .order("created_at", { ascending: false });

      if (ventasErr) console.error("Error al cargar ventas:", ventasErr.message);

      // Newsletter
      const { data: newsletterData, error: newsErr } = await supabase
        .from("newsletter")
        .select("*")
        .order("created_at", { ascending: false });

      if (newsErr) console.error("Error al cargar newsletter:", newsErr.message);

      // Stock de Productos
      const { data: stockData, error: stockErr } = await supabase
        .from("stock_productos")
        .select("*")
        .order("id", { ascending: true });

      if (stockErr) console.error("Error al cargar stock:", stockErr.message);

      // Carritos Creados
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

  // --- VISTA LOGIN (No autenticado) ---
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

  // --- VISTA DASHBOARD (Autenticado) ---
  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#102C3A] p-6 sm:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#102C3A]/20 pb-6 mb-8 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[.3em] text-[#8d774b]">
              Sudestada Gin · Panel Control
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl mt-1">
              Gestor de Tienda
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

        {/* METRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
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
                Ventas Registradas
              </span>
              <ShoppingBag className="h-4 w-4" />
            </div>
            <p className="font-serif text-3xl text-[#102C3A]">
              {ventas.length}
            </p>
          </div>

          <div className="bg-white/80 border border-[#102C3A]/15 p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#8d774b] mb-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold">
                Stock Total Botellas
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
                Suscriptores Newsletter
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
            <ShoppingBag className="h-4 w-4" /> Ventas ({ventas.length})
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
              {productosStock.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white border border-[#102C3A]/15 p-5 flex flex-col justify-between shadow-sm relative"
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#8d774b]">
                      Presentación
                    </span>
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
                          title="Restar 5"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => modificarStockLocal(prod.id, -1)}
                          className="p-1.5 border border-[#102C3A]/30 text-xs hover:bg-[#102C3A] hover:text-white transition"
                          title="Restar 1"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="font-serif text-2xl px-2">{prod.stock}</span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => modificarStockLocal(prod.id, 1)}
                          className="p-1.5 border border-[#102C3A]/30 text-xs hover:bg-[#102C3A] hover:text-white transition"
                          title="Sumar 1"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => modificarStockLocal(prod.id, 5)}
                          className="px-2 py-1 border border-[#102C3A]/30 text-xs font-mono hover:bg-[#102C3A] hover:text-white transition"
                          title="Sumar 5"
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
              ))}
            </div>
          </div>
        )}

        {/* TAB VENTAS */}
        {tab === "ventas" && (
          <div className="bg-white/80 border border-[#102C3A]/15 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#102C3A] text-[#F4EFE3] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Cliente / Email</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Estado Pago</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#102C3A]/10">
                  {ventas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#102C3A]/60">
                        {dataLoading
                          ? "Cargando ventas..."
                          : "No hay ventas registradas."}
                      </td>
                    </tr>
                  ) : (
                    ventas.map((v) => {
                      const isApproved =
                        v.estado_pago === "approved" ||
                        v.estado_pago === "completado";

                      return (
                        <tr key={v.id} className="hover:bg-white transition">
                          <td className="p-4 font-mono font-medium">#{v.id}</td>
                          <td className="p-4 font-medium">{v.cliente_email}</td>
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
                          <td className="p-4 text-[#102C3A]/60">
                            {new Date(v.created_at).toLocaleString("es-AR")}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => cambiarEstadoVenta(v.id, v.estado_pago)}
                              disabled={updatingVentaId === v.id}
                              className="text-[10px] uppercase tracking-wider border border-[#102C3A]/30 px-3 py-1.5 bg-white hover:bg-[#102C3A] hover:text-white transition disabled:opacity-50"
                            >
                              {updatingVentaId === v.id
                                ? "Actualizando..."
                                : "Cambiar Estado"}
                            </button>
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
    </div>
  );
}