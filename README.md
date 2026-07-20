# GATE EC 2027 Prep Tracker

A comprehensive prep tracker for GATE EC 2027 exam preparation. This project consists of a Telegram bot for daily check-ins and a web frontend for visualization and replanning, all backed by a Google Sheet via Google Apps Script.

## Features

- **Telegram Bot:**
  - Daily check-ins (what was studied, hours spent, MCQs solved).
  - Reminders sent every day at 8 PM IST.
- **Frontend Dashboard:**
  - Visualize progress on a dashboard hosted on GitHub Pages.
  - Weekly replan functionality for planning the upcoming week.
- **Google Sheets Backend:**
  - Data storage for daily logs and weekly plans.
  - Apps Script handles API endpoints and bot webhooks.

## Architecture

- **Database:** Google Sheets
- **Backend:** Google Apps Script (REST API & Webhook handler)
- **Bot:** Telegram Bot API
- **Frontend:** HTML/JS/Tailwind CSS hosted on GitHub Pages

## Setup Instructions

For a step-by-step guide on how to set up the entire project from scratch, please refer to the [Setup Guide](setup-guide.md).
