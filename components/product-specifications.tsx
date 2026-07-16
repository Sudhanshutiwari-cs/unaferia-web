"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type { ProductDetail, SpecValue } from "@/lib/queries"

type SpecGroup = {
  title: string
  rows: [string, string][]
}

// Normalize the specifications object into an ordered list of groups.
// Supports nested groups ({ Style: { color: "Black" } }) and any stray
// flat key/value pairs (collected under a "General" group).
function buildGroups(specs: Record<string, SpecValue> | null): SpecGroup[] {
  if (!specs) return []
  const groups: SpecGroup[] = []
  const flat: [string, string][] = []

  for (const [key, value] of Object.entries(specs)) {
    if (value && typeof value === "object") {
      const rows = Object.entries(value)
        .filter(([, v]) => v != null && String(v).trim() !== "")
        .map(([k, v]) => [k, String(v)] as [string, string])
      if (rows.length > 0) groups.push({ title: key, rows })
    } else if (value != null && String(value).trim() !== "") {
      flat.push([key, String(value)])
    }
  }
  if (flat.length > 0) groups.unshift({ title: "General", rows: flat })
  return groups
}

function SpecAccordion({ group, defaultOpen }: { group: SpecGroup; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = `spec-panel-${group.title.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-md border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 bg-muted/60 px-4 py-3 text-left hover:bg-muted"
      >
        <span className="text-base font-bold text-foreground">{group.title}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={panelId}>
          <table className="w-full text-sm">
            <tbody>
              {group.rows.map(([k, v]) => (
                <tr key={k} className="border-t border-border">
                  <th scope="row" className="w-2/5 px-4 py-2.5 text-left align-top font-semibold text-muted-foreground">
                    {k}
                  </th>
                  <td className="px-4 py-2.5 align-top text-foreground">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Full-width product information section: masonry accordions, description, box contents.
export function ProductSpecifications({ product }: { product: ProductDetail }) {
  const groups = buildGroups(product.specifications)
  const hasSpecs = groups.length > 0
  const hasDescription = product.description.trim() !== ""
  const hasBox = product.boxContents.length > 0

  if (!hasSpecs && !hasDescription && !hasBox) return null

  return (
    <section aria-labelledby="specs-heading" className="rounded-lg bg-card p-4 sm:p-6">
      <h2 id="specs-heading" className="mb-4 text-xl font-bold text-foreground">
        Product Specifications
      </h2>

      {hasSpecs && (
        <div className="columns-1 gap-6 md:columns-2">
          {groups.map((group, i) => (
            <SpecAccordion key={group.title} group={group} defaultOpen={i === 0} />
          ))}
        </div>
      )}

      {hasDescription && (
        <div className="mt-6 border-t border-border pt-6">
          <h3 className="mb-2 text-lg font-bold text-foreground">Product Description</h3>
          <p className="max-w-4xl leading-relaxed text-foreground">{product.description}</p>
        </div>
      )}

      {hasBox && (
        <div className="mt-6 border-t border-border pt-6">
          <h3 className="mb-2 text-lg font-bold text-foreground">What&apos;s in the box</h3>
          <ul className="list-disc space-y-1 pl-5 text-foreground">
            {product.boxContents.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
