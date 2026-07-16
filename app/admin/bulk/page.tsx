// app/admin/bulk-import-export/page.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';


interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  total: number;
}

const supabase = createClient();

export default function BulkImportExportPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders'>('products');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setIsAuthenticated(!!session);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const toast = document.createElement('div');
    const colors = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500' };
    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const downloadTemplate = (entity: string) => {
    let data: any[] = [];
    const wb = XLSX.utils.book_new();

    switch (entity) {
      case 'products':
        data = [{
          title: 'Sample Product',
          slug: 'sample-product',
          description: 'Product description here',
          category: 'Electronics',
          sub_category: 'Smartphones',
          brand: 'Sample Brand',
          price: 999.99,
          compare_price: 1299.99,
          cost_price: 799.99,
          stock: 100,
          sku: 'SKU-001',
          thumbnail: 'https://example.com/image.jpg',
          is_featured: 'FALSE',
          is_active: 'TRUE',
          is_deal: 'FALSE',
          deal_discount: '',
          weight: 0.5,
          meta_title: 'Sample Product',
          meta_description: 'Description',
          meta_keywords: 'sample, product'
        }];
        break;

      case 'categories':
        data = [{
          name: 'Electronics',
          slug: 'electronics',
          description: 'All electronic devices',
          parent_slug: '',
          display_order: 1,
          is_active: 'TRUE',
          icon: 'smartphone',
          meta_title: 'Electronics',
          meta_description: 'Best electronics',
          meta_keywords: 'electronics, gadgets'
        }];
        break;

      case 'orders':
        data = [{
          order_number: 'ORD-2024-001',
          user_email: 'customer@example.com',
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'razorpay',
          subtotal: 999.99,
          discount: 100,
          shipping_fee: 50,
          tax: 118,
          total: 1067.99,
          coupon_code: '',
          shipping_fullName: 'John Doe',
          shipping_phone: '9876543210',
          shipping_addressLine1: '123 Main Street',
          shipping_addressLine2: 'Near Park',
          shipping_landmark: 'City Center',
          shipping_city: 'Mumbai',
          shipping_state: 'Maharashtra',
          shipping_pincode: '400001',
          shipping_country: 'India',
          tracking_carrier: 'FedEx',
          tracking_number: 'FX123456789',
          tracking_url: 'https://fedex.com/track/FX123456789',
          estimated_delivery: new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
          notes: 'Handle with care',
          admin_notes: 'Priority order',
          placed_at: new Date().toISOString()
        }];
        break;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        fill: { fgColor: { rgb: "1B2341" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    ws['!cols'] = Object.keys(data[0]).map(key => ({ wch: Math.max(key.length + 5, 15) }));

    XLSX.utils.book_append_sheet(wb, ws, entity.charAt(0).toUpperCase() + entity.slice(1));
    XLSX.writeFile(wb, `${entity}_template.xlsx`);
    showToast(`${entity} template downloaded`);
  };

  const importProduct = async (data: any) => {
    if (!data.title || !data.slug || !data.price) {
      throw new Error('Title, slug, and price are required');
    }

    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', data.slug)
      .maybeSingle();

    const productData = {
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      category: data.category || null,
      sub_category: data.sub_category || null,
      brand: data.brand || null,
      price: parseFloat(data.price) || 0,
      compare_price: data.compare_price ? parseFloat(data.compare_price) : 0,
      cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
      stock: parseInt(data.stock) || 0,
      sku: data.sku || null,
      thumbnail: data.thumbnail || '',
      is_featured: data.is_featured === 'TRUE' || data.is_featured === true,
      is_active: data.is_active !== 'FALSE' && data.is_active !== false,
      is_deal: data.is_deal === 'TRUE' || data.is_deal === true,
      deal_discount: data.deal_discount ? parseInt(data.deal_discount) : null,
      weight: data.weight ? parseFloat(data.weight) : null,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      meta_keywords: data.meta_keywords || null,
    };

    if (existing) {
      const { error } = await supabase.from('products').update(productData).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('products').insert(productData);
      if (error) throw error;
    }
  };

  const importCategory = async (data: any) => {
    if (!data.name || !data.slug) {
      throw new Error('Name and slug are required');
    }

    let parent_id = null;
    if (data.parent_slug && data.parent_slug.trim() !== '') {
      const { data: parent } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', data.parent_slug.trim())
        .maybeSingle();
      parent_id = parent?.id || null;
    }

    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', data.slug)
      .maybeSingle();

    const categoryData = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      parent_id: parent_id,
      display_order: parseInt(data.display_order) || 0,
      is_active: data.is_active !== 'FALSE' && data.is_active !== false,
      icon: data.icon || null,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      meta_keywords: data.meta_keywords || null,
    };

    if (existing) {
      const { error } = await supabase.from('categories').update(categoryData).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('categories').insert(categoryData);
      if (error) throw error;
    }
  };

  const importOrder = async (data: any) => {
    if (!data.order_number) {
      throw new Error('Order number is required');
    }

    // Build shipping_address with camelCase keys matching your database
    const shippingAddress = {
      fullName: data.shipping_fullName || data.shipping_full_name || 'Customer',
      phone: data.shipping_phone || '',
      addressLine1: data.shipping_addressLine1 || data.shipping_line1 || '',
      addressLine2: data.shipping_addressLine2 || data.shipping_line2 || '',
      city: data.shipping_city || '',
      state: data.shipping_state || '',
      pincode: data.shipping_pincode || '',
      country: data.shipping_country || 'India',
    };

    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', data.order_number)
      .maybeSingle();

    const orderData = {
      order_number: data.order_number,
      status: data.status || 'pending',
      payment_status: data.payment_status || 'pending',
      payment_method: data.payment_method || null,
      subtotal: parseFloat(data.subtotal) || 0,
      discount: parseFloat(data.discount) || 0,
      shipping_fee: parseFloat(data.shipping_fee) || 0,
      tax: parseFloat(data.tax) || 0,
      total: parseFloat(data.total) || 0,
      coupon_code: data.coupon_code || null,
      shipping_address: shippingAddress,
      tracking_carrier: data.tracking_carrier || null,
      tracking_number: data.tracking_number || null,
      tracking_url: data.tracking_url || null,
      estimated_delivery: data.estimated_delivery || null,
      notes: data.notes || null,
      admin_notes: data.admin_notes || null,
      placed_at: data.placed_at || new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase.from('orders').update(orderData).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('orders').insert(orderData);
      if (error) throw error;
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportProgress(0);
    setImportResult(null);
    setShowPreview(false);
    
    const result: ImportResult = { success: 0, failed: 0, errors: [], total: 0 };

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      if (jsonData.length === 0) {
        throw new Error('No data found in the file');
      }
      
      result.total = jsonData.length;
      
      for (let i = 0; i < jsonData.length; i++) {
        try {
          const row = jsonData[i] as any;
          
          switch (activeTab) {
            case 'products':
              await importProduct(row);
              break;
            case 'categories':
              await importCategory(row);
              break;
            case 'orders':
              await importOrder(row);
              break;
          }
          
          result.success++;
        } catch (error: any) {
          result.failed++;
          result.errors.push(`Row ${i + 2}: ${error.message || 'Unknown error'}`);
        }
        
        setImportProgress(Math.round(((i + 1) / jsonData.length) * 100));
        if (i < jsonData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      setImportResult(result);
      showToast(
        result.failed === 0 
          ? `Successfully imported all ${result.success} records!`
          : `Import completed: ${result.success} success, ${result.failed} failed`,
        result.failed === 0 ? 'success' : 'warning'
      );
    } catch (error: any) {
      showToast(`Import failed: ${error.message}`, 'error');
      setImportResult({ success: 0, failed: 1, errors: [error.message], total: 0 });
    } finally {
      setImporting(false);
    }
  };

  // FIXED EXPORT - Using camelCase keys that match your database
  const handleExport = async () => {
    setExporting(true);
    setDebugInfo('');
    
    try {
      let data: any[] = [];
      let fileName = '';
      
      switch (activeTab) {
        case 'products': {
          const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          data = (products || []).map(p => ({
            title: p.title || '',
            slug: p.slug || '',
            description: p.description || '',
            category: p.category || '',
            sub_category: p.sub_category || '',
            brand: p.brand || '',
            price: p.price || 0,
            compare_price: p.compare_price || 0,
            cost_price: p.cost_price || '',
            stock: p.stock || 0,
            sku: p.sku || '',
            thumbnail: p.thumbnail || '',
            is_featured: p.is_featured || false,
            is_active: p.is_active || false,
            is_deal: p.is_deal || false,
            deal_discount: p.deal_discount || '',
            weight: p.weight || '',
            meta_title: p.meta_title || '',
            meta_description: p.meta_description || '',
            meta_keywords: p.meta_keywords || '',
            created_at: p.created_at || '',
            updated_at: p.updated_at || ''
          }));
          fileName = 'products_export';
          break;
        }
          
        case 'categories': {
          const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });
          
          if (error) throw error;
          
          const parentIds = (categories || []).filter(c => c.parent_id).map(c => c.parent_id);
          let parentMap: Record<string, string> = {};
          
          if (parentIds.length > 0) {
            const { data: parents } = await supabase
              .from('categories')
              .select('id, slug')
              .in('id', parentIds);
            (parents || []).forEach(p => { parentMap[p.id] = p.slug; });
          }
          
          data = (categories || []).map(c => ({
            name: c.name || '',
            slug: c.slug || '',
            description: c.description || '',
            parent_slug: c.parent_id ? (parentMap[c.parent_id] || '') : '',
            display_order: c.display_order || 0,
            is_active: c.is_active || false,
            icon: c.icon || '',
            meta_title: c.meta_title || '',
            meta_description: c.meta_description || '',
            meta_keywords: c.meta_keywords || '',
            created_at: c.created_at || '',
            updated_at: c.updated_at || ''
          }));
          fileName = 'categories_export';
          break;
        }
          
        case 'orders': {
          const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) {
            setDebugInfo(prev => prev + `Error: ${JSON.stringify(error)}\n`);
            throw error;
          }
          
          if (!orders || orders.length === 0) {
            setDebugInfo(prev => prev + 'No orders found\n');
            showToast('No orders found', 'warning');
            setExporting(false);
            return;
          }
          
          setDebugInfo(prev => prev + `Found ${orders.length} orders\n`);
          
          // Get user emails
          const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
          let userMap: Record<string, string> = {};
          
          if (userIds.length > 0) {
            // Try profiles first
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, email')
              .in('id', userIds);
            
            if (profiles) {
              profiles.forEach(p => { userMap[p.id] = p.email || ''; });
            }
            
            // For missing users, try to get from auth.users via admin API
            const missingIds = userIds.filter(id => !userMap[id] || userMap[id] === '');
            if (missingIds.length > 0) {
              setDebugInfo(prev => prev + `${missingIds.length} users not in profiles, trying auth...\n`);
              
              try {
                // Try to get users from auth
                for (const uid of missingIds) {
                  const { data: { user } } = await supabase.auth.admin.getUserById(uid);
                  if (user?.email) {
                    userMap[uid] = user.email;
                    setDebugInfo(prev => prev + `Found email from auth for ${uid}: ${user.email}\n`);
                  }
                }
              } catch (authError) {
                setDebugInfo(prev => prev + `Auth lookup failed (may need admin privileges): ${authError}\n`);
              }
            }
          }
          
          // Process orders with CAMELCASE keys
          data = orders.map((order, index) => {
            let shipping: any = {};
            
            try {
              if (order.shipping_address) {
                if (typeof order.shipping_address === 'string') {
                  shipping = JSON.parse(order.shipping_address);
                } else if (typeof order.shipping_address === 'object') {
                  shipping = order.shipping_address;
                }
              }
            } catch (e) {
              setDebugInfo(prev => prev + `Row ${index}: Parse error: ${e}\n`);
            }
            
            const userEmail = order.user_id ? (userMap[order.user_id] || '') : '';
            
            if (index === 0) {
              setDebugInfo(prev => prev + `\nFirst order export:\n`);
              setDebugInfo(prev => prev + `  fullName: ${shipping.fullName || ''}\n`);
              setDebugInfo(prev => prev + `  addressLine1: ${shipping.addressLine1 || ''}\n`);
              setDebugInfo(prev => prev + `  phone: ${shipping.phone || ''}\n`);
              setDebugInfo(prev => prev + `  email: ${userEmail}\n`);
            }
            
            return {
              order_number: order.order_number || '',
              user_email: userEmail,
              user_id: order.user_id || '',
              status: order.status || '',
              payment_status: order.payment_status || '',
              payment_method: order.payment_method || '',
              subtotal: order.subtotal || 0,
              discount: order.discount || 0,
              shipping_fee: order.shipping_fee || 0,
              tax: order.tax || 0,
              total: order.total || 0,
              coupon_code: order.coupon_code || '',
              // CAMELCASE shipping fields matching your database
              shipping_fullName: shipping.fullName || '',
              shipping_phone: shipping.phone || '',
              shipping_addressLine1: shipping.addressLine1 || '',
              shipping_addressLine2: shipping.addressLine2 || '',
              shipping_city: shipping.city || '',
              shipping_state: shipping.state || '',
              shipping_pincode: shipping.pincode || '',
              shipping_country: shipping.country || 'India',
              // Tracking
              tracking_carrier: order.tracking_carrier || '',
              tracking_number: order.tracking_number || '',
              tracking_url: order.tracking_url || '',
              estimated_delivery: order.estimated_delivery || '',
              // Notes
              notes: order.notes || '',
              admin_notes: order.admin_notes || '',
              // Dates
              placed_at: order.placed_at || '',
              delivered_at: order.delivered_at || '',
              created_at: order.created_at || '',
              updated_at: order.updated_at || ''
            };
          });
          
          fileName = 'orders_export';
          break;
        }
      }

      if (data.length === 0) {
        showToast(`No ${activeTab} found to export`, 'warning');
        setExporting(false);
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
          fill: { fgColor: { rgb: "1B2341" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
      
      ws['!cols'] = Object.keys(data[0] || {}).map(key => ({
        wch: Math.min(Math.max(key.length + 5, 12), 50)
      }));

      XLSX.utils.book_append_sheet(wb, ws, activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showToast(`Successfully exported ${data.length} ${activeTab}`);
    } catch (error: any) {
      console.error('Export error:', error);
      setDebugInfo(prev => prev + `Error: ${error.message}\n`);
      showToast(`Export failed: ${error.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      showToast('Please upload an Excel file (.xlsx, .xls, or .csv)', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arr = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(arr, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        setPreviewData(jsonData.slice(0, 5));
        setShowPreview(true);
      } catch (err) {
        showToast('Failed to preview file', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    
    handleImport(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileSelect(fakeEvent);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access the Bulk Import/Export Manager</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .progress-bar { transition: width 0.3s ease-in-out; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Bulk Import / Export Manager
          </h1>
          <p className="text-gray-600 text-lg">Manage products, categories, and orders with Excel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              {['products', 'categories', 'orders'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab as any);
                    setImportResult(null);
                    setShowPreview(false);
                    setDebugInfo('');
                  }}
                  className={`flex-1 px-6 py-4 text-sm font-medium capitalize transition-all relative ${
                    activeTab === tab
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-3 mb-6">
              <button onClick={() => downloadTemplate(activeTab)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                📥 Download Template
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 shadow-md">
                {importing ? '⏳ Importing...' : '📤 Import from Excel'}
              </button>
              <button onClick={handleExport} disabled={exporting} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50">
                {exporting ? '⏳ Exporting...' : '💾 Export All Data'}
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} onClick={(e) => (e.target as HTMLInputElement).value = ''} />
            </div>

            {debugInfo && (
              <div className="mb-6 p-4 bg-gray-900 text-green-400 rounded-xl border border-gray-700 font-mono text-xs">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold text-sm text-white">🔍 Debug Info</h3>
                  <button onClick={() => setDebugInfo('')} className="text-gray-400 hover:text-white text-xs">Clear</button>
                </div>
                <pre className="whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">{debugInfo}</pre>
              </div>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="text-4xl mb-3">📁</div>
              <p className="text-gray-600 mb-2">Drag and drop your Excel file here</p>
              <p className="text-sm text-gray-400">Supports .xlsx, .xls, and .csv files</p>
            </div>

            {importing && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Importing {activeTab}...</span>
                  <span className="text-sm font-semibold text-blue-600">{importProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full progress-bar" style={{ width: `${importProgress}%` }} />
                </div>
              </div>
            )}

            {importResult && !importing && (
              <div className={`mb-6 p-4 rounded-xl border ${importResult.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <h3 className="font-semibold text-lg">{importResult.failed === 0 ? '✅ Import Successful!' : '⚠️ Import Completed with Errors'}</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">✓ {importResult.success} Success</span>
                  {importResult.failed > 0 && <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">✗ {importResult.failed} Failed</span>}
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Total: {importResult.total}</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-4 max-h-48 overflow-y-auto bg-white rounded-lg p-3 border">
                    {importResult.errors.map((err, i) => <p key={i} className="text-sm text-red-600 font-mono">{err}</p>)}
                  </div>
                )}
              </div>
            )}

            {showPreview && previewData.length > 0 && !importing && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">👁️ Data Preview (First {previewData.length} rows)</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        {Object.keys(previewData[0]).map(key => (
                          <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{key.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                              {val === null || val === undefined ? <span className="text-gray-400 italic">null</span> : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}