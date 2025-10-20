import { Client, Invoice, Payment } from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'facturaspro_clients',
  INVOICES: 'facturaspro_invoices',
  PAYMENTS: 'facturaspro_payments',
};

// Generic storage functions
export const saveToStorage = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return defaultValue;
};

// Client storage functions
export const saveClients = (clients: Client[]): void => {
  saveToStorage(STORAGE_KEYS.CLIENTS, clients);
};

export const getClients = (): Client[] => {
  return getFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
};

export const addClient = (client: Client): void => {
  const clients = getClients();
  clients.push(client);
  saveClients(clients);
};

export const updateClient = (updatedClient: Client): void => {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === updatedClient.id);
  if (index !== -1) {
    clients[index] = updatedClient;
    saveClients(clients);
  }
};

export const deleteClient = (clientId: string): void => {
  const clients = getClients();
  const filtered = clients.filter(c => c.id !== clientId);
  saveClients(filtered);
};

// Invoice storage functions
export const saveInvoices = (invoices: Invoice[]): void => {
  saveToStorage(STORAGE_KEYS.INVOICES, invoices);
};

export const getInvoices = (): Invoice[] => {
  return getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
};

export const addInvoice = (invoice: Invoice): void => {
  const invoices = getInvoices();
  invoices.push(invoice);
  saveInvoices(invoices);
};

export const updateInvoice = (updatedInvoice: Invoice): void => {
  const invoices = getInvoices();
  const index = invoices.findIndex(i => i.id === updatedInvoice.id);
  if (index !== -1) {
    invoices[index] = updatedInvoice;
    saveInvoices(invoices);
  }
};

export const deleteInvoice = (invoiceId: string): void => {
  const invoices = getInvoices();
  const filtered = invoices.filter(i => i.id !== invoiceId);
  saveInvoices(filtered);
};

// Payment storage functions
export const savePayments = (payments: Payment[]): void => {
  saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
};

export const getPayments = (): Payment[] => {
  return getFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
};

export const addPayment = (payment: Payment): void => {
  const payments = getPayments();
  payments.push(payment);
  savePayments(payments);
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
