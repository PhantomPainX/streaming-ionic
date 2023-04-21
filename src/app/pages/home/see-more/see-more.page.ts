import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActionSheetController, IonInfiniteScroll, ModalController, NavController, Platform, PopoverController } from '@ionic/angular';
import { ProvidersPopoverComponent } from 'src/app/components/providers-popover/providers-popover.component';
import { CommentPage } from 'src/app/modals/comment/comment.page';
import { AdsService } from 'src/app/services/ads/ads.service';
import { MysqlDatabaseService } from 'src/app/services/mysql-database.service';
import { PreferencesService } from 'src/app/services/preferences/preferences.service';
import { UtilsService } from 'src/app/services/utils.service';
import { environment } from 'src/environments/environment.prod';
import { EpisodePage } from '../../episode/episode.page';

@Component({
  selector: 'app-see-more',
  templateUrl: './see-more.page.html',
  styleUrls: ['./see-more.page.scss'],
})
export class SeeMorePage implements OnInit {

  private title: string = "";
  private type: string = "";
  private layoutStyle: string = "";
  private dynamicId: string = "";
  private totalResults: number = 0;
  private noResults: boolean = false;
  private loading: boolean = true;
  private shuffling: boolean = false;

  private domain: string = environment.root_url;

  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  @ViewChild('toolbar', { read: ElementRef }) toolbar: ElementRef;

  private results: any;
  private pagination: any;
  private isLogged: boolean = false;
  private token: string = "";

  @ViewChild('sortPopover') sortPopover;
  private isSortPopoverOpened: boolean = false;
  private sortName: string = '-agregado';

  constructor(private modalCtrl: ModalController,
    private database: MysqlDatabaseService,
    private popoverCtrl: PopoverController,
    private utils: UtilsService,
    private actionSheetCtrl: ActionSheetController,
    private platform: Platform,
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private localStorage: PreferencesService,
    private admob: AdsService) {

    this.activatedRoute.queryParams.subscribe(params => {
      if (params && params.type) {
        this.type = params.type;
        this.title = params.title;
        this.layoutStyle = params.layoutStyle;
        this.dynamicId = params.dynamicId;
      }
    });
  }

  ngOnInit() {

    this.platform.ready().then(async () => {
      // if (this.platform.is('android')) {
      //   this.utils.applyStatusBarHeight(this.toolbar.nativeElement);
      // }

      this.isLogged = await this.localStorage.getLogged();
      if (this.isLogged) {
        const user = await this.localStorage.getUser();
        this.token = user.token;

        // if (!user.is_staff && !user.groups.vip && !user.groups.moderator) {
        //   this.admob.fireInterstitialAd();
        // }
      } else {
        // this.admob.fireInterstitialAd();
      }

      await this.getResults(1, this.sortName, false);
      this.loading = false;
    });
  }

  ngOnDestroy() {
    // this.admob.removeBanner();
  }

