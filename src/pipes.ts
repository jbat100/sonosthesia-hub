import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'titleCase'})
export class TitleCasePipe implements PipeTransform {
    public transform(input:string): string{
        if (!input) {
            return '';
        } else {
            return input.replace(/\w\S*/g, (txt => txt[0].toUpperCase() + txt.substr(1).toLowerCase() ));
        }
    }

}

// http://stackoverflow.com/questions/35750059/select-based-on-enum-in-angular2/35750252#35750252

@Pipe({name: 'enumkeys'})
export class EnumKeysPipe implements PipeTransform {
    transform(value, args:string[]) : any {
        let keys = [];
        for (const enumMember in value) {
            if (!isNaN(parseInt(enumMember, 10))) {
                keys.push({key: enumMember, value: value[enumMember]});
            }
        }
        return keys;
    }
}