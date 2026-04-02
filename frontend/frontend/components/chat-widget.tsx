"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { MessageSquare, X, Send, Sparkles, Loader2, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMutation } from "@tanstack/react-query"
import { chat } from "@/lib/api"

interface ChatMsg { role: "user" | "ai"; text: string }

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [query, setQuery] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  // If we are on the transcript page, we might want to restrict queries to this meeting.
  // We'll pass the meetingId if present in the URL.
  const meetingId = pathname.includes("/app/transcripts") ? searchParams.get("id") : null

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen, isThinking])

  // Reset chat if meeting context changes
  useEffect(() => {
    setMessages([])
  }, [meetingId])

  const chatMutation = useMutation({
    mutationFn: (q: string) => chat(q, meetingId || undefined),
    onSuccess: (res) => {
      let finalAnswer = res.answer;
      if (res.confidence < 0.1 || !res.answer || res.answer.trim() === "") {
        finalAnswer = "No relevant information found in the knowledge base.";
      }
      setMessages(prev => [...prev, { role: "ai", text: finalAnswer }])
    },
    onError: () => {
      setMessages(prev => [...prev, { role: "ai", text: "Could not reach the backend. Please try again." }])
    },
    onSettled: () => {
      setIsThinking(false)
    }
  })

  const handleSubmit = () => {
    if (!query.trim() || isThinking || chatMutation.isPending) return
    const q = query
    setQuery("")
    setIsThinking(true)
    setMessages(prev => [...prev, { role: "user", text: q }])
    // If it's closed and the user somehow hits submit...? It shouldn't happen.
    chatMutation.mutate(q)
  }

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center p-0"
      >
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </Button>
    )
  }

  return (
    <Card className={`fixed bottom-6 right-6 shadow-2xl z-50 flex flex-col transition-all duration-300 ${expanded ? 'w-[450px] h-[600px] max-h-[90vh]' : 'w-[350px] h-[450px] max-h-[80vh]'}`}>
      <CardHeader className="p-3 pb-2 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="flex bg-primary/20 p-1.5 rounded-md">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Meetric AI</CardTitle>
            <p className="text-[10px] text-muted-foreground">{meetingId ? "Asking about current meeting" : "Searching all workspace data"}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-muted" onClick={() => setExpanded(!expanded)}>
            {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-muted" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                <Sparkles className="h-8 w-8 text-primary" />
                <p className="text-sm">Hi! I am Meetric AI. Ask me anything about the {meetingId ? "meeting" : "workspace"}.</p>
             </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-xl px-4 py-2 text-sm max-w-[85%] whitespace-pre-line shadow-sm
                ${msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                  : "bg-background border border-border rounded-bl-sm text-foreground"}`
              }>
                {msg.text}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-background border border-border rounded-bl-sm rounded-xl px-4 py-3 text-sm flex gap-1 items-center shadow-sm">
                {[0,1,2].map(i=><div key={i} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:`${i*150}ms`}} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        
        <div className="p-3 bg-background border-t">
          <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="flex items-center gap-2 relative">
            <Input 
              placeholder={meetingId ? "Ask about this meeting..." : "Search across all meetings..."}
              className="pr-10 h-10 shadow-none border-muted-foreground/20 focus-visible:ring-1 bg-muted/30"
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={isThinking || chatMutation.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1 top-1 h-8 w-8 bg-primary hover:bg-primary/90 shrink-0 shadow-sm"
              disabled={!query.trim() || isThinking || chatMutation.isPending}
            >
              {isThinking || chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <Send className="h-4 w-4 text-primary-foreground" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
