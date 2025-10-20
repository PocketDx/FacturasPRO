'use client';

import { useEffect, useState } from 'react';
import { DashboardStats } from '../types';
import { getInvoices } from '../utils/storage';
import { calculateDashboardStats, formatCurrency } from '../utils/calculations';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalIncome: 0,
    pendingAmount: 0,
    overdueAmount: 0,
  });

  useEffect(() => {
    const invoices = getInvoices();
    const calculatedStats = calculateDashboardStats(invoices);
    setStats(calculatedStats);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">FacturasPRO</h1>
          <p className="mt-1 text-sm text-gray-600">Sistema de Facturación para Autónomos</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Facturas"
            value={stats.totalInvoices.toString()}
            icon="📄"
            color="bg-blue-50 text-blue-700"
          />
          <StatCard
            title="Facturas Pagadas"
            value={stats.paidInvoices.toString()}
            icon="✓"
            color="bg-green-50 text-green-700"
          />
          <StatCard
            title="Facturas Pendientes"
            value={stats.pendingInvoices.toString()}
            icon="⏱"
            color="bg-yellow-50 text-yellow-700"
          />
          <StatCard
            title="Facturas Vencidas"
            value={stats.overdueInvoices.toString()}
            icon="⚠"
            color="bg-red-50 text-red-700"
          />
        </div>

        {/* Income Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          <IncomeCard
            title="Ingresos Totales"
            amount={stats.totalIncome}
            color="bg-green-500"
          />
          <IncomeCard
            title="Monto Pendiente"
            amount={stats.pendingAmount}
            color="bg-yellow-500"
          />
          <IncomeCard
            title="Monto Vencido"
            amount={stats.overdueAmount}
            color="bg-red-500"
          />
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <NavigationCard
            title="Gestión de Clientes"
            description="Administra tu cartera de clientes"
            icon="👥"
            href="/clientes"
          />
          <NavigationCard
            title="Facturas"
            description="Crea y gestiona facturas"
            icon="📑"
            href="/facturas"
          />
          <NavigationCard
            title="Ingresos"
            description="Controla tus ingresos y pagos"
            icon="💰"
            href="/ingresos"
          />
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${color} rounded-md p-3 text-2xl`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-3xl font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IncomeCardProps {
  title: string;
  amount: number;
  color: string;
}

function IncomeCard({ title, amount, color }: IncomeCardProps) {
  return (
    <div className={`${color} overflow-hidden shadow rounded-lg text-white`}>
      <div className="p-5">
        <div className="flex flex-col">
          <dt className="text-sm font-medium truncate opacity-90">{title}</dt>
          <dd className="mt-2 text-3xl font-bold">{formatCurrency(amount)}</dd>
        </div>
      </div>
    </div>
  );
}

interface NavigationCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
}

function NavigationCard({ title, description, icon, href }: NavigationCardProps) {
  return (
    <Link href={href} className="block">
      <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-4xl">{icon}</div>
            <div className="ml-5 w-0 flex-1">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
            <div className="flex-shrink-0">
              <span className="text-gray-400 text-2xl">→</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
