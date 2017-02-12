
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ApplicationModule } from './application.module';

// to include sass PER COMPONENT look here
// https://github.com/AngularClass/angular2-webpack-starter/wiki/How-to-include-SCSS-in-components

import './scss/style.scss';

const platform = platformBrowserDynamic();

platform.bootstrapModule(ApplicationModule);

console.info('main');