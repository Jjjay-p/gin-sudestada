import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta RESEND_API_KEY en las variables de entorno." },
        { status: 500 }
      );
    }

    const { email, cliente_nombre, venta_id, tracking_code, tracking_url, tipo_entrega } =
      await request.json();

    if (!email) {
      return NextResponse.json({ error: "Falta el email del cliente." }, { status: 400 });
    }

    const esRetiro = tipo_entrega === "retiro";
    const saludo = cliente_nombre ? `Hola ${cliente_nombre},` : "Hola,";

    const html = `
      <div style="font-family: Georgia, serif; background-color: #F4EFE3; color: #102C3A; padding: 32px; max-width: 560px; margin: 0 auto; border: 1px solid #b7a16f;">
        <p style="font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: #8d774b; margin: 0 0 8px;">
          Sudestada Gin · Logística
        </p>
        <h1 style="font-size: 26px; font-weight: normal; margin: 0 0 16px;">
          ${esRetiro ? "Tu pedido está listo para retirar" : "Tu pedido ya está en camino"}
        </h1>
        <p style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #102C3A;">
          ${saludo}<br/>
          ${
            esRetiro
              ? `Tu pedido <strong>#${venta_id}</strong> de Sudestada Gin ya se encuentra preparado y listo para retirar.`
              : `Despachamos tu pedido <strong>#${venta_id}</strong> de Sudestada Gin.`
          }
        </p>
        ${
          tracking_code
            ? `<div style="background-color: #ffffff; border: 1px solid #102C3A26; padding: 16px; margin: 20px 0; font-family: Arial, sans-serif;">
                <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #8d774b; margin: 0 0 6px;">
                  Código de seguimiento
                </p>
                <p style="font-size: 16px; font-weight: bold; margin: 0;">${tracking_code}</p>
                ${
                  tracking_url
                    ? `<p style="margin: 12px 0 0;">
                        <a href="${tracking_url}" style="display: inline-block; background-color: #102C3A; color: #F4EFE3; text-decoration: none; padding: 10px 18px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">
                          Seguir envío
                        </a>
                      </p>`
                    : ""
                }
              </div>`
            : ""
        }
        <p style="font-family: Arial, sans-serif; font-size: 11px; color: #102C3A99; margin-top: 24px; border-top: 1px solid #102C3A1A; padding-top: 14px;">
          Gracias por elegir Sudestada Gin · Buenos Aires, Argentina.
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sudestada Gin <onboarding@resend.dev>",
        to: [email],
        subject: esRetiro
          ? `Pedido #${venta_id} listo para retirar · Sudestada Gin`
          : `Tu pedido #${venta_id} está en camino · Sudestada Gin`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error enviando correo de seguimiento." },
      { status: 500 }
    );
  }
}