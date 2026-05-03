// ── In-memory user store (seed one default account) ──
let users = [
  { id:1, first:'Alex', last:'Johnson', email:'alex@example.com', password:'password123', role:'Admin', joined:'Apr 2026', active:true }
];
let currentUser = null;

// ── View router ──
function showView(id) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.style.display = 'none';
  });
  const el = document.getElementById(id);
  if (el) {
    el.style.display = (id === 'app') ? 'flex' : 'block';
    el.classList.add('active');
  }
}

function goApp() { showView('login'); }

// ── Auth helpers ──
function showToast(msg, icon='✅') {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast-icon').textContent = icon;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

function clearErr(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('show'); }
  const inputId = id.replace('-err','');
  const inp = document.getElementById(inputId);
  if (inp) inp.classList.remove('error');
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { if (msg) el.textContent = msg; el.classList.add('show'); }
  const inputId = id.replace('-err','');
  const inp = document.getElementById(inputId);
  if (inp) inp.classList.add('error');
}

function togglePwd(inputId, iconEl) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text'; iconEl.textContent = '🙈'; }
  else { inp.type = 'password'; iconEl.textContent = '👁'; }
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<div class="spinner"></div>'
    : (btnId === 'login-btn' ? '<span>Sign In</span>' : '<span>Create Account</span>');
}

function socialLogin(provider) {
  showToast(`${provider} login coming soon!`, '🔗');
}

// ── Login ──
function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  let valid = true;
  if (!email || !/\S+@\S+\.\S+/.test(email)) { showErr('login-email-err'); valid = false; }
  if (!pass) { showErr('login-pass-err', 'Password is required.'); valid = false; }
  if (!valid) return;

  setLoading('login-btn', true);
  setTimeout(() => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (!user) {
      setLoading('login-btn', false);
      showErr('login-pass-err', 'Incorrect email or password.');
      return;
    }
    currentUser = user;
    setLoading('login-btn', false);
    enterApp(user);
  }, 900);
}

// ── Sign Up ──
function doSignup() {
  const first   = document.getElementById('signup-first').value.trim();
  const last    = document.getElementById('signup-last').value.trim();
  const email   = document.getElementById('signup-email').value.trim();
  const pass    = document.getElementById('signup-pass').value;
  const confirm = document.getElementById('signup-confirm').value;
  let valid = true;
  if (!first) { showErr('signup-first-err'); valid = false; }
  if (!last)  { showErr('signup-last-err');  valid = false; }
  if (!email || !/\S+@\S+\.\S+/.test(email)) { showErr('signup-email-err', 'Please enter a valid email.'); valid = false; }
  if (pass.length < 8) { showErr('signup-pass-err'); valid = false; }
  if (pass !== confirm) { showErr('signup-confirm-err'); valid = false; }
  if (!valid) return;

  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    showErr('signup-email-err', 'An account with this email already exists.');
    return;
  }

  setLoading('signup-btn', true);
  setTimeout(() => {
    const newUser = {
      id: users.length + 1, first, last, email, password: pass,
      role: 'Member',
      joined: new Date().toLocaleDateString('en-US', { month:'short', year:'numeric' }),
      active: true
    };
    users.push(newUser);
    currentUser = newUser;
    setLoading('signup-btn', false);
    // Clear fields
    ['signup-first','signup-last','signup-email','signup-pass','signup-confirm'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    enterApp(newUser);
  }, 900);
}

function enterApp(user) {
  // Update sidebar user info
  document.querySelector('.sidebar-user .user-info .name').textContent = `${user.first} ${user.last}`;
  document.querySelector('.sidebar-user .user-info .role').textContent = user.role === 'Admin' ? 'Pro Plan' : 'Free Plan';
  document.querySelector('.sidebar-user .avatar').textContent = user.first[0];
  // Update topbar avatar
  const avatarSm = document.querySelector('.avatar-sm');
  if (avatarSm) avatarSm.textContent = user.first[0];
  showView('app');
  showAppView('dashboard');
  renderProjects();
  renderUsers();
  showToast(`Welcome back, ${user.first}! 👋`, '🎉');
}