  async getResults(page: number, ordering: string, shuffle: boolean) : Promise<void> {
    if (this.type == "in-broadcast") {

      await this.database.getInBroadcast(1, ordering, shuffle, this.token).then(data => {
        this.results = data.results;
        this.totalResults = data.count;
        this.pagination = {
          'actualPage': 1,
          'hasNextPage': data.next != null,
        }
      }, error => {
        const interval = setInterval(() => {
          this.getResults(page, this.sortName, shuffle).then(() => {
            clearInterval(interval);
          });
        }, 3000);
      });

    } else if (this.type == "japanese") {

      await this.database.getAnimes(page, ordering, shuffle, this.token).then(data => {
        this.results = data.results;
        this.totalResults = data.count;
        this.pagination = {
          'actualPage': page,
          'hasNextPage': data.next != null,
        }
      }, error => {
        const interval = setInterval(() => {
          this.getResults(page, this.sortName, shuffle).then(() => {
            clearInterval(interval);
          });
        }, 3000);
      });


    } else if (this.type == "latin") {

      await this.database.getLatino(page, this.sortName, shuffle, this.token).then(data => {
        this.results = data.results;
        this.totalResults = data.count;
        this.pagination = {
          'actualPage': page,
          'hasNextPage': data.next != null,
        }
      }, error => {
        const interval = setInterval(() => {
          this.getResults(page, this.sortName, shuffle).then(() => {
            clearInterval(interval);
          });
        }, 3000);
      });

    } else if (this.type == "series") {

      await this.database.getSeries(page, this.sortName, shuffle, this.token).then(data => {
        this.results = data.results;
        this.totalResults = data.count;
        this.pagination = {
          'actualPage': page,
          'hasNextPage': data.next != null,
        }
      }, error => {
        const interval = setInterval(() => {
          this.getResults(page, this.sortName, shuffle).then(() => {
            clearInterval(interval);
          });
        }, 3000);
      });

    } else if (this.type == "latest-episodes") {
      await this.database.getLatestEpisodes(page, this.token).then(data => {
        this.results = data.results;
        this.totalResults = data.count;
        this.pagination = {
          'actualPage': page,
          'hasNextPage': data.next != null,
        }
      }, error => {
        const interval = setInterval(() => {
          this.getResults(page, this.sortName, shuffle).then(() => {
            clearInterval(interval);
          });
        }, 3000);
      });

    } else if (this.type == "genres") {

      await this.database.getAnimesByGenre(parseInt(this.dynamicId), page, this.sortName, shuffle, this.token).then(data => {
        this.results = data.results;
        this.totalResults = data.count;
        this.pagination = {
          'actualPage': page,
          'hasNextPage': data.next != null,
        }
      }, error => {
        const interval = setInterval(() => {
          this.getResults(page, this.sortName, shuffle).then(() => {
            clearInterval(interval);
          });
        }, 3000);
      });

    } else if (this.type == "types") {

      await this.database.getAnimesByType(parseInt(this.dynamicId), page, this.sortName, shuffle, this.token).then(data => {
        this.results = data.results;
        this.totalResults = data.count;
        this.pagination = {
          'actualPage': page,
          'hasNextPage': data.next != null,
        }
      }, error => {
        const interval = setInterval(() => {
          this.getResults(page, this.sortName, shuffle).then(() => {
            clearInterval(interval);
          });
        }, 3000);
      });

    } else if (this.type == "status") {

      await this.database.getAnimesByStatus(parseInt(this.dynamicId), page, this.sortName, shuffle, this.token).then(data => {
        this.results = data.results;
        this.totalResults = data.count;
        this.pagination = {
          'actualPage': page,
          'hasNextPage': data.next != null,
        }
      }, error => {
        const interval = setInterval(() => {
          this.getResults(page, this.sortName, shuffle).then(() => {
            clearInterval(interval);
          });
        }, 3000);
      });

    } else if (this.type == "languages") {

      await this.database.getAnimesByLanguage(parseInt(this.dynamicId), page, this.sortName, shuffle, this.token).then(data => {
        this.results = data.results;
        this.totalResults = data.count;
        this.pagination = {
          'actualPage': page,
          'hasNextPage': data.next != null,
        }
      }, error => {
        const interval = setInterval(() => {
          this.getResults(page, this.sortName, shuffle).then(() => {
            clearInterval(interval);
          });
        }, 3000);
      });

    } else if (this.type == "years") {

      await this.database.getAnimesByYear(this.dynamicId, page, this.sortName, shuffle, this.token).then(data => {
        this.results = data.results;
        this.totalResults = data.count;
        this.pagination = {
          'actualPage': page,
          'hasNextPage': data.next != null,
        }
      }, error => {
        const interval = setInterval(() => {
          this.getResults(page, this.sortName, shuffle).then(() => {
            clearInterval(interval);
          });
        }, 3000);
      });
    }

    if (this.results.length == 0) {
      this.noResults = true;
      //this.infiniteScroll.disabled = true;
    }
  }

