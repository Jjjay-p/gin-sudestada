import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextResponse } from "next/server";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

const CATALOGO_FALLBACK: Record<string, { title: string; price: number }> = {
  "500ml": { title: "Sudestada Gin - Edición Náutica Compacta", price: 18500 },
  "750ml": { title: "Sudestada Gin - Botella Estándar Premium", price: 24900 },
  "1 Litro": { title: "Sudestada Gin - Edición Velero Colección", price: 31000 },
  "1L": { title: "Sudestada Gin - Edición Velero Colección", price: 31000 },
};

export async function POST(request: Request) {
  try {
    if (!accessToken) {
      return NextResponse.json(
        { error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN." },
        { status: 500 }
      );
    }

    const body = await request.json();

    // 1. Dominio principal fijo en producción para no perder localStorage
    const host = request.headers.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const baseUrl = isLocal
      ? `http://${host}`
      : process.env.NEXT_PUBLIC_SITE_URL || "https://gin-sudestada.vercel.app";

    let itemsMP: Array<{
      id: string;
      title: string;
      quantity: number;
      unit_price: number;
      currency_id: string;
    }> = [];

    // 2. Extraer productos según la estructura que envíe la tienda
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      itemsMP = body.items.map((item: any) => {
        const sizeKey = item.size || item.tamanio || item.id || "750ml";
        const fallback = CATALOGO_FALLBACK[sizeKey];
        return {
          id: String(sizeKey),
          title: item.title || item.name || fallback?.title || `Sudestada Gin ${sizeKey}`,
          quantity: Number(item.quantity || item.cantidad) || 1,
          unit_price: Number(item.price || item.precio) || fallback?.price || 18500,
          currency_id: "ARS",
        };
      });
    } else {
      const sizeKey = body.size || body.id || "500ml";
      const fallback = CATALOGO_FALLBACK[sizeKey];

      const title = body.title || body.name || fallback?.title || `Sudestada Gin ${sizeKey}`;
      const price = Number(body.price) || fallback?.price || 18500;
      const quantity = Number(body.quantity) || 1;

      itemsMP = [
        {
          id: String(sizeKey),
          title,
          quantity,
          unit_price: price,
          currency_id: "ARS",
        },
      ];
    }

    // 3. Cálculo de descuento Promo 3x2
    const individualPrices: number[] = [];
    itemsMP.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        individualPrices.push(item.unit_price);
      }
    });

    const totalUnits = individualPrices.length;
    const freeUnitsCount = Math.floor(totalUnits / 3);

    if (freeUnitsCount > 0) {
      individualPrices.sort((a, b) => a - b);
      let totalDiscount = 0;
      for (let i = 0; i < freeUnitsCount; i++) {
        totalDiscount += individualPrices[i];
      }

      if (totalDiscount > 0) {
        itemsMP.push({
          id: "PROMO-3X2",
          title: "🎁 Bonificación Promoción 3x2",
          quantity: 1,
          unit_price: -totalDiscount,
          currency_id: "ARS",
        });
      }
    }

    const clienteEmail = body.email || body.cliente_email || "";
    const totalFinal = itemsMP.reduce(
      (acc, item) => acc + item.unit_price * item.quantity,
      0
    );

    // 4. Crear preferencia con metadata y notification_url para el webhook
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: itemsMP,
        payer: {
          email: clienteEmail || "cliente@sudestada.com",
        },
        external_reference: `SUDESTADA-${Date.now()}`,
        metadata: {
          cliente_email: clienteEmail,
          total: totalFinal,
          items: itemsMP
            .filter((i) => i.id !== "PROMO-3X2")
            .map((i) => ({
              tamanio: i.id,
              cantidad: i.quantity,
              precio: i.unit_price,
            })),
        },
        // Mercado Pago solo acepta notification_url pública (HTTPS)
        ...(isLocal ? {} : { notification_url: `${baseUrl}/api/webhook` }),
        back_urls: {
          success: `${baseUrl}/?payment=success`,
          failure: `${baseUrl}/?payment=failure`,
          pending: `${baseUrl}/?payment=pending`,
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
    });
  } catch (error: any) {
    console.error("❌ ERROR MERCADO PAGO:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          error?.cause?.[0]?.description ||
          "No se pudo crear la preferencia de pago.",
      },
      { status: 500 }
    );
  }
}