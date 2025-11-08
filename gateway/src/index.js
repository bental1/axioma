import { isRequestedFromAICrawler } from "./ai.js";
import { fetchSummary, buildSummaryKeys, retrieveSummary, updateSummary, isValidSummary } from "./summarizerClient.js";
import { jsonifyResponse, getRedirectedUrl, proxyToWebsite, buildResponse } from "./http.js";
import { log, generateLog } from "./logs.js";


const TESTING_ROUTE = "/api/summary"


export default {
  async fetch(request, env, ctx) {
    const workerUrl = new URL(request.url);
    let response = null;

    // Internal API for testing or AI crawler.
    if (workerUrl.pathname === TESTING_ROUTE || isRequestedFromAICrawler(request)) {
      const targetUrl = workerUrl.searchParams.get("url") || getRedirectedUrl(workerUrl, env.WEBSITE_URL);
      const result = await getWebPageSummary(env, targetUrl, ctx);

      if ("error" in result) {
        response = buildResponse(result, {}, 502);
      }

      else {
        response = buildResponse(result.payload, {
          "x-cache": result.fromCache ? "hit" : "miss-computed",
          "x-source": result.source,
        });
      }
    }

    else {
      response = await proxyToWebsite(request, workerUrl, env.WEBSITE_URL);
    }

    log(env, ctx, generateLog(request, response));
    return response;
  },
};

/*
Implementation of https://www.redhat.com/en/topics/devops/what-is-blue-green-deployment.
Allows the data to be available even if there's some corruption in latest changes.
Saves the latest stable version for handling such cases.
Implemented also an efficient way to handle corrupted data, the fix will happen in a background task and other users won't notice it.
*/
async function getWebPageSummary(env, websiteUrl, ctx) {
  const { newKey, oldKey } = buildSummaryKeys(websiteUrl);

  // If the summary in the "new" value in KV is valid, return it without processing.
  // Update the summary in the "old" value in KV to be the same.
  let newValue = jsonifyResponse(await retrieveSummary(env, newKey));

  if (isValidSummary(newValue)) {
    await updateSummary(env, oldKey, newValue);

    return { payload: newValue, fromCache: true, source: "new" };
  }

  // The summary in the "new" value in KV is not valid.
  // Validate if the value in the "old" value in KV is valid.
  // If valid, return it, and send to fetching new reponse to run in background.
  // If the fetching failed, make "new" value as "old" value.
  let oldValue = jsonifyResponse(await retrieveSummary(env, oldKey));

  if (isValidSummary(oldValue)) {
    ctx.waitUntil((async () => {
      try {
        // Update only new summary with fresh fetched summary.
        newValue = await fetchSummary(env, websiteUrl);
        await updateSummary(env, newKey, newValue);

      } catch (err) {
        await updateSummary(env, newKey, oldValue);
        console.log("Background refresh failed:", err);
      }
    }));

    return { payload: oldValue, fromCache: true, source: "old" };
  }

  // If both summaries are not valid, the user would wait until the summary will be generated.
  // Future idea: implement a locking mechanism so this process won't happen many times when many users try to access the data.
  try {
    newValue = await fetchSummary(env, websiteUrl);
    await updateSummary(env, newKey, newValue);
    await updateSummary(env, oldKey, newValue);

    return { payload: newValue, fromCache: false, source: "new" };

  } catch {
    return { error: "summary_unavailable" };
  }
}
