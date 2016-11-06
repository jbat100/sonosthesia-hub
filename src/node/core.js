
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