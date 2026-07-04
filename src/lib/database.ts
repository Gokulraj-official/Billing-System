import { createClient } from '@supabase/supabase-js';

// Types representing the database tables
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  address?: string; // Optional field
}

export interface InvoiceItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  member_id: string | null;
  invoice_no: string;
  date: string; // YYYY-MM-DD
  billing_time?: string; // HH:MM:SS AM/PM
  total: number;
  items: InvoiceItem[];
}

// Check for Supabase environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Mock Seed Data for LocalStorage Fallback (Cleared for live database connection)
const MOCK_PRODUCTS: Product[] = [];
const MOCK_MEMBERS: Member[] = [];

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const MOCK_INVOICES: Invoice[] = [];

// Helper to check if running in client-side browser
const isClient = typeof window !== 'undefined';

// Local Storage Helper functions
function getLocalStorage<T>(key: string, defaultVal: T): T {
  if (!isClient) return defaultVal;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(stored) as T;
  } catch (e) {
    return defaultVal;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Clear mock cache to ensure clean Supabase connection
export function seedLocalStorageIfEmpty() {
  if (!isClient) return;
  // Wiping any old cached mock data to avoid merging issues with live Supabase data
  localStorage.removeItem('hl_products');
  localStorage.removeItem('hl_members');
  localStorage.removeItem('hl_invoices');
}

// Initialize seed data (Wipes old local mock data cache)
if (isClient) {
  seedLocalStorageIfEmpty();
}

// ----------------------------------------------------
// DATABASE API INTERFACE
// ----------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Supabase getProducts failed:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        error: err
      });
      throw err;
    }
  }
  return getLocalStorage<Product[]>('hl_products', MOCK_PRODUCTS);
}

export async function createProduct(name: string, price: number, stock: number): Promise<Product> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{ name, price, stock }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase createProduct failed, falling back to localStorage', err);
    }
  }
  const products = getLocalStorage<Product[]>('hl_products', MOCK_PRODUCTS);
  const newProduct: Product = {
    id: 'p-' + Math.random().toString(36).substr(2, 9),
    name,
    price,
    stock
  };
  products.push(newProduct);
  setLocalStorage('hl_products', products);
  return newProduct;
}

export async function updateProduct(id: string, name: string, price: number, stock: number): Promise<Product> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ name, price, stock })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase updateProduct failed, falling back to localStorage', err);
    }
  }
  const products = getLocalStorage<Product[]>('hl_products', MOCK_PRODUCTS);
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    products[idx] = { id, name, price, stock };
    setLocalStorage('hl_products', products);
    return products[idx];
  }
  throw new Error("Product not found");
}

export async function deleteProduct(id: string): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Supabase deleteProduct failed, falling back to localStorage', err);
    }
  }
  const products = getLocalStorage<Product[]>('hl_products', MOCK_PRODUCTS);
  const filtered = products.filter(p => p.id !== id);
  setLocalStorage('hl_products', filtered);
}

export async function updateProductStock(id: string, newStock: number): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Supabase updateProductStock failed, falling back to localStorage', err);
    }
  }
  const products = getLocalStorage<Product[]>('hl_products', MOCK_PRODUCTS);
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    products[idx].stock = newStock;
    setLocalStorage('hl_products', products);
  }
}

export async function getMembers(): Promise<Member[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('members').select('*').order('name');
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Supabase getMembers failed:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        error: err
      });
      throw err;
    }
  }
  return getLocalStorage<Member[]>('hl_members', MOCK_MEMBERS);
}

export async function createMember(name: string, phone: string, address?: string): Promise<Member> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('members')
        .insert([{ name, phone, address }])
        .select()
        .single();
      if (!error) return data;
      
      // If address column does not exist (PostgreSQL error 42703: undefined_column), retry without address
      if (error.code === '42703') {
        console.warn('Supabase members table has no address column, inserting without it');
        const { data: retryData, error: retryError } = await supabase
          .from('members')
          .insert([{ name, phone }])
          .select()
          .single();
        if (retryError) throw retryError;
        return {
          ...retryData,
          address // attach address locally
        };
      }
      throw error;
    } catch (err) {
      console.warn('Supabase createMember failed, falling back to localStorage', err);
    }
  }
  const members = getLocalStorage<Member[]>('hl_members', MOCK_MEMBERS);
  const newMember: Member = {
    id: 'm-' + Math.random().toString(36).substr(2, 9),
    name,
    phone,
    address
  };
  members.push(newMember);
  setLocalStorage('hl_members', members);
  return newMember;
}

