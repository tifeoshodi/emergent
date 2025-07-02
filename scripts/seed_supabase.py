import os
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def seed():
    org = supabase.table("orgs").insert({"name": "Demo Org"}).execute().data[0]
    profile = supabase.table("profiles").insert({
        "id": "00000000-0000-0000-0000-000000000001",
        "org_id": org["id"],
        "email": "user@example.com",
    }).execute().data[0]
    supabase.table("projects").insert({
        "org_id": org["id"],
        "name": "Demo Project",
        "owner": profile["id"],
    }).execute()
    print("Seed data inserted")


if __name__ == "__main__":
    seed()
