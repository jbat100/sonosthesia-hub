
import * as _ from 'underscore';
import * as Q from 'q';

import {Message, MessageContentParser, IConnection, CoreUtils} from '../core';
import {ChannelMessageContent, HubMessage, HubMessageType, Parameters} from "../messaging";
import {ChannelInfo, ComponentInfo, ParameterInfo} from "../component";

import {BaseConnection, BaseConnector} from './core';

const easymidi = require('easymidi');

export interface MIDIOutputAdapterConfig
{
    name : string;
    virtual : boolean;
    denormalise: boolean;
}

export interface MIDIInputAdapterConfig
{
    name : string;
    virtual : boolean;
    normalise: boolean;
}

interface IMidiNoteDescription
{
    note: number,
    channel: number
}

interface IInstanceNoteMap
{
    [key: string]: IMidiNoteDescription;
}

export class MIDIUtils
{
    static componentPreffix : string = 'MIDI: ';
    static channelPreffix : string = 'channel';
    static controllerPreffix : string = 'controller';

    static channelIdentifier : string = 'channel';
    static velocityIdentifier : string = 'velocity';
    static noteIdentifier : string = 'note';

    //------------------ MIDI Component helpers ---------------------

    static midiNameToComponentIdentifier(midiName : string) {
        return this.componentPreffix + midiName;
    }

    static componentIdentifierToMidiName(componentName : string) {
        return componentName.substring(this.componentPreffix.length);
    }

    static isMIDIComponentIdentifier(candidate : string) : boolean {
        return candidate && candidate.startsWith(this.componentPreffix);
    }

    //------------------ MIDI Channel helpers ---------------------

    static channelNumberToIdentifier(channel : number) : string {
        return this.channelPreffix + channel.toString();
    }


    static channelIdentifierToNumber(channel : string) : number {
        return parseInt(channel.substring(this.channelPreffix.length));
    }

    static isChannelIdentifier(candidate : string) : boolean {
        return candidate && candidate.startsWith(this.channelPreffix);
    }

    //------------------ MIDI Channel helpers ---------------------

    static controllerNumberToIdentifier(controller : number) : string {
        return this.controllerPreffix + controller.toString();
    }

    static controllerIdentifierToNumber(controller : string) : number {
        return parseInt(controller.substring(this.controllerPreffix.length));
    }

    static isControllerIdentifier(candidate : string) : boolean {
        return candidate && candidate.startsWith(this.controllerPreffix);
    }

    //------------------ Component/Channel Info helpers ---------------------

    static midiChannelInfo(channel : number, normalised : boolean) : ChannelInfo {

        const channelInfo = new ChannelInfo();

        channelInfo.identifier = this.channelNumberToIdentifier(channel);

        const maxValue = normalised ? 1.0 : 127.0;

        channelInfo.parameterSet.addOrUpdateElement(ParameterInfo.Create(this.noteIdentifier, 0.0, 0.0, maxValue));
        channelInfo.parameterSet.addOrUpdateElement(ParameterInfo.Create(this.velocityIdentifier, 0.0, 0.0, maxValue));

        _.range(0, 128).forEach(i => {
            const identifier = this.controllerNumberToIdentifier(i);
            const parameterInfo = ParameterInfo.Create(identifier, 0.0, 0.0, maxValue);
            channelInfo.parameterSet.addOrUpdateElement(parameterInfo);
        });

        return channelInfo;

    }

    static midiComponentInfo(name : string, normalised : boolean) : ComponentInfo {

        const componentInfo = new ComponentInfo();

        componentInfo.identifier = this.midiNameToComponentIdentifier(name);

        _.range(0, 16).forEach(i => {
            componentInfo.channelSet.addOrUpdateElement(this.midiChannelInfo(i, normalised));
        });

        return componentInfo;

    }
}

export class MIDIInputAdapter extends BaseConnection implements IConnection
{
    private _config : MIDIInputAdapterConfig = null;

    private _midiInput : any;

    private _instanceNoteMap : IInstanceNoteMap = {};

