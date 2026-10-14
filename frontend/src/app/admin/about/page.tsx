"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import ImageUploadField from "@/components/admin/ImageUploadField";

interface AboutPoint {
  title: string;
  description: string;
}

interface AboutFeatureSection {
  imageUrl: string;
  heading: string;
  body: string;
  points: AboutPoint[];
  buttonLabel: string;
  buttonHref: string;
  imagePosition: "left" | "right";
}

interface AboutContent {
  heroImageUrl: string;
  heroSubheading: string;
  heading: string;
  whyShopSection: AboutFeatureSection;
  additionalSections: AboutFeatureSection[];
  [key: string]: unknown;
}

const EMPTY_SECTION: AboutFeatureSection = {
  imageUrl: "",
  heading: "",
  body: "",
  points: [],
  buttonLabel: "",
  buttonHref: "",
  imagePosition: "left",
};

export default function AdminAboutPage() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .adminGetAboutContent()
      .then((data) => {
        const value = data as Partial<AboutContent>;
        setContent({
          ...(value as AboutContent),
          additionalSections: value.additionalSections ?? [],
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load."))
      .finally(() => setIsLoading(false));
  }, []);

  function update(field: keyof AboutContent, value: string) {
    setContent((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateWhy(field: keyof AboutFeatureSection, value: string) {
    setContent((current) =>
      current
        ? { ...current, whyShopSection: { ...current.whyShopSection, [field]: value } }
        : current,
    );
  }

  function updatePoint(index: number, field: keyof AboutPoint, value: string) {
    setContent((current) =>
      current
        ? {
            ...current,
            whyShopSection: {
              ...current.whyShopSection,
              points: current.whyShopSection.points.map((point, pointIndex) =>
                pointIndex === index ? { ...point, [field]: value } : point,
              ),
            },
          }
        : current,
    );
  }

  function updateAdditionalSection(index: number, field: keyof AboutFeatureSection, value: string) {
    setContent((current) =>
      current
        ? {
            ...current,
            additionalSections: current.additionalSections.map((section, sectionIndex) =>
              sectionIndex === index ? { ...section, [field]: value } : section,
            ),
          }
        : current,
    );
  }

  function updateAdditionalPoint(index: number, pointIndex: number, field: keyof AboutPoint, value: string) {
    setContent((current) =>
      current
        ? {
            ...current,
            additionalSections: current.additionalSections.map((section, sectionIndex) =>
              sectionIndex === index
                ? {
                    ...section,
                    points: section.points.map((point, currentPointIndex) =>
                      currentPointIndex === pointIndex ? { ...point, [field]: value } : point,
                    ),
                  }
                : section,
            ),
          }
        : current,
    );
  }

  function addSection() {
    setContent((current) =>
      current ? { ...current, additionalSections: [...current.additionalSections, { ...EMPTY_SECTION }] } : current,
    );
  }

  function removeSection(index: number) {
    setContent((current) =>
      current
        ? { ...current, additionalSections: current.additionalSections.filter((_, sectionIndex) => sectionIndex !== index) }
        : current,
    );
  }

  function addPoint(index: number) {
    setContent((current) =>
      current
        ? {
            ...current,
            additionalSections: current.additionalSections.map((section, sectionIndex) =>
              sectionIndex === index ? { ...section, points: [...section.points, { title: "", description: "" }] } : section,
            ),
          }
        : current,
    );
  }

  async function handleSave() {
    if (!content) return;
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.adminUpdateAboutContent(content);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (!content) return <p className="text-sm text-red-600">{error ?? "Failed to load About page."}</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-serif text-2xl text-[#0A2540]">About Page</h1>
      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-[#0A2540]">Hero Section</h2>
        <div className="space-y-3">
          <input
            placeholder="Hero heading"
            value={content.heading}
            onChange={(e) => update("heading", e.target.value)}
            className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm"
          />
          <textarea
            placeholder="Hero subheading"
            value={content.heroSubheading}
            onChange={(e) => update("heroSubheading", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm"
          />
          <ImageUploadField
            url={content.heroImageUrl}
            onChange={(url) => update("heroImageUrl", url)}
          />
        </div>
      </section>
      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-[#0A2540]">Section Below Hero</h2>
        <div className="space-y-3">
          <input
            placeholder="Section heading"
            value={content.whyShopSection.heading}
            onChange={(e) => updateWhy("heading", e.target.value)}
            className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm"
          />
          <textarea
            placeholder="Section body"
            value={content.whyShopSection.body}
            onChange={(e) => updateWhy("body", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm"
          />
          <ImageUploadField
            url={content.whyShopSection.imageUrl}
            onChange={(url) => updateWhy("imageUrl", url)}
          />
          <select
            value={content.whyShopSection.imagePosition}
            onChange={(e) => updateWhy("imagePosition", e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm"
          >
            <option value="left">Image left</option>
            <option value="right">Image right</option>
          </select>
          {content.whyShopSection.points.map((point, index) => (
            <div key={index} className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-2">
              <input
                placeholder="Point title"
                value={point.title}
                onChange={(e) => updatePoint(index, "title", e.target.value)}
                className="rounded-lg border border-neutral-300 p-2.5 text-sm"
              />
              <input
                placeholder="Point description"
                value={point.description}
                onChange={(e) => updatePoint(index, "description", e.target.value)}
                className="rounded-lg border border-neutral-300 p-2.5 text-sm"
              />
            </div>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Button label"
              value={content.whyShopSection.buttonLabel}
              onChange={(e) => updateWhy("buttonLabel", e.target.value)}
              className="rounded-lg border border-neutral-300 p-2.5 text-sm"
            />
            <input
              placeholder="Button link"
              value={content.whyShopSection.buttonHref}
              onChange={(e) => updateWhy("buttonHref", e.target.value)}
              className="rounded-lg border border-neutral-300 p-2.5 text-sm"
            />
          </div>
        </div>
      </section>
      {content.additionalSections.map((section, index) => (
        <section key={index} className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[#0A2540]">Additional Section {index + 1}</h2>
            <button type="button" onClick={() => removeSection(index)} className="text-sm text-red-600 underline">
              Remove
            </button>
          </div>
          <div className="space-y-3">
            <input placeholder="Section heading" value={section.heading} onChange={(e) => updateAdditionalSection(index, "heading", e.target.value)} className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
            <textarea placeholder="Section body" value={section.body} onChange={(e) => updateAdditionalSection(index, "body", e.target.value)} rows={3} className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
            <ImageUploadField url={section.imageUrl} onChange={(url) => updateAdditionalSection(index, "imageUrl", url)} />
            <select value={section.imagePosition} onChange={(e) => updateAdditionalSection(index, "imagePosition", e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm">
              <option value="left">Image left</option>
              <option value="right">Image right</option>
            </select>
            {section.points.map((point, pointIndex) => (
              <div key={pointIndex} className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-2">
                <input placeholder="Point title" value={point.title} onChange={(e) => updateAdditionalPoint(index, pointIndex, "title", e.target.value)} className="rounded-lg border border-neutral-300 p-2.5 text-sm" />
                <input placeholder="Point description" value={point.description} onChange={(e) => updateAdditionalPoint(index, pointIndex, "description", e.target.value)} className="rounded-lg border border-neutral-300 p-2.5 text-sm" />
              </div>
            ))}
            <button type="button" onClick={() => addPoint(index)} className="text-sm text-[#0A2540] underline">Add bullet point</button>
            <div className="grid gap-3 sm:grid-cols-2">
              <input placeholder="Button label" value={section.buttonLabel} onChange={(e) => updateAdditionalSection(index, "buttonLabel", e.target.value)} className="rounded-lg border border-neutral-300 p-2.5 text-sm" />
              <input placeholder="Button link" value={section.buttonHref} onChange={(e) => updateAdditionalSection(index, "buttonHref", e.target.value)} className="rounded-lg border border-neutral-300 p-2.5 text-sm" />
            </div>
          </div>
        </section>
      ))}
      <button type="button" onClick={addSection} className="mb-8 rounded-lg border border-[#0A2540] px-5 py-2.5 text-sm font-medium text-[#0A2540]">
        Add another section
      </button>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">Saved! Changes are live.</p>}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center gap-2 rounded-lg bg-[#0A2540] px-8 py-3.5 font-medium text-white disabled:bg-neutral-300"
      >
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save About Hero
      </button>
    </div>
  );
}
