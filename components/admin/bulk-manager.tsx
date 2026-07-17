"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"
import { UploadCloud, Download, FileDown, X, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImportResult {
  success: number
  failed: number
  errors: string[]
  total: number
}

type TabType = "products" | "categories" | "orders"

const supabase = createClient()

export function BulkManager() {
  const [activeTab, setActiveTab] = useState<TabType>("products")
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const TABS: { key: TabType; label: string }[] = [
    { key: "products", label: "Products" },
    { key: "categories", label: "Categories" },
    { key: "orders", label: "Orders" },
  ]

  // ── Template download ──────────────────────────────────────────────────────
  const downloadTemplate = (entity: string) => {
    let data: any[] = []
    const wb = XLSX.utils.book_new()

    switch (entity) {
      case "products":
        data = [{ title: "Sample Product", slug: "sample-product", description: "Product description here", category: "Electronics", sub_category: "Smartphones", brand: "Sample Brand", price: 999.99, compare_price: 1299.99, cost_price: 799.99, stock: 100, sku: "SKU-001", thumbnail: "https://example.com/image.jpg", is_featured: "FALSE", is_active: "TRUE", is_deal: "FALSE", deal_discount: "", weight: 0.5, meta_title: "Sample Product", meta_description: "Description", meta_keywords: "sample, product" }]
        break
      case "categories":
        data = [{ name: "Electronics", slug: "electronics", description: "All electronic devices", parent_slug: "", display_order: 1, is_active: "TRUE", icon: "smartphone", meta_title: "Electronics", meta_description: "Best electronics", meta_keywords: "electronics, gadgets" }]
        break
      case "orders":
        data = [{ order_number: "ORD-2024-001", user_email: "customer@example.com", status: "pending", payment_status: "pending", payment_method: "razorpay", subtotal: 999.99, discount: 100, shipping_fee: 50, tax: 118, total: 1067.99, coupon_code: "", shipping_fullName: "John Doe", shipping_phone: "9876543210", shipping_addressLine1: "123 Main Street", shipping_addressLine2: "Near Park", shipping_city: "Mumbai", shipping_state: "Maharashtra", shipping_pincode: "400001", shipping_country: "India", tracking_carrier: "FedEx", tracking_number: "FX123456789", tracking_url: "https://fedex.com/track/FX123456789", estimated_delivery: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0], notes: "Handle with care", admin_notes: "Priority order", placed_at: new Date().toISOString() }]
        break
    }

    const ws = XLSX.utils.json_to_sheet(data)
    ws["!cols"] = Object.keys(data[0]).map((key) => ({ wch: Math.max(key.length + 5, 15) }))
    XLSX.utils.book_append_sheet(wb, ws, entity.charAt(0).toUpperCase() + entity.slice(1))
    XLSX.writeFile(wb, `${entity}_template.xlsx`)
    toast.success(`${entity} template downloaded`)
  }

  // ── Row importers ──────────────────────────────────────────────────────────
  const importProduct = async (data: any) => {
    if (!data.title || !data.slug || !data.price) throw new Error("Title, slug, and price are required")
    const { data: existing } = await supabase.from("products").select("id").eq("slug", data.slug).maybeSingle()
    const productData = { title: data.title, slug: data.slug, description: data.description || null, category: data.category || null, sub_category: data.sub_category || null, brand: data.brand || null, price: parseFloat(data.price) || 0, compare_price: data.compare_price ? parseFloat(data.compare_price) : 0, cost_price: data.cost_price ? parseFloat(data.cost_price) : null, stock: parseInt(data.stock) || 0, sku: data.sku || null, thumbnail: data.thumbnail || "", is_featured: data.is_featured === "TRUE" || data.is_featured === true, is_active: data.is_active !== "FALSE" && data.is_active !== false, is_deal: data.is_deal === "TRUE" || data.is_deal === true, deal_discount: data.deal_discount ? parseInt(data.deal_discount) : null, weight: data.weight ? parseFloat(data.weight) : null, meta_title: data.meta_title || null, meta_description: data.meta_description || null, meta_keywords: data.meta_keywords || null }
    if (existing) { const { error } = await supabase.from("products").update(productData).eq("id", existing.id); if (error) throw error }
    else { const { error } = await supabase.from("products").insert(productData); if (error) throw error }
  }

  const importCategory = async (data: any) => {
    if (!data.name || !data.slug) throw new Error("Name and slug are required")
    let parent_id = null
    if (data.parent_slug?.trim()) { const { data: parent } = await supabase.from("categories").select("id").eq("slug", data.parent_slug.trim()).maybeSingle(); parent_id = parent?.id || null }
    const { data: existing } = await supabase.from("categories").select("id").eq("slug", data.slug).maybeSingle()
    const categoryData = { name: data.name, slug: data.slug, description: data.description || null, parent_id, display_order: parseInt(data.display_order) || 0, is_active: data.is_active !== "FALSE" && data.is_active !== false, icon: data.icon || null, meta_title: data.meta_title || null, meta_description: data.meta_description || null, meta_keywords: data.meta_keywords || null }
    if (existing) { const { error } = await supabase.from("categories").update(categoryData).eq("id", existing.id); if (error) throw error }
    else { const { error } = await supabase.from("categories").insert(categoryData); if (error) throw error }
  }

  const importOrder = async (data: any) => {
    if (!data.order_number) throw new Error("Order number is required")
    const shippingAddress = { fullName: data.shipping_fullName || "Customer", phone: data.shipping_phone || "", addressLine1: data.shipping_addressLine1 || "", addressLine2: data.shipping_addressLine2 || "", city: data.shipping_city || "", state: data.shipping_state || "", pincode: data.shipping_pincode || "", country: data.shipping_country || "India" }
    const { data: existing } = await supabase.from("orders").select("id").eq("order_number", data.order_number).maybeSingle()
    const orderData = { order_number: data.order_number, status: data.status || "pending", payment_status: data.payment_status || "pending", payment_method: data.payment_method || null, subtotal: parseFloat(data.subtotal) || 0, discount: parseFloat(data.discount) || 0, shipping_fee: parseFloat(data.shipping_fee) || 0, tax: parseFloat(data.tax) || 0, total: parseFloat(data.total) || 0, coupon_code: data.coupon_code || null, shipping_address: shippingAddress, tracking_carrier: data.tracking_carrier || null, tracking_number: data.tracking_number || null, tracking_url: data.tracking_url || null, estimated_delivery: data.estimated_delivery || null, notes: data.notes || null, admin_notes: data.admin_notes || null, placed_at: data.placed_at || new Date().toISOString() }
    if (existing) { const { error } = await supabase.from("orders").update(orderData).eq("id", existing.id); if (error) throw error }
    else { const { error } = await supabase.from("orders").insert(orderData); if (error) throw error }
  }

  // ── Import handler ─────────────────────────────────────────────────────────
  const handleImport = async (file: File) => {
    setImporting(true)
    setImportProgress(0)
    setImportResult(null)
    setShowPreview(false)
    const result: ImportResult = { success: 0, failed: 0, errors: [], total: 0 }
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet)
      if (jsonData.length === 0) throw new Error("No data found in the file")
      result.total = jsonData.length
      for (let i = 0; i < jsonData.length; i++) {
        try {
          const row = jsonData[i] as any
          if (activeTab === "products") await importProduct(row)
          else if (activeTab === "categories") await importCategory(row)
          else await importOrder(row)
          result.success++
        } catch (err: any) {
          result.failed++
          result.errors.push(`Row ${i + 2}: ${err.message || "Unknown error"}`)
        }
        setImportProgress(Math.round(((i + 1) / jsonData.length) * 100))
        if (i < jsonData.length - 1) await new Promise((r) => setTimeout(r, 50))
      }
      setImportResult(result)
      if (result.failed === 0) toast.success(`Successfully imported all ${result.success} records!`)
      else toast.warning(`Import completed: ${result.success} success, ${result.failed} failed`)
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`)
      setImportResult({ success: 0, failed: 1, errors: [err.message], total: 0 })
    } finally {
      setImporting(false)
    }
  }

  // ── Export handler ─────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true)
    try {
      let data: any[] = []
      let fileName = ""
      switch (activeTab) {
        case "products": {
          const { data: products, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })
          if (error) throw error
          data = (products || []).map((p) => ({ title: p.title || "", slug: p.slug || "", description: p.description || "", category: p.category || "", sub_category: p.sub_category || "", brand: p.brand || "", price: p.price || 0, compare_price: p.compare_price || 0, cost_price: p.cost_price || "", stock: p.stock || 0, sku: p.sku || "", thumbnail: p.thumbnail || "", is_featured: p.is_featured || false, is_active: p.is_active || false, is_deal: p.is_deal || false, deal_discount: p.deal_discount || "", weight: p.weight || "", meta_title: p.meta_title || "", meta_description: p.meta_description || "", meta_keywords: p.meta_keywords || "", created_at: p.created_at || "", updated_at: p.updated_at || "" }))
          fileName = "products_export"
          break
        }
        case "categories": {
          const { data: categories, error } = await supabase.from("categories").select("*").order("display_order", { ascending: true })
          if (error) throw error
          const parentIds = (categories || []).filter((c) => c.parent_id).map((c) => c.parent_id)
          let parentMap: Record<string, string> = {}
          if (parentIds.length > 0) { const { data: parents } = await supabase.from("categories").select("id, slug").in("id", parentIds); (parents || []).forEach((p) => { parentMap[p.id] = p.slug }) }
          data = (categories || []).map((c) => ({ name: c.name || "", slug: c.slug || "", description: c.description || "", parent_slug: c.parent_id ? (parentMap[c.parent_id] || "") : "", display_order: c.display_order || 0, is_active: c.is_active || false, icon: c.icon || "", meta_title: c.meta_title || "", meta_description: c.meta_description || "", meta_keywords: c.meta_keywords || "", created_at: c.created_at || "", updated_at: c.updated_at || "" }))
          fileName = "categories_export"
          break
        }
        case "orders": {
          const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
          if (error) throw error
          if (!orders || orders.length === 0) { toast.warning("No orders found"); setExporting(false); return }
          const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))]
          let userMap: Record<string, string> = {}
          if (userIds.length > 0) { const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", userIds); (profiles || []).forEach((p) => { userMap[p.id] = p.email || "" }) }
          data = orders.map((order) => {
            let shipping: any = {}
            try { if (order.shipping_address) { shipping = typeof order.shipping_address === "string" ? JSON.parse(order.shipping_address) : order.shipping_address } } catch {}
            return { order_number: order.order_number || "", user_email: order.user_id ? (userMap[order.user_id] || "") : "", user_id: order.user_id || "", status: order.status || "", payment_status: order.payment_status || "", payment_method: order.payment_method || "", subtotal: order.subtotal || 0, discount: order.discount || 0, shipping_fee: order.shipping_fee || 0, tax: order.tax || 0, total: order.total || 0, coupon_code: order.coupon_code || "", shipping_fullName: shipping.fullName || "", shipping_phone: shipping.phone || "", shipping_addressLine1: shipping.addressLine1 || "", shipping_addressLine2: shipping.addressLine2 || "", shipping_city: shipping.city || "", shipping_state: shipping.state || "", shipping_pincode: shipping.pincode || "", shipping_country: shipping.country || "India", tracking_carrier: order.tracking_carrier || "", tracking_number: order.tracking_number || "", tracking_url: order.tracking_url || "", estimated_delivery: order.estimated_delivery || "", notes: order.notes || "", admin_notes: order.admin_notes || "", placed_at: order.placed_at || "", delivered_at: order.delivered_at || "", created_at: order.created_at || "", updated_at: order.updated_at || "" }
          })
          fileName = "orders_export"
          break
        }
      }
      if (data.length === 0) { toast.warning(`No ${activeTab} found to export`); return }
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)
      ws["!cols"] = Object.keys(data[0] || {}).map((key) => ({ wch: Math.min(Math.max(key.length + 5, 12), 50) }))
      XLSX.utils.book_append_sheet(wb, ws, activeTab.charAt(0).toUpperCase() + activeTab.slice(1))
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`)
      toast.success(`Successfully exported ${data.length} ${activeTab}`)
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  // ── File handlers ──────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (![".xlsx", ".xls", ".csv"].includes(ext)) { toast.error("Please upload an Excel file (.xlsx, .xls, or .csv)"); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target?.result as ArrayBuffer), { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        setPreviewData(XLSX.utils.sheet_to_json(ws).slice(0, 5))
        setShowPreview(true)
      } catch { toast.error("Failed to preview file") }
    }
    reader.readAsArrayBuffer(file)
    handleImport(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect({ target: { files: [file] } } as any)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex border-b border-border">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setImportResult(null); setShowPreview(false) }}
              className={cn(
                "flex-1 px-6 py-3.5 text-sm font-medium capitalize transition-all relative",
                activeTab === key
                  ? "text-brand"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {label}
              {activeTab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-brand" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => downloadTemplate(activeTab)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <Download className="size-4" />
              Download Template
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <UploadCloud className="size-4" />
              {importing ? "Importing..." : "Import from Excel"}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              <FileDown className="size-4" />
              {exporting ? "Exporting..." : "Export All Data"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
              onClick={(e) => ((e.target as HTMLInputElement).value = "")}
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors",
              dragOver
                ? "border-brand bg-brand/5"
                : "border-border bg-muted/30 hover:border-brand/50 hover:bg-muted/50",
            )}
          >
            <UploadCloud className={cn("size-8", dragOver ? "text-brand" : "text-muted-foreground")} />
            <p className="text-sm font-medium text-foreground">
              Drag and drop your Excel file here
            </p>
            <p className="text-xs text-muted-foreground">Supports .xlsx, .xls, and .csv files</p>
          </div>

          {/* Progress bar */}
          {importing && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-foreground">Importing {activeTab}...</span>
                <span className="font-semibold text-brand">{importProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Import result */}
          {importResult && !importing && (
            <div
              className={cn(
                "rounded-lg border p-4",
                importResult.failed === 0
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                  : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30",
              )}
            >
              <div className="flex items-center gap-2">
                {importResult.failed === 0 ? (
                  <Check className="size-4 text-green-600" />
                ) : (
                  <AlertTriangle className="size-4 text-yellow-600" />
                )}
                <h3 className="font-semibold text-foreground">
                  {importResult.failed === 0 ? "Import Successful!" : "Import Completed with Errors"}
                </h3>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
                  {importResult.success} Success
                </span>
                {importResult.failed > 0 && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300">
                    {importResult.failed} Failed
                  </span>
                )}
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  Total: {importResult.total}
                </span>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-border bg-background p-3">
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="font-mono text-xs text-destructive">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Data preview */}
          {showPreview && previewData.length > 0 && !importing && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Data Preview &mdash; first {previewData.length} rows
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {Object.keys(previewData[0]).map((key) => (
                        <th
                          key={key}
                          className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {key.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewData.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="max-w-xs truncate px-4 py-2.5 text-xs text-foreground">
                            {val === null || val === undefined ? (
                              <span className="italic text-muted-foreground">null</span>
                            ) : typeof val === "object" ? (
                              JSON.stringify(val)
                            ) : (
                              String(val)
                            )}
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
  )
}
