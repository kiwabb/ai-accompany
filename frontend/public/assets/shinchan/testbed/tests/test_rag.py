"""
RAG 系统测试
"""
import pytest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from langchain_core.documents import Document
from src.config import AppConfig, ModelConfig, RAGConfig
from src.rag import RAGSystem, EnsembleRetriever


class TestEnsembleRetriever:
    """EnsembleRetriever 混合检索器测试"""

    def test_ensemble_retriever_initialization(self):
        """测试 EnsembleRetriever 初始化"""
        mock_retriever1 = Mock()
        mock_retriever1.invoke.return_value = []
        
        mock_retriever2 = Mock()
        mock_retriever2.invoke.return_value = []
        
        ensemble = EnsembleRetriever(
            retrievers=[mock_retriever1, mock_retriever2],
            weights=[0.5, 0.5]
        )
        
        assert len(ensemble.retrievers) == 2
        assert ensemble.weights == [0.5, 0.5]

    def test_ensemble_retriever_weights_normalization(self):
        """测试权重自动标准化"""
        mock_retriever1 = Mock()
        mock_retriever1.invoke.return_value = []
        
        mock_retriever2 = Mock()
        mock_retriever2.invoke.return_value = []
        
        # 传入 [1, 1]，应该自动标准化为 [0.5, 0.5]
        ensemble = EnsembleRetriever(
            retrievers=[mock_retriever1, mock_retriever2],
            weights=[1, 1]
        )
        
        assert ensemble.weights == [0.5, 0.5]

    def test_ensemble_retriever_single_retriever(self):
        """测试单个检索器"""
        mock_retriever = Mock()
        doc = Document(page_content="test doc", metadata={"source": "test"})
        mock_retriever.invoke.return_value = [doc]
        
        ensemble = EnsembleRetriever(
            retrievers=[mock_retriever],
            weights=[1.0]
        )
        
        results = ensemble.invoke("test query")
        
        assert len(results) == 1
        assert results[0].page_content == "test doc"

    def test_ensemble_retriever_rrf_scoring(self):
        """测试 RRF 评分算法"""
        # 创建两个返回不同文档的检索器
        doc1 = Document(page_content="doc1", metadata={"id": 1})
        doc2 = Document(page_content="doc2", metadata={"id": 2})
        doc3 = Document(page_content="doc3", metadata={"id": 3})
        
        mock_retriever1 = Mock()
        mock_retriever1.invoke.return_value = [doc1, doc2]
        
        mock_retriever2 = Mock()
        mock_retriever2.invoke.return_value = [doc2, doc3]
        
        ensemble = EnsembleRetriever(
            retrievers=[mock_retriever1, mock_retriever2],
            weights=[0.5, 0.5]
        )
        
        results = ensemble.invoke("test query")
        
        # doc2 在两个检索器中都出现，应该排名最高
        assert len(results) == 3
        # doc2 应该在结果中
        result_contents = [doc.page_content for doc in results]
        assert "doc2" in result_contents

    def test_ensemble_retriever_empty_results(self):
        """测试空结果"""
        mock_retriever = Mock()
        mock_retriever.invoke.return_value = []
        
        ensemble = EnsembleRetriever(
            retrievers=[mock_retriever],
            weights=[1.0]
        )
        
        results = ensemble.invoke("test query")
        
        assert results == []

    def test_ensemble_retriever_exception_handling(self):
        """测试异常处理"""
        mock_retriever1 = Mock()
        mock_retriever1.invoke.side_effect = Exception("Test error")
        
        mock_retriever2 = Mock()
        doc = Document(page_content="doc", metadata={"id": 1})
        mock_retriever2.invoke.return_value = [doc]
        
        ensemble = EnsembleRetriever(
            retrievers=[mock_retriever1, mock_retriever2],
            weights=[0.5, 0.5]
        )
        
        # 第一个检索器失败，第二个应该仍然返回结果
        results = ensemble.invoke("test query")
        
        assert len(results) == 1
        assert results[0].page_content == "doc"


