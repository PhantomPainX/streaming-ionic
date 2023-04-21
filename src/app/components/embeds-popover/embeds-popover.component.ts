import { Component, Input, OnInit } from '@angular/core';
import { AlertController, Platform, PopoverController } from '@ionic/angular';
import { PrivateUser } from 'src/app/classes/private-user/private-user';
import { Settings } from 'src/app/classes/settings/settings/settings';
import { AdsService } from 'src/app/services/ads/ads.service';
import { PreferencesService } from 'src/app/services/preferences/preferences.service';
import { ResolversService } from 'src/app/services/resolvers/resolvers.service';
import { VideoPlayerService } from 'src/app/services/video-player/video-player.service';
import { Browser } from '@capacitor/browser';
import { VideosPopoverComponent } from '../videos-popover/videos-popover.component';
import { DownloadService } from 'src/app/services/download/download.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-embeds-popover',
  templateUrl: './embeds-popover.component.html',
  styleUrls: ['./embeds-popover.component.scss'],
})
export class EmbedsPopoverComponent implements OnInit {

  @Input() download: boolean;
  @Input() episode: any;
  @Input() embeds: any;
  @Input() providerName: string;

  private localCompatible: any = [];
  private webCompatible: any = [];
  private optionValue;

  private deserveAd: boolean = true;

  public settings: Settings;

  private isLogged: boolean = false;
  private user: PrivateUser;
  private anime_name: string = "";
  private anime_image: string = "";

  constructor(
    private resolvers: ResolversService,
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController,
    private players: VideoPlayerService,
    private ads: AdsService,
    private localStorage: PreferencesService,
    private platform: Platform,
    private downloadService: DownloadService,
    private utils: UtilsService
  ) {

  }

  ngOnInit() {
    console.log(this.download);

    this.anime_image = this.episode.anime.imagen;
    this.anime_name = this.episode.anime.nombre;

    console.log("EMBEDS: "+ JSON.stringify(this.embeds));

    this.localCompatible = this.embeds.filter(embed => 
      embed.url.includes('fembed') || 
      embed.url.includes('embedsito') || 
      embed.url.includes('ok.ru') || 
      embed.url.includes('uqload') ||
      embed.url.includes('yourupload') ||
      embed.url.includes('mail.ru') || 
      embed.url.includes('animefenix') ||
      embed.url.includes('animeui') ||
      embed.url.includes('streamtape') ||
      embed.url.includes('jwplayer') ||
      embed.url.includes('.mp4') ||
      // embed.url.includes('streamsb') ||
      // embed.url.includes('viewsb') || 
      // embed.url.includes('embedsb') ||
      embed.url.includes('mp4upload')
    );

    this.webCompatible = this.embeds.filter(embed => 
      !embed.url.includes('fembed') && 
      !embed.url.includes('embedsito') && 
      !embed.url.includes('ok.ru') && 
      !embed.url.includes('uqload') &&
      !embed.url.includes('yourupload') &&
      !embed.url.includes('mail.ru') && 
      !embed.url.includes('animefenix') &&
      !embed.url.includes('animeui') &&
      !embed.url.includes('streamtape') &&
      !embed.url.includes('jwplayer') &&
      !embed.url.includes('.mp4') &&
      // !embed.url.includes('streamsb') &&
      // !embed.url.includes('viewsb') &&
      // !embed.url.includes('embedsb') &&
      !embed.url.includes('mp4upload')
    );

    this.optionValue = 'local';
    this.platform.ready().then(async () => {
      this.isLogged = await this.localStorage.getLogged();
      if (this.isLogged) {
        this.user = await this.localStorage.getUser();
      }

      this.deserveAd = await this.localStorage.getDeserveAd();
      this.settings = await this.localStorage.getSettings();
    });
  }

  segmentChanged(event: any) {
    if (event.detail.value != '') {
      this.optionValue = event.detail.value;
    }
  }

