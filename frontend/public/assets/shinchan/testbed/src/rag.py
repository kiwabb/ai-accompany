from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from typing import List, Optional, Dict, Any, TypeVar, Generic
from pathlib import Path
import logging
import os
import tempfile
from .config import AppConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 类型变量
T = TypeVar('T')


class BaseRetriever(Generic[T]):
    """基础检索器接口"""
    def get_relevant_documents(self, query: str) -> List[Document]:
        raise NotImplementedError


class EnsembleRetriever:
    """Ensemble Retriever - 混合检索器
    
    结合多个检索器的结果，使用 Reciprocal Rank Fusion (RRF) 算法进行重排序。
    同时使用向量检索和 BM25 关键词检索，提供更全面的检索结果。
    """
    
    def __init__(self, retrievers: List, weights: Optional[List[float]] = None):
        """
        初始化 EnsembleRetriever
        
        Args:
            retrievers: 检索器列表
            weights: 权重列表，默认 [0.5, 0.5]
        """
        self.retrievers = retrievers
        self.weights = weights or [1.0 / len(retrievers)] * len(retrievers)
        
        # 标准化权重
        total = sum(self.weights)
        self.weights = [w / total for w in self.weights]
    
    def get_relevant_documents(self, query: str, **kwargs) -> List[Document]:
        """获取相关文档 (同步版本)"""
        return self.invoke(query, **kwargs)
    
    async def aget_relevant_documents(self, query: str, **kwargs) -> List[Document]:
        """获取相关文档 (异步版本)"""
        return self.invoke(query, **kwargs)
    
    def invoke(self, query: str, **kwargs) -> List[Document]:
        """执行混合检索"""
        # 获取每个检索器的结果
        doc_scores = {}  # {doc_id: {retriever_idx: rank}}
        doc_contents = {}  # {doc_id: document}
        
        for retriever_idx, retriever in enumerate(self.retrievers):
            try:
                docs = retriever.invoke(query)
                for rank, doc in enumerate(docs):
                    doc_id = id(doc)
                    if doc_id not in doc_scores:
                        doc_scores[doc_id] = {}
                        doc_contents[doc_id] = doc
                    doc_scores[doc_id][retriever_idx] = rank + 1  # 1-indexed
            except Exception as e:
                logger.warning(f"检索器 {retriever_idx} 失败: {e}")
                continue
        
        # 使用 RRF 计算得分
        rrf_scores = {}
        for doc_id, scores in doc_scores.items():
            rrf_score = 0.0
            for retriever_idx, rank in scores.items():
                weight = self.weights[retriever_idx] if retriever_idx < len(self.weights) else 1.0
                rrf_score += weight / (rank + 60)  # RRF formula with k=60
            rrf_scores[doc_id] = rrf_score
        
        # 按得分排序
        sorted_doc_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
        
        # 返回排序后的文档
        return [doc_contents[doc_id] for doc_id in sorted_doc_ids]


