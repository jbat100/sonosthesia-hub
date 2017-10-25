
import * as Q from 'q';

import {Message, MessageContentParser, IConnection} from '../core';
import {HubMessage} from "../messaging";

import {BaseConnection, BaseConnector} from './core';

const easymidi = require('easymidi');


export class MIDIOutputAdapter extends BaseConnection implements IConnection
{
    private _denormaliseInput : boolean = true;

    private _midiOutput

    constructor() {
        super(null);
    }

    start(config : any)
    {

    }
}




