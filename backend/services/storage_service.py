import os
from minio import Minio
from datetime import timedelta

class StorageService:
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.secure = os.getenv("MINIO_SECURE", "False").lower() == "true"
        self.bucket_name = os.getenv("MINIO_BUCKET", "documents")
        
        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure
        )
        
        # Ensure bucket exists
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
        except Exception as e:
            print(f"Error connecting to MinIO: {e}")

    def get_presigned_upload_url(self, object_name: str, expires: int = 3600):
        """Generate a presigned URL for uploading an object."""
        return self.client.presigned_put_object(
            self.bucket_name,
            object_name,
            expires=timedelta(seconds=expires)
        )

    def get_presigned_download_url(self, object_name: str, expires: int = 3600):
        """Generate a presigned URL for downloading an object."""
        return self.client.presigned_get_object(
            self.bucket_name,
            object_name,
            expires=timedelta(seconds=expires)
        )

    def delete_object(self, object_name: str):
        """Delete an object from the bucket."""
        self.client.remove_object(self.bucket_name, object_name)

storage_service = StorageService()
