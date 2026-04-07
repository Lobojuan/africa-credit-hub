import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, ArrowLeft, Presentation } from "lucide-react";

const PRESENTATION_URL = "https://achpresentation.lovable.app/";

export default function PresentationPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "super_admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  const handleLaunch = () => {
    window.open(PRESENTATION_URL, "_blank", "noopener,noreferrer");
    setLaunched(true);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6" data-testid="presentation-page">
      <Card className="max-w-lg w-full border-border/40">
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Presentation className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Africa Credit Hub</h1>
            <p className="text-sm text-muted-foreground">Investor & Stakeholder Presentation</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Launch the full interactive presentation in a new window. This includes platform overview, market analysis, feature showcase, and regulatory compliance details.
          </p>
          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full gap-2" onClick={handleLaunch} data-testid="button-launch-presentation">
              <ExternalLink className="w-4 h-4" />
              {launched ? "Open Again" : "Launch Presentation"}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
          {launched && (
            <p className="text-xs text-muted-foreground animate-in fade-in">
              Presentation opened in a new tab.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
