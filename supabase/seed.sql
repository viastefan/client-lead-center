-- Demo data for local/dev, aligned with live Vercel customer sites.
-- Safe to re-run only on an empty database (uses fixed UUIDs).
-- Requires both migrations: 20260915120000_init.sql and 20260915180000_website_connection.sql
--
-- Demo website API keys (plaintext, development only — hashes are stored):
--   Abelen:     clc_demo_abelen_7f3a9c2e1b4d8f0a
--   Wassana:    clc_demo_wassana_9c1e4a7b2d8f0c3e
--   AVS:        clc_demo_avs_4b8d1e6a0c9f2d7e
--   Wasco:      clc_demo_wasco_1a2b3c4d5e6f7089
--   Festag:     clc_demo_festag_aa11bb22cc33dd44
--   eRide:      clc_demo_eride_55ee66ff77889900
--   Figura:     clc_demo_figura_deadbeefcafebabe
--   MUC Cargo:  clc_demo_muc_0f1e2d3c4b5a6978

insert into public.customers (
  id, name, company_name, contact_name, contact_email, contact_phone, status, notes
) values
  ('11111111-1111-4111-8111-111111111111', 'Abelen Immobilien', 'Abelen Immobilien', 'Abelen Immobilien', 'info@abelen-immobilien.de', null, 'active', 'DEMO — Live Vercel abelenimmobilienvermittlung'),
  ('22222222-2222-4222-8222-222222222222', 'Wassana Thai Imbiss', 'Wassana Thai Imbiss', 'Wassana Thai Imbiss', 'wassanathaiimbiss@icloud.de', null, 'active', 'DEMO — Live Vercel Wassana'),
  ('33333333-3333-4333-8333-333333333333', 'Airport Verpackungen', 'Airport Verpackungen', 'Airport Verpackungen', 'info@airport-verpackungen.de', null, 'active', 'DEMO — Live Vercel avs'),
  ('44444444-4444-4444-8444-444444444444', 'Wasco Textil', 'Wasco Textil', 'Wasco Textil', 'info@wascotextil.de', null, 'active', 'DEMO — Live Vercel wascotextil'),
  ('55555555-5555-4555-8555-555555555555', 'Festag', 'Festag', 'Festag', 'stefandirnberger@viawen.com', null, 'active', 'DEMO — Live Vercel festagwebsite'),
  ('66666666-6666-4666-8666-666666666666', 'eRide Bavaria', 'eRide Bavaria', 'eRide Bavaria', 'info@eridebavaria.de', null, 'active', 'DEMO — Live Vercel eridebavaria'),
  ('77777777-7777-4777-8777-777777777777', 'Figura', 'Figura', 'Figura', 'info@figura.app', null, 'active', 'DEMO — Live Vercel figura'),
  ('88888888-8888-4888-8888-888888888888', 'MUC Cargohandling', 'MUC Cargohandling', 'MUC Cargohandling', 'info@muc-cargo.de', null, 'active', 'DEMO — Live Vercel muc-cargo-handling');

