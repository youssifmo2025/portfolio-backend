import nodemailer from 'nodemailer';

/* ------------------------------------------------------------------ */
/*  Transporter — configured entirely from environment variables       */
/* ------------------------------------------------------------------ */
function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  HTML email template — inputs are already sanitized before here    */
/* ------------------------------------------------------------------ */
function ownerEmailHtml({ name, email, message }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
        .card { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; }
        .body { padding: 32px; }
        .field { margin-bottom: 20px; }
        .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 6px; }
        .value { background: #0f172a; border-radius: 8px; padding: 12px 16px; font-size: 15px; color: #f1f5f9; word-break: break-word; }
        .footer { padding: 16px 32px; border-top: 1px solid #334155; font-size: 12px; color: #475569; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header"><h1>📬 New Portfolio Message</h1></div>
        <div class="body">
          <div class="field">
            <div class="label">From</div>
            <div class="value">${name}</div>
          </div>
          <div class="field">
            <div class="label">Email</div>
            <div class="value">${email}</div>
          </div>
          <div class="field">
            <div class="label">Message</div>
            <div class="value">${message.replace(/\n/g, '<br/>')}</div>
          </div>
        </div>
        <div class="footer">Sent via your Portfolio Contact Form</div>
      </div>
    </body>
    </html>
  `;
}

function autoReplyHtml({ name }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
        .card { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 22px; }
        .body { padding: 32px; line-height: 1.7; font-size: 15px; }
        .footer { padding: 16px 32px; border-top: 1px solid #334155; font-size: 12px; color: #475569; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header"><h1>Thanks, ${name}! 🙌</h1></div>
        <div class="body">
          <p>I've received your message and will get back to you as soon as possible — usually within 24–48 hours.</p>
          <p>In the meantime, feel free to connect with me on <a href="https://www.linkedin.com/in/youssef-mohammed-92828934a" style="color:#818cf8">LinkedIn</a>.</p>
          <p>Best,<br/><strong>Youssef EL-Sayed</strong></p>
        </div>
        <div class="footer">This is an automated reply. Please do not respond to this email.</div>
      </div>
    </body>
    </html>
  `;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */
export async function sendContactEmail({ name, email, message }) {
  const transporter = createTransporter();

  // Verify SMTP connection before sending
  try {
    await transporter.verify();
    console.log('[Mailer] SMTP connection verified successfully.');
  } catch (verifyErr) {
    console.error('[Mailer] SMTP verify FAILED:');
    console.error('  Code    :', verifyErr.code);     // ECONNREFUSED, EAUTH, etc.
    console.error('  Message :', verifyErr.message);
    throw verifyErr; // bubble up so the route catches and logs it
  }

  // Notification to owner
  await transporter.sendMail({
    from:    `"Portfolio Contact" <${process.env.SMTP_USER}>`,
    to:      process.env.RECEIVER_EMAIL,
    replyTo: email,
    subject: `📬 New Message from ${name}`,
    html:    ownerEmailHtml({ name, email, message }),
  });

  // Auto-reply to sender
  await transporter.sendMail({
    from:    `"Youssef EL-Sayed" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: 'Thanks for reaching out!',
    html:    autoReplyHtml({ name }),
  });
}
