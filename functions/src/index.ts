import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { callVertexRecommender } from "./vertexRecommender";
import { enrichWithBack4AppData } from "./strainEnricher";
import { groupRecommendationsByAttribute } from "./groupRecommendationsByAttribute";
import { RecommendationResponse } from "./types";
import { filterStrainDetails } from "./utils/filterStrainDetails";

const TOP_K_PREDICTIONS_DEFAULT = 100;
const MAX_STRAINS_PER_GROUP_DEFAULT = 4;
const MIN_CONFIDENCE_DEFAULT = 80;
const STRAIN_FIELDS = [
  "objectId",
  "name",
  "name2",
  "strain",
  "image",
  "conditions",
  "symptoms",
  "flavors",
  "effects",
  "thcLevel",
  "generalInfo",
];

export const strain_recommender = onRequest(async (req, res) => {
  try {
    const user_id = req.query.user_id as string;
    const top_k = req.query.top_k ? Number(req.query.top_k) : TOP_K_PREDICTIONS_DEFAULT;
    const max_strains_per_group = req.query.max_per_group
      ? Number(req.query.max_per_group)
      : MAX_STRAINS_PER_GROUP_DEFAULT; 

    const min_confidence = req.query.min_confidence
    ? Number(req.query.min_confidence)
    : MIN_CONFIDENCE_DEFAULT;

    if (!user_id) {
      res.status(400).json({ error: "Missing user_id parameter" });
      return;
    }

    logger.info(`Calling Vertex AI for user_id: ${user_id}, top_k: ${top_k}`);

    // Vertex predictions
    const vertexResponse = await callVertexRecommender(user_id, top_k, min_confidence);

    // Back4App enrichment
    const enrichedStrains = await enrichWithBack4AppData(vertexResponse);

    // Build grouped recommendations (lightweight strain refs)
    const grouped = groupRecommendationsByAttribute(enrichedStrains, max_strains_per_group);

    // Collect unique strain details
    const uniqueStrains = Array.from(
    new Map(
        enrichedStrains
        .filter((e) => e.details)
        .map((e) => [
            e.strain_id,
            {
                strain_id: e.strain_id,
                percentage: e.percentage,
                ...filterStrainDetails(e.details!, STRAIN_FIELDS),
            },
        ])
    ).values()
    ).sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));

    // 5️⃣ Response
    const response: RecommendationResponse = {
      user_id,
      recommendations: grouped,
      strains: uniqueStrains,
    };

    res.status(200).json(response);
  } catch (error: any) {
    logger.error("strain_recommender error:", error);
    res.status(500).json({ error: error.message });
  }
});
