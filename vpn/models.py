from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import BigInteger, Date, ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class VPNUser(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_name: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_trial_period: Mapped[Optional[date]] = mapped_column(
        Date, nullable=True
    )
    links = relationship(
        "LinkModel", back_populates="user", cascade="all, delete-orphan"
    )


class LinkModel(Base):
    __tablename__ = "links"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    link_address: Mapped[str] = mapped_column(String(256), unique=True)

    user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),  # Ключевой момент
        nullable=True,
    )

    user = relationship("VPNUser", back_populates="links")
