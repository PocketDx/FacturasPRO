import { Invoice, BillingStatus, DashboardStats } from '../types';

export const calculateDashboardStats = (invoices: Invoice[]): DashboardStats => {
  const stats: DashboardStats = {
    totalInvoices: invoices.length,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalIncome: 0,
    pendingAmount: 0,
    overdueAmount: 0,
  };

  const now = new Date();

  invoices.forEach(invoice => {
    switch (invoice.status) {
      case BillingStatus.PAID:
        stats.paidInvoices++;
        stats.totalIncome += invoice.total;
        break;
      case BillingStatus.PENDING:
        stats.pendingInvoices++;
        stats.pendingAmount += invoice.total;
        // Check if it should be overdue
        if (new Date(invoice.dueDate) < now) {
          stats.overdueInvoices++;
          stats.overdueAmount += invoice.total;
          stats.pendingInvoices--;
          stats.pendingAmount -= invoice.total;
        }
        break;
      case BillingStatus.OVERDUE:
        stats.overdueInvoices++;
        stats.overdueAmount += invoice.total;
        break;
    }
  });

  return stats;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('es-ES').format(new Date(date));
};
