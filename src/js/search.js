'use strict';

import { TheMoviebdhAPI } from './themoviedbAPI';
import galleryCardsTemplate from '../templates/home-gallery-elements.hbs';
import Pagination from 'tui-pagination';
import 'tui-pagination/dist/tui-pagination.css';
import movieDetails from '../templates/modal-movie-card.hbs';

const container = document.getElementById('pagination');
const searchFormEl = document.querySelector('.search-form');
const galleryListEl = document.querySelector('.gallery');
const searchField = document.querySelector('.input-box');
const errorText = document.querySelector('p.search-error-text');
const modalBox = document.querySelector('.modal-card-container');
const modalCloseBtn = document.querySelector('.modal-btn-close');
const backdropEl = document.querySelector('.backdrop');
const movieGalleryEl = document.querySelector('.gallery');
const scrollUpBtn = document.querySelector('button.btn-back-to-top');

movieGalleryEl.addEventListener('click', onClickGallery);
modalCloseBtn.addEventListener('click', onCloseBtn);
backdropEl.addEventListener('click', closeBackdrop);

const theMoviebdhAPI = new TheMoviebdhAPI();
//localStorage.clear()
function creatPagination(totalItems, onClick) {
  const optionsPagination = {
    totalItems: totalItems,
    itemsPerPage: 20,
    visiblePages: 7,
    page: 1,
    centerAlign: false,
  };
  const pagination = new Pagination(container, optionsPagination);
  pagination.on('beforeMove',onClick );
}

function onPaginationSearchClick(event) {
  theMoviebdhAPI.page = event.page;
  theMoviebdhAPI.searchFilms().then(data => {
    galleryListEl.innerHTML = '';
    errorText.innerHTML = '';
    galleryListEl.insertAdjacentHTML('beforeend', galleryCardsTemplate(data.results));
  });
}

function onPaginationFavoriteClick(event) {
  theMoviebdhAPI.page = event.page;
  theMoviebdhAPI.getFavoriteFilms().then(data => {
    galleryListEl.innerHTML = '';
    errorText.innerHTML = '';
    galleryListEl.insertAdjacentHTML('beforeend', galleryCardsTemplate(data.results));
  });
}

setTimeout(theMoviebdhAPI
  .getFavoriteFilms()
  .then(data => {
    console.log(data)
    if (data.total_results > 20) {
      creatPagination(data.total_results, onPaginationFavoriteClick);
    } else {
      container.innerHTML = '';
    }
    galleryListEl.insertAdjacentHTML('beforeend', galleryCardsTemplate(data.results))}), 100)


function onFormSubmit(event) {
  event.preventDefault();
  const loadingImage = document.querySelector(".loading-modal")     
    loadingImage.classList.remove("loading-hidden");
    let keyword = searchField.value;
    if (keyword) {theMoviebdhAPI.keyword = keyword}  
  if (!theMoviebdhAPI.keyword.length) {
    theMoviebdhAPI.getFavoriteFilms().then(data => {
      galleryListEl.innerHTML = '';
      errorText.innerHTML = '';
      galleryListEl.insertAdjacentHTML('beforeend', galleryCardsTemplate(data));
    });
    return;
  }

  theMoviebdhAPI.searchFilms().then((data = { results: [] }) => {    
    if (!data.results.length) {
      loadingImage.classList.add("loading-hidden");
      errorText.innerHTML = 'Search result not successful. Enter the correct movie name and';
      return;
    }
    if (data.total_results > 20) {
      creatPagination(data.total_results, onPaginationSearchClick);
    } else {
      container.innerHTML = '';
    }
    galleryListEl.innerHTML = '';
    errorText.innerHTML = '';
    galleryListEl.insertAdjacentHTML('beforeend', galleryCardsTemplate(data.results));
    loadingImage.classList.add("loading-hidden");
  });
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
      .catch(console.log);

    window.addEventListener('keydown', closeModalHandler);
  }
}

function onCloseBtn() {
  backdropEl.classList.add('is-hidden');
  document.body.classList.remove('overflow-hidden');
  document.body.style.overflow = 'visible';
  scrollUpBtn.classList.remove('btn-position');

  window.removeEventListener('keydown', closeModalHandler);
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

searchFormEl.addEventListener('submit', onFormSubmit);

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
          }
        }
      }
    });
  });
}
