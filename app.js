import { icon } from './icons.js';
import { state, save, toggleFavorite, addItem, cartCount, cartTotal, money, escapeHTML as e } from './store.js';

let catalog, site;
let productSelection = {};
let toastTimer;
let previousRoute = '';
const main = document.querySelector('#main');
const byId = id => catalog.products.find(p => p.id === Number(id));
const category = id => catalog.categories.find(c => c.id === id);
const nameOf = id => ({'mebel-dlya-spalni-i-gostinnoy':'Спальня и гостиная','mebel-dlya-sada-i-raznoe':'Для сада и дома','dveri-i-lestnitsyi':'Двери и лестницы','tovary-so-skidkoj':'Выгодные предложения'}[id] || category(id)?.name || 'Вся мебель');
const hrefCatalog = (id = '') => '#/catalog' + (id ? `?category=${id}` : '');
const productLink = p => `#/product/${p.slug}`;
const plural = (n, one, few, many) => n % 100 > 10 && n % 100 < 20 ? many : n % 10 === 1 ? one : n % 10 >= 2 && n % 10 <= 4 ? few : many;
const countLabel = n => `${n} ${plural(n, 'товар', 'товара', 'товаров')}`;
const priceLabel = p => p.customOrder ? 'По запросу' : `${p.minPrice !== p.maxPrice || p.priceOnRequest ? 'от ' : ''}${money(p.minPrice)}`;
const totalLabel = () => `${state.cart.some(i => i.estimated) ? 'от ' : ''}${money(cartTotal())}`;
const shortCategory = p => nameOf(p.categoryIds.find(id => category(id)?.parentId) || p.categoryIds[0]);
const normalize = text => text.toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[«»"“”]/g, '');
const button = (text, url, cls = '') => `<a class="button ${cls}" href="${url}">${text}${icon('arrow')}</a>`;
const crumb = (title, parent = '') => `<div class="breadcrumbs"><a href="#/">Главная</a>${icon('chevron')}${parent ? `<a href="${hrefCatalog()}">Каталог</a>${icon('chevron')}` : ''}<span>${e(title)}</span></div>`;

function toast(text) {
  const el = document.querySelector('#toast');
  el.innerHTML = `${icon('check')}<span>${e(text)}</span>`;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3000);
}

function renderHeader() {
  const active = location.hash;
  document.querySelector('#header').innerHTML = `
    <div class="utility"><div class="container utility-inner"><a class="location" href="#/contacts">${icon('pin')}Боровичи · мебель от производителя</a><nav aria-label="О компании"><a href="#/production">Производство</a><a href="#/delivery">Доставка и сборка</a><a href="#/cooperation">Сотрудничество</a></nav><a class="top-phone" href="tel:+79218400002">+7 (921) 840-00-02</a></div></div>
    <header class="site-header"><div class="container header-inner">
      <button class="icon-button mobile-only" data-action="menu" aria-label="Открыть меню">${icon('menu')}</button>
      <a class="brand" href="#/" aria-label="Боровичи Массив Мебель — главная"><img src="assets/mark.svg" width="46" height="46" alt=""/><span><strong>Боровичи</strong><small>МАССИВ МЕБЕЛЬ</small></span></a>
      <form class="header-search" role="search" data-form="search"><label class="sr-only" for="header-query">Поиск по каталогу</label>${icon('search')}<input id="header-query" name="q" type="search" placeholder="Найти мебель для вашего дома" autocomplete="off" maxlength="120"/><button type="submit" aria-label="Найти">${icon('arrow')}</button></form>
      <div class="header-actions"><a class="header-action ${active.startsWith('#/favorites') ? 'active' : ''}" href="#/favorites" aria-label="Избранное">${icon('heart')}<span>Избранное</span><b class="counter favorite-count" ${!state.favorites.length ? 'hidden' : ''}>${state.favorites.length}</b></a><button class="header-action" data-action="cart" aria-label="Открыть корзину">${icon('bag')}<span>Корзина</span><b class="counter cart-count" ${!cartCount() ? 'hidden' : ''}>${cartCount()}</b></button></div>
    </div></header>
    <div class="category-bar"><nav class="container category-nav" aria-label="Категории мебели"><a class="all-catalog" href="#/catalog">${icon('grid')}Весь каталог</a>${['krovati','myagkaya-mebel','mebel-dlya-spalni-i-gostinnoy','stolyi','mebel-dlya-kuhni','prihozhie'].map(id => `<a href="${hrefCatalog(id)}">${nameOf(id)}</a>`).join('')}<a class="sale-link" href="${hrefCatalog('tovary-so-skidkoj')}">Предложения ${icon('arrow')}</a></nav></div>`;
}

function renderFooter() {
  document.querySelector('#footer').innerHTML = `<footer class="site-footer"><div class="container footer-grid"><div class="footer-brand"><a class="brand" href="#/"><img src="assets/mark.svg" alt="" width="46" height="46"/><span><strong>Боровичи</strong><small>МАССИВ МЕБЕЛЬ</small></span></a><p>Мебель, с которой<br/>дом становится своим.</p><a class="text-link" href="https://vk.com/club146950185" target="_blank" rel="noopener noreferrer">Мы ВКонтакте ${icon('arrow')}</a></div><div><h3>Мебель для дома</h3>${['krovati','myagkaya-mebel','mebel-dlya-spalni-i-gostinnoy','stolyi','mebel-dlya-kuhni','prihozhie'].map(id => `<a href="${hrefCatalog(id)}">${nameOf(id)}</a>`).join('')}</div><div><h3>Покупателям</h3><a href="#/delivery">Доставка и самовывоз</a><a href="#/assembly">Сборка мебели</a><a href="#/warranty">Гарантия и возврат</a><a href="#/production">О производстве</a><a href="#/cooperation">Сотрудничество</a><a href="#/contacts">Контакты</a></div><div class="footer-contacts"><h3>Будем на связи</h3><a class="footer-phone" href="tel:+79218400002">+7 (921) 840-00-02</a><span>Отдел продаж</span><a href="mailto:sale@bormassiv.ru">sale@bormassiv.ru</a><p>Салон в Боровичах<br/>ул. Дзержинского, 23<br/><span>10:00–18:00 · дни работы уточняйте</span></p><a class="text-link" href="#/contacts">Как добраться ${icon('arrow')}</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Боровичи Массив Мебель</span><a href="#/privacy">Конфиденциальность</a><span>С теплом дерева.</span></div></footer>`;
}

