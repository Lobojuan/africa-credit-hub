export function calculateEsgScores(i: {
  hasEnvironmentalPolicy: boolean; wasteManagementScore: number; energyEfficiencyScore: number;
  carbonFootprintReported: boolean; employeeWelfareScore: number; communityEngagementScore: number;
  genderDiversityScore: number; healthSafetyCompliance: boolean; boardIndependenceScore: number;
  antiCorruptionPolicy: boolean; auditedFinancials: boolean; taxComplianceScore: number;
}) {
  const E = Math.min(100, Math.round(
    (i.wasteManagementScore + i.energyEfficiencyScore) * 3.5 +
    (i.hasEnvironmentalPolicy ? 10 : 0) + (i.carbonFootprintReported ? 10 : 0)
  ));
  const S = Math.min(100, Math.round(
    (i.employeeWelfareScore + i.communityEngagementScore + i.genderDiversityScore) * 2.5 +
    (i.healthSafetyCompliance ? 25 : 0)
  ));
  const G = Math.min(100, Math.round(
    (i.boardIndependenceScore + i.taxComplianceScore) * 3.5 +
    (i.antiCorruptionPolicy ? 15 : 0) + (i.auditedFinancials ? 20 : 0)
  ));
  const total = Math.round(E * 0.33 + S * 0.33 + G * 0.34);
  const rating = total >= 85 ? "AAA" : total >= 75 ? "AA" : total >= 65 ? "A"
    : total >= 55 ? "BBB" : total >= 45 ? "BB" : total >= 35 ? "B" : "CCC";
  return { environmentalScore: E, socialScore: S, governanceScore: G, totalEsgScore: total, esgRating: rating };
}
