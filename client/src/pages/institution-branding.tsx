import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Palette, Save, RefreshCw, Globe, Mail, Phone, Eye } from "lucide-react";

export default function InstitutionBrandingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: branding, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/institution-branding"],
    queryFn: () => fetch("/api/institution-branding", { credentials: "include" }).then(r => r.json()),
  });

  const [form, setForm] = useState({
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    logoUrl: "",
    tagline: "",
    supportEmail: "",
    supportPhone: "",
    footerText: "",
    customDomain: "",
  });

  useEffect(() => {
    if (branding) {
      setForm({
        primaryColor: branding.primaryColor || "#6366f1",
        secondaryColor: branding.secondaryColor || "#8b5cf6",
        logoUrl: branding.logoUrl || "",
        tagline: branding.tagline || "",
        supportEmail: branding.supportEmail || "",
        supportPhone: branding.supportPhone || "",
        footerText: branding.footerText || "",
        customDomain: branding.customDomain || "",
      });
    }
  }, [branding]);

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/institution-branding", data),
    onSuccess: () => {
      toast({ title: "Branding saved", description: "Your institution branding has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/institution-branding"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSave = () => {
    mutation.mutate(form);
  };

  const f = (key: string) => (e: any) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">White-Label Branding</h1>
          <p className="text-muted-foreground">Customize the Universal Credit Hub portal for your institution</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="btn-refresh-branding"><RefreshCw className="w-4 h-4" /></Button>
          <Button data-testid="btn-save-branding" onClick={handleSave} disabled={mutation.isPending} className="gap-2">
            <Save className="w-4 h-4" /> {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" /> Visual Identity</CardTitle>
              <CardDescription>Colors and logo for your institution's portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo URL</Label>
                <Input data-testid="input-logo-url" placeholder="https://your-institution.com/logo.png" value={form.logoUrl} onChange={f("logoUrl")} />
                <p className="text-xs text-muted-foreground mt-1">Paste a direct URL to your logo image (PNG, SVG recommended)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={form.primaryColor} onChange={f("primaryColor")} className="w-10 h-9 rounded border cursor-pointer" data-testid="input-primary-color" />
                    <Input value={form.primaryColor} onChange={f("primaryColor")} placeholder="#6366f1" className="font-mono text-sm" />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={form.secondaryColor} onChange={f("secondaryColor")} className="w-10 h-9 rounded border cursor-pointer" data-testid="input-secondary-color" />
                    <Input value={form.secondaryColor} onChange={f("secondaryColor")} placeholder="#8b5cf6" className="font-mono text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <Label>Tagline</Label>
                <Input data-testid="input-tagline" placeholder="e.g. Empowering Credit in Africa" value={form.tagline} onChange={f("tagline")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> Contact & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Support Email</Label>
                <Input data-testid="input-support-email" type="email" placeholder="support@your-institution.com" value={form.supportEmail} onChange={f("supportEmail")} />
              </div>
              <div>
                <Label>Support Phone</Label>
                <Input data-testid="input-support-phone" placeholder="+233 XX XXX XXXX" value={form.supportPhone} onChange={f("supportPhone")} />
              </div>
              <div>
                <Label>Footer Text</Label>
                <Textarea data-testid="input-footer-text" placeholder="© 2025 Your Institution Ltd. All rights reserved." value={form.footerText} onChange={f("footerText")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Custom Domain</CardTitle>
              <CardDescription>White-label the portal under your own domain (requires DNS setup)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Custom Domain</Label>
                <Input data-testid="input-custom-domain" placeholder="creditportal.your-institution.com" value={form.customDomain} onChange={f("customDomain")} />
                <p className="text-xs text-muted-foreground mt-1">Contact support to activate DNS pointing and TLS certificate</p>
              </div>
              {form.customDomain && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Pending DNS setup</Badge>
                  <span className="text-xs text-muted-foreground">— contact support@universalcredithub.com to complete activation</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> Portal Preview</CardTitle>
              <CardDescription>How the consumer portal header will look with your branding</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                {/* Preview header */}
                <div className="p-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}>
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="h-10 w-auto object-contain bg-white/20 rounded p-1" onError={e => { (e.target as any).style.display = "none"; }} />
                  ) : (
                    <div className="h-10 w-10 bg-white/20 rounded flex items-center justify-center text-white font-bold text-lg">
                      {(user?.username || "I")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-white font-bold text-sm">{(user?.organization as any)?.name || user?.organization || "Your Institution"}</div>
                    {form.tagline && <div className="text-white/80 text-xs">{form.tagline}</div>}
                  </div>
                </div>
                {/* Preview body */}
                <div className="p-4 bg-background space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="mt-3 p-3 rounded" style={{ background: `${form.primaryColor}15`, border: `1px solid ${form.primaryColor}30` }}>
                    <div className="text-xs font-medium" style={{ color: form.primaryColor }}>Credit Score</div>
                    <div className="text-2xl font-bold mt-1" style={{ color: form.primaryColor }}>724</div>
                  </div>
                </div>
                {/* Preview footer */}
                {(form.footerText || form.supportEmail) && (
                  <div className="px-4 py-2 bg-muted/50 border-t">
                    <div className="text-xs text-muted-foreground">{form.footerText || `Support: ${form.supportEmail}`}</div>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {form.supportEmail && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" /><span>{form.supportEmail}</span>
                  </div>
                )}
                {form.supportPhone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" /><span>{form.supportPhone}</span>
                  </div>
                )}
                {form.customDomain && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-4 h-4" /><span>{form.customDomain}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