export async function updateMember(id: string, name: string, phone: string, address?: string): Promise<Member> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('members')
        .update({ name, phone, address })
        .eq('id', id)
        .select()
        .single();
      if (!error) return data;
      
      // If address column does not exist (PostgreSQL error 42703: undefined_column), retry without address
      if (error.code === '42703') {
        const { data: retryData, error: retryError } = await supabase
          .from('members')
          .update({ name, phone })
          .eq('id', id)
          .select()
          .single();
        if (retryError) throw retryError;
        return {
          ...retryData,
          address
        };
      }
      throw error;
    } catch (err) {
      console.warn('Supabase updateMember failed, falling back to localStorage', err);
    }
  }
  const members = getLocalStorage<Member[]>('hl_members', MOCK_MEMBERS);
  const idx = members.findIndex(m => m.id === id);
  if (idx !== -1) {
    members[idx] = { id, name, phone, address };
    setLocalStorage('hl_members', members);
    return members[idx];
  }
  throw new Error("Member not found");
}

export async function deleteMember(id: string): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Supabase deleteMember failed, falling back to localStorage', err);
    }
  }
  const members = getLocalStorage<Member[]>('hl_members', MOCK_MEMBERS);
  const filtered = members.filter(m => m.id !== id);
  setLocalStorage('hl_members', filtered);
}

export async function getInvoices(): Promise<Invoice[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('invoices').select('*').order('invoice_no', { ascending: false });
      if (error) throw error;
      return (data || []).map(row => {
        let itemsList: InvoiceItem[] = [];
        let billingTime = '';
        if (row.items && typeof row.items === 'object') {
          if (Array.isArray(row.items)) {
            itemsList = row.items;
          } else if (row.items.items) {
            itemsList = row.items.items;
            billingTime = row.items.billing_time || '';
          }
        }
        return {
          ...row,
          items: itemsList,
          billing_time: billingTime
        };
      });
    } catch (err: any) {
      console.error('Supabase getInvoices failed:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        error: err
      });
      throw err;
    }
  }
  return getLocalStorage<Invoice[]>('hl_invoices', MOCK_INVOICES);
}

export async function createInvoice(memberId: string | null, total: number, items: InvoiceItem[]): Promise<Invoice> {
  // Generate invoice number e.g. HL-YYYYMMDD-XXX
  const dateStr = getTodayDateString().replace(/-/g, '');
  const invoices = getLocalStorage<Invoice[]>('hl_invoices', MOCK_INVOICES);
  const countToday = invoices.filter(inv => inv.date === getTodayDateString()).length + 1;
  const invoiceNo = `HL-${dateStr}-${String(countToday).padStart(3, '0')}`;

  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Validate if memberId is a valid UUID (prevents mock ID database parsing crashes)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (memberId !== null && !uuidRegex.test(memberId)) {
    throw new Error("This customer profile was created offline. Please register them in the 'Members' tab first, then select them again to bill.");
  }

  if (supabase) {
    try {
      const itemsPayload = {
        items: items,
        billing_time: timeStr
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          member_id: memberId,
          invoice_no: invoiceNo,
          total,
          items: itemsPayload as any // Save payload in jsonb
        }])
        .select()
        .single();
      if (error) throw error;
      
      return {
        ...data,
        items: items,
        billing_time: timeStr
      };
    } catch (err: any) {
      console.error('Supabase createInvoice failed:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        error: err
      });
      throw err;
    }
  }

  const newInvoice: Invoice = {
    id: 'inv-' + Math.random().toString(36).substr(2, 9),
    member_id: memberId,
    invoice_no: invoiceNo,
    date: getTodayDateString(),
    billing_time: timeStr,
    total,
    items
  };
  invoices.unshift(newInvoice); // Add to beginning
  setLocalStorage('hl_invoices', invoices);

  // Update stocks for products
  const products = getLocalStorage<Product[]>('hl_products', MOCK_PRODUCTS);
  items.forEach(item => {
    const prod = products.find(p => p.id === item.product_id);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
    }
  });
  setLocalStorage('hl_products', products);

  return newInvoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return;
    } catch (err: any) {
      console.error('Supabase deleteInvoice failed:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        error: err
      });
      throw err;
    }
  }
  const invoices = getLocalStorage<Invoice[]>('hl_invoices', MOCK_INVOICES);
  const filtered = invoices.filter(inv => inv.id !== id);
  setLocalStorage('hl_invoices', filtered);
}
