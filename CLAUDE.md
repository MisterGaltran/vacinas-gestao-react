# CLAUDE.md

Guia de contexto deste repositório para o Claude. Mantenha conciso e atualizado.

## Visão Geral

Aplicativo web para famílias gerenciarem o calendário de vacinação infantil seguindo o **PNI brasileiro** (Programa Nacional de Imunizações). Suporta múltiplas crianças por família, vacinas extras customizadas, registro de doses tomadas e cálculo automático de status (tomada / atrasada / próxima / pendente).

Idioma da UI: **português (pt-BR)**. Toda copy, mensagens de erro e labels nesta língua.

## Stack

- **Frontend:** React 19 + TypeScript + Vite 8
- **Estilização:** Tailwind CSS v4 (via `@tailwindcss/vite`) + design system em `src/index.css` (`@theme`, classes premium `card-premium`, `btn-primary`, `input-premium`, etc.)
- **Roteamento:** `react-router-dom` v7 (já em `package.json`)
- **Backend:** Supabase (auth + Postgres + Storage)
- **Build:** `vite build` com `base: '/vacinas-gestao-react/'` (deploy em GitHub Pages provável)

## Estrutura

```
src/
  App.tsx                  # entry → ThemeProvider + Router (gate em useAuth)
  main.tsx
  index.css                # design system Tailwind v4 (@theme + utilities premium)
  lib/
    supabase.ts            # client Supabase (URL/anonKey hardcoded)
    vaccineCalendar.ts     # cálculo puro de status/datas das vacinas (compartilhado)
  context/
    ThemeContext.tsx       # 'light' | 'dark' com persistência em localStorage
  hooks/
    useAuth.ts             # session do Supabase
    useChildren.ts         # CRUD de children (add/update/remove)
    useVaccines.ts         # calendário PNI + registros para a criança selecionada
    useChildrenStats.ts    # contagens por criança (taken/late/upcoming/total)
  pages/
    Auth.tsx               # login / signup
    Dashboard.tsx          # home: cards das crianças + lista de vacinas da selecionada
    ChildProfile.tsx       # /child/:id — perfil editável + foto + delete
  components/
    Layout.tsx             # header sticky + back/logout/theme toggle
    ChildSelector.tsx      # chips de crianças no header
    VaccineCard.tsx        # card de vacina com ações (registrar, desmarcar, deletar custom)
    StatusBadge.tsx
supabase/
  migrations/              # 001 schema, 002 seed PNI, 003 fix duplicados, 004 perfil
  apply_migrations.sql     # script consolidado (executar manualmente no SQL Editor)
```

## Modelo de Dados (Supabase)

- **`children`** — `id`, `family_id` (= `auth.uid()`), `name`, `birth_date`, `photo_url`, `parental_email`, `maternity`, `cpf`, `created_at`
- **`vaccine_types`** — catálogo: PNI (`is_custom=false`) + extras por criança (`is_custom=true`, `custom_child_id`). Campos: `name`, `disease`, `dose_number`, `total_doses`, `recommended_age_months`, `min_interval_days`, `description`. Índice único parcial em `(name, disease, dose_number, is_custom) WHERE is_custom=false`.
- **`vaccine_records`** — `child_id`, `vaccine_type_id`, `scheduled_date`, `administered_date`, `status` (`pending|taken|late|upcoming`), `notes`.

**RLS habilitada em todas as tabelas.** Políticas isolam por `family_id = auth.uid()`. PNI types são SELECT-livres para qualquer autenticado.

**Storage:** bucket `child-photos` (público) usado em `ChildProfile` para upload de foto. Precisa ser criado manualmente no Supabase Dashboard se ainda não existir.

## Lógica de Vacinas (importante)

Está em [src/lib/vaccineCalendar.ts](src/lib/vaccineCalendar.ts) e é consumida por `useVaccines` e `useChildrenStats`. Para cada `vaccine_type`:

1. **1ª dose ou custom:** data = `birth_date + recommended_age_months`.
2. **Doses subsequentes:** se a anterior foi tomada (`administered_date`), data = `administered_date_anterior + min_interval_days`. Caso contrário, mantém a data recomendada por idade.
3. Se já existe `vaccine_record` com `scheduled_date` (e não é a primeira dose), respeita.
4. Se `status === 'taken'`, usa `administered_date`.
5. **Status calculado** comparando `calculated_date` com hoje: passou = `late`, ≤30 dias = `upcoming`, senão `pending`. `taken` mantém.
6. Ao registrar uma dose como tomada, `useVaccines.markAsTaken` automaticamente atualiza/cria registro pendente da próxima dose com a data ajustada pelo `min_interval_days`.

## Roteamento

`BrowserRouter` com `basename="/vacinas-gestao-react/"` (combina com `vite.config.ts`). Rotas:
- `/` → `Dashboard`
- `/child/:id` → `ChildProfile`

Antes de `useAuth().user`, qualquer rota cai em `Auth`.

## Scripts

```bash
npm run dev      # vite dev server
npm run build    # tsc -b && vite build
npm run lint     # eslint
npm run preview
```

## Convenções

- **Português** em todos os textos visíveis ao usuário (UI, mensagens de erro, comentários de domínio).
- Estilos via classes utilitárias Tailwind + classes do design system (`card-premium`, `card-stat`, `btn-primary`, `btn-secondary`, `btn-ghost`, `input-premium`). Evite CSS inline a menos que necessário (ex.: `style={{ width: ... }}` para barras de progresso).
- Cores semânticas via tokens: `primary`, `success`, `warning`, `danger`, `accent`. Sempre ofereça variante dark com `dark:`.
- Animações disponíveis: `animate-fade-in-up`, `animate-scale-in`, `animate-float`, `animate-shimmer`, `stagger-animate`.
- Emojis são parte do visual (👶 💉 🎂 🏥 ✅ 🔴 🔜 ⚠️). Não removê-los sem motivo.
- Componentes funcionais com hooks; sem class components.
- Datas no formato ISO (`YYYY-MM-DD`) no banco; exibir em pt-BR via `toLocaleDateString('pt-BR')` ou helper `formatDate`.
- Erros de Supabase: extraia `error.message` e mostre em toast/inline; nunca silencie.

## Deploy

Build → `dist/` → publicar (provavelmente GitHub Pages, dado o `base` do Vite). Confirmar com o usuário antes de mexer em CI/CD.

## Pegadinhas

- `vite.config.ts` tem `base: '/vacinas-gestao-react/'` — o `BrowserRouter` precisa do mesmo `basename` ou os links quebram.
- Existe um diretório aninhado `vacinas/` (com `check_db.mjs`) — é script utilitário, não confundir com o root.
- Migrations não rodam automaticamente: aplicar manualmente via SQL Editor do Supabase usando `supabase/apply_migrations.sql`.
- `supabaseAnonKey` está hardcoded em `src/lib/supabase.ts`. É anon key (segura para client), mas considerar mover para env var se o projeto crescer.
- Tailwind v4 usa `@theme` em CSS, não `tailwind.config.js`.
