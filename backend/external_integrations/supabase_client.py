from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

from supabase import Client, create_client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    logger.warning(

        "SUPABASE_URL or SUPABASE_KEY not set; Supabase client not initialized"
    )


def _client_for_token(jwt: Optional[str]) -> Client:
    if not supabase:
        raise RuntimeError("Supabase client not configured")
    if jwt:
        return create_client(
            SUPABASE_URL,
            SUPABASE_KEY,
            options={"global": {"headers": {"Authorization": f"Bearer {jwt}"}}},
        )
    return supabase


def insert(table: str, data: Dict[str, Any], jwt: Optional[str] = None) -> Any:
    client = _client_for_token(jwt)
    return client.table(table).insert(data).execute().data


def select(table: str, query: Optional[Dict[str, Any]] = None, jwt: Optional[str] = None) -> Any:
    client = _client_for_token(jwt)
    q = client.table(table).select("*")
    if query:
        q = q.match(query)
    return q.execute().data


def update(table: str, query: Dict[str, Any], data: Dict[str, Any], jwt: Optional[str] = None) -> Any:
    client = _client_for_token(jwt)
    return client.table(table).update(data).match(query).execute().data
