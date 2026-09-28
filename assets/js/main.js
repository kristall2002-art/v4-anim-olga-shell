(function(){
"use strict";
var html = document.documentElement;
html.classList.add('js');

var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- theme toggle ---------- */
(function(){
  var saved = null;
  try { saved = localStorage.getItem('olga-theme'); } catch(e){}
  if(saved === 'light') html.classList.add('light');
  var btn = document.getElementById('themeToggle');
  if(!btn) return;
  btn.addEventListener('click', function(){
    html.classList.toggle('light');
    var v = html.classList.contains('light') ? 'light' : 'dark';
    try { localStorage.setItem('olga-theme', v); } catch(e){}
    btn.setAttribute('aria-pressed', v === 'light' ? 'true' : 'false');
  });
})();

/* ---------- header scroll state ---------- */
var hdr = document.querySelector('.hdr');
function onScroll(){
  if(!hdr) return;
  hdr.classList.toggle('scrolled', window.scrollY > 12);
}
onScroll();
window.addEventListener('scroll', onScroll, {passive:true});

/* ---------- mobile menu ---------- */
(function(){
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mmenu');
  if(!burger || !menu) return;
  function close(){
    burger.classList.remove('open');
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
  }
  burger.addEventListener('click', function(){
    var open = menu.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', close); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
})();

/* ---------- reveal on scroll ---------- */
(function(){
  var items = document.querySelectorAll('.reveal');
  if(!items.length) return;
  if(RM || !('IntersectionObserver' in window)){
    items.forEach(function(el){ el.classList.add('on'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('on'); io.unobserve(en.target); }
    });
  }, {threshold:.15});
  items.forEach(function(el){ io.observe(el); });
})();

/* ---------- 1.1 заголовок по буквам ---------- */
(function(){
  var h = document.querySelector('h1.split');
  if(!h) return;
  if(RM){ h.classList.add('play'); return; }
  requestAnimationFrame(function(){ setTimeout(function(){ h.classList.add('play'); }, 150); });
})();

/* ---------- 5.1 счётчики ---------- */
(function(){
  var nums = Array.prototype.slice.call(document.querySelectorAll('.cnt'));
  if(!nums.length) return;
  function fmt(v){ return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function run(el){
    var target = parseFloat(el.getAttribute('data-value'));
    var suf = el.getAttribute('data-suffix') || '';
    if(RM){ el.textContent = fmt(target) + suf; return; }
    var start = null, dur = 1400;
    function step(ts){
      if(start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3)))) + suf;
      if(p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0' + suf;
    requestAnimationFrame(step);
  }
  if(!('IntersectionObserver' in window)){ nums.forEach(run); return; }
  var io = new IntersectionObserver(function(en){
    en.forEach(function(e){ if(e.isIntersecting){ run(e.target); io.unobserve(e.target); } });
  }, {threshold:.6});
  nums.forEach(function(n){ io.observe(n); });
})();

/* ---------- 3.2 карточки услуг: подъём по касанию ---------- */
(function(){
  document.querySelectorAll('.svc-c').forEach(function(c){
    c.addEventListener('click', function(){
      c.classList.add('lift');
      clearTimeout(c._t);
      c._t = setTimeout(function(){ c.classList.remove('lift'); }, 1300);
    });
  });
})();

/* ---------- 4.2 карусель: один кадр, автопрокрутка ---------- */
(function(){
  var rotor = document.getElementById('rotor');
  if(!rotor) return;
  var track = rotor.querySelector('.rotor-track');
  var frames = Array.prototype.slice.call(track.children);
  var dotsBox = rotor.querySelector('.rotor-dots');
  var n = frames.length, idx = 0, timer = null, stopped = RM, visible = false;
  frames.forEach(function(_, i){ var d = document.createElement('i'); dotsBox.appendChild(d); });
  var dots = dotsBox.children;
  function go(i){
    idx = (i + n) % n;
    track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    for(var k=0;k<dots.length;k++) dots[k].classList.toggle('on', k === idx);
  }
  function tick(){ clearInterval(timer); timer = null; if(!stopped && visible) timer = setInterval(function(){ go(idx + 1); }, 2600); }
  function stop(){ stopped = true; tick(); }
  go(0);
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(en){ visible = en[0].isIntersecting; tick(); }, {threshold:.3}).observe(rotor);
  } else { visible = true; tick(); }
  var prev = document.getElementById('carPrev'), next = document.getElementById('carNext');
  if(prev) prev.addEventListener('click', function(){ stop(); go(idx - 1); });
  if(next) next.addEventListener('click', function(){ stop(); go(idx + 1); });
  rotor.addEventListener('keydown', function(e){
    if(e.key === 'ArrowLeft'){ stop(); go(idx - 1); }
    if(e.key === 'ArrowRight'){ stop(); go(idx + 1); }
  });
  var x0 = null, moved = false;
  rotor.addEventListener('pointerdown', function(e){ x0 = e.clientX; moved = false; });
  rotor.addEventListener('pointerup', function(e){
    if(x0 === null) return;
    var dx = e.clientX - x0; x0 = null;
    if(Math.abs(dx) > 40){ moved = true; stop(); go(idx + (dx < 0 ? 1 : -1)); }
  });
  frames.forEach(function(f, i){
    f.addEventListener('click', function(){
      if(moved){ moved = false; return; }
      stop();
      if(window.openLightbox) window.openLightbox(i);
    });
  });
})();

/* ---------- lightbox ---------- */
(function(){
  var lb = document.getElementById('lightbox');
  if(!lb) return;
  var imgEl = lb.querySelector('img');
  var capEl = lb.querySelector('figcaption');
  var closeBtn = lb.querySelector('.lb-close');
  var prevBtn = lb.querySelector('.lb-prev');
  var nextBtn = lb.querySelector('.lb-next');
  var list = [];
  var idx = 0;
  var lastFocus = null;

  function collect(){
    var nodes = document.querySelectorAll('[data-lightbox-src]');
    list = Array.prototype.map.call(nodes, function(n){
      return { src: n.getAttribute('data-lightbox-src'), alt: n.getAttribute('data-lightbox-alt') || '' };
    });
  }

  function show(i){
    if(!list.length) collect();
    if(!list.length) return;
    idx = (i + list.length) % list.length;
    var it = list[idx];
    imgEl.src = it.src;
    imgEl.alt = it.alt;
    capEl.textContent = it.alt;
  }

  window.openLightbox = function(i){
    lastFocus = document.activeElement;
    collect();
    show(i);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden','false');
    closeBtn.focus();
    document.body.style.overflow = 'hidden';
  };

  function close(){
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    if(lastFocus) lastFocus.focus();
  }

  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', function(e){ if(e.target === lb) close(); });
  prevBtn.addEventListener('click', function(){ show(idx - 1); });
  nextBtn.addEventListener('click', function(){ show(idx + 1); });
  document.addEventListener('keydown', function(e){
    if(!lb.classList.contains('open')) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') show(idx - 1);
    if(e.key === 'ArrowRight') show(idx + 1);
  });
})();
})();
