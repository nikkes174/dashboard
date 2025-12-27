import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL_VPN = os.getenv("DATABASE_URL_VPN")
DATABASE_URL_CODEX = os.getenv('DATABASE_URL_CODEX')
SECRET_KEY = os.getenv('SECRET_KEY')

LOGIN = os.getenv("LOGIN")

USERS_DICT = {
    "vpn": {
        "login": os.getenv('USER_NAME_VPN'),
        "password": os.getenv('PASS_VPN'),
    },
    "codex": {
        "login": os.getenv('USER_NAME_CODEX'),
        "password": os.getenv('PASS_CODEX'),
    },
}
