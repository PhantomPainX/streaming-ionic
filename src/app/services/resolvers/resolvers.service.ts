import { Injectable } from '@angular/core';
import { UtilsService } from '../utils.service';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ResolversService {

  private obfuscate: any;
  private domain: string = environment.root_url;

  constructor(private utils: UtilsService) {
  }


  async checkVideoAvailability(raw_url: string, referer: string) {
    const loader = await this.utils.createIonicLoader("Validando...");
    await loader.present();

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        loader.dismiss();
        resolve(true);
      }, 2000);
    });
  }

  async fembedResolver(url_orig: string) {
    const loader = await this.utils.createIonicLoader("Cargando videos...");
    await loader.present();

    let url = url_orig.replace("fembed.com", "vanfem.com").replace("/v/", "/api/source/");

    return new Promise((resolve, reject) => {
      //hacer una peticion a la url con el plugin cordova-plugin-http con post 

      const options: HttpOptions = {
        url: url,
        headers: { 
          'Content-Type': 'application/json',
          'Referer': url
        }
      };

      CapacitorHttp.post(options).then(res => {
        const mVideos = res.data.data; //bruh
        var videos = [];
        if (!Array.isArray(mVideos)) {
          reject("No se encontraron videos");
          loader.dismiss();
          return false;
        }

        for (let video of mVideos) {
          videos.push({
            'label': video.label,
            'file': video.file,
            'headers': {
              Referer: url
            },
            'kind': "video"
          });
        }
        console.log("FEMBED VIDEOS: " + JSON.stringify(videos));
        loader.dismiss();
        resolve(videos);

      }).catch(err => {
        loader.dismiss(); 
        reject(err);
      });
    });
  }

  async uqloadResolver(urlxd: string) {
    const loader = await this.utils.createIonicLoader("Cargando videos...");
    await loader.present();

    return new Promise((resolve, reject) => {

      const options: HttpOptions = {
        url: urlxd,
        headers: {
          'Content-Type': 'video/mp4',
          'Referer': urlxd
        },
        readTimeout: 10000,
        connectTimeout: 10000
      };

      CapacitorHttp.get(options).then(data => {
        const html = data.data;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        let scripts = doc.querySelectorAll('script');
        let videoLink = '';
        scripts.forEach(script => {
          let scriptText = script.innerText;
          if (scriptText.includes("var player = new Clappr.Player")) {
            videoLink = scriptText.split('\"')[1];
          }
        });
        var url = videoLink;
        const document = [{
          'label': 'HD',
          'file': url,
          'headers': {
            Referer: urlxd
          },
          'kind': "video"
        }];
        loader.dismiss();
        resolve(document);
      }).catch(err => {
        loader.dismiss();
        reject(err);
      });
    });
  }

  async youruploadResolver(url: string) {
    const loader = await this.utils.createIonicLoader("Cargando videos...");
    await loader.present();

    return new Promise(async (resolve, reject) => {

      const options: HttpOptions = {
        url: url,
        headers: {
          'Content-Type': 'video/mp4',
          'Referer': url
        },
        readTimeout: 10000,
        connectTimeout: 10000
      };

      CapacitorHttp.get(options).then(data => {
        const html = data.data;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        let scripts = doc.querySelectorAll('script');
        let scriptWithVideo = '';
        for (let script of scripts) {
          let scriptText = script.innerText;
          if (scriptText.includes("var jwplayerOptions")) {
            scriptWithVideo = scriptText;
          }
        }
        const array = scriptWithVideo.split('\'');
        let vid = array.filter(item => item.includes(".mp4"));
        if (vid.length == 0) {
          loader.dismiss();
          reject("No se encontraron videos");
          return;
        }
        const document = [{
          'label': 'Normal',
          'file': vid[0],
          'headers': {
            Referer: url
          },
          'kind': "video"
        }];
        loader.dismiss();
        resolve(document);
      }).catch(err => {
        loader.dismiss();
        reject(err);
      });
    });
  }

  async okruResolver(url: string) {
    const loader = await this.utils.createIonicLoader("Cargando videos...");
    await loader.present();

    return new Promise((resolve, reject) => {

      const options: HttpOptions = {
        url: url,
        readTimeout: 10000,
        connectTimeout: 10000
      };

      CapacitorHttp.get(options).then(data => {
        const html = data.data;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        var okData = doc.querySelector('div[data-module=\"OKVideo\"');
        //get data-options of div
        var okDataOptions = okData.getAttribute('data-options');
        var jsonOptions = JSON.parse(okDataOptions);
        var metadata = jsonOptions.flashvars.metadata;
        var formattedMeta = JSON.parse(metadata);
        var mVideos = formattedMeta.videos;
        var videos = [];
        mVideos.forEach(video => {
          video.name = video.name.toLowerCase()
            .replace('mobile', '144p')
            .replace('lowest', '240p')
            .replace('low', '360p')
            .replace('sd', '480p')
            .replace('hd', '720p')
            .replace('full', '1080p')
            .replace('quad', '1440p')
            .replace('ultra', '4K');

          videos.push({
            'label': video.name,
            'file': video.url,
            'headers': {
              Referer: url
            },
            'kind': "video"
          });
        });

        const document = videos;
        loader.dismiss();
        resolve(document);
      }).catch(err => {
        loader.dismiss();
        reject(err);
      });
    });
  }

  async mailRuResolver(url: string) {
    const loader = await this.utils.createIonicLoader("Cargando videos...");
    await loader.present();

    return new Promise((resolve, reject) => {

      let urlFix = url.replace('https://my.mail.ru/video/embed/', '');
      // urlFix = urlFix.substring(0, urlFix.indexOf('#'));
      const final_url = "https://my.mail.ru/+/video/meta/" + urlFix;

      const options: HttpOptions = {
        url: final_url,
        readTimeout: 10000,
        connectTimeout: 10000
      };

      CapacitorHttp.get(options).then(data => {
        const json = data.data;
        let videos = [];
        json.videos.forEach(video => {
          videos.push({
            'label': video.key,
            'file': "https:" + video.url,
            'headers': {
              Referer: url
            },
            'kind': "video"
          });
        });

        const document = videos;
        loader.dismiss();
        resolve(document);
      }).catch(err => {
        loader.dismiss();
        reject(err);
      });
    });
  }

  async aFenixResolver(url: string) {
    const loader = await this.utils.createIonicLoader("Cargando videos...");
    await loader.present();

    return new Promise((resolve, reject) => {
      const options: HttpOptions = {
        url: url,
        headers: {
          'Referer': url
        },
        readTimeout: 10000,
        connectTimeout: 10000
      };

      CapacitorHttp.get(options).then(res => {
        console.log("AFENIX: ",res);

        const content = res.data;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");

        let scripts = doc.querySelectorAll('script');
        scripts.forEach(script => {
          let scriptText = script.innerText;
          if (scriptText.includes("player.setup")) {
            //transform to json
            let json = scriptText.split('sources: ')[1];
            json = json.split('}]')[0] + "}]";
            var document = JSON.parse(json);

            document.forEach(video => {
              delete video.type;
              video.headers = {
                Referer: url
              },
              video.kind = "video"
            });

            //check if there is at least one "file" in document
            if (document.some(video => video.file)) {
              loader.dismiss();
              resolve(document);
              return;
            } else {
              loader.dismiss();
              reject("No videos found");
              return;
            }
          }
        });

      }).catch(err => {
        loader.dismiss(); 
        reject(err);
      }).finally(() => {
        loader.dismiss();
      });
    });
  }

  async streamsbResolver(url: string) {
    let id = url.split('/').pop();
    if (id.includes('.html')) {
      id = id.split('.html').shift();
    }

    let id_streamsb = "||" + id + "||||streamsb";
    let bytes = new Uint8Array(id_streamsb.length);
    for (let i = 0; i < id_streamsb.length; i++) {
      bytes[i] = id_streamsb.charCodeAt(i);
    }
    let hex_id = '';
    for (let i = 0; i < bytes.length; i++) {
      hex_id += bytes[i].toString(16);
    }

    const final_url = ("https://streamsb.net/sources48/" + hex_id).toLowerCase();

    const loader = await this.utils.createIonicLoader("Cargando videos...");
    await loader.present();

    return new Promise((resolve, reject) => {

      const options: HttpOptions = {
        url: final_url,
        readTimeout: 10000,
        connectTimeout: 10000,
        headers: {
          'Referer': url,
          'watchsb': 'sbstream'
        }
      };

      CapacitorHttp.get(options).then(data => {
        const json = data.data;
        console.log("STREAMSB: ", JSON.stringify(json));
        let videos = [];
        videos.push({
          'label': 'HD',
          'file': json.stream_data.file,
          'headers': {
            watchsb: 'sbstream'
          },
          'kind': "video"
        });

        const document = videos;
        loader.dismiss();
        resolve(document);
      }).catch(err => {
        loader.dismiss();
        reject(err);
      });
    });
  }

  async mp4uploadResolver(url: string) {
    const loader = await this.utils.createIonicLoader("Cargando videos...");
    await loader.present();

    return new Promise((resolve, reject) => {
      const options: HttpOptions = {
        url: url,
        readTimeout: 10000,
        connectTimeout: 10000
      };

      CapacitorHttp.get(options).then(data => {
        const content = data.data;
        const regex = /mp4\|video\|([a-z0-9]+)\|([0-9]+)\|src\|videojs/;
        const regexResult = regex.exec(content);
        console.log("MP4UPLOAD REGEX: ", regexResult[1]);

        let videos = [];
        videos.push({
          'label': 'HD',
          'file': "https://s4.mp4upload.com:282/d/" + regexResult[1] + "/video.mp4",
          'headers': {
            Referer: "https://s4.mp4upload.com:282/d/" + regexResult[1] + "/video.mp4"
          },
          'kind': "video"
        });

        const document = videos;
        loader.dismiss();
        resolve(document);

      }).catch(err => {
        loader.dismiss();
        reject(err);
      });
    });
  }

  async animeuiResolver(url: string) {

    const loader = await this.utils.createIonicLoader("Cargando videos...");
    await loader.present();

    return new Promise((resolve, reject) => {
      const options: HttpOptions = {
        url: url,
        readTimeout: 10000,
        connectTimeout: 10000
      };

      CapacitorHttp.get(options).then(data => {
        const content = data.data;
        const dom = new DOMParser().parseFromString(content, "text/html");
        const scripts = dom.querySelectorAll('script');
        var eval_function = "";
        for (let script of scripts) {
          if (script.innerText.includes("function(p,a,c,k,e,d)")) {
            eval_function = script.innerText;
            break;
          }
        }

        CapacitorHttp.post({
          url: this.domain + "/api/v1/eval-unpack/",
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            eval: eval_function
          },
          readTimeout: 10000,
          connectTimeout: 10000
        }).then(res => {
          const data = res.data.eval;
          let json = data.split('sources: ')[1];
          json = json.split('}]')[0] + "}]";
          const parsed_json = JSON.parse(json);

          let videos = [];
          for (let video of parsed_json) {
            videos.push({
              label: video.label,
              file: video.file,
              headers: {
                Referer: video.file
              },
              kind: "video"
            });
          }

          const document = videos;
          console.log("ANIMEUI: " + JSON.stringify(document));
          loader.dismiss();
          resolve(document);
          
        }).catch(err => {
          reject(err);
          loader.dismiss();
        });


      }).catch(err => {
        loader.dismiss(); 
        reject(err);
      });
    });

  }

  async streamtapeResolver(url: string): Promise<any> {

    const loader = await this.utils.createIonicLoader("Cargando videos...");
    await loader.present();

    return new Promise<any>(async (resolve, reject) => {

      if (url.includes("/e/")) {
        url = url.replace("/e/", "/v/");
      }

      const options: HttpOptions = {
        url: url,
        headers: {
          Referer: "https://streamtape.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36"
        },
        readTimeout: 10000,
        connectTimeout: 10000,
      }

      await CapacitorHttp.get(options).then(async (response) => {
        const content = response.data;
        const parser = new DOMParser();
        const html = parser.parseFromString(content, "text/html");
        var videoUrl = html.querySelector("#norobotlink").innerHTML;
        const scripts = html.querySelectorAll('script');
        const regex = /token=([a-zA-Z0-9_-]+)/;
        let token = "";
        for (let script of scripts) {
          if (script.innerHTML.includes("document.getElementById('norobotlink').innerHTML")) {
            token = regex.exec(script.innerHTML)[0];
            break;
          }
        }

        if (token != "") {
          videoUrl = videoUrl.replace(/token=[a-zA-Z0-9_-]+/, token);
        }

        let video = (videoUrl.replace("/streamtape", "https://streamtape") + "&stream=1").replace(/&amp;/g, "&");

        const document = [{
          label: "Normal",
          file: video,
          headers: {
            Referer: video
          },
          kind: "video"
        }];
        loader.dismiss();
        resolve(document);

      }).catch(error => {
        loader.dismiss();
        reject(error);
      });

    });

  }

  async jwplayerResolver(url: string): Promise<any> {

    const loader = await this.utils.createIonicLoader("Cargando videos...");
    await loader.present();

    return new Promise<any>(async (resolve, reject) => {

      // url is https://cdn.jwplayer.com/players/qBfxB8ny-R0YaOnjV extract qBfxB8ny
      const regex = /players\/([a-zA-Z0-9_-]+)/;
      const ids = regex.exec(url)[1];
      const playerid = ids.split("-")[0];
      console.log(playerid);

      const options: HttpOptions = {
        url: "https://content.jwplatform.com/v2/media/"+playerid,
        readTimeout: 10000,
        connectTimeout: 10000,
      }

      await CapacitorHttp.get(options).then(async (response) => {
        const content = response.data;
        const sources = content.playlist[0].sources;
        let document = [];
        if (sources.length > 0) {
          for (let source of sources) {
            if (source.type == "video/mp4") {
              let label = "";
              if (!source.label) {
                label = "Normal";
              } else {
                label = source.label;
              }
              document.push({
                label: label,
                file: source.file,
                headers: {
                  Referer: url
                },
                kind: "video"
              });
            }
          }

          const tracks = content.playlist[0].tracks;
          if (tracks) {
            if (tracks.length > 0) {
              for (let track of tracks) {
                if (track.kind == "captions") {
                  document.push({
                    label: track.label,
                    file: track.file,
                    kind: track.kind
                  });
                }
              }
            }
          }
        } else {
          reject("No se encontraron videos");
        }

        loader.dismiss();
        resolve(document);

      }).catch(error => {
        loader.dismiss();
        reject(error);
      });

    });

  }

  

}
