const EventEmitter = require('events');
const amqp = require('amqplib/callback_api');
const config = require('../../config.json')
const { v4: uuidv4 } = require('uuid');
class ConnectionManager extends EventEmitter {

    constructor() {
        super();
        this.processingQueue = new Map;
        this.MessageEmitter = new EventEmitter;
        this.ResolveEmitter = new EventEmitter;
        this.RequestEmitter = new EventEmitter;
    }

    async connect() {
        const self = this;
        amqp.connect('amqp://localhost', function (error0, connection) {
            if (error0) { throw error0; }
            connection.createChannel(function (error1, channel) {
                self.channel = channel;
                if (error1) { throw error1; }
                channel.assertQueue(config.CONSUMER_QUEUE, { durable: false });
                channel.prefetch(1);
                console.log('⬜️ Awaiting RPC requests');
                channel.consume(config.CONSUMER_QUEUE, function reply(msg) {
                  try{
                    let parsedContent = JSON.parse(msg.content);
                    msg.content = parsedContent;
                    self.MessageEmitter.emit(msg.properties.correlationId, msg);
                    if(msg.properties.type == 'request') self.RequestEmitter.emit(msg.content.request.name, msg);
                    channel.ack(msg);
                  }catch(err){console.log('errror'); channel.ack(msg);}
                });
                self.createProcessingQueueResolver();
            });
        });
    }

    createProcessingQueueResolver() {
        this.MessageEmitter.on('message', (msg) => {
            this.processingQueue.set(msg.properties.correlationId, msg);
            console.log(`[ ${this.processingQueue.size} ]<----(${msg.content.request.name} request)`);
        })
        this.ResolveEmitter.on('resolved', (request, responce) => {
            let queueElement = this.processingQueue.get(request.properties.correlationId);
            if (!queueElement) console.log('Unidentified Request Was Resolved!');
            if (!request.properties.replyTo) console.log('Unable To Get Recipient!');
            this.processingQueue.delete(request.properties.correlationId);
            console.log(`[ ${this.processingQueue.size} ]=----(responce)`);
            this.channel.sendToQueue(request.properties.replyTo,
                Buffer.from(JSON.stringify({responce: responce, request: request})), {
                correlationId: request.properties.correlationId,
                type: 'responce'
            });
        })
    }

    async get(request) {
        if (!this.channel) { console.log('ERROR Connection Is Not Created!'); return 0 };
        let correlationId = uuidv4();
        const promise = new Promise((resolve, reject) => {
          this.channel.sendToQueue(config.GATEWAY_QUEUE, Buffer.from(JSON.stringify({request})), {
            correlationId: correlationId,
            replyTo: config.CONSUMER_QUEUE,
            type: 'request',
          });
          console.log(`[ ]=----(${request.name} request)`);
          this.MessageEmitter.once(correlationId, (msg) => {
            console.log(`[ ]<----(responce)`);
            resolve(msg.content.responce)
          })
        })
        return promise;
      }
    
      async send(request) {
        let correlationId = uuidv4();
        if (!this.channel) { console.log('ERROR Connection Is Not Created!'); return 0 };
        this.channel.sendToQueue(config.DATA_QUEUE, Buffer.from(JSON.stringify({request})), {
          correlationId: correlationId,
          type: 'request',
        });
        console.log(`[ ]=----(${request.name} request)`);
      }
}
exports.ConnectionManager = ConnectionManager;