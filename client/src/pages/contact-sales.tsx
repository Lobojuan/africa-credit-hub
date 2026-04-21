import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Building2, Mail, Phone, MapPin, ArrowLeft, Send, Shield, Globe, Loader2 } from "lucide-react";
import { PLATFORM_CONTACT_PHONE } from "@/lib/platform-config";

export default function ContactSalesPage() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const urlTier = new URLSearchParams(window.location.search).get("tier") || "";
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    title: "",
    country: "",
    tier: urlTier,
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.organization) {
      toast({ title: "Required fields", description: "Please fill in your name, email, and organization.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
        toast({ title: "Message sent", description: "Our team will be in touch within 24 hours." });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Error", description: data.message || "Failed to send. Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto">
              <Send className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold" data-testid="text-contact-success">Thank you for reaching out</h2>
            <p className="text-muted-foreground">
              Our enterprise team will review your inquiry and get back to you within 24 hours.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" data-testid="link-back-home">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" data-testid="text-contact-title">
                Let's build Africa's credit future together
              </h1>
              <p className="mt-3 text-muted-foreground">
                Whether you're a commercial bank exploring integration or a central bank seeking sovereign infrastructure, our team is ready to discuss your needs.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a href="mailto:sales@africacredithub.com" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-email">
                    sales@africacredithub.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a href={`tel:${PLATFORM_CONTACT_PHONE}`} className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-phone">
                    {PLATFORM_CONTACT_PHONE || "Contact us"}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Headquarters</p>
                  <p className="text-sm text-muted-foreground">Accra, Ghana</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-teal-500" />
                <span>ISO 27001 compliant infrastructure</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="w-4 h-4 text-teal-500" />
                <span>Serving 54 African jurisdictions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4 text-teal-500" />
                <span>Trusted by central banks & Tier-1 institutions</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Contact our Enterprise Team</CardTitle>
                <CardDescription>Fill out the form and we'll get back to you within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-contact-sales">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-contact-name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Work Email *</Label>
                      <Input id="email" type="email" placeholder="you@institution.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-contact-email" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="+233..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-contact-phone" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="title">Job Title</Label>
                      <Input id="title" placeholder="CTO, Head of Credit, etc." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-contact-title" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="organization">Organization *</Label>
                      <Input id="organization" placeholder="Your institution name" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} data-testid="input-contact-org" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" placeholder="e.g. Ghana, Nigeria, Kenya" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} data-testid="input-contact-country" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>I'm interested in</Label>
                    <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                      <SelectTrigger data-testid="select-contact-tier">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial — Tier-1/2 Banks</SelectItem>
                        <SelectItem value="sovereign">Sovereign — Central Banks & Regulators</SelectItem>
                        <SelectItem value="custom">Custom / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Tell us about your needs, current infrastructure, timeline, or any questions..." rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="input-contact-message" />
                  </div>

                  <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={sending} data-testid="button-submit-contact">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {sending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
