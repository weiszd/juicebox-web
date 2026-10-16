# Integration test: juicebox.js 4.11.0 in Claude Desktop

**Question:** does juicebox.js 4.11.0 (the npm release from aidenlab master, which
includes the weiszd fork work) work in place of `4.10.0-mcp.2` when Claude Desktop
drives juicebox-web?

**Already done:** this branch (`juicebox-weiszd-fork-merge`) pins `juicebox.js` at
`^4.11.0` (lockfile: 4.11.0). Build and the 74 unit tests pass.

## How the pieces connect

```
Claude's servers ──https──> TUNNEL ──> RELAY localhost:8787 (/mcp)
                                              ▲
Desktop panel ──> PAGE localhost:5173 ──/ws───┘  (Vite forwards /ws to :8787)
```

- Only `/mcp` needs the tunnel: Claude's servers make that call, and they cannot reach
  your Mac's localhost.
- The panel runs on your Mac, so it loads `http://localhost:5173` fine.
- The page must reach the relay **through its own port** (`ws://localhost:5173/ws`).
  With the direct address (`ws://localhost:8787/ws`) the panel shows the page but it
  never joins the room.

## 1. Start three processes, in this order

**Terminal 1: relay**

```bash
cd ~/JuiceboxDevelopment/weiszd/juicebox-mcp
npm run dev:server
```

**Terminal 2: page** (one command; the address is port **5173**, not 8787)

```bash
cd ~/JuiceboxDevelopment/weiszd/juicebox-web
VITE_WS_URL=ws://localhost:5173/ws npm run dev -- --port 5173 --strictPort
```

**Terminal 3: tunnel**

```bash
cloudflared tunnel --url http://localhost:8787
```

It prints `https://<random>.trycloudflare.com`. While it runs, anyone with that address
can call your relay; stop it when you are done.

## 2. Connect Claude Desktop

1. Settings → Connectors → Add custom connector.
   Name `Juicebox local`, URL `https://<random>.trycloudflare.com/mcp`, OAuth blank.
   (If the tunnel restarted, remove the old connector and add the new address.)
2. Start a **new chat** and turn the connector on in the tools menu.
3. Say **"Hello, Juicebot"**. The page opens in the panel on the right.

## 3. Confirm the page joined the room

Before testing anything, ask for a map and look at terminal 1:

| Relay log line | Meaning |
|---|---|
| `[DO] WebSocket accepted` | the panel's page joined ✅ |
| `[DO sendToClient] command=loadMap websockets=1` | the command reached the page ✅ |
| `… websockets=0` | no page in the room ❌ — the page was started with the wrong `VITE_WS_URL`; restart terminal 2 exactly as above, then use a new chat |

## 4. What to try

Ask for each, and check the panel draws it:

- load a map (e.g. GM12878 in situ)
- go to a locus, zoom in, zoom out
- change normalization and the color scale
- load a track, then change its color and name, then remove it
- load a control map
- open a second panel, then close it

## Pass / fail

**Pass:** every request draws correctly in the panel, with no tool errors.

**Fail:** a tool error, nothing drawn, or the wrong thing drawn. Note the request.
If you are unsure whether 4.11.0 caused it, retry on juicebox-web `master`
(still `4.10.0-mcp.2`). If it fails there too, it is not 4.11.0.

## Shut down

Ctrl-C the tunnel first, then the page and the relay.

## After it passes

Merge this branch into juicebox-web `master`.
