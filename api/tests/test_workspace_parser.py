import os

os.environ.setdefault("ARXIFY_SQLITE_PATH", "/tmp/arxify_test_workspace_parser.db")

from api.routes.workspace import _parse_openai_sse


def test_parse_openai_sse_uses_agent_summary_when_content_is_absent():
    raw = "\n\n".join(
        [
            'data: {"choices":[{"delta":{"role":"assistant"},"finish_reason":null}]}',
            'data: {"choices":[{"delta":{"reasoning_steps":[{"thought":"thinking"}]},"finish_reason":null}]}',
            'data: {"choices":[{"delta":{"agent_summary":"{\\"ok\\": true}"},"finish_reason":null}]}',
            'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}',
            "data: [DONE]",
        ]
    )

    assert _parse_openai_sse(raw, "apodex-1-0-deepresearch") == '{"ok": true}'


def test_parse_openai_sse_prefers_content_over_agent_summary():
    raw = "\n\n".join(
        [
            'data: {"choices":[{"delta":{"agent_summary":"summary"},"finish_reason":null}]}',
            'data: {"choices":[{"delta":{"content":"{\\"ok\\":"},"finish_reason":null}]}',
            'data: {"choices":[{"delta":{"content":" true}"},"finish_reason":null}]}',
            "data: [DONE]",
        ]
    )

    assert _parse_openai_sse(raw, "apodex-1-0-deepresearch") == '{"ok": true}'
