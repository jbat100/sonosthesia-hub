

import { Injectable } from '@angular/core';
import { Router } from "@angular/router";

@Injectable()
export class NavigationService {

    readonly tag = 'NavigationService';

    // note Router cannot be injected into a service
    // http://stackoverflow.com/questions/30998070/angular2-router-in-service

    navigate(target : string, router : Router) {
        console.info(this.tag + ' navigation switching with target ' + target);
        const path : string = '/' + target;
        console.info(this.tag + ' navigating to path ' + path);
        router.navigate([path]).then(() => {
            console.info(this.tag + ' navigation done');
        });
    }


}
