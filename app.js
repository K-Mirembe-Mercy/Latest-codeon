// ═══════════════════════════════════════════════════
// CODEON — MAIN APPLICATION JAVASCRIPT
// Firebase Auth, Navigation, AI, Payments, Gallery
// ═══════════════════════════════════════════════════

import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─────────────────────────────────────────────────
// SPLASH SCREEN
// ─────────────────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('splash')?.classList.add('hidden');
  }, 2800);
});

// ─────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────
export function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === id);
  });
  window.scrollTo({ top: 0, behavior: 'instant' });
  closeMobileNav();
  setTimeout(initReveal, 80);
  // Update SEO meta dynamically
  updateMeta(id);
}
window.showPage = showPage;

const pageMeta = {
  home: { title: 'CodeOn — Build. Solve. Belong.', desc: 'CodeOn is a global merit-based coding community. Earn levels, claim titles, attend hackathons, and join chapters at your school, university, or company.' },
  about: { title: 'About CodeOn — Our Story & Mission', desc: 'Learn about the CodeOn movement — a community built on proof, not promises. Discover our values, mission, and the story behind the community.' },
  levels: { title: 'CodeOn Levels — Seven Lifetime Achievements', desc: 'Explore the CodeOn progression system. Seven permanent levels from Initiate to Legend, each earned through real proof of your coding ability.' },
  chapters: { title: 'CodeOn Chapters — Find Your Community', desc: 'Join or start a CodeOn chapter at your school, university, or workplace. Chapters span high schools, universities, and companies worldwide.' },
  hackathons: { title: 'CodeOn Hackathons & Workshops', desc: 'Compete in CodeOn hackathons, attend workshops, and level up your skills. Events happen regularly both online and in person.' },
  gallery: { title: 'CodeOn Gallery — Photos & Videos', desc: 'See CodeOn in action. Browse photos and videos from our meetings, hackathons, and community events.' },
  membership: { title: 'CodeOn Membership — Join Today', desc: 'Affordable membership for everyone. Free for high school students, $10/trimester for university students, $50/half-year for professionals.' },
  contact: { title: 'Contact CodeOn — Get in Touch', desc: 'Reach out to the CodeOn team. We respond within 24 hours. Email us at codeon.ug@gmail.com.' },
  dashboard: { title: 'My Dashboard — CodeOn', desc: 'Your CodeOn member dashboard. Track your progress, view your level, manage your subscription, and stay connected.' },
};
function updateMeta(id) {
  const m = pageMeta[id];
  if (!m) return;
  document.title = m.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', m.desc);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', m.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', m.desc);
}

// ─────────────────────────────────────────────────
// MOBILE NAV
// ─────────────────────────────────────────────────
window.openMobileNav = () => document.getElementById('mobileNav')?.classList.add('open');
window.closeMobileNav = () => document.getElementById('mobileNav')?.classList.remove('open');

// ─────────────────────────────────────────────────
// NAV SCROLL EFFECT
// ─────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ─────────────────────────────────────────────────
// SCROLL REVEAL
// ─────────────────────────────────────────────────
export function initReveal() {
  const els = document.querySelectorAll('.page.active .reveal, .page.active .reveal-l, .page.active .reveal-r');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('vis'), i * 75);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.06 });
  els.forEach(el => { if (!el.classList.contains('vis')) obs.observe(el); });
}
window.initReveal = initReveal;

// ─────────────────────────────────────────────────
// AUTH MODALS
// ─────────────────────────────────────────────────
window.openAuthModal = (tab = 'login') => {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('open');
    switchAuthTab(tab);
  }
};
window.closeAuthModal = () => {
  document.getElementById('authModal')?.classList.remove('open');
};
window.switchAuthTab = (tab) => {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.auth-form').forEach(f => f.style.display = f.id === tab + 'Form' ? 'block' : 'none');
};
window.switchAuthTab = window.switchAuthTab;

