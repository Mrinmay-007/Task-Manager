# app/middleware.py

# FIX (BUG): this file was completely empty. The workflow doc (section 15)
# describes a middleware that times every request and logs the method, URL,
# status, and execution time — none of that existed. Implemented below.

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start_time

        print(
            f"{request.method} {request.url.path} "
            f"- Status: {response.status_code} "
            f"- Execution Time: {duration:.4f}s"
        )
        return response
