import { NextResponse } from "next/server";
import { Resend } from "resend";


export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta configurar RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const { email, total, items } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Falta el email del destinatario." },
        { status: 400 }
      );
    }

    const numeroComprobante = `SUD-${Date.now().toString().slice(-6)}`;
    const fechaEmision = new Date().toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const filasItems = (items || [])
      .map(
        (item: { tamanio: string; cantidad: number }) => `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e0d5; color: #102C3A; font-size: 14px;">
              Sudestada Gin · ${item.tamanio}
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e0d5; color: #102C3A; font-size: 14px; text-align: right;">
              x${item.cantidad}
            </td>
          </tr>
        `
      )
      .join("");

    const { data, error } = await resend.emails.send({
      from: "Sudestada Gin <onboarding@resend.dev>",
      to: [email],
      subject: `Comprobante de compra #${numeroComprobante} · Sudestada Gin`,
      html: `
        <div style="background-color: #F4EFE3; padding: 32px 16px; font-family: Arial, Helvetica, sans-serif;">
          <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #d8cfb8; padding: 32px;">
            <div style="text-align: center; border-bottom: 2px solid #102C3A; padding-bottom: 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 10px; letter-spacing: 4px; color: #8d774b; text-transform: uppercase;">
                Buenos Aires · Argentina
              </p>
              <h1 style="margin: 6px 0 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 3px; color: #102C3A;">
                SUDESTADA GIN
              </h1>
            </div>

            <div style="font-size: 12px; color: #55656e; margin-bottom: 20px; line-height: 1.6;">
              <strong>Comprobante:</strong> #${numeroComprobante}<br/>
              <strong>Fecha:</strong> ${fechaEmision}<br/>
              <strong>Cliente:</strong> ${email}
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #102C3A; margin-bottom: 20px;">
              ¡Gracias por tu compra! <strong>Tu compra fue realizada correctamente, nos contactaremos con vos por el seguimiento del envío.</strong>
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr>
                  <th style="text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8d774b; border-bottom: 1px solid #102C3A; padding-bottom: 8px;">
                    Producto
                  </th>
                  <th style="text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8d774b; border-bottom: 1px solid #102C3A; padding-bottom: 8px;">
                    Cant.
                  </th>
                </tr>
              </thead>
              <tbody>
                ${filasItems}
              </tbody>
            </table>

            <div style="background-color: #F4EFE3; padding: 14px 16px; text-align: right; margin-bottom: 24px;">
              <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #102C3A; margin-right: 12px;">
                Total Abonado:
              </span>
              <strong style="font-family: Georgia, serif; font-size: 20px; color: #102C3A;">
                $${Number(total || 0).toLocaleString("es-AR")}
              </strong>
            </div>

            <p style="font-size: 11px; color: #7a868c; text-align: center; margin: 0;">
              El espíritu del sur · Beber con moderación. Prohibida su venta a menores de 18 años.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Error Resend:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("Error interno en send-confirmation:", err);
    return NextResponse.json(
      { error: "Error interno al enviar el comprobante." },
      { status: 500 }
    );
  }
}