// Member type selection
let selectedMemberType = 'university';
window.selectMemberType = (type) => {
  selectedMemberType = type;
  document.querySelectorAll('.mtype-card').forEach(c => c.classList.toggle('selected', c.dataset.type === type));
};

// ── REGISTER ──
window.doRegister = async () => {
  const name = document.getElementById('regName')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const pass = document.getElementById('regPass')?.value;
  const chapter = document.getElementById('regChapter')?.value;

  if (!name || !email || !pass || !chapter) {
    showToast('⚠️', 'Missing Fields', 'Please fill in all fields.', 'error');
    return;
  }
  if (pass.length < 6) {
    showToast('⚠️', 'Weak Password', 'Password must be at least 6 characters.', 'error');
    return;
  }
  const btn = document.getElementById('regBtn');
  if (btn) { btn.textContent = 'Creating account...'; btn.disabled = true; }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'members', cred.user.uid), {
      name, email, chapter,
      memberType: selectedMemberType,
      level: 1, levelName: 'Initiate',
      joinDate: serverTimestamp(),
      subscriptionStatus: selectedMemberType === 'highschool' ? 'free' : 'pending',
      meetingsAttended: 0,
    });
    closeAuthModal();
    showToast('🎉', 'Welcome to CodeOn!', `Hey ${name}, your account is ready. You are now an Initiate.`, 'success');
    loadUserData(cred.user);
    showPage('dashboard');
  } catch (e) {
    showToast('❌', 'Registration Failed', e.message, 'error');
    if (btn) { btn.textContent = 'Create Account'; btn.disabled = false; }
  }
};

// ── LOGIN ──
window.doLogin = async () => {
  const email = document.getElementById('loginEmail')?.value.trim();
  const pass = document.getElementById('loginPass')?.value;
  if (!email || !pass) {
    showToast('⚠️', 'Missing Fields', 'Please enter your email and password.', 'error');
    return;
  }
  const btn = document.getElementById('loginBtn');
  if (btn) { btn.textContent = 'Signing in...'; btn.disabled = true; }
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    closeAuthModal();
    showToast('👋', 'Welcome back!', 'You are now signed in.', 'success');
  } catch (e) {
    const msg = e.code === 'auth/invalid-credential' ? 'Invalid email or password.' : e.message;
    showToast('❌', 'Login Failed', msg, 'error');
    if (btn) { btn.textContent = 'Sign In'; btn.disabled = false; }
  }
};

// ── GOOGLE LOGIN ──
window.doGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const docRef = doc(db, 'members', user.uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        name: user.displayName, email: user.email,
        memberType: 'university', level: 1, levelName: 'Initiate',
        joinDate: serverTimestamp(), subscriptionStatus: 'pending', meetingsAttended: 0,
        chapter: 'General'
      });
    }
    closeAuthModal();
    showToast('👋', `Welcome, ${user.displayName?.split(' ')[0]}!`, 'Signed in with Google.', 'success');
    loadUserData(user);
    showPage('dashboard');
  } catch (e) {
    showToast('❌', 'Google Login Failed', e.message, 'error');
  }
};

// ── LOGOUT ──
window.doLogout = async () => {
  await signOut(auth);
  showPage('home');
  showToast('👋', 'Signed Out', 'You have been signed out successfully.', 'success');
  closeUserMenu();
};

// ─────────────────────────────────────────────────
// USER STATE
// ─────────────────────────────────────────────────
let currentUser = null;
let currentUserData = null;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  updateNavForAuth(user);
  if (user) {
    await loadUserData(user);
  } else {
    currentUserData = null;
    updateDashboard(null);
  }
});

async function loadUserData(user) {
  try {
    const snap = await getDoc(doc(db, 'members', user.uid));
    currentUserData = snap.exists() ? snap.data() : { name: user.displayName, level: 1, levelName: 'Initiate', memberType: 'university', subscriptionStatus: 'pending', meetingsAttended: 0 };
    updateDashboard(user);
  } catch (e) {
    currentUserData = { name: user.displayName, level: 1, levelName: 'Initiate', memberType: 'university', subscriptionStatus: 'pending', meetingsAttended: 0 };
    updateDashboard(user);
  }
}

