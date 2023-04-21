import { Component, ElementRef, Input, KeyValueDiffers, OnInit, ViewChild } from '@angular/core';
import { ModalController, Platform, PopoverController } from '@ionic/angular';
import { MysqlDatabaseService } from 'src/app/services/mysql-database.service';
import { IonInfiniteScroll } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { CommentPage } from 'src/app/modals/comment/comment.page';
import { PreferencesService } from 'src/app/services/preferences/preferences.service';
import { PrivateUser } from 'src/app/classes/private-user/private-user';
import { AdsService } from 'src/app/services/ads/ads.service';
import { ProvidersPopoverComponent } from 'src/app/components/providers-popover/providers-popover.component';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-episode',
  templateUrl: './episode.page.html',
  styleUrls: ['./episode.page.scss'],
})
export class EpisodePage implements OnInit {

  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  @ViewChild(CdkVirtualScrollViewport) viewPort: CdkVirtualScrollViewport;
  @ViewChild('toolbar', { read: ElementRef }) toolbar: ElementRef;
  @ViewChild('searchBar', { read: ElementRef }) searchBar: ElementRef;
  @Input() anime: any;
  @Input() totalEpisodes: number = 0;
  @Input() searchEp: number;
  private mediaUrl: string;
  private searchBarValue;
  public searchedEpisode: any[] = [];
  public currentEpisodes: number;
  public nextToSee: any = null;
  private objDiffer: any;
  private domain: string = environment.root_url;

  private checkingEpisodes: boolean;
  private isLogged: boolean = false;
  private user: PrivateUser;

  @ViewChild('sortPopover') sortPopover;
  private isSortPopoverOpened: boolean = false;
  private sortName: string = 'ultimos';

  constructor(private database: MysqlDatabaseService, private modalCtrl: ModalController, private popoverCtrl: PopoverController, 
    private utils: UtilsService, private platform: Platform, private localStorage: PreferencesService, 
    private admob: AdsService, private differs:  KeyValueDiffers) {
    this.mediaUrl = this.database.animeMedia;
  }

  ngOnInit() {

    this.platform.ready().then(async () => {

      this.isLogged = await this.localStorage.getLogged();
      if (this.isLogged) {
        this.user = await this.localStorage.getUser();
        // if (!this.user.is_staff && !this.user.groups.moderator && !this.user.groups.vip) {
        //   this.admob.fireInterstitialAd();
        // }

        this.checkingEpisodes = true;
        this.anime.episodios.forEach(episode => {
          episode.seen = false;
        });

        this.database.checkSeenEpisodes(this.user.token, this.anime.id).then(data => {
          this.anime.episodios.forEach(episode => {
            data.forEach(seenEpisode => {
              if (episode.id == seenEpisode.episodio) {
                episode.seen = true;
                return;
              }
            });
          });
          this.totalEpisodes = this.anime.episodios.length;
          this.checkingEpisodes = false;
          console.log(this.searchEp)
          if (this.searchEp != undefined) {
            this.search(this.searchEp);
          }

          this.anime.episodios.sort((a, b) => {
            return b.numero - a.numero;
          });
          this.searchedEpisode = this.anime.episodios;
          this.currentEpisodes = this.searchedEpisode.length;

          this.checkNextToSeeEpisode();

          this.objDiffer = {};
          this.anime.episodios.forEach((elt) => {
            this.objDiffer[elt] = this.differs.find(elt).create();
          });


        });
      } else {
        this.checkingEpisodes = false;
        if (this.searchEp != undefined) {
          this.search(this.searchEp);
        }

        this.anime.episodios.sort((a, b) => {
          return b.numero - a.numero;
        });
        this.searchedEpisode = this.anime.episodios
        this.currentEpisodes = this.searchedEpisode.length;
        // this.admob.fireInterstitialAd();
      }

    });
  
  }

  ngDoCheck() {
    this.anime.episodios.forEach(elt => {
      try {
        var objDiffer = this.objDiffer[elt];
        var objChanges = objDiffer.diff(elt);

        if (objChanges) {
          objChanges.forEachChangedItem((elt) => {
            if (elt.key === 'seen' && elt.currentValue != null) {
              this.checkNextToSeeEpisode();
            }
          });
        }
      } catch (error) {}
    });
  }

