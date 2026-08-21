🤖 Dil-Izhorim Bot
Dil-Izhorim Bot is an automated Telegram bot designed to deliver heartfelt messages, personal wishes, and birthday notifications to users.

🌟 Key Features
💬 Wish & Message Delivery: Automatically generates and sends personalized greetings, heartfelt messages, and well wishes.

📅 Birthday Tracker & Reminders: Stores birthday dates in a dedicated database and sends timely automated reminders.

⚡️ High Performance: Optimized to handle concurrent user interactions smoothly without latency.

🗄 Secure Data Management: Efficiently manages user preferences and event records using an isolated database structure.

🛠 Tech Stack
  The project is built on a modern, high-performance Node.js backend:

Node.js — Asynchronous JavaScript runtime powering the core bot logic.

MongoDB — NoSQL database used for persistent storage of user data and birthday schedules.

Mongoose — Object Data Modeling (ODM) library for reliable MongoDB schema validation and database queries.

Dotenvx (.env) — Encrypted environment variable management for securing API keys and secrets.

PM2 — Production process manager keeping the application active 24/7 with continuous monitoring.

📐 How It Works
The architecture follows a modular, server-side structure:

1.  Core Handler (bot.js): Interacts directly with the Telegram Bot API to parse incoming commands and     trigger event handlers.

2.  Dual Database Connections: Operates separate connections for general bot data and specific             birthday    record collections to ensure data isolation.

3.  Process Execution: Runs continuously on a Linux environment via PM2 in fork mode, optimizing           memory usage and ensuring instant auto-restarts upon server reboots.