// ── App navigation ──
function showAppView(id) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const viewEl = document.getElementById('view-' + id);
  if (viewEl) viewEl.classList.add('active');
  const navMap = { dashboard:'dash', projects:'proj', timetracker:'time', clients:'clients', users:'users', reports:'reports' };
  const navEl = document.getElementById('nav-' + (navMap[id] || id));
  if (navEl) navEl.classList.add('active');

  const titles = { dashboard:'Dashboard', projects:'Your Projects', timetracker:'Time Tracker', clients:'Clients', users:'Team Members', reports:'Reports' };
  document.getElementById('topbar-title').textContent = titles[id] || id;

  const actionBtn = document.getElementById('topbar-action-btn');
  if (id === 'projects') {
    actionBtn.innerHTML = '<span>+</span> New Project';
    actionBtn.onclick = openModal;
  } else if (id === 'users') {
    actionBtn.innerHTML = '<span>+</span> Add Person';
    actionBtn.onclick = () => showView('signup');
  } else {
    actionBtn.innerHTML = '<span>⏱</span> Start New Timer';
    actionBtn.onclick = () => showAppView('timetracker');
  }

  if (id === 'users') renderUsers();
}

function topbarAction() { showAppView('timetracker'); }

// ── Projects ──
let projects = [
  { name: 'Website Redesign', client: 'Acme Corp', hours: 12.5, progress: 65, status: 'In Progress' },
  { name: 'App Development', client: 'TechStart Inc', hours: 8.2, progress: 40, status: 'In Progress' },
  { name: 'Brand Identity', client: 'Creative Labs', hours: 15.0, progress: 85, status: 'In Progress' },
  { name: 'SEO Campaign', client: 'Growth Co', hours: 5.5, progress: 30, status: 'In Progress' },
  { name: 'E-commerce Build', client: 'Shopify Store', hours: 20.0, progress: 75, status: 'In Progress' },
  { name: 'Mobile App UI', client: 'Design Studio', hours: 9.0, progress: 60, status: 'In Progress' },
];

function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  grid.innerHTML = projects.map((p, i) => `
    <div class="proj-card">
      <div class="proj-card-meta">Project Name</div>
      <div class="proj-card-name">${escapeHtml(p.name)}</div>
      <div class="proj-client-row">
        <span class="proj-client-label">Client</span>
        <span class="proj-client-val">${escapeHtml(p.client)}</span>
      </div>
      <div class="proj-prog-track"><div class="proj-prog-fill" style="width:${p.progress}%"></div></div>
      <div class="proj-stats">
        <div><div class="proj-stat-lbl">Hours Tracked</div><div class="proj-stat-val">${p.hours} hrs</div></div>
        <div><div class="proj-stat-lbl">Status</div><div class="proj-stat-val" style="font-size:.82rem;color:${p.status==='Complete'?'#10B981':'#F59E0B'};font-family:'DM Sans',sans-serif">${p.status}</div></div>
      </div>
      <div class="proj-actions">
        <button class="act-btn" title="Edit" onclick="editProject(${i})">✏️</button>
        <button class="act-btn" title="Delete" onclick="deleteProject(${i})">🗑</button>
      </div>
    </div>
  `).join('');
}

function openModal() {
  document.getElementById('modal').classList.add('open');
  setTimeout(() => document.getElementById('new-proj-name').focus(), 100);
}
function closeModal() { document.getElementById('modal').classList.remove('open'); }
function closeModalOutside(e) { if (e.target === document.getElementById('modal')) closeModal(); }

function addProject() {
  const name = document.getElementById('new-proj-name').value.trim();
  const client = document.getElementById('new-proj-client').value.trim();
  const status = document.getElementById('new-proj-status').value;
  if (!name) { document.getElementById('new-proj-name').style.borderColor = 'red'; return; }
  projects.unshift({ name, client: client || 'Client', hours: 0, progress: 0, status });
  renderProjects();
  closeModal();
  document.getElementById('new-proj-name').value = '';
  document.getElementById('new-proj-client').value = '';
  document.getElementById('new-proj-status').value = 'In Progress';
  showToast('Project created!', '📁');
}

function deleteProject(i) {
  if (confirm('Delete this project permanently?')) { 
    projects.splice(i, 1); 
    renderProjects(); 
    showToast('Project deleted', '🗑');
  }
}
function editProject(i) {
  const p = projects[i];
  document.getElementById('new-proj-name').value = p.name;
  document.getElementById('new-proj-client').value = p.client;
  document.getElementById('new-proj-status').value = p.status;
  openModal();
}

