"""
自定义工具模块

包含:
- EmpathyEngine: 共情引擎，理解用户情感并产生共情回应
- SentimentAnalyzer: 情感分析器，分析用户输入的情感倾向
"""

from langchain_core.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Type, List, Dict, Any, ClassVar
import re


class EmpathyEngineInput(BaseModel):
    """共情引擎输入"""
    model_config = ConfigDict(ignored_types=(BaseModel,))
    
    user_message: str = Field(description="用户的消息内容")
    user_name: Optional[str] = Field(default=None, description="用户名字（如果有）")


class EmpathyResponse(BaseModel):
    """共情回应"""
    model_config = ConfigDict(ignored_types=(BaseModel,))
    
    understanding: str = Field(description="对用户情感的理解")
    validation: str = Field(description="对用户情感的肯定")
    connection: str = Field(description="与用户建立情感连接")


class EmpathyEngine(BaseTool):
    """共情引擎工具
    
    用于理解用户的情感状态，产生共情的回应。
    这是一个模拟实现，实际生产环境中可以接入更复杂的模型。
    """
    
    name: str = "empathy_engine"
    description: str = """共情引擎 - 用于理解用户的情感并产生共情回应。
    当用户分享他们的感受时，使用这个工具来产生温暖、理解的回应。
    输入应该是用户的原始消息内容。"""
    args_schema: Type[BaseModel] = EmpathyEngineInput
    
    def _run(
        self, 
        user_message: str, 
        user_name: Optional[str] = None,
        run_manager: Optional[CallbackManagerForToolRun] = None
    ) -> Dict[str, Any]:
        """
        运行共情引擎
        
        Args:
            user_message: 用户的消息
            user_name: 用户的名字
            
        Returns:
            包含共情回应的字典
        """
        # 检测情感关键词
        emotions = self._detect_emotions(user_message)
        
        # 生成共情回应
        understanding = self._generate_understanding(user_message, emotions)
        validation = self._generate_validation(emotions)
        connection = self._generate_connection(user_name, emotions)
        
        return {
            "understanding": understanding,
            "validation": validation,
            "connection": connection,
            "detected_emotions": emotions
        }
    
    def _detect_emotions(self, message: str) -> List[str]:
        """检测消息中的情感关键词"""
        message_lower = message.lower()
        emotions = []
        
        emotion_keywords = {
            "焦虑": ["焦虑", "紧张", "担心", "害怕", "不安", "压力大", "烦躁"],
            "悲伤": ["悲伤", "难过", "伤心", "痛苦", "失落", "沮丧", "抑郁"],
            "愤怒": ["生气", "愤怒", "恼火", "不满", "气愤", "火大"],
            "孤独": ["孤独", "寂寞", "孤单", "没人陪", "无人理解"],
            "开心": ["开心", "高兴", "快乐", "兴奋", "愉快", "满足"],
            "迷茫": ["迷茫", "困惑", "不知所措", "不知道怎么办"],
            "疲惫": ["累", "疲惫", "疲倦", "困", "没精力"]
        }
        
        for emotion, keywords in emotion_keywords.items():
            if any(kw in message_lower for kw in keywords):
                emotions.append(emotion)
        
        return emotions if emotions else ["中性"]
    
    def _generate_understanding(self, message: str, emotions: List[str]) -> str:
        """生成对用户情感的理解"""
        if "焦虑" in emotions:
            return "我感受到你现在的焦虑和不安。"
        elif "悲伤" in emotions:
            return "我能感觉到你现在很低落，很难过。"
        elif "愤怒" in emotions:
            return "我理解你现在很愤怒，这种感觉一定很不好受。"
        elif "孤独" in emotions:
            return "听起来你感到很孤独，这种感觉真的很不容易。"
        elif "开心" in emotions:
            return "我很高兴能感受到你的好心情！"
        elif "迷茫" in emotions:
            return "我能理解你现在有些困惑，不知道该怎么做。"
        elif "疲惫" in emotions:
            return "你看起来很疲惫，需要好好休息一下。"
        else:
            return "我在认真倾听你说的一切。"
    
    def _generate_validation(self, emotions: List[str]) -> str:
        """生成对情感的肯定"""
        validation_templates = {
            "焦虑": "面对压力会焦虑是很正常的反应，你的感受是合理的。",
            "悲伤": "悲伤是人类最真实的情感之一，想哭就哭出来吧。",
            "愤怒": "有愤怒的情绪是正常的，重要的是我们如何面对它。",
            "孤独": "感到孤独是很常见的感受，你并不孤单。",
            "开心": "你的快乐是值得庆祝的！",
            "迷茫": "每个人都会有迷茫的时候，这很正常。",
            "疲惫": "累了就休息，这不是你的错。",
            "中性": "感谢你愿意和我分享。"
        }
        
        for emotion in emotions:
            if emotion in validation_templates:
                return validation_templates[emotion]
        
        return validation_templates["中性"]
    
    def _generate_connection(self, user_name: Optional[str], emotions: List[str]) -> str:
        """生成情感连接"""
        prefix = f"{user_name}，" if user_name else ""
        
        connection_templates = {
            "焦虑": f"{prefix}我在这里陪着你，我们一起面对。",
            "悲伤": f"{prefix}无论发生了什么，我都会在这里倾听。",
            "愤怒": f"{prefix}深呼吸，我们一起慢慢来处理这件事。",
            "孤独": f"{prefix}记住，你不是一个人，我会陪着你。",
            "开心": f"{prefix}太棒了！我为你感到开心！",
            "迷茫": f"{prefix}没关系，我们可以一起想办法。",
            "疲惫": f"{prefix}先好好休息，一切都会好起来的。",
            "中性": f"{prefix}我在这里听你说。"
        }
        
        for emotion in emotions:
            if emotion in connection_templates:
                return connection_templates[emotion]
        
        return connection_templates["中性"]


