/**
 * Aplicación Principal SPA - Amigo Secreto Familiar
 * 100% Adaptada para Celular y Escritorio, con Iconografía Vectorial Personalizada
 */

const CATEGORIES = {
  tech: { label: 'Tecnología y Audio' },
  fashion: { label: 'Ropa, Calzado y Accesorios' },
  books: { label: 'Libros y Papelería' },
  home: { label: 'Hogar y Decoración' },
  hobbies: { label: 'Juegos, Deporte y Hobbies' },
  beauty: { label: 'Cuidado Personal y Perfumería' },
  sweets: { label: 'Dulces, Café y Gourmet' },
  other: { label: 'Otro Regalo' },
};

const PRIORITIES = {
  dream: { badge: 'Lo quiero mucho', className: 'berry' },
  high: { badge: 'Me encantaría', className: 'pine' },
  medium: { badge: 'Buena opción', className: 'gold' },
  low: { badge: 'Idea adicional', className: '' },
};

const GIFT_STATUSES = {
  pending: { label: 'Pensando qué regalar', badge: 'gold' },
  shopping: { label: 'Buscando o en camino', badge: 'gold' },
  wrapped: { label: 'Comprado y envuelto', badge: 'pine' },
  ready: { label: 'Listo para entregar', badge: 'pine' },
};

function icon(name) {
  return (window.UI_ICONS && window.UI_ICONS[name]) || '';
}

