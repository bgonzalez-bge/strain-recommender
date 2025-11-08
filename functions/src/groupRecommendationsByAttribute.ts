import {
  EnrichedStrain,
  GroupedRecommendation,
  GroupedStrainRef,
} from "./types";
import { getRandomTitle } from "./utils/groupTitles";

/**
 * Groups strains by each unique attribute value,
 * and only includes top-N (by percentage) strain_id + percentage in each group.
 */
export function groupRecommendationsByAttribute(
  enrichedStrains: EnrichedStrain[],
  maxPerGroup: number
): GroupedRecommendation[] {
    const groups: Record<string, GroupedRecommendation> = {};

    const addToGroup = (
        type: string,
        name: string,
        ref: GroupedStrainRef
    ) => {
        const key = `${type}:${name}`;
        if (!groups[key]) {
        groups[key] = {
            type,
            name,
            text: getRandomTitle(type, name),
            strains: [],
        };
        }
        groups[key].strains.push(ref);
    };

    const normalize = (value: string | string[] | undefined): string[] => {
        if (!value) return [];
        return Array.isArray(value)
        ? value.map((v) => v.trim()).filter(Boolean)
        : value.split(",").map((v) => v.trim()).filter(Boolean);
    };

    for (const strain of enrichedStrains) {
        const details = strain.details;
        if (!details) continue;

        const ref = { strain_id: strain.strain_id, percentage: strain.percentage };

        // Strain type
        if (details.strain) {
        addToGroup("strain", details.strain.trim(), ref);
        }

        // Conditions
        for (const c of normalize(details.conditions)) {
        addToGroup("conditions", c, ref);
        }

        // Symptoms
        for (const s of normalize(details.symptoms)) {
        addToGroup("symptoms", s, ref);
        }

        // Effects
        for (const e of normalize(details.effects)) {
        addToGroup("effects", e, ref);
        }
    }

    // ✅ Sort each group's strains by percentage (descending)
    // ✅ and limit to top-N
    const grouped = Object.values(groups).map((group) => ({
        ...group,
        strains: group.strains
        .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
        .slice(0, maxPerGroup),
    }));

    return grouped;
}
