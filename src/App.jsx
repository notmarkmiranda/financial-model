import { useState, useMemo } from "react";

const Slider = ({ label, value, onChange, min, max, step = 1, format }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 13, color: "#cbd5e1" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{format ? format(value) : value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: "#22c55e" }} />
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, borderBottom: "1px solid #334155", paddingBottom: 8 }}>{title}</h3>
    {children}
  </div>
);

const Row = ({ label, value, bold, color, sub }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: sub ? 12 : 14, color: sub ? "#64748b" : (color || "#cbd5e1") }}>
    <span style={{ fontWeight: bold ? 700 : 400 }}>{label}</span>
    <span style={{ fontWeight: bold ? 700 : 400, color: color || (bold ? "#f1f5f9" : "#cbd5e1") }}>{value}</span>
  </div>
);

const $ = v => `$${Math.round(v).toLocaleString()}`;
const $k = v => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : $(v);

export default function App() {
  const [simTier, setSimTier] = useState("mid");
  const [rent, setRent] = useState(2000);
  const [buildout, setBuildout] = useState(25000);
  const [peakRate, setPeakRate] = useState(55);
  const [offPeakRate, setOffPeakRate] = useState(30);
  const [lateRate, setLateRate] = useState(20);
  const [peakOcc, setPeakOcc] = useState(60);
  const [offPeakOcc, setOffPeakOcc] = useState(30);
  const [lateOcc, setLateOcc] = useState(15);
  const [memberPrice, setMemberPrice] = useState(150);
  const [memberCount, setMemberCount] = useState(0);
  const [memberUtil, setMemberUtil] = useState(50);
  const [memberDailyHrs, setMemberDailyHrs] = useState(1.5);
  const [memberPeakPct, setMemberPeakPct] = useState(40);
  const [rampMonths, setRampMonths] = useState(3);
  const [bayCount, setBayCount] = useState(1);

  const simTiers = {
    budget: { label: "Budget (SkyTrak, TruGolf)", cost: 10000 },
    mid: { label: "Mid-range (Foresight, Uneekor)", cost: 25000 },
    premium: { label: "Premium (Trackman, Golfzon)", cost: 55000 }
  };

  const m = useMemo(() => {
    const PEAK_HRS = 6;
    const OFFPEAK_HRS = 11;
    const LATE_HRS = 7;
    const DAYS = 30.4;
    const SIM_COST = simTiers[simTier].cost;

    const peakBookedHrsDay = PEAK_HRS * (peakOcc / 100);
    const offPeakBookedHrsDay = OFFPEAK_HRS * (offPeakOcc / 100);
    const lateBookedHrsDay = LATE_HRS * (lateOcc / 100);
    const totalBookedHrsDay = peakBookedHrsDay + offPeakBookedHrsDay + lateBookedHrsDay;

    const peakRevMonth = peakBookedHrsDay * peakRate * DAYS;
    const offPeakRevMonth = offPeakBookedHrsDay * offPeakRate * DAYS;
    const lateRevMonth = lateBookedHrsDay * lateRate * DAYS;
    const hourlyRevGrossPerBay = peakRevMonth + offPeakRevMonth + lateRevMonth;
    const hourlyRevGross = hourlyRevGrossPerBay * bayCount;

    const membershipRev = memberPrice * memberCount * bayCount;
    const memberHrsPerDayRaw = memberDailyHrs * memberCount * (memberUtil / 100);
    const memberHrsPerDay = Math.min(memberHrsPerDayRaw, 24);
    const capped = memberHrsPerDayRaw > 24;

    const memberPeakHrsDay = memberHrsPerDay * (memberPeakPct / 100);
    const memberOffPeakHrsDay = memberHrsPerDay * (1 - memberPeakPct / 100);

    const displacedPeakHrsDay = Math.min(memberPeakHrsDay, peakBookedHrsDay);
    const displacedOffPeakHrsDay = Math.min(memberOffPeakHrsDay, offPeakBookedHrsDay);
    const displacedRevMonth = (displacedPeakHrsDay * peakRate + displacedOffPeakHrsDay * offPeakRate) * DAYS * bayCount;

    const hourlyRevNet = hourlyRevGross - displacedRevMonth;
    const monthlyRev = hourlyRevNet + membershipRev;
    const netMemberImpact = membershipRev - displacedRevMonth;

    const expenses = {
      rent: rent * bayCount,
      utilities: 350 * bayCount,
      internet: 100,
      insurance: 200 + 50 * bayCount,
      software: 200,
      cleaning: 300 * bayCount,
      maintenance: 150 * bayCount,
      marketing: 300,
      misc: 200 * bayCount
    };
    const totalMonthlyExp = Object.values(expenses).reduce((a, b) => a + b, 0);
    const monthlyProfit = monthlyRev - totalMonthlyExp;
    const annualProfit = monthlyProfit * 12;

    const startup = {
      simulator: SIM_COST * bayCount,
      buildout: buildout * bayCount,
      leaseDeposit: rent * 3,
      legal: 3000,
      tech: 2500,
      signage: 3000,
      launchMktg: 2000,
      contingency: 5000
    };
    const totalStartup = Object.values(startup).reduce((a, b) => a + b, 0);

    // Payback calculated with ramp-up
    let paybackMonths = Infinity;
    let cumForPayback = -totalStartup;
    for (let i = 1; i <= 120; i++) {
      const ramp = Math.min(1, i / rampMonths);
      const moRev = (hourlyRevNet * ramp) + (membershipRev * ramp);
      cumForPayback += moRev - totalMonthlyExp;
      if (cumForPayback >= 0) {
        paybackMonths = i;
        break;
      }
    }

    const blendedRate = totalBookedHrsDay > 0 ? hourlyRevGrossPerBay / (totalBookedHrsDay * DAYS) : 0;
    const expenseGap = Math.max(0, totalMonthlyExp - membershipRev);
    const breakEvenHrsMonth = blendedRate > 0 ? expenseGap / (blendedRate * bayCount) : Infinity;
    const breakEvenHrsDay = breakEvenHrsMonth / DAYS;
    const breakEvenOccPct = (breakEvenHrsDay / 24) * 100;

    const blendedOcc = ((PEAK_HRS * peakOcc + OFFPEAK_HRS * offPeakOcc + LATE_HRS * lateOcc) / 24).toFixed(0);

    let cumCash = -totalStartup;
    const cashFlow = Array.from({ length: 12 }, (_, i) => {
      const mo = i + 1;
      const ramp = Math.min(1, mo / rampMonths);
      const rev = (hourlyRevNet * ramp) + (membershipRev * ramp);
      const profit = rev - totalMonthlyExp;
      cumCash += profit;
      return { mo, rev, profit, cumCash };
    });

    return {
      peakRevMonth, offPeakRevMonth, lateRevMonth, hourlyRevGross, hourlyRevNet,
      membershipRev, displacedRevMonth, netMemberImpact, monthlyRev,
      memberHrsPerDay, memberHrsPerDayRaw, capped,
      expenses, totalMonthlyExp, monthlyProfit, annualProfit,
      startup, totalStartup,
      paybackMonths, blendedRate, breakEvenHrsDay, breakEvenOccPct,
      blendedOcc, totalBookedHrsDay: totalBookedHrsDay.toFixed(1),
      cashFlow
    };
  }, [simTier, rent, buildout, peakRate, offPeakRate, lateRate, peakOcc, offPeakOcc, lateOcc,
      memberPrice, memberCount, memberUtil, memberPeakPct, memberDailyHrs, rampMonths, bayCount]);

  const profitColor = m.monthlyProfit >= 0 ? "#22c55e" : "#ef4444";
  const memberColor = m.netMemberImpact >= 0 ? "#22c55e" : "#ef4444";

  return (
    <div style={{ background: "#0f172a", color: "#e2e8f0", minHeight: "100vh", padding: 24, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Golf Simulator Financial Model</h1>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>{bayCount} {bayCount === 1 ? "Bay" : "Bays"}, 24-Hour Self-Serve Operation</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        <div>
          <Section title="Number of Bays">
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setBayCount(n)}
                  style={{
                    padding: "8px 14px", borderRadius: 8,
                    border: bayCount === n ? "2px solid #22c55e" : "1px solid #334155",
                    background: bayCount === n ? "#14532d" : "#1e293b",
                    color: bayCount === n ? "#22c55e" : "#94a3b8",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", flex: 1
                  }}>
                  {n} {n === 1 ? "Bay" : "Bays"}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Simulator Tier">
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {Object.entries(simTiers).map(([k, v]) => (
                <button key={k} onClick={() => setSimTier(k)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: simTier === k ? "2px solid #22c55e" : "1px solid #334155", background: simTier === k ? "#14532d" : "#1e293b", color: simTier === k ? "#22c55e" : "#94a3b8", fontSize: 12, cursor: "pointer", flex: 1, minWidth: 90 }}>
                  <div style={{ fontWeight: 600 }}>{k.charAt(0).toUpperCase() + k.slice(1)}</div>
                  <div style={{ marginTop: 2 }}>{$k(v.cost)}</div>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#64748b" }}>{simTiers[simTier].label}</p>
          </Section>

          <Section title="Space & Buildout">
            <Slider label="Monthly Rent" value={rent} onChange={setRent} min={1000} max={8000} step={100} format={$} />
            <Slider label="Buildout Cost" value={buildout} onChange={setBuildout} min={5000} max={60000} step={1000} format={$k} />
          </Section>

          <Section title="Hourly Rates">
            <Slider label="Peak (5pm-11pm)" value={peakRate} onChange={setPeakRate} min={10} max={90} step={5} format={v => `${$(v)}/hr`} />
            <Slider label="Off-Peak (6am-5pm)" value={offPeakRate} onChange={setOffPeakRate} min={10} max={90} step={5} format={v => `${$(v)}/hr`} />
            <Slider label="Late Night (11pm-6am)" value={lateRate} onChange={setLateRate} min={10} max={90} step={5} format={v => `${$(v)}/hr`} />
          </Section>

          <Section title="Occupancy Rates">
            <Slider label="Peak" value={peakOcc} onChange={setPeakOcc} min={0} max={100} step={5} format={v => `${v}%`} />
            <Slider label="Off-Peak" value={offPeakOcc} onChange={setOffPeakOcc} min={0} max={100} step={5} format={v => `${v}%`} />
            <Slider label="Late Night" value={lateOcc} onChange={setLateOcc} min={0} max={100} step={5} format={v => `${v}%`} />
            <div style={{ background: "#1e293b", padding: 10, borderRadius: 8, marginTop: 8 }}>
              <Row label="Blended occupancy" value={`${m.blendedOcc}%`} />
              <Row label="Booked hours/day" value={`${m.totalBookedHrsDay} of 24`} />
            </div>
          </Section>

          <Section title="Memberships">
            <Slider label="Daily hours cap" value={memberDailyHrs} onChange={setMemberDailyHrs} min={1} max={3} step={0.5} format={v => `${v} hrs/day`} />
            <Slider label="Monthly Price" value={memberPrice} onChange={setMemberPrice} min={50} max={500} step={10} format={v => `${$(v)}/mo`} />
            <Slider label="Number of Members" value={memberCount} onChange={setMemberCount} min={0} max={100} step={1} format={v => v} />
            <Slider label="Avg utilization" value={memberUtil} onChange={setMemberUtil} min={10} max={100} step={5} format={v => `${v}%`} />
            <Slider label="% of member hours during peak" value={memberPeakPct} onChange={setMemberPeakPct} min={0} max={100} step={10} format={v => `${v}%`} />
            {memberCount > 0 && (
              <div style={{ background: "#1e293b", padding: 10, borderRadius: 8, marginTop: 8 }}>
                <Row label="Member hours/day" value={`${m.memberHrsPerDay.toFixed(1)} hrs${m.capped ? ' (capped at 24)' : ''}`} />
                <Row label="Membership revenue" value={$(m.membershipRev)} color="#a78bfa" />
                <Row label="Displaced hourly revenue" value={`-${$(m.displacedRevMonth)}`} color="#f87171" />
                <div style={{ borderTop: "1px solid #334155", marginTop: 6, paddingTop: 6 }}>
                  <Row label="Net membership impact" value={`${m.netMemberImpact >= 0 ? '+' : ''}${$(m.netMemberImpact)}`} bold color={memberColor} />
                </div>
              </div>
            )}
          </Section>

          <Section title="Ramp-Up">
            <Slider label="Months to full occupancy" value={rampMonths} onChange={setRampMonths} min={1} max={12} step={1} format={v => `${v} mo`} />
          </Section>
        </div>

        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Monthly Revenue", val: $(m.monthlyRev), color: "#38bdf8" },
              { label: "Monthly Profit", val: $(m.monthlyProfit), color: profitColor },
              { label: "Total Startup Cost", val: $(m.totalStartup), color: "#f59e0b" },
              { label: "Payback Period", val: m.paybackMonths === Infinity ? "N/A" : `${m.paybackMonths} mo`, color: m.paybackMonths <= 24 ? "#22c55e" : "#ef4444" }
            ].map((c, i) => (
              <div key={i} style={{ background: "#1e293b", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.val}</div>
              </div>
            ))}
          </div>

          <Section title="Monthly Expense Break-Even">
            <div style={{ background: "#1e293b", padding: 12, borderRadius: 8, marginBottom: 8 }}>
              <Row label="Blended hourly rate" value={`${$(m.blendedRate)}/hr`} sub />
              {memberCount > 0 && <Row label="Expenses after membership rev" value={$(Math.max(0, m.totalMonthlyExp - m.membershipRev))} sub />}
            </div>
            <Row label="Hours/day to cover expenses" value={isFinite(m.breakEvenHrsDay) ? `${m.breakEvenHrsDay.toFixed(1)} hrs` : "N/A"} bold color={m.breakEvenHrsDay <= parseFloat(m.totalBookedHrsDay) ? "#22c55e" : "#ef4444"} />
            <Row label="Occupancy to cover expenses" value={isFinite(m.breakEvenOccPct) ? `${m.breakEvenOccPct.toFixed(1)}%` : "N/A"} bold color={parseFloat(m.breakEvenOccPct) <= parseFloat(m.blendedOcc) ? "#22c55e" : "#ef4444"} />
            <Row label="Current booked hours/day" value={`${m.totalBookedHrsDay} hrs`} sub />
            <Row label="Current blended occupancy" value={`${m.blendedOcc}%`} sub />
          </Section>

          <Section title="Monthly Revenue Breakdown">
            <Row label="Peak hours (6hrs/day)" value={$(m.peakRevMonth)} />
            <Row label="Off-peak hours (11hrs/day)" value={$(m.offPeakRevMonth)} />
            <Row label="Late night hours (7hrs/day)" value={$(m.lateRevMonth)} />
            {memberCount > 0 && (
              <>
                <Row label="Displaced by members" value={`-${$(m.displacedRevMonth)}`} color="#f87171" />
                <Row label="Membership revenue" value={$(m.membershipRev)} color="#a78bfa" />
              </>
            )}
            <div style={{ borderTop: "1px solid #334155", marginTop: 8, paddingTop: 8 }}>
              <Row label="Total Monthly Revenue" value={$(m.monthlyRev)} bold color="#38bdf8" />
            </div>
          </Section>

          <Section title="Monthly Expenses">
            <Row label="Rent" value={$(m.expenses.rent)} />
            <Row label="Utilities (electric-heavy)" value={$(m.expenses.utilities)} />
            <Row label="Internet" value={$(m.expenses.internet)} />
            <Row label="Insurance" value={$(m.expenses.insurance)} />
            <Row label="Software (booking, access, monitoring)" value={$(m.expenses.software)} />
            <Row label="Cleaning service" value={$(m.expenses.cleaning)} />
            <Row label="Equipment maintenance reserve" value={$(m.expenses.maintenance)} />
            <Row label="Marketing" value={$(m.expenses.marketing)} />
            <Row label="Misc / contingency" value={$(m.expenses.misc)} />
            <div style={{ borderTop: "1px solid #334155", marginTop: 8, paddingTop: 8 }}>
              <Row label="Total Monthly Expenses" value={$(m.totalMonthlyExp)} bold />
              <Row label="Monthly Profit" value={$(m.monthlyProfit)} bold color={profitColor} />
              <Row label="Annual Profit (at full occupancy)" value={$(m.annualProfit)} bold color={profitColor} />
            </div>
          </Section>

          <Section title="Startup Costs">
            <Row label="Simulator + enclosure" value={$(m.startup.simulator)} />
            <Row label="Buildout (soundproofing, electrical, flooring)" value={$(m.startup.buildout)} />
            <Row label="Lease deposit (3 months)" value={$(m.startup.leaseDeposit)} />
            <Row label="Legal & accounting" value={$(m.startup.legal)} />
            <Row label="Tech (smart lock, cameras, WiFi setup)" value={$(m.startup.tech)} />
            <Row label="Signage & furniture" value={$(m.startup.signage)} />
            <Row label="Launch marketing" value={$(m.startup.launchMktg)} />
            <Row label="Contingency buffer" value={$(m.startup.contingency)} />
            <div style={{ borderTop: "1px solid #334155", marginTop: 8, paddingTop: 8 }}>
              <Row label="Total Startup Cost" value={$(m.totalStartup)} bold color="#f59e0b" />
            </div>
          </Section>

          <Section title="12-Month Cash Flow (with ramp-up)">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "#64748b", textAlign: "right" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>Month</th>
                    <th style={{ padding: "6px 8px" }}>Revenue</th>
                    <th style={{ padding: "6px 8px" }}>Profit</th>
                    <th style={{ padding: "6px 8px" }}>Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {m.cashFlow.map(r => (
                    <tr key={r.mo} style={{ borderTop: "1px solid #1e293b" }}>
                      <td style={{ padding: "6px 8px", color: "#94a3b8" }}>Mo {r.mo}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", color: "#cbd5e1" }}>{$(r.rev)}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", color: r.profit >= 0 ? "#22c55e" : "#ef4444" }}>{$(r.profit)}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", color: r.cumCash >= 0 ? "#22c55e" : "#ef4444" }}>{$(r.cumCash)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}