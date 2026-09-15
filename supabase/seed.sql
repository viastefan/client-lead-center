-- Demo data for local/dev. Clearly marked as DEMO.
-- Safe to re-run only on an empty database (uses fixed UUIDs).
--
-- Demo website API keys (plaintext, development only — hashes are stored):
--   Abelen Website:     clc_demo_abelen_7f3a9c2e1b4d8f0a
--   Kipp-Menke Website: clc_demo_kipp_9c1e4a7b2d8f0c3e
--   Frank Website:      clc_demo_frank_4b8d1e6a0c9f2d7e
--   Muster Website:     clc_demo_muster_1a2b3c4d5e6f7089
--   Nordlicht Website:  clc_demo_nord_aa11bb22cc33dd44
--   Kipp Karriere:      clc_demo_kipp2_55ee66ff77889900
--   Muster Landing:     clc_demo_muster2_deadbeefcafebabe

insert into public.customers (
  id, name, company_name, contact_name, contact_email, contact_phone, status, notes
) values
  ('11111111-1111-4111-8111-111111111111', 'DEMO Abelen', 'Abelen Immobilien', 'Anna Abelen', 'anna@demo-abelen.example', '+49 221 1000001', 'active', 'DEMO-DATEN — nicht produktiv verwenden.'),
  ('22222222-2222-4222-8222-222222222222', 'DEMO Kipp Menke', 'Kipp Menke GmbH', 'Klaus Kipp', 'klaus@demo-kipp.example', '+49 221 1000002', 'active', 'DEMO-DATEN'),
  ('33333333-3333-4333-8333-333333333333', 'DEMO Frank', 'Frank Kassin', 'Frank Kassin', 'frank@demo-frank.example', '+49 221 1000003', 'active', 'DEMO-DATEN'),
  ('44444444-4444-4444-8444-444444444444', 'DEMO Muster', 'Muster GmbH', 'Max Muster', 'max@demo-muster.example', '+49 221 1000004', 'inactive', 'DEMO-DATEN — Kunde deaktiviert.'),
  ('55555555-5555-4555-8555-555555555555', 'DEMO Nordlicht', 'Nordlicht Consulting', 'Nina Nord', 'nina@demo-nordlicht.example', null, 'active', 'DEMO-DATEN');

