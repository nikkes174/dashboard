from typing import AsyncIterator

from sqlalchemy import MetaData, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import DATABASE_URL_VPN
from database.db import AbstractDatabase
from vpn.models import LinkModel, VPNUser


class VPNDatabase(AbstractDatabase):
    def __init__(self):
        db_url = DATABASE_URL_VPN
        super().__init__(db_url=db_url, echo=False)

    async def get_session(self) -> AsyncIterator[AsyncSession]:
        async with self.session_factory() as session:
            yield session


class VPNUtils:
    def __init__(self, db=None):
        self.db = db or VPNDatabase()
        self.metadata = MetaData()

    async def get_users_list(self):
        async for session in self.db.get_session():
            query = select(
                VPNUser.user_id,
                VPNUser.user_name,
                VPNUser.end_date,
                VPNUser.end_trial_period,
            )
            rows = (await session.execute(query)).all()

            return [
                {
                    "user_id": r.user_id,
                    "username": r.user_name,
                    "end_date": r.end_date,
                    "trial_end": r.end_trial_period,
                }
                for r in rows
            ]

    async def delete_user(self, user_id: int):
        async for session in self.db.get_session():
            stmt = delete(VPNUser).where(VPNUser.user_id == user_id)
            await session.execute(stmt)
            await session.commit()
            return {"success": True, "message": f"User {user_id} deleted"}


class LinkService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_link_random_kink(self):
        stmt = (
            select(LinkModel)
            .where(LinkModel.user_id.is_(None))
            .order_by(func.random())
            .limit(1)
        )

        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_free_random_links(self, count: int):
        stmt = (
            select(LinkModel)
            .where(LinkModel.user_id.is_(None))
            .order_by(func.random())
            .limit(count)
        )

        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def assign_one_link_to_user(self, user_id: int):
        link = await self.get_free_random_links(1)
        if not link:
            return None

        link = link[0]
        link.user_id = user_id

        await self.session.commit()
        await self.session.refresh(link)

        return link

    async def assign_links_to_user(self, user_id: int, count: int):
        links = await self.get_free_random_links(count)

        if len(links) < count:

            return None

        for link in links:
            link.user_id = user_id

        await self.session.commit()

        for link in links:
            await self.session.refresh(link)

        return links

    async def get_user_links(self, user_id: int):
        stmt = select(LinkModel).where(LinkModel.user_id == user_id)
        res = await self.session.execute(stmt)
        return res.scalars().all()
