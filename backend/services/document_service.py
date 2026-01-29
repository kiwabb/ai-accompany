import logging
import io
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .. import models, schemas
import pypdf
import docx

logger = logging.getLogger(__name__)

class DocumentService:
    async def parse_file(self, file: UploadFile) -> str:
        """Parse content from uploaded file based on its extension. Returns empty string on failure."""
        content = ""
        filename = file.filename.lower()
        
        try:
            # Read file content for parsing
            file_bytes = await file.read()
            file_stream = io.BytesIO(file_bytes)
            await file.seek(0) # Reset pointer for later saving

            if filename.endswith('.pdf'):
                try:
                    reader = pypdf.PdfReader(file_stream)
                    for page in reader.pages:
                        extracted = page.extract_text()
                        if extracted:
                            content += extracted + "\n"
                except Exception as e:
                    logger.warning(f"Could not extract text from PDF {filename}: {e}")
            
            elif filename.endswith('.docx'):
                try:
                    doc = docx.Document(file_stream)
                    for para in doc.paragraphs:
                        content += para.text + "\n"
                except Exception as e:
                    logger.warning(f"Could not extract text from DOCX {filename}: {e}")
            
            elif filename.endswith('.txt') or filename.endswith('.md'):
                content = file_bytes.decode('utf-8', errors='ignore')
            
            return content.strip()
            
        except Exception as e:
            logger.error(f"Error parsing file {filename}: {str(e)}")
            return "" # Return empty string instead of failing
        finally:
            await file.seek(0)

    async def create_document(
        self, 
        db: AsyncSession, 
        user_id: str, 
        file: UploadFile, 
        title: str
    ) -> models.Document:
        """Save file to disk and save record to database."""
        import os
        import uuid
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(os.getcwd(), "backend", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename to avoid collisions
        ext = file.filename.split('.')[-1] if '.' in file.filename else ""
        unique_filename = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file to disk
        content_bytes = await file.read()
        with open(file_path, "wb") as f:
            f.write(content_bytes)
        
        # Seek back for parsing
        await file.seek(0)
        
        # Attempt text extraction (for search/AI) but don't fail if it's empty
        content = await self.parse_file(file)
        
        file_type = ext.lower() if ext else "unknown"
        
        db_document = models.Document(
            user_id=user_id,
            title=title,
            filename=file.filename,
            content=content, # Now allowed to be empty
            file_type=file_type,
            file_path=file_path
        )
        
        db.add(db_document)
        await db.commit()
        await db.refresh(db_document)
        
        return db_document

    async def get_documents(self, db: AsyncSession, user_id: str):
        """Get all documents for a user."""
        result = await db.execute(
            select(models.Document).where(models.Document.user_id == user_id).order_by(models.Document.created_at.desc())
        )
        return result.scalars().all()

    async def get_document(self, db: AsyncSession, document_id: int, user_id: str):
        """Get a specific document."""
        result = await db.execute(
            select(models.Document).where(models.Document.id == document_id, models.Document.user_id == user_id)
        )
        document = result.scalar_one_or_none()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document

    async def delete_document(self, db: AsyncSession, document_id: int, user_id: str):
        """Delete a document and its file."""
        document = await self.get_document(db, document_id, user_id)
        
        # Delete file from disk if it exists
        if document.file_path:
            try:
                import os
                if os.path.exists(document.file_path):
                    os.remove(document.file_path)
            except Exception as e:
                logger.error(f"Failed to delete file {document.file_path}: {e}")

        await db.delete(document)
        await db.commit()
        return True

document_service = DocumentService()
