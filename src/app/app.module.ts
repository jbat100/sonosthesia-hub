import 'zone.js/dist/zone-mix';
import 'reflect-metadata';
import 'polyfills';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// --------------------------- EXTERNAL -----------------------------

import { NgPipesModule } from 'ngx-pipes';
import { NouisliderModule } from 'ng2-nouislider';
import { NouisliderComponent } from 'ng2-nouislider';

// --------------------------- SONOSTHESIA -----------------------------

// services

import { ElectronService } from '../services/electron.service';
import { ConfigurationService } from '../services/configuration.service';
import { HubService } from '../services/hub.service';
import { NavigationService } from "../services/navigation.service";
import { ParameterOperatorService } from "../services/operator.service";

// pipes

import {TitleCasePipe, EnumKeysPipe} from './pipes';

// root components

import { RootComponent } from './root.component';
import { MenuComponent } from './menu.component';
import {
    TabNavigationComponent, ButtonNavigationComponent
} from '../components/navigation/navigation.component';



// settings sub components

import { RootSettingsComponent } from '../components/settings/root.settings.component';

// driver sub components

import { RootDriversComponent } from '../components/drivers/root.drivers.component';
import { DriverDetailComponent } from '../components/drivers/driver.detail.component';
import {
    GeneratorDetailComponent, GeneratorContainerDetailComponent
} from '../components/drivers/generator.detail.component';

// settings sub components

import { RootMappingsComponent } from '../components/mappings/root.mappings.component';

// component sub components

import { RootComponentsComponent } from '../components/components/root.components.component';

import {
    ComponentDetailComponent, ChannelDetailComponent, ParameterDetailComponent
} from '../components/components/component.detail.component';

import {
    ComponentSelectionComponent, ChannelSelectionComponent, ParameterSelectionComponent
} from '../components/components/component.selector.component';

// mapping sub components

import {
    ChannelMappingComponent, ParameterMappingComponent
} from "../components/mappings/mapping.detail.component";

import {
    ParameterOperatorContainerComponent, ScaleValueOperatorComponent, OffsetValueOperatorComponent
} from "../components/processing/parameter.operator.component";

import {
    EnumSelectComponent, FloatSettingGroupComponent
} from "../components/common/common.component";

@NgModule({
    declarations: [

        // external------------------------------------
        NouisliderComponent,

        // demo ---------------------------------------
        AppComponent,

        // pipes --------------------------------------
        TitleCasePipe,
        EnumKeysPipe,
        // common components --------------------------
        EnumSelectComponent,
        FloatSettingGroupComponent,
        // root components ----------------------------
        RootComponent,
        MenuComponent,
        TabNavigationComponent,
        ButtonNavigationComponent,
        // sonosthesia settings -----------------------
        RootSettingsComponent,
        // sonosthesia drivers ---------------------
        RootDriversComponent,
        DriverDetailComponent,
        GeneratorContainerDetailComponent,
        GeneratorDetailComponent,
        // sonosthesia mappings -----------------------
        RootMappingsComponent,
        ChannelMappingComponent,
        ParameterMappingComponent,
        ParameterOperatorContainerComponent,
        ScaleValueOperatorComponent,
        OffsetValueOperatorComponent,
        // sonosthesia components ---------------------
        RootComponentsComponent,
        ComponentDetailComponent,
        ChannelDetailComponent,
        ParameterDetailComponent,
        ComponentSelectionComponent,
        ChannelSelectionComponent,
        ParameterSelectionComponent


    ],
    imports: [
        NgbModule.forRoot(),
        BrowserModule,
        FormsModule,
        HttpModule,
        AppRoutingModule,
        NgPipesModule,
        //NouisliderModule
    ],
    providers: [
        ElectronService,
        ConfigurationService,
        HubService,
        NavigationService,
        ParameterOperatorService],
    bootstrap: [AppComponent]
})
export class AppModule {

    constructor(private _hubService : HubService) {
        _hubService.init();
    }

}
