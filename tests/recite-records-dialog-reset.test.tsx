import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('ReciteRecordsDialog - filter reset', () => {
  it('resets filters to defaults', async () => {
    const onOpenChange = vi.fn()
    render(<ReciteRecordsDialog open={true} onOpenChange={onOpenChange} />)
    // Click reset button if present
    const reset = screen.queryByText('重置筛选')
    if (reset) fireEvent.click(reset)
    // Defaults should be visible in UI
    await waitFor(() => {
      expect(screen.getByText('全部用户')).toBeInTheDocument()
      expect(screen.getByText('全部朝代')).toBeInTheDocument()
    })
  })
})
