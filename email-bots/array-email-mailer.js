/**
 * Bot 2: Provided Array Email Bulk Gmail SMTP Mailer
 * 
 * Usage:
 *   node email-bots/array-email-mailer.js
 */

const { loadEnv, isValidEmail, getGmailTransporter, getSenderDetails, sleep } = require('./config');

// 📋 PROVIDED ARRAY OF RECIPIENT EMAILS (Add / Modify your email array here)
const RECIPIENT_EMAILS = [
  "souravjhahind@gmail.com",
  "souravjhahind69@gmail.com",
  "bhaibhavkumarjha@gmail.com",
  "hindiinsaan@gmail.com",  // Add more emails to this array...
];

// ✉️ EMAIL CONTENT (Customize subject and body as needed)
const EMAIL_CONTENT = {
  subject: "Important Notification from Pokémon GO Services Marketplace",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 10px;">
      <h2 style="color: #6133e1; text-align: center;">Pokémon GO Services</h2>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">Hello,</p>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        This is an official message regarding your Pokémon GO account services and active trades.
      </p>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        Please check your dashboard or contact our 24/7 support channel if you require assistance.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://pokemongoservices.com" style="background-color: #6133e1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Visit Storefront</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        © Pokémon GO Services & Marketplace. All rights reserved.
      </p>
    </div>
  `,
  text: `Hello,\n\nThis is an official message regarding your Pokémon GO account services and active trades.\n\nVisit https://pokemongoservices.com for more details.\n\n© Pokémon GO Services`
};

// Delay between emails (in milliseconds)
const SEND_DELAY_MS = 1000;

async function run() {
  console.log('====================================================');
  console.log(' 🤖 BOT 2: ARRAY EMAIL BULK GMAIL SMTP MAILER      ');
  console.log('====================================================\n');

  // Filter and sanitize provided emails
  const validRecipients = Array.from(
    new Set(
      RECIPIENT_EMAILS
        .filter((em) => typeof em === 'string')
        .map((em) => em.trim().toLowerCase())
        .filter((em) => isValidEmail(em))
    )
  );

  if (validRecipients.length === 0) {
    console.error('❌ ERROR: No valid email addresses found in the provided RECIPIENT_EMAILS array.');
    console.error('Please edit email-bots/array-email-mailer.js and add valid recipient emails to RECIPIENT_EMAILS array.\n');
    return;
  }

  // Initialize Gmail Transporter & Sender Details
  const transporter = getGmailTransporter();
  const sender = getSenderDetails();

  console.log(`📧 SMTP Auth User: ${sender.smtpAuthUser}`);
  console.log(`✉️ Display Sender Address: ${sender.formattedFrom}`);
  console.log(`📌 Subject: "${EMAIL_CONTENT.subject}"`);
  console.log(`👥 Target Recipients: ${validRecipients.length} valid email(s)\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < validRecipients.length; i++) {
    const recipient = validRecipients[i];
    const indexStr = `[${i + 1}/${validRecipients.length}]`;

    try {
      await transporter.sendMail({
        from: sender.formattedFrom,
        replyTo: sender.replyTo,
        to: recipient,
        subject: EMAIL_CONTENT.subject,
        html: EMAIL_CONTENT.html,
        text: EMAIL_CONTENT.text,
      });

      console.log(`  ✅ ${indexStr} Sent email to: ${recipient}`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ ${indexStr} Failed to send email to ${recipient}:`, err.message);
      failCount++;
    }

    if (i < validRecipients.length - 1) {
      await sleep(SEND_DELAY_MS);
    }
  }

  console.log('\n====================================================');
  console.log(' 📊 MAILING SUMMARY REPORT                          ');
  console.log('====================================================');
  console.log(`  Total Recipients : ${validRecipients.length}`);
  console.log(`  Successfully Sent: ${successCount} ✅`);
  console.log(`  Failed Deliveries: ${failCount} ❌`);
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('❌ Bot 2 Execution Failed:', err);
  process.exit(1);
});
