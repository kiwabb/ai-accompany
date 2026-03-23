"""
情感陪伴聊天机器人 - 核心模块
"""

from .config import (
    load_config,
    get_current_model_config,
    AppConfig,
    ModelConfig,
    RAGConfig,
    MemoryConfig,
    WorkflowConfig
)

from .llm_client import LLMClient
from .rag import RAGSystem
from .memory import MemorySystem, ChatMessage
from .workflow import (
    EmotionalSupportWorkflow,
    EmotionAnalysis,
    SupportResponse,
    WorkflowState
)

__all__ = [
    # Config
    "load_config",
    "get_current_model_config",
    "AppConfig",
    "ModelConfig",
    "RAGConfig",
    "MemoryConfig",
    "WorkflowConfig",
    # LLM Client
    "LLMClient",
    # RAG
    "RAGSystem",
    # Memory
    "MemorySystem",
    "ChatMessage",
    # Workflow
    "EmotionalSupportWorkflow",
    "EmotionAnalysis",
    "SupportResponse",
    "WorkflowState",
]

__version__ = "1.0.0"