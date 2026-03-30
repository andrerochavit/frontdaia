-- Create mind_map_items table to store user's mind map items
CREATE TABLE public.mind_map_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  principle TEXT NOT NULL CHECK (principle IN ('bird-in-hand', 'affordable-loss', 'crazy-quilt', 'lemonade', 'pilot-in-plane')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on mind_map_items
ALTER TABLE public.mind_map_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mind_map_items
CREATE POLICY "Users can view their own mind map items" 
ON public.mind_map_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mind map items" 
ON public.mind_map_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mind map items" 
ON public.mind_map_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mind map items" 
ON public.mind_map_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mind_map_items_updated_at
  BEFORE UPDATE ON public.mind_map_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
