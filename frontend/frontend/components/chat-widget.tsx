"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { MessageSquare, X, Send, Sparkles, Loader2, Maximize2, Minimize2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMutation } from "@tanstack/react-query"
import { chat, ChatResponse } from "@/lib/api"
import Link from "next/link"

interface ChatMsg { 
  role: "user" | "ai"; 
  text: string;
  response?: ChatResponse;
}

const getConfidenceLabel = (conf: number) => {
  const p = conf * 100;
  if (p >= 85) return "Exceptional Match";
  if (p >= 70) return "High Relevance";
  if (p >= 45) return "Good Match";
  return "Partial / Uncertain";
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [expandedSources, setExpandedSources] = useState<number[]>([])
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

  const toggleSources = (index: number) => {
    setExpandedSources(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const chatMutation = useMutation({
    mutationFn: (q: string) => chat(q, meetingId || undefined),
    onSuccess: (res) => {
      setMessages(prev => [...prev, { role: "ai", text: res.answer, response: res }])
    },
    onError: () => {
      setMessages(prev => [...prev, { role: "ai", text: "Could not reach the backend. Please try again." }])
    },
    onSettled: () => {
      setIsThinking(false)
    }
  })

  // Listen for external query events
  useEffect(() => {
    const handleExternalQuery = (e: Event) => {
      const customEvent = e as CustomEvent;
      const q = customEvent.detail?.query;
      if (q) {
        setIsOpen(true);
        setQuery("");
        setIsThinking(true);
        setMessages(prev => [...prev, { role: "user", text: q }]);
        chatMutation.mutate(q);
      }
    };
    window.addEventListener('meetric-chat-query', handleExternalQuery);
    return () => window.removeEventListener('meetric-chat-query', handleExternalQuery);
  }, [chatMutation]);

  const handleSubmit = () => {
    if (!query.trim() || isThinking || chatMutation.isPending) return
    const q = query
    setQuery("")
    setIsThinking(true)
    setMessages(prev => [...prev, { role: "user", text: q }])
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
            <div key={i} className="flex flex-col space-y-2">
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-xl px-4 py-2 text-sm max-w-[88%] whitespace-pre-line shadow-sm border border-border/50 backdrop-blur-md font-serif animate-in fade-in slide-in-from-bottom-2 duration-300
                  ${msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-br-sm shadow-md font-sans" 
                    : (msg.response && (msg.response.confidence ?? 0) < 0.25 ? "bg-amber-50/20 border-amber-200/30 rounded-bl-sm" : "bg-muted/40 rounded-bl-sm text-foreground shadow-inner")}`
                }>
                  {msg.text || "Thinking..."}
                </div>
              </div>
              
              {/* Confidence Badge */}
              {msg.role === "ai" && msg.response && msg.response.confidence > 0 && (
                <div className="flex justify-start pl-2">
                  <Badge variant="outline" className={`text-[8px] h-3.5 px-1.5 font-bold ${msg.response.confidence >= 0.85 ? "text-green-600 border-green-200 bg-green-50" : msg.response.confidence >= 0.6 ? "text-primary border-primary/20 bg-primary/5" : "text-amber-600 border-amber-200 bg-amber-50"}`}>
                    {Math.round(msg.response.confidence * 100)}% - {getConfidenceLabel(msg.response.confidence)}
                  </Badge>
                </div>
              )}
              
              {/* Sources Accordion */}
              {msg.role === "ai" && msg.response && msg.response.sources.length > 0 && (
                <div className="flex justify-start pl-2">
                  <div className="flex flex-col w-[90%]">
                    <button 
                      onClick={() => toggleSources(i)}
                      className="group flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-primary/5 w-fit"
                    >
                      <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                      {expandedSources.includes(i) ? "Hide Evidence" : `View Evidence (${msg.response.sources.length})`}
                      {expandedSources.includes(i) ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                    </button>
                    
                    {expandedSources.includes(i) && (
                      <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {msg.response.sources.slice(0, 3).map((src, si) => (
                          <Link 
                            key={`${i}-${si}`} 
                            href={`/app/transcripts?id=${src.meeting_id}&segment=${src.segment_id}`}
                            className="group block"
                          >
                            <div className="rounded-lg border border-border bg-background p-2.5 transition-all duration-300 hover:border-primary/50 hover:shadow-md cursor-pointer border-l-4 border-l-primary/10 hover:border-l-primary">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-[7px] font-bold text-primary">
                                    {src.speaker?.[0]?.toUpperCase() || "?"}
                                  </div>
                                  <span className="text-[9px] font-bold text-foreground group-hover:text-primary transition-colors">{src.speaker || "Unknown"}</span>
                                </div>
                                {(msg.response?.confidence ?? 0) < 0.25 && (
                                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-amber-50/50 text-amber-700 border-none font-bold animate-pulse">
                                    <AlertCircle className="h-2.5 w-2.5 mr-1" /> Semantic Inference
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[9px] text-muted-foreground line-clamp-2 italic leading-normal group-hover:text-foreground transition-colors transition-opacity duration-300">
                                "{src.text}"
                              </p>
                              <div className="mt-1 flex items-center justify-end">
                                <span className="text-[8px] font-bold text-primary opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-0.5">
                                  Jump to discussion →
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                        {msg.response.sources.length > 3 && (
                          <div className="text-[8px] text-center text-muted-foreground italic bg-muted/30 py-1 rounded-md">
                            + {msg.response.sources.length - 3} more sources in Query Engine
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
