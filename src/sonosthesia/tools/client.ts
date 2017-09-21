/**
 * A script to pose as a client with component decleration, and monitor incoming messages
 * Used to test Hub generators mostly
 */

const commandLineArgs = require('command-line-args');

import {Socket} from 'net';

import {FileUtils} from '../lib/core';
import {TCPConnection} from '../lib/connector/tcp';
import {HubMessageContentParser, HubMessageType} from '../lib/messaging';
import {HubMessage, ComponentMessageContent} from '../lib/messaging';

const optionDefinitions = [
    { name: 'address', alias: 'a', type: String },
    { name: 'port', alias: 'p', type: Number },
    { name: 'config', alias: 'c', type: String }
];

const options = commandLineArgs(optionDefinitions);

// enter default options

if (!options.address) options.address = '127.0.0.1';
if (!options.port) options.port = 3333;
if (!options.config) options.config = 'F:/Sonosthesia/sonosthesia-hub/config/test.component.2.json';

const client = new Socket();
const parser = new HubMessageContentParser();

console.log('Client connecting to ' + options.address + ':' + options.port + '...');

client.connect(options.port, options.address, () => {

    console.log('Client connected to ' + options.address + ':' + options.port);

    const connection = new TCPConnection(parser, null, client);

    // log incoming messages
    connection.messageObservable.subscribe(message => {
        console.log('Client received message ' + JSON.stringify(message.toJSON()));
    });

    // read config file, package into HubMessage and send to Hub

    FileUtils.readJSONFile(options.config).then((obj : any) => {
        console.log('Client read config file : ' + JSON.stringify(obj));
        const content = ComponentMessageContent.newFromJSON(obj);
        const message = new HubMessage(HubMessageType.Component, null, content);
        connection.sendMessage(message);
    }).catch(err => {
        console.error('Client could not load config: ' + err.message);
    });

});


