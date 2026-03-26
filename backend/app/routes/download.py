from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import io
import csv
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

router = APIRouter()


@router.post("/download")
def download_file(data: dict, format: str = Query("csv")):

    # 🔥 HANDLE BOTH CASES (IMPORTANT FIX)
    if "analysis" in data:
        data = data["analysis"]

    decisions = data.get("decisions", [])
    action_items = data.get("action_items", [])

    # ================= CSV =================
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)

        # Decisions
        writer.writerow(["Decisions"])
        for d in decisions:
            writer.writerow([d])

        writer.writerow([])

        # Action Items
        writer.writerow(["Who", "Task", "Deadline"])
        for item in action_items:
            writer.writerow([
                item.get("who"),
                item.get("task"),
                item.get("deadline")
            ])

        output.seek(0)

        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=meeting_summary.csv"}
        )

    # ================= PDF =================
    elif format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer)
        styles = getSampleStyleSheet()

        elements = []

        # Title
        elements.append(Paragraph("Meeting Summary", styles["Title"]))
        elements.append(Spacer(1, 12))

        # Decisions
        elements.append(Paragraph("Decisions:", styles["Heading2"]))
        for d in decisions:
            elements.append(Paragraph(f"- {d}", styles["Normal"]))

        elements.append(Spacer(1, 12))

        # Action Items
        elements.append(Paragraph("Action Items:", styles["Heading2"]))
        for item in action_items:
            text = f"{item.get('who')} → {item.get('task')} (Deadline: {item.get('deadline')})"
            elements.append(Paragraph(text, styles["Normal"]))

        doc.build(elements)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=meeting_summary.pdf"}
        )

    # ================= INVALID =================
    return {"error": "Invalid format. Use 'csv' or 'pdf'"}