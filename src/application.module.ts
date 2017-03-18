
import {NgModule}      from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule, Routes}  from '@angular/router';


import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// services

import { ConfigurationService } from './services/configuration.service';
import { HubService } from './services/hub.service';

// pipes

import {TitleCasePipe} from './pipes';

// root components

import { RootComponent } from './root.component';
import { MenuComponent } from './menu.component';
import { NavigationComponent } from './navigation.component';

// settings sub components

import { RootSettingsComponent } from './components/settings/root.settings.component';

// settings sub components

import { RootGeneratorsComponent } from './components/generators/root.generators.component';

// settings sub components

import { RootMappingsComponent } from './components/mappings/root.mappings.component';

// settings sub components

import { RootComponentsComponent } from './components/components/root.components.component';
import {
    ComponentDetailComponent, ChannelDetailComponent, ParameterDetailComponent
} from './components/components/component.detail.component';

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
    },
    {
        path: 'mappings',
        component: RootMappingsComponent
    },
    {
        path: 'components',
        component: RootComponentsComponent
    }
];


@NgModule({
    imports: [
        BrowserModule,
        RouterModule.forRoot(routes),
        NgbModule.forRoot()
    ],
    declarations: [

        // pipes

        TitleCasePipe,

        // root components

        RootComponent,
        MenuComponent,
        NavigationComponent,

        // sonosthesia settings
        RootSettingsComponent,

        // sonosthesia generators
        RootGeneratorsComponent,

        // sonosthesia mappings
        RootMappingsComponent,

        // sonosthesia components
        RootComponentsComponent,
        ComponentDetailComponent,
        ChannelDetailComponent,
        ParameterDetailComponent

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