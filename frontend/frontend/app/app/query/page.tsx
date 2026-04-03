"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, MessageSquare, Send, Sparkles, Lightbulb, AlertCircle, Copy } from "lucide-react"
import Link from "next/link"
import { chat, ChatResponse } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"

const groupSourcesByMeeting = (sources: any[]) => {
  return sources.reduce((acc: Record<string, { title: string, items: any[] }>, src) => {
    const mId = src.meeting_id;
    if (!acc[mId]) {
      acc[mId] = {
        title: src.meeting_title || `Meeting ${mId.slice(-6).toUpperCase()}`,
        items: []
      };
    }
    acc[mId].items.push(src);
    return acc;
  }, {});
};

const getConfidenceLabel = (conf: number) => {
  const p = conf * 100;
  if (p >= 85) return "Exceptional Match";
  if (p >= 70) return "High Relevance";
  if (p >= 45) return "Good Match";
  return "Partial / Uncertain";
};

const suggestedQueries = [
// ... (rest of imports and constants)
  { title: "What decisions were made?", icon: Lightbulb },
  { title: "Who is responsible for action items?", icon: FileText },
  { title: "What were the key concerns raised?", icon: MessageSquare },
]

interface Message {
  role: "user" | "ai"
  text: string
  response?: ChatResponse
}

