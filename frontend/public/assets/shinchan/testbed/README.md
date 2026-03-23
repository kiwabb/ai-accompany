# 情感陪伴聊天机器人

基于 LangChain 和 LangGraph 实现的智能情感支持系统，能够倾听用户的日常烦恼、分析情绪状态并提供温暖的情感支持。

## 功能特性

### 核心能力
- **情绪分析**：智能识别用户的情绪状态（开心、悲伤、焦虑、愤怒、孤独等）
- **情感支持**：提供温暖、真诚的安慰和鼓励
- **智能对话**：基于大模型的自然语言交互

### 技术特性
- **RAG 能力**：内置情感支持知识库，提供专业建议
- **Memory 能力**：记住对话历史，支持长期记忆
- **Workflow 能力**：基于 LangGraph 的智能工作流编排

## 技术栈

- **Python**: 3.11+
- **LangChain**: 1.0.0+
- **LangGraph**: 1.0.0+
- **ChromaDB**: 向量数据库
- **Sentence-Transformers**: 文本嵌入

## 安装

1. 克隆或下载项目到本地

2. 创建并激活 Python 虚拟环境 (推荐)：
```bash
python3 -m venv venv
source venv/bin/activate
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

4. 配置大模型：

编辑 `config.yaml` 文件，填入你的 API 密钥：

```yaml
current_model: "doubao-seed-2.0"

models:
  doubao-seed-2.0:
    api_key: "your-api-key-here"  # 替换为你的 API 密钥
    model: "doubao-seed-2-0-code-preview-260215"
    base_url: "https://ark.cn-beijing.volces.com/api/v3"
    temperature: 0.1
```

你可以使用任何兼容 OpenAI API 格式的模型服务。

## 使用方法

### 交互模式

启动聊天机器人，进入交互对话：

```bash
python main.py
```

在交互模式中，你可以：
- 直接输入文字与机器人聊天
- 输入 `quit` 或 `exit` 退出
- 输入 `clear` 清空对话历史
- 输入 `stats` 查看统计信息
- 输入 `help` 查看帮助

### 单次消息模式

直接发送一条消息并获取回复：

```bash
python main.py --message "我今天心情不太好"
```

## 项目结构

```
.
├── main.py                 # 主程序入口
├── config.yaml             # 配置文件
├── requirements.txt        # 依赖列表
├── README.md              # 项目说明
├── src/                   # 源代码
│   ├── __init__.py
│   ├── config.py          # 配置管理
│   ├── llm_client.py      # 大模型客户端
│   ├── rag.py             # RAG 系统
│   ├── memory.py          # 记忆系统
│   └── workflow.py        # 工作流系统
└── tests/                 # 测试代码
    ├── __init__.py
    ├── test_config.py
    ├── test_rag.py
    ├── test_memory.py
    └── test_workflow.py
```

## 运行测试

项目包含完整的单元测试，请在激活虚拟环境后，使用 pytest 运行：

```bash
# 运行所有测试
python3 -m pytest tests/ -v

# 运行特定测试文件
python3 -m pytest tests/test_config.py -v

# 生成测试覆盖率报告
python3 -m pytest tests/ --cov=src --cov-report=html
```

## 配置说明

### 模型配置

在 `config.yaml` 中可以配置多个模型，并通过 `current_model` 切换：

```yaml
models:
  model1:
    api_key: "..."
    model: "model-name"
    base_url: "..."
    temperature: 0.1
  model2:
    api_key: "..."
    model: "model-name"
    base_url: "..."
    temperature: 0.7
```

### RAG 配置

```yaml
rag:
  enabled: true              # 是否启用 RAG
  chunk_size: 1000          # 文本分块大小
  chunk_overlap: 200        # 分块重叠大小
  collection_name: "emotional_support_knowledge"
```

### Memory 配置

```yaml
memory:
  enabled: true              # 是否启用记忆
  max_history_length: 50     # 最大历史长度
  summary_interval: 10       # 摘要生成间隔
```

### Workflow 配置

```yaml
workflow:
  enable_emotion_analysis: true      # 启用情绪分析
  enable_support_generation: true    # 启用支持生成
```

## 知识库

系统内置了情感支持知识库，包含以下主题：
- 焦虑应对
- 抑郁支持
- 愤怒管理
- 孤独缓解
- 压力管理
- 自我关怀
- 积极心理学

你可以通过 `RAGSystem.add_documents()` 或 `RAGSystem.add_texts()` 方法添加自定义知识。

## 示例对话

```
你: 我今天工作压力很大，感到很焦虑
暖心: 我理解你的感受，工作压力确实会让人感到焦虑。试着深呼吸一下，
      慢慢吸气4秒，屏住4秒，再慢慢呼气6秒。这样可以帮助你放松一些。
      你想说说具体是什么让你感到压力吗？

[情绪分析: 焦虑, 强度: 0.80]

你: 项目截止日期快到了，还有很多工作没完成
暖心: 截止日期的压力确实很让人焦虑。我们可以试着把大任务拆分成小步骤，
      一次只专注于一件事。你觉得今天先完成哪一部分会让你感觉好一些？
      记住，你已经在努力了，这就够了。

[情绪分析: 焦虑, 强度: 0.75]
```

## 注意事项

1. **API 密钥安全**：请妥善保管你的 API 密钥，不要提交到版本控制系统
2. **数据隐私**：对话历史会保存在本地 `data/` 目录下，请注意隐私保护
3. **专业建议**：本系统提供的是情感支持，不能替代专业心理咨询。如遇严重心理问题，请及时寻求专业帮助

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，欢迎通过 Issue 联系。