function avatarHtml(key, size = 'md') {
  if (window.renderAvatarBadge) {
    return window.renderAvatarBadge(key, size);
  }
  return '';
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateTimeHuman(dateStr) {
  if (!dateStr) return 'Por definir';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Por definir';
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTimeInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

class AmigoSecretoApp {
  constructor() {
    this.token = localStorage.getItem('amigo_secreto_token') || null;
    this.user = null;
    this.families = [];
    this.activeFamily = null;

    this.activeTab = 'my_match'; // 'my_match' | 'my_wishes' | 'family_wishes' | 'members' | 'messages' | 'admin'
    this.matchSubTab = 'wishes'; // 'wishes' | 'sizes' | 'status'
    this.messagesSubTab = 'to_giftee'; // 'to_giftee' | 'to_santa' | 'family_wall'
    this.adminSubTab = 'draw'; // 'draw' | 'budget' | 'exclusions'

    this.authMode = 'login';
    this.selectedAvatar = 'santa';
    this.selectedWishPriority = 'high';
    this.wishFilterUser = 'all';
    this.inviteCodeFromUrl = null;
    this.invitePreview = null;
    this.demoUsers = [];
    this.countdownInterval = null;
    this.isUnwrappingAnimation = false;
  }

  async init() {
    window.christmasEffects.init();
    if (window.soundEngine.musicEnabled) {
      window.soundEngine.startMusicBox();
    }

    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join') || params.get('familia') || params.get('code');
    if (joinParam) {
      this.inviteCodeFromUrl = joinParam.trim().toUpperCase();
      await this.fetchInvitePreview(this.inviteCodeFromUrl);
    }

    this.renderNavbar();

    if (this.token) {
      const ok = await this.loadCurrentUser();
      if (ok) {
        if (this.inviteCodeFromUrl) {
          await this.joinFamilyByCode(this.inviteCodeFromUrl, true);
          window.history.replaceState({}, document.title, '/');
        }
        await this.loadFamilies();
        return;
      }
    }

    await this.loadDemoAccounts();
    this.renderAuthView();
  }

  async api(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const res = await fetch(`/api${path}`, {
      ...options,
      headers,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Ocurrió un error inesperado.');
    }
    return data;
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast-item';
    el.innerHTML = `${icon('check')}<span>${escapeHtml(message)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'all 0.25s ease';
      setTimeout(() => el.remove(), 260);
    }, 3000);
  }

  // =========================================================================
  // BARRA SUPERIOR ADAPTADA A MÓVIL Y ESCRITORIO
  // =========================================================================
  renderNavbar() {
    const nav = document.getElementById('navbar-controls');
    if (!nav) return;

    const sfxActive = window.soundEngine.sfxEnabled;
    const musicActive = window.soundEngine.musicEnabled;

    let html = '';

    if (this.user && this.families.length > 0) {
      html += `
        <button class="icon-chip active" onclick="window.app.openFamilySwitcherModal()" title="Cambiar de familia">
          ${icon('users')}
          <span class="hide-mobile">${this.activeFamily ? escapeHtml(this.activeFamily.name) : 'Familias'}</span>
          <span>(${this.families.length})</span>
        </button>
      `;
    }

    html += `
      <button class="icon-chip ${sfxActive ? 'active' : ''}" onclick="window.app.toggleSfx()" title="Efectos de sonido">
        ${sfxActive ? icon('volumeOn') : icon('volumeOff')}
        <span class="hide-mobile">${sfxActive ? 'Sonido' : 'Silencio'}</span>
      </button>
      <button class="icon-chip ${musicActive ? 'active' : ''}" onclick="window.app.toggleMusic()" title="Música ambiental">
        ${icon('music')}
        <span class="hide-mobile">${musicActive ? 'Música ON' : 'Música'}</span>
      </button>
    `;

    if (this.user) {
      html += `
        <button class="icon-chip" onclick="window.app.openProfileModal()" title="Mi perfil y tallas">
          ${icon('user')}
          <span>${escapeHtml(this.user.name.split(' ')[0])}</span>
        </button>
        <button class="icon-chip" onclick="window.app.logout()" style="color:var(--berry);" title="Cerrar sesión">
          ${icon('logOut')}
          <span class="hide-mobile">Salir</span>
        </button>
      `;
    }

    nav.innerHTML = html;
  }

  toggleSfx() {
    const state = window.soundEngine.toggleSfx();
    this.renderNavbar();
    this.showToast(state ? 'Efectos de sonido activados' : 'Sonidos silenciados');
  }

  toggleMusic() {
    const state = window.soundEngine.toggleMusic();
    this.renderNavbar();
    this.showToast(state ? 'Música navideña activada' : 'Música pausada');
  }

  async fetchInvitePreview(code) {
    try {
      const data = await this.api(`/families/preview/${encodeURIComponent(code)}`);
      this.invitePreview = data.family;
    } catch (_) {
      this.invitePreview = null;
    }
  }

  async loadDemoAccounts() {
    try {
      const data = await this.api('/seed/demo-accounts');
      this.demoUsers = data.demoUsers || [];
    } catch (_) {
      this.demoUsers = [];
    }
  }

  async loadCurrentUser() {
    try {
      const data = await this.api('/auth/me');
      this.user = data.user;
      this.renderNavbar();
      return true;
    } catch (_) {
      this.token = null;
      localStorage.removeItem('amigo_secreto_token');
      this.user = null;
      this.renderNavbar();
      return false;
    }
  }

  async loadFamilies(preferredFamilyId = null) {
    try {
      const data = await this.api('/families');
      this.families = data.families || [];
      this.renderNavbar();

      if (this.families.length === 0) {
        this.activeFamily = null;
        this.renderDashboard();
        return;
      }

      const targetId =
        preferredFamilyId ||
        (this.activeFamily && this.families.some((f) => f._id === this.activeFamily._id)
          ? this.activeFamily._id
          : this.families[0]._id);

      await this.selectFamily(targetId, false);
    } catch (err) {
      this.showToast(err.message);
    }
  }

  async selectFamily(familyId, playSound = true) {
    try {
      if (playSound) window.soundEngine.playClick();
      const data = await this.api(`/families/${familyId}`);
      this.activeFamily = data.family;
      this.wishFilterUser = 'all';
      this.closeModal();
      this.renderNavbar();
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  goHome() {
    window.soundEngine.playClick();
    if (this.user) {
      this.activeTab = 'my_match';
      this.renderDashboard();
    } else {
      this.renderAuthView();
    }
  }

  logout() {
    window.soundEngine.playClick();
    this.token = null;
    this.user = null;
    this.families = [];
    this.activeFamily = null;
    localStorage.removeItem('amigo_secreto_token');
    this.renderNavbar();
    this.loadDemoAccounts().then(() => this.renderAuthView());
  }

  // =========================================================================
  // VISTA DE LOGIN Y REGISTRO
  // =========================================================================
  renderAuthView() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    const root = document.getElementById('app-root');
    if (!root) return;

    const inviteBanner = this.invitePreview
      ? `
      <div class="clean-card" style="max-width:500px; margin:0 auto 1.15rem auto; border-left:4px solid var(--pine); padding:1.15rem 1.35rem;">
        <span class="soft-badge pine">${icon('ticket')} Invitación Familiar</span>
        <h3 class="font-festive" style="font-size:1.3rem; margin-top:0.35rem;">
          Te invitaron a "${escapeHtml(this.invitePreview.name)}"
        </h3>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.2rem;">
          Organiza: <strong>${escapeHtml(this.invitePreview.creatorName)}</strong> · Código: <strong>${escapeHtml(this.invitePreview.code)}</strong>
        </p>
      </div>
    `
      : '';

    const avatarSelectorHtml = Object.entries(window.AVATARS || {})
      .map(
        ([key, val]) => `
        <div class="avatar-option ${this.selectedAvatar === key ? 'selected' : ''}" data-avatar="${key}" onclick="window.app.selectAuthAvatar('${key}')">
          ${avatarHtml(key, 'md')}
          <span class="label">${val.label}</span>
        </div>
      `
      )
      .join('');

    const demoHtml =
      this.demoUsers.length > 0
        ? `
      <div style="max-width:500px; margin:1.25rem auto 0 auto; text-align:center;">
        <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.55rem;">
          Acceso rápido de prueba con familias de ejemplo:
        </p>
        <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:0.4rem;">
          ${this.demoUsers
            .map(
              (u) => `
            <button class="icon-chip" onclick="window.app.quickDemoLogin('${u.username}')">
              ${avatarHtml(u.avatar, 'sm')}
              <span>${escapeHtml(u.name.replace(' (Creador)', ''))}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    `
        : '';

    root.innerHTML = `
      ${inviteBanner}

      <div class="clean-card" style="max-width:500px; margin:0 auto;">
        <div style="text-align:center; margin-bottom:1.35rem;">
          <div style="width:52px; height:52px; border-radius:16px; background:var(--pine-light); color:var(--pine); display:inline-flex; align-items:center; justify-content:center; margin-bottom:0.6rem;">
            ${icon('gift')}
          </div>
          <h1 class="font-festive" style="font-size:1.85rem; color:var(--pine-dark);">
            Amigo Secreto en Familia
          </h1>
          <p style="color:var(--text-secondary); font-size:0.9rem; margin-top:0.25rem;">
            Participa en una o varias familias, comparte tu lista de deseos y descubre a quién le regalas.
          </p>
        </div>

        <div class="sub-nav" style="margin-bottom:1.35rem;">
          <button
            class="sub-nav-btn ${this.authMode === 'login' ? 'active' : ''}"
            onclick="window.app.setAuthMode('login')"
          >
            Iniciar Sesión
          </button>
          <button
            class="sub-nav-btn ${this.authMode === 'register' ? 'active' : ''}"
            onclick="window.app.setAuthMode('register')"
          >
            Crear Cuenta
          </button>
        </div>

        ${
          this.authMode === 'login'
            ? `
          <form onsubmit="window.app.handleLogin(event)">
            <div class="form-group">
              <label class="form-label">Usuario o Correo</label>
              <input type="text" id="login-username" class="form-input" placeholder="Ej: carlos, elena, lucia..." required />
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input type="password" id="login-password" class="form-input" placeholder="Ingresa tu contraseña" required />
            </div>

            <div class="form-group">
              <label class="form-label">Código de Familia <span style="font-weight:400; color:var(--text-muted);">(Opcional)</span></label>
              <input
                type="text"
                id="login-family-code"
                class="form-input"
                placeholder="Ej: GARCIA26"
                value="${escapeHtml(this.inviteCodeFromUrl || '')}"
                style="text-transform:uppercase;"
              />
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.35rem;">
              Entrar a mi Cuenta
            </button>
          </form>
        `
            : `
          <form onsubmit="window.app.handleRegister(event)">
            <div class="form-group">
              <label class="form-label">Tu Nombre (como te conoce tu familia)</label>
              <input type="text" id="reg-name" class="form-input" placeholder="Ej: Tía Laura, Primo Diego..." required />
            </div>

            <div class="grid-2" style="gap:0.75rem;">
              <div class="form-group">
                <label class="form-label">Usuario o Correo</label>
                <input type="text" id="reg-username" class="form-input" placeholder="Ej: laura" required />
              </div>
              <div class="form-group">
                <label class="form-label">Contraseña</label>
                <input type="password" id="reg-password" class="form-input" placeholder="Fácil de recordar" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Elige tu Emblema Navideño</label>
              <div class="avatar-grid">
                ${avatarSelectorHtml}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Código de Familia <span style="font-weight:400; color:var(--text-muted);">(Opcional)</span></label>
              <input
                type="text"
                id="reg-family-code"
                class="form-input"
                placeholder="Ej: GARCIA26 (o déjalo vacío para crear una)"
                value="${escapeHtml(this.inviteCodeFromUrl || '')}"
                style="text-transform:uppercase;"
              />
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.35rem;">
              Registrarme Ahora
            </button>
          </form>
        `
        }
      </div>

      ${demoHtml}
    `;
  }

  setAuthMode(mode) {
    window.soundEngine.playClick();
    this.authMode = mode;
    this.renderAuthView();
  }

  selectAuthAvatar(avatarKey) {
    window.soundEngine.playClick();
    this.selectedAvatar = avatarKey;
    document.querySelectorAll('.avatar-option').forEach((el) => {
      if (el.getAttribute('data-avatar') === avatarKey) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username')?.value;
    const password = document.getElementById('login-password')?.value;
    const familyCode = document.getElementById('login-family-code')?.value;

    try {
      const data = await this.api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, familyCode }),
      });

      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('amigo_secreto_token', data.token);
      window.soundEngine.playSuccess();
      this.inviteCodeFromUrl = null;
      window.history.replaceState({}, document.title, '/');
      this.renderNavbar();
      await this.loadFamilies(data.joinedFamilyId);
    } catch (err) {
      window.soundEngine.playError();
      this.showToast(err.message);
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name')?.value;
    const username = document.getElementById('reg-username')?.value;
    const password = document.getElementById('reg-password')?.value;
    const familyCode = document.getElementById('reg-family-code')?.value;

    try {
      const data = await this.api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          username,
          password,
          avatar: this.selectedAvatar,
          familyCode,
        }),
      });

      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('amigo_secreto_token', data.token);
      window.soundEngine.playSuccess();
      window.christmasEffects.launchConfetti(70);
      this.inviteCodeFromUrl = null;
      window.history.replaceState({}, document.title, '/');
      this.renderNavbar();
      await this.loadFamilies(data.joinedFamilyId);
    } catch (err) {
      window.soundEngine.playError();
      this.showToast(err.message);
    }
  }

  async quickDemoLogin(username) {
    try {
      const data = await this.api('/seed/quick-demo-login', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('amigo_secreto_token', data.token);
      window.soundEngine.playSuccess();
      this.renderNavbar();
      await this.loadFamilies();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  // =========================================================================
  // DASHBOARD PRINCIPAL (100% RESPONSIVO EN CELULAR Y ESCRITORIO)
  // =========================================================================
  renderDashboard() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    const root = document.getElementById('app-root');
    if (!root) return;

    if (!this.activeFamily) {
      root.innerHTML = `
        <div class="clean-card" style="text-align:center; padding:3rem 1.25rem; max-width:560px; margin:1rem auto;">
          <div style="width:56px; height:56px; border-radius:18px; background:var(--pine-light); color:var(--pine); display:inline-flex; align-items:center; justify-content:center; margin-bottom:0.75rem;">
            ${icon('users')}
          </div>
          <h2 class="font-festive" style="font-size:1.75rem; margin-bottom:0.45rem;">
            ¡Bienvenido, ${escapeHtml(this.user.name)}!
          </h2>
          <p style="color:var(--text-secondary); margin-bottom:1.4rem; font-size:0.92rem;">
            Únete al grupo de tu familia ingresando su código o crea una nueva familia para organizar el intercambio.
          </p>
          <div style="display:flex; justify-content:center; gap:0.65rem; flex-wrap:wrap;">
            <button class="btn btn-pine" onclick="window.app.openJoinFamilyModal()">
              ${icon('ticket')} Unirme con Código
            </button>
            <button class="btn btn-primary" onclick="window.app.openCreateFamilyModal()">
              ${icon('plus')} Crear Nueva Familia
            </button>
          </div>
        </div>
      `;
      return;
    }

    const fam = this.activeFamily;
    const myWishesCount = fam.wishlist.filter((w) => String(w.user) === String(this.user._id)).length;

    root.innerHTML = `
      <!-- Encabezado de la Familia Activa -->
      <section class="family-header-bar">
        <div>
          <div style="display:flex; align-items:center; gap:0.55rem; flex-wrap:wrap;">
            <h1 class="font-festive" style="font-size:1.45rem; color:var(--pine-dark);">
              ${escapeHtml(fam.name)}
            </h1>
            <span class="soft-badge pine">Código: ${escapeHtml(fam.code)}</span>
          </div>

          <div class="family-meta-pills">
            <span class="soft-badge">
              ${icon('tag')}
              <span><strong>${escapeHtml(fam.settings?.currency || '$')}${fam.settings?.budgetMin || 0} – ${fam.settings?.budgetMax || 0}</strong> (Sugerido: ${escapeHtml(fam.settings?.currency || '$')}${fam.settings?.recommendedAmount || fam.settings?.budgetMax || 0})</span>
            </span>
            <span class="soft-badge">
              ${icon('calendar')}
              <span>${formatDateTimeHuman(fam.settings?.exchangeDate)}</span>
            </span>
            <span class="soft-badge">
              ${icon('mapPin')}
              <span>${escapeHtml(fam.settings?.exchangeLocation || 'En familia')}</span>
            </span>
          </div>
        </div>

        <div class="family-header-actions" style="display:flex; gap:0.45rem; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="window.app.openInviteModal()">
            ${icon('share')}
            <span>Invitar</span>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.app.openFamilySwitcherModal()">
            ${icon('users')}
            <span>Mis Familias (${this.families.length})</span>
          </button>
        </div>
      </section>

      <!-- Pestañas Principales (En celular se acomodan en cuadrícula 3x2 táctil perfecta) -->
      <nav class="clean-tabs">
        <button
          class="clean-tab-btn ${this.activeTab === 'my_match' ? 'active' : ''}"
          onclick="window.app.switchTab('my_match')"
        >
          ${icon('gift')}
          <span>Mi Sorteo</span>
        </button>

        <button
          class="clean-tab-btn ${this.activeTab === 'my_wishes' ? 'active' : ''}"
          onclick="window.app.switchTab('my_wishes')"
        >
          ${icon('star')}
          <span>Mis Deseos</span>
          <span class="tab-count">${myWishesCount}</span>
        </button>

        <button
          class="clean-tab-btn ${this.activeTab === 'family_wishes' ? 'active' : ''}"
          onclick="window.app.switchTab('family_wishes')"
        >
          ${icon('sparkles')}
          <span>Deseos</span>
          <span class="tab-count">${fam.wishlist.length}</span>
        </button>

        <button
          class="clean-tab-btn ${this.activeTab === 'members' ? 'active' : ''}"
          onclick="window.app.switchTab('members')"
        >
          ${icon('users')}
          <span>Familia</span>
          <span class="tab-count">${fam.members.length}</span>
        </button>

        <button
          class="clean-tab-btn ${this.activeTab === 'messages' ? 'active' : ''}"
          onclick="window.app.switchTab('messages')"
        >
          ${icon('message')}
          <span>Mensajes</span>
        </button>

        ${
          fam.isAdmin
            ? `
          <button
            class="clean-tab-btn ${this.activeTab === 'admin' ? 'active' : ''}"
            onclick="window.app.switchTab('admin')"
          >
            ${icon('settings')}
            <span>Ajustes</span>
          </button>
        `
            : ''
        }
      </nav>

      <!-- Contenido de la Pestaña Activa -->
      <div id="tab-content-area">
        ${this.renderActiveTabContent()}
      </div>
    `;

    this.startLiveCountdowns();
  }

  switchTab(tabName) {
    window.soundEngine.playClick();
    this.activeTab = tabName;
    this.renderDashboard();
  }

  renderActiveTabContent() {
    switch (this.activeTab) {
      case 'my_match':
        return this.renderMyMatchTab();
      case 'my_wishes':
        return this.renderMyWishesTab();
      case 'family_wishes':
        return this.renderFamilyWishesTab();
      case 'members':
        return this.renderMembersTab();
      case 'messages':
        return this.renderMessagesTab();
      case 'admin':
        return this.renderAdminTab();
      default:
        return this.renderMyMatchTab();
    }
  }

  // =========================================================================
  // PESTAÑA 1: MI SORTEO
  // =========================================================================
  renderMyMatchTab() {
    const fam = this.activeFamily;

    if (fam.drawStatus !== 'completed') {
      return `
        <div class="clean-card" style="text-align:center; padding:2.5rem 1.25rem; max-width:620px; margin:0 auto;">
          <div style="width:54px; height:54px; border-radius:16px; background:var(--gold-soft); color:var(--gold); display:inline-flex; align-items:center; justify-content:center; margin-bottom:0.65rem;">
            ${icon('shuffle')}
          </div>
          <div><span class="soft-badge gold">Sorteo pendiente</span></div>
          <h2 class="font-festive" style="font-size:1.7rem; margin:0.55rem 0; color:var(--pine-dark);">
            Los familiares se están uniendo
          </h2>
          <p style="color:var(--text-secondary); max-width:440px; margin:0 auto 1.35rem auto; font-size:0.9rem;">
            Ya hay <strong>${fam.members.length} participantes</strong> registrados. Mientras se realiza el sorteo, te recomendamos anotar tus deseos y tallas.
          </p>

          <div style="display:flex; justify-content:center; gap:0.65rem; flex-wrap:wrap;">
            <button class="btn btn-pine" onclick="window.app.switchTab('my_wishes')">
              ${icon('star')} Anotar Mis Deseos
            </button>
            ${
              fam.isAdmin
                ? `
              <button class="btn btn-primary" onclick="window.app.switchTab('admin')">
                ${icon('shuffle')} Ir a Realizar el Sorteo
              </button>
            `
                : ''
            }
          </div>
        </div>
      `;
    }

    if (!fam.canRevealNow) {
      const isScheduled = fam.settings?.revealMode === 'scheduled' && fam.settings?.revealDate;
      return `
        <div class="clean-card" style="text-align:center; padding:2.5rem 1.25rem; max-width:620px; margin:0 auto;">
          <div style="width:54px; height:54px; border-radius:16px; background:var(--pine-light); color:var(--pine); display:inline-flex; align-items:center; justify-content:center; margin-bottom:0.65rem;">
            ${icon('lock')}
          </div>
          <div><span class="soft-badge pine">Sorteo realizado</span></div>
          <h2 class="font-festive" style="font-size:1.7rem; margin:0.55rem 0; color:var(--pine-dark);">
            Tu sobre secreto se abrirá pronto
          </h2>
          ${
            isScheduled
              ? `
            <p style="color:var(--text-secondary); font-size:0.9rem;">
              Fecha programada de apertura: <strong>${formatDateTimeHuman(fam.settings.revealDate)}</strong>
            </p>
            <div id="reveal-countdown-box" class="countdown-boxes" data-target="${escapeHtml(fam.settings.revealDate)}"></div>
          `
              : `
            <p style="color:var(--text-secondary); max-width:420px; margin:0 auto 1.15rem auto; font-size:0.9rem;">
              El organizador de la familia habilitará la apertura de sobres cuando todos estén listos.
            </p>
          `
          }

          ${
            fam.isAdmin
              ? `
            <div style="margin-top:1.15rem; padding-top:1.15rem; border-top:1px solid var(--border-light);">
              <button class="btn btn-pine btn-sm" onclick="window.app.quickUnlockReveal()">
                ${icon('unlock')} Desbloquear ahora para todos
              </button>
            </div>
          `
              : ''
          }
        </div>
      `;
    }

    if (!fam.myMember?.hasRevealed) {
      return `
        <div class="clean-card gift-stage">
          <span class="soft-badge berry">${icon('sparkles')} Tu sobre secreto está listo</span>
          <h2 class="font-festive" style="font-size:1.85rem; margin-top:0.5rem; color:var(--pine-dark);">
            Descubre a tu Amigo Secreto
          </h2>
          <p style="color:var(--text-secondary); font-size:0.9rem; margin-top:0.25rem;">
            Toca el regalo para revelar en privado a la persona que te tocó.
          </p>

          <div class="gift-box-3d" id="magic-gift-box" onclick="window.app.unwrapSecretSantaGift()">
            <svg class="gift-bow" viewBox="0 0 60 36" fill="none">
              <path d="M30 22C18 8 6 12 10 24c3 7 14 4 20-2Zm0 0c12-14 24-10 20 2-3 7-14 4-20-2Z" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/>
              <circle cx="30" cy="22" r="4.5" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
            </svg>
            <div class="gift-lid"></div>
            <div class="gift-body"></div>
          </div>

          <button class="btn btn-primary" onclick="window.app.unwrapSecretSantaGift()" style="width:100%; max-width:300px;">
            ${icon('gift')} Abrir mi Sobre Secreto
          </button>
        </div>
      `;
    }

    const giftee = fam.myGiftee;
    if (!giftee) {
      return `<div class="clean-card">No se encontró asignación.</div>`;
    }

    const sizes = giftee.sizes || {};
    const gifteeWishes = giftee.wishes || [];

    return `
      <div class="clean-card" style="max-width:820px; margin:0 auto;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; padding-bottom:1.15rem; border-bottom:1px solid var(--border-light); margin-bottom:1.15rem;">
          <div style="display:flex; align-items:center; gap:0.95rem;">
            ${avatarHtml(giftee.avatar, 'lg')}
            <div>
              <span class="soft-badge pine">Te tocó regalarle a:</span>
              <h2 class="font-festive" style="font-size:1.75rem; color:var(--pine-dark); margin-top:0.15rem;">
                ${escapeHtml(giftee.nickname || giftee.name)}
              </h2>
              ${
                giftee.bio
                  ? `<p style="color:var(--text-secondary); font-size:0.88rem; margin-top:0.15rem;">"${escapeHtml(giftee.bio)}"</p>`
                  : ''
              }
            </div>
          </div>

          <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="window.app.goToAnonymousChat()">
              ${icon('message')} Mensaje anónimo
            </button>
            <button class="btn btn-ghost btn-sm" onclick="window.app.replayGiftReveal()">
              ${icon('refresh')} Repetir caja
            </button>
          </div>
        </div>

        <div class="sub-nav">
          <button
            class="sub-nav-btn ${this.matchSubTab === 'wishes' ? 'active' : ''}"
            onclick="window.app.setMatchSubTab('wishes')"
          >
            ${icon('star')}
            <span>Sus Deseos (${gifteeWishes.length})</span>
          </button>
          <button
            class="sub-nav-btn ${this.matchSubTab === 'sizes' ? 'active' : ''}"
            onclick="window.app.setMatchSubTab('sizes')"
          >
            ${icon('shirt')}
            <span>Sus Tallas y Gustos</span>
          </button>
          <button
            class="sub-nav-btn ${this.matchSubTab === 'status' ? 'active' : ''}"
            onclick="window.app.setMatchSubTab('status')"
          >
            ${icon('gift')}
            <span>Estado de mi Regalo</span>
          </button>
        </div>

        ${
          this.matchSubTab === 'wishes'
            ? gifteeWishes.length === 0
              ? `
              <div class="clean-card-subtle" style="text-align:center; padding:2rem 1rem;">
                <p style="color:var(--text-secondary); margin-bottom:0.85rem; font-size:0.9rem;">
                  ${escapeHtml(giftee.nickname || giftee.name)} aún no ha agregado deseos a su lista.
                </p>
                <button class="btn btn-pine btn-sm" onclick="window.app.goToAnonymousChat()">
                  ${icon('message')} Preguntarle en anónimo qué le gustaría
                </button>
              </div>
            `
              : `
              <div class="wish-grid">
                ${gifteeWishes.map((w) => this.renderSingleWishCard(w, false)).join('')}
              </div>
            `
            : ''
        }

        ${
          this.matchSubTab === 'sizes'
            ? `
          <div class="clean-card-subtle">
            <div class="grid-2" style="gap:0.85rem;">
              <div>
                <div style="font-size:0.76rem; color:var(--text-muted);">Camisa / Suéter / Blusa</div>
                <div style="font-weight:700; font-size:0.96rem;">${escapeHtml(sizes.shirt || 'No especificada')}</div>
              </div>
              <div>
                <div style="font-size:0.76rem; color:var(--text-muted);">Pantalón</div>
                <div style="font-weight:700; font-size:0.96rem;">${escapeHtml(sizes.pants || 'No especificada')}</div>
              </div>
              <div>
                <div style="font-size:0.76rem; color:var(--text-muted);">Calzado</div>
                <div style="font-weight:700; font-size:0.96rem;">${escapeHtml(sizes.shoes || 'No especificada')}</div>
              </div>
              <div>
                <div style="font-size:0.76rem; color:var(--text-muted);">Colores Favoritos</div>
                <div style="font-weight:700; font-size:0.96rem;">${escapeHtml(sizes.favoriteColor || 'No especificados')}</div>
              </div>
              <div>
                <div style="font-size:0.76rem; color:var(--text-muted);">Dulces / Bebidas Favoritas</div>
                <div style="font-weight:700; font-size:0.94rem;">${escapeHtml(sizes.snacksAndDrinks || 'No especificados')}</div>
              </div>
              <div>
                <div style="font-size:0.76rem; color:var(--berry);">Alergias o Evitar</div>
                <div style="font-weight:700; font-size:0.94rem; color:var(--berry-dark);">${escapeHtml(sizes.avoidOrAllergies || 'Ninguna indicada')}</div>
              </div>
            </div>
          </div>
        `
            : ''
        }

        ${
          this.matchSubTab === 'status'
            ? `
          <div class="clean-card-subtle">
            <p style="font-size:0.86rem; color:var(--text-secondary); margin-bottom:0.85rem;">
              Actualiza cómo vas con la compra del regalo (en la familia solo se ve el total general, nunca quién le regala a quién):
            </p>
            <div class="grid-2" style="gap:0.6rem;">
              ${Object.entries(GIFT_STATUSES)
                .map(
                  ([key, info]) => `
                <button
                  class="btn ${fam.myMember?.giftStatus === key ? 'btn-pine' : 'btn-secondary'}"
                  onclick="window.app.updateMyGiftStatus('${key}')"
                  style="justify-content:flex-start;"
                >
                  ${fam.myMember?.giftStatus === key ? icon('check') : icon('gift')}
                  <span>${info.label}</span>
                </button>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  setMatchSubTab(sub) {
    window.soundEngine.playClick();
    this.matchSubTab = sub;
    this.renderDashboard();
  }

  goToAnonymousChat() {
    window.soundEngine.playClick();
    this.messagesSubTab = 'to_giftee';
    this.activeTab = 'messages';
    this.renderDashboard();
  }

  async unwrapSecretSantaGift() {
    if (this.isUnwrappingAnimation) return;
    this.isUnwrappingAnimation = true;

    const giftBox = document.getElementById('magic-gift-box');
    if (giftBox) {
      giftBox.classList.add('unwrapping');
    }

    window.soundEngine.playGiftRevealFanfare();

    setTimeout(async () => {
      try {
        const data = await this.api(`/families/${this.activeFamily._id}/reveal`, {
          method: 'POST',
        });
        this.activeFamily = data.family;
        window.christmasEffects.launchConfetti(100);
        this.isUnwrappingAnimation = false;
        this.renderDashboard();
      } catch (err) {
        this.isUnwrappingAnimation = false;
        this.showToast(err.message);
        this.renderDashboard();
      }
    }, 950);
  }

  replayGiftReveal() {
    if (!this.activeFamily || !this.activeFamily.myMember) return;
    window.soundEngine.playClick();
    this.activeFamily.myMember.hasRevealed = false;
    this.renderDashboard();
  }

  async updateMyGiftStatus(giftStatus) {
    try {
      const data = await this.api(`/families/${this.activeFamily._id}/my-status`, {
        method: 'PUT',
        body: JSON.stringify({ giftStatus }),
      });
      this.activeFamily = data.family;
      window.soundEngine.playSuccess();
      this.showToast('Progreso del regalo actualizado');
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  // =========================================================================
  // PESTAÑA 2: MIS DESEOS Y TALLAS
  // =========================================================================
  renderMyWishesTab() {
    const fam = this.activeFamily;
    const myWishes = fam.wishlist.filter((w) => String(w.user) === String(this.user._id));
    const otherFamilies = this.families.filter((f) => f._id !== fam._id);
    const sizes = this.user.sizes || {};

    return `
      <div class="clean-card" style="margin-bottom:1.15rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.85rem; margin-bottom:1.15rem;">
          <div>
            <h2 class="font-festive" style="font-size:1.55rem; color:var(--pine-dark);">
              Mi Lista de Deseos
            </h2>
            <p style="font-size:0.86rem; color:var(--text-secondary);">
              Pon ejemplos claros y enlaces directos para orientar a tu Amigo Secreto.
            </p>
          </div>

          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; width:auto;">
            ${
              otherFamilies.length > 0
                ? `
              <button class="btn btn-secondary btn-sm" onclick="window.app.openImportWishesModal()">
                ${icon('download')} Traer de otra familia
              </button>
            `
                : ''
            }
            <button class="btn btn-primary btn-sm" onclick="window.app.openAddWishModal()">
              ${icon('plus')} Agregar Deseo
            </button>
          </div>
        </div>

        ${
          myWishes.length === 0
            ? `
          <div class="clean-card-subtle" style="text-align:center; padding:2.25rem 1rem;">
            <div style="width:48px; height:48px; border-radius:14px; background:var(--pine-light); color:var(--pine); display:inline-flex; align-items:center; justify-content:center; margin-bottom:0.6rem;">
              ${icon('star')}
            </div>
            <h3 style="font-size:1.02rem; margin-bottom:0.3rem;">Aún no tienes deseos en esta lista</h3>
            <p style="color:var(--text-secondary); font-size:0.86rem; margin-bottom:1rem;">
              Agrega ideas o enlaces de tiendas para ayudar a la persona que le toque regalarte.
            </p>
            <button class="btn btn-pine" onclick="window.app.openAddWishModal()">
              ${icon('plus')} Agregar mi Primer Deseo
            </button>
          </div>
        `
            : `
          <div class="wish-grid">
            ${myWishes.map((w) => this.renderSingleWishCard(w, false)).join('')}
          </div>
        `
        }
      </div>

      <div class="clean-card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:0.9rem;">
          <div>
            <h3 class="font-festive" style="font-size:1.3rem; color:var(--pine-dark);">
              Mis Tallas y Preferencias
            </h3>
            <p style="font-size:0.82rem; color:var(--text-secondary);">
              Visibles para quien sea tu Amigo Secreto.
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="window.app.openProfileModal()">
            ${icon('edit')} Editar Tallas
          </button>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:0.45rem;">
          <span class="soft-badge">Camisa: <strong>${escapeHtml(sizes.shirt || 'Sin definir')}</strong></span>
          <span class="soft-badge">Pantalón: <strong>${escapeHtml(sizes.pants || 'Sin definir')}</strong></span>
          <span class="soft-badge">Calzado: <strong>${escapeHtml(sizes.shoes || 'Sin definir')}</strong></span>
          <span class="soft-badge">Color: <strong>${escapeHtml(sizes.favoriteColor || 'Sin definir')}</strong></span>
          <span class="soft-badge">Dulces: <strong>${escapeHtml(sizes.snacksAndDrinks || 'Sin definir')}</strong></span>
          ${
            sizes.avoidOrAllergies
              ? `<span class="soft-badge berry">Evitar: <strong>${escapeHtml(sizes.avoidOrAllergies)}</strong></span>`
              : ''
          }
        </div>
      </div>
    `;
  }

  // =========================================================================
  // PESTAÑA 3: DESEOS DE LA FAMILIA
  // =========================================================================
  renderFamilyWishesTab() {
    const fam = this.activeFamily;
    const filteredAllWishes =
      this.wishFilterUser === 'all'
        ? fam.wishlist
        : fam.wishlist.filter((w) => String(w.user) === String(this.wishFilterUser));

    return `
      <div class="clean-card">
        <div style="margin-bottom:1.15rem;">
          <h2 class="font-festive" style="font-size:1.55rem; color:var(--pine-dark); margin-bottom:0.2rem;">
            Deseos de la Familia
          </h2>
          <p style="font-size:0.86rem; color:var(--text-secondary); margin-bottom:0.9rem;">
            Filtra por familiar para consultar sus ideas y abrir los enlaces directos.
          </p>

          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button
              class="icon-chip ${this.wishFilterUser === 'all' ? 'active' : ''}"
              onclick="window.app.setWishFilter('all')"
            >
              Todos (${fam.wishlist.length})
            </button>
            ${fam.members
              .map(
                (m) => `
              <button
                class="icon-chip ${String(this.wishFilterUser) === String(m.user._id) ? 'active' : ''}"
                onclick="window.app.setWishFilter('${m.user._id}')"
              >
                ${avatarHtml(m.user.avatar, 'sm')}
                <span>${escapeHtml(m.nickname)} (${m.wishCount})</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        ${
          filteredAllWishes.length === 0
            ? `
          <div class="clean-card-subtle" style="text-align:center; padding:2.25rem 1rem;">
            <p style="color:var(--text-secondary); font-size:0.9rem;">Este familiar todavía no ha subido deseos a su lista.</p>
          </div>
        `
            : `
          <div class="wish-grid">
            ${filteredAllWishes.map((w) => this.renderSingleWishCard(w, true)).join('')}
          </div>
        `
        }
      </div>
    `;
  }

  // Tarjeta de Deseo Limpia (Sin el botón de "Marcar que yo lo regalaré")
  renderSingleWishCard(w, showOwnerHeader = true) {
    const fam = this.activeFamily;
    const isMine = String(w.user) === String(this.user._id);
    const cat = CATEGORIES[w.category] || CATEGORIES.other;
    const prio = PRIORITIES[w.priority] || PRIORITIES.high;

    return `
      <div class="wish-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.55rem;">
            ${
              showOwnerHeader
                ? `
              <div style="display:inline-flex; align-items:center; gap:0.4rem; font-size:0.8rem; font-weight:700; color:var(--pine-dark);">
                ${avatarHtml(w.ownerAvatar, 'sm')}
                <span>${escapeHtml(w.ownerName)}</span>
              </div>
            `
                : `
              <span style="font-size:0.76rem; color:var(--text-muted); font-weight:600;">
                ${escapeHtml(cat.label)}
              </span>
            `
            }
            <span class="soft-badge ${prio.className}" style="font-size:0.71rem;">
              ${icon('star')}
              <span>${prio.badge}</span>
            </span>
          </div>

          <h4 style="font-size:1rem; font-weight:700; color:var(--text-primary); margin-bottom:0.28rem;">
            ${escapeHtml(w.title)}
          </h4>

          ${
            w.description
              ? `<p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.4rem;">${escapeHtml(w.description)}</p>`
              : ''
          }
        </div>

        <div style="display:grid; gap:0.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.81rem;">
            ${
              w.priceEstimate !== null && w.priceEstimate !== undefined
                ? `<span style="font-weight:700; color:var(--pine-dark);">Precio aprox: ${escapeHtml(fam.settings?.currency || '$')}${w.priceEstimate}</span>`
                : `<span style="color:var(--text-muted);">Precio libre</span>`
            }

            ${
              isMine
                ? `
              <button class="btn btn-ghost btn-sm" style="padding:0.2rem 0.5rem; min-height:30px; color:var(--berry);" onclick="window.app.deleteWish('${w._id}')">
                ${icon('trash')} Quitar
              </button>
            `
                : ''
            }
          </div>

          ${
            w.url
              ? `
            <a href="${escapeHtml(w.url)}" target="_blank" rel="noopener noreferrer" class="wish-link" onclick="window.soundEngine.playClick()">
              <span style="display:inline-flex; align-items:center; gap:0.4rem;">
                ${icon('link')}
                <span>Abrir en <strong>${escapeHtml(w.storeName || 'Tienda')}</strong></span>
              </span>
              ${icon('external')}
            </a>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  setWishFilter(userId) {
    window.soundEngine.playClick();
    this.wishFilterUser = userId;
    this.renderDashboard();
  }

  // Modal de Agregar Deseo con Selects y Botones de Ilusión 100% corregidos
  openAddWishModal() {
    window.soundEngine.playClick();
    this.selectedWishPriority = 'high';
    const fam = this.activeFamily;
    const otherFamilies = this.families.filter((f) => f._id !== fam._id);
    const modalRoot = document.getElementById('modal-root');

    modalRoot.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.app.closeModal()">
        <div class="modal-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.1rem;">
            <h3 class="font-festive" style="font-size:1.5rem; color:var(--pine-dark);">
              Agregar un Deseo a mi Lista
            </h3>
            <button class="icon-chip" onclick="window.app.closeModal()" style="padding:0.35rem 0.55rem;">
              ${icon('close')}
            </button>
          </div>

          <form onsubmit="window.app.handleAddWish(event)">
            <div class="form-group">
              <label class="form-label">¿Qué te gustaría recibir?</label>
              <input
                type="text"
                id="wish-title"
                class="form-input"
                placeholder="Ej: Audífonos Sony, Libro, Suéter beige talla M..."
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Enlace directo de referencia <span style="font-weight:400; color:var(--text-muted);">(Opcional)</span></label>
              <input
                type="text"
                id="wish-url"
                class="form-input"
                placeholder="https://www.amazon.com/... o link de cualquier tienda"
              />
            </div>

            <!-- Fila amplia de 2 columnas (1 columna en celular) para que el Select de Categoría tenga espacio completo -->
            <div class="grid-2" style="gap:0.75rem;">
              <div class="form-group">
                <label class="form-label">Categoría del regalo</label>
                <select id="wish-category" class="form-select">
                  ${Object.entries(CATEGORIES)
                    .map(([k, v]) => `<option value="${k}">${v.label}</option>`)
                    .join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Precio aproximado (${escapeHtml(fam.settings?.currency || '$')})</label>
                <input
                  type="number"
                  step="any"
                  id="wish-price"
                  class="form-input"
                  placeholder="Ej: ${fam.settings?.recommendedAmount || 35}"
                />
              </div>
            </div>

            <!-- Selector Táctil de Nivel de Ilusión (Sustituye al select pequeño que se cortaba) -->
            <div class="form-group">
              <label class="form-label">¿Qué tanta ilusión te hace?</label>
              <input type="hidden" id="wish-priority" value="high" />
              <div class="priority-selector-grid">
                <div class="priority-pill-option" data-prio="dream" onclick="window.app.selectWishPriority('dream')">
                  ${icon('sparkles')}
                  <span>Lo quiero mucho</span>
                </div>
                <div class="priority-pill-option selected" data-prio="high" onclick="window.app.selectWishPriority('high')">
                  ${icon('star')}
                  <span>Me encantaría</span>
                </div>
                <div class="priority-pill-option" data-prio="medium" onclick="window.app.selectWishPriority('medium')">
                  ${icon('gift')}
                  <span>Buena opción</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Detalles (Talla, color o especificaciones)</label>
              <textarea
                id="wish-desc"
                class="form-textarea"
                placeholder="Ej: En color negro o azul marino, talla M..."
              ></textarea>
            </div>

            ${
              otherFamilies.length > 0
                ? `
              <label style="display:flex; align-items:center; gap:0.55rem; font-size:0.85rem; color:var(--text-secondary); margin-bottom:1.1rem; cursor:pointer;">
                <input type="checkbox" id="wish-all-families" style="width:18px; height:18px;" />
                <span>Guardar este deseo también en mis otras familias (${otherFamilies.length})</span>
              </label>
            `
                : ''
            }

            <div style="display:flex; justify-content:flex-end; gap:0.6rem;">
              <button type="button" class="btn btn-secondary" onclick="window.app.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Deseo</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  selectWishPriority(prio) {
    window.soundEngine.playClick();
    this.selectedWishPriority = prio;
    const hidden = document.getElementById('wish-priority');
    if (hidden) hidden.value = prio;
    document.querySelectorAll('.priority-pill-option').forEach((el) => {
      if (el.getAttribute('data-prio') === prio) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  async handleAddWish(e) {
    e.preventDefault();
    const title = document.getElementById('wish-title')?.value;
    const url = document.getElementById('wish-url')?.value;
    const priceEstimate = document.getElementById('wish-price')?.value;
    const priority = document.getElementById('wish-priority')?.value || 'high';
    const category = document.getElementById('wish-category')?.value;
    const description = document.getElementById('wish-desc')?.value;
    const applyToAllMyFamilies = document.getElementById('wish-all-families')?.checked || false;

    try {
      const data = await this.api(`/families/${this.activeFamily._id}/wishes`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          url,
          priceEstimate,
          priority,
          category,
          description,
          applyToAllMyFamilies,
        }),
      });
      this.activeFamily = data.family;
      this.closeModal();
      window.soundEngine.playSuccess();
      this.showToast(data.message);
      this.renderDashboard();
    } catch (err) {
      window.soundEngine.playError();
      this.showToast(err.message);
    }
  }

  async deleteWish(wishId) {
    try {
      const data = await this.api(`/families/${this.activeFamily._id}/wishes/${wishId}`, {
        method: 'DELETE',
      });
      this.activeFamily = data.family;
      window.soundEngine.playClick();
      this.showToast('Deseo eliminado');
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  // =========================================================================
  // PESTAÑA 4: PARTICIPANTES E INVITACIÓN
  // =========================================================================
  renderMembersTab() {
    const fam = this.activeFamily;
    const inviteUrl = `${window.location.origin}/?join=${encodeURIComponent(fam.code)}`;

    return `
      <div class="clean-card" style="margin-bottom:1.15rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <span class="soft-badge pine">${icon('ticket')} Invitación Familiar</span>
          <h3 class="font-festive" style="font-size:1.35rem; color:var(--pine-dark); margin-top:0.25rem;">
            Código de la familia: <strong style="color:var(--berry); font-family:monospace;">${escapeHtml(fam.code)}</strong>
          </h3>
          <p style="font-size:0.85rem; color:var(--text-secondary);">
            Comparte el código o el enlace directo para que tus familiares se unan desde su celular.
          </p>
        </div>

        <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="window.app.copyText('${escapeHtml(fam.code)}', 'Código copiado')">
            ${icon('copy')} Código
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.app.copyText('${escapeHtml(inviteUrl)}', 'Enlace copiado')">
            ${icon('link')} Copiar Link
          </button>
          <button class="btn btn-pine btn-sm" onclick="window.app.shareWhatsApp()">
            ${icon('share')} WhatsApp
          </button>
        </div>
      </div>

      <div class="clean-card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
          <h3 class="font-festive" style="font-size:1.45rem; color:var(--pine-dark);">
            Familiares Participantes (${fam.members.length})
          </h3>
          <div style="font-size:0.81rem; color:var(--text-secondary);">
            <strong>${fam.stats.revealedCount}/${fam.stats.totalMembers}</strong> abrieron su sobre ·
            <strong>${fam.stats.giftsReadyCount}/${fam.stats.totalMembers}</strong> regalos listos
          </div>
        </div>

        <div style="display:grid; gap:0.6rem;">
          ${fam.members
            .map((m) => {
              const statusInfo = GIFT_STATUSES[m.giftStatus] || GIFT_STATUSES.pending;
              const isSelf = String(m.user._id) === String(this.user._id);
              return `
                <div class="clean-card-subtle" style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap; padding:0.85rem 1rem;">
                  <div style="display:flex; align-items:center; gap:0.8rem;">
                    ${avatarHtml(m.user.avatar, 'md')}
                    <div>
                      <div style="font-weight:700; font-size:0.95rem; display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
                        <span>${escapeHtml(m.nickname)}</span>
                        ${m.role === 'admin' ? `<span class="soft-badge gold" style="font-size:0.68rem;">${icon('crown')} Organizador</span>` : ''}
                      </div>
                      <div style="font-size:0.79rem; color:var(--text-secondary); margin-top:0.12rem;">
                        ${m.hasRevealed ? 'Ya vio su sobre' : 'Sobre pendiente'} · ${statusInfo.label}
                      </div>
                    </div>
                  </div>

                  <div style="display:flex; gap:0.4rem; align-items:center;">
                    <button class="btn btn-secondary btn-sm" onclick="window.app.viewMemberWishes('${m.user._id}')">
                      ${icon('star')} Deseos (${m.wishCount})
                    </button>
                    ${
                      fam.isCreator && !isSelf
                        ? `
                      <button class="btn btn-ghost btn-sm" style="color:var(--berry);" onclick="window.app.removeMember('${m.user._id}', '${escapeHtml(m.nickname)}')">
                        ${icon('trash')}
                      </button>
                    `
                        : ''
                    }
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  viewMemberWishes(userId) {
    window.soundEngine.playClick();
    this.wishFilterUser = userId;
    this.activeTab = 'family_wishes';
    this.renderDashboard();
  }

  async removeMember(memberUserId, memberName) {
    if (!confirm(`¿Deseas retirar a ${memberName} de esta familia?`)) return;
    try {
      const data = await this.api(`/families/${this.activeFamily._id}/members/${memberUserId}`, {
        method: 'DELETE',
      });
      this.activeFamily = data.family;
      this.showToast(data.message);
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  // =========================================================================
  // PESTAÑA 5: MENSAJES
  // =========================================================================
  renderMessagesTab() {
    const fam = this.activeFamily;
    const chatWithGiftee = fam.messages.filter((m) => m.type === 'chat_with_giftee');
    const chatWithSanta = fam.messages.filter((m) => m.type === 'chat_with_santa');
    const wallMessages = fam.messages.filter((m) => m.type === 'family_wall');

    return `
      <div class="clean-card" style="max-width:760px; margin:0 auto;">
        <h2 class="font-festive" style="font-size:1.55rem; color:var(--pine-dark); margin-bottom:0.25rem;">
          Mensajes y Preguntas Anónimas
        </h2>
        <p style="font-size:0.86rem; color:var(--text-secondary); margin-bottom:1rem;">
          Selecciona una conversación:
        </p>

        <div class="sub-nav">
          <button
            class="sub-nav-btn ${this.messagesSubTab === 'to_giftee' ? 'active' : ''}"
            onclick="window.app.setMessagesSubTab('to_giftee')"
          >
            ${icon('gift')}
            <span>Escribir a mi Asignado</span>
          </button>
          <button
            class="sub-nav-btn ${this.messagesSubTab === 'to_santa' ? 'active' : ''}"
            onclick="window.app.setMessagesSubTab('to_santa')"
          >
            ${icon('mail')}
            <span>Mi Amigo Secreto</span>
          </button>
          <button
            class="sub-nav-btn ${this.messagesSubTab === 'family_wall' ? 'active' : ''}"
            onclick="window.app.setMessagesSubTab('family_wall')"
          >
            ${icon('users')}
            <span>Muro Familiar (${wallMessages.length})</span>
          </button>
        </div>

        ${
          this.messagesSubTab === 'to_giftee'
            ? `
          <div>
            <p style="font-size:0.84rem; color:var(--text-secondary); margin-bottom:0.7rem;">
              ${
                fam.myGiftee
                  ? `Escríbele a <strong>${escapeHtml(fam.myGiftee.nickname)}</strong> de forma 100% anónima (no verá tu nombre):`
                  : 'Cuando el sorteo esté realizado podrás escribirle de forma anónima a tu persona asignada.'
              }
            </p>
            <div class="chat-messages-box">
              ${
                chatWithGiftee.length === 0
                  ? `<div style="margin:auto; text-align:center; color:var(--text-muted); font-size:0.86rem;">Aún no hay mensajes en esta conversación.</div>`
                  : chatWithGiftee
                      .map(
                        (m) => `
                    <div class="chat-bubble ${m.direction}">
                      <div style="font-size:0.7rem; opacity:0.8; font-weight:700; margin-bottom:0.15rem;">${escapeHtml(m.senderLabel)}</div>
                      <div>${escapeHtml(m.text)}</div>
                    </div>
                  `
                      )
                      .join('')
              }
            </div>
            <form onsubmit="window.app.handleSendMessage(event, 'to_giftee')" style="display:flex; gap:0.5rem;">
              <input
                type="text"
                id="msg-to-giftee"
                class="form-input"
                placeholder="Pregúntale algo sin revelar quién eres..."
                ${fam.drawStatus !== 'completed' ? 'disabled' : ''}
                required
              />
              <button type="submit" class="btn btn-primary" ${fam.drawStatus !== 'completed' ? 'disabled' : ''}>Enviar</button>
            </form>
          </div>
        `
            : ''
        }

        ${
          this.messagesSubTab === 'to_santa'
            ? `
          <div>
            <p style="font-size:0.84rem; color:var(--text-secondary); margin-bottom:0.7rem;">
              Aquí recibes preguntas de quien te regala a ti, o puedes dejarle una pista:
            </p>
            <div class="chat-messages-box">
              ${
                chatWithSanta.length === 0
                  ? `<div style="margin:auto; text-align:center; color:var(--text-muted); font-size:0.86rem;">Aún no tienes mensajes de tu Amigo Secreto.</div>`
                  : chatWithSanta
                      .map(
                        (m) => `
                    <div class="chat-bubble ${m.direction}">
                      <div style="font-size:0.7rem; opacity:0.8; font-weight:700; margin-bottom:0.15rem;">${escapeHtml(m.senderLabel)}</div>
                      <div>${escapeHtml(m.text)}</div>
                    </div>
                  `
                      )
                      .join('')
              }
            </div>
            <form onsubmit="window.app.handleSendMessage(event, 'to_santa')" style="display:flex; gap:0.5rem;">
              <input
                type="text"
                id="msg-to-santa"
                class="form-input"
                placeholder="Escribe una pista para tu Amigo Secreto..."
                ${fam.drawStatus !== 'completed' ? 'disabled' : ''}
                required
              />
              <button type="submit" class="btn btn-pine" ${fam.drawStatus !== 'completed' ? 'disabled' : ''}>Enviar</button>
            </form>
          </div>
        `
            : ''
        }

        ${
          this.messagesSubTab === 'family_wall'
            ? `
          <div>
            <form onsubmit="window.app.handleSendMessage(event, 'family_wall')" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
              <input
                type="text"
                id="msg-family-wall"
                class="form-input"
                placeholder="Mensaje público para toda la familia..."
                required
              />
              <button type="submit" class="btn btn-pine">Publicar</button>
            </form>
            <div style="display:grid; gap:0.55rem;">
              ${wallMessages
                .slice()
                .reverse()
                .map(
                  (m) => `
                <div class="clean-card-subtle" style="display:flex; gap:0.75rem; align-items:center; padding:0.8rem 0.95rem;">
                  ${avatarHtml(m.senderAvatar, 'md')}
                  <div>
                    <div style="font-weight:700; font-size:0.85rem; color:var(--pine-dark);">
                      ${escapeHtml(m.senderName)}
                      <span style="font-weight:400; color:var(--text-muted); font-size:0.73rem; margin-left:0.35rem;">
                        ${formatDateTimeHuman(m.createdAt)}
                      </span>
                    </div>
                    <div style="font-size:0.9rem; margin-top:0.1rem;">${escapeHtml(m.text)}</div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  setMessagesSubTab(sub) {
    window.soundEngine.playClick();
    this.messagesSubTab = sub;
    this.renderDashboard();
  }

  async handleSendMessage(e, type) {
    e.preventDefault();
    const inputId =
      type === 'to_giftee' ? 'msg-to-giftee' : type === 'to_santa' ? 'msg-to-santa' : 'msg-family-wall';
    const input = document.getElementById(inputId);
    const text = input?.value;
    if (!text) return;

    try {
      const data = await this.api(`/families/${this.activeFamily._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ type, text }),
      });
      this.activeFamily = data.family;
      if (input) input.value = '';
      window.soundEngine.playSleighBells();
      this.showToast('Mensaje enviado');
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  // =========================================================================
  // PESTAÑA 6: PANEL DEL CREADOR / ADMINISTRADOR
  // =========================================================================
  renderAdminTab() {
    const fam = this.activeFamily;
    if (!fam.isAdmin) {
      return `<div class="clean-card">Solo el creador de la familia puede administrar este grupo.</div>`;
    }

    const revealMode = fam.settings?.revealMode || 'immediate';

    return `
      <div class="clean-card" style="max-width:780px; margin:0 auto;">
        <div style="margin-bottom:1rem;">
          <span class="soft-badge gold">${icon('crown')} Panel del Organizador</span>
          <h2 class="font-festive" style="font-size:1.55rem; color:var(--pine-dark); margin-top:0.25rem;">
            Administración de la Familia
          </h2>
        </div>

        <div class="sub-nav">
          <button
            class="sub-nav-btn ${this.adminSubTab === 'draw' ? 'active' : ''}"
            onclick="window.app.setAdminSubTab('draw')"
          >
            ${icon('shuffle')}
            <span>Sorteo y Revelación</span>
          </button>
          <button
            class="sub-nav-btn ${this.adminSubTab === 'budget' ? 'active' : ''}"
            onclick="window.app.setAdminSubTab('budget')"
          >
            ${icon('tag')}
            <span>Monto y Fecha</span>
          </button>
          <button
            class="sub-nav-btn ${this.adminSubTab === 'exclusions' ? 'active' : ''}"
            onclick="window.app.setAdminSubTab('exclusions')"
          >
            ${icon('shield')}
            <span>Restricciones (${fam.exclusions.length})</span>
          </button>
        </div>

        ${
          this.adminSubTab === 'draw'
            ? `
          <div style="display:grid; gap:1.15rem;">
            <div class="clean-card-subtle">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.45rem;">
                <h3 style="font-size:1.05rem; font-weight:700; color:var(--pine-dark);">
                  Sorteo Aleatorio del Amigo Secreto
                </h3>
                <span class="soft-badge ${fam.drawStatus === 'completed' ? 'pine' : 'gold'}">
                  ${fam.drawStatus === 'completed' ? `Sorteado (${fam.stats.revealedCount}/${fam.stats.totalMembers} ya vieron)` : 'Pendiente'}
                </span>
              </div>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.95rem;">
                Asigna aleatoriamente a los ${fam.members.length} participantes garantizando que nadie se toque a sí mismo.
              </p>
              <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
                <button class="btn btn-primary" onclick="window.app.runAnimatedDraw()">
                  ${icon('shuffle')}
                  <span>${fam.drawStatus === 'completed' ? 'Volver a Sortear' : 'Realizar Sorteo Ahora'}</span>
                </button>
                ${
                  fam.drawStatus === 'completed'
                    ? `
                  <button class="btn btn-secondary" onclick="window.app.resetDraw()">
                    ${icon('refresh')} Reiniciar
                  </button>
                `
                    : ''
                }
              </div>
            </div>

            <form onsubmit="window.app.handleSaveSettings(event)" class="clean-card-subtle">
              <h3 style="font-size:1.05rem; font-weight:700; color:var(--pine-dark); margin-bottom:0.3rem;">
                ¿Cuándo se puede ver a quién te tocó?
              </h3>
              <p style="font-size:0.84rem; color:var(--text-secondary); margin-bottom:0.9rem;">
                Controla en qué momento los participantes pueden abrir su regalo digital:
              </p>

              <div style="display:grid; gap:0.6rem; margin-bottom:1rem;">
                <label style="display:flex; align-items:flex-start; gap:0.65rem; padding:0.75rem; background:var(--bg-surface); border:1px solid var(--border-light); border-radius:11px; cursor:pointer;">
                  <input type="radio" name="revealMode" value="immediate" ${revealMode === 'immediate' ? 'checked' : ''} style="margin-top:0.25rem;" />
                  <div>
                    <strong style="font-size:0.9rem;">Disponible de inmediato</strong>
                    <div style="font-size:0.79rem; color:var(--text-secondary);">Todos pueden ver a quién les tocó apenas se realice el sorteo.</div>
                  </div>
                </label>

                <label style="display:flex; align-items:flex-start; gap:0.65rem; padding:0.75rem; background:var(--bg-surface); border:1px solid var(--border-light); border-radius:11px; cursor:pointer;">
                  <input type="radio" name="revealMode" value="scheduled" ${revealMode === 'scheduled' ? 'checked' : ''} style="margin-top:0.25rem;" />
                  <div style="width:100%;">
                    <strong style="font-size:0.9rem;">Programar fecha y hora exacta</strong>
                    <div style="font-size:0.79rem; color:var(--text-secondary); margin-bottom:0.45rem;">Muestra una cuenta regresiva hasta la fecha elegida:</div>
                    <input
                      type="datetime-local"
                      id="admin-reveal-date"
                      class="form-input"
                      value="${formatDateTimeInput(fam.settings?.revealDate)}"
                    />
                  </div>
                </label>

                <label style="display:flex; align-items:flex-start; gap:0.65rem; padding:0.75rem; background:var(--bg-surface); border:1px solid var(--border-light); border-radius:11px; cursor:pointer;">
                  <input type="radio" name="revealMode" value="manual_locked" ${revealMode === 'manual_locked' ? 'checked' : ''} style="margin-top:0.25rem;" />
                  <div>
                    <strong style="font-size:0.9rem;">Bloqueado manualmente</strong>
                    <div style="font-size:0.79rem; color:var(--text-secondary);">Mantiene cerrados los sobres hasta que tú decidas desbloquearlos.</div>
                  </div>
                </label>
              </div>

              <button type="submit" class="btn btn-pine">
                Guardar Ajuste de Revelación
              </button>
            </form>
          </div>
        `
            : ''
        }

        ${
          this.adminSubTab === 'budget'
            ? `
          <form onsubmit="window.app.handleSaveFullAdminSettings(event)">
            <div class="grid-2" style="gap:0.75rem;">
              <div class="form-group">
                <label class="form-label">Nombre de la Familia</label>
                <input type="text" id="set-name" class="form-input" value="${escapeHtml(fam.name)}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Código de Invitación</label>
                <input type="text" id="set-code" class="form-input" value="${escapeHtml(fam.code)}" style="text-transform:uppercase; font-family:monospace; font-weight:700;" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Descripción breve</label>
              <input type="text" id="set-desc" class="form-input" value="${escapeHtml(fam.description)}" />
            </div>

            <div class="grid-2" style="gap:0.75rem;">
              <div class="form-group">
                <label class="form-label">Moneda</label>
                <select id="set-currency" class="form-select">
                  ${['CRC (₡)', 'USD ($)']
                    .map((c) => `<option value="${c}" ${fam.settings?.currency === c ? 'selected' : ''}>${c}</option>`)
                    .join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Monto Sugerido del Regalo</label>
                <input type="number" step="any" id="set-recommended" class="form-input" value="${fam.settings?.recommendedAmount ?? 35}" />
              </div>
              <div class="form-group">
                <label class="form-label">Monto Mínimo</label>
                <input type="number" step="any" id="set-min" class="form-input" value="${fam.settings?.budgetMin ?? 20}" />
              </div>
              <div class="form-group">
                <label class="form-label">Monto Máximo</label>
                <input type="number" step="any" id="set-max" class="form-input" value="${fam.settings?.budgetMax ?? 50}" />
              </div>
            </div>

            <div class="grid-2" style="gap:0.75rem;">
              <div class="form-group">
                <label class="form-label">Fecha y Hora del Intercambio</label>
                <input type="datetime-local" id="set-exchange-date" class="form-input" value="${formatDateTimeInput(fam.settings?.exchangeDate)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Lugar de la Reunión</label>
                <input type="text" id="set-location" class="form-input" value="${escapeHtml(fam.settings?.exchangeLocation || '')}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Reglas o Notas de la Familia</label>
              <textarea id="set-rules" class="form-textarea">${escapeHtml(fam.settings?.customRules || '')}</textarea>
            </div>

            <button type="submit" class="btn btn-pine">
              Guardar Cambios
            </button>
          </form>
        `
            : ''
        }

        ${
          this.adminSubTab === 'exclusions'
            ? `
          <div>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.9rem;">
              Evita que parejas o personas específicas se toquen entre sí en el sorteo:
            </p>

            <form onsubmit="window.app.handleAddExclusion(event)" class="clean-card-subtle" style="margin-bottom:1rem;">
              <div class="grid-2" style="gap:0.75rem; margin-bottom:0.75rem;">
                <div>
                  <label class="form-label">Familiar A</label>
                  <select id="excl-from" class="form-select">
                    ${fam.members.map((m) => `<option value="${m.user._id}">${escapeHtml(m.nickname)}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label">No puede regalarle a Familiar B</label>
                  <select id="excl-to" class="form-select">
                    ${fam.members
                      .slice()
                      .reverse()
                      .map((m) => `<option value="${m.user._id}">${escapeHtml(m.nickname)}</option>`).join('')}
                  </select>
                </div>
              </div>

              <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.84rem; color:var(--text-secondary); margin-bottom:0.85rem;">
                <input type="checkbox" id="excl-bi" checked style="width:17px; height:17px;" />
                <span>Mutuo (ninguno de los dos puede tocarle al otro)</span>
              </label>

              <button type="submit" class="btn btn-secondary btn-sm">
                ${icon('plus')} Agregar Restricción
              </button>
            </form>

            ${
              fam.exclusions.length === 0
                ? `<p style="font-size:0.84rem; color:var(--text-muted);">No hay restricciones configuradas.</p>`
                : `
              <div style="display:grid; gap:0.5rem;">
                ${fam.exclusions
                  .map(
                    (ex) => `
                  <div class="clean-card-subtle" style="display:flex; justify-content:space-between; align-items:center; padding:0.65rem 0.95rem;">
                    <span style="font-size:0.87rem;">
                      <strong>${escapeHtml(ex.fromName)}</strong> ${ex.bidirectional ? '↔' : '→'} <strong>${escapeHtml(ex.toName)}</strong>
                    </span>
                    <button class="btn btn-ghost btn-sm" style="color:var(--berry);" onclick="window.app.deleteExclusion('${ex._id}')">
                      ${icon('trash')} Quitar
                    </button>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
            }
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  setAdminSubTab(sub) {
    window.soundEngine.playClick();
    this.adminSubTab = sub;
    this.renderDashboard();
  }

  async handleSaveSettings(e) {
    e.preventDefault();
    const checked = document.querySelector('input[name="revealMode"]:checked');
    const revealMode = checked ? checked.value : 'immediate';
    const revealDate = document.getElementById('admin-reveal-date')?.value || null;

    try {
      const data = await this.api(`/families/${this.activeFamily._id}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ revealMode, revealDate }),
      });
      this.activeFamily = data.family;
      window.soundEngine.playSuccess();
      this.showToast('Ajuste de revelación guardado');
      await this.loadFamilies(this.activeFamily._id);
    } catch (err) {
      this.showToast(err.message);
    }
  }

  async quickUnlockReveal() {
    try {
      const data = await this.api(`/families/${this.activeFamily._id}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ revealMode: 'immediate', revealDate: null }),
      });
      this.activeFamily = data.family;
      window.soundEngine.playSuccess();
      window.christmasEffects.launchConfetti(80);
      this.showToast('Sobres desbloqueados para toda la familia');
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  async handleSaveFullAdminSettings(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('set-name')?.value,
      code: document.getElementById('set-code')?.value,
      description: document.getElementById('set-desc')?.value,
      currency: document.getElementById('set-currency')?.value,
      recommendedAmount: document.getElementById('set-recommended')?.value,
      budgetMin: document.getElementById('set-min')?.value,
      budgetMax: document.getElementById('set-max')?.value,
      exchangeDate: document.getElementById('set-exchange-date')?.value,
      exchangeLocation: document.getElementById('set-location')?.value,
      customRules: document.getElementById('set-rules')?.value,
    };

    try {
      const data = await this.api(`/families/${this.activeFamily._id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      this.activeFamily = data.family;
      window.soundEngine.playSuccess();
      this.showToast('Cambios guardados correctamente');
      await this.loadFamilies(this.activeFamily._id);
    } catch (err) {
      window.soundEngine.playError();
      this.showToast(err.message);
    }
  }

  async handleAddExclusion(e) {
    e.preventDefault();
    const fromUser = document.getElementById('excl-from')?.value;
    const toUser = document.getElementById('excl-to')?.value;
    const bidirectional = document.getElementById('excl-bi')?.checked;

    try {
      const data = await this.api(`/families/${this.activeFamily._id}/exclusions`, {
        method: 'POST',
        body: JSON.stringify({ fromUser, toUser, bidirectional }),
      });
      this.activeFamily = data.family;
      window.soundEngine.playSuccess();
      this.showToast(data.message);
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  async deleteExclusion(exclusionId) {
    try {
      const data = await this.api(`/families/${this.activeFamily._id}/exclusions/${exclusionId}`, {
        method: 'DELETE',
      });
      this.activeFamily = data.family;
      window.soundEngine.playClick();
      this.showToast(data.message);
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  async runAnimatedDraw() {
    const fam = this.activeFamily;
    if (fam.members.length < 2) {
      window.soundEngine.playError();
      this.showToast('Se necesitan al menos 2 participantes para sortear.');
      return;
    }

    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content" style="text-align:center; padding:2.25rem 1.5rem;">
          <div style="margin-bottom:0.75rem;" id="roulette-avatar">${avatarHtml('santa', 'lg')}</div>
          <h3 class="font-festive" style="font-size:1.65rem; color:var(--pine-dark); margin-bottom:0.3rem;">
            Realizando el sorteo familiar...
          </h3>
          <p id="roulette-name" style="font-size:1.05rem; font-weight:700; color:var(--berry);">
            Mezclando participantes...
          </p>
        </div>
      </div>
    `;

    window.soundEngine.playDrawRoulette();

    let step = 0;
    const spinInterval = setInterval(() => {
      const m = fam.members[step % fam.members.length];
      const avEl = document.getElementById('roulette-avatar');
      const nmEl = document.getElementById('roulette-name');
      if (avEl && nmEl && m) {
        avEl.innerHTML = avatarHtml(m.user.avatar, 'lg');
        nmEl.textContent = m.nickname;
      }
      step++;
    }, 110);

    setTimeout(async () => {
      clearInterval(spinInterval);
      try {
        const data = await this.api(`/families/${fam._id}/draw`, {
          method: 'POST',
        });
        this.activeFamily = data.family;
        this.closeModal();
        window.christmasEffects.launchConfetti(100);
        this.showToast(data.message);
        await this.loadFamilies(fam._id);
      } catch (err) {
        this.closeModal();
        window.soundEngine.playError();
        this.showToast(err.message);
      }
    }, 1350);
  }

  async resetDraw() {
    try {
      const data = await this.api(`/families/${this.activeFamily._id}/reset-draw`, {
        method: 'POST',
      });
      this.activeFamily = data.family;
      window.soundEngine.playClick();
      this.showToast('Sorteo reiniciado');
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  // =========================================================================
  // MODALES: MIS FAMILIAS, INVITAR, CREAR, UNIRSE, PERFIL
  // =========================================================================
  closeModal() {
    const modalRoot = document.getElementById('modal-root');
    if (modalRoot) modalRoot.innerHTML = '';
  }

  openFamilySwitcherModal() {
    window.soundEngine.playClick();
    const modalRoot = document.getElementById('modal-root');

    modalRoot.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.app.closeModal()">
        <div class="modal-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem;">
            <h3 class="font-festive" style="font-size:1.5rem; color:var(--pine-dark);">
              Mis Familias
            </h3>
            <button class="icon-chip" onclick="window.app.closeModal()" style="padding:0.35rem 0.55rem;">
              ${icon('close')}
            </button>
          </div>

          <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem;">
            Cambia de familia o únete a otra con tu misma cuenta:
          </p>

          <div style="display:grid; gap:0.55rem; margin-bottom:1.15rem;">
            ${this.families
              .map(
                (f) => `
              <div
                class="clean-card-subtle"
                style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; border-color:${this.activeFamily && this.activeFamily._id === f._id ? 'var(--pine)' : 'var(--border-light)'};"
                onclick="window.app.selectFamily('${f._id}')"
              >
                <div>
                  <div style="font-weight:700; color:var(--pine-dark);">
                    ${escapeHtml(f.name)}
                  </div>
                  <div style="font-size:0.78rem; color:var(--text-muted);">
                    Código: <strong>${escapeHtml(f.code)}</strong> · ${f.stats.totalMembers} participantes
                  </div>
                </div>
                <span class="soft-badge ${this.activeFamily && this.activeFamily._id === f._id ? 'pine' : ''}">
                  ${this.activeFamily && this.activeFamily._id === f._id ? 'Activa' : 'Abrir'}
                </span>
              </div>
            `
              )
              .join('')}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.55rem;">
            <button class="btn btn-secondary" onclick="window.app.openJoinFamilyModal()">
              ${icon('ticket')} Unirme con Código
            </button>
            <button class="btn btn-primary" onclick="window.app.openCreateFamilyModal()">
              ${icon('plus')} Crear Familia
            </button>
          </div>
        </div>
      </div>
    `;
  }

  openInviteModal() {
    window.soundEngine.playClick();
    const fam = this.activeFamily;
    if (!fam) return;
    const inviteUrl = `${window.location.origin}/?join=${encodeURIComponent(fam.code)}`;
    const modalRoot = document.getElementById('modal-root');

    modalRoot.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.app.closeModal()">
        <div class="modal-content" style="text-align:center;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem;">
            <span class="soft-badge pine">${icon('ticket')} Invitación Familiar</span>
            <button class="icon-chip" onclick="window.app.closeModal()" style="padding:0.35rem 0.55rem;">
              ${icon('close')}
            </button>
          </div>

          <h3 class="font-festive" style="font-size:1.55rem; color:var(--pine-dark); margin-bottom:0.3rem;">
            Invita a "${escapeHtml(fam.name)}"
          </h3>
          <p style="font-size:0.86rem; color:var(--text-secondary); margin-bottom:1.1rem;">
            Comparte este código o el enlace directo para que se unan:
          </p>

          <div style="background:var(--bg-warm-tint); border:2px dashed var(--border-hover); border-radius:14px; padding:0.9rem; font-family:monospace; font-size:1.65rem; font-weight:800; color:var(--berry); letter-spacing:2px; margin-bottom:1.1rem;">
            ${escapeHtml(fam.code)}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.55rem; margin-bottom:0.55rem;">
            <button class="btn btn-secondary" onclick="window.app.copyText('${escapeHtml(fam.code)}', 'Código copiado')">
              ${icon('copy')} Copiar Código
            </button>
            <button class="btn btn-secondary" onclick="window.app.copyText('${escapeHtml(inviteUrl)}', 'Enlace copiado')">
              ${icon('link')} Copiar Link
            </button>
          </div>

          <button class="btn btn-pine" style="width:100%;" onclick="window.app.shareWhatsApp()">
            ${icon('share')} Enviar Invitación por WhatsApp
          </button>
        </div>
      </div>
    `;
  }

  openCreateFamilyModal() {
    window.soundEngine.playClick();
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.app.closeModal()">
        <div class="modal-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 class="font-festive" style="font-size:1.5rem; color:var(--pine-dark);">
              Crear Nueva Familia
            </h3>
            <button class="icon-chip" onclick="window.app.closeModal()" style="padding:0.35rem 0.55rem;">
              ${icon('close')}
            </button>
          </div>

          <form onsubmit="window.app.handleCreateFamily(event)">
            <div class="form-group">
              <label class="form-label">Nombre de la Familia o Grupo</label>
              <input type="text" id="create-fam-name" class="form-input" placeholder="Ej: Navidad Familia López" required />
            </div>

            <div class="grid-2" style="gap:0.75rem;">
              <div class="form-group">
                <label class="form-label">Código <span style="font-weight:400; color:var(--text-muted);">(Opcional)</span></label>
                <input type="text" id="create-fam-code" class="form-input" placeholder="Ej: LOPEZ26" style="text-transform:uppercase;" />
              </div>
              <div class="form-group">
                <label class="form-label">Tu Nombre en el Grupo</label>
                <input type="text" id="create-fam-nick" class="form-input" value="${escapeHtml(this.user.name)}" />
              </div>
            </div>

            <div class="grid-2" style="gap:0.75rem;">
              <div class="form-group">
                <label class="form-label">Moneda</label>
                <select id="create-fam-currency" class="form-select">
                  <option value="EUR (₡)">CRC (₡)</option>
                  <option value="USD ($)">USD ($)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Monto Sugerido</label>
                <input type="number" id="create-fam-max" class="form-input" value="50" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">¿Cuándo podrán ver a quién les tocó?</label>
              <select id="create-fam-reveal-mode" class="form-select">
                <option value="immediate">De inmediato al realizar el sorteo</option>
                <option value="manual_locked">Bloqueado hasta que yo lo active</option>
                <option value="scheduled">En una fecha programada</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Lugar del Intercambio</label>
              <input type="text" id="create-fam-loc" class="form-input" value="Cena de Nochebuena" />
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.6rem; margin-top:1.1rem;">
              <button type="button" class="btn btn-secondary" onclick="window.app.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Crear Familia</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async handleCreateFamily(e) {
    e.preventDefault();
    const name = document.getElementById('create-fam-name')?.value;
    const customCode = document.getElementById('create-fam-code')?.value;
    const nickname = document.getElementById('create-fam-nick')?.value;
    const currency = document.getElementById('create-fam-currency')?.value;
    const budgetMax = Number(document.getElementById('create-fam-max')?.value || 50);
    const budgetMin = Math.max(5, Math.round(budgetMax * 0.5));
    const revealMode = document.getElementById('create-fam-reveal-mode')?.value;
    const exchangeLocation = document.getElementById('create-fam-loc')?.value;

    try {
      const data = await this.api('/families', {
        method: 'POST',
        body: JSON.stringify({
          name,
          customCode,
          nickname,
          currency,
          budgetMin,
          budgetMax,
          recommendedAmount: budgetMax,
          revealMode,
          exchangeLocation,
        }),
      });
      this.closeModal();
      window.soundEngine.playSuccess();
      window.christmasEffects.launchConfetti(80);
      this.showToast(data.message);
      await this.loadFamilies(data.family._id);
    } catch (err) {
      window.soundEngine.playError();
      this.showToast(err.message);
    }
  }

  openJoinFamilyModal() {
    window.soundEngine.playClick();
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.app.closeModal()">
        <div class="modal-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 class="font-festive" style="font-size:1.5rem; color:var(--pine-dark);">
              Unirse a una Familia
            </h3>
            <button class="icon-chip" onclick="window.app.closeModal()" style="padding:0.35rem 0.55rem;">
              ${icon('close')}
            </button>
          </div>

          <form onsubmit="window.app.handleJoinFamilyModal(event)">
            <div class="form-group">
              <label class="form-label">Código de la Familia</label>
              <input
                type="text"
                id="join-fam-code"
                class="form-input"
                placeholder="Ej: GARCIA26"
                style="text-transform:uppercase; font-family:monospace; font-size:1.15rem; font-weight:700;"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Tu Nombre en esta Familia</label>
              <input type="text" id="join-fam-nick" class="form-input" value="${escapeHtml(this.user.name)}" />
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.6rem; margin-top:1.1rem;">
              <button type="button" class="btn btn-secondary" onclick="window.app.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-pine">Unirme</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async handleJoinFamilyModal(e) {
    e.preventDefault();
    const code = document.getElementById('join-fam-code')?.value;
    const nickname = document.getElementById('join-fam-nick')?.value;
    await this.joinFamilyByCode(code, false, nickname);
  }

  async joinFamilyByCode(code, silent = false, nickname = '') {
    try {
      const data = await this.api('/families/join', {
        method: 'POST',
        body: JSON.stringify({ code, nickname }),
      });
      this.closeModal();
      window.soundEngine.playSuccess();
      this.showToast(data.message);
      await this.loadFamilies(data.family._id);
    } catch (err) {
      if (!silent) {
        window.soundEngine.playError();
        this.showToast(err.message);
      }
    }
  }

  openProfileModal() {
    window.soundEngine.playClick();
    const sizes = this.user.sizes || {};
    const modalRoot = document.getElementById('modal-root');

    modalRoot.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.app.closeModal()">
        <div class="modal-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 class="font-festive" style="font-size:1.5rem; color:var(--pine-dark);">
              Mi Perfil y Tallas
            </h3>
            <button class="icon-chip" onclick="window.app.closeModal()" style="padding:0.35rem 0.55rem;">
              ${icon('close')}
            </button>
          </div>

          <form onsubmit="window.app.handleSaveProfile(event)">
            <div class="grid-2" style="gap:0.75rem;">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" id="prof-name" class="form-input" value="${escapeHtml(this.user.name)}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Emblema Navideño</label>
                <select id="prof-avatar" class="form-select">
                  ${Object.entries(window.AVATARS || {})
                    .map(([k, v]) => `<option value="${k}" ${this.user.avatar === k ? 'selected' : ''}>${v.label}</option>`)
                    .join('')}
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Pista general sobre tus gustos</label>
              <input type="text" id="prof-bio" class="form-input" value="${escapeHtml(this.user.bio || '')}" placeholder="Ej: Me gusta leer, el café y los juegos de mesa" />
            </div>

            <div class="grid-2" style="gap:0.75rem;">
              <div class="form-group">
                <label class="form-label">Talla de Camisa / Suéter</label>
                <input type="text" id="prof-shirt" class="form-input" value="${escapeHtml(sizes.shirt || '')}" placeholder="Ej: M, L..." />
              </div>
              <div class="form-group">
                <label class="form-label">Talla de Pantalón</label>
                <input type="text" id="prof-pants" class="form-input" value="${escapeHtml(sizes.pants || '')}" placeholder="Ej: 32, M..." />
              </div>
              <div class="form-group">
                <label class="form-label">Talla de Calzado</label>
                <input type="text" id="prof-shoes" class="form-input" value="${escapeHtml(sizes.shoes || '')}" placeholder="Ej: 40 EU / 26 MX" />
              </div>
              <div class="form-group">
                <label class="form-label">Colores Favoritos</label>
                <input type="text" id="prof-color" class="form-input" value="${escapeHtml(sizes.favoriteColor || '')}" placeholder="Ej: Verde, beige, negro" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Dulces o Bebidas Favoritas</label>
              <input type="text" id="prof-snacks" class="form-input" value="${escapeHtml(sizes.snacksAndDrinks || '')}" placeholder="Ej: Chocolates Ferrero, café..." />
            </div>

            <div class="form-group">
              <label class="form-label">Alergias o qué evitar</label>
              <input type="text" id="prof-avoid" class="form-input" value="${escapeHtml(sizes.avoidOrAllergies || '')}" placeholder="Ej: Alérgico al maní" />
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.6rem; margin-top:1rem;">
              <button type="button" class="btn btn-secondary" onclick="window.app.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-pine">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async handleSaveProfile(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('prof-name')?.value,
      avatar: document.getElementById('prof-avatar')?.value,
      bio: document.getElementById('prof-bio')?.value,
      sizes: {
        shirt: document.getElementById('prof-shirt')?.value,
        pants: document.getElementById('prof-pants')?.value,
        shoes: document.getElementById('prof-shoes')?.value,
        favoriteColor: document.getElementById('prof-color')?.value,
        snacksAndDrinks: document.getElementById('prof-snacks')?.value,
        avoidOrAllergies: document.getElementById('prof-avoid')?.value,
      },
    };

    try {
      const data = await this.api('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      this.user = data.user;
      this.closeModal();
      window.soundEngine.playSuccess();
      this.renderNavbar();
      this.showToast(data.message);
      if (this.activeFamily) {
        await this.selectFamily(this.activeFamily._id, false);
      }
    } catch (err) {
      this.showToast(err.message);
    }
  }

  openImportWishesModal() {
    window.soundEngine.playClick();
    const otherFamilies = this.families.filter((f) => f._id !== this.activeFamily._id);
    const modalRoot = document.getElementById('modal-root');

    modalRoot.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.app.closeModal()">
        <div class="modal-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem;">
            <h3 class="font-festive" style="font-size:1.45rem; color:var(--pine-dark);">
              Traer mis deseos de otra familia
            </h3>
            <button class="icon-chip" onclick="window.app.closeModal()" style="padding:0.35rem 0.55rem;">
              ${icon('close')}
            </button>
          </div>
          <form onsubmit="window.app.handleImportWishes(event)">
            <div class="form-group">
              <label class="form-label">Selecciona la familia de origen:</label>
              <select id="import-source-family" class="form-select">
                ${otherFamilies.map((f) => `<option value="${f._id}">${escapeHtml(f.name)} (${escapeHtml(f.code)})</option>`).join('')}
              </select>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.6rem; margin-top:1rem;">
              <button type="button" class="btn btn-secondary" onclick="window.app.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-pine">Importar Deseos</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async handleImportWishes(e) {
    e.preventDefault();
    const sourceFamilyId = document.getElementById('import-source-family')?.value;
    try {
      const data = await this.api(`/families/${this.activeFamily._id}/import-wishes`, {
        method: 'POST',
        body: JSON.stringify({ sourceFamilyId }),
      });
      this.activeFamily = data.family;
      this.closeModal();
      window.soundEngine.playSuccess();
      this.showToast(data.message);
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  copyText(text, toastMsg = 'Copiado al portapapeles') {
    window.soundEngine.playClick();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(toastMsg);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      this.showToast(toastMsg);
    }
  }

  shareWhatsApp() {
    if (!this.activeFamily) return;
    window.soundEngine.playClick();
    const fam = this.activeFamily;
    const url = `${window.location.origin}/?join=${encodeURIComponent(fam.code)}`;
    const text = `¡Hola familia! Únanse a nuestro Amigo Secreto "${fam.name}".\n\nCódigo: *${fam.code}*\nEnlace directo: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  startLiveCountdowns() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    const box = document.getElementById('reveal-countdown-box');
    if (!box) return;

    const update = () => {
      const targetStr = box.getAttribute('data-target');
      if (!targetStr) return;
      const diff = new Date(targetStr).getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(this.countdownInterval);
        if (this.activeFamily) {
          this.selectFamily(this.activeFamily._id, false);
        }
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      box.innerHTML = `
        <div class="countdown-unit"><span class="num">${d}</span><span class="lbl">Días</span></div>
        <div class="countdown-unit"><span class="num">${h}</span><span class="lbl">Horas</span></div>
        <div class="countdown-unit"><span class="num">${m}</span><span class="lbl">Min</span></div>
        <div class="countdown-unit"><span class="num">${s}</span><span class="lbl">Seg</span></div>
      `;
    };

    update();
    this.countdownInterval = setInterval(update, 1000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AmigoSecretoApp();
  window.app.init();
});
