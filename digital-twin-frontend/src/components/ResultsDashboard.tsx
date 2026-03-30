"use client";

import { useEffect, useState } from "react";
import { useGlobalState } from "../context/GlobalStateContext";
import { Reveal } from "./Reveal";
import {
  BarChart3,
  TrendingDown,
  Wind,
  DollarSign,
  Heart,
  Activity,
  ArrowDown,
  ArrowUp,
  Save,
} from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

interface ForecastRow {
  date: string;
  emission: number;
  sectors: {
    Aviation: number;
    Ground_Transport: number;
    Industry: number;
    Power: number;
    Residential: number;
  };
}

interface ForecastChartPoint {
  label: string;
  baseline: number;
  withPolicy: number;
  monthTick: string;
}

function getEffectiveForecastYear(targetYear: number): number {
  if (targetYear <= 2026) return 2026;
  if (targetYear >= 2028) return 2028;
  return targetYear;
}

function generateFallbackForecastData(
  co2Reduction: number,
  targetYear: number
): ForecastChartPoint[] {
  const yearDrift = targetYear - 2026;
  return Array.from({ length: 18 }, (_, index) => {
    const date = new Date(targetYear, 0, 1 + index * 20);
    const label = date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
    const monthTick = date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    const seasonal = Math.sin(index * 0.55) * 4.5;
    const shortTermVariation = Math.cos(index * 1.35) * 1.2;
    const baseline = 34 + yearDrift * 2.4 + seasonal + shortTermVariation + index * 0.14;
    const withPolicy = baseline * (1 - co2Reduction / 100);

    return {
      label,
      baseline: parseFloat(baseline.toFixed(2)),
      withPolicy: parseFloat(withPolicy.toFixed(2)),
      monthTick,
    };
  });
}

