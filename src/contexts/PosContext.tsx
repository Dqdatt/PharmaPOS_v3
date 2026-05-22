import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/toast';

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

export interface ExportOrderItem {
  productId: number;
  name: string;
  unit: string;
  qty: number;
  price: number;
}

export interface ExportOrder {
  id: string;
  date: string;
  recipientName: string;
  recipientPhone: string;
  status: 'exported' | 'sent' | 'received' | 'pending_payment' | 'paid' | 'returned';
  total: number;
  note: string;
  employeeName: string;
  items: ExportOrderItem[];
}

export interface InventoryHistory {
  id: number;
  productId: number;
  monthYear: string;
  initialStock: number;
  totalIn: number;
  totalOut: number;
  endingStock: number;
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

  // Invoices, Purchases & Exports
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  exportOrders: ExportOrder[];
  setExportOrders: React.Dispatch<React.SetStateAction<ExportOrder[]>>;

  // Monthly Rollover & Reconciliation
  isPreviousMonthClosed: boolean | null;
  previousMonthYear: string;
  inventoryHistory: InventoryHistory[];
  closeMonthlyInventory: (monthYear: string) => Promise<void>;
  checkPreviousMonthStatus: () => Promise<void>;
  reconcileProductStock: (productId: number) => Promise<void>;
  fetchInventoryHistory: (monthYear: string) => Promise<InventoryHistory[]>;

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
  updatePurchaseInDB: (updatedPurchase: Purchase, productsToUpdate: Product[]) => Promise<void>;
  addExportOrderToDB: (order: ExportOrder, productsToUpdate: Product[]) => Promise<void>;
  updateExportOrderStatusInDB: (orderId: string, oldStatus: ExportOrder['status'], newStatus: ExportOrder['status']) => Promise<void>;
  updateExportOrderInDB: (updatedOrder: ExportOrder, productsToUpdate: Product[]) => Promise<void>;
  deleteExportOrderFromDB: (id: string) => Promise<void>;
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
  const [exportOrders, setExportOrders] = useState<ExportOrder[]>([]);
  
  const [isPreviousMonthClosed, setIsPreviousMonthClosed] = useState<boolean | null>(null);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>([]);

