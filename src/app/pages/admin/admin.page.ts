import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { PrivateUser } from 'src/app/classes/private-user/private-user';
import { PreferencesService } from 'src/app/services/preferences/preferences.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {

  private user: PrivateUser;
  private isLogged: boolean = true;
  constructor(private platform: Platform, private localStorage: PreferencesService) { }

  ngOnInit() {
    this.platform.ready().then(async () => {
      this.isLogged = await this.localStorage.getLogged();
      if (this.isLogged) {
        this.user = await this.localStorage.getUser();
      }
    });
  }

}
