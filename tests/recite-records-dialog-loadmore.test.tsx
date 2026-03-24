import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { ReciteRecordsDialog } from '@/components/recite-records-dialog'
import { STORES } from '@/lib/db'

vi.mock('@/lib/db', () => {
  const m = {
    getAllFromDB: vi.fn(),
    STORES: { RECITE_DETAIL: 'recite_detail', RECITE_SUMMARY: 'recite_summary' }
  }
  return m as any
})

describe('ReciteRecordsDialog load more', () => {
  it('loads more today items on click', async () => {
    const { getAllFromDB } = require('@/lib/db')
    // initial load returns 6 items for today; second load returns 3 additional items
    let call = 0
    getAllFromDB.mockImplementation(async (store: string) => {
      call++
      if (store === STORES.RECITE_DETAIL) {
        if (call === 1) {
          // initial dataset (simulate 6 today items)
          return new Array(6).fill(0).map((_, i) => ({
            id: i + 1,
            user_id: 'u1',
            poem_id: `p${i+1}`,
            title: `Poem ${i+1}`,
            author: 'Author',
            dynasty: i % 2 ? '唐' : '宋',
            status: true,
            createdAt: new Date().toISOString()
          }))
        } else if (call === 2) {
          // additional items on load more
          return new Array(3).fill(0).map((_, i) => ({
            id: 100 + i,
            user_id: 'u1',
            poem_id: `p${100+i}`,
            title: `Poem ${100+i}`,
            author: 'Author',
            dynasty: '唐',
            status: true,
            createdAt: new Date().toISOString()
          }))
        }
        return []
      }
      return []
    })

    const onOpenChange = vi.fn()
    render(<ReciteRecordsDialog open={true} onOpenChange={onOpenChange} />)
    const loadBtn = screen.queryByTestId('recite-records-load-more-today')
    expect(loadBtn).not.toBeNull()
    if (loadBtn) fireEvent.click(loadBtn)
    await waitFor(() => {
      // check that new Poem 100 series appears in the content
      expect(screen.getByText('Poem 100')).toBeInTheDocument()
    })
  })
})
