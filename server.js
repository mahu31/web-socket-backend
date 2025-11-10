// server.js
const http = require("http");
const express = require("express");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = new Map(); // ws -> name

function broadcast(obj) {
    const json = JSON.stringify(obj);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(json);
        }
    });
}

wss.on("connection", (ws) => {
    console.log("Client conectat (socket).");

    ws.on("message", (data) => {
        const msg = data.toString();
        let parsed;

        try {
            parsed = JSON.parse(msg);
        } catch (e) {
            // fallback - text simplu
            parsed = { type: "message", text: msg };
        }

        if (parsed.type === "join") {
            users.set(ws, parsed.name);
            console.log(`✅ ${parsed.name} s-a conectat`);
            broadcast({ type: "system", text: `✅ ${parsed.name} s-a alăturat chat-ului` });
            return;
        }

        if (parsed.type === "message") {
            // trimitem mesaj normal
            broadcast({ type: "message", text: parsed.text });
            return;
        }

        // altele: ignore sau extindere
    });

    ws.on("close", () => {
        const name = users.get(ws);
        if (name) {
            console.log(`❌ ${name} s-a deconectat`);
            broadcast({ type: "system", text: `❌ ${name} a părăsit chat-ul` });
            users.delete(ws);
        } else {
            console.log("Client fără username s-a deconectat");
        }
    });

    ws.on("error", (err) => {
        console.error("WS error:", err);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Serverul rulează pe http://localhost:${PORT}`);
});