function card(p, index = 0) {
  const favorite = state.favorites.includes(p.id);
  const sale = p.regularPrice > p.minPrice || p.categoryIds.includes('tovary-so-skidkoj');
  return `<article class="product-card"><div class="product-picture"><a href="${productLink(p)}" aria-label="${e(p.name)}"><img src="${e(p.image)}" alt="${e(p.name)}" loading="${index < 4 ? 'eager' : 'lazy'}" width="500" height="500"/></a>${sale ? '<span class="product-tag">Особая цена</span>' : p.material === 'Массив дерева' ? '<span class="product-tag natural">Массив дерева</span>' : ''}<button class="favorite-button ${favorite ? 'selected' : ''}" data-action="favorite" data-id="${p.id}" aria-label="${favorite ? 'Убрать из избранного' : 'В избранное'}: ${e(p.name)}" aria-pressed="${favorite}">${icon('heart')}</button><a class="quick-view" href="${productLink(p)}">Выбрать комплектацию ${icon('arrow')}</a></div><div class="product-meta"><span>${e(shortCategory(p))}</span><a href="${productLink(p)}"><h3>${e(p.name)}</h3></a><div class="product-price"><strong>${priceLabel(p)}</strong>${p.regularPrice > p.minPrice ? `<del>${money(p.regularPrice)}</del>` : ''}<a class="round-arrow" href="${productLink(p)}" aria-label="Подробнее: ${e(p.name)}">${icon('arrow')}</a></div></div></article>`;
}

function home() {
  const picks = [583,1557,158,242].map(byId).filter(Boolean);
  const categories = [
    ['krovati','Для спокойных снов','Кровати', p => /КР-М3\b|КР-М4\b/.test(p.name)],
    ['myagkaya-mebel','Ваше место отдыха','Диваны и кресла', p => /Серж|Валери-1/.test(p.name)],
    ['mebel-dlya-spalni-i-gostinnoy','Всё на своих местах','Хранение', p => p.id === 1557],
    ['stolyi','Для больших и маленьких дел','Столы', p => /СО-1|СО-3/.test(p.name)],
    ['mebel-dlya-kuhni','Ближе к близким','Для кухни', p => /Стул.*С-6|Стул.*С-1/.test(p.name)],
    ['mebel-dlya-sada-i-raznoe','Маленькие радости за городом','Для сада и дома', p => /Скамья|Скамейка/.test(p.name)],
  ];
  main.innerHTML = `<section class="hero container"><div class="hero-copy"><span class="eyebrow"><i></i>Сделано в Боровичах</span><h1>Дом начинается<br/>с тёплого<br/><em>дерева.</em></h1><p>Мебель с живой фактурой и простым характером.<br class="desktop-only"/> Для жизни, в которой хочется остаться.</p>${button('Найти свою мебель','#/catalog')}<div class="hero-note"><span class="tiny-ring">◎</span><span>Массив дерева. Продуманные формы.<br/>Напрямую от производителя.</span></div></div><div class="hero-visual"><img class="hero-image" src="assets/hero.webp" alt="Кровать КР-М10 в светлой спальне — интерьерная визуализация" width="1440" height="1024" fetchpriority="high"/><span class="image-caption">Интерьерная визуализация</span><a class="hero-product" href="${byId(583) ? productLink(byId(583)) : '#/catalog'}"><span><small>Кровать из массива</small><strong>КР-М10</strong></span><span class="hero-product-price">от ${money(15800)}${icon('arrow')}</span></a><div class="hero-number"><span>01</span> / Дом с характером</div></div></section>
    <section class="container benefits" aria-label="Преимущества"><div>${icon('tree')}<span><strong>Настоящее дерево</strong><small>Тактильная красота природных материалов</small></span></div><div>${icon('shield')}<span><strong>Гарантия 18 месяцев</strong><small>Поддержка производителя рядом</small></span></div><div>${icon('truck')}<span><strong>Доставка по России</strong><small>Подберём удобный способ получения</small></span></div></section>
    <section class="container section categories-section"><div class="section-heading"><div><span class="eyebrow">Каждой комнате — своё</span><h2>Место для вашей жизни</h2></div><a class="text-link" href="#/catalog">Весь каталог ${icon('arrow')}</a></div><div class="category-grid">${categories.map(([id,sub,name,pred]) => {
      const p = catalog.products.find(pred) || catalog.products.find(p => p.categoryIds.includes(id));
      return `<a class="category-tile" href="${hrefCatalog(id)}"><div><small>${sub}</small><h3>${name}</h3><span>${countLabel(catalog.products.filter(p => p.categoryIds.includes(id)).length)}</span></div>${p ? `<img src="${p.image}" alt="" loading="lazy" width="400" height="400"/>` : ''}<span class="tile-arrow">${icon('arrow')}</span></a>`;
    }).join('')}</div></section>
    <section class="container section"><div class="section-heading"><div><span class="eyebrow">Тёплые фактуры, знакомые формы</span><h2>Мебель с характером</h2></div><a class="text-link" href="${hrefCatalog('krovati')}">Выбрать для спальни ${icon('arrow')}</a></div><div class="product-grid home-products">${picks.map(card).join('')}</div></section>
    <section class="story container"><div class="story-image"><img src="assets/hero.webp" alt="Натуральное дерево и мягкий дневной свет в интерьере" loading="lazy" width="1000" height="800"/><span>Живое дерево. Ваши истории.</span></div><div class="story-copy"><span class="eyebrow">Боровичи Массив Мебель</span><h2>Вещи, которые<br/>становятся<br/><em>частью дома.</em></h2><p>Уют складывается из простых вещей: приятного прикосновения к дереву, любимого кресла, стола, за которым собираются свои.</p><p>В нашем каталоге — мебель из массива, мягкая и корпусная мебель. Выбирайте размер, отделку и сочетания, которые подойдут вашему дому.</p><a class="text-link" href="#/production">Познакомиться с производством ${icon('arrow')}</a></div></section>
    <section class="container section visit"><div><span class="eyebrow">Давайте познакомимся</span><h2>Хорошую мебель<br/>приятно выбирать вживую.</h2><p>Почувствуйте фактуру, сравните оттенки и найдите своё.<br/>Ждём вас в нашем салоне в Боровичах.</p><a class="text-link" href="#/contacts">Боровичи, ул. Дзержинского, 23 ${icon('arrow')}</a></div><div class="visit-card"><span>${icon('pin')}Мебельный салон</span><h3>Заходите за вдохновением.<br/>Уходите с идеей для дома.</h3><p>10:00–18:00<br/>Перед поездкой уточните дни работы и наличие образцов.</p><a class="button button-light" href="tel:+79218400003">+7 (921) 840-00-03 ${icon('phone')}</a></div></section>`;
}