  async loadMoreResults(event) {
    if (this.pagination.hasNextPage) {

      if (this.type == "in-broadcast") {

        this.database.getInBroadcast(this.pagination.actualPage + 1, this.sortName, false, this.token).then(data => {
          this.results = this.results.concat(data.results);
          this.pagination = {
            'actualPage': this.pagination.actualPage + 1,
            'hasNextPage': data.next != null,
          }
          event.target.complete();
        }, error => {
          console.log(error);
          const interval = setInterval(() => {
            this.loadMoreResults(this.pagination.actualPage + 1).then(() => {
              clearInterval(interval);
            });
          }, 3000);
        });

      } else if (this.type == "japanese") {

        this.database.getAnimes(this.pagination.actualPage + 1, this.sortName, false, this.token).then(data => {
          this.results = this.results.concat(data.results);
          this.pagination = {
            'actualPage': this.pagination.actualPage + 1,
            'hasNextPage': data.next != null,
          }
          event.target.complete();
        }, error => {
          console.log(error);
          const interval = setInterval(() => {
            this.loadMoreResults(this.pagination.actualPage + 1).then(() => {
              clearInterval(interval);
            });
          }, 3000);
        });

      } else if (this.type == "latin") {

        this.database.getLatino(this.pagination.actualPage + 1, this.sortName, false, this.token).then(data => {
          this.results = this.results.concat(data.results);
          this.pagination = {
            'actualPage': this.pagination.actualPage + 1,
            'hasNextPage': data.next != null,
          }
          event.target.complete();
        }, error => {
          console.log(error);
          const interval = setInterval(() => {
            this.loadMoreResults(this.pagination.actualPage + 1).then(() => {
              clearInterval(interval);
            });
          }, 3000);
        });

      } else if (this.type == "series") {

        this.database.getSeries(this.pagination.actualPage + 1, this.sortName, false, this.token).then(data => {
          this.results = this.results.concat(data.results);
          this.pagination = {
            'actualPage': this.pagination.actualPage + 1,
            'hasNextPage': data.next != null,
          }
          event.target.complete();
        }, error => {
          console.log(error);
          const interval = setInterval(() => {
            this.loadMoreResults(this.pagination.actualPage + 1).then(() => {
              clearInterval(interval);
            });
          }, 3000);
        });

      } else if (this.type == "latest-episodes") {

        this.database.getLatestEpisodes(this.pagination.actualPage + 1, this.token).then(data => {
          this.results = this.results.concat(data.results);
          this.pagination = {
            'actualPage': this.pagination.actualPage + 1,
            'hasNextPage': data.next != null,
          }
          event.target.complete();
        }, error => {
          console.log(error);
          const interval = setInterval(() => {
            this.loadMoreResults(this.pagination.actualPage + 1).then(() => {
              clearInterval(interval);
            });
          }, 3000);
        });

      } else if (this.type == "genres") {

        await this.database.getAnimesByGenre(parseInt(this.dynamicId), this.pagination.actualPage + 1, this.sortName, false, this.token).then(data => {
          this.results = this.results.concat(data.results);
          this.pagination = {
            'actualPage': this.pagination.actualPage + 1,
            'hasNextPage': data.next != null,
          }
          event.target.complete();
        }, error => {
          const interval = setInterval(() => {
            this.loadMoreResults(this.pagination.actualPage + 1).then(() => {
              clearInterval(interval);
            });
          }, 3000);
        });
  
      } else if (this.type == "types") {

        await this.database.getAnimesByType(parseInt(this.dynamicId), this.pagination.actualPage + 1, this.sortName, false, this.token).then(data => {
          this.results = this.results.concat(data.results);
          this.pagination = {
            'actualPage': this.pagination.actualPage + 1,
            'hasNextPage': data.next != null,
          }
          event.target.complete();
        }, error => {
          const interval = setInterval(() => {
            this.loadMoreResults(this.pagination.actualPage + 1).then(() => {
              clearInterval(interval);
            });
          }, 3000);
        });

      } else if (this.type == "status") {

        await this.database.getAnimesByStatus(parseInt(this.dynamicId), this.pagination.actualPage + 1, this.sortName, false, this.token).then(data => {
          this.results = this.results.concat(data.results);
          this.pagination = {
            'actualPage': this.pagination.actualPage + 1,
            'hasNextPage': data.next != null,
          }
          event.target.complete();
        }, error => {
          const interval = setInterval(() => {
            this.loadMoreResults(this.pagination.actualPage + 1).then(() => {
              clearInterval(interval);
            });
          }, 3000);
        });

      } else if (this.type == "languages") {

        await this.database.getAnimesByLanguage(parseInt(this.dynamicId), this.pagination.actualPage + 1, this.sortName, false, this.token).then(data => {
          this.results = this.results.concat(data.results);
          this.pagination = {
            'actualPage': this.pagination.actualPage + 1,
            'hasNextPage': data.next != null,
          }
          event.target.complete();
        }, error => {
          const interval = setInterval(() => {
            this.loadMoreResults(this.pagination.actualPage + 1).then(() => {
              clearInterval(interval);
            });
          }, 3000);
        });

      } else if (this.type == "years") {

        await this.database.getAnimesByYear(this.dynamicId, this.pagination.actualPage + 1, this.sortName, false, this.token).then(data => {
          this.results = this.results.concat(data.results);
          this.pagination = {
            'actualPage': this.pagination.actualPage + 1,
            'hasNextPage': data.next != null,
          }
          event.target.complete();
        }, error => {
          const interval = setInterval(() => {
            this.loadMoreResults(this.pagination.actualPage + 1).then(() => {
              clearInterval(interval);
            });
          }, 3000);
        });
      }

    } else {
      event.target.complete();
      this.infiniteScroll.disabled = true;
    }
  }

  async goToAnimeDetail(anime: any) {
    this.navCtrl.navigateForward('/detail/'+anime.id);
  }

  async openProviders(event, episode) {

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

  close() {
    this.navCtrl.back();
  }

  async toggleRefresh(event) {
    this.results = undefined;
    await this.getResults(1, this.sortName, false);
    event.target.complete();
  }


  // Opciones Extras

  async toggleFavorite(anime: any) {
    const loader = await this.utils.createLoaderToast("Espera un momento...", "sync");
    await loader.present();

    await this.database.toggleFavoriteAnime(this.token, anime.id).then((added) => {

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

    await this.database.toggleSeenEpisode(this.token, episode.id).then((added) => {

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
    }, {
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
    }];

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
      mode: "ios"
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
    }, {
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
      buttons: buttons,
      mode: "ios"
    });
    await actionSheet.present();
  }

  openSortPopover(e: Event) {
    this.sortPopover.event = e;
    this.isSortPopoverOpened = true;
  }

  sort(sortName) {
    this.sortName = sortName;
    this.isSortPopoverOpened = false;
    this.results = null;
    this.getResults(1, sortName, false);
  }

  async shuffle() {
    this.shuffling = true;
    await this.getResults(1, this.sortName, true);
    this.shuffling = false;
  }

}
