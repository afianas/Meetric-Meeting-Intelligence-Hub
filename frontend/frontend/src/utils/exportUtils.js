export function dl(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function exportFileCSV(f) {
  const rows = [
    ["Field", "Value"],
    ["File", f.name],
    ["Project", f.project],
    ["Date", f.date],
    ["Speakers", f.speakers],
    ["Words", f.words]
  ];
  dl(new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" }), `${f.name.replace(/\.[^.]+$/, "")}_summary.csv`);
}

export function exportActionsCSV(items) {
  const rows = [
    ["Content", "Who", "Deadline", "Meeting", "Status", "Urgent"],
    ...items.map(i => [`"${i.content}"`, i.who, i.deadline || "—", `"${i.meeting}"`, i.done ? "Done" : "Pending", i.urgent ? "Yes" : "No"])
  ];
  dl(new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" }), "meetric_tracker.csv");
}

export function exportDecisionsCSV(items) {
  const rows = [
    ["Decision", "Meeting", "Date", "Impact", "AI Rationale"],
    ...items.map(i => [
        `"${(i.title || i.content || "").replace(/"/g, '""')}"`, 
        `"${(i.meetingName || i.meeting || "").replace(/"/g, '""')}"`,
        i.date || "—", 
        i.impact || "—", 
        `"${(i.rationale || "None").replace(/"/g, '""')}"`
    ])
  ];
  dl(new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" }), "meetric_decisions.csv");
}
