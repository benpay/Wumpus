# Wumpus

Jeu de la grotte : un chasseur descend dans une grotte carrée, avance case par case, ramasse l'or et ressort vivant. Toute la logique de jeu vit sur le serveur ; le navigateur n'affiche que l'état qu'il reçoit.

## Ce que fait le projet

- Deux écrans : configuration d'une partie (avec historique), puis plateau de jeu.
- Le joueur s'oriente, avance, tire une flèche devant lui, tente de sortir.
- Il n'a accès qu'à ses perceptions, jamais à la carte : `STENCH` (Wumpus vivant sur la case ou à côté), `BREEZE` (gouffre adjacent), `GLIMMER` (or sur la case), `BUMP` (mur), `SCREAM` (Wumpus tué).
- **Victoire** : ramasser l'or puis quitter depuis la case de départ. **Défaite** : tomber dans un gouffre ou monter sur le Wumpus.
- Chaque partie terminée est enregistrée et consultable dans l'historique.

## Comment ça marche

Le REST sert à créer et lire une partie ; le WebSocket porte le temps réel.

| Étape | Détail |
|---|---|
| `POST /games` | Crée la partie et renvoie l'état initial |
| `GET /games/:id` | Relit une partie (rechargement de page) |
| `GET /games/history` | Historique des parties terminées |
| `gameAction` → `gameStateUpdate` | Le client émet une action, le serveur renvoie l'état complet |

- Le backend est seul maître de l'état : les parties en cours vivent dans une `Map` en mémoire, seule la fin de partie est persistée en base.
- Un `GamePresenter` transforme l'entité en DTO, donc le REST et le WebSocket exposent exactement la même forme.
- Un tour n'est consommé que par un déplacement ; une rotation ou un tir appartiennent au tour en cours.
- Côté frontend, l'application est **zoneless** : écrire dans un signal suffit à planifier le rendu, sans `zone.js` ni `NgZone`.

## Stack et choix

| Couche | Technologie | Pourquoi |
|---|---|---|
| Frontend | Angular 21, composants standalone, signals | Zoneless par défaut, rendu piloté par les signaux |
| Tests frontend | Karma 6 + Jasmine 4.6 | Runner natif du builder Angular, exécution dans un vrai navigateur |
| Backend | NestJS 12 + class-validator | Découpage module / contrôleur / service, validation des entrées par DTO |
| Temps réel | Socket.IO | Reconnexion automatique avec repli sur le polling |
| Données | PostgreSQL 16 + TypeORM | `synchronize: true` : le schéma se crée tout seul |
| Infra | Docker Compose | Fournit le PostgreSQL, rien d'autre |

## Configuration à faire

L'ordre compte : la base, puis le backend, puis le frontend.

```bash
docker compose up -d              # PostgreSQL 16 sur 5432
cd backend && npm ci && npm run start:dev   # API + WebSocket sur 3000
cd frontend && npm ci && npm start          # interface sur 4200
```

Variables d'environnement du backend, toutes optionnelles (défauts dans `backend/src/app.module.ts`) :

| Variable | Défaut |
|---|---|
| `PORT` | `3000` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_USER` | `wumpus` |
| `DB_PASSWORD` | `wumpus_secret` |
| `DB_NAME` | `wumpus` |

CORS est ouvert des deux côtés : aucun proxy n'est nécessaire.

## Commandes

| Commande | Dossier | Effet |
|---|---|---|
| `npm run start:dev` | `backend` | Serveur NestJS en surveillance |
| `npm run build` / `start:prod` | `backend` | Compile puis lance `dist/main` |
| `npm test` / `test:cov` | `backend` | Tests unitaires (Vitest) et couverture |
| `npm run lint` / `format` | `backend` | oxlint / prettier |
| `npm start` | `frontend` | Serveur de dev Angular |
| `npm run build` | `frontend` | Build de production dans `dist/` |
| `npm test` | `frontend` | Tests Karma en surveillance, avec fenêtre de navigateur |
| `npm run test:ci` | `frontend` | Tests Karma en headless, une passe |

Options utiles côté frontend : `npm test -- --browsers=ChromeHeadlessNoSandbox` pour passer en headless, `ng test --include=src/app/features/home` pour ne cibler qu'un dossier de specs, `ng test --code-coverage` pour la couverture.

## Paramètres de jeu

| Paramètre | Bornes | Défaut | Rôle |
|---|---|---|---|
| `boardSize` | 3 – 10 | 4 | Côté de la grotte, en cases |
| `pitCount` | 1 – 10 | 2 | Gouffres ; plafonné à `min(10, N² − 3)` car la sortie, le Wumpus et l'or occupent 3 cases |
| `arrows` | 1 – 5 | 1 | Flèches disponibles, une par tir |

Chaque paramètre est validé deux fois : côté frontend par `validateGameConfig`, qui bloque le bouton de création, et côté backend par class-validator, qui répond `400`. Les valeurs par défaut sont partagées entre le formulaire, le service et la génération du plateau.

## Raccourcis clavier

| Touche | Action |
|---|---|
| `↑` ou `W` | S'orienter au nord |
| `↓` ou `S` | S'orienter au sud |
| `←` ou `A` | S'orienter à l'ouest |
| `→` ou `D` | S'orienter à l'est |
| `Espace` | Avancer d'une case |
| `F` | Tirer une flèche |
| `E` | Quitter la grotte |

Ignorés lorsqu'un champ de saisie a le focus. Toutes les actions restent accessibles à la souris.

## Arborescence

```
wumpus/
├── docker-compose.yml           # PostgreSQL 16
├── backend/                     # NestJS 12
│   └── src/
│       ├── main.ts              # bootstrap, CORS, ValidationPipe globale
│       ├── app.module.ts        # TypeORM et assemblage des modules
│       ├── game/
│       │   ├── game.controller.ts   # REST /games
│       │   ├── game.gateway.ts      # passerelle WebSocket
│       │   ├── game.service.ts      # orchestration, persistance en fin de partie
│       │   ├── game.presenter.ts    # entité -> DTO
│       │   ├── domain/              # Game, Board, Player, règles
│       │   └── dto/                 # validation des entrées
│       └── persistence/         # TypeORM et lecture de l'historique
└── frontend/                    # Angular 21
    ├── karma.conf.js            # détecte Chrome ou Edge automatiquement
    └── src/app/
        ├── core/
        │   ├── models/          # types, énumérations, validation de la config
        │   └── services/        # game-api.service.ts (REST), game-ws.service.ts (Socket.IO)
        └── features/
            ├── home/            # configuration et historique
            └── game/            # écran de jeu
                └── components/  # board, controls, log
```

## Limites connues

- Les URL du backend sont écrites en dur dans le frontend : `http://localhost:3000` dans `frontend/src/app/core/services/game-api.service.ts:11` et `frontend/src/app/core/services/game-ws.service.ts:42`. Il n'existe aucun fichier d'environnement ; viser un autre hôte impose de modifier ces deux lignes.
