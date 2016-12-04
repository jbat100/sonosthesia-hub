
import * as _ from 'underscore';
import {expect} from "chai";
import {EventEmitter} from 'eventemitter3';

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
    get tag() { return this.constructor.name; }
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

    _parsed = false;

    static newFromRaw(raw:string) {
        const obj : any = JSON.parse(raw);
        expect(obj.type).to.be.a('string');
        expect(obj.date).to.be.a('string');
        return new this(obj.type, Date.parse(obj.date), this.parseContent(obj.type, obj.content), raw);
    }

    constructor(private _type : string, private _date : Date, private _content: any, private _raw?: string) {
        super();
    }

    get type() : string { return this._type; }

    get date() : Date { return this._date; }

    get content() : any { return this._content; }

    get raw() : string { return this._raw; }

    parse(parser : MessageContentParser) {
        if (this._parsed) throw new Error('message content is already parsed');
        this._content = parser.parse(this.type, this.content);
        this._parsed = true;
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
        const instance = new this(obj)
        instance.applyJSON(obj);
        return instance;
    }

    get identifier() : string { return this._identifier; }

    applyJSON(obj:any) {
        expect(obj.identifier).to.be.a('string');
        this._identifier = obj.identifier;
    }

    makeJSON() : any {
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

    constructor(private _min : number, private _max : number) { }

    get min() : number { return this._min; }

    set min(min : number) { this._min = min; }

    get max() : number { return this._max; }

    set max(max : number) { this._max = max; }

    check() { if (this._min > this._max) throw new Error('min should be less than max'); }

    makeJSON() {
        return _.pick(this, 'min', 'max');
    }

}