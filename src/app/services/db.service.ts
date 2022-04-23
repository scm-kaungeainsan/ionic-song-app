
import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Song } from './song';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
@Injectable({
  providedIn: 'root'
})
export class DbService {
  private storage: SQLiteObject;
  songsList = new BehaviorSubject([]);
  private isDbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  options: any = {
    name: 'db_name.db',
    location: 'default'
  }
  private db: SQLiteObject;
  private isOpen: boolean;
  theConsole: string = "Console Messages";
  constructor(
    private platform: Platform,
    private sqlite: SQLite,
    private httpClient: HttpClient,
    private sqlPorter: SQLitePorter,
  ) {
    console.log('Hello DatabaseProvider Provider');
    this.getFakeData();
    // this.connectToDb();
    // this.platform.ready().then(() => {
    //   this.sqlite.create({
    //     name: 'positronx_db.db',
    //     location: 'default'
    //   })
    //   .then((db: SQLiteObject) => {
    //       this.storage = db;
    //       this.getFakeData();
    //   });
    // });
  }

  private connectToDb(): void {
    this.sqlite = new SQLite();
    this.sqlite.create(this.options)
      .then((db: SQLiteObject) => {
        this.db = db;
        this.isOpen = true;
        console.log('Hello DatabaseProvider connected to db');
        this.createTables();
      })
      .catch(e => {
        this.theConsole += JSON.stringify(e);
        console.log(this.getConsoleMessages());
      });

  }

  private createTables(): void {
    this.createTableContatti();
  }

  private createTableContatti(): void {
    var sql = 'create table IF NOT EXISTS contatti(id_contatto INTEGER PRIMARY KEY AUTOINCREMENT,nome TEXT, data_nascita TEXT)';
    this.db.executeSql(sql)
      .then(() => {
        this.theConsole += 'Executed SQL' + sql
        console.log(this.getConsoleMessages());
      })
      .catch(e => {
        this.theConsole += "Error: " + JSON.stringify(e)
        console.log(this.getConsoleMessages());
      });
  }
  getConsoleMessages(): any {
    throw new Error('Method not implemented.');
  }


  dbState() {
    return this.isDbReady.asObservable();
  }

  fetchSongs(): Observable<Song[]> {
    return this.songsList.asObservable();
  }
  // Render fake data
  getFakeData() {
    this.httpClient.get(
      'assets/dump.sql',
      { responseType: 'text' }
    ).subscribe(data => {
      console.log(data)
      this.sqlPorter.importSqlToDb(this.storage, data)
        .then(_ => {
          console.log('Enter')
          this.getSongs();
          this.isDbReady.next(true);
        })
        .catch(error => console.error(error));
    });
  }
  // Get list
  getSongs() {
    console.log('getting song')
    return this.storage.executeSql('SELECT * FROM songtable', []).then(res => {
      console.log(res)
      let items: Song[] = [];
      if (res.rows.length > 0) {
        for (var i = 0; i < res.rows.length; i++) {
          items.push({
            id: res.rows.item(i).id,
            artist_name: res.rows.item(i).artist_name,
            song_name: res.rows.item(i).song_name
          });
        }
      }
      this.songsList.next(items);
    });
  }
  // Add
  addSong(artist_name, song_name) {
    let data = [artist_name, song_name];
    return this.storage.executeSql('INSERT INTO songtable (artist_name, song_name) VALUES (?, ?)', data)
      .then(res => {
        this.getSongs();
      });
  }

  // Get single object
  getSong(id): Promise<Song> {
    return this.storage.executeSql('SELECT * FROM songtable WHERE id = ?', [id]).then(res => {
      return {
        id: res.rows.item(0).id,
        artist_name: res.rows.item(0).artist_name,
        song_name: res.rows.item(0).song_name
      }
    });
  }
  // Update
  updateSong(id, song: Song) {
    let data = [song.artist_name, song.song_name];
    return this.storage.executeSql(`UPDATE songtable SET artist_name = ?, song_name = ? WHERE id = ${id}`, data)
      .then(data => {
        this.getSongs();
      })
  }
  // Delete
  deleteSong(id) {
    return this.storage.executeSql('DELETE FROM songtable WHERE id = ?', [id])
      .then(_ => {
        this.getSongs();
      });
  }
}