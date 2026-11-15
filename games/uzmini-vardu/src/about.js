/* Preserve the reference About lifecycle; all help routes use this same area. */
(() => {
  'use strict';
  if (['1','wordnet'].includes(new URLSearchParams(location.search).get('legacy'))) return;
  const game=document.getElementById('game-main'),about=document.getElementById('about-screen');
  let opened=false,opener=null,savedScroll=0;
  function closeAbout(){if(!opened)return;about.hidden=true;game.hidden=false;opened=false;document.body.classList.remove('about-open');window.scrollTo(0,savedScroll);opener?.focus({preventScroll:true})}
  function showSection(id){if(!id){window.scrollTo(0,0);document.getElementById('about-close-top').focus({preventScroll:true});return}const heading=document.getElementById(id);if(!heading||!['about-play','about-controls','about-modes','about-data'].includes(id))return;heading.scrollIntoView({block:'start',behavior:'instant'});heading.focus({preventScroll:true});for(const link of document.querySelectorAll('[data-about-nav]'))link.setAttribute('aria-current',link.getAttribute('data-about-section')===id?'location':'false')}
  function openAbout(link,section){if(!opened){opener=link;savedScroll=window.scrollY;game.hidden=true;about.hidden=false;opened=true;document.body.classList.add('about-open');document.dispatchEvent(new Event('rg-crossword:about-open'))}showSection(section)}
  document.addEventListener('click',event=>{const target=event.target;if(opened&&target.closest('#header-home')){event.preventDefault();event.stopImmediatePropagation();closeAbout();return}if(target.closest('[data-about-close]')){event.preventDefault();closeAbout();return}const link=target.closest('[data-about-link],#header-about'),sectionLink=target.closest('[data-about-section]');if((link||sectionLink)&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0){event.preventDefault();event.stopImmediatePropagation();const invoking=link||sectionLink;openAbout(invoking,invoking.getAttribute('data-about-section'));return}if(opened&&target.closest('#header-difficulty'))closeAbout()},true);
  document.addEventListener('keydown',event=>{if(opened&&event.key==='Escape'){event.preventDefault();closeAbout()}});
})();
