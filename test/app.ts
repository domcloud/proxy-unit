setTimeout(() => {
    const server = Bun.serve({
        fetch(request) {
            if ((new URL(request.url)).pathname.startsWith("/ws")) {
                console.log('SERVER incoming request');
                if (this.upgrade(request)) {
                    return;
                }
            }
            console.log(`SERVER responded from: ${request.url}`);
            return new Response("Welcome to Bun!\n");
        },
        websocket: {
            open(ws) {
                console.log(`SERVER open`);
                ws.ping();
            },
            close(ws, code, reason) {
                console.log(`SERVER close: code=${code} reason=${reason}`);
            },
            message(ws, message) {
                console.log(`SERVER message: ${Bun.inspect(message)}`);
                ws.send(`You said: ${message}`);
            }
        },
    });
    console.log(`SERVER started: ${server.port}`);
}, 5000) // This timeout is intended to simulate slow startup within proxy
