
import {
    Component, Input, Output, EventEmitter, OnInit
} from '@angular/core';
import {IFloatSettingDescription} from "../../sonosthesia/lib/core";

@Component({
    selector: 'enum-select',
    templateUrl: 'enum.select.html'
})
export class EnumSelectComponent implements OnInit {

    readonly tag = 'EnumSelectComponent';

    @Input()
    enumType : any;

    @Input()
    initial : string;

    @Output()
    selected = new EventEmitter();

    value : string;

    ngOnInit() {
        console.log(this.tag + ' init with initial value ' + this.initial);
        this.value = this.enumType[this.initial];
    }

    onSelection(selection : string) {
        console.log(this.tag + ' selected : ' + selection);
        this.value = selection;
        this.selected.emit(this.enumType[this.value]);
    }

}



@Component({
    selector: 'float-setting',
    templateUrl: 'float.setting.html'
})
export class FloatSettingComponent {

    readonly tag = 'FloatSettingComponent';

    @Input()
    description : IFloatSettingDescription;

    @Output()
    valueChanged = new EventEmitter();

    value : number;

    onSliderChange(event) {
        console.log(this.tag + ' slider change : ' + JSON.stringify(event));
        //this.value = event;
        //this.valueChanged.emit(event);
    }

    onBoxChange(event) {
        console.log(this.tag + ' box change : ' + JSON.stringify(event));
        //this.value = event;
        //this.valueChanged.emit(event);
    }

}