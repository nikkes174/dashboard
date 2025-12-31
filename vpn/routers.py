# vpn/router.py
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import case, delete, func, select, update
from sqlalchemy.exc import IntegrityError
from starlette.status import HTTP_303_SEE_OTHER

from vpn.db_services import VPNDatabase, VPNUtils
from vpn.models import LinkModel, VPNUser
from vpn.send_message import SendMessageIn, tg_send_message

router = APIRouter(prefix="/vpn", tags=["VPN"])
templates = Jinja2Templates(directory="frontend/templates")


@router.get("/")
async def vpn_page(request: Request, page: int = 1, search: str = ""):
    if not request.session.get("auth"):
        return RedirectResponse("/auth/login", status_code=HTTP_303_SEE_OTHER)

    if request.session.get("role") != "vpn":
        return RedirectResponse("/auth/login", status_code=HTTP_303_SEE_OTHER)

    utils = VPNUtils()
    users = await utils.get_users_list()

    if search:
        users = [u for u in users if search in str(u["user_id"])]

    page_size = 10
    total_pages = max(1, -(-len(users) // page_size))

    page = max(1, min(page, total_pages))

    start = (page - 1) * page_size
    end = start + page_size
    page_users = users[start:end]

    return templates.TemplateResponse(
        "vpn.html",
        {
            "request": request,
            "users": page_users,
            "page": page,
            "total_pages": total_pages,
            "search": search,
        },
    )


@router.post("/delete/{user_id}")
async def delete_user(request: Request, user_id: int):
    if not request.session.get("auth"):
        return RedirectResponse("/auth/login", status_code=HTTP_303_SEE_OTHER)

    if request.session.get("role") != "vpn":
        return RedirectResponse("/auth/login", status_code=HTTP_303_SEE_OTHER)

    utils = VPNUtils()
    await utils.delete_user(user_id)

    return RedirectResponse("/vpn", status_code=HTTP_303_SEE_OTHER)


def _check_vpn_auth(request: Request):
    if not request.session.get("auth"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    if request.session.get("role") != "vpn":
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("/links")
async def get_links(
    request: Request,
    page: int = Query(1, ge=1),
    user_id: int | None = Query(None),
    per_page: int = Query(10, ge=1, le=100),
):
    _check_vpn_auth(request)

    db = VPNDatabase()
    async for session in db.get_session():

        base_stmt = select(LinkModel)
        count_stmt = select(func.count(LinkModel.id))

        if user_id is not None:
            base_stmt = base_stmt.where(LinkModel.user_id == user_id)
            count_stmt = count_stmt.where(LinkModel.user_id == user_id)

        # total count
        total = (await session.execute(count_stmt)).scalar_one()
        total_pages = max(1, (total + per_page - 1) // per_page)

        # offset/limit
        offset = (page - 1) * per_page

        stmt = (
            base_stmt.order_by(
                case((LinkModel.user_id == None, 0), else_=1),
                LinkModel.id.desc(),
            )
            .offset(offset)
            .limit(per_page)
        )
        res = await session.execute(stmt)
        links = res.scalars().all()

        return {
            "items": [
                {
                    "id": l.id,
                    "link_address": l.link_address,
                    "user_id": l.user_id,
                }
                for l in links
            ],
            "page": page,
            "total_pages": total_pages,
            "total": total,
        }


@router.post("/links")
async def create_link(request: Request):
    _check_vpn_auth(request)

    data = await request.json()
    link_address = data.get("link_address", "").strip()
    user_id = data.get("user_id", None)

    if not link_address:
        raise HTTPException(status_code=400, detail="link_address required")

    db = VPNDatabase()
    async for session in db.get_session():
        new_link = LinkModel(link_address=link_address, user_id=user_id)
        session.add(new_link)

        try:
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"DB error: {e}")

        await session.refresh(new_link)
        return {
            "success": True,
            "link": {
                "id": new_link.id,
                "link_address": new_link.link_address,
                "user_id": new_link.user_id,
            },
        }


@router.put("/links/{link_id}")
async def update_link(request: Request, link_id: int):
    _check_vpn_auth(request)

    data = await request.json()
    link_address = data.get("link_address", "").strip()
    user_id = data.get("user_id", None)

    if not link_address:
        raise HTTPException(status_code=400, detail="link_address required")

    db = VPNDatabase()
    async for session in db.get_session():

        # ✅ если user_id не null — проверяем что пользователь существует
        if user_id is not None:
            user_exists = await session.execute(
                select(VPNUser.user_id).where(VPNUser.user_id == user_id)
            )
            if user_exists.scalar_one_or_none() is None:
                raise HTTPException(
                    status_code=400, detail=f"user_id {user_id} not found"
                )

        stmt = (
            update(LinkModel)
            .where(LinkModel.id == link_id)
            .values(link_address=link_address, user_id=user_id)
        )

        try:
            result = await session.execute(stmt)
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Link not found")

            await session.commit()
        except IntegrityError:
            await session.rollback()
            raise HTTPException(
                status_code=400, detail="Invalid user_id (FK constraint)"
            )

        return {"success": True}


@router.delete("/links/{link_id}")
async def delete_link(request: Request, link_id: int):
    _check_vpn_auth(request)

    db = VPNDatabase()
    async for session in db.get_session():
        stmt = delete(LinkModel).where(LinkModel.id == link_id)
        result = await session.execute(stmt)
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Link not found")

        await session.commit()
        return {"success": True}

@router.post("/send_message")
async def send_message(request: Request, payload: SendMessageIn):
    _check_vpn_auth(request)

    sent = 0
    failed = 0
    errors = []

    for chat_id in payload.user_ids:
        try:
            await tg_send_message(chat_id, payload.text)
            sent += 1
        except Exception as e:
            failed += 1
            errors.append({"chat_id": chat_id, "error": str(e)})

    return {"sent": sent, "failed": failed, "errors": errors}