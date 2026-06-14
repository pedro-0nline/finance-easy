# Login com Google (OAuth 2.0) — Guia de configuração e checklist de aprovação

Aplicação: **FinanceEasy** · Domínio oficial: **https://finance.pedropaulocf.com.br**

Este projeto usa **Supabase Auth** como intermediário do OAuth. Isso é importante:
o `client_id`/`client_secret` do Google ficam no **Supabase** (nunca no frontend), e o
`redirect_uri` registrado no Google é o **callback do Supabase**, não a URL do app.

---

## Fluxo de autenticação

```
Usuário → [Botão "Continuar com Google"] (frontend)
        → Supabase  (Authentication > Providers > Google)
        → Google (tela de consentimento, escopos: openid email profile)
        → https://<PROJECT_REF>.supabase.co/auth/v1/callback   ← redirect_uri no Google
        → Supabase cria a sessão
        → https://finance.pedropaulocf.com.br/auth/callback     ← redirectTo do app
        → /app
```

`PROJECT_REF` deste projeto: **`qidbqjftdikiefsebeqc`**
(derivado de `VITE_SUPABASE_URL=https://qidbqjftdikiefsebeqc.supabase.co`).

---

## 1. Google Cloud Console

1. Crie/abra um projeto em https://console.cloud.google.com
2. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `FinanceEasy`
   - Logo, e-mail de suporte e e-mail do desenvolvedor preenchidos
   - **App domain → Application home page:** `https://finance.pedropaulocf.com.br`
   - **Privacy policy URL:** `https://finance.pedropaulocf.com.br/privacy`
   - **Terms of service URL:** `https://finance.pedropaulocf.com.br/terms`
   - **Authorized domains:** `pedropaulocf.com.br` e `supabase.co`
   - **Scopes:** adicione **apenas** `openid`, `.../auth/userinfo.email`,
     `.../auth/userinfo.profile` (escopo mínimo — não-sensível, acelera a verificação)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `FinanceEasy Web`
   - **Authorized JavaScript origins:**
     - `https://finance.pedropaulocf.com.br`
     - (dev) `http://localhost:4173`
   - **Authorized redirect URIs** (⚠️ tem que bater EXATAMENTE):
     - `https://qidbqjftdikiefsebeqc.supabase.co/auth/v1/callback`
   - Copie o **Client ID** e o **Client secret**.

> ⚠️ O redirect_uri é o callback do **Supabase**, não `.../auth/callback` do app.
> Qualquer divergência (http/https, barra final, subdomínio) causa `redirect_uri_mismatch`.

## 2. Supabase

1. **Authentication → Providers → Google** → Enable
   - Cole o **Client ID** e **Client secret** do passo anterior → Save.
2. **Authentication → URL Configuration**
   - **Site URL:** `https://finance.pedropaulocf.com.br`
   - **Redirect URLs** (adicione todas que o app usa):
     - `https://finance.pedropaulocf.com.br/auth/callback`
     - `https://finance.pedropaulocf.com.br/**`
     - (dev) `http://localhost:4173/auth/callback`

## 3. App (este repositório)

- `VITE_SITE_URL=https://finance.pedropaulocf.com.br` (em produção; em dev pode ficar vazio).
- O botão de login chama `signInWithGoogle()` em `src/services/authService.ts`, que usa:
  - `redirectTo = ${SITE_URL}/auth/callback`
  - `scopes = "openid email profile"` (mínimo)
- Rota pública de Política de Privacidade: `/privacy`
- Rota pública de Termos: `/terms`
- Rota de callback: `/auth/callback`

---

## Checklist de aprovação do Google

- [ ] Homepage pública e funcional em `https://finance.pedropaulocf.com.br`
- [ ] Política de Privacidade acessível publicamente em `/privacy` (sem login)
- [ ] Termos de Serviço em `/terms`
- [ ] `redirect_uri` no Google = `https://qidbqjftdikiefsebeqc.supabase.co/auth/v1/callback` (exato)
- [ ] Escopos mínimos: `openid`, `email`, `profile` (nenhum escopo sensível)
- [ ] `client_id`/`client_secret` apenas no Supabase — nunca no frontend
- [ ] Sem rotas quebradas (há página 404) e sem erros de console
- [ ] Domínios autorizados incluem `pedropaulocf.com.br` e `supabase.co`
- [ ] App publicado (não em "Testing") quando solicitar verificação

> Com apenas os escopos `openid/email/profile` (não-sensíveis), na maioria dos casos
> **a verificação completa do Google nem é exigida**. Ela passa a ser necessária se você
> adicionar escopos sensíveis/restritos no futuro.
