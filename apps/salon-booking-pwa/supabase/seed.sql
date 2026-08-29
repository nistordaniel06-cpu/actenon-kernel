-- Date demo pentru NearCut — catalog public (saloane, frizeri, servicii,
-- produse, roata zilnică, personal, comunitate). Nu include programări,
-- recenzii sau puncte, fiindcă acelea aparțin unor utilizatori auth reali și
-- se creează prin folosirea aplicației după ce te autentifici.
--
-- Rulează după 0001_init.sql: `supabase db reset` local, sau lipește în
-- SQL editor pe un proiect nou.

insert into public.salons
  (id, name, type, cover_image, gallery, logo, rating, review_count, address, lat, lng, price_level, open_now_until, tags, has_hot_deal)
values
  ('salon-1', 'Urban Cuts', 'barbershop', '/images/salons/gentry-room.jpg',
    array['/images/salons/gentry-1.jpg', '/images/salons/gentry-2.jpg', '/images/salons/gentry-3.jpg', '/images/salons/gentry-4.jpg'],
    '/images/salons/gentry-logo.png', 4.9, 513, 'Calea Victoriei 91, București', 44.4415, 26.0973, 2, '21:00',
    array['Fade', 'Îngrijire barbă', 'Fără programare'], true),
  ('salon-2', 'Gentlemen''s Club', 'barbershop', '/images/salons/darios.jpg',
    array['/images/salons/darios-1.jpg', '/images/salons/darios-2.jpg', '/images/salons/darios-3.jpg'],
    '/images/salons/darios-logo.png', 5.0, 802, 'Str. Dorobanți 45, București', 44.4586, 26.0913, 1, '20:00',
    array['Clasic', 'Bărbierit cald', 'Copii'], false),
  ('salon-3', 'Lumière Hair Studio', 'salon', '/images/salons/lumiere.jpg',
    array['/images/salons/lumiere-1.jpg', '/images/salons/lumiere-2.jpg', '/images/salons/lumiere-3.jpg', '/images/salons/lumiere-4.jpg'],
    '/images/salons/lumiere-logo.png', 4.8, 367, 'Bd. Unirii 12, București', 44.4268, 26.1025, 3, '19:00',
    array['Colorist', 'Balayage', 'Premium'], true),
  ('salon-4', 'Uptown Fade Co.', 'barbershop', '/images/salons/uptown-fade.jpg',
    array['/images/salons/uptown-1.jpg', '/images/salons/uptown-2.jpg', '/images/salons/uptown-3.jpg'],
    '/images/salons/uptown-logo.png', 4.7, 221, 'Str. Vasile Lascăr 22, București', 44.4472, 26.1063, 2, '22:00',
    array['Program prelungit', 'Fade', 'Design linii'], false);

insert into public.barbers
  (id, salon_id, name, avatar, title, rating, review_count, years_experience, specialties, available_now, next_slot_at)
values
  ('barber-1', 'salon-1', 'Alex Popescu', '/images/avatars/12.png', 'Frizer senior', 4.9, 312, 9, array['Fade', 'Aranjat barbă'], true, now() + interval '15 minutes'),
  ('barber-2', 'salon-1', 'Ioana Marin', '/images/avatars/47.png', 'Stilist senior', 4.8, 201, 6, array['Vopsit', 'Balayage'], false, now() + interval '120 minutes'),
  ('barber-3', 'salon-2', 'Cristian Munteanu', '/images/avatars/33.png', 'Proprietar / Frizer', 5.0, 458, 14, array['Tuns clasic', 'Bărbierit clasic'], true, now() + interval '5 minutes'),
  ('barber-4', 'salon-2', 'Radu Stanciu', '/images/avatars/25.png', 'Frizer', 4.7, 129, 4, array['Fade', 'Tuns copii'], true, now() + interval '30 minutes'),
  ('barber-5', 'salon-3', 'Elena Vasilescu', '/images/avatars/45.png', 'Colorist', 4.9, 276, 8, array['Balayage', 'Vopsit complet'], false, now() + interval '180 minutes'),
  ('barber-6', 'salon-3', 'Andrei Neagu', '/images/avatars/14.png', 'Stilist', 4.6, 98, 3, array['Styling'], true, now() + interval '45 minutes'),
  ('barber-7', 'salon-4', 'Vlad Dumitrescu', '/images/avatars/51.png', 'Frizer senior', 4.8, 341, 11, array['Fade', 'Linii de contur'], true, now() + interval '10 minutes'),
  ('barber-8', 'salon-1', 'Mihai Ionescu', '/images/avatars/59.png', 'Frizer', 4.9, 187, 7, array['Tuns fade', 'Tuns + barbă'], true, now() + interval '20 minutes');

