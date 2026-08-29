-- Supabase Storage pentru fotografii (portofoliu frizer, copertă/galerie salon)
-- + coloana de galerie a frizerului, care lipsea din schema inițială.

alter table public.barbers
  add column if not exists gallery text[] not null default '{}';

-- Un frizer își gestionează propriul portofoliu, indiferent de proprietarul salonului.
create policy "barbers: self update" on public.barbers for update using (
  profile_id = auth.uid()
);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media: public read" on storage.objects for select using (
  bucket_id = 'media'
);

create policy "media: authenticated upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'media'
);

create policy "media: owner update" on storage.objects for update to authenticated using (
  bucket_id = 'media' and owner = auth.uid()
);

create policy "media: owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'media' and owner = auth.uid()
);
