from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..database import get_db
from .. import schemas
from ..services.document_service import document_service
from .users import get_current_user_id
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Upload and process a document (PDF, DOCX, TXT)."""
    return await document_service.create_document(db, current_user_id, file, title)

@router.get("/", response_model=List[schemas.DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """List all available documents."""
    return await document_service.get_documents(db, current_user_id)

@router.get("/{document_id}", response_model=schemas.DocumentDetailResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get content of a specific document."""
    return await document_service.get_document(db, document_id, current_user_id)

@router.get("/{document_id}/file")
async def get_document_file(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Serve the actual document file."""
    document = await document_service.get_document(db, document_id, current_user_id)
    if not document.file_path:
        raise HTTPException(status_code=404, detail="File path not found")
    
    import os
    if not os.path.exists(document.file_path):
         raise HTTPException(status_code=404, detail="File not found on disk")
         
    return FileResponse(document.file_path, filename=document.filename)

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete a document."""
    await document_service.delete_document(db, document_id, current_user_id)
    return {"message": "Document deleted successfully"}
