import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { PreferencesService } from '../../preferences/preferences.service';

@Injectable({
  providedIn: 'root'
})
export class AnimeuiService {

  private domain = environment.root_url;

  constructor(private localStorage: PreferencesService) { }

  async getEmbeds(anime_name: string, ep_number: number) {
    
    return new Promise<any>(async (resolve, reject) => {

      const isLogged = await this.localStorage.getLogged();
      let name = anime_name.replace(/ /g, "+").toLowerCase();

      const options: HttpOptions = {
        url: "https://animeui.com/?s=" + name,
        readTimeout: 10000,
        connectTimeout: 10000
      }

      await CapacitorHttp.get(options).then(async (response) => {
        const content = response.data;
        const parser = new DOMParser();
        const html = parser.parseFromString(content, "text/html");
        
        const anime_links = html.querySelectorAll("a.tip");
        //busca el anime_link que contenga el nombre del anime
        let anime_link = "";
        for (let link of anime_links) {
          if (link.querySelector("h2").innerText.toLowerCase() == anime_name.toLowerCase()) {
            anime_link = link['href'];
            break;
          }
        }
        
        //crea episode_link reemplazando el ultimo / por - + episodio-ep_number
        const episode_link = anime_link.replace(/\/$/, "") + "-episodio-" + ep_number;
        
        const ep_request_options = {
          url: episode_link,
          readTimeout: 10000,
          connectTimeout: 10000
        }

        await CapacitorHttp.get(ep_request_options).then(async (response) => {

          const content = response.data;
          const parser = new DOMParser();
          const html = parser.parseFromString(content, "text/html");
          
          const select_options = html.querySelectorAll("select.mirror option");
          const mirrors = [];
          for (let i = 0; i < select_options.length; i++) {
            //decode base64 value
            if (select_options[i]['value'] != "") {

              //extrae el iframe del value, controla el error cuando no hay iframe
              try {
                const option_name = select_options[i]['innerText'];

                const decoded = atob(select_options[i]['value']);
                const embed_parser = new DOMParser();
                const embed = embed_parser.parseFromString(decoded, "text/html");
                const iframe_src = embed.querySelector("iframe")['src'];
                mirrors.push({
                  embed: option_name,
                  url: iframe_src
                });
              } catch (error) {
                console.log(error);
              }
              
            }
          }

          if (!isLogged) {
            resolve(mirrors);
          } else {
            const user = await this.localStorage.getUser();
            if (user.email == "gtester@dangoanime.com") {
              resolve([]);
            } else {
              resolve(mirrors);
            }
          }

        }).catch(error => {
          reject(error);
        });
      }).catch(error => {
        reject(error);
      });
    });
    
  }
}
