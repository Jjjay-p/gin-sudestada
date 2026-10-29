import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextResponse } from "next/server";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

export async function POST(request: Request) {
  try {
    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const size = body.size;
    const quantity = Number(body.quantity);

    const products: Record<
      string,
      {
        title: string;
        price: number;
      }
    > = {
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
    };

    const product = products[size];

    if (!product) {
      return NextResponse.json(
        {
          error: "Producto inválido.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return NextResponse.json(
        {
          error: "La cantidad debe ser un número entero entre 1 y 10.",
        },
        { status: 400 }
      );
    }

    const client = new MercadoPagoConfig({
      accessToken,
    });

    const preference = new Preference(client);

    console.log("🚀 Creando preferencia...");

    const response = await preference.create({
      body: {
        items: [
          {
            id: size,
            title: product.title,
            quantity: quantity,
            unit_price: product.price,
            currency_id: "ARS",
          },
        ],

        external_reference: `SUDESTADA-${Date.now()}`,

        back_urls: {
  success: "http://localhost:3000/?payment=success",
  failure: "http://localhost:3000/?payment=failure",
  pending: "http://localhost:3000/?payment=pending",
},
      },
    });

    console.log("✅ Preferencia creada:", response.id);

    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
    });
  } catch (error: any) {
    console.error("❌ ERROR MERCADO PAGO:");
    console.error(error);

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