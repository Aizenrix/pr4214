import { PRODUCTS, WORKS, POSTS } from "./js/data.js";
import { qs, qsa, formatRub, formatDateRu, escapeHtml } from "./js/utils.js";

const CART_STORAGE_KEY = "operatorplus_cart_v1";
const COMMENT_STORAGE_KEY = "operatorplus_comments_v1";

const state = {
  shopFilter: "all",
  workTags: new Set(["all"]),
  cart: { items: {} },
  comments: [],
  activePostId: POSTS[0]?.id || "post-1",
};

function loadState() {
  try {
    const cartRaw = localStorage.getItem(CART_STORAGE_KEY);
    if (cartRaw) {
      const parsed = JSON.parse(cartRaw);
      if (parsed?.items && typeof parsed.items === "object") state.cart.items = parsed.items;
    }
  } catch {}

  try {
    const commentsRaw = localStorage.getItem(COMMENT_STORAGE_KEY);
    if (commentsRaw) {
      const parsed = JSON.parse(commentsRaw);
      if (Array.isArray(parsed)) state.comments = parsed;
    }
  } catch {}
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
}

function saveComments() {
  localStorage.setItem(COMMENT_STORAGE_KEY, JSON.stringify(state.comments));
}

function getCartLines() {
  return Object.entries(state.cart.items)
    .map(([id, qty]) => {
      const product = PRODUCTS.find((p) => p.id === id);
      return product ? { product, qty } : null;
    })
    .filter(Boolean);
}

function getCartCount() {
  return Object.values(state.cart.items).reduce((sum, n) => sum + n, 0);
}

function getCartSum() {
  return getCartLines().reduce((sum, line) => sum + line.product.price * line.qty, 0);
}