// ── Users ──
function renderUsers() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td>
        <div class="user-avatar-cell">
          <div class="ua">${u.first[0]}${u.last[0]}</div>
          <div>
            <div class="ua-name">${escapeHtml(u.first)} ${escapeHtml(u.last)}</div>
            <div class="ua-email">${escapeHtml(u.email)}</div>
          </div>
        </div>
      </td>
      <td><span class="role-badge ${u.role==='Admin'?'role-admin':'role-member'}">${u.role}</span></td>
      <td><span class="status-dot ${u.active?'dot-active':'dot-inactive'}"></span>${u.active?'Active':'Inactive'}</td>
      <td>${u.joined}</td>
      <td>
        <button class="act-btn" title="Toggle active" onclick="toggleUserActive(${i})" style="margin-right:.3rem">${u.active?'🔴':'🟢'}</button>
        <button class="act-btn" title="Remove" onclick="removeUser(${i})">🗑</button>
      </td>
    </tr>
  `).join('');
}

function toggleUserActive(i) {
  users[i].active = !users[i].active;
  renderUsers();
  showToast(`${users[i].first} marked as ${users[i].active?'Active':'Inactive'}.`, users[i].active?'🟢':'🔴');
}

function removeUser(i) {
  if (users[i].email === currentUser?.email) { showToast("You can't remove yourself.", '⚠️'); return; }
  if (confirm(`Remove ${users[i].first} ${users[i].last}?`)) {
    users.splice(i, 1);
    renderUsers();
    showToast('User removed.', '🗑');
  }
}

// ── Timer ──
let timerInterval = null;
let timerRunning = false;
let timerPaused = false;
let elapsed = 0;

function formatTime(s) {
  const h = String(Math.floor(s/3600)).padStart(2,'0');
  const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
  const sec = String(s%60).padStart(2,'0');
  return `${h}:${m}:${sec}`;
}

function toggleTimer() {
  const btn = document.getElementById('timer-toggle-btn');
  const card = document.getElementById('timer-card');
  const pauseBtn = document.getElementById('timer-pause-btn');
  if (!timerRunning) {
    timerRunning = true; timerPaused = false;
    timerInterval = setInterval(() => { elapsed++; document.getElementById('timer-display').textContent = formatTime(elapsed); }, 1000);
    btn.innerHTML = '<span>⏹</span> Stop Timer';
    btn.style.background = 'linear-gradient(90deg,#ef4444,#dc2626)';
    card.classList.add('timer-running');
    pauseBtn.style.display = 'flex';
  } else {
    clearInterval(timerInterval); timerRunning = false;
    const proj = document.getElementById('timer-proj').value;
    const task = document.getElementById('timer-task').value;
    const mins = Math.floor(elapsed/60);
    const hoursDecimal = elapsed/3600;
    const duration = mins > 0 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${elapsed}s`;
    const earnings = (hoursDecimal * 50).toFixed(2);
    const tbody = document.getElementById('log-tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="proj-name-td">${escapeHtml(proj)}</td><td>${escapeHtml(task)}</td><td>${duration}</td><td class="amount-td">$${earnings}</td>`;
    tbody.prepend(tr);
    elapsed = 0;
    document.getElementById('timer-display').textContent = '00:00:00';
    btn.innerHTML = '<span>▶</span> Start Timer';
    btn.style.background = '';
    card.classList.remove('timer-running');
    pauseBtn.style.display = 'none';
    showToast(`Logged ${duration} for ${proj}`, '⏱');
  }
}

function pauseTimer() {
  const pauseBtn = document.getElementById('timer-pause-btn');
  if (!timerPaused) {
    clearInterval(timerInterval); timerPaused = true;
    pauseBtn.innerHTML = '▶ Resume';
  } else {
    timerInterval = setInterval(() => { elapsed++; document.getElementById('timer-display').textContent = formatTime(elapsed); }, 1000);
    timerPaused = false;
    pauseBtn.innerHTML = '⏸ Pause';
  }
}

// Helper to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Enter key support for login/signup
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const active = document.querySelector('.view.active');
  if (!active) return;
  if (active.id === 'login') doLogin();
  else if (active.id === 'signup') doSignup();
});