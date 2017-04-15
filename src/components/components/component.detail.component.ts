
import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, OnDestroy, Input
} from '@angular/core';

import {
    ComponentController, ChannelController, ComponentInfo, ChannelInfo,
    ParameterInfo
} from "../../sonosthesia/lib/component";


@Component({
    selector: 'component-detail',
    templateUrl: 'component.detail.html'
})
export class ComponentDetailComponent implements OnInit {

    readonly tag = 'ComponentDetailComponent';

    // https://angular.io/docs/ts/latest/cookbook/component-communication.html
    @Input()
    componentController : ComponentController;

    // components can update their channels on the fly (by sending a new component description message)
    // using an observable allows to react to changes easily

    channelControllers : Rx.Observable<ChannelController[]>;
    componentIdentifier : Rx.Observable<string>;

    ngOnInit() {
        this.channelControllers = this.componentController.channelControllersObservable;
        this.componentIdentifier = this.componentController.infoObservable.map((info : ComponentInfo) => {
           return info.identifier;
        });
    }

}

@Component({
    selector: 'channel-detail',
    templateUrl: 'channel.detail.html'
})
export class ChannelDetailComponent implements OnInit, OnDestroy {

    readonly tag = 'ChannelDetailComponent';

    // https://angular.io/docs/ts/latest/cookbook/component-communication.html
    @Input()
    set channelController(channelController : ChannelController) {
        this._channelController = channelController;
        this.linkChannelController(this.channelController);
    }
    get channelController() : ChannelController { return this._channelController; }

    channelInfo : ChannelInfo;

    private _channelController : ChannelController;

    ngOnInit() {
        this.linkChannelController(this.channelController);
    }

    ngOnDestroy() {
        this.linkChannelController(null);
    }

    private linkChannelController(channelController : ChannelController) {
        this.channelInfo = null;
        if (channelController) {
            this.channelController.infoObservable.subscribe((info : ChannelInfo) => {
                this.channelInfo = info;
            });
        }
    }
}

@Component({
    selector: 'parameter-detail',
    templateUrl: 'parameter.detail.html'
})
export class ParameterDetailComponent {

    readonly tag = 'ParameterDetailComponent';

    @Input()
    parameterInfo : ParameterInfo;

}