function catalogPage(params, favorites = false) {
  const q = params.get('q') || '';
  const cid = params.get('category') || '';
  const mat = params.get('material') || '';
  const min = Math.max(0, Number(params.get('min')) || 0);
  const max = Number(params.get('max')) > 0 ? Number(params.get('max')) : Infinity;
  const sort = params.get('sort') || 'default';
  const limit = [12,24,48].includes(Number(params.get('limit'))) ? Number(params.get('limit')) : 24;
  let products = catalog.products.filter(p => (!favorites || state.favorites.includes(p.id)) && (!cid || p.categoryIds.includes(cid)) && (!q || normalize(p.name + ' ' + p.description + ' ' + p.sku).includes(normalize(q))) && (!mat || p.material === mat) && (p.customOrder || p.minPrice >= min && p.minPrice <= max));
  if (sort === 'price-asc') products.sort((a,b) => a.minPrice - b.minPrice);
  if (sort === 'price-desc') products.sort((a,b) => b.minPrice - a.minPrice);
  if (sort === 'name') products.sort((a,b) => a.name.localeCompare(b.name, 'ru'));
  const pages = Math.max(1, Math.ceil(products.length / limit));
  const page = Math.min(pages, Math.max(1, Number(params.get('page')) || 1));
  const title = favorites ? 'Ваше избранное' : q ? `Поиск: «${q}»` : cid ? nameOf(cid) : 'Мебель для вашего дома';
  const filtered = q || cid || mat || min || max < Infinity;
  const children = catalog.categories.filter(c => c.parentId === cid);
  const topCats = catalog.categories.filter(c => !c.parentId);
  const base = favorites ? '#/favorites' : '#/catalog';
  function urlFor(values) { const s = new URLSearchParams(params); Object.entries(values).forEach(([k,v]) => v ? s.set(k,v) : s.delete(k)); return `${base}?${s}`; }
  main.innerHTML = `<div class="container catalog-page">${crumb(favorites ? 'Избранное' : 'Каталог')}<div class="catalog-title"><div><span class="eyebrow">${favorites ? 'Сохраните то, что нравится' : 'От производителя — в ваш дом'}</span><h1>${e(title)}</h1></div><span>${countLabel(products.length)}</span></div>${favorites ? '<p class="page-intro">Ваши находки сохраняются в этом браузере. Можно вернуться к ним, когда придёт время выбирать.</p>' : ''}<div class="catalog-layout"><aside class="catalog-sidebar"><details class="filters" ${window.matchMedia('(min-width:651px)').matches?'open':''}><summary>${icon('sliders')}Фильтры ${icon('down')}</summary><div class="filter-body"><h2>Категории</h2><a class="filter-category ${!cid ? 'active' : ''}" href="${base}">Вся мебель <span>${favorites ? state.favorites.length : catalog.products.length}</span></a>${topCats.map(c => `<a class="filter-category ${cid === c.id ? 'active' : ''}" href="${urlFor({category:c.id,page:''})}">${e(nameOf(c.id))}<span>${catalog.products.filter(p => p.categoryIds.includes(c.id) && (!favorites || state.favorites.includes(p.id))).length}</span></a>${cid === c.id || catalog.categories.some(s => s.parentId === c.id && s.id === cid) ? `<div class="filter-subcategories">${catalog.categories.filter(s => s.parentId === c.id).map(s => `<a class="${s.id === cid ? 'active' : ''}" href="${urlFor({category:s.id,page:''})}">${e(nameOf(s.id))}</a>`).join('')}</div>` : ''}`).join('')}<form data-form="filters" class="price-filters"><input type="hidden" name="category" value="${e(cid)}"/><input type="hidden" name="q" value="${e(q)}"/><input type="hidden" name="sort" value="${e(sort)}"/><input type="hidden" name="base" value="${base}"/><h2>Стоимость, ₽</h2><div class="price-fields"><label><span>от</span><input aria-label="Цена от" name="min" type="number" min="0" max="9999999" value="${min || ''}" placeholder="0"/></label><label><span>до</span><input aria-label="Цена до" name="max" type="number" min="0" max="9999999" value="${max < Infinity ? max : ''}" placeholder="Любая"/></label></div><h2>Материал</h2>${['','Массив дерева','ЛДСП','Другие материалы'].map(v => `<label class="radio-label"><input type="radio" name="material" value="${v}" ${mat === v ? 'checked' : ''}/><span>${v || 'Все материалы'}</span></label>`).join('')}<button class="button filter-submit" type="submit">Показать мебель ${icon('arrow')}</button>${filtered ? `<a class="filter-reset" href="${base}">Сбросить фильтры</a>` : ''}</form><div class="filter-help">${icon('phone')}<h3>Поможем выбрать</h3><p>Разберёмся с размерами,<br/>отделкой и доставкой.</p><a href="tel:+79218400002">+7 (921) 840-00-02</a></div></div></details></aside><section class="catalog-results" aria-label="Товары">${children.length ? `<div class="subcategory-chips">${children.map(c => `<a href="${urlFor({category:c.id,page:''})}">${e(nameOf(c.id))}</a>`).join('')}</div>` : ''}<div class="catalog-toolbar"><span>${filtered ? 'Найдено' : 'В каталоге'} <b>${countLabel(products.length)}</b></span><label>Сначала<select aria-label="Сортировка" data-param="sort">${[['default','По умолчанию'],['price-asc','Недорогие'],['price-desc','Дорогие'],['name','По названию']].map(([v,t]) => `<option value="${v}" ${sort===v?'selected':''}>${t}</option>`).join('')}</select>${icon('down')}</label></div>${products.length ? `<div class="product-grid catalog-products">${products.slice((page-1)*limit,page*limit).map(card).join('')}</div><div class="pagination"><span>${(page-1)*limit+1}–${Math.min(page*limit, products.length)} из ${products.length}</span><nav aria-label="Страницы каталога">${Array.from({length:pages},(_,i) => `<a href="${urlFor({page:i+1})}" ${page===i+1?'aria-current="page"':''}>${i+1}</a>`).join('')}</nav><label>На странице <select aria-label="Товаров на странице" data-param="limit">${[12,24,48].map(n => `<option ${n===limit?'selected':''}>${n}</option>`).join('')}</select></label></div>` : `<div class="empty-state">${icon(favorites ? 'heart' : 'search')}<h2>${favorites ? 'Здесь будут ваши находки' : 'Пока ничего не нашлось'}</h2><p>${favorites ? 'Нажмите на сердечко у товара, чтобы сохранить его.' : 'Попробуйте другое название или измените фильтры.'}</p>${button('Посмотреть всю мебель','#/catalog')}</div>`}</section></div></div>`;
}