function updateNavForAuth(user) {
  const loginBtns = document.querySelectorAll('.btn-login, .btn-signup');
  const userAvatar = document.getElementById('userAvatarBtn');
  const navAuthBtns = document.getElementById('navAuthBtns');

  if (user) {
    if (navAuthBtns) navAuthBtns.style.display = 'none';
    if (userAvatar) {
      userAvatar.style.display = 'flex';
      const initials = (user.displayName || user.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      userAvatar.textContent = initials;
    }
  } else {
    if (navAuthBtns) navAuthBtns.style.display = 'flex';
    if (userAvatar) userAvatar.style.display = 'none';
  }
}

function updateDashboard(user) {
  if (!user || !currentUserData) return;
  const d = currentUserData;
  const initials = (d.name || user.displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  setEl('dashAvatar', initials);
  setEl('dashName', d.name || user.displayName || 'Member');
  setEl('dashRole', d.chapter ? `Chapter: ${d.chapter}` : 'CodeOn Member');
  setEl('dashLevelBadge', `Level ${d.level || 1} · ${d.levelName || 'Initiate'}`);
  setEl('dashGreeting', `Welcome back, ${(d.name || user.displayName || 'Coder').split(' ')[0]}! 👋`);
  setEl('dashLevelNum', d.level || 1);
  setEl('dashMeetings', d.meetingsAttended || 0);
  setEl('dashType', capitalize(d.memberType || 'member'));
  setEl('dashStatus', capitalize(d.subscriptionStatus || 'pending'));

  const subBox = document.getElementById('dashSubBox');
  if (subBox) {
    const active = d.subscriptionStatus === 'active' || d.memberType === 'highschool';
    subBox.style.borderColor = active ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)';
    subBox.style.background = active ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)';
    setEl('dashSubDot', active ? '🟢' : '🟡');
    setEl('dashSubLabel', active ? 'Subscription Active' : 'Subscription Pending');
    setEl('dashSubDetail', d.memberType === 'highschool' ? 'Free membership — high school tier' : 'Complete payment to activate your membership');
  }
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// User menu toggle
window.toggleUserMenu = () => {
  document.getElementById('userMenu')?.classList.toggle('open');
};
window.closeUserMenu = () => {
  document.getElementById('userMenu')?.classList.remove('open');
};
window.goToDashboard = () => {
  if (currentUser) showPage('dashboard');
  else openAuthModal('login');
  closeUserMenu();
};

// ─────────────────────────────────────────────────
// DASHBOARD TABS
// ─────────────────────────────────────────────────
window.switchDashTab = (tab) => {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.toggle('active', s.id === 'dash-' + tab));
  document.querySelectorAll('.dash-nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
};

// ─────────────────────────────────────────────────
// CONTACT FORM
// ─────────────────────────────────────────────────
window.sendMessage = async () => {
  const name = document.getElementById('contactName')?.value.trim();
  const email = document.getElementById('contactEmail')?.value.trim();
  const subject = document.getElementById('contactSubject')?.value.trim();
  const message = document.getElementById('contactMessage')?.value.trim();

  if (!name || !email || !message) {
    showToast('⚠️', 'Missing Fields', 'Please fill in your name, email and message.', 'error');
    return;
  }
  const btn = document.getElementById('sendBtn');
  if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }

  try {
    await addDoc(collection(db, 'messages'), {
      name, email, subject, message, timestamp: serverTimestamp()
    });
    showToast('✅', 'Message Sent!', 'We\'ll reply to you within 24 hours. Check codeon.ug@gmail.com for our response.', 'success');
    ['contactName','contactEmail','contactSubject','contactMessage'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  } catch (e) {
    showToast('❌', 'Failed to Send', `Please email us directly at codeon.ug@gmail.com`, 'error');
  }
  if (btn) { btn.textContent = 'Send Message →'; btn.disabled = false; }
};

// ─────────────────────────────────────────────────
// PAYMENT (PesaPal Integration)
// ─────────────────────────────────────────────────
window.openPaymentModal = () => {
  document.getElementById('paymentModal')?.classList.add('open');
};
window.closePaymentModal = () => {
  document.getElementById('paymentModal')?.classList.remove('open');
};
window.selectPayOption = (el) => {
  document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
};
window.proceedToPayment = () => {
  if (!currentUser) {
    closePaymentModal();
    openAuthModal('signup');
    showToast('ℹ️', 'Create Account First', 'Please create a CodeOn account, then proceed to payment.', 'success');
    return;
  }
  const type = currentUserData?.memberType || 'university';
  let amount, desc;
  if (type === 'highschool') {
    showToast('🎓', 'Free Access!', 'High school membership is completely free. You are already activated!', 'success');
    closePaymentModal();
    return;
  } else if (type === 'university') {
    amount = '10'; desc = 'CodeOn University Membership - $10/trimester';
  } else {
    amount = '50'; desc = 'CodeOn Professional Membership - $50/half-year';
  }
  // PesaPal redirect (replace with actual PesaPal integration keys)
  const pesapalUrl = `https://www.pesapal.com/iframe/embedded?amount=${amount}&currency=USD&description=${encodeURIComponent(desc)}&type=MERCHANT&reference=${currentUser.uid}&email=${currentUser.email}`;
  showToast('💳', 'Redirecting to Payment', 'Opening PesaPal secure payment...', 'success');
  setTimeout(() => { window.open(pesapalUrl, '_blank'); }, 800);
  closePaymentModal();
};

// Download docs
window.downloadDoc = (type) => {
  const names = { charter: 'CodeOn Charter', manual: 'Meeting Manual', structure: 'Org Structure' };
  showToast('📄', names[type] || 'Document', 'Email codeon.ug@gmail.com to request this document. We send within 24 hours.', 'success');
};

// ─────────────────────────────────────────────────
// TOAST SYSTEM
// ─────────────────────────────────────────────────
export function showToast(icon, title, msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icon}</span><div><div class="toast-title">${title}</div><div class="toast-msg">${msg}</div></div>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(24px)'; t.style.transition = '0.3s'; setTimeout(() => t.remove(), 300); }, 4500);
}
window.showToast = showToast;

