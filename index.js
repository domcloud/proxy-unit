#!/usr/bin/env node

const { getFreePort, tryConnect } = require('./util');
const { spawn } = require('child_process');
const httpProxy = require('http-proxy');
const { isIPv4, isIPv6 } = require('net');
const http = require('unit-http');

async function init() {
    var port;
    var host;
    if (process.env.PORT) {
        port = parseInt(process.env.PORT);
    }
    if (!port) {
        try {
            port = await getFreePort();
        } catch (err) {
            throw new Error("Can't get free port");
        }
    }
    if (process.env.HOST && (isIPv4(process.env.HOST) || isIPv6(process.env.HOST))) {
        host = process.env.HOST;
    } else {
        host = '127.0.0.1';
    }

    if (process.argv.length > 2) {
        const cmd = process.argv[2];
        const args = process.argv.slice(3);
        const env = { ...process.env, PORT: port.toString(), HOST: host };

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
        });
        
        process.on('SIGINT', () => {
            child.kill('SIGTERM')
        })

        process.on('exit', () => {
            child.kill('SIGKILL')
        })
    }

    return { port, host };
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
        let { host, port } = await init();
        await startProxy(host, port);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})()
