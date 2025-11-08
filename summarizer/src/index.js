/*
* Mock for Summary generation.
* In future, the worker will summarize the real-time content of the page by actual rules.
* This procedure will take time, and might encounter errors.
*/
async function getSummarizedWebPage(pageUrl){
  // Fake processing time.
  const delay = 3000 + Math.random() * 4000;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Fake failure.
  if (Math.random() < 0.3) {
    throw "Error: Something went wrong!";
  }
  
  // Fake website json summary.
  return {
    summary: `This is a mocked summary for ${pageUrl}.`,
    source: "summary-worker",
    version: "v1",
    timestamp: new Date().toISOString(),
  };
}

export default {
    /*
     * Trigger summary generation.
    */
    async fetch(request) {
      try {
        return new Response(JSON.stringify(await getSummarizedWebPage((await request.json()).url), null, 2), {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
            }
          }
        );
      }

      catch (err) {
        // The error type might be not string in the future, handling it now as a string for simplicity.
        return new Response(JSON.stringify({error: "summary_failed", err,}, null, 2), {
            status: 500,
            headers: {
              "content-type": "application/json; charset=utf-8",
            }
          }
        );
      }
    },
  };