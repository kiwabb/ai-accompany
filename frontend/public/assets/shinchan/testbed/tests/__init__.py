"""
测试模块
"""
import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 设置测试环境变量
os.environ["USE_FAKE_REDIS"] = "true"
os.environ["PYTEST_CURRENT_TEST"] = "true"