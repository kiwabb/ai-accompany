from typing import TypedDict, Annotated, List, Optional, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from pydantic import BaseModel, Field, ConfigDict
import logging
from .config import AppConfig
from .llm_client import LLMClient
from .rag import RAGSystem
from .memory import MemorySystem

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmotionAnalysis(BaseModel):
    """情绪分析结果"""
    model_config = ConfigDict(ignored_types=(BaseModel,))
    
    primary_emotion: str = Field(description="主要情绪，如：开心、悲伤、焦虑、愤怒、孤独、平静等")
    emotion_intensity: float = Field(description="情绪强度，0-1之间的数值", ge=0, le=1)
    secondary_emotions: List[str] = Field(default_factory=list, description="次要情绪列表")
    triggers: List[str] = Field(default_factory=list, description="可能触发情绪的原因")
    needs: List[str] = Field(default_factory=list, description="用户可能的需求")
    confidence: float = Field(description="分析置信度，0-1之间的数值", ge=0, le=1)


class SupportResponse(BaseModel):
    """支持响应"""
    model_config = ConfigDict(ignored_types=(BaseModel,))
    
    response_type: str = Field(description="响应类型：倾听、共情、安慰、鼓励、建议等")
    content: str = Field(description="响应内容")
    tone: str = Field(description="语气：温暖、温柔、坚定、轻松等")
    follow_up_questions: List[str] = Field(default_factory=list, description="后续问题")
    suggested_actions: List[str] = Field(default_factory=list, description="建议的行动")


class WorkflowState(TypedDict):
    """工作流状态"""
    user_input: str
    emotion_analysis: Optional[EmotionAnalysis]
    rag_context: str
    memory_context: str
    support_response: Optional[SupportResponse]
    final_response: str
    messages: List[BaseMessage]


