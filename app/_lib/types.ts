export type News = {
  id: number;
  title: string;
  body_html: string;
  target_site: "LP" | "HP" | "BOTH";
  status: "draft" | "published";
  published_at: string; // ISO
  created_at: string;
  updated_at: string;
};

export type NewsInsert = Omit<News, "id" | "created_at" | "updated_at">;
export type NewsUpdate = Partial<NewsInsert> & { id: number };