class SentimentAnalyzerInput(BaseModel):
    """情感分析器输入"""
    model_config = ConfigDict(ignored_types=(BaseModel,))
    
    text: str = Field(description="要分析的文本")


class SentimentResult(BaseModel):
    """情感分析结果"""
    model_config = ConfigDict(ignored_types=(BaseModel,))
    
    sentiment: str = Field(description="情感极性: positive, negative, neutral")
    score: float = Field(description="情感分数: -1.0 (非常负面) 到 1.0 (非常正面)")
    emotions: List[str] = Field(description="检测到的具体情绪")
    intensity: float = Field(description="情感强度: 0.0 到 1.0")


class SentimentAnalyzer(BaseTool):
    """情感分析器工具
    
    分析用户输入的情感倾向和情绪状态。
    这是一个基于规则的简单实现，可以使用更复杂的模型进行增强。
    """
    
    name: str = "sentiment_analyzer"
    description: str = """情感分析器 - 分析文本中的情感倾向和情绪状态。
    可以识别情感极性（正面、负面、中性）和具体情绪（焦虑、悲伤、愤怒等）。
    输入是要分析的文本内容。"""
    args_schema: Type[BaseModel] = SentimentAnalyzerInput
    
    # 情感词典 - 使用 ClassVar 标注
    POSITIVE_WORDS: ClassVar[set[str]] = {
        "开心", "高兴", "快乐", "兴奋", "愉快", "满足", "幸福", "美好",
        "爱", "喜欢", "感激", "感谢", "感动", "温暖", "舒服", "放松",
        "骄傲", "自豪", "希望", "期待", "惊喜", "棒", "好", "不错"
    }
    
    NEGATIVE_WORDS: ClassVar[set[str]] = {
        "难过", "伤心", "痛苦", "悲伤", "沮丧", "失落", "绝望", "崩溃",
        "生气", "愤怒", "恼火", "气愤", "讨厌", "恨", "恶心", "难受",
        "焦虑", "紧张", "担心", "害怕", "不安", "恐惧", "压力", "疲惫",
        "累", "困", "烦", "迷茫", "困惑", "无奈", "孤单", "寂寞"
    }
    
    EMOTION_PATTERNS: ClassVar[Dict[str, List[str]]] = {
        "焦虑": ["焦虑", "紧张", "担心", "害怕", "不安", "压力大", "烦躁", "慌"],
        "悲伤": ["悲伤", "难过", "伤心", "痛苦", "失落", "沮丧", "抑郁", "哭"],
        "愤怒": ["生气", "愤怒", "恼火", "气愤", "火大", "不爽", "讨厌"],
        "孤独": ["孤独", "寂寞", "孤单", "没人陪", "无人理解", "一个人"],
        "开心": ["开心", "高兴", "快乐", "兴奋", "愉快", "幸福", "美好"],
        "疲惫": ["累", "疲惫", "疲倦", "困", "没精力", "想睡觉"],
        "迷茫": ["迷茫", "困惑", "不知所措", "不知道怎么办", "该怎么做"]
    }
    
    def _run(
        self, 
        text: str,
        run_manager: Optional[CallbackManagerForToolRun] = None
    ) -> Dict[str, Any]:
        """
        运行情感分析
        
        Args:
            text: 要分析的文本
            
        Returns:
            情感分析结果
        """
        # 情感极性分析
        sentiment, score = self._analyze_sentiment(text)
        
        # 情绪识别
        emotions = self._recognize_emotions(text)
        
        # 情感强度计算
        intensity = self._calculate_intensity(text, emotions)
        
        return {
            "sentiment": sentiment,
            "score": score,
            "emotions": emotions,
            "intensity": intensity,
            "analysis": self._generate_analysis_text(sentiment, emotions, intensity)
        }
    
    def _analyze_sentiment(self, text: str) -> tuple[str, float]:
        """分析情感极性"""
        text_lower = text.lower()
        
        positive_count = sum(1 for word in self.POSITIVE_WORDS if word in text_lower)
        negative_count = sum(1 for word in self.NEGATIVE_WORDS if word in text_lower)
        
        total = positive_count + negative_count
        
        if total == 0:
            return "neutral", 0.0
        
        # 计算分数
        score = (positive_count - negative_count) / total
        score = max(-1.0, min(1.0, score))  # 限制在 [-1, 1]
        
        if score > 0.2:
            return "positive", score
        elif score < -0.2:
            return "negative", score
        else:
            return "neutral", score
    
    def _recognize_emotions(self, text: str) -> List[str]:
        """识别具体情绪"""
        text_lower = text.lower()
        detected_emotions = []
        
        for emotion, keywords in self.EMOTION_PATTERNS.items():
            if any(kw in text_lower for kw in keywords):
                detected_emotions.append(emotion)
        
        return detected_emotions if detected_emotions else ["中性"]
    
    def _calculate_intensity(self, text: str, emotions: List[str]) -> float:
        """计算情感强度"""
        # 强度修饰词
        intensifiers = {
            "非常": 0.3,
            "特别": 0.3,
            "极其": 0.4,
            "十分": 0.2,
            "很": 0.1,
            "比较": 0.0,
            "有点": -0.1,
            "稍微": -0.1,
            "略微": -0.1
        }
        
        text_lower = text.lower()
        
        # 基础强度
        base_intensity = 0.5
        
        # 修饰词调整
        for word, adjustment in intensifiers.items():
            if word in text_lower:
                base_intensity += adjustment
        
        # 标点符号调整（感叹号增加强度）
        exclamation_count = text.count('！') + text.count('!')
        question_count = text.count('？') + text.count('?')
        
        base_intensity += exclamation_count * 0.1
        base_intensity -= question_count * 0.05
        
        # 限制范围
        return max(0.0, min(1.0, base_intensity))
    
    def _generate_analysis_text(self, sentiment: str, emotions: List[str], intensity: float) -> str:
        """生成分析文本"""
        sentiment_text = {
            "positive": "正面",
            "negative": "负面",
            "neutral": "中性"
        }.get(sentiment, "中性")
        
        emotion_text = "、".join(emotions) if emotions else "无"
        
        intensity_text = "强烈" if intensity > 0.7 else "中等" if intensity > 0.4 else "轻微"
        
        return f"情感倾向: {sentiment_text} (分数: {intensity:.2f}), 情绪: {emotion_text}, {intensity_text}"