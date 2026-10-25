'use strict';

let cachedArticles = null;
let cachedAt = 0;
const CACHE_MS = 10 * 60 * 1000;

function sendJson(res, statusCode, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

module.exports = async function indianRailwayNews(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (cachedArticles && Date.now() - cachedAt < CACHE_MS) {
    return sendJson(res, 200, { articles: cachedArticles });
  }

  const apiKey = process.env.GNEWS_API_KEY || process.env.INDIAN_RAILWAY_NEWS_API_KEY;
  if (!apiKey) {
    return sendJson(res, 503, { error: 'Railway news is not configured on this server.' });
  }

  const params = new URLSearchParams({
    q: 'Indian Railway',
    lang: 'en',
    country: 'in',
    max: '8',
    sortby: 'publishedAt',
    apikey: apiKey
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`https://gnews.io/api/v4/search?${params}`, {
      signal: controller.signal
    });
    let result = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }
    if (!response.ok || !result || !Array.isArray(result.articles)) {
      return sendJson(res, response.status === 429 ? 429 : 502, {
        error: (result && (result.errors?.[0] || result.message)) || 'The railway news service could not be reached.'
      });
    }

    cachedArticles = (result.articles || []).filter(article => article && article.title && article.url)
      .slice(0, 8)
      .map(article => ({
        title: String(article.title),
        url: String(article.url),
        source: String(article.source?.name || 'News source'),
        publishedAt: String(article.publishedAt || '')
      }));
    cachedAt = Date.now();
    return sendJson(res, 200, { articles: cachedArticles });
  } catch (error) {
    return sendJson(res, error.name === 'AbortError' ? 504 : 502, {
      error: 'Railway news is temporarily unavailable. Please try again shortly.'
    });
  } finally {
    clearTimeout(timeout);
  }
};
