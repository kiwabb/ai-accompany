from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from typing import List, Optional, Dict, Any
from .config import AppConfig, get_current_model_config


class LLMClient:
    """大模型客户端"""

    def __init__(self, config: AppConfig):
        self.config = config
        self.model_config = get_current_model_config(config)
        self._init_llm()

    def _init_llm(self):
        """初始化 LLM"""
        self.llm = ChatOpenAI(
            api_key=self.model_config.api_key,
            model=self.model_config.model,
            base_url=self.model_config.base_url,
            temperature=self.model_config.temperature,
        )

    async def agenerate(
        self,
        messages: List[BaseMessage],
        **kwargs
    ) -> str:
        """异步生成回复"""
        response = await self.llm.ainvoke(messages, **kwargs)
        return response.content

    def generate(
        self,
        messages: List[BaseMessage],
        **kwargs
    ) -> str:
        """同步生成回复"""
        response = self.llm.invoke(messages, **kwargs)
        return response.content

    async def astream(
        self,
        messages: List[BaseMessage],
        **kwargs
    ):
        """流式生成回复"""
        async for chunk in self.llm.astream(messages, **kwargs):
            if chunk.content:
                yield chunk.content

    def get_system_prompt(self) -> str:
        """获取系统提示词"""
        return """你是一位温暖、专业的情感陪伴聊天机器人，名叫"暖心"。你的职责是：

1. **倾听与理解**：认真倾听用户的话语，理解他们的感受和需求
2. **情绪分析**：敏锐地感知用户的情绪状态，给予恰当的回应
3. **情感支持**：提供温暖、真诚的安慰和鼓励
4. **积极引导**：帮助用户看到问题的积极面，激发他们的内在力量

你的特点：
- 温暖友善，像朋友一样陪伴用户
- 专业耐心，不评判、不指责
- 善于共情，能够理解用户的感受
- 积极乐观，传递正能量

请用自然、亲切的语言与用户交流，避免过于正式或机械的表达。"""