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
6. `supabase/profiles.sql` — profils publics partageables (page Joueurs, `/joueur/<identifiant>`)
7. `supabase/usernames.sql` — pseudos uniques (vérifiés à l'inscription et au changement de pseudo)

Se déclarer administrateur (avec l'email de son compte sur le site) :

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'ton-email@exemple.com'
on conflict do nothing;
```

## Mise en ligne sur Vercel

La configuration est dans `vercel.json` (Vite, build `npm run build`, dossier `dist`, cache et en-têtes de sécurité).
Node 22 minimum (voir `engines` dans `package.json`).

1. Vercel > **Add New… > Project** > importer le dépôt GitHub (framework détecté : Vite).
2. Avant de déployer, **Environment Variables** : ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
   (environnements Production et Preview). Si elles sont ajoutées après coup, relancer un déploiement (*Redeploy*).
3. Supabase > **Authentication > URL Configuration** :
   - **Site URL** : l'adresse de production (ex. `https://mw4-camo-tracker.vercel.app`) ;
   - **Redirect URLs** : la même adresse, et `https://*-<ton-compte>.vercel.app/**` pour les déploiements de preview.

Ensuite, chaque `git push` sur `main` redéploie la production ; les autres branches créent des previews.

## Crédits

Données des défis : Google Sheet « MW4 Camo Tracker ». Images d'armes : codmunity.gg.
Call of Duty et Modern Warfare sont des marques d'Activision ; ce site n'est pas affilié à Activision.
