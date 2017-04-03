
// --------------------------- ANGULAR -----------------------------

import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes }  from '@angular/router';
import { FormsModule } from '@angular/forms';

// --------------------------- EXTERNAL -----------------------------

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgPipesModule } from 'ngx-pipes';

// --------------------------- SONOSTHESIA -----------------------------

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

// generator sub components

import { RootGeneratorsComponent } from './components/generators/root.generators.component';
import { GeneratorDetailComponent } from './components/generators/generator.detail.component';

// settings sub components

import { RootMappingsComponent } from './components/mappings/root.mappings.component';

// component sub components

import { RootComponentsComponent } from './components/components/root.components.component';
import {
    ComponentDetailComponent, ChannelDetailComponent, ParameterDetailComponent
} from './components/components/component.detail.component';
import {
    ComponentSelectionComponent, ChannelSelectionComponent, ParameterSelectionComponent
} from './components/components/component.selector.component';

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

// need the forms module for ngModel
// http://jsconfig.com/solution-cant-bind-ngmodel-since-isnt-known-property-input/


@NgModule({
    imports: [
        NgPipesModule,
        BrowserModule,
        FormsModule,
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
        GeneratorDetailComponent,

        // sonosthesia mappings
        RootMappingsComponent,

        // sonosthesia components
        RootComponentsComponent,
        ComponentDetailComponent,
        ChannelDetailComponent,
        ParameterDetailComponent,
        ComponentSelectionComponent,
        ChannelSelectionComponent,
        ParameterSelectionComponent

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