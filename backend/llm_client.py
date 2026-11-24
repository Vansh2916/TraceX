import os
import json
import base64
import logging
from typing import Dict, Any, Optional, List
import requests

logger = logging.getLogger("crusaders.llm_client")

def load_keys():
    """Load API keys from local .env file in the project root."""
    search_paths = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        # FIX BUG 7: removed hardcoded developer machine path "/Users/daksh/Downloads/freellmapi-keys.env"
        # API keys must be supplied via a .env file in the project root or via environment variables
    ]
    for path in search_paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k not in os.environ or not os.environ[k]:
                                os.environ[k] = v
                                # Standardize aliases
                                if k == "GROQ_KEY":
                                    os.environ.setdefault("GROQ_API_KEY", v)
                                elif k == "OPENROUTER_KEY":
                                    os.environ.setdefault("OPENROUTER_API_KEY", v)
                                elif k == "COHERE_KEY":
                                    os.environ.setdefault("COHERE_API_KEY", v)
                                elif k == "NVIDIA_KEY":
                                    os.environ.setdefault("NVIDIA_API_KEY", v)
                                elif k == "GOOGLE_KEY":
                                    os.environ.setdefault("GEMINI_API_KEY", v)
            except Exception as e:
                logger.warning(f"Could not load env file {path}: {e}")

load_keys()

def call_text_llm(user_prompt: str, system_prompt: str = "") -> Dict[str, Any]:
    """
    Execute high-speed text inference with cascading fallback:
    1. Groq (openai/gpt-oss-120b)
    2. OpenRouter (nvidia/nemotron-3.5-super-vl:free)
    3. Cohere (command-r-plus-08-2024)
    4. Google Gemini (gemini-2.5-flash)
    """
    load_keys()
    
    # 1. Try Groq (Ultra-fast ~150ms)
    groq_key = os.environ.get("GROQ_API_KEY") or os.environ.get("GROQ_KEY")
    if groq_key:
        for model in ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                }
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": user_prompt})
                
                resp = requests.post(
                    url,
                    headers=headers,
                    json={"model": model, "messages": messages, "temperature": 0.1},
                    timeout=5
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return {
                        "content": content,
                        "provider": f"Groq ({model})",
                        "status": "success"
                    }
                else:
                    logger.warning(f"Groq {model} returned HTTP {resp.status_code}: {resp.text[:150]}")
            except Exception as e:
                logger.warning(f"Groq {model} call failed: {e}")

    # 2. Try OpenRouter
    openrouter_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENROUTER_KEY")
    if openrouter_key:
        for model in ["nvidia/nemotron-3.5-super-vl:free", "google/gemma-4-26b-a4b-it:free"]:
            try:
                url = "https://openrouter.ai/api/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json"
                }
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": user_prompt})

                resp = requests.post(
                    url,
                    headers=headers,
                    json={"model": model, "messages": messages, "temperature": 0.1},
                    timeout=8
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return {
                        "content": content,
                        "provider": f"OpenRouter ({model})",
                        "status": "success"
                    }
            except Exception as e:
                logger.warning(f"OpenRouter {model} call failed: {e}")

    # 3. Try Cohere
    cohere_key = os.environ.get("COHERE_API_KEY") or os.environ.get("COHERE_KEY")
    if cohere_key:
        try:
            url = "https://api.cohere.com/v2/chat"
            headers = {
                "Authorization": f"Bearer {cohere_key}",
                "Content-Type": "application/json"
            }
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": user_prompt})

            resp = requests.post(
                url,
                headers=headers,
                json={"model": "command-r-plus-08-2024", "messages": messages},
                timeout=8
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["message"]["content"][0]["text"]
                return {
                    "content": content,
                    "provider": "Cohere (command-r-plus)",
                    "status": "success"
                }
        except Exception as e:
            logger.warning(f"Cohere call failed: {e}")

    # 4. Try Google Gemini
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_KEY")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            full_prompt = f"{system_prompt}\n\n{user_prompt}" if system_prompt else user_prompt
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=full_prompt
            )
            if response.text:
                return {
                    "content": response.text,
                    "provider": "Google Gemini (gemini-2.5-flash)",
                    "status": "success"
                }
        except Exception as e:
            logger.warning(f"Google Gemini call failed: {e}")

    return {
        "content": "",
        "provider": "NONE",
        "status": "failed"
    }

def call_vision_llm(image_bytes: bytes, mime_type: str, prompt: str) -> Optional[Dict[str, Any]]:
    """
    Analyze vehicle image using multimodal vision LLM:
    1. NVIDIA NIM Vision (nvidia/nemotron-3.5-super-vl-120b)
    2. OpenRouter Vision (nvidia/nemotron-3.5-super-vl:free)
    3. Google Gemini Vision (gemini-2.5-flash)
    """
    load_keys()

    # 1. NVIDIA NIM Multimodal Vision (Nemotron-3.5-super-vl-120b)
    nvidia_key = os.environ.get("NVIDIA_API_KEY") or os.environ.get("NVIDIA_KEY")
    if nvidia_key and len(image_bytes) > 50:
        try:
            b64_img = base64.b64encode(image_bytes).decode("utf-8")
            data_url = f"data:{mime_type};base64,{b64_img}"
            url = "https://integrate.api.nvidia.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {nvidia_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "nvidia/nemotron-3.5-super-vl-120b-a12b",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": data_url}}
                        ]
                    }
                ],
                "temperature": 0.1,
                "max_tokens": 1024
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                msg = data["choices"][0]["message"]
                content = (msg.get("content") or "").strip()
                if not content:
                    content = (msg.get("reasoning_content") or "").strip()
                return {
                    "raw_text": str(content),
                    "provider": "NVIDIA NIM (nvidia/nemotron-3.5-super-vl-120b)"
                }
        except Exception as e:
            logger.warning(f"NVIDIA NIM vision failed: {e}")
    
    # 2. OpenRouter Multimodal Vision
    openrouter_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENROUTER_KEY")
    if openrouter_key and len(image_bytes) > 50:
        try:
            b64_img = base64.b64encode(image_bytes).decode("utf-8")
            data_url = f"data:{mime_type};base64,{b64_img}"
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {openrouter_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "nvidia/nemotron-3.5-super-vl:free",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": data_url}}
                        ]
                    }
                ],
                "temperature": 0.1,
                "max_tokens": 1024
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                msg = data["choices"][0]["message"]
                content = msg.get("content") or msg.get("reasoning") or ""
                return {
                    "raw_text": str(content),
                    "provider": "OpenRouter (nvidia/nemotron-3.5-super-vl:free)"
                }
        except Exception as e:
            logger.warning(f"OpenRouter vision failed: {e}")

    # 2. Google Gemini Vision
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_KEY")
    if gemini_key and len(image_bytes) > 50:
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt
                ]
            )
            if response.text:
                return {
                    "raw_text": response.text,
                    "provider": "Google Gemini Vision (gemini-2.5-flash)"
                }
        except Exception as e:
            logger.warning(f"Gemini vision failed: {e}")

    return None
