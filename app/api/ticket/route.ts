import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, subject, description, toolName } = await request.json();

    if (!email || !description) {
      return NextResponse.json({ error: 'Email and description are required.' }, { status: 400 });
    }

    // Configure the Zoho SMTP transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.ZOHO_EMAIL, // e.g., admin@opsecforge.com
        pass: process.env.ZOHO_APP_PASSWORD, // The App Password we generated
      },
    });

    // Email content
    const mailOptions = {
      from: `"OpSecForge System" <${process.env.ZOHO_EMAIL}>`, // Must send FROM your Zoho email to avoid spam blocks
      to: process.env.ZOHO_EMAIL, // Send TO yourself (the admin inbox)
      replyTo: email, // 💡 MAGIC TRICK: When you click "Reply" in Zoho, it goes directly to the user!
      subject: `[New Ticket] ${subject || 'Bug Report'} - ${toolName || 'General'}`,
      text: `
New Support Ticket Submitted via OpSecForge:

From (User): ${email}
Tool Context: ${toolName || 'N/A'}

Description:
--------------------------------------------------
${description}
--------------------------------------------------

* Reply directly to this email to respond to the user.
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Ticket submitted successfully.' });
  } catch (error: any) {
    console.error('SMTP Error:', error);
    return NextResponse.json({ error: 'Failed to send ticket. Please try again later.' }, { status: 500 });
  }
}
