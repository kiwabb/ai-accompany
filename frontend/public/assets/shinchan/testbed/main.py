#!/usr/bin/env python3
"""
情感陪伴聊天机器人 - 主程序
基于 LangChain 和 LangGraph 实现的智能情感支持系统
"""

import asyncio
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src import (
    load_config,
    LLMClient,
    RAGSystem,
    MemorySystem,
    EmotionalSupportWorkflow
)


class EmotionalSupportBot:
    """情感陪伴聊天机器人"""

    def __init__(self, config_path: str = "config.yaml"):
        print("正在初始化情感陪伴聊天机器人...")

        # 加载配置
        self.config = load_config(config_path)

        # 初始化组件
        self.llm_client = LLMClient(self.config)
        self.rag_system = RAGSystem(self.config)
        self.memory_system = MemorySystem(self.config, self.llm_client)
        self.workflow = EmotionalSupportWorkflow(
            self.config,
            self.llm_client,
            self.rag_system,
            self.memory_system
        )

        print("✓ 机器人初始化完成！")
        print("=" * 60)

    async def chat(self):
        """开始聊天"""
        print("\n" + "=" * 60)
        print("欢迎来到情感陪伴聊天！")
        print("我是你的情感陪伴助手" + "暖心" + "，我会一直在这里陪着你。")
        print("=" * 60)
        print("\n提示：")
        print("- 输入 'quit' 或 'exit' 退出聊天")
        print("- 输入 'clear' 清空对话历史")
        print("- 输入 'stats' 查看统计信息")
        print("- 输入 'help' 查看帮助信息")
        print("\n你想聊点什么呢？\n")

        while True:
            try:
                # 获取用户输入
                user_input = input("你: ").strip()

                # 处理特殊命令
                if user_input.lower() in ["quit", "exit", "退出"]:
                    print("\n暖心: 再见！希望今天的陪伴能让你感觉好一些。记得，我一直都在这里陪着你。💕")
                    break

                if user_input.lower() in ["clear", "清空"]:
                    self.memory_system.clear()
                    print("\n暖心: 好的，我已经清空了对话历史。让我们重新开始吧！\n")
                    continue

                if user_input.lower() in ["stats", "统计"]:
                    self._show_stats()
                    continue

                if user_input.lower() in ["help", "帮助"]:
                    self._show_help()
                    continue

                if not user_input:
                    continue

                # 处理用户输入
                print("\n暖心: ", end="", flush=True)

                # 流式输出（简化版）
                result = await self.workflow.process(user_input)
                response = result["response"]

                # 模拟打字效果
                for char in response:
                    print(char, end="", flush=True)
                    await asyncio.sleep(0.03)

                print("\n")

                # 显示情绪分析（可选）
                if result.get("emotion_analysis"):
                    emotion = result["emotion_analysis"]
                    print(f"[情绪分析: {emotion.primary_emotion}, 强度: {emotion.emotion_intensity:.2f}]\n")

            except KeyboardInterrupt:
                print("\n\n暖心: 我看到你中断了对话。没关系，随时回来找我聊天。再见！💕")
                break
            except Exception as e:
                print(f"\n\n暖心: 抱歉，我遇到了一些问题。让我们重新开始吧。")
                print(f"错误信息: {e}\n")

    def _show_stats(self):
        """显示统计信息"""
        stats = self.memory_system.get_memory_stats()
        print("\n" + "=" * 40)
        print("📊 统计信息")
        print("=" * 40)
        print(f"总消息数: {stats['total_messages']}")
        print(f"记忆功能: {'启用' if stats['enabled'] else '禁用'}")
        print(f"对话摘要: {'有' if stats['has_summary'] else '无'}")
        if stats['user_name']:
            print(f"用户昵称: {stats['user_name']}")
        print(f"情绪记录: {stats['emotional_patterns_count']} 条")
        print("=" * 40 + "\n")

    def _show_help(self):
        """显示帮助信息"""
        print("\n" + "=" * 40)
        print("📖 帮助信息")
        print("=" * 40)
        print("可用命令:")
        print("  quit/exit/退出 - 退出聊天")
        print("  clear/清空     - 清空对话历史")
        print("  stats/统计     - 查看统计信息")
        print("  help/帮助      - 显示帮助信息")
        print("\n功能特性:")
        print("  • 情绪分析 - 识别你的情绪状态")
        print("  • 智能回应 - 提供温暖的情感支持")
        print("  • 记忆功能 - 记住我们的对话")
        print("  • 知识库   - 提供专业的情感建议")
        print("=" * 40 + "\n")

    async def quick_response(self, user_input: str) -> str:
        """快速获取回复（不进入交互模式）"""
        result = await self.workflow.process(user_input)
        return result["response"]


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="情感陪伴聊天机器人")
    parser.add_argument(
        "--config",
        type=str,
        default="config.yaml",
        help="配置文件路径"
    )
    parser.add_argument(
        "--message",
        type=str,
        default=None,
        help="单次消息模式，直接发送一条消息并获取回复"
    )

    args = parser.parse_args()

    # 检查配置文件
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"错误: 配置文件不存在: {config_path}")
        print("请确保 config.yaml 文件存在于项目根目录。")
        sys.exit(1)

    # 创建机器人实例
    bot = EmotionalSupportBot(config_path=args.config)

    if args.message:
        # 单次消息模式
        response = asyncio.run(bot.quick_response(args.message))
        print(f"\n暖心: {response}\n")
    else:
        # 交互模式
        asyncio.run(bot.chat())


if __name__ == "__main__":
    main()