function productPage(slug) {
  const p = catalog.products.find(p => p.slug === slug);
  if (!p) return notFound();
  productSelection = {};
  const attributes = p.attributes || [];
  const related = catalog.products.filter(x => x.id !== p.id && x.categoryIds.some(c => p.categoryIds.includes(c)) && !x.customOrder).slice(0,4);
  document.title = `${p.name} — Боровичи Массив Мебель`;
  main.innerHTML = `<div class="container product-page">${crumb(p.name,'catalog')}<div class="product-detail"><div class="gallery"><div class="gallery-main"><img id="main-product-image" src="${p.image}" alt="${e(p.name)}" width="900" height="900"/><button data-action="zoom" class="icon-button zoom-button" aria-label="Увеличить фотографию">${icon('zoom')}</button>${p.material==='Массив дерева'?'<span class="product-tag natural">Натуральное дерево</span>':''}</div>${p.images?.length>1?`<div class="gallery-thumbnails" aria-label="Фотографии товара">${p.images.map((img,i) => `<button data-action="gallery" data-image="${img}" class="${i===0?'active':''}" aria-label="Фотография ${i+1}"><img src="${img}" alt="" width="100" height="100"/></button>`).join('')}</div>`:''}<p class="photo-note">Фото реального изделия. Оттенок на экране может отличаться от образца.</p></div><section class="product-summary"><a class="eyebrow" href="${hrefCatalog(p.categoryIds[0])}">${e(shortCategory(p))}</a><h1>${e(p.name)}</h1><p class="product-intro">${e(p.description)}</p><div class="detail-price"><strong id="selected-price">${priceLabel(p)}</strong><small>Цена мебели без доставки</small></div>${p.customOrder?`<div class="custom-order-note">${icon('info')}<p>Размеры, материалы и стоимость индивидуального изделия согласовываются с менеджером.</p></div>${button('Обсудить с менеджером','mailto:sale@bormassiv.ru?subject='+encodeURIComponent(p.name))}`:`<form data-form="product" data-id="${p.id}">${attributes.map(a => `<div class="variant-field"><label for="${e(a.id)}">${e(a.name)}</label><div class="select-wrap"><select id="${e(a.id)}" name="${e(a.id)}" data-variant="${p.id}" required><option value="">Выберите ${/тон|цвет/i.test(a.name)?'отделку':'вариант'}</option>${a.options.map(o => `<option value="${e(o.value)}">${e(o.label.replace(/\*/g,' × '))}</option>`).join('')}</select>${icon('down')}</div></div>`).join('')}<div id="variant-status" class="variant-status" aria-live="polite">${attributes.length?'Выберите комплектацию, чтобы увидеть точную цену.':'Комплектация представлена на фотографии.'}</div><div class="buy-row"><div class="quantity"><button type="button" data-action="qty-minus" aria-label="Уменьшить количество">${icon('minus')}</button><input id="product-qty" name="qty" type="number" min="1" max="99" value="1" aria-label="Количество"/><button type="button" data-action="qty-plus" aria-label="Увеличить количество">${icon('plus')}</button></div><button id="add-to-cart" class="button" type="submit" ${attributes.length?'disabled':''}>${icon('bag')}В корзину</button><button class="icon-button favorite-button-detail ${state.favorites.includes(p.id)?'selected':''}" type="button" data-action="favorite" data-id="${p.id}" aria-label="В избранное" aria-pressed="${state.favorites.includes(p.id)}">${icon('heart')}</button></div></form>`}<p class="price-note">Цены перенесены из каталога производителя. Наличие, срок изготовления и окончательную стоимость подтвердит менеджер.</p><div class="product-services"><a href="#/delivery">${icon('truck')}Доставка по России${icon('chevron')}</a><a href="#/warranty">${icon('shield')}Гарантия 18 месяцев${icon('chevron')}</a></div><div class="product-question">Нужна помощь с выбором? <a href="tel:+79218400002">+7 (921) 840-00-02</a></div></section></div><section class="product-information"><div class="tab-buttons" role="tablist" aria-label="Информация о товаре"><button role="tab" aria-selected="true" aria-controls="panel-description" id="tab-description" data-action="tab" data-tab="description">Описание</button><button role="tab" aria-selected="false" aria-controls="panel-specs" id="tab-specs" data-action="tab" data-tab="specs" tabindex="-1">Характеристики</button><button role="tab" aria-selected="false" aria-controls="panel-delivery" id="tab-delivery" data-action="tab" data-tab="delivery" tabindex="-1">Доставка и сборка</button></div><div class="tab-panel prose" role="tabpanel" aria-labelledby="tab-description" id="panel-description">${(p.descriptionBlocks||[p.description]).map(t=>`<p>${e(t)}</p>`).join('')}</div><div class="tab-panel" role="tabpanel" aria-labelledby="tab-specs" id="panel-specs" hidden><dl class="spec-table"><div><dt>Модель</dt><dd>${e(p.name)}</dd></div><div><dt>Артикул производителя</dt><dd>${e(p.sku||p.id)}</dd></div>${(p.specifications||[]).map(s=>`<div><dt>${e(s.name)}</dt><dd>${e(s.value.replace(/\*/g,' × '))}</dd></div>`).join('')}</dl></div><div class="tab-panel prose" role="tabpanel" aria-labelledby="tab-delivery" id="panel-delivery" hidden><p>Стоимость доставки рассчитывается по адресу, размерам и весу мебели. Самовывоз и сборку можно согласовать с менеджером.</p><a class="text-link" href="#/delivery">Подробнее о получении мебели ${icon('arrow')}</a></div></section><section class="section"><div class="section-heading"><div><span class="eyebrow">В том же настроении</span><h2>Вам может подойти</h2></div></div><div class="product-grid home-products">${related.map(card).join('')}</div></section></div>`;
}

