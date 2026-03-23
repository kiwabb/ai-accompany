"""
配置模块测试
"""
import pytest
from pathlib import Path
import tempfile
import yaml
from src.config import load_config, AppConfig, ModelConfig, RAGConfig, MemoryConfig, WorkflowConfig


class TestConfig:
    """配置测试"""

    def test_create_model_config(self):
        """测试创建模型配置"""
        config = ModelConfig(
            api_key="test-key",
            model="test-model",
            base_url="https://test.com/api/v3",
            temperature=0.5
        )
        assert config.api_key == "test-key"
        assert config.model == "test-model"
        assert config.base_url == "https://test.com/api/v3"
        assert config.temperature == 0.5

    def test_create_rag_config(self):
        """测试创建 RAG 配置"""
        config = RAGConfig(
            enabled=True,
            chunk_size=500,
            chunk_overlap=100,
            collection_name="test-collection"
        )
        assert config.enabled is True
        assert config.chunk_size == 500
        assert config.chunk_overlap == 100
        assert config.collection_name == "test-collection"

    def test_create_memory_config(self):
        """测试创建记忆配置"""
        config = MemoryConfig(
            enabled=True,
            max_history_length=100,
            summary_interval=20
        )
        assert config.enabled is True
        assert config.max_history_length == 100
        assert config.summary_interval == 20

    def test_create_workflow_config(self):
        """测试创建工作流配置"""
        config = WorkflowConfig(
            enable_emotion_analysis=True,
            enable_support_generation=True
        )
        assert config.enable_emotion_analysis is True
        assert config.enable_support_generation is True

    def test_load_config_from_file(self):
        """测试从文件加载配置"""
        # 创建临时配置文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            config_data = {
                "current_model": "test-model",
                "models": {
                    "test-model": {
                        "api_key": "test-api-key",
                        "model": "test-model-name",
                        "base_url": "https://test.com/api/v3",
                        "temperature": 0.1
                    }
                },
                "rag": {
                    "enabled": True,
                    "chunk_size": 1000,
                    "chunk_overlap": 200,
                    "collection_name": "test-collection"
                },
                "memory": {
                    "enabled": True,
                    "max_history_length": 50,
                    "summary_interval": 10
                },
                "workflow": {
                    "enable_emotion_analysis": True,
                    "enable_support_generation": True
                }
            }
            yaml.dump(config_data, f)
            temp_path = f.name

        try:
            # 加载配置
            config = load_config(temp_path)

            # 验证配置
            assert isinstance(config, AppConfig)
            assert config.current_model == "test-model"
            assert "test-model" in config.models
            assert config.models["test-model"].api_key == "test-api-key"
            assert config.rag.enabled is True
            assert config.memory.enabled is True
            assert config.workflow.enable_emotion_analysis is True

        finally:
            # 清理临时文件
            Path(temp_path).unlink()

    def test_load_nonexistent_config(self):
        """测试加载不存在的配置文件"""
        with pytest.raises(FileNotFoundError):
            load_config("nonexistent_config.yaml")

    def test_invalid_model_config(self):
        """测试无效的模型配置"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            config_data = {
                "current_model": "nonexistent-model",
                "models": {
                    "test-model": {
                        "api_key": "test-api-key",
                        "model": "test-model-name",
                        "base_url": "https://test.com/api/v3",
                        "temperature": 0.1
                    }
                }
            }
            yaml.dump(config_data, f)
            temp_path = f.name

        try:
            config = load_config(temp_path)
            # 这里不会抛出异常，只有在获取模型配置时才会
            from src.config import get_current_model_config
            with pytest.raises(ValueError):
                get_current_model_config(config)
        finally:
            Path(temp_path).unlink()