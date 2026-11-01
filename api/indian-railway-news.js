'use strict';

const https = require('https');

let cachedArticles = null;
let cachedAt = 0;
const CACHE_MS = 10 * 60 * 1000;
const OXYLABS_SEARCH_URL = 'https://webapi.oxylabs.io/v1/search';
const OXYLABS_QUERY = '(Indian Railways OR IRCTC) latest news';
const NON_NEWS_HOSTS = new Set([
  'wikipedia.org',
  'irctc.co.in',
  'indianrail.gov.in',
  'indianrailways.gov.in'
]);
const RAILWAY_TERMS = /\b(?:indian railways?|ministry of railways?|railway board|irctc|indian railway traffic|railway station|railway train|railway track|railway zone|railway ministry|northern railway|eastern railway|western railway|central railway|southern railway|north eastern railway|north central railway|north western railway|south eastern railway|south central railway|east central railway|east coast railway|west central railway|vande bharat|memu|blw)\b/i;

function firstValue(...values) {
  return values.find(value => typeof value === 'string' && value.trim())?.trim() || '';
}

function parseOxylabsResults(payload) {
  const results = Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload?.data?.results)
      ? payload.data.results
      : [];

  return results
    .map(result => ({
      title: firstValue(result.title, result.name, result.heading),
      url: firstValue(result.url, result.link),
      source: firstValue(result.source, result.publisher, result.domain),
      publishedAt: firstValue(result.published_at, result.publishedAt, result.date),
      description: firstValue(result.description, result.snippet, result.content)
    }))
    .filter(article => {
      if (!article.title || !article.url || !isIndianRailwayArticle(article)) return false;
      try {
        const hostname = new URL(article.url).hostname.replace(/^www\./, '');
        return ![...NON_NEWS_HOSTS].some(host => hostname === host || hostname.endsWith(`.${host}`));
      } catch {
        return false;
      }
    });
}

function isIndianRailwayArticle(article) {
  const text = [
    article.title,
    article.description,
    article.content,
    article.source?.name,
    article.source_name,
    article.source
  ]
    .filter(Boolean)
    .join(' ');
  return RAILWAY_TERMS.test(text);
}

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

function requestJson(url, payload, token, timeoutMs) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = https.request(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'RailSaarthi/1.0 railway-news'
      }
    }, response => {
      const chunks = [];
      response.setEncoding('utf8');
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        statusCode: response.statusCode || 502,
        body: chunks.join('')
      }));
      response.on('error', reject);
    });
    request.write(body);
    request.setTimeout(timeoutMs, () => {
      request.destroy(Object.assign(new Error('Search request timed out'), { name: 'AbortError' }));
    });
    request.on('error', reject);
    request.end();
  });
}

module.exports = async function indianRailwayNews(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (cachedArticles && Date.now() - cachedAt < CACHE_MS) {
    return sendJson(res, 200, { articles: cachedArticles });
  }

  const token = String(process.env.OXYLABS_API_TOKEN || '').trim();
  if (!token) {
    return sendJson(res, 503, {
      error: 'Railway news is not configured on the server.'
    });
  }

  try {
    const response = await requestJson(OXYLABS_SEARCH_URL, {
      query: OXYLABS_QUERY,
      max_results: 10
    }, token, 12000);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return sendJson(res, response.statusCode === 429 ? 429 : 502, {
        error: 'The railway news service could not be reached.'
      });
    }

    let payload;
    try {
      payload = JSON.parse(response.body);
    } catch {
      return sendJson(res, 502, {
        error: 'The railway news service returned an invalid response.'
      });
    }

    cachedArticles = parseOxylabsResults(payload)
      .slice(0, 8)
      .map(article => ({
        title: String(article.title),
        url: String(article.url),
        source: String(article.source || 'News source'),
        publishedAt: String(article.publishedAt || '')
      }));
    cachedAt = Date.now();
    return sendJson(res, 200, { articles: cachedArticles });
  } catch (error) {
    return sendJson(res, error.name === 'AbortError' ? 504 : 502, {
      error: 'Railway news is temporarily unavailable. Please try again shortly.'
    });
  }
};
