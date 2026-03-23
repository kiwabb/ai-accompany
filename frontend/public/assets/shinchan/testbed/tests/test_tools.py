"""
自定义工具测试
测试 EmpathyEngine 和 SentimentAnalyzer
"""
import pytest
from src.tools import (
    EmpathyEngine,
    EmpathyEngineInput,
    EmpathyResponse,
    SentimentAnalyzer,
    SentimentAnalyzerInput,
    SentimentResult
)


class TestEmpathyEngine:
    """EmpathyEngine 共情引擎测试"""

    @pytest.fixture
    def empathy_engine(self):
        """创建共情引擎实例"""
        return EmpathyEngine()

    def test_empathy_engine_initialization(self, empathy_engine):
        """测试共情引擎初始化"""
        assert empathy_engine.name == "empathy_engine"
        assert "共情" in empathy_engine.description

    def test_detect_anxiety_emotion(self, empathy_engine):
        """测试检测焦虑情绪"""
        emotions = empathy_engine._detect_emotions("我感到很焦虑，压力很大")
        assert "焦虑" in emotions

    def test_detect_sadness_emotion(self, empathy_engine):
        """测试检测悲伤情绪"""
        emotions = empathy_engine._detect_emotions("我很难过，感到很伤心")
        assert "悲伤" in emotions

    def test_detect_anger_emotion(self, empathy_engine):
        """测试检测愤怒情绪"""
        emotions = empathy_engine._detect_emotions("我很生气，非常愤怒")
        assert "愤怒" in emotions

    def test_detect_loneliness_emotion(self, empathy_engine):
        """测试检测孤独情绪"""
        emotions = empathy_engine._detect_emotions("我感到很孤独，没有人理解我")
        assert "孤独" in emotions

    def test_detect_happiness_emotion(self, empathy_engine):
        """测试检测开心情绪"""
        emotions = empathy_engine._detect_emotions("我今天很开心，非常高兴")
        assert "开心" in emotions

    def test_detect_neutral_emotion(self, empathy_engine):
        """测试中性情绪"""
        emotions = empathy_engine._detect_emotions("今天天气不错")
        assert "中性" in emotions

    def test_generate_understanding_anxiety(self, empathy_engine):
        """测试生成焦虑的理解"""
        understanding = empathy_engine._generate_understanding("我焦虑", ["焦虑"])
        assert "焦虑" in understanding

    def test_generate_understanding_sadness(self, empathy_engine):
        """测试生成悲伤的理解"""
        understanding = empathy_engine._generate_understanding("我难过", ["悲伤"])
        assert "难过" in understanding or "低落" in understanding

    def test_generate_validation(self, empathy_engine):
        """测试生成情感肯定"""
        validation = empathy_engine._generate_validation(["焦虑"])
        assert validation is not None
        assert len(validation) > 0

    def test_generate_connection_with_name(self, empathy_engine):
        """测试生成带名字的情感连接"""
        connection = empathy_engine._generate_connection("小明", ["焦虑"])
        assert "小明" in connection

    def test_generate_connection_without_name(self, empathy_engine):
        """测试生成不带名字的情感连接"""
        connection = empathy_engine._generate_connection(None, ["焦虑"])
        assert "我在这里" in connection

    def test_run_with_anxiety(self, empathy_engine):
        """测试完整运行 - 焦虑"""
        result = empathy_engine._run(
            user_message="我最近工作压力很大，感到很焦虑",
            user_name=None
        )
        
        assert "understanding" in result
        assert "validation" in result
        assert "connection" in result
        assert "detected_emotions" in result
        assert "焦虑" in result["detected_emotions"]

    def test_run_with_sadness(self, empathy_engine):
        """测试完整运行 - 悲伤"""
        result = empathy_engine._run(
            user_message="我很难过，感觉很孤独",
            user_name="小红"
        )
        
        assert result["detected_emotions"] == ["悲伤", "孤独"]
        assert "小红" in result["connection"]

    def test_run_with_happiness(self, empathy_engine):
        """测试完整运行 - 开心"""
        result = empathy_engine._run(
            user_message="我今天太开心了！"
        )
        
        assert "开心" in result["detected_emotions"]

    def test_empathy_engine_as_tool(self, empathy_engine):
        """测试作为 LangChain 工具使用"""
        # 测试 tool 的 invoke 方法
        result = empathy_engine.invoke({
            "user_message": "我感到焦虑"
        })
        
        assert "understanding" in result
        assert "validation" in result
        assert "connection" in result


