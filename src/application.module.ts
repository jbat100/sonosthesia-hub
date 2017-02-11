
import {NgModule}      from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule, Routes}  from '@angular/router';


import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// main services


// mode services

// main components
import { RootComponent } from './root.component';
import { MenuComponent } from './menu.component';

const routes : Routes = [
    {
        path: '',
        redirectTo: '/menu',
        pathMatch: 'full'
    },
    {
        path: 'menu',
        component: MenuComponent
    }
];


@NgModule({
    imports: [
        BrowserModule,
        RouterModule.forRoot(routes),
        NgbModule.forRoot()
    ],
    declarations: [
        RootComponent,
        MenuComponent
    ],
    providers: [

    ],
    bootstrap: [
        RootComponent
    ]
})
export class ApplicationModule { 

    constructor()
    {

    }

}