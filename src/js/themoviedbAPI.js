'use strict';

export class TheMoviebdhAPI {
  #BASE_URL = 'https://api.themoviedb.org/3';
  #API_KEY = '9f2bc6dc8b2f46ed6de79a15158912b2';

  constructor(keyword = null) {
    this.page = 1;
    this.keyword = "go";
    this.watched=[];
    this.queue =[];
    this.genres = [];
    this.selected = "watched"; // "queue"
    this.getGenresList();
  }

  getFavoriteFilms() {   
    return fetch(`${this.#BASE_URL}/trending/movie/week?api_key=${this.#API_KEY}&page=${this.page}`).then(
      response => {
        if (!response.ok) {
          throw new Error(response.status);
        }
        return response
          .json()
          .then(result => {            
            for (let index = 0; index < result.results.length; index++) {
              result.results[index].genre_ids = result.results[index].genre_ids.map(el =>
                this.decodeGenre(el),
              );
              result.results[index].release_date = this.decodeYear(
                result.results[index].release_date,
              );
            }           
            return result;
          })
          .catch(err => {
            console.log(err)});
      },
    );
  }

  searchFilms() {    
    return fetch(
      `${this.#BASE_URL}/search/movie?query=${this.keyword}&page=${this.page}&api_key=${
        this.#API_KEY
      }`,
    )
      .then(response => {
        if (!response.ok) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(result => {
        for (let index = 0; index < result.results.length; index++) {
          result.results[index].genre_ids = result.results[index].genre_ids.map(el =>
            this.decodeGenre(el),
          );
          result.results[index].release_date = this.decodeYear(result.results[index].release_date);
        }
                return result;
      })
      .catch(err => {
        console.log(err)});
  }

  getGenresList() {
    return fetch(`${this.#BASE_URL}/genre/movie/list?api_key=${this.#API_KEY}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(result => (this.genres = result.genres))
      .catch(err => console.log(err));
  }

  searchFilmsCompletes (movieId) {
    return fetch(
      'https://api.themoviedb.org/3/movie/' + movieId + '?api_key=9f2bc6dc8b2f46ed6de79a15158912b2',
    )
      .then(response => {
        if (!response.ok) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(result => {        
        result.genres = result.genres.map(el => el.name);
        result.release_date = this.decodeYear(result.release_date);        
        return result;
      })
      .catch(err => console.log(err));
  }

  decodeGenre(idGenre) {
    return this.genres.find(el => el.id === idGenre).name;
  }

  decodeYear(dateText) {
    const date = new Date(dateText);
    return date.getFullYear();
  }
  
}
