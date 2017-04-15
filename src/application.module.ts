
// --------------------------- ANGULAR -----------------------------

import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes }  from '@angular/router';
import { FormsModule } from '@angular/forms';

// --------------------------- EXTERNAL -----------------------------

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgPipesModule } from 'ngx-pipes';
import { SelectModule } from 'ng2-select';

// --------------------------- SONOSTHESIA -----------------------------

// services

import { ConfigurationService } from './services/configuration.service';
import { HubService } from './services/hub.service';
import { NavigationService } from "./services/navigation.service";
import { ParameterOperatorService } from "./services/operator.service";

// pipes

import {TitleCasePipe} from './pipes';

// root components

import { RootComponent } from './root.component';
import { MenuComponent } from './menu.component';
import {
    TabNavigationComponent, ButtonNavigationComponent
} from './components/navigation/navigation.component';



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


import {
    ChannelMappingComponent, ParameterMappingComponent
} from "./components/mappings/mapping.detail.component";
import {ParameterOperatorComponent} from "./components/processing/parameter.operator.component";


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
        SelectModule,
        BrowserModule,
        FormsModule,
        RouterModule.forRoot(routes),
        NgbModule.forRoot()
    ],
    declarations: [
        // pipes --------------------------------------
        TitleCasePipe,
        // root components ----------------------------
        RootComponent,
        MenuComponent,
        TabNavigationComponent,
        ButtonNavigationComponent,
        // sonosthesia settings -----------------------
        RootSettingsComponent,
        // sonosthesia generators ---------------------
        RootGeneratorsComponent,
        GeneratorDetailComponent,
        // sonosthesia mappings -----------------------
        RootMappingsComponent,
        ChannelMappingComponent,
        ParameterMappingComponent,
        ParameterOperatorComponent,
        // sonosthesia components ---------------------
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
        HubService,
        NavigationService,
        ParameterOperatorService
    ],
    bootstrap: [
        RootComponent
    ]
})
export class ApplicationModule { 

    constructor() { }

}