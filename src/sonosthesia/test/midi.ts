
import * as _ from 'underscore';

import {CoreUtils, GUID, IConnection, IMessageSender} from '../lib/core';
import {ControlMessageContent, ActionMessageContent} from '../lib/messaging';
import {CreateMessageContent, DestroyMessageContent} from '../lib/messaging';
import {Parameters, HubMessageType, HubMessage} from '../lib/messaging';
import {MIDIUtils} from "../lib/connector/midi";

const easymidi = require('easymidi');
const commandLineArgs = require('command-line-args');


const iterations = 1000000;
let current = 0;

const optionDefinitions = [
    { name: 'input', alias: 'i', type: String },
    { name: 'output', alias: 'o', type: String },
    { name: 'velocity', alias: 'v', type: Number},
    { name: 'period', alias: 'p', type: Number },
    { name: 'channel', alias: 'c', type: Number },
    { name: 'controller', alias: 'x', type: Number}
];

const options = commandLineArgs(optionDefinitions);

// enter default options

if (!options.input)
{
    const inputs = easymidi.getInputs();
    if (inputs.length > 0)
    {
        options.input = inputs[0];
    }
    else
    {
        console.warn('no midi input');
    }
}

if (!options.output)
{
    const outputs = easymidi.getOutputs();
    if (outputs.length > 0)
    {
        options.output = outputs[0];
    }
    else
    {
        console.warn('no midi output');
    }
}

if (!options.channel) options.channel = 1;
if (!options.controller) options.controller = 100;
if (!options.velocity) options.velocity = 100;
if (!options.interval) options.interval = 1000;
if (!options.count) options.count = 10;

// used in several generations

const notes = _.range(50, 62);
const values = _.range(30, 100);


const componentIdentifier = MIDIUtils.componentIdentifierToMidiName(options.output);
const channelIdentifier = MIDIUtils.channelNumberToIdentifier(options.channel);

function* controlGenerator() {
    let i = 0;
    const controllerIdentifier = MIDIUtils.controllerNumberToIdentifier(options.controller);
    while(i < iterations) {
        const value = values[iterations % values.length];
        const parameters = Parameters.newFromJSON({controllerIdentifier : value});
        const content = new ControlMessageContent(componentIdentifier, channelIdentifier, null, null, parameters);
        const message = new HubMessage(HubMessageType.Control, null, content);
        i++;
        yield message;
    }
}

function* noteGenerator() {
    let i = 0, content, message, parameters;
    while(i < iterations) {
        i++;
        const instance = CoreUtils.createIdentifier();
        const note = notes[iterations % notes.length];
        const velocity = options.velocity;
        // create instance
        parameters = Parameters.newFromJSON({note : note, velocity: velocity});
        content = new CreateMessageContent(componentIdentifier, channelIdentifier, instance, null, parameters);
        message = new HubMessage(HubMessageType.Create, null, content);
        yield message;
        // instance control message
        parameters = Parameters.newFromJSON({note : note, velocity: velocity + 10});
        content = new ControlMessageContent(componentIdentifier, channelIdentifier, instance, null, parameters);
        message = new HubMessage(HubMessageType.Control, null, content);
        yield message;
        // destroy instance
        parameters = Parameters.newFromJSON({note : note, velocity: velocity});
        content = new DestroyMessageContent(componentIdentifier, channelIdentifier, instance, null, parameters);
        message = new HubMessage(HubMessageType.Destroy, null, content);
        yield message;
    }
}


async function generate(sender : IMessageSender, generator : any) {
    // usually stopped with ctrl-c, but safeguards against the program running forever pointlessly
    //console.log('generate start');
    while (current < iterations) {
        current++;
        if (sender.canSendMessage() == false) break;
        //console.log('generate delay ' + options.interval);
        await delay(options.interval);
        const obj = generator.next();
        //console.log('generate sendMessage');
        sender.sendMessage(obj.value);
        if (obj.done) break;
    }
}

function delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

const generators = {
    'control' : controlGenerator,
    'note' : noteGenerator
};