
import * as q from 'q';
import * as _ from 'underscore';

import {CoreUtils, GUID, IConnection, IMessageSender} from '../lib/core';
import {ControlMessageContent, ActionMessageContent} from '../lib/messaging';
import {CreateMessageContent, DestroyMessageContent} from '../lib/messaging';
import {Parameters, HubMessageType, HubMessage} from '../lib/messaging';
import {MIDIInputAdapter, MIDIOutputAdapter, MIDIUtils} from "../lib/connector/midi";

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
        console.log('MIDI input autoselected: ' + options.input);
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
        console.log('MIDI output autoselected: ' + options.output);
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


const componentIdentifier = MIDIUtils.midiNameToComponentIdentifier(options.output);
const channelIdentifier = MIDIUtils.channelNumberToIdentifier(options.channel);

function* controlGenerator() {
    let i = 0;
    const controllerIdentifier = MIDIUtils.controllerNumberToIdentifier(options.controller);
    while(i < iterations) {
        const value = values[i % values.length];
        const parameters = Parameters.newFromJSON({});
        parameters.setParameter(controllerIdentifier, [value]);
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
        const note = notes[i % notes.length];
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
    console.log('MIDI output generate start');
    while (current < iterations) {
        current++;
        if (sender.canSendMessage() == false) break;
        //console.log('MIDI output generate delay ' + options.interval);
        await delay(options.interval);
        const obj = generator.next();
        console.log('MIDI output generate sendMessage ' + JSON.stringify(obj.value.toJSON()));
        sender.sendMessage(obj.value);
        if (obj.done) break;
    }
}

function delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

const generators = {
    'control' : controlGenerator,
    'note' : noteGenerator
};



let testOutput = null;

q().then(() => {

    console.log('MIDITest simple output test...')
    testOutput = new easymidi.Output(options.output);

    console.log('... note on');
    testOutput.send('noteon', {
        note: 64,
        velocity: 127,
        channel: 1
    });

}).then(() => delay(1000)).then(() => {

    console.log('... note off');
    testOutput.send('noteoff', {
        note: 64,
        velocity: 127,
        channel: 1
    });

}).then(() => delay(1000)).then(() => {

    console.log('... closing');
    testOutput.close();

}).then(() => delay(1000)).then(() => {

    console.log('MIDITest adapter test');

    let outputAdapter : MIDIOutputAdapter = null;
    let inputAdapter : MIDIInputAdapter = null;

    if (options.input) {

        inputAdapter = new MIDIInputAdapter(null);

        //inputAdapter.

        inputAdapter.messageObservable.subscribe(message => {
            console.log('MIDI input adapter: ' + JSON.stringify(message.toJSON()));
        });

        inputAdapter.start({name: options.input, virtual: false, normalise: false});

    }

    if (options.output) {

        outputAdapter = new MIDIOutputAdapter(null);

        outputAdapter.start({name: options.output, virtual: false, denormalise: false});

        Promise.all([generate(outputAdapter, noteGenerator()), generate(outputAdapter, controlGenerator())]).then(() => {
            console.log('MIDI output generators are done');
        });

    }

}).catch(error => {

    console.error('MIDI Test error ' + error);

});



