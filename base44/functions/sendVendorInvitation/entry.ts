import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { invitation_id } = body;

    if (!invitation_id) {
      return Response.json({ error: "invitation_id is required" }, { status: 400 });
    }

    // Fetch the invitation record
    const invitations = await base44.asServiceRole.entities.VendorInvitation.filter({ id: invitation_id });
    const invitation = invitations[0];
    if (!invitation) return Response.json({ error: `VendorInvitation with ID ${invitation_id} not found` }, { status: 404 });

    const assocs = await base44.asServiceRole.entities.Association.filter({ id: invitation.association_id });
    const association = assocs[0];
    const assocName = association?.association_name || "Your Community Association";

    const link = invitation.registration_link || `${Deno.env.get("VITE_APP_URL") || "https://approvedin.com"}/portal/vendor/setup?association=${invitation.association_id}`;

    let emailOk = true;
    let errorMsg = "";

    // Send email if method is email or both
    if ((invitation.invitation_method === "email" || invitation.invitation_method === "both") && invitation.recipient_email) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ApprovedIn Invitations <onboarding@resend.dev>",
            to: [invitation.recipient_email],
            subject: `You've been invited to join ${assocName}'s approved vendor directory`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#0d1b2a;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                  <span style="color:#27c99a;font-size:24px;font-weight:900;">ApprovedIn</span>
                </div>
                <div style="padding:32px;background:#ffffff;border:1px solid #e8e1d6;border-top:none;">
                  <h2 style="color:#0d1b2a;margin-top:0;">You've Been Invited!</h2>
                  <p style="color:#7a6e62;"><strong>${assocName}</strong> has invited you to join their approved vendor directory on <strong>ApprovedIn</strong> — Florida's compliance-led vendor marketplace.</p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${link}" style="background:#27c99a;color:#0d1b2a;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">Create Your Vendor Profile →</a>
                  </div>
                  <p style="color:#7a6e62;font-size:14px;"><strong>Benefits of joining:</strong></p>
                  <ul style="color:#7a6e62;font-size:14px;">
                    <li>Free during our beta period (up to 6 months)</li>
                    <li>Get discovered by Florida associations actively seeking your trade</li>
                    <li>Build a compliance profile that travels with you to every association</li>
                    <li>Automated alerts keep you ahead of every expiration</li>
                  </ul>
                  <p style="color:#7a6e62;font-size:14px;">Questions? Email us at <a href="mailto:support@approvedin.com" style="color:#27c99a;">support@approvedin.com</a></p>
                </div>
                <div style="background:#f2ede4;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
                  <p style="font-size:11px;color:#7a6e62;margin:0;">© 2026 ApprovedIn, LLC. All Rights Reserved. ApprovedIn is a technology platform only and does not provide insurance or legal advice.</p>
                </div>
              </div>
            `,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          emailOk = false;
          errorMsg += `Email delivery failed: ${data?.message || "Unknown error"}. `;
          console.error("Resend email error:", JSON.stringify(data));
        }
      } catch (e) {
        emailOk = false;
        errorMsg += `Email delivery failed: ${e.message}. `;
        console.error("Email send exception:", e.message);
      }
    }

    // Update invitation status
    const updates = {
      sent_at: new Date().toISOString(),
      status: emailOk ? "delivered" : "failed",
    };
    if (!emailOk) {
      updates.delivery_error_message = errorMsg.trim();
    }

    await base44.asServiceRole.entities.VendorInvitation.update(invitation_id, updates);

    if (!emailOk) {
      return Response.json({ success: false, error: errorMsg.trim() });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("sendVendorInvitation error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});