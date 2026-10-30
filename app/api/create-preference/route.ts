import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextResponse } from "next/server";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

const CATALOGO_PRODUCTOS: Record<string, { title: string; price: number }> = {
  "500ml": {
    title: "Sudestada Gin - Edición Náutica Compacta",
    price: 18500,
  },
  "750ml": {
    title: "Sudestada Gin - Botella Estándar Premium",
    price: 24900,
  },
  "1 Litro": {
    title: "Sudestada Gin - Edición Velero Colección",
    price: 31000,
  },
  "1L": {
    title: "Sudestada Gin - Edición Velero Colección",
    price: 31000,
  },
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

    // 1. Obtener la URL base dinámica (Vercel o Localhost)
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

    // 2. Si el carrito envía un array de items (Multi-producto)
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      itemsMP = body.items.map((item: any) => {
        const keySize = item.size || item.id || "750ml";
        const prod = CATALOGO_PRODUCTOS[keySize];

        return {
          id: keySize,
          title: item.title || item.name || prod?.title || `Sudestada Gin ${keySize}`,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.price) || prod?.price || 24900,
          currency_id: "ARS",
        };
      });
    } 
    // 3. Fallback: Si se envía un único producto vía body.size
    else if (body.size) {
      const product = CATALOGO_PRODUCTOS[body.size];
      if (!product) {
        return NextResponse.json(
          { error: "Producto inválido." },
          { status: 400 }
        );
      }

      const quantity = Number(body.quantity) || 1;
      itemsMP = [
        {
          id: body.size,
          title: product.title,
          quantity: quantity,
          unit_price: product.price,
          currency_id: "ARS",
        },
      ];
    } else {
      return NextResponse.json(
        { error: "No se recibieron productos válidos en el carrito." },
        { status: 400 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    console.log("🚀 Creando preferencia...");

    const response = await preference.create({
      body: {
        items: itemsMP,
        payer: {
          email: body.email || "cliente@sudestada.com",
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

    console.log("✅ Preferencia creada:", response.id);

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