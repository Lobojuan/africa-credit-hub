import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FileWarning, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Item = { id:string; borrower_id:string; first_name?:string; last_name?:string; company_name?:string; created_at:string; result?:string; provider?:string; method?:string; error_message?:string; granted_to?:string; purpose?:string; consent_method?:string; data_subject_confirmed?:boolean; expires_at?:string };
const name = (x:Item) => x.company_name || [x.first_name,x.last_name].filter(Boolean).join(" ") || "Unnamed borrower";
export default function ForgeryReviewPage() {
 const {data,isLoading}=useQuery<{identity:Item[];consent:Item[]}>({queryKey:["/api/forgery-review"]}); const identity=data?.identity||[], consent=data?.consent||[];
 const row=(x:Item, kind:string, detail:string)=><div key={`${kind}-${x.id}`} className="flex items-center justify-between gap-3 border-b py-3 last:border-0"><div><p className="font-medium">{name(x)}</p><p className="text-sm text-muted-foreground">{detail}</p></div><Link href={`/borrowers/${x.borrower_id}`}><Button size="sm" variant="outline">Review</Button></Link></div>;
 return <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8" data-testid="forgery-review-desk"><header><p className="text-xs font-semibold uppercase tracking-widest text-primary">Fraud and consent control</p><h1 className="mt-2 text-3xl font-bold">Forgery Review Desk</h1><p className="mt-2 text-muted-foreground">Identity and consent evidence that requires a human decision.</p></header><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle className="flex gap-2"><FileWarning className="text-red-600"/>Identity/document exceptions <Badge>{identity.length}</Badge></CardTitle></CardHeader><CardContent>{isLoading?"Loading…":identity.length?identity.map(x=>row(x,"identity",`${x.provider||"Verification"} · ${x.method||"check"} · ${x.result||"review"}${x.error_message?` · ${x.error_message}`:""}`)):<p className="text-muted-foreground">No identity exceptions.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="flex gap-2"><ShieldCheck className="text-amber-600"/>Consent evidence gaps <Badge>{consent.length}</Badge></CardTitle></CardHeader><CardContent>{isLoading?"Loading…":consent.length?consent.map(x=>row(x,"consent",`${x.purpose} · ${x.granted_to} · ${x.data_subject_confirmed?"expired":"not confirmed"}`)):<p className="text-muted-foreground">No consent evidence gaps.</p>}</CardContent></Card></div><Link href="/compliance-queue"><Button variant="outline">Open audited Compliance Queue</Button></Link></main>;
}
