"use client";
import { useEffect, useState } from "react";

type LadderItem = { name: string; severity: number; why_it_matters: string };

export default function ReportLite() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/diagnostic-lite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboarding: {}, answers: [] })
        });
        if (!res.ok) throw new Error("Failed to generate")
        setData(await res.json());
      } catch (e) {
        setError("Failed to generate diagnostic lite");
      }
    })();
  }, []);

  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!data) return <div className="p-6">Generating…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Colour Badge */}
      <section className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full border" style={{ backgroundColor: data.colour_profile.hex }} />
        <div>
          <h1 className="text-xl font-semibold">{data.colour_profile.dominant_colour}</h1>
          <p className="opacity-80">{data.colour_profile.meaning}</p>
          {data.colour_profile.secondary && (
            <p className="text-xs opacity-70">
              Secondary: {data.colour_profile.secondary.colour} ({data.colour_profile.secondary.weight}%)
            </p>
          )}
        </div>
      </section>

      {/* Hierarchy of Avoidance */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Hierarchy of Avoidance</h2>
        <div className="space-y-2">
          {data.avoidance_ladder.map((item: LadderItem, i: number) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{i + 1}. {item.name}</span>
                <span className="text-sm opacity-70">Severity {item.severity}/5</span>
              </div>
              <p className="text-sm opacity-80">{item.why_it_matters}</p>
              <div className="mt-2 h-2 bg-muted rounded">
                <div className="h-2 rounded" style={{ width: `${item.severity * 18}%`, backgroundColor: data.colour_profile.hex }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Blocker */}
      <section className="rounded-xl border p-4 bg-orange-50/5">
        <h2 className="text-lg font-semibold">Core Blocker: {data.core_blocker.label}</h2>
        <ul className="list-disc ml-6 my-2">
          {data.core_blocker.evidence.map((e: string, idx: number) => <li key={idx}>{e}</li>)}
        </ul>
        <p><b>Starter action:</b> {data.core_blocker.starter_action}</p>
      </section>

      {/* Activation Kit (7-Day) */}
      <section className="rounded-xl border p-4">
        <h2 className="text-lg font-semibold">Activation Kit (7-Day)</h2>
        <div className="mt-2">
          <h3 className="font-medium">Baseline Regulation Protocol</h3>
          <ol className="list-decimal ml-6">
            {data.activation_kit.brp.map((step: string, i: number) => <li key={i}>{step}</li>)}
          </ol>
        </div>
        <div className="mt-3">
          <h3 className="font-medium">Boundary Script</h3>
          <p className="italic">“{data.activation_kit.boundary_script}”</p>
        </div>
        <div className="mt-3">
          <h3 className="font-medium">Micro-Exposure</h3>
          <p><b>Target:</b> {data.activation_kit.micro_exposure.target}</p>
          <p><b>Duration:</b> {data.activation_kit.micro_exposure.duration_min} min</p>
          <p><b>If-Then plan:</b> {data.activation_kit.micro_exposure.if_then_plan}</p>
        </div>
      </section>
    </div>
  );
}