insert into public.websites (
  id, customer_id, name, domain, status, active, api_key_hash, last_request_at, last_lead_at
) values
  ('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'Abelen Immobilien', 'abelen-immobilien.de', 'active', true, encode(digest('clc_demo_abelen_7f3a9c2e1b4d8f0a', 'sha256'), 'hex'), now() - interval '2 hours', now() - interval '2 hours'),
  ('aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '22222222-2222-4222-8222-222222222222', 'Kipp Menke', 'kipp-menke.de', 'active', true, encode(digest('clc_demo_kipp_9c1e4a7b2d8f0c3e', 'sha256'), 'hex'), now() - interval '1 day', now() - interval '1 day'),
  ('aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '33333333-3333-4333-8333-333333333333', 'Frank Kassin', 'frank-kassin.de', 'active', true, encode(digest('clc_demo_frank_4b8d1e6a0c9f2d7e', 'sha256'), 'hex'), now() - interval '3 days', now() - interval '3 days'),
  ('aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '44444444-4444-4444-8444-444444444444', 'Muster Website', 'muster.example', 'inactive', false, encode(digest('clc_demo_muster_1a2b3c4d5e6f7089', 'sha256'), 'hex'), now() - interval '20 days', now() - interval '20 days'),
  ('aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', '55555555-5555-4555-8555-555555555555', 'Nordlicht', 'nordlicht.example', 'active', true, encode(digest('clc_demo_nord_aa11bb22cc33dd44', 'sha256'), 'hex'), now() - interval '6 hours', now() - interval '6 hours'),
  ('aaaaaaa6-aaaa-4aaa-8aaa-aaaaaaaaaaa6', '22222222-2222-4222-8222-222222222222', 'Kipp Karriere', 'karriere.kipp-menke.de', 'active', true, encode(digest('clc_demo_kipp2_55ee66ff77889900', 'sha256'), 'hex'), now() - interval '12 hours', now() - interval '12 hours'),
  ('aaaaaaa7-aaaa-4aaa-8aaa-aaaaaaaaaaa7', '44444444-4444-4444-8444-444444444444', 'Muster Landing', 'go.muster.example', 'error', false, encode(digest('clc_demo_muster2_deadbeefcafebabe', 'sha256'), 'hex'), now() - interval '40 days', null);

insert into public.email_accounts (id, customer_id, provider, email, display_name, status)
values
  ('e1111111-e111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'gmail', 'kontakt@demo-abelen.example', 'Abelen Kontakt', 'disconnected'),
  ('e2222222-e222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'microsoft', 'info@demo-kipp.example', 'Kipp Menke Info', 'disconnected'),
  ('e5555555-e555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', 'gmail', 'hello@demo-nordlicht.example', 'Nordlicht', 'error');

insert into public.automations (id, customer_id, name, trigger, action, enabled, configuration)
values
  ('b1111111-b111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'DEMO Neue Anfrage benachrichtigen', 'lead.created', 'notify_client', false, '{"channel":"email"}'::jsonb),
  ('b2222222-b222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'DEMO Eingangsbestätigung', 'lead.created', 'send_confirmation', false, '{}'::jsonb);

insert into public.leads (
  id, customer_id, website_id, name, email, phone, company, message, source, page_url, metadata, status, priority, created_at
) values
  ('c0000001-c000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Lisa Hoffmann', 'lisa.hoffmann@example.com', '+49 170 1111111', null, 'DEMO: Ich interessiere mich für eine Eigentumswohnung in Lindenthal.', 'website', 'https://abelen-immobilien.de/kontakt', '{"demo":true}'::jsonb, 'new', 'high', now() - interval '2 hours'),
  ('c0000002-c000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Thomas Berger', 'thomas.berger@example.com', null, 'Berger Holding', 'DEMO: Bitte um Rückruf wegen Mehrfamilienhaus.', 'website', 'https://abelen-immobilien.de/verkauf', '{"demo":true}'::jsonb, 'in_progress', 'normal', now() - interval '1 day'),
  ('c0000003-c000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Sara Klein', 'sara.klein@example.com', '+49 170 2222222', null, 'DEMO: Besichtigung am Wochenende möglich?', 'website', 'https://abelen-immobilien.de/objekt/12', '{"demo":true}'::jsonb, 'waiting', 'normal', now() - interval '3 days'),
  ('c0000004-c000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'Jonas Weber', 'jonas.weber@example.com', '+49 171 3333333', 'Weber & Partner', 'DEMO: Anfrage zur Zusammenarbeit im Bereich Sanierung.', 'website', 'https://kipp-menke.de/kontakt', '{"demo":true}'::jsonb, 'new', 'urgent', now() - interval '40 minutes'),
  ('c0000005-c000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'Mira Schulz', 'mira.schulz@example.com', null, null, 'DEMO: Können Sie ein Angebot für Fassadenarbeiten erstellen?', 'website', 'https://kipp-menke.de/leistungen', '{"demo":true}'::jsonb, 'replied', 'normal', now() - interval '5 days'),
  ('c0000006-c000-4000-8000-000000000006', '22222222-2222-4222-8222-222222222222', 'aaaaaaa6-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'Paul Richter', 'paul.richter@example.com', '+49 172 4444444', null, 'DEMO: Bewerbung als Bauleiter — Unterlagen folgen per Mail.', 'website', 'https://karriere.kipp-menke.de', '{"demo":true}'::jsonb, 'qualified', 'high', now() - interval '12 hours'),
  ('c0000007-c000-4000-8000-000000000007', '33333333-3333-4333-8333-333333333333', 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'Elena Vogt', 'elena.vogt@example.com', null, 'Vogt Design', 'DEMO: Anfrage für ein Erstgespräch.', 'website', 'https://frank-kassin.de/kontakt', '{"demo":true}'::jsonb, 'new', 'normal', now() - interval '3 days'),
  ('c0000008-c000-4000-8000-000000000008', '33333333-3333-4333-8333-333333333333', 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'David Lang', 'david.lang@example.com', '+49 173 5555555', null, 'DEMO: Bitte um Terminvorschläge nächste Woche.', 'website', 'https://frank-kassin.de', '{"demo":true}'::jsonb, 'in_progress', 'low', now() - interval '8 days'),
  ('c0000009-c000-4000-8000-000000000009', '33333333-3333-4333-8333-333333333333', 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'Hannah Krüger', 'hannah.krueger@example.com', null, null, 'DEMO: Newsletter abbestellen — fälschlich als Lead erfasst.', 'website', 'https://frank-kassin.de', '{"demo":true}'::jsonb, 'spam', 'low', now() - interval '14 days'),
  ('c0000010-c000-4000-8000-000000000010', '44444444-4444-4444-8444-444444444444', 'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'Otto Beispiel', 'otto@example.com', null, 'Beispiel AG', 'DEMO: Alte Anfrage eines inaktiven Kunden.', 'website', 'https://muster.example/kontakt', '{"demo":true}'::jsonb, 'closed', 'low', now() - interval '20 days'),
  ('c0000011-c000-4000-8000-000000000011', '55555555-5555-4555-8555-555555555555', 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'Clara Sommer', 'clara.sommer@example.com', '+49 174 6666666', 'Sommer Labs', 'DEMO: Wir suchen Unterstützung bei der Prozessanalyse.', 'website', 'https://nordlicht.example/kontakt', '{"demo":true}'::jsonb, 'new', 'high', now() - interval '6 hours'),
  ('c0000012-c000-4000-8000-000000000012', '55555555-5555-4555-8555-555555555555', 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'Felix Brandt', 'felix.brandt@example.com', null, null, 'DEMO: Kurze Frage zum Leistungsportfolio.', 'website', 'https://nordlicht.example', '{"demo":true}'::jsonb, 'waiting', 'normal', now() - interval '2 days'),
  ('c0000013-c000-4000-8000-000000000013', '55555555-5555-4555-8555-555555555555', 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'Ida Neumann', 'ida.neumann@example.com', '+49 175 7777777', 'Neumann GmbH', 'DEMO: Angebot für Q4 angefragt.', 'website', 'https://nordlicht.example/leistungen', '{"demo":true}'::jsonb, 'replied', 'normal', now() - interval '9 days'),
  ('c0000014-c000-4000-8000-000000000014', '11111111-1111-4111-8111-111111111111', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Martin Seidel', 'martin.seidel@example.com', null, null, 'DEMO: Kapitalanlage ab 500.000 Euro.', 'website', 'https://abelen-immobilien.de/kapitalanlage', '{"demo":true}'::jsonb, 'qualified', 'urgent', now() - interval '18 hours'),
  ('c0000015-c000-4000-8000-000000000015', '22222222-2222-4222-8222-222222222222', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'Greta Wolf', 'greta.wolf@example.com', '+49 176 8888888', null, 'DEMO: Bitte um Rückmeldung bis Freitag.', 'website', 'https://kipp-menke.de/kontakt', '{"demo":true}'::jsonb, 'closed', 'normal', now() - interval '21 days');

insert into public.conversations (id, customer_id, lead_id, channel, status, created_at) values
  ('d1111111-d111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'c0000001-c000-4000-8000-000000000001', 'website', 'open', now() - interval '2 hours'),
  ('d1111112-d111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 'c0000002-c000-4000-8000-000000000002', 'website', 'open', now() - interval '1 day'),
  ('d2222222-d222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'c0000004-c000-4000-8000-000000000004', 'website', 'open', now() - interval '40 minutes'),
  ('d3333333-d333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 'c0000005-c000-4000-8000-000000000005', 'website', 'open', now() - interval '5 days'),
  ('d2222226-d222-4222-8222-222222222226', '22222222-2222-4222-8222-222222222222', 'c0000006-c000-4000-8000-000000000006', 'website', 'open', now() - interval '12 hours'),
  ('d3333337-d333-4333-8333-333333333337', '33333333-3333-4333-8333-333333333333', 'c0000007-c000-4000-8000-000000000007', 'website', 'open', now() - interval '3 days'),
  ('d5555555-d555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', 'c0000011-c000-4000-8000-000000000011', 'website', 'open', now() - interval '6 hours'),
  ('d1111114-d111-4111-8111-111111111114', '11111111-1111-4111-8111-111111111111', 'c0000014-c000-4000-8000-000000000014', 'website', 'open', now() - interval '18 hours');

insert into public.messages (
  id, customer_id, conversation_id, direction, sender_name, sender_email, body, message_type, ai_generated, created_at
) values
  ('e0000001-e000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'd1111111-d111-4111-8111-111111111111', 'inbound', 'Lisa Hoffmann', 'lisa.hoffmann@example.com', 'DEMO: Ich interessiere mich für eine Eigentumswohnung in Lindenthal.', 'website', false, now() - interval '2 hours'),
  ('e0000002-e000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'd2222222-d222-4222-8222-222222222222', 'inbound', 'Jonas Weber', 'jonas.weber@example.com', 'DEMO: Anfrage zur Zusammenarbeit im Bereich Sanierung.', 'website', false, now() - interval '40 minutes'),
  ('e0000003-e000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'd3333333-d333-4333-8333-333333333333', 'inbound', 'Mira Schulz', 'mira.schulz@example.com', 'DEMO: Können Sie ein Angebot für Fassadenarbeiten erstellen?', 'website', false, now() - interval '5 days'),
  ('e0000004-e000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'd3333333-d333-4333-8333-333333333333', 'outbound', 'Klaus Kipp', 'klaus@demo-kipp.example', 'DEMO interne Notiz: Angebotsskizze wurde vorbereitet — Versand folgt nach Freigabe.', 'internal', false, now() - interval '4 days'),
  ('e0000005-e000-4000-8000-000000000005', '55555555-5555-4555-8555-555555555555', 'd5555555-d555-4555-8555-555555555555', 'inbound', 'Clara Sommer', 'clara.sommer@example.com', 'DEMO: Wir suchen Unterstützung bei der Prozessanalyse.', 'website', false, now() - interval '6 hours');

insert into public.lead_events (customer_id, lead_id, event_type, payload)
select customer_id, id, 'lead.created', jsonb_build_object('demo', true, 'source', source)
from public.leads;

insert into public.audit_logs (user_id, customer_id, action, entity_type, entity_id, metadata)
values
  (null, '11111111-1111-4111-8111-111111111111', 'lead.created', 'lead', 'c0000001-c000-4000-8000-000000000001', '{"demo":true}'::jsonb),
  (null, '22222222-2222-4222-8222-222222222222', 'lead.created', 'lead', 'c0000004-c000-4000-8000-000000000004', '{"demo":true}'::jsonb),
  (null, null, 'system.seed', 'system', null, '{"note":"DEMO seed loaded"}'::jsonb);
