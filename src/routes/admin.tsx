import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Plus, X } from "lucide-react";

type Tag = { id: string; name: string; color: string; description: string | null };
type Lead = {
  id: string; full_name: string; phone: string | null; email: string | null;
  message: string | null; source: string; status: string; tag_id: string | null;
  notes: string | null; created_at: string;
};
type Interaction = { id: string; kind: string; content: string; created_at: string };

const STATUS_LABEL: Record<string, string> = {
  new: "Mới", contacted: "Đã liên hệ", qualified: "Tiềm năng", won: "Chốt đơn", lost: "Mất",
};

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "CRM — RICGY" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tags, setTags] = useState<Tag[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      load();
      const ch = supabase
        .channel("leads-rt")
        .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => load())
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
  }, [isAdmin]);

  async function load() {
    const [{ data: t }, { data: l }] = await Promise.all([
      supabase.from("crm_tags" as any).select("*").order("sort_order"),
      supabase.from("leads" as any).select("*").order("created_at", { ascending: false }),
    ]);
    setTags((t as any) ?? []);
    setLeads((l as any) ?? []);
  }

  if (loading) return <div className="p-10 text-muted-foreground">Đang tải...</div>;
  if (!user) return null;
  if (isAdmin === false) {
    return (
      <div className="p-10 max-w-md mx-auto text-center">
        <h1 className="font-serif text-3xl">Không có quyền</h1>
        <p className="mt-3 text-muted-foreground">Tài khoản này chưa được cấp quyền admin.</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-5 px-5 py-3 border border-border text-sm uppercase tracking-[0.2em]">
          Đăng xuất
        </button>
      </div>
    );
  }

  const visible = filter ? leads.filter((l) => l.tag_id === filter) : leads;
  const counts = tags.map((t) => ({ ...t, count: leads.filter((l) => l.tag_id === t.id).length }));

  return (
    <div className="px-5 lg:px-10 py-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link to="/" className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary">← Trang chủ</Link>
          <h1 className="mt-2 font-serif text-4xl">CRM <span className="italic text-primary">RICGY</span></h1>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/auth" }))}
          className="flex items-center gap-2 px-4 py-2 border border-border text-xs uppercase tracking-[0.2em] hover:border-primary">
          <LogOut className="size-4" /> Đăng xuất
        </button>
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter(null)}
          className={`px-3 py-2 text-xs uppercase tracking-[0.2em] border ${!filter ? "bg-foreground text-background border-foreground" : "border-border"}`}>
          Tất cả ({leads.length})
        </button>
        {counts.map((t) => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={`px-3 py-2 text-xs uppercase tracking-[0.2em] border flex items-center gap-2 ${filter === t.id ? "border-foreground" : "border-border"}`}
            style={filter === t.id ? { backgroundColor: t.color, color: "#fff", borderColor: t.color } : undefined}>
            <span className="size-2 rounded-full" style={{ backgroundColor: t.color }} />
            {t.name} ({t.count})
          </button>
        ))}
      </div>

      {/* Leads table */}
      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-[0.15em] text-muted-foreground">
            <tr>
              <th className="text-left p-3">Khách</th>
              <th className="text-left p-3">SĐT</th>
              <th className="text-left p-3">Nhãn</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="text-left p-3">Nguồn</th>
              <th className="text-left p-3">Ngày</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">Chưa có lead nào.</td></tr>
            )}
            {visible.map((l) => {
              const tag = tags.find((t) => t.id === l.tag_id);
              return (
                <tr key={l.id} onClick={() => setSelected(l)} className="border-t border-border hover:bg-secondary/40 cursor-pointer">
                  <td className="p-3 font-medium">{l.full_name}</td>
                  <td className="p-3 text-muted-foreground">{l.phone || "—"}</td>
                  <td className="p-3">
                    {tag ? (
                      <span className="px-2 py-1 rounded-full text-xs text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 text-xs uppercase tracking-wider">{STATUS_LABEL[l.status]}</td>
                  <td className="p-3 text-muted-foreground text-xs">{l.source}</td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(l.created_at).toLocaleDateString("vi-VN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <LeadDrawer lead={selected} tags={tags} onClose={() => setSelected(null)} onUpdated={load} />
      )}
    </div>
  );
}

function LeadDrawer({ lead, tags, onClose, onUpdated }: {
  lead: Lead; tags: Tag[]; onClose: () => void; onUpdated: () => void;
}) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [newNote, setNewNote] = useState("");
  const [kind, setKind] = useState("note");
  const [status, setStatus] = useState(lead.status);
  const [tagId, setTagId] = useState(lead.tag_id);

  useEffect(() => {
    supabase.from("lead_interactions" as any).select("*").eq("lead_id", lead.id).order("created_at", { ascending: false })
      .then(({ data }) => setInteractions((data as any) ?? []));
  }, [lead.id]);

  async function save() {
    await supabase.from("leads" as any).update({ status, tag_id: tagId } as any).eq("id", lead.id);
    onUpdated();
  }

  async function addNote() {
    if (!newNote.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("lead_interactions" as any).insert({
      lead_id: lead.id, kind, content: newNote.trim(), created_by: u.user?.id,
    } as any);
    setNewNote("");
    const { data } = await supabase.from("lead_interactions" as any).select("*").eq("lead_id", lead.id).order("created_at", { ascending: false });
    setInteractions((data as any) ?? []);
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-lg bg-background h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{lead.source}</p>
            <h2 className="font-serif text-3xl mt-1">{lead.full_name}</h2>
          </div>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>

        <div className="space-y-3 text-sm">
          {lead.phone && <p><span className="text-muted-foreground">SĐT:</span> {lead.phone}</p>}
          {lead.email && <p><span className="text-muted-foreground">Email:</span> {lead.email}</p>}
          {lead.message && <p className="p-3 bg-secondary border-l-2 border-primary italic">"{lead.message}"</p>}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Trạng thái</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm">
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nhãn</label>
            <select value={tagId ?? ""} onChange={(e) => setTagId(e.target.value || null)}
              className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm">
              <option value="">— Không —</option>
              {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={save} className="mt-3 w-full px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-[0.2em]">
          Lưu thay đổi
        </button>

        <div className="mt-8">
          <h3 className="font-serif text-xl mb-3">Tương tác</h3>
          <div className="flex gap-2">
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="bg-background border border-border px-2 text-xs">
              <option value="note">Ghi chú</option><option value="call">Gọi điện</option>
              <option value="message">Nhắn tin</option><option value="meeting">Gặp mặt</option><option value="order">Đơn hàng</option>
            </select>
            <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Nội dung..."
              className="flex-1 bg-background border border-border px-3 py-2 text-sm" />
            <button onClick={addNote} className="px-3 bg-primary text-primary-foreground"><Plus className="size-4" /></button>
          </div>
          <ul className="mt-4 space-y-3">
            {interactions.map((i) => (
              <li key={i.id} className="text-sm border-l-2 border-primary pl-3">
                <p className="text-xs uppercase tracking-wider text-primary">{i.kind} · {new Date(i.created_at).toLocaleString("vi-VN")}</p>
                <p className="mt-1">{i.content}</p>
              </li>
            ))}
            {interactions.length === 0 && <li className="text-sm text-muted-foreground">Chưa có tương tác nào.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
