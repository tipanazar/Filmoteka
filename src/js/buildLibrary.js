'use strict';

import { TheMoviebdhAPI } from './themoviedbAPI';
import libraryCardTemplate from '../templates/library-gallery-elements.hbs';
import movieDetails from '../templates/modal-movie-card.hbs';
import Pagination from 'tui-pagination';
import 'tui-pagination/dist/tui-pagination.css';

const container = document.getElementById('pagination');
const btnLibraryWatchedEl = document.querySelector('.watched-button');
const btnLibraryQueueEl = document.querySelector('.queue-button');
const libraryListEl = document.querySelector('.library');
const backdropEl = document.querySelector('.backdrop');
const scrollUpBtn = document.querySelector('button.btn-back-to-top');
const modalBox = document.querySelector('.modal-card-container');
const modalCloseBtn = document.querySelector('.modal-btn-close');

btnLibraryWatchedEl.addEventListener('click', getLocaleWatched);
btnLibraryQueueEl.addEventListener('click', getLocaleQueue);
libraryListEl.addEventListener('click', onClickGallery);
modalCloseBtn.addEventListener('click', onCloseBtn);
backdropEl.addEventListener('click', closeBackdrop);

btnLibraryWatchedEl.addEventListener('click', () => {   
  btnLibraryWatchedEl.classList.add('is-active');
  btnLibraryQueueEl.classList.remove('is-active');
});

btnLibraryQueueEl.addEventListener('click', () => {
  btnLibraryWatchedEl.classList.remove('is-active');
  btnLibraryQueueEl.classList.add('is-active');  
});


const theMoviebdhAPI = new TheMoviebdhAPI();

getLocaleWatched();

export function getLocaleWatched() {
    theMoviebdhAPI.selected = "watched" // "queue"
    theMoviebdhAPI.watched = []
    if(localStorage.hasOwnProperty('myLib')) {theMoviebdhAPI.watched = JSON.parse(localStorage.getItem('myLib'))};
    libraryListEl.innerHTML = '';
    libraryListEl.insertAdjacentHTML('beforeend', libraryCardTemplate(theMoviebdhAPI[theMoviebdhAPI.selected].slice((theMoviebdhAPI.page-1)*0,(theMoviebdhAPI.page*20+1))));
    if (theMoviebdhAPI.watched.length > 20) {creatPagination (theMoviebdhAPI.watched.length)} else {container.innerHTML = ''}
}

export function getLocaleQueue() {
    theMoviebdhAPI.selected = "queue"
    theMoviebdhAPI.queue =   []
    if(localStorage.hasOwnProperty('queue')) {theMoviebdhAPI.queue = JSON.parse(localStorage.getItem('queue'))};
    libraryListEl.innerHTML = '';
    libraryListEl.insertAdjacentHTML('beforeend', libraryCardTemplate(theMoviebdhAPI[theMoviebdhAPI.selected].slice((theMoviebdhAPI.page-1)*0,(theMoviebdhAPI.page*20+1))));
   if (theMoviebdhAPI.queue.length > 20) {creatPagination (theMoviebdhAPI.queue.length)} else {container.innerHTML = ''}
}

function onClickGallery(event) {
  event.preventDefault();  
  if (
    event.target.nodeName !== 'IMG' &&
    event.target.nodeName !== 'H2' &&
    event.target.nodeName !== 'P' &&
    event.target.nodeName !== 'UL' &&
    event.target.nodeName !== 'LI'
  ) {
    return;
  } else {
    backdropEl.classList.remove('is-hidden');
    document.body.classList.add('overflow-hidden');
    document.body.style.overflow = 'hidden';
    scrollUpBtn.classList.add('btn-position');

    const movieId = event.target.closest('.film-card').dataset.filmId;

    theMoviebdhAPI
      .searchFilmsCompletes(movieId)
      .then(data => {
        modalBox.innerHTML = movieDetails(data);
        AddToWatched();
        AddToQueue();
      })
      .catch(err => console.log(err));

    window.addEventListener('keydown', closeModalHandler);
  }
}

function onCloseBtn() {
    backdropEl.classList.add('is-hidden');
    document.body.classList.remove('overflow-hidden');
    document.body.style.overflow = 'visible';
    scrollUpBtn.classList.remove('btn-position');
  
    window.removeEventListener('keydown', closeModalHandler);
    if (theMoviebdhAPI.selected === "watched") {
      getLocaleWatched()
      return;
    } 
    getLocaleQueue()
  }
  
  function closeModalHandler(event) {
    if (event.code === 'Escape') {
      onCloseBtn();
    }
  }
  
  function closeBackdrop(event) {
    if (event.target === event.currentTarget) {
      onCloseBtn();
    }
  }

  function creatPagination (totalItems){
    const optionsPagination = {
        totalItems: totalItems,
        itemsPerPage: 20,
        visiblePages: 7,
        page: 1,
        centerAlign: false,     
      };
      const pagination = new Pagination(container, optionsPagination);
      pagination.on('beforeMove', onPaginationClick);
}