// ─────────────────────────────────────────────────
// AI ASSISTANT
// ─────────────────────────────────────────────────
const aiKnowledge = {
  keywords: {
    'what is codeon': 'CodeOn is a global, merit-based coding community. Members earn permanent levels from Initiate to Legend by proving their skills through real projects, hackathons, and community contributions. Founded on the principle that proof beats promises.',
    'how to join': 'Joining CodeOn is simple! Click "Join CodeOn" or "Sign Up" to create your account. High school students join for FREE, university students pay $10 per trimester, and professionals pay $50 per half-year. After signing up, you start as an Initiate — Level 1.',
    'levels': 'CodeOn has 7 lifetime levels: 🌱 Initiate (L1) → ⚡ Coder (L2) → 🔥 Builder (L3) → 🧠 Solver (L4) → 🚀 Architect (L5) → 🌍 Pioneer (L6) → 👑 Legend (L7). Each level requires proof — real projects, verified contributions, and community recognition.',
    'pricing': 'Membership fees: 🎓 High School — FREE | 🎓 University — $10 per trimester/semester | 💼 Professional — $50 per half-year. Meetings are always FREE for everyone.',
    'meetings': 'CodeOn holds 2 meetings per month: one physical in-person meeting and one online meeting. All meetings are FREE to attend — no extra cost. Meetings follow the CodeOn Meeting Manual to ensure quality and consistency.',
    'hackathon': 'CodeOn Hackathons are intense 48-hour coding competitions. Teams tackle real-world problems, build solutions, and present to judges. Winners earn cash prizes, level-up evidence, and title nominations. Hackathons are a major way to advance through CodeOn levels.',
    'chapters': 'CodeOn chapters exist in schools, universities, companies, and communities. Each chapter is autonomous but follows global CodeOn standards. High school students join their school\'s chapter for free. You can also apply to start a new chapter at your institution.',
    'titles': 'Beyond the 7 levels, CodeOn awards 3 special titles: 🔵 The Contributor (consistent community builder), 🟢 The Catalyst (someone who changed an outcome), 🏛️ The Founder (started something that lives on independently). Titles are earned, never assigned.',
    'workshop': 'CodeOn Workshops are skill-building sessions run by experienced members and external experts. Topics include web development, AI/ML, cybersecurity, system design, and more. Check the Events page for upcoming workshops.',
    'payment': 'CodeOn uses PesaPal for secure payments, supporting MTN Mobile Money, Airtel Money, Visa, Mastercard, and bank transfers. High school students pay nothing — it\'s completely free.',
    'contact': 'You can reach CodeOn at codeon.ug@gmail.com. We typically respond within 24 hours. You can also use the Contact form on our website. We love hearing from members and potential members!',
  },
  default: "I'm CodeOn's AI assistant! I can tell you about our community, levels, pricing, chapters, hackathons, and more. Try asking: 'What is CodeOn?', 'How do I join?', 'What are the levels?', or 'How much does it cost?'"
};

