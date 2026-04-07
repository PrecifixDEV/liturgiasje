-- 1. Tabelas
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('admin', 'reader')) DEFAULT 'reader',
    whatsapp TEXT,
    birth_date DATE,
    preferences JSONB DEFAULT '{}',
    claimed_at TIMESTAMPTZ,
    is_self_registered BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.masses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    time TIME NOT NULL,
    special_description TEXT,
    external_group TEXT, -- Ex: "Catequese"
    month_reference TEXT NOT NULL, -- Ex: "2026-04"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schedule_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mass_id UUID REFERENCES public.masses(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('C', '1L', '2L', 'P', 'L')),
    reader_id UUID REFERENCES public.users(id),
    original_reader_id UUID REFERENCES public.users(id),
    is_confirmed BOOLEAN DEFAULT false,
    is_swap_requested BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    title TEXT,
    type TEXT CHECK (type IN ('Aviso', 'Troca')),
    image_url TEXT,
    audio_url TEXT,
    related_schedule_slot_id UUID REFERENCES public.schedule_slots(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.announcement_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- 2. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;

-- Políticas Users
CREATE POLICY "Users are viewable by authenticated users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas Masses
CREATE POLICY "Masses are viewable by everyone" ON public.masses
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage masses" ON public.masses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Políticas Schedule Slots
CREATE POLICY "Slots are viewable by everyone" ON public.schedule_slots
    FOR SELECT USING (true);

CREATE POLICY "Dono da vaga ou Admin pode editar confirmação/troca" ON public.schedule_slots
    FOR UPDATE USING (
        auth.uid() = reader_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR
        (is_swap_requested = true AND auth.role() = 'authenticated') -- Para assumir troca
    );

CREATE POLICY "Admins can manage slots" ON public.schedule_slots
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Políticas Announcements
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage announcements" ON public.announcements
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Políticas Announcement Views
CREATE POLICY "Users can see their own views and admins can see all" ON public.announcement_views
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Authenticated users can mark as read" ON public.announcement_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Buckets Storage
-- Nota: Buckets devem ser criados via Dashboard ou API. 
-- Nomes recomendados: 'avatars', 'announcement_media' (Públicos)

-- 4. Função para Deleção Automática de Storage
-- Obs: Exige que o Supabase tenha a extensão 'http' ou use o client interno.
-- Como é mais complexo e depende de extensões, recomenda-se limpar via backend 
-- ou usar um Edge Function. Mas aqui está o trigger básico para referência visual.

CREATE OR REPLACE FUNCTION public.handle_announcement_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Lógica de deleção física de arquivos seria aqui
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_announcement_delete
    AFTER DELETE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.handle_announcement_delete();
