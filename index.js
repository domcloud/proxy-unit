#!/usr/bin/env node

const { getFreePort, tryConnect } = require('./util');
const { spawn } = require('child_process');
const httpProxy = require('http-proxy');
const http = require('unit-http');

async function init() {
    var outPort;
    try {
        outPort = await getFreePort();
    } catch (err) {
        throw new Error("Can't get free port");
    }

    if (process.argv.length > 2) {
        const cmd = process.argv[2];
        const args = process.argv.slice(3);
        const env = { ...process.env, PORT: outPort.toString() };

        const child = spawn(cmd, args, { stdio: 'inherit', env, detached: false });

        child.on('error', (err) => {
            console.error(`Error starting command: ${err}`);
            process.exit(1);
        });

        child.on('exit', (code) => {
            process.exit(code);
        })

        child.on('spawn', () => {
            console.log(`Started process ${cmd} with PID ${child.pid}`);

            process.on('SIGINT', () => {
                child.kill('SIGTERM')
            })
        });
    }

    return outPort;
}


async function startProxy(host, port) {
    /**
     * @type {httpProxy<IncomingMessage, ServerResponse>}
     */
    var proxy = new httpProxy.createProxyServer({
        target: {
            host,
            port
        }
    });
    let hasConnect = false
    var proxyServer = http.createServer(async function (req, res) {
        try {
            if (!hasConnect) {
                await tryConnect((err) => {
                    proxy.web(req, res, {}, err);
                });
                hasConnect = true;
            } else {
                proxy.web(req, res);
            }
        } catch (error) {
            hasConnect = false;
            res.statusCode = 502;
            res.end();
        }
    });

    proxyServer.on('upgrade', async function (req, socket, head) {
        try {
            if (!hasConnect) {
                await tryConnect((err) => {
                    proxy.ws(req, socket, head, {}, err);
                });
                hasConnect = true;
            } else {
                proxy.ws(req, socket, head);
            }
        } catch (error) {
            hasConnect = false;
            socket.end();
        }
    });

    proxyServer.listen(8000);
}

(async function () {
    try {
        let port = await init();
        await startProxy('localhost', port);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})()