window.sendAiMessage = () => {
  const input = document.getElementById('aiInput');
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;
  addAiMessage(msg, 'user');
  input.value = '';
  setTimeout(() => {
    addAiTyping();
    setTimeout(() => {
      removeTyping();
      const reply = getAiReply(msg);
      addAiMessage(reply, 'bot');
    }, 900 + Math.random() * 500);
  }, 200);
};
window.aiSuggest = (text) => {
  const input = document.getElementById('aiInput');
  if (input) { input.value = text; }
  window.sendAiMessage();
};

function getAiReply(msg) {
  const lower = msg.toLowerCase();
  for (const [key, val] of Object.entries(aiKnowledge.keywords)) {
    if (lower.includes(key) || key.split(' ').some(w => lower.includes(w) && w.length > 3)) {
      return val;
    }
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! 👋 Welcome to CodeOn. I'm here to help you learn about our community. What would you like to know?";
  }
  if (lower.includes('free') || lower.includes('cost') || lower.includes('price')) {
    return aiKnowledge.keywords['pricing'];
  }
  if (lower.includes('school') || lower.includes('student') || lower.includes('university')) {
    return aiKnowledge.keywords['pricing'];
  }
  return aiKnowledge.default;
}

function addAiMessage(text, type) {
  const msgs = document.getElementById('aiMessages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = `ai-msg ${type}`;
  const avatar = type === 'bot' ? '🤖' : '👤';
  div.innerHTML = `<div class="ai-msg-avatar ${type === 'bot' ? 'ai-bot-avatar' : 'ai-user-avatar'}">${avatar}</div><div class="ai-bubble">${text}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
function addAiTyping() {
  const msgs = document.getElementById('aiMessages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'ai-msg bot'; div.id = 'aiTyping';
  div.innerHTML = `<div class="ai-msg-avatar ai-bot-avatar">🤖</div><div class="ai-bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
function removeTyping() {
  document.getElementById('aiTyping')?.remove();
}

// Enter key for AI
document.addEventListener('DOMContentLoaded', () => {
  const aiInput = document.getElementById('aiInput');
  aiInput?.addEventListener('keydown', e => { if (e.key === 'Enter') window.sendAiMessage(); });
  initReveal();
  // Initialize AI welcome message
  setTimeout(() => addAiMessage(aiKnowledge.default, 'bot'), 500);
});

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
  if (!e.target.closest('#userAvatarBtn') && !e.target.closest('#userMenu')) {
    closeUserMenu();
  }
});

// ─────────────────────────────────────────────────
// GALLERY LIGHTBOX
// ─────────────────────────────────────────────────
window.openLightbox = (src) => {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lbImg');
  if (lb && img && src) { img.src = src; lb.classList.add('open'); }
};
window.closeLightbox = () => {
  document.getElementById('lightbox')?.classList.remove('open');
};
