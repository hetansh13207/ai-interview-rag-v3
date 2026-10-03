import os

from clerk_backend_api import AuthenticateRequestOptions, authenticate_request
from clerk_backend_api.security.types import RequestState
from fastapi import HTTPException, Request
from dotenv import load_dotenv

load_dotenv()

def get_current_user_id(request: Request) -> str:
    jwt_key = os.getenv("CLERK_JWT_KEY")
    if jwt_key:
        jwt_key = jwt_key.replace("\\n", "\n")

    authorized_parties = [
        party.strip()
        for party in os.getenv("CLERK_AUTHORIZED_PARTIES", "").split(",")
        if party.strip()
    ]

    state: RequestState = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=os.getenv("CLERK_SECRET_KEY"),
            jwt_key=jwt_key,
            authorized_parties=authorized_parties,
            accepts_token=["session_token"],
        ),
    )

    if not state.is_authenticated or not state.payload or not state.payload.get("sub"):
        raise HTTPException(status_code=401, detail="Not authenticated")

    return state.payload["sub"]
