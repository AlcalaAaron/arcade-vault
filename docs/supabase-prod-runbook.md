# Runbook: Supabase dev → prod

Claude solo tiene acceso MCP a `arcade-vault-dev`. Todo lo de prod lo ejecutas tú.
Sustituye `<PROD_REF>` (Project Settings → General) y `<dominio>` por tus valores.

## 1. Esquema, seguridad y datos

Orden: `supabase/migrations/20261110000001_initial_schema.sql` → `20261110000002_enable_rls.sql` → `supabase/seed.sql`.

**Vía CLI**

```bash
npx supabase login
npx supabase link --project-ref <PROD_REF>   # pide la DB password de prod
npx supabase db push                          # aplica las 2 migraciones
npx supabase db push --include-seed           # o: psql "<PROD_DB_URL>" -f supabase/seed.sql
```

**Vía dashboard:** SQL Editor de prod → pegar y ejecutar los 3 archivos en ese orden.

Opcional (alinear historial de dev, que no tiene migraciones registradas):

```bash
npx supabase link --project-ref <DEV_REF>
npx supabase migration repair --status applied 20261110000001 20261110000002
```

Nota: si aplicas 0002 en dev, la app debe seguir funcionando (lecturas públicas, insert de scores como invitado o con `user_id` propio). Prueba antes de prod.

## 2. Auth (solo dashboard, no es SQL)

- **Providers → Email:** ON, "Confirm email" ON.
- **Providers → Google / GitHub:** ON con **apps OAuth nuevas para prod**. Callback en cada proveedor: `https://<PROD_REF>.supabase.co/auth/v1/callback`.
- **URL Configuration:** Site URL = `https://<dominio>`. Redirect URLs: `https://<dominio>/auth/callback`, `https://<dominio>/auth/reset-password` (más previews si los usas).
- **SMTP:** configura SMTP propio (p. ej. Resend). El SMTP por defecto tiene límite muy bajo. Copia plantillas de email si las personalizaste en dev.
- **Password / rate limits:** igual o más estricto que dev (longitud mínima, leaked password protection).

## 3. Variables de entorno (hosting de prod)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY` y, si se usa, `SUPABASE_DB_PASSWORD` — todas de prod. El `.env` local se queda apuntando a dev.

## 4. Verificación en prod

```sql
select count(*) from public.games;                                  -- 5
select policyname from pg_policies where schemaname = 'public';     -- 3 policies
select relname, relrowsecurity from pg_class
 where relname in ('games','scores');                               -- ambas true
```

- Dashboard → Advisors: sin críticos de seguridad.
- App desplegada: registro (llega email), login email/Google/GitHub, guardar score y verlo en `/hall-of-fame`.
- Con la publishable key, `delete`/`update` sobre `scores` y cualquier escritura en `games` deben fallar.
- Revisa backups/PITR según tu plan.
