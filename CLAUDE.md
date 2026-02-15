# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Telegram bot for Metro de Valencia train schedule queries, built with Node.js and the [grammy](https://grammy.dev/) framework. It scrapes the Metro Valencia website for real-time departure info and serves it to users via Telegram in Catalan.

## Commands

- **Run:** `npm start` (runs `node --no-deprecation src/bot.mjs`)
- **Docker build:** `docker build -t metrosequia .`
- **Docker run:** `docker run --env-file .env metrosequia`

No test or lint commands are configured.

## Environment

Requires a `.env` file with `TELEGRAM_BOT_TOKEN`. The app validates this token on startup and exits if missing.

## Architecture

Modular ESM structure under `src/`:

- **`src/config.mjs`** — Data-driven route definitions array. Each route has a `label`, `stationId`, `destination`, and `logTag`. Adding a new station = adding one object.
- **`src/api.mjs`** — `fetchStationHtml(stationId)` scrapes Metro Valencia's AJAX endpoint with spoofed browser headers, returning raw HTML.
- **`src/parser.mjs`** — Regex-based HTML parsers. Exports `findNextTrain(html, destination)` which tries the "próximos trenes" section first, then falls back to full timetable parsing.
- **`src/bot.mjs`** — Entry point. Loads env, creates the bot, builds the keyboard and registers handlers dynamically from the routes config. A single generic handler replaces all per-route duplicates.

## Deployment

Dockerized with `node:22-alpine`. TLS verification is disabled in the Dockerfile (`NODE_TLS_REJECT_UNAUTHORIZED=0`) as a workaround for EC2 environments. Dependencies are production-only (`npm ci --omit=dev`).
