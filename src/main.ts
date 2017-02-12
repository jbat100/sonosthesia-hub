
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ApplicationModule } from './application.module';

// to include sass PER COMPONENT look here
// https://github.com/AngularClass/angular2-webpack-starter/wiki/How-to-include-SCSS-in-components

import 'bootstrap/dist/css/bootstrap.css';

// not using photonkit as it looks really shitty on windows
//import 'photonkit/dist/css/photon.css';

import './scss/style.scss';

const platform = platformBrowserDynamic();

platform.bootstrapModule(ApplicationModule);

console.info('main');