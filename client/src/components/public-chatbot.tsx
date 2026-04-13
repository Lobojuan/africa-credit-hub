import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBrandColors } from "@/hooks/use-brand-colors";
import { PLATFORM_SUPPORT_EMAIL } from "@/lib/platform-config";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "What countries do you cover?",
  "How much does it cost?",
  "What AI features are included?",
  "How do I start a free trial?",
];

export function PublicChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const brandColors = useBrandColors();

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    }
  }, [messages, streaming]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: newMessages.slice(-10),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to get response");
      }

      const data = await res.json();
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: data.response || "I couldn't generate a response. Please try again." };
        return updated;
      });
    } catch (e: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `I'm having trouble connecting right now. Please try again or contact us at ${PLATFORM_SUPPORT_EMAIL}`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[90] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${brandColors.accentLight}, ${brandColors.accent})`,
            boxShadow: `0 4px 20px ${brandColors.accentMuted}`,
          }}
          data-testid="button-public-chatbot"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-[90] w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl shadow-2xl border border-border/50 bg-background overflow-hidden animate-in slide-in-from-bottom-5 fade-in-0 duration-300" data-testid="public-chatbot-panel">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: `linear-gradient(135deg, ${brandColors.accentLight}, ${brandColors.accent})` }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Africa Credit Hub AI</p>
                <p className="text-white/70 text-[10px]">Ask anything about our platform</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1"
              data-testid="button-close-chatbot"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
                    <p className="text-sm leading-relaxed">
                      Welcome! I'm the Africa Credit Hub AI assistant. I can answer questions about our platform, features, and how we can help your institution. What would you like to know?
                    </p>
                  </div>
                </div>
                <div className="pl-9 space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Quick questions</p>
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg px-2 py-1.5 transition-colors w-full text-left"
                      data-testid={`quick-q-${q.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
                    >
                      <ArrowRight className="w-3 h-3 shrink-0" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "user" ? "bg-primary/20" : "bg-muted"
                }`}>
                  {msg.role === "user" ? <User className="w-3.5 h-3.5 text-primary" /> : <Bot className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div className={`rounded-2xl px-3.5 py-2.5 max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted/50 rounded-tl-sm"
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content || (streaming && i === messages.length - 1 ? "..." : "")}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t bg-background shrink-0 pb-[env(safe-area-inset-bottom,0.75rem)]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about features, coverage, integrations..."
                className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                disabled={streaming}
                data-testid="input-public-chat"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || streaming}
                className="rounded-xl h-10 w-10 shrink-0"
                data-testid="button-send-chat"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground/50 text-center mt-1.5">Powered by Claude & GPT-4o</p>
          </form>
        </div>
      )}
    </>
  );
}
