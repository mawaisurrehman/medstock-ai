"""Reports API routes with PDF generation."""
from __future__ import annotations

import io
from datetime import date
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.alert import Alert, AlertType, AlertStatus, AlertSeverity
from app.models.recommendation import Recommendation, RecommendationStatus
from app.models.medicine import Medicine
from app.schemas.assistant import ReportTemplateResponse

router = APIRouter(prefix="/api/reports", tags=["Reports"])

REPORT_TEMPLATES = [
    {"id": "rep-procurement", "title": "Procurement & Purchase Requisition Report", "description": "Consolidated purchase orders and recommended quantities.", "category": "Procurement", "frequency": "Weekly / On-demand", "lastGenerated": "Today, 09:15 AM", "format": "PDF"},
    {"id": "rep-inventory", "title": "Medicine Inventory & Stock Balance Audit", "description": "Facility-level stock positions and safety stock deficits.", "category": "Inventory", "frequency": "Monthly", "lastGenerated": "1 Sep 2026", "format": "PDF"},
    {"id": "rep-expiry", "title": "Batch Expiry & Waste Mitigation Register", "description": "Expiring batches breakdown and salvage transfers.", "category": "Expiry", "frequency": "Bi-weekly", "lastGenerated": "31 Aug 2026", "format": "Excel"},
    {"id": "rep-forecast", "title": "Demand Forecasting & Accuracy Report", "description": "Model predictions vs actual, MAPE metrics.", "category": "Forecast", "frequency": "Monthly", "lastGenerated": "2 Sep 2026", "format": "PDF"},
    {"id": "rep-management", "title": "Executive Healthcare Inventory Intelligence Summary", "description": "High-level KPI scorecard and cost avoidance.", "category": "Executive", "frequency": "Quarterly", "lastGenerated": "15 Aug 2026", "format": "PDF"},
]


@router.get("", response_model=list[ReportTemplateResponse])
def list_reports(current_user: User = Depends(get_current_user)):
    return [ReportTemplateResponse(**t) for t in REPORT_TEMPLATES]


@router.get("/procurement")
def generate_procurement_pdf(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    story.append(Paragraph("MedStock AI", styles["Title"]))
    story.append(Paragraph("Procurement Recommendation Report", styles["Heading2"]))
    story.append(Paragraph(f"Generated: {date.today().strftime('%d %B %Y')}", styles["Normal"]))
    story.append(Spacer(1, 20))

    story.append(Paragraph("Critical Stockout Items", styles["Heading3"]))
    alerts = db.query(Alert).filter(Alert.type == AlertType.STOCKOUT, Alert.severity == AlertSeverity.CRITICAL).all()
    if alerts:
        data = [["Medicine", "Days Remaining"]]
        for a in alerts:
            med = db.query(Medicine).filter(Medicine.id == a.medicine_id).first()
            data.append([med.name if med else str(a.medicine_id), str(a.days_remaining or "N/A")])
        t = Table(data)
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.grey), ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke)]))
        story.append(t)
    story.append(Spacer(1, 20))

    story.append(Paragraph("Pending Recommendations", styles["Heading3"]))
    recs = db.query(Recommendation).filter(Recommendation.status == RecommendationStatus.PENDING).all()
    if recs:
        data = [["Type", "Quantity", "Confidence"]]
        for r in recs:
            data.append([r.type.value, str(r.quantity), f"{int(r.confidence)}%"])
        t = Table(data)
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.lightblue)]))
        story.append(t)
    story.append(Spacer(1, 20))

    story.append(Paragraph("DISCLAIMER: AI-generated recommendations require authorized human review.", styles["Italic"]))
    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=MedStock_Procurement_{date.today()}.pdf"})
