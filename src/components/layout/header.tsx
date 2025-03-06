import { useAuth } from '@/lib/auth'
import * as Icons from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useUserType } from '@/hooks/queryUser'
import { useCallback, useEffect, useRef } from 'react'
import { Dialog, DialogDescription, DialogTitle } from '@radix-ui/react-dialog'
import { DialogContentBuilding, DialogHeader } from '../ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { PackagePending } from './logout/packagesPending'
import { ScanPackages } from './logout/scanPackages'
import { useLayout } from './core/useLayout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

import { useTheme } from '../theme-provider'
import SignaturePad from 'react-signature-pad-wrapper'
import { createSignature } from '@/API/signature'
interface HeaderProps {
  children?: React.ReactNode
}

export function Header({ children }: HeaderProps) {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const userLogged = useUserType()
  const sigCanvas = useRef<any>(null)
  const { theme } = useTheme()
  const {
    packVerified,
    packs,
    openPackagePending,
    setOpenPackage,
    setDoormens,
    doormens,
    disableBtn,
    setDisable,
    showSelect,
    setShowSelect,
    selectedDoormen,
    setSelectedDoormen,
  } = useLayout()

  const handleSignOut = async () => {
    const userCurrent = userLogged.data
    console.log('packs ', packs)
    if (userCurrent?.type == 'manager' || packs.length == 0) {
      const { error } = await signOut()
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao sair',
          description: 'Não foi possível fazer logout. Tente novamente.',
        })
      }
    } else {
      setOpenPackage(true)
    }
  }

  useEffect(() => {
    const areAllPackagesVerified = () => {
      if (!packs?.length || !packVerified?.length) return false
      if (packs.length !== packVerified.length) return false

      const verifiedSet = new Set(packVerified)
      return packs.every((pack: any) => verifiedSet.has(pack.id))
    }

    if (areAllPackagesVerified()) {
      setDisable(false)
    } else {
      setDisable(true)
    }
  }, [packVerified, packs])

  const handleDoorman = useCallback(() => {
    setShowSelect(true)
    async function initialize() {
      const { data, error } = await supabase
        .from('doormen')
        .select('*')
        .eq('manager_id', userLogged?.data?.managerId)
        .neq('id', userLogged?.data?.doormenId)

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar porteiros',
          description: 'Não foi possível buscar porteiros. Tente novamente.',
        })
      }

      setDoormens(data)
    }

    initialize()
  }, [])

  async function handleChangeTurn() {
    try {
      const signatureData = {
        apartment_complex_id: String(user?.apartment_complex_id),
        signature_url: String(sigCanvas.current.toDataURL()),
      }
      const signatureResp = await createSignature(signatureData)

      const { error } = await supabase.from('doormen_history').insert({
        doormen_id: selectedDoormen,
        outgoing_doormen_id: userLogged?.data?.doormenId,
        signature_id: signatureResp.id,
        reason: 'Troca de turno',
      })

      if (error) {
        throw new Error(error.message)
      }

      await signOut()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao sair',
        description: 'Não foi possível fazer logout. Tente novamente.',
      })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between p-4 w-full">
        <div className="flex items-center gap-2">
          <Icons.Package className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-primary">Porta Dex</span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Icons.User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.role === 'manager' ? 'Síndico' : 'Porteiro'}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <Icons.LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Dialog open={openPackagePending} onOpenChange={setOpenPackage}>
          <DialogContentBuilding className="w-[calc(100%-24px)] max-w-[650px] p-3 xs:p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-base xs:text-lg">Confirmação de Entregas</DialogTitle>
              <DialogDescription className="text-xs xs:text-sm">
                Confirme as entregas antes de trocar o turno
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pacotes Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <PackagePending userLogged={userLogged.data} />
                </CardContent>
              </Card>

              <Card className="mt-4" hidden={disableBtn == false ? true : false}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Escanear Pacotes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScanPackages />
                </CardContent>
              </Card>

              {!showSelect && (
                <div className="mt-4 flex justify-center">
                  <Button
                    disabled={disableBtn}
                    onClick={handleDoorman}
                    className="min-h-touch-target rounded-mobile w-full sm:w-auto"
                  >
                    Confirmar
                  </Button>
                </div>
              )}

              {showSelect && (
                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="doorman-select"
                      className="text-sm font-medium leading-none block mb-1.5"
                    >
                      Selecione o porteiro que está assumindo o turno
                    </label>
                    <Select
                      onValueChange={(value) => setSelectedDoormen(value)}
                      value={selectedDoormen}
                    >
                      <SelectTrigger className="w-full min-h-touch-target">
                        <SelectValue placeholder="Selecione um porteiro" />
                      </SelectTrigger>
                      <SelectContent>
                        {doormens?.map((doorman: any) => (
                          <SelectItem key={doorman.id} value={doorman.id}>
                            {doorman.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 border rounded-lg p-3 bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="signature-pad" className="text-sm font-medium leading-none">
                        Assinatura do Porteiro
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (sigCanvas.current) {
                            sigCanvas.current.clear()
                          }
                        }}
                        className="h-8 px-2 text-xs"
                      >
                        Limpar
                      </Button>
                    </div>

                    <div className="bg-background border rounded-lg overflow-hidden">
                      <SignaturePad
                        ref={sigCanvas}
                        options={{
                          penColor: theme == 'light' ? 'black' : 'white',
                          minWidth: 1,
                          maxWidth: 3,
                          backgroundColor:
                            theme == 'light' ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)',
                        }}
                        canvasProps={{
                          id: 'signature-pad',
                          className: 'w-full',
                          style: {
                            height: '180px',
                            touchAction: 'none',
                          },
                        }}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground italic">
                      Assine no espaço acima usando o dedo ou mouse
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleChangeTurn}
                      className="min-h-touch-target rounded-mobile w-full sm:w-auto"
                    >
                      <Icons.LogOut className="mr-2 h-4 w-4" />
                      Trocar Turno
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContentBuilding>
        </Dialog>
      </div>

      {children && <div className="p-4">{children}</div>}
    </header>
  )
}
