# 🤖 Node Email Bots (Gmail SMTP)

This folder contains two automated Node.js email bots designed for bulk mailing via **Gmail SMTP**.

---

## 📁 Files Included

1. **`config.js`**: Shared configuration helper that automatically loads `.env.local`, configures Nodemailer with Gmail SMTP, validates email formatting, and manages rate-limiting delays.
2. **`db-email-extractor-mailer.js`** *(Bot 1)*: 
   - Scans **all collections** in your MongoDB database (Users, Sellers, Waitlists, Contact Messages, Recovery Requests, Registrations, Orders, etc.).
   - Recursively extracts and deduplicates every email address across every document field.
   - Saves extracted emails to `extracted_emails.json` & `extracted_emails.txt`.
   - Sends bulk emails to all extracted addresses using Gmail SMTP.
3. **`array-email-mailer.js`** *(Bot 2)*:
   - Accepts a custom JavaScript array of recipient emails.
   - Validates and sanitizes email addresses.
   - Sends bulk emails via Gmail SMTP with configurable subjects, HTML content, and rate limiting.

---

## ⚙️ Setup Instructions

### Step 1: Generate a Google App Password
Gmail requires an **App Password** for SMTP authentication:
1. Go to your Google Account Settings: [myaccount.google.com](https://myaccount.google.com/)
2. Ensure **2-Step Verification** is turned ON under Security.
3. Search for **App Passwords** or visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Create an App Password (Name it `Node Email Bot`).
5. Copy the 16-character generated password (e.g. `abcd efgh ijkl mnop`).

### Step 2: Configure `.env.local`
Add your Gmail address (used for SMTP authentication) and custom display Sender Email to your `.env.local` file at the root of the project:

```env
# Gmail SMTP Authentication Credentials
GMAIL_USER="your.gmail.auth@gmail.com"
GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"

# Display Sender Information (Can be different from GMAIL_USER)
SENDER_EMAIL="support@pokemongoservices.com"
SENDER_NAME="Pokémon GO Services"
```

---

## 🚀 Running the Bots

### Run Bot 1: Database Extractor & Bulk Mailer
Extracts all user/seller emails from MongoDB and emails them in bulk:

```bash
node email-bots/db-email-extractor-mailer.js
```

### Run Bot 2: Provided Array Bulk Mailer
Sends bulk emails to a provided list of email addresses:

```bash
node email-bots/array-email-mailer.js
```

---

## ✏️ Customizing Email Content & Delays

### Customizing Email Body & Subject
Edit `EMAIL_CAMPAIGN` in `db-email-extractor-mailer.js` or `EMAIL_CONTENT` in `array-email-mailer.js`:

```js
const EMAIL_CONTENT = {
  subject: "Your Custom Email Subject Here",
  html: `<h1>Hello Trainer!</h1><p>Your custom HTML email body here.</p>`,
  text: "Hello Trainer! Your custom plain text body here.",
};
```

### Gmail Rate Limit Safeguards
Gmail limits standard accounts to **500 emails/day** (or 2,000/day for Workspace accounts). Both bots include a configurable delay between sends:

```js
const SEND_DELAY_MS = 1000; // Delay in milliseconds between each email sent
```
