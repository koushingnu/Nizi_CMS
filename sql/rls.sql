-- RLS 有効化
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- anon ロールでの読み取りポリシー（公開済み かつ 公開日時を過ぎた記事のみ）
CREATE POLICY "anon_select_published_news" 
  ON public.news 
  FOR SELECT 
  USING (
    status = 'published' 
    AND published_at <= now()
  );

-- service_role での全操作は RLS をバイパスするため、追加ポリシー不要
-- （service_role は自動的に RLS を無視します）

