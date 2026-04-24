import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ApprovedIn Contact Form <onboarding@resend.dev>",
        to: ["radamestorres75@gmail.com"],
        reply_to: email,
        subject: `[Contact Form] ${subject}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#0d1b2a;">New Contact Form Submission</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px;font-weight:bold;color:#7a6e62;">Name</td><td style="padding:8px;">${name}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#7a6e62;">Email</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#7a6e62;">Subject</td><td style="padding:8px;">${subject}</td></tr>
            </table>
            <div style="margin-top:16px;padding:16px;background:#faf8f4;border-radius:8px;">
              <strong style="color:#0d1b2a;">Message:</strong>
              <p style="margin-top:8px;color:#3a3530;white-space:pre-wrap;">${message}</p>
            </div>
            <hr style="margin-top:24px;border:none;border-top:1px solid #e8e1d6;">
            <p style="font-size:12px;color:#7a6e62;">Sent via ApprovedIn contact form from ${email}</p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", JSON.stringify(data));
      return Response.json({ error: data?.message || "Failed to send email" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("sendContactEmail error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});