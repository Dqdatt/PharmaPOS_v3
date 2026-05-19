import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// --- Types matching pos.html exactly ---
export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  importPrice: number;
  sellPrice: number;
  initialStock: number;
  totalIn: number;
  totalOut: number;
}

export interface CartItem {
  id: number;
  name: string;
  unit: string;
  price: number;
  qty: number;
}

export interface User {
  id: number;
  name: string;
  role: 'admin' | 'staff';
  pin: string;
}

export interface StaffLog {
  userId: number;
  name: string;
  role: string;
  loginTime: string;
  logoutTime: string | null;
}

export interface Invoice {
  id: string;
  time: string;
  employeeName: string;
  employeeId: number;
  customer: { name: string; phone: string };
  items: CartItem[];
  method: string;
  otherCosts: number;
  total: number;
  status?: string;
}

export interface PurchaseItem {
  productId: number;
  name: string;
  unit: string;
  qty: number;
  cost: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplier: string;
  note: string;
  items: PurchaseItem[];
  total: number;
}

interface PosContextType {
  // Loading state
  isLoadingData: boolean;

  // Auth
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  staffLogs: StaffLog[];
  setStaffLogs: React.Dispatch<React.SetStateAction<StaffLog[]>>;

  // Products & Cart
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;

  // Invoices & Purchases
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;

  // Customer screen
  isCustomerView: boolean;

  // Helpers
  getStock: (p: Product) => number;
  formatPrice: (val: number) => string;
  getNow: (includeSec?: boolean) => string;

