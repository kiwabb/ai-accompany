"""
API key resolution utilities for chat service.
"""
from typing import Optional
from .. import models


def resolve_api_key(
    header_key: Optional[str],
    user_settings: Optional[models.UserSettings],
    provider: str
) -> Optional[str]:
    """
    Resolve the API key to use for a provider.
    Priority: header > user settings > None
    """
    if header_key:
        return header_key

    if not user_settings:
        return None

    provider_key_map = {
        "gemini": user_settings.google_api_key,
        "gpt": user_settings.openai_api_key,
        "deepseek": user_settings.deepseek_api_key,
        "zhipu": user_settings.zhipu_api_key,
    }

    return provider_key_map.get(provider)
