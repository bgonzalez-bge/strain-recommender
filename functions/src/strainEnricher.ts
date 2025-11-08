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
export async function enrichWithBack4AppData(vertexResponse: VertexRecommenderResponse): Promise<EnrichedStrain[]> {
  if (!vertexResponse.predictions?.length) return [];

  const strainIds = vertexResponse.predictions.map((p) => p.strain_id);

  // Fetch matching strain records from Back4App using "where" query
  const whereQuery = JSON.stringify({objectId: {$in: strainIds}});
  const url = `${B4A_URL}?where=${encodeURIComponent(whereQuery)}`;

  logger.info(`Fetching ${strainIds.length} strain details from Back4App`);

  const res = await fetch(url, {
    headers: {
      "X-Parse-Application-Id": B4A_APP_ID,
      "X-Parse-REST-API-Key": B4A_REST_API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`Back4App fetch failed with status ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const strains: StrainDetails[] = data.results || [];

  // Merge Vertex predictions with Back4App strain details
  const enriched: EnrichedStrain[] = vertexResponse.predictions.map((pred) => {
    const details = strains.find((s) => s.objectId === pred.strain_id);
    return {...pred, details};
  });

  return enriched;
}
