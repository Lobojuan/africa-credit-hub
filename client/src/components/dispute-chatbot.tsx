import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bot, User, Send, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Borrower, CreditAccount } from "@shared/schema";

interface Message {
  role: "bot" | "user";
  text: string;
  options?: string[];
}

type Step = "greeting" | "issue_type" | "borrower_search" | "select_borrower" | "select_account" | "description" | "confirm" | "done";

const DISPUTE_TYPES = ["incorrect_balance", "wrong_status", "identity_error", "unauthorized_inquiry", "other"];

export function DisputeChatbot() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("greeting");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [disputeType, setDisputeType] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: searchResults } = useQuery<Borrower[]>({
    queryKey: [`/api/borrowers?search=${encodeURIComponent(searchQuery)}`],
    enabled: searchQuery.length >= 2 && step === "select_borrower",
  });

  const { data: accounts } = useQuery<CreditAccount[]>({
    queryKey: [`/api/credit-accounts?borrowerId=${selectedBorrower?.id}`],
    enabled: !!selectedBorrower && step === "select_account",
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        borrowerId: selectedBorrower!.id,
        disputeType,
        description,
        correctionType: disputeType === "incorrect_balance" ? "financial" : "non_financial",
      };
      if (selectedAccount) payload.creditAccountId = selectedAccount.id;
      const res = await apiRequest("POST", "/api/disputes", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      addBot(t("chatbot.success"));
      setStep("done");
    },
    onError: (e: Error) => {
      addBot(t("chatbot.error") + ": " + e.message);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const addBot = (text: string, options?: string[]) => {
    setMessages((m) => [...m, { role: "bot", text, options }]);
  };

  const addUser = (text: string) => {
    setMessages((m) => [...m, { role: "user", text }]);
  };

  const startChat = () => {
    setMessages([]);
    setStep("greeting");
    setDisputeType("");
    setSelectedBorrower(null);
    setSelectedAccount(null);
    setDescription("");
    setSearchQuery("");
    setInput("");
    addBot(t("chatbot.greeting"), DISPUTE_TYPES.map((d) => t(`disputes.types.${d}`)));
    setStep("issue_type");
  };

  const handleOptionClick = (option: string) => {
    if (step === "issue_type") {
      const idx = DISPUTE_TYPES.findIndex((d) => t(`disputes.types.${d}`) === option);
      if (idx >= 0) {
        setDisputeType(DISPUTE_TYPES[idx]);
        addUser(option);
        addBot(t("chatbot.askBorrower"));
        setStep("borrower_search");
      }
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    if (step === "borrower_search") {
      addUser(text);
      setSearchQuery(text);
      addBot(t("chatbot.searching"));
      setStep("select_borrower");
    } else if (step === "description") {
      addUser(text);
      setDescription(text);
      const borrowerName = selectedBorrower?.type === "corporate"
        ? selectedBorrower.companyName
        : `${selectedBorrower?.firstName} ${selectedBorrower?.lastName}`;
      addBot(
        t("chatbot.confirmSummary", {
          type: t(`helpdesk.disputeTypes.${disputeType}`),
          borrower: borrowerName,
          account: selectedAccount?.accountNumber || t("chatbot.noAccount"),
          description: text,
        }),
        [t("chatbot.submit"), t("chatbot.cancel")]
      );
      setStep("confirm");
    }
  };

  const handleBorrowerSelect = (borrower: Borrower) => {
    setSelectedBorrower(borrower);
    const name = borrower.type === "corporate" ? borrower.companyName : `${borrower.firstName} ${borrower.lastName}`;
    addUser(name || "");
    addBot(t("chatbot.askAccount"));
    setStep("select_account");
  };

  const handleAccountSelect = (account: CreditAccount | null) => {
    setSelectedAccount(account);
    addUser(account ? account.accountNumber : t("chatbot.skipAccount"));
    addBot(t("chatbot.askDescription"));
    setStep("description");
  };

  const handleConfirmAction = (action: string) => {
    if (action === t("chatbot.submit")) {
      addUser(t("chatbot.submit"));
      submitMutation.mutate();
    } else {
      addUser(t("chatbot.cancel"));
      addBot(t("chatbot.cancelled"));
      setStep("done");
    }
  };

  if (!open) {
    return (
      <Button
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-50"
        onClick={() => { setOpen(true); startChat(); }}
        data-testid="button-open-chatbot"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[380px] h-[520px] flex flex-col shadow-2xl z-50 overflow-hidden" data-testid="chatbot-container">
      <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold text-sm">{t("chatbot.title")}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary/80" onClick={() => setOpen(false)} data-testid="button-close-chatbot">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "bot" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-2.5`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              {msg.options && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.options.map((opt) => (
                    <Badge
                      key={opt}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs px-2 py-0.5"
                      onClick={() => {
                        if (step === "issue_type") handleOptionClick(opt);
                        else if (step === "confirm") handleConfirmAction(opt);
                      }}
                      data-testid={`button-option-${opt.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {opt}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {step === "select_borrower" && searchResults && searchResults.length > 0 && (
          <div className="space-y-1.5">
            {(Array.isArray(searchResults) ? searchResults : []).slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="p-2 rounded-md border cursor-pointer hover:bg-muted text-sm"
                onClick={() => handleBorrowerSelect(b)}
                data-testid={`chatbot-borrower-${b.id}`}
              >
                <p className="font-medium">{b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`}</p>
                <p className="text-xs text-muted-foreground">{b.nationalId}</p>
              </div>
            ))}
          </div>
        )}

        {step === "select_account" && accounts && (
          <div className="space-y-1.5">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="p-2 rounded-md border cursor-pointer hover:bg-muted text-sm"
                onClick={() => handleAccountSelect(a)}
                data-testid={`chatbot-account-${a.id}`}
              >
                <p className="font-medium">{a.accountNumber}</p>
                <p className="text-xs text-muted-foreground">{a.accountType} - {a.status}</p>
              </div>
            ))}
            <div
              className="p-2 rounded-md border cursor-pointer hover:bg-muted text-sm text-muted-foreground"
              onClick={() => handleAccountSelect(null)}
              data-testid="chatbot-skip-account"
            >
              {t("chatbot.skipAccount")}
            </div>
          </div>
        )}
      </div>

      {(step === "borrower_search" || step === "description") && (
        <div className="p-3 border-t flex gap-2">
          <Input
            data-testid="input-chatbot-message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={step === "borrower_search" ? t("chatbot.searchPlaceholder") : t("chatbot.describePlaceholder")}
            className="h-9 text-sm"
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} data-testid="button-chatbot-send">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {step === "done" && (
        <div className="p-3 border-t">
          <Button className="w-full" variant="outline" size="sm" onClick={startChat} data-testid="button-chatbot-restart">
            {t("chatbot.startNew")}
          </Button>
        </div>
      )}
    </Card>
  );
}