insert into public.services (id, salon_id, name, category, duration_min, price, description) values
  ('svc-1', 'salon-1', 'Tuns clasic', 'hair', 40, 70, 'Tuns, spălat și styling.'),
  ('svc-2', 'salon-1', 'Tuns fade', 'hair', 45, 80, 'Fade curat cu contur precis.'),
  ('svc-3', 'salon-1', 'Aranjat barbă', 'beard', 25, 45, 'Conturare, prindere cu prosop cald.'),
  ('svc-4', 'salon-2', 'Bărbierit clasic', 'beard', 30, 55, null),
  ('svc-5', 'salon-1', 'Tuns + barbă', 'combo', 60, 100, 'Pachetul nostru cel mai cerut.'),
  ('svc-6', 'salon-3', 'Vopsit complet', 'color', 90, 180, null),
  ('svc-7', 'salon-3', 'Balayage', 'color', 150, 260, null),
  ('svc-8', 'salon-3', 'Styling', 'hair', 30, 50, null),
  ('svc-9', 'salon-3', 'Tratament scalp', 'spa', 30, 65, null),
  ('svc-10', 'salon-2', 'Tuns copii', 'kids', 25, 40, null),
  ('svc-11', 'salon-3', 'Facial deluxe', 'spa', 50, 120, null),
  ('svc-12', 'salon-1', 'Tuns periuță', 'hair', 20, 40, null);

-- svc-1..5 și svc-12 sunt oferite și de salon-2/salon-4 în UI; schema leagă
-- fiecare serviciu de salonul care îl definește ca preț de bază — pentru
-- servicii identice oferite de mai multe saloane, duplică rândul cu id nou
-- per salon atunci când adaugi date reale (ex: 'svc-2-salon-4').
insert into public.services (id, salon_id, name, category, duration_min, price, description) values
  ('svc-4-salon-1', 'salon-1', 'Bărbierit clasic', 'beard', 30, 55, null),
  ('svc-5-salon-2', 'salon-2', 'Tuns + barbă', 'combo', 60, 100, 'Pachetul nostru cel mai cerut.'),
  ('svc-12-salon-2', 'salon-2', 'Tuns periuță', 'hair', 20, 40, null),
  ('svc-1-salon-4', 'salon-4', 'Tuns clasic', 'hair', 40, 70, 'Tuns, spălat și styling.'),
  ('svc-2-salon-4', 'salon-4', 'Tuns fade', 'hair', 45, 80, 'Fade curat cu contur precis.'),
  ('svc-3-salon-4', 'salon-4', 'Aranjat barbă', 'beard', 25, 45, 'Conturare, prindere cu prosop cald.'),
  ('svc-5-salon-4', 'salon-4', 'Tuns + barbă', 'combo', 60, 100, 'Pachetul nostru cel mai cerut.'),
  ('svc-12-salon-4', 'salon-4', 'Tuns periuță', 'hair', 20, 40, null);