  async openSingleVideo(video: any, subtitleUrl: string) {

    const isDownloading = await this.localStorage.getIsDownloading();
    if (this.download) {
      if (isDownloading) {
        this.utils.showToast("Hay una descarga en curso, no puedes ni descargar ni reproducir otro video", 2, false);
      } else {
        this.downloadService.downloadVideo(this.episode, video);
      }
      return;
    } else {
      if (isDownloading) {
        this.utils.showToast("Hay una descarga en curso, no puedes ni descargar ni reproducir otro video", 2, false);
        return;
      }
    }

    if (this.user) {
      if (!this.user.is_staff && !this.user.groups.vip && !this.user.groups.moderator) {

        if (this.deserveAd) {

          this.ads.fireRewardAdWithAlert("Ayudanos a seguir creciendo", "Mira un pequeño anuncio para poder ver el video", true).then(() => {
            this.popoverCtrl.dismiss({openedVideo: true});
            this.players.nativePlayer(video, subtitleUrl, this.anime_name, "Episodio " + this.episode.numero, this.anime_image, this.episode, this.isLogged, this.user, this.settings);
          }).catch((error) => {
            if (!error.cancelled) {
              this.popoverCtrl.dismiss({openedVideo: true});
              this.players.nativePlayer(video, subtitleUrl, this.anime_name, "Episodio " + this.episode.numero, this.anime_image, this.episode, this.isLogged, this.user, this.settings);
            }
          });
        } else {
          this.popoverCtrl.dismiss({openedVideo: true});
          this.players.nativePlayer(video, subtitleUrl, this.anime_name, "Episodio " + this.episode.numero, this.anime_image, this.episode, this.isLogged, this.user, this.settings);
        }
  
      } else {
        this.popoverCtrl.dismiss({openedVideo: true});
        this.players.nativePlayer(video, subtitleUrl, this.anime_name, "Episodio " + this.episode.numero, this.anime_image, this.episode, this.isLogged, this.user, this.settings);
      }

    } else {
      if (this.deserveAd) {
        this.ads.fireRewardAdWithAlert("Ayudanos a seguir creciendo", "Mira un pequeño anuncio para poder ver el video", true).then(() => {
          this.popoverCtrl.dismiss({openedVideo: true});
          this.players.nativePlayer(video, subtitleUrl, this.anime_name, "Episodio " + this.episode.numero, this.anime_image, this.episode, this.isLogged, this.user, this.settings);
        }).catch((error) => {
          if (!error.cancelled) {
            this.popoverCtrl.dismiss({openedVideo: true});
            this.players.nativePlayer(video, subtitleUrl, this.anime_name, "Episodio " + this.episode.numero, this.anime_image, this.episode, this.isLogged, this.user, this.settings);
          }
        });
      } else {
        this.popoverCtrl.dismiss({openedVideo: true});
        this.players.nativePlayer(video, subtitleUrl, this.anime_name, "Episodio " + this.episode.numero, this.anime_image, this.episode, this.isLogged, this.user, this.settings);
      }
    }
  }

