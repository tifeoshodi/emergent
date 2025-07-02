from __future__ import annotations

import logging
import os
from typing import Optional

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
