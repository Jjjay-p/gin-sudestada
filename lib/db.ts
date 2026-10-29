import { supabase } from "./supabaseClient";

export async function registrarVenta(size: string, cantidad: number, total: number, email: string = "cliente_anonimo@sudestada.com") {
  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert([
      {
        cliente_email: email,
        total: total,
        estado_pago: "pending",
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
  const { error } = await supabase
    .from("carritos_creados")
    .insert([{}]);

  if (error) {
    console.error("Error al registrar carrito creado:", error.message);
  }
}