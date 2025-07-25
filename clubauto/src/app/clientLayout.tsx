"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { currentClub, setCurrentClub } = useData()

  // Routes where we don't show the sidebar
  const noSidebarRoutes = ["/", "/login", "/select-club"]
  const showSidebar = user && currentClub && !noSidebarRoutes.includes(pathname)

  // Restore selected club from localStorage on page refresh
  useEffect(() => {
    if (user && !currentClub) {
      const savedClub = localStorage.getItem("selectedClub")
      if (savedClub) {
        try {
          const clubData = JSON.parse(savedClub)
          setCurrentClub(clubData)
        } catch (error) {
          console.error("Error parsing saved club data:", error)
          localStorage.removeItem("selectedClub")
        }
      }
    }
  }, [user, currentClub, setCurrentClub])

  // Get page title based on pathname

  if (showSidebar) {
    return (
      <>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-4 shrink-0 items-center gap-2 border-b px-4">
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </>
    )
  }

  // For pages without sidebar, render children directly with full width
  return <div className="min-h-screen w-full">{children}</div>
}