function getSelection(p) {
  const form = document.querySelector('[data-form="product"]');
  if (!form) return {complete:false};
  const attrs = Object.fromEntries((p.attributes||[]).map(a=>[a.id,form.elements.namedItem(a.id).value]));
  const complete = Object.values(attrs).every(Boolean);
  const matches = (p.variants||[]).filter(v => Object.entries(attrs).every(([key,value]) => !value || !v.attributes[key] || v.attributes[key]===value));
  const variant = complete ? matches.find(v=>v.inStock && v.purchasable) : null;
  return {attrs,complete,variant,matches};
}

function updateVariant(id) {
  const p=byId(id), s=getSelection(p);
  productSelection=s;
  const price=document.querySelector('#selected-price'), status=document.querySelector('#variant-status'), add=document.querySelector('#add-to-cart');
  if (s.complete && s.variant) {
    price.textContent=money(s.variant.price);
    status.textContent=s.variant.description || 'Комплектация выбрана. Наличие подтвердит менеджер.';
    add.disabled=false;
    if(s.variant.image)document.querySelector('#main-product-image').src=s.variant.image;
  } else if (s.complete && !p.variants?.length) {
    price.textContent=priceLabel(p);
    status.textContent='Точная цена выбранного сочетания — по запросу. Укажем комплектацию в заявке.';
    add.disabled=false;
  } else {
    const prices=s.matches.filter(v=>v.inStock&&v.purchasable).map(v=>v.price);
    price.textContent=prices.length?`${prices.length>1?'от ':''}${money(Math.min(...prices))}`:priceLabel(p);
    status.textContent=s.complete?'Такое сочетание недоступно. Выберите другие параметры.':'Выберите комплектацию, чтобы увидеть точную цену.';
    add.disabled=true;
  }
}

function cartItems(compact=false) {
  return state.cart.map((item,index)=>{
    const p=byId(item.productId); if(!p)return '';
    const attrs=Object.entries(item.attributes||{}).map(([key,value])=>`${p.attributes?.find(a=>a.id===key)?.name||key}: ${value.replace(/\*/g,' × ')}`).join(' · ');
    return `<article class="cart-item"><a href="${productLink(p)}" data-action="close-dialogs"><img src="${e(item.image||p.image)}" alt="${e(p.name)}" width="120" height="120"/></a><div class="cart-item-info"><a href="${productLink(p)}" data-action="close-dialogs"><h3>${e(p.name)}</h3></a><p>${e(attrs)}</p><strong>${item.estimated?'от ':''}${money(item.price*item.qty)}</strong><div class="cart-item-bottom"><div class="quantity small"><button data-action="cart-qty" data-index="${index}" data-delta="-1" aria-label="Уменьшить количество ${e(p.name)}" ${item.qty<=1?'disabled':''}>${icon('minus')}</button><span>${item.qty}</span><button data-action="cart-qty" data-index="${index}" data-delta="1" aria-label="Увеличить количество ${e(p.name)}" ${item.qty>=99?'disabled':''}>${icon('plus')}</button></div><button class="remove-item" data-action="remove" data-index="${index}" aria-label="Убрать ${e(p.name)}">${icon('trash')}${compact?'':'Убрать'}</button></div></div></article>`;
  }).join('');
}

function openCart() {
  renderCart();
  const dialog=document.querySelector('#cart-drawer');
  if(!dialog.open)dialog.showModal();
}

function renderCart() {
  const dialog=document.querySelector('#cart-drawer');
  dialog.innerHTML=`<div class="drawer-heading"><div><span class="eyebrow">Ваш будущий уют</span><h2>Корзина <small>${cartCount()}</small></h2></div><button class="icon-button" data-action="close-dialogs" aria-label="Закрыть корзину">${icon('close')}</button></div>${state.cart.length?`<div class="drawer-items">${cartItems(true)}</div><div class="drawer-total"><div><span>Стоимость мебели</span><strong>${totalLabel()}</strong></div><p>Доставку и окончательные условия согласуем отдельно.</p><a class="button" href="#/checkout" data-action="close-dialogs">К оформлению заявки ${icon('arrow')}</a><button class="text-link" data-action="close-dialogs">Продолжить выбирать</button></div>`:`<div class="empty-state">${icon('bag')}<h3>Дома найдётся место<br/>для чего-то хорошего.</h3><p>Добавьте мебель, которая вам понравилась.</p><a href="#/catalog" class="button" data-action="close-dialogs">Перейти в каталог ${icon('arrow')}</a></div>`}`;
}

function checkout() {
  if(!state.cart.length) { main.innerHTML=`<div class="container">${crumb('Оформление заявки')}<div class="empty-state">${icon('bag')}<h1>Сначала найдём вашу мебель</h1><p>Добавьте товары в корзину, чтобы подготовить заявку.</p>${button('Открыть каталог','#/catalog')}</div></div>`;return; }
  main.innerHTML=`<div class="container checkout-page">${crumb('Оформление заявки')}<div class="catalog-title"><div><span class="eyebrow">Ещё на шаг ближе к дому</span><h1>Ваша заявка</h1></div></div><div class="checkout-layout"><div><div class="checkout-items">${cartItems()}</div><section class="checkout-form-section"><h2>Как с вами связаться</h2><p>Менеджер подтвердит наличие, стоимость мебели и доставки.</p><form id="order-form" data-form="order"><div class="form-grid"><label>Ваше имя<input name="name" required autocomplete="given-name" maxlength="80" placeholder="Как к вам обращаться"/></label><label>Телефон<input name="phone" type="tel" required autocomplete="tel" minlength="10" maxlength="25" placeholder="+7 (___) ___-__-__"/></label><label>Электронная почта<input name="email" type="email" autocomplete="email" maxlength="120" placeholder="Для ответа по заявке"/></label><label>Город получения<input name="city" required autocomplete="address-level2" maxlength="100" placeholder="Например, Боровичи"/></label></div><fieldset class="delivery-options"><legend>Способ получения</legend><label><input name="delivery" type="radio" value="Доставка" checked/>Доставка</label><label><input name="delivery" type="radio" value="Самовывоз, место согласовать"/>Самовывоз</label></fieldset><label class="full-label">Комментарий<textarea name="comment" maxlength="1500" rows="3" placeholder="Адрес, пожелания по сборке или вопрос о мебели"></textarea></label><label class="consent"><input name="consent" type="checkbox" required/><span>Согласен передать указанные данные магазину для обработки заявки. <a href="#/privacy" target="_blank">О конфиденциальности</a></span></label></form></section></div><aside class="order-summary"><span class="eyebrow">Ваш выбор</span><h2>Всё сложилось</h2><div class="summary-line"><span>${countLabel(cartCount())}</span><span>${totalLabel()}</span></div><div class="summary-line muted"><span>Доставка и сборка</span><span>По расчёту</span></div><div class="summary-total"><span>Мебель</span><strong>${totalLabel()}</strong></div><button class="button" form="order-form" type="submit">Подготовить заявку ${icon('arrow')}</button><p class="checkout-explainer">Откроется готовое письмо в магазин. Вы сможете проверить его и отправить из своей почты. Оплата на сайте не принимается.</p><div class="order-help">${icon('phone')}<span>Удобнее обсудить по телефону?<a href="tel:+79218400002">+7 (921) 840-00-02</a></span></div></aside></div><section id="order-result" class="order-result" hidden aria-live="polite"></section></div>`;
}

