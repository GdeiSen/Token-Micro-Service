const { RouterManager } = require('./routers/routerManager');
const { ConnectionManager } = require('../../../RabbitMQConnectionUtil/index')
const config = require('../config.json')
exports.Agent = class Agent {
    constructor() {
        this.connectionManager = new ConnectionManager({
            dispatchTo: config.GATEWAY_QUEUE,
            consumeOn: config.CONSUMER_QUEUE,
            name: "APP",
            showInfoTable: true,
        });
        this.routerManager = new RouterManager(this);
        this.routerManager.createRouter();
    }
    connect() {
        this.connectionManager.connect();
        setTimeout(async () => {
            console.log(await this.connectionManager.get('handshake', { dispatchTo: "data_queue"}))
        }, 2000);
    }
}