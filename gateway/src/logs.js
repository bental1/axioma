/*
Generate log for sending to the log listener.
*/
export function generateLog(request, response) {
    const url = new URL(request.url);
   
    return {
      timeStamp: new Date().toISOString(),
      method: request.method,
      path: url.pathname,
      host: url.host,
      userAgent: request.headers.get("user-agent") || "",
      status: response?.status ?? 0,
    };
  }

/*
Send the log to the log listener website.
*/
export function log(env, ctx, log_content) {
    ctx.waitUntil(
      fetch(env.LOGS_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(log_content),
      }).catch(() => {})
    );
  }