import logging
from typing import Any, Dict, List, Optional
import httpx

from nexus.config import settings
from nexus.providers.base import BaseAIProvider, ProviderStatus

logger = logging.getLogger("nexus.providers.ollama")


class OllamaProvider(BaseAIProvider):
    """Local Ollama integration adapter."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")

    @property
    def provider_id(self) -> str:
        return "ollama"

    @property
    def name(self) -> str:
        return "Local Ollama"

    async def check_health(self) -> ProviderStatus:
        """Asynchronously checks if local Ollama daemon is reachable and lists models."""
        url = f"{self.base_url}/api/tags"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    models = [m.get("name", "") for m in data.get("models", []) if m.get("name")]
                    return ProviderStatus(
                        provider_id=self.provider_id,
                        name=self.name,
                        connected=True,
                        status_message=f"Connected — {len(models)} local model(s) available",
                        available_models=models,
                        metadata={"endpoint": self.base_url, "model_count": len(models)},
                    )
                else:
                    return ProviderStatus(
                        provider_id=self.provider_id,
                        name=self.name,
                        connected=False,
                        status_message=f"Ollama returned HTTP {resp.status_code}",
                        available_models=[],
                        metadata={"endpoint": self.base_url},
                    )
        except Exception as ex:
            return ProviderStatus(
                provider_id=self.provider_id,
                name=self.name,
                connected=False,
                status_message=f"Offline ({self.base_url}): daemon not running or connection refused",
                available_models=[],
                metadata={"endpoint": self.base_url, "error": str(ex)},
            )

    async def generate_completion(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        """Optional completion via local Ollama."""
        target_model = model or settings.ollama_default_model
        url = f"{self.base_url}/api/generate"
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json={"model": target_model, "prompt": prompt, "stream": False})
            resp.raise_for_status()
            return resp.json()
