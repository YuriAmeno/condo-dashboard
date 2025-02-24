import React, { createContext, useState, ReactNode, useEffect } from 'react'

export interface LayoutContextType {
  openPackagePending: boolean
  setOpenPackage: React.Dispatch<React.SetStateAction<boolean>>
  packs: any | null
  setPacks: React.Dispatch<React.SetStateAction<any | null>>
  packVerified: any
  setVerifiedPack: React.Dispatch<React.SetStateAction<any>>
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

interface LayoutProviderProps {
  children: ReactNode
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [openPackagePending, setOpenPackage] = useState(false)
  const [packs, setPacks] = useState<any>(null)
  const [packVerified, setVerifiedPack] = useState<any>([])
  return (
    <LayoutContext.Provider
      value={{
        openPackagePending,
        setOpenPackage,
        packs,
        setPacks,
        packVerified,
        setVerifiedPack,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}
