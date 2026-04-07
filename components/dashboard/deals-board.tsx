'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Search } from 'lucide-react'
import type { Deal, DealStage } from '@/lib/types'

const stageConfig: Record<DealStage, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  prospecting: { label: 'Prospecting', variant: 'secondary' },
  qualified: { label: 'Qualified', variant: 'outline' },
  proposal: { label: 'Proposal', variant: 'default' },
  negotiation: { label: 'Negotiation', variant: 'default' },
  closed_won: { label: 'Won', variant: 'default' },
  closed_lost: { label: 'Lost', variant: 'destructive' },
}

const STAGES: DealStage[] = [
  'prospecting',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
]

interface DealsBoardProps {
  deals: Deal[]
}

export function DealsBoard({ deals }: DealsBoardProps) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<DealStage | 'all'>('all')

  const filtered = deals.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesStage = stageFilter === 'all' || d.stage === stageFilter
    return matchesSearch && matchesStage
  })

  const totalValue = filtered.reduce((sum, d) => sum + (d.value || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={stageFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStageFilter('all')}
          >
            All
          </Button>
          {STAGES.map((stage) => (
            <Button
              key={stage}
              variant={stageFilter === stage ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStageFilter(stage)}
            >
              {stageConfig[stage].label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Probability</TableHead>
              <TableHead>Expected Close</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {search || stageFilter !== 'all' ? 'No deals match your filters.' : 'No deals yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.title}</TableCell>
                  <TableCell className="text-muted-foreground">{deal.contact_name ?? '—'}</TableCell>
                  <TableCell className="font-medium">${deal.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={stageConfig[deal.stage].variant}>
                      {stageConfig[deal.stage].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{deal.probability}%</TableCell>
                  <TableCell className="text-muted-foreground">
                    {deal.expected_close
                      ? new Date(deal.expected_close).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Move stage</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filtered.length} deal{filtered.length !== 1 ? 's' : ''}
        </span>
        <span>Total value: ${totalValue.toLocaleString()}</span>
      </div>
    </div>
  )
}
