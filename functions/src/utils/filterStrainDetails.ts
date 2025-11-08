import { StrainDetails } from "../types";

export function filterStrainDetails(
  details: StrainDetails,
  allowedFields: string[]
): Partial<StrainDetails> {
  const filtered: Partial<StrainDetails> = {};
  for (const key of allowedFields) {
    if (details[key] !== undefined) {
      filtered[key] = details[key];
    }
  }
  return filtered;
}