function refreshCheckout(){
  const form=document.querySelector('#order-form');
  const values=form?new FormData(form):null;
  checkout();
  const next=document.querySelector('#order-form');
  if(values&&next)for(const [key,value] of values){
    const field=next.elements.namedItem(key);
    if(field instanceof RadioNodeList)field.value=value;
    else if(field?.type==='checkbox')field.checked=true;
    else if(field)field.value=value;
  }
}
let preparedOrder='';
function prepareOrder(form) {
  const f=new FormData(form);
  const digits=String(f.get('phone')).replace(/\D/g,'');
  if(digits.length<10||digits.length>15){form.elements.phone.setCustomValidity('Укажите телефон: от 10 до 15 цифр');form.elements.phone.reportValidity();form.elements.phone.addEventListener('input',()=>form.elements.phone.setCustomValidity(''),{once:true});return;}
  const lines=['Заявка с сайта «Боровичи Массив Мебель»','',`Имя: ${f.get('name')}`,`Телефон: ${f.get('phone')}`,`Email: ${f.get('email')||'не указан'}`,`Город: ${f.get('city')}`,`Получение: ${f.get('delivery')}`,'','Выбранная мебель:'];
  state.cart.forEach((item,i)=>{
    const p=byId(item.productId);
    lines.push(`${i+1}. ${p.name}`,`   ${item.qty} шт. × ${money(item.price)} = ${money(item.qty*item.price)}`);
    for(const [key,v] of Object.entries(item.attributes||{}))lines.push(`   ${p.attributes?.find(a=>a.id===key)?.name||key}: ${v}`);
    lines.push(`   ID товара: ${p.id}${item.variantId?`, вариация: ${item.variantId}`:''}`,`   ${p.sourceUrl}`,'');
  });
  lines.push(`Мебель: ${totalLabel()}`,'Доставка, сборка, наличие и окончательная стоимость требуют подтверждения менеджера.',`Комментарий: ${f.get('comment')||'нет'}`,'','Прошу связаться со мной для согласования заказа.');
  preparedOrder=lines.join('\n');
  const mailto=`mailto:sale@bormassiv.ru?subject=${encodeURIComponent('Заявка на мебель — '+f.get('name'))}&body=${encodeURIComponent(preparedOrder)}`;
  const result=document.querySelector('#order-result');
  result.hidden=false;
  result.innerHTML=`<span class="eyebrow">Всё готово к отправке</span><h2>Осталось передать заявку магазину</h2><p>Заявка ещё не отправлена. Откройте письмо, проверьте детали и отправьте его на <strong>sale@bormassiv.ru</strong>. Если почтовая программа не настроена, скопируйте или скачайте текст.</p><div class="order-result-actions"><a class="button" href="${e(mailto)}">${icon('mail')}Открыть письмо с заявкой</a><button class="button button-outline" data-action="copy-order">${icon('copy')}Скопировать</button><button class="button button-outline" data-action="download-order">${icon('download')}Скачать .txt</button></div><details><summary>Посмотреть текст заявки</summary><pre>${e(preparedOrder)}</pre></details>`;
  result.scrollIntoView({behavior:'smooth',block:'center'});
}

function infoPage(type) {
  const info=site[type];
  if(!info)return notFound();
  if(type==='contacts')return contacts();
  main.innerHTML=`<div class="container info-page">${crumb(info.title)}<div class="info-hero"><div><span class="eyebrow">Боровичи Массив Мебель</span><h1>${e(info.title)}</h1><p>${e(info.intro||info.text)}</p></div><div class="info-symbol">${icon({delivery:'truck',warranty:'shield',assembly:'grid',cooperation:'leaf',production:'tree'}[type]||'info')}</div></div>${type==='production'?`<section class="production-layout"><div class="prose"><h2>Мебель, которой найдётся место</h2><p>Производство находится в Новгородской области, в Боровичах, местечко Кованько, д. 4. В каталоге собраны кровати, мягкая мебель, мебель для хранения, столы и изделия для сада.</p><p>Для многих моделей доступны разные размеры и варианты отделки. Их можно выбрать прямо в карточке товара и сохранить в заявке.</p>${button('Найти свою мебель','#/catalog')}</div><div class="material-art"><img src="${byId(1557)?.image}" alt="Комод КМ-1 из массива дерева"/><span>Красота — в фактуре.</span></div></section>`:''}<div class="info-cards">${(info.blocks||[]).map((b,i)=>`<article><span class="step-number">0${i+1}</span><h2>${e(b.title)}</h2><p>${e(b.text)}</p></article>`).join('')}</div>${type==='delivery'?`<section class="faq"><h2>Перед получением мебели</h2><details><summary>Как узнать точную стоимость доставки?${icon('plus')}</summary><p>Укажите город и адрес в комментарии к заявке. Менеджер рассчитает стоимость с учётом размеров, веса и состава заказа. Старые тарифы сайта не используются для автоматического расчёта.</p></details><details><summary>Можно ли заказать сборку?${icon('plus')}</summary><p>Да, возможность и стоимость услуги можно согласовать с менеджером. <a href="#/assembly">Подробнее о сборке</a>.</p></details><details><summary>Как подготовиться к доставке?${icon('plus')}</summary><p>Измерьте дверные проёмы и проходы, уточните габариты мебели и заранее обсудите подъём и занос. При получении проверьте упаковку, комплектность и состояние изделия.</p></details></section>`:''}${type==='warranty'?`<p class="source-note">Условия изложены по информации производителя. <a href="${e(info.source)}" target="_blank" rel="noopener noreferrer">Полные условия гарантии и возврата на исходном сайте ${icon('arrow')}</a></p>`:''}<section class="contact-strip"><div><span class="eyebrow">Ответим на ваши вопросы</span><h2>${type==='cooperation'?'Обсудим совместную работу?':'Поможем во всём разобраться.'}</h2></div><a class="button" href="${type==='cooperation'?'mailto:info@bormassiv.ru':'tel:+79218400002'}">${type==='cooperation'?'Написать нам':'+7 (921) 840-00-02'} ${icon(type==='cooperation'?'mail':'phone')}</a></section></div>`;
}

