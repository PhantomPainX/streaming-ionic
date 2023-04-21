import { Component, Input, OnInit } from '@angular/core';
import { AlertController, Platform, PopoverController } from '@ionic/angular';
import { MysqlDatabaseService } from 'src/app/services/mysql-database.service';
import { PreferencesService } from 'src/app/services/preferences/preferences.service';
import { AnimefenixService } from 'src/app/services/providers/animefenix/animefenix.service';
import { AnimeflvService } from 'src/app/services/providers/animeflv/animeflv.service';
import { AnimeuiService } from 'src/app/services/providers/animeui/animeui.service';
import { environment } from 'src/environments/environment.prod';
import { EmbedsPopoverComponent } from '../embeds-popover/embeds-popover.component';

@Component({
  selector: 'app-providers-popover',
  templateUrl: './providers-popover.component.html',
  styleUrls: ['./providers-popover.component.scss'],
})
export class ProvidersPopoverComponent implements OnInit {

  @Input() download: boolean;
  @Input() episode: any;
  private isLogged: boolean = false;
  private domain: string = environment.root_url;

  // Providers

  private aditionalProviders: boolean = true;

  //AnimeMac
  private animemacAvailable: boolean = false;
  private fetchingAnimemac: boolean = true;
  private animemacEmbeds: any = [];

  //AnimeUI
  private animeuiAvailable: boolean = false;
  private fetchingAnimeui: boolean = true;
  private animeuiEmbeds: any = [];

  // AnimeFenix
  private animefenixAvailable: boolean = false;
  private fetchingAnimefenix: boolean = true;
  private animefenixEmbeds: any = [];

  // AnimeFLV
  private animeflvAvailable: boolean = false;
  private fetchingAnimeflv: boolean = true;
  private animeflvEmbeds: any = [];

  constructor(private database: MysqlDatabaseService, private popoverCtrl: PopoverController, private alertCtrl: AlertController, 
    private animeui: AnimeuiService, private localStorage: PreferencesService, private platform: Platform, 
    private animefenix: AnimefenixService, private animeflv: AnimeflvService) { }

  ngOnInit() {

    console.log(this.download);

    if (!this.episode.anime.imagen.includes(this.domain)) {
      this.episode.anime.imagen = this.domain + this.episode.anime.imagen;
    }

    this.platform.ready().then(async () => {
      this.isLogged = await this.localStorage.getLogged();
      const settings = await this.localStorage.getSettings();
      this.aditionalProviders = settings.aditionalProviders;

      this.getAnimeMacEmbeds();
    
      if (this.aditionalProviders) {
        this.getAnimeUiEmbeds();
        this.getAnimefenixEmbeds();
        this.getAnimeflvEmbeds();
      }
    });
  }

  async openEmbedsPopover(event, provider) {

    if (!this.isLogged) {
      const alert = await this.alertCtrl.create({
        header: 'Acceso Restringido',
        message: 'Para poder ver los videos debes iniciar sesión',
        mode: 'ios',
        translucent: true,
        buttons: [
          {
            text: 'Aceptar',
            role: 'cancel'
          }
        ]
      });
      await alert.present();
      return;
    }

    if (provider == "animemac") {
      var componentProps = {
        download: this.download,
        episode: this.episode,
        embeds: this.animemacEmbeds,
        providerName: 'AnimeMac'
      }
    } else if (provider == "animeui") {
      var componentProps = {
        download: this.download,
        episode: this.episode,
        embeds: this.animeuiEmbeds,
        providerName: 'AnimeUI'
      }
    } else if (provider == "animefenix") {
      var componentProps = {
        download: this.download,
        episode: this.episode,
        embeds: this.animefenixEmbeds,
        providerName: 'AnimeFenix'
      }
    }  else if (provider == "animeflv") {
      var componentProps = {
        download: this.download,
        episode: this.episode,
        embeds: this.animeflvEmbeds,
        providerName: 'AnimeFLV'
      }
    }

    const popover = await this.popoverCtrl.create({
      component: EmbedsPopoverComponent,
      cssClass: "custom-popover",
      event: event,
      componentProps: componentProps
    });
    await popover.present();
    await popover.onDidDismiss().then(async (data) => {
      if (data.data) {
        if (data.data.openedVideo) {
          this.popoverCtrl.dismiss();
        }
      }
    });
  }

  async getAnimeMacEmbeds() {
    await this.database.getEpisodeDetail(this.episode).then(async data => {
      this.fetchingAnimemac = false;
      if (data.length > 0) {
        this.animemacAvailable = true;
        this.animemacEmbeds = data;
      }
    }).catch(async error => {
      this.fetchingAnimemac = false;
      console.log(error);
    });

  }

  getAnimeUiEmbeds() {
    this.animeui.getEmbeds(this.episode.anime.nombre, this.episode.numero).then(async (embeds: any) => {
      this.fetchingAnimeui = false;
      if (embeds.length > 0) {
        this.animeuiAvailable = true;
        this.animeuiEmbeds = embeds;
      }
    }).catch(async error => {
      this.fetchingAnimeui = false;
      console.log(error);
    });
  }

  getAnimefenixEmbeds() {
    this.animefenix.getEmbeds(this.episode).then(async (embeds: any) => {
      this.fetchingAnimefenix = false;
      if (embeds.length > 0) {
        this.animefenixAvailable = true;
        this.animefenixEmbeds = embeds;
      }
    }).catch(async error => {
      this.fetchingAnimefenix = false;
      console.log(error);
    });
  }

  getAnimeflvEmbeds() {
    this.animeflv.getEmbeds(this.episode.anime.nombre, this.episode.numero).then(async (embeds: any) => {
      this.fetchingAnimeflv = false;
      if (embeds.length > 0) {
        this.animeflvAvailable = true;
        this.animeflvEmbeds = embeds;
      }
    }).catch(async error => {
      this.fetchingAnimeflv = false;
      console.log(error);
      console.log("no hay embeds de animeflv")
    });
  }

  dismiss() {
    this.popoverCtrl.dismiss();
  }

}
