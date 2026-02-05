"""Memory extraction prompt templates for MemoryService."""


def build_extraction_prompt(user_msg: str, ai_msg: str, language: str = "en") -> str:
    """
    Build the extraction prompt for analyzing user messages and extracting
    facts, preferences, and emotional state.

    Args:
        user_msg: The user's message content
        ai_msg: The AI's response content
        language: Language code for extraction output

    Returns:
        Complete prompt string for the extraction model
    """
    return f"""You are a hyper-attentive AI assistant. Your SOLE and EXCLUSIVE task is to analyze the User's message and extract any new, permanent facts or preferences about them.

**CRITICAL RULES:**
1.  **ONLY ANALYZE THE USER'S INPUT.** Ignore the AI's response completely. Any information in the AI's response is irrelevant and MUST NOT be extracted.
2.  **FOCUS ON PERMANENT TRAITS.** Distinguish between a temporary activity (e.g., "I'm learning English now") and a permanent fact or preference (e.g., "I love the English language"). Do NOT extract temporary activities.
3.  **BE PRECISE AND CONCISE.** Extract the fact or preference as a short, clear statement.
4.  **OUTPUT JSON ONLY.** The output must be a single, valid JSON object with the keys "facts", "preferences", and "emotional_state". If nothing new is learned, return empty lists.
5.  **LANGUAGE MATCH.** The extraction MUST be in the same language as the user's message.

**Example 1: Clear extraction**
[CONVERSATION]
User: "I'm a coder living in Zhejiang, and I love jazz music."
AI: "That's great! As a coder in Zhejiang, you must be very skilled. Jazz is wonderful."
[END CONVERSATION]

Your JSON Output:
```json
{{
  "facts": ["Is a coder", "Lives in Zhejiang"],
  "preferences": ["Loves jazz music"],
  "emotional_state": ""
}}
```

**Example 2: Ignoring AI response (CRITICAL)**
[CONVERSATION]
User: "Hi there."
AI: "Hello! As a coder, you must be having a busy day!"
[END CONVERSATION]

Your JSON Output:
```json
{{
  "facts": [],
  "preferences": [],
  "emotional_state": ""
}}
```
Now, analyze the following new conversation and provide your JSON output.
[CONVERSATION]
User: "{user_msg}"
AI: "{ai_msg}"
[END CONVERSATION]

Your JSON Output:
"""
