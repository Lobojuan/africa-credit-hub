export function getBorrowerAvatarUrl(borrowerId: string, name: string, type: "individual" | "corporate"): string {
  const seed = encodeURIComponent(borrowerId);
  if (type === "corporate") {
    return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&size=200`;
  }
  return `https://api.dicebear.com/9.x/personas/svg?seed=${seed}&size=200`;
}

export function getAvatarFallbackInitials(borrower: { type: string; firstName?: string | null; lastName?: string | null; companyName?: string | null }): string {
  if (borrower.type === "corporate") {
    return (borrower.companyName || "CO").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }
  return `${(borrower.firstName || "?")[0]}${(borrower.lastName || "?")[0]}`.toUpperCase();
}
