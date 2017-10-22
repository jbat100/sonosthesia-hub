
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {RootSettingsComponent} from "../components/settings/root.settings.component";
import {RootDriversComponent} from "../components/drivers/root.drivers.component";
import {RootMappingsComponent} from "../components/mappings/root.mappings.component";
import {RootComponentsComponent} from "../components/components/root.components.component";



const routes : Routes = [
  /*
  {
    path: '',
    //component: HomeComponent
    component: TestComponent
  },
  */
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
    path: 'drivers',
    component: RootDriversComponent
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
    imports: [RouterModule.forRoot(routes, {useHash: true})],
    exports: [RouterModule]
})
export class AppRoutingModule { }
