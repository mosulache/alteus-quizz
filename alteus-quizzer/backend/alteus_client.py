import json
import os
import re
from typing import Any, Dict, Optional

import httpx


DEFAULT_ALTEUS_API_URL = "https://providers-api.tech.esolutions.ro/api/responses"


class AlteusConfigError(RuntimeError):
    pass


class AlteusResponseError(RuntimeError):
    pass


def _get_env(name: str, fallback_names: list[str] | None = None) -> Optional[str]:
    v = os.getenv(name)
    if v:
        return v
    for fb in fallback_names or []:
        v2 = os.getenv(fb)
        if v2:
            return v2
    return None


def _extract_json_substring(text: str) -> str:
    """
    Model is instructed to output strict JSON, but we still defensively extract the first JSON
    object/array if anything leaks.
    """
    text = text.strip()
    if not text:
        raise AlteusResponseError("Empty model output.")

    if text[0] in "{[":
        return text

    # Try first {...} or [...] span
    m_obj = re.search(r"\{[\s\S]*\}", text)
    m_arr = re.search(r"\[[\s\S]*\]", text)
    m = m_obj or m_arr
    if not m:
        raise AlteusResponseError("Could not locate JSON in model output.")
    return m.group(0)


def _collect_text_fragments(obj: Any) -> str:
    """
    Heuristic extraction of streamed textual deltas from vendor wrappers (OpenAI-ish, custom).
    We only use common key names to reduce accidental concatenation of irrelevant fields.
    """
    allowed_keys = {"text", "delta", "output_text"}

    out: list[str] = []

    def walk(x: Any):
        if isinstance(x, dict):
            for k, v in x.items():
                if k in allowed_keys and isinstance(v, str):
                    out.append(v)
                else:
                    walk(v)
        elif isinstance(x, list):
            for it in x:
                walk(it)

    walk(obj)
    return "".join(out)


def _merge_stream_text(prev: str, chunk: str) -> str:
    """
    Alteus/providers may stream either:
    - deltas (small appended fragments), or
    - cumulative snapshots (full output-so-far repeated each event).

    This merges both styles defensively:
    - If chunk is a cumulative snapshot that starts with prev, replace prev.
    - If chunk looks like an older snapshot (prev starts with chunk), ignore it.
    - Otherwise treat as delta and append.
    """
    if not chunk:
        return prev
    if not prev:
        return chunk

    if chunk.startswith(prev):
        return chunk
    if prev.startswith(chunk):
        return prev
    return prev + chunk


async def alteus_call_json(prompt_text: str, *, timeout_s: float = 60.0) -> Dict[str, Any]:
    """
    Calls Alteus /api/responses with stream=true internally. Returns parsed JSON object produced by the model.
    """
    api_url = _get_env("ALTEUS_API_URL") or DEFAULT_ALTEUS_API_URL
    api_key = _get_env("ALTEUS_API_KEY", ["ALTEUS_APY_KEY"])
    endpoint_id = _get_env("ALTEUS_ENDPOINT_ID", ["ALTEUS_ENTPOINT_ID"])
    if not api_key:
        raise AlteusConfigError("Missing ALTEUS_API_KEY in environment.")
    if not endpoint_id:
        raise AlteusConfigError("Missing ALTEUS_ENDPOINT_ID in environment.")

    payload = {
        "endpoint_id": endpoint_id,
        "input": [
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt_text},
                ],
            }
        ],
        "stream": True,
        "web_search_enabled": False,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    text_accum = ""
    last_obj: Any = None
    last_parsed: Dict[str, Any] | None = None

    async with httpx.AsyncClient(timeout=httpx.Timeout(timeout_s)) as client:
        async with client.stream("POST", api_url, headers=headers, json=payload) as resp:
            if resp.status_code >= 400:
                body = (await resp.aread()).decode("utf-8", errors="ignore")
                raise AlteusResponseError(f"Alteus error {resp.status_code}: {body[:500]}")

            async for raw_line in resp.aiter_lines():
                if not raw_line:
                    continue
                line = raw_line.strip()
                if not line.startswith("data:"):
                    continue

                data_str = line[len("data:") :].strip()
                if not data_str or data_str == "[DONE]":
                    continue

                try:
                    obj = json.loads(data_str)
                except json.JSONDecodeError:
                    # Some servers may send partial JSON per line; ignore and rely on later lines.
                    continue

                last_obj = obj
                frag = _collect_text_fragments(obj).strip()
                if frag:
                    text_accum = _merge_stream_text(text_accum, frag)

                    # Opportunistically parse as soon as we see valid JSON to handle snapshot streams
                    try:
                        candidate = _extract_json_substring(text_accum)
                        parsed_try = json.loads(candidate)
                        if isinstance(parsed_try, dict):
                            last_parsed = parsed_try
                    except Exception:
                        pass

    # Prefer accumulated text (works for delta streams), otherwise try to extract from last payload.
    if last_parsed is not None:
        return last_parsed

    candidate = text_accum.strip()
    if not candidate and last_obj is not None:
        candidate = _collect_text_fragments(last_obj).strip()

    if not candidate:
        raise AlteusResponseError("Did not receive any text content from Alteus stream.")

    candidate = _extract_json_substring(candidate)
    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError as e:
        # Give one more try after trimming to JSON substring (already done) and collapsing whitespace.
        compact = candidate.strip()
        try:
            parsed = json.loads(compact)
        except json.JSONDecodeError:
            raise AlteusResponseError(f"Failed to parse JSON from model output: {e}") from e

    if not isinstance(parsed, dict):
        raise AlteusResponseError("Model output is not a JSON object.")
    return parsed


