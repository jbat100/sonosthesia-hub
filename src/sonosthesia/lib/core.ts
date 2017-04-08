
import  * as fs from 'fs';

import * as Q from "q";
import * as _ from 'underscore';
import {expect} from "chai";
import {EventEmitter} from 'eventemitter3';
import * as Rx from 'rxjs/Rx';
import * as uuid from 'node-uuid';


export interface IMessageSender {
    sendMessage(message : Message);
}


export interface IConnection extends IMessageSender {
    // http://stackoverflow.com/questions/12838248/is-it-possible-to-use-getters-setters-in-interface-definition
    messageObservable : Rx.Observable<Message>;
    identifier : string;
    connectionType: string;
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
        return new this(obj.type, +(obj.date as string), parser.parse(obj.type, obj.content));
    }

    constructor(private _type : string, private _timestamp : number, private _content: any) {
        super();
        if (!this._timestamp) this._timestamp = Date.now();
    }

    get type() : string { return this._type; }
    get content() : any { return this._content; }
    get raw() : string {
        if (!this._raw)
            this._raw = JSON.stringify(this.toJSON());
        return this._raw;
    }

    get timestamp() : number { return this._timestamp; }

    toJSON() : any {
        return {
            type: this.type,
            date: this.timestamp,
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

export interface ISerialisableJSON {

    applyJSON(obj:any);

    toJSON() : any;

}

/**
 * Abstract class for info (usually declared by JSON network interfaces)
 */
export class Identifier extends NativeClass {

    protected _identifier : string;

    constructor() {
        super();
        this._identifier = GUID.generate(); // generate a default id, may be overriten by JSON
    }

    get identifier() : string { return this._identifier; }


}

export class Info extends Identifier implements ISerialisableJSON {

    static newFromJSON(obj : any) {
        const instance = new this();
        instance.applyJSON(obj);
        return instance;
    }

    applyJSON(obj : any) {
        expect(obj.identifier).to.be.a('string');
        this._identifier = obj.identifier;
    }

    toJSON() : any {
        return _.pick(this, 'identifier');
    }

}

// used for common case of set of elements, used for JSON parsing, for managing lists of things use ListManager
// http://stackoverflow.com/questions/17382143/how-to-create-a-new-object-from-type-parameter-in-generic-class-in-typescript
// looks redundant but I don't see any other way, generics info does not compile down to javascript so we have to pass in the
// constructor used to build the info objects
//
// Use like this:
// const set = new InfoSet<ChannelInfo>(ChannelInfo);
//
export class InfoSet <T extends Info> {

    private _elements : T[];

    constructor(private _TCreator : { new (): T; }) {
        this._elements = [];
    }

    // cannot use generic type in static method
    applyJSON(objs : any[]) {
        expect(objs).to.be.instanceof(Array);
        objs.forEach((obj : any) => {
            const element : T = new this._TCreator();
            element.applyJSON(obj);
            this.addOrUpdateElement( element );
        })
    }

    toJSON() : any[] {
        return this._elements.map((element : T) => { return element.toJSON(); })
    }

    addOrUpdateElement(element : T) {
        const index = this._elements.findIndex((candidate : T) => {return candidate.identifier === element.identifier});
        if (index == -1) {
            this._elements.push(element);
        } else {
            this._elements[index] = element;
        }
    }

    removeElement(identifier : string) {
        this._elements = this._elements.filter(candidate => { return candidate.identifier == identifier; });
    }

    removeAllElements() {
        this._elements = [];
    }

    getElement(identifier : string) : T {
        return this._elements.find((element : T) => { return element.identifier === identifier; });
    }

    identifiers() : string[] {
        return this._elements.map((element : T) => { return element.identifier; })
    }

    elements() : T[] {
        return Array.from(this._elements);
    }

    has(identifier : string) : boolean {
        return !!this._elements.find((element : T) => { return element.identifier === identifier; });
    }

}

// List manager is used for all the things where wa have a UI list with a create/plus button and each item has
// a delete button, it differs from info set:
// - refer to elements by index not identifier
// - elements have behaviour, info subclasses should not
// - constructors may receive arguments so constructing is left to others
// - order matters, items can be inserted at specific index
// - can be observed
// - implements iterator pattern https://basarat.gitbooks.io/typescript/docs/iterators.html
// - going through some legth to prevent direct element access without sacrificing performance with iteration

export class ListIterator <T> implements IterableIterator<T> {

    private _pointer = 0;

    constructor(private _elements: T[]) {}

    public next(): IteratorResult<T> {
        if (this._pointer < this._elements.length) {
            return {
                done: false,
                value: this._elements[this._pointer++]
            }
        } else {
            return {
                done: true,
                value: null
            }
        }
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this;
    }

}

export class ListManager <T> {

    private _elements : T[] = [];

    private _elementsSource = new Rx.BehaviorSubject<T[]>([]);
    private _elementsObservable = this._elementsSource.asObservable();

    private updateElementSource() {
        this._elementsSource.next( this.elements );
    }

    appendElement(element : T) {
        this._elements.push(element);
        this.updateElementSource();
    }

    addElementAtIndex(element : T, index : number) {
        this._elements.splice(index, 0, element);
        this.updateElementSource();
    }

    removeElement(index : number) {
        this._elements.splice(index, 1);
        this.updateElementSource();
    }

    removeAllElements() {
        this._elements = [];
        this.updateElementSource();
    }

    getElement(index : number) : T {
        return this._elements[index];
    }

    // use only if a copy is required, otherwise use the iterator (for ... of ... {})
    get elements() : T[] { return Array.from(this._elements); }

    get elementIterator() : ListIterator <T> { return new ListIterator <T> (this._elements); }

    get elementsObservable() : Rx.Observable<T[]> { return this._elementsObservable; }

}

export class Selection {

    private _valid : boolean;

    private _identifierSubject = new Rx.BehaviorSubject<string>(null);
    private _identifierObservable : Rx.Observable<string> = this._identifierSubject.asObservable();

    private _validSubject = new Rx.BehaviorSubject<boolean>(false);
    private _validObservable : Rx.Observable<boolean> = this._validSubject.asObservable();

    private _changeSubject = new Rx.Subject<void>();
    private _changeObservable : Rx.Observable<void> = this._changeSubject.asObservable();

    constructor(_identifier : string = null) {
        this._identifierSubject.next(_identifier);
        this._validSubject.next(false);
    }

    get identifierObservable() : Rx.Observable<string> { return this._identifierObservable; }
    get identifier() : string { return this._identifierSubject.getValue(); }
    set identifier(identifier : string) {
        this._identifierSubject.next(identifier);
        this._changeSubject.next();
    }

    get validObservable() : Rx.Observable<boolean> { return this._validObservable; }
    get valid() : boolean { return this._validSubject.getValue(); }
    set valid(valid : boolean) { this._validSubject.next(valid); }

    // change observable is usefull in the case of composed selections (eg Paramater/Channel/Component)
    get changeObservable() : Rx.Observable<void> { return this._changeObservable; }

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

export class FileUtils extends NativeClass {

    // playing around with rx but seems quite a bit of trouble and promises make sense here...
    // http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#static-method-bindNodeCallback
    // static readFileAsObservable = Rx.Observable.bindNodeCallback(fs.readFile);

    static readFile(path : string, options : any = null) : Q.Promise<string> {
        if (options === null) options = {};
        return Q.Promise<string>((resolve, reject, notify) => {
            fs.readFile(path, options, (err, data) => {
                if (err) return reject(err);
                return resolve(data);
            })
        });
    }

    static readJSONFile(path : string, options : any = null) : Q.Promise<any> {
        if (options === null) options = {};
        return this.readFile(path, options).then(data => {
            return JSON.parse(data);
        })
    }

}