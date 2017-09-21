
import * as Rx from 'rxjs/Rx';
import * as Math from 'mathjs';

import {NativeClass, IFloatSettingDescription, IStringTMap, FloatSettingGroup} from "./core";


export interface IValueGenerator {
    settings : FloatSettingGroup;
    generate(time : number, cycles : number) : number;
}

export interface IValueGeneratorMap extends IStringTMap<IValueGenerator> { }

export enum ValueGeneratorType
{
    NONE,
    CONSTANT,
    SINE,
    SAWTOOTH,
    TRIANGLE
}


// makes things easier in angular interface...
export class ValueGeneratorContainer extends NativeClass implements  IValueGenerator
{
    private _generator : IValueGenerator = null; // keep direct ref for perf
    private _generatorSource = new Rx.BehaviorSubject<IValueGenerator>(null);
    private _generatorObservable = this._generatorSource.asObservable();

    private _generatorTypeSource = new Rx.BehaviorSubject<ValueGeneratorType>(ValueGeneratorType.NONE);
    private _generatorTypeObservable = this._generatorTypeSource.asObservable();

    constructor(_generatorType : ValueGeneratorType = ValueGeneratorType.CONSTANT) {
        super();
        this.generatorType = _generatorType;
    }

    get generatorObservable() { return this._generatorObservable; }

    get generatorTypeObservable() { return this._generatorTypeObservable; }

    get generatorType() { return this._generatorTypeSource.getValue(); }

    set generatorType(generatorType : ValueGeneratorType) {
        let generatorClass = this.getGeneratorClass(generatorType);
        if (!generatorClass)
        {
            console.error(this.tag + ' unsuported generator type ' + generatorType);
            generatorClass = ConstantGenerator;
        }
        this._generator = new generatorClass();
        this._generatorSource.next(this._generator);
        this._generatorTypeSource.next(generatorType);
    }

    get settings() : FloatSettingGroup {
        if (this._generator) return this._generator.settings;
    }

    generate(time : number, cycles : number) : number {
        if (this._generator) return this._generator.generate(time, cycles);
        return 0.0;
    }

    protected getGeneratorClass(generatorType : ValueGeneratorType) : any {
        switch(generatorType) {
            case ValueGeneratorType.CONSTANT:
                return ConstantGenerator;
            case ValueGeneratorType.SINE:
                return SineGenerator;
            case ValueGeneratorType.SAWTOOTH:
                return SawtoothGenerator;
            case ValueGeneratorType.TRIANGLE:
                return TriangleGenerator;
            default:
                return null;
        }
    }
}


export class ValueGenerator extends NativeClass implements IValueGenerator {

    private _settings : FloatSettingGroup;

    constructor() {
        super();
        // cache keys
        this._settings = new FloatSettingGroup(this.settingDescriptions);
    }

    protected static SETTING_DESCRIPTIONS = [];

    //https://stackoverflow.com/questions/29244119/how-to-access-static-members-from-instance-methods-in-typescript
    private get settingDescriptions() : IFloatSettingDescription[] {
        const generatorType = <typeof ValueGenerator>this.constructor;
        return generatorType.SETTING_DESCRIPTIONS;
    }

    get settings() : FloatSettingGroup { return this._settings; }

    generate(time : number, cycles : number) : number { return 0.0; }

}

export class ConstantGenerator extends ValueGenerator {

    public constant : number;

    protected static SETTING_DESCRIPTIONS = [
        {
            key: 'constant',
            defaultValue: 0.0,
            minValue: -100,
            maxValue: 100
        }
    ];

    generate(time : number, cycles : number) : number {
        return this.settings.setting('constant');
    }

}

export class PrimitiveGenerator extends ValueGenerator {

    protected static SETTING_DESCRIPTIONS = [
        {
            key: 'amplitude',
            defaultValue: 0.0,
            minValue: -100,
            maxValue: 100
        },
        {
            key: 'frequency',
            defaultValue: 0.0,
            minValue: 0,
            maxValue: 100
        },
        {
            key: 'offset',
            defaultValue: 0.0,
            minValue: -100,
            maxValue: 100
        }
    ];

    public generate(time : number, cycles : number) : number {
        return this.settings.setting('amplitude')
            * this.raw((this.settings.setting('frequency') * time) + this.settings.setting('offset'));
    }

    protected raw(time : number) : number { return 0.0; }

}

export class SineGenerator extends PrimitiveGenerator {

    protected raw(time : number) : number {
        return Math.sin(time);
    }
}

export class SawtoothGenerator extends PrimitiveGenerator {

    protected raw(time : number) : number {
        return time - Math.floor(time);
    }
}

export class TriangleGenerator extends PrimitiveGenerator {

    protected raw(time : number) : number {
        // https://en.wikipedia.org/wiki/Triangle_wave
        const x = Math.mod((time / 4.0), 4.0) as number;
        return Math.abs(x - 2.0) - 1.0;
    }
}
