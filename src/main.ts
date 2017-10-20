
import { enableProdMode } from '@angular/core';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ApplicationModule } from './application.module';
import { environment } from 'environments';

// to include sass PER COMPONENT look here
// https://github.com/AngularClass/angular2-webpack-starter/wiki/How-to-include-SCSS-in-components

import 'bootstrap/dist/css/bootstrap.css';
import 'nouislider/distribute/nouislider.min.css';

import './scss/style.scss';

if (environment.production) {
    enableProdMode();
}

const platform = platformBrowserDynamic();

platform.bootstrapModule(ApplicationModule);

console.info('main');




