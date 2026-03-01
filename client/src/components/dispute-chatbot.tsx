import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bot, User, Send, X, MessageCircle, HelpCircle, FileWarning } from "lucide-react";
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

type Mode = "menu" | "dispute" | "faq";
type DisputeStep = "issue_type" | "borrower_search" | "select_borrower" | "select_account" | "description" | "confirm" | "done";
type FaqStep = "categories" | "questions" | "answer" | "search";

const DISPUTE_TYPES = ["incorrect_balance", "wrong_status", "identity_error", "unauthorized_inquiry", "other"];

interface FaqItem {
  q: string;
  a: string;
}

function buildFaqData(t: (key: string) => string): Record<string, { label: string; items: FaqItem[] }> {
  return {
    getting_started: {
      label: t("faq.categories.getting_started"),
      items: [
        { q: t("faq.gs.q1"), a: t("faq.gs.a1") },
        { q: t("faq.gs.q2"), a: t("faq.gs.a2") },
        { q: t("faq.gs.q3"), a: t("faq.gs.a3") },
        { q: t("faq.gs.q4"), a: t("faq.gs.a4") },
        { q: t("faq.gs.q5"), a: t("faq.gs.a5") },
      ],
    },
    borrowers: {
      label: t("faq.categories.borrowers"),
      items: [
        { q: t("faq.bor.q1"), a: t("faq.bor.a1") },
        { q: t("faq.bor.q2"), a: t("faq.bor.a2") },
        { q: t("faq.bor.q3"), a: t("faq.bor.a3") },
        { q: t("faq.bor.q4"), a: t("faq.bor.a4") },
        { q: t("faq.bor.q5"), a: t("faq.bor.a5") },
      ],
    },
    credit_accounts: {
      label: t("faq.categories.credit_accounts"),
      items: [
        { q: t("faq.ca.q1"), a: t("faq.ca.a1") },
        { q: t("faq.ca.q2"), a: t("faq.ca.a2") },
        { q: t("faq.ca.q3"), a: t("faq.ca.a3") },
        { q: t("faq.ca.q4"), a: t("faq.ca.a4") },
      ],
    },
    credit_reports: {
      label: t("faq.categories.credit_reports"),
      items: [
        { q: t("faq.cr.q1"), a: t("faq.cr.a1") },
        { q: t("faq.cr.q2"), a: t("faq.cr.a2") },
        { q: t("faq.cr.q3"), a: t("faq.cr.a3") },
        { q: t("faq.cr.q4"), a: t("faq.cr.a4") },
      ],
    },
    disputes: {
      label: t("faq.categories.disputes"),
      items: [
        { q: t("faq.dis.q1"), a: t("faq.dis.a1") },
        { q: t("faq.dis.q2"), a: t("faq.dis.a2") },
        { q: t("faq.dis.q3"), a: t("faq.dis.a3") },
        { q: t("faq.dis.q4"), a: t("faq.dis.a4") },
      ],
    },
    approvals: {
      label: t("faq.categories.approvals"),
      items: [
        { q: t("faq.appr.q1"), a: t("faq.appr.a1") },
        { q: t("faq.appr.q2"), a: t("faq.appr.a2") },
        { q: t("faq.appr.q3"), a: t("faq.appr.a3") },
      ],
    },
    security: {
      label: t("faq.categories.security"),
      items: [
        { q: t("faq.sec.q1"), a: t("faq.sec.a1") },
        { q: t("faq.sec.q2"), a: t("faq.sec.a2") },
        { q: t("faq.sec.q3"), a: t("faq.sec.a3") },
        { q: t("faq.sec.q4"), a: t("faq.sec.a4") },
        { q: t("faq.sec.q5"), a: t("faq.sec.a5") },
      ],
    },
    batch_upload: {
      label: t("faq.categories.batch_upload"),
      items: [
        { q: t("faq.bu.q1"), a: t("faq.bu.a1") },
        { q: t("faq.bu.q2"), a: t("faq.bu.a2") },
        { q: t("faq.bu.q3"), a: t("faq.bu.a3") },
      ],
    },
    institutions: {
      label: t("faq.categories.institutions"),
      items: [
        { q: t("faq.inst.q1"), a: t("faq.inst.a1") },
        { q: t("faq.inst.q2"), a: t("faq.inst.a2") },
        { q: t("faq.inst.q3"), a: t("faq.inst.a3") },
      ],
    },
    billing: {
      label: t("faq.categories.billing"),
      items: [
        { q: t("faq.bill.q1"), a: t("faq.bill.a1") },
        { q: t("faq.bill.q2"), a: t("faq.bill.a2") },
      ],
    },
    consent: {
      label: t("faq.categories.consent"),
      items: [
        { q: t("faq.con.q1"), a: t("faq.con.a1") },
        { q: t("faq.con.q2"), a: t("faq.con.a2") },
        { q: t("faq.con.q3"), a: t("faq.con.a3") },
      ],
    },
    court_judgments: {
      label: t("faq.categories.court_judgments"),
      items: [
        { q: t("faq.cj.q1"), a: t("faq.cj.a1") },
        { q: t("faq.cj.q2"), a: t("faq.cj.a2") },
      ],
    },
    api: {
      label: t("faq.categories.api"),
      items: [
        { q: t("faq.api.q1"), a: t("faq.api.a1") },
        { q: t("faq.api.q2"), a: t("faq.api.a2") },
        { q: t("faq.api.q3"), a: t("faq.api.a3") },
        { q: t("faq.api.q4"), a: t("faq.api.a4") },
      ],
    },
    audit: {
      label: t("faq.categories.audit"),
      items: [
        { q: t("faq.aud.q1"), a: t("faq.aud.a1") },
        { q: t("faq.aud.q2"), a: t("faq.aud.a2") },
        { q: t("faq.aud.q3"), a: t("faq.aud.a3") },
      ],
    },
    general: {
      label: t("faq.categories.general"),
      items: [
        { q: t("faq.gen.q1"), a: t("faq.gen.a1") },
        { q: t("faq.gen.q2"), a: t("faq.gen.a2") },
        { q: t("faq.gen.q3"), a: t("faq.gen.a3") },
        { q: t("faq.gen.q4"), a: t("faq.gen.a4") },
      ],
    },
  };
}