class TestSentimentAnalyzer:
    """SentimentAnalyzer 情感分析器测试"""

    @pytest.fixture
    def sentiment_analyzer(self):
        """创建情感分析器实例"""
        return SentimentAnalyzer()

    def test_sentiment_analyzer_initialization(self, sentiment_analyzer):
        """测试情感分析器初始化"""
        assert sentiment_analyzer.name == "sentiment_analyzer"
        assert "情感分析器" in sentiment_analyzer.description

    def test_analyze_positive_sentiment(self, sentiment_analyzer):
        """测试分析正面情感"""
        sentiment, score = sentiment_analyzer._analyze_sentiment("今天心情很好，很开心")
        
        assert sentiment == "positive"
        assert score > 0

    def test_analyze_negative_sentiment(self, sentiment_analyzer):
        """测试分析负面情感"""
        sentiment, score = sentiment_analyzer._analyze_sentiment("我很难过，感到很伤心")
        
        assert sentiment == "negative"
        assert score < 0

    def test_analyze_neutral_sentiment(self, sentiment_analyzer):
        """测试分析中性情感"""
        sentiment, score = sentiment_analyzer._analyze_sentiment("今天吃了饭")
        
        assert sentiment == "neutral"

    def test_recognize_emotions_anxiety(self, sentiment_analyzer):
        """测试识别焦虑情绪"""
        emotions = sentiment_analyzer._recognize_emotions("我很焦虑，担心工作")
        assert "焦虑" in emotions

    def test_recognize_emotions_sadness(self, sentiment_analyzer):
        """测试识别悲伤情绪"""
        emotions = sentiment_analyzer._recognize_emotions("我感到悲伤和失落")
        assert "悲伤" in emotions

    def test_recognize_emotions_anger(self, sentiment_analyzer):
        """测试识别愤怒情绪"""
        emotions = sentiment_analyzer._recognize_emotions("我很生气，愤怒")
        assert "愤怒" in emotions

    def test_recognize_emotions_loneliness(self, sentiment_analyzer):
        """测试识别孤独情绪"""
        emotions = sentiment_analyzer._recognize_emotions("感到孤独和寂寞")
        assert "孤独" in emotions

    def test_recognize_emotions_neutral(self, sentiment_analyzer):
        """测试识别中性情绪"""
        emotions = sentiment_analyzer._recognize_emotions("今天去超市买东西")
        assert "中性" in emotions

    def test_calculate_intensity_strong(self, sentiment_analyzer):
        """测试计算强烈情感"""
        intensity = sentiment_analyzer._calculate_intensity("我非常非常开心！！！", ["开心"])
        assert intensity > 0.5

    def test_calculate_intensity_weak(self, sentiment_analyzer):
        """测试计算轻微情感"""
        intensity = sentiment_analyzer._calculate_intensity("我有点累。", ["疲惫"])
        assert intensity < 0.6

    def test_generate_analysis_text(self, sentiment_analyzer):
        """测试生成分析文本"""
        text = sentiment_analyzer._generate_analysis_text("positive", ["开心"], 0.8)
        
        assert "正面" in text
        assert "开心" in text
        assert "强烈" in text

    def test_run_positive(self, sentiment_analyzer):
        """测试完整运行 - 正面"""
        result = sentiment_analyzer._run("我今天太开心了！")
        
        assert result["sentiment"] == "positive"
        assert result["score"] > 0
        assert "开心" in result["emotions"]
        assert result["intensity"] > 0

    def test_run_negative(self, sentiment_analyzer):
        """测试完整运行 - 负面"""
        result = sentiment_analyzer._run("我很难过，感到很悲伤和孤独")
        
        assert result["sentiment"] == "negative"
        assert result["score"] < 0
        assert "悲伤" in result["emotions"] or "孤独" in result["emotions"]

    def test_run_neutral(self, sentiment_analyzer):
        """测试完整运行 - 中性"""
        result = sentiment_analyzer._run("现在是下午三点")
        
        assert result["sentiment"] == "neutral"

    def test_sentiment_analyzer_as_tool(self, sentiment_analyzer):
        """测试作为 LangChain 工具使用"""
        result = sentiment_analyzer.invoke({
            "text": "我感到很开心"
        })
        
        assert "sentiment" in result
        assert "score" in result
        assert "emotions" in result
        assert "intensity" in result

    def test_intensity_with_exclamation_marks(self, sentiment_analyzer):
        """测试感叹号增加强度"""
        result1 = sentiment_analyzer._run("我开心")
        result2 = sentiment_analyzer._run("我非常开心！！！")
        
        assert result2["intensity"] >= result1["intensity"]

    def test_intensity_with_question_marks(self, sentiment_analyzer):
        """测试问号减少强度"""
        result = sentiment_analyzer._run("我开心？")
        
        # 问号应该略微降低强度
        assert result["intensity"] <= 0.6


class TestToolsIntegration:
    """工具集成测试"""

    def test_empathy_and_sentiment_workflow(self):
        """测试共情和情感分析的完整工作流"""
        # 1. 先进行情感分析
        sentiment_analyzer = SentimentAnalyzer()
        sentiment_result = sentiment_analyzer._run("我最近工作压力很大，感到很焦虑")
        
        assert sentiment_result["sentiment"] == "negative"
        
        # 2. 根据情感分析结果进行共情
        empathy_engine = EmpathyEngine()
        empathy_result = empathy_engine._run(
            user_message="我最近工作压力很大，感到很焦虑",
            user_name=None
        )
        
        # 验证结果
        assert "焦虑" in empathy_result["detected_emotions"]
        assert "understanding" in empathy_result
        assert "validation" in empathy_result
        assert "connection" in empathy_result

    def test_tool_input_validation(self):
        """测试工具输入验证"""
        # EmpathyEngine 输入验证
        empathy_input = EmpathyEngineInput(
            user_message="测试消息",
            user_name="测试用户"
        )
        assert empathy_input.user_message == "测试消息"
        assert empathy_input.user_name == "测试用户"

        # SentimentAnalyzer 输入验证
        sentiment_input = SentimentAnalyzerInput(text="测试文本")
        assert sentiment_input.text == "测试文本"