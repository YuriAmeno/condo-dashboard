import React, { createContext, useState, ReactNode } from 'react'

export interface LayoutContextType {
  openPackagePending: boolean
  setOpenPackage: React.Dispatch<React.SetStateAction<boolean>>
  packs: any | null
  setPacks: React.Dispatch<React.SetStateAction<any | null>>
  packVerified: any
  setVerifiedPack: React.Dispatch<React.SetStateAction<any>>
  disableBtn: boolean
  setDisable: React.Dispatch<React.SetStateAction<boolean>>
  doormens: any
  setDoormens: React.Dispatch<React.SetStateAction<any>>
  selectedDoormen: any
  setSelectedDoormen: React.Dispatch<React.SetStateAction<any>>
  showSelect: boolean
  setShowSelect: React.Dispatch<React.SetStateAction<boolean>>
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

interface LayoutProviderProps {
  children: ReactNode
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [openPackagePending, setOpenPackage] = useState(false)
  const [packs, setPacks] = useState<any>(null)
  const [packVerified, setVerifiedPack] = useState<any>([])
  const [disableBtn, setDisable] = useState(true)
  const [doormens, setDoormens] = useState<any>()
  const [selectedDoormen, setSelectedDoormen] = useState<any>()
  const [showSelect, setShowSelect] = useState(false)
  return (
    <LayoutContext.Provider
      value={{
        openPackagePending,
        setOpenPackage,
        packs,
        setPacks,
        packVerified,
        setVerifiedPack,
        disableBtn,
        setDisable,
        doormens,
        setDoormens,
        selectedDoormen,
        setSelectedDoormen,
        showSelect,
        setShowSelect,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}
