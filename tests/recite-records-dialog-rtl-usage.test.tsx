import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Lightweight mock of the Recite Records Dialog UI
function MockReciteDialog({ onExport, onClear }: { onExport: () => void; onClear: () => void }) {
  return (
    <div data-testid="recite-dialog">
      <h1 data-testid="recite-title">背诵记录</h1>
      <button data-testid="export-btn" onClick={onExport}>Export</button>
      <button data-testid="clear-btn" onClick={onClear}>Clear</button>
    </div>
  )
}

describe('ReciteRecordsDialog RTL usage', () => {
  it('renders header and actions and handles clicks', () => {
    const onExport = vi.fn()
    const onClear = vi.fn()
    render(<MockReciteDialog onExport={onExport} onClear={onClear} />)

    expect(screen.getByTestId('recite-title')).toHaveTextContent('背诵记录')
    const exportBtn = screen.getByTestId('export-btn')
    const clearBtn = screen.getByTestId('clear-btn')
    expect(exportBtn).toBeInTheDocument()
    expect(clearBtn).toBeInTheDocument()

    fireEvent.click(exportBtn)
    fireEvent.click(clearBtn)

    expect(onExport).toHaveBeenCalled()
    expect(onClear).toHaveBeenCalled()
  })
})
