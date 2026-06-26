/**
 * TrackAI branded email HTML generator.
 * Matches the app's dark graphite + gold accent design system.
 */

interface OtpEmailOptions {
  name: string;
  code: string;
  isNew: boolean;
}

export function buildOtpEmail({ name, code, isNew }: OtpEmailOptions): { subject: string; html: string } {
  const subject = isNew
    ? `Welcome to TrackAI — your sign-in code is ${code}`
    : `Your TrackAI sign-in code: ${code}`;

  const headline = isNew ? `Welcome aboard, ${name}!` : `Your sign-in code`;

  const bodyText = isNew
    ? `Your TrackAI account has been created. Use the code below to sign in and start tracking your career journey.`
    : `Use the code below to sign in to your TrackAI account. It expires in <strong style="color:#E6C766;">10 minutes</strong>.`;

  // Build each OTP digit as a separate cell for maximum email-client compatibility
  const digitCells = code
    .split('')
    .map(
      (d) =>
        `<td style="padding:0 5px;">
          <div style="
            width:48px;height:58px;
            background:linear-gradient(135deg,rgba(212,175,55,0.08),rgba(212,175,55,0.04));
            border:1.5px solid rgba(212,175,55,0.35);
            border-radius:10px;
            font-size:28px;font-weight:700;
            color:#D4AF37;
            text-align:center;line-height:58px;
            font-family:'Courier New',monospace;
            letter-spacing:0;
          ">${d}</div>
        </td>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap');
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse}
    img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none}
    a{color:#D4AF37;text-decoration:none}
    @media only screen and (max-width:600px){
      .email-container{width:100%!important}
      .otp-digit{width:40px!important;height:50px!important;font-size:22px!important;line-height:50px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#09090B;font-family:'Inter',Arial,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${isNew ? `Welcome to TrackAI! Your sign-in code is ${code}` : `Your TrackAI sign-in code is ${code} — valid for 10 minutes.`}
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:linear-gradient(135deg,rgba(212,175,55,0.06) 0%,#09090B 40%,#09090B 60%,rgba(212,175,55,0.03) 100%);min-height:100vh;">
    <tr>
      <td align="center" valign="top" style="padding:48px 16px 40px;">

        <!-- Email card -->
        <table class="email-container" width="520" cellpadding="0" cellspacing="0" border="0"
          style="background:linear-gradient(180deg,rgba(24,24,27,0.98) 0%,rgba(17,17,19,0.98) 100%);
                 border:1px solid rgba(255,255,255,0.07);
                 border-radius:20px;
                 box-shadow:0 24px 64px rgba(0,0,0,0.6),0 1px 0 rgba(212,175,55,0.12) inset;">
          
          <!-- Gold top accent bar -->
          <tr>
            <td style="padding:0;">
              <div style="height:3px;background:linear-gradient(90deg,transparent,#D4AF37 30%,#E6C766 50%,#D4AF37 70%,transparent);border-radius:20px 20px 0 0;"></div>
            </td>
          </tr>

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding:36px 40px 0;">
              
              <!-- Logo mark: gold rounded square with "T" -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div style="
                      display:inline-block;
                      width:52px;height:52px;
                      background:linear-gradient(135deg,#D4AF37,#E6C766);
                      border-radius:14px;
                      text-align:center;line-height:52px;
                      font-size:26px;font-weight:800;
                      color:#09090B;
                      font-family:'Space Grotesk','Arial Black',sans-serif;
                      box-shadow:0 8px 24px rgba(212,175,55,0.4);
                    ">T</div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:12px;">
                    <span style="
                      font-family:'Space Grotesk','Arial Black',sans-serif;
                      font-size:20px;font-weight:700;
                      letter-spacing:-0.04em;
                      background:linear-gradient(135deg,#D4AF37,#E6C766);
                      -webkit-background-clip:text;
                      -webkit-text-fill-color:transparent;
                      color:#D4AF37;
                    ">TrackAI</span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);"></div>
            </td>
          </tr>

          <!-- Headline + body copy -->
          <tr>
            <td align="center" style="padding:28px 40px 8px;">
              <h1 style="
                margin:0 0 14px;
                font-family:'Space Grotesk','Arial Black',sans-serif;
                font-size:26px;font-weight:700;
                letter-spacing:-0.04em;
                color:#FAFAFA;
                line-height:1.2;
              ">${headline}</h1>
              <p style="
                margin:0;
                font-size:15px;font-weight:400;
                color:#A1A1AA;
                line-height:1.65;
                max-width:380px;
              ">${bodyText}</p>
            </td>
          </tr>

          <!-- OTP code block -->
          <tr>
            <td align="center" style="padding:28px 40px;">
              
              <!-- OTP container -->
              <div style="
                background:linear-gradient(135deg,rgba(212,175,55,0.05),rgba(212,175,55,0.02));
                border:1px solid rgba(212,175,55,0.2);
                border-radius:14px;
                padding:28px 24px;
              ">
                <p style="margin:0 0 18px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#71717A;">
                  Your one-time code
                </p>
                <table cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>${digitCells}</tr>
                </table>
                <p style="margin:18px 0 0;font-size:12px;color:#71717A;line-height:1.5;">
                  ⏱ Expires in <strong style="color:#E6C766;">10 minutes</strong> &nbsp;·&nbsp; Do not share this code
                </p>
              </div>

            </td>
          </tr>

          <!-- CTA hint -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <p style="margin:0;font-size:13px;color:#71717A;line-height:1.6;">
                Head back to the TrackAI app and enter this code to${isNew ? ' activate your account and' : ''} sign in.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent);"></div>
            </td>
          </tr>

          <!-- Feature highlights (only for new users) -->
          ${
            isNew
              ? `<tr>
            <td style="padding:28px 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33%" align="center" style="padding:0 8px;">
                    <div style="width:36px;height:36px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:10px;text-align:center;line-height:36px;font-size:18px;margin:0 auto 8px;">📊</div>
                    <p style="margin:0;font-size:12px;font-weight:600;color:#FAFAFA;">Track Jobs</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717A;">All applications in one place</p>
                  </td>
                  <td width="33%" align="center" style="padding:0 8px;">
                    <div style="width:36px;height:36px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:10px;text-align:center;line-height:36px;font-size:18px;margin:0 auto 8px;">✉️</div>
                    <p style="margin:0;font-size:12px;font-weight:600;color:#FAFAFA;">Gmail Sync</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717A;">Auto-detect new jobs</p>
                  </td>
                  <td width="33%" align="center" style="padding:0 8px;">
                    <div style="width:36px;height:36px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:10px;text-align:center;line-height:36px;font-size:18px;margin:0 auto 8px;">🤖</div>
                    <p style="margin:0;font-size:12px;font-weight:600;color:#FAFAFA;">AI Parsing</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717A;">Smart email analysis</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 40px 36px;">
              <p style="margin:0 0 6px;font-size:11px;color:#52525B;line-height:1.6;">
                If you didn't request this email, you can safely ignore it.<br/>
                This code will expire automatically and cannot be reused.
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#3F3F46;">
                © ${new Date().getFullYear()} TrackAI &nbsp;·&nbsp; 
                <a href="#" style="color:#52525B;text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

          <!-- Bottom gold accent bar -->
          <tr>
            <td style="padding:0;">
              <div style="height:2px;background:linear-gradient(90deg,transparent,rgba(212,175,55,0.3) 30%,rgba(230,199,102,0.4) 50%,rgba(212,175,55,0.3) 70%,transparent);border-radius:0 0 20px 20px;"></div>
            </td>
          </tr>

        </table>
        <!-- /Email card -->

      </td>
    </tr>
  </table>

</body>
</html>`;

  return { subject, html };
}
