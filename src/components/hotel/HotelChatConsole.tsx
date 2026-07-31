import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Send, BookOpen, Globe, MessageCircle, Phone, ChevronRight } from "lucide-react";

type Message = {
  id: string;
  text: string;
  sender: "guest" | "staff";
  time: string;
};

type Booking = {
  code: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

type Conversation = {
  id: string;
  guestName: string;
  room: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
  booking?: Booking;
};

type Channel = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  unread: number;
  conversations: Conversation[];
};

const CHANNELS: Channel[] = [
  {
    id: "booking_com", name: "Booking.com", icon: Globe, color: "bg-blue-600", unread: 3,
    conversations: [
      {
        id: "b1", guestName: "Trần Thị Minh", room: "Villa 01", unread: 2,
        lastMessage: "Nhờ chuẩn bị bữa tối lúc 7pm", time: "09:45",
        messages: [
          { id: "m1", sender: "guest", time: "09:30", text: "Xin chào, tôi muốn hỏi về dịch vụ đón sân bay?" },
          { id: "m2", sender: "staff", time: "09:32", text: "Chào chị Minh! Farmstay có xe đón từ sân bay Đà Lạt, phí 300,000₫/chiều." },
          { id: "m3", sender: "guest", time: "09:45", text: "Nhờ chuẩn bị bữa tối lúc 7pm" },
        ],
        booking: { code: "OG-ABC123", checkIn: "2026-06-20", checkOut: "2026-06-23", status: "confirmed" },
      },
      {
        id: "b2", guestName: "Lê Hoàng Nam", room: "Suite 02", unread: 0,
        lastMessage: "Cảm ơn, tôi sẽ đến lúc 3pm", time: "Hôm qua",
        messages: [
          { id: "m4", sender: "guest", time: "15:20", text: "Check-in lúc mấy giờ?" },
          { id: "m5", sender: "staff", time: "15:22", text: "Check-in từ 14h anh ạ. Nếu đến sớm chúng tôi giữ hành lý giúp." },
          { id: "m6", sender: "guest", time: "15:25", text: "Cảm ơn, tôi sẽ đến lúc 3pm" },
        ],
        booking: { code: "OG-DEF456", checkIn: "2026-06-18", checkOut: "2026-06-21", status: "checked_in" },
      },
    ],
  },
  {
    id: "agoda", name: "Agoda", icon: Globe, color: "bg-red-500", unread: 1,
    conversations: [
      {
        id: "a1", guestName: "David Kim", room: "Glamping 03", unread: 1,
        lastMessage: "Is there a swimming pool?", time: "10:20",
        messages: [
          { id: "m7", sender: "guest", time: "10:20", text: "Hello! Is there a swimming pool?" },
        ],
        booking: { code: "OG-GHI789", checkIn: "2026-06-22", checkOut: "2026-06-24", status: "confirmed" },
      },
    ],
  },
  {
    id: "zalo", name: "Zalo", icon: MessageCircle, color: "bg-blue-400", unread: 2,
    conversations: [
      {
        id: "z1", guestName: "Nguyễn Phương Anh", room: "Deluxe 04", unread: 2,
        lastMessage: "Cho tôi xin menu room service", time: "11:05",
        messages: [
          { id: "m8", sender: "guest", time: "11:05", text: "Cho tôi xin menu room service" },
        ],
        booking: { code: "OG-JKL012", checkIn: "2026-06-19", checkOut: "2026-06-21", status: "checked_in" },
      },
    ],
  },
  {
    id: "direct", name: "Liên hệ trực tiếp", icon: Phone, color: "bg-green-500",
    unread: 0, conversations: [],
  },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  checked_in: "Đang ở",
  checked_out: "Đã trả phòng",
  cancelled: "Đã hủy",
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function HotelChatConsole() {
  const [activeChannelId, setActiveChannelId] = useState(CHANNELS[0].id);
  const [activeConvId, setActiveConvId]       = useState<string | null>(null);
  const [draft, setDraft]                     = useState("");
  const [localMsgs, setLocalMsgs]             = useState<Record<string, Message[]>>({});

  const activeChannel = CHANNELS.find(c => c.id === activeChannelId)!;
  const activeConv    = activeConvId
    ? activeChannel.conversations.find(c => c.id === activeConvId)
    : activeChannel.conversations[0] ?? null;

  const allMessages = activeConv
    ? [...activeConv.messages, ...(localMsgs[activeConv.id] ?? [])]
    : [];

  const sendMessage = () => {
    if (!draft.trim() || !activeConv) return;
    const msg: Message = {
      id: `local-${Date.now()}`,
      text: draft.trim(),
      sender: "staff",
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setLocalMsgs(prev => ({ ...prev, [activeConv.id]: [...(prev[activeConv.id] ?? []), msg] }));
    setDraft("");
  };

  return (
    <div className="grid h-[calc(100vh-10rem)] grid-cols-[200px_1fr_260px] gap-4 overflow-hidden">

      {/* ── Column 1: Channels & conversation list ── */}
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="px-3 pb-2 pt-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kênh</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-1 p-2">
          {CHANNELS.map(ch => (
            <button
              key={ch.id}
              onClick={() => { setActiveChannelId(ch.id); setActiveConvId(null); }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent",
                activeChannelId === ch.id && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded text-white", ch.color)}>
                <ch.icon className="h-3 w-3" />
              </span>
              <span className="flex-1 truncate text-xs font-medium">{ch.name}</span>
              {ch.unread > 0 && <Badge className="h-4 min-w-4 shrink-0 px-1 text-[10px]">{ch.unread}</Badge>}
            </button>
          ))}

          {activeChannel.conversations.length > 0 && (
            <>
              <p className="mt-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hội thoại
              </p>
              {activeChannel.conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-accent",
                    activeConv?.id === conv.id && "bg-accent",
                  )}
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[9px]">{initials(conv.guestName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{conv.guestName}</p>
                    <p className="truncate text-muted-foreground">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Column 2: Message thread ── */}
      <Card className="flex flex-col overflow-hidden">
        {activeConv ? (
          <>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{initials(activeConv.guestName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{activeConv.guestName}</p>
                  <p className="text-xs text-muted-foreground">{activeConv.room} · {activeChannelId}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-3 p-4">
              {allMessages.map(msg => (
                <div key={msg.id} className={cn("flex", msg.sender === "staff" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                    msg.sender === "staff"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted",
                  )}>
                    <p>{msg.text}</p>
                    <p className={cn(
                      "mt-0.5 text-[10px]",
                      msg.sender === "staff" ? "text-right text-primary-foreground/60" : "text-muted-foreground",
                    )}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>

            <div className="border-t p-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập tin nhắn…"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  className="h-9"
                />
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p className="text-sm">Chọn một cuộc hội thoại</p>
            </div>
          </div>
        )}
      </Card>

      {/* ── Column 3: Guest profile & booking ── */}
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Thông tin khách</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {activeConv ? (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-base font-bold">{initials(activeConv.guestName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{activeConv.guestName}</p>
                  <p className="text-xs text-muted-foreground">{activeConv.room}</p>
                </div>
              </div>

              {activeConv.booking && (
                <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <BookOpen className="h-3.5 w-3.5" />
                    Đặt phòng
                  </div>
                  <div className="space-y-1 text-xs">
                    <InfoRow label="Mã" value={<span className="font-mono font-medium">{activeConv.booking.code}</span>} />
                    <InfoRow label="Trạng thái" value={
                      <Badge variant="outline" className="h-4 text-[10px]">
                        {STATUS_LABEL[activeConv.booking.status] ?? activeConv.booking.status}
                      </Badge>
                    } />
                    <InfoRow label="Nhận" value={activeConv.booking.checkIn} />
                    <InfoRow label="Trả"  value={activeConv.booking.checkOut} />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Thao tác nhanh</p>
                {["Gửi hóa đơn", "Yêu cầu đánh giá", "Gia hạn lưu trú"].map(action => (
                  <button
                    key={action}
                    className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    {action}
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
              Chọn cuộc hội thoại để xem thông tin khách
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
