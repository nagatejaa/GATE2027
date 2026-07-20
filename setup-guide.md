# Setup Guide: GATE EC 2027 Prep Tracker

This guide walks you through the step-by-step process of setting up the complete GATE EC 2027 prep tracker, including the Telegram Bot, Google Sheets backend, and GitHub Pages frontend.

## 1. Create a Telegram Bot
1. Open Telegram and search for `@BotFather`.
2. Start a chat and send the command `/newbot`.
3. Follow the prompts to set a name and a unique username for your bot.
4. Once created, `@BotFather` will provide you with an **HTTP API Token**. Save this token securely (referred to as `BOT_TOKEN` later).

## 2. Setup the Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet. Name it something like "GATE EC 2027 Tracker".
2. You will need the **Sheet ID**, which can be found in the URL:
   `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`
3. Copy this `<SHEET_ID>` and keep it handy.
4. Ensure the spreadsheet has the appropriate sheets as required by your Apps Script code (e.g., "Daily Logs", "Weekly Plans", etc.).

## 3. Create the Apps Script Project
1. From your newly created Google Sheet, click on **Extensions > Apps Script**.
2. Clear any existing code in `Code.gs` and paste the backend code provided in the `apps-script/` directory of this repository.
3. Save the project.
4. Click on **Deploy > New deployment**.
5. Select **Web app** as the deployment type.
6. Under "Execute as", choose **Me**.
7. Under "Who has access", choose **Anyone**.
8. Click **Deploy** and authorize the necessary permissions.
9. Copy the **Web App URL**. You will need this for setting up the webhook and connecting the frontend.

## 4. Set Script Properties
To keep your sensitive information secure, we use Apps Script Properties.
1. In the Apps Script editor, go to **Project Settings** (the gear icon on the left).
2. Scroll down to **Script Properties** and click **Edit script properties**.
3. Add the following properties:
   - `BOT_TOKEN`: Your Telegram Bot API token from Step 1.
   - `SHEET_ID`: Your Google Sheet ID from Step 2.
   - `SHARED_SECRET`: `GATE2027-xK9mP2qR-NAGA`
4. Click **Save script properties**.

## 5. Set the Telegram Webhook
To receive messages from Telegram to your Apps Script Web App, you must set up the webhook.
Run the following `curl` command in your terminal, replacing the placeholders with your actual Bot Token and Web App URL:

```bash
curl -F "url=<YOUR_WEB_APP_URL>?action=telegram-webhook" https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
```
*Note: Make sure to include the `bot` prefix before the token in the URL. Ensure your WEB_APP_URL doesn't already have query parameters, otherwise use `&action=telegram-webhook`.*

## 6. Set up Time-Driven Triggers
We need triggers to send daily check-ins and run weekly replans.
1. In the Apps Script editor, click on the **Triggers** icon (the alarm clock on the left).
2. Click **Add Trigger** (bottom right).
3. **Daily Check-in Trigger:**
   - Choose which function to run: `dailyCheckin`
   - Choose which deployment should run: `Head`
   - Select event source: `Time-driven`
   - Select type of time based trigger: `Day timer`
   - Select time of day: `8 PM to 9 PM` (IST timezone)
   - Click **Save**.
4. **Weekly Replan Trigger:**
   - Choose which function to run: `runWeeklyReplan`
   - Choose which deployment should run: `Head`
   - Select event source: `Time-driven`
   - Select type of time based trigger: `Week timer`
   - Select day of week: `Sunday`
   - Select time of day: Choose your preferred time.
   - Click **Save**.

## 7. Host the Frontend on GitHub Pages
1. Push this repository (containing the frontend HTML, JS, CSS) to GitHub.
2. In the `index.html` or main configuration file of your frontend, update any placeholder URLs with your **Apps Script Web App URL**.
3. Go to your GitHub repository's **Settings**.
4. Navigate to **Pages** on the left sidebar.
5. Under "Build and deployment", select **Deploy from a branch**.
6. Select the `main` branch and `/root` folder, then click **Save**.
7. In a few minutes, your site will be live at `https://<your-username>.github.io/gate-ec-2027-tracker/`.
