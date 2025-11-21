
import {
  EnrichedStrain,
  GroupedStrainRef,
} from "./types";
import {getFilteredGroupedStrainRef} from "./utils/filterStrainDetails";

export function fetchStrainOfTheDay(
  enrichedStrains: EnrichedStrain[]
): GroupedStrainRef | undefined {
  if (!enrichedStrains?.length) return undefined;

  const firstStrainsAmountToBeConsidered = 10;
  // Sort by percentage DESC
  const top = enrichedStrains
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, firstStrainsAmountToBeConsidered)
    .filter((s) => s.details); // ensure details exist

  if (top.length === 0) return undefined;

  // Pick a random strain
  const randomIndex = Math.floor(Math.random() * top.length);
  return getFilteredGroupedStrainRef(top[randomIndex]);
}
