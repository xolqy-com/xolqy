# Xolqy MCP server

Query your [Xolqy](https://xolqy.com) analytics with Claude (or any
[MCP](https://modelcontextprotocol.io) client) — ask questions in plain language
instead of reading a dashboard. Because Xolqy data is anonymous and aggregate,
handing it to an AI is privacy-safe.

> "What were my top pages last week?" · "Why did traffic drop on Tuesday?" ·
> "Which sources convert best across all my sites?"

## Setup

1. **Create a read-only API key** in the Xolqy dashboard → **API keys** → *Generate key*. Copy it (shown once).
2. **Install:**
   ```bash
   cd mcp
   npm install
   ```
3. **Add to your MCP client.** For **Claude Desktop**, edit `claude_desktop_config.json`
   (Settings → Developer → Edit Config):
   ```json
   {
     "mcpServers": {
       "xolqy": {
         "command": "node",
         "args": ["/absolute/path/to/xolqy/mcp/index.js"],
         "env": { "XOLQY_API_KEY": "xolqy_sk_your_key_here" }
       }
     }
   }
   ```
   Restart Claude Desktop. (Same idea for Cursor, Cline, etc. — set the command, args, and `XOLQY_API_KEY` env.)

Self-hosting Xolqy on your own domain? Also set `XOLQY_BASE_URL` (default `https://xolqy.com`).

## Tools exposed

| Tool | What it returns |
|------|-----------------|
| `list_sites` | Domains this key can read (call first) |
| `get_overview` | Pageviews, visitors, sessions, avg time, avg scroll |
| `top_pages` | Most-visited pages |
| `top_pages_by_engagement` | Pages by time-on-page / scroll |
| `top_sources` | Referrers / traffic sources |
| `top_countries` | Visitors by country |
| `device_breakdown` | Pageviews by device |
| `traffic_series` | Daily pageviews/visitors time series |

Each stat tool takes `site` (a domain from `list_sites`) and optional `days` (default 7).

## Security

- The API key is **read-only** — it can only list your sites and read stats. It cannot change settings, manage sharing, or see account details.
- Only the key's SHA-256 hash is stored server-side. Revoke any key anytime in the dashboard.
- Keep the key out of source control; pass it via the client's `env` config.
