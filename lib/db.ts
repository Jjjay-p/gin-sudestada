import { supabase } from "./supabaseClient";

export interface DatosEnvio {
  cliente_nombre?: string;
  cliente_telefono?: string;
  tipo_entrega?: "envio" | "retiro";
  direccion?: string;
  ciudad?: string;
  codigo_postal?: string;
}

export async function registrarVenta(
  size: string,
  cantidad: number,
  total: number,
  email: string = "cliente_anonimo@sudestada.com",
  estadoPago: string = "approved",
  envio?: DatosEnvio
) {
  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert([
      {
        cliente_email: email,
        total: total,
        estado_pago: estadoPago,
        cliente_nombre: envio?.cliente_nombre || null,
        cliente_telefono: envio?.cliente_telefono || null,
        tipo_entrega: envio?.tipo_entrega || "envio",
        direccion: envio?.direccion || null,
        ciudad: envio?.ciudad || null,
        codigo_postal: envio?.codigo_postal || null,
        estado_envio: "pendiente",
      },
    ])
    .select()
    .single();

  if (ventaError) {
    console.error("Error guardando venta:", ventaError.message);
    return null;
  }

  const { error: detalleError } = await supabase.from("detalle_ventas").insert([
    {
      venta_id: venta.id,
      size: size,
      cantidad: cantidad,
      precio_unitario: total / cantidad,
    },
  ]);

  if (detalleError) {
    console.error("Error guardando detalle de venta:", detalleError.message);
  }

  return venta;
}

export async function actualizarEnvioVenta(
  ventaId: string,
  datos: {
    estado_envio: "pendiente" | "preparando" | "enviado" | "entregado";
    tracking_code?: string;
    tracking_url?: string;
  }
) {
  const { data, error } = await supabase
    .from("ventas")
    .update({
      estado_envio: datos.estado_envio,
      tracking_code: datos.tracking_code || null,
      tracking_url: datos.tracking_url || null,
    })
    .eq("id", ventaId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function suscribirNewsletter(email: string) {
  const { data, error } = await supabase
    .from("newsletter")
    .insert([{ email }]);

  if (error) {
    if (error.code === "23505") {
      throw new Error("Este correo ya está suscripto.");
    }
    throw new Error("No se pudo registrar la suscripción.");
  }

  return data;
}

export async function registrarNuevoCarrito() {
  const { error } = await supabase.from("carritos_creados").insert([{}]);

  if (error) {
    console.error("Error al registrar carrito creado:", error.message);
  }
}