class EmotionalSupportWorkflow:
    """情感支持工作流"""

    def __init__(
        self,
        config: AppConfig,
        llm_client: LLMClient,
        rag_system: RAGSystem,
        memory_system: MemorySystem
    ):
        self.config = config.workflow
        self.llm_client = llm_client
        self.rag_system = rag_system
        self.memory_system = memory_system
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """构建工作流图"""
        workflow = StateGraph(WorkflowState)

        # 添加节点
        workflow.add_node("analyze_emotion", self._analyze_emotion)
        workflow.add_node("retrieve_context", self._retrieve_context)
        workflow.add_node("generate_support", self._generate_support)
        workflow.add_node("finalize_response", self._finalize_response)

        # 设置入口点
        workflow.set_entry_point("analyze_emotion")

        # 添加边
        workflow.add_edge("analyze_emotion", "retrieve_context")
        workflow.add_edge("retrieve_context", "generate_support")
        workflow.add_edge("generate_support", "finalize_response")
        workflow.add_edge("finalize_response", END)

        return workflow.compile()

    async def _analyze_emotion(self, state: WorkflowState) -> WorkflowState:
        """分析用户情绪"""
        if not self.config.enable_emotion_analysis:
            state["emotion_analysis"] = EmotionAnalysis(
                primary_emotion="未知",
                emotion_intensity=0.5,
                confidence=0.5
            )
            return state

        user_input = state["user_input"]
        memory_context = self.memory_system.get_conversation_context(limit=5)

        system_prompt = """你是一位专业的情绪分析师。请分析用户的输入，识别其情绪状态。

请以 JSON 格式返回分析结果，包含以下字段：
- primary_emotion: 主要情绪（如：开心、悲伤、焦虑、愤怒、孤独、平静、压力、困惑等）
- emotion_intensity: 情绪强度（0-1之间的小数）
- secondary_emotions: 次要情绪列表
- triggers: 可能触发情绪的原因列表
- needs: 用户可能的需求列表
- confidence: 分析置信度（0-1之间的小数）

只返回 JSON，不要其他内容。"""

        user_prompt = f"""对话历史：
{memory_context}

用户当前输入：
{user_input}

请分析用户的情绪状态。"""

        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]

            response = await self.llm_client.agenerate(messages)

            # 解析 JSON 响应
            import json
            import re

            # 提取 JSON 部分
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                json_str = json_match.group(0)
                analysis_data = json.loads(json_str)
                emotion_analysis = EmotionAnalysis(**analysis_data)
            else:
                # 如果解析失败，使用默认值
                emotion_analysis = EmotionAnalysis(
                    primary_emotion="未知",
                    emotion_intensity=0.5,
                    confidence=0.3
                )

            state["emotion_analysis"] = emotion_analysis
            logger.info(f"情绪分析结果: {emotion_analysis.primary_emotion} (强度: {emotion_analysis.emotion_intensity})")

        except Exception as e:
            logger.error(f"情绪分析失败: {e}")
            state["emotion_analysis"] = EmotionAnalysis(
                primary_emotion="未知",
                emotion_intensity=0.5,
                confidence=0.3
            )

        return state

    async def _retrieve_context(self, state: WorkflowState) -> WorkflowState:
        """检索相关上下文"""
        user_input = state["user_input"]
        emotion_analysis = state.get("emotion_analysis")

        # 获取 RAG 上下文
        emotion = emotion_analysis.primary_emotion if emotion_analysis else None
        rag_context = self.rag_system.get_relevant_context(user_input, emotion)
        state["rag_context"] = rag_context

        # 获取记忆上下文
        memory_context = self.memory_system.get_conversation_context(limit=8)
        state["memory_context"] = memory_context

        logger.info(f"已检索上下文 - RAG: {bool(rag_context)}, Memory: {bool(memory_context)}")

        return state

    async def _generate_support(self, state: WorkflowState) -> WorkflowState:
        """生成支持响应"""
        if not self.config.enable_support_generation:
            state["support_response"] = SupportResponse(
                response_type="倾听",
                content="我在听你说，请继续。",
                tone="温暖"
            )
            return state

        user_input = state["user_input"]
        emotion_analysis = state.get("emotion_analysis")
        rag_context = state.get("rag_context", "")
        memory_context = state.get("memory_context", "")

        # 构建系统提示词
        system_prompt = self.llm_client.get_system_prompt()

        # 添加情绪分析信息
        if emotion_analysis:
            emotion_info = f"""
当前用户情绪分析：
- 主要情绪：{emotion_analysis.primary_emotion}
- 情绪强度：{emotion_analysis.emotion_intensity:.2f}
- 可能的需求：{', '.join(emotion_analysis.needs) if emotion_analysis.needs else '未明确'}
"""
            system_prompt += emotion_info

        # 添加 RAG 上下文
        if rag_context:
            system_prompt += f"\n{rag_context}"

        # 构建用户提示词
        user_prompt = f"""对话历史：
{memory_context}

用户当前说：
{user_input}

请以温暖、真诚的方式回应用户。"""

        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]

            response_content = await self.llm_client.agenerate(messages)

            # 构建支持响应
            support_response = SupportResponse(
                response_type="综合支持",
                content=response_content,
                tone="温暖",
                follow_up_questions=[
                    "你现在感觉好一点了吗？",
                    "还有什么想和我聊聊的吗？"
                ]
            )

            state["support_response"] = support_response
            logger.info("已生成支持响应")

        except Exception as e:
            logger.error(f"生成支持响应失败: {e}")
            state["support_response"] = SupportResponse(
                response_type="倾听",
                content="我理解你的感受，能和我多说说吗？",
                tone="温暖"
            )

        return state

    async def _finalize_response(self, state: WorkflowState) -> WorkflowState:
        """最终化响应"""
        support_response = state.get("support_response")

        if support_response:
            final_response = support_response.content
        else:
            final_response = "我在这里陪着你，请继续说。"

        state["final_response"] = final_response

        # 更新消息列表
        messages = state.get("messages", [])
        messages.append(HumanMessage(content=state["user_input"]))
        messages.append(AIMessage(content=final_response))
        state["messages"] = messages

        return state

    async def process(self, user_input: str) -> Dict[str, Any]:
        """处理用户输入"""
        initial_state: WorkflowState = {
            "user_input": user_input,
            "emotion_analysis": None,
            "rag_context": "",
            "memory_context": "",
            "support_response": None,
            "final_response": "",
            "messages": []
        }

        # 执行工作流
        result = await self.graph.ainvoke(initial_state)

        # 更新记忆
        emotion = result.get("emotion_analysis")
        emotion_str = emotion.primary_emotion if emotion else None
        self.memory_system.add_user_message(user_input, emotion=emotion_str)
        self.memory_system.add_assistant_message(result["final_response"])

        return {
            "response": result["final_response"],
            "emotion_analysis": result.get("emotion_analysis"),
            "rag_context_used": bool(result.get("rag_context")),
            "memory_used": bool(result.get("memory_context"))
        }

    def process_sync(self, user_input: str) -> Dict[str, Any]:
        """同步处理用户输入"""
        import asyncio
        return asyncio.run(self.process(user_input))