const TMDB_API_KEY = 'ab3a96eb02c4788f094f1803fa62a7b3'; 
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/original'


document.addEventListener('DOMContentLoaded', () => {
  
  const yearEls = document.querySelectorAll('#year, #year-detail, #year-about');
  yearEls.forEach(el => el.textContent = new Date().getFullYear());

  
  const path = window.location.pathname.split('/').pop();
  if(path === '' || path === 'index.html') {
    initIndex();
  } else if(path === 'movie.html') {
    initMovieDetail();
  } else {
    
  }
});



async function tmdbFetch(endpoint) {
  const url = `${TMDB_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}&language=es-ES`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('TMDB fetch error: ' + res.status);
  return res.json();
}


function shuffle(array){
  for(let i = array.length -1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


function excerpt(text, length=140){
  if(!text) return '';
  return text.length > length ? text.slice(0, length-3) + '...' : text;
}


async function initIndex(){
  const moviesGrid = document.getElementById('movies-grid');
  const heroSlider = document.getElementById('hero-slider');

  try{
    
    let data = await tmdbFetch('/movie/now_playing?page=1');
    let results = data.results && data.results.length ? data.results : (await tmdbFetch('/movie/popular?page=1')).results;

    
    results = shuffle(results);

    
    const toShow = results.slice(0, 12);

    
    renderHero(heroSlider, toShow.slice(0,3));

    
    renderMoviesGrid(moviesGrid, toShow);
  }catch(err){
    console.error('Error cargando índice:', err);
    moviesGrid.innerHTML = '<p class="muted">No fue posible cargar las películas. Revisa la consola.</p>';
  }
}


function renderHero(container, slides){
  container.innerHTML = '';
  slides.forEach((m,i) => {
    const div = document.createElement('div');
    div.className = 'hero-slide' + (i===0 ? ' active' : '');
    const img = document.createElement('img');
    img.alt = m.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = TMDB_IMAGE + (m.backdrop_path || m.poster_path || '');
    div.appendChild(img);
    container.appendChild(div);
  });

  
  let idx = 0;
  const els = container.querySelectorAll('.hero-slide');
  if(els.length <= 1) return;
  setInterval(()=>{
    els[idx].classList.remove('active');
    idx = (idx + 1) % els.length;
    els[idx].classList.add('active');
  }, 6000);
}


function renderMoviesGrid(container, movies){
  container.innerHTML = '';
  movies.forEach(m => {
    const card = document.createElement('article');
    card.className = 'movie-card';
    card.setAttribute('role','link');
    card.addEventListener('click', ()=> window.location.href = `movie.html?id=${m.id}`);

    
    const poster = document.createElement('div');
    poster.className = 'movie-poster';
    const img = document.createElement('img');
    img.alt = m.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = TMDB_IMAGE + (m.poster_path || m.backdrop_path || '');
    poster.appendChild(img);

    
    const body = document.createElement('div');
    body.className = 'movie-body';
    const title = document.createElement('h3');
    title.className = 'movie-title';
    title.textContent = m.title + (m.release_date ? ` (${m.release_date.split('-')[0]})` : '');

    const meta = document.createElement('div');
    meta.className = 'movie-meta';
    meta.textContent = `⭐ ${m.vote_average || '-'} `;

    const overview = document.createElement('p');
    overview.className = 'movie-overview';
    overview.textContent = excerpt(m.overview, 160);

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(overview);

    card.appendChild(poster);
    card.appendChild(body);
    container.appendChild(card);
  });
}


async function initMovieDetail(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const container = document.getElementById('movie-detail');
  if(!id){
    container.innerHTML = '<p class="muted">ID de película no especificado.</p>';
    return;
  }

  try{
    
    const m = await tmdbFetch(`/movie/${id}`);

    
    container.innerHTML = `
      <div class="detail-grid">
        <div class="detail-poster">
          <img src="${TMDB_IMAGE + (m.poster_path || m.backdrop_path || '')}" alt="${m.title}">
        </div>
        <div class="detail-meta">
          <h1>${m.title} ${m.release_date ? `(${m.release_date.split('-')[0]})` : ''}</h1>
          <div class="movie-meta">⭐ ${m.vote_average} • ${m.runtime ? m.runtime + ' min' : ''}</div>
          <div class="genres">${(m.genres || []).map(g=>`<span class="genre">${g.name}</span>`).join('')}</div>
          <h3>Descripción</h3>
          <p>${m.overview || 'Sin descripción disponible.'}</p>
          <p><strong>Idioma original:</strong> ${m.original_language || 'N/A'}</p>
        </div>
      </div>
    `;

  }catch(err){
    console.error('Error cargando detalle:', err);
    container.innerHTML = '<p class="muted">No fue posible cargar la información de la película.</p>';
  }
}
