import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {callVertexRecommender} from "./vertexRecommender";
import {enrichWithBack4AppData} from "./strainEnricher";
import {groupRecommendationsByAttribute}
  from "./groupRecommendationsByAttribute";
import {RecommendationResponse} from "./types";
import {filterStrainDetails} from "./utils/filterStrainDetails";

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

export const strainRecommender = onRequest(async (req, res) => {
  try {
    const userId = req.query.user_id as string;
    const topK = req.query.top_k ?
      Number(req.query.top_k) : TOP_K_PREDICTIONS_DEFAULT;
    const maxStrainsPerGroup = req.query.max_per_group ?
      Number(req.query.max_per_group) :
      MAX_STRAINS_PER_GROUP_DEFAULT;

    const minConfidence = req.query.min_confidence ?
      Number(req.query.min_confidence) :
      MIN_CONFIDENCE_DEFAULT;

    if (!userId) {
      res.status(400).json({error: "Missing user_id parameter"});
      return;
    }

    logger.info(`Calling Vertex AI for user_id: ${userId}, top_k: ${topK}`);

    // Vertex predictions
    const vertexResponse = await callVertexRecommender(userId,
      topK,

      minConfidence);

    // Back4App enrichment
    const enrichedStrains = await enrichWithBack4AppData(vertexResponse);

    // Build grouped recommendations (lightweight strain refs)
    const grouped = groupRecommendationsByAttribute(enrichedStrains,
      maxStrainsPerGroup);

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
      user_id: userId,
      recommendations: grouped,
      strains: uniqueStrains,
    };

    res.status(200).json(response);
  } catch (error: any) {
    logger.error("strain_recommender error:", error);
    res.status(500).json({error: error.message});
  }
});
