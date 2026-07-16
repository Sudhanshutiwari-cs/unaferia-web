// Mock data for the Shourya Quest storefront.
// This is structured to mirror what a Supabase schema would return, so it can be
// swapped for live queries later without changing the UI components.

import {
  Smartphone,
  Laptop,
  Shirt,
  Sofa,
  Sparkles,
  BookOpen,
  Dumbbell,
  Gamepad2,
  Car,
  HeartPulse,
  MonitorSmartphone,
  ShoppingBasket,
  PawPrint,
  Wrench,
  type LucideIcon,
} from "lucide-react"

export type SidebarCategory = {
  name: string
  icon: LucideIcon
}

export const sidebarCategories: SidebarCategory[] = [
  { name: "Mobiles & Accessories", icon: Smartphone },
  { name: "Electronics", icon: Laptop },
  { name: "Fashion", icon: Shirt },
  { name: "Home & Kitchen", icon: Sofa },
  { name: "Beauty & Personal Care", icon: Sparkles },
  { name: "Sports, Fitness & Outdoors", icon: Dumbbell },
  { name: "Books & Stationery", icon: BookOpen },
  { name: "Toys & Games", icon: Gamepad2 },
  { name: "Automotive", icon: Car },
  { name: "Health & Household", icon: HeartPulse },
  { name: "Computers & Accessories", icon: MonitorSmartphone },
  { name: "Grocery & Essentials", icon: ShoppingBasket },
  { name: "Pet Supplies", icon: PawPrint },
  { name: "Tools & Home Improvement", icon: Wrench },
]

export const topNavLinks = [
  "Today's Deals",
  "Customer Service",
  "Gift Cards",
  "Sell",
  "Registry",
]

export type Product = {
  id: string
  // Real UUID from the products table — used for wishlist / cart actions.
  productId?: string
  // URL slug (e.g. "redmi-13c") — separate from UUID id
  slug?: string
  name: string
  image: string
  price: number
  mrp: number
  discount: number
  rating: number
  ratingCount: number
  category?: string
  subCategory?: string
  // Canonical product URL: /category-slug/subcategory-slug/product-slug
  href?: string
  // Deal flagging — set by admin
  isDeal?: boolean
  dealDiscount?: number | null
}

export const dealsOfTheDay: Product[] = [
  {
    id: "redmi-13c",
    name: "Redmi 13C (Starry Black, 4GB RAM, 128GB Storage)",
    image: "/images/p-redmi.png",
    price: 8999,
    mrp: 15490,
    discount: 42,
    rating: 4.3,
    ratingCount: 12345,
  },
  {
    id: "boat-airdopes-141",
    name: "boAt Airdopes 141 Pro Bluetooth Wireless",
    image: "/images/p-airdopes.png",
    price: 1299,
    mrp: 1999,
    discount: 35,
    rating: 4.2,
    ratingCount: 8754,
  },
  {
    id: "fire-boltt-ninja",
    name: "Fire-Boltt Ninja Calling Smart Watch",
    image: "/images/p-firebolt.png",
    price: 1699,
    mrp: 2399,
    discount: 29,
    rating: 4.1,
    ratingCount: 6421,
  },
  {
    id: "safari-pentagon",
    name: "Safari Pentagon 45L Laptop Backpack",
    image: "/images/p-backpack.png",
    price: 1499,
    mrp: 2199,
    discount: 31,
    rating: 4.4,
    ratingCount: 2124,
  },
  {
    id: "puma-smashic",
    name: "Puma Men's Smashic Sneakers",
    image: "/images/p-puma.png",
    price: 2199,
    mrp: 2999,
    discount: 26,
    rating: 4.2,
    ratingCount: 3658,
  },
  {
    id: "boat-rockerz",
    name: "boAt Rockerz 450 Bluetooth On-Ear Headphones",
    image: "/images/cat-electronics.png",
    price: 1499,
    mrp: 3990,
    discount: 62,
    rating: 4.3,
    ratingCount: 9812,
  },
]

export const bestSellers: Product[] = [
  {
    id: "samsung-m14",
    name: "Samsung Galaxy M14 5G (Icy Silver, 4GB, 128GB)",
    image: "/images/p-samsung.png",
    price: 9999,
    mrp: 13990,
    discount: 28,
    rating: 4.2,
    ratingCount: 9876,
  },
  {
    id: "noise-colorfit",
    name: "Noise ColorFit Pro 4 Smart Watch",
    image: "/images/p-noise.png",
    price: 2499,
    mrp: 3999,
    discount: 37,
    rating: 4.3,
    ratingCount: 6352,
  },
  {
    id: "realme-buds-t300",
    name: "realme Buds T300 True Wireless Earbuds",
    image: "/images/p-buds.png",
    price: 1899,
    mrp: 2999,
    discount: 36,
    rating: 4.4,
    ratingCount: 5241,
  },
  {
    id: "adidas-running",
    name: "Adidas Men's Running Shoes",
    image: "/images/p-adidas.png",
    price: 2699,
    mrp: 3999,
    discount: 32,
    rating: 4.5,
    ratingCount: 7643,
  },
  {
    id: "lavie-handbag",
    name: "Lavie Women's Handbag",
    image: "/images/p-handbag.png",
    price: 1299,
    mrp: 2499,
    discount: 48,
    rating: 4.2,
    ratingCount: 4125,
  },
  {
    id: "samsung-m14-blue",
    name: "Samsung Galaxy M14 5G (Berry Blue, 6GB, 128GB)",
    image: "/images/p-redmi.png",
    price: 11499,
    mrp: 15990,
    discount: 28,
    rating: 4.1,
    ratingCount: 3311,
  },
]

export type ShopCategory = {
  name: string
  image: string
}

export const shopByCategory: ShopCategory[] = [
  { name: "Mobiles", image: "/images/cat-mobiles.png" },
  { name: "Electronics", image: "/images/cat-electronics.png" },
  { name: "Fashion", image: "/images/cat-fashion.png" },
  { name: "Home & Kitchen", image: "/images/cat-home.png" },
  { name: "Beauty", image: "/images/cat-beauty.png" },
  { name: "Books", image: "/images/cat-books.png" },
  { name: "Sports", image: "/images/cat-sports.png" },
  { name: "Automotive", image: "/images/cat-automotive.png" },
]

export const topBrands = [
  "boAt",
  "SAMSUNG",
  "realme",
  "PUMA",
  "boAt",
  "NOISE",
  "adidas",
  "OnePlus",
]
