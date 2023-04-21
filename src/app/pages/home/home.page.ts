import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActionSheetController, AlertController, IonInfiniteScroll, MenuController, ModalController, NavController, Platform, PopoverController } from '@ionic/angular';
import { MysqlDatabaseService } from 'src/app/services/mysql-database.service';
import { EpisodePage } from '../episode/episode.page';
import { UtilsService } from 'src/app/services/utils.service';
import { ActivatedRoute, NavigationExtras } from '@angular/router';
import { CommentPage } from 'src/app/modals/comment/comment.page';
import { PreferencesService } from 'src/app/services/preferences/preferences.service';
import { PrivateUser } from 'src/app/classes/private-user/private-user';
import { Subscription } from 'rxjs';
import { ResolversService } from 'src/app/services/resolvers/resolvers.service';
import { ProvidersPopoverComponent } from 'src/app/components/providers-popover/providers-popover.component';
import { AnimeflvService } from 'src/app/services/providers/animeflv/animeflv.service';
import { environment } from 'src/environments/environment.prod';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  @ViewChild("episodesInfiniteScroll") episodesInfiniteScroll: IonInfiniteScroll;
  @ViewChild("animesInfiniteScroll") animesInfiniteScroll: IonInfiniteScroll;
  @ViewChild('toolbar', { read: ElementRef }) toolbar: ElementRef;

  private latestEpisodes: any;
  private latestAnimes: any;
  private latestLatino: any;
  private latestSeries: any;
  private inBroadcast: any;
  private nextToSee: any = undefined;
  private domain: string = environment.root_url;

  private isLogged: boolean = false;
  private user: PrivateUser;
  private token: string = "";
  private animeSliderOptions: any;
  private episodeSliderOptions: any;
  private nextToSeeSliderOpts: any;
  private chipsOptions: any;

  private profileImage: string = "";

  private nextToSeeListener: any;
  private fetchingNextToSee: boolean = false;

  private func = () => {
    this.zone.run(() => {
      this.obtainNextToSee();
    });
  }


  // Subscriptions
  private routerSubscription: Subscription;

  constructor(private database: MysqlDatabaseService,
    private navCtrl: NavController,
    private popoverCtrl: PopoverController,
    private platform: Platform,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private utils: UtilsService,
    private localStorage: PreferencesService,
    private route: ActivatedRoute,
    private menu: MenuController,
    private zone: NgZone,
    private iab: InAppBrowser,
    private resolvers: ResolversService,
    private animeflv: AnimeflvService) {

    this.chipsOptions = {
      slidesPerView: 3,
      spaceBetween: 2,
      freeMode: true
    }

    this.animeSliderOptions = {
      initialSlide: 0,
      slidesPerView: 1.1,
      spaceBetween: 10,
      autoHeight: true,
      autoplay: {
        disableOnInteraction: false,
        delay: 6000
      },
      speed: 600,
      //responsive
      breakpoints: {
        700: {
          slidesPerView: 1.7,
          spaceBetween: 10,
        },
        1024: {
          slidesPerView: 3.1,
          spaceBetween: 10,
        },
      }

    };

    this.episodeSliderOptions = {
      initialSlide: 0,
      slidesPerView: 2.2,
      spaceBetween: 10
    };

    this.nextToSeeSliderOpts = {
      initialSlide: 0,
      slidesPerView: 1.3,
      spaceBetween: 10,
      autoHeight: true,
      speed: 600,
      //responsive
      breakpoints: {
        700: {
          slidesPerView: 2.3,
          spaceBetween: 10,
        },
        1024: {
          slidesPerView: 3.3,
          spaceBetween: 10,
        },
      }

    };

  }

  ngOnInit() {

    this.platform.ready().then(async () => {


      this.utils.resetStatusBarColorOfToolbar();

      this.isLogged = await this.localStorage.getLogged();

      if (this.isLogged) {
        this.user = await this.localStorage.getUser();
        this.token = this.user.token;
        this.profileImage = this.fixImage(this.user.user_extra.avatar);
        this.obtainNextToSee();
        document.addEventListener('itemInserted', this.func, false);
      }

      this.obtainInBroadcast();
      this.obtainLatestAnimes();
      this.obtainLatestLatino();
      this.obtainLatestSeries();
      this.obtainLatestEpisodes();

      this.routerSubscription = this.route.queryParams.subscribe(async () => {
        this.isLogged = await this.localStorage.getLogged();
        if (this.isLogged) {

          const oldImage = this.fixImage(this.profileImage);
          const temp_user = await this.localStorage.getUser();
          const newImage = this.fixImage(temp_user.user_extra.avatar);

          if (oldImage != newImage) {
            this.user = await this.localStorage.getUser();
            this.profileImage = this.fixImage(this.user.user_extra.avatar);
          }
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }

    if (this.nextToSee != undefined) {
      document.removeEventListener('itemInserted', this.func, false);
    }
  }

  fixImage(url: string) {
    if (!url.includes(this.domain)) {
      url = this.domain + "/" + url;
    }
    return url;
  }

  async obtainNextToSee() {
    if (this.fetchingNextToSee) {
      return;
    } else {
      this.fetchingNextToSee = true;
      await this.database.getNextToSee(this.user.token).then(async data => {
        if (data.episodes) {
          let dataClean = data.episodes.filter(episode => episode.id != undefined);
          if (dataClean.length == 0) {
            this.nextToSee = undefined;
            this.fetchingNextToSee = false;
            return;
          }

          dataClean = dataClean.filter((episode, index, self) =>
            index === self.findIndex((t) => (
              t.id === episode.id
            )));
          
          if (dataClean.length == 0) {
            this.nextToSee = undefined;
            this.fetchingNextToSee = false;
            return;
          }

          for (let d of dataClean) {
            await this.utils.getMainColorFromRemoteImg(d.anime.imagen).then(color => {
              d.color = color;
            });
          }
  
          this.nextToSee = dataClean;
          this.fetchingNextToSee = false;
        } else {
          this.nextToSee = undefined;
          this.fetchingNextToSee = false;
        }
      });
    }
  }

  async obtainLatestEpisodes() {
    this.latestEpisodes = undefined;
    await this.database.getLatestEpisodes(1, this.token).then(data => {
      this.latestEpisodes = data.results.slice(0, 10);
    });
  }

  async obtainLatestAnimes() {
    this.latestAnimes = undefined;
    await this.database.getAnimes(1, "-agregado", false, this.token).then(data => {
      this.latestAnimes = data.results.slice(0, 12);

    });
  }

  async obtainLatestLatino() {
    this.latestLatino = undefined;
    await this.database.getLatino(1, "-agregado", false, this.token).then(data => {
      this.latestLatino = data.results.slice(0, 16);

    });
  }

  async obtainLatestSeries() {
    this.latestSeries = undefined;
    await this.database.getSeries(1, "-agregado", false, this.token).then(data => {
      this.latestSeries = data.results.slice(0, 16);
    });
  }

  async obtainInBroadcast() {
    this.inBroadcast = undefined;
    await this.database.getInBroadcast(1, "-agregado", false, this.token).then(data => {
      this.inBroadcast = data.results.slice(0, 5);
    });
  }

  async goToAnimeDetail(anime: any) {
    this.navCtrl.navigateForward('/detail/'+anime.id, { animated: true, animationDirection: 'forward' });
  }

  async openProviders(event, episode) {

    if (!episode.anime.imagen.includes(this.domain)) {
      episode.anime.imagen = this.domain + episode.anime.imagen;
    }
    const popover = await this.popoverCtrl.create({
      component: ProvidersPopoverComponent,
      event: event,
      cssClass: "custom-popover",
      componentProps: {
        episode: episode,
      }
    });

    await popover.present();
  }

  async openOptions() {

    var buttons = [];

    if (this.isLogged) {
      this.navCtrl.navigateForward('/profile', { animated: true, animationDirection: 'forward' })
    } else {
      buttons = [
        {
          text: 'Iniciar sesión',
          icon: 'log-in',
          handler: () => {
            let navigationExtras: NavigationExtras = {
              queryParams: {
                openedByOtherPage: true
              }
            };
            this.navCtrl.navigateRoot('/signin', navigationExtras);
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ];

      const actionSheet = await this.actionSheetCtrl.create({
        header: 'Opciones',
        buttons: buttons,
        mode: 'ios'
      });
      await actionSheet.present();
    }

  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        }, {
          text: 'Si',
          handler: () => {
            if (this.nextToSee != undefined) {
              document.removeEventListener('itemInserted', this.obtainNextToSee, false);
            }
            this.database.purgeSession();
            this.navCtrl.navigateRoot('/welcome', { animated: true, animationDirection: 'back', replaceUrl: true });
          }
        }
      ]
    });
    await alert.present();
  }


  // Opciones Extras

  async toggleFavorite(anime: any) {
    const loader = await this.utils.createLoaderToast("Espera un momento...", "sync");
    await loader.present();

    await this.database.toggleFavoriteAnime(this.user.token, anime.id).then((added) => {

      loader.dismiss();
      if (added) {
        this.utils.showIconToast(anime.nombre+" fue agregado a tus favoritos", "heart", 2);
      } else {
        this.utils.showIconToast(anime.nombre+" fue eliminado de tus favoritos", "trash", 2);
      }
    }).catch(() => {
      loader.dismiss();
    });
  }

  async toggleEpisode(episode: any) {
    const loader = await this.utils.createIonicLoader("Espera un momento...");
    await loader.present();

    await this.database.toggleSeenEpisode(this.user.token, episode.id).then((added) => {

      if (added) {
        this.utils.showToast("Marcado como visto", 1, true);
      } else {
        this.utils.showToast("Desmarcado como visto", 1, true);
      }
    }).catch(error => {
      console.log(error);
    });
    await loader.dismiss();
  }

  async openEpisodesModal(anime: any) {
    const modal = await this.modalCtrl.create({
      component: EpisodePage,
      cssClass: 'rounded-modal',
      canDismiss: true,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      componentProps: {
        anime: anime,
        totalEpisodes: anime.episodios.length
      }
    });
    await modal.present();
  }

  async openAnimeOptions(anime: any) {

    var buttons = [{
      text: 'Ver Detalle',
      icon: 'information-circle',
      handler: () => {
        this.goToAnimeDetail(anime);
      }
    },{
      text: 'Episodios',
      icon: 'play',
      handler: () => {
        this.openEpisodesModal(anime);
      }
    }, {
      text: 'Ver Comentarios',
      icon: 'chatbubbles',
      handler: () => {
        this.modalCtrl.create({
          component: CommentPage,
          cssClass: 'rounded-modal',
          canDismiss: true,
          breakpoints: [0, 1],
          initialBreakpoint: 1,
          componentProps: {
            anime: anime,
            commentsType: 'anime'
          }
        }).then(modal => {
          modal.present();
        });
      }
    }, {
      text: 'Cerrar',
      role: 'cancel'
    }
    ];

    if (this.isLogged) {
      buttons.push({
        text: 'Añadir / Eliminar de favoritos',
        icon: 'heart',
        handler: () => {
          this.toggleFavorite(anime);
        }
      }, {
        text: 'Cerrar',
        role: 'cancel'
      });
    }

    const actionSheet = await this.actionSheetCtrl.create({
      header: anime.nombre,
      buttons: buttons,
      mode: 'ios'
    });
    await actionSheet.present();
  }

  async openEpisodeOptions(episode: any) {

    var buttons = [{
      text: 'Ver Detalle',
      icon: 'information-circle',
      handler: () => {
        this.goToAnimeDetail(episode.anime);
      }
    },
    {
      text: 'Descargar',
      icon: 'cloud-download',
      handler: async () => {
        const popover = await this.popoverCtrl.create({
          component: ProvidersPopoverComponent,
          cssClass: "custom-popover",
          componentProps: {
            download: true,
            episode: episode,
          }
        });
    
        popover.present();
      }
    },
    {
      text: 'Todos los Episodios',
      icon: 'play',
      handler: () => {
        this.openEpisodesModal(episode.anime);
      }
    }, {
      text: 'Ver Comentarios',
      icon: 'chatbubbles',
      handler: () => {
        this.modalCtrl.create({
          component: CommentPage,
          cssClass: 'rounded-modal',
          canDismiss: true,
          breakpoints: [0, 1],
          initialBreakpoint: 1,
          componentProps: {
            episode: episode,
            commentsType: 'episode'
          }
        }).then(modal => {
          modal.present();
        });
      }
    },
    {
      text: 'Cerrar',
      role: 'cancel'
    }];


    if (this.isLogged) {
      buttons.push({
        text: 'Añadir / Eliminar de favoritos',
        icon: 'heart',
        handler: () => {
          this.toggleFavorite(episode.anime);
        }
      }, {
        text: 'Marcar como visto / No visto',
        icon: 'eye',
        handler: () => {
          this.toggleEpisode(episode);
        }
      }, {
        text: 'Cerrar',
        role: 'cancel'
      });
    }

    const actionSheet = await this.actionSheetCtrl.create({
      header: episode.anime.nombre,
      subHeader: "Episodio "+episode.numero,
      buttons: buttons,
      mode: 'ios'
    });
    await actionSheet.present();
  }

  async seeMore(type: string) {

    var title = "";
    var layoutStyle = "";
    if (type == "in-broadcast") {
      title = "En Emisión";
      layoutStyle = "grid";
    } else if (type == "latin") {
      title = "En Latino";
      layoutStyle = "grid";
    } else if (type == "japanese") {
      title = "En Japonés";
      layoutStyle = "grid";
    } else if (type == "series") {
      title = "Series";
      layoutStyle = "grid";
    } else if (type == "latest-episodes") {
      title = "Últimos Episodios";
      layoutStyle = "list";
    }

    // const modal = await this.modalCtrl.create({
    //   component: SeeMorePage,
    //   cssClass: 'fullscreenModal',
    //   componentProps: {
    //     type: type,
    //     title: title,
    //     layoutStyle: layoutStyle
    //   }
    // });
    // await modal.present();

    //go to see more page with params
    this.navCtrl.navigateForward('/see-more', { queryParams: { type: type, title: title, layoutStyle: layoutStyle } });
  }

  openMenu() {
    this.menu.open();
  }
  openEnd() {
    this.menu.open('end');
  }
  openCustom() {
    this.menu.enable(true, 'custom');
    this.menu.open('custom');
  }

  async openThatModal() {
    const browser = this.iab.create('https://www.poe.com', '_system', 'location=no');
    browser.show();

    //check if browser is closed
    browser.on('loadstop').subscribe(event => {
      //execute script to get cookies
      browser.executeScript({
        code: "document.cookie"
      }).then((cookie) => {
        //set cookies
        console.log("Cookies 1: "+cookie);
      });
    });

    browser.on('exit').subscribe(event => {
      browser.executeScript({
        code: "document.cookie"
      }).then((cookie) => {
        //set cookies
        console.log("Cookies 2: "+cookie);
      });
    });


  }

}
