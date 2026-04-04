"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateTaskStatus, MappedActionItem, getMeetings, normalizeActionItem, BackendMeeting, getInitials } from "@/lib/api"
import { CheckCircle2, Users, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export default function ActionTrackerPage() {
  const queryClient = useQueryClient()
  const { data: meetings = [], isLoading: loading, error, refetch: load } = useQuery({
    queryKey: ['meetings'],
    queryFn: getMeetings,
  })

  const items = useMemo(() => {
    return (meetings as BackendMeeting[]).flatMap(m => 
      (m.analysis?.action_items || []).map((item, idx) => normalizeActionItem(item, idx, m._id, m.analysis?.meeting_name || "Unknown"))
    )
  }, [meetings])


  const getStatusStyle = (status: string) => {
    if (status === "DONE") return "bg-green-100 text-green-700 border-none font-bold";
    if (status === "OVERDUE") return "bg-red-100 text-red-700 border-none font-bold";
    return "bg-amber-100 text-amber-700 border-none font-bold";
  }

  const [toggling, setToggling] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Done">("All")
  const [ownerFilter, setOwnerFilter] = useState("all")

  const uniqueOwners = useMemo(() => Array.from(new Set(items.map(i => i.assignee.name))), [items])

  const filtered = useMemo(() => items.filter(item => {
    const matchStatus = statusFilter === "All" || (statusFilter === "Pending" && !item.completed) || (statusFilter === "Done" && item.completed)
    const matchOwner = ownerFilter === "all" || item.assignee.name === ownerFilter
    return matchStatus && matchOwner
  }), [items, statusFilter, ownerFilter])

  const stats = useMemo(() => {
    const done = items.filter(i => i.completed).length
    return { total: items.length, done, pending: items.length - done, progress: items.length ? (done / items.length) * 100 : 0 }
  }, [items])

  const toggleMutation = useMutation({
    mutationFn: ({ meetingId, taskId, status }: { meetingId: string, taskId: number, status: string }) => 
      updateTaskStatus(meetingId, taskId, status),
    onSuccess: (_, req) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      queryClient.invalidateQueries({ queryKey: ['meeting', req.meetingId] })
    },
    onSettled: () => {
      setToggling(null)
    }
  })

  const handleToggle = (item: MappedActionItem) => {
    const key = `${item.meetingId}-${item.id}`
    setToggling(key)
    const newStatus = !item.completed ? "completed" : "pending"
    toggleMutation.mutate({ meetingId: item.meetingId, taskId: item.id, status: newStatus })
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2"><div className="h-8 w-64 rounded bg-muted" /><div className="h-4 w-96 rounded bg-muted" /></div>
      <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Card key={i}><CardContent className="h-16 animate-pulse bg-muted/30 p-4 rounded" /></Card>)}</div>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      <Button onClick={() => load()}>Retry</Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-primary">Action Tracker</Badge>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Deliver on Every <span className="italic text-primary">Insight.</span></h1>
        <p className="mt-2 max-w-xl text-muted-foreground">Track action items extracted from your meeting transcripts. Toggle completion to sync with the backend.</p>
      </div>

      <div />

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-foreground">Progress</h2>
            <span className="text-sm text-muted-foreground">{stats.done} of {stats.total} complete</span>
          </div>
          <Progress value={stats.progress} className="mt-4 h-3 transition-all" />
          <div className="mt-4 flex items-center gap-8">
            <div className="text-center"><p className="font-serif text-3xl font-bold text-foreground">{stats.pending}</p><p className="text-xs uppercase tracking-wider text-muted-foreground">Pending</p></div>
            <div className="text-center"><p className="font-serif text-3xl font-bold text-green-600">{stats.done}</p><p className="text-xs uppercase tracking-wider text-muted-foreground">Done</p></div>
            <div className="text-center"><p className="font-serif text-3xl font-bold text-muted-foreground">{stats.total}</p><p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["All", "Pending", "Done"] as const).map(f => (
            <Button key={f} variant={statusFilter === f ? "default" : "ghost"} size="sm" onClick={() => setStatusFilter(f)}>{f}</Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Owners" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {uniqueOwners.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <Card><CardContent className="flex items-center justify-center py-12 text-muted-foreground italic">No action items match this filter.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const key = `${item.meetingId}-${item.id}`
            const isToggling = toggling === key
            // Optimistic check: if toggling, assume the opposite of current state for visual feedback
            const isVisuallyDone = isToggling ? !item.completed : item.completed
            
            return (
              <Card key={key} className={`transition-all hover:shadow-md ${isVisuallyDone ? "opacity-60 bg-muted/20" : ""}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Badge className={isVisuallyDone ? "bg-green-100 text-green-700 border-none font-bold" : getStatusStyle(item.status)}>{isVisuallyDone ? "DONE" : item.status}</Badge>
                    <div>
                      <p className={`text-xs ${isVisuallyDone ? "line-through text-muted-foreground/60" : "text-muted-foreground"}`}>{item.meetingName}</p>
                      <h3 className={`font-medium ${isVisuallyDone ? "line-through text-muted-foreground/80" : "text-foreground"}`}>{item.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-border/40 bg-muted">
                        <AvatarFallback className="text-[10px] font-bold text-muted-foreground">{getInitials(item.assignee.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className={`text-sm font-medium ${isVisuallyDone ? "line-through text-muted-foreground/70" : "text-foreground"}`}>{item.assignee.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${isVisuallyDone ? "line-through text-muted-foreground/50" : "text-muted-foreground"}`}>{isVisuallyDone ? "COMPLETED" : "DUE DATE"}</p>
                      <p className={`text-sm font-medium ${isVisuallyDone ? "line-through text-muted-foreground/70" : "text-primary"}`}>{item.dueDate}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-full hover:bg-primary/5 transition-all group" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(item);
                      }} 
                      disabled={isToggling}
                      title={item.completed ? "Mark as pending" : "Mark as completed"}
                    >
                      {isToggling ? (
                        <div className="relative h-6 w-6 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                          <Loader2 className="h-4 w-4 animate-spin text-primary relative z-10" />
                        </div>
                      ) : (
                        item.completed ? <CheckCircle2 className="h-6 w-6 text-green-600 drop-shadow-sm group-hover:scale-110 transition-transform" /> :
                          <div className="h-6 w-6 rounded-full border-2 border-primary/40 hover:border-primary transition-colors bg-background shadow-inner group-hover:scale-110" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}