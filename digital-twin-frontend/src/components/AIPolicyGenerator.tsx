"use client";

import { useState } from "react";
import { useGlobalState } from "../context/GlobalStateContext";
import { Reveal } from "./Reveal";
import { API_BASE_URL } from "../config";
import { initialNodes } from "../data/nodes";
import { initialEdges } from "../data/edges";
import {
  Target,
  Wallet,
  Clock,
  Zap,
  ChevronDown,
  AlertCircle,
  Brain,
  CheckCircle2,
  FlaskConical,
} from "lucide-react";

type SliderId =
  | "ev_subsidy"
  | "carbon_tax"
  | "public_transit"
  | "dust_regulation"
  | "energy_transition";

interface PolicyMutation {
  type: string;
  node_id?: string | null;
  source?: string | null;
  target?: string | null;
  new_weight?: number | null;
  reason: string;
}

interface GeneratedPolicy {
  policy_id: string;
  name: string;
  description?: string | null;
  mutations: PolicyMutation[];
  estimated_impacts?: {
    co2_reduction_pct?: number;
    aqi_improvement_pct?: number;
    confidence?: number;
  };
  source_research?: {
    confidence?: number;
  };
}

interface GeneratePolicyResponse {
  policy: GeneratedPolicy;
  research_evidence?: string[];
}

const CONTROL_KEYWORDS: Record<SliderId, string[]> = {
  ev_subsidy: [
    "electric vehicle",
    "ev",
    "vehicle electrification",
    "charging",
    "clean vehicle",
    "fleet electrification",
  ],
  carbon_tax: [
    "carbon tax",
    "industrial tax",
    "industry",
    "industrial",
    "factory",
    "manufacturing",
    "polluter pays",
  ],
  public_transit: [
    "public transport",
    "public transit",
    "metro",
    "bus",
    "mass transit",
    "rail",
    "commuter",
    "mobility",
  ],
  dust_regulation: [
    "dust",
    "construction",
    "demolition",
    "site emissions",
    "road dust",
    "infrastructure",
    "dust suppression",
  ],
  energy_transition: [
    "renewable",
    "clean energy",
    "energy transition",
    "power",
    "coal",
    "grid",
    "solar",
    "wind",
    "power plant",
  ],
};