export default function QueryEnginePage() {
  const [query, setQuery] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isThinking])

  const toggleSources = (index: number) => {
    setExpandedMessages(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const chatMutation = useMutation({
    mutationFn: (q: string) => chat(q),
    onSuccess: (res) => {
      setMessages(prev => [...prev, { role: "ai", text: res.answer, response: res }])
    },
    onError: () => {
      setMessages(prev => [...prev, { role: "ai", text: "Unable to connect to the backend. Please ensure the server is running." }])
    },
    onSettled: () => {
      setIsThinking(false)
    }
  })

  const handleSubmit = (q: string = query) => {
    const searchQuery = q || query
    if (!searchQuery.trim() || isThinking || chatMutation.isPending) return

    setQuery("")
    setMessages(prev => [...prev, { role: "user", text: searchQuery }])
    setIsThinking(true)
    chatMutation.mutate(searchQuery)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 h-[calc(100vh-7rem)]">
      {/* Main content */}
      <div className="space-y-6 lg:col-span-3 flex flex-col">
        <div className="text-center flex-shrink-0">
          <h1 className="font-serif text-3xl font-semibold text-foreground">How can Meetric help you today?</h1>
          <p className="mt-2 text-muted-foreground">Query across all your meeting transcripts using RAG-powered semantic search.</p>
        </div>

        {/* Suggested queries — only when no messages yet */}
        {messages.length === 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 flex-shrink-0">
            {suggestedQueries.map(s => (
              <Card key={s.title} className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => handleSubmit(s.title)}>
                <CardContent className="p-4">
                  <s.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-medium text-foreground">{s.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Chat area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex flex-col h-full p-0 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                  Ask anything about your meeting history...
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start animate-in fade-in slide-in-from-bottom-2 duration-500"}`}>
                  {msg.role === "ai" ? (
                    <div className="flex items-start gap-4 max-w-[90%] lg:max-w-[80%] group/msg">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-sm border border-primary/10">
                        <Sparkles className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className={`relative rounded-3xl rounded-tl-none px-6 py-5 text-sm text-foreground leading-relaxed shadow-sm border border-border/60 bg-card/50 backdrop-blur-[2px] font-sans transition-all
                          ${msg.response && (msg.response.confidence ?? 0) < 0.25 ? "bg-amber-50/10 border-amber-200/20" : ""}`}>
                          
                          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-3 last:mb-0 text-[14.5px] leading-[1.65] font-serif opacity-95">{children}</p>,
                                ul: ({children}) => <ul className="mb-4 space-y-2 list-none p-0">{children}</ul>,
                                li: ({children}) => (
                                  <li className="flex items-start gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-2 flex-shrink-0" />
                                    <span className="text-[14px] leading-relaxed opacity-90">{children}</span>
                                  </li>
                                ),
                                strong: ({children}) => <strong className="font-bold text-foreground underline decoration-primary/20 underline-offset-2">{children}</strong>,
                                h1: ({children}) => <h1 className="text-lg font-serif font-bold text-foreground mt-4 mb-2">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-serif font-bold text-foreground mt-4 mb-2">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-serif font-bold text-foreground mt-3 mb-1">{children}</h3>,
                              }}
                            >
                              {msg.text || "Thinking..."}
                            </ReactMarkdown>
                          </div>

                          {/* Copy Button */}
                          <div className="absolute right-3 top-3 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text);
                                toast.success("Copied to clipboard");
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Analysis Scope & Results */}
                        {msg.response && (
                          <div className="flex flex-wrap items-center gap-2 px-1">
                            {msg.response.meetings_used > 1 && (
                              <Badge variant="secondary" className="text-[10px] bg-primary/5 text-primary/80 border-primary/10 font-bold">
                                Analyzing {msg.response.meetings_used} meetings
                              </Badge>
                            )}
                            {msg.response.confidence > 0 && (
                                <Badge 
                                    variant="outline" 
                                    className={`text-[10px] bg-background/50 border-none font-bold shadow-sm flex items-center gap-1.5
                                        ${msg.response.confidence >= 0.7 ? "text-emerald-600 bg-emerald-50/50" : msg.response.confidence >= 0.45 ? "text-primary bg-primary/5" : "text-amber-600 bg-amber-50/50"}`}
                                >
                                    <Sparkles className="h-2.5 w-2.5" />
                                    {Math.round(msg.response.confidence * 100)}% {getConfidenceLabel(msg.response.confidence)}
                                </Badge>
                            )}
                            {msg.response.confidence < 0.25 && (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200/50 font-bold animate-pulse">
                                <AlertCircle className="h-2.5 w-2.5 mr-1" /> Semantic Inference
                              </Badge>
                            )}
                            
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium ml-1">
                              <FileText className="h-2.5 w-2.5" />
                              {msg.response.meetings_used} searched
                            </div>

                            {/* View Sources Toggle */}
                            {msg.response.sources.length > 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2.5 text-[10px] font-bold text-primary/80 hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1.5 ml-auto border border-primary/10 rounded-full"
                                onClick={() => toggleSources(i)}
                              >
                                {expandedMessages.has(i) ? "Hide Evidence" : `Show Evidence (${msg.response.sources.length})`}
                                <MessageSquare className={`h-2.5 w-2.5 transition-transform duration-300 ${expandedMessages.has(i) ? "rotate-180" : ""}`} />
                              </Button>
                            )}
                          </div>
                        )}
                        {/* Sources - Expanded View */}
                        {msg.response && msg.response.sources.length > 0 && expandedMessages.has(i) && (
                          <div className="space-y-4 mt-6 pt-6 border-t border-border/50 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                              <Sparkles className="h-3 w-3 text-primary/40" />
                              Traceable Context & Evidence
                            </div>
                            <div className="space-y-6">
                              {Object.entries(groupSourcesByMeeting(msg.response.sources)).map(([mId, mData]: [string, any]) => (
                                <div key={mId} className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono font-bold text-primary/70 bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                                      {mData.title}
                                    </span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                                  </div>
                                  <div className="grid grid-cols-1 gap-3">
                                    {mData.items.map((src: any, si: number) => (
                                      <Link 
                                        key={`${mId}-${si}`} 
                                        href={`/app/transcripts?id=${src.meeting_id}&segment=${src.segment_id}`}
                                        className="group block"
                                      >
                                        <div className="rounded-2xl border border-border/50 bg-background/50 p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border">
                                                {src.speaker?.[0]?.toUpperCase() || "?"}
                                              </div>
                                              <span className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors">{src.speaker || "Unknown"}</span>
                                            </div>
                                            {src.emotion && (
                                              <Badge variant="outline" className="text-[9px] h-4.5 px-2 bg-muted/30 text-muted-foreground border-border/50 font-medium capitalize">
                                                {src.emotion}
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed italic group-hover:text-foreground/90 transition-colors">
                                            "{src.text}"
                                          </p>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl rounded-tr-none bg-primary px-5 py-3 text-sm text-primary-foreground max-w-[75%] shadow-md border border-primary/20 font-medium animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
              {/* Typing indicator */}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-4 flex-shrink-0">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <Input
                  placeholder="Ask about your meetings..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  disabled={isThinking || chatMutation.isPending}
                  className="flex-1 border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                />
                <Button size="icon" disabled={isThinking || chatMutation.isPending || !query.trim()} className="h-8 w-8 rounded-full bg-primary flex-shrink-0" onClick={() => handleSubmit()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <h2 className="font-medium text-foreground">About RAG Search</h2>
        <Card>
          <CardContent className="p-4 space-y-3 text-sm text-muted-foreground">
            <p className="text-xs font-medium text-foreground">How it works</p>
            <div className="space-y-2">
              <div className="flex gap-2"><span className="text-primary font-mono text-xs mt-0.5">1</span><span>Context detection identifies "Focused" vs "Global" intents</span></div>
              <div className="flex gap-2"><span className="text-primary font-mono text-xs mt-0.5">2</span><span>Adaptive search expands to 100 segments for broad queries</span></div>
              <div className="flex gap-2"><span className="text-primary font-mono text-xs mt-0.5">3</span><span>Diversity sampling ensures balanced multi-meeting representation</span></div>
              <div className="flex gap-2"><span className="text-primary font-mono text-xs mt-0.5">4</span><span>BGE Reranker selects high-precision evidence for the LLM</span></div>
            </div>
          </CardContent>
        </Card>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setMessages([])}>Clear conversation</Button>
        )}
      </div>
    </div>
  )
}