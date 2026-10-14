"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpDown,
  FilePenLine,
  FileUp,
  Filter,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { api } from "@/lib/api";

interface BlogArticle {
  title: string;
  summary: string;
  content?: string;
  imageUrl: string;
  category: string;
  date: string;
  readTime: string;
  href: string;
  visibility?: string;
  author?: string;
  tags?: string;
  collection?: string;
  overviewList?: string;
  seoTitle?: string;
  seoDescription?: string;
  template?: string;
}

interface BlogContent {
  slug: string;
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
  articles: BlogArticle[];
}

const emptyArticle = (): BlogArticle => ({
  title: "",
  summary: "",
  content: "",
  imageUrl: "",
  category: "News",
  date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  readTime: "5 min read",
  href: "/blogs/news",
  visibility: "hidden",
  author: "Osama Salim",
  tags: "",
  collection: "",
  overviewList: "",
  seoTitle: "",
  seoDescription: "",
  template: "Default blog post",
});

function BlogContentEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [sourceMode, setSourceMode] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value;
  }, [value]);

  function command(commandName: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(commandName, false, commandValue);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  function addLink() {
    const url = window.prompt("Enter link URL");
    if (url) command("createLink", url);
  }

  const toolButton = (label: string, icon: ReactNode, action: () => void) => (
    <button type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={action} className="rounded p-1.5 hover:bg-neutral-200">
      {icon}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300">
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-300 bg-neutral-50 px-2 py-1.5">
        {toolButton("Bold", <Bold className="h-4 w-4" />, () => command("bold"))}
        {toolButton("Italic", <Italic className="h-4 w-4" />, () => command("italic"))}
        {toolButton("Underline", <Underline className="h-4 w-4" />, () => command("underline"))}
        <select aria-label="Text format" defaultValue="p" onChange={(event) => command("formatBlock", event.target.value)} className="rounded border-0 bg-transparent px-2 py-1 text-xs">
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        {toolButton("Align left", <AlignLeft className="h-4 w-4" />, () => command("justifyLeft"))}
        {toolButton("Align center", <AlignCenter className="h-4 w-4" />, () => command("justifyCenter"))}
        {toolButton("Align right", <AlignRight className="h-4 w-4" />, () => command("justifyRight"))}
        {toolButton("Add link", <LinkIcon className="h-4 w-4" />, addLink)}
        {toolButton("Bullet list", <List className="h-4 w-4" />, () => command("insertUnorderedList"))}
        {toolButton("Numbered list", <ListOrdered className="h-4 w-4" />, () => command("insertOrderedList"))}
        {toolButton("Insert image", <ImagePlus className="h-4 w-4" />, () => {
          const url = window.prompt("Enter image URL");
          if (url) command("insertImage", url);
        })}
        <span className="mx-1 h-5 w-px bg-neutral-300" />
        {toolButton("HTML source", <Code2 className="h-4 w-4" />, () => setSourceMode((current) => !current))}
      </div>
      {sourceMode ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-[190px] w-full resize-y border-0 p-3 font-mono text-xs outline-none" aria-label="HTML source" />
      ) : (
        <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={(event) => onChange(event.currentTarget.innerHTML)} className="min-h-[190px] p-3 text-sm outline-none empty:before:text-neutral-400 empty:before:content-['Write_your_blog_post_content...']" aria-label="Blog post content" />
      )}
    </div>
  );
}

