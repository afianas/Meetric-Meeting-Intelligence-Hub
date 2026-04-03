"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, MessageSquare, Send, Sparkles, Lightbulb } from "lucide-react"
import Link from "next/link"
import { chat, ChatResponse } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"

const groupSourcesByMeeting = (sources: any[]) => {
  return sources.reduce((acc: Record<string, any[]>, src) => {
    if (!acc[src.meeting_id]) acc[src.meeting_id] = [];
    acc[src.meeting_id].push(src);
    return acc;
  }, {});
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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isThinking])

  const chatMutation = useMutation({
    mutationFn: (q: string) => chat(q),
    onSuccess: (response) => {
      let finalAnswer = response.answer;
      if (response.confidence < 0.1 || !response.answer || response.answer.trim() === "") {
        finalAnswer = "No relevant information found";
      }
      setMessages(prev => [...prev, { role: "ai", text: finalAnswer, response }])
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
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="flex items-start gap-3 max-w-[85%]">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-line">{msg.text}</div>
                        {/* Confidence */}
                        {msg.response && msg.response.confidence > 0 && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs text-primary">{Math.round(msg.response.confidence * 100)}% confidence</Badge>
                            <span className="text-xs text-muted-foreground">{msg.response.meetings_used} meeting{msg.response.meetings_used !== 1 ? "s" : ""} searched</span>
                          </div>
                        )}
                        {/* Sources */}
                        {msg.response && msg.response.sources.length > 0 && (
                          <div className="space-y-4 mt-6 pt-6 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                              <MessageSquare className="h-3 w-3 text-primary" />
                              Sources & Traceable Evidence
                            </div>
                            <div className="space-y-6">
                              {Object.entries(groupSourcesByMeeting(msg.response.sources)).map(([mId, mSources]: [string, any]) => (
                                <div key={mId} className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                    <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
                                      Meeting Ref: {mId.slice(-6).toUpperCase()}
                                    </span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-border via-border to-transparent" />
                                  </div>
                                  <div className="grid grid-cols-1 gap-3">
                                    {mSources.map((src: any, si: number) => (
                                      <Link 
                                        key={`${mId}-${si}`} 
                                        href={`/app/transcripts?id=${src.meeting_id}&segment=${src.segment_id}`}
                                        className="group block"
                                      >
                                        <div className="rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 cursor-pointer ring-primary/0 hover:ring-4 ring-primary/5">
                                          <div className="flex items-center justify-between mb-2.5">
                                            <div className="flex items-center gap-2">
                                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                {src.speaker?.[0]?.toUpperCase() || "?"}
                                              </div>
                                              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{src.speaker || "Unknown"}</span>
                                              {src.role && <span className="text-[10px] text-muted-foreground font-medium italic opacity-70">({src.role})</span>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {src.emotion && (
                                                <Badge variant="outline" className="text-[9px] h-4.5 px-2 bg-primary/5 text-primary border-primary/20 font-semibold group-hover:bg-primary/10 transition-colors capitalize">
                                                  {src.emotion}
                                                </Badge>
                                              )}
                                              <div className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1">
                                                Jump to discussion <Send className="h-2.5 w-2.5 rotate-45" />
                                              </div>
                                            </div>
                                          </div>
                                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed italic group-hover:text-foreground transition-colors overflow-hidden relative">
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
                  )}
                  {msg.role === "user" && (
                    <div className="rounded-2xl rounded-tr-none bg-primary px-4 py-3 text-sm text-primary-foreground max-w-[70%]">{msg.text}</div>
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
              <div className="flex gap-2"><span className="text-primary font-mono text-xs mt-0.5">1</span><span>Your query is embedded via MiniLM</span></div>
              <div className="flex gap-2"><span className="text-primary font-mono text-xs mt-0.5">2</span><span>Top 10 segments retrieved from FAISS index</span></div>
              <div className="flex gap-2"><span className="text-primary font-mono text-xs mt-0.5">3</span><span>BGE Reranker refines results for precision</span></div>
              <div className="flex gap-2"><span className="text-primary font-mono text-xs mt-0.5">4</span><span>Llama 3.3-70B synthesizes the answer</span></div>
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