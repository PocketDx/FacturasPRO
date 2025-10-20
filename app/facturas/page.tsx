'use client';

import { useState, useEffect } from 'react';
import { Invoice, Client, InvoiceItem, BillingStatus } from '../types';
import { getInvoices, addInvoice, updateInvoice, deleteInvoice, getClients, generateId } from '../utils/storage';
import { formatCurrency, formatDate } from '../utils/calculations';
import Link from 'next/link';

export default function FacturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 21,
    notes: '',
  });
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: generateId(), description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedInvoices = getInvoices();
    const loadedClients = getClients();
    setInvoices(loadedInvoices);
    setClients(loadedClients);
  };

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const calculateInvoiceTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = calculateItemTotal(
        newItems[index].quantity,
        newItems[index].unitPrice
      );
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: generateId(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const client = clients.find(c => c.id === formData.clientId);
    if (!client) {
      alert('Por favor selecciona un cliente');
      return;
    }

    const { subtotal, taxAmount, total } = calculateInvoiceTotals();
    
    if (editingInvoice) {
      const updatedInvoice: Invoice = {
        ...editingInvoice,
        clientId: formData.clientId,
        client,
        issueDate: new Date(formData.issueDate),
        dueDate: new Date(formData.dueDate),
        items,
        subtotal,
        taxRate: formData.taxRate,
        taxAmount,
        total,
        notes: formData.notes,
        updatedAt: new Date(),
      };
      updateInvoice(updatedInvoice);
    } else {
      // Generate sequential invoice number
      const existingInvoices = getInvoices();
      const maxNumber = existingInvoices.reduce((max, inv) => {
        const match = inv.invoiceNumber.match(/F-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      const invoiceNumber = `F-${String(maxNumber + 1).padStart(6, '0')}`;
      
      const newInvoice: Invoice = {
        id: generateId(),
        invoiceNumber,
        clientId: formData.clientId,
        client,
        issueDate: new Date(formData.issueDate),
        dueDate: new Date(formData.dueDate),
        items,
        subtotal,
        taxRate: formData.taxRate,
        taxAmount,
        total,
        status: BillingStatus.PENDING,
        notes: formData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addInvoice(newInvoice);
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      taxRate: 21,
      notes: '',
    });
    setItems([{ id: generateId(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setEditingInvoice(null);
    setShowForm(false);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      clientId: invoice.clientId,
      issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
      dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
      taxRate: invoice.taxRate,
      notes: invoice.notes || '',
    });
    setItems(invoice.items);
    setShowForm(true);
  };

  const handleDelete = (invoiceId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
      deleteInvoice(invoiceId);
      loadData();
    }
  };

  const handleStatusChange = (invoice: Invoice, newStatus: BillingStatus) => {
    const updatedInvoice = { ...invoice, status: newStatus, updatedAt: new Date() };
    updateInvoice(updatedInvoice);
    loadData();
  };

  const getStatusColor = (status: BillingStatus) => {
    switch (status) {
      case BillingStatus.PAID:
        return 'bg-green-100 text-green-800';
      case BillingStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case BillingStatus.OVERDUE:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totals = calculateInvoiceTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                ← Volver al Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Facturas</h1>
              <p className="mt-1 text-sm text-gray-600">Crea y gestiona tus facturas</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              disabled={clients.length === 0}
            >
              {showForm ? 'Cancelar' : '+ Nueva Factura'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* No clients warning */}
        {clients.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800">
              No tienes clientes registrados. <Link href="/clientes" className="underline font-semibold">Agregar un cliente primero</Link>
            </p>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingInvoice ? 'Editar Factura' : 'Nueva Factura'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IVA (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Emisión *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Conceptos</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Agregar concepto
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Descripción"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          placeholder="Cantidad"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          placeholder="Precio"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="text-gray-700 font-medium">{formatCurrency(item.total)}</span>
                      </div>
                      <div className="col-span-1 flex items-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-6 border-t pt-4 space-y-2">
                  <div className="flex justify-end items-center">
                    <span className="text-gray-600 mr-4">Subtotal:</span>
                    <span className="font-medium w-32 text-right">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-end items-center">
                    <span className="text-gray-600 mr-4">IVA ({formData.taxRate}%):</span>
                    <span className="font-medium w-32 text-right">{formatCurrency(totals.taxAmount)}</span>
                  </div>
                  <div className="flex justify-end items-center text-lg">
                    <span className="font-semibold mr-4">Total:</span>
                    <span className="font-bold w-32 text-right">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas adicionales..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingInvoice ? 'Actualizar' : 'Guardar Factura'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invoice Detail View */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">Factura {selectedInvoice.invoiceNumber}</h2>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Cliente</h3>
                    <p className="text-gray-900">{selectedInvoice.client.name}</p>
                    <p className="text-gray-600 text-sm">{selectedInvoice.client.email}</p>
                    <p className="text-gray-600 text-sm">{selectedInvoice.client.phone}</p>
                    <p className="text-gray-600 text-sm">NIF/CIF: {selectedInvoice.client.taxId}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Información</h3>
                    <p className="text-sm"><span className="text-gray-600">Emisión:</span> {formatDate(selectedInvoice.issueDate)}</p>
                    <p className="text-sm"><span className="text-gray-600">Vencimiento:</span> {formatDate(selectedInvoice.dueDate)}</p>
                    <p className="text-sm">
                      <span className="text-gray-600">Estado:</span>{' '}
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedInvoice.status)}`}>
                        {selectedInvoice.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Conceptos</h3>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Descripción</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Cant.</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Precio</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-2 text-sm">{item.description}</td>
                          <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-end">
                    <span className="text-gray-600 mr-4">Subtotal:</span>
                    <span className="font-medium w-32 text-right">{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-gray-600 mr-4">IVA ({selectedInvoice.taxRate}%):</span>
                    <span className="font-medium w-32 text-right">{formatCurrency(selectedInvoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-end text-lg">
                    <span className="font-semibold mr-4">Total:</span>
                    <span className="font-bold w-32 text-right">{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold text-gray-700 mb-2">Notas</h3>
                    <p className="text-gray-600 text-sm">{selectedInvoice.notes}</p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t flex justify-end gap-4">
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoices List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Lista de Facturas ({invoices.length})</h2>
          </div>
          
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">No hay facturas registradas</p>
              <p className="text-sm">Haz clic en &ldquo;Nueva Factura&rdquo; para crear una</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Factura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.client.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(invoice.issueDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(invoice.dueDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(invoice.total)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={invoice.status}
                          onChange={(e) => handleStatusChange(invoice, e.target.value as BillingStatus)}
                          className={`text-xs font-semibold px-2 py-1 rounded border-0 ${getStatusColor(invoice.status)}`}
                        >
                          <option value={BillingStatus.PAID}>{BillingStatus.PAID}</option>
                          <option value={BillingStatus.PENDING}>{BillingStatus.PENDING}</option>
                          <option value={BillingStatus.OVERDUE}>{BillingStatus.OVERDUE}</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