export function DisputeChatbot() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [disputeStep, setDisputeStep] = useState<DisputeStep>("issue_type");
  const [faqStep, setFaqStep] = useState<FaqStep>("categories");
  const [faqCategory, setFaqCategory] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [disputeType, setDisputeType] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const faqData = useMemo(() => buildFaqData(t), [t, i18n.language]);

  const { data: searchResults } = useQuery<Borrower[]>({
    queryKey: [`/api/borrowers?search=${encodeURIComponent(searchQuery)}`],
    enabled: searchQuery.length >= 2 && mode === "dispute" && disputeStep === "select_borrower",
  });

  const { data: accounts } = useQuery<CreditAccount[]>({
    queryKey: [`/api/credit-accounts?borrowerId=${selectedBorrower?.id}`],
    enabled: !!selectedBorrower && mode === "dispute" && disputeStep === "select_account",
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
      setDisputeStep("done");
    },
    onError: (e: Error) => {
      addBot(t("chatbot.error") + ": " + e.message);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      showMainMenu();
    }
  }, [i18n.language]);

  const addBot = (text: string, options?: string[]) => {
    setMessages((m) => [...m, { role: "bot", text, options }]);
  };

  const addUser = (text: string) => {
    setMessages((m) => [...m, { role: "user", text }]);
  };

  const showMainMenu = () => {
    setMessages([]);
    setMode("menu");
    setDisputeStep("issue_type");
    setFaqStep("categories");
    setFaqCategory("");
    setDisputeType("");
    setSelectedBorrower(null);
    setSelectedAccount(null);
    setDescription("");
    setSearchQuery("");
    setInput("");
    addBot(t("chatbot.mainMenu"), [t("chatbot.menuDispute"), t("chatbot.menuFaq"), t("chatbot.menuSearch")]);
  };

  const startDispute = () => {
    setMode("dispute");
    setDisputeStep("issue_type");
    addBot(t("chatbot.greeting"), DISPUTE_TYPES.map((d) => t(`disputes.types.${d}`)));
  };

  const startFaq = () => {
    setMode("faq");
    setFaqStep("categories");
    const cats = Object.keys(faqData).map((k) => faqData[k].label);
    addBot(t("chatbot.faqSelectCategory"), cats);
  };

  const startSearch = () => {
    setMode("faq");
    setFaqStep("search");
    addBot(t("chatbot.faqSearchPrompt"));
  };

  const handleMainMenuClick = (option: string) => {
    addUser(option);
    if (option === t("chatbot.menuDispute")) {
      startDispute();
    } else if (option === t("chatbot.menuFaq")) {
      startFaq();
    } else if (option === t("chatbot.menuSearch")) {
      startSearch();
    }
  };

  const handleFaqCategoryClick = (option: string) => {
    const catKey = Object.keys(faqData).find((k) => faqData[k].label === option);
    if (catKey) {
      setFaqCategory(catKey);
      setFaqStep("questions");
      addUser(option);
      const questions = faqData[catKey].items.map((item) => item.q);
      addBot(t("chatbot.faqSelectQuestion"), questions);
    }
  };

  const handleFaqQuestionClick = (option: string) => {
    const cat = faqData[faqCategory];
    if (cat) {
      const item = cat.items.find((i) => i.q === option);
      if (item) {
        addUser(option);
        setFaqStep("answer");
        addBot(item.a, [t("chatbot.faqAnotherQuestion"), t("chatbot.faqAnotherCategory"), t("chatbot.faqBackToMenu")]);
      }
    }
  };

  const handleFaqNavClick = (option: string) => {
    addUser(option);
    if (option === t("chatbot.faqAnotherQuestion")) {
      setFaqStep("questions");
      const questions = faqData[faqCategory].items.map((item) => item.q);
      addBot(t("chatbot.faqSelectQuestion"), questions);
    } else if (option === t("chatbot.faqAnotherCategory")) {
      setFaqStep("categories");
      const cats = Object.keys(faqData).map((k) => faqData[k].label);
      addBot(t("chatbot.faqSelectCategory"), cats);
    } else if (option === t("chatbot.faqBackToMenu")) {
      showMainMenu();
    }
  };

  const handleFaqSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const results: { category: string; item: FaqItem }[] = [];
    for (const [catKey, cat] of Object.entries(faqData)) {
      for (const item of cat.items) {
        if (item.q.toLowerCase().includes(lowerQuery) || item.a.toLowerCase().includes(lowerQuery)) {
          results.push({ category: cat.label, item });
        }
      }
    }

    if (results.length === 0) {
      addBot(t("chatbot.faqNoResults"), [t("chatbot.faqAnotherCategory"), t("chatbot.faqBackToMenu")]);
      setFaqStep("answer");
    } else {
      const topResults = results.slice(0, 5);
      const questions = topResults.map((r) => r.item.q);
      addBot(t("chatbot.faqSearchResults", { count: String(results.length) }), questions);
      setFaqStep("search_results");
    }
  };

  const handleSearchResultClick = (option: string) => {
    for (const [catKey, cat] of Object.entries(faqData)) {
      const item = cat.items.find((i) => i.q === option);
      if (item) {
        setFaqCategory(catKey);
        addUser(option);
        setFaqStep("answer");
        addBot(item.a, [t("chatbot.faqAnotherQuestion"), t("chatbot.faqAnotherCategory"), t("chatbot.faqBackToMenu")]);
        return;
      }
    }
  };

  const handleDisputeOptionClick = (option: string) => {
    const idx = DISPUTE_TYPES.findIndex((d) => t(`disputes.types.${d}`) === option);
    if (idx >= 0) {
      setDisputeType(DISPUTE_TYPES[idx]);
      addUser(option);
      addBot(t("chatbot.askBorrower"));
      setDisputeStep("borrower_search");
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    if (mode === "faq" && (faqStep === "search" || faqStep === "search_results")) {
      addUser(text);
      handleFaqSearch(text);
      return;
    }

    if (mode === "dispute") {
      if (disputeStep === "borrower_search") {
        addUser(text);
        setSearchQuery(text);
        addBot(t("chatbot.searching"));
        setDisputeStep("select_borrower");
      } else if (disputeStep === "description") {
        addUser(text);
        setDescription(text);
        const borrowerName = selectedBorrower?.type === "corporate"
          ? selectedBorrower.companyName
          : `${selectedBorrower?.firstName} ${selectedBorrower?.lastName}`;
        addBot(
          t("chatbot.confirmSummary", {
            type: t(`disputes.types.${disputeType}`),
            borrower: borrowerName,
            account: selectedAccount?.accountNumber || t("chatbot.noAccount"),
            description: text,
          }),
          [t("chatbot.submit"), t("chatbot.cancel")]
        );
        setDisputeStep("confirm");
      }
    }
  };

  const handleBorrowerSelect = (borrower: Borrower) => {
    setSelectedBorrower(borrower);
    const name = borrower.type === "corporate" ? borrower.companyName : `${borrower.firstName} ${borrower.lastName}`;
    addUser(name || "");
    addBot(t("chatbot.askAccount"));
    setDisputeStep("select_account");
  };

  const handleAccountSelect = (account: CreditAccount | null) => {
    setSelectedAccount(account);
    addUser(account ? account.accountNumber : t("chatbot.skipAccount"));
    addBot(t("chatbot.askDescription"));
    setDisputeStep("description");
  };

  const handleConfirmAction = (action: string) => {
    if (action === t("chatbot.submit")) {
      addUser(t("chatbot.submit"));
      submitMutation.mutate();
    } else {
      addUser(t("chatbot.cancel"));
      addBot(t("chatbot.cancelled"));
      setDisputeStep("done");
    }
  };

  const handleOptionClick = (option: string) => {
    if (mode === "menu") {
      handleMainMenuClick(option);
    } else if (mode === "faq") {
      if (faqStep === "categories") handleFaqCategoryClick(option);
      else if (faqStep === "questions") handleFaqQuestionClick(option);
      else if (faqStep === "answer") handleFaqNavClick(option);
      else if (faqStep === "search_results") handleSearchResultClick(option);
    } else if (mode === "dispute") {
      if (disputeStep === "issue_type") handleDisputeOptionClick(option);
      else if (disputeStep === "confirm") handleConfirmAction(option);
    }
  };

  const showInput = (mode === "dispute" && (disputeStep === "borrower_search" || disputeStep === "description")) ||
    (mode === "faq" && (faqStep === "search" || faqStep === "search_results"));

  if (!open) {
    return (
      <Button
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-50" style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={() => { setOpen(true); showMainMenu(); }}
        data-testid="button-open-chatbot"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[400px] h-[80vh] sm:h-[560px] max-h-[600px] flex flex-col shadow-2xl z-50 overflow-hidden" style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }} data-testid="chatbot-container">
      <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold text-sm">{t("chatbot.title")}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary/80" onClick={showMainMenu} data-testid="button-chatbot-home" title={t("chatbot.faqBackToMenu")}>
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary/80" onClick={() => setOpen(false)} data-testid="button-close-chatbot">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "bot" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-2.5`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              {msg.options && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.options.map((opt) => (
                    <Badge
                      key={opt}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs px-2 py-0.5"
                      onClick={() => handleOptionClick(opt)}
                      data-testid={`button-option-${opt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
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

        {mode === "dispute" && disputeStep === "select_borrower" && searchResults && searchResults.length > 0 && (
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

        {mode === "dispute" && disputeStep === "select_account" && accounts && (
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

      {showInput && (
        <div className="p-3 border-t flex gap-2">
          <Input
            data-testid="input-chatbot-message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              mode === "faq" ? t("chatbot.faqSearchPlaceholder") :
              disputeStep === "borrower_search" ? t("chatbot.searchPlaceholder") :
              t("chatbot.describePlaceholder")
            }
            className="h-9 text-sm"
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} data-testid="button-chatbot-send">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {mode === "dispute" && disputeStep === "done" && (
        <div className="p-3 border-t flex gap-2">
          <Button className="flex-1" variant="outline" size="sm" onClick={showMainMenu} data-testid="button-chatbot-restart">
            {t("chatbot.faqBackToMenu")}
          </Button>
        </div>
      )}
    </Card>
  );
}
