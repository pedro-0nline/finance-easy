# Database environment configuration

## Onde colocar as credenciais que você mostrou

Pelos dados da sua imagem (**Usuário, Senha, Banco, Host Interno, Porta, URL de Conexão Interna**), a regra é:

- **`DATABASE_URL` (server-only)** → recebe a **URL de Conexão Interna** (`postgres://...`).
- **`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (front-end)** → recebem os dados do projeto Supabase (URL HTTPS + anon key), **não** os dados internos do Postgres.

> Em resumo: credenciais `postgres://` não devem ir em `VITE_*`, pois `VITE_*` vai para o browser.

## Mapeamento dos campos da tela

A partir da tela de credenciais:

- **Usuário** + **Senha** + **Host Interno** + **Porta Interna** + **Nome do Banco de Dados**
  -> formam a `DATABASE_URL`.
- **URL de Conexão Interna**
  -> já é a `DATABASE_URL` pronta para uso no backend.

Exemplo (igual ao seu formato):

```env
DATABASE_URL=postgres://postgres:Wpp_9569%4026@n8n_postgres:5432/n8n?sslmode=disable
```

Se a senha tiver `@`, use `%40` na URL.

## Variáveis suportadas neste app

### Front-end (obrigatório)

- `VITE_SUPABASE_URL` (ou alias `VITE_DATABASE_URL`)
- `VITE_SUPABASE_ANON_KEY` (ou alias `VITE_DATABASE_ANON_KEY`)

### Backend (quando houver código server)

- `DATABASE_URL` com `postgres://...`

## Limitação atual do projeto

Este app usa recursos do Supabase no cliente (Auth, Storage, Realtime e RPC). Portanto, não é possível trocar para conexão PostgreSQL direta no browser sem criar/ajustar um backend intermediário.