function contacts() {
  const c=site.contacts;
  main.innerHTML=`<div class="container info-page">${crumb('Контакты')}<div class="info-hero"><div><span class="eyebrow">Боровичи · Новгородская область</span><h1>Давайте знакомиться<br/><em>вживую.</em></h1><p>${e(c.intro)}</p></div><div class="info-symbol">${icon('pin')}</div></div><div class="contacts-grid"><section class="contact-location"><span class="eyebrow">Мебельный салон</span><h2>Прикоснитесь<br/>к будущему дому.</h2><p class="address">г. Боровичи,<br/>ул. Дзержинского, д. 23</p><a class="contact-large" href="tel:+79218400003">+7 (921) 840-00-03</a><p>10:00–18:00<br/><small>Перед поездкой уточните дни работы и наличие образцов.</small></p><a class="button" href="https://yandex.ru/maps/?text=${encodeURIComponent('Боровичи Дзержинского 23 мебель')}" target="_blank" rel="noopener noreferrer">Построить маршрут ${icon('arrow')}</a></section><section class="contact-details"><article><span>${icon('phone')}Отдел продаж</span><a href="tel:+79218400002">+7 (921) 840-00-02</a><p>Выбор мебели, наличие и оформление заказа</p></article><article><span>${icon('mail')}Электронная почта</span><a href="mailto:sale@bormassiv.ru">sale@bormassiv.ru</a><p>Заявки и вопросы о мебели</p><a class="secondary-mail" href="mailto:info@bormassiv.ru">info@bormassiv.ru — сотрудничество</a></article><article><span>${icon('tree')}Наше производство</span><h3>Боровичи, местечко Кованько, д. 4</h3><p>Приёмная: <a href="tel:+78166423710">+7 (81664) 2-37-10</a></p></article></section></div></div>`;
}

function privacy() {
  main.innerHTML=`<article class="container info-page legal-page">${crumb('Конфиденциальность')}<span class="eyebrow">Ваши данные</span><h1>Конфиденциальность</h1><div class="prose"><h2>Что хранится в браузере</h2><p>Корзина и избранное сохраняются локально в вашем браузере, чтобы вы могли вернуться к выбору. Вы можете удалить их, очистив данные сайта в настройках браузера. Аналитические и рекламные системы в этой версии не подключены.</p><h2>Как передаётся заявка</h2><p>Данные формы используются только для подготовки текста заявки. До отправки вами письма они не передаются на сервер магазина и не сохраняются на сервере этого сайта. При нажатии «Открыть письмо с заявкой» текст передаётся в выбранную вами почтовую программу. Отправляйте его, только проверив получателя и содержание.</p><h2>Обращения в магазин</h2><p>Для вопросов о данных и заказе свяжитесь с магазином: <a href="mailto:sale@bormassiv.ru">sale@bormassiv.ru</a>. С условиями исходного интернет-магазина можно ознакомиться на его <a href="http://bormassiv.ru/politika-konfidencialnosti/" target="_blank" rel="noopener noreferrer">странице политики конфиденциальности</a>.</p><h2>Внешние ссылки</h2><p>Карты, ВКонтакте и исходный сайт открываются только при переходе по соответствующей ссылке. Их работа регулируется правилами этих сервисов.</p></div></article>`;
}

function notFound() { main.innerHTML=`<div class="container empty-state"><span class="eyebrow">404</span><h1>Кажется, здесь пока пусто.</h1><p>Но в каталоге есть много хороших вещей для дома.</p>${button('Вернуться к мебели','#/catalog')}</div>`; }

function route() {
  closeDialogs();
  const hash=location.hash.slice(1)||'/';
  const [path,query='']=hash.split('?');
  const params=new URLSearchParams(query);
  const preserveScroll=previousRoute.split('?')[0]===path && ['#/catalog','#/favorites'].includes('#'+path) && !params.has('page');
  document.title='Боровичи Массив Мебель — с теплом дерева';
  if(path==='/')home();
  else if(path==='/catalog')catalogPage(params);
  else if(path==='/favorites')catalogPage(params,true);
  else if(path.startsWith('/product/'))productPage(decodeURIComponent(path.slice(9)));
  else if(path==='/checkout')checkout();
  else if(path==='/privacy')privacy();
  else if(['/production','/delivery','/assembly','/warranty','/contacts','/cooperation'].includes(path))infoPage(path.slice(1));
  else notFound();
  renderHeader();
  if(path!=='/'&&!path.startsWith('/product/')) document.title=`${main.querySelector('h1')?.textContent||'Каталог'} — Боровичи Массив Мебель`;
  previousRoute=hash;
  if(!preserveScroll)window.scrollTo({top:0,behavior:'instant'});
}

function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(d=>d.close()); }

function openMenu() {
  const d=document.querySelector('#mobile-menu');
  d.innerHTML=`<div class="drawer-heading"><h2>Каталог и магазин</h2><button class="icon-button" data-action="close-dialogs" aria-label="Закрыть меню">${icon('close')}</button></div><form class="header-search" data-form="search">${icon('search')}<input name="q" type="search" placeholder="Найти мебель" aria-label="Поиск мебели"/><button aria-label="Найти">${icon('arrow')}</button></form><nav>${catalog.categories.filter(c=>!c.parentId).map(c=>`<a href="${hrefCatalog(c.id)}">${e(nameOf(c.id))}${icon('chevron')}</a>`).join('')}<a href="#/contacts">Контакты${icon('pin')}</a><a href="#/delivery">Доставка и сборка${icon('truck')}</a><a href="#/production">Производство${icon('tree')}</a><a href="#/cooperation">Сотрудничество${icon('arrow')}</a><a href="#/warranty">Гарантия и возврат${icon('shield')}</a></nav><a class="menu-phone" href="tel:+79218400002">+7 (921) 840-00-02</a>`;
  d.showModal();
}

