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

    // 1. URL base para retornos de Mercado Pago
    const host = request.headers.get("host") || "gin-sudestada-git-main-sudestada-gin.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

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
        const sizeKey = item.size || item.id || "750ml";
        const fallback = CATALOGO_FALLBACK[sizeKey];
        return {
          id: String(sizeKey),
          title: item.title || item.name || fallback?.title || `Sudestada Gin ${sizeKey}`,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.price) || fallback?.price || 18500,
          currency_id: "ARS",
        };
      });
    } else {
      // Si el carrito envía los datos de forma individual en la raíz del body
      const sizeKey = body.size || body.id || "500ml";
      const fallback = CATALOGO_FALLBACK[sizeKey];

      const title = body.title || body.name || fallback?.title || `Sudestada Gin ${sizeKey}`;
      const price = Number(body.price) || fallback?.price || 18500;
      const quantity = Number(body.quantity) || 1;

      itemsMP = [
        {
          id: String(sizeKey),
          title: title,
          quantity: quantity,
          unit_price: price,
          currency_id: "ARS",
        },
      ];
    }

    // 3. Crear preferencia en Mercado Pago
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: itemsMP,
        payer: {
          email: body.email || body.cliente_email || "cliente@sudestada.com",
        },
        external_reference: `SUDESTADA-${Date.now()}`,
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