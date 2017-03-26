/**
 * A script to help producing messages mostly as a test and debug tool for other clients
 */

const commandLineArgs = require('command-line-args');

import {Socket} from 'net';
import * as _  from 'underscore';

import {GUID} from '../lib/core';
import {TCPConnection} from '../lib/connector';
import {ControlMessageContent, ActionMessageContent, HubMessageContentParser} from '../lib/messaging';
import {CreateMessageContent, DestroyMessageContent} from '../lib/messaging';
import {Parameters, HubMessageType, HubMessage} from '../lib/messaging';

const iterations = 1000000;
let current = 0;

const optionDefinitions = [
    { name: 'type', alias: 't', type: String },
    { name: 'address', alias: 'a', type: String },
    { name: 'port', alias: 'p', type: Number },
    { name: 'interval', alias: 'i', type: Number },
    { name: 'count', alias: 'c', type: Number }
];

const options = commandLineArgs(optionDefinitions);

// enter default options

if (!options.type) options.type = 'control';
if (!options.address) options.address = '127.0.0.1';
if (!options.port) options.port = 3333;
if (!options.interval) options.interval = 1000;
if (!options.count) options.count = 10;

// used in several generations

const range = 1.0;
const step = range / options.count;
const component = 'test-component';
const channel = 'test-channel';
const parameter = 'test-parameter';
const key = 'test-key';
// no need for instance identifier, they should be auto generated guids


// generators

function* controlGenerator() {
    let i = 0;
    let val = 0.0;
    while(i < iterations) {
        val = val + step;
        if (val > 1.0) val = 0.0;
        const parameters = Parameters.newFromJSON({parameter : val});
        const content = new ControlMessageContent(component, channel, null, null, parameters);
        const message = new HubMessage(HubMessageType.Control, null, content);
        i++;
        yield message;
    }
}

function* actionGenerator() {
    let i = 0;
    while(i < iterations) {
        i++;
        const content = new ActionMessageContent(component, channel, null, key, null);
        const message = new HubMessage(HubMessageType.Action, null, content);
        yield message;
    }
}

function* instanceGenerator() {
    let i = 0, content, message;
    while(i < iterations) {
        i++;
        const instance = GUID.generate();
        // create instance
        content = new CreateMessageContent(component, channel, instance, null, null);
        message = new HubMessage(HubMessageType.Create, null, content);
        yield message;
        // instance action message
        content = new ActionMessageContent(component, channel, instance, key, null);
        message = new HubMessage(HubMessageType.Action, null, content);
        yield message;
        // instance control message
        const parameters = Parameters.newFromJSON({parameter : 0.5});
        content = new ControlMessageContent(component, channel, instance, null, parameters);
        message = new HubMessage(HubMessageType.Control, null, content);
        yield message;
        // destroy instance
        content = new DestroyMessageContent(component, channel, instance, null, null);
        message = new HubMessage(HubMessageType.Destroy, null, content);
        yield message;
    }
}


async function generate(connection : TCPConnection, generator : any) {
    // usually stopped with ctrl-c, but safeguards against the program running forever pointlessly
    while (current < iterations) {
        current++;
        await delay(options.interval);
        const obj = generator.next();
        connection.sendMessage(obj.value);
        if (obj.done) break;
    }
}

function delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

const generators = {
    'control' : controlGenerator,
    'action' : actionGenerator,
    'instance' : instanceGenerator
};

if (!_.has(generators, options.type)) {
    throw new Error('unsuported generator type : ' + options.type);
}

const client = new Socket();
const parser = new HubMessageContentParser();
const generator = generators[options.type]();

client.connect(options.port, options.address, () => {
    console.log('Connected');
    const connection = new TCPConnection(parser, null, client);
    generate(connection, generator).then(() => { console.log('done'); }).catch(err => {
        console.log('Ended with error ' + err.stack);
    });
});


