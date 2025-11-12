import * as logger from "firebase-functions/logger";
import {StrainDetails, EnrichedStrain, VertexRecommenderResponse} from "./types";

const B4A_APP_ID = process.env.B4A_APP_ID!;
const B4A_REST_API_KEY = process.env.B4A_REST_API_KEY!;
const B4A_CLASS_NAME = process.env.B4A_CLASS_NAME!;
const B4A_URL = `https://parseapi.back4app.com/classes/${B4A_CLASS_NAME}`;

/**
 * Enriches Vertex AI recommendation results with additional strain details
 * fetched from Back4App.
 *
 * This function takes the Vertex AI model response (a list of predicted
 * strains with their percentages), queries Back4App for each strain’s
 * detailed information, and returns a combined enriched dataset.
 *
 * @async
 * @param {VertexRecommenderResponse} vertexResponse - The response from Vertex AI
 * containing predicted strains and percentages.
 * @return {Promise<EnrichedStrain[]>} A promise that resolves to an array of enriched
 * strain objects, each containing model prediction data and Back4App details.
 *
 * @example
 * const enriched = await enrichWithBack4AppData(vertexResponse);
 * // → [
 * //   {
 * //     strain_id: 'abc123',
 * //     percentage: 98.5,
 * //     details: { name: 'Blue Dream', type: 'Hybrid', ... }
 * //   },
 * //   ...
 * // ]
 */
export async function enrichWithBack4AppData(
  vertexResponse: VertexRecommenderResponse
): Promise<EnrichedStrain[]> {
  if (!vertexResponse.predictions?.length) return [];

  const strainIds = vertexResponse.predictions.map((p) => p.strain_id);
  const BATCH_SIZE = 300;
  const CONCURRENCY_LIMIT = 5; // how many batches to fetch in parallel

  logger.info(
    `Fetching ${strainIds.length} strain details from Back4App (batch size=${BATCH_SIZE}, concurrency=${CONCURRENCY_LIMIT})`
  );

  const batches: string[][] = [];
  for (let i = 0; i < strainIds.length; i += BATCH_SIZE) {
    batches.push(strainIds.slice(i, i + BATCH_SIZE));
  }

  const allResults: StrainDetails[] = [];

  // Helper: fetch a single batch
  const fetchBatch = async (batch: string[], index: number): Promise<void> => {
    const whereQuery = JSON.stringify({ objectId: { $in: batch } });
    const url = `${B4A_URL}?where=${encodeURIComponent(whereQuery)}&limit=${BATCH_SIZE}`;

    logger.info(`Fetching batch ${index + 1}/${batches.length} (${batch.length} IDs)`);

    const res = await fetch(url, {
      headers: {
        "X-Parse-Application-Id": B4A_APP_ID,
        "X-Parse-REST-API-Key": B4A_REST_API_KEY,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Back4App batch ${index + 1} failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    if (data.results?.length) {
      allResults.push(...data.results);
    }
  };

  // Run batches in parallel with concurrency control
  const queue: Promise<void>[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batchPromise = fetchBatch(batches[i], i);
    queue.push(batchPromise);

    // When the queue reaches the limit, wait for all to finish before continuing
    if (queue.length >= CONCURRENCY_LIMIT) {
      await Promise.all(queue);
      queue.length = 0;
    }
  }
  // Wait for remaining batches
  if (queue.length > 0) {
    await Promise.all(queue);
  }

  logger.info(`Fetched ${allResults.length} total strain records from Back4App`);

  // Merge Vertex predictions with Back4App strain details
  const enriched: EnrichedStrain[] = vertexResponse.predictions.map((pred) => {
    const details = allResults.find((s) => s.objectId === pred.strain_id);
    return { ...pred, details };
  });

  return enriched;
}

