export function getStatusBadgeVariant(status: string):
  "default" | "secondary" | "destructive" | "outline" {
  const s = status?.toLowerCase();
  if (["active","approved","current","paid","resolved","verified","sent"].includes(s))
    return "default";
  if (["pending","pending_review","submitted","processing","partial"].includes(s))
    return "secondary";
  if (["default","delinquent","overdue","rejected","failed","suspended","breached"].includes(s))
    return "destructive";
  return "outline";
}

export function getStatusBadgeClass(status: string): string {
  const s = status?.toLowerCase();
  if (["active","approved","current","paid","resolved","verified","sent"].includes(s))
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
  if (["pending","pending_review","submitted","processing","partial"].includes(s))
    return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
  if (["default","delinquent","overdue","rejected","failed","suspended","breached"].includes(s))
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}
