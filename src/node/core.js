
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

    constructor(identifier, info) {
        this._identifier = identifier;
        this._valid = true;
        this.update(info);
    }

    get identifier() { return this._identifier; }

    get valid() { return this._valid; }
    set valid(value) {
        this._valid = value;
        this.emit('valid', value);
    }

    update(info) {
        this._info = info;
        this._applyInfo(info);
        this.emit('update');
    }

    _applyInfo(info) {

    }
}