/**
 * Email Bots Configuration & Shared Helpers
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Load environment variables from .env.local if not already present
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

/**
 * Validates basic email format
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned);
}

/**
 * Creates Gmail SMTP Transporter using Nodemailer
 */
function getGmailTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass || user.includes('your-email') || pass.includes('your-16-digit')) {
    console.error('\n❌ ERROR: Missing Gmail SMTP Credentials in .env.local!');
    console.error('Please configure GMAIL_USER and GMAIL_APP_PASSWORD in your .env.local file.');
    console.error('Example:\n  GMAIL_USER="your.email@gmail.com"\n  GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"\n');
    process.exit(1);
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, ''), // remove spaces from Google App Password if any
    },
  });
}

/**
 * Retrieves the custom Sender Email & Name (allowing sender email to be different from GMAIL_USER)
 */
function getSenderDetails() {
  const gmailUser = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : '';
  const senderEmail = (process.env.SENDER_EMAIL || process.env.FROM_EMAIL || gmailUser).trim();
  const senderName = (process.env.SENDER_NAME || 'Pokémon GO Services').trim();

  return {
    senderEmail,
    senderName,
    formattedFrom: `"${senderName}" <${senderEmail}>`,
    replyTo: senderEmail,
    smtpAuthUser: gmailUser,
  };
}

/**
 * Helper to pause execution for rate limiting
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  loadEnv,
  isValidEmail,
  getGmailTransporter,
  getSenderDetails,
  sleep,
};