function buildForecastChartData(
  rows: ForecastRow[],
  sectorReductions: Record<string, number>
): ForecastChartPoint[] {
  const sampledRows = rows.filter((_, index) => index % 14 === 0 || index === rows.length - 1);

  return sampledRows.map((row) => {
    const date = new Date(row.date);
    const withPolicyEmission = Object.entries(row.sectors).reduce(
      (sum, [sector, value]) => {
        const reductionPct = sectorReductions[sector] ?? 0;
        const adjustedValue = value * (1 - reductionPct / 100);
        return sum + adjustedValue;
      },
      0
    );

    return {
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      }),
      monthTick: date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      baseline: parseFloat(row.emission.toFixed(2)),
      withPolicy: parseFloat(withPolicyEmission.toFixed(2)),
    };
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getHealthProjection(
  aqiImprovement: number,
  co2Reduction: number,
  healthBenefit: number
) {
  const respiratorySlowdown = clamp(aqiImprovement * 0.95, 3, 18);
  const copdSlowdown = clamp(aqiImprovement * 0.72, 2, 14);
  const asthmaReduction = clamp(aqiImprovement * 1.45, 5, 28);
  const prematureMortalityReduction = clamp(
    aqiImprovement * 0.75 + co2Reduction * 0.2,
    3,
    20
  );
  const protectedHealthyYears = Math.round(healthBenefit * 10 + aqiImprovement * 75);

  let outlook =
    "Cleaner air begins to reduce the background stress on lungs and the cardiovascular system, but the full public-health dividend takes time to accumulate.";

  if (aqiImprovement >= 10) {
    outlook =
      "This scenario is strong enough to shift the city toward a meaningfully healthier long-run baseline, especially for children, older adults, and people with pre-existing respiratory disease.";
  }

  if (aqiImprovement >= 18) {
    outlook =
      "This level of air-quality improvement can materially change long-term population health, slowing chronic respiratory decline and reducing repeated pollution-driven illness over multiple years.";
  }

  return {
    respiratorySlowdown,
    copdSlowdown,
    asthmaReduction,
    prematureMortalityReduction,
    protectedHealthyYears,
    outlook,
  };
}

interface ResultsDashboardProps {
  onSaveScenario?: () => void;
}

export function ResultsDashboard({ onSaveScenario }: ResultsDashboardProps) {
  const { latestResult, isSimulating, timeHorizon } = useGlobalState();
  const [forecastData, setForecastData] = useState<ForecastChartPoint[]>([]);
  const [forecastYear, setForecastYear] = useState<number>(
    getEffectiveForecastYear(timeHorizon[1])
  );
  const [isUsingNearestYear, setIsUsingNearestYear] = useState(false);
  const selectedForecastYear = getEffectiveForecastYear(timeHorizon[1]);
  const metrics = latestResult?.metrics;

  useEffect(() => {
    if (!metrics) {
      setForecastData([]);
      setForecastYear(selectedForecastYear);
      setIsUsingNearestYear(false);
      return;
    }

    let isCancelled = false;

    const loadForecast = async () => {
      try {
        const response = await fetch(
          `/api/emission/forecast/year?year=${timeHorizon[1]}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`Forecast request failed (${response.status})`);
        }

        const result = await response.json();
        const rows = Array.isArray(result.rows) ? (result.rows as ForecastRow[]) : [];
        const chartForecast =
          rows.length > 0
            ? buildForecastChartData(rows, metrics.sectorEmissions)
            : generateFallbackForecastData(metrics.co2Reduction, selectedForecastYear);

        if (!isCancelled) {
          setForecastData(chartForecast);
          setForecastYear(result.year ?? selectedForecastYear);
          setIsUsingNearestYear(Boolean(result.usedNearestYear));
        }
      } catch (error) {
        console.error("Results forecast error:", error);
        if (!isCancelled) {
          setForecastData(
            generateFallbackForecastData(metrics.co2Reduction, selectedForecastYear)
          );
          setForecastYear(selectedForecastYear);
          setIsUsingNearestYear(timeHorizon[1] !== selectedForecastYear);
        }
      }
    };

    loadForecast();

    return () => {
      isCancelled = true;
    };
  }, [metrics, selectedForecastYear, timeHorizon]);

  if (isSimulating) {
    return (
      <section id="results" className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-white/60 animate-pulse text-lg">
                Running simulation model...
              </div>
              <p className="text-xs text-white/30 max-w-md text-center">
                Calculating sector-specific emission reductions, AQI projections, and economic impacts
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!latestResult) {
    return (
      <section id="results" className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Results Dashboard
                </h2>
                <p className="text-sm text-white/40">
                  Simulation outputs will appear here after running
                </p>
              </div>
            </div>
          </Reveal>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">
                Adjust policies above and click <strong className="text-emerald-400">Run Simulation</strong> to see results
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!metrics) {
    return null;
  }

  const healthProjection = getHealthProjection(
    metrics.aqiImprovement,
    metrics.co2Reduction,
    metrics.healthBenefit
  );

  const chartTooltipStyle: React.CSSProperties = {
    backgroundColor: "rgba(15, 5, 24, 0.95)",
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  };

  return (
    <section id="results" className="py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <Reveal>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Results Dashboard
                </h2>
                <p className="text-sm text-white/40">
                  Scenario: {latestResult.name}
                </p>
              </div>
            </div>
            {onSaveScenario && (
              <button
                onClick={onSaveScenario}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Scenario
              </button>
            )}
          </div>
        </Reveal>

        {/* Summary Metrics */}
        <Reveal delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-emerald-400/60 uppercase tracking-wider">
                  CO₂ Reduction
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {metrics.co2Reduction.toFixed(1)}%
              </div>
            </div>
            <div className="bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] text-cyan-400/60 uppercase tracking-wider">
                  AQI Improvement
                </span>
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                {metrics.aqiImprovement.toFixed(1)}%
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${metrics.gdpChange >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  GDP Impact
                </span>
              </div>
              <div className={`text-2xl font-bold ${metrics.gdpChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.gdpChange >= 0 ? "+" : ""}{metrics.gdpChange.toFixed(2)}%
              </div>
            </div>
            <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/30">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-rose-400" />
                <span className="text-[10px] text-rose-400/60 uppercase tracking-wider">
                  Health Benefit
                </span>
              </div>
              <div className="text-2xl font-bold text-rose-400">
                ₹{metrics.healthBenefit.toFixed(0)} Cr
              </div>
            </div>
            <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/30">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] text-purple-400/60 uppercase tracking-wider">
                  Lives Saved Est.
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {Math.round(metrics.co2Reduction * 120)}+
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="glass-panel p-6 mb-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">
                  Long-Run Health Outlook
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">
                  Improved air quality compounds into slower disease growth across the city
                </h3>
                <p className="text-sm md:text-base text-white/70 leading-relaxed mb-4">
                  {healthProjection.outlook}
                </p>
                <p className="text-xs text-white/45 leading-relaxed">
                  These are scenario-based estimates inferred from the simulated AQI improvement and emissions decline. Real outcomes depend on policy enforcement, exposure duration, population density, and access to care.
                </p>
              </div>

              <div className="min-w-[220px] rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5">
                <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-300/60 mb-2">
                  Healthy Years Protected
                </div>
                <div className="text-3xl font-bold text-emerald-300 mb-2">
                  {healthProjection.protectedHealthyYears.toLocaleString()}+
                </div>
                <p className="text-sm text-emerald-100/70">
                  cumulative healthy life-years preserved over the long run if the scenario remains in place
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/8 p-4">
                <div className="text-[11px] uppercase tracking-wider text-cyan-300/60 mb-2">
                  Chronic Lung Disease Growth
                </div>
                <div className="text-2xl font-bold text-cyan-300 mb-1">
                  {healthProjection.respiratorySlowdown.toFixed(1)}% slower
                </div>
                <p className="text-sm text-white/60">
                  expected pace of new long-term respiratory burden linked to dirty-air exposure
                </p>
              </div>

              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/8 p-4">
                <div className="text-[11px] uppercase tracking-wider text-sky-300/60 mb-2">
                  COPD Progression
                </div>
                <div className="text-2xl font-bold text-sky-300 mb-1">
                  {healthProjection.copdSlowdown.toFixed(1)}% slower
                </div>
                <p className="text-sm text-white/60">
                  deterioration among high-exposure residents and vulnerable older adults
                </p>
              </div>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/8 p-4">
                <div className="text-[11px] uppercase tracking-wider text-rose-300/60 mb-2">
                  Asthma Flare-Ups
                </div>
                <div className="text-2xl font-bold text-rose-300 mb-1">
                  {healthProjection.asthmaReduction.toFixed(1)}% fewer
                </div>
                <p className="text-sm text-white/60">
                  pollution-triggered episodes, especially for children and commuters
                </p>
              </div>

              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/8 p-4">
                <div className="text-[11px] uppercase tracking-wider text-violet-300/60 mb-2">
                  Premature Mortality Risk
                </div>
                <div className="text-2xl font-bold text-violet-300 mb-1">
                  {healthProjection.prematureMortalityReduction.toFixed(1)}% lower
                </div>
                <p className="text-sm text-white/60">
                  long-run exposure-related risk from combined air-quality and emissions gains
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Forecast Chart */}
        <Reveal delay={200}>
          <div className="glass-panel p-6 mb-8">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
              Emission Forecast Comparison
              <span className="text-blue-400 font-bold">{forecastYear}</span>
              {isUsingNearestYear && (
                <span className="text-[10px] text-amber-300/70 normal-case tracking-normal">
                  using nearest available forecast year for the selected horizon
                </span>
              )}
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData}>
                  <defs>
                    <linearGradient id="resultPolicyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    minTickGap={18}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                    tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    domain={["auto", "auto"]}
                    label={{ value: "kt CO₂/day (monthly avg.)", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "#fff" }} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Area type="linear" dataKey="withPolicy" fill="url(#resultPolicyGrad)" stroke="transparent" legendType="none" />
                  <Line type="linear" dataKey="baseline" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2, fill: "#6b7280", strokeWidth: 0 }} name="Baseline (No Policy)" />
                  <Line type="linear" dataKey="withPolicy" stroke="#10b981" strokeWidth={3} dot={{ r: 2.5, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} name="With Policy" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        {/* Sector Impact Breakdown */}
        <Reveal delay={300}>
          <div className="glass-panel p-6">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-4">
              Sector Impact Breakdown
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(metrics.sectorEmissions).map(([sector, reduction]) => {
                const isReduction = reduction > 0;
                return (
                  <div
                    key={sector}
                    className={`p-3 rounded-xl border ${
                      isReduction
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-white/60">
                        {sector.replace("_", " ")}
                      </span>
                    </div>
                    <div className={`text-lg font-bold flex items-center gap-1 ${
                      isReduction ? "text-emerald-400" : "text-white/40"
                    }`}>
                      {isReduction ? (
                        <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUp className="w-4 h-4" />
                      )}
                      {Math.abs(reduction).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
