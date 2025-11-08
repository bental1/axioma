/*
* Retrieve the summary of the web page.
*/
export async function retrieveSummary(env, summary_key) {
    return await env.KV_SUMMARIES.get(summary_key);
}

/*
* Update the summary of the web page.
*/
export async function updateSummary(env, summaryKey, summaryValue) {
    const v = typeof summaryValue === "string" ? summaryValue : JSON.stringify(summaryValue);
    return await env.KV_SUMMARIES.put(summaryKey, v);
}

/*
* Create new summary keys, the unique ID is the encoded website URL - Allows multiple summaries per website.
* old: stable summary, access it in case summary funciton fails.
* new: most updated summary, access it as default, might be corrupted.
* Design pattern: https://www.redhat.com/en/topics/devops/what-is-blue-green-deployment.
*/
export function buildSummaryKeys(pageUrl) {
    const encodedUrl = encodeURIComponent(pageUrl);
    return { newKey: `${encodedUrl}:new`, oldKey: `${encodedUrl}:old` };
}

/*
* Communicate with the Summarizer Worker and get the page summary.
*/
export async function fetchSummary(env, pageUrl, timeout = 8000) {
    // Set the Summary generation to terminate if took too much time - set according to the real time it takes.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const summaryRequest = {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ url: pageUrl }),
            signal: controller.signal,
        };
        
        // Validation that the Summarizer service is up.
        if (env.SUMMARY?.fetch) {
            const response = await env.SUMMARY.fetch("https://internal/summarize", summaryRequest);
            if (!response.ok) throw new Error(`summarizer_${response.status}`);
            
            return await response.json();
        }

        throw new Error("no_summarizer_binding_or_url");
    }

    finally {
        clearTimeout(timer);
    }
}

/*
* Validate that the summary is not corrupted.
* This function would include more complex validations - creation date, number of responces, etc.
*/
export function isValidSummary(response) {
    return response && typeof response === "object" && typeof response.summary === "string";
}
