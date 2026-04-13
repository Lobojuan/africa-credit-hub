import { useEffect } from "react";
import { useLocation } from "wouter";

export default function PricingPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate("/contact-sales", { replace: true });
  }, [navigate]);

  return null;
}
