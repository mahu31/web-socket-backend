const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = new Map(); // ws -> name

// Fișier JSON pentru mesaje
const MESSAGES_FILE = path.join(__dirname, "messages.json");

// Funcții pentru citire și scriere
function loadMessages() {
    try {
        const data = fs.readFileSync(MESSAGES_FILE, "utf-8");
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function saveMessages(messages) {
    try {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    } catch (e) {
        console.error("Eroare salvare mesaje:", e);
    }
}

// Mesaje în memorie
let allMessages = loadMessages();

// Funcție broadcast
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

    // trimitem istoricul către clientul nou
    ws.send(JSON.stringify({ type: "history", messages: allMessages }));

    ws.on("message", (data) => {
        const msg = data.toString();
        let parsed;

        try {
            parsed = JSON.parse(msg);
        } catch (e) {
            parsed = { type: "message", text: msg };
        }

        if (parsed.type === "join") {
            users.set(ws, parsed.name);
            console.log(`✅ ${parsed.name} s-a conectat`);
            const sysMsg = { type: "system", text: `✅ ${parsed.name} s-a alăturat chat-ului`, timestamp: Date.now() };
            broadcast(sysMsg);
            // poți salva sistem messages dacă vrei:
            // allMessages.push(sysMsg);
            // saveMessages(allMessages);
            return;
        }

        if (parsed.type === "message") {
            const msgObj = { ...parsed, timestamp: Date.now() };

            // adăugăm în memorie și salvăm
            allMessages.push(msgObj);
            saveMessages(allMessages);

            broadcast(msgObj);
            return;
        }

        // alte tipuri: ignorăm sau extindem
    });

    ws.on("close", () => {
        const name = users.get(ws);
        if (name) {
            console.log(`❌ ${name} s-a deconectat`);
            const sysMsg = { type: "system", text: `❌ ${name} a părăsit chat-ul`, timestamp: Date.now() };
            broadcast(sysMsg);
            // poți salva sistem messages dacă vrei:
            // allMessages.push(sysMsg);
            // saveMessages(allMessages);
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
