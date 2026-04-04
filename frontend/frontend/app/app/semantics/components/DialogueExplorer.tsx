import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, RefreshCw, TrendingUp, Sparkles } from "lucide-react"
import Link from "next/link"
import { FlowSegment } from "../types"
import { getEmotionBg, getEmotionColor } from "../constants"
import { getInitials } from "@/lib/api"

interface DialogueExplorerProps {
  selectedSegment: FlowSegment | null;
  setSelectedSegment: (segment: FlowSegment | null) => void;
}

export function DialogueExplorer({ selectedSegment, setSelectedSegment }: DialogueExplorerProps) {
  return (
    <div className="lg:col-span-7 space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-serif text-2xl flex items-center gap-3">
          Explorer
          {selectedSegment && (
            <Badge variant="outline" className="text-[9px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 border-primary/20 animate-pulse tracking-widest uppercase">
              Selected
            </Badge>
          )}
        </h3>
        <div className="h-9 w-9 rounded-xl bg-background/50 border border-border/40 flex items-center justify-center text-primary shadow-sm backdrop-blur-sm">
          <MessageSquare className="h-4 w-4" />
        </div>
      </div>

      {selectedSegment ? (
        <Card className="border-border/40 bg-background/40 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden relative animate-in zoom-in-95 duration-500 hover:border-primary/20 transition-all">
          <CardContent className="p-8 space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="h-16 w-16 border-2 border-background shadow-xl shrink-0 bg-muted">
                  <AvatarFallback className="text-xl font-bold text-muted-foreground">{getInitials(selectedSegment.speaker)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1.5 min-w-0">
                  <p className="text-2xl font-serif text-foreground truncate">
                    {selectedSegment.speaker}
                  </p>
                  <div className="flex items-center gap-3">
                    <Badge
                      style={{ backgroundColor: getEmotionBg(selectedSegment.emotion, 0.15), color: getEmotionColor(selectedSegment.emotion) }}
                      className="text-[10px] font-sans font-bold uppercase tracking-widest border-none px-3 h-7 rounded-lg"
                    >
                      {selectedSegment.emotion}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="h-9 px-4 rounded-xl border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/20 shadow-sm transition-all group">
                  <Link href={`/app/transcripts?id=${selectedSegment.meeting_id}&segment=${selectedSegment.segment_id}`} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                    <TrendingUp className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" /> Inspect
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedSegment(null)} className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-background/80 hover:text-primary">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="p-8 rounded-2xl bg-background/60 shadow-lg border border-border/10 text-foreground text-xl md:text-2xl leading-relaxed font-serif italic relative overflow-hidden group/quote">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/30 group-hover/quote:bg-primary transition-all duration-700" />
                <span className="absolute -top-6 -left-3 text-9xl text-primary/5 select-none font-serif italic">“</span>
                <p className="relative z-10 text-foreground/90">
                  {selectedSegment.text}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-border/40 bg-background/20 backdrop-blur-sm rounded-3xl py-16 px-8 text-center group transition-all hover:bg-background/40 hover:border-primary/10">
          <div className="flex flex-col items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-muted/10 border border-border/20 shadow-xl flex items-center justify-center relative rotate-2 group-hover:rotate-0 transition-all duration-700">
              <MessageSquare className="h-7 w-7 text-muted-foreground/30" />
              <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shadow-lg">
                <Sparkles className="h-2.5 w-2.5 text-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-serif font-black text-foreground/40">Select a dialogue segment</p>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-bold uppercase tracking-[0.2em]">
                to reveal psychological subtext and core quotes.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
