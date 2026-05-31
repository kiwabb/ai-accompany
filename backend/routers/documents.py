from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..database import get_db
from .. import schemas, models
from ..services.document_service import document_service
from .users import get_current_user_id
from fastapi.responses import FileResponse, StreamingResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload_url", response_model=schemas.DocumentUploadResponse)
async def get_upload_url(
    request: schemas.DocumentUploadRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    return await document_service.get_upload_url(
        db, 
        current_user_id, 
        request.filename, 
        request.content_type, 
        request.title, 
        request.topic_id
    )

@router.post("/{document_id}/complete", response_model=schemas.DocumentResponse)
async def complete_upload(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    return await document_service.complete_upload(db, document_id, current_user_id)

@router.post("/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Upload and process a document (PDF, DOCX, TXT)."""
    return await document_service.create_document(db, current_user_id, file, title)

@router.get("", response_model=List[schemas.DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    return await document_service.get_documents(db, current_user_id)

@router.get("/{document_id}", response_model=schemas.DocumentDetailResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get content of a specific document."""
    return await document_service.get_document(db, document_id, current_user_id)

@router.patch("/{document_id}", response_model=schemas.DocumentResponse)
async def update_document(
    document_id: int,
    update_data: schemas.DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    return await document_service.update_document(db, document_id, current_user_id, update_data)

@router.get("/{document_id}/file")
async def get_document_file(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Serve the actual document file."""
    document = await document_service.get_document(db, document_id, current_user_id)
    
    storage_key = getattr(document, "storage_key", None)
    if storage_key:
        from ..services.storage_service import storage_service
        try:
            obj_response, content_type, content_length = storage_service.get_object_stream(str(storage_key))
        except Exception:
            raise HTTPException(status_code=503, detail="Document storage temporarily unavailable")

        def iter_chunks():
            try:
                for chunk in obj_response.stream(64 * 1024):
                    yield chunk
            finally:
                obj_response.close()
                obj_response.release_conn()

        headers = {}
        if content_length is not None:
            headers["Content-Length"] = str(content_length)
        filename = getattr(document, "filename", None)
        if filename:
            from urllib.parse import quote
            ascii_fallback = filename.encode("ascii", errors="replace").decode("ascii").replace('"', "")
            headers["Content-Disposition"] = (
                f'inline; filename="{ascii_fallback}"; filename*=UTF-8\'\'{quote(filename, safe="")}'
            )
        return StreamingResponse(iter_chunks(), media_type=content_type, headers=headers)
        
    file_path = getattr(document, "file_path", None)
    if not file_path:
        raise HTTPException(status_code=404, detail="File path not found")
    
    import os
    if not os.path.exists(str(file_path)):
         raise HTTPException(status_code=404, detail="File not found on disk")
         
    return FileResponse(str(file_path), filename=str(document.filename))

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete a document."""
    await document_service.delete_document(db, document_id, current_user_id)
    return {"message": "Document deleted successfully"}


@router.get("/{document_id}/reader-state", response_model=schemas.DocumentReaderStateResponse)
async def get_document_reader_state(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    await document_service.get_document(db, document_id, current_user_id)

    result = await db.execute(
        select(models.DocumentReaderState).where(
            models.DocumentReaderState.user_id == current_user_id,
            models.DocumentReaderState.document_id == document_id,
        )
    )
    state = result.scalar_one_or_none()

    if not state:
        return schemas.DocumentReaderStateResponse(document_id=document_id, bookmarks=[], highlights=[])

    bookmarks_data = getattr(state, "bookmarks", []) or []
    highlights_data = getattr(state, "highlights", []) or []
    bookmarks = [schemas.ReaderBookmark.model_validate(item) for item in bookmarks_data]
    highlights = [schemas.ReaderHighlight.model_validate(item) for item in highlights_data]

    return schemas.DocumentReaderStateResponse(
        document_id=document_id,
        bookmarks=bookmarks,
        highlights=highlights,
    )


@router.put("/{document_id}/reader-state", response_model=schemas.DocumentReaderStateResponse)
async def upsert_document_reader_state(
    document_id: int,
    payload: schemas.DocumentReaderStateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    await document_service.get_document(db, document_id, current_user_id)

    bookmarks_payload = [item.model_dump() for item in payload.bookmarks]
    highlights_payload = [item.model_dump() for item in payload.highlights]

    result = await db.execute(
        select(models.DocumentReaderState).where(
            models.DocumentReaderState.user_id == current_user_id,
            models.DocumentReaderState.document_id == document_id,
        )
    )
    state = result.scalar_one_or_none()

    if state is None:
        state = models.DocumentReaderState(
            user_id=current_user_id,
            document_id=document_id,
        )
        setattr(state, "bookmarks", bookmarks_payload)
        setattr(state, "highlights", highlights_payload)
        db.add(state)
    else:
        setattr(state, "bookmarks", bookmarks_payload)
        setattr(state, "highlights", highlights_payload)
        db.add(state)

    await db.commit()

    return schemas.DocumentReaderStateResponse(
        document_id=document_id,
        bookmarks=payload.bookmarks,
        highlights=payload.highlights,
    )


@router.get("/{document_id}/notebook", response_model=schemas.DocumentNotebookResponse)
async def get_document_notebook(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    await document_service.get_document(db, document_id, current_user_id)

    result = await db.execute(
        select(models.DocumentNotebook).where(
            models.DocumentNotebook.user_id == current_user_id,
            models.DocumentNotebook.document_id == document_id,
        )
    )
    notebook = result.scalar_one_or_none()

    if not notebook:
        return schemas.DocumentNotebookResponse(document_id=document_id, markdown="")

    return schemas.DocumentNotebookResponse(document_id=document_id, markdown=getattr(notebook, "markdown", "") or "")


@router.put("/{document_id}/notebook", response_model=schemas.DocumentNotebookResponse)
async def upsert_document_notebook(
    document_id: int,
    payload: schemas.DocumentNotebookUpdate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    await document_service.get_document(db, document_id, current_user_id)

    result = await db.execute(
        select(models.DocumentNotebook).where(
            models.DocumentNotebook.user_id == current_user_id,
            models.DocumentNotebook.document_id == document_id,
        )
    )
    notebook = result.scalar_one_or_none()

    if notebook is None:
        notebook = models.DocumentNotebook(
            user_id=current_user_id,
            document_id=document_id,
            markdown=payload.markdown,
        )
        db.add(notebook)
    else:
        setattr(notebook, "markdown", payload.markdown)
        db.add(notebook)

    await db.commit()
    return schemas.DocumentNotebookResponse(document_id=document_id, markdown=payload.markdown)
