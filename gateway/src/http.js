/*
* Build response from response content.
*/
export function buildResponse(response_content, extraHeaders = {}, status = 200) {
  return new Response(JSON.stringify(response_content), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

/*
* Convert response content to Json.
*/
export function jsonifyResponse(response_content) {
  if (!response_content) return null;
  try { return JSON.parse(response_content); } catch { return null; }
}

/*
* Build the redirection url, include all query parameters.
*/
export function getRedirectedUrl(workerUrl, targetUrl) {
  return new URL(workerUrl.pathname + workerUrl.search, targetUrl).toString();
}

/*
* Redirect from the worker url to the target website url.
*/
export function proxyToWebsite(request, workerUrl, targetUrl) {
  const target = getRedirectedUrl(workerUrl, targetUrl);
  const init = {
    method: request.method,
    headers: request.headers,
    // Include body if requst type supports it.
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "follow",
  };
  
  return fetch(target, init);
}
