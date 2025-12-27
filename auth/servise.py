import hmac

from fastapi import Request
from starlette.responses import RedirectResponse
from starlette.status import HTTP_303_SEE_OTHER

from config import USERS_DICT


class LoginIn:

    def __init__(self):
        self.users = USERS_DICT

    def check_auth(self, username: str, password: str) -> str | None:
        if not username or not password:
            return None

        for group_name, creds in self.users.items():

            login_correct = hmac.compare_digest(
                username, creds.get("login", "")
            )
            pass_correct = hmac.compare_digest(
                password, creds.get("password", "")
            )

            if login_correct and pass_correct:
                return group_name

        return None

    @staticmethod
    def require_auth(request: Request, group: str | None = None):

        auth = request.session.get("auth")
        role = request.session.get("role")

        if not auth:
            return RedirectResponse(
                url="/login", status_code=HTTP_303_SEE_OTHER
            )

        if group is not None and role != group:
            return RedirectResponse(
                url="/forbidden", status_code=HTTP_303_SEE_OTHER
            )

        return None
