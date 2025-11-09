-- NEWS テーブル作成
CREATE TABLE IF NOT EXISTS public.news (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  genre text NOT NULL,
  body_html text NOT NULL,
  target_site text NOT NULL CHECK (target_site IN ('LP', 'HP', 'BOTH')),
  status text NOT NULL CHECK (status IN ('draft', 'published')),
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス作成（公開日降順、ステータス、対象サイト）
CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_status ON public.news(status);
CREATE INDEX IF NOT EXISTS idx_news_target_site ON public.news(target_site);

-- 複合インデックス（公開記事のクエリ最適化）
CREATE INDEX IF NOT EXISTS idx_news_published_filter 
  ON public.news(status, published_at DESC, target_site) 
  WHERE status = 'published';

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_updated_at 
  BEFORE UPDATE ON public.news 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

