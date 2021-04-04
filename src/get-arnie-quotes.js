'use strict';

const { httpGet } = require('./mock-http-interface');
const HTTP_RESPONSE_STATUS = "status";
const HTTP_STATUS_OK = 200;
const HTTP_TIMEOUT_IN_MILLIS = 3000; // set to < 200 to force a HttpTimeoutError
const ARNIE_QUOTE = "Arnie Quote";
const FAILURE = "FAILURE";

// ideally, we would also perform a few retries in a real world scenario
const getArnieQuotes = async (urls) => {
  let results = [];
  let resultsPromises = [];
  urls.forEach((url) => {
    resultsPromises.push(
      httpGetWithTimeout(url, HTTP_TIMEOUT_IN_MILLIS)
        .then((response) => {
          results.push(getTransformedResult(response));
        })
        .catch((error) => {
          results.push(getTransformedResult(error));
        }))
  });
  await Promise.all(resultsPromises);
  return results;
};

const httpGetWithTimeout = async (url, timeoutInMillis) => {
  // this does not actually terminate the HTTP Get call (since the mocked interface
  // has already been defined, I've left that bit out for this assessment)
  let timer;
  return new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      reject(new HttpTimeoutError("HTTP Get timed out."));
    }, timeoutInMillis);
    httpGet(url).then((httpGetPromise) => {
      clearTimeout(timer);
      resolve(httpGetPromise)
    });
  });
};

const getTransformedResult = (response) => {
  if (HTTP_RESPONSE_STATUS in response) {
    let responseStatus = response[HTTP_RESPONSE_STATUS];
    let responseMessage = JSON.parse(response.body).message;
    if (responseStatus === HTTP_STATUS_OK) {
      return { [ARNIE_QUOTE]: responseMessage };
    } else {
      return { [FAILURE]: responseMessage };
    }
  } else {
    // HttpTimeoutError or unexpected response format
    return { [FAILURE]: response };
  }
}

class HttpTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "HttpTimeoutError";
  }
}

module.exports = {
  getArnieQuotes,
};
