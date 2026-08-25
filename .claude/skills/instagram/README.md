<div align="center">

# 📸 Instagram Claude Code Skill

**Manage Instagram Business accounts directly from Claude Code**

[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blueviolet?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggNHoiLz48L3N2Zz4=)](https://claude.ai)
[![Meta Graph API](https://img.shields.io/badge/Meta_Graph_API-v25.0-blue?style=for-the-badge&logo=meta)](https://developers.facebook.com/docs/instagram-platform)
[![Python](https://img.shields.io/badge/Python-3.x-green?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen?style=for-the-badge)](#)

<br/>

Publish posts, reels, stories, and carousels. View analytics. Manage DMs.
All from your terminal — powered by the official Meta Graph API v25.0.

<br/>

[Installation](#-installation) · [Quick Start](#-quick-start) · [Commands](#-commands) · [Authentication](#-authentication)

</div>

---

## ✨ Features

| Feature | Command | Description |
|---------|---------|-------------|
| 📷 **Publish Image** | `create_container` + `publish_media` | Post JPEG images with captions & alt text |
| 🎬 **Publish Video** | `create_container` + `publish_media` | Post videos to feed |
| 🎞️ **Publish Reel** | `publish_reel` | One-command reel publishing with trial reel support |
| 📖 **Publish Story** | `publish_story` | One-command story publishing |
| 🎠 **Publish Carousel** | `publish_carousel` | Multi-image/video posts (2-10 items) |
| 📊 **Analytics** | `get_media_insights` / `get_account_insights` | Engagement, impressions, reach |
| 💬 **Direct Messages** | `get_conversations` / `send_dm` | Read and reply to DMs |
| 👤 **Profile Info** | `get_profile` | Followers, bio, media count |
| 🔑 **Token Management** | `validate_token` / `publishing_limit` | Validate tokens & check rate limits |

---

## 📦 Installation

### As a Claude Code Skill (Recommended)

Download `instagram.skill` from the [latest release](https://github.com/moboutrig/instagram-claude-skill/releases) or clone:

```bash
git clone https://github.com/moboutrig/instagram-claude-skill.git
```

Copy the skill into your project's Claude skills directory:

```bash
cp -r instagram-claude-skill/ your-project/.claude/skills/instagram/
```

### Standalone Script

Just grab the script — zero dependencies, pure Python stdlib:

```bash
curl -O https://raw.githubusercontent.com/moboutrig/instagram-claude-skill/main/scripts/ig_api.py
chmod +x ig_api.py
```

---

## 🔐 Authentication

### 1. Create a Meta Developer App

Go to [developers.facebook.com](https://developers.facebook.com) → My Apps → Create App → Add **Instagram Graph API**

### 2. Get Your Credentials

```bash
# Generate token via Graph API Explorer:
# https://developers.facebook.com/tools/explorer

# Get your Instagram Business Account ID:
curl "https://graph.instagram.com/v25.0/me/accounts?fields=id,name,instagram_business_account&access_token=YOUR_TOKEN"
```

### 3. Set Environment Variables

Create a `.env` file:

```env
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_ig_account_id_here
```

> **Two auth paths supported:** Instagram Login (`instagram_business_basic`) and Facebook Login (`instagram_basic`). See [references/authentication.md](references/authentication.md) for full details.

---

## 🚀 Quick Start

```bash
# Load credentials
set -a && source .env && set +a

# Validate your token
python3 scripts/ig_api.py validate_token

# View your profile
python3 scripts/ig_api.py get_profile

# Publish an image
python3 scripts/ig_api.py create_container --image-url "https://example.com/photo.jpg" --caption "Hello Instagram!"
python3 scripts/ig_api.py check_status --container-id <CONTAINER_ID>
python3 scripts/ig_api.py publish_media --container-id <CONTAINER_ID>
```

---

## 📋 Commands

### Profile & Account

```bash
python3 scripts/ig_api.py get_profile              # Profile info
python3 scripts/ig_api.py get_pages                 # Connected Facebook pages
python3 scripts/ig_api.py validate_token            # Check token validity
python3 scripts/ig_api.py publishing_limit          # Rate limit status (100 posts/24hr)
```

### Publishing

```bash
# Image (JPEG only)
python3 scripts/ig_api.py create_container \
  --image-url "https://example.com/photo.jpg" \
  --caption "My post" \
  --alt-text "A beautiful sunset"

# Video
python3 scripts/ig_api.py create_container \
  --video-url "https://example.com/video.mp4" \
  --caption "Check this out"

# Check & Publish
python3 scripts/ig_api.py check_status --container-id <ID>
python3 scripts/ig_api.py publish_media --container-id <ID>
```

### Reels

```bash
# Standard reel
python3 scripts/ig_api.py publish_reel \
  --video-url "https://example.com/reel.mp4" \
  --caption "My Reel 🎬"

# Trial reel (non-followers only)
python3 scripts/ig_api.py publish_reel \
  --video-url "https://example.com/reel.mp4" \
  --trial MANUAL

# Custom thumbnail + don't share to feed
python3 scripts/ig_api.py publish_reel \
  --video-url "https://example.com/reel.mp4" \
  --thumb-offset 2000 \
  --no-feed
```

### Stories

```bash
python3 scripts/ig_api.py publish_story --image-url "https://example.com/story.jpg"
python3 scripts/ig_api.py publish_story --video-url "https://example.com/story.mp4"
```

### Carousels

```bash
# Images only
python3 scripts/ig_api.py publish_carousel \
  --media-urls "https://example.com/1.jpg,https://example.com/2.jpg,https://example.com/3.jpg" \
  --caption "Swipe through! ➡️"

# Mixed (prefix videos with video:)
python3 scripts/ig_api.py publish_carousel \
  --media-urls "https://example.com/1.jpg,video:https://example.com/clip.mp4" \
  --caption "Photos + video carousel"
```

### Analytics

```bash
# Post insights
python3 scripts/ig_api.py get_media_insights --media-id <ID>

# Account insights
python3 scripts/ig_api.py get_account_insights --period day
python3 scripts/ig_api.py get_account_insights --period days_28 --metrics impressions,reach

# Browse recent posts
python3 scripts/ig_api.py get_media --limit 10
```

### Direct Messages

> Requires **Advanced Access** approval from Meta

```bash
python3 scripts/ig_api.py get_conversations --limit 10
python3 scripts/ig_api.py get_messages --conversation-id <ID>
python3 scripts/ig_api.py send_dm --recipient-id <ID> --message "Thanks for reaching out!"
```

---

## 📁 Project Structure

```
instagram-claude-skill/
├── SKILL.md                         # Skill instructions (loaded by Claude)
├── instagram.skill                  # Packaged distributable
├── scripts/
│   └── ig_api.py                    # CLI tool — 17 commands, zero dependencies
└── references/
    ├── api_reference.md             # Full API endpoint documentation
    └── authentication.md            # Auth setup guide (both login paths)
```

---

## ⚠️ Limitations

Per the official Meta Graph API docs:

| Limitation | Detail |
|-----------|--------|
| Image format | **JPEG only** (no PNG, MPO, JPS) |
| Rate limit | 100 API-published posts per 24hr |
| Carousel | 2–10 items, cropped to first image aspect ratio |
| DMs | 24-hour reply window, 1000 char max, Advanced Access required |
| Container expiry | Must publish within 24 hours |
| Insights | Requires 100+ followers, data stored up to 90 days |
| Deprecated metrics | `video_views`, `email_contacts`, `website_clicks` (Jan 2025) |

---

## 🔗 Resources

- [Official Meta Instagram Platform Docs](https://developers.facebook.com/docs/instagram-platform)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer)
- [Claude Code](https://claude.ai)

---

<div align="center">

Built with [Claude Code](https://claude.ai) · Powered by [Meta Graph API v25.0](https://developers.facebook.com/docs/instagram-platform)

</div>
