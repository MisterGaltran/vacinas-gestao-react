-- ============================================
-- Setup do cron de envio de notificações de vacina
-- Execute APÓS:
--  1. Deploy da Edge Function "send-vaccine-notifications"
--  2. Criação dos secrets BREVO_API_KEY, BREVO_SENDER_EMAIL,
--     BREVO_SENDER_NAME, CRON_SECRET no Supabase Dashboard
--
-- IMPORTANTE: substitua o valor de CRON_SECRET abaixo pelo MESMO
-- valor que você cadastrou no Supabase Dashboard como secret.
-- ============================================

-- 1. Habilitar extensões necessárias (idempotente)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Remover job anterior, se existir (para reaplicar limpo)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'send-vaccine-notifications-daily') then
    perform cron.unschedule('send-vaccine-notifications-daily');
  end if;
end $$;

-- 3. Agendar: todo dia às 12:00 UTC (= 09:00 horário de Brasília)
select cron.schedule(
  'send-vaccine-notifications-daily',
  '0 12 * * *',
  $job$
    select net.http_post(
      url := 'https://mbcfclgjkngobqkpjmjv.supabase.co/functions/v1/send-vaccine-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', 'COLE_SEU_CRON_SECRET_AQUI'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $job$
);

-- 4. Verificar que o job foi criado
select jobname, schedule, active from cron.job where jobname = 'send-vaccine-notifications-daily';
