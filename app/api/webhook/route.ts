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

    // Mercado Pago puede enviar el ID por query (?data.id=... o ?id=...) o en el body
    const topic = body.type || body.topic || url.searchParams.get("topic") || url.searchParams.get("type");
    const paymentId =
      body?.data?.id ||
      url.searchParams.get("data.id") ||
      (topic === "payment" ? url.searchParams.get("id") : null);

    // Si no es un evento de pago, respondemos 200 OK para que MP no reintente
    if (topic !== "payment" || !paymentId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 1. Consultar el estado real del pago directamente a Mercado Pago
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

    // 2. Idempotencia: verificar si este pago ya fue registrado
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

    // 3. Extraer datos guardados en metadata (o fallback desde payer/items)
    const metadata = (payment.metadata || {}) as {
      cliente_email?: string;
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

    // 4. Registrar venta principal en Supabase
    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .insert([
        {
          cliente_email: clienteEmail,
          total: totalVenta,
          estado_pago: "approved",
          mp_payment_id: mpIdString,
        },
      ])
      .select()
      .single();

    if (ventaError) {
      // Si chocó por unique constraint (condición de carrera), ya fue procesada
      if (ventaError.code === "23505") {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }
      console.error("❌ Error insertando venta desde webhook:", ventaError.message);
      return NextResponse.json({ error: ventaError.message }, { status: 500 });
    }

    // 5. Registrar detalle de productos vendidos
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
    }

    // 6. Disparar comprobante por correo vía /api/send-confirmation
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
    }).catch((err) => console.error("❌ Error llamando send-confirmation:", err));

    return NextResponse.json({ received: true, venta_id: venta.id }, { status: 200 });
  } catch (error: any) {
    console.error("❌ ERROR WEBHOOK MP:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno en webhook" },
      { status: 500 }
    );
  }
}

// Mercado Pago a veces hace un GET de verificación al configurar la URL
export async function GET() {
  return NextResponse.json({ status: "Webhook Sudestada activo" }, { status: 200 });
}