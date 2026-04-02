"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { getMeetings, mapMeeting, BackendMeeting, MappedMeeting, deleteMeeting, deleteAllMeetings } from "@/lib/api"
import { BarChart3, Lightbulb, MessageSquare, ListTodo, Filter, ArrowUpDown, Eye, Trash2, Share2, ChevronRight, TrendingUp, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-8 w-12 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}

function MeetingCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [groupBy, setGroupBy] = useState<'none' | 'date' | 'name'>('none')

  const { data: meetings = [], isLoading: loading, error, refetch: load } = useQuery({
    queryKey: ['meetings'],
    queryFn: getMeetings,
  })

  // Mutations
  const { mutate: delMeeting } = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      toast({ title: "Meeting deleted", description: "The meeting has been removed." })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete meeting.", variant: "destructive" })
    }
  })

  const { mutate: clearMeetings } = useMutation({
    mutationFn: deleteAllMeetings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      toast({ title: "All meetings cleared", description: "Your workspace is now empty." })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to clear meetings.", variant: "destructive" })
    }
  })

  const mapped: MappedMeeting[] = meetings.map(mapMeeting)
  const totalDecisions = mapped.reduce((s, m) => s + m.totalDecisions, 0)
  const totalActions = mapped.reduce((s, m) => s + m.totalActionItems, 0)

  // Sorting
  const sortedMeetings = [...mapped]
  if (groupBy === 'date') {
    sortedMeetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } else if (groupBy === 'name') {
    sortedMeetings.sort((a, b) => a.title.localeCompare(b.title))
  }

  // Grouping logic
  const groupedMeetings: Record<string, MappedMeeting[]> = {}
  if (groupBy === 'none') {
    groupedMeetings['All Meetings'] = sortedMeetings
  } else {
    sortedMeetings.forEach(m => {
      const key = groupBy === 'date' ? m.date : m.title
      if (!groupedMeetings[key]) groupedMeetings[key] = []
      groupedMeetings[key].push(m)
    })
  }

  const stats = [
    { label: "Total Meetings", value: mapped.length.toString(), sublabel: "METRICS", change: "all time", icon: BarChart3 },
    { label: "Decisions", value: totalDecisions.toString(), sublabel: "STRATEGIC", change: "extracted by AI", icon: Lightbulb },
    { label: "Dominant Tone", value: "Agreement", sublabel: "TONE", change: "most common sentiment", icon: MessageSquare },
    { label: "Action Items", value: totalActions.toString(), sublabel: "TASKS", change: "across all meetings", changeColor: "text-primary", icon: ListTodo },
  ]

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <h2 className="text-lg font-semibold text-foreground">Could not load meetings</h2>
        <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
        <p className="text-xs text-muted-foreground">Make sure the backend is running at <code className="bg-muted px-1 rounded">localhost:8000</code></p>
        <Button onClick={() => load()} className="mt-2">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Meeting Intelligence Hub</h1>
        <p className="mt-1 text-muted-foreground">
          {loading ? "Loading your meeting intelligence..." : mapped.length === 0
            ? "No meetings indexed yet. Upload a transcript to get started."
            : `${mapped.length} meeting${mapped.length !== 1 ? "s" : ""} indexed — ${totalDecisions} decisions and ${totalActions} action items extracted.`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />) :
          stats.map(stat => (
            <Card key={stat.label} className="relative overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stat.sublabel}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 font-serif text-3xl font-semibold text-foreground">{stat.value}</p>
                    <p className={`mt-1 text-xs ${stat.changeColor || "text-green-600"}`}>{stat.change}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2"><stat.icon className="h-5 w-5 text-primary" /></div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Action items CTA */}
      {!loading && totalActions > 0 && (
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider opacity-80">Action Items</p>
              <p className="mt-2 font-serif text-4xl font-bold">{totalActions} Pending</p>
              <p className="mt-1 text-sm opacity-80">Across {mapped.length} meetings</p>
            </div>
            <Button variant="secondary" className="bg-white text-primary hover:bg-white/90" onClick={() => router.push("/app/actions")}>Review Now</Button>
          </CardContent>
        </Card>
      )}

      {/* Meeting list */}
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Meeting Intelligence</h2>
            <p className="text-sm text-muted-foreground">Manage your meeting repository and insights.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={groupBy} onValueChange={(v: "none" | "date" | "name") => setGroupBy(v)}>
              <SelectTrigger className="w-[180px] h-9">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Group by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="date">Group by Date</SelectItem>
                <SelectItem value="name">Group by Name</SelectItem>
              </SelectContent>
            </Select>

            {mapped.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2 h-9">
                    <Trash2 className="h-4 w-4" /> Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your meeting transcripts and associated intelligence from your workspace.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => clearMeetings()}>
                      Yes, Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array(3).fill(0).map((_, i) => <MeetingCardSkeleton key={i} />)}</div>
        ) : mapped.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-4" />
              <h3 className="font-medium text-foreground">No meetings yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Upload a .txt or .vtt transcript to get started.</p>
              <Button className="mt-4 bg-primary" onClick={() => router.push("/app/upload")}>Upload Transcript</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMeetings).map(([groupKey, groupItems]) => (
              <div key={groupKey} className="space-y-4 relative">
                {groupBy !== 'none' && (
                  <div className="sticky top-16 z-10 bg-background/95 backdrop-blur py-2 shadow-sm rounded-md border-b">
                    <h3 className="font-serif font-medium text-foreground px-4 text-sm uppercase tracking-wide">
                      {groupKey} <span className="text-muted-foreground lowercase font-normal ml-2">({groupItems.length} meetings)</span>
                    </h3>
                  </div>
                )}
                
                <div className="space-y-3">
                  {groupItems.map(meeting => (
                    <Card key={meeting.id} className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30" onClick={() => router.push(`/app/transcripts?id=${meeting.id}`)}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><MessageSquare className="h-5 w-5 text-primary" /></div>
                          <div>
                            <h3 className="font-medium text-foreground">{meeting.title}</h3>
                            <p className="text-sm text-muted-foreground">{meeting.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="hidden sm:flex -space-x-2">
                            {meeting.avatars.map((avatar, i) => (
                              <Avatar key={i} className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={avatar} /><AvatarFallback>U</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <p className="hidden sm:block text-xs text-muted-foreground">{meeting.speakers} SPEAKERS</p>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-foreground">{meeting.words.toLocaleString()}</p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Words</p>
                          </div>
                          <Badge className={`hidden md:inline-flex ${meeting.tagColor}`}>{meeting.tag}</Badge>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={e => { e.stopPropagation(); router.push(`/app/transcripts?id=${meeting.id}`) }}><Eye className="h-4 w-4" /></Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={e => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete meeting?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{meeting.title}"? All extracted decisions, action items, and data will be lost.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => delMeeting(meeting.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom cards */}
      {!loading && mapped.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="font-serif text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push("/app/query")}><MessageSquare className="h-4 w-4" />Query across all meetings</Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push("/app/actions")}><ListTodo className="h-4 w-4" />View Action Tracker</Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push("/app/decisions")}><Lightbulb className="h-4 w-4" />Review Decisions</Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push("/app/semantics")}><TrendingUp className="h-4 w-4" />Speaker Analytics</Button>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-2"><Lightbulb className="h-5 w-5" /><p className="text-xs uppercase tracking-wider opacity-70">Intelligence Summary</p></div>
              <h3 className="mt-4 font-serif text-2xl font-semibold">RAG-Powered Search</h3>
              <p className="mt-2 text-sm opacity-80">Use the Query Engine to ask natural language questions across all your meeting transcripts.</p>
              <Button className="mt-6 bg-primary hover:bg-primary/90" onClick={() => router.push("/app/query")}>Open Query Engine <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}