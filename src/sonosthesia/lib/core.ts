
import * as Q from "q";
import * as _ from 'underscore';
import {expect} from "chai";
import {EventEmitter} from 'eventemitter3';
import * as Rx from 'rx';
import * as uuid from 'node-uuid';


export interface IConnection {

    // http://stackoverflow.com/questions/12838248/is-it-possible-to-use-getters-setters-in-interface-definition

    messageObservable : Rx.Observable<Message>;

    identifier : string;

    sendJSON(message : any);

    sendMessage(message : Message);

}

export enum ConnectorState {
    None,
    Started,
    Stopped,
    Error
}

// not sure this a good idea, waiting to have played with Rx a bit, until then, sticking with event emitters

export interface IConnector {

    emitter : EventEmitter;

    // not sure this a good idea, waiting to have played with Rx a bit, until then, sticking with event emitters
    //stateObservable : Rx.Observable<ConnectorState>;
    //connectionObservable : Rx.Observable<IConnection>;
    //disconnectionObservable : Rx.Observable<IConnection>;

    start(port : number) : Q.Promise<void>;

    stop() : Q.Promise<void>;

}


/**
 *
 */
export class NativeClass {
    static cloneInstance(instance) {
        // seems too good to be true, but also seems to work...
        // http://codepen.io/techniq/pen/qdZeZm
        return Object.assign(Object.create(instance), instance);
    }
    /**
     * Not really useful now that we are using typescript
     * @param instance
     * @param klass
     * @returns {Assertion}
     */
    static checkInstanceClass(instance, klass) {
        // seems too good to be true, but also seems to work...
        // http://codepen.io/techniq/pen/qdZeZm
        return expect(instance).to.be.instanceof(klass);
    }
    get tag() : string { return this.constructor.name; }
}

export class NativeEmitterClass extends EventEmitter {
    get tag() { return this.constructor.name; }
}


export class MessageContentParser extends NativeClass {

    parse(type : string, content : any) : any {
        throw new Error('not implemented');
    }

}

export class Message extends NativeClass {

    private _raw: string;

    static checkJSON(obj : any) {
        expect(obj.type).to.be.a('string');
        expect(obj.date).to.be.a('string');
    }

    static newFromJSON(obj : any, parser : MessageContentParser) : Message {
        this.checkJSON(obj);
        return new this(obj.type, new Date(<string>obj.date), parser.parse(obj.type, obj.content));
    }

    constructor(private _type : string, private _date : Date, private _content: any) {
        super();
        if (!this._date) this._date = new Date();
    }

    get type() : string { return this._type; }
    get date() : Date { return this._date; }
    get content() : any { return this._content; }
    get raw() : string {
        if (!this._raw)
            this._raw = JSON.stringify(this.toJSON());
        return this._raw;
    }

    toJSON() : any {
        return {
            type: this.type,
            date: this.date.toISOString(),
            content: this.content.toJSON()
        }
    }

}

/**
 *  Declarable can be destroyed by new declarations or disconnections
 */
export class Declarable extends NativeClass {

    private _identifier : string;
    private _live = true;
    private _info : any;

    static create(identifier:string, info:any) {
        const instance = new this(identifier);
        instance.update(info);
        return instance;
    }

    constructor(identifier:string) {
        super();
        this._identifier = identifier;
        this._live = true;
    }

    get identifier() : string { return this._identifier; }
    get live() : boolean { return this._live; }
    set live(value : boolean) {
        this._live = value;
    }

    update(info:any) {
        this._info = info;
        this._applyInfo(info);
    }

    createReference() {
        throw new Error('unimplemented');
    }

    _applyInfo(info:any) {

    }
}

/**
 * Abstract class for info (usually declared by JSON network interfaces)
 */
export class Info extends NativeClass {

    private _identifier : string;

    static newFromJSON(obj : any) {
        const instance = new this();
        instance.applyJSON(obj);
        return instance;
    }

    get identifier() : string { return this._identifier; }

    applyJSON(obj:any) {
        expect(obj.identifier).to.be.a('string');
        this._identifier = obj.identifier;
    }

    toJSON() : any {
        return _.pick(this, 'identifier');
    }

}

export class Selection {

    private _identifier : string;
    private _valid : boolean;

    constructor() {
        this._identifier = null;
        this._valid = false;
    }

    get identifier() : string { return this._identifier; }
    set identifier(identifier : string) { this._identifier = identifier; }
    get valid() : boolean { return this._valid; }
    set valid(valid : boolean) { this._valid = valid; }

}

export class Range extends NativeClass {

    static newFromJSON(obj) {
        expect(obj).to.be.an('object');
        const instance = new this(+obj.min, +obj.max);
        instance.check();
        return instance;
    }

    constructor(private _min : number, private _max : number) {
        super();
    }

    get min() : number { return this._min; }
    set min(min : number) { this._min = min; }
    get max() : number { return this._max; }
    set max(max : number) { this._max = max; }

    check() { if (this._min > this._max) throw new Error('min should be less than max'); }

    toJSON() {
        return _.pick(this, 'min', 'max');
    }

}

export class GUID extends NativeClass {

    static generate() : string {
        return uuid.v4();
    }

}