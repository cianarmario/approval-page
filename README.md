# Approval Portal

React + TypeScript + Vite frontend for invitation verification and infrastructure project milestone review. All records, verification codes, decisions, and email notifications are browser-local demonstrations; no backend or email delivery is connected.

## Current frontend flow

- `/` and `/verify/:invitationId`: OTP verification, resend, and invitation support.
- `/approval-preview`: isolated sample approval flow for design review.
- `/review/:invitationId`: project review for a verified demo session.
- `/confirmation/:invitationId`: decision receipt with Close and Explore Approved Project actions.
- `/projects/:projectId`: project details and milestone records without decision controls.
- `/public`: local public-site preview used by the confirmation's Close action.

Photo slots show planned-start and submission dates without presenting them as actual photo capture dates. Supplied project images can include `capturedAt`, `capturedBy`, and captions. Modals lock background scrolling without changing the page width and use a subtle blurred backdrop.

Set `VITE_APPROVAL_SUPPORT_EMAIL` to configure the administrator email link. Otherwise `admin@example.com` is displayed as a sample contact. Copy `.env.example` to a local environment file if needed; no email is sent by the application.

## Getting started

Use Node.js 24 LTS and npm. Dependencies are already installed locally.

```sh
npm run dev
```

Open the local URL printed by Vite. To reinstall dependencies from the lockfile on another machine, run `npm ci` first.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Check TypeScript and create the production build in `dist/` |
| `npm run lint` | Run the starter's Oxlint checks |
| `npm run preview` | Preview the production build locally |

## Project structure

```text
Approval Portal/
|-- public/                 Static files served as-is
|-- src/
|   |-- app/
|   |   `-- App.tsx         Root application component
|   |-- assets/
|   |   |-- fonts/
|   |   |-- icons/
|   |   `-- images/
|   |-- components/
|   |   |-- common/         Shared application components
|   |   `-- ui/             Reusable interface primitives
|   |-- data/               Static data and fixtures
|   |-- features/           Feature-specific modules
|   |-- hooks/              Shared React hooks
|   |-- layouts/
|   |   `-- MainLayout.tsx  Shared page wrapper
|   |-- pages/
|   |   `-- HomePage.tsx    Temporary starter page
|   |-- services/           API and external-service integrations
|   |-- styles/
|   |   `-- global.css     Global styles
|   |-- types/              Shared TypeScript types
|   |-- utils/              Shared utility functions
|   `-- main.tsx            React entry point
|-- .gitignore
|-- .oxlintrc.json          Linter configuration
|-- index.html
|-- package-lock.json
|-- package.json
|-- tsconfig.app.json
|-- tsconfig.json
|-- tsconfig.node.json
`-- vite.config.ts
```

Empty folders contain `.gitkeep` files so they can be committed. Keep reusable code in the shared folders and add feature-specific code under `src/features/` when the plan is available. Vite's demo assets and counter have been removed.
