"use client";

export function FilterSelect({ label, value, onChange, options }: { label?: string; value: string; onChange: (value:string)=>void; options:{value:string;label:string}[] }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={e=>onChange(e.target.value)}
      className="h-10 min-w-[132px] rounded-[5px] border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-sm outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 dark:bg-white/[0.025] dark:text-slate-200 dark:shadow-none"
    >
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
