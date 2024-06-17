const net = require('net');

const MAX_RETRY = 1000;
const WAIT_RETRY = 1000; // in milliseconds

/**
 * 
 * @returns {Promise<number>}
 */
async function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            server.close(() => {
                resolve(port);
            });
        });

        server.on('error', (err) => {
            reject(err);
        });
    });
}

async function tryConnect(connFn) {
    let retries = 0;
    let aborted = true;
    while (retries < MAX_RETRY) {
        try {
            await new Promise((resolve, reject) => {
                connFn(function (err, req, res) {
                    if (res && res.closed) {
                        aborted = true;
                        retries = MAX_RETRY;
                    }
                    err ? reject(err) : resolve();
                });
            })
        } catch (err) {
            retries += 1;
            if (retries < MAX_RETRY) {
                console.log(`Retrying to connect for ${retries}-th time`);
                await new Promise(res => setTimeout(res, WAIT_RETRY));
            } else {
                console.error(`Connection retry hang up: ${err}`);
                throw err;
            }
        }
    }
}

module.exports = {
    getFreePort,
    tryConnect
}