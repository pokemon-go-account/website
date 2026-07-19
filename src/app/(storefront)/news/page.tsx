import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllNewsArticles } from "@/features/news/actions";
import { ArticleData } from "@/features/news/types";
import { Calendar, Clock, Eye, Sparkles, ArrowRight, Tag, BookOpen, ShieldCheck, Newspaper } from "lucide-react";
import { NewsClientFilter } from "./news-client-filter";

export const metadata: Metadata = {
  title: "Pokémon GO News, Event Guides & Account Buying Market Updates",
  description: "Stay updated with Pokémon GO news, raids, event guides, shiny Pokémon for sale updates, and market trends for buying cheap level 80 Pokémon GO accounts.",
  keywords: [
    "pokemon go accounts",
    "buy pokemon go accounts",
    "buy pokemon go pokemon",
    "rare pokemon",
    "cheap pokemon go accounts",
    "mewtwo pokemon go",
    "buy pokemon go",
    "pokemon go store",
    "buy pokemon account",
    "pokemon go raids",
    "pokemon go dragonite",
    "best place to buy pokemon go accounts",
    "pokemon go services",
    "best pokemon go account",
    "buy stardust pokemon go",
    "level 80 pokemon go account",
    "purchase pokemon go account",
    "shiny pokemon for sale pokemon go",
    "pokemon go shiny",
    "buy cheap pokemon go accounts",
    "pokemon raid"
  ],
  openGraph: {
    title: "Pokémon GO News, Guides & Account Market Updates",
    description: "Get official Pokémon GO event guides, raid counters, auction market updates, and safety guides for purchasing Pokémon GO accounts.",
    type: "website",
  },
};

export default async function NewsPage() {
  const articles = await getAllNewsArticles();
  const featuredArticle = articles.find((a) => a.featured) || articles[0];
  const regularArticles = articles.filter((a) => a.articleId !== featuredArticle?.articleId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#070709] text-zinc-900 dark:text-zinc-100 py-8 md:py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 dark:from-[#12111a] dark:via-[#090810] dark:to-[#12111a] p-8 md:p-12 text-white overflow-hidden shadow-2xl border border-zinc-800 dark:border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#6133e1]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6133e1]/20 border border-[#6133e1]/40 text-[#a78bfa] text-xs font-bold uppercase tracking-wider">
              <Newspaper className="h-3.5 w-3.5" />
              <span>Official News Hub & Blog</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Latest News, Strategy Guides & Platform Updates
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed font-light">
              Explore in-depth Pokémon GO event breakdowns, PvP meta analyses, security best practices, and live auction release notes—all with dedicated canonical URLs for seamless indexing.
            </p>
          </div>
        </div>

        {/* Featured Article Hero */}
        {featuredArticle && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold tracking-tight">Featured Story</h2>
            </div>

            <Link
              href={`/news/${featuredArticle.articleId}`}
              className="group relative block rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111115] overflow-hidden shadow-lg hover:shadow-2xl hover:border-[#6133e1]/50 transition-all duration-300"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="relative lg:col-span-7 h-64 sm:h-80 lg:h-auto min-h-[300px] overflow-hidden">
                  <Image
                    src={featuredArticle.coverImage}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden" />
                  <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#6133e1] text-white text-xs font-bold shadow-md">
                      {featuredArticle.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-500/90 text-black font-extrabold text-xs shadow-md">
                      FEATURED
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(featuredArticle.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {featuredArticle.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {featuredArticle.views} views
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold group-hover:text-[#6133e1] dark:group-hover:text-purple-400 transition-colors leading-snug">
                      {featuredArticle.title}
                    </h3>

                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed line-clamp-3">
                      {featuredArticle.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src={featuredArticle.author.avatar}
                        alt={featuredArticle.author.name}
                        width={36}
                        height={36}
                        className="rounded-full ring-2 ring-[#6133e1]/30 object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">
                          {featuredArticle.author.name}
                        </p>
                        <p className="text-[10px] text-zinc-500">{featuredArticle.author.role}</p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6133e1] dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                      <span>Read Article</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Interactive Filter & Articles Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">All Articles & Updates</h2>
            <span className="text-xs font-semibold text-zinc-500">
              Showing {articles.length} publications
            </span>
          </div>

          <NewsClientFilter articles={regularArticles} />
        </section>

        {/* Newsletter & SEO Trust Section */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-blue-900/30 via-[#6133e1]/20 to-purple-900/30 border border-[#6133e1]/30 p-8 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-[#6133e1]/20 text-[#a78bfa] mb-1">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Never Miss a Pokémon GO Event or Auction Drop</h3>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
            All news articles and updates published on Pokémon GO Services feature custom permanent article IDs, canonical schema tags, and instant real-time indexing.
          </p>
        </div>

      </div>
    </div>
  );
}
