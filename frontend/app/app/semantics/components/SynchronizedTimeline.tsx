import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FlowSegment } from "../types"
import { EMOTIONS, getEmotionColor } from "../constants"
import { getInitials } from "@/lib/api"
import { useMemo } from "react"

interface SynchronizedTimelineProps {
  flow: FlowSegment[];
  selectedSegment: FlowSegment | null;
  setSelectedSegment: (segment: FlowSegment | null) => void;
}

export function SynchronizedTimeline({ flow, selectedSegment, setSelectedSegment }: SynchronizedTimelineProps) {
  // Use memoization for derived groupings and position maps
  const { groupedSpeakers, flowLength } = useMemo(() => {
    const map: Record<string, { segment: FlowSegment, index: number }[]> = {};
    flow.forEach((seg, index) => {
      if (!map[seg.speaker]) map[seg.speaker] = [];
      map[seg.speaker].push({ segment: seg, index });
    });
    return { groupedSpeakers: map, flowLength: flow.length };
  }, [flow]);

  // Handle flowLength === 0 case gracefully
  if (flowLength === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-serif text-2xl flex items-center gap-3 px-2">Sentiment Timeline</h3>
        <div className="p-8 text-center text-muted-foreground italic border border-dashed rounded-xl border-border/40">
          No segments available in the current timeline.
        </div>
      </div>
    );
  }

  // Position calculation helper (currently index-based, easily switchable to timestamps later)
  const calculatePositionPercentage = (index: number, totalLen: number): string => {
    if (totalLen <= 1) return "0%"; // Clamp if only one
    // We want the width to clamp to 0-100 without overspilling the container.
    const rawVal = (index / (totalLen - 1)) * 100;
    const clamped = Math.max(0, Math.min(100, rawVal));
    return `${clamped}%`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-serif text-2xl flex items-center gap-3">
          Sentiment Timeline
          <Badge variant="outline" className="text-[9px] border-primary/20 text-primary/60 font-bold tracking-widest uppercase">Chronological Grid</Badge>
        </h3>
        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
          <span>{flowLength} segments</span>
        </div>
      </div>

      <div className="space-y-4 px-2 relative min-h-[50px] overflow-hidden">
        {Object.entries(groupedSpeakers).map(([speaker, items]) => {
          const speakCount = items.length;
          return (
            <div key={speaker} className="flex items-center gap-6 group/row">
              <div className="w-32 shrink-0 flex items-center gap-2">
                <Avatar className="h-5 w-5 border border-border/20 bg-muted">
                  <AvatarFallback className="text-[8px] font-bold text-muted-foreground">{getInitials(speaker)}</AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70 truncate">{speaker}</span>
              </div>

              {/* Dynamic Global Grid using Absolute Positioning over a relative container */}
              {/* padding-right guarantees the 100% position marker does not clip the container */}
              <div className="flex-1 h-3 relative flex items-center mr-2">
                {/* Background track line */}
                <div className="absolute left-0 right-0 h-px bg-border/20 z-0" />
                
                {items.map(({ segment, index }) => {
                   const isSelected = selectedSegment?.segment_id === segment.segment_id;
                   const pos = calculatePositionPercentage(index, flowLength);
                   return (
                      <button
                        key={`${segment.segment_id}-${index}`}
                        onClick={() => setSelectedSegment(segment)}
                        className="absolute w-1.5 h-3 -ml-[1px] cursor-pointer hover:scale-y-[2.5] hover:scale-x-[2.5] hover:brightness-125 transition-all z-10"
                        style={{
                          left: pos,
                          backgroundColor: getEmotionColor(segment.emotion),
                          opacity: isSelected ? 1 : 0.65,
                          boxShadow: isSelected ? `0 0 10px ${getEmotionColor(segment.emotion)}` : 'none',
                          zIndex: isSelected ? 20 : 10,
                        }}
                      >
                         <div className={`absolute -top-1 left-0 right-0 h-[1.5px] bg-primary transition-transform origin-center ${isSelected ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
                      </button>
                   );
                })}
              </div>
              <div className="w-24 text-right">
                <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">{speakCount} contribs</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-x-8 pt-4 border-t border-border/10">
        {EMOTIONS.map((emo) => {
          const color = getEmotionColor(emo);
          return (
            <div key={emo} className="flex items-center gap-2 group cursor-default">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors group-hover:text-foreground" style={{ color }}>{emo}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