function productById(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function renderCartBadge() {
  const badge = qs("[data-cart-count]");
  if (badge) badge.textContent = String(getCartCount());
}

function renderShop() {
  const grid = qs("[data-shop-grid]");
  if (!grid) return;

  const list = PRODUCTS.filter((p) => {
    if (state.shopFilter === "all") return true;
    if (state.shopFilter === "cheap") return p.price <= 1200;
    if (state.shopFilter === "expensive") return p.price >= 5000;
    return p.category === state.shopFilter;
  });

  grid.innerHTML = list
    .map((p) => `
      <article class="shop-card">
        <div class="card-media">
          <button class="card-title-btn" type="button" data-action="open-product" data-product-id="${p.id}" aria-label="Открыть товар: ${escapeHtml(p.title)}">
            <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
          </button>
        </div>
        <div class="card-meta">
          <button class="card-title-btn" type="button" data-action="open-product" data-product-id="${p.id}">${escapeHtml(p.title)}</button>
          <span class="price">${formatRub(p.price)} ₽</span>
        </div>
        <div class="sku">Артикул: ${escapeHtml(p.sku)}</div>
        <p class="card-desc">${escapeHtml(p.description)}</p>
        <div class="card-actions">
          <button class="btn btn-primary btn-small" type="button" data-action="add-to-cart" data-product-id="${p.id}">В корзину</button>
          <button class="btn btn-secondary btn-small" type="button" data-action="open-product" data-product-id="${p.id}">Подробнее</button>
        </div>
      </article>
    `)
    .join("");
}

function renderProductModal(productId) {
  const host = qs("[data-product-modal]");
  const p = productById(productId);
  if (!host || !p) return;

  host.innerHTML = `
    <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
    <div>
      <h3>${escapeHtml(p.title)}</h3>
      <div class="product-meta">Артикул: ${escapeHtml(p.sku)} · Категория: ${escapeHtml(p.category)}</div>
      <div class="price" style="margin-bottom:10px">${formatRub(p.price)} ₽</div>
      <p class="product-desc">${escapeHtml(p.description)}</p>
      ${p.variant ? `<p class="product-desc"><strong>Вариант:</strong> ${escapeHtml(p.variant)}</p>` : ""}
      <div class="card-actions">
        <button class="btn btn-primary btn-small" type="button" data-action="add-to-cart" data-product-id="${p.id}">В корзину</button>
        <button class="btn btn-secondary btn-small" type="button" data-action="open-cart">Открыть корзину</button>
      </div>
    </div>
  `;
}

function renderCart() {
  renderCartBadge();
  const listHost = qs("[data-cart-list]");
  const sumHost = qs("[data-cart-sum]");
  if (!listHost || !sumHost) return;

  const lines = getCartLines();
  sumHost.textContent = formatRub(getCartSum());

  if (!lines.length) {
    listHost.innerHTML = `<div class="comment-item"><div class="comment-item__name">Корзина пустая</div></div>`;
    return;
  }

  listHost.innerHTML = lines
    .map(({ product, qty }) => `
      <div class="cart-item">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
        <div>
          <div class="cart-item__title">${escapeHtml(product.title)}</div>
          <div class="cart-item__meta">Артикул: ${escapeHtml(product.sku)}</div>
          <div class="qty">
            <button type="button" data-action="dec-qty" data-product-id="${product.id}">−</button>
            <span>${qty}</span>
            <button type="button" data-action="inc-qty" data-product-id="${product.id}">+</button>
          </div>
        </div>
        <div class="cart-item__right">
          <div class="cart-item__price">${formatRub(product.price * qty)} ₽</div>
          <button class="link-danger" type="button" data-action="remove-item" data-product-id="${product.id}">Удалить</button>
        </div>
      </div>
    `)
    .join("");
}

function renderPortfolio() {
  const grid = qs("[data-portfolio-grid]");
  if (!grid) return;
  const list = WORKS.filter((w) => {
    if (state.workTags.has("all")) return true;
    return Array.from(state.workTags).every((t) => w.tags.includes(t));
  });

  grid.innerHTML = list
    .map((w) => `
      <article class="work-card">
        <div class="card-media"><img src="${escapeHtml(w.image)}" alt="${escapeHtml(w.title)}"></div>
        <div class="card-meta">
          <div style="font-weight:900;color:#fff">${escapeHtml(w.title)}</div>
          <div class="sku">${w.tags.map(escapeHtml).join(", ")}</div>
        </div>
        <p class="card-desc">${escapeHtml(w.description)}</p>
      </article>
    `)
    .join("");
}

function renderPortfolioButtons() {
  qsa("[data-portfolio-filter]").forEach((btn) => {
    const key = btn.getAttribute("data-portfolio-filter");
    btn.classList.toggle("is-active", !!key && state.workTags.has(key));
  });
}

function renderBlogCards() {
  const grid = qs("[data-blog-grid]");
  if (!grid) return;
  grid.innerHTML = POSTS.map((p) => `
    <article class="blog-card">
      <div class="card-meta">
        <button class="card-title-btn" type="button" data-action="open-post" data-post-id="${p.id}">${escapeHtml(p.title)}</button>
        <span class="sku">${escapeHtml(formatDateRu(p.date))}</span>
      </div>
      <p class="card-desc">${escapeHtml(p.excerpt)}</p>
    </article>
  `).join("");
}

function renderPost(postId) {
  const host = qs("[data-post]");
  const post = POSTS.find((p) => p.id === postId) || POSTS[0];
  if (!host || !post) return;
  state.activePostId = post.id;
  host.innerHTML = `
    <h3>${escapeHtml(post.title)}</h3>
    <div class="post-date">${escapeHtml(formatDateRu(post.date))}</div>
    ${post.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
  `;
  renderComments();
}

function renderComments() {
  const list = qs("[data-comment-list]");
  if (!list) return;
  const filtered = state.comments.filter((c) => c.postId === state.activePostId);
  if (!filtered.length) {
    list.innerHTML = `<div class="comment-item"><div class="comment-item__text">Комментариев пока нет — будь первым.</div></div>`;
    return;
  }

  list.innerHTML = filtered
    .map((c) => `
      <div class="comment-item">
        <div class="comment-item__head">
          <div class="comment-item__name">${escapeHtml(c.name)}</div>
          <div class="comment-item__date">${escapeHtml(formatDateRu(c.createdAt))}</div>
        </div>
        <div class="comment-item__text">${escapeHtml(c.text)}</div>
        <button class="like-btn" type="button" data-action="like-comment" data-created-at="${escapeHtml(c.createdAt)}">❤ Лайк (${c.likes || 0})</button>
      </div>
    `)
    .join("");
}

function openModal(name) {
  const modal = qs(`[data-modal="${name}"]`);
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModals() {
  qsa(".modal.is-open").forEach((m) => {
    m.classList.remove("is-open");
    m.setAttribute("aria-hidden", "true");
  });
  document.body.style.overflow = "";
}

function updateToTop() {
  const btn = qs('[data-action="to-top"]');
  if (btn) btn.classList.toggle("is-visible", window.scrollY > 250);
}

function updateReadingProgress() {
  if (location.hash !== "#blog") return;
  const blog = qs("#blog.page");
  const bar = qs("[data-reading-bar]");
  if (!blog || !bar) return;
  const rect = blog.getBoundingClientRect();
  const visible = Math.max(0, window.innerHeight - rect.top);
  const pct = Math.max(0, Math.min(1, visible / Math.max(blog.scrollHeight, 1)));
  bar.style.width = `${Math.round(pct * 100)}%`;
}

function onClick(e) {
  const target = e.target instanceof HTMLElement ? e.target.closest("[data-action]") : null;
  if (!target) return;
  const action = target.getAttribute("data-action");
  const productId = target.getAttribute("data-product-id");

  if (action === "open-cart") return renderCart(), openModal("cart");
  if (action === "close-modal") return closeModals();
  if (action === "to-top") return window.scrollTo({ top: 0, behavior: "smooth" });

  if (action === "add-to-cart" && productId) {
    state.cart.items[productId] = (state.cart.items[productId] || 0) + 1;
    saveCart();
    renderCartBadge();
    return;
  }
  if (action === "open-product" && productId) return renderProductModal(productId), openModal("product");
  if (action === "inc-qty" && productId) {
    state.cart.items[productId] = (state.cart.items[productId] || 0) + 1;
    saveCart();
    return renderCart();
  }
  if (action === "dec-qty" && productId) {
    const next = (state.cart.items[productId] || 0) - 1;
    if (next <= 0) delete state.cart.items[productId];
    else state.cart.items[productId] = next;
    saveCart();
    return renderCart();
  }
  if (action === "remove-item" && productId) {
    delete state.cart.items[productId];
    saveCart();
    return renderCart();
  }
  if (action === "clear-cart") {
    state.cart.items = {};
    saveCart();
    return renderCart();
  }
  if (action === "open-post") {
    const postId = target.getAttribute("data-post-id");
    if (postId) renderPost(postId);
    return;
  }
  if (action === "like-comment") {
    const createdAt = target.getAttribute("data-created-at");
    const idx = state.comments.findIndex((c) => c.postId === state.activePostId && c.createdAt === createdAt);
    if (idx > -1) {
      state.comments[idx].likes = (state.comments[idx].likes || 0) + 1;
      saveComments();
      renderComments();
    }
  }
}

function onShopFilter(e) {
  const btn = e.target instanceof HTMLElement ? e.target.closest("[data-filter]") : null;
  if (!btn) return;
  state.shopFilter = btn.getAttribute("data-filter") || "all";
  qsa('[aria-label="Фильтр каталога"] .filter-btn').forEach((b) =>
    b.classList.toggle("is-active", b.getAttribute("data-filter") === state.shopFilter)
  );
  renderShop();
}

function onPortfolioFilter(e) {
  const btn = e.target instanceof HTMLElement ? e.target.closest("[data-portfolio-filter]") : null;
  if (!btn) return;
  const key = btn.getAttribute("data-portfolio-filter");
  if (!key) return;
  if (key === "all") state.workTags = new Set(["all"]);
  else {
    state.workTags.delete("all");
    if (state.workTags.has(key)) state.workTags.delete(key);
    else state.workTags.add(key);
    if (!state.workTags.size) state.workTags.add("all");
  }
  renderPortfolioButtons();
  renderPortfolio();
}

function onCommentSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const name = String(fd.get("name") || "").trim();
  const text = String(fd.get("text") || "").trim();
  const hint = qs("[data-form-hint]");
  if (name.length < 2) return hint && (hint.textContent = "Имя должно быть не короче 2 символов.");
  if (!text) return hint && (hint.textContent = "Комментарий не должен быть пустым.");

  state.comments.unshift({
    postId: state.activePostId,
    name,
    text,
    likes: 0,
    createdAt: new Date().toISOString(),
  });
  saveComments();
  form.reset();
  if (hint) hint.textContent = "Комментарий добавлен.";
  renderComments();
}

function init() {
  loadState();
  renderCartBadge();
  renderShop();
  renderPortfolioButtons();
  renderPortfolio();
  renderBlogCards();
  renderPost(state.activePostId);

  document.addEventListener("click", onClick);
  window.addEventListener("scroll", () => {
    updateToTop();
    updateReadingProgress();
  });
  window.addEventListener("hashchange", () => {
    closeModals();
    updateReadingProgress();
  });

  const shopFilters = qs('[aria-label="Фильтр каталога"]');
  if (shopFilters) shopFilters.addEventListener("click", onShopFilter);
  const portfolioFilters = qs('[aria-label="Фильтр портфолио"]');
  if (portfolioFilters) portfolioFilters.addEventListener("click", onPortfolioFilter);
  const commentForm = qs("[data-comment-form]");
  if (commentForm) commentForm.addEventListener("submit", onCommentSubmit);
}

init();
