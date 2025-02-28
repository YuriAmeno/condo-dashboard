import { useContext } from 'react'
import { LayoutContext, type LayoutContextType } from './LayoutContext'

export function useLayout(): LayoutContextType {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useCalendar deve ser usado dentro de um LayoutProvider')
  }
  return context
}