insert into public.websites (
  id, customer_id, name, domain, status, active, api_key_hash,
  vercel_project, vercel_url, github_repo, allowed_hosts,
  last_request_at, last_lead_at
) values
  (
    'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111',
    'Abelen Website', 'www.abelen-immobilien.de', 'active', true,
    encode(digest('clc_demo_abelen_7f3a9c2e1b4d8f0a', 'sha256'), 'hex'),
    'abelenimmobilienvermittlung', 'https://abelenimmobilienvermittlung.vercel.app', 'viastefan/abelenimmobilienvermittlung',
    array['www.abelen-immobilien.de','abelen-immobilien.de','abelenimmobilienvermittlung.vercel.app'],
    now() - interval '2 hours', now() - interval '2 hours'
  ),
  (
    'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '22222222-2222-4222-8222-222222222222',
    'Wassana Website', 'www.wassana-thai-imbiss.de', 'active', true,
    encode(digest('clc_demo_wassana_9c1e4a7b2d8f0c3e', 'sha256'), 'hex'),
    'Wassana', 'https://wassana-sepia.vercel.app', 'viastefan/Wassana',
    array['www.wassana-thai-imbiss.de','wassana-thai-imbiss.de','wassana-sepia.vercel.app'],
    now() - interval '1 day', now() - interval '1 day'
  ),
  (
    'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '33333333-3333-4333-8333-333333333333',
    'AVS Website', 'www.airport-verpackungen.de', 'active', true,
    encode(digest('clc_demo_avs_4b8d1e6a0c9f2d7e', 'sha256'), 'hex'),
    'avs', 'https://avs-tau.vercel.app', 'viastefan/avs',
    array['www.airport-verpackungen.de','airport-verpackungen.de','avs-tau.vercel.app'],
    now() - interval '3 days', now() - interval '3 days'
  ),
  (
    'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '44444444-4444-4444-8444-444444444444',
    'Wasco Website', 'www.wascotextil.de', 'active', true,
    encode(digest('clc_demo_wasco_1a2b3c4d5e6f7089', 'sha256'), 'hex'),
    'wascotextil', 'https://wascotextil.vercel.app', 'viastefan/wascotextil',
    array['www.wascotextil.de','wascotextil.de','wascotextil.vercel.app'],
    now() - interval '20 days', now() - interval '20 days'
  ),
  (
    'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', '55555555-5555-4555-8555-555555555555',
    'Festag Website', 'festagwebsite.vercel.app', 'active', true,
    encode(digest('clc_demo_festag_aa11bb22cc33dd44', 'sha256'), 'hex'),
    'festagwebsite', 'https://festagwebsite.vercel.app', 'viastefan/festagwebsite',
    array['festagwebsite.vercel.app'],
    now() - interval '6 hours', now() - interval '6 hours'
  ),
  (
    'aaaaaaa6-aaaa-4aaa-8aaa-aaaaaaaaaaa6', '66666666-6666-4666-8666-666666666666',
    'eRide Bavaria Website', 'eridebavaria.vercel.app', 'active', true,
    encode(digest('clc_demo_eride_55ee66ff77889900', 'sha256'), 'hex'),
    'eridebavaria', 'https://eridebavaria.vercel.app', 'viastefan/eridebavaria',
    array['eridebavaria.vercel.app'],
    now() - interval '12 hours', now() - interval '12 hours'
  ),
  (
    'aaaaaaa7-aaaa-4aaa-8aaa-aaaaaaaaaaa7', '77777777-7777-4777-8777-777777777777',
    'Figura Website', 'figura-nine.vercel.app', 'active', true,
    encode(digest('clc_demo_figura_deadbeefcafebabe', 'sha256'), 'hex'),
    'figura', 'https://figura-nine.vercel.app', 'viastefan/figura',
    array['figura-nine.vercel.app'],
    now() - interval '40 days', null
  ),
  (
    'aaaaaaa8-aaaa-4aaa-8aaa-aaaaaaaaaaa8', '88888888-8888-4888-8888-888888888888',
    'MUC Cargo Website', 'www.muc-cargo.de', 'active', true,
    encode(digest('clc_demo_muc_0f1e2d3c4b5a6978', 'sha256'), 'hex'),
    'muc-cargo-handling', 'https://muc-cargo-handling.vercel.app', 'viastefan/muc-cargo-handling',
    array['www.muc-cargo.de','muc-cargo.de','muc-cargo-handling.vercel.app'],
    now() - interval '8 hours', now() - interval '8 hours'
  );

