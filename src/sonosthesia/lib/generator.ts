

import * as Math from 'mathjs';
import * as Rx from 'rxjs/Rx';

import {ParameterSelection} from './component';
import {NativeClass} from "./core";


export class ParameterGenerator extends NativeClass {

    private _startTime : number;
    private _started : boolean;
    private _subscription : Rx.Subscription;

    private _valueSubject : Rx.Subject<number>;
    private _valueObservable = this._valueSubject.asObservable();

    constructor(private _parameterSelection : ParameterSelection, private _engine : GeneratorEngine, private _period : number) {
        super();
    }

    get valueObservable() : Rx.Observable<number> { return this._valueObservable; }

    get period() : number { return this._period; }

    set period(val : number) { this._period = val; }

    get engine() : GeneratorEngine { return this._engine; }

    set engine(val : GeneratorEngine) { this._engine = val; }

    start() {
        if (this._subscription) this._subscription.unsubscribe();
        this._startTime = Date.now();
        this._subscription = Rx.Observable.interval(this.period).subscribe((index : number) => {
            const elapsed = Date.now() - this._startTime;
            this._valueSubject.next(this._engine.generate(elapsed));
        });
    }

    stop() {
        if (this._subscription) {
            this._subscription.unsubscribe();
            this._subscription = null;
        }
    }

}

export class GeneratorEngine extends NativeClass {

    public generate(time : number) : number {
        return 0.0;
    }

}

export class PrimitiveEngine extends GeneratorEngine {

    constructor(public amplitude : number, public frequency : number, public offset : number) {
        super();
    }

    public generate(time : number) : number {
        return this.amplitude * this.raw((this.frequency * time) + this.offset);
    }

    protected raw(time : number) : number {
        return 0.0;
    }

}

export class SawtoothEngine extends PrimitiveEngine {

    protected raw(time : number) : number {
        return time - Math.floor(time);
    }
}

export class TriangleEngine extends PrimitiveEngine {

    protected raw(time : number) : number {
        // https://en.wikipedia.org/wiki/Triangle_wave
        const x = Math.mod((time / 4.0), 4.0) as number;
        return Math.abs(x - 2.0) - 1.0;
    }
}