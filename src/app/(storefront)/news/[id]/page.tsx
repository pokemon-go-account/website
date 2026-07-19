import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getNewsArticleById, getRelatedNewsArticles } from "@/features/news/actions";
import { ArticleData } from "@/features/news/types";
import { Calendar, Clock, Eye, ChevronLeft, Tag, Share2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { ArticleActionsClient } from "./article-actions-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

const DEFAULT_ARTICLE_SEO_KEYWORDS = [
  "pokemon go accounts",
  "pokemon go",
  "buy pokemon go accounts",
  "buy pokemon go pokemon",
  "rare pokemon",
  "cheap pokemon go accounts",
  "mewtwo pokemon go",
  "buy pokemon go",
  "pokemon go store",
  "buy pokemon account",
  "rare pokémon",
  "pokemon go raids",
  "pokemon go dragonite",
  "best place to buy pokemon go accounts",
  "pokemon go services",
  "best pokemon go account",
  "charizard pokemon go",
  "buy stardust pokemon go",
  "level 80 pokemon go account",
  "purchase pokemon go account",
  "shiny pokemon for sale pokemon go",
  "buy cheap pokemon go accounts",
  "pokemon raid"
];

// Generate dynamic SEO metadata for each specific article
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getNewsArticleById(id);

  if (!article) {
    return {
      title: "Article Not Found | Pokémon GO Services",
      description: "The requested news article could not be located.",
    };
  }

  const pageTitle = article.seoTitle || `${article.title} | Pokémon GO Services`;
  const pageDescription = article.seoDescription || article.excerpt;
  const customKeywords = article.seoKeywords?.length ? article.seoKeywords : article.tags;
  const pageKeywords = Array.from(new Set([...customKeywords, ...DEFAULT_ARTICLE_SEO_KEYWORDS]));

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    authors: [{ name: article.author.name }],
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      images: [
        {
          url: article.coverImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [article.coverImage],
    },
    alternates: {
      canonical: `/news/${article.articleId}`,
    },
  };
}

export default async function NewsArticleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const article = await getNewsArticleById(id);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedNewsArticles(article.articleId, article.category);

  // Construct Google NewsArticle JSON-LD Structured Data
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.excerpt,
    "image": [article.coverImage],
    "datePublished": article.publishedAt,
    "dateModified": article.publishedAt,
    "author": {
      "@type": "Person",
      "name": article.author.name,
      "jobTitle": article.author.role,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Pokémon GO Services",
      "logo": {
        "@type": "ImageObject",
        "url": "https://pokemongoservices.com/logo.png",
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://pokemongoservices.com/news/${article.articleId}`,
    },
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#070709] text-zinc-900 dark:text-zinc-100 py-8 md:py-12">
      {/* Inject JSON-LD Structured Data for Search Engine Optimization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Navigation & Breadcrumbs */}
        <div className="flex items-center justify-between">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to News & Updates</span>
          </Link>

          <span className="px-3 py-1 rounded-full bg-[#6133e1]/15 border border-[#6133e1]/30 text-[#6133e1] dark:text-[#a78bfa] text-xs font-bold uppercase tracking-wider">
            {article.category}
          </span>
        </div>

        {/* Header Section */}
        <header className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-zinc-200 dark:border-white/10 py-4">
            {/* Author details */}
            <div className="flex items-center gap-3">
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                width={44}
                height={44}
                className="rounded-full ring-2 ring-[#6133e1]/30 object-cover"
              />
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {article.author.name}
                </p>
                <p className="text-xs text-zinc-500">{article.author.role}</p>
              </div>
            </div>

            {/* Metadata & Actions */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(article.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {article.readTime}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {article.views} views
              </span>

              <ArticleActionsClient articleId={article.articleId} title={article.title} />
            </div>
          </div>
        </header>

        {/* Article Featured Cover Image */}
        <div className="relative h-72 sm:h-[420px] w-full rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/10">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Article Content */}
        <main className="bg-white dark:bg-[#111116] rounded-2xl p-6 sm:p-10 border border-zinc-200 dark:border-white/10 shadow-sm space-y-6">
          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-4 text-zinc-800 dark:text-zinc-200 leading-relaxed">
            {article.content.split("\n\n").map((block, idx) => {
              const trimmed = block.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith("# ")) {
                return (
                  <h1 key={idx} className="text-2xl sm:text-3xl font-black mt-8 mb-4 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-white/10 pb-3">
                    {trimmed.replace("# ", "")}
                  </h1>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h2 key={idx} className="text-xl sm:text-2xl font-bold mt-6 mb-3 text-[#6133e1] dark:text-[#a78bfa]">
                    {trimmed.replace("## ", "")}
                  </h2>
                );
              }
              if (trimmed.startsWith("### ")) {
                return (
                  <h3 key={idx} className="text-lg font-bold mt-4 mb-2 text-zinc-900 dark:text-white">
                    {trimmed.replace("### ", "")}
                  </h3>
                );
              }
              if (trimmed.startsWith("> ")) {
                return (
                  <div key={idx} className="p-4 rounded-xl bg-[#6133e1]/10 border-l-4 border-[#6133e1] text-xs sm:text-sm my-4 space-y-1">
                    {trimmed.replace("> ", "")}
                  </div>
                );
              }
              if (trimmed.startsWith("- ") || trimmed.startsWith("1. ")) {
                const items = trimmed.split("\n");
                return (
                  <ul key={idx} className="list-disc list-inside space-y-2 my-4 text-sm text-zinc-700 dark:text-zinc-300">
                    {items.map((it, i) => (
                      <li key={i} className="leading-relaxed">
                        {it.replace(/^[-*]|\d+\.\s*/, "")}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={idx} className="text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {trimmed}
                </p>
              );
            })}
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="pt-6 border-t border-zinc-100 dark:border-white/5 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-500 mr-2">Tags:</span>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-650 dark:text-zinc-400 text-xs font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </main>

        {/* Author Footer Card */}
        <div className="rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 dark:from-[#121118] dark:to-[#090810] p-6 text-white border border-zinc-800 dark:border-white/10 flex flex-col sm:flex-row items-center gap-5">
          <Image
            src={article.author.avatar}
            alt={article.author.name}
            width={64}
            height={64}
            className="rounded-full ring-4 ring-[#6133e1]/40 object-cover shrink-0"
          />
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h4 className="text-base font-bold">{article.author.name}</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6133e1]/30 text-[#a78bfa] uppercase">
                {article.author.role}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              Published on Pokémon GO Services. Delivering accurate, real-time game analytics, auction guides, and verified account safety protocols.
            </p>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold tracking-tight">Related Articles & Guides</h3>
              <Link href="/news" className="text-xs font-bold text-[#6133e1] dark:text-purple-400 hover:underline">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.articleId}
                  href={`/news/${rel.articleId}`}
                  className="group rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111116] p-4 flex flex-col justify-between hover:border-[#6133e1]/50 transition-all shadow-xs"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#6133e1] dark:text-purple-400 uppercase">
                      {rel.category}
                    </span>
                    <h4 className="text-xs font-bold group-hover:text-[#6133e1] dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                  </div>
                  <div className="pt-3 mt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{rel.readTime}</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </article>
    </div>
  );
}
