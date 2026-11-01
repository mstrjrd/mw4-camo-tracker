# MW4 Camo Tracker

Tracker de camouflages pour MW4 : Multijoueur, DMZ, Warzone et Prestige des armes.
Comptes joueurs (progression synchronisée), mode invité, et administration (armes, défis, noms des camos).

**Stack** : React 19 · Vite · Tailwind CSS 4 · shadcn/ui · Motion · Supabase (auth + base de données + stockage).

## Lancer en local

```bash
npm install
cp .env.example .env   # puis remplir l'URL et la clé anon Supabase
npm run dev            # http://localhost:5173
npm run dev:mobile     # accessible depuis le téléphone sur le même Wi-Fi (port 5180)
```

## Base de données Supabase

Dans Supabase > **SQL Editor**, exécuter une fois, dans cet ordre :

1. `supabase/schema.sql` — progression des joueurs
2. `supabase/admin.sql` — catalogue des armes, administrateurs, images (+ les 33 armes de base)
3. `supabase/warzone.sql` — défis Warzone
4. `supabase/camos.sql` — noms des camouflages modifiables
5. `supabase/seasons.sql` — saison d'arrivée des armes

Se déclarer administrateur (avec l'email de son compte sur le site) :

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'ton-email@exemple.com'
on conflict do nothing;
```

## Mise en ligne sur Netlify

La configuration de build est dans `netlify.toml` (build `npm run build`, dossier `dist`, Node 22).

1. Pousser le projet sur GitHub.
2. Netlify > **Add new site > Import an existing project** > choisir le dépôt.
3. **Site configuration > Environment variables** : ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, puis relancer un déploiement.
4. Supabase > **Authentication > URL Configuration** : mettre l'adresse Netlify dans **Site URL** et l'ajouter aux **Redirect URLs** (liens de confirmation d'email et de mot de passe oublié).

## Crédits

Données des défis : Google Sheet « MW4 Camo Tracker ». Images d'armes : codmunity.gg.
Call of Duty et Modern Warfare sont des marques d'Activision ; ce site n'est pas affilié à Activision.
