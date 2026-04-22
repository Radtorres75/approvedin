import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { invitation_id } = body;

    const invitations = await base44.asServiceRole.entities.VendorInvitation.filter({ id: invitation_id });
    const invitation = invitations[0];
    if (!invitation) return Response.json({ error: "Invitation not found" }, { status: 404 });

    const assocs = await base44.asServiceRole.entities.Association.filter({ id: invitation.association_id });
    const association = assocs[0];
    const assocName = association?.association_name || "Your Community Association";

    const link = invitation.registration_link || `${Deno.env.get("VITE_APP_URL") || "https://approvedin.com"}/portal/vendor/setup?association=${invitation.association_id}`;
    let emailOk = true;
    let smsOk = true;
    let errorMsg = "";

    if (invitation.invitation_method === "email" || invitation.invitation_method === "both") {
      if (invitation.recipient_email) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: invitation.recipient_email,
            subject: `You've been invited to join ${assocName}'s approved vendor directory on ApprovedIn`,
            body: `
<p>Hello,</p>
<p><strong>${assocName}</strong> has invited you to join their approved vendor directory on <strong>ApprovedIn</strong> — Florida's compliance-led vendor marketplace.</p>
<p>Click the link below to create your vendor profile and apply to join the directory:</p>
<p><a href="${link}" style="background:#27c99a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Create Your Vendor Profile →</a></p>
<p>Benefits of joining:</p>
<ul>
<li>Free during our beta period (up to 6 months)</li>
<li>Get discovered by Florida associations actively looking for your trade</li>
<li>Build your compliance profile that travels with you to every association</li>
<li>Automated alerts keep you ahead of every expiration</li>
</ul>
<p>Have questions? Reply to this email or visit <a href="https://approvedin.com">approvedin.com</a></p>
<hr>
<p style="font-size:12px;color:#7a6e62;">© 2026 ApprovedIn. All Rights Reserved. ApprovedIn is a technology platform only. We do not provide insurance advice, legal advice, or any professional advice of any kind.</p>
            `.trim(),
          });
        } catch (e) {
          emailOk = false;
          errorMsg += `Email delivery failed: ${e.message}. `;
        }
      }
    }

    const updates = {};
    if (emailOk && smsOk) {
      updates.status = "delivered";
      updates.sent_at = new Date().toISOString();
    } else {
      updates.status = "failed";
      updates.delivery_error_message = errorMsg.trim();
    }
    await base44.asServiceRole.entities.VendorInvitation.update(invitation_id, updates);

    if (!emailOk || !smsOk) {
      return Response.json({ success: false, error: errorMsg.trim() }, { status: 200 });
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});