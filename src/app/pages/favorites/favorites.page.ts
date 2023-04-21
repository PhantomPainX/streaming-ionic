import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActionSheetController, IonInfiniteScroll, MenuController, ModalController, NavController, Platform } from '@ionic/angular';
import { MysqlDatabaseService } from 'src/app/services/mysql-database.service';
import { EpisodePage } from '../episode/episode.page';
import { UtilsService } from 'src/app/services/utils.service';
import { CommentPage } from 'src/app/modals/comment/comment.page';
import { PreferencesService } from 'src/app/services/preferences/preferences.service';
import { PrivateUser } from 'src/app/classes/private-user/private-user';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
})
export class FavoritesPage implements OnInit {

  @ViewChild('favInfiniteScroll') favInfiniteScroll: IonInfiniteScroll;
  @ViewChild('toolbar', { read: ElementRef }) toolbar: ElementRef;

  private isLogged: boolean = false;
  private user: PrivateUser;
  private results: any[] = [];
  private pagination: any;
  private domain: string = environment.root_url;
  private noFavAvailable: boolean = false;

  constructor(private database: MysqlDatabaseService, private modalCtrl: ModalController, 
    private actionSheetCtrl: ActionSheetController, private utils: UtilsService, private platform: Platform, 
    private navCtrl: NavController, private localStorage: PreferencesService, private menu: MenuController) {
  }

  ngOnInit() {

    setTimeout(() => {
      this.favInfiniteScroll.disabled = true;
    }, 1);

    this.platform.ready().then(async () => {

      this.isLogged = await this.localStorage.getLogged();
      if (this.isLogged) {
        this.user = await this.localStorage.getUser();
      }

      this.database.getFavoriteAnimes(this.user.token, 1).then(data => {
        this.results = data.results;

        if (this.results.length == 0) {
          this.favInfiniteScroll.disabled = true;
          this.noFavAvailable = true;
        } else {
          this.pagination = {
            'actualPage': 1,
            'hasNextPage': data.next != null
          }
          this.favInfiniteScroll.disabled = false;
        }
      });
    });
  }

  async goToAnimeDetail(anime: any) {
    this.navCtrl.navigateForward('/detail/'+anime.id);
  }

  async updateFavorites() {
    this.favInfiniteScroll.disabled = true;
    this.noFavAvailable = false;
    await this.database.getFavoriteAnimes(this.user.token, 1).then(data => {
      this.results = data.results;

      if (this.results.length == 0) {
        this.noFavAvailable = true;
        this.favInfiniteScroll.disabled = true;
      } else {
        this.pagination = {
          'actualPage': 1,
          'hasNextPage': data.next != null
        }
        this.favInfiniteScroll.disabled = false;
      }
    });
  }

  async toggleRefresh(event) {
    this.noFavAvailable = false;
    await this.updateFavorites();
    event.target.complete();
  }

  async loadMoreFavorites(event) {
    if (this.pagination.hasNextPage) {

      await this.database.getFavoriteAnimes(this.user.token, this.pagination.actualPage + 1).then(data => {
        this.results = this.results.concat(data.results);
        this.pagination = {
          'actualPage': this.pagination.actualPage + 1,
          'hasNextPage': data.next != null
        }

        event.target.complete();
      }, error => {
        console.log(error);
        // const interval = setInterval(() => {
        //   this.obtainLatestsEpisodes(this.episodesPagination.actualPage + 1).then(() => {
        //     clearInterval(interval);
        //   });
        // }, 3000);
      });
      
    } else {
      event.target.complete();
      this.favInfiniteScroll.disabled = true;
    }
  }



  // Opciones Extras

  async toggleFavorite(anime: any) {
    const loader = await this.utils.createLoaderToast("Eliminando...", "sync");
    await loader.present();

    await this.database.toggleFavoriteAnime(this.user.token, anime.id).then((added) => {

      loader.dismiss();
      if (added) {
        this.utils.showIconToast(anime.nombre+" fue agregado a tus favoritos", "heart", 2);
      } else {
        this.utils.showIconToast(anime.nombre+" fue eliminado de tus favoritos", "trash", 2);
        this.updateFavorites();
      }
    }).catch(() => {
      loader.dismiss();
    });
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
      text: 'Cerrar',
      role: 'cancel'
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
    }];
    
    if (this.isLogged) {
      buttons.push({
        text: 'Eliminar de favoritos',
        icon: 'trash',
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

  openMenu() {
    this.menu.open();
  }

}
