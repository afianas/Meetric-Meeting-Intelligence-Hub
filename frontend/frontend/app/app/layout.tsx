"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { ChatWidget } from "@/components/chat-widget"
import { Suspense } from "react"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <AppHeader />
        <main className="p-6 flex-1 relative">{children}</main>
      </div>
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  )
}
