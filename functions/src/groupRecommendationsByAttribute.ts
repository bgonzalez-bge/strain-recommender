import {
  EnrichedStrain,
  GroupedRecommendation,
  GroupedStrainRef,
} from "./types";
import {getRandomTitle} from "./utils/groupTitles";

/**
 * Groups strains by each unique attribute value,
 * and only includes top-N (by percentage) strain_id + percentage in each group.
 */
export function groupRecommendationsByAttribute(
  enrichedStrains: EnrichedStrain[],
  maxGroups: number,
  minPerGroup: number,
  maxPerGroup: number
): GroupedRecommendation[] {
  const groups: Record<string, GroupedRecommendation> = {};

  const addToGroup = (type: string, name: string, ref: GroupedStrainRef) => {
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

  // Build groups
  for (const strain of enrichedStrains) {
    const details = strain.details;
    if (!details) continue;

    const ref = { strain_id: strain.strain_id, name: details.name, percentage: strain.percentage };

    if (details.strain) addToGroup("strain", details.strain.trim(), ref);
    for (const c of normalize(details.conditions)) addToGroup("conditions", c, ref);
    for (const s of normalize(details.symptoms)) addToGroup("symptoms", s, ref);
    for (const e of normalize(details.effects)) addToGroup("effects", e, ref);
  }

  // Sort and trim groups
  const grouped = Object.values(groups).map((group) => ({
    ...group,
    strains: group.strains
      .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
      .slice(0, maxPerGroup), // remove extra strains beyond maxPerGroup
  }));

  // Keep only groups that have enough strains
  const validGroups = grouped.filter((g) => g.strains.length >= minPerGroup);

  // Randomize group order
  const shuffle = <T>(arr: T[]): T[] =>
    arr
      .map((a) => [Math.random(), a] as [number, T])
      .sort((a, b) => a[0] - b[0])
      .map((a) => a[1]);

  const selectedGroups: GroupedRecommendation[] = [];
  const usedStrains = new Set<string>();

  // Pick top available strains per group
  for (const group of shuffle(validGroups)) {
    const available = group.strains.filter((s) => !usedStrains.has(s.strain_id));
    if (available.length >= minPerGroup) {
      const chosen = available.slice(0, maxPerGroup); // trim extras automatically
      chosen.forEach((s) => usedStrains.add(s.strain_id));
      selectedGroups.push({ ...group, strains: chosen });
    }
  }

  //Return final valid groups, sorted by average strain percentage (descending)
  return selectedGroups
    .filter(
      (g) => g.strains.length >= minPerGroup && g.strains.length <= maxPerGroup
    )
    .sort((a, b) => {
      const avgA =
        a.strains.reduce((sum, s) => sum + (s.percentage ?? 0), 0) /
        a.strains.length;
      const avgB =
        b.strains.reduce((sum, s) => sum + (s.percentage ?? 0), 0) /
        b.strains.length;
      return avgB - avgA; // highest average first
    })
    .slice(0, maxGroups);
}
