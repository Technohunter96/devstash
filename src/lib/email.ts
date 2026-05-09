import { resend } from "@/lib/resend";

export async function sendVerificationEmail(email: string, token: string) {
  if (!resend) throw new Error("RESEND_API_KEY is not set");
  if (!process.env.APP_URL) throw new Error("APP_URL is not set");

  const verifyUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Verify your DevStash email",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">DevStash</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#18181b;border:1px solid #27272a;border-radius:12px;padding:40px 32px;">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:56px;height:56px;background-color:#1d1d40;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
                      <img src="https://em-content.zobj.net/source/apple/391/envelope_2709-fe0f.png" width="28" height="28" alt="Email" style="display:block;" />
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;text-align:center;">
                Verify your email
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#a1a1aa;text-align:center;line-height:1.6;">
                Thanks for signing up to DevStash. Click the button below to verify your email address and activate your account.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}"
                      style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 28px;border-radius:8px;">
                      Verify my email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #27272a;margin:32px 0;" />

              <!-- Fallback URL -->
              <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-align:center;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0;font-size:11px;color:#6366f1;text-align:center;word-break:break-all;">
                ${verifyUrl}
              </p>

              <!-- Expiry note -->
              <p style="margin:24px 0 0;font-size:12px;color:#52525b;text-align:center;">
                This link expires in 24 hours. If you didn&apos;t create an account, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                &copy; 2026 DevStash. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

export async function sendDuplicateRegistrationEmail(email: string) {
  if (!resend) throw new Error("RESEND_API_KEY is not set");
  if (!process.env.APP_URL) throw new Error("APP_URL is not set");

  const signInUrl = `${process.env.APP_URL}/sign-in`;
  const resetUrl = `${process.env.APP_URL}/forgot-password`;

  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Someone tried to register with your DevStash account",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">DevStash</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#18181b;border:1px solid #27272a;border-radius:12px;padding:40px 32px;">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:56px;height:56px;background-color:#2d1d1d;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
                      <img src="https://em-content.zobj.net/source/apple/391/warning_26a0-fe0f.png" width="28" height="28" alt="Warning" style="display:block;" />
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;text-align:center;">
                Someone tried to register with your email
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#a1a1aa;text-align:center;line-height:1.6;">
                We received a registration attempt for <strong style="color:#ffffff;">${email}</strong>, but an account with this address already exists.<br /><br />
                If this was you, you can sign in to your existing account. If you forgot your password, you can reset it.
              </p>

              <!-- Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${signInUrl}"
                      style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 28px;border-radius:8px;">
                      Sign in
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                      style="display:inline-block;background-color:transparent;color:#a1a1aa;font-size:13px;font-weight:500;text-decoration:underline;padding:6px 0;">
                      Forgot your password?
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #27272a;margin:32px 0;" />

              <!-- Ignore note -->
              <p style="margin:0;font-size:12px;color:#52525b;text-align:center;">
                If this wasn&apos;t you, you can safely ignore this email. No changes were made to your account.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                &copy; 2026 DevStash. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!resend) throw new Error("RESEND_API_KEY is not set");
  if (!process.env.APP_URL) throw new Error("APP_URL is not set");

  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Reset your DevStash password",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">DevStash</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#18181b;border:1px solid #27272a;border-radius:12px;padding:40px 32px;">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:56px;height:56px;background-color:#1d1d40;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
                      <img src="https://em-content.zobj.net/source/apple/391/locked_1f512.png" width="28" height="28" alt="Lock" style="display:block;" />
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;text-align:center;">
                Reset your password
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#a1a1aa;text-align:center;line-height:1.6;">
                We received a request to reset your DevStash password. Click the button below to choose a new one.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                      style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 28px;border-radius:8px;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #27272a;margin:32px 0;" />

              <!-- Fallback URL -->
              <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-align:center;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0;font-size:11px;color:#6366f1;text-align:center;word-break:break-all;">
                ${resetUrl}
              </p>

              <!-- Expiry note -->
              <p style="margin:24px 0 0;font-size:12px;color:#52525b;text-align:center;">
                This link expires in 1 hour. If you didn&apos;t request a password reset, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                &copy; 2026 DevStash. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
