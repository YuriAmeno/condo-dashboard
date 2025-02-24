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
import { useEffect, useState } from 'react'
import { Dialog, DialogDescription, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog'
import { DialogContentBuilding, DialogHeader } from '../ui/dialog'
import { Card, CardContent, CardHeader } from '../ui/card'
import { PackagePending } from './logout/packagesPending'
import { ScanPackages } from './logout/scanPackages'
import { useLayout } from './core/useLayout'

interface HeaderProps {
  children?: React.ReactNode
}

export function Header({ children }: HeaderProps) {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const userLogged = useUserType()

  const { packVerified, packs, openPackagePending, setOpenPackage } = useLayout()

  const handleSignOut = async () => {
    const userCurrent = userLogged.data
    if (userCurrent?.type == 'manager') {
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
    console.log(packVerified)
  }, [packVerified])

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
          <DialogContentBuilding>
            <DialogHeader>
              <DialogTitle>Confirmação de Entregas</DialogTitle>
              <DialogDescription>Confirme as entregas antes de trocar o turno</DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <Card>
                <CardHeader>Pacotes Pendentes</CardHeader>
                <CardContent>
                  <PackagePending
                    userLogged={userLogged.data}
                    // handlePack={(dta) => getPackages(dta)}
                  />
                </CardContent>
              </Card>

              <Card className="mt-5">
                <CardHeader>Escanear Pacotes</CardHeader>
                <CardContent>
                  <ScanPackages
                  // packagesPending={packs}
                  // handleVerifyPack={(dta: any) => handleVerifiedPack(dta)}
                  />
                </CardContent>
              </Card>
            </div>
          </DialogContentBuilding>
        </Dialog>
      </div>

      {children && <div className="p-4">{children}</div>}
    </header>
  )
}
