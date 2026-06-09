#!/usr/bin/env node
// Xolqy MCP server — lets Claude (and any MCP client) query your Xolqy
// analytics directly, so you can ask questions instead of reading a dashboard.
//
// Setup:
//   1. Create a read-only API key in the Xolqy dashboard (API keys panel).
//   2. cd mcp && npm install
//   3. Add to your MCP client config (see README) with XOLQY_API_KEY set.
//
// Auth is the read-only API key; it can only list your sites and read stats.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE = (process.env.XOLQY_BASE_URL || 'https://xolqy.com').replace(/\/$/, '');
const KEY = process.env.XOLQY_API_KEY;

if (!KEY) {
  console.error('[xolqy-mcp] WARNING: XOLQY_API_KEY is not set. Create one in the Xolqy dashboard → API keys.');
}

async function api(path, params = {}) {
  if (!KEY) throw new Error('XOLQY_API_KEY is not set. Create a read-only key in the Xolqy dashboard.');
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { authorization: `Bearer ${KEY}` } });
  if (!res.ok) throw new Error(`Xolqy API ${res.status}: ${await res.text()}`);
  return res.json();
}

function range(days) {
  const now = Math.floor(Date.now() / 1000);
  return { from: now - (Number(days) || 7) * 86400, to: now };
}

const text = (data) => ({ content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] });

const server = new McpServer({ name: 'xolqy', version: '1.0.0' });

// Discover which sites this key can read.
server.tool(
  'list_sites',
  'List the website domains this Xolqy account can read analytics for. Call this first to get a valid `site` value.',
  {},
  async () => {
    const { sites } = await api('/api/sites');
    return text((sites || []).map((s) => s.domain));
  },
);

// site + days helper for the stat tools.
const statShape = {
  site: z.string().describe('Domain to query, e.g. "example.com". Use list_sites to discover valid values.'),
  days: z.number().int().positive().optional().describe('Look-back window in days (default 7).'),
};

function statTool(name, description, endpoint) {
  server.tool(name, description, statShape, async ({ site, days }) => {
    const r = range(days);
    return text(await api(`/api/stats/${endpoint}`, { site, from: r.from, to: r.to }));
  });
}

statTool('get_overview', 'Headline KPIs for a site: pageviews, unique visitors, sessions, average time on page, average scroll depth.', 'overview');
statTool('top_pages', 'Most-visited pages for a site, with views, visitors, average time and scroll depth per page.', 'top-pages');
statTool('top_pages_by_engagement', 'Pages ranked by engagement (average time on page and scroll depth).', 'engagement');
statTool('top_sources', 'Top referrers / traffic sources for a site.', 'referrers');
statTool('top_countries', 'Visitor counts by country.', 'countries');
statTool('device_breakdown', 'Pageviews by device type (desktop / mobile / tablet).', 'devices');
statTool('traffic_series', 'Daily time series of pageviews and visitors, for trends and "why did traffic change" analysis.', 'series');

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[xolqy-mcp] connected. Base: ${BASE}. Key: ${KEY ? 'set' : 'MISSING'}.`);
