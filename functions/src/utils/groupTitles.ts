export const ConditionDashboardTitles = [
  "Helps with ",
  "Relief for ",
];

export const SymptomDashboardTitles = [
  "Helps with ",
  "Relief for ",
];

export const EffectsDashboardTitles = [
  "If you want to feel ",
  "Strains to make you ",
];

export const StrainTypeDashboardTitles = [
  "If you want to try a ",
  "For people looking for a ",
];

export const StrainTypeDashboardIndicaTitles = [
  "If you want to try an ",
  "For people looking for an ",
];

// Utility to pick a random title based on group type + name
export function getRandomTitle(type: string, name: string): string {
  let titles: string[] = [];

  switch (type) {
  case "conditions":
    titles = ConditionDashboardTitles;
    break;
  case "symptoms":
    titles = SymptomDashboardTitles;
    break;
  case "effects":
    titles = EffectsDashboardTitles;
    break;
  case "strain":
    // Indica uses special “an” wording
    titles = name.toLowerCase().startsWith("i") ?
      StrainTypeDashboardIndicaTitles :
      StrainTypeDashboardTitles;
    break;
  default:
    titles = ["Related to "];
  }

  const prefix = titles[Math.floor(Math.random() * titles.length)];
  return `${prefix}${name}`;
}
