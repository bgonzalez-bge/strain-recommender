import * as logger from "firebase-functions/logger";
import {StrainDetails, EnrichedStrain, VertexRecommenderResponse} from "./types";

const B4A_APP_ID = process.env.B4A_APP_ID!;
const B4A_REST_API_KEY = process.env.B4A_REST_API_KEY!;
const B4A_CLASS_NAME = process.env.B4A_CLASS_NAME!;
const B4A_URL = `https://parseapi.back4app.com/classes/${B4A_CLASS_NAME}`;

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
