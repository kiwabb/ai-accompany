from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
from pathlib import Path
import logging
import os
from .config import AppConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatMessage:
    """聊天消息"""
    def __init__(
        self,
        role: str,
        content: str,
        timestamp: Optional[str] = None,
        emotion: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.role = role
        self.content = content
        self.timestamp = timestamp or datetime.now().isoformat()
        self.emotion = emotion
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp,
            "emotion": self.emotion,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ChatMessage":
        return cls(
            role=data["role"],
            content=data["content"],
            timestamp=data.get("timestamp"),
            emotion=data.get("emotion"),
            metadata=data.get("metadata")
        )

    def to_langchain_message(self) -> BaseMessage:
        if self.role == "user":
            return HumanMessage(content=self.content)
        elif self.role == "assistant":
            return AIMessage(content=self.content)
        elif self.role == "system":
            return SystemMessage(content=self.content)
        else:
            return HumanMessage(content=self.content)


class MemorySystem:
    """记忆系统 - 使用 Redis 实现持久化会话
    
    支持:
    - 短期记忆: Redis 中的会话历史 (RedisChatMessageHistory)
    - 用户画像: 本地文件存储
    - 对话摘要: 自动生成
    """

    def __init__(self, config: AppConfig, llm_client=None):
        self.config = config.memory
        self.enabled = config.memory.enabled
        self.llm_client = llm_client
        self.messages: List[ChatMessage] = []
        self.conversation_summary: str = ""
        self.user_profile: Dict[str, Any] = {
            "name": None,
            "preferences": {},
            "important_events": [],
            "emotional_patterns": []
        }
        
        # Redis 聊天历史
        self.redis_chat_history = None
        
        # 初始化 Redis 内存 (如果没有真实 Redis，使用环境变量控制)
        self._init_redis_memory()
        
        # 加载用户画像 (本地文件)
        self._load_user_profile()

    def _init_redis_memory(self):
        """初始化 Redis 内存"""
        if not self.enabled:
            return
            
        try:
            # 检查是否使用真实 Redis
            use_fake = os.environ.get("USE_FAKE_REDIS", "true").lower() == "true"
            
            if use_fake:
                logger.info("使用 FakeRedis (测试模式)")
                # 使用本地存储后备
                self._init_local_fallback()
            else:
                # 使用真实 Redis
                import redis
                redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
                
                # 创建 RedisChatMessageHistory
                self.redis_chat_history = RedisChatMessageHistory(
                    session_id="emotional_support_chat",
                    url=redis_url
                )
                
                logger.info(f"Redis 内存系统初始化成功: {redis_url}")
            
        except ImportError:
            logger.warning("redis 未安装，使用本地存储作为后备")
            self._init_local_fallback()
        except Exception as e:
            logger.warning(f"Redis 连接失败: {e}，使用本地存储作为后备")
            self._init_local_fallback()

    def _init_local_fallback(self):
        """本地存储后备方案"""
        self.use_local_fallback = True
        self._storage_path = Path("./data/memory")
        self._storage_path.mkdir(parents=True, exist_ok=True)
        
        # 加载本地消息
        messages_file = self._storage_path / "messages.json"
        if messages_file.exists():
            with open(messages_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.messages = [ChatMessage.from_dict(msg) for msg in data]
        logger.info("使用本地存储作为后备")

    def _load_user_profile(self):
        """加载用户画像"""
        try:
            profile_file = Path("./data/memory/profile.json")
            if profile_file.exists():
                with open(profile_file, "r", encoding="utf-8") as f:
                    self.user_profile = json.load(f)
        except Exception as e:
            logger.error(f"加载用户画像失败: {e}")

    def _save_user_profile(self):
        """保存用户画像"""
        try:
            profile_file = Path("./data/memory/profile.json")
            profile_file.parent.mkdir(parents=True, exist_ok=True)
            with open(profile_file, "w", encoding="utf-8") as f:
                json.dump(self.user_profile, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"保存用户画像失败: {e}")

    def add_message(
        self,
        role: str,
        content: str,
        emotion: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """添加消息"""
        message = ChatMessage(role=role, content=content, emotion=emotion, metadata=metadata)
        self.messages.append(message)

        # 限制历史长度
        if len(self.messages) > self.config.max_history_length:
            self.messages = self.messages[-self.config.max_history_length:]

        # 定期生成摘要
        if len(self.messages) % self.config.summary_interval == 0:
            self._generate_summary()

        # 更新用户画像
        self._update_user_profile(message)

        # 保存到存储
        self._persist_messages()

    def _persist_messages(self):
        """持久化消息"""
        if hasattr(self, 'use_local_fallback') and self.use_local_fallback:
            # 本地存储后备
            messages_file = self._storage_path / "messages.json"
            with open(messages_file, "w", encoding="utf-8") as f:
                json.dump([msg.to_dict() for msg in self.messages], f, ensure_ascii=False, indent=2)
        elif hasattr(self, 'redis_chat_history') and self.redis_chat_history:
            try:
                # Redis 存储
                self.redis_chat_history.clear()
                for msg in self.messages:
                    if msg.role == "user":
                        self.redis_chat_history.add_user_message(msg.content)
                    else:
                        self.redis_chat_history.add_ai_message(msg.content)
            except Exception as e:
                logger.error(f"Redis 持久化失败: {e}")

    def add_user_message(self, content: str, emotion: Optional[str] = None, **kwargs):
        """添加用户消息"""
        self.add_message("user", content, emotion=emotion, metadata=kwargs)

    def add_assistant_message(self, content: str, **kwargs):
        """添加助手消息"""
        self.add_message("assistant", content, metadata=kwargs)

    def get_recent_messages(self, limit: int = 10) -> List[ChatMessage]:
        """获取最近的消息"""
        return self.messages[-limit:] if self.messages else []

    def get_langchain_messages(self, limit: Optional[int] = None) -> List[BaseMessage]:
        """获取 LangChain 格式的消息"""
        messages = self.messages[-limit:] if limit else self.messages
        return [msg.to_langchain_message() for msg in messages]

    def get_conversation_context(self, limit: int = 10) -> str:
        """获取对话上下文"""
        if not self.messages:
            return ""

        recent_messages = self.get_recent_messages(limit)
        context = "\n".join([
            f"{msg.role.capitalize()}: {msg.content}"
            for msg in recent_messages
        ])

        if self.conversation_summary:
            return f"【对话摘要】\n{self.conversation_summary}\n\n【最近对话】\n{context}"
        return f"【最近对话】\n{context}"

    def _generate_summary(self):
        """生成对话摘要"""
        if not self.llm_client or len(self.messages) < 5:
            return

        try:
            recent_messages = self.messages[-20:]
            conversation_text = "\n".join([
                f"{msg.role.capitalize()}: {msg.content}"
                for msg in recent_messages
            ])

            # 这里简化处理，实际可以调用 LLM 生成
            self.conversation_summary = f"对话摘要（更新于 {datetime.now().strftime('%Y-%m-%d %H:%M')}）：\n用户分享了一些生活中的感受和经历，我们进行了温暖的交流。"

        except Exception as e:
            logger.error(f"生成对话摘要失败: {e}")

    def _update_user_profile(self, message: ChatMessage):
        """更新用户画像"""
        # 简单的规则提取，实际可以用 NER 或 LLM 提取
        content = message.content.lower()

        # 提取名字
        if "我叫" in content or "我的名字是" in content:
            import re
            name_match = re.search(r"我叫([^\s，。！？]+)|我的名字是([^\s，。！？]+)", content)
            if name_match:
                name = name_match.group(1) or name_match.group(2)
                if name and len(name) < 10:
                    self.user_profile["name"] = name

        # 记录情绪模式
        if message.emotion:
            self.user_profile["emotional_patterns"].append({
                "emotion": message.emotion,
                "timestamp": message.timestamp,
                "content": message.content[:50] + "..." if len(message.content) > 50 else message.content
            })

            # 只保留最近的 50 条
            if len(self.user_profile["emotional_patterns"]) > 50:
                self.user_profile["emotional_patterns"] = self.user_profile["emotional_patterns"][-50:]

        # 保存用户画像
        self._save_user_profile()

    def get_user_profile(self) -> Dict[str, Any]:
        """获取用户画像"""
        return self.user_profile.copy()

    def clear(self):
        """清空记忆"""
        self.messages = []
        self.conversation_summary = ""
        
        # 清理 Redis
        if hasattr(self, 'redis_chat_history') and self.redis_chat_history:
            try:
                self.redis_chat_history.clear()
            except Exception as e:
                logger.error(f"Redis 清理失败: {e}")
        
        # 清理本地后备
        if hasattr(self, 'use_local_fallback') and self.use_local_fallback:
            messages_file = self._storage_path / "messages.json"
            if messages_file.exists():
                messages_file.unlink()
                
        logger.info("记忆已清空")

    def get_memory_stats(self) -> Dict[str, Any]:
        """获取记忆统计信息"""
        return {
            "total_messages": len(self.messages),
            "enabled": self.enabled,
            "has_summary": bool(self.conversation_summary),
            "user_name": self.user_profile.get("name"),
            "emotional_patterns_count": len(self.user_profile.get("emotional_patterns", [])),
            "storage_type": "redis" if (hasattr(self, 'redis_chat_history') and self.redis_chat_history) else "local"
        }