insert into public.staff (id, salon_id, barber_id, shift, commission_percent) values
  ('staff-1', 'salon-1', 'barber-1', 'Luni–Vineri, 09:00–18:00', 45),
  ('staff-2', 'salon-1', 'barber-2', 'Marți–Sâmbătă, 10:00–19:00', 40),
  ('staff-3', 'salon-1', 'barber-8', 'Miercuri–Duminică, 12:00–21:00', 42);

insert into public.shop_products (id, name, category, price, member_price, image, description, pickup_only) values
  ('prod-1', 'Pomadă Matte Clay', 'pomade', 89, 75, '/images/salons/gentry-1.jpg', 'Fixare medie, finisaj mat, ideală pentru texturi scurte.', true),
  ('prod-2', 'Ulei pentru barbă', 'beard', 79, 65, '/images/salons/darios-1.jpg', 'Hidratare și strălucire, parfum lemnos discret.', true),
  ('prod-3', 'Șampon revitalizant', 'shampoo', 69, 58, '/images/salons/lumiere-1.jpg', 'Curățare blândă, potrivit pentru folosire zilnică.', false),
  ('prod-4', 'Balsam pentru barbă', 'beard', 59, 49, '/images/salons/darios-2.jpg', 'Înmoaie firul de păr și reduce mâncărimea.', false),
  ('prod-5', 'Ceară pentru styling', 'pomade', 65, 55, '/images/salons/uptown-1.jpg', 'Fixare puternică, finisaj natural.', true),
  ('prod-6', 'Foarfecă profesională', 'tools', 349, 299, '/images/salons/gentry-2.jpg', 'Oțel japonez, folosită de echipa Urban Cuts.', false),
  ('prod-7', 'Aparat de tuns 5-în-1', 'tools', 429, 379, '/images/salons/blackout-1.jpg', 'Kit complet pentru întreținere între programări.', false),
  ('prod-8', 'Șampon anti-mătreață', 'shampoo', 72, 62, '/images/salons/lumiere-2.jpg', 'Formulă cu zinc piritionă, recomandat de coloriști.', false);

insert into public.wheel_prizes (id, label, kind, value, color) values
  ('wp-1', '20 puncte', 'points', 20, '#75b82a'),
  ('wp-2', '10% reducere', 'discount', 10, '#181c18'),
  ('wp-3', '50 puncte', 'points', 50, '#86c936'),
  ('wp-4', 'Ulei de barbă', 'product', 0, '#202520'),
  ('wp-5', '5 puncte', 'points', 5, '#75b82a'),
  ('wp-6', '15% reducere', 'discount', 15, '#181c18'),
  ('wp-7', '100 puncte', 'points', 100, '#86c936'),
  ('wp-8', 'Mai încearcă mâine', 'points', 0, '#202520');

insert into public.community_titles (id, barber_id, title, week) values
  ('ct-1', 'barber-1', 'Vocea clienților', '18–24 aug'),
  ('ct-2', 'barber-3', 'Look-ul săptămânii', '18–24 aug'),
  ('ct-4', 'barber-6', 'Revelația săptămânii', '18–24 aug');

insert into public.leaderboard_weekly (barber_id, week, score, bookings_week, rating_week) values
  ('barber-1', '18–24 aug', 96, 24, 4.9),
  ('barber-3', '18–24 aug', 94, 21, 5.0),
  ('barber-7', '18–24 aug', 88, 19, 4.8),
  ('barber-5', '18–24 aug', 85, 15, 4.9),
  ('barber-6', '18–24 aug', 79, 12, 4.6);

insert into public.deals (id, salon_id, service_id, title, discount_percent, start_at, end_at, seats_left) values
  ('deal-1', 'salon-1', 'svc-1', 'Slot liber la 15:00 — Tuns clasic', 30, now(), now() + interval '3 hours', 1),
  ('deal-2', 'salon-3', 'svc-7', 'Balayage — loc rămas azi', 20, now(), now() + interval '4 hours', 2);
