// app/api/admin/orders/export/route.ts
import { NextRequest, NextResponse } from "next/server"
import ExcelJS from 'exceljs'
import { getAdminOrderRows } from "@/app/actions/admin-order"

export const dynamic = "force-dynamic"

// ============ TYPES ============
interface ShippingAddress {
  name?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  phone?: string | null
}

interface OrderUser {
  name?: string | null
  email?: string | null
  phone?: string | null
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  product?: {
    name?: string
  } | null
}

interface Order {
  id: string
  status: string
  total: number
  subtotal?: number | null
  tax?: number | null
  shippingCost?: number | null
  discount?: number | null
  createdAt: string | Date
  paymentMethod?: string | null
  paymentStatus?: string | null
  trackingNumber?: string | null
  notes?: string | null
  user?: OrderUser | null
  shippingAddress?: ShippingAddress | null
  items?: OrderItem[]
}

interface ExportRequestBody {
  orderIds?: string[]
}

interface ExcelRowData {
  id: string
  customerName: string
  email: string
  phone: string
  status: string
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  itemsCount: number
  paymentMethod: string
  paymentStatus: string
  orderDate: string
  shippingAddress: string
  city: string
  state: string
  zipCode: string
  country: string
  trackingNumber: string
  notes: string
}

interface StatusCounts {
  [key: string]: number
}

// ============ HELPER FUNCTIONS ============
function styleExcelHeader(worksheet: ExcelJS.Worksheet, columnsCount: number): void {
  const headerRow = worksheet.getRow(1)
  headerRow.font = { 
    bold: true, 
    size: 12,
    color: { argb: 'FF000000' }
  }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E8E8' }
  }
  headerRow.alignment = { 
    vertical: 'middle', 
    horizontal: 'center',
    wrapText: true
  }
  headerRow.height = 25
  
  for (let i = 1; i <= columnsCount; i++) {
    headerRow.getCell(i).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  }
}

function formatOrderForExcel(order: Order): ExcelRowData {
  return {
    id: order.id,
    customerName: order.user?.name || order.shippingAddress?.name || 'N/A',
    email: order.user?.email || 'N/A',
    phone: order.shippingAddress?.phone || order.user?.phone || 'N/A',
    status: order.status,
    subtotal: order.subtotal || order.total,
    tax: order.tax || 0,
    shipping: order.shippingCost || 0,
    discount: order.discount || 0,
    total: order.total,
    itemsCount: order.items?.length || 0,
    paymentMethod: order.paymentMethod || 'N/A',
    paymentStatus: order.paymentStatus || 'N/A',
    orderDate: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A',
    shippingAddress: order.shippingAddress?.street || 'N/A',
    city: order.shippingAddress?.city || 'N/A',
    state: order.shippingAddress?.state || 'N/A',
    zipCode: order.shippingAddress?.zip || 'N/A',
    country: order.shippingAddress?.country || 'N/A',
    trackingNumber: order.trackingNumber || 'N/A',
    notes: order.notes || '',
  }
}

function calculateSummaryMetrics(orders: Order[]) {
  const totalRevenue: number = orders.reduce((sum: number, order: Order) => sum + order.total, 0)
  const avgOrderValue: number = orders.length > 0 ? totalRevenue / orders.length : 0
  
  const statusCounts: StatusCounts = orders.reduce((acc: StatusCounts, order: Order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {})

  return { totalRevenue, avgOrderValue, statusCounts }
}

function addOrderRowsToWorksheet(
  worksheet: ExcelJS.Worksheet, 
  orders: Order[]
): void {
  orders.forEach((order: Order, index: number) => {
    const rowData: ExcelRowData = formatOrderForExcel(order)
    const row = worksheet.addRow(rowData)
    
    row.height = 20
    row.alignment = { vertical: 'middle' }
    
    // Alternate row colors
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9F9F9' }
      }
    }

    // Format currency cells
    const currencyFields: (keyof ExcelRowData)[] = ['subtotal', 'tax', 'shipping', 'discount', 'total']
    currencyFields.forEach((field: keyof ExcelRowData) => {
      const cell = row.getCell(field)
      cell.numFormat = '$#,##0.00'
    })
    
    // Center the date
    const dateCell = row.getCell('orderDate')
    dateCell.alignment = { horizontal: 'center' }

    // Add borders
    row.eachCell((cell: ExcelJS.Cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
      }
    })
  })
}

