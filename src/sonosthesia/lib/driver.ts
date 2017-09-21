
import * as Rx from 'rxjs/Rx';

import {NativeClass, ListManager, FloatSettingGroup} from "./core";

export enum DriverState {
    IDLE,
    RUNNING
}

export interface IDriver {
    stateObservable : Rx.Observable<DriverState>;
    start();
    stop();
    teardown();
}

export class DriverManager extends ListManager<IDriver> {

    onRemove(driver : IDriver) {
        driver.teardown();
    }
}


export class PeriodicDriver extends NativeClass implements IDriver {

    private _startTime : number;
    private _subscription : Rx.Subscription;
    private _stateSubject = new Rx.BehaviorSubject<DriverState>(DriverState.IDLE);
    private _stateObservable = this._stateSubject.asObservable();
    private _cycles = 0;
    private _settings : FloatSettingGroup;

    constructor() {
        super();
        this._settings = new FloatSettingGroup([{
            key : "period",
            minValue: 1,
            maxValue: 10000,
            defaultValue: 1000
        }]);
    }

    get settings() : FloatSettingGroup { return this._settings; }

    get stateObservable() : Rx.Observable<DriverState> { return this._stateObservable; }

    start() {
        if (this._subscription) this._subscription.unsubscribe();
        console.log(this.tag + ' starting generator with period ' + this.settings.setting('period') + ' ms');
        this._startTime = Date.now();
        this._subscription = Rx.Observable.interval(this.settings.setting('period')).subscribe((index : number) => {
            const elapsed = Date.now() - this._startTime;
            this._cycles++;
            //console.log(this.tag + ' generate with elapsed: ' + elapsed + ', cycles: ' + this._cycles);
            this.drive(elapsed, this._cycles);
        });
        this._stateSubject.next(DriverState.RUNNING);
    }

    stop() {
        if (this._subscription) {
            this._subscription.unsubscribe();
            this._subscription = null;
        }
        this._stateSubject.next(DriverState.IDLE);
    }

    // abstract method
    protected drive(time : number, cycles : number)  { }

    teardown() {
        console.log(this.tag + ' teardown');
        this.stop();
    }
}