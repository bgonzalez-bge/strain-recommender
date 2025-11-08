import {GoogleAuth} from "google-auth-library";
import {VertexRecommenderResponse} from "./types";

const PROJECT_ID = "423548405802";
const ENDPOINT_ID = "3815924373429157888";
const LOCATION = "us-central1";
const fetchFn = globalThis.fetch;

interface VertexRecommenderRequest {
  instances: Array<{
    user_id: string;
    top_k: number;
  }>;
}

/**
 * Calls the Vertex AI Recommender API to fetch strain recommendations for a given user.
 *
 * @async
 * @function callVertexRecommender
 * @param {string} userId - The ID of the user to generate recommendations for.
 * @param {number} topK - The number of top recommendations to retrieve from Vertex AI.
 * @param {number} [min_percentage] - Optional minimum percentage threshold to filter recommendations.
 * @return {Promise<VertexRecommenderPrediction[]>} A promise that resolves with the filtered predictions.
 */
export async function callVertexRecommender(
  userId: string,
  topK: number,
  minConfidence: number,
): Promise<VertexRecommenderResponse> {
  // Create an authenticated client
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });

  // Get a raw access token (simplest + works with Firebase)
  const token = await auth.getAccessToken();

  if (!token) {
    throw new Error("Failed to obtain Google Cloud access token.");
  }

  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/${ENDPOINT_ID}:predict`;

  const body: VertexRecommenderRequest = {
    instances: [{user_id: userId, top_k: topK}],
  };

  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Vertex AI request failed (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as VertexRecommenderResponse;

  const filteredPredictions =
    data.predictions.filter((p) => p.percentage >= minConfidence) ?? [];

  return {predictions: filteredPredictions};
}
