import {StrainDetails, EnrichedStrain, GroupedStrainRef} from "../types";

const OUTPUT_STRAIN_DETAILS = [
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
  "description1",
];

export function getFilteredGroupedStrainRef(
  enrichedStrain: EnrichedStrain
): GroupedStrainRef {
  const strainRef = {
    strain_id: enrichedStrain.strain_id,
    percentage: enrichedStrain.percentage,
    details: filterStrainDetails(enrichedStrain.details),
  };
  return strainRef;
}

function filterStrainDetails(
  details: StrainDetails
): Partial<StrainDetails> {
  const filtered: Partial<StrainDetails> = {};

  for (const key of OUTPUT_STRAIN_DETAILS) {
    if (key in details) {
      const typedKey = key as keyof StrainDetails;
      const value = details[typedKey];
      if (value !== undefined) {
        // Explicitly tell TS this assignment matches the type
        (filtered[typedKey] as StrainDetails[typeof typedKey]) = value;
      }
    }
  }
  return filtered;
}