export default function AdminBlogsPage() {
  const [content, setContent] = useState<BlogContent | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState<boolean | string>(false);

  useEffect(() => {
    api.adminGetGenericPageContent("blogs/news")
      .then((data) => {
        const value = data as BlogContent;
        setContent({ ...value, sections: value.sections || [], articles: value.articles || [] });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load blog posts."));
  }, []);

  const visibleArticles = useMemo(() => {
    if (!content) return [];
    const normalized = query.trim().toLowerCase();
    return content.articles
      .map((article, index) => ({ article, index }))
      .filter(({ article }) => !normalized || `${article.title} ${article.category} ${article.summary}`.toLowerCase().includes(normalized));
  }, [content, query]);

  function updateArticle(index: number, field: keyof BlogArticle, value: string) {
    setContent((current) => current ? {
      ...current,
      articles: current.articles.map((article, articleIndex) =>
        articleIndex === index ? { ...article, [field]: value } : article,
      ),
    } : current);
  }

  function removeArticle(index: number) {
    setContent((current) => current ? {
      ...current,
      articles: current.articles.filter((_, articleIndex) => articleIndex !== index),
    } : current);
    setSelectedIndex(null);
    setAddingIndex(null);
  }

  function startAdding() {
    setContent((current) => {
      if (!current) return current;
      const articles = [emptyArticle(), ...current.articles];
      setAddingIndex(0);
      return { ...current, articles };
    });
    setSelectedIndex(null);
  }

  function cancelAdding() {
    if (addingIndex !== null) removeArticle(addingIndex);
  }

  async function importHtmlFile(file: File, targetIndex = addingIndex) {
    if (!/\.html?$/i.test(file.name) && file.type !== "text/html") {
      setError("Please select an HTML file (.html or .htm).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("HTML files must be 2 MB or smaller.");
      return;
    }
    try {
      const html = await file.text();
      if (targetIndex !== null) updateArticle(targetIndex, "content", html);
      setError(null);
    } catch {
      setError("The HTML file could not be read.");
    }
  }

  async function importBlogsCsv(file: File) {
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setError("Please select a CSV file.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await api.adminImportCsv("blogs", file);
      const refreshed = await api.adminGetGenericPageContent("blogs/news") as BlogContent;
      setContent({ ...refreshed, sections: refreshed.sections || [], articles: refreshed.articles || [] });
      setSaved(`${result.imported} blog posts imported`);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import blog posts.");
    } finally {
      setIsSaving(false);
    }
  }

  async function save() {
    if (!content) return;
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.adminUpdateGenericPageContent("blogs/news", content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save blog posts.");
    } finally {
      setIsSaving(false);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!content) return <p className="text-sm text-neutral-500">Loading...</p>;

  const selectedArticle = selectedIndex === null ? null : content.articles[selectedIndex];

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-8 bg-white text-[#111]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-6 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FilePenLine className="h-4 w-4" /> Blog posts
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium shadow-sm">
            <FilePenLine className="mr-1 inline h-3.5 w-3.5" /> Manage blogs
          </button>
          <button type="button" className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium shadow-sm">
            <MessageSquare className="mr-1 inline h-3.5 w-3.5" /> Manage comments
          </button>
          <label className="cursor-pointer rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium shadow-sm hover:bg-neutral-50">
            <FileUp className="mr-1 inline h-3.5 w-3.5" /> Import blogs CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={isSaving}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importBlogsCsv(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <button type="button" onClick={startAdding} className="rounded-full bg-[#202020] px-4 py-2 text-xs font-semibold text-white shadow-sm">
            <Plus className="mr-1 inline h-3.5 w-3.5" /> Add blog post
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3">
        <button type="button" className="rounded-full bg-neutral-200 px-4 py-2 text-xs font-semibold">All</button>
        <button type="button" onClick={startAdding} aria-label="Add blog post" className="rounded-full p-2 hover:bg-neutral-100"><Plus className="h-4 w-4" /></button>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2">
            <Search className="h-4 w-4" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search posts" className="w-28 text-xs outline-none sm:w-44" />
          </label>
          <button type="button" aria-label="Filter posts" className="rounded-full border border-neutral-200 p-2"><Filter className="h-4 w-4" /></button>
          <button type="button" aria-label="Sort posts" className="rounded-full border border-neutral-200 p-2"><ArrowUpDown className="h-4 w-4" /></button>
        </div>
      </div>

      {addingIndex !== null && content.articles[addingIndex] && (
        <section className="mx-4 my-6 grid gap-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_230px]">
          <div>
            <h1 className="mb-4 text-2xl font-medium">Add blog post</h1>
            <label className="mb-1 block text-xs">Title</label>
            <input value={content.articles[addingIndex].title} onChange={(event) => updateArticle(addingIndex, "title", event.target.value)} placeholder="e.g., Blog about your latest products or deals" className="mb-4 w-full rounded-lg border border-neutral-300 p-3 text-sm" />
            <label className="mb-1 block text-xs">Content</label>
            <div className="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3">
              <label className="cursor-pointer rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-medium hover:bg-neutral-100">
                Add HTML file
                <input
                  type="file"
                  accept=".html,.htm,text/html"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importHtmlFile(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <span className="text-xs text-neutral-500">Import an .html or .htm file into the content field (max 2 MB)</span>
            </div>
            <BlogContentEditor value={content.articles[addingIndex].content || ""} onChange={(value) => updateArticle(addingIndex, "content", value)} />
            <label className="mb-1 mt-5 block text-xs">Excerpt</label>
            <textarea value={content.articles[addingIndex].summary} onChange={(event) => updateArticle(addingIndex, "summary", event.target.value)} placeholder="Add a summary of the post to appear on your home page or blog" rows={3} className="w-full rounded-lg border border-neutral-300 p-3 text-sm" />
            <h2 className="mb-2 mt-6 text-sm font-medium">Metafields</h2>
            <div className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-2">
              <input value={content.articles[addingIndex].collection || ""} onChange={(event) => updateArticle(addingIndex, "collection", event.target.value)} placeholder="collection" className="rounded border border-neutral-300 p-2 text-sm" />
              <input value={content.articles[addingIndex].overviewList || ""} onChange={(event) => updateArticle(addingIndex, "overviewList", event.target.value)} placeholder="overview_list" className="rounded border border-neutral-300 p-2 text-sm" />
            </div>
            <h2 className="mb-2 mt-6 text-sm font-medium">Search engine listing</h2>
            <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
              <input value={content.articles[addingIndex].seoTitle || ""} onChange={(event) => updateArticle(addingIndex, "seoTitle", event.target.value)} placeholder="SEO title" className="w-full rounded border border-neutral-300 p-2 text-sm" />
              <textarea value={content.articles[addingIndex].seoDescription || ""} onChange={(event) => updateArticle(addingIndex, "seoDescription", event.target.value)} placeholder="SEO description" rows={2} className="w-full rounded border border-neutral-300 p-2 text-sm" />
            </div>
          </div>
          <aside className="space-y-5 border-t border-neutral-200 pt-5 lg:border-l lg:border-t-0 lg:pl-5">
            <div><p className="mb-2 text-xs">Visibility</p><label className="block text-sm"><input type="radio" checked={content.articles[addingIndex].visibility !== "hidden"} onChange={() => updateArticle(addingIndex, "visibility", "visible")} /> Visible</label><label className="mt-2 block text-sm"><input type="radio" checked={content.articles[addingIndex].visibility === "hidden"} onChange={() => updateArticle(addingIndex, "visibility", "hidden")} /> Hidden</label></div>
            <div><p className="mb-2 text-xs">Image</p><ImageUploadField url={content.articles[addingIndex].imageUrl} onChange={(url) => updateArticle(addingIndex, "imageUrl", url)} /></div>
            <div><p className="mb-2 text-xs font-medium">Organization</p><input value={content.articles[addingIndex].author || ""} onChange={(event) => updateArticle(addingIndex, "author", event.target.value)} placeholder="Author" className="mb-2 w-full rounded border border-neutral-300 p-2 text-sm" /><input value={content.articles[addingIndex].category} onChange={(event) => updateArticle(addingIndex, "category", event.target.value)} placeholder="Blog" className="mb-2 w-full rounded border border-neutral-300 p-2 text-sm" /><input value={content.articles[addingIndex].tags || ""} onChange={(event) => updateArticle(addingIndex, "tags", event.target.value)} placeholder="Tags" className="w-full rounded border border-neutral-300 p-2 text-sm" /></div>
            <select value={content.articles[addingIndex].template || "Default blog post"} onChange={(event) => updateArticle(addingIndex, "template", event.target.value)} className="w-full rounded border border-neutral-300 p-2 text-sm"><option>Default blog post</option><option>Featured blog post</option></select>
          </aside>
          <div className="flex gap-2 border-t border-neutral-200 pt-4 lg:col-span-2"><button type="button" onClick={cancelAdding} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm">Cancel</button><button type="button" onClick={() => { setAddingIndex(null); save(); }} disabled={isSaving} className="rounded-lg bg-[#202020] px-5 py-2 text-sm font-semibold text-white">{isSaving ? "Saving..." : "Save blog post"}</button></div>
        </section>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left text-xs">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
            <tr>
              <th className="w-12 px-4 py-3"><input type="checkbox" aria-label="Select all posts" /></th>
              <th className="px-3 py-3 font-medium">Title</th>
              <th className="px-3 py-3 font-medium">Visibility</th>
              <th className="px-3 py-3 font-medium">Author</th>
              <th className="px-3 py-3 font-medium">Blog</th>
              <th className="px-3 py-3 font-medium">Updated <SlidersHorizontal className="ml-1 inline h-3 w-3" /></th>
              <th className="px-3 py-3 font-medium">Published</th>
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {visibleArticles.map(({ article, index }) => (
              <tr key={`${article.title}-${index}`} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3 align-top"><input type="checkbox" aria-label={`Select ${article.title || "blog post"}`} /></td>
                <td className="max-w-[300px] px-3 py-3">
                  <button type="button" onClick={() => setSelectedIndex(index)} className="flex items-center gap-4 text-left font-semibold hover:underline">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                      {article.imageUrl ? <Image src={article.imageUrl} alt="" fill className="object-cover" unoptimized /> : null}
                    </span>
                    <span>{article.title || "Untitled blog post"}</span>
                  </button>
                </td>
                <td className="px-3 py-3 align-middle"><span className="rounded-md bg-[#b5f77a] px-2 py-1">Visible</span></td>
                <td className="px-3 py-3 align-middle whitespace-nowrap">Ecosmok Editorial Team</td>
                <td className="px-3 py-3 align-middle">{article.category || "News"}</td>
                <td className="px-3 py-3 align-middle whitespace-nowrap">{article.date || "Not published"}</td>
                <td className="px-3 py-3 align-middle whitespace-nowrap">{article.date || "Not published"}</td>
                <td className="px-3 py-3 align-middle"><button type="button" onClick={() => setSelectedIndex(index)} aria-label="More options"><MoreHorizontal className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedArticle && selectedIndex !== null && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white" onClick={() => setSelectedIndex(null)}>
          <section className="mx-auto min-h-screen max-w-6xl p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
              <h2 className="text-2xl font-medium">Edit blog post</h2>
              <button type="button" onClick={() => setSelectedIndex(null)} aria-label="Close editor"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div>
                <label className="mb-1 block text-xs">Title</label>
                <input value={selectedArticle.title} onChange={(event) => updateArticle(selectedIndex, "title", event.target.value)} placeholder="e.g., Blog about your latest products or deals" className="mb-4 w-full rounded-lg border border-neutral-300 p-3 text-sm" />
                <label className="mb-1 block text-xs">Content</label>
                <div className="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3">
                  <label className="cursor-pointer rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-medium hover:bg-neutral-100">
                    Add HTML file
                    <input type="file" accept=".html,.htm,text/html" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importHtmlFile(file, selectedIndex); event.currentTarget.value = ""; }} />
                  </label>
                  <span className="text-xs text-neutral-500">Import an .html or .htm file (max 2 MB)</span>
                </div>
                <BlogContentEditor value={selectedArticle.content || ""} onChange={(value) => updateArticle(selectedIndex, "content", value)} />
                <label className="mb-1 mt-5 block text-xs">Excerpt</label>
                <textarea value={selectedArticle.summary} onChange={(event) => updateArticle(selectedIndex, "summary", event.target.value)} placeholder="Add a summary of the post" rows={3} className="w-full rounded-lg border border-neutral-300 p-3 text-sm" />
                <h3 className="mb-2 mt-6 text-sm font-medium">Metafields</h3>
                <div className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-2">
                  <input value={selectedArticle.collection || ""} onChange={(event) => updateArticle(selectedIndex, "collection", event.target.value)} placeholder="collection" className="rounded border border-neutral-300 p-2 text-sm" />
                  <input value={selectedArticle.overviewList || ""} onChange={(event) => updateArticle(selectedIndex, "overviewList", event.target.value)} placeholder="overview_list" className="rounded border border-neutral-300 p-2 text-sm" />
                </div>
                <h3 className="mb-2 mt-6 text-sm font-medium">Search engine listing</h3>
                <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
                  <input value={selectedArticle.seoTitle || ""} onChange={(event) => updateArticle(selectedIndex, "seoTitle", event.target.value)} placeholder="SEO title" className="w-full rounded border border-neutral-300 p-2 text-sm" />
                  <textarea value={selectedArticle.seoDescription || ""} onChange={(event) => updateArticle(selectedIndex, "seoDescription", event.target.value)} placeholder="SEO description" rows={2} className="w-full rounded border border-neutral-300 p-2 text-sm" />
                </div>
              </div>
              <aside className="space-y-5 border-t border-neutral-200 pt-5 lg:border-l lg:border-t-0 lg:pl-5">
                <div><p className="mb-2 text-xs">Visibility</p><label className="block text-sm"><input type="radio" checked={selectedArticle.visibility !== "hidden"} onChange={() => updateArticle(selectedIndex, "visibility", "visible")} /> Visible</label><label className="mt-2 block text-sm"><input type="radio" checked={selectedArticle.visibility === "hidden"} onChange={() => updateArticle(selectedIndex, "visibility", "hidden")} /> Hidden</label></div>
                <div><p className="mb-2 text-xs">Image</p><ImageUploadField url={selectedArticle.imageUrl} onChange={(url) => updateArticle(selectedIndex, "imageUrl", url)} /></div>
                <div><p className="mb-2 text-xs font-medium">Organization</p><input value={selectedArticle.author || ""} onChange={(event) => updateArticle(selectedIndex, "author", event.target.value)} placeholder="Author" className="mb-2 w-full rounded border border-neutral-300 p-2 text-sm" /><input value={selectedArticle.category} onChange={(event) => updateArticle(selectedIndex, "category", event.target.value)} placeholder="Blog" className="mb-2 w-full rounded border border-neutral-300 p-2 text-sm" /><input value={selectedArticle.tags || ""} onChange={(event) => updateArticle(selectedIndex, "tags", event.target.value)} placeholder="Tags" className="mb-2 w-full rounded border border-neutral-300 p-2 text-sm" /><input value={selectedArticle.date} onChange={(event) => updateArticle(selectedIndex, "date", event.target.value)} placeholder="Published date" className="mb-2 w-full rounded border border-neutral-300 p-2 text-sm" /><input value={selectedArticle.readTime} onChange={(event) => updateArticle(selectedIndex, "readTime", event.target.value)} placeholder="Read time" className="mb-2 w-full rounded border border-neutral-300 p-2 text-sm" /><input value={selectedArticle.href} onChange={(event) => updateArticle(selectedIndex, "href", event.target.value)} placeholder="Post link" className="w-full rounded border border-neutral-300 p-2 text-sm" /></div>
                <select value={selectedArticle.template || "Default blog post"} onChange={(event) => updateArticle(selectedIndex, "template", event.target.value)} className="w-full rounded border border-neutral-300 p-2 text-sm"><option>Default blog post</option><option>Featured blog post</option></select>
              </aside>
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-4">
              <button type="button" onClick={() => removeArticle(selectedIndex)} className="text-sm text-red-600"><Trash2 className="mr-1 inline h-4 w-4" /> Delete post</button>
              <button type="button" onClick={save} disabled={isSaving} className="rounded-lg bg-[#202020] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {isSaving && <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />} Save post
              </button>
            </div>
          </section>
        </div>
      )}
      {saved && <p className="fixed bottom-6 right-6 rounded-lg bg-green-700 px-4 py-3 text-sm text-white shadow-lg">{typeof saved === "string" ? saved : "Blog post saved."}</p>}
    </div>
  );
}
