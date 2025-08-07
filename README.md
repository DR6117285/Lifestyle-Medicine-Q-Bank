# LMQB - Lifestyle Medicine Question Bank

A lightweight web-based question bank for lifestyle medicine practitioners to practice curated questions with instant feedback and progress tracking.

## Features

- 🔐 User authentication (email/password + OAuth)
- 📚 Practice modes (random, section-specific, timed quiz)
- 💡 Instant feedback with detailed rationales
- 📊 Personal statistics and progress tracking
- 👨‍💼 Admin tools for question management and user metrics
- 🏠 Self-hosted solution for small teams (5-10 users)

## Tech Stack

- **Frontend**: React
- **Backend**: Self-hosted Supabase (Docker)
- **Database**: PostgreSQL
- **Auth**: Supabase Auth with OAuth support
- **Deployment**: Docker containers (Proxmox compatible)

## Project Structure

```
lmqb/
├── frontend/          # React application
├── backend/           # Supabase configuration
├── data/             # Question bank JSON files
├── docker/           # Docker compose files
└── docs/             # Documentation
```

## Getting Started

[Setup instructions will be added here]

## Deployment

Designed to run on home servers with Proxmox virtualization, alongside other services like Vaultwarden and Home Assistant.