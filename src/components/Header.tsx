"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, LayoutDashboard, Users, UserCircle } from "lucide-react"
import Link from "next/link"

interface HeaderProps {
  user?: {
    full_name?: string
    avatar_url?: string
    role?: "admin" | "reader"
  } | null
  onSignIn?: () => void
  onSignOut?: () => void
}

export function Header({ user, onSignIn, onSignOut }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container relative flex h-20 items-center justify-between px-4 max-w-md mx-auto">
        {/* Logo e Título à Esquerda */}
        <Link 
          href="/" 
          className="flex items-center gap-3 transition-transform active:scale-95 group"
          onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <img 
            src="/Logo-Liturgia-SJE.png" 
            alt="Logo Liturgia SJE" 
            className="h-14 w-auto drop-shadow-sm group-hover:drop-shadow-md transition-all"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight text-stone-800 leading-none">
              Liturgia SJE
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Painel do Leitor
            </span>
          </div>
        </Link>

        {/* Perfil/Login à Direita */}
        <div className="absolute right-4 flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <Avatar className="h-14 w-14 cursor-pointer border-2 border-stone-200 transition-colors hover:border-stone-300">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-stone-100 text-stone-600">
                    <UserCircle className="h-9 w-9" />
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="truncate">{user?.full_name || "Usuário"}</span>
                      <span className="text-xs font-normal text-stone-500 capitalize">
                        {user?.role === "admin" ? "Administrador" : "Leitor"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <Link href="/perfil" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  }
                />
                
                {user?.role === "admin" && (
                  <>
                    <DropdownMenuItem
                      render={
                        <Link href="/admin/membros" className="flex items-center w-full">
                          <Users className="mr-2 h-4 w-4" />
                          <span>Gestão de Membros</span>
                        </Link>
                      }
                    />
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => onSignOut?.()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button 
              onClick={() => onSignIn?.()}
              className="focus:outline-none transition-transform active:scale-95"
              aria-label="Fazer login com Google"
            >
              <Avatar className="h-14 w-14 cursor-pointer border-2 border-stone-200 transition-colors hover:border-stone-300">
                <AvatarFallback className="bg-stone-100 text-stone-600">
                  <UserCircle className="h-9 w-9" />
                </AvatarFallback>
              </Avatar>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
