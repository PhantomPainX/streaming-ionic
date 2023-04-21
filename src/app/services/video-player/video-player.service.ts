import { ElementRef, Injectable, NgZone, ViewChild } from '@angular/core';
import { CapacitorVideoPlayer, capVideoPlayerOptions, capVideoPlayerIdOptions } from 'capacitor-video-player';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { Settings } from 'src/app/classes/settings/settings/settings';
import { AlertController, Platform } from '@ionic/angular';
import { UtilsService } from '../utils.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { MysqlDatabaseService } from '../mysql-database.service';
import { PreferencesService } from '../preferences/preferences.service';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class VideoPlayerService {

  private capacitorVideoPlayer: any = CapacitorVideoPlayer;
  @ViewChild('toolbar', { read: ElementRef }) toolbar: ElementRef;

  private domain: string = environment.root_url;
  private seconds: number = 0;
  public interval: any;
  private videoDuration: number = 0.0;
  private readyHandler: any;
  private endHandler: any;
  private exitHandler: any;
  private needSeek: boolean = false;
  private seekTime: number = 0;

  constructor(private screenOrientation: ScreenOrientation, private platform: Platform, private utils: UtilsService, 
    private database: MysqlDatabaseService, private localStorage: PreferencesService, 
    private zone: NgZone, private alertCtrl: AlertController) {
  }

  async startTimer(episode: any, token: string, isLogged: boolean) {
    this.interval = setInterval(async () => {
      this.seconds++;
      console.log("Segundos: "+this.seconds);

      if (this.seconds == 210) { //3 minutos con 30 segundos
        clearInterval(this.interval);
        if (isLogged && !episode.seen) {
          this.toggleEpisode(episode, token); 
        }

        // AQUI SE CONFIGURA LA FRECUENCIA DE ANUNCIOS PARA EL USUARIO, EN ESTE CASO CADA 1 VIDEOS

        const withoutAdVideoViews = await this.localStorage.getWithoutAdVideoViews();
        
        this.localStorage.setWithoutAdVideoViews(withoutAdVideoViews + 1);

        let updatedWithoutAdVideoViews = withoutAdVideoViews + 1;

        if (updatedWithoutAdVideoViews >= 1) {
          this.localStorage.setWithoutAdVideoViews(-1);
          this.localStorage.setDeserveAd(true);
        }
        this.seconds = 0;
      }
    }, 1000);
  }

  async toggleEpisode(episode: any, token: string) {

    this.database.toggleSeenEpisode(token, episode.id).then((added) => {
      if (added) {
        this.zone.run(() => {
          episode.seen = true;
        });
      }
    });
  }

  async nativePlayer(video: any, subtitleUrl: string, title: string, smallTitle: string, image: string, episode: any, isLogged: boolean, user: any, 
    settings: Settings) {

      const loader = await this.utils.createIonicLoader("Por favor espera...");
      loader.present();
      const timeSeen = await this.getSeenEpisodeTime(episode.id, user.token);
      loader.dismiss();
      if (timeSeen != null && timeSeen.seconds > 0 && timeSeen.seconds < timeSeen.total_seconds) {
        const alert = await this.alertCtrl.create({
          header: '¿Continuar viendo?',
          message: 'Lo dejaste en el minuto '+this.utils.formatSeconds(timeSeen.seconds),
          mode: 'ios',
          translucent: true,
          buttons: [
            {
              text: 'Empezar de nuevo',
              handler: async () => {
                this.needSeek = false;
                this.seekTime = 0;
                this.postSeenEpisodeTime(episode.id, user.token, 0, timeSeen.total_seconds);
                this.zone.run(() => {
                  episode.seconds_seen.seconds = 0;
                  episode.seconds_seen.total_seconds = timeSeen.total_seconds;
                  episode.seconds_seen.episode = episode.id;
                });
                this.executePlayer(video, subtitleUrl, title, smallTitle, image, episode, isLogged, user, settings);
              }
            },
            {
              text: 'Continuar',
              handler: async () => {
                this.needSeek = true;
                this.seekTime = timeSeen.seconds;
                this.executePlayer(video, subtitleUrl, title, smallTitle, image, episode, isLogged, user, settings);
              }
            }
          ]
        });
        await alert.present();
      } else {
        this.needSeek = false;
        this.seekTime = 0;
        this.executePlayer(video, subtitleUrl, title, smallTitle, image, episode, isLogged, user, settings);
      }
  
  }

  async executePlayer(video: any, subtitleUrl: string, title: string, smallTitle: string, image: string, episode: any, isLogged: boolean, user: any, 
    settings: Settings) {

      let options: capVideoPlayerOptions = {
        mode: 'fullscreen',
        url: video.file,
        playerId: 'player1',
        headers: video.headers,
        title: title,
        smallTitle: smallTitle,
        accentColor: "#f0b400",
        chromecast: settings.chromecastEnabled,
        artwork: image,
        pipEnabled: settings.pipEnabled
      }

      if (subtitleUrl != "") {
        options.language = "es";
        options.subtitle = subtitleUrl;
        options.subtitleOptions = {
          backgroundColor: "rgba(0,0,0,0.6)"
        }
      }

      await this.capacitorVideoPlayer.initPlayer(options).then(() => {
        this.capacitorVideoPlayer.play({playerId: 'player1'}).then(async () => {
          if (this.platform.is('android')) {
            this.screenOrientation.unlock();
          }

          // if (user) {
          //   this.startTimer(episode, user.token, isLogged);
          // } else {
          //   this.startTimer(episode, "no token", isLogged);
          // }

          this.readyHandler = await this.capacitorVideoPlayer.addListener('jeepCapVideoPlayerReady', async (info) => {
            const playerIdOptions: capVideoPlayerIdOptions = {
              playerId: 'player1',
            }
            this.capacitorVideoPlayer.getDuration(playerIdOptions).then((duration) => {
              this.videoDuration = duration.value;
              console.log("Duración: "+this.videoDuration);
            });

            if (this.needSeek) {
              this.capacitorVideoPlayer.setCurrentTime({playerId: 'player1', seektime: this.seekTime});
            }
          });

          this.exitHandler = await this.capacitorVideoPlayer.addListener('jeepCapVideoPlayerExit', async (info) => {
            if (this.platform.is('android')) {
              this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
            }
            
            console.log("Exit: "+ JSON.stringify(info));

            if (user) {
              // clearInterval(this.interval);
              // this.seconds = 0;

              console.log("Duración aaa: "+this.videoDuration);

              if (((info.currentTime * 100) / this.videoDuration) >= 70) { // 70%
                console.log("Visto: "+ JSON.stringify(info));
                if (isLogged && !episode.seen) {
                  this.toggleEpisode(episode, user.token); 
                }
              }

              this.postSeenEpisodeTime(episode.id, user.token, info.currentTime, this.videoDuration).then(() => {

                this.zone.run(() => {
                  if (episode.seconds_seen == null) {
                    episode.seconds_seen = {};
                  }
                  episode.seconds_seen.seconds = info.currentTime;
                  episode.seconds_seen.total_seconds = this.videoDuration;
                  episode.seconds_seen.episode = episode.id;

                  sessionStorage.setItem("episodeChanged", "true");
                });
              });
            }
      
            if (this.platform.is('android')) {
      
              if (sessionStorage.getItem('detailMainColor')) {
                const color = JSON.parse(sessionStorage.getItem('detailMainColor'));
                if (color.isDark) {
                  this.toolbar.nativeElement.style.setProperty('--color', 'white');
                  if (this.platform.is('android')) {
                    StatusBar.setStyle({ style: Style.Dark });
                  }
                } else {
                  this.toolbar.nativeElement.style.setProperty('--color', 'black');
                  if (this.platform.is('android')) {
                    StatusBar.setStyle({ style: Style.Light });
                  }
                }
      
                sessionStorage.removeItem('detailMainColor');
      
              } else {
                this.utils.resetStatusBarColorOfToolbar();
              }
            }
      
            this.removeAllListeners();
          });
      
          this.endHandler = await this.capacitorVideoPlayer.addListener('jeepCapVideoPlayerEnded', async () => {
            if (this.platform.is('android')) {
              this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
            }

            console.log("Ended AAAA");
      
            if (user) {
              // clearInterval(this.interval);
              // this.seconds = 0;

              if (isLogged && !episode.seen) {
                this.toggleEpisode(episode, user.token); 
              }

              this.postSeenEpisodeTime(episode.id, user.token, this.videoDuration, this.videoDuration).then(() => {
                this.zone.run(() => {
                  if (episode.seconds_seen == null) {
                    episode.seconds_seen = {};
                  }
                  episode.seconds_seen.seconds = this.videoDuration;
                  episode.seconds_seen.total_seconds = this.videoDuration;
                  episode.seconds_seen.episode = episode.id;
                  sessionStorage.setItem("episodeChanged", "true");
                });
              });
            }
      
            if (this.platform.is('android')) {
      
              if (sessionStorage.getItem('detailMainColor')) {
                const color = JSON.parse(sessionStorage.getItem('detailMainColor'));
                if (color.isDark) {
                  this.toolbar.nativeElement.style.setProperty('--color', 'white');
                  if (this.platform.is('android')) {
                    StatusBar.setStyle({ style: Style.Dark });
                  }
                } else {
                  this.toolbar.nativeElement.style.setProperty('--color', 'black');
                  if (this.platform.is('android')) {
                    StatusBar.setStyle({ style: Style.Light });
                  }
                }
                
                sessionStorage.removeItem('detailMainColor');
              } else {
                this.utils.resetStatusBarColorOfToolbar();
              }
            }
      
            this.removeAllListeners();
          });

        }).catch(() => {
          this.capacitorVideoPlayer.stopAllPlayers();
          if (this.platform.is('android')) {
            this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
          }
        });
      }).catch(() => {
        this.capacitorVideoPlayer.stopAllPlayers();
      });

  }

  removeAllListeners() {
    this.readyHandler.remove();
    this.exitHandler.remove();
    this.endHandler.remove();
  }

  getSeenEpisodeTime(episode: number, token: string) {
    return new Promise<any>((resolve, reject) => {
      const url = this.domain + '/api/v1/seen-episode-time/?episode=' + episode;
      fetch(url, {
        method: 'GET',
        headers: {
          Authorization: 'Token ' + token
        }
      }).then(response => response.json(), error => console.log(error))
        .then(data => {
          if (data.count > 0) {
            resolve(data.results[0]);
          } else {
            resolve(null);
          }
        }).catch((error) => {
          reject(error);
        });
    });
  }

  postSeenEpisodeTime(episode: number, token: string, seconds: number, total_seconds: number) {
    return new Promise<any>((resolve, reject) => {
      const url = this.domain + '/api/v1/seen-episode-time/';
      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Token ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          episode: episode,
          seconds: seconds,
          total_seconds: total_seconds
        })
      }).then(response => response.json(), error => console.log(error))
        .then(data => {
          resolve(data);
        }).catch((error) => {
          reject(error);
        });
    });
  }
  
}
