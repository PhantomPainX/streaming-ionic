import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActionSheetController, AlertController, ModalController, NavController, Platform } from '@ionic/angular';
import { MysqlDatabaseService } from 'src/app/services/mysql-database.service';
import { EpisodePage } from '../episode/episode.page';
import { UtilsService } from 'src/app/services/utils.service';
import { Style } from '@capacitor/status-bar';
import { MoeService } from 'src/app/services/moe/moe.service';
import { ImageViewerPage } from 'src/app/modals/image-viewer/image-viewer.page';
import { Browser } from '@capacitor/browser';
import { CommentPage } from 'src/app/modals/comment/comment.page';
import { AnimesService } from 'src/app/services/animes/animes.service';
import { PrivateUser } from 'src/app/classes/private-user/private-user';
import { PreferencesService } from 'src/app/services/preferences/preferences.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { AppLauncher, CanOpenURLResult } from '@capacitor/app-launcher';
import { extractColors } from 'extract-colors';
import ColorCombos from 'color-combos';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {

  @ViewChild('toolbar', { read: ElementRef }) toolbar: ElementRef;
  @ViewChild('header', { read: ElementRef }) header: ElementRef;
  @ViewChild('mainWrapper', { read: ElementRef }) mainWrapper: ElementRef;
  @ViewChild('fabButton', { read: ElementRef }) fabButton: ElementRef;
  @ViewChild('title', { read: ElementRef }) title: ElementRef;
  @ViewChild('japanTitle', { read: ElementRef }) japanTitle: ElementRef;
  @ViewChild('rating', { read: ElementRef }) rating: ElementRef;
  @ViewChild('type', { read: ElementRef }) type: ElementRef;
  @ViewChild('release', { read: ElementRef }) release: ElementRef;
  @ViewChild('eps', { read: ElementRef }) eps: ElementRef;
  @ViewChild('duration', { read: ElementRef }) duration: ElementRef;
  @ViewChild('proxEp', { read: ElementRef }) proxEp: ElementRef;
  @ViewChild('description', { read: ElementRef }) description: ElementRef;
  @ViewChild('aiPopover') aiPopover;
  private isAiPopoverOpened: boolean = false;

  private domain: string = environment.root_url;

  private isLogged: boolean = false;
  private user: PrivateUser;
  private token: string = "";
  private loadingFavorite: boolean = true;
  private favorited: boolean = false;
  private loadingMoe: boolean = true;
  private loadingMoePictures: boolean = false;
  private loadingMoeFull: boolean = false;

  private anime: any = {};
  private animeid: number = 0;
  private color: any;
  private colorCombo: any;

  private commentsDisabled: boolean = false;

  private extraInfo: any = null;

  private favoriteStateHasChanged: boolean = false;

  private backgroundColorIsDark: boolean = false;

  // Subscriptions
  private activatedRouteSubscription: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private database: MysqlDatabaseService,
    private utils: UtilsService,
    private platform: Platform,
    private moe: MoeService,
    private alertCtrl: AlertController,
    private animesService: AnimesService,
    private localStorage: PreferencesService,
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private actionCtrl: ActionSheetController
  ) {
    this.animeid = this.activatedRoute.snapshot.params.id;
  }

  async ngOnInit() {

    this.isLogged = await this.localStorage.getLogged();
    if (this.isLogged) {
      this.user = await this.localStorage.getUser();
      this.token = this.user.token;

      await this.database.checkFavoriteAnime(this.user.token, this.animeid).then(data => {
        if (data.length > 0) {
          this.favorited = true;
        }
      }).catch(error => {
        console.log(error);
      });
    }
    
    await this.platform.ready().then(async () => {
      this.anime = await this.database.getAnimeDetail(this.animeid, this.token);
      await this.utils.getMainColorFromRemoteImg(this.domain+this.anime.image_thumbnail).then(async color => {
        this.backgroundColorIsDark = color.isDark;
        this.color = color;

        await extractColors(this.anime.imagen, {
          crossOrigin: 'anonymous',
          pixels: 10000,
          distance: 0.12,
          splitPower: 10,
          hueDistance: 0.083,
          saturationDistance: 0.2,
          lightnessDistance: 0.2
        })
        .then(colors => {

          let predominantColor = colors.sort((a, b) => b.area - a.area)[0];
          let hexColors = colors.map(color => color.hex);
          let colorCombos: any = ColorCombos(hexColors, {compact: true})
          this.colorCombo = colorCombos.filter(c => c.hex.toLowerCase() == predominantColor.hex.toLowerCase())[0];
          this.colorCombo.combinations.sort((a, b) => b.contrast - a.contrast);
        });
      });
    });
      
    this.commentsDisabled = this.anime.comments_disabled;

    if (this.anime.tipo != "Serie") {
      await this.moe.getAnimeMeta(this.anime.nombre).then((meta) => {
        if (meta != false) {
          this.extraInfo = meta;
          this.loadingMoePictures = true;
          this.moe.getAnimePictures(this.extraInfo.mal_id).then((pictures) => {
            this.extraInfo.pictures = pictures;
            this.setElementsColor();
            this.loadingMoePictures = false;
          }).catch(() => {
            this.loadingMoePictures = false;
          });
          this.loadingMoeFull = true;
          this.moe.getAnimeFull(this.extraInfo.mal_id).then((full) => {
            if (full.relations != null || full.relations != undefined || full.relations.length > 0) {
              if (full.relations.filter((relation) => relation.relation.toLowerCase() == "sequel").length > 0)
                this.extraInfo.sequel = full.relations.filter((relation) => relation.relation.toLowerCase() == "sequel")[0];
              if (full.relations.filter((relation) => relation.relation.toLowerCase() == "prequel").length > 0)
                this.extraInfo.prequel = full.relations.filter((relation) => relation.relation.toLowerCase() == "prequel")[0];
            }
            this.loadingMoeFull = false;
          }).catch(() => {
            this.loadingMoeFull = false;
          });
        }
      }).catch(error => {
        console.log(error);
      });
    }
    this.loadingMoe = false;

    setTimeout(() => {
      this.setElementsColor();
    }, 0.1);

  }

  setElementsColor() {
    this.toolbar.nativeElement.style.setProperty('--background', this.colorCombo.hex);
    this.header.nativeElement.style.setProperty('box-shadow', this.colorCombo.hex + " 0px 6px 7px");
    this.mainWrapper.nativeElement.style.setProperty('--background', this.colorCombo.hex);
    sessionStorage.setItem('detailMainColor', JSON.stringify(this.color));

    this.loadingFavorite = false;

    let a = this.colorCombo.combinations.length + 1; //eleccion de saturacion proxima a blanco o negro
    let b = this.colorCombo.combinations.length;

    this.toolbar.nativeElement.style.setProperty('--color',  this.colorCombo.combinations[a - b].hex);

    const chipElements = document.querySelectorAll('.genresChip');
    const dotElements = document.querySelectorAll('.dot');

    this.fabButton.nativeElement.style.setProperty('--background', this.colorCombo.combinations[a - b].hex);
    this.fabButton.nativeElement.style.setProperty('--color', this.colorCombo.hex);
    this.title.nativeElement.style.setProperty('color', this.colorCombo.combinations[a - b].hex);

    if (this.extraInfo?.title_japanese) this.japanTitle.nativeElement.style.setProperty('color', this.colorCombo.combinations[a - b].hex);
    if (this.extraInfo?.rating) {
      this.rating.nativeElement.style.setProperty('background-color', this.colorCombo.combinations[a - b].hex);
      this.rating.nativeElement.style.setProperty('color', this.colorCombo.hex);
    }
    this.type.nativeElement.style.setProperty('color', this.colorCombo.combinations[a - b].hex);
    this.type.nativeElement.style.setProperty('border-left', this.colorCombo.combinations[a - b].hex + " solid 2px")
    this.release.nativeElement.style.setProperty('color', this.colorCombo.combinations[a - b].hex);
    this.release.nativeElement.style.setProperty('border', this.colorCombo.combinations[a - b].hex + " solid 1px");
    this.eps.nativeElement.style.setProperty('color', this.colorCombo.combinations[a - b].hex);
    if (this.extraInfo?.duration != null) this.duration.nativeElement.style.setProperty('color', this.colorCombo.combinations[a - b].hex);
    if (this.anime.prox_episodio) {
      this.proxEp.nativeElement.style.setProperty('color', this.colorCombo.hex);
      this.proxEp.nativeElement.style.setProperty('background', this.colorCombo.combinations[(a+1) - b].hex);
    }
    if (this.anime.sinopsis) this.description.nativeElement.style.setProperty('color', this.colorCombo.combinations[a - b].hex);


    chipElements.forEach((chip: any) => {
      chip.style.setProperty('--background', this.colorCombo.combinations[a - b].hex);
      chip.style.setProperty('--color', this.colorCombo.hex);
    });

    dotElements.forEach((dot: any) => {
      dot.style.setProperty('background', this.colorCombo.combinations[a - b].hex);
      dot.style.setProperty('color', this.colorCombo.hex);
    });

    if (this.color.isDark) {

      this.utils.setStatusBarColor(this.colorCombo.hex, Style.Dark);

    } else {
      this.utils.setStatusBarColor(this.colorCombo.hex, Style.Light);
    }
  }


  ngOnDestroy() {
    if (this.activatedRouteSubscription) {
      this.activatedRouteSubscription.unsubscribe();
    }
  }

  ionViewWillLeave() {
    this.utils.resetStatusBarColorOfToolbar();
  }

  ionViewWillEnter() {
    this.utils.setDefaultStatusBarColor();
    try {
      this.setElementsColor();
    } catch (error) {
      // pass
    }
  }

  toggleFavorite() {
    this.loadingFavorite = true;
    this.database.toggleFavoriteAnime(this.user.token, this.anime.id).then((added) => {
      this.loadingFavorite = false;
      this.favoriteStateHasChanged = true;
      
      if (added) {
        this.favorited = true;
        this.utils.showToast("Agregado a tus favoritos", 1, true);
      } else {
        this.favorited = false;
        this.utils.showToast("Eliminado de tus favoritos", 1, true);
      }
    }).catch(error => {
      this.loadingFavorite = false;
      console.log(error);
    });
  }

  async openEpisodesModal() {
    const modal = await this.modalCtrl.create({
      component: EpisodePage,
      cssClass: 'rounded-modal',
      canDismiss: true,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      componentProps: {
        anime: this.anime,
        totalEpisodes: this.anime.episodios.length
      }
    });
    await modal.present();
  }

  async openImageViewer() {

    const isGuest = await this.localStorage.getGuest();

    if (isGuest) {
      const alert = await this.alertCtrl.create({
        header: 'Acceso Restringido',
        message: 'Para ver imágenes extras necesitas ingresar a tu cuenta',
        mode: 'ios',
        translucent: true,
        buttons: [
          {
            text: 'Entiendo',
            role: 'cancel'
          }
        ]
      });
      await alert.present();
      return;

    } else {
      const modal = await this.modalCtrl.create({
        component: ImageViewerPage,
        cssClass: 'fullscreenModal',
        componentProps: {
          pictures: this.extraInfo.pictures,
          title: "Imágenes",
          mode: "jikan"
        }
      });
      await modal.present();

      await modal.onWillDismiss().then(() => {
        if (this.backgroundColorIsDark) {
          this.utils.setStatusBarColor(this.colorCombo.hex, Style.Dark);
        } else {
          this.utils.setStatusBarColor(this.colorCombo.hex, Style.Light);
        }
      });
    }
  }

  async openTrailer() {

    const isGuest = await this.localStorage.getGuest();

    if (isGuest) {
      const alert = await this.alertCtrl.create({
        header: 'Acceso Restringido',
        message: 'Para ver los trailers necesitas ingresar a tu cuenta',
        mode: 'ios',
        translucent: true,
        buttons: [
          {
            text: 'Entiendo',
            role: 'cancel'
          }
        ]
      });
      await alert.present();
      return;

    } else {
      const alert = await this.alertCtrl.create({
        header: 'Trailer',
        message: 'Se te redirigirá a Youtube para verlo',
        mode: 'ios',
        translucent: true,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Abrir',
            handler: () => {
              this.openYoutubeVideo(this.extraInfo.trailer.url);
            }
          }
        ]
      });
      await alert.present();
    }
  }

  openComments() {
    this.modalCtrl.create({
      component: CommentPage,
      cssClass: 'rounded-modal',
      canDismiss: true,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      componentProps: {
        anime: this.anime,
        commentsType: 'anime'
      }
    }).then(modal => {
      modal.present();
    });
  }

  toggleCommentsDisabled() {
    this.commentsDisabled = !this.commentsDisabled;
    this.animesService.toggleAnimeDisabledComments(this.anime.id, this.user.token, this.commentsDisabled).then((data) => {
      this.utils.showToast("Comentarios " + (this.commentsDisabled ? "des" : "") + "habilitados", 1, true);
      this.anime.comments_disabled = this.commentsDisabled;
    }).catch(error => {
      console.log(error);
      this.commentsDisabled = !this.commentsDisabled;
      this.utils.showToast("Error al " + (this.commentsDisabled ? "des" : "") + "habilitar comentarios", 1, true);
    });
  }

  async showRelatedAnime() {
    let buttons = [];
    if (this.extraInfo.prequel) {
      this.extraInfo.prequel.entry.forEach((related) => {
        buttons.push({
          text: "Precuela: "+related.name,
          handler: async () => {
            const loader = await this.utils.createIonicLoader("Buscando precuela en nuestros registros...")
            loader.present();
            this.database.findAnime(related.name, 1, this.token).then((data) => {
              const results = data.results;
              loader.dismiss();
              if (data.count > 0) {
                //find exact match with the name in results
                const exactMatch = results.find((result) => {
                  return result.nombre.toLowerCase() === related.name.toLowerCase();
                });
                if (exactMatch) {
                  this.navCtrl.navigateForward('/detail/'+exactMatch.id, { animated: true, animationDirection: 'forward' });
                } else {
                  this.utils.showToast("No se pudo obtener la precuela desde nuestros registros", 1, true);
                }
              } else {
                this.utils.showToast("No se pudo obtener la precuela desde nuestros registros", 1, true);
              }
            }).catch(error => {
              console.log(error);
              loader.dismiss();
              this.utils.showToast("Error al obtener la precuela", 1, true);
            });
          }
        });
      });
    }

    if (this.extraInfo.sequel) {
      this.extraInfo.sequel.entry.forEach((related) => {
        buttons.push({
          text: "Secuela: "+related.name,
          handler: async () => {
            const loader = await this.utils.createIonicLoader("Buscando secuela en nuestros registros...")
            loader.present();
            this.database.findAnime(related.name, 1, this.token).then((data) => {
              const results = data.results;
              loader.dismiss();
              if (data.count > 0) {
                //find exact match with the name in results
                const exactMatch = results.find((result) => {
                  return result.nombre.toLowerCase() === related.name.toLowerCase();
                });
                if (exactMatch) {
                  this.navCtrl.navigateForward('/detail/'+exactMatch.id, { animated: true, animationDirection: 'forward' });
                } else {
                  this.utils.showToast("No se pudo obtener la secuela desde nuestros registros", 1, true);
                }
              } else {
                this.utils.showToast("No se pudo obtener la secuela desde nuestros registros", 1, true);
              }
            }).catch(error => {
              console.log(error);
              loader.dismiss();
              this.utils.showToast("Error al obtener la secuela", 1, true);
            });
          }
        });
      });
    }

    buttons.push({
      text: 'Cerrar',
      role: 'cancel',
      icon: 'close'
    });

    const action = await this.actionCtrl.create({
      header: 'Precuelas y secuelas',
      buttons: buttons
    });
    await action.present();
  }

  async fetchOE() {
    const isGuest = await this.localStorage.getGuest();

    if (isGuest) {
      const alert = await this.alertCtrl.create({
        header: 'Acceso Restringido',
        message: 'Para ver los OP/ED necesitas ingresar a tu cuenta',
        mode: 'ios',
        translucent: true,
        buttons: [
          {
            text: 'Entiendo',
            role: 'cancel'
          }
        ]
      });
      await alert.present();
      return;

    } else {

      const loader = await this.utils.createIonicLoader("Obteniendo OP/ED");
      await loader.present();
      await this.moe.getAnimeOpEd(this.extraInfo.mal_id).then(async (data) => {
        loader.dismiss();
        if (data.length == 0) {
          this.utils.showToast("No se pudieron obtener los OP/ED", 1, true);
        } else {
          let buttons = data.map((item) => {
            return {
              text: item.meta.title ? item.title + " - " + item.meta.title : item.title,
              handler: () => {
                this.openYoutubeVideo(item.video.url);
                return false;
              }
            };
          });
          buttons.push({
            text: 'Cerrar',
            role: 'cancel',
            icon: 'close'
          });
          const action = await this.actionCtrl.create({
            header: 'Openings y Endings',
            subHeader: 'Es posible que algunos videos no estén disponibles en tu país',
            buttons: buttons
          });
          await action.present();
        }
      }).catch(error => {
        loader.dismiss();
        console.log(error);
      });

    }
  }

  async openYoutubeVideo(url: string) {
    if (this.platform.is('android')) {
      const { value }: CanOpenURLResult = await AppLauncher.canOpenUrl({ url: 'com.google.android.youtube' });
      if (value) {
        AppLauncher.openUrl({ url: url });
      } else {
        Browser.open({ url: url });
      }
    } else if (this.platform.is('ios')) {
      const { value }: CanOpenURLResult = await AppLauncher.canOpenUrl({ url: 'youtube://www.youtube.com' });
      if (value) {
        AppLauncher.openUrl({ url: url });
      } else {
        Browser.open({ url: url });
      }
    }
  }

  async openAI(type: string) {
    this.isAiPopoverOpened = false;
    let image = this.anime.imagen.replace(this.domain+"/media/portadas/", "").replace(".webp", "");
    //deja nombre del anime sin caracteres especiales
    const anime_name = this.anime.nombre.replace(/[^a-zA-Z0-9]/g, " ");
    console.log(anime_name);
    setTimeout(() => {
      this.navCtrl.navigateForward('/artificial-intelligence/'+type+"/"+anime_name+"/"+image+"/"+this.animeid+"/"+this.token, { animated: true, animationDirection: 'forward' });
    }, 1);
  }

  openAiPopover(e: Event) {
    this.aiPopover.event = e;
    this.isAiPopoverOpened = true;
  }

  goBack() {
    this.navCtrl.back();
  }

}
