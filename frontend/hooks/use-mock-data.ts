"use client"

import { useState, useEffect } from "react"

export interface Meeting {
  id: string | number
  title: string
  date: string
  speakers: number
  words: number
  tag: string
  tagColor: string
  avatars: string[]
}

export interface ActionItem {
  id: string | number
  title: string
  status: string
  statusColor: string
  assignee: {
    name: string
    role: string
    avatar: string
  }
  dueDate: string
  dueDateColor: string
  completed: boolean
}

export interface Decision {
  id: string | number
  date: string
  title: string
  meeting: string
  type: "executive" | "product" | "design"
  quote: string
  confirmedBy?: { name: string; avatar: string }[]
  actionItem?: { text: string; avatar: string }
}

const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 1,
    title: "Product Strategy Q3 Briefing",
    date: "Yesterday at 4:15 PM",
    speakers: 5,
    words: 12450,
    tag: "AGR (Agreement)",
    tagColor: "bg-green-100 text-green-700",
    avatars: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=50&h=50&fit=crop&crop=face",
    ],
  },
  {
    id: 2,
    title: "Client Interview: Design Refresh",
    date: "Oct 12, 2023 at 10:00 AM",
    speakers: 2,
    words: 8122,
    tag: "NEU (Neutral)",
    tagColor: "bg-gray-100 text-gray-700",
    avatars: [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
    ],
  },
  {
    id: 3,
    title: "Budget Realignment Taskforce",
    date: "Oct 11, 2023 at 2:30 PM",
    speakers: 3,
    words: 15900,
    tag: "CON (Conflict)",
    tagColor: "bg-orange-100 text-orange-700",
    avatars: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
    ],
  },
]

const INITIAL_ACTIONS: ActionItem[] = [
  {
    id: "IM-402",
    title: "Finalize Q3 Editorial Calendar & Content Pillars",
    status: "OVERDUE",
    statusColor: "bg-red-100 text-red-700",
    assignee: { name: "Sarah Chen", role: "Editor-in-Chief", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face" },
    dueDate: "Oct 12, 2023",
    dueDateColor: "text-red-600",
    completed: false,
  },
  {
    id: "IM-415",
    title: "Review sentiment analysis for \"Climate Tech\"",
    status: "PENDING",
    statusColor: "bg-amber-100 text-amber-700",
    assignee: { name: "James Miller", role: "Senior Analyst", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face" },
    dueDate: "Oct 24, 2023",
    dueDateColor: "text-muted-foreground",
    completed: false,
  },
  {
    id: "IM-398",
    title: "Onboard new freelance illustrators for the annual session",
    status: "DONE",
    statusColor: "bg-green-100 text-green-700",
    assignee: { name: "Elena Rodriguez", role: "Art Director", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face" },
    dueDate: "Oct 05, 2023",
    dueDateColor: "text-muted-foreground",
    completed: true,
  },
]

const INITIAL_DECISIONS: Decision[] = [
  {
    id: 1,
    date: "May 12, 2024",
    title: "Q3 Product Pivot to AI-Native Editor",
    meeting: "Weekly Executive Alignment",
    type: "executive",
    quote:
      "We are formally committing to the pivot. Effective immediately, the frontend team will shift 60% of capacity to the generative workspace module, deprioritizing the legacy dashboard updates for the next six weeks.",
    confirmedBy: [
      { name: "Julia S.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face" },
      { name: "Alex M.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face" },
    ],
  },
  {
    id: 2,
    date: "May 10, 2024",
    title: "Approval of Infrastructure Scaling Budget",
    meeting: "Finance & Operations Monthly Sync",
    type: "executive",
    quote:
      "The $45k additional cloud spend is approved for H2. Sarah will oversee the vendor negotiations for the reserved instances to ensure we stay within the new ceiling.",
    actionItem: { text: "Action item assigned to Sarah T.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face" },
  },
]

export function useMockData() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [actions, setActions] = useState<ActionItem[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load from localStorage on mount
    const storedMeetings = localStorage.getItem("meetric_meetings")
    const storedActions = localStorage.getItem("meetric_actions")
    const storedDecisions = localStorage.getItem("meetric_decisions")

    if (storedMeetings) {
      setMeetings(JSON.parse(storedMeetings))
    } else {
      setMeetings(INITIAL_MEETINGS)
      localStorage.setItem("meetric_meetings", JSON.stringify(INITIAL_MEETINGS))
    }

    if (storedActions) {
      setActions(JSON.parse(storedActions))
    } else {
      setActions(INITIAL_ACTIONS)
      localStorage.setItem("meetric_actions", JSON.stringify(INITIAL_ACTIONS))
    }

    if (storedDecisions) {
      setDecisions(JSON.parse(storedDecisions))
    } else {
      setDecisions(INITIAL_DECISIONS)
      localStorage.setItem("meetric_decisions", JSON.stringify(INITIAL_DECISIONS))
    }

    setIsLoaded(true)
  }, [])

  const addMeeting = (meeting: Omit<Meeting, "id">) => {
    const newMeeting = { ...meeting, id: Date.now() }
    const updatedMeetings = [newMeeting, ...meetings]
    setMeetings(updatedMeetings)
    localStorage.setItem("meetric_meetings", JSON.stringify(updatedMeetings))
    return newMeeting
  }

  const toggleAction = (id: string | number) => {
    const updatedActions = actions.map(action =>
      action.id === id
        ? {
          ...action,
          completed: !action.completed,
          status: !action.completed ? "DONE" : "PENDING",
          statusColor: !action.completed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
        }
        : action
    )
    setActions(updatedActions)
    localStorage.setItem("meetric_actions", JSON.stringify(updatedActions))
  }

  return { meetings, actions, decisions, addMeeting, toggleAction, isLoaded }
}