  // Supabase Actions
  refreshData: () => Promise<void>;
  updateProductInDB: (product: Product) => Promise<void>;
  deleteProductFromDB: (id: number) => Promise<void>;
  addProductToDB: (product: Omit<Product, 'id'>) => Promise<void>;
  addInvoiceToDB: (invoice: Invoice, productsToUpdate: Product[]) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  addPurchaseToDB: (purchase: Purchase, productsToUpdate: Product[]) => Promise<void>;
  addStaffLogToDB: (log: StaffLog) => Promise<void>;
  updateStaffLogLogoutInDB: (userId: number, logoutTime: string) => Promise<void>;
  addUserToDB: (user: Omit<User, 'id'>) => Promise<void>;
  updateUserInDB: (user: User) => Promise<void>;
  deleteUserFromDB: (id: number) => Promise<void>;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export const PosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mediPosCurrentUser');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mediPosCurrentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mediPosCurrentUser');
    }
  }, [currentUser]);
  const [users, setUsers] = useState<User[]>([]);
  const [staffLogs, setStaffLogs] = useState<StaffLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const isCustomerView = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('view') === 'customer'
    : false;

  const getStock = (p: Product) => p.initialStock + p.totalIn - p.totalOut;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('vi-VN').format(val || 0) + ' ₫';

  const getNow = (includeSec = false) => {
    const now = new Date();
    return includeSec
      ? now.toLocaleString('vi-VN')
      : now.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // --- SUPABASE FETCH ---
  const refreshData = async () => {
    setIsLoadingData(true);
    try {
      // Users
      const { data: dbUsers } = await supabase.from('users').select('*').order('id', { ascending: true });
      if (dbUsers) {
        setUsers(dbUsers.map(u => ({ id: u.id, name: u.name, role: u.role, pin: u.pin })));
      }

      // Products
      const { data: dbProducts } = await supabase.from('products').select('*').order('id', { ascending: true });
      if (dbProducts) {
        setProducts(dbProducts.map(p => ({
          id: p.id, name: p.name, category: p.category, unit: p.unit,
          importPrice: Number(p.import_price), sellPrice: Number(p.sell_price),
          initialStock: p.initial_stock, totalIn: p.total_in, totalOut: p.total_out
        })));
      }

      // Staff Logs
      const { data: dbLogs } = await supabase.from('staff_logs').select('*').order('id', { ascending: true });
      if (dbLogs) {
        setStaffLogs(dbLogs.map(l => ({
          userId: l.user_id, name: l.name, role: l.role,
          loginTime: l.login_time, logoutTime: l.logout_time
        })));
      }

      // Invoices
      const { data: dbInvoices } = await supabase.from('invoices').select('*, invoice_items(*)').order('created_at', { ascending: false });
      if (dbInvoices) {
        setInvoices(dbInvoices.map(inv => ({
          id: inv.id, time: inv.time, employeeName: inv.employee_name, employeeId: inv.employee_id,
          customer: { name: inv.customer_name, phone: inv.customer_phone || '' },
          method: inv.method, otherCosts: Number(inv.other_costs), total: Number(inv.total),
          status: inv.status,
          items: (inv.invoice_items || []).map((i: any) => ({
            id: i.product_id, name: i.name, unit: i.unit, price: Number(i.price), qty: i.qty
          }))
        })));
      }

      // Purchases
      const { data: dbPurchases } = await supabase.from('purchases').select('*, purchase_items(*)').order('created_at', { ascending: false });
      if (dbPurchases) {
        setPurchases(dbPurchases.map(pur => ({
          id: pur.id, date: pur.date, supplier: pur.supplier, note: pur.note, total: Number(pur.total),
          items: (pur.purchase_items || []).map((i: any) => ({
            productId: i.product_id, name: i.name, unit: i.unit, cost: Number(i.cost), qty: i.qty
          }))
        })));
      }
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu từ Supabase:", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isCustomerView) {
      refreshData();
    }
  }, [isCustomerView]);

  // --- SUPABASE MUTATIONS ---
  const addProductToDB = async (product: Omit<Product, 'id'>) => {
    const { data, error } = await supabase.from('products').insert([{
      name: product.name, category: product.category, unit: product.unit,
      import_price: product.importPrice, sell_price: product.sellPrice,
      initial_stock: product.initialStock, total_in: product.totalIn, total_out: product.totalOut
    }]).select();
    if (error) throw error;
    if (data) {
      setProducts(prev => [...prev, {
        id: data[0].id, name: data[0].name, category: data[0].category, unit: data[0].unit,
        importPrice: Number(data[0].import_price), sellPrice: Number(data[0].sell_price),
        initialStock: data[0].initial_stock, totalIn: data[0].total_in, totalOut: data[0].total_out
      }]);
    }
  };

  const updateProductInDB = async (product: Product) => {
    const { error } = await supabase.from('products').update({
      name: product.name, category: product.category, unit: product.unit,
      import_price: product.importPrice, sell_price: product.sellPrice,
      initial_stock: product.initialStock, total_in: product.totalIn, total_out: product.totalOut
    }).eq('id', product.id);
    if (error) throw error;
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  };

  const deleteProductFromDB = async (id: number) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addInvoiceToDB = async (invoice: Invoice, productsToUpdate: Product[]) => {
    // Insert invoice
    const { error: invErr } = await supabase.from('invoices').insert([{
      id: invoice.id, time: invoice.time, employee_name: invoice.employeeName, employee_id: invoice.employeeId,
      customer_name: invoice.customer.name, customer_phone: invoice.customer.phone,
      method: invoice.method, other_costs: invoice.otherCosts, total: invoice.total
    }]);
    if (invErr) throw invErr;

    // Insert invoice items
    const itemsToInsert = invoice.items.map(i => ({
      invoice_id: invoice.id, product_id: i.id, name: i.name, unit: i.unit, price: i.price, qty: i.qty
    }));
    const { error: itmErr } = await supabase.from('invoice_items').insert(itemsToInsert);
    if (itmErr) throw itmErr;

    // Update products totalOut
    for (const p of productsToUpdate) {
      await supabase.from('products').update({ total_out: p.totalOut }).eq('id', p.id);
    }
    setInvoices(prev => [invoice, ...prev]);
    setProducts(productsToUpdate);
  };

  const deleteInvoice = async (id: string) => {
    // 1. Update invoice status in DB
    const { error } = await supabase.from('invoices').update({ status: 'deleted' }).eq('id', id);
    if (error) throw error;
    
    // 2. Find invoice
    const invoice = invoices.find(inv => inv.id === id);
    if (invoice) {
      // 3. Update products totalOut in DB and local
      const updatedProducts = [...products];
      for (const item of invoice.items) {
        const productIndex = updatedProducts.findIndex(p => p.id === item.id);
        if (productIndex !== -1) {
          const product = updatedProducts[productIndex];
          const newTotalOut = Math.max(0, product.totalOut - item.qty);
          await supabase.from('products').update({ total_out: newTotalOut }).eq('id', product.id);
          updatedProducts[productIndex] = { ...product, totalOut: newTotalOut };
        }
      }
      setProducts(updatedProducts);
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'deleted' } : inv));
    }
  };

  const addPurchaseToDB = async (purchase: Purchase, productsToUpdate: Product[]) => {
    // Insert purchase
    const { error: purErr } = await supabase.from('purchases').insert([{
      id: purchase.id, date: purchase.date, supplier: purchase.supplier, note: purchase.note, total: purchase.total
    }]);
    if (purErr) throw purErr;

    // Insert purchase items
    const itemsToInsert = purchase.items.map(i => ({
      purchase_id: purchase.id, product_id: i.productId, name: i.name, unit: i.unit, qty: i.qty, cost: i.cost
    }));
    const { error: itmErr } = await supabase.from('purchase_items').insert(itemsToInsert);
    if (itmErr) throw itmErr;

    // Update products totalIn and importPrice
    for (const p of productsToUpdate) {
      await supabase.from('products').update({ total_in: p.totalIn, import_price: p.importPrice }).eq('id', p.id);
    }
    setPurchases(prev => [purchase, ...prev]);
    setProducts(productsToUpdate);
  };

  const addStaffLogToDB = async (log: StaffLog) => {
    const { data, error } = await supabase.from('staff_logs').insert([{
      user_id: log.userId, name: log.name, role: log.role, login_time: log.loginTime, logout_time: log.logoutTime
    }]).select();
    if (error) throw error;
    if (data) {
      setStaffLogs(prev => [...prev, log]);
    }
  };

  const updateStaffLogLogoutInDB = async (userId: number, logoutTime: string) => {
    // Find latest log without logout time
    const log = staffLogs.slice().reverse().find(l => l.userId === userId && !l.logoutTime);
    if (log) {
      // In a real app we'd need the exact log ID, but here we can just update the most recent one for the user via DB query
      await supabase.from('staff_logs').update({ logout_time: logoutTime })
        .eq('user_id', userId).is('logout_time', null);
      
      setStaffLogs(prev => prev.map(l => (l === log ? { ...l, logoutTime } : l)));
    }
  };

  const addUserToDB = async (user: Omit<User, 'id'>) => {
    const { data, error } = await supabase.from('users').insert([{
      name: user.name, role: user.role, pin: user.pin
    }]).select();
    if (error) throw error;
    if (data) {
      setUsers(prev => [...prev, { id: data[0].id, name: data[0].name, role: data[0].role, pin: data[0].pin }]);
    }
  };

  const updateUserInDB = async (user: User) => {
    const { error } = await supabase.from('users').update({
      name: user.name, role: user.role, pin: user.pin
    }).eq('id', user.id);
    if (error) throw error;
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
  };

  const deleteUserFromDB = async (id: number) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <PosContext.Provider value={{
      isLoadingData,
      currentUser, setCurrentUser,
      users, setUsers,
      staffLogs, setStaffLogs,
      products, setProducts,
      cart, setCart,
      invoices, setInvoices,
      purchases, setPurchases,
      isCustomerView,
      getStock, formatPrice, getNow,
      refreshData, addProductToDB, updateProductInDB, deleteProductFromDB, addInvoiceToDB, deleteInvoice, addPurchaseToDB,
      addStaffLogToDB, updateStaffLogLogoutInDB, addUserToDB, updateUserInDB, deleteUserFromDB
    }}>
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
};
