
import {
    Component, Input, Output, EventEmitter, OnInit
} from '@angular/core';

import {
    FloatSettingGroup
} from "../../sonosthesia/lib/core";


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
    selector: 'float-setting-group',
    templateUrl: 'float.setting.group.html'
})
export class FloatSettingGroupComponent implements OnInit  {

    readonly tag = 'FloatSettingGroupComponent';

    @Input()
    settingGroup : FloatSettingGroup;

    ngOnInit() {
        console.log(this.tag + ' init with settingGroup with descriptions ' +
            JSON.stringify(this.settingGroup.descriptions));
    }

}