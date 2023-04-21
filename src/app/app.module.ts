import { NgModule } from '@angular/core';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent, SafePipe } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoaderPage } from './modals/loader/loader.page';

import { IonicGestureConfig } from './classes/IonicGestureConfig';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import * as Hammer from 'hammerjs';

import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
// import { InAppPurchase2 } from '@awesome-cordova-plugins/in-app-purchase-2/ngx'

import { SuperTabsModule } from '@ionic-super-tabs/angular';
import { ProvidersPopoverComponent } from './components/providers-popover/providers-popover.component';
import { EmbedsPopoverComponent } from './components/embeds-popover/embeds-popover.component';
import { FormsModule } from '@angular/forms';
import { VideosPopoverComponent } from './components/videos-popover/videos-popover.component';

import { LazyLoadImageModule } from 'ng-lazyload-image';

import { HttpClientModule } from '@angular/common/http';

import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';

export class CustomHammerConfig extends HammerGestureConfig {
  overrides = {
    'swipe': {
      direction: Hammer.DIRECTION_ALL
    }
  }
}

var originalSetItem = sessionStorage.setItem; 
sessionStorage.setItem = function () {
    const event = new Event('itemInserted');
    originalSetItem.apply(this, arguments);
    document.dispatchEvent(event);
}

//abajo en declarations elimine SafePipe

@NgModule({
  declarations: [AppComponent, LoaderPage, ProvidersPopoverComponent, EmbedsPopoverComponent, VideosPopoverComponent],
  entryComponents: [LoaderPage],
  imports: [BrowserModule, IonicModule.forRoot(
    {
      rippleEffect: true,
      mode: 'md'
    }
  ), AppRoutingModule, HammerModule, SuperTabsModule.forRoot() , FormsModule, LazyLoadImageModule, 
  HttpClientModule],
  providers: [
    ScreenOrientation,
    HTTP,
    File,
    InAppBrowser,
    // InAppPurchase2,
    { 
      provide: RouteReuseStrategy, 
      useClass: IonicRouteStrategy 
    },
    { provide: HAMMER_GESTURE_CONFIG, useClass: IonicGestureConfig }
    
  ],
  bootstrap: [AppComponent],
})


export class AppModule {}
