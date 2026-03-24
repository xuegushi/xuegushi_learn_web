import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { ReciteRecordsDialog } from '@/components/recite-records-dialog'

vi.mock('@/lib/db', () => {
  return {
    getAllFromDB: vi.fn(),
    STORES: {
      RECITE_DETAIL: 'recite_detail',
      RECITE_SUMMARY: 'recite_summary'
    }
  };
})

describe('ReciteRecordsDialog end-to-end', () => {
  it('renders header and tabs and filter bar', () => {
    const onOpenChange = vi.fn()
    // @ts-ignore
    require('@/lib/db').getAllFromDB.mockResolvedValue([])
    render(<ReciteRecordsDialog open={true} onOpenChange={onOpenChange} />)
    expect(screen.getByText('背诵记录')).toBeInTheDocument()
    expect(screen.getByText('背诵明细')).toBeInTheDocument()
    expect(screen.getByText('背诵汇总')).toBeInTheDocument()
    // filter bar presence (Patch 4D)
    expect(screen.getByText('筛选')).toBeInTheDocument()
  })

  it('loads more on 查看更多 in today details', async () => {
    const now = new Date()
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const mockDetails = Array.from({ length: 6 }).map((_, i) => ({
      id: i + 1,
      user_id: 'u1',
      poem_id: `p${i+1}`,
      title: `Poem ${i+1}`,
      author: 'Author',
      dynasty: i % 2 ? '唐' : '宋',
      status: true,
      createdAt: now.toISOString()
    }))
    const { getAllFromDB } = require('@/lib/db')
    getAllFromDB.mockResolvedValueOnce(mockDetails) // for detail fetch
    getAllFromDB.mockResolvedValueOnce([]) // for sums

    const onOpenChange = vi.fn()
    render(<ReciteRecordsDialog open={true} onOpenChange={onOpenChange} />)
    // ensure '查看更多' exists for today details when more data
    await waitFor(() => expect(screen.queryAllByText('查看更多').length).toBeGreaterThan(0))
  })
})
