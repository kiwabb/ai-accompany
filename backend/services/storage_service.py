import os
from minio import Minio
from datetime import timedelta

class StorageService:
    """
    Why two clients:
      - backend container 通过 host.docker.internal:9000 调用 MinIO API（bucket_exists 等）
      - 浏览器（在宿主上）拿到的 presigned URL 必须用 localhost:9000，否则解析不到主机
    MINIO_PUBLIC_ENDPOINT 控制 presigned URL 中的 host；不设置时回退到 MINIO_ENDPOINT。
    """

    def __init__(self):
        self.internal_endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        self.public_endpoint = os.getenv("MINIO_PUBLIC_ENDPOINT", "localhost:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.secure = os.getenv("MINIO_SECURE", "False").lower() == "true"
        self.bucket_name = os.getenv("MINIO_BUCKET", "documents")

        # 实际 API 调用（在 backend 进程内）走 internal endpoint
        self.client = Minio(
            self.internal_endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure,
        )
        # 仅用于签 presigned URL，host 必须是浏览器可达的。
        # 显式提供 region 避免 minio-py 在签名前真的去访问该 host 探测 region
        # （public_endpoint 在 backend 容器里通常不可达）。
        self.public_client = Minio(
            self.public_endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure,
            region="us-east-1",
        )

        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
        except Exception as e:
            print(f"Error connecting to MinIO: {e}")

    def get_presigned_upload_url(self, object_name: str, expires: int = 3600):
        return self.public_client.presigned_put_object(
            self.bucket_name,
            object_name,
            expires=timedelta(seconds=expires),
        )

    def get_presigned_download_url(self, object_name: str, expires: int = 3600):
        return self.public_client.presigned_get_object(
            self.bucket_name,
            object_name,
            expires=timedelta(seconds=expires),
        )

    def delete_object(self, object_name: str):
        self.client.remove_object(self.bucket_name, object_name)

    def get_object_stream(self, object_name: str):
        """
        通过内部 endpoint 直接拉对象，返回 (urllib3 response, content_type, content_length)。
        调用方负责 close()/release_conn()。
        用于后端流式转发，避免把 MinIO 私有地址暴露给客户端（手机访问 localhost:9000 不通的根因）。
        """
        response = self.client.get_object(self.bucket_name, object_name)
        headers = getattr(response, "headers", {}) or {}
        content_type = headers.get("Content-Type") or headers.get("content-type") or "application/octet-stream"
        length_raw = headers.get("Content-Length") or headers.get("content-length")
        try:
            content_length = int(length_raw) if length_raw is not None else None
        except (TypeError, ValueError):
            content_length = None
        return response, content_type, content_length


storage_service = StorageService()