document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-action]');
  if(!target)return;
  const action=target.dataset.action;
  if(action==='favorite') {
    toggleFavorite(Number(target.dataset.id));
    const selected=state.favorites.includes(Number(target.dataset.id));
    document.querySelectorAll(`[data-action="favorite"][data-id="${target.dataset.id}"]`).forEach(b=>{b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));b.setAttribute('aria-label',selected?'Убрать из избранного':'В избранное');});
    if(location.hash.startsWith('#/favorites'))catalogPage(new URLSearchParams(location.hash.split('?')[1]),true);
    toast(selected?'Сохранено в избранное':'Убрано из избранного');
  }
  if(action==='cart')openCart();
  if(action==='menu')openMenu();
  if(action==='close-dialogs')closeDialogs();
  if(action==='qty-minus'||action==='qty-plus') { const input=document.querySelector('#product-qty'); input.value=Math.max(1,Math.min(99,(Number(input.value)||1)+(action==='qty-plus'?1:-1))); }
  if(action==='remove') { state.cart.splice(Number(target.dataset.index),1);save();renderCart();if(location.hash==='#/checkout')refreshCheckout(); }
  if(action==='cart-qty') { const item=state.cart[Number(target.dataset.index)];item.qty=Math.min(99,Math.max(1,item.qty+Number(target.dataset.delta)));save();renderCart();if(location.hash==='#/checkout')refreshCheckout(); }
  if(action==='gallery') { document.querySelector('#main-product-image').src=target.dataset.image;document.querySelectorAll('[data-action="gallery"]').forEach(b=>b.classList.toggle('active',b===target)); }
  if(action==='zoom') { const img=document.querySelector('#main-product-image');const d=document.querySelector('#lightbox');d.innerHTML=`<button class="icon-button" data-action="close-dialogs" aria-label="Закрыть фото">${icon('close')}</button><img src="${e(img.src)}" alt="${e(img.alt)}"/>`;d.showModal(); }
  if(action==='tab') {document.querySelectorAll('[data-action="tab"]').forEach(b=>{const selected=b===target;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});document.querySelectorAll('.tab-panel').forEach(p=>p.hidden=p.id!==`panel-${target.dataset.tab}`);}
  if(action==='copy-order') { try { await navigator.clipboard.writeText(preparedOrder);toast('Текст заявки скопирован'); } catch { const details=document.querySelector('#order-result details');details.open=true;const pre=details.querySelector('pre'); const range=document.createRange();range.selectNodeContents(pre);window.getSelection().removeAllRanges();window.getSelection().addRange(range);toast('Текст выделен — скопируйте его сочетанием клавиш'); } }
  if(action==='download-order') { const url=URL.createObjectURL(new Blob([preparedOrder],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Заявка-Боровичи-Массив-Мебель.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
});

document.addEventListener('change',event=>{
  if(event.target.matches('[data-variant]'))updateVariant(event.target.dataset.variant);
  if(event.target.matches('[data-param]')) { const params=new URLSearchParams(location.hash.split('?')[1]);params.set(event.target.dataset.param,event.target.value);params.delete('page');location.hash=`${location.hash.split('?')[0]}?${params}`; }
});

document.addEventListener('submit',event=>{
  const form=event.target;
  if(!form.dataset.form)return;
  event.preventDefault();
  if(form.dataset.form==='search') {const q=new FormData(form).get('q').trim();location.hash=`#/catalog${q?'?q='+encodeURIComponent(q):''}`;}
  if(form.dataset.form==='filters') { const data=new FormData(form), params=new URLSearchParams();for(const [k,v] of data)if(v&&k!=='base')params.set(k,v);if(Number(data.get('max'))>0&&Number(data.get('max'))<Number(data.get('min'))) {toast('Максимальная цена должна быть больше минимальной');return;}location.hash=`${data.get('base')}?${params}`;}
  if(form.dataset.form==='product') {
    const p=byId(form.dataset.id),s=getSelection(p);
    if(p.attributes?.length && (!s.complete || (!s.variant && p.variants?.length)))return;
    const qty=Math.max(1,Math.min(99,Number(new FormData(form).get('qty'))||1));
    addItem(p,s.variant,s.attrs,qty);openCart();toast('Мебель добавлена в корзину');
  }
  if(form.dataset.form==='order')prepareOrder(form);
});

document.addEventListener('keydown',event=>{
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k') {event.preventDefault();document.querySelector('#header-query')?.focus();}
  if(event.target.matches('[role="tab"]')&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {event.preventDefault();const tabs=[...document.querySelectorAll('[role="tab"]')];let idx=tabs.indexOf(event.target);idx=event.key==='Home'?0:event.key==='End'?tabs.length-1:(idx+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[idx].click();tabs[idx].focus();}
});

document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
window.addEventListener('hashchange',route);
window.addEventListener('storechange',()=>{
  document.querySelectorAll('.cart-count').forEach(el=>{el.textContent=cartCount();el.hidden=!cartCount();});
  document.querySelectorAll('.favorite-count').forEach(el=>{el.textContent=state.favorites.length;el.hidden=!state.favorites.length;});
});

try {
  const responses=await Promise.all([fetch(new URL('./data/catalog.json',import.meta.url)),fetch(new URL('./data/site.json',import.meta.url))]);
  if(responses.some(r=>!r.ok))throw new Error('Не удалось получить каталог');
  [catalog,site]=await Promise.all(responses.map(r=>r.json()));
  state.cart=state.cart.filter(i=>byId(i.productId));
  renderFooter();route();
} catch(error) {
  main.innerHTML=`<div class="container empty-state">${icon('info')}<h1>Каталог временно не загрузился</h1><p>Проверьте подключение и обновите страницу. Мы также поможем по телефону.</p><a class="button" href="tel:+79218400002">+7 (921) 840-00-02 ${icon('phone')}</a></div>`;
  console.error(error);
}
