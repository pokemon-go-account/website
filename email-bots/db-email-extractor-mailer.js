/**
 * Bot 1: Database Email Extractor & Bulk Gmail SMTP Mailer
 * 
 * Usage:
 *   node email-bots/db-email-extractor-mailer.js
 */

const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const { loadEnv, isValidEmail, getGmailTransporter, getSenderDetails, sleep } = require('./config');

// Default Email Campaign Content (Customize as needed)
const EMAIL_CAMPAIGN = {
  subject: "Exclusive Update from Pokémon GO Services Marketplace! 🚀",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded-radius: 10px;">
      <h2 style="color: #6133e1; text-align: center;">Pokémon GO Services & Marketplace</h2>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">Hello Trainer,</p>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        We have launched new live auction rooms, verified account offerings, and special seller programs!
      </p>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        Visit our platform today to explore top-tier Level 40/50 accounts, rare shinies, and instant delivery packages.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://pokemongoservices.com" style="background-color: #6133e1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Browse Live Auctions</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        © Pokémon GO Services & Marketplace. All rights reserved.
      </p>
    </div>
  `,
  text: `Hello Trainer,\n\nWe have launched new live auction rooms, verified account offerings, and special seller programs!\n\nVisit https://pokemongoservices.com to explore live auctions today.\n\n© Pokémon GO Services & Marketplace`
};

// Delay between bulk emails (in milliseconds) to stay within Gmail SMTP limits
const SEND_DELAY_MS = 1000;

/**
 * Recursively extracts all valid email strings from any JavaScript object/document
 */
function extractEmailsFromObject(obj, emailsSet = new Set()) {
  if (!obj) return emailsSet;

  if (typeof obj === 'string') {
    const cleaned = obj.trim().toLowerCase();
    if (isValidEmail(cleaned)) {
      emailsSet.add(cleaned);
    } else {
      // Check if string contains emails inside text using regex
      const emailMatches = obj.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatches) {
        emailMatches.forEach((em) => {
          const cleanEm = em.toLowerCase().trim();
          if (isValidEmail(cleanEm)) emailsSet.add(cleanEm);
        });
      }
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item) => extractEmailsFromObject(item, emailsSet));
  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      extractEmailsFromObject(obj[key], emailsSet);
    }
  }

  return emailsSet;
}

/**
 * Connects to database and extracts emails from ALL collections
 */
async function extractAllEmailsFromDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is missing in .env.local!');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  const client = new MongoClient(uri);
  await client.connect();
  console.log('✅ Connected to MongoDB.');

  const db = client.db();
  const collections = await db.collections();

  console.log(`\n🔍 Found ${collections.length} collection(s). Scanning for user and seller emails...\n`);

  const uniqueEmails = new Set();
  const collectionStats = {};

  for (const col of collections) {
    const colName = col.collectionName;
    const docs = await col.find({}).toArray();

    const collectionEmails = new Set();
    docs.forEach((doc) => extractEmailsFromObject(doc, collectionEmails));

    collectionEmails.forEach((email) => uniqueEmails.add(email));
    collectionStats[colName] = {
      totalDocs: docs.length,
      emailsFound: collectionEmails.size,
    };

    console.log(`  📦 Collection [${colName}]: ${docs.length} docs, ${collectionEmails.size} unique emails found`);
  }

  await client.close();

  const extractedList = Array.from(uniqueEmails);
  console.log(`\n🎉 Total unique emails extracted across all documents: ${extractedList.length}\n`);

  // Save extracted emails to JSON & TXT for record keeping
  const jsonPath = path.join(__dirname, 'extracted_emails.json');
  const txtPath = path.join(__dirname, 'extracted_emails.txt');

  fs.writeFileSync(jsonPath, JSON.stringify(extractedList, null, 2));
  fs.writeFileSync(txtPath, extractedList.join('\n'));

  console.log(`💾 Saved extracted emails to:\n  - ${jsonPath}\n  - ${txtPath}\n`);

  return extractedList;
}

/**
 * Main Execution Workflow
 */
async function run() {
  console.log('====================================================');
  console.log(' 🤖 BOT 1: DATABASE EMAIL EXTRACTOR & BULK MAILER   ');
  console.log('====================================================\n');

  // Step 1: Extract all emails from DB
  const recipientEmails = await extractAllEmailsFromDatabase();

  if (recipientEmails.length === 0) {
    console.log('⚠️ No emails found in the database. Exiting.');
    return;
  }

  // Step 2: Initialize Gmail Transporter & Sender Details
  const transporter = getGmailTransporter();
  const sender = getSenderDetails();

  console.log(`📧 SMTP Auth User: ${sender.smtpAuthUser}`);
  console.log(`✉️ Display Sender Address: ${sender.formattedFrom}`);
  console.log(`📌 Subject: "${EMAIL_CAMPAIGN.subject}"`);
  console.log(`👥 Total Recipients: ${recipientEmails.length}\n`);

  let successCount = 0;
  let failCount = 0;

  // Step 3: Send bulk emails sequentially with delay
  for (let i = 0; i < recipientEmails.length; i++) {
    const recipient = recipientEmails[i];
    const indexStr = `[${i + 1}/${recipientEmails.length}]`;

    try {
      await transporter.sendMail({
        from: sender.formattedFrom,
        replyTo: sender.replyTo,
        to: recipient,
        subject: EMAIL_CAMPAIGN.subject,
        html: EMAIL_CAMPAIGN.html,
        text: EMAIL_CAMPAIGN.text,
      });

      console.log(`  ✅ ${indexStr} Sent email to: ${recipient}`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ ${indexStr} Failed to send email to ${recipient}:`, err.message);
      failCount++;
    }

    // Delay to prevent Gmail SMTP rate limiting
    if (i < recipientEmails.length - 1) {
      await sleep(SEND_DELAY_MS);
    }
  }

  console.log('\n====================================================');
  console.log(' 📊 BULK MAILING SUMMARY REPORT                      ');
  console.log('====================================================');
  console.log(`  Total Processed : ${recipientEmails.length}`);
  console.log(`  Successfully Sent: ${successCount} ✅`);
  console.log(`  Failed Deliveries: ${failCount} ❌`);
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('❌ Bot 1 Execution Failed:', err);
  process.exit(1);
});
