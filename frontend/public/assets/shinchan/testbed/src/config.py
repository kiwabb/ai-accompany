import yaml
from pathlib import Path
from typing import Dict, Any
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class ModelConfig(BaseModel):
    """模型配置"""
    api_key: str
    model: str
    base_url: str
    temperature: float = 0.1


class RAGConfig(BaseModel):
    """RAG 配置"""
    enabled: bool = True
    chunk_size: int = 1000
    chunk_overlap: int = 200
    collection_name: str = "emotional_support_knowledge"


class MemoryConfig(BaseModel):
    """Memory 配置"""
    enabled: bool = True
    max_history_length: int = 50
    summary_interval: int = 10


class WorkflowConfig(BaseModel):
    """Workflow 配置"""
    enable_emotion_analysis: bool = True
    enable_support_generation: bool = True


class AppConfig(BaseSettings):
    """应用配置"""
    current_model: str
    models: Dict[str, ModelConfig]
    rag: RAGConfig = Field(default_factory=RAGConfig)
    memory: MemoryConfig = Field(default_factory=MemoryConfig)
    workflow: WorkflowConfig = Field(default_factory=WorkflowConfig)

    model_config = {
        "env_file": ".env",
        "case_sensitive": False
    }


def load_config(config_path: str = "config.yaml") -> AppConfig:
    """加载配置文件"""
    config_file = Path(config_path)
    if not config_file.exists():
        raise FileNotFoundError(f"配置文件不存在: {config_path}")

    with open(config_file, "r", encoding="utf-8") as f:
        config_data = yaml.safe_load(f)

    return AppConfig(**config_data)


def get_current_model_config(config: AppConfig) -> ModelConfig:
    """获取当前使用的模型配置"""
    if config.current_model not in config.models:
        raise ValueError(f"模型配置不存在: {config.current_model}")
    return config.models[config.current_model]