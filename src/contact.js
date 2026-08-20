function checkEnv(env) {
    const envsToCheck = ["TURNSTILE_SECRET", "RESEND_API_KEY", "CONTACT_TO", "CONTACT_FROM"];
    for (const key of envsToCheck) {
        if (!env[key]) {
            console.error(`Missing environment variable: ${key}`);
            return new Response("Server configuration error", { status: 500, headers: { "Content-Type": "text/plain" } });
        }
    }
    return null;
}

export async function handleContactForm(request, env) {
  const res = checkEnv(env);
  if (res)
    return res;

  const ip = request.headers.get("CF-Connecting-IP") || "Unknown";
  const turnstileSecret = env.TURNSTILE_SECRET;
  const resendApiKey = env.RESEND_API_KEY;

  const badRequest = (msg) =>
    new Response(msg, { status: 400, headers: { "Content-Type": "text/plain" } });

  const disguisedFailure = (msg) => {
    console.log("Discarding message due to failure in spam detection: " + msg);
    return badRequest("Oops! Something went wrong. Please try again later.");
  };

  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    return badRequest("Invalid form data");
  }

  const name = formData.get("name") || null;
  const email = formData.get("email") || null;
  const message = formData.get("message") || null;
  const cat = formData.get("cat") || null;
  const honeyPot = formData.get("GsCxeZTv") || null;
  const turnstileResponse = formData.get("cf-turnstile-response") || null;

  if (!name || !email || !message || !cat) {
    return badRequest("Please fill in all required fields.");
  }
  if (honeyPot === "Yes") return disguisedFailure("HoneyPot");
  if (cat === "select") return badRequest("Please fill in all required fields.");
  if (!turnstileResponse) return disguisedFailure("turnstile");

  const turnstileData = new FormData();
  turnstileData.append("secret", turnstileSecret);
  turnstileData.append("response", turnstileResponse);
  turnstileData.append("remoteip", ip);

  const turnstileResult = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: turnstileData,
  });

  const turnstileJson = await turnstileResult.json();
  if (!turnstileJson.success) return disguisedFailure("turnstile");

  let emailContent = `Name: ${name}\n`;
  emailContent += `Email: ${email}\n`;
  emailContent += `Cat:\n${cat}\n`;
  emailContent += `Message:\n${message}\n\n`;
  emailContent += `Replying to message should send the email to ${email}\n\n`;
  emailContent += `This E-Mail want sent via the IP Address ${ip}`;

  const resendData = {
    from: env.CONTACT_FROM,
    to: env.CONTACT_TO,
    subject: `${cat} Enquiry from ${name}`,
    html: emailContent.replace(/\n/g, '<br>'),
    reply_to: email
  };

  const sendEmailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(resendData)
  });

  if (!sendEmailResponse.ok) {
    const errText = await sendEmailResponse.text();
    console.error("Resend error:", errText);
    return new Response("Oops! Something went wrong sending the email. Please try again later.", { status: 500, headers: { "Content-Type": "text/plain" } });
  }

  return Response.redirect(new URL("/success.html", request.url), 302);
}
