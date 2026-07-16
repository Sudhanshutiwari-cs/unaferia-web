'use client'

import { useState, useMemo } from 'react'
import { Mail, Users, TrendingUp, Calendar, Search, Trash2, Download, ChevronUp, ChevronDown } from 'lucide-react'
import { deleteSubscriber } from '@/app/actions/admin-newsletter'
import type { Subscriber, NewsletterStats } from '@/app/actions/admin-newsletter'

type SortKey = 'email' | 'name' | 'subscribed_at'
type SortDir = 'asc' | 'desc'

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  sub?: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand/10">
        <Icon className="h-5 w-5 text-brand" />
      </span>
      <div>
        <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

export function NewsletterManager({
  initialSubscribers,
  stats,
}: {
  initialSubscribers: Subscriber[]
  stats: NewsletterStats
}) {
  const [subscribers, setSubscribers] = useState(initialSubscribers)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('subscribed_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const list = q
      ? subscribers.filter(s =>
          s.email.toLowerCase().includes(q) ||
          (s.name ?? '').toLowerCase().includes(q)
        )
      : subscribers

    return [...list].sort((a, b) => {
      let av = a[sortKey] ?? ''
      let bv = b[sortKey] ?? ''
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [subscribers, search, sortKey, sortDir])

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await deleteSubscriber(id)
    if (res.ok) {
      setSubscribers(prev => prev.filter(s => s.id !== id))
    }
    setDeletingId(null)
    setConfirmId(null)
  }

  function exportCSV() {
    const header = 'Email,Name,Subscribed At'
    const rows = filtered.map(s =>
      `"${s.email}","${s.name ?? ''}","${new Date(s.subscribed_at).toLocaleString()}"`
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="h-3.5 w-3.5 opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5 text-brand" />
      : <ChevronDown className="h-3.5 w-3.5 text-brand" />
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Subscribers" value={stats.total} />
        <StatCard icon={TrendingUp} label="This Month" value={stats.thisMonth} />
        <StatCard icon={Calendar} label="This Week" value={stats.thisWeek} />
        <StatCard icon={Mail} label="Today" value={stats.today} />
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-border bg-card">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by email or name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
          <button
            type="button"
            onClick={exportCSV}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Email <SortIcon col="email" />
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Name <SortIcon col="name" />
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort('subscribed_at')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Subscribed <SortIcon col="subscribed_at" />
                  </button>
                </th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                    {search ? 'No subscribers match your search.' : 'No subscribers yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-muted/40">
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                          {s.email[0].toUpperCase()}
                        </span>
                        {s.email}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {s.name ?? <span className="italic opacity-40">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Date(s.subscribed_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      <span className="ml-1.5 text-xs opacity-60">
                        {new Date(s.subscribed_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {confirmId === s.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">Remove?</span>
                          <button
                            type="button"
                            disabled={deletingId === s.id}
                            onClick={() => handleDelete(s.id)}
                            className="rounded px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === s.id ? 'Removing…' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="rounded px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(s.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${s.email}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Showing {filtered.length} of {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
