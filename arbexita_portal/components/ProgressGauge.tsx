"use client";
export function ProgressGauge({ value }: { value: number }) {
  // Simple semantic gauge without heavy chart libs
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const color =
    v >= 85 ? "bg-green-500" :
    v >= 60 ? "bg-amber-500" :
    "bg-red-500";

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="h2">Compliance Score</div>
          <div className="small">SAM-status för er organisation</div>
        </div>
        <span className="badge badge-amber">{v}%</span>
      </div>

      <div className="mt-4">
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
          <div className={"h-full " + color} style={{ width: `${v}%` }} />
        </div>
        <div className="mt-3 text-4xl font-semibold">{v}%</div>
        <div className="small">
          {v >= 85 ? "Mycket bra – håll uppe rutinerna." :
           v >= 60 ? "Bra – några saker återstår." :
           "Varning – flera obligatoriska delar saknas."}
        </div>
      </div>
    </div>
  );
}
