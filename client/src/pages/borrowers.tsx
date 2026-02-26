import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, Building2, User, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Borrower } from "@shared/schema";

export default function BorrowersPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: borrowers, isLoading } = useQuery<Borrower[]>({
    queryKey: [search ? `/api/borrowers?search=${encodeURIComponent(search)}` : "/api/borrowers"],
  });

  const [formData, setFormData] = useState({
    type: "individual" as "individual" | "corporate",
    firstName: "", lastName: "", companyName: "", nationalId: "",
    dateOfBirth: "", gender: "", phone: "", email: "",
    address: "", city: "", region: "",
    employerName: "", occupation: "", businessRegNumber: "", sector: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/borrowers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/borrowers"] });
      setDialogOpen(false);
      setFormData({ type: "individual", firstName: "", lastName: "", companyName: "", nationalId: "", dateOfBirth: "", gender: "", phone: "", email: "", address: "", city: "", region: "", employerName: "", occupation: "", businessRegNumber: "", sector: "" });
      toast({ title: "Borrower registered successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-borrowers-title">Borrowers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage individual and corporate borrower records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-borrower">
              <Plus className="w-4 h-4 mr-2" />
              Register Borrower
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Borrower</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-add-borrower">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as "individual" | "corporate" })}>
                  <SelectTrigger data-testid="select-borrower-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type === "individual" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>First Name</Label><Input data-testid="input-first-name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required /></div>
                    <div><Label>Last Name</Label><Input data-testid="input-last-name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Date of Birth</Label><Input data-testid="input-dob" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
                    <div>
                      <Label>Gender</Label>
                      <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger data-testid="select-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Employer</Label><Input data-testid="input-employer" value={formData.employerName} onChange={(e) => setFormData({ ...formData, employerName: e.target.value })} /></div>
                    <div><Label>Occupation</Label><Input data-testid="input-occupation" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} /></div>
                  </div>
                </>
              ) : (
                <>
                  <div><Label>Company Name</Label><Input data-testid="input-company-name" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required /></div>
                  <div><Label>Business Registration No.</Label><Input data-testid="input-business-reg" value={formData.businessRegNumber} onChange={(e) => setFormData({ ...formData, businessRegNumber: e.target.value })} /></div>
                </>
              )}
              <div><Label>National ID / Tax ID</Label><Input data-testid="input-national-id" value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input data-testid="input-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input data-testid="input-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              </div>
              <div><Label>Address</Label><Input data-testid="input-address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>City</Label><Input data-testid="input-city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
                <div><Label>Region</Label><Input data-testid="input-region" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} /></div>
              </div>
              <div><Label>Sector</Label><Input data-testid="input-sector" value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-borrower">
                {createMutation.isPending ? "Registering..." : "Register Borrower"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-testid="input-search-borrowers"
          placeholder="Search by name, ID, phone, email..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : borrowers && borrowers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {borrowers.map((borrower) => (
            <Card
              key={borrower.id}
              className="cursor-pointer hover-elevate"
              onClick={() => navigate(`/borrowers/${borrower.id}`)}
              data-testid={`card-borrower-${borrower.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent shrink-0">
                      {borrower.type === "corporate" ? (
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {borrower.type === "corporate" ? borrower.companyName : `${borrower.firstName} ${borrower.lastName}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{borrower.nationalId}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] capitalize">{borrower.type}</Badge>
                  {borrower.sector && <Badge variant="outline" className="text-[10px]">{borrower.sector}</Badge>}
                  {borrower.city && <Badge variant="outline" className="text-[10px]">{borrower.city}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold">No borrowers found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try adjusting your search terms" : "Register your first borrower to get started"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
