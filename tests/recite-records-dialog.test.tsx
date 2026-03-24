import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { ReciteRecordsDialog } from '@/components/recite-records-dialog'

vi.mock('@/lib/db', () => {
  return {
    getAllFromDB: vi.fn().mockResolvedValue([]),
    STORES: {
      RECITE_DETAIL: 'recite_detail',
      RECITE_SUMMARY: 'recite_summary',
    },
  };
})

describe('ReciteRecordsDialog', () => {
  it('renders header and tabs', () => {
    const onOpenChange = vi.fn()
    render(<ReciteRecordsDialog open={true} onOpenChange={onOpenChange} />)
    expect(screen.getByText('背诵记录')).toBeInTheDocument()
    expect(screen.getByText('背诵明细')).toBeInTheDocument()
    expect(screen.getByText('背诵汇总')).toBeInTheDocument()
  })

  it('shows filter bar presence', () => {
    const onOpenChange = vi.fn()
    render(<ReciteRecordsDialog open={true} onOpenChange={onOpenChange} />)
    // simple sanity check for filter controls presence
    expect(screen.queryByText('筛选')).toBeTruthy()
  })
})
