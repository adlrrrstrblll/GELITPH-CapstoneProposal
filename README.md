# The Balikbayan Project

An interactive literary website about Filipino migration, memory, family, and belonging. Visitors explore a balikbayan box, read thematic pairs of published migrant and family experiences, and discover related readings and films.

The implementation follows the approved forest-green, cream, and sage design: a box logo beside the header title, textured Home headline, filled photographic sections, a three-column story collection, and a simple contribution form.

Home includes the complete keepsake explorer: select an object to see its photograph, quote, description, and story link. Previous `#box` links redirect to Home, and the separate Box tab has been removed.

Story cards and reading pages include like buttons. Choose **Liked stories** in the Our Stories collection filter to see your favorites; search, theme, and perspective filters still apply. The source-based sample collection begins with prototype like totals; a visitor can add or remove one like per story, saved in browser storage. New contributions start at zero. Built-in summaries identify the person described with an **Account of** label; contributions retain their author credit. Likes and contributions are local to the browser, with no account or shared server required.

The ten built-in entries now summarize real published accounts. English text, Filipino translations, keepsake teasers, and the computer-voiced narration are prepared for this project. The pairs compare independent accounts; they do not imply a shared family. See [the content source register](docs/CONTENT-SOURCES.md) for every entry’s publication, author, date, link, and selection notes. Source metadata is stored in `js/samples.js` without adding citation blocks to the website.

## Run the website

Use Node.js 22 or later. There are no third-party dependencies to install.

```sh
npm start
```

Open **http://127.0.0.1:4173**. Keep the terminal running; press **Ctrl+C** to stop. `npm run dev` and `node server.mjs` do the same thing. To use another port, run `PORT=4174 npm start` on macOS/Linux.

Use the same address, port, and browser profile to retain access to your saved contributions. `localhost`, `127.0.0.1`, a different port, and the eventual Vercel domain have separate browser storage. Export a backup before moving between them. Open the site through the server rather than double-clicking `index.html`.