function createSummaryWorksheet(
  workbook: ExcelJS.Workbook, 
  orders: Order[]
): void {
  const { totalRevenue, avgOrderValue, statusCounts } = calculateSummaryMetrics(orders)
  
  const summarySheet = workbook.addWorksheet('Summary')
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 25 }
  ]
  
  styleExcelHeader(summarySheet, 2)
  
  // Add data
  const summaryData = [
    { metric: 'Export Date', value: new Date().toLocaleString(), bold: false },
    { metric: 'Total Orders', value: orders.length, bold: true },
    { metric: 'Total Revenue', value: totalRevenue, bold: true, currency: true },
    { metric: 'Average Order Value', value: avgOrderValue, bold: true, currency: true },
    { metric: '', value: '', bold: false },
    { metric: 'Status Breakdown', value: '', bold: true },
  ]
  
  summaryData.forEach((data) => {
    const row = summarySheet.addRow({ metric: data.metric, value: data.value })
    if (data.bold) {
      row.font = { bold: true }
    }
    if (data.currency) {
      row.getCell('value').numFormat = '$#,##0.00'
    }
  })
  
  // Add status counts
  Object.entries(statusCounts).forEach(([status, count]: [string, number]) => {
    summarySheet.addRow({ metric: `  ${status}`, value: count })
  })

  // Add borders to all cells
  for (let i = 1; i <= summarySheet.rowCount; i++) {
    const row = summarySheet.getRow(i)
    row.eachCell((cell: ExcelJS.Cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
      }
    })
  }
}

// ============ MAIN EXPORT HANDLER ============
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body: ExportRequestBody = await request.json().catch(() => ({}))
    const selectedIds: string[] | undefined = body.orderIds

    // Fetch all orders
    const allOrders: Order[] = await getAdminOrderRows()
    
    // Filter orders if specific IDs provided
    const orders: Order[] = selectedIds && selectedIds.length > 0
      ? allOrders.filter((order: Order) => selectedIds.includes(order.id))
      : allOrders

    if (orders.length === 0) {
      return NextResponse.json({ error: 'No orders to export' }, { status: 404 })
    }

    // Create workbook
    const workbook: ExcelJS.Workbook = new ExcelJS.Workbook()
    workbook.creator = 'Admin Dashboard'
    workbook.created = new Date()

    // Create Orders worksheet
    const worksheet: ExcelJS.Worksheet = workbook.addWorksheet('Orders', {
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    // Define columns
    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Subtotal', key: 'subtotal', width: 15 },
      { header: 'Tax', key: 'tax', width: 12 },
      { header: 'Shipping', key: 'shipping', width: 15 },
      { header: 'Discount', key: 'discount', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Items Count', key: 'itemsCount', width: 12 },
      { header: 'Payment Method', key: 'paymentMethod', width: 20 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Order Date', key: 'orderDate', width: 20 },
      { header: 'Shipping Address', key: 'shippingAddress', width: 40 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'State', key: 'state', width: 15 },
      { header: 'Zip Code', key: 'zipCode', width: 12 },
      { header: 'Country', key: 'country', width: 15 },
      { header: 'Tracking Number', key: 'trackingNumber', width: 25 },
      { header: 'Notes', key: 'notes', width: 30 },
    ]

    // Style the header
    styleExcelHeader(worksheet, worksheet.columns.length)

    // Add order data
    addOrderRowsToWorksheet(worksheet, orders)

    // Create summary
    createSummaryWorksheet(workbook, orders)

    // Generate buffer
    const buffer: ArrayBuffer = await workbook.xlsx.writeBuffer()

    // Return the Excel file
    const date: string = new Date().toISOString().split('T')[0]
    const filename: string = `orders-export-${date}.xlsx`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      }
    })

  } catch (error) {
    console.error('Orders export error:', error)
    const errorMessage: string = error instanceof Error 
      ? error.message 
      : 'Failed to export orders. Please try again.'
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
}