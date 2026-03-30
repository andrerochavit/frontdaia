-- Ensure the csvandcv bucket exists
insert into storage.buckets (id, name, public)
values ('csvandcv', 'csvandcv', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload objects to csvandcv
DROP POLICY IF EXISTS "Allow csvandcv inserts" ON storage.objects;
CREATE POLICY "Allow csvandcv inserts" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'csvandcv' AND auth.uid() = owner);

-- Allow authenticated users to read their own objects from csvandcv
DROP POLICY IF EXISTS "Allow csvandcv owner read" ON storage.objects;
CREATE POLICY "Allow csvandcv owner read" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'csvandcv' AND auth.uid() = owner);
