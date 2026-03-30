-- ============================================================
-- EFFECTUATION PROFILES — AI-inferred entrepreneur profile
-- ============================================================
CREATE TABLE public.effectuation_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  quem_sou TEXT NOT NULL DEFAULT '',
  o_que_sei TEXT NOT NULL DEFAULT '',
  o_que_quero TEXT NOT NULL DEFAULT '',
  o_que_invisto TEXT NOT NULL DEFAULT '',

  quem_conheco JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.effectuation_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own effectuation profile"
  ON public.effectuation_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own effectuation profile"
  ON public.effectuation_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own effectuation profile"
  ON public.effectuation_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_effectuation_profiles_updated_at
  BEFORE UPDATE ON public.effectuation_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- NETWORK CONTACTS — Strategic network with AI analysis
-- ============================================================
CREATE TABLE public.network_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL DEFAULT '',

  file_url TEXT,
  file_name TEXT,

  extracted_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  extracted_experience TEXT NOT NULL DEFAULT '',
  possible_value TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.network_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own network contacts"
  ON public.network_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own network contacts"
  ON public.network_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network contacts"
  ON public.network_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network contacts"
  ON public.network_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_network_contacts_updated_at
  BEFORE UPDATE ON public.network_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
