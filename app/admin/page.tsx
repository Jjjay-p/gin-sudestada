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

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Estados del formulario de login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Estados del dashboard
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [newsletter, setNewsletter] = useState<Suscriptor[]>([]);
  const [totalCarritos, setTotalCarritos] = useState<number>(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [tab, setTab] = useState<"ventas" | "newsletter">("ventas");

  // 1. Verificar sesión activa al cargar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Cargar datos cuando hay sesión activa
  useEffect(() => {
    if (session) {
      cargarDatos();
    }
  }, [session]);

  const cargarDatos = async () => {
    setDataLoading(true);

    // Obtener Ventas
    const { data: ventasData } = await supabase
      .from("ventas")
      .select("*")
      .order("created_at", { ascending: false });

    // Obtener Newsletter
    const { data: newsletterData } = await supabase
      .from("newsletter")
      .select("*")
      .order("created_at", { ascending: false });

    // Obtener Total de Carritos Creados
    const { count } = await supabase
      .from("carritos_creados")
      .select("*", { count: "exact", head: true });

    if (ventasData) setVentas(ventasData);
    if (newsletterData) setNewsletter(newsletterData);
    if (count !== null) setTotalCarritos(count);

    setDataLoading(false);
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
      setLoginError("Credenciales inválidas. Verifica tu email y contraseña.");
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const cambiarEstadoVenta = async (id: number, nuevoEstado: string) => {
    const { error } = await supabase
      .from("ventas")
      .update({ estado_pago: nuevoEstado })
      .eq("id", id);

    if (!error) {
      setVentas((prev) =>
        prev.map((v) => (v.id === id ? { ...v, estado_pago: nuevoEstado } : v))
      );
    } else {
      alert("Error al actualizar el estado de la venta.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4EFE3] flex items-center justify-center">
        <p className="text-xs uppercase tracking-[.2em] text-[#102C3A]">
          Cargando...
        </p>
      </div>
    );
  }

  // --- VISTA DE LOGIN (Sin Sesión) ---
  if (!session) {
    return (
      <div className="min-h-screen bg-[#F4EFE3] text-[#102C3A] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/80 border border-[#102C3A]/20 p-8 shadow-lg">
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
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 mb-4 rounded">
              {loginError}
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
              className="mt-2 w-full bg-[#102C3A] text-white py-3 text-xs uppercase tracking-[.2em] hover:bg-[#214858] transition disabled:opacity-50"
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
              Sudestada Gin
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl mt-1">
              Gestor de Tienda
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={cargarDatos}
              disabled={dataLoading}
              className="flex items-center gap-2 border border-[#102C3A]/30 px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#102C3A] hover:text-[#F4EFE3] transition"
            >
              <RefreshCw
                className={`h-4 w-4 ${dataLoading ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-900 text-white px-4 py-2 text-xs uppercase tracking-wider hover:bg-red-800 transition"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>

        {/* TARJETAS DE RESUMEN/MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/70 border border-[#102C3A]/15 p-5 shadow-sm">
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

          <div className="bg-white/70 border border-[#102C3A]/15 p-5 shadow-sm">
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

          <div className="bg-white/70 border border-[#102C3A]/15 p-5 shadow-sm">
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
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setTab("ventas")}
            className={`flex items-center gap-2 border px-6 py-3 text-xs uppercase tracking-widest transition ${
              tab === "ventas"
                ? "bg-[#102C3A] text-[#F4EFE3] border-[#102C3A]"
                : "border-[#102C3A]/20 bg-white/40 hover:bg-white"
            }`}
          >
            <ShoppingBag className="h-4 w-4" /> Ventas ({ventas.length})
          </button>
          <button
            onClick={() => setTab("newsletter")}
            className={`flex items-center gap-2 border px-6 py-3 text-xs uppercase tracking-widest transition ${
              tab === "newsletter"
                ? "bg-[#102C3A] text-[#F4EFE3] border-[#102C3A]"
                : "border-[#102C3A]/20 bg-white/40 hover:bg-white"
            }`}
          >
            <Mail className="h-4 w-4" /> Newsletter ({newsletter.length})
          </button>
        </div>

        {/* TABLA VENTAS */}
        {tab === "ventas" && (
          <div className="bg-white/60 border border-[#102C3A]/15 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#102C3A] text-[#F4EFE3] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Cliente / Email</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Estado Pago</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4 text-right">Acción</th>
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
                    ventas.map((v) => (
                      <tr key={v.id} className="hover:bg-white/80 transition">
                        <td className="p-4 font-mono">#{v.id}</td>
                        <td className="p-4 font-medium">{v.cliente_email}</td>
                        <td className="p-4 font-serif text-sm">
                          ${v.total.toLocaleString("es-AR")}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold ${
                              v.estado_pago === "approved" ||
                              v.estado_pago === "completado"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {v.estado_pago === "approved" ||
                            v.estado_pago === "completado" ? (
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
                            onClick={() =>
                              cambiarEstadoVenta(
                                v.id,
                                v.estado_pago === "completado"
                                  ? "pending"
                                  : "completado"
                              )
                            }
                            className="text-[10px] uppercase tracking-wider border border-[#102C3A]/30 px-3 py-1 hover:bg-[#102C3A] hover:text-white transition"
                          >
                            Cambiar Estado
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABLA NEWSLETTER */}
        {tab === "newsletter" && (
          <div className="bg-white/60 border border-[#102C3A]/15 overflow-hidden shadow-sm">
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
                      <tr key={n.id} className="hover:bg-white/80 transition">
                        <td className="p-4 font-mono">#{n.id}</td>
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