-- Development-only sample data. Runs on `supabase db reset` (local stack), never
-- on `supabase db push` unless --include-seed is passed. Do not use in production.

insert into public.businesses (name, category_id, description, address, latitude, longitude)
select v.name, c.id, v.description, v.address, v.latitude, v.longitude
from (values
  ('Sample Café', 'cafes', 'Placeholder business for development.', '100 NE 1st Ave, Miami, FL 33132', 25.7751, -80.1937),
  ('Sample Bookstore', 'retail', 'Placeholder business for development.', '200 Miracle Mile, Coral Gables, FL 33134', 25.7494, -80.2605),
  ('Sample Museum', 'museums', 'Placeholder business for development.', '1103 Biscayne Blvd, Miami, FL 33132', 25.7859, -80.1868),
  ('Sample Park', 'parks', 'Placeholder business for development.', '301 Biscayne Blvd, Miami, FL 33132', 25.7753, -80.1861)
) as v(name, category_slug, description, address, latitude, longitude)
join public.categories c on c.slug = v.category_slug;

insert into public.business_sensory_tags (business_id, tag_id, source)
select b.id, t.id, 'business'
from public.businesses b
join public.sensory_tags t on (b.name, t.label) in (
  ('Sample Café', 'Background music'),
  ('Sample Café', 'Strong food smells'),
  ('Sample Bookstore', 'Quiet'),
  ('Sample Bookstore', 'Natural light'),
  ('Sample Museum', 'Sensory-friendly hours'),
  ('Sample Museum', 'Quiet room or area'),
  ('Sample Park', 'Spacious'),
  ('Sample Park', 'Outdoor seating')
);
