'use client';

import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';
import { useState } from 'react';

interface EmailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSend: (emailData: { to: string; subject: string; message: string }) => void;
}

export default function EmailModal({ invoice, onClose, onSend }: EmailModalProps) {
  const [emailData, setEmailData] = useState({
    to: invoice.client.email,
    subject: `Factura ${invoice.invoiceNumber} - ${invoice.client.name}`,
    message: `Estimado/a ${invoice.client.name},

Adjunto encontrará la factura ${invoice.invoiceNumber} correspondiente a los servicios prestados.

Detalles de la factura:
- Fecha de emisión: ${formatDate(invoice.issueDate)}
- Fecha de vencimiento: ${formatDate(invoice.dueDate)}
- Importe total: ${formatCurrency(invoice.total)}
- Estado: ${invoice.status}

Conceptos:
${invoice.items.map(item => `- ${item.description}: ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)}`).join('\n')}

Subtotal: ${formatCurrency(invoice.subtotal)}
IVA (${invoice.taxRate}%): ${formatCurrency(invoice.taxAmount)}
Total: ${formatCurrency(invoice.total)}

Quedamos a su disposición para cualquier consulta.

Saludos cordiales.`,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(emailData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enviar Factura por Email</h2>
              <p className="text-sm text-gray-600 mt-1">Factura {invoice.invoiceNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Para (Email del cliente) *
                </label>
                <input
                  type="email"
                  required
                  value={emailData.to}
                  onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="cliente@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto *
                </label>
                <input
                  type="text"
                  required
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje *
                </label>
                <textarea
                  required
                  rows={12}
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>📧 Nota:</strong> Este es un sistema de demostración. El email se simulará y 
                  mostrará una notificación de éxito. En un entorno de producción, esto enviaría el email 
                  a través de un servidor.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <span>📧</span>
                <span>Enviar Email</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
