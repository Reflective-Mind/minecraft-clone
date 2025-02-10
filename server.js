const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Create HTTP server
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
    // Generate unique ID for this client
    const clientId = Date.now().toString();
    
    // Store client connection
    clients.set(clientId, {
        ws: ws,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
    });

    // Send client their ID
    ws.send(JSON.stringify({
        type: 'init',
        id: clientId,
        clients: Array.from(clients.entries()).map(([id, client]) => ({
            id,
            position: client.position,
            rotation: client.rotation
        }))
    }));

    // Broadcast new player to all other clients
    broadcast({
        type: 'playerJoined',
        id: clientId
    }, clientId);

    // Handle incoming messages
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch(data.type) {
            case 'position':
                // Update client position
                if (clients.has(clientId)) {
                    clients.get(clientId).position = data.position;
                    clients.get(clientId).rotation = data.rotation;
                    
                    // Broadcast position to all other clients
                    broadcast({
                        type: 'playerMoved',
                        id: clientId,
                        position: data.position,
                        rotation: data.rotation
                    }, clientId);
                }
                break;
                
            case 'blockUpdate':
                // Broadcast block updates to all clients
                broadcast({
                    type: 'blockUpdate',
                    position: data.position,
                    blockType: data.blockType,
                    action: data.action // 'place' or 'remove'
                }, clientId);
                break;
        }
    });

    // Handle client disconnect
    ws.on('close', () => {
        clients.delete(clientId);
        broadcast({
            type: 'playerLeft',
            id: clientId
        });
    });
});

// Broadcast message to all clients except sender
function broadcast(message, senderId) {
    clients.forEach((client, id) => {
        if (id !== senderId && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`WebSocket server is ready for connections`);
}); 