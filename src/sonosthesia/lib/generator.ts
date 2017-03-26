

import * as Math from 'mathjs';
import * as Rx from 'rxjs/Rx';

import {ParameterSelection, ChannelSelection, IComponentSelectionValidator} from './component';
import {NativeClass, IMessageSender} from "./core";


export enum GeneratorState {
    IDLE,
    RUNNING
}

export class PeriodicGenerator extends NativeClass {

    private _startTime : number;
    private _subscription : Rx.Subscription;
    private _stateSubject = new Rx.BehaviorSubject<GeneratorState>(GeneratorState.IDLE);
    private _stateObservable = this._stateSubject.asObservable();
    private _cycles = 0;

    constructor(private _period : number) {
        super();
    }

    get state() : Rx.Observable<GeneratorState> { return this._stateObservable; }

    get period() : number { return this._period; }

    set period(val : number) { this._period = val; }

    start() {
        if (this._subscription) this._subscription.unsubscribe();
        this._startTime = Date.now();
        this._subscription = Rx.Observable.interval(this.period).subscribe((index : number) => {
            const elapsed = Date.now() - this._startTime;
            this._cycles++;
            this.generate(elapsed, this._cycles);
        });
        this._stateSubject.next(GeneratorState.RUNNING);
    }

    stop() {
        if (this._subscription) {
            this._subscription.unsubscribe();
            this._subscription = null;
        }
        this._stateSubject.next(GeneratorState.IDLE);
    }

    // abstract method
    protected generate(time : number, cycles : number) { }

}



export class GeneratorEngine extends NativeClass {

    public generate(time : number) : number {
        return 0.0;
    }

}

export class ConstantEngine extends NativeClass {

    constructor(public value : number) {
        super();
    }

    public generate(time : number) : number {
        return this.value;
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

export class SineEngine extends PrimitiveEngine {

    protected raw(time : number) : number {
        return Math.sin(time);
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