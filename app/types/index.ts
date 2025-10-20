// Client data structure
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string; // NIF/CIF
  createdAt: Date;
}

// Billing status enumeration
export enum BillingStatus {
  PAID = 'Pagado',
  PENDING = 'Pendiente',
  OVERDUE = 'Vencido'
}

// Invoice item structure
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Invoice data structure
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: Client;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // IVA percentage
  taxAmount: number;
  total: number;
  status: BillingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment/Income data structure
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  notes?: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalIncome: number;
  pendingAmount: number;
  overdueAmount: number;
}
