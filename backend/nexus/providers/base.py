from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ProviderStatus(BaseModel):
    provider_id: str
    name: str
    connected: bool
    status_message: str
    available_models: List[str] = []
    metadata: Dict[str, Any] = {}


class BaseAIProvider(ABC):
    """Abstract interface for AI model providers."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def check_health(self) -> ProviderStatus:
        """Check provider connectivity and retrieve available models."""
        pass

