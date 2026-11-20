import { MercadoPagoConfig, Payment } from "mercadopago";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

export async function POST(request: Request) {
  try {
    if (!accessToken) {
      return NextResponse.json(
        { error: "Falta MERCADOPAGO_ACCESS_TOKEN" },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    const topic =
      body.type ||
      body.topic ||
      url.searchParams.get("topic") ||
      url.searchParams.get("type");
    const paymentId =
      body?.data?.id ||
      url.searchParams.get("data.id") ||
      (topic === "payment" ? url.searchParams.get("id") : null);

    if (topic !== "payment" || !paymentId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: String(paymentId) });

    if (payment.status !== "approved") {
      return NextResponse.json(
        { received: true, status: payment.status },
        { status: 200 }
      );
    }

    const mpIdString = String(payment.id);

    // 1. Idempotencia: evitar registros o descuentos de stock duplicados
    const { data: existente } = await supabase
      .from("ventas")
      .select("id")
      .eq("mp_payment_id", mpIdString)
      .maybeSingle();

    if (existente) {
      return NextResponse.json(
        { received: true, duplicate: true },
        { status: 200 }
      );
    }

    // 2. Extraer metadata del pedido y datos logísticos
    const metadata = (payment.metadata || {}) as {
      cliente_email?: string;
      cliente_nombre?: string;
      cliente_telefono?: string;
      tipo_entrega?: "envio" | "retiro";
      direccion?: string;
      ciudad?: string;
      codigo_postal?: string;
      total?: number;
      items?: Array<{ tamanio: string; cantidad: number; precio: number }>;
    };

    const clienteEmail =
      metadata.cliente_email ||
      payment.payer?.email ||
      "cliente_web@sudestada.com";

    const totalVenta =
      Number(metadata.total) || Number(payment.transaction_amount) || 0;

    const itemsDetalle =
      Array.isArray(metadata.items) && metadata.items.length > 0
        ? metadata.items
        : (payment.additional_info?.items || [])
            .filter((i: any) => i.id !== "PROMO-3X2")
            .map((i: any) => ({
              tamanio: String(i.id || i.title || "750ml"),
              cantidad: Number(i.quantity) || 1,
              precio: Number(i.unit_price) || 0,
            }));

    // 3. Insertar venta con datos logísticos en Supabase
    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .insert([
        {
          cliente_email: clienteEmail,
          cliente_nombre: metadata.cliente_nombre || null,
          cliente_telefono: metadata.cliente_telefono || null,
          tipo_entrega: metadata.tipo_entrega || "envio",
          direccion: metadata.direccion || null,
          ciudad: metadata.ciudad || null,
          codigo_postal: metadata.codigo_postal || null,
          estado_envio: "pendiente",
          total: totalVenta,
          estado_pago: "approved",
          mp_payment_id: mpIdString,
        },
      ])
      .select()
      .single();

    if (ventaError) {
      if (ventaError.code === "23505") {
        return NextResponse.json(
          { received: true, duplicate: true },
          { status: 200 }
        );
      }
      console.error("❌ Error insertando venta desde webhook:", ventaError.message);
      return NextResponse.json({ error: ventaError.message }, { status: 500 });
    }

    // 4. Insertar detalle de productos vendidos
    if (itemsDetalle.length > 0) {
      const filasDetalle = itemsDetalle.map((item) => ({
        venta_id: venta.id,
        size: item.tamanio,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
      }));

      const { error: detalleError } = await supabase
        .from("detalle_ventas")
        .insert(filasDetalle);

      if (detalleError) {
        console.error("❌ Error insertando detalle_ventas:", detalleError.message);
      }

      // 5. Descontar stock automáticamente en stock_productos
      for (const item of itemsDetalle) {
        const { data: prodStock } = await supabase
          .from("stock_productos")
          .select("id, stock")
          .eq("size", item.tamanio)
          .maybeSingle();

        if (prodStock) {
          const nuevoStock = Math.max(0, (prodStock.stock || 0) - item.cantidad);
          const { error: stockUpdateError } = await supabase
            .from("stock_productos")
            .update({
              stock: nuevoStock,
              updated_at: new Date().toISOString(),
            })
            .eq("id", prodStock.id);

          if (stockUpdateError) {
            console.error(
              `❌ Error actualizando stock de ${item.tamanio}:`,
              stockUpdateError.message
            );
          }
        }
      }
    }

    // 6. Enviar comprobante por correo vía /api/send-confirmation
    const host = request.headers.get("host") || "gin-sudestada.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    await fetch(`${baseUrl}/api/send-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: clienteEmail,
        total: totalVenta,
        items: itemsDetalle.map((i) => ({
          tamanio: i.tamanio,
          cantidad: i.cantidad,
        })),
      }),
    }).catch((err) =>
      console.error("❌ Error llamando send-confirmation:", err)
    );

    return NextResponse.json(
      { received: true, venta_id: venta.id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ ERROR WEBHOOK MP:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno en webhook" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { status: "Webhook Sudestada activo" },
    { status: 200 }
  );
}