insert into public.email_accounts (id, customer_id, provider, email, display_name, status)
values
  ('e1111111-e111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'gmail', 'info@abelen-immobilien.de', 'Abelen Kontakt', 'disconnected'),
  ('e3333333-e333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'microsoft', 'info@airport-verpackungen.de', 'AVS Info', 'disconnected'),
  ('e8888888-e888-4888-8888-888888888888', '88888888-8888-4888-8888-888888888888', 'gmail', 'info@muc-cargo.de', 'MUC Cargo', 'disconnected');

insert into public.automations (id, customer_id, name, trigger, action, enabled, configuration)
values
  ('b1111111-b111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'DEMO Neue Anfrage benachrichtigen', 'lead.created', 'notify_client', false, '{"channel":"email"}'::jsonb),
  ('b3333333-b333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'DEMO Eingangsbestätigung', 'lead.created', 'send_confirmation', false, '{}'::jsonb);

insert into public.leads (
  id, customer_id, website_id, name, email, phone, company, message, source, page_url, metadata, status, priority, created_at
) values
  ('c0000001-c000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Lisa Hoffmann', 'lisa.hoffmann@example.com', '+49 170 1111111', null, 'DEMO: Ich interessiere mich für eine Eigentumswohnung in Lindenthal.', 'website', 'https://www.abelen-immobilien.de/kontakt', '{"demo":true}'::jsonb, 'new', 'high', now() - interval '2 hours'),
  ('c0000002-c000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Thomas Berger', 'thomas.berger@example.com', null, 'Berger Holding', 'DEMO: Bitte um Rückruf wegen Mehrfamilienhaus.', 'website', 'https://www.abelen-immobilien.de/verkauf', '{"demo":true}'::jsonb, 'in_progress', 'normal', now() - interval '1 day'),
  ('c0000003-c000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'Mira Schulz', 'mira.schulz@example.com', null, null, 'DEMO: Tisch für Samstagabend möglich?', 'website', 'https://www.wassana-thai-imbiss.de', '{"demo":true}'::jsonb, 'new', 'normal', now() - interval '40 minutes'),
  ('c0000004-c000-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333', 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'Jonas Weber', 'jonas.weber@example.com', '+49 171 3333333', 'Weber & Partner', 'DEMO: Anfrage zu Luftfracht-Verpackung.', 'website', 'https://www.airport-verpackungen.de/kontakt', '{"demo":true}'::jsonb, 'new', 'urgent', now() - interval '3 hours'),
  ('c0000005-c000-4000-8000-000000000005', '44444444-4444-4444-8444-444444444444', 'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'Greta Wolf', 'greta.wolf@example.com', '+49 176 8888888', null, 'DEMO: Angebot für Bettwäsche in größeren Mengen.', 'website', 'https://www.wascotextil.de/kontakt', '{"demo":true}'::jsonb, 'waiting', 'normal', now() - interval '5 days'),
  ('c0000006-c000-4000-8000-000000000006', '55555555-5555-4555-8555-555555555555', 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'Paul Richter', 'paul.richter@example.com', '+49 172 4444444', null, 'DEMO: Anfrage zur Zusammenarbeit.', 'website', 'https://festagwebsite.vercel.app', '{"demo":true}'::jsonb, 'qualified', 'high', now() - interval '6 hours'),
  ('c0000007-c000-4000-8000-000000000007', '66666666-6666-4666-8666-666666666666', 'aaaaaaa6-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'Elena Vogt', 'elena.vogt@example.com', null, 'Vogt Design', 'DEMO: Probefahrt / Event-Anfrage.', 'website', 'https://eridebavaria.vercel.app', '{"demo":true}'::jsonb, 'in_progress', 'normal', now() - interval '12 hours'),
  ('c0000008-c000-4000-8000-000000000008', '88888888-8888-4888-8888-888888888888', 'aaaaaaa8-aaaa-4aaa-8aaa-aaaaaaaaaaa8', 'Clara Sommer', 'clara.sommer@example.com', '+49 174 6666666', 'Sommer Labs', 'DEMO: Anfrage zu Handling am Flughafen München.', 'website', 'https://www.muc-cargo.de/kontakt', '{"demo":true}'::jsonb, 'new', 'high', now() - interval '8 hours');

insert into public.conversations (id, customer_id, lead_id, channel, status, created_at) values
  ('d1111111-d111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'c0000001-c000-4000-8000-000000000001', 'website', 'open', now() - interval '2 hours'),
  ('d2222222-d222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'c0000003-c000-4000-8000-000000000003', 'website', 'open', now() - interval '40 minutes'),
  ('d3333333-d333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'c0000004-c000-4000-8000-000000000004', 'website', 'open', now() - interval '3 hours'),
  ('d8888888-d888-4888-8888-888888888888', '88888888-8888-4888-8888-888888888888', 'c0000008-c000-4000-8000-000000000008', 'website', 'open', now() - interval '8 hours');

insert into public.messages (
  id, customer_id, conversation_id, direction, sender_name, sender_email, body, message_type, ai_generated, created_at
) values
  ('e0000001-e000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'd1111111-d111-4111-8111-111111111111', 'inbound', 'Lisa Hoffmann', 'lisa.hoffmann@example.com', 'DEMO: Ich interessiere mich für eine Eigentumswohnung in Lindenthal.', 'website', false, now() - interval '2 hours'),
  ('e0000002-e000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'd2222222-d222-4222-8222-222222222222', 'inbound', 'Mira Schulz', 'mira.schulz@example.com', 'DEMO: Tisch für Samstagabend möglich?', 'website', false, now() - interval '40 minutes'),
  ('e0000003-e000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'd3333333-d333-4333-8333-333333333333', 'inbound', 'Jonas Weber', 'jonas.weber@example.com', 'DEMO: Anfrage zu Luftfracht-Verpackung.', 'website', false, now() - interval '3 hours'),
  ('e0000004-e000-4000-8000-000000000004', '88888888-8888-4888-8888-888888888888', 'd8888888-d888-4888-8888-888888888888', 'inbound', 'Clara Sommer', 'clara.sommer@example.com', 'DEMO: Anfrage zu Handling am Flughafen München.', 'website', false, now() - interval '8 hours');

insert into public.lead_events (customer_id, lead_id, event_type, payload)
select customer_id, id, 'lead.created', jsonb_build_object('demo', true, 'source', source)
from public.leads;

insert into public.audit_logs (user_id, customer_id, action, entity_type, entity_id, metadata)
values
  (null, '11111111-1111-4111-8111-111111111111', 'lead.created', 'lead', 'c0000001-c000-4000-8000-000000000001', '{"demo":true}'::jsonb),
  (null, '33333333-3333-4333-8333-333333333333', 'lead.created', 'lead', 'c0000004-c000-4000-8000-000000000004', '{"demo":true}'::jsonb),
  (null, null, 'system.seed', 'system', null, '{"note":"DEMO seed for live Vercel customer sites"}'::jsonb);
