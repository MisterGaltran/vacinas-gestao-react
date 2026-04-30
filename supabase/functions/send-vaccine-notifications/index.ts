// Edge Function: send-vaccine-notifications
// Envia e-mail diário (via Brevo) com vacinas atrasadas e próximas para
// cada criança que tenha parental_email preenchido.
//
// Disparada por pg_cron (header x-cron-secret) ou manualmente do Dashboard.

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Child {
  id: string;
  family_id: string;
  name: string;
  birth_date: string;
  parental_email: string | null;
}

interface VaccineType {
  id: string;
  name: string;
  disease: string;
  dose_number: number;
  total_doses: number;
  recommended_age_months: number;
  min_interval_days: number | null;
  is_custom: boolean;
  custom_child_id: string | null;
}

interface VaccineRecord {
  id: string;
  child_id: string;
  vaccine_type_id: string;
  scheduled_date: string;
  administered_date: string | null;
  status: string;
}

interface UpcomingOrLate {
  type: VaccineType;
  date: Date;
  status: 'late' | 'upcoming';
  diffDays: number;
}

const DEFAULT_UPCOMING_DAYS_WINDOW = 7;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function computeNotifications(
  child: Child,
  vaccineTypes: VaccineType[],
  vaccineRecords: VaccineRecord[],
  upcomingDaysWindow: number
): UpcomingOrLate[] {
  const birthDate = new Date(child.birth_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const takenMap = new Map<string, VaccineRecord>();
  for (const r of vaccineRecords) {
    if (r.status === 'taken' && r.administered_date) {
      const vt = vaccineTypes.find((t) => t.id === r.vaccine_type_id);
      if (vt) takenMap.set(`${vt.name}-${vt.dose_number}`, r);
    }
  }

  const result: UpcomingOrLate[] = [];

  for (const vt of vaccineTypes) {
    const record = vaccineRecords.find((r) => r.vaccine_type_id === vt.id) || null;
    if (record?.status === 'taken') continue;

    let calculatedDate: Date;

    if (vt.is_custom) {
      calculatedDate = record?.scheduled_date
        ? new Date(record.scheduled_date)
        : addMonths(birthDate, vt.recommended_age_months);
    } else if (vt.dose_number === 1) {
      calculatedDate = addMonths(birthDate, vt.recommended_age_months);
    } else {
      const prevTaken = takenMap.get(`${vt.name}-${vt.dose_number - 1}`);
      if (prevTaken && prevTaken.administered_date) {
        const prevDate = new Date(prevTaken.administered_date);
        calculatedDate = vt.min_interval_days
          ? addDays(prevDate, vt.min_interval_days)
          : addMonths(birthDate, vt.recommended_age_months);
      } else {
        calculatedDate = addMonths(birthDate, vt.recommended_age_months);
      }
    }

    if (record?.scheduled_date && vt.dose_number > 1) {
      calculatedDate = new Date(record.scheduled_date);
    }

    calculatedDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (calculatedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      result.push({ type: vt, date: calculatedDate, status: 'late', diffDays });
    } else if (diffDays <= upcomingDaysWindow) {
      result.push({ type: vt, date: calculatedDate, status: 'upcoming', diffDays });
    }
  }

  result.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'late' ? -1 : 1;
    return a.diffDays - b.diffDays;
  });

  return result;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('pt-BR');
}

function buildEmailHtml(child: Child, items: UpcomingOrLate[]): string {
  const lateItems = items.filter((i) => i.status === 'late');
  const upcomingItems = items.filter((i) => i.status === 'upcoming');

  const renderItem = (item: UpcomingOrLate) => {
    const doseTxt = item.type.total_doses > 1
      ? ` (Dose ${item.type.dose_number}/${item.type.total_doses})`
      : '';
    const dateTxt = formatDate(item.date);
    const tag = item.status === 'late'
      ? `<span style="color:#dc2626;font-weight:600;">${Math.abs(item.diffDays)} dia${Math.abs(item.diffDays) > 1 ? 's' : ''} de atraso</span>`
      : `<span style="color:#2563eb;font-weight:600;">em ${item.diffDays === 0 ? 'hoje' : `${item.diffDays} dia${item.diffDays > 1 ? 's' : ''}`}</span>`;
    return `<li style="margin-bottom:10px;line-height:1.5;"><strong>${item.type.name}</strong>${doseTxt} — prevista para ${dateTxt} (${tag})<br><span style="color:#64748b;font-size:13px;">Protege contra: ${item.type.disease}</span></li>`;
  };

  let body = '';
  if (lateItems.length > 0) {
    body += `<h2 style="color:#dc2626;font-size:17px;margin:0 0 12px;">🔴 Vacinas atrasadas (${lateItems.length})</h2><ul style="padding-left:20px;margin:0 0 24px;">${lateItems.map(renderItem).join('')}</ul>`;
  }
  if (upcomingItems.length > 0) {
    body += `<h2 style="color:#2563eb;font-size:17px;margin:0 0 12px;">🔜 Próximas vacinas (${upcomingItems.length})</h2><ul style="padding-left:20px;margin:0 0 24px;">${upcomingItems.map(renderItem).join('')}</ul>`;
  }

  return `<!doctype html><html><body style="background:#f8fafc;margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0f172a;">
<div style="max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;padding:24px;border-radius:16px 16px 0 0;text-align:center;">
    <div style="font-size:32px;margin-bottom:6px;">💉</div>
    <h1 style="margin:0;font-size:22px;font-weight:700;">Gestão de Vacinas</h1>
    <p style="margin:6px 0 0;opacity:0.9;font-size:14px;">Atualização sobre <strong>${child.name}</strong></p>
  </div>
  <div style="background:white;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
    ${body}
    <p style="margin:8px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
      Acesse o app para registrar as vacinas tomadas:<br>
      <a href="https://mistergaltran.github.io/vacinas-gestao-react/" style="color:#2563eb;font-weight:600;text-decoration:none;">Abrir Gestão de Vacinas →</a>
    </p>
  </div>
  <p style="text-align:center;font-size:11px;color:#94a3b8;margin:16px 0 0;">Este é um e-mail automático. Para parar de receber, remova o e-mail dos pais no perfil da criança.</p>
</div>
</body></html>`;
}

