"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArticleData } from "@/features/news/types";
import { Search, Calendar, Clock, Eye, Tag, ArrowRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["All", "Updates", "Guides & Events", "Marketplace", "Security", "Community"] as const;

interface NewsClientFilterProps {
  articles: ArticleData[];
}

export function NewsClientFilter({ articles }: NewsClientFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory =
        activeCategory === "All" || article.category === activeCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [articles, activeCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search and Category Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#6133e1] text-white shadow-md shadow-[#6133e1]/20 scale-105"
                    : "bg-white dark:bg-[#121118] border border-zinc-200 dark:border-white/10 text-zinc-650 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search news & guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121118] text-xs font-medium placeholder:text-zinc-400 focus:outline-none focus:border-[#6133e1] transition-colors"
          />
        </div>
      </div>

      {/* Grid of Articles */}
      {filteredArticles.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredArticles.map((article) => (
              <motion.div
                key={article.articleId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={`/news/${article.articleId}`}
                  className="group flex flex-col h-full rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111116] overflow-hidden shadow-sm hover:shadow-xl hover:border-[#6133e1]/50 transition-all duration-300"
                >
                  {/* Image Header */}
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.readTime}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-[#6133e1] dark:group-hover:text-purple-400 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>

                      <p className="text-xs text-zinc-550 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>

                    {/* Footer / Author info */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image
                          src={article.author.avatar}
                          alt={article.author.name}
                          width={24}
                          height={24}
                          className="rounded-full ring-1 ring-[#6133e1]/20 object-cover"
                        />
                        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[110px]">
                          {article.author.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#6133e1] dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
                        <span>Read</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 bg-white/50 dark:bg-[#111116]/50 space-y-3">
          <BookOpen className="h-10 w-10 text-zinc-400 mx-auto" />
          <h3 className="text-base font-bold">No articles found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different category filter.
          </p>
        </div>
      )}
    </div>
  );
}
