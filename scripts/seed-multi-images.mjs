/**
 * Gives every product 3-5 images by picking from the pool of subcategory images
 * that share the same parent category slug prefix.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// All available product images
const imagesDir = path.join(__dirname, '../public/products')
const allImages = fs
  .readdirSync(imagesDir)
  .filter((f) => f.endsWith('.png'))
  .map((f) => `/products/${f}`)

function getPrefixGroup(imagePath) {
  const name = path.basename(imagePath, '.png')
  // e.g. "computers-laptops" -> prefix = "computers"
  return name.split('-')[0]
}

// Build a map of prefix -> [image paths]
const prefixMap = {}
for (const img of allImages) {
  const prefix = getPrefixGroup(img)
  if (!prefixMap[prefix]) prefixMap[prefix] = []
  prefixMap[prefix].push(img)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickImages(currentImage, count = 4) {
  const prefix = getPrefixGroup(currentImage)
  const pool = prefixMap[prefix] ?? allImages
  // Always put the current image first, then fill with others from same group
  const others = shuffle(pool.filter((img) => img !== currentImage))
  return [currentImage, ...others].slice(0, count)
}

const { data: products, error } = await supabase
  .from('products')
  .select('id, images')

if (error) {
  console.error('Failed to fetch products:', error.message)
  process.exit(1)
}

let updated = 0
for (const product of products) {
  const current = product.images?.[0] ?? allImages[0]
  const count = 3 + Math.floor(Math.random() * 3) // 3-5 images
  const newImages = pickImages(current, count)

  const { error: updateError } = await supabase
    .from('products')
    .update({ images: newImages })
    .eq('id', product.id)

  if (updateError) {
    console.error(`Failed to update ${product.id}:`, updateError.message)
  } else {
    updated++
  }
}

console.log(`Updated ${updated}/${products.length} products with multiple images.`)