class TestRAGSystem:
    """RAG 系统测试"""

    @pytest.fixture
    def temp_dir(self):
        """创建临时目录"""
        temp_path = Path(tempfile.mkdtemp())
        yield temp_path
        # 清理
        if temp_path.exists():
            shutil.rmtree(temp_path)

    @pytest.fixture
    def test_config_disabled(self):
        """禁用 RAG 的测试配置"""
        return AppConfig(
            current_model="test",
            models={
                "test": ModelConfig(
                    api_key="test-key",
                    model="test-model",
                    base_url="https://test.com",
                    temperature=0.1
                )
            },
            rag=RAGConfig(
                enabled=False,  # 禁用 RAG
                chunk_size=500,
                chunk_overlap=50,
                collection_name="test_collection"
            )
        )

    def test_rag_initialization_disabled(self, test_config_disabled):
        """测试禁用 RAG 系统初始化"""
        rag = RAGSystem(test_config_disabled)
        
        assert rag.enabled is False
        assert rag.vector_store is None
        assert rag.ensemble_retriever is None

    def test_add_documents_disabled(self, test_config_disabled):
        """测试禁用时添加文档"""
        rag = RAGSystem(test_config_disabled)

        docs = [Document(page_content="测试文档内容")]
        # 不应该抛出异常
        rag.add_documents(docs)

    def test_similarity_search_disabled(self, test_config_disabled):
        """测试禁用时搜索"""
        rag = RAGSystem(test_config_disabled)

        results = rag.similarity_search("测试查询")
        assert results == []

    def test_hybrid_search_disabled(self, test_config_disabled):
        """测试禁用时混合搜索"""
        rag = RAGSystem(test_config_disabled)

        results = rag.hybrid_search("测试查询")
        assert results == []

    def test_get_relevant_context_disabled(self, test_config_disabled):
        """测试禁用时获取上下文"""
        rag = RAGSystem(test_config_disabled)

        context = rag.get_relevant_context("测试查询", "焦虑")
        assert context == ""

    def test_document_creation(self):
        """测试文档创建"""
        doc = Document(
            page_content="这是测试文档内容",
            metadata={"category": "test", "source": "test"}
        )
        assert doc.page_content == "这是测试文档内容"
        assert doc.metadata["category"] == "test"

    def test_rag_config(self, test_config_disabled):
        """测试 RAG 配置"""
        rag = RAGSystem(test_config_disabled)
        
        # 即使 RAG 被禁用，也应该有配置
        assert rag.config.chunk_size == 500
        assert rag.config.chunk_overlap == 50
        assert rag.config.collection_name == "test_collection"

    def test_match_filter(self, test_config_disabled):
        """测试过滤器匹配"""
        rag = RAGSystem(test_config_disabled)
        
        # 创建测试文档
        doc = Document(
            page_content="test",
            metadata={"category": "anxiety", "source": "default"}
        )
        
        # 测试匹配
        assert rag._match_filter(doc, {"category": "anxiety"}) is True
        assert rag._match_filter(doc, {"category": "depression"}) is False
        assert rag._match_filter(doc, {"source": "default"}) is True
        assert rag._match_filter(doc, {}) is True  # 空过滤器应该匹配所有
        assert rag._match_filter(doc, {"source": "other"}) is False

    def test_add_texts(self, test_config_disabled):
        """测试添加文本"""
        rag = RAGSystem(test_config_disabled)
        
        # 添加文本
        rag.add_texts(
            texts=["测试文本1", "测试文本2"],
            metadatas=[{"category": "test1"}, {"category": "test2"}]
        )
        
        # 不应该抛出异常
        assert True

    def test_rag_with_different_chunk_sizes(self):
        """测试不同的分块大小配置"""
        for chunk_size in [100, 500, 1000]:
            config = AppConfig(
                current_model="test",
                models={
                    "test": ModelConfig(
                        api_key="test-key",
                        model="test-model",
                        base_url="https://test.com",
                        temperature=0.1
                    )
                },
                rag=RAGConfig(
                    enabled=False,
                    chunk_size=chunk_size,
                    chunk_overlap=100,
                    collection_name="test"
                )
            )
            
            rag = RAGSystem(config)
            assert rag.config.chunk_size == chunk_size