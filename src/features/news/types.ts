export interface ArticleData {
  articleId: string;
  title: string;
  excerpt: string;
  content: string;
  category: "Updates" | "Guides & Events" | "Marketplace" | "Security" | "Community";
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  coverImage: string;
  tags: string[];
  publishedAt: string;
  readTime: string;
  featured?: boolean;
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface ArticleInputData {
  articleId: string;
  title: string;
  excerpt: string;
  content: string;
  category: "Updates" | "Guides & Events" | "Marketplace" | "Security" | "Community";
  authorName?: string;
  authorRole?: string;
  authorAvatar?: string;
  coverImage: string;
  tags?: string[];
  readTime?: string;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}