    start(config : MIDIInputAdapterConfig)
    {
        try {
            this._midiInput = new easymidi.Input(config.name, config.virtual);
            this._config = config;
        } catch (error) {
            this._config = null;
            console.error(this.tag + ' error creating midi input, available: ' + JSON.stringify(easymidi.getInputs()));
            throw error;
        }

        this._midiInput.on('noteon', (midiMessage) => {
            const message = this.midiNoteMessageToHubMessage(midiMessage, HubMessageType.Create);
            this.messageSubject.next(message);
        });

        this._midiInput.on('noteoff', (midiMessage) => {
            const message = this.midiNoteMessageToHubMessage(midiMessage, HubMessageType.Destroy);
            this.messageSubject.next(message);
        });

        this._midiInput.on('poly aftertouch', (midiMessage) => {
            const message = this.midiNoteMessageToHubMessage(midiMessage, HubMessageType.Control);
            this.messageSubject.next(message);
        });

        this._midiInput.on('cc', (midiMessage) => {
            const message = this.midiControlMessageToHubMessage(midiMessage);
            this.messageSubject.next(message);
        });


    }

    private midiControlMessageToHubMessage(midiMessage : any) : HubMessage {

        const channel = MIDIUtils.channelNumberToIdentifier(midiMessage.channel);
        const component = MIDIUtils.midiNameToComponentIdentifier(this._config.name);

        const key = MIDIUtils.controllerNumberToIdentifier(midiMessage.controller);

        const parameters = new Parameters();
        parameters.setParameter(key, [this.processMIDINumber(midiMessage.value)]);

        const content = new ChannelMessageContent(component, channel, null, null, parameters);

        return new HubMessage(HubMessageType.Control, null, content);
    }

    private midiNoteMessageToHubMessage(midiMessage : any, messageType : HubMessageType) : HubMessage {

        const channel = MIDIUtils.channelNumberToIdentifier(midiMessage.channel);
        const component = MIDIUtils.midiNameToComponentIdentifier(this._config.name);

        let instance = null;

        switch (messageType) {
            case HubMessageType.Create:
                instance = CoreUtils.createIdentifier();
                this.pushNoteInstance(midiMessage, instance);
                break;
            case HubMessageType.Control:
                instance = this.getNoteInstance(midiMessage);
                break;
            case HubMessageType.Destroy:
                instance = this.popNoteInstance(midiMessage);
                break;
            default:
                break;
        }

        const parameters = new Parameters();
        parameters.setParameter(MIDIUtils.noteIdentifier, [this.processMIDINumber(midiMessage.note)]);
        parameters.setParameter(MIDIUtils.velocityIdentifier, [this.processMIDINumber(midiMessage.velocity)]);

        const content = new ChannelMessageContent(component, channel, instance, null, parameters);

        return new HubMessage(messageType, null, content);
    }

    private processMIDINumber(value : number) {
        return value / (this._config.normalise ? 127.0 : 1.0);
    }

    private pushNoteInstance(note : IMidiNoteDescription, instance : string) {
        this._instanceNoteMap[instance] = note;
    }

    private getNoteInstance(description : IMidiNoteDescription) : string {
        let result : string = null;
        _.each(this._instanceNoteMap, (candidate, instance) => {
            if (candidate.note == description.note && candidate.channel == description.channel) {
                result = instance;
            }
        });
        return result;
    }

    private popNoteInstance(description : IMidiNoteDescription) : string {
        const result = this.getNoteInstance(description);
        if (result) {
            delete this._instanceNoteMap[result];
        }
        return result;
    }

}

export class MIDIOutputAdapter extends BaseConnection implements IConnection
{
    private _config : MIDIOutputAdapterConfig = null;

    private _midiOutput : any;

    private _instanceNoteMap : IInstanceNoteMap = {};


    start(config : MIDIOutputAdapterConfig)
    {
        try {
            this._midiOutput = new easymidi.Output(config.name, config.virtual);
            this._config = config;
        } catch (error) {
            this._config = null;
            console.error(this.tag + ' error creating midi output, available: ' + JSON.stringify(easymidi.getOutputs()));
        }
    }

    sendMessage(message : HubMessage) {

        const content : ChannelMessageContent = message.content as ChannelMessageContent;

        if (!content)
        {
            console.error(this.tag + 'expected channel message');
            return;
        }

        if (content.instance)
        {
            switch (message.hubMessageType) {
                case HubMessageType.Create:
                    this.sendInstanceCreate(content);
                    break;
                case HubMessageType.Destroy:
                    this.sendInstanceDestroy(content);
                    break;
                case HubMessageType.Control:
                    this.sendInstanceControl(content);
                    break;
                default:
                    console.error(this.tag + 'unexpected message type');
                    break;
            }
        }
        else
        {
            switch (message.hubMessageType) {
                case HubMessageType.Control:
                    this.sendStaticControl(content);
                    break;
                default:
                    console.error(this.tag + 'unexpected message type');
                    break;
            }
        }


    }

    sendStaticControl(content : ChannelMessageContent) {

        if (this.checkContent(content, false) && this.checkMIDIOutput()) {
            const channel = MIDIUtils.channelIdentifierToNumber(content.channel);
            content.parameters.getKeys().forEach(key => {
                if (MIDIUtils.isControllerIdentifier(key)) {
                    try {
                        const controller = MIDIUtils.controllerIdentifierToNumber(key);
                        const value = content.parameters.getParameter(key);
                        const msg = { channel: channel, controller: controller, value: value };
                        console.log(this.tag + ' sending MIDI cc ' + JSON.stringify(msg));
                        this._midiOutput.send('cc', msg);
                    } catch (error) {
                        console.error(this.tag + ' MIDI output error: ' + error.message);
                    }
                } else {
                    console.warn(this.tag + ' unexpected parameter identifier: ' + key);
                }
            });
        }

    }

    sendInstanceCreate(content : ChannelMessageContent) {

        if (this.checkContent(content, true) && this.checkMIDIOutput()) {
            try {
                const channel = MIDIUtils.channelIdentifierToNumber(content.channel);
                const note = this.extractNote(content);
                const velocity = this.extractVelocity(content);
                this.pushInstanceNote(content.instance, {note: note, channel: channel});
                const msg = {note: note, channel: channel, velocity: velocity };
                console.log(this.tag + ' sending MIDI noteon : ' + JSON.stringify((msg)));
                this._midiOutput.send('noteon', msg);
            } catch (error) {
                console.error(this.tag + ' MIDI output error: ' + error.message);
            }
        }

    }

    sendInstanceDestroy(content : ChannelMessageContent) {

        if (this.checkContent(content, true) && this.checkMIDIOutput()) {
            try {
                const description = this.popInstanceNote(content.instance);
                const velocity = this.extractVelocity(content);
                const msg =  {note: description.note, channel: description.channel, velocity: velocity };
                console.log(this.tag + ' sending MIDI noteoff : ' + JSON.stringify((msg)));
                this._midiOutput.send('noteoff', msg);
            } catch (error) {
                console.error(this.tag + ' MIDI output error: ' + error.message);
            }
        }

    }

    sendInstanceControl(content : ChannelMessageContent) {

        if (this.checkContent(content, true) && this.checkMIDIOutput()) {
            try {
                const description = this.getInstanceNote(content.instance);
                const velocity = this.extractVelocity(content);
                const msg = { note: description.note, channel: description.channel, velocity: velocity };
                console.log(this.tag + ' sending MIDI note puly aftertouch : ' + JSON.stringify((msg)));
                this._midiOutput.send('poly aftertouch', msg);
            } catch (error) {
                console.error(this.tag + ' MIDI output error: ' + error.message);
            }
        }

    }

    private extractVelocity(content : ChannelMessageContent) {
        return this.extractKey(content, MIDIUtils.velocityIdentifier);
    }

    private extractNote(content : ChannelMessageContent) {
        return this.extractKey(content, MIDIUtils.noteIdentifier);
    }

    private extractKey(content : ChannelMessageContent, key : string) {
        const val = content.parameters.getSingleParameter(key);
        if (this._config.denormalise) {
            return Math.round(val * 127.0);
        } else {
            return val;
        }
    }

    private pushInstanceNote(instance : string, note : IMidiNoteDescription) {
        this._instanceNoteMap[instance] = note;
    }

    private getInstanceNote(instance : string) : IMidiNoteDescription {
        if (_.has(this._instanceNoteMap, instance)) {
            return this._instanceNoteMap[instance];
        } else {
            return null;
        }
    }

    private popInstanceNote(instance : string) : IMidiNoteDescription {
        if (_.has(this._instanceNoteMap, instance)) {
            const result = this._instanceNoteMap[instance];
            delete this._instanceNoteMap[instance];
            return result;
        } else {
            return null;
        }
    }

    private checkMIDIOutput() : boolean {

        if (this._midiOutput == null)  {
            console.error(this.tag + ' expected MIDI output');
            return false;
        }

        return true;

    }

    private checkContent(content : ChannelMessageContent, expectInstance : boolean) : boolean
    {
        if (MIDIUtils.isMIDIComponentIdentifier(content.component) == false) {
            console.error(this.tag + ' unexpected component identifier: ' + content.component);
            return false;
        }
        if (MIDIUtils.isChannelIdentifier(content.channel) == false) {
            console.error(this.tag + ' unexpected channel identifier: ' + content.channel);
            return false;
        }
        if ((!!content.instance) != expectInstance) {
            console.error(this.tag + ' unexpected instance');
            return false;
        }
        return true;
    }
}




