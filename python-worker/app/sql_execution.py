"""Resolve direct SQL messages and execute safe, read-only PostgreSQL queries."""

import json
import logging
import os
import re
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any
from uuid import UUID
from urllib.parse import urlsplit

import psycopg
import sqlglot
from sqlglot import exp

MAX_RESULT_ROWS = 500
STATEMENT_TIMEOUT_MS = 10_000
_SQL_FENCE = re.compile(r"^```(?:sql)?\s*\n?(.*?)\n?```$", re.IGNORECASE | re.DOTALL)
logger = logging.getLogger(__name__)


def resolve_sql_query(message: str) -> str | None:
    """Return pasted SQL, or None so a future natural-language router can run."""
    candidate = message.strip()
    fenced = _SQL_FENCE.fullmatch(candidate)
    if fenced:
        candidate = fenced.group(1).strip()
    if re.match(r"^(SELECT|WITH)\b", candidate, re.IGNORECASE):
        return candidate
    return None


def _validate_query(query: str) -> None:
    try:
        statements = sqlglot.parse(query, read="postgres")
    except sqlglot.errors.ParseError as exc:
        raise ValueError("I couldn't parse that SQL query. Please check its syntax.") from exc
    if len(statements) != 1 or statements[0] is None or not isinstance(statements[0], exp.Query):
        raise ValueError("Only one read-only SELECT query is allowed per message.")


def _cell_value(value: Any) -> str | int | float:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return str(value).lower()
    if isinstance(value, int | float):
        return value
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (date, datetime, time, UUID)):
        return value.isoformat() if hasattr(value, "isoformat") else str(value)
    if isinstance(value, (dict, list)):
        value = json.dumps(value, default=str)
    elif isinstance(value, bytes | bytearray | memoryview):
        value = f"<binary data: {len(value)} bytes>"
    return str(value)[:4000]


def _run_query(query: str, database_url: str) -> dict[str, Any]:
    with psycopg.connect(database_url, connect_timeout=10) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SET TRANSACTION READ ONLY")
            cursor.execute(f"SET LOCAL statement_timeout = {STATEMENT_TIMEOUT_MS}")
            cursor.execute(query)
            if cursor.description is None:
                return {"type": "table", "title": "Query results", "columns": [], "rows": []}
            columns = [column.name for column in cursor.description]
            fetched = cursor.fetchmany(MAX_RESULT_ROWS + 1)
    rows = [
        {column: _cell_value(value) for column, value in zip(columns, row)}
        for row in fetched[:MAX_RESULT_ROWS]
    ]
    title = f"Query results (first {MAX_RESULT_ROWS} rows)" if len(fetched) > MAX_RESULT_ROWS else "Query results"
    return {"type": "table", "title": title, "columns": columns, "rows": rows}


async def execute_read_query(query: str) -> dict[str, Any]:
    """Execute a single SELECT in a read-only transaction with bounded runtime/results."""
    _validate_query(query)
    database_url = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")
    if not database_url:
        return {
            "type": "text",
            "content": "SQL execution isn't configured yet. Set DATABASE_URL to your Neon PostgreSQL connection string.",
        }
    try:
        # psycopg is synchronous; keep database I/O from blocking the queue event loop.
        import asyncio

        return await asyncio.to_thread(_run_query, query, database_url)
    except psycopg.Error as exc:
        detail = exc.diag.message_primary if exc.diag and exc.diag.message_primary else str(exc).splitlines()[0]
        parsed_url = urlsplit(database_url)
        for sensitive_value in (database_url, parsed_url.password):
            if sensitive_value:
                detail = detail.replace(sensitive_value, "[redacted]")
        code = f" (PostgreSQL error {exc.sqlstate})" if exc.sqlstate else ""
        logger.error(
            json.dumps(
                {
                    "event": "chat.sql.database_error",
                    "errorType": type(exc).__name__,
                    "sqlState": exc.sqlstate,
                    "detail": detail[:500],
                },
                separators=(",", ":"),
            )
        )
        return {
            "type": "text",
            "content": f"The SQL query could not be completed{code}: {detail[:300]}",
        }

