
const _ = require('underscore');

/**
 *
 */
class NativeClass {
    static cloneInstance(instance) {
        // seems too good to be true, but also seems to work...
        // http://codepen.io/techniq/pen/qdZeZm
        return Object.assign(Object.create(instance), instance);
    }
    static checkInstanceClass(instance, klass) {
        // seems too good to be true, but also seems to work...
        // http://codepen.io/techniq/pen/qdZeZm
        return expect(instance).to.be.instanceof(klass);
    }
    get tag() { return this.constructor.name; }
}
module.exports.NativeClass = NativeClass;

/**
 *
 */
class NativeEmitterClass extends EventEmitter {
    get tag() { return this.constructor.name; }
}
module.exports.NativeEmitterClass = NativeEmitterClass;

/**
 *  Declarable can be destroyed by new declarations or disconnections
 */
class Declarable extends NativeEmitterClass {

    static create(identifier, info) {
        const instance = new this(identifier);
        instance.update(info);
        return instance;
    }

    constructor(identifier) {
        this._identifier = identifier;
        this._live = true;
    }

    get identifier() { return this._identifier; }

    get live() { return this._live; }
    set live(value) {
        this._live = value;
        this.emit('live', value);
    }

    update(info) {
        this._info = info;
        this._applyInfo(info);
        this.emit('update');
    }

    createReference() {
        throw new Error('unimplemented');
    }

    _applyInfo(info) {

    }
}
module.exports.Declarable = Declarable;

/**
 *  References a target, target come and go reference stay wether the linked target is there or not
 */
class Reference extends NativeClass {

    static get targetClass() { return Declarable; }

    constructor(identifier) {
        this._identifier = identifier;
        this._target = null;
    }

    get identifier() { return this._identifier; }

    get target() { return this._target; }

    /**
     * Link to a target object to facilitate access (mostly make it faster)
     * @param {Object|null} target
     */
    link(target) {
        if (target && this.constructor.targetClass)
            NativeClass.checkInstanceClass(declarable, this.constructor.targetClass);
        this._target = target;
    }
}
module.exports.Reference = Reference;

/**
 * Abstract class for info (usually declared by JSON network interfaces)
 */
class Info extends NativeClass {

    static newFromJSON(obj) {
        const instance = new this(obj)
        instance.applyJSON(obj);
    }

    constructor() {
        super();
        this._identifier = null;
    }

    get identifier() { return this._identifier; }

    applyJSON(obj) {
        expect(obj).to.be.an('object');
        expect(obj.identifier).to.be.a('string');
        this._identifier = obj.identifier;
    }

    makeJSON() {
        return _.pick(this, 'identifier');
    }

}
module.exports.Info = Info;

class Selection {

    constructor() {
        this._identifier = null;
        this._valid = false;
    }

    get identifier() { return this._identifier; }

    set identifier(identifier) {
        if (identifier !== null) expect(identifier).to.be.a('string');
        this._identifier = identifier;
    }

    get valid() { return this._valid; }

    set valid(valid) {
        expect(valid).to.be.a('boolean');
        this._valid = valid;
    }

}
module.exports.Selection = Selection;

class Range extends NativeClass {

    constructor(min, max) {
        this._min = min || 0.0;
        this._max = max || 1.0;
        expect(this._min).to.be.a('number');
        expect(this._max).to.be.a('number');
        expect(this._min).to.be.at.most(this._max);
    }

    get min() { return this._min; }

    set min(min) {
        expect(min).to.be.a('number');
        expect(min).to.be.at.most(this._max);
        this._min = min;
    }

    get max() { return this._max; }

    set max(max) {
        expect(max).to.be.a('number');
        expect(this._min).to.be.at.most(max);
        this._max = max;
    }

}
module.exports.Range = Range;