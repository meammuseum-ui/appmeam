#!/usr/bin/env node
/**
 * MEAM Instagram Automation
 * ==========================
 *
 * Cron-friendly Node.js script that talks to the Instagram Graph API
 * (Meta) to produce periodic reports and alerts for the MEAM Instagram
 * Business account.
 *
 * Requires Node.js 18+ (uses the built-in global `fetch`).
 *
 * Usage:
 *   node meam-instagram-automation.js --weekly-report
 *   node meam-instagram-automation.js --check-alerts
 *   node meam-instagram-automation.js --monthly-analysis
 *   node meam-instagram-automation.js --all
 *
 * Required environment variables (see ../docs/instagram-automation-cron.md):
 *   INSTAGRAM_ACCESS_TOKEN         Long-lived Instagram Graph API token
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID  Instagram Business Account ID
 *
 * Optional environment variables:
 *   STATE_FILE                          Path to the JSON file used to remember
 *                                        state between runs (default:
 *                                        "<script dir>/.meam-instagram-state.json")
 *   LOG_FILE                            If set, every log line is also appended
 *                                        to this file (useful under cron, where
 *                                        stdout is easy to lose).
 *   FOLLOWER_DROP_ALERT_THRESHOLD       Absolute follower drop that triggers an
 *                                        alert in --check-alerts (default: 5)
 *   PUBLISHING_LIMIT_ALERT_THRESHOLD    Percentage (0-100) of the 24h publishing
 *                                        quota that triggers an alert (default: 80)
 *
 * Exit codes:
 *   0  Ran successfully (alerts, if any, are reported but do not fail the run)
 *   1  Configuration error (missing env vars) or an unrecoverable API error
 *
 * This script only *reads* data from the Graph API (profile, media, insights).
 * It never publishes content — publishing is handled interactively via the
 * `.claude/skills/instagram` skill, which always asks for confirmation first.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const GRAPH_API_VERSION = 'v25.0';
const GRAPH_API_BASE = `https://graph.instagram.com/${GRAPH_API_VERSION}`;

const STATE_FILE =
  process.env.STATE_FILE || path.join(__dirname, '.meam-instagram-state.json');
const LOG_FILE = process.env.LOG_FILE || null;

const FOLLOWER_DROP_ALERT_THRESHOLD = Number(
  process.env.FOLLOWER_DROP_ALERT_THRESHOLD || 5
);
const PUBLISHING_LIMIT_ALERT_THRESHOLD = Number(
  process.env.PUBLISHING_LIMIT_ALERT_THRESHOLD || 80
);

// ── Logging ─────────────────────────────────────────────────────────

function log(line = '') {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  console.log(line);
  if (LOG_FILE) {
    try {
      fs.appendFileSync(LOG_FILE, stamped + '\n');
    } catch (err) {
      console.error(`No se pudo escribir en LOG_FILE (${LOG_FILE}): ${err.message}`);
    }
  }
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}

// ── Env / config ────────────────────────────────────────────────────

function requireEnv(key) {
  const val = process.env[key];
  if (!val) {
    throw new ConfigError(`Falta la variable de entorno ${key}`);
  }
  return val;
}

class ConfigError extends Error {}

// ── State persistence (used to compare runs across cron invocations) ─

function readState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      log(`Aviso: no se pudo leer el estado previo (${err.message}), se empieza de cero.`);
    }
    return {};
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Graph API client ────────────────────────────────────────────────

async function apiRequest(url) {
  const token = requireEnv('INSTAGRAM_ACCESS_TOKEN');
  const separator = url.includes('?') ? '&' : '?';
  const fullUrl = `${url}${separator}access_token=${encodeURIComponent(token)}`;

  const res = await fetch(fullUrl);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (body && body.error && body.error.message) || `HTTP ${res.status}`;
    throw new Error(`Graph API error: ${message}`);
  }
  return body;
}

async function getProfile() {
  const aid = requireEnv('INSTAGRAM_BUSINESS_ACCOUNT_ID');
  const fields =
    'id,username,name,followers_count,follows_count,media_count';
  return apiRequest(`${GRAPH_API_BASE}/${aid}?fields=${fields}`);
}

async function getMedia(limit = 50) {
  const aid = requireEnv('INSTAGRAM_BUSINESS_ACCOUNT_ID');
  const fields =
    'id,caption,media_type,permalink,timestamp,like_count,comments_count';
  const result = await apiRequest(
    `${GRAPH_API_BASE}/${aid}/media?fields=${fields}&limit=${limit}`
  );
  return result.data || [];
}

async function getAccountInsights(period, metrics) {
  const aid = requireEnv('INSTAGRAM_BUSINESS_ACCOUNT_ID');
  const result = await apiRequest(
    `${GRAPH_API_BASE}/${aid}/insights?metric=${metrics}&period=${period}`
  );
  return result.data || [];
}

async function getPublishingLimit() {
  const aid = requireEnv('INSTAGRAM_BUSINESS_ACCOUNT_ID');
  const result = await apiRequest(
    `${GRAPH_API_BASE}/${aid}/content_publishing_limit`
  );
  return (result.data && result.data[0]) || null;
}

// ── Helpers ─────────────────────────────────────────────────────────

function engagement(post) {
  return (post.like_count || 0) + (post.comments_count || 0);
}

function postsWithinDays(posts, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return posts.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
}

function currentMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function insightValue(insights, metricName) {
  const metric = insights.find((m) => m.name === metricName);
  const values = metric && metric.values;
  if (!values || values.length === 0) return null;
  return values[values.length - 1].value;
}

// ── Modes ───────────────────────────────────────────────────────────

async function weeklyReport(state) {
  log('\n=== Informe semanal de Instagram ===');

  const profile = await getProfile();
  const posts = await getMedia(50);
  const recentPosts = postsWithinDays(posts, 7);
  const insights = await getAccountInsights('week', 'reach,profile_views');

  const totalEngagement = recentPosts.reduce((sum, p) => sum + engagement(p), 0);
  const topPost = recentPosts
    .slice()
    .sort((a, b) => engagement(b) - engagement(a))[0];

  const prevFollowers = state.weekly && state.weekly.followersCount;
  const followerDelta =
    typeof prevFollowers === 'number'
      ? profile.followers_count - prevFollowers
      : null;

  log(`Cuenta: @${profile.username}`);
  log(`Seguidores: ${profile.followers_count}` +
    (followerDelta !== null ? ` (${followerDelta >= 0 ? '+' : ''}${followerDelta} vs. semana pasada)` : ''));
  log(`Publicaciones en los últimos 7 días: ${recentPosts.length}`);
  log(`Interacciones totales (likes + comentarios): ${totalEngagement}`);
  log(`Alcance (reach) semanal: ${insightValue(insights, 'reach') ?? 'N/D'}`);
  log(`Visitas al perfil (profile_views) semanales: ${insightValue(insights, 'profile_views') ?? 'N/D'}`);

  if (topPost) {
    log(`Publicación destacada: ${topPost.permalink} (${engagement(topPost)} interacciones)`);
  } else {
    log('No se publicó contenido esta semana.');
  }

  log('=== Fin del informe semanal ===\n');

  state.weekly = {
    generatedAt: new Date().toISOString(),
    followersCount: profile.followers_count,
    postsCount: recentPosts.length,
    totalEngagement,
  };
}

async function checkAlerts(state) {
  log('\n=== Comprobación diaria de alertas ===');

  const alerts = [];
  const profile = await getProfile();

  const prevFollowers = state.daily && state.daily.followersCount;
  if (typeof prevFollowers === 'number') {
    const drop = prevFollowers - profile.followers_count;
    if (drop >= FOLLOWER_DROP_ALERT_THRESHOLD) {
      alerts.push(
        `Caída de seguidores: -${drop} desde el último chequeo (${prevFollowers} → ${profile.followers_count}).`
      );
    }
  }

  const limit = await getPublishingLimit();
  if (limit) {
    const quotaUsage = limit.quota_usage;
    const quotaTotal = limit.config && limit.config.quota_total;
    if (quotaTotal) {
      const pct = (quotaUsage / quotaTotal) * 100;
      if (pct >= PUBLISHING_LIMIT_ALERT_THRESHOLD) {
        alerts.push(
          `Límite de publicación cerca del máximo: ${quotaUsage}/${quotaTotal} publicaciones en 24h (${pct.toFixed(0)}%).`
        );
      }
    }
  }

  const posts = await getMedia(10);
  const recentPosts = postsWithinDays(posts, 30);
  if (recentPosts.length >= 3) {
    const avg =
      recentPosts.reduce((sum, p) => sum + engagement(p), 0) / recentPosts.length;
    const latest = posts[0];
    if (latest && avg > 0 && engagement(latest) < avg * 0.3) {
      alerts.push(
        `Interacción baja en la última publicación (${engagement(latest)}) frente al promedio de los últimos 30 días (${avg.toFixed(1)}).`
      );
    }
  }

  if (alerts.length === 0) {
    log('Sin alertas. Todo dentro de los rangos esperados.');
  } else {
    log(`Se detectaron ${alerts.length} alerta(s):`);
    for (const alert of alerts) log(` - ${alert}`);
  }

  log('=== Fin de la comprobación de alertas ===\n');

  state.daily = {
    checkedAt: new Date().toISOString(),
    followersCount: profile.followers_count,
    alertsFound: alerts.length,
  };
}

async function monthlyAnalysis(state) {
  const monthKey = currentMonthKey();
  if (state.monthly && state.monthly.monthKey === monthKey) {
    log(
      `\nAnálisis mensual: ya se ejecutó este mes (${monthKey}) el ${state.monthly.generatedAt}. Se omite.\n`
    );
    return;
  }

  log('\n=== Análisis mensual de Instagram ===');

  const profile = await getProfile();
  const posts = await getMedia(100);
  const monthPosts = postsWithinDays(posts, 30);
  const insights = await getAccountInsights('days_28', 'reach,profile_views');

  const totalEngagement = monthPosts.reduce((sum, p) => sum + engagement(p), 0);
  const avgEngagement = monthPosts.length ? totalEngagement / monthPosts.length : 0;
  const topPost = monthPosts.slice().sort((a, b) => engagement(b) - engagement(a))[0];

  const prevFollowers = state.monthly && state.monthly.followersCount;
  const followerGrowth =
    typeof prevFollowers === 'number' ? profile.followers_count - prevFollowers : null;

  log(`Cuenta: @${profile.username} — ${profile.followers_count} seguidores`);
  log(`Publicaciones en los últimos 30 días: ${monthPosts.length}`);
  log(`Interacción total: ${totalEngagement} — promedio por publicación: ${avgEngagement.toFixed(1)}`);
  log(`Alcance (reach, 28 días): ${insightValue(insights, 'reach') ?? 'N/D'}`);
  log(`Visitas al perfil (28 días): ${insightValue(insights, 'profile_views') ?? 'N/D'}`);
  if (followerGrowth !== null) {
    log(`Crecimiento de seguidores desde el mes pasado: ${followerGrowth >= 0 ? '+' : ''}${followerGrowth}`);
  }
  if (topPost) {
    log(`Publicación del mes: ${topPost.permalink} (${engagement(topPost)} interacciones)`);
  }

  log('=== Fin del análisis mensual ===\n');

  state.monthly = {
    monthKey,
    generatedAt: new Date().toISOString(),
    followersCount: profile.followers_count,
    postsCount: monthPosts.length,
    totalEngagement,
  };
}

// ── CLI ─────────────────────────────────────────────────────────────

function printUsage() {
  console.log(`Uso: node meam-instagram-automation.js [modo]

Modos:
  --weekly-report      Informe semanal (seguidores, alcance, top post)
  --check-alerts        Alertas diarias (caída de seguidores, cuota de publicación, engagement bajo)
  --monthly-analysis     Análisis mensual (se ejecuta una sola vez por mes, aunque el cron lo llame varios días)
  --all                Ejecuta los tres anteriores en orden
  --help               Muestra esta ayuda
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exitCode = args.length === 0 ? 1 : 0;
    return;
  }

  const state = readState();

  try {
    if (args.includes('--all')) {
      await weeklyReport(state);
      await checkAlerts(state);
      await monthlyAnalysis(state);
    } else {
      let ranSomething = false;
      if (args.includes('--weekly-report')) {
        await weeklyReport(state);
        ranSomething = true;
      }
      if (args.includes('--check-alerts')) {
        await checkAlerts(state);
        ranSomething = true;
      }
      if (args.includes('--monthly-analysis')) {
        await monthlyAnalysis(state);
        ranSomething = true;
      }
      if (!ranSomething) {
        printUsage();
        process.exitCode = 1;
        return;
      }
    }
    writeState(state);
  } catch (err) {
    if (err instanceof ConfigError) {
      fail(err.message);
    } else {
      fail(err.message || String(err));
    }
  }
}

main();
