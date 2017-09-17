

import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, Input
} from '@angular/core';

import {
    ValueGeneratorContainer, IValueGenerator, ValueGeneratorType
} from "../../sonosthesia/lib/generator";


@Component({
    selector: 'generator-container-detail',
    templateUrl: 'generator.container.detail.html'
})
export class GeneratorContainerDetailComponent implements OnInit {

    readonly tag = 'GeneratorContainerDetailComponent';

    @Input()
    label : string;

    @Input()
    generatorContainer : ValueGeneratorContainer;

    generatorObservable : Rx.Observable<IValueGenerator>;

    generatorTypeEnumType = ValueGeneratorType;

    ngOnInit() {
        if (this.generatorContainer) {
            console.log(this.tag + ' ngOnInit type ' + this.generatorContainer.generatorType);
            this.generatorObservable = this.generatorContainer.generatorObservable;
        } else {
            console.warn(this.tag + ' ngOnInit without generatorContainer');
        }
    }

    onSelectedGeneratorType(type : ValueGeneratorType) {
        event.preventDefault();
        console.log(this.tag + ' selected generator type ' + type);
        this.generatorContainer.generatorType = type;
    }

}

@Component({
    selector: 'generator-detail',
    templateUrl: 'generator.detail.html'
})
export class GeneratorDetailComponent implements OnInit {

    readonly tag = 'GeneratorDetailComponent';

    @Input()
    generator : IValueGenerator;

    ngOnInit() {
        if (this.generator) {
            console.log(this.tag + ' ngOnInit ' + this.generator +
                ' settings : ' + JSON.stringify(this.generator.settingDescriptions));
        } else {
            console.warn(this.tag + ' ngOnInit without generator');
        }
    }

}