  async getVideos(event, embed: any) {

    if (embed.url.includes('fembed') || embed.url.includes('embedsito')) {
      await this.resolvers.fembedResolver(embed.url).then(async data => {
        const videos: any = data;
        if (videos.length > 1) {
          const popover = await this.popoverCtrl.create({
            component: VideosPopoverComponent,
            cssClass: "custom-popover",
            event: event,
            componentProps: {
              download: this.download,
              videos: videos,
              episode: this.episode,
              title: this.anime_name,
              smallTitle: "Episodio " + this.episode.numero,
              image: this.anime_image,
              embedName: embed.embed
            }
          });
          await popover.present();
          await popover.onDidDismiss().then(data => {
            if (data.data) {
              if (data.data.openedVideo) {
                this.popoverCtrl.dismiss({openedVideo: true});
              }
            }
          });
        } else {
          this.openSingleVideo(videos[0], "");
        }
  
      }, async error => {
        console.log(error);
        const alert = await this.alertCtrl.create({
          header: 'No se pudieron obtener los videos',
          message: 'Hubo un error al obtener los videos. ¿Deseas abrirlos en tu navegador?',
          mode: 'ios',
          translucent: true,
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary'
            }, {
              text: 'Abrir',
              handler: () => {
                //window.open(embed.url, '_system', 'location=yes');
                Browser.open({ url: embed.url });
              }
            }
          ]
        });
        await alert.present();
      });

    } else if (embed.url.includes('ok.ru')) {
      
      await this.resolvers.okruResolver(embed.url).then(async data => {
        const videos: any = data;

        if (videos.length > 1) {
          const popover = await this.popoverCtrl.create({
            component: VideosPopoverComponent,
            cssClass: "custom-popover",
            event: event,
            componentProps: {
              download: this.download,
              videos: videos,
              episode: this.episode,
              title: this.anime_name,
              smallTitle: "Episodio " + this.episode.numero,
              image: this.anime_image,
              embedName: embed.embed
            }
          });
          await popover.present();
          await popover.onDidDismiss().then(data => {
            if (data.data) {
              if (data.data.openedVideo) {
                this.popoverCtrl.dismiss({openedVideo: true});
              }
            }
          });
        } else {
          this.openSingleVideo(videos[0], "");
        }
      }, async error => {
        const alert = await this.alertCtrl.create({
          header: 'No se pudieron obtener los videos',
          message: 'Hubo un error al obtener los videos. ¿Deseas abrirlos en tu navegador?',
          mode: 'ios',
          translucent: true,
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary'
            }, {
              text: 'Abrir',
              handler: () => {
                // window.open(embed.url, '_system', 'location=yes');
                Browser.open({ url: embed.url });
              }
            }
          ]
        });
        await alert.present();
      });

    } else if (embed.url.includes('uqload')) {
      await this.resolvers.uqloadResolver(embed.url).then(async data => {
        const videos: any = data;

        if (videos.length > 1) {
          const popover = await this.popoverCtrl.create({
            component: VideosPopoverComponent,
            cssClass: "custom-popover",
            event: event,
            componentProps: {
              download: this.download,
              videos: videos,
              episode: this.episode,
              title: this.anime_name,
              smallTitle: "Episodio " + this.episode.numero,
              image: this.anime_image,
              embedName: embed.embed
            }
          });
          await popover.present();
          await popover.onDidDismiss().then(data => {
            if (data.data) {
              if (data.data.openedVideo) {
                this.popoverCtrl.dismiss({openedVideo: true});
              }
            }
          });
        } else {
          this.openSingleVideo(videos[0], "");
        }
      }, async error => {
        console.log(error);
        const alert = await this.alertCtrl.create({
          header: 'No se pudieron obtener los videos',
          message: 'Hubo un error al obtener los videos. ¿Deseas abrirlos en tu navegador?',
          mode: 'ios',
          translucent: true,
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary'
            }, {
              text: 'Abrir',
              handler: () => {
                // window.open(embed.url, '_system', 'location=yes');
                Browser.open({ url: embed.url });
              }
            }
          ]
        });
        await alert.present();
      });

    } else if (embed.url.includes('yourupload')) {
      await this.resolvers.youruploadResolver(embed.url).then(async data => {
        const videos: any = data;

        if (videos.length > 1) {
          const popover = await this.popoverCtrl.create({
            component: VideosPopoverComponent,
            cssClass: "custom-popover",
            event: event,
            componentProps: {
              download: this.download,
              videos: videos,
              episode: this.episode,
              title: this.anime_name,
              smallTitle: "Episodio " + this.episode.numero,
              image: this.anime_image,
              embedName: embed.embed
            }
          });
          await popover.present();
          await popover.onDidDismiss().then(data => {
            if (data.data) {
              if (data.data.openedVideo) {
                this.popoverCtrl.dismiss({openedVideo: true});
              }
            }
          });
        } else {
          this.openSingleVideo(videos[0], "");
        }
      }, async error => {
        console.log(error);
        const alert = await this.alertCtrl.create({
          header: 'No se pudieron obtener los videos',
          message: 'Hubo un error al obtener los videos. ¿Deseas abrirlos en tu navegador?',
          mode: 'ios',
          translucent: true,
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary'
            }, {
              text: 'Abrir',
              handler: () => {
                // window.open(embed.url, '_system', 'location=yes');
                Browser.open({ url: embed.url });
              }
            }
          ]
        });
        await alert.present();
      });

    } else if (embed.url.includes('mail.ru')) {
      await this.resolvers.mailRuResolver(embed.url).then(async data => {
        const videos: any = data;

        if (videos.length > 1) {
          const popover = await this.popoverCtrl.create({
            component: VideosPopoverComponent,
            cssClass: "custom-popover",
            event: event,
            componentProps: {
              download: this.download,
              videos: videos,
              episode: this.episode,
              title: this.anime_name,
              smallTitle: "Episodio " + this.episode.numero,
              image: this.anime_image,
              embedName: embed.embed
            }
          });
          await popover.present();
          await popover.onDidDismiss().then(data => {
            if (data.data) {
              if (data.data.openedVideo) {
                this.popoverCtrl.dismiss({openedVideo: true});
              }
            }
          });
        } else {
          this.openSingleVideo(videos[0], "");
        }
      }, async error => {
        console.log(error);
        const alert = await this.alertCtrl.create({
          header: 'No se pudieron obtener los videos',
          message: 'Hubo un error al obtener los videos. ¿Deseas abrirlos en tu navegador?',
          mode: 'ios',
          translucent: true,
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary'
            }, {
              text: 'Abrir',
              handler: () => {
                // window.open(embed.url, '_system', 'location=yes');
                Browser.open({ url: embed.url });
              }
            }
          ]
        });
        await alert.present();
      });

    } else if (embed.url.includes('animefenix')) {

      await this.resolvers.aFenixResolver(embed.url).then(async data => {
        const videos: any = data;

        if (videos.length > 1) {
          const popover = await this.popoverCtrl.create({
            component: VideosPopoverComponent,
            cssClass: "custom-popover",
            event: event,
            componentProps: {
              download: this.download,
              videos: videos,
              episode: this.episode,
              title: this.anime_name,
              smallTitle: "Episodio " + this.episode.numero,
              image: this.anime_image,
              embedName: embed.embed
            }
          });
          await popover.present();
          await popover.onDidDismiss().then(data => {
            if (data.data) {
              if (data.data.openedVideo) {
                this.popoverCtrl.dismiss({openedVideo: true});
              }
            }
          });
        } else {
          this.openSingleVideo(videos[0], "");
        }
      }, async error => {
        const alert = await this.alertCtrl.create({
          header: 'No se pudieron obtener los videos',
          message: 'Hubo un error al obtener los videos. ¿Deseas abrirlos en tu navegador?',
          mode: 'ios',
          translucent: true,
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary'
            }, {
              text: 'Abrir',
              handler: () => {
                // window.open(embed.url, '_system', 'location=yes');
                Browser.open({ url: embed.url });
              }
            }
          ]
        });
        await alert.present();
      });

    } else if (embed.url.includes('animeui')) {

      await this.resolvers.animeuiResolver(embed.url).then(async data => {
        const videos: any = data;

        if (videos.length > 1) {
          const popover = await this.popoverCtrl.create({
            component: VideosPopoverComponent,
            cssClass: "custom-popover",
            event: event,
            componentProps: {
              download: this.download,
              videos: videos,
              episode: this.episode,
              title: this.anime_name,
              smallTitle: "Episodio " + this.episode.numero,
              image: this.anime_image,
              embedName: embed.embed
            }
          });
          await popover.present();
          await popover.onDidDismiss().then(data => {
            if (data.data) {
              if (data.data.openedVideo) {
                this.popoverCtrl.dismiss({openedVideo: true});
              }
            }
          });
        } else {
          this.openSingleVideo(videos[0], "");
        }
      }, async error => {
        const alert = await this.alertCtrl.create({
          header: 'No se pudieron obtener los videos',
          message: 'Hubo un error al obtener los videos. ¿Deseas abrirlos en tu navegador?',
          mode: 'ios',
          translucent: true,
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary'
            }, {
              text: 'Abrir',
              handler: () => {
                // window.open(embed.url, '_system', 'location=yes');
                Browser.open({ url: embed.url });
              }
            }
          ]
        });
        await alert.present();
      });

    } else if (embed.url.includes('streamtape')) {

      await this.resolvers.streamtapeResolver(embed.url).then(async data => {
        const videos: any = data;

        if (videos.length > 1) {
          const popover = await this.popoverCtrl.create({
            component: VideosPopoverComponent,
            event: event,
            componentProps: {
              download: this.download,
              videos: videos,
              episode: this.episode,
              title: this.anime_name,
              smallTitle: "Episodio " + this.episode.numero,
              image: this.anime_image,
              embedName: embed.embed
            }
          });
          await popover.present();
          await popover.onDidDismiss().then(data => {
            if (data.data) {
              if (data.data.openedVideo) {
                this.popoverCtrl.dismiss({openedVideo: true});
              }
            }
          });
        } else {
          this.openSingleVideo(videos[0], "");
        }
      }, async error => {
        const alert = await this.alertCtrl.create({
          header: 'No se pudieron obtener los videos',
          message: 'Hubo un error al obtener los videos. ¿Deseas abrirlos en tu navegador?',
          mode: 'ios',
          translucent: true,
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary'
            }, {
              text: 'Abrir',
              handler: () => {
                // window.open(embed.url, '_system', 'location=yes');
                Browser.open({ url: embed.url });
              }
            }
          ]
        });
        await alert.present();
      });

    } else if (embed.url.includes('jwplayer')) {

      await this.resolvers.jwplayerResolver(embed.url).then(async data => {
        const videos: any = data;

        //checl if videos has an element with kind captions

        const videosLength = videos.filter(video => video.kind == "video").length;

        if (videosLength > 1) {
          const popover = await this.popoverCtrl.create({
            component: VideosPopoverComponent,
            event: event,
            componentProps: {
              download: this.download,
              videos: videos,
              episode: this.episode,
              title: this.anime_name,
              smallTitle: "Episodio " + this.episode.numero,
              image: this.anime_image,
              embedName: embed.embed
            }
          });
          await popover.present();
          await popover.onDidDismiss().then(data => {
            if (data.data) {
              if (data.data.openedVideo) {
                this.popoverCtrl.dismiss({openedVideo: true});
              }
            }
          });
        } else {
          const captions = videos.filter(video => video.kind == "captions");
          let caption = "";
          if (captions.length > 0) {
            caption = captions[0].file;
          }
          this.openSingleVideo(videos[0], caption);
        }
      }, async error => {
        const alert = await this.alertCtrl.create({
          header: 'No se pudieron obtener los videos',
          message: 'Hubo un error al obtener los videos. ¿Deseas abrirlos en tu navegador?',
          mode: 'ios',
          translucent: true,
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary'
            }, {
              text: 'Abrir',
              handler: () => {
                // window.open(embed.url, '_system', 'location=yes');
                Browser.open({ url: embed.url });
              }
            }
          ]
        });
        await alert.present();
      });

    } else if (embed.url.includes('.mp4')) {
      this.openSingleVideo(embed.url, "");
  
    // } else if (embed.url.includes('streamsb') || embed.url.includes('viewsb') || embed.url.includes('embedsb')) {

    //   await this.resolvers.streamsbResolver(embed.url).then(async data => {
    //     const videos: any = data;

    //     if (videos.length > 1) {
    //       const popover = await this.popoverCtrl.create({
    //         component: VideosPopoverComponent,
    //         cssClass: 'custom-popover',
    //         event: event,
    //         componentProps: {
                 //download: this.download,
    //           videos: videos,
    //           episode: this.episode,
    //           title: this.anime_name,
    //           smallTitle: "Episodio " + this.episode.numero,
    //           image: this.anime_image,
    //           embedName: embed.embed
    //         }
    //       });
    //       await popover.present();
    //     } else {
    //       this.openSingleVideo(videos[0], "");
    //     }
    //   }, async error => {
    //     const alert = await this.alertCtrl.create({
    //       header: 'No se pudieron obtener los videos',
    //       message: 'Hubo un error al obtener los videos. ¿Deseas abrirlos en tu navegador?',
    //       buttons: [
    //         {
    //           text: 'Cancelar',
    //           role: 'cancel',
    //           cssClass: 'secondary'
    //         }, {
    //           text: 'Abrir',
    //           handler: () => {
    //             Browser.open({ url: embed.url });
    //           }
    //         }
    //       ]
    //     });
    //     await alert.present();
    //   });

    } else if (embed.url.includes('mp4upload')) {

      await this.resolvers.mp4uploadResolver(embed.url).then(async data => {
        const videos: any = data;

        if (videos.length > 1) {
          const popover = await this.popoverCtrl.create({
            component: VideosPopoverComponent,
            event: event,
            componentProps: {
              download: this.download,
              videos: videos,
              episode: this.episode,
              title: this.anime_name,
              smallTitle: "Episodio " + this.episode.numero,
              image: this.anime_image,
              embedName: embed.embed
            }
          });
          await popover.present();
        } else {
          this.openSingleVideo(videos[0], "");
        }
      }, async error => {
        const alert = await this.alertCtrl.create({
          header: 'No se pudieron obtener los videos',
          message: 'Hubo un error al obtener los videos. ¿Deseas abrirlos en tu navegador?',
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary'
            }, {
              text: 'Abrir',
              handler: () => {
                Browser.open({ url: embed.url });
              }
            }
          ]
        });
        await alert.present();
      });

    } else {
      const alert = await this.alertCtrl.create({
        header: 'Esta fuente no soporta la reproducción local',
        message: 'Solo puedes abrirlo en tu navegador, es posible que hayan anuncios.',
        mode: 'ios',
        translucent: true,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'secondary'
          }, {
            text: 'Abrir',
            handler: () => {
              // window.open(embed.url, '_system', 'location=yes');
              Browser.open({ url: embed.url });
            }
          }
        ]
      });
      await alert.present();
    }
  }

  dismiss() {
    this.popoverCtrl.dismiss();
  }

}
