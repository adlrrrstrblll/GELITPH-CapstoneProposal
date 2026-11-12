# The Balikbayan Project

An interactive literary website about Filipino migration, memory, family, and belonging. Visitors explore a balikbayan box, read paired accounts from someone who left and someone who stayed, and discover related readings and films.

The implementation follows the approved forest-green, cream, and sage design: a box logo beside the header title, textured Home headline, filled photographic sections, a three-column story collection, and a simple contribution form.

## Run the website

Use Node.js 22 or later. There are no third-party dependencies to install.

```sh
npm start
```

Open **http://127.0.0.1:4173**. Keep the terminal running; press **Ctrl+C** to stop. `npm run dev` and `node server.mjs` do the same thing. To use another port, run `PORT=4174 npm start` on macOS/Linux.

Use the same address, port, and browser profile to retain access to your saved contributions. `localhost`, `127.0.0.1`, a different port, and the eventual Vercel domain have separate browser storage. Export a backup before moving between them. Open the site through the server rather than double-clicking `index.html`.
