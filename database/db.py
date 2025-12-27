from abc import ABC, abstractmethod
from typing import Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


class AbstractDatabase(ABC):
    engine: Optional[AsyncEngine] = None
    session_factory: Optional[async_sessionmaker[AsyncSession]] = None

    def __init__(self, db_url: str, echo: bool = False):
        self.engine = create_async_engine(
            db_url, echo=echo, pool_pre_ping=True
        )
        self.session_factory = async_sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    @abstractmethod
    async def get_session(self):
        raise NotImplementedError
