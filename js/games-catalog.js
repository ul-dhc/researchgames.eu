const filters=[...document.querySelectorAll('[data-filter]')];
const groups=[...document.querySelectorAll('[data-category]')];
const lv=document.documentElement.lang==='lv';
for(const button of filters)button.addEventListener('click',()=>{
 const filter=button.dataset.filter;
 for(const control of filters)control.setAttribute('aria-pressed',String(control===button));
 let count=0;
 for(const group of groups){group.hidden=filter!=='all'&&group.dataset.category!==filter;if(!group.hidden)count+=group.querySelectorAll('.catalog-game,.catalog-upcoming').length;}

});
for(const trigger of document.querySelectorAll('[data-open-preview]'))trigger.addEventListener('click',event=>{
 event.preventDefault();
 const panel=document.querySelector(trigger.getAttribute('href'));
 panel.open=true;
 panel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 panel.querySelector('summary').focus({preventScroll:true});
});
for(const trigger of document.querySelectorAll('[data-preview-dialog]'))trigger.addEventListener('click',event=>{
 const dialog=document.getElementById(trigger.dataset.previewDialog);
 if(!dialog)return;
 event.preventDefault();dialog.showModal();
});
for(const close of document.querySelectorAll('[data-close-preview]'))close.addEventListener('click',()=>close.closest('dialog').close());
