// server.js
const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Conexiuni WebSocket
wss.on('connection', (ws) => {
    console.log('Client conectat');

    ws.on('message', (message) => {
        console.log('Mesaj primit:', message.toString());

        // Trimite mesajul tuturor clienților conectați
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {

                // lmnjbvdsan
                client.send(message.toString()); // asigură că e string
            }
        });
    });

    ws.on('close', () => {


        console.log('Client deconectat ');
    });
});

// Pornește serverul
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Serverul rulează pe http://localhost:${PORT}`);
});
