'use client';

import { useState, useEffect } from 'react';
import { Invoice, Client, BillingStatus } from '../types';
import { getInvoices, getClients } from '../utils/storage';
import { formatCurrency, formatDate } from '../utils/calculations';
import Link from 'next/link';

interface ClientIncome {
  client: Client;
  totalInvoices: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

export default function IngresosPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientIncomes, setClientIncomes] = useState<ClientIncome[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'year'>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateClientIncomes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, clients, selectedPeriod]);

  const loadData = () => {
    const loadedInvoices = getInvoices();
    const loadedClients = getClients();
    setInvoices(loadedInvoices);
    setClients(loadedClients);
  };

  const filterInvoicesByPeriod = (invoices: Invoice[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      
      switch (selectedPeriod) {
        case 'month':
          return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
        case 'year':
          return invoiceDate.getFullYear() === currentYear;
        case 'all':
        default:
          return true;
      }
    });
  };

  const calculateClientIncomes = () => {
    const filteredInvoices = filterInvoicesByPeriod(invoices);
    
    const incomeMap = new Map<string, ClientIncome>();

    filteredInvoices.forEach(invoice => {
      const clientId = invoice.clientId;
      const existing = incomeMap.get(clientId);

      if (existing) {
        existing.totalInvoices++;
        if (invoice.status === BillingStatus.PAID) {
          existing.totalPaid += invoice.total;
        } else if (invoice.status === BillingStatus.PENDING) {
          existing.totalPending += invoice.total;
        } else if (invoice.status === BillingStatus.OVERDUE) {
          existing.totalOverdue += invoice.total;
        }
      } else {
        const client = clients.find(c => c.id === clientId);
        if (client) {
          incomeMap.set(clientId, {
            client,
            totalInvoices: 1,
            totalPaid: invoice.status === BillingStatus.PAID ? invoice.total : 0,
            totalPending: invoice.status === BillingStatus.PENDING ? invoice.total : 0,
            totalOverdue: invoice.status === BillingStatus.OVERDUE ? invoice.total : 0,
          });
        }
      }
    });

    setClientIncomes(Array.from(incomeMap.values()));
  };

  const getTotalStats = () => {
    const filteredInvoices = filterInvoicesByPeriod(invoices);
    
    return {
      totalIncome: filteredInvoices
        .filter(inv => inv.status === BillingStatus.PAID)
        .reduce((sum, inv) => sum + inv.total, 0),
      totalPending: filteredInvoices
        .filter(inv => inv.status === BillingStatus.PENDING)
        .reduce((sum, inv) => sum + inv.total, 0),
      totalOverdue: filteredInvoices
        .filter(inv => inv.status === BillingStatus.OVERDUE)
        .reduce((sum, inv) => sum + inv.total, 0),
      invoiceCount: filteredInvoices.length,
    };
  };

  const stats = getTotalStats();
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'month':
        return 'este mes';
      case 'year':
        return 'este año';
      case 'all':
      default:
        return 'total';
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Control de Ingresos</h1>
              <p className="mt-1 text-sm text-gray-600">Gestiona tus ingresos y pagos</p>
            </div>
            <div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'all' | 'month' | 'year')}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todo el período</option>
                <option value="month">Este mes</option>
                <option value="year">Este año</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <SummaryCard
            title="Ingresos Totales"
            subtitle={getPeriodLabel()}
            value={formatCurrency(stats.totalIncome)}
            color="bg-green-500"
            icon="💰"
          />
          <SummaryCard
            title="Pendiente de Cobro"
            subtitle={getPeriodLabel()}
            value={formatCurrency(stats.totalPending)}
            color="bg-yellow-500"
            icon="⏱"
          />
          <SummaryCard
            title="Facturas Vencidas"
            subtitle={getPeriodLabel()}
            value={formatCurrency(stats.totalOverdue)}
            color="bg-red-500"
            icon="⚠"
          />
          <SummaryCard
            title="Total Facturas"
            subtitle={getPeriodLabel()}
            value={stats.invoiceCount.toString()}
            color="bg-blue-500"
            icon="📄"
          />
        </div>

        {/* Income by Client */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Ingresos por Cliente</h2>
          </div>
          
          {clientIncomes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">No hay datos para mostrar</p>
              <p className="text-sm">Crea facturas para ver el reporte de ingresos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facturas
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pagado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pendiente
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencido
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientIncomes.map((income) => {
                    const total = income.totalPaid + income.totalPending + income.totalOverdue;
                    return (
                      <tr key={income.client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{income.client.name}</div>
                          <div className="text-sm text-gray-500">{income.client.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900">{income.totalInvoices}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(income.totalPaid)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-yellow-600">
                            {formatCurrency(income.totalPending)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-red-600">
                            {formatCurrency(income.totalOverdue)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(total)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900" colSpan={2}>
                      TOTALES
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                      {formatCurrency(stats.totalIncome)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-yellow-600">
                      {formatCurrency(stats.totalPending)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                      {formatCurrency(stats.totalOverdue)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(stats.totalIncome + stats.totalPending + stats.totalOverdue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Recent Paid Invoices */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Facturas Pagadas Recientes</h2>
          </div>
          
          {invoices.filter(inv => inv.status === BillingStatus.PAID).length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">No hay facturas pagadas</p>
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
                      Fecha Emisión
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importe
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filterInvoicesByPeriod(invoices)
                    .filter(inv => inv.status === BillingStatus.PAID)
                    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
                    .slice(0, 10)
                    .map((invoice) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-green-600">{formatCurrency(invoice.total)}</div>
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

interface SummaryCardProps {
  title: string;
  subtitle: string;
  value: string;
  color: string;
  icon: string;
}

function SummaryCard({ title, subtitle, value, color, icon }: SummaryCardProps) {
  return (
    <div className={`${color} text-white overflow-hidden shadow rounded-lg`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-3xl">{icon}</div>
        </div>
        <div>
          <dt className="text-sm font-medium truncate opacity-90">{title}</dt>
          <dd className="text-xs opacity-75 mb-2">{subtitle}</dd>
          <dd className="text-2xl font-bold">{value}</dd>
        </div>
      </div>
    </div>
  );
}
