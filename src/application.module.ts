
import {NgModule}      from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule, Routes}  from '@angular/router';


import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// main services

import { ConfigurationService } from './services/configuration.service';
import { HubService } from './services/hub.service';

// root components

import { RootComponent } from './root.component';
import { MenuComponent } from './menu.component';
import { NavigationComponent } from './navigation.component';

// sub-root components, loaded by navigation

import { RootSettingsComponent } from './components/settings/root.settings.component';
import { RootGeneratorsComponent } from './components/generators/root.generators.component';

const routes : Routes = [
    {
        path: '',
        redirectTo: '/settings',
        pathMatch: 'full'
    },
    {
        path: 'settings',
        component: RootSettingsComponent
    },
    {
        path: 'generators',
        component: RootGeneratorsComponent
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
        MenuComponent,
        NavigationComponent,

        RootSettingsComponent,
        RootGeneratorsComponent

    ],
    providers: [

        ConfigurationService,
        HubService

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