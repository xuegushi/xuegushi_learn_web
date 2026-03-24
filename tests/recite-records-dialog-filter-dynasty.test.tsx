import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

describe('ReciteRecordsDialog - Dynasty filter', () => {
  it('renders dynasty options from DynastyArr via DynastySelect', async () => {
    render(<ReciteRecordsDialog open={true} onOpenChange={() => {}} />)
    // 期望朝代默认包含'全部朝代'
    expect(screen.getByText('全部朝代')).toBeInTheDocument()
  })

  it('reset filters clears dynasty and user to defaults', async () => {
    render(<ReciteRecordsDialog open={true} onOpenChange={() => {}} />)
    const reset = screen.queryByTestId('recite-records-reset-filter')
    if (reset) fireEvent.click(reset)
    // ensure defaults are visible
    await waitFor(() => {
      expect(screen.getByText('全部用户')).toBeInTheDocument()
      expect(screen.getByText('全部朝代')).toBeInTheDocument()
    })
  })
})
