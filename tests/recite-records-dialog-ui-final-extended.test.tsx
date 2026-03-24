import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { ReciteRecordsDialog } from '@/components/recite-records-dialog'

vi.mock('@/lib/db', () => {
  return {
    getAllFromDB: vi.fn().mockResolvedValue([]),
    STORES: { RECITE_DETAIL: 'recite_detail', RECITE_SUMMARY: 'recite_summary' }
  }
})

describe('ReciteRecordsDialog - Final UI tests', () => {
  it('renders header and branch tabs and filter bar', () => {
    render(<ReciteRecordsDialog open={true} onOpenChange={() => {}} />)
    expect(screen.getByTestId('recite-records-header')).toBeInTheDocument()
    expect(screen.getByTestId('recite-records-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('recite-records-filter-bar')).toBeInTheDocument()
  })

  it('switching tabs does not crash', async () => {
    render(<ReciteRecordsDialog open={true} onOpenChange={() => {}} />)
    const detailTab = screen.getByTestId('recite-records-detail-tab')
    const summaryTab = screen.getByTestId('recite-records-summary-tab')
    fireEvent.click(detailTab)
    fireEvent.click(summaryTab)
    // verify both labels exist
    expect(screen.getByText('背诵明细')).toBeInTheDocument()
    expect(screen.getByText('背诵汇总')).toBeInTheDocument()
  })
})