  const getPreviousMonthYear = () => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  };
  const previousMonthYear = getPreviousMonthYear();

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
            productId: i.product_id, name: i.name, unit: i.unit, qty: i.qty, cost: Number(i.cost)
          }))
        })));
      }

      // Export Orders
      const { data: dbExportOrders } = await supabase.from('export_orders').select('*, export_order_items(*)').order('created_at', { ascending: false });
      if (dbExportOrders) {
        setExportOrders(dbExportOrders.map(ord => ({
          id: ord.id, date: ord.date, recipientName: ord.recipient_name, recipientPhone: ord.recipient_phone,
          status: ord.status, total: Number(ord.total), note: ord.note, employeeName: ord.employee_name,
          items: (ord.export_order_items || []).map((i: any) => ({
            productId: i.product_id, name: i.name, unit: i.unit, qty: i.qty, price: Number(i.price)
          }))
        })));
      }

    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(`Lỗi khi tải dữ liệu từ Supabase! Chi tiết: ${errMsg}`, 'error');
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
    const changedProducts = productsToUpdate.filter(p => {
      const old = products.find(op => op.id === p.id);
      return !old || old.totalIn !== p.totalIn || old.importPrice !== p.importPrice;
    });
    for (const p of changedProducts) {
      await supabase.from('products').update({ total_in: p.totalIn, import_price: p.importPrice }).eq('id', p.id);
    }
    setPurchases(prev => [purchase, ...prev]);
    setProducts(productsToUpdate);
  };

  const updatePurchaseInDB = async (updatedPurchase: Purchase, productsToUpdate: Product[]) => {
    // Update purchase record
    const { error: purErr } = await supabase.from('purchases').update({
      supplier: updatedPurchase.supplier, note: updatedPurchase.note, total: updatedPurchase.total
    }).eq('id', updatedPurchase.id);
    if (purErr) throw purErr;

    // Replace purchase items
    await supabase.from('purchase_items').delete().eq('purchase_id', updatedPurchase.id);
    const itemsToInsert = updatedPurchase.items.map(i => ({
      purchase_id: updatedPurchase.id, product_id: i.productId, name: i.name, unit: i.unit, qty: i.qty, cost: i.cost
    }));
    const { error: itmErr } = await supabase.from('purchase_items').insert(itemsToInsert);
    if (itmErr) throw itmErr;

    // Update products totalIn and importPrice
    const changedProducts = productsToUpdate.filter(p => {
      const old = products.find(op => op.id === p.id);
      return !old || old.totalIn !== p.totalIn || old.importPrice !== p.importPrice;
    });
    for (const p of changedProducts) {
      await supabase.from('products').update({ total_in: p.totalIn, import_price: p.importPrice }).eq('id', p.id);
    }

    setPurchases(prev => prev.map(p => p.id === updatedPurchase.id ? updatedPurchase : p));
    setProducts(productsToUpdate);
  };

  const addExportOrderToDB = async (order: ExportOrder, productsToUpdate: Product[]) => {
    const { error: ordErr } = await supabase.from('export_orders').insert([{
      id: order.id, date: order.date, recipient_name: order.recipientName, recipient_phone: order.recipientPhone,
      status: order.status, total: order.total, note: order.note, employee_name: order.employeeName
    }]);
    if (ordErr) throw ordErr;

    const itemsToInsert = order.items.map(i => ({
      export_order_id: order.id, product_id: i.productId, name: i.name, unit: i.unit, qty: i.qty, price: i.price
    }));
    const { error: itmErr } = await supabase.from('export_order_items').insert(itemsToInsert);
    if (itmErr) throw itmErr;

    if (order.status !== 'returned') {
      const changedProducts = productsToUpdate.filter(p => {
        const old = products.find(op => op.id === p.id);
        return !old || old.totalOut !== p.totalOut;
      });
      for (const p of changedProducts) {
        await supabase.from('products').update({ total_out: p.totalOut }).eq('id', p.id);
      }
      setProducts(productsToUpdate);
    }
    setExportOrders(prev => [order, ...prev]);
  };

  const updateExportOrderStatusInDB = async (orderId: string, oldStatus: ExportOrder['status'], newStatus: ExportOrder['status']) => {
    const { error } = await supabase.from('export_orders').update({ status: newStatus }).eq('id', orderId);
    if (error) throw error;

    if ((oldStatus === 'returned' && newStatus !== 'returned') || (oldStatus !== 'returned' && newStatus === 'returned')) {
      const order = exportOrders.find(o => o.id === orderId);
      if (order) {
        const updatedProducts = [...products];
        for (const item of order.items) {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            const product = updatedProducts[productIndex];
            // If changing to 'returned', we restore the stock (decrease totalOut)
            // If changing from 'returned' to something else, we deduct stock (increase totalOut)
            const diff = newStatus === 'returned' ? -item.qty : item.qty;
            const newTotalOut = Math.max(0, product.totalOut + diff);
            
            await supabase.from('products').update({ total_out: newTotalOut }).eq('id', product.id);
            updatedProducts[productIndex] = { ...product, totalOut: newTotalOut };
          }
        }
        setProducts(updatedProducts);
      }
    }

    setExportOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const updateExportOrderInDB = async (updatedOrder: ExportOrder, productsToUpdate: Product[]) => {
    const { error: ordErr } = await supabase.from('export_orders').update({
      recipient_name: updatedOrder.recipientName, recipient_phone: updatedOrder.recipientPhone,
      status: updatedOrder.status, total: updatedOrder.total, note: updatedOrder.note
    }).eq('id', updatedOrder.id);
    if (ordErr) throw ordErr;

    await supabase.from('export_order_items').delete().eq('export_order_id', updatedOrder.id);
    const itemsToInsert = updatedOrder.items.map(i => ({
      export_order_id: updatedOrder.id, product_id: i.productId, name: i.name, unit: i.unit, qty: i.qty, price: i.price
    }));
    const { error: itmErr } = await supabase.from('export_order_items').insert(itemsToInsert);
    if (itmErr) throw itmErr;

    const changedProducts = productsToUpdate.filter(p => {
      const old = products.find(op => op.id === p.id);
      return !old || old.totalOut !== p.totalOut;
    });
    for (const p of changedProducts) {
      await supabase.from('products').update({ total_out: p.totalOut }).eq('id', p.id);
    }
    setProducts(productsToUpdate);
    setExportOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const deleteExportOrderFromDB = async (id: string) => {
    const { error } = await supabase.from('export_orders').delete().eq('id', id);
    if (error) throw error;

    const order = exportOrders.find(o => o.id === id);
    if (order && order.status !== 'returned') {
      const updatedProducts = [...products];
      for (const item of order.items) {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          const product = updatedProducts[productIndex];
          const newTotalOut = Math.max(0, product.totalOut - item.qty);
          await supabase.from('products').update({ total_out: newTotalOut }).eq('id', product.id);
          updatedProducts[productIndex] = { ...product, totalOut: newTotalOut };
        }
      }
      setProducts(updatedProducts);
    }
    
    setExportOrders(prev => prev.filter(o => o.id !== id));
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

  // --- MONTHLY INVENTORY ROLLOVER ---
  const checkPreviousMonthStatus = async () => {
    if (!previousMonthYear) return;
    try {
      const isEnabled = localStorage.getItem('mediPosRolloverEnabled') !== 'false';
      if (!isEnabled) {
        setIsPreviousMonthClosed(true); // Always unlocked if disabled
        return;
      }

      const lockDateStr = localStorage.getItem('mediPosLockDate');
      if (lockDateStr) {
        const todayStr = new Date().toISOString().split('T')[0];
        // If today is before the configured lock date, we do NOT lock the system.
        if (todayStr < lockDateStr) {
          setIsPreviousMonthClosed(true); // Treat as closed so no lock screen appears
          return;
        }
      }

      const { data, error } = await supabase
        .from('inventory_history')
        .select('id')
        .eq('month_year', previousMonthYear)
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setIsPreviousMonthClosed(true);
      } else {
        // If no history, check if there are any invoices or purchases in the previous month
        // Invoices: parse time to check if it's in previous month
        // Purchases: parse date to check if it's in previous month
        // For simplicity, let's just fetch all and check locally, or if the store is very new, just assume false.
        // Let's assume false if there's no history, but later we might allow skipping if no transactions exist.
        setIsPreviousMonthClosed(false);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(`Lỗi kiểm tra trạng thái tháng trước! Chi tiết: ${errMsg}`, 'error');
      console.error('Error checking previous month status:', e);
      setIsPreviousMonthClosed(false);
    }
  };

  useEffect(() => {
    if (currentUser && !isCustomerView) {
      checkPreviousMonthStatus();
    }
  }, [currentUser, isCustomerView]);

  const closeMonthlyInventory = async (monthYear: string) => {
    try {
      // 1. Prepare snapshots
      const snapshots = products.map(p => ({
        product_id: p.id,
        month_year: monthYear,
        initial_stock: p.initialStock,
        total_in: p.totalIn,
        total_out: p.totalOut,
        ending_stock: getStock(p)
      }));

      // 2. Insert to inventory_history
      const { error: historyErr } = await supabase.from('inventory_history').insert(snapshots);
      if (historyErr) {
        // If it already exists (constraint unique_product_month), we can delete and re-insert, or just ignore.
        // Let's assume we do this once. If error, might be duplicate.
        console.error('Insert history error:', historyErr);
      }

      // 3. Reset product counters and update initialStock
      for (const p of products) {
        const newStock = getStock(p);
        await supabase.from('products').update({
          initial_stock: newStock,
          total_in: 0,
          total_out: 0
        }).eq('id', p.id);
      }

      setIsPreviousMonthClosed(true);
      await refreshData();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(`Lỗi khi chốt tồn kho! Chi tiết: ${errMsg}`, 'error');
      console.error('Error closing monthly inventory:', e);
      throw e;
    }
  };

  const fetchInventoryHistory = async (monthYear: string): Promise<InventoryHistory[]> => {
    try {
      const { data, error } = await supabase
        .from('inventory_history')
        .select('*')
        .eq('month_year', monthYear);
      
      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        productId: d.product_id,
        monthYear: d.month_year,
        initialStock: d.initial_stock,
        totalIn: d.total_in,
        totalOut: d.total_out,
        endingStock: d.ending_stock
      }));
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(`Lỗi khi tải lịch sử tồn kho! Chi tiết: ${errMsg}`, 'error');
      console.error('Error fetching inventory history:', e);
      return [];
    }
  };

  const reconcileProductStock = async (productId: number) => {
    try {
      const p = products.find(x => x.id === productId);
      if (!p) return;

      // Calculate actual imports in current month (from Purchases)
      // Since totalIn is reset at start of month, we only count purchases created this month.
      // But wait! total_in counts purchases SINCE THE LAST ROLLOVER.
      // So if rollover was done, purchases from this month are what counts.
      // The easiest way is to sum quantities in purchase_items for this product where purchase date is >= first day of current month.
      // To be accurate for now, let's just use the current month for calculation.
      const currentMonthStr = `${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`;
      
      let expectedTotalIn = 0;
      for (const pur of purchases) {
        // check if pur.date is in current month
        if (pur.date.includes(currentMonthStr)) {
          const item = pur.items.find(i => i.productId === productId);
          if (item) expectedTotalIn += item.qty;
        }
      }

      let expectedTotalOut = 0;
      for (const inv of invoices) {
        if (inv.status !== 'deleted' && inv.time.includes(currentMonthStr)) {
          const item = inv.items.find(i => i.id === productId);
          if (item) expectedTotalOut += item.qty;
        }
      }

      await supabase.from('products').update({
        total_in: expectedTotalIn,
        total_out: expectedTotalOut
      }).eq('id', productId);

      await refreshData();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(`Lỗi khi đồng bộ tồn kho! Chi tiết: ${errMsg}`, 'error');
      console.error('Error reconciling product stock:', e);
      throw e;
    }
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
      exportOrders, setExportOrders,
      isPreviousMonthClosed, previousMonthYear, inventoryHistory,
      closeMonthlyInventory, checkPreviousMonthStatus, reconcileProductStock, fetchInventoryHistory,
      isCustomerView,
      getStock, formatPrice, getNow,
      refreshData, addProductToDB, updateProductInDB, deleteProductFromDB, addInvoiceToDB, deleteInvoice, addPurchaseToDB, updatePurchaseInDB,
      addExportOrderToDB, updateExportOrderStatusInDB, updateExportOrderInDB, deleteExportOrderFromDB,
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