const SECTOR_HINTS: Record<string, SliderId[]> = {
  transport: ["ev_subsidy", "public_transit"],
  industries: ["carbon_tax"],
  industry: ["carbon_tax"],
  energy: ["energy_transition"],
  power: ["energy_transition"],
  infrastructure: ["dust_regulation"],
  construction: ["dust_regulation"],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildResearchQuery(targetAQI: number, budget: string, timeline: string) {
  const timelineLabel =
    timeline === "1yr" ? "1 year" : timeline === "5yr" ? "5 years" : "3 years";

  return [
    `Generate a Delhi air-quality policy bundle to reach an AQI target of ${targetAQI} within ${timelineLabel} using a ${budget.toLowerCase()} public budget.`,
    "Prioritize interventions that can be translated into these implementation levers: EV subsidies, industrial carbon tax, public transport investment, construction dust regulation, and energy transition incentives.",
    "Return a realistic mix of measures that reduces AQI and CO2 while staying feasible for an urban government.",
  ].join(" ");
}

function scoreTextForControl(text: string, control: SliderId): number {
  const normalized = text.toLowerCase();
  return CONTROL_KEYWORDS[control].reduce(
    (score, keyword) => score + (normalized.includes(keyword) ? 1 : 0),
    0
  );
}

function mapPolicyToSliderValues(
  policy: GeneratedPolicy,
  targetAQI: number,
  budget: string,
  timeline: string,
  evidence: string[]
): Record<string, number> {
  const scores: Record<SliderId, number> = {
    ev_subsidy: 0,
    carbon_tax: 0,
    public_transit: 0,
    dust_regulation: 0,
    energy_transition: 0,
  };

  const combinedText = [
    policy.name,
    policy.description ?? "",
    ...policy.mutations.map((mutation) => mutation.reason),
    ...evidence,
  ].join(" ");

  (Object.keys(scores) as SliderId[]).forEach((control) => {
    scores[control] += scoreTextForControl(combinedText, control);
  });

  policy.mutations.forEach((mutation) => {
    const references = [
      mutation.node_id ?? "",
      mutation.source ?? "",
      mutation.target ?? "",
      mutation.reason ?? "",
    ]
      .join(" ")
      .toLowerCase();

    Object.entries(SECTOR_HINTS).forEach(([hint, controls]) => {
      if (references.includes(hint)) {
        controls.forEach((control) => {
          scores[control] += 2;
        });
      }
    });

    if ((mutation.type ?? "").includes("reduce_edge_weight")) {
      scores.public_transit += 1;
      scores.energy_transition += 1;
    }
  });

  const activeControlCount = Object.values(scores).filter((score) => score > 0).length;
  if (activeControlCount === 0) {
    scores.ev_subsidy = 2;
    scores.public_transit = 2;
    scores.carbon_tax = 2;
    scores.dust_regulation = 1;
    scores.energy_transition = 2;
  }

  const budgetScale = budget === "High" ? 1.15 : budget === "Low" ? 0.82 : 1;
  const timelineScale = timeline === "1yr" ? 1.12 : timeline === "5yr" ? 0.88 : 1;
  const targetScale =
    targetAQI <= 90 ? 1.2 : targetAQI <= 120 ? 1.05 : targetAQI <= 150 ? 0.92 : 0.8;
  const impactScale = clamp(
    ((policy.estimated_impacts?.aqi_improvement_pct ?? 10) +
      (policy.estimated_impacts?.co2_reduction_pct ?? 10)) /
      24,
    0.85,
    1.35
  );

  const baseIntensity = clamp(
    42 * budgetScale * timelineScale * targetScale * impactScale,
    28,
    82
  );

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const values: Record<string, number> = {};

  (Object.entries(scores) as [SliderId, number][]).forEach(([control, score]) => {
    if (score <= 0) {
      values[control] = 0;
      return;
    }

    const share = score / totalScore;
    const rawValue = baseIntensity + share * 95;
    values[control] = clamp(Math.round(rawValue), 18, 100);
  });

  return values;
}

function buildPolicyDescription(policy: GeneratedPolicy): string {
  if (policy.description && policy.description.trim().length > 0) {
    return policy.description.trim();
  }

  const reasons = policy.mutations
    .map((mutation) => mutation.reason?.trim())
    .filter((reason): reason is string => Boolean(reason));

  if (reasons.length > 0) {
    return reasons.slice(0, 2).join(" ");
  }

  return "AI-generated policy bundle translated into the available mitigation controls for this dashboard.";
}

export function AIPolicyGenerator() {
  const { setPolicyValues } = useGlobalState();
  const [targetAQI, setTargetAQI] = useState(100);
  const [budget, setBudget] = useState("Medium");
  const [timeline, setTimeline] = useState("3yr");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPolicy, setGeneratedPolicy] = useState<GeneratedPolicy | null>(null);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const researchQuery = buildResearchQuery(targetAQI, budget, timeline);
      const graphContext = {
        nodes: initialNodes.map((node) => ({
          id: node.id,
          label: node.data.label,
          type: node.data.type,
        })),
        edges: initialEdges.map((edge) => ({
          source: edge.source,
          target: edge.target,
          weight:
            typeof edge.data?.weight === "number" ? edge.data.weight : 0.5,
        })),
      };

      const response = await fetch(`${API_BASE_URL}/api/generate-policy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          research_query: researchQuery,
          graph_context: graphContext,
        }),
      });

      if (!response.ok) {
        let backendMessage = "";
        try {
          const errorPayload = await response.json();
          backendMessage = errorPayload?.error || errorPayload?.message || "";
        } catch {
          backendMessage = "";
        }

        if (backendMessage) {
          throw new Error(`AI policy request failed (${response.status}): ${backendMessage}`);
        }

        throw new Error(`AI policy request failed (${response.status})`);
      }

      const data: GeneratePolicyResponse = await response.json();
      if (!data.policy) {
        throw new Error("AI policy response did not include a policy.");
      }

      const evidence = data.research_evidence ?? [];
      const sliderValues = mapPolicyToSliderValues(
        data.policy,
        targetAQI,
        budget,
        timeline,
        evidence
      );

      setPolicyValues(sliderValues);
      setGeneratedPolicy(data.policy);
      setEvidenceCount(evidence.length);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "AI policy generation failed.";
      setError(message);
      setGeneratedPolicy(null);
      setEvidenceCount(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const confidence = generatedPolicy?.source_research?.confidence ??
    generatedPolicy?.estimated_impacts?.confidence;
  const policyDescription = generatedPolicy
    ? buildPolicyDescription(generatedPolicy)
    : null;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="glass-panel p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">AI Policy Generator</h3>
                <p className="text-xs text-white/40">
                  Uses the backend policy model to generate a slider-ready intervention bundle
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5 block">
                  <Target className="w-3 h-3" />
                  Target AQI
                </label>
                <input
                  type="number"
                  value={targetAQI}
                  onChange={(e) => setTargetAQI(parseInt(e.target.value, 10) || 100)}
                  min={50}
                  max={300}
                  className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5 block">
                  <Wallet className="w-3 h-3" />
                  Budget
                </label>
                <div className="relative">
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <option value="Low" className="bg-slate-900">Low</option>
                    <option value="Medium" className="bg-slate-900">Medium</option>
                    <option value="High" className="bg-slate-900">High</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5 block">
                  <Clock className="w-3 h-3" />
                  Timeline
                </label>
                <div className="relative">
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <option value="1yr" className="bg-slate-900">1 Year</option>
                    <option value="3yr" className="bg-slate-900">3 Years</option>
                    <option value="5yr" className="bg-slate-900">5 Years</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    isGenerating
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/20 hover:shadow-purple-500/30"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate Policy
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 relative z-10">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm text-red-300 font-medium">
                    AI policy generation failed
                  </div>
                  <div className="text-xs text-red-200/70 mt-1">
                    {error}
                  </div>
                </div>
              </div>
            )}

            {generatedPolicy && !error && (
              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-purple-300" />
                  <span className="text-sm text-purple-200 font-semibold">
                    {generatedPolicy.name}
                  </span>
                  {typeof confidence === "number" && (
                    <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                      Confidence {Math.round(confidence * 100)}%
                    </span>
                  )}
                  <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                    {evidenceCount} evidence {evidenceCount === 1 ? "chunk" : "chunks"}
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3 mb-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/45 mb-1">
                    Policy Description
                  </div>
                  <p className="text-sm text-white/75 leading-relaxed">
                    {policyDescription}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-300/60 mb-1">
                      Est. CO2 Reduction
                    </div>
                    <div className="text-lg font-bold text-emerald-300">
                      {(generatedPolicy.estimated_impacts?.co2_reduction_pct ?? 0).toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/8 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-cyan-300/60 mb-1">
                      Est. AQI Improvement
                    </div>
                    <div className="text-lg font-bold text-cyan-300">
                      {(generatedPolicy.estimated_impacts?.aqi_improvement_pct ?? 0).toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-white/45 mb-1">
                      Slider Mapping
                    </div>
                    <div className="text-sm text-white/70">
                      AI policy translated into the available policy controls above
                    </div>
                  </div>
                </div>

                {generatedPolicy.mutations.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-[11px] uppercase tracking-wider text-white/45 mb-2 flex items-center gap-2">
                      <FlaskConical className="w-3.5 h-3.5" />
                      Primary AI Recommendations
                    </div>
                    <ul className="space-y-2">
                      {generatedPolicy.mutations.slice(0, 3).map((mutation, index) => (
                        <li
                          key={`${generatedPolicy.policy_id}-${index}`}
                          className="text-sm text-white/70 leading-relaxed"
                        >
                          {mutation.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
