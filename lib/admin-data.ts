// Mock admin data for the Shourya Quest dashboard.
// Structured to mirror a Supabase schema so it can be swapped for live queries later.

export type StatAccent = "purple" | "green" | "orange" | "blue"
export type StatIcon = "orders" | "sales" | "customers" | "products"

export type Stat = {
  label: string
  value: string
  change: string
  trend: "up" | "down"
  icon: StatIcon
  accent: StatAccent
}

export const dashboardStats: Stat[] = [
  { label: "Total Orders", value: "1,248", change: "12.5%", trend: "up", icon: "orders", accent: "purple" },
  { label: "Total Sales", value: "₹12,45,678", change: "18.2%", trend: "up", icon: "sales", accent: "green" },
  { label: "Total Customers", value: "3,256", change: "8.7%", trend: "up", icon: "customers", accent: "orange" },
  { label: "Total Products", value: "842", change: "5.3%", trend: "up", icon: "products", accent: "blue" },
]

export type SalesPoint = { label: string; value: number }

// Weekly sales (₹) — matches the "This Week" range May 31 – Jun 6.
export const salesThisWeek: SalesPoint[] = [
  { label: "May 31", value: 55000 },
  { label: "Jun 1", value: 110000 },
  { label: "Jun 2", value: 92000 },
  { label: "Jun 3", value: 125000 },
  { label: "Jun 4", value: 175000 },
  { label: "Jun 5", value: 112000 },
  { label: "Jun 6", value: 122000 },
]

export type OrderStatus = "Delivered" | "Processing" | "Shipped" | "Cancelled"

export type StatusSlice = {
  status: OrderStatus
  percent: number
  count: number
  color: string
}

// Colors also used to render the donut chart.
export const orderStatusBreakdown: StatusSlice[] = [
  { status: "Delivered", percent: 62, count: 773, color: "#2563eb" },
  { status: "Processing", percent: 18, count: 224, color: "#f59e0b" },
  { status: "Shipped", percent: 12, count: 150, color: "#22c55e" },
  { status: "Cancelled", percent: 8, count: 101, color: "#8b5cf6" },
]

export type Order = {
  id: string
  customer: string
  date: string
  items: number
  total: number
  status: OrderStatus
}

export const orders: Order[] = [
  { id: "SQ12548", customer: "Rahul Sharma", date: "2025-06-06", items: 1, total: 1299, status: "Delivered" },
  { id: "SQ12547", customer: "Priya Verma", date: "2025-06-06", items: 1, total: 2499, status: "Processing" },
  { id: "SQ12546", customer: "Amit Singh", date: "2025-06-05", items: 2, total: 889, status: "Shipped" },
  { id: "SQ12545", customer: "Neha Gupta", date: "2025-06-05", items: 1, total: 1599, status: "Delivered" },
  { id: "SQ12544", customer: "Vikram Patel", date: "2025-06-04", items: 1, total: 2199, status: "Cancelled" },
  { id: "SQ12543", customer: "Sneha Kulkarni", date: "2025-06-04", items: 3, total: 5897, status: "Delivered" },
  { id: "SQ12542", customer: "Arjun Nair", date: "2025-06-03", items: 2, total: 3798, status: "Processing" },
  { id: "SQ12541", customer: "Ishita Bose", date: "2025-06-03", items: 1, total: 2699, status: "Shipped" },
  { id: "SQ12540", customer: "Karan Mehta", date: "2025-06-02", items: 4, total: 18496, status: "Delivered" },
  { id: "SQ12539", customer: "Ananya Iyer", date: "2025-06-02", items: 1, total: 8999, status: "Cancelled" },
]

export type TopProduct = {
  name: string
  image: string
  sales: number
  amount: number
}

export const topProducts: TopProduct[] = [
  { name: "boAt Airdopes 141 Pro", image: "/images/p-airdopes.png", sales: 312, amount: 311688 },
  { name: "Fire-Boltt Ninja Smart Watch", image: "/images/p-firebolt.png", sales: 289, amount: 289411 },
  { name: "Puma Men's Smashic Sneakers", image: "/images/p-puma.png", sales: 245, amount: 245755 },
  { name: "Safari Pentagon 45L Backpack", image: "/images/p-backpack.png", sales: 201, amount: 181899 },
  { name: "Redmi 13C (4GB RAM, 128GB)", image: "/images/p-redmi.png", sales: 187, amount: 167813 },
]

export type Customer = {
  id: string
  name: string
  email: string
  orders: number
  spent: number
  joined: string
}

export const customers: Customer[] = [
  { id: "C-1042", name: "Rahul Sharma", email: "rahul.sharma@example.com", orders: 14, spent: 84200, joined: "2024-02-11" },
  { id: "C-1041", name: "Priya Verma", email: "priya.verma@example.com", orders: 9, spent: 41250, joined: "2024-03-22" },
  { id: "C-1040", name: "Amit Singh", email: "amit.singh@example.com", orders: 21, spent: 132400, joined: "2023-11-05" },
  { id: "C-1039", name: "Neha Gupta", email: "neha.gupta@example.com", orders: 6, spent: 18700, joined: "2024-06-18" },
  { id: "C-1038", name: "Vikram Patel", email: "vikram.patel@example.com", orders: 17, spent: 98650, joined: "2023-12-30" },
  { id: "C-1037", name: "Sneha Kulkarni", email: "sneha.kulkarni@example.com", orders: 4, spent: 12300, joined: "2024-05-09" },
]
