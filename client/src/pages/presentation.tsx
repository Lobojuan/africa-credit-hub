import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function PresentationPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "super_admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background" data-testid="presentation-page">
      <iframe
        src="https://achpresentation.lovable.app/"
        className="w-full h-full border-0"
        title="Africa Credit Hub Presentation"
        allow="fullscreen"
        data-testid="iframe-presentation"
      />
    </div>
  );
}