  async checkNextToSeeEpisode() {
    let lastSeen = this.anime.episodios.filter((episode: { seen: boolean; }) => episode.seen === true
    ).sort((a, b) => {
      return b.numero - a.numero;
    })[0];
    
    if (lastSeen) {
      if (lastSeen.numero == this.totalEpisodes) {
        this.nextToSee = null;
      } else {
        if (this.anime.episodios.filter((episode: { seen: boolean; }) => episode.seen === false).length == 0) {
          this.nextToSee = null;
        } else {
          this.nextToSee = this.anime.episodios.filter(episode => episode.numero == lastSeen.numero + 1)[0];
        }
      }
    } else {
      this.nextToSee = this.anime.episodios.filter(episode => episode.numero == 1)[0];
    }
  }

  async toggleEpisode(episode: any) {
    const save_seen = episode.seen;
    episode.seen = null;
    await this.database.toggleSeenEpisode(this.user.token, episode.id).then((added) => {
      
      if (added) {
        episode.seen = true;
      } else {
        episode.seen = false;
      }

      Haptics.impact({ style: ImpactStyle.Light });
    }).catch(error => {
      episode.seen = save_seen;
      console.log(error);
    });
    // await loader.dismiss();
  }

  async openProviders(event, episode) {

    episode['anime'] = {
      nombre: this.anime.nombre,
      imagen: this.anime.imagen,
    };
    const popover = await this.popoverCtrl.create({
      component: ProvidersPopoverComponent,
      cssClass: "custom-popover",
      event: event,
      componentProps: {
        episode: episode,
      }
    });

    await popover.present();
  }

  async openProvidersDownload(event, episode) {

    episode['anime'] = {
      nombre: this.anime.nombre,
      imagen: this.anime.imagen,
    };
    const popover = await this.popoverCtrl.create({
      component: ProvidersPopoverComponent,
      cssClass: "custom-popover",
      event: event,
      componentProps: {
        download: true,
        episode: episode,
      }
    });

    await popover.present();
  }

  close() {
    this.modalCtrl.dismiss();
  }

  search(numero) {
    this.searchBarValue = numero;
    if (numero.length > 0) {
      let position = this.anime.episodios.findIndex(episode => episode.numero == numero);
      console.log(position);
      if (position > -1) {
        this.viewPort.scrollToIndex(position);
      }
    }

  }

  loadMoreEpisodes(event) {
    if (this.searchedEpisode.length === this.anime.episodios.length) {
      event.target.disabled.true;
      this.disableInfiniteScroll();
    } else {
      this.searchedEpisode.push(...this.anime.episodios.slice(this.currentEpisodes, this.currentEpisodes + 20));
      this.currentEpisodes = this.searchedEpisode.length;
      event.target.complete();
    }
  }

  disableInfiniteScroll() {
    this.infiniteScroll.disabled = true;
  }

  enableInfiniteScroll() {
    this.infiniteScroll.disabled = false;
  }

  openComments(episode) {
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

  openSortPopover(e: Event) {
    this.sortPopover.event = e;
    this.isSortPopoverOpened = true;
  }

  sort(sortName) {
    this.sortName = sortName;
    this.isSortPopoverOpened = false;
    
    if (sortName == 'ultimos') {
      console.log('ultimos');
      // this.anime.episodios.sort((a, b) => {
      //   return b.numero - a.numero;
      // });
      this.searchedEpisode = [...this.searchedEpisode.sort((a, b) => b.numero - a.numero)]
    } else if (sortName == 'antiguos') {
      console.log('antiguos');
      // this.anime.episodios.sort((a, b) => {
      //   return a.numero - b.numero;
      // });
      this.searchedEpisode = [...this.searchedEpisode.sort((a, b) => a.numero - b.numero)]
    }
    this.currentEpisodes = this.searchedEpisode.length;
  }

  randomEpisode() {
    let episode = this.anime.episodios[Math.floor(Math.random() * this.anime.episodios.length)];
    this.openProviders(null, episode);
  }

  randomEpisodeNotSeen() {
    let episode = null;
    episode = this.anime.episodios.filter((episode: { seen: boolean; }) => episode.seen === false)[Math.floor(Math.random() * this.anime.episodios.filter((episode: { seen: boolean; }) => episode.seen === false).length)];
    if (episode != null) {
      this.openProviders(null, episode);
      this.utils.showToast('Episodio aleatorio no visto', 1, false);
    } else {
      this.utils.showToast('No hay episodios no vistos', 1, false);
    }
  }

}
