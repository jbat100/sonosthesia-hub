
// simple server demonstrating minimalist messaging

const commandLineArgs = require('command-line-args');

import * as Rx from 'rx';

import {HubMessageContentParser, HubMessage} from "../lib/messaging";
import {TCPConnector, TCPConnection} from '../lib/connector/tcp';
import {Message} from "../lib/core";

const optionDefinitions = [
    { name: 'port', alias: 'p', type: Number }
];

const options = commandLineArgs(optionDefinitions);

// enter default options

if (!options.port) options.port = 3333;

const parser = new HubMessageContentParser();
const connector = new TCPConnector(parser);
const connections = new Map<string, TCPConnection>();
const subscriptions = new Map<string, Rx.Disposable>();

connector.emitter.on('connection', (connection) => {
    connections[connection.identifier] = connection;
    subscriptions[connection.identifier] = connection.messageObservable.subscribe((message : Message) => {
        const hubMessage : HubMessage = message as HubMessage;
        console.log('received hub message ' + JSON.stringify(hubMessage.toJSON()));
    });
});

connector.emitter.on('disconnection', (connection) => {
    connections.delete(connection.identifier);
    subscriptions[connection.identifier].dispose();
    subscriptions.delete(connection.identifier);
});

connector.start(options.port).then(() => {
    console.log('Server started on port ' + options.port);
}).catch(err => {
    console.error('Error : ' + err.stack);
});