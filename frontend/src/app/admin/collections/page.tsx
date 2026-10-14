"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  pageHeading?: string | null;
  breadcrumbLabel?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

type CollectionDraft = Omit<Collection, "id">;

const EMPTY_DRAFT: CollectionDraft = {
  name: "",
  slug: "",
  description: "",
  pageHeading: "",
  breadcrumbLabel: "",
  imageUrl: "",
  isActive: true,
};

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CollectionDraft>(EMPTY_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function loadCollections() {
    const data = await api.adminGetCategories() as Collection[];
    setCollections(data);
  }

  useEffect(() => {
    loadCollections()
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load collections."))
      .finally(() => setIsLoading(false));
  }, []);

  function selectCollection(collection: Collection) {
    setSelectedId(collection.id);
    setDraft({
      name: collection.name,
      slug: collection.slug,
      description: collection.description ?? "",
      pageHeading: collection.pageHeading ?? "",
      breadcrumbLabel: collection.breadcrumbLabel ?? "",
      imageUrl: collection.imageUrl ?? "",
      isActive: collection.isActive ?? true,
    });
    setError(null);
    setSuccess(false);
  }

  function startNewCollection() {
    setSelectedId(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
    setSuccess(false);
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      setError("Collection name is required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = { ...draft, name: draft.name.trim(), slug: draft.slug.trim() };
      const saved = selectedId
        ? await api.adminUpdateCategory(selectedId, payload) as Collection
        : await api.adminCreateCategory(payload) as Collection;
      await loadCollections();
      selectCollection(saved);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save collection.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-neutral-500">Loading collections...</p>;

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-[#0A2540]">Collections</h1>
          <p className="mt-1 text-sm text-neutral-500">Edit collection details and storefront page content.</p>
        </div>
        <button type="button" onClick={startNewCollection} className="flex items-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2.5 text-sm font-medium text-white">
          <Plus className="h-4 w-4" /> New collection
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className="h-fit rounded-lg border border-neutral-200 bg-white p-3">
          <h2 className="px-2 pb-2 text-xs font-semibold uppercase text-neutral-500">All collections</h2>
          <div className="max-h-[70vh] space-y-1 overflow-y-auto">
            {collections.map((collection) => (
              <div key={collection.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => selectCollection(collection)}
                  className={`min-w-0 flex-1 rounded-md px-3 py-2.5 text-left text-sm ${selectedId === collection.id ? "bg-[#0A2540] text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
                >
                  <span className="block truncate font-medium">{collection.name}</span>
                  <span className={`mt-0.5 block truncate text-xs ${selectedId === collection.id ? "text-white/65" : "text-neutral-500"}`}>/{collection.slug}</span>
                </button>
                <Link
                  href={`/collections/${encodeURIComponent(collection.slug)}`}
                  target="_blank"
                  rel="noreferrer"
                  title="View collection"
                  aria-label={`View ${collection.name} collection`}
                  className="flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-xs text-[#0A2540] hover:bg-neutral-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </Link>
              </div>
            ))}
            {!collections.length && <p className="px-2 py-3 text-sm text-neutral-500">No collections yet.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6">
          <h2 className="mb-5 font-semibold text-[#0A2540]">{selectedId ? "Edit collection" : "Create collection"}</h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-neutral-700">
              Collection name
              <input value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 font-normal" placeholder="e.g. Nicotine Pouches" />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              URL slug
              <input value={draft.slug} onChange={(e) => setDraft((current) => ({ ...current, slug: e.target.value }))} className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 font-normal" placeholder="e.g. nicotine-pouches" />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              Collection image URL
              <input value={draft.imageUrl ?? ""} onChange={(e) => setDraft((current) => ({ ...current, imageUrl: e.target.value }))} className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 font-normal" placeholder="https://..." />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              Page heading
              <input value={draft.pageHeading ?? ""} onChange={(e) => setDraft((current) => ({ ...current, pageHeading: e.target.value }))} className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 font-normal" placeholder="Defaults to collection name" />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              Breadcrumb label
              <input value={draft.breadcrumbLabel ?? ""} onChange={(e) => setDraft((current) => ({ ...current, breadcrumbLabel: e.target.value }))} className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 font-normal" placeholder="Defaults to collection name" />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              Collection description
              <textarea value={draft.description ?? ""} onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))} rows={5} className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 font-normal" placeholder="Description shown below the collection heading" />
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={draft.isActive ?? true} onChange={(e) => setDraft((current) => ({ ...current, isActive: e.target.checked }))} className="h-4 w-4 accent-[#0A2540]" />
              Active collection
            </label>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-4 flex items-center gap-1.5 text-sm text-green-700"><Check className="h-4 w-4" /> Collection saved.</p>}
          <button type="button" onClick={handleSave} disabled={isSaving} className="mt-5 flex items-center gap-2 rounded-lg bg-[#0A2540] px-5 py-2.5 text-sm font-medium text-white disabled:bg-neutral-400">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save collection
          </button>
        </section>
      </div>
    </div>
  );
}