function onPaginationClick (event) {
    theMoviebdhAPI.page = event.page
    theMoviebdhAPI.watched = JSON.parse(localStorage.getItem('myLib'));
    theMoviebdhAPI.queue = JSON.parse(localStorage.getItem('queue'));   
    libraryListEl.innerHTML = '';        
      libraryListEl.insertAdjacentHTML('beforeend', libraryCardTemplate(theMoviebdhAPI[theMoviebdhAPI.selected].slice((theMoviebdhAPI.page-1)*20,(theMoviebdhAPI.page*20+1))));
 }

 export function AddToWatched() {
  const modalWindowEl = document.querySelector('.movie-modal-card');
  const btnWatchedEl = document.querySelector('.btn-watched');
  const btnQueueEl = document.querySelector('.btn-queue');
  if (localStorage.hasOwnProperty('myLib')) {
    let myLibArr = JSON.parse(localStorage.getItem('myLib'));
    if (myLibArr.some(el => el.id === Number(modalWindowEl.dataset.filmId))) {
      btnWatchedEl.textContent = 'DEL FROM WATCHED';
    } else {
      btnWatchedEl.textContent = 'ADD TO WATCHED';
    }
  }
  btnWatchedEl.addEventListener('click', event => {
    theMoviebdhAPI.searchFilmsCompletes(Number(modalWindowEl.dataset.filmId)).then(response => {
      if (localStorage.hasOwnProperty('myLib')) {
        let myLibArr = JSON.parse(localStorage.getItem('myLib'));
        let myQueueArr = [];
        if (localStorage.hasOwnProperty('queue')) {
          myQueueArr = JSON.parse(localStorage.getItem('queue'));
        }
        if (myLibArr.some(el => el.id === response.id)) {
          myLibArr.splice(
            myLibArr.findIndex(el => el.id === response.id),
            1,
          );
          localStorage.setItem('myLib', JSON.stringify(myLibArr));
          btnWatchedEl.textContent = 'ADD TO WATCHED';
          return;
        } else {
          myLibArr.push(response);
          localStorage.setItem('myLib', JSON.stringify(myLibArr));
          btnWatchedEl.textContent = 'DEL FROM WATCHED';
          if (myQueueArr.find(el => el.id === response.id)) {
            myQueueArr.splice(
              myQueueArr.findIndex(el => el.id === response.id),
              1,
            );
            localStorage.setItem('queue', JSON.stringify(myQueueArr));
            btnQueueEl.textContent = 'ADD TO QUEUE';
          }
        }
      } else {
        localStorage.setItem('myLib', JSON.stringify([response]));
        btnWatchedEl.textContent = 'DEL FROM WATCHED';
        if (localStorage.hasOwnProperty('queue')) {
         let myQueueArr = JSON.parse(localStorage.getItem('queue'));
          if (myQueueArr.find(el => el.id === response.id)) {
            myQueueArr.splice(
              myQueueArr.findIndex(el => el.id === response.id),
              1,
            );
            localStorage.setItem('queue', JSON.stringify(myQueueArr));
            btnQueueEl.textContent = 'ADD TO QUEUE';
            console.log(localStorage)
          }
        }
      }
    });
  });
}

export function AddToQueue() {
  const modalWindowEl = document.querySelector('.movie-modal-card');
  const btnQueueEl = document.querySelector('.btn-queue');
  const btnWatchedEl = document.querySelector('.btn-watched');

  if (localStorage.hasOwnProperty('queue')) {
    let myQueueArr = JSON.parse(localStorage.getItem('queue'));
    if (myQueueArr.some(el => el.id === Number(modalWindowEl.dataset.filmId))) {
      btnQueueEl.textContent = 'DEL FROM QUEUE';
    } else {
      btnQueueEl.textContent = 'ADD TO QUEUE';
    }
  }

  btnQueueEl.addEventListener('click', event => {
    console.log(localStorage)
    theMoviebdhAPI.searchFilmsCompletes(Number(modalWindowEl.dataset.filmId)).then(response => {
      if (localStorage.hasOwnProperty('queue')) {
        let myLibArr = [];
        let myQueueArr = JSON.parse(localStorage.getItem('queue'));
        if (localStorage.hasOwnProperty('myLib')) {
          myLibArr = JSON.parse(localStorage.getItem('myLib'));
        }
        if (myQueueArr.some(el => el.id === response.id)) {
          myQueueArr.splice(
            myQueueArr.findIndex(el => el.id === response.id),
            1,
          );
          localStorage.setItem('queue', JSON.stringify(myQueueArr));
          btnQueueEl.textContent = 'ADD TO QUEUE';
          return;
        } else {
          myQueueArr.push(response);
          localStorage.setItem('queue', JSON.stringify(myQueueArr));
          btnQueueEl.textContent = 'DEL FROM QUEUE';
          if (myLibArr.some(el => el.id === response.id)) {
            myLibArr.splice(
              myLibArr.findIndex(el => el.id === response.id),
              1,
            );
            localStorage.setItem('myLib', JSON.stringify(myLibArr));
            btnWatchedEl.textContent = 'ADD TO WATCHED';
          }
        }
      } else {
        localStorage.setItem('queue', JSON.stringify([response]));
        btnQueueEl.textContent = 'DEL FROM QUEUE';        
        if (localStorage.hasOwnProperty('myLib')) {
         let myLibArr = JSON.parse(localStorage.getItem('myLib'));
          if (myLibArr.some(el => el.id === response.id)) {
            myLibArr.splice(
              myLibArr.findIndex(el => el.id === response.id),
              1,
            );
            localStorage.setItem('myLib', JSON.stringify(myLibArr));
            btnWatchedEl.textContent = 'ADD TO WATCHED';
            console.log(localStorage)
          }
        }
      }
    });
  });
}

