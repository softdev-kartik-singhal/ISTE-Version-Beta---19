// Landing-page simulator maths: residual after a purchase, the verdict band, and the three scenarios.

export function simulate(sim, amount) {
  const surplus = sim.income - (sim.committed + sim.baseline + sim.safetyFloor);
  const residual = surplus - amount;

  let verdict;
  if (amount <= 60000) {
    verdict = {
      title: 'Safe Purchase: Fully Covered',
      titleClass: 'text-primary',
      detail: 'Buffer remains 100% intact even if expected freelance invoices delay by 3 weeks.',
      confidence: 96,
      confidenceLabel: '96% High Certainty',
    };
  } else if (amount <= 110000) {
    verdict = {
      title: 'Conditionally Safe: Typical Income Required',
      titleClass: 'text-on-surface',
      detail: 'Comfortable with current pipeline. Requires clearing minimum 1 retainer invoice by Day 15.',
      confidence: 84,
      confidenceLabel: '84% Safe Margin',
    };
  } else {
    verdict = {
      title: 'High Strain: Tight Cashflow Impact',
      titleClass: 'text-error',
      detail: 'Draws heavily on emergency reserve. Recommend staggering over 3 milestone installments.',
      confidence: 48,
      confidenceLabel: '48% Elevated Strain',
    };
  }

  const worst = residual - sim.freelanceAtRisk;
  const bonus = residual + sim.pendingRefund;
  // Bar widths: how far each scenario sits between -₹1L and +₹1L.
  const bar = (value) => Math.max(4, Math.min(100, ((value + 100000) / 200000) * 100));
  const scenarios = [
    { label: 'Worst Case (No Freelance Pay)', value: worst, tag: worst < 0 ? 'Deficit' : 'Safe', barClass: worst < 0 ? 'bg-error' : 'bg-primary', width: bar(worst) },
    { label: 'Median Baseline (Expected)', value: residual, tag: residual < 0 ? 'Deficit' : 'Safe', barClass: residual < 0 ? 'bg-error' : 'bg-primary', width: bar(residual) },
    { label: 'Bonus Scenario (+Pending GST Ref)', value: bonus, tag: bonus < 0 ? 'Deficit' : 'Abundant', barClass: bonus < 0 ? 'bg-error' : 'bg-primary-container', width: bar(bonus) },
  ];

  return { residual, verdict, scenarios };
}
