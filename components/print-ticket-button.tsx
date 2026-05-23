"use client";

import { Button } from "@/components/ui/button";

type SaleItem = {
  id: string;
  quantity: number;
  subtotal: number;
  products: { name: string };
};

type Sale = {
  id: string;
  total: number;
  payment_method: string;
  created_at: string;
  sale_items: SaleItem[];
};

export default function PrintTicketButton({ sale }: { sale: Sale }) {
  function printTicket() {
    const paymentLabel =
      sale.payment_method === "cash"
        ? "Efectivo"
        : sale.payment_method === "card"
          ? "Tarjeta"
          : "Transferencia";

    const items = sale.sale_items
      .map(
        (item) =>
          `<tr>
            <td style="padding:2px 4px">${item.products?.name}</td>
            <td style="padding:2px 4px;text-align:center">${item.quantity}</td>
            <td style="padding:2px 4px;text-align:right">$${item.subtotal.toFixed(2)}</td>
          </tr>`
      )
      .join("");

    const ticket = `
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: monospace;
              font-size: 12px;
              width: 58mm;
              padding: 8px;
            }
            h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; font-size: 11px; border-bottom: 1px solid #000; padding: 2px 4px; }
            .total { font-size: 14px; font-weight: bold; text-align: right; margin-top: 6px; }
            @media print {
              body { width: 58mm; }
            }
          </style>
        </head>
        <body>
          <h1>Bar Control</h1>
          <p class="center">${new Date(sale.created_at).toLocaleString("es-ES")}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align:center">Cant</th>
                <th style="text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>${items}</tbody>
          </table>
          <div class="divider"></div>
          <p class="total">TOTAL: $${parseFloat(sale.total.toString()).toFixed(2)}</p>
          <p style="margin-top:4px">Pago: ${paymentLabel}</p>
          <div class="divider"></div>
          <p class="center" style="margin-top:6px">¡Gracias por su visita!</p>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=300,height=500");
    if (win) {
      win.document.write(ticket);
      win.document.close();
      win.focus();
      win.print();
      win.close();
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={printTicket}>
      🖨️ Ticket
    </Button>
  );
}
