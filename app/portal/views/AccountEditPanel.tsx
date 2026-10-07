"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, CheckCircle2, Loader2, LockKeyhole, MessageCircle, Save } from "lucide-react";
import type { PortalData } from "../portal-types";

type AccountEditPanelProps = {
  user: PortalData["user"];
};

export function AccountEditPanel({ user }: AccountEditPanelProps) {
  const [name, setName] = useState(user.name);
  const [whatsapp, setWhatsapp] = useState(user.whatsapp);
  const [photoUrl, setPhotoUrl] = useState(user.profileImageUrl);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("senha");
    if (status === "confirmada") setMessage("Senha alterada com sucesso.");
    if (status === "token-invalido") setError("O link de confirmação expirou ou já foi utilizado.");
    setName(user.name);
    setWhatsapp(user.whatsapp);
    setPhotoUrl(user.profileImageUrl);
  }, [user]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/portal/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Não foi possível salvar.");
      setMessage("Seus dados foram atualizados.");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(file: File) {
    setPhotoSaving(true);
    setMessage(null);
    setError(null);
    try {
      const form = new FormData();
      form.set("photo", file);
      const res = await fetch("/api/portal/account/photo", { method: "POST", body: form });
      const json = (await res.json()) as { error?: string; imageUrl?: string };
      if (!res.ok) throw new Error(json.error || "Não foi possível enviar a foto.");
      setPhotoUrl(json.imageUrl || null);
      setMessage("Foto atualizada e armazenada no R2.");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
    } finally {
      setPhotoSaving(false);
    }
  }

  async function requestPasswordChange(event: React.FormEvent) {
    event.preventDefault();
    setPasswordSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/portal/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(json.error || "Não foi possível enviar a confirmação.");
      setPassword("");
      setMessage(json.message || "Confira seu e-mail para confirmar a alteração.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form onSubmit={saveProfile} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nome completo</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#00ff9d]" />
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">WhatsApp</span>
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#00ff9d]" />
            </label>
          </div>

          <div>
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">E-mail</span>
            <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-[#0a0a0a] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white">{user.email}</p>
                <p className="mt-1 text-xs text-zinc-500">O e-mail não pode ser alterado diretamente pelo portal.</p>
              </div>
              <Link
                href={`https://wa.me/5551993920717?text=${encodeURIComponent(`Olá! Quero solicitar a alteração do e-mail da minha conta BRS. E-mail atual: ${user.email}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#00ff9d]/40 px-3 py-2 text-xs font-bold text-[#00ff9d] hover:bg-[#00ff9d]/10"
              >
                <MessageCircle className="h-4 w-4" />
                Solicitar pelo WhatsApp
              </Link>
            </div>
          </div>

          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar dados"}
          </button>
        </form>

        <div className="flex flex-col items-center rounded-xl border border-zinc-800 bg-[#0a0a0a] p-5">
          <div className="relative">
            {photoUrl ? (
              <img src={photoUrl} alt="Sua foto de perfil" className="h-28 w-28 rounded-full object-cover ring-2 ring-[#00ff9d]/40" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#60cdff] text-4xl font-black text-black">
                {name.trim().charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-[#00ff9d] text-black hover:bg-[#00e68a]">
              {photoSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={photoSaving} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file);
                e.currentTarget.value = "";
              }} />
            </label>
          </div>
          <p className="mt-4 text-center text-xs font-semibold text-white">Foto do perfil</p>
          <p className="mt-1 text-center text-[11px] leading-relaxed text-zinc-500">JPG, PNG ou WEBP · até 8 MB. A foto fica armazenada no Cloudflare R2.</p>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-6">
        <div className="mb-4 flex items-center gap-2">
          <LockKeyhole className="h-4 w-4 text-[#00ff9d]" />
          <h3 className="text-sm font-bold text-white">Alterar senha</h3>
        </div>
        <form onSubmit={requestPasswordChange} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nova senha</span>
            <input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" className="w-full rounded-lg border border-zinc-700 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#00ff9d]" />
          </label>
          <button type="submit" disabled={passwordSaving} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:border-[#00ff9d]/50 disabled:opacity-60">
            {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            {passwordSaving ? "Enviando..." : "Enviar confirmação"}
          </button>
        </form>
        <p className="mt-2 text-xs text-zinc-500">A senha só será alterada depois que você clicar no link enviado para o seu e-mail.</p>
      </div>

      {(message || error) && (
        <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-[#00ff9d]/30 bg-[#00ff9d]/10 text-[#9dffd7]"}`}>
          {error ? null : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {error || message}
        </div>
      )}
    </div>
  );
}