class RAGSystem:
    """RAG 系统 - 情感支持知识库
    
    使用 Faiss 向量存储 + EnsembleRetriever 混合检索
    - 向量检索: 基于语义相似度 (HuggingFace embeddings)
    - 关键词检索: BM25 算法
    """

    def __init__(self, config: AppConfig):
        self.config = config.rag
        self.enabled = config.rag.enabled
        self.vector_store = None
        self.ensemble_retriever = None
        self.embeddings = None
        self.text_splitter = None
        self.documents: List[Document] = []  # 保存原始文档用于 BM25

        if self.enabled:
            self._init_rag()

    def _init_rag(self):
        """初始化 RAG 系统"""
        try:
            # 初始化嵌入模型
            self.embeddings = HuggingFaceEmbeddings(
                model_name="paraphrase-multilingual-MiniLM-L12-v2"
            )

            # 初始化文本分割器
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.config.chunk_size,
                chunk_overlap=self.config.chunk_overlap,
                length_function=len,
            )

            # 创建 Faiss 向量存储
            self._init_faiss()

            # 添加默认知识库
            self._add_default_knowledge()

            # 初始化 EnsembleRetriever (混合检索)
            self._init_ensemble_retriever()

            logger.info("RAG 系统初始化成功 (Faiss + EnsembleRetriever)")

        except Exception as e:
            logger.error(f"RAG 系统初始化失败: {e}")
            self.enabled = False

    def _init_faiss(self):
        """初始化 Faiss 向量存储"""
        try:
            from langchain_community.vectorstores import FAISS

            # 使用临时目录存储 Faiss 索引
            faiss_dir = tempfile.mkdtemp(prefix="faiss_")
            
            # 创建空的 Faiss 向量存储
            self.vector_store = FAISS.from_texts(
                texts=["init"],  # 初始文本，后续会添加实际内容
                embedding=self.embeddings,
                metadatas=[{"source": "init"}]
            )
            
            # 删除初始文档
            self.vector_store.delete([self.vector_store.index_to_docstore_id[0]])
            
            self.faiss_dir = faiss_dir
            logger.info(f"Faiss 向量存储初始化成功, 目录: {faiss_dir}")

        except ImportError:
            logger.error("faiss-cpu 未安装，请运行: pip install faiss-cpu")
            raise
        except Exception as e:
            logger.error(f"Faiss 初始化失败: {e}")
            raise

    def _init_ensemble_retriever(self):
        """初始化 EnsembleRetriever 混合检索器"""
        if not self.documents:
            logger.warning("没有文档可用于创建 EnsembleRetriever")
            return

        try:
            # 创建 BM25 检索器
            bm25_retriever = BM25Retriever.from_documents(self.documents)
            bm25_retriever.k = 3

            # 创建向量检索器
            vector_retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})

            # 创建 EnsembleRetriever (混合检索)
            # 权重: 向量检索 0.5, BM25 0.5
            self.ensemble_retriever = EnsembleRetriever(
                retrievers=[vector_retriever, bm25_retriever],
                weights=[0.5, 0.5]
            )

            logger.info("EnsembleRetriever 混合检索初始化成功")

        except Exception as e:
            logger.error(f"EnsembleRetriever 初始化失败: {e}")

    def _add_default_knowledge(self):
        """添加默认的情感支持知识库"""
        default_knowledge = [
            Document(
                page_content="""当用户感到焦虑时，可以建议他们：
1. 深呼吸：慢慢吸气4秒，屏住4秒，再慢慢呼气6秒
2. 正念冥想：专注于当下的感受，不评判
3. 身体放松：渐进式肌肉放松法
4. 转移注意力：做一些自己喜欢的事情""",
                metadata={"category": "anxiety", "source": "default"}
            ),
            Document(
                page_content="""当用户感到悲伤或抑郁时，可以：
1. 倾听和共情：让他们感受到被理解和接纳
2. 肯定感受：告诉他们有这些感受是正常的
3. 鼓励表达：让他们把感受说出来或写下来
4. 小步行动：鼓励他们做一些简单的事情，比如散步、喝水
5. 专业帮助：如果情况严重，建议寻求专业心理咨询""",
                metadata={"category": "depression", "source": "default"}
            ),
            Document(
                page_content="""当用户感到愤怒或烦躁时：
1. 先冷静：建议他们暂停一下，不要在情绪激动时做决定
2. 识别触发点：帮助他们理解是什么让他们生气
3. 健康宣泄：运动、写日记、和朋友倾诉
4. 沟通技巧：使用"我"语句表达感受，而不是指责""",
                metadata={"category": "anger", "source": "default"}
            ),
            Document(
                page_content="""当用户感到孤独时：
1. 承认感受：孤独是正常的人类情感
2. 小范围连接：从和一个人联系开始
3. 兴趣爱好：参加自己感兴趣的活动或社群
4. 自我陪伴：学会和自己相处，享受独处时光
5. 宠物陪伴：如果条件允许，养宠物可以缓解孤独""",
                metadata={"category": "loneliness", "source": "default"}
            ),
            Document(
                page_content="""当用户感到压力大时：
1. 时间管理：优先级排序，避免过度承诺
2. 设定边界：学会说"不"，保护自己的时间和精力
3. 休息恢复：保证睡眠，定期休息
4. 社交支持：和家人朋友交流
5. 自我关怀：做一些让自己开心的事情""",
                metadata={"category": "stress", "source": "default"}
            ),
            Document(
                page_content="""自我关怀的方法：
1. 身体关怀：保证睡眠、健康饮食、规律运动
2. 情绪关怀：允许自己有各种情绪，不压抑
3. 心理关怀：正面自我对话，自我鼓励
4. 社交关怀：和支持自己的人在一起
5. 精神关怀：冥想、感恩、寻找生活的意义""",
                metadata={"category": "self_care", "source": "default"}
            ),
            Document(
                page_content="""积极心理学的建议：
1. 感恩练习：每天写下3件感恩的事情
2. 优势发挥：识别并使用自己的优势
3. 目标设定：设定有意义的、可实现的目标
4. 人际关系：投资于重要的人际关系
5. 活在当下：正念，享受当下的时刻""",
                metadata={"category": "positive_psychology", "source": "default"}
            ),
        ]

        # 检查是否已有数据
        if not self.documents:
            self.add_documents(default_knowledge)
            logger.info("已添加默认知识库")

    def add_documents(self, documents: List[Document]):
        """添加文档到知识库"""
        if not self.enabled:
            return

        try:
            # 分割文档
            split_docs = self.text_splitter.split_documents(documents)
            
            # 保存原始文档用于 BM25 检索
            self.documents.extend(split_docs)
            
            # 添加到 Faiss 向量存储
            if split_docs:
                texts = [doc.page_content for doc in split_docs]
                metadatas = [doc.metadata for doc in split_docs]
                self.vector_store.add_texts(texts, metadatas)
                
                # 重新初始化 EnsembleRetriever
                self._init_ensemble_retriever()
                
            logger.info(f"已添加 {len(split_docs)} 个文档片段到知识库")
        except Exception as e:
            logger.error(f"添加文档失败: {e}")

    def add_texts(self, texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None):
        """添加文本到知识库"""
        documents = [
            Document(page_content=text, metadata=meta or {})
            for text, meta in zip(texts, metadatas or [{}] * len(texts))
        ]
        self.add_documents(documents)

    def similarity_search(
        self,
        query: str,
        k: int = 3,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """相似度搜索 (仅向量检索)"""
        if not self.enabled or not self.vector_store:
            return []

        try:
            results = self.vector_store.similarity_search(
                query=query,
                k=k,
                filter=filter
            )
            return results
        except Exception as e:
            logger.error(f"相似度搜索失败: {e}")
            return []

    def similarity_search_with_score(
        self,
        query: str,
        k: int = 3,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[tuple[Document, float]]:
        """带分数的相似度搜索"""
        if not self.enabled or not self.vector_store:
            return []

        try:
            results = self.vector_store.similarity_search_with_score(
                query=query,
                k=k,
                filter=filter
            )
            return results
        except Exception as e:
            logger.error(f"相似度搜索失败: {e}")
            return []

    def hybrid_search(
        self,
        query: str,
        k: int = 3,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """混合检索 (EnsembleRetriever) - 同时使用向量和 BM25"""
        if not self.enabled or not self.ensemble_retriever:
            logger.warning("EnsembleRetriever 不可用，使用向量检索作为后备")
            return self.similarity_search(query, k, filter)

        try:
            # 注意: EnsembleRetriever 不支持 filter，这里做简单处理
            results = self.ensemble_retriever.invoke(query)
            
            # 如果有 filter，应用过滤
            if filter:
                results = [doc for doc in results if self._match_filter(doc, filter)]
            
            return results[:k]
        except Exception as e:
            logger.error(f"混合检索失败: {e}")
            # 后备到向量检索
            return self.similarity_search(query, k, filter)

    def _match_filter(self, doc: Document, filter_dict: Dict[str, Any]) -> bool:
        """检查文档是否匹配过滤器"""
        for key, value in filter_dict.items():
            if doc.metadata.get(key) != value:
                return False
        return True

    def get_relevant_context(self, query: str, emotion: Optional[str] = None) -> str:
        """获取相关的上下文信息 (使用混合检索)"""
        if not self.enabled:
            return ""

        filter_dict = {}
        if emotion:
            filter_dict["category"] = emotion.lower()

        # 使用混合检索
        docs = self.hybrid_search(query, k=3, filter=filter_dict if filter_dict else None)

        if not docs:
            # 如果没有找到特定类别的，尝试不使用过滤器
            docs = self.hybrid_search(query, k=2)

        if docs:
            context = "\n\n".join([f"相关建议 {i+1}:\n{doc.page_content}" for i, doc in enumerate(docs)])
            return f"\n\n【情感支持知识库参考】\n{context}"
        return ""