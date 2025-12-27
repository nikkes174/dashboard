from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from auth.router import router as auth_router
from middleware import setup_middlewares
from vpn.routers import router as vpn_router

app = FastAPI(title="DashboardVPN API")

setup_middlewares(app)

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

app.include_router(auth_router)
app.include_router(vpn_router)


@app.get("/")
async def root():
    return RedirectResponse(url="/auth/login")
