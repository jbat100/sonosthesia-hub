

import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, Input
} from '@angular/core';

import {
    ValueGeneratorContainer, IValueGenerator
} from "../../sonosthesia/lib/generator";


@Component({
    selector: 'generator-container-detail',
    templateUrl: 'generator.container.detail.html'
})
export class GeneratorContainerDetailComponent implements OnInit {

    readonly tag = 'GeneratorContainerDetailComponent';

    @Input()
    generatorContainer : ValueGeneratorContainer;

    generatorObservable : Rx.Observable<IValueGenerator>;

    ngOnInit() {
        this.generatorObservable = this.generatorContainer.generatorObservable;
    }

}

@Component({
    selector: 'generator-detail',
    templateUrl: 'generator.detail.html'
})
export class GeneratorDetailComponent {

    readonly tag = 'GeneratorDetailComponent';

    @Input()
    generator : IValueGenerator;

}