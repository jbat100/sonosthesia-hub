
import * as _ from 'underscore';

import * as Q from 'q';

import {Message, MessageContentParser, IConnection} from '../core';
import {ChannelMessageContent, HubMessage, HubMessageType} from "../messaging";
import {ChannelInfo, ComponentInfo, ParameterInfo} from "../component";

import {BaseConnection, BaseConnector} from './core';

const easymidi = require('easymidi');

export interface MIDIOutputConfig
{
    name : string;
    virtual : boolean;
}

export class MIDIUtils
{
    static namePreffix : string = 'MIDI: ';
    static channelPreffix : string = 'channel';
    static controllerPreffix : string = 'controller';

    static channelIdentifier : string = 'channel';
    static velocityIdentifier : string = 'velocity';
    static noteIdentifier : string = 'note';
    static valueIdentifier : string = 'value';

    static midiNameToComponentIdentifier(midiName : string) {
        return this.namePreffix + midiName;
    }

    static componentIdentifierToMidiName(componentName : string) {
        return componentName.substring(this.namePreffix.length);
    }

    static channelNumberToIdentifier(channel : number) : string {
        return this.channelPreffix + channel.toString();
    }

    static channelIdentifierToNumber(channel : string) : number {
        return parseInt(channel.substring(this.channelPreffix.length));
    }

    static controllerNumberToIdentifier(controller : number) : string {
        return this.controllerPreffix + controller.toString();
    }

    static controllerIdentifierToNumber(controller : string) : number {
        return parseInt(controller.substring(this.controllerPreffix.length));
    }

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

export class MIDIOutputAdapter extends BaseConnection implements IConnection
{
    private _denormaliseInput : boolean = true;

    private _midiOutput : any;

    constructor() {
        super(null);
    }

    start(config : MIDIOutputConfig)
    {
        this._midiOutput = new easymidi.Output(config.name, config.virtual);
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

    }

    sendInstanceCreate(content : ChannelMessageContent) {

    }

    sendInstanceDestroy(content : ChannelMessageContent) {

    }

    sendInstanceControl(content : ChannelMessageContent) {

    }


}




