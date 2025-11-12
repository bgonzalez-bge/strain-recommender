import {StrainDetails} from "../types";

export function filterStrainDetails(
  details: StrainDetails,
  allowedFields: string[]
): Partial<StrainDetails> {
  const filtered: Partial<StrainDetails> = {};

  for (const key of allowedFields) {
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
