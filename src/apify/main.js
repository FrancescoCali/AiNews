import { Actor } from "apify";
import { collectNews } from "../scraping/collector.js";

await Actor.init();

try {
  const result = await collectNews();
  await Actor.pushData(result.items);
  await Actor.setValue("LATEST_RUN", result);
} finally {
  await Actor.exit();
}
