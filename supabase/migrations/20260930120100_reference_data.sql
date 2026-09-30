-- Reference data every environment needs (production included), so it lives in a
-- migration rather than seed.sql. Starter set; finalize with the client.

insert into public.categories (slug, name) values
  ('restaurants', 'Restaurants'),
  ('cafes', 'Cafés'),
  ('retail', 'Retail'),
  ('grocery', 'Grocery'),
  ('entertainment', 'Entertainment'),
  ('museums', 'Museums & Culture'),
  ('parks', 'Parks & Outdoors'),
  ('health', 'Health & Wellness'),
  ('services', 'Services');

insert into public.sensory_tags (category, label) values
  -- noise
  ('noise', 'Quiet'),
  ('noise', 'Moderate noise'),
  ('noise', 'Loud'),
  ('noise', 'Background music'),
  ('noise', 'Sudden loud sounds'),
  -- lighting
  ('lighting', 'Natural light'),
  ('lighting', 'Dim lighting'),
  ('lighting', 'Bright lighting'),
  ('lighting', 'Fluorescent lighting'),
  ('lighting', 'Flashing lights or screens'),
  -- crowds
  ('crowds', 'Usually uncrowded'),
  ('crowds', 'Busy at peak times'),
  ('crowds', 'Often crowded'),
  ('crowds', 'Lines or waiting'),
  -- smells
  ('smells', 'Minimal smells'),
  ('smells', 'Strong food smells'),
  ('smells', 'Strong fragrances'),
  ('smells', 'Cleaning chemicals'),
  -- space
  ('space', 'Spacious'),
  ('space', 'Tight spaces'),
  ('space', 'Outdoor seating'),
  ('space', 'Easy exits'),
  -- accommodations
  ('accommodations', 'Quiet room or area'),
  ('accommodations', 'Sensory-friendly hours'),
  ('accommodations', 'Noise-canceling headphones available'),
  ('accommodations', 'Staff trained in sensory needs');
