This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Content management

Services, Products, Projects and each service's Top Work are stored in a
database and edited from an admin dashboard — no code changes are needed to
publish anything.

### Public structure

```
/products-services     Landing page — sends visitors to Products or Services
├── /products          Products Mark UI sells
└── /services          The services Mark UI performs
    └── /services/<slug>   One page per service:
                           hero → overview → what we offer →
                           why choose us → OUR TOP WORK →
                           check our portfolio → CTA

/projects              The main portfolio showcase, filtered by
                       All | Web | Marketing | Branding | Multimedia
```

Products and Services are deliberately separate: separate pages, separate
database collections, separate admin screens. They never share a grid.

**Projects vs Top Work.** Projects are the main showcase. Top Work is the
highlighted selection shown on one service's page. A Top Work entry usually
*links to an existing project* rather than duplicating it — change the project
and the service page follows. Entries that are not in the projects list can
carry their own title, copy, image and video instead.

### Admin dashboard

| Route | What it controls on the site |
| --- | --- |
| `/admin/login` | Sign in |
| `/admin` | Overview, counts and things needing attention |
| `/admin/home` | The homepage's own text: the hero (two-line headline, paragraph, button, three channels), then the headings and text of the Services, Work, Why, Process and Contact sections, and the search title |
| `/admin/trust` | Homepage Proof section (headline, the four figures, the client dial) and the figures on About |
| `/admin/reviews` | The homepage's review wall: each review is sized by how few words it has |
| `/admin/services` | The Services page and each service's page, the homepage's services list and its "Seven disciplines." count, the footer, and the choices in the contact form |
| `/admin/top-work` | The Top Work shown beside each service |
| `/admin/products` | The Products page |
| `/admin/projects` | The Projects page and each project's page; the homepage wall shows up to ten, featured first |
| `/admin/about` | The About page |
| `/admin/pages` | The header and closing text of the Projects, Products and Services pages, and the footer note |
| `/admin/contact` | Phone numbers, WhatsApp, email, address and hours, on every page and in the Book a Call pop-up; and the contact page's header, promises strip, questions and closing text |
| `/admin/footer` | Social links in the footer, the menu and the contact page |
| `/admin/settings` | The external portfolio URL |
| `/admin/enquiries` | Messages sent from the contact page and the homepage form |
| `/admin/account` | The admin username and password |

Anything saved appears on the public site immediately — the homepage, the
Products, Services, Projects, About and Contact pages, and every service and
project page are regenerated when a record changes.

The previous homepage's "Latest From Our Studio" posts and hero service cards
have no place on the current site, so they have no admin screen. Their rows
are still in the database (`studio_items`, `hero_services`) and are carried
through every save untouched.

**The homepage.** `/` is the static build in `public/landing/`, served by
`app/landing-home/route.ts`. The parts the dashboard manages are marked in
`public/landing/index.html` with `<!-- cms:name -->` comment pairs and filled
in from the database by `lib/landing.ts`; what is written between the comments
is the fallback, served as it is if the database cannot be read.

**Written content.** Text that is not a record of its own (homepage sections,
reviews, page headers and closing lines, the contact page's promises and
questions, the footer note) is one JSON document, described in
`lib/site-content.ts` with its defaults and the length each field must fit.
It and the contact details are stored in the `app_meta` table, so neither
needed a schema change.

Each service supports a name, slug, short and full description, image, icon,
features, benefits, tags, display order and an active/inactive switch. Hiding a
service removes it from the site and returns 404 for its page, without deleting
anything. Deleting a service also deletes its Top Work — linked projects are
never touched.

### Portfolio button

Every service page ends with a **Check our portfolio** button pointing at your
separate portfolio site. Set the address in `/admin/settings`; while it is
blank the button stays hidden rather than linking nowhere.

### Insights article images

The four Insights cards on the home page reference
`/public/insights/article-1…4.jpg`, which were never added to the repository —
so every page load produced a 404. They now render a numbered placeholder
instead. To use real photos, drop the files into `public/insights/` and put the
path back in the `articles` array in `app/insights/page.tsx`.

### Credentials

Set or reset the admin account:

```bash
npm run admin:setup                      # username "admin", random password
npm run admin:setup <username> <password>   # choose your own
```

This writes `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (scrypt) and
`ADMIN_SESSION_SECRET` to `.env.local`. The password itself is never stored —
only its hash — and no credential is ever sent to the browser. Restart the dev
server after changing them.

Sessions are HTTP-only, `SameSite=Lax` cookies signed with `ADMIN_SESSION_SECRET`
and valid for 7 days. `proxy.ts` turns anonymous visitors away from `/admin/*`,
and every admin page and Server Action re-checks the session server-side.

> **Deploying:** set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` and
> `ADMIN_SESSION_SECRET` as environment variables on the host. Generate the hash
> locally with `npm run admin:setup` and copy the values out of `.env.local`.

### Where data lives

```
.data/db.json      services, top work, products, projects and settings
.data/uploads/     images and videos uploaded from the dashboard
```

The file carries a `version` and migrates itself forward on read, so an older
store is upgraded in place the first time the app starts.

`.data/` is git-ignored and seeded automatically on first run with the projects
and services that were previously hard-coded in the components. Each service
starts with a few of your existing projects already linked as its Top Work,
matched by category. Uploaded media is
served through `/api/uploads/<file>`, so it keeps working across restarts and
rebuilds.

Because the store is a file on disk, the app needs a persistent filesystem. That
is fine for `next start` on a VPS, a container with a mounted volume, or local
development. On a serverless host (where the filesystem is ephemeral and not
shared between instances), point `lib/db.ts` at a hosted database instead — the
rest of the app only talks to the functions it exports.
