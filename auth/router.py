# auth/router.py
from fastapi import APIRouter, Form, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.status import HTTP_303_SEE_OTHER

from auth.servise import LoginIn

router = APIRouter(prefix="/auth", tags=["Auth"])

templates = Jinja2Templates(directory="frontend/templates")


@router.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse("auth.html", {"request": request})


@router.post("/login")
async def login(
    request: Request, username: str = Form(...), password: str = Form(...)
):
    login_checker = LoginIn()
    role = login_checker.check_auth(username, password)

    if not role:
        return templates.TemplateResponse(
            "auth.html",
            {"request": request, "error": "❌ Неверный логин или пароль"},
        )

    request.session["auth"] = True
    request.session["role"] = role

    if role == "vpn":
        return RedirectResponse("/vpn", status_code=HTTP_303_SEE_OTHER)

    if role == "codex":
        return RedirectResponse("/codex", status_code=HTTP_303_SEE_OTHER)

    return RedirectResponse("/auth/login", status_code=HTTP_303_SEE_OTHER)


@router.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/auth/login", status_code=HTTP_303_SEE_OTHER)