async function sendBrevoEmail(
  apiKey: string,
  senderName: string,
  senderEmail: string,
  toEmail: string,
  toName: string,
  subject: string,
  htmlContent: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail, name: toName }],
      subject,
      htmlContent,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `${res.status}: ${text}` };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const headerSecret = req.headers.get('x-cron-secret');
  const authHeader = req.headers.get('Authorization');

  const isCronAuthorized = !!(cronSecret && headerSecret === cronSecret);
  const isUserAuthorized = !!authHeader?.startsWith('Bearer ');

  if (!isCronAuthorized && !isUserAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL');
  const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') || 'Gestão de Vacinas';

  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    return new Response(
      JSON.stringify({ error: 'Missing BREVO_API_KEY or BREVO_SENDER_EMAIL secret' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const daysParam = url.searchParams.get('days');
  const upcomingDaysWindow = daysParam ? Math.max(1, parseInt(daysParam, 10) || DEFAULT_UPCOMING_DAYS_WINDOW) : DEFAULT_UPCOMING_DAYS_WINDOW;
  const forceTest = url.searchParams.get('force_test') === '1';

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: childrenData, error: childrenErr } = await supabase
    .from('children')
    .select('id, family_id, name, birth_date, parental_email')
    .not('parental_email', 'is', null);

  if (childrenErr) {
    return new Response(JSON.stringify({ error: childrenErr.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const children: Child[] = childrenData || [];
  const summary: Array<{ child: string; email: string; sent: boolean; items: number; error?: string }> = [];

  for (const child of children) {
    if (!child.parental_email) continue;

    const { data: typesData } = await supabase
      .from('vaccine_types')
      .select('*')
      .or(`is_custom.eq.false,and(is_custom.eq.true,custom_child_id.eq.${child.id})`);

    const { data: recordsData } = await supabase
      .from('vaccine_records')
      .select('*')
      .eq('child_id', child.id);

    let items = computeNotifications(child, typesData || [], recordsData || [], upcomingDaysWindow);

    if (items.length === 0 && forceTest) {
      // Modo de teste: injeta um item fictício pra forçar envio do e-mail
      items = [{
        type: {
          id: 'test',
          name: 'Vacina de Teste',
          disease: 'Validação do envio de e-mail',
          dose_number: 1,
          total_doses: 1,
          recommended_age_months: 0,
          min_interval_days: null,
          is_custom: true,
          custom_child_id: child.id,
        },
        date: new Date(),
        status: 'upcoming',
        diffDays: 0,
      }];
    }

    if (items.length === 0) {
      summary.push({ child: child.name, email: child.parental_email, sent: false, items: 0 });
      continue;
    }

    const lateCount = items.filter((i) => i.status === 'late').length;
    const upcomingCount = items.length - lateCount;
    const subjectParts: string[] = [];
    if (lateCount > 0) subjectParts.push(`${lateCount} atrasada${lateCount > 1 ? 's' : ''}`);
    if (upcomingCount > 0) subjectParts.push(`${upcomingCount} próxima${upcomingCount > 1 ? 's' : ''}`);
    const subject = `💉 ${child.name}: ${subjectParts.join(' e ')}`;
    const html = buildEmailHtml(child, items);

    const result = await sendBrevoEmail(
      BREVO_API_KEY,
      BREVO_SENDER_NAME,
      BREVO_SENDER_EMAIL,
      child.parental_email,
      child.name,
      subject,
      html
    );

    summary.push({
      child: child.name,
      email: child.parental_email,
      sent: result.ok,
      items: items.length,
      error: result.error,
    });
  }

  return new Response(JSON.stringify({ ok: true, summary }, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
});
