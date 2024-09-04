import { HttpsProxyAgent } from "https-proxy-agent";
import { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  //console.log("req:", req);
  const proxy = process.env.HTTP_PROXY;
  let targetHost = "";
  if (process.env.UNIFORM_ENDOINT === "global") {
    targetHost = process.env.TARGET_HOSTNAME_GLOBAL ?? "";
  } else {
    targetHost = process.env.TARGET_HOSTNAME ?? "";
  }

  // Check if the necessary environment variables are set
  if (!proxy || !targetHost) {
    return res.status(500).json({
      error:
        "Configuration error: HTTP_PROXY and TARGET_HOSTNAME must be defined.",
    });
  }

  const agent = new HttpsProxyAgent(proxy);

  // Construct the new URL by replacing the hostname
  const url = new URL(targetHost + req.url);
  url.hostname = targetHost;

  console.log("url from handler:", url.toString());
  req.headers["host"] = targetHost
    .replace("http://", "")
    .replace("https://", "");

  // Fetch with the updated URL and original headers
  try {
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: req.headers,
      agent,
    });

    const data = await response.json();
    res.json(data);
    res.status(response.status);
    response.headers.forEach((value, name) => res.setHeader(name, value));

    res.json(response.body);
  } catch (error) {
    console.error("Error during proxying:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
