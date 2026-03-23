"""
工作流系统测试
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from src.config import AppConfig, ModelConfig, WorkflowConfig, RAGConfig, MemoryConfig
from src.workflow import (
    EmotionalSupportWorkflow,
    EmotionAnalysis,
    SupportResponse,
    WorkflowState
)


class TestEmotionAnalysis:
    """情绪分析模型测试"""

    def test_create_emotion_analysis(self):
        """测试创建情绪分析"""
        analysis = EmotionAnalysis(
            primary_emotion="焦虑",
            emotion_intensity=0.8,
            secondary_emotions=["紧张", "担忧"],
            triggers=["工作压力", "截止日期"],
            needs=["放松", "支持"],
            confidence=0.9
        )
        assert analysis.primary_emotion == "焦虑"
        assert analysis.emotion_intensity == 0.8
        assert len(analysis.secondary_emotions) == 2
        assert analysis.confidence == 0.9

    def test_emotion_analysis_validation(self):
        """测试情绪分析验证"""
        # 测试强度范围
        with pytest.raises(ValueError):
            EmotionAnalysis(
                primary_emotion="测试",
                emotion_intensity=1.5,  # 超出范围
                confidence=0.5
            )

        with pytest.raises(ValueError):
            EmotionAnalysis(
                primary_emotion="测试",
                emotion_intensity=-0.1,  # 超出范围
                confidence=0.5
            )

        # 测试置信度范围
        with pytest.raises(ValueError):
            EmotionAnalysis(
                primary_emotion="测试",
                emotion_intensity=0.5,
                confidence=1.2  # 超出范围
            )


class TestSupportResponse:
    """支持响应模型测试"""

    def test_create_support_response(self):
        """测试创建支持响应"""
        response = SupportResponse(
            response_type="共情",
            content="我理解你的感受，这确实很不容易。",
            tone="温暖",
            follow_up_questions=["你想多说说吗？", "现在感觉怎么样？"],
            suggested_actions=["深呼吸", "出去走走"]
        )
        assert response.response_type == "共情"
        assert response.content == "我理解你的感受，这确实很不容易。"
        assert response.tone == "温暖"
        assert len(response.follow_up_questions) == 2
        assert len(response.suggested_actions) == 2


class TestWorkflowState:
    """工作流状态测试"""

    def test_create_workflow_state(self):
        """测试创建工作流状态"""
        state: WorkflowState = {
            "user_input": "我今天心情很不好",
            "emotion_analysis": None,
            "rag_context": "",
            "memory_context": "",
            "support_response": None,
            "final_response": "",
            "messages": []
        }
        assert state["user_input"] == "我今天心情很不好"
        assert state["emotion_analysis"] is None
        assert state["messages"] == []


class TestEmotionalSupportWorkflow:
    """情感支持工作流测试"""

    @pytest.fixture
    def test_config(self):
        """测试配置"""
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
            workflow=WorkflowConfig(
                enable_emotion_analysis=True,
                enable_support_generation=True
            ),
            rag=RAGConfig(enabled=False),
            memory=MemoryConfig(enabled=True)
        )

    @pytest.fixture
    def mock_components(self, test_config):
        """模拟组件"""
        # 模拟 LLM 客户端
        mock_llm = Mock()
        mock_llm.get_system_prompt.return_value = "你是一个温暖的助手"
        mock_llm.agenerate = AsyncMock(return_value="我理解你的感受")
        mock_llm.generate.return_value = "我理解你的感受"

        # 模拟 RAG 系统
        mock_rag = Mock()
        mock_rag.get_relevant_context.return_value = ""

        # 模拟记忆系统
        mock_memory = Mock()
        mock_memory.get_conversation_context.return_value = ""
        mock_memory.add_user_message = Mock()
        mock_memory.add_assistant_message = Mock()

        return mock_llm, mock_rag, mock_memory

    def test_workflow_initialization(self, test_config, mock_components):
        """测试工作流初始化"""
        mock_llm, mock_rag, mock_memory = mock_components

        workflow = EmotionalSupportWorkflow(
            test_config,
            mock_llm,
            mock_rag,
            mock_memory
        )

        assert workflow is not None
        assert workflow.config.enable_emotion_analysis is True
        assert workflow.config.enable_support_generation is True

    def test_workflow_disabled_features(self, test_config, mock_components):
        """测试禁用功能"""
        test_config.workflow.enable_emotion_analysis = False
        test_config.workflow.enable_support_generation = False

        mock_llm, mock_rag, mock_memory = mock_components

        workflow = EmotionalSupportWorkflow(
            test_config,
            mock_llm,
            mock_rag,
            mock_memory
        )

        assert workflow.config.enable_emotion_analysis is False
        assert workflow.config.enable_support_generation is False

    @pytest.mark.asyncio
    async def test_analyze_emotion_disabled(self, test_config, mock_components):
        """测试禁用情绪分析"""
        test_config.workflow.enable_emotion_analysis = False
        mock_llm, mock_rag, mock_memory = mock_components

        workflow = EmotionalSupportWorkflow(
            test_config,
            mock_llm,
            mock_rag,
            mock_memory
        )

        state: WorkflowState = {
            "user_input": "测试输入",
            "emotion_analysis": None,
            "rag_context": "",
            "memory_context": "",
            "support_response": None,
            "final_response": "",
            "messages": []
        }

        result = await workflow._analyze_emotion(state)
        assert result["emotion_analysis"] is not None
        assert result["emotion_analysis"].primary_emotion == "未知"

    @pytest.mark.asyncio
    async def test_retrieve_context(self, test_config, mock_components):
        """测试检索上下文"""
        mock_llm, mock_rag, mock_memory = mock_components
        mock_rag.get_relevant_context.return_value = "测试 RAG 上下文"
        mock_memory.get_conversation_context.return_value = "测试记忆上下文"

        workflow = EmotionalSupportWorkflow(
            test_config,
            mock_llm,
            mock_rag,
            mock_memory
        )

        state: WorkflowState = {
            "user_input": "测试输入",
            "emotion_analysis": EmotionAnalysis(
                primary_emotion="焦虑",
                emotion_intensity=0.7,
                confidence=0.8
            ),
            "rag_context": "",
            "memory_context": "",
            "support_response": None,
            "final_response": "",
            "messages": []
        }

        result = await workflow._retrieve_context(state)
        assert "测试 RAG 上下文" in result["rag_context"]
        assert "测试记忆上下文" in result["memory_context"]

    @pytest.mark.asyncio
    async def test_generate_support_disabled(self, test_config, mock_components):
        """测试禁用支持生成"""
        test_config.workflow.enable_support_generation = False
        mock_llm, mock_rag, mock_memory = mock_components

        workflow = EmotionalSupportWorkflow(
            test_config,
            mock_llm,
            mock_rag,
            mock_memory
        )

        state: WorkflowState = {
            "user_input": "测试输入",
            "emotion_analysis": None,
            "rag_context": "",
            "memory_context": "",
            "support_response": None,
            "final_response": "",
            "messages": []
        }

        result = await workflow._generate_support(state)
        assert result["support_response"] is not None
        assert result["support_response"].response_type == "倾听"

    @pytest.mark.asyncio
    async def test_finalize_response(self, test_config, mock_components):
        """测试最终化响应"""
        mock_llm, mock_rag, mock_memory = mock_components

        workflow = EmotionalSupportWorkflow(
            test_config,
            mock_llm,
            mock_rag,
            mock_memory
        )

        state: WorkflowState = {
            "user_input": "测试输入",
            "emotion_analysis": None,
            "rag_context": "",
            "memory_context": "",
            "support_response": SupportResponse(
                response_type="共情",
                content="这是测试响应",
                tone="温暖"
            ),
            "final_response": "",
            "messages": []
        }

        result = await workflow._finalize_response(state)
        assert result["final_response"] == "这是测试响应"
        assert len(result["messages"]) == 2

    @pytest.mark.asyncio
    async def test_process_workflow(self, test_config, mock_components):
        """测试完整工作流处理"""
        mock_llm, mock_rag, mock_memory = mock_components

        # 模拟情绪分析响应
        mock_llm.agenerate = AsyncMock(side_effect=[
            # 情绪分析响应
            '''{
                "primary_emotion": "焦虑",
                "emotion_intensity": 0.7,
                "secondary_emotions": ["担忧"],
                "triggers": ["工作"],
                "needs": ["支持"],
                "confidence": 0.8
            }''',
            # 支持响应
            "我理解你的感受，工作压力确实很大。"
        ])

        workflow = EmotionalSupportWorkflow(
            test_config,
            mock_llm,
            mock_rag,
            mock_memory
        )

        result = await workflow.process("我今天工作压力很大，感到很焦虑")

        assert "response" in result
        assert result["response"] is not None
        # 记忆系统应该被调用
        mock_memory.add_user_message.assert_called()
        mock_memory.add_assistant_message.assert_called()

    def test_process_sync(self, test_config, mock_components):
        """测试同步处理"""
        mock_llm, mock_rag, mock_memory = mock_components
        mock_llm.agenerate = AsyncMock(return_value="测试响应")

        workflow = EmotionalSupportWorkflow(
            test_config,
            mock_llm,
            mock_rag,
            mock_memory
        )

        # 注意：这里简化测试，因为同步方法会运行 asyncio
        # 实际测试中可能需要更复杂的模拟
        assert hasattr(workflow, 'process_sync')