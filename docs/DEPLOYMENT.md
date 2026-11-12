# Running and deploying The Balikbayan Project

## Local preview on your Mac

Open Terminal and run:

```sh
cd "/Users/adlerclarencestrebel/Documents/GitHub/GELITPH-CapstoneProposal"
npm start
```

Visit **http://127.0.0.1:4173**. Press **Ctrl+C** in Terminal when finished. The project needs Node.js 22+ and has no dependencies to install.

If port 4173 is busy, stop the other copy or use `PORT=4174 npm start`, then open the printed address. Saved stories are specific to an address, browser profile, and port.

## Check and build

```sh
npm test
npm run build
```

The browser checks use a separate Chrome/Edge profile. `npm run build` copies only website files into `dist/`; it does not upload them anywhere. Do not use the development server as a Vercel function. The deployed output consists of static files and uses hash routes, so no catch-all rewrite is needed.

## Deploy with GitHub and Vercel

1. Review the changes in this local repository, then commit and push them to GitHub. The update itself does not make a commit or push.
2. Sign in at [Vercel](https://vercel.com) and choose **Add New → Project**. Import the `GELITPH-CapstoneProposal` repository from GitHub. If the repository is missing, grant the Vercel GitHub integration access to it.
3. Keep the **Root Directory** at the repository root (`./`). Use the following settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Other |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | Leave the default; the package has no third-party dependencies |
| Environment Variables | None for this version |

4. The committed `vercel.json` already defines the framework, build command, and output directory. Check for conflicting old overrides if this is an existing Vercel project.
5. Select **Deploy**. Once the build completes, open the deployment URL and browse Home, The Box, Our Stories, a story pair, Explore & Watch, Share Your Story, and About. Try one local contribution and refresh the page.
6. Future pushes to the configured production branch deploy production updates. Other branches and pull requests can receive preview deployments. Add a custom domain later in the project's domain settings if desired.

Vercel's current documentation: [Git deployments](https://vercel.com/docs/git), [build configuration](https://vercel.com/docs/builds/configure-a-build), and [project configuration](https://vercel.com/docs/project-configuration).

If you prefer GitHub Desktop, review the changed files, create a commit, and use **Push origin**, then import the repository in Vercel. There is no need to run Vercel CLI or install a framework.

## What visitors can do after deployment

Everyone can browse the built-in stories, external readings, and videos. Stories someone submits are saved only in that person's browser. Vercel deployment does not create a shared database, upload service, login system, or moderation queue.

To move your existing collection from the local site to the hosted site, export it with **Back up & restore**, then import the JSON backup on the hosted site. Keep an original copy. A preview URL, production URL, and custom domain each have separate browser storage.

For a future shared archive, add server-side submission endpoints, persistent database and file storage, and moderation/access rules. Keep database credentials and service keys on the server. This is a separate feature from this UI implementation.

The reading/video collection is maintained in `js/resources.js`. The current version opens selected original sources and YouTube videos; it does not automatically pull new stories or run a live YouTube search.

## Media before a public launch

The approved mockups used a packed-box photograph published by UniPro, a lumpia-preparation photograph credited to Kayte Young/WFIU, and a photograph published with the Positively Filipino essay. They remain in this local implementation to match the approved visual design; no open publication license has been asserted for them. Obtain permission or replace them with your own or appropriately licensed photos before a public launch. See `assets/CREDITS.md` for filenames and sources.

Other included photographs have their recorded Unsplash or Creative Commons licenses. Keep their source credits and required attribution. Documentary thumbnails identify their linked original videos; the videos themselves are embedded from YouTube rather than copied or hosted in the repository.
