"use client";

import Link from "next/link";
import { ArrowLeft, AudioLines, Sparkles } from "lucide-react";
import { AdminGate } from "../../AdminGate";
import { AdminProductionForm } from "../../AdminProductionForm";

export default function NewProductionPage() {
  return (
    <AdminGate>
      <div className="admin-production-page mx-auto min-h-full w-full max-w-5xl overflow-x-hidden text-white">
        <div className="admin-production-heading mb-7 sm:mb-9">
          <Link href="/admin/producoes" className="admin-production-back mb-6 inline-flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Voltar para produções
          </Link>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200">
                <Sparkles className="h-3.5 w-3.5" /> Catálogo BRS
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Nova produção</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Adicione a faixa, complete as informações e prepare a publicação no catálogo.</p>
            </div>
            <div className="admin-production-heading-note hidden items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 sm:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200"><AudioLines className="h-5 w-5" /></span>
              <span><span className="block text-xs font-semibold text-white">Estúdio de publicações</span><span className="mt-1 block text-[11px] text-white/40">Metadados e mídia em um só lugar</span></span>
            </div>
          </div>
        </div>
        <AdminProductionForm />
      </div>
    </AdminGate>
  );
}
