function formatINR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function buildExplainableInsights(analysis) {
  if (!analysis) return [];

  const city = analysis.city || "your city";
  const rainfall = safeNumber(analysis?.weather?.rainfall ?? analysis.rainfall);
  const aqi = safeNumber(analysis?.weather?.aqi ?? analysis.aqi);
  const condition = (analysis?.weather?.condition ?? analysis.condition) || "current conditions";

  const riskLevel = (analysis?.risk?.risk_level ?? analysis.risk_level) || "—";
  const riskScore = safeNumber(analysis?.risk?.risk_score ?? analysis.risk_score);
  const payoutPct = safeNumber(analysis?.risk?.payout_percentage ?? (riskLevel === 'High' ? 30 : 5));
  const payout = safeNumber(analysis?.risk?.suggested_payout);
  const weeklyIncome = safeNumber(analysis?.weekly_income);
  const trigger = Boolean(analysis?.risk?.trigger_met ?? (rainfall > 50 || aqi > 300));

  const fraudFlagged = Boolean(analysis?.fraud?.fraud_flagged);
  const fraudReason = analysis?.fraud?.fraud_reason;

  const lines = [];

  lines.push(
    `In ${city}, conditions look like ${condition} (rainfall ${rainfall}mm, AQI ${aqi}).`
  );

  if (trigger) {
    const reasons = [];
    if (rainfall > 50) reasons.push("rainfall crossed 50mm");
    if (aqi > 300) reasons.push("AQI crossed 300");
    lines.push(
      `This crosses the payout trigger because ${reasons.join(" and ")}.`
    );
  } else {
    lines.push(
      `No payout trigger right now because rainfall is ≤ 50mm and AQI is ≤ 300.`
    );
  }

  lines.push(
    `Your risk level is ${riskLevel} with a score of ${riskScore}/100.`
  );

  if (weeklyIncome > 0) {
    lines.push(
      `With weekly income ${formatINR(weeklyIncome)} and coverage ${payoutPct}%, the expected payout is about ${formatINR(
        payout
      )}.`
    );
  } else {
    lines.push(
      `Expected payout is based on your coverage (${payoutPct}%) and weekly income.`
    );
  }

  if (fraudFlagged) {
    lines.push(
      `This payout may be flagged for review: ${fraudReason || "suspicious pattern detected"}.`
    );
  } else {
    lines.push(`No fraud flags detected for this run.`);
  }

  return lines;
}

