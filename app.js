/**
 * PROTEIN TRACKER - SCIENTIFIC ONBOARDING, SUPABASE CLOUD, AI COACH & CACHE-FIRST SYNC ENGINE
 * Supabase PostgreSQL + Auth (RLS) | Google Gemini AI Coaching & Nudges | Weekly/Monthly Reports | 5-Step Scientific Quiz
 */

(function () {
  'use strict';

  // --- 1. STORAGE KEYS & CONSTANTS ---
  const STORAGE_KEYS = {
    TARGET: 'pt_target_grams',
    LOGS: 'pt_protein_logs',
    PRESETS: 'pt_quick_presets',
    CHALLENGES: 'pt_challenges_state',
    PROFILE: 'pt_user_profile',
    BLUEPRINT: 'pt_blueprint_data',
    BONUS_XP: 'pt_bonus_xp',
    ONBOARDED_V5: 'pt_onboarded_tour_v5',
    SUPABASE_CONFIG: 'pt_supabase_config',
    GEMINI_KEY: 'pt_gemini_api_key',
    SYNC_QUEUE: 'pt_sync_pending_queue',
    LAST_SYNC: 'pt_last_cloud_sync_time',
    AI_REPORTS: 'pt_ai_reports_cache',
    LATEST_NUDGE: 'pt_latest_ai_nudge'
  };

  const DEFAULT_TARGET = 150;

  const DEFAULT_PRESETS = [
    { id: 'p1', name: 'Whey Shake', grams: 25, tag: 'Post-Workout' },
    { id: 'p2', name: 'Chicken Breast', grams: 35, tag: 'Lunch / Meal' },
    { id: 'p3', name: '4 Whole Eggs', grams: 24, tag: 'Breakfast' },
    { id: 'p4', name: 'Greek Yogurt', grams: 20, tag: 'Snack' },
    { id: 'p5', name: 'Tuna Can', grams: 30, tag: 'Quick Meal' },
    { id: 'p6', name: 'Protein Bar', grams: 20, tag: 'On the Go' }
  ];

  const FOOD_CATALOG = [
    { name: 'Whey Protein (1 Scoop)', grams: 25, tag: 'Supplement' },
    { name: 'Chicken Breast (150g)', grams: 35, tag: 'Meat' },
    { name: '4 Large Eggs', grams: 24, tag: 'Breakfast' },
    { name: 'Greek Yogurt (200g)', grams: 20, tag: 'Dairy' },
    { name: 'Salmon Fillet (150g)', grams: 34, tag: 'Fish' },
    { name: 'Tuna Can (120g)', grams: 30, tag: 'Fish' },
    { name: 'Ribeye Steak (200g)', grams: 45, tag: 'Meat' },
    { name: 'Cottage Cheese (200g)', grams: 28, tag: 'Dairy' },
    { name: 'Tofu Block (250g)', grams: 22, tag: 'Plant' },
    { name: 'Protein Oatmeal', grams: 22, tag: 'Breakfast' }
  ];

  const INITIAL_CHALLENGES = [
    {
      id: 'c1',
      title: '3-Day 20g Breakfast Challenge',
      desc: 'Commit to logging at least 20g of protein before 10:30 AM for 3 days to kickstart morning muscle protein synthesis.',
      targetDays: 3,
      currentDays: 0,
      completedDates: [],
      xpReward: 150,
      claimed: false,
      status: 'committed',
      tag: 'Morning Habit'
    },
    {
      id: 'c2',
      title: '7-Day Consistent Titan',
      desc: 'Commit to hitting 100% of your daily protein target for 7 consecutive days.',
      targetDays: 7,
      currentDays: 0,
      completedDates: [],
      xpReward: 300,
      claimed: false,
      status: 'available',
      tag: 'Consistency'
    },
    {
      id: 'c3',
      title: 'GLP-1 Lean Muscle Guard',
      desc: 'Protect skeletal muscle while on GLP-1 medications by hitting your daily target distributed across 3+ feedings.',
      targetDays: 3,
      currentDays: 0,
      completedDates: [],
      xpReward: 200,
      claimed: false,
      status: 'available',
      tag: 'GLP-1 Protocol'
    },
    {
      id: 'c4',
      title: '160g Beast Mode Day',
      desc: 'Crush a single day with 160g+ protein to power heavy training sessions.',
      targetDays: 1,
      currentDays: 0,
      completedDates: [],
      xpReward: 100,
      claimed: false,
      status: 'available',
      tag: 'Power Day'
    }
  ];

  const SCIENCE_NUGGETS = [
    {
      title: 'GLP-1 & Muscle Preservation',
      text: 'On GLP-1 medications (Ozempic/Mounjaro/Wegovy), up to 40% of lost weight can be skeletal muscle unless protein is maintained at ≥1.8–2.2g/kg.'
    },
    {
      title: 'The Leucine Trigger',
      text: 'Consuming 25-30g of high-quality protein per meal provides the ~3g of leucine needed to maximize Muscle Protein Synthesis (MPS).'
    },
    {
      title: 'Thermic Effect of Food (TEF)',
      text: 'Protein has the highest thermic effect of any macronutrient: 20-30% of its calories are burned just during digestion!'
    },
    {
      title: 'Protein Distribution Matters',
      text: 'Distributing protein across 3-5 smaller meals daily stimulates muscle recovery more effectively than eating it all in one sitting.'
    },
    {
      title: 'Satiety & Craving Control',
      text: 'A high-protein breakfast reduces ghrelin (the hunger hormone) and suppresses evening cravings significantly.'
    }
  ];

  // --- 2. APPLICATION STATE (CACHE-FIRST) ---
  let state = {
    target: parseInt(localStorage.getItem(STORAGE_KEYS.TARGET), 10) || DEFAULT_TARGET,
    logs: JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]'),
    presets: JSON.parse(localStorage.getItem(STORAGE_KEYS.PRESETS) || JSON.stringify(DEFAULT_PRESETS)),
    challenges: JSON.parse(localStorage.getItem(STORAGE_KEYS.CHALLENGES) || JSON.stringify(INITIAL_CHALLENGES)),
    bonusXp: parseInt(localStorage.getItem(STORAGE_KEYS.BONUS_XP), 10) || 0,
    profile: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || JSON.stringify({
      name: 'Athlete',
      email: '',
      avatar: '⚡',
      isLoggedIn: false,
      userId: null
    })),
    blueprint: JSON.parse(localStorage.getItem(STORAGE_KEYS.BLUEPRINT) || JSON.stringify({
      active: true,
      weight: 75,
      unit: 'kg',
      goalKey: 'muscle',
      activityKey: 'active',
      ratio: 2.0,
      meals: 3,
      isGlp: false
    })),
    supabaseConfig: JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG) || JSON.stringify({
      url: 'https://ejmrmnihnycxulitgvkv.supabase.co',
      anonKey: 'sb_publishable_PAYdOPuiX2w3DODRZLotVw_Nt_cbDwE'
    })),
    geminiKey: localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '',
    syncQueue: JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE) || '[]'),
    aiReports: JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_REPORTS) || '{}'),
    latestNudge: JSON.parse(localStorage.getItem(STORAGE_KEYS.LATEST_NUDGE) || 'null')
  };

  if (!state.supabaseConfig.url) {
    state.supabaseConfig.url = 'https://ejmrmnihnycxulitgvkv.supabase.co';
    state.supabaseConfig.anonKey = 'sb_publishable_PAYdOPuiX2w3DODRZLotVw_Nt_cbDwE';
  }

  let activeSelectedMealSlot = 0;
  let activeReflectionPeriod = 'weekly';
  let supabaseClient = null;

  function saveLocalState() {
    localStorage.setItem(STORAGE_KEYS.TARGET, state.target);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.logs));
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(state.presets));
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(state.challenges));
    localStorage.setItem(STORAGE_KEYS.BONUS_XP, state.bonusXp);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(state.profile));
    localStorage.setItem(STORAGE_KEYS.BLUEPRINT, JSON.stringify(state.blueprint));
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(state.supabaseConfig));
    localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, state.geminiKey);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(state.syncQueue));
    localStorage.setItem(STORAGE_KEYS.AI_REPORTS, JSON.stringify(state.aiReports));
    if (state.latestNudge) {
      localStorage.setItem(STORAGE_KEYS.LATEST_NUDGE, JSON.stringify(state.latestNudge));
    }
  }

  // --- 3. SUPABASE CLIENT & CLOUD SYNC ENGINE ---
  function initSupabase() {
    const cfg = state.supabaseConfig;
    if (cfg && cfg.url && cfg.anonKey && window.supabase && window.supabase.createClient) {
      try {
        supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
        
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
          if (session && session.user) {
            state.profile.isLoggedIn = true;
            state.profile.userId = session.user.id;
            state.profile.email = session.user.email;
            if (session.user.user_metadata && session.user.user_metadata.name) {
              state.profile.name = session.user.user_metadata.name;
            }
            if (session.user.user_metadata && session.user.user_metadata.avatar) {
              state.profile.avatar = session.user.user_metadata.avatar;
            }
            saveLocalState();
            updateSyncStatusUI('synced', `Connected as ${session.user.email}`);
            
            await hydrateFromCloud();
            flushSyncQueue();
          } else {
            state.profile.isLoggedIn = false;
            state.profile.userId = null;
            saveLocalState();
            updateSyncStatusUI('offline', 'Guest Mode (Local Cache Active)');
          }
          renderAuthViews();
          updateDashboard();
        });

        updateSyncStatusUI('synced', 'Supabase Connected • Snappy Cache Active');
      } catch (err) {
        console.warn('Supabase initialization failed:', err);
        updateSyncStatusUI('offline', 'Local Cache Active (Snappy Mode)');
      }
    } else {
      updateSyncStatusUI('offline', 'Local Cache Active (Snappy Mode)');
    }
  }

  function updateSyncStatusUI(status, message) {
    const dot = document.getElementById('sync-dot');
    const text = document.getElementById('sync-status-text');
    if (!dot || !text) return;

    dot.className = `sync-dot ${status}`;
    text.textContent = message;
  }

  async function enqueueCloudMutation(table, action, data) {
    if (!state.profile.isLoggedIn || !supabaseClient || !state.profile.userId) {
      return;
    }

    const job = {
      id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      table,
      action,
      data: { ...data, user_id: state.profile.userId },
      timestamp: Date.now()
    };

    state.syncQueue.push(job);
    saveLocalState();
    flushSyncQueue();
  }

  async function flushSyncQueue() {
    if (!supabaseClient || !state.profile.isLoggedIn || state.syncQueue.length === 0) return;
    if (!navigator.onLine) {
      updateSyncStatusUI('offline', 'Offline • Changes saved locally');
      return;
    }

    updateSyncStatusUI('syncing', 'Syncing changes to Supabase...');

    const queue = [...state.syncQueue];
    const remainingQueue = [];

    for (const job of queue) {
      try {
        if (job.action === 'UPSERT') {
          await supabaseClient.from(job.table).upsert(job.data);
        } else if (job.action === 'INSERT') {
          await supabaseClient.from(job.table).insert(job.data);
        } else if (job.action === 'DELETE') {
          if (job.data.id) {
            await supabaseClient.from(job.table).delete().match({ id: job.data.id, user_id: state.profile.userId });
          }
        }
      } catch (err) {
        console.warn(`Sync job failed for ${job.table}:`, err);
        remainingQueue.push(job);
      }
    }

    state.syncQueue = remainingQueue;
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    saveLocalState();

    if (remainingQueue.length === 0) {
      updateSyncStatusUI('synced', `🟢 Synced with Supabase (${state.profile.email})`);
    } else {
      updateSyncStatusUI('syncing', `${remainingQueue.length} changes queued for sync`);
    }
  }

  async function hydrateFromCloud() {
    if (!supabaseClient || !state.profile.userId) return;

    try {
      updateSyncStatusUI('syncing', 'Restoring cloud data...');

      // 1. Profile
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', state.profile.userId)
        .single();

      if (profileData) {
        state.profile.name = profileData.name || state.profile.name;
        state.profile.avatar = profileData.avatar || state.profile.avatar;
        state.target = profileData.target_grams || state.target;
        state.bonusXp = profileData.bonus_xp || state.bonusXp;
      }

      // 2. Blueprint
      const { data: blueprintData } = await supabaseClient
        .from('blueprints')
        .select('*')
        .eq('user_id', state.profile.userId)
        .single();

      if (blueprintData) {
        state.blueprint = {
          active: blueprintData.active !== false,
          weight: Number(blueprintData.weight) || 75,
          unit: blueprintData.unit || 'kg',
          goalKey: blueprintData.goal_key || 'muscle',
          activityKey: blueprintData.activity_key || 'active',
          ratio: Number(blueprintData.ratio) || 2.0,
          meals: blueprintData.meals || 3,
          isGlp: blueprintData.is_glp || false
        };
      }

      // 3. Protein Logs
      const { data: cloudLogs } = await supabaseClient
        .from('protein_logs')
        .select('*')
        .eq('user_id', state.profile.userId)
        .order('timestamp', { ascending: true });

      if (cloudLogs && cloudLogs.length > 0) {
        const localLogIds = new Set(state.logs.map((l) => l.id));
        cloudLogs.forEach((cl) => {
          if (!localLogIds.has(cl.id)) {
            state.logs.push({
              id: cl.id,
              grams: cl.grams,
              name: cl.name,
              timestamp: cl.timestamp,
              dateStr: cl.date_str,
              mealSlot: cl.meal_slot
            });
          }
        });
      }

      // 4. Custom Presets
      const { data: cloudPresets } = await supabaseClient
        .from('custom_presets')
        .select('*')
        .eq('user_id', state.profile.userId);

      if (cloudPresets && cloudPresets.length > 0) {
        state.presets = cloudPresets.map((cp) => ({
          id: cp.id,
          name: cp.name,
          grams: cp.grams,
          tag: cp.tag
        }));
      }

      // 5. Challenges Progression
      const { data: cloudChallenges } = await supabaseClient
        .from('user_challenges')
        .select('*')
        .eq('user_id', state.profile.userId);

      if (cloudChallenges && cloudChallenges.length > 0) {
        cloudChallenges.forEach((cc) => {
          const match = state.challenges.find((c) => c.id === cc.challenge_id);
          if (match) {
            match.currentDays = cc.current_days;
            match.completedDates = cc.completed_dates || [];
            match.status = cc.status;
            match.claimed = cc.claimed;
          }
        });
      }

      // 6. AI Reports
      const { data: cloudReports } = await supabaseClient
        .from('ai_reports')
        .select('*')
        .eq('user_id', state.profile.userId)
        .order('created_at', { ascending: false });

      if (cloudReports && cloudReports.length > 0) {
        cloudReports.forEach((cr) => {
          state.aiReports[cr.period_type] = {
            periodType: cr.period_type,
            grade: cr.goal_hit_rate >= 85 ? 'A+' : (cr.goal_hit_rate >= 70 ? 'A' : 'B'),
            aiSummary: cr.ai_summary,
            keyWins: cr.key_wins || [],
            focusAreas: cr.focus_areas || [],
            recommendedGoalAdjustment: cr.recommended_goal_adjustment,
            avgDailyProtein: cr.avg_daily_protein,
            goalHitRate: cr.goal_hit_rate,
            streakAchieved: cr.streak_achieved,
            startDate: cr.start_date,
            endDate: cr.end_date
          };
        });
      }

      saveLocalState();
      updateSyncStatusUI('synced', `🟢 Synced with Supabase (${state.profile.email})`);
      showToast('☁️ Cloud data restored successfully!', '✓');
    } catch (err) {
      console.warn('Cloud hydration warning:', err);
      updateSyncStatusUI('offline', 'Local Cache Active (Snappy Mode)');
    }
  }

  async function migrateGuestDataToCloud() {
    if (!supabaseClient || !state.profile.userId) return;

    try {
      await supabaseClient.from('profiles').upsert({
        id: state.profile.userId,
        name: state.profile.name,
        email: state.profile.email,
        avatar: state.profile.avatar,
        target_grams: state.target,
        bonus_xp: state.bonusXp
      });

      await supabaseClient.from('blueprints').upsert({
        user_id: state.profile.userId,
        weight: state.blueprint.weight,
        unit: state.blueprint.unit,
        goal_key: state.blueprint.goalKey,
        activity_key: state.blueprint.activityKey,
        ratio: state.blueprint.ratio,
        meals: state.blueprint.meals,
        is_glp: state.blueprint.isGlp,
        active: state.blueprint.active
      });

      if (state.logs.length > 0) {
        const logPayloads = state.logs.map((l) => ({
          id: l.id,
          user_id: state.profile.userId,
          grams: l.grams,
          name: l.name,
          timestamp: l.timestamp,
          date_str: l.dateStr,
          meal_slot: l.mealSlot || 0
        }));
        await supabaseClient.from('protein_logs').upsert(logPayloads);
      }

      if (state.challenges.length > 0) {
        const challengePayloads = state.challenges.map((c) => ({
          user_id: state.profile.userId,
          challenge_id: c.id,
          current_days: c.currentDays,
          completed_dates: c.completedDates,
          status: c.status,
          claimed: c.claimed
        }));
        await supabaseClient.from('user_challenges').upsert(challengePayloads);
      }

      showToast('✨ Local history migrated to your Cloud account!', '☁️');
    } catch (e) {
      console.warn('Guest migration notice:', e);
    }
  }

  // --- 4. TIME & DATE HELPERS ---
  function getTodayDateStr() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatTime(isoStr) {
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // --- 5. HAPTICS & AUDIO FEEDBACK ---
  function playHaptic() {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(30); } catch (e) {}
    }
  }

  function playChime(type = 'pop') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'victory') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'quest') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {}
  }

  function triggerCelebration() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#10b981', '#34d399', '#38bdf8', '#fbbf24', '#f43f5e', '#a78bfa'];
    const particles = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 180,
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }

    let animationFrame;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38;
        p.rotation += p.rSpeed;
        p.opacity -= 0.014;

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive) {
        animationFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    cancelAnimationFrame(animationFrame);
    render();
  }

  function showToast(message, iconSvg = '✓') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="color: var(--emerald-400); font-size: 1.1rem;">${iconSvg}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  }

  function getTodayLogs() {
    const today = getTodayDateStr();
    return state.logs.filter((log) => log.dateStr === today);
  }

  function getTodayTotal() {
    return getTodayLogs().reduce((sum, item) => sum + item.grams, 0);
  }

  function calculateStreak() {
    const dailyTotals = {};
    state.logs.forEach((log) => {
      dailyTotals[log.dateStr] = (dailyTotals[log.dateStr] || 0) + log.grams;
    });

    const todayStr = getTodayDateStr();
    let streak = 0;
    let checkDate = new Date();

    const todayTotal = dailyTotals[todayStr] || 0;
    if (todayTotal >= state.target) {
      streak++;
    }

    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dStr = `${year}-${month}-${day}`;

      if ((dailyTotals[dStr] || 0) >= state.target) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // --- 6. AI SMART COACH & INTELLIGENT NUDGE ENGINE ---
  async function analyzeTrackingAndNudge() {
    const dailyTotals = {};
    state.logs.forEach((log) => {
      dailyTotals[log.dateStr] = (dailyTotals[log.dateStr] || 0) + log.grams;
    });

    // Check consecutive days under target (past 3-5 days)
    let daysUnderTarget = 0;
    for (let i = 1; i <= 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      const total = dailyTotals[dateStr] || 0;
      if (total < state.target) {
        daysUnderTarget++;
      } else {
        break;
      }
    }

    const streak = calculateStreak();
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      history.push({ date: dateStr, grams: dailyTotals[dateStr] || 0 });
    }

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': state.geminiKey || ''
        },
        body: JSON.stringify({
          name: state.profile.name,
          target: state.target,
          streak: streak,
          goal: state.blueprint.goalKey,
          isGlp: state.blueprint.isGlp,
          daysUnderTarget: daysUnderTarget,
          history: history,
          geminiKey: state.geminiKey
        })
      });

      if (res.ok) {
        const nudgeData = await res.json();
        state.latestNudge = nudgeData;
        saveLocalState();
        renderAiCoachBanner(nudgeData);

        // Async Cloud Sync to Supabase
        enqueueCloudMutation('ai_nudges', 'INSERT', {
          id: 'nudge_' + Date.now(),
          nudge_type: nudgeData.nudgeType || 'coach_nudge',
          title: nudgeData.title,
          message: nudgeData.message,
          suggested_foods: nudgeData.suggestedFoods || [],
          action_type: nudgeData.suggestGoalAdjustment ? 'goal_adjustment' : 'none'
        });
      }
    } catch (err) {
      console.warn('AI coach fetch notice:', err);
      // Fallback local render if fetch failed
      if (daysUnderTarget >= 3) {
        renderAiCoachBanner({
          nudgeType: 'deficit_rescue',
          title: '🎯 Let\'s Reset Your Momentum',
          message: `You've been slightly below your ${state.target}g target for 3 days. That's completely okay! Rebuilding consistency starts with one easy high-density bridge meal today.`,
          suggestedFoods: [
            { name: 'Double Scoop Whey Shake', grams: 45, tag: 'Instant Catch-Up' },
            { name: 'Grilled Chicken Breast (150g)', grams: 35, tag: 'Clean Lean Meat' },
            { name: 'Tuna Can in Olive Oil', grams: 30, tag: 'Zero-Prep' }
          ],
          suggestGoalAdjustment: true,
          recommendedNewTarget: Math.round(state.target * 0.85),
          adjustmentReason: `Consider easing your daily goal to ${Math.round(state.target * 0.85)}g to build a steady winning streak.`
        });
      }
    }
  }

  function renderAiCoachBanner(nudge) {
    const banner = document.getElementById('ai-coach-banner');
    if (!banner || !nudge) return;

    banner.style.display = 'flex';

    let foodChipsHtml = '';
    if (nudge.suggestedFoods && nudge.suggestedFoods.length > 0) {
      nudge.suggestedFoods.forEach((food) => {
        foodChipsHtml += `
          <button type="button" class="ai-food-chip" data-grams="${food.grams}" data-name="${escapeHtml(food.name)}">
            <span>+</span>
            <span>${escapeHtml(food.name)}</span>
            <span class="chip-grams">+${food.grams}g</span>
          </button>
        `;
      });
    }

    let adjustGoalHtml = '';
    if (nudge.suggestGoalAdjustment && nudge.recommendedNewTarget) {
      adjustGoalHtml = `
        <div style="display:flex; flex-direction:column; gap:6px; margin-top:2px;">
          <div style="font-size:0.75rem; color:var(--text-secondary);">${escapeHtml(nudge.adjustmentReason || '')}</div>
          <button type="button" class="ai-adjust-goal-btn" id="ai-apply-goal-btn" data-target="${nudge.recommendedNewTarget}">
            🎯 Easing Target to ${nudge.recommendedNewTarget}g / day
          </button>
        </div>
      `;
    }

    banner.innerHTML = `
      <div class="ai-coach-top">
        <div class="ai-badge">🤖 Gemini AI Coach</div>
        <div class="ai-coach-title">${escapeHtml(nudge.title || 'Personalized Coaching')}</div>
      </div>
      <div class="ai-coach-msg">${escapeHtml(nudge.message || '')}</div>
      ${foodChipsHtml ? `
        <div>
          <div style="font-size:0.6875rem; font-weight:700; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase;">1-Tap Suggested Protein Sources:</div>
          <div class="ai-suggested-foods-row">${foodChipsHtml}</div>
        </div>
      ` : ''}
      ${adjustGoalHtml}
    `;

    // 1-Tap Food Logging from AI Coach
    banner.querySelectorAll('.ai-food-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const grams = parseInt(btn.dataset.grams, 10);
        const name = btn.dataset.name;
        logProtein(grams, name, activeSelectedMealSlot);
        showToast(`⚡ AI Suggested: +${grams}g ${name} logged!`, '🤖');
      });
    });

    // 1-Tap Target Recalibration
    const applyGoalBtn = banner.querySelector('#ai-apply-goal-btn');
    if (applyGoalBtn) {
      applyGoalBtn.addEventListener('click', () => {
        const newTarget = parseInt(applyGoalBtn.dataset.target, 10);
        if (!isNaN(newTarget) && newTarget > 0) {
          state.target = newTarget;
          saveLocalState();
          enqueueCloudMutation('profiles', 'UPSERT', {
            id: state.profile.userId,
            target_grams: state.target
          });
          playChime('quest');
          triggerCelebration();
          showToast(`🎯 Goal adjusted to ${newTarget}g/day! Let's crush it!`, '⭐');
          updateDashboard();
          analyzeTrackingAndNudge();
        }
      });
    }
  }

  // --- 7. AI REFLECTION STUDIO (WEEKLY & MONTHLY REPORTS) ---
  async function generateAIReflectionReport(period = 'weekly') {
    const contentEl = document.getElementById('ai-reflection-content');
    const genBtn = document.getElementById('generate-reflection-btn');

    if (!contentEl) return;

    const numDays = period === 'monthly' ? 30 : 7;
    const dailyTotals = {};
    state.logs.forEach((log) => {
      dailyTotals[log.dateStr] = (dailyTotals[log.dateStr] || 0) + log.grams;
    });

    const history = [];
    let sumProtein = 0;
    let hitDays = 0;

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      const grams = dailyTotals[dateStr] || 0;
      sumProtein += grams;
      if (grams >= state.target) hitDays++;
      history.push({ date: dateStr, grams });
    }

    const avgProtein = Math.round(sumProtein / numDays);
    const hitRate = Math.round((hitDays / numDays) * 100);
    const streak = calculateStreak();

    if (genBtn) {
      genBtn.disabled = true;
      genBtn.textContent = '✨ Generating AI Analysis...';
    }

    contentEl.innerHTML = `
      <div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:0.8125rem;">
        <span class="sync-dot syncing" style="margin-right:6px;"></span>
        Analyzing ${numDays} days of intake, habits, and nitrogen balance with Gemini AI...
      </div>
    `;

    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': state.geminiKey || ''
        },
        body: JSON.stringify({
          period: period,
          name: state.profile.name,
          target: state.target,
          streak: streak,
          goal: state.blueprint.goalKey,
          isGlp: state.blueprint.isGlp,
          avgProtein: avgProtein,
          hitRate: hitRate,
          history: history,
          geminiKey: state.geminiKey
        })
      });

      let report = null;
      if (res.ok) {
        report = await res.json();
      }

      if (!report) {
        report = {
          periodType: period,
          grade: hitRate >= 80 ? 'A+' : (hitRate >= 65 ? 'A' : 'B'),
          aiSummary: `Over the past ${numDays} days, you maintained a daily average of ${avgProtein}g protein with a ${hitRate}% consistency rate. Your muscle protein synthesis and recovery habits show solid foundation.`,
          keyWins: [
            `Logged an average of ${avgProtein}g against your ${state.target}g goal.`,
            `Hit target on ${hitDays} out of ${numDays} days.`,
            `Maintained an active streak of ${streak} days.`
          ],
          focusAreas: [
            `Front-load 25g+ protein with breakfast to avoid evening catch-up pressure.`,
            `Use high-density protein shakes on busy training days.`
          ],
          recommendedGoalAdjustment: `Keep your current target at ${state.target}g/day.`
        };
      }

      report.avgDailyProtein = avgProtein;
      report.goalHitRate = hitRate;
      report.streakAchieved = streak;
      report.startDate = history[0].date;
      report.endDate = history[history.length - 1].date;

      state.aiReports[period] = report;
      saveLocalState();
      renderReflectionReport(report);
      playChime('victory');
      triggerCelebration();
      showToast(`📊 ${period === 'monthly' ? 'Monthly' : 'Weekly'} AI Reflection generated!`, '✨');

      // Async Cloud Sync to Supabase
      enqueueCloudMutation('ai_reports', 'UPSERT', {
        id: `report_${period}_${Date.now()}`,
        period_type: period,
        start_date: report.startDate,
        end_date: report.endDate,
        avg_daily_protein: avgProtein,
        goal_hit_rate: hitRate,
        streak_achieved: streak,
        ai_summary: report.aiSummary,
        key_wins: report.keyWins,
        focus_areas: report.focusAreas,
        recommended_goal_adjustment: report.recommendedGoalAdjustment
      });

    } catch (e) {
      console.warn('AI Report generation notice:', e);
    } finally {
      if (genBtn) {
        genBtn.disabled = false;
        genBtn.textContent = '✨ Generate AI Report';
      }
    }
  }

  function renderReflectionReport(report) {
    const contentEl = document.getElementById('ai-reflection-content');
    if (!contentEl || !report) return;

    let keyWinsHtml = '';
    if (report.keyWins) {
      report.keyWins.forEach((win) => {
        keyWinsHtml += `<div class="key-win-item"><span>🏆</span><span>${escapeHtml(win)}</span></div>`;
      });
    }

    let focusAreasHtml = '';
    if (report.focusAreas) {
      report.focusAreas.forEach((area) => {
        focusAreasHtml += `<div class="focus-area-item"><span>🎯</span><span>${escapeHtml(area)}</span></div>`;
      });
    }

    contentEl.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
        <div>
          <div style="font-size:0.875rem; font-weight:800; color:var(--text-primary);">
            ${report.periodType === 'monthly' ? '30-Day Monthly Reflection' : '7-Day Weekly Reflection'}
          </div>
          <div style="font-size:0.6875rem; color:var(--text-muted);">${report.startDate || ''} to ${report.endDate || ''}</div>
        </div>
        <div class="reflection-grade-badge">${escapeHtml(report.grade || 'A')}</div>
      </div>

      <div class="reflection-metrics-grid">
        <div class="reflection-metric-box">
          <div class="metric-val">${report.avgDailyProtein || 0}g</div>
          <div class="metric-lbl">Daily Average</div>
        </div>
        <div class="reflection-metric-box">
          <div class="metric-val">${report.goalHitRate || 0}%</div>
          <div class="metric-lbl">Goal Hit Rate</div>
        </div>
        <div class="reflection-metric-box">
          <div class="metric-val">${report.streakAchieved || 0}d</div>
          <div class="metric-lbl">Peak Streak</div>
        </div>
      </div>

      <div class="reflection-narrative-box">
        ${escapeHtml(report.aiSummary || '')}
      </div>

      <div>
        <div class="reflection-section-title">Key Wins & Milestones</div>
        <div class="key-wins-list">${keyWinsHtml}</div>
      </div>

      <div>
        <div class="reflection-section-title">Next Period Action Plan</div>
        <div class="focus-areas-list">${focusAreasHtml}</div>
      </div>

      ${report.recommendedGoalAdjustment ? `
        <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:var(--radius-sm); padding:10px 12px; font-size:0.75rem; color:var(--amber-400);">
          💡 <strong>Goal Recommendation:</strong> ${escapeHtml(report.recommendedGoalAdjustment)}
        </div>
      ` : ''}
    `;
  }

  function initReflectionStudio() {
    const weeklyTab = document.getElementById('tab-reflection-weekly');
    const monthlyTab = document.getElementById('tab-reflection-monthly');
    const genBtn = document.getElementById('generate-reflection-btn');

    if (weeklyTab && monthlyTab) {
      weeklyTab.addEventListener('click', () => {
        activeReflectionPeriod = 'weekly';
        weeklyTab.classList.add('active');
        monthlyTab.classList.remove('active');
        if (state.aiReports['weekly']) {
          renderReflectionReport(state.aiReports['weekly']);
        } else {
          generateAIReflectionReport('weekly');
        }
      });

      monthlyTab.addEventListener('click', () => {
        activeReflectionPeriod = 'monthly';
        monthlyTab.classList.add('active');
        weeklyTab.classList.remove('active');
        if (state.aiReports['monthly']) {
          renderReflectionReport(state.aiReports['monthly']);
        } else {
          generateAIReflectionReport('monthly');
        }
      });
    }

    if (genBtn) {
      genBtn.addEventListener('click', () => {
        generateAIReflectionReport(activeReflectionPeriod);
      });
    }

    // Render cached report if exists
    if (state.aiReports[activeReflectionPeriod]) {
      renderReflectionReport(state.aiReports[activeReflectionPeriod]);
    } else {
      const contentEl = document.getElementById('ai-reflection-content');
      if (contentEl) {
        contentEl.innerHTML = `
          <div style="text-align:center; padding:18px; color:var(--text-muted); font-size:0.8125rem;">
            Click <strong>"✨ Generate AI Report"</strong> to generate your ${activeReflectionPeriod === 'monthly' ? 'monthly' : 'weekly'} reflection.
          </div>
        `;
      }
    }
  }

  // --- 8. MEAL NAMES HELPER ---
  function getMealSlotNames(numMeals) {
    if (numMeals === 2) return ['Lunch (Meal 1)', 'Dinner (Meal 2)'];
    if (numMeals === 4) return ['Breakfast (Meal 1)', 'Lunch (Meal 2)', 'Snack (Meal 3)', 'Dinner (Meal 4)'];
    if (numMeals === 5) return ['Breakfast (M1)', 'Snack (M2)', 'Lunch (M3)', 'Snack (M4)', 'Dinner (M5)'];
    if (numMeals === 6) return ['Breakfast (M1)', 'Snack (M2)', 'Lunch (M3)', 'Shake (M4)', 'Dinner (M5)', 'Night Snack (M6)'];
    return ['Breakfast (Meal 1)', 'Lunch (Meal 2)', 'Dinner (Meal 3)'];
  }

  // --- 9. DYNAMIC MEAL BREAKOUT ALLOCATION ENGINE ---
  function computeMealBreakout() {
    const numMeals = Math.min(6, Math.max(2, state.blueprint.meals || 3));
    const slotNames = getMealSlotNames(numMeals);
    const todayLogs = getTodayLogs();
    const totalDailyTarget = state.target;

    const slotLogsGrams = new Array(numMeals).fill(0);
    const unassignedLogs = [];

    todayLogs.forEach((log) => {
      if (typeof log.mealSlot === 'number' && log.mealSlot >= 0 && log.mealSlot < numMeals) {
        slotLogsGrams[log.mealSlot] += log.grams;
      } else {
        unassignedLogs.push(log);
      }
    });

    unassignedLogs.forEach((log) => {
      let assigned = false;
      const baseTarget = Math.round(totalDailyTarget / numMeals);
      for (let i = 0; i < numMeals; i++) {
        if (slotLogsGrams[i] < baseTarget) {
          slotLogsGrams[i] += log.grams;
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        slotLogsGrams[numMeals - 1] += log.grams;
      }
    });

    const totalLoggedToday = slotLogsGrams.reduce((a, b) => a + b, 0);
    const totalRemaining = Math.max(0, totalDailyTarget - totalLoggedToday);
    const standardPerMeal = Math.round(totalDailyTarget / numMeals);
    const slots = [];

    let remainingSlotsCount = 0;
    for (let i = 0; i < numMeals; i++) {
      if (slotLogsGrams[i] === 0) {
        remainingSlotsCount++;
      }
    }
    if (remainingSlotsCount === 0 && totalRemaining > 0) {
      remainingSlotsCount = 1;
    }

    const dynamicTargetPerRemainingMeal = remainingSlotsCount > 0 
      ? Math.ceil(totalRemaining / remainingSlotsCount) 
      : 0;

    let firstActiveIndex = -1;

    for (let i = 0; i < numMeals; i++) {
      const logged = slotLogsGrams[i];
      let targetForSlot = 0;
      let isDone = false;
      let isNext = false;

      if (logged > 0) {
        targetForSlot = Math.max(logged, standardPerMeal);
        isDone = true;
      } else {
        targetForSlot = dynamicTargetPerRemainingMeal;
        if (firstActiveIndex === -1) {
          firstActiveIndex = i;
          isNext = true;
        }
      }

      slots.push({
        index: i,
        name: slotNames[i],
        logged: logged,
        target: targetForSlot,
        isDone: isDone,
        isNext: isNext
      });
    }

    if (firstActiveIndex !== -1) {
      activeSelectedMealSlot = firstActiveIndex;
    }

    return { slots, totalDailyTarget, totalLoggedToday, totalRemaining, numMeals };
  }

  function renderMealBreakoutCard() {
    const breakoutSection = document.getElementById('meal-breakout-section');
    const slotsGrid = document.getElementById('meal-slots-grid');
    const tagSelectorContainer = document.getElementById('meal-tag-selector');

    if (!breakoutSection || !slotsGrid) return;

    if (!state.blueprint.active) {
      breakoutSection.style.display = 'none';
      if (tagSelectorContainer) tagSelectorContainer.style.display = 'none';
      return;
    }

    breakoutSection.style.display = 'flex';
    if (tagSelectorContainer) tagSelectorContainer.style.display = 'flex';

    const breakout = computeMealBreakout();
    slotsGrid.innerHTML = '';

    breakout.slots.forEach((slot) => {
      const slotEl = document.createElement('div');
      slotEl.className = `meal-slot-item ${slot.isDone ? 'completed' : ''} ${slot.isNext ? 'active-next' : ''}`;

      const pct = slot.target > 0 ? Math.min(100, Math.round((slot.logged / slot.target) * 100)) : (slot.isDone ? 100 : 0);

      slotEl.innerHTML = `
        <div class="meal-slot-top">
          <span class="meal-slot-name">${escapeHtml(slot.name)}</span>
          <span class="meal-slot-status-icon">${slot.isDone ? '✓' : (slot.isNext ? '👉' : '⏳')}</span>
        </div>
        <div class="meal-slot-target ${slot.isDone ? 'done' : 'needed'}">
          ${slot.isDone ? `${slot.logged}g` : `${slot.target}g needed`}
        </div>
        <div class="meal-slot-subtext">
          ${slot.isDone ? `Logged for meal` : `Remaining target`}
        </div>
        <div class="meal-slot-track">
          <div class="meal-slot-fill" style="width: ${pct}%;"></div>
        </div>
      `;

      slotsGrid.appendChild(slotEl);
    });

    if (tagSelectorContainer) {
      tagSelectorContainer.innerHTML = '';
      breakout.slots.forEach((slot, idx) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `meal-tag-chip ${idx === activeSelectedMealSlot ? 'selected' : ''}`;
        chip.textContent = slot.name.split(' ')[0];
        chip.addEventListener('click', () => {
          activeSelectedMealSlot = idx;
          tagSelectorContainer.querySelectorAll('.meal-tag-chip').forEach((c) => c.classList.remove('selected'));
          chip.classList.add('selected');
        });
        tagSelectorContainer.appendChild(chip);
      });
    }
  }

  // --- 10. GOAL-SPECIFIC RESCUE COACH & SMART BRIDGES ---
  const RESCUE_CONFIGS = {
    'glp': {
      themeClass: 'glp-theme',
      badge: '💉 GLP-1 Low Appetite Rescue',
      title: 'Appetite Suppressed? Use Liquid Density',
      getAdvice: (rem) => `On GLP-1 injections, solid meals feel heavy. Reach your remaining <strong>${rem}g</strong> using clear whey or concentrated liquid shakes to protect muscle with zero nausea.`,
      bridges: [
        { name: 'Clear Whey Isolate', grams: 25, icon: '🥤' },
        { name: 'Concentrated Whey Shake', grams: 30, icon: '🥛' },
        { name: 'Greek Yogurt Cup', grams: 20, icon: '🥣' }
      ]
    },
    'muscle': {
      themeClass: 'muscle-theme',
      badge: '💪 Hypertrophy Overnight Repair',
      title: 'Fuel Overnight Muscle Synthesis',
      getAdvice: (rem) => `You are <strong>${rem}g away</strong> from maximum daily Muscle Protein Synthesis. A quick pre-bed casein or whey top-up prevents nocturnal muscle breakdown.`,
      bridges: [
        { name: 'Casein / Greek Yogurt', grams: 28, icon: '🥣' },
        { name: 'Chicken Breast Snack', grams: 35, icon: '🍗' },
        { name: 'Double Scoop Shake', grams: 45, icon: '🥛' }
      ]
    },
    'cut': {
      themeClass: 'cut-theme',
      badge: '🔥 Fat Loss Satiety Guard',
      title: 'Crush Late-Night Cravings with Protein',
      getAdvice: (rem) => `Missing your protein target causes ghrelin spikes and late snacking cravings. Bridge your remaining <strong>${rem}g</strong> with lean, pure protein.`,
      bridges: [
        { name: 'Tuna in Water', grams: 30, icon: '🐟' },
        { name: 'Egg White Scramble', grams: 24, icon: '🍳' },
        { name: 'Zero-Carb Isolate', grams: 25, icon: '🥛' }
      ]
    },
    'athlete': {
      themeClass: 'muscle-theme',
      badge: '⚡ Athletic Recovery Alert',
      title: 'Speed Up Micro-Trauma Repair',
      getAdvice: (rem) => `Your training created micro-tears in muscle fibers. Close your <strong>${rem}g gap</strong> now so you are fully recovered for tomorrow.`,
      bridges: [
        { name: 'Recovery Whey Shake', grams: 30, icon: '🥛' },
        { name: 'Lean Beef / Chicken', grams: 35, icon: '🥩' },
        { name: 'Greek Yogurt + Berries', grams: 22, icon: '🥣' }
      ]
    },
    'health': {
      themeClass: '',
      badge: '🌿 Daily Vitality & Energy',
      title: 'Stabilize Evening Energy',
      getAdvice: (rem) => `Closing your <strong>${rem}g target</strong> keeps blood glucose steady and supports immune and metabolic health.`,
      bridges: [
        { name: 'Edamame / Tofu Snack', grams: 18, icon: '🥜' },
        { name: 'Greek Yogurt Bowl', grams: 20, icon: '🥣' },
        { name: 'Plant Protein Shake', grams: 22, icon: '🥛' }
      ]
    }
  };

  function renderRescueCoach() {
    const rescueCard = document.getElementById('rescue-coach-card');
    if (!rescueCard) return;

    const totalLogged = getTodayTotal();
    const target = state.target;
    const remaining = Math.max(0, target - totalLogged);

    if (remaining <= 0) {
      rescueCard.style.display = 'none';
      return;
    }

    rescueCard.style.display = 'flex';
    const goalKey = state.blueprint.goalKey || (state.blueprint.isGlp ? 'glp' : 'muscle');
    const cfg = RESCUE_CONFIGS[goalKey] || RESCUE_CONFIGS['muscle'];

    rescueCard.className = `rescue-coach-card ${cfg.themeClass}`;

    let bridgesHtml = '';
    cfg.bridges.forEach((b) => {
      bridgesHtml += `
        <button type="button" class="rescue-bridge-btn" data-grams="${b.grams}" data-name="${escapeHtml(b.name)}">
          <span>${b.icon}</span>
          <span class="rescue-bridge-name">${escapeHtml(b.name)}</span>
          <span class="rescue-bridge-grams">+${b.grams}g</span>
        </button>
      `;
    });

    rescueCard.innerHTML = `
      <div class="rescue-top">
        <div class="rescue-title-group">
          <span class="rescue-badge">${escapeHtml(cfg.badge)}</span>
          <span class="rescue-title">${escapeHtml(cfg.title)}</span>
        </div>
      </div>
      <div class="rescue-desc">${cfg.getAdvice(remaining)}</div>
      <div>
        <div style="font-size:0.6875rem; font-weight:700; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase;">1-Tap Smart Bridge Options:</div>
        <div class="rescue-bridge-row">${bridgesHtml}</div>
      </div>
    `;

    rescueCard.querySelectorAll('.rescue-bridge-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const g = parseInt(btn.dataset.grams, 10);
        const name = btn.dataset.name;
        logProtein(g, name, activeSelectedMealSlot);
        showToast(`⚡ Bridge logged: +${g}g ${name}!`, '🎯');
      });
    });
  }

  // --- 11. ACTIVE CHALLENGE WIDGET ON DASHBOARD ---
  function renderActiveChallengeWidget() {
    const widget = document.getElementById('active-challenge-widget');
    if (!widget) return;

    const committedChallenge = state.challenges.find((c) => c.status === 'committed' && c.currentDays < c.targetDays);

    if (!committedChallenge) {
      widget.style.display = 'none';
      return;
    }

    widget.style.display = 'flex';
    const today = getTodayDateStr();
    const todayDone = committedChallenge.completedDates.includes(today);

    let stepsHtml = '';
    for (let i = 1; i <= committedChallenge.targetDays; i++) {
      const isDone = i <= committedChallenge.currentDays;
      const isActive = i === committedChallenge.currentDays + 1;
      stepsHtml += `
        <div class="widget-step-pill ${isDone ? 'done' : (isActive ? 'active' : '')}">
          ${isDone ? '✓' : `Day ${i}`}
        </div>
      `;
    }

    widget.innerHTML = `
      <div class="widget-top-row">
        <div class="widget-title-group">
          <span class="widget-badge">Active Commitment</span>
          <span class="widget-title">${escapeHtml(committedChallenge.title)}</span>
        </div>
        <div class="widget-progress-text">${committedChallenge.currentDays}/${committedChallenge.targetDays} Days</div>
      </div>
      <div class="widget-steps">${stepsHtml}</div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.6875rem; color:var(--text-secondary); margin-top:2px;">
        <span>${todayDone ? '✓ Today\'s target completed!' : '⏳ Today\'s log pending'}</span>
        <span style="color:var(--emerald-400); font-weight:700;">+${committedChallenge.xpReward} XP Reward</span>
      </div>
    `;

    widget.onclick = () => {
      const challengesTab = document.getElementById('challenges-tab');
      if (challengesTab) challengesTab.click();
    };
  }

  // --- 12. PROTEIN RANKS & XP ENGINE ---
  function computeTotalLifetimeXP() {
    const totalGramsLogged = state.logs.reduce((sum, l) => sum + l.grams, 0);
    return totalGramsLogged + state.bonusXp;
  }

  function getRankDetails(xp) {
    if (xp < 500) {
      return { tier: 'Iron Starter', emblem: '⚡', minXp: 0, maxXp: 500, next: 'Bronze Lifter' };
    } else if (xp < 1500) {
      return { tier: 'Bronze Lifter', emblem: '🥉', minXp: 500, maxXp: 1500, next: 'Silver Athlete' };
    } else if (xp < 3500) {
      return { tier: 'Silver Athlete', emblem: '🥈', minXp: 1500, maxXp: 3500, next: 'Gold Titan' };
    } else if (xp < 7000) {
      return { tier: 'Gold Titan', emblem: '🥇', minXp: 3500, maxXp: 7000, next: 'Mythic Beast' };
    } else {
      return { tier: 'Mythic Beast', emblem: '👑', minXp: 7000, maxXp: 15000, next: 'Max Level' };
    }
  }

  // --- 13. HABIT CHALLENGES ENGINE ---
  function evaluateChallengesOnLog(newLog) {
    const today = getTodayDateStr();
    const todayTotal = getTodayTotal();
    const logDate = new Date(newLog.timestamp);
    const hour = logDate.getHours();
    const minute = logDate.getMinutes();

    let stateChanged = false;

    // Challenge 1: 3-Day 20g Breakfast Challenge
    const c1 = state.challenges.find((c) => c.id === 'c1');
    if (c1 && c1.status === 'committed' && !c1.completedDates.includes(today)) {
      const isMorning = hour < 10 || (hour === 10 && minute <= 30);
      if (isMorning && newLog.grams >= 20) {
        c1.completedDates.push(today);
        c1.currentDays = c1.completedDates.length;
        if (c1.currentDays >= c1.targetDays) {
          c1.status = 'completed';
          triggerCelebration();
          playChime('victory');
          showToast('🏆 3-Day Breakfast Challenge COMPLETED! Claim your XP!', '⭐');
        } else {
          showToast(`☀️ Day ${c1.currentDays} of 3 completed for Breakfast Challenge!`, '🍳');
        }
        enqueueCloudMutation('user_challenges', 'UPSERT', {
          challenge_id: c1.id,
          current_days: c1.currentDays,
          completed_dates: c1.completedDates,
          status: c1.status,
          claimed: c1.claimed
        });
        stateChanged = true;
      }
    }

    // Challenge 2: 7-Day Consistent Titan
    const c2 = state.challenges.find((c) => c.id === 'c2');
    if (c2 && c2.status === 'committed' && todayTotal >= state.target && !c2.completedDates.includes(today)) {
      c2.completedDates.push(today);
      c2.currentDays = c2.completedDates.length;
      if (c2.currentDays >= c2.targetDays) {
        c2.status = 'completed';
        triggerCelebration();
        playChime('victory');
        showToast('🏆 7-Day Titan Challenge COMPLETED!', '⭐');
      }
      enqueueCloudMutation('user_challenges', 'UPSERT', {
        challenge_id: c2.id,
        current_days: c2.currentDays,
        completed_dates: c2.completedDates,
        status: c2.status,
        claimed: c2.claimed
      });
      stateChanged = true;
    }

    // Challenge 3: GLP-1 Lean Muscle Guard
    const c3 = state.challenges.find((c) => c.id === 'c3');
    if (c3 && c3.status === 'committed' && todayTotal >= state.target && !c3.completedDates.includes(today)) {
      c3.completedDates.push(today);
      c3.currentDays = c3.completedDates.length;
      if (c3.currentDays >= c3.targetDays) {
        c3.status = 'completed';
        triggerCelebration();
        playChime('victory');
        showToast('💉 GLP-1 Muscle Guard Quest COMPLETED!', '⭐');
      }
      enqueueCloudMutation('user_challenges', 'UPSERT', {
        challenge_id: c3.id,
        current_days: c3.currentDays,
        completed_dates: c3.completedDates,
        status: c3.status,
        claimed: c3.claimed
      });
      stateChanged = true;
    }

    // Challenge 4: 160g Beast Mode Day
    const c4 = state.challenges.find((c) => c.id === 'c4');
    if (c4 && c4.status === 'committed' && todayTotal >= 160 && !c4.completedDates.includes(today)) {
      c4.completedDates.push(today);
      c4.currentDays = 1;
      c4.status = 'completed';
      enqueueCloudMutation('user_challenges', 'UPSERT', {
        challenge_id: c4.id,
        current_days: c4.currentDays,
        completed_dates: c4.completedDates,
        status: c4.status,
        claimed: c4.claimed
      });
      stateChanged = true;
      showToast('🦁 160g Beast Mode Challenge unlocked & completed!', '🔥');
    }

    if (stateChanged) {
      saveLocalState();
      renderChallenges();
      renderActiveChallengeWidget();
    }
  }

  // --- 14. DOM RENDERING ---
  const ringProgress = document.getElementById('ring-progress');
  const currentGramsVal = document.getElementById('current-grams-val');
  const targetGramsVal = document.getElementById('target-grams-val');
  const pctBadge = document.getElementById('pct-badge');
  const streakCount = document.getElementById('streak-count');
  const statusHeadline = document.getElementById('status-headline');
  const statusSub = document.getElementById('status-sub');
  const statusIcon = document.getElementById('status-icon');
  const presetsGrid = document.getElementById('presets-grid');
  const logsList = document.getElementById('logs-list');
  const currentDateEl = document.getElementById('current-date');

  const RING_CIRCUMFERENCE = 565.487;
  let prevTotal = 0;

  function updateDashboard() {
    const todayLogs = getTodayLogs();
    const totalGrams = getTodayTotal();
    const target = state.target;
    const remaining = Math.max(0, target - totalGrams);
    const pct = Math.round((totalGrams / target) * 100);

    if (currentDateEl) {
      const now = new Date();
      currentDateEl.textContent = now.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }

    if (currentGramsVal) currentGramsVal.textContent = totalGrams;
    if (targetGramsVal) targetGramsVal.textContent = target;
    if (pctBadge) pctBadge.textContent = `${pct}%`;

    if (ringProgress) {
      ringProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
      const clampedPct = Math.min(100, pct);
      const offset = RING_CIRCUMFERENCE - (clampedPct / 100) * RING_CIRCUMFERENCE;
      ringProgress.style.strokeDashoffset = offset;
      ringProgress.style.stroke = pct >= 100 ? 'var(--emerald-400)' : 'var(--emerald-500)';
    }

    const currentStreak = calculateStreak();
    if (streakCount) streakCount.textContent = currentStreak;

    if (statusHeadline && statusSub && statusIcon) {
      if (totalGrams === 0) {
        statusHeadline.textContent = `Daily Target: ${target}g`;
        statusSub.textContent = `Tap a 1-tap preset or log your first meal!`;
        statusIcon.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`;
      } else if (totalGrams < target) {
        statusHeadline.textContent = `${remaining}g remaining today`;
        statusSub.textContent = `${pct}% reached — check your meal breakout & rescue tips!`;
        statusIcon.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
      } else if (totalGrams === target) {
        statusHeadline.textContent = `Target achieved! 🎯`;
        statusSub.textContent = `Perfect ${target}g reached today. Outstanding work!`;
        statusIcon.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;
      } else {
        const excess = totalGrams - target;
        statusHeadline.textContent = `Target smashed! +${excess}g`;
        statusSub.textContent = `${totalGrams}g consumed (${pct}% of target)`;
        statusIcon.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      }
    }

    if (prevTotal < target && totalGrams >= target && prevTotal > 0) {
      triggerCelebration();
      playChime('victory');
      showToast(`🎉 Daily goal of ${target}g achieved!`, '🏆');
    }
    prevTotal = totalGrams;

    renderActiveChallengeWidget();
    renderMealBreakoutCard();
    renderRescueCoach();
    renderLogsList(todayLogs);
    renderInsights();
  }

  function renderPresets() {
    if (!presetsGrid) return;
    presetsGrid.innerHTML = '';

    state.presets.forEach((preset) => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', `Quick add ${preset.grams}g ${preset.name}`);
      btn.innerHTML = `
        <div class="preset-badge">+${preset.grams}g</div>
        <div class="preset-name">${escapeHtml(preset.name)}</div>
        <div class="preset-tag">${escapeHtml(preset.tag || 'Quick Add')}</div>
      `;

      btn.addEventListener('click', () => {
        logProtein(preset.grams, preset.name, activeSelectedMealSlot);
      });

      presetsGrid.appendChild(btn);
    });
  }

  function renderLogsList(todayLogs) {
    if (!logsList) return;

    if (todayLogs.length === 0) {
      logsList.innerHTML = `
        <div class="empty-logs-msg">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--border-subtle)" stroke-width="1.5">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>No protein logged yet today.</div>
          <div style="font-size:0.75rem; color: var(--text-muted);">Quick-tap a preset above to begin.</div>
        </div>
      `;
      return;
    }

    logsList.innerHTML = '';
    const reversed = [...todayLogs].reverse();
    const slotNames = getMealSlotNames(state.blueprint.meals || 3);

    reversed.forEach((log) => {
      const item = document.createElement('div');
      item.className = 'log-item';
      const slotLabel = (typeof log.mealSlot === 'number' && slotNames[log.mealSlot])
        ? `<span style="color:var(--sky-400); font-weight:700;">[${slotNames[log.mealSlot].split(' ')[0]}]</span> `
        : '';

      item.innerHTML = `
        <div class="log-item-left">
          <div class="log-item-title">${slotLabel}${escapeHtml(log.name || 'Protein Meal')}</div>
          <div class="log-item-time">${formatTime(log.timestamp)}</div>
        </div>
        <div class="log-item-right">
          <div class="log-item-grams">+${log.grams}g</div>
          <button class="delete-log-btn" title="Delete entry" aria-label="Delete entry">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      `;

      item.querySelector('.delete-log-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteLog(log.id);
      });

      logsList.appendChild(item);
    });
  }

  // --- 15. CORE ACTION HANDLERS (OPTIMISTIC & SNAPPY) ---
  function logProtein(grams, name = '', mealSlot = null) {
    const g = parseInt(grams, 10);
    if (isNaN(g) || g <= 0) return;

    const chosenSlot = mealSlot !== null ? mealSlot : activeSelectedMealSlot;

    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      grams: g,
      name: name.trim() || 'Protein Intake',
      timestamp: new Date().toISOString(),
      dateStr: getTodayDateStr(),
      mealSlot: chosenSlot
    };

    state.logs.push(newLog);
    saveLocalState();
    playHaptic();
    playChime('pop');
    showToast(`+${g}g ${newLog.name} logged!`);
    
    enqueueCloudMutation('protein_logs', 'INSERT', {
      id: newLog.id,
      grams: newLog.grams,
      name: newLog.name,
      timestamp: newLog.timestamp,
      date_str: newLog.dateStr,
      meal_slot: newLog.mealSlot
    });

    evaluateChallengesOnLog(newLog);
    updateDashboard();
    analyzeTrackingAndNudge();
  }

  function deleteLog(id) {
    const idx = state.logs.findIndex((l) => l.id === id);
    if (idx !== -1) {
      const removed = state.logs.splice(idx, 1)[0];
      saveLocalState();
      showToast(`Removed ${removed.grams}g entry`, '🗑️');

      enqueueCloudMutation('protein_logs', 'DELETE', { id: removed.id });
      updateDashboard();
      analyzeTrackingAndNudge();
    }
  }

  // --- 16. CHALLENGES & COMMITMENT RENDERING ---
  function renderChallenges() {
    const list = document.getElementById('challenges-list');
    if (!list) return;
    list.innerHTML = '';

    state.challenges.forEach((ch) => {
      const card = document.createElement('div');
      const isCompleted = ch.currentDays >= ch.targetDays || ch.status === 'completed';
      const isCommitted = ch.status === 'committed';
      card.className = `challenge-card ${isCompleted ? 'completed' : (isCommitted ? 'committed' : '')}`;

      let stepsHtml = '';
      for (let i = 1; i <= ch.targetDays; i++) {
        const isDone = i <= ch.currentDays;
        const isActive = isCommitted && i === ch.currentDays + 1;
        stepsHtml += `
          <div class="step-dot ${isDone ? 'done' : (isActive ? 'active-step' : '')}">
            ${isDone ? '✓' : `Day ${i}`}
          </div>
        `;
      }

      let statusBadge = `<span class="quest-status-pill" style="color:var(--text-muted); border-color:var(--border-subtle); background:transparent;">Available</span>`;
      if (isCompleted) {
        statusBadge = `<span class="quest-status-pill" style="color:var(--emerald-400); border-color:var(--border-emerald); background:var(--emerald-surface);">Completed 🏆</span>`;
      } else if (isCommitted) {
        statusBadge = `<span class="quest-status-pill">Active Commitment 🔥</span>`;
      }

      let actionButtonsHtml = '';
      if (isCompleted) {
        if (ch.claimed) {
          actionButtonsHtml = `<span style="font-size:0.8125rem; color:var(--emerald-400); font-weight:800;">✓ ${ch.xpReward} XP Claimed</span>`;
        } else {
          actionButtonsHtml = `<button class="challenge-action-btn claim" data-claim="${ch.id}">🏆 Claim +${ch.xpReward} XP</button>`;
        }
      } else if (isCommitted) {
        actionButtonsHtml = `
          <span style="font-size:0.75rem; font-family:var(--font-mono); color:var(--sky-400); font-weight:700;">${ch.currentDays}/${ch.targetDays} Days Logged</span>
          <button class="challenge-action-btn" data-leave="${ch.id}" style="font-size:0.6875rem; color:var(--text-muted); padding:4px 8px;">Reset</button>
        `;
      } else {
        actionButtonsHtml = `<button class="challenge-action-btn join" data-join="${ch.id}">🚀 Commit & Join Challenge</button>`;
      }

      card.innerHTML = `
        <div class="challenge-header">
          <div>
            <div class="challenge-badge-row">
              <span class="quest-tag">${escapeHtml(ch.tag)}</span>
              ${statusBadge}
              <span class="quest-xp-tag">+${ch.xpReward} XP</span>
            </div>
            <div class="challenge-title">${escapeHtml(ch.title)}</div>
          </div>
        </div>
        <div class="challenge-desc">${escapeHtml(ch.desc)}</div>
        <div class="challenge-steps-row">${stepsHtml}</div>
        <div class="challenge-actions-footer">
          ${actionButtonsHtml}
        </div>
      `;

      const joinBtn = card.querySelector('[data-join]');
      if (joinBtn) {
        joinBtn.addEventListener('click', () => {
          ch.status = 'committed';
          saveLocalState();
          playChime('victory');
          triggerCelebration();
          showToast(`🔥 Committed to ${ch.title}!`, '🚀');
          enqueueCloudMutation('user_challenges', 'UPSERT', {
            challenge_id: ch.id,
            current_days: ch.currentDays,
            completed_dates: ch.completedDates,
            status: ch.status,
            claimed: ch.claimed
          });
          renderChallenges();
          renderActiveChallengeWidget();
        });
      }

      const claimBtn = card.querySelector('[data-claim]');
      if (claimBtn) {
        claimBtn.addEventListener('click', () => {
          ch.claimed = true;
          state.bonusXp += ch.xpReward;
          saveLocalState();
          playChime('quest');
          triggerCelebration();
          showToast(`🏆 Claimed +${ch.xpReward} XP for ${ch.title}!`, '⭐');
          enqueueCloudMutation('user_challenges', 'UPSERT', {
            challenge_id: ch.id,
            current_days: ch.currentDays,
            completed_dates: ch.completedDates,
            status: ch.status,
            claimed: ch.claimed
          });
          enqueueCloudMutation('profiles', 'UPSERT', {
            id: state.profile.userId,
            bonus_xp: state.bonusXp
          });
          renderChallenges();
          renderInsights();
          renderActiveChallengeWidget();
        });
      }

      const leaveBtn = card.querySelector('[data-leave]');
      if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
          ch.status = 'available';
          ch.currentDays = 0;
          ch.completedDates = [];
          saveLocalState();
          showToast(`Reset ${ch.title}`);
          enqueueCloudMutation('user_challenges', 'UPSERT', {
            challenge_id: ch.id,
            current_days: 0,
            completed_dates: [],
            status: 'available',
            claimed: false
          });
          renderChallenges();
          renderActiveChallengeWidget();
        });
      }

      list.appendChild(card);
    });
  }

  // --- 17. INSIGHTS & RANKS RENDERING ---
  function renderInsights() {
    const xp = computeTotalLifetimeXP();
    const rank = getRankDetails(xp);

    const rankEmblem = document.getElementById('rank-emblem');
    const rankTierTitle = document.getElementById('rank-tier-title');
    const rankSub = document.getElementById('rank-sub');
    const xpFill = document.getElementById('xp-fill');
    const xpCurrentLabel = document.getElementById('xp-current-label');
    const xpNextLabel = document.getElementById('xp-next-label');

    if (rankEmblem) rankEmblem.textContent = rank.emblem;
    if (rankTierTitle) rankTierTitle.textContent = rank.tier;
    if (rankSub) rankSub.textContent = `Total Muscle Fuel: ${xp} XP`;

    if (xpFill && xpCurrentLabel && xpNextLabel) {
      const range = rank.maxXp - rank.minXp;
      const progress = Math.min(range, Math.max(0, xp - rank.minXp));
      const pct = Math.round((progress / range) * 100);
      xpFill.style.width = `${pct}%`;
      xpCurrentLabel.textContent = `${xp} XP`;
      xpNextLabel.textContent = `${rank.maxXp} XP (${rank.next})`;
    }

    render7DayHistory();

    const nuggetCard = document.getElementById('science-nugget-card');
    if (nuggetCard) {
      const dayIndex = new Date().getDay() % SCIENCE_NUGGETS.length;
      const nugget = SCIENCE_NUGGETS[dayIndex];
      nuggetCard.innerHTML = `
        <div class="nugget-icon">💡</div>
        <div class="nugget-text">
          <h4>${escapeHtml(nugget.title)}</h4>
          <p>${escapeHtml(nugget.text)}</p>
        </div>
      `;
    }
  }

  function render7DayHistory() {
    const container = document.getElementById('trend-bars-container');
    const avgLabel = document.getElementById('weekly-avg-label');
    const hitRateLabel = document.getElementById('goal-hit-rate-label');
    if (!container) return;

    container.innerHTML = '';

    const dailyTotals = {};
    state.logs.forEach((log) => {
      dailyTotals[log.dateStr] = (dailyTotals[log.dateStr] || 0) + log.grams;
    });

    const days = [];
    let sum7Days = 0;
    let metGoalsCount = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      const grams = dailyTotals[dateStr] || 0;
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString([], { weekday: 'narrow' });

      sum7Days += grams;
      if (grams >= state.target) metGoalsCount++;
      days.push({ dateStr, dayName, grams });
    }

    if (avgLabel) avgLabel.textContent = `${Math.round(sum7Days / 7)}g / day`;
    if (hitRateLabel) hitRateLabel.textContent = `${Math.round((metGoalsCount / 7) * 100)}%`;

    const maxChartGram = Math.max(state.target * 1.25, ...days.map((d) => d.grams), 100);

    days.forEach((day) => {
      const col = document.createElement('div');
      col.className = 'bar-col';
      const heightPct = Math.min(100, Math.round((day.grams / maxChartGram) * 100));
      const metGoal = day.grams >= state.target;

      col.innerHTML = `
        <div class="bar-val-label">${day.grams}g</div>
        <div class="bar-pill-track" title="${day.dateStr}: ${day.grams}g (Goal: ${state.target}g)">
          <div class="bar-pill-fill ${metGoal ? 'met-goal' : (day.grams > 0 ? 'missed-goal' : '')}" style="height: ${heightPct}%;"></div>
        </div>
        <div class="bar-day-label">${day.dayName}</div>
      `;

      container.appendChild(col);
    });
  }

  // --- 18. INTERACTIVE SCIENTIFIC ONBOARDING & SETUP ENGINE ---
  let wizardData = {
    step: 0,
    goal: state.blueprint.goalKey || 'muscle',
    goalRatio: state.blueprint.ratio || 2.0,
    isGlp: state.blueprint.isGlp || false,
    activity: state.blueprint.activityKey || 'active',
    activityMod: 0.0,
    weight: state.blueprint.weight || 75,
    unit: state.blueprint.unit || 'kg',
    meals: state.blueprint.meals || 3
  };

  const GOAL_CONFIGS = {
    'glp': {
      title: '💉 GLP-1 Muscle Shield',
      desc: 'Protect against lean muscle mass loss and metabolic slowdown on Ozempic/Wegovy/Mounjaro.',
      baseRatio: 2.2,
      isGlp: true,
      explanation: 'On GLP-1 medications, rapid appetite suppression causes up to 40% of lost weight to come from muscle. A high protein intake of 2.2g/kg is clinically vital to safeguard lean body mass and bone density.'
    },
    'muscle': {
      title: '💪 Hypertrophy & Muscle Gain',
      desc: 'Build new skeletal muscle tissue and maximize muscle protein synthesis post-workout.',
      baseRatio: 2.0,
      isGlp: false,
      explanation: 'Consuming 2.0g/kg of protein maximizes daily Muscle Protein Synthesis (MPS) and ensures sufficient amino acids for muscle tissue growth and repair.'
    },
    'cut': {
      title: '🔥 Fat Loss & Lean Shred',
      desc: 'Burn fat aggressively while retaining hard-earned muscle and boosting thermic calorie burn.',
      baseRatio: 2.2,
      isGlp: false,
      explanation: 'In a calorie deficit, protein needs increase to 2.2g/kg to spare muscle from being catabolized for energy and keep hunger hormones low.'
    },
    'athlete': {
      title: '⚡ Strength & Athletic Performance',
      desc: 'Speed up recovery between intense training sessions and optimize explosive power.',
      baseRatio: 1.8,
      isGlp: false,
      explanation: 'Athletes engaging in regular sports and training require 1.8g/kg to repair micro-trauma in muscle fibers and replenish energy reserves.'
    },
    'health': {
      title: '🌿 Daily Tone, Health & Longevity',
      desc: 'Stay energized, reduce snacking cravings, support healthy skin, hair, and longevity.',
      baseRatio: 1.4,
      isGlp: false,
      explanation: 'A baseline of 1.4g/kg promotes optimal body composition, steady blood glucose, and supports natural collagen and metabolic health.'
    }
  };

  const ACTIVITY_MODS = {
    'heavy': 0.2,
    'active': 0.0,
    'light': -0.1,
    'sedentary': -0.2
  };

  function computeWizardTarget() {
    const goalCfg = GOAL_CONFIGS[wizardData.goal] || GOAL_CONFIGS['muscle'];
    const actMod = ACTIVITY_MODS[wizardData.activity] || 0.0;
    const finalRatio = Math.max(1.2, goalCfg.baseRatio + actMod);
    const weightInKg = wizardData.unit === 'lbs' ? wizardData.weight * 0.453592 : wizardData.weight;
    const dailyTarget = Math.round(weightInKg * finalRatio);
    const perMeal = Math.round(dailyTarget / wizardData.meals);

    return { dailyTarget, perMeal, finalRatio, goalCfg, weightInKg };
  }

  function renderWizardStep() {
    const wizardModal = document.getElementById('wizard-modal');
    const stepBadge = document.getElementById('wizard-step-badge');
    const progressTrack = document.getElementById('wizard-progress-track');
    const progressFill = document.getElementById('wizard-progress-fill');
    const step0El = document.getElementById('wizard-step-0');
    const step1El = document.getElementById('wizard-step-1');
    const step2El = document.getElementById('wizard-step-2');
    const step3El = document.getElementById('wizard-step-3');
    const step4El = document.getElementById('wizard-step-4');
    const step5El = document.getElementById('wizard-step-5');
    const footerNav = document.getElementById('wizard-footer-nav');
    const prevBtn = document.getElementById('wizard-prev-btn');
    const nextBtn = document.getElementById('wizard-next-btn');

    if (!wizardModal) return;

    if (wizardData.step === 0) {
      if (progressTrack) progressTrack.style.display = 'none';
      if (stepBadge) stepBadge.textContent = 'Welcome Onboarding';
      if (footerNav) footerNav.style.display = 'none';

      if (step0El) step0El.style.display = 'flex';
      [step1El, step2El, step3El, step4El, step5El].forEach((el) => {
        if (el) el.style.display = 'none';
      });
      return;
    }

    if (progressTrack) progressTrack.style.display = 'block';
    if (footerNav) footerNav.style.display = 'flex';

    const progressPct = (wizardData.step / 5) * 100;
    if (progressFill) progressFill.style.width = `${progressPct}%`;
    if (stepBadge) stepBadge.textContent = `Step ${wizardData.step} of 5`;

    if (step0El) step0El.style.display = 'none';
    [step1El, step2El, step3El, step4El, step5El].forEach((el, idx) => {
      if (el) el.style.display = idx + 1 === wizardData.step ? 'flex' : 'none';
    });

    if (prevBtn) prevBtn.textContent = wizardData.step === 1 ? '← Tour' : '← Back';
    if (nextBtn) nextBtn.style.display = wizardData.step === 5 ? 'none' : 'inline-flex';

    document.querySelectorAll('.wiz-goal-choice').forEach((card) => {
      if (card.dataset.goal === wizardData.goal) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    document.querySelectorAll('.wiz-activity-choice').forEach((card) => {
      if (card.dataset.activity === wizardData.activity) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    const weightReadout = document.getElementById('wiz-weight-num');
    const weightRange = document.getElementById('wiz-weight-range');
    if (weightReadout) weightReadout.textContent = `${wizardData.weight} ${wizardData.unit}`;
    if (weightRange) {
      weightRange.min = wizardData.unit === 'kg' ? '40' : '90';
      weightRange.max = wizardData.unit === 'kg' ? '160' : '350';
      weightRange.value = wizardData.weight;
    }

    document.querySelectorAll('.wiz-meal-btn').forEach((btn) => {
      if (parseInt(btn.dataset.meals, 10) === wizardData.meals) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (wizardData.step === 5) {
      const calc = computeWizardTarget();
      const targetNumEl = document.getElementById('reveal-target-grams');
      const perMealNumEl = document.getElementById('reveal-per-meal-num');
      const scienceTextEl = document.getElementById('reveal-science-text');
      const goalBadgeEl = document.getElementById('reveal-goal-badge');

      if (targetNumEl) targetNumEl.textContent = `${calc.dailyTarget}g`;
      if (perMealNumEl) perMealNumEl.textContent = `${calc.perMeal}g`;
      if (goalBadgeEl) goalBadgeEl.textContent = calc.goalCfg.title;
      if (scienceTextEl) scienceTextEl.textContent = calc.goalCfg.explanation;
    }
  }

  function initWizardEvents() {
    const startQuizBtn = document.getElementById('start-onboarding-quiz-btn');
    if (startQuizBtn) {
      startQuizBtn.addEventListener('click', () => {
        wizardData.step = 1;
        playHaptic();
        renderWizardStep();
      });
    }

    function handleGoalSelect(goalKey, isGlp) {
      wizardData.goal = goalKey;
      wizardData.isGlp = isGlp === true || isGlp === 'true';
      renderWizardStep();
      playHaptic();
      setTimeout(() => {
        wizardData.step = 2;
        renderWizardStep();
      }, 160);
    }

    const goalsContainer = document.getElementById('wiz-goals-container');
    if (goalsContainer) {
      goalsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.wiz-goal-choice');
        if (card) {
          handleGoalSelect(card.dataset.goal, card.dataset.glp);
        }
      });
    }

    function handleActivitySelect(activityKey) {
      wizardData.activity = activityKey;
      renderWizardStep();
      playHaptic();
      setTimeout(() => {
        wizardData.step = 3;
        renderWizardStep();
      }, 160);
    }

    const activityContainer = document.getElementById('wiz-activity-container');
    if (activityContainer) {
      activityContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.wiz-activity-choice');
        if (card) {
          handleActivitySelect(card.dataset.activity);
        }
      });
    }

    const unitKgBtn = document.getElementById('wiz-unit-kg');
    const unitLbsBtn = document.getElementById('wiz-unit-lbs');
    const weightRange = document.getElementById('wiz-weight-range');

    if (unitKgBtn && unitLbsBtn) {
      unitKgBtn.addEventListener('click', () => {
        if (wizardData.unit === 'lbs') {
          wizardData.unit = 'kg';
          wizardData.weight = Math.round(wizardData.weight * 0.453592);
          unitKgBtn.classList.add('active');
          unitLbsBtn.classList.remove('active');
          renderWizardStep();
        }
      });

      unitLbsBtn.addEventListener('click', () => {
        if (wizardData.unit === 'kg') {
          wizardData.unit = 'lbs';
          wizardData.weight = Math.round(wizardData.weight / 0.453592);
          unitLbsBtn.classList.add('active');
          unitKgBtn.classList.remove('active');
          renderWizardStep();
        }
      });
    }

    if (weightRange) {
      weightRange.addEventListener('input', (e) => {
        wizardData.weight = parseInt(e.target.value, 10);
        renderWizardStep();
      });
    }

    document.querySelectorAll('.wiz-stepper-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = parseInt(btn.dataset.delta, 10);
        wizardData.weight = Math.max(30, wizardData.weight + delta);
        renderWizardStep();
      });
    });

    document.querySelectorAll('.wiz-meal-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        wizardData.meals = parseInt(btn.dataset.meals, 10);
        renderWizardStep();
        playHaptic();
        setTimeout(() => {
          wizardData.step = 5;
          renderWizardStep();
        }, 160);
      });
    });

    const prevBtn = document.getElementById('wizard-prev-btn');
    const nextBtn = document.getElementById('wizard-next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (wizardData.step > 0) {
          wizardData.step--;
          renderWizardStep();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (wizardData.step < 5) {
          wizardData.step++;
          renderWizardStep();
        }
      });
    }

    const activateWizardBtn = document.getElementById('wizard-activate-btn');
    if (activateWizardBtn) {
      activateWizardBtn.addEventListener('click', () => {
        const calc = computeWizardTarget();
        state.target = calc.dailyTarget;
        state.blueprint = {
          active: true,
          weight: wizardData.weight,
          unit: wizardData.unit,
          goalKey: wizardData.goal,
          activityKey: wizardData.activity,
          ratio: calc.finalRatio,
          meals: wizardData.meals,
          isGlp: wizardData.isGlp
        };

        const c1 = state.challenges.find((c) => c.id === 'c1');
        if (c1) c1.status = 'committed';

        localStorage.setItem(STORAGE_KEYS.ONBOARDED_V5, 'true');
        saveLocalState();
        playChime('victory');
        triggerCelebration();
        closeModal(document.getElementById('wizard-modal'));
        showToast(`⚡ Scientific Blueprint Active: ${calc.dailyTarget}g Target!`, '🚀');

        enqueueCloudMutation('blueprints', 'UPSERT', {
          weight: state.blueprint.weight,
          unit: state.blueprint.unit,
          goal_key: state.blueprint.goalKey,
          activity_key: state.blueprint.activityKey,
          ratio: state.blueprint.ratio,
          meals: state.blueprint.meals,
          is_glp: state.blueprint.isGlp,
          active: true
        });

        enqueueCloudMutation('profiles', 'UPSERT', {
          id: state.profile.userId,
          target_grams: state.target
        });

        updateDashboard();
        analyzeTrackingAndNudge();
      });
    }
  }

  function checkFirstTimeOnboarding() {
    const onboarded = localStorage.getItem(STORAGE_KEYS.ONBOARDED_V5);
    const wizardModal = document.getElementById('wizard-modal');
    if (!onboarded && wizardModal) {
      wizardData.step = 0;
      setTimeout(() => {
        renderWizardStep();
        openModal(wizardModal);
      }, 300);
    }
  }

  // --- 19. PRESETS & FOOD CATALOG MANAGER ---
  function renderPresetsEditor() {
    const list = document.getElementById('presets-edit-list');
    const catalogContainer = document.getElementById('catalog-chips-container');
    const addBtn = document.getElementById('add-preset-row-btn');
    const saveBtn = document.getElementById('save-presets-btn');
    if (!list) return;

    if (catalogContainer) {
      catalogContainer.innerHTML = '';
      FOOD_CATALOG.forEach((item) => {
        const chip = document.createElement('button');
        chip.className = 'catalog-chip';
        chip.type = 'button';
        chip.innerHTML = `+ ${escapeHtml(item.name)} (${item.grams}g)`;
        chip.addEventListener('click', () => {
          addPresetRow(item.name, item.grams);
          showToast(`Added ${item.name} to presets`);
        });
        catalogContainer.appendChild(chip);
      });
    }

    list.innerHTML = '';

    function addPresetRow(name = '', grams = '') {
      const row = document.createElement('div');
      row.className = 'preset-edit-row';
      row.innerHTML = `
        <input type="text" class="preset-edit-input name" value="${escapeHtml(name)}" placeholder="Item name" />
        <input type="number" class="preset-edit-input grams" value="${grams}" placeholder="Grams" min="1" max="500" />
        <button class="delete-log-btn remove-preset-row" title="Delete preset" type="button">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      `;
      row.querySelector('.remove-preset-row').addEventListener('click', () => row.remove());
      list.appendChild(row);
    }

    state.presets.forEach((p) => addPresetRow(p.name, p.grams));

    if (addBtn && !addBtn.dataset.bound) {
      addBtn.dataset.bound = 'true';
      addBtn.addEventListener('click', () => addPresetRow('', ''));
    }

    if (saveBtn && !saveBtn.dataset.bound) {
      saveBtn.dataset.bound = 'true';
      saveBtn.addEventListener('click', () => {
        const rows = list.querySelectorAll('.preset-edit-row');
        const newPresets = [];

        rows.forEach((r, i) => {
          const name = r.querySelector('.name').value.trim();
          const grams = parseInt(r.querySelector('.grams').value, 10);
          if (name && !isNaN(grams) && grams > 0) {
            newPresets.push({
              id: 'p_' + i + '_' + Date.now(),
              name: name,
              grams: grams,
              tag: 'Quick Add'
            });
          }
        });

        if (newPresets.length > 0) {
          state.presets = newPresets;
          saveLocalState();
          renderPresets();
          closeModal(document.getElementById('presets-modal'));
          showToast('Custom Presets saved successfully!');

          newPresets.forEach((p) => {
            enqueueCloudMutation('custom_presets', 'UPSERT', {
              id: p.id,
              name: p.name,
              grams: p.grams,
              tag: p.tag
            });
          });
        } else {
          showToast('Please have at least 1 preset button', '⚠️');
        }
      });
    }
  }

  // --- 20. SUPABASE AUTH & CLOUD PROFILE MANAGER ---
  function renderAuthViews(activeTab = 'profile') {
    const tabs = {
      profile: document.getElementById('tab-auth-profile'),
      signin: document.getElementById('tab-auth-signin'),
      signup: document.getElementById('tab-auth-signup'),
      config: document.getElementById('tab-auth-config')
    };

    const views = {
      profile: document.getElementById('auth-view-profile'),
      signin: document.getElementById('auth-view-signin'),
      signup: document.getElementById('auth-view-signup'),
      config: document.getElementById('auth-view-config')
    };

    Object.keys(tabs).forEach((key) => {
      if (tabs[key]) {
        if (key === activeTab) tabs[key].classList.add('active');
        else tabs[key].classList.remove('active');
      }
      if (views[key]) {
        views[key].style.display = key === activeTab ? 'flex' : 'none';
      }
    });

    const errorMsg = document.getElementById('auth-error-msg');
    if (errorMsg) errorMsg.style.display = 'none';

    const nameInput = document.getElementById('auth-name-input');
    const avatarDisplay = document.getElementById('profile-avatar-display');
    const userEmailLabel = document.getElementById('auth-logged-user-email');
    const signOutBtn = document.getElementById('sign-out-btn');
    const userAvatarHeaderBtn = document.getElementById('user-avatar-btn');

    if (nameInput) nameInput.value = state.profile.name;
    if (avatarDisplay) avatarDisplay.textContent = state.profile.avatar;
    if (userAvatarHeaderBtn) userAvatarHeaderBtn.textContent = state.profile.avatar;

    if (userEmailLabel) {
      userEmailLabel.textContent = state.profile.isLoggedIn 
        ? `${state.profile.email}` 
        : 'Guest Mode (Offline Cache Active)';
    }

    if (signOutBtn) {
      signOutBtn.style.display = state.profile.isLoggedIn ? 'block' : 'none';
    }

    const urlInput = document.getElementById('supabase-url-input');
    const anonInput = document.getElementById('supabase-anon-input');
    const geminiKeyInput = document.getElementById('gemini-key-input');

    if (urlInput) urlInput.value = state.supabaseConfig.url || '';
    if (anonInput) anonInput.value = state.supabaseConfig.anonKey || '';
    if (geminiKeyInput) geminiKeyInput.value = state.geminiKey || '';
  }

  function showAuthError(msg) {
    const errorEl = document.getElementById('auth-error-msg');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  }

  function initProfileAndAuth() {
    const profileBtn = document.getElementById('user-avatar-btn');
    const profileModal = document.getElementById('profile-modal');

    ['profile', 'signin', 'signup', 'config'].forEach((tabKey) => {
      const btn = document.getElementById(`tab-auth-${tabKey}`);
      if (btn) {
        btn.addEventListener('click', () => renderAuthViews(tabKey));
      }
    });

    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        renderAuthViews(state.profile.isLoggedIn ? 'profile' : 'signin');
        openModal(profileModal);
      });
    }

    document.querySelectorAll('.avatar-option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.profile.avatar = btn.dataset.avatar;
        renderAuthViews('profile');
      });
    });

    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('auth-name-input');
        if (nameInput) {
          state.profile.name = nameInput.value.trim() || 'Athlete';
        }
        saveLocalState();
        enqueueCloudMutation('profiles', 'UPSERT', {
          id: state.profile.userId,
          name: state.profile.name,
          avatar: state.profile.avatar
        });
        showToast('Profile updated & saved!', '✓');
        closeModal(profileModal);
      });
    }

    const forceSyncBtn = document.getElementById('force-cloud-sync-btn');
    if (forceSyncBtn) {
      forceSyncBtn.addEventListener('click', async () => {
        if (!state.supabaseConfig.url || !state.supabaseConfig.anonKey) {
          renderAuthViews('config');
          showToast('Please enter your Supabase Project URL & Anon Key first', '⚠️');
          return;
        }
        if (!state.profile.isLoggedIn) {
          renderAuthViews('signin');
          showToast('Please sign in to sync with Supabase', '🔑');
          return;
        }
        await hydrateFromCloud();
        await flushSyncQueue();
      });
    }

    const submitSignInBtn = document.getElementById('submit-signin-btn');
    if (submitSignInBtn) {
      submitSignInBtn.addEventListener('click', async () => {
        const email = document.getElementById('signin-email-input').value.trim();
        const password = document.getElementById('signin-password-input').value;

        if (!email || !password) {
          showAuthError('Please enter both email and password.');
          return;
        }

        if (!supabaseClient) {
          renderAuthViews('config');
          showAuthError('Please configure your Supabase Project URL and Anon Key first.');
          return;
        }

        submitSignInBtn.disabled = true;
        submitSignInBtn.textContent = 'Signing in...';

        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
          if (error) throw error;
          showToast(`Welcome back, ${data.user.email}!`, '👋');
          closeModal(profileModal);
        } catch (err) {
          showAuthError(err.message || 'Failed to sign in.');
        } finally {
          submitSignInBtn.disabled = false;
          submitSignInBtn.textContent = '🔑 Sign In to Supabase';
        }
      });
    }

    const submitSignUpBtn = document.getElementById('submit-signup-btn');
    if (submitSignUpBtn) {
      submitSignUpBtn.addEventListener('click', async () => {
        const name = document.getElementById('signup-name-input').value.trim();
        const email = document.getElementById('signup-email-input').value.trim();
        const password = document.getElementById('signup-password-input').value;

        if (!email || !password) {
          showAuthError('Please enter an email and password.');
          return;
        }

        if (password.length < 6) {
          showAuthError('Password must be at least 6 characters.');
          return;
        }

        if (!supabaseClient) {
          renderAuthViews('config');
          showAuthError('Please configure your Supabase Project URL and Anon Key first.');
          return;
        }

        submitSignUpBtn.disabled = true;
        submitSignUpBtn.textContent = 'Creating account...';

        try {
          const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name || 'Athlete',
                avatar: state.profile.avatar
              }
            }
          });

          if (error) throw error;

          if (data.session && data.user) {
            state.profile.isLoggedIn = true;
            state.profile.userId = data.user.id;
            state.profile.email = data.user.email;
            state.profile.name = name || state.profile.name;
            saveLocalState();
            await migrateGuestDataToCloud();
            showToast('Account created & data synced!', '🚀');
            closeModal(profileModal);
          } else {
            showToast('Confirmation email sent! Please check your inbox.', '📧');
            renderAuthViews('signin');
          }
        } catch (err) {
          showAuthError(err.message || 'Failed to create account.');
        } finally {
          submitSignUpBtn.disabled = false;
          submitSignUpBtn.textContent = '🚀 Create Account & Sync Data';
        }
      });
    }

    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        if (supabaseClient) {
          await supabaseClient.auth.signOut();
        }
        state.profile.isLoggedIn = false;
        state.profile.userId = null;
        state.profile.email = '';
        saveLocalState();
        showToast('Signed out of Supabase');
        renderAuthViews('signin');
      });
    }

    const saveConfigBtn = document.getElementById('save-supabase-config-btn');
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', () => {
        const url = document.getElementById('supabase-url-input').value.trim();
        const anonKey = document.getElementById('supabase-anon-input').value.trim();
        const geminiKey = document.getElementById('gemini-key-input').value.trim();

        if (!url || !anonKey) {
          showAuthError('Please provide both Supabase URL and Anon Key.');
          return;
        }

        state.supabaseConfig = { url, anonKey };
        state.geminiKey = geminiKey;
        saveLocalState();
        initSupabase();
        showToast('Configuration settings saved!', '✓');
        renderAuthViews('signin');
      });
    }

    const testConnBtn = document.getElementById('test-supabase-conn-btn');
    if (testConnBtn) {
      testConnBtn.addEventListener('click', async () => {
        const url = document.getElementById('supabase-url-input').value.trim();
        const anonKey = document.getElementById('supabase-anon-input').value.trim();

        if (!url || !anonKey) {
          showAuthError('Enter both Supabase URL and Anon Key to test.');
          return;
        }

        testConnBtn.disabled = true;
        testConnBtn.textContent = 'Testing...';

        try {
          const testClient = window.supabase.createClient(url, anonKey);
          const { error } = await testClient.from('profiles').select('id').limit(1);
          
          if (error && error.code !== 'PGRST116' && error.message.indexOf('JWT') === -1) {
            showAuthError(`Connection test notice: ${error.message}`);
          } else {
            showToast('✅ Supabase project connected successfully!', '⚡');
            state.supabaseConfig = { url, anonKey };
            saveLocalState();
            initSupabase();
          }
        } catch (err) {
          showAuthError(`Failed to connect: ${err.message}`);
        } finally {
          testConnBtn.disabled = false;
          testConnBtn.textContent = 'Test Connection';
        }
      });
    }
  }

  // --- 21. NAVIGATION & TAB SWITCHING ---
  function initNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const views = {
      'track-tab': document.getElementById('track-view'),
      'challenges-tab': document.getElementById('challenges-view'),
      'insights-tab': document.getElementById('insights-view')
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        Object.values(views).forEach((v) => {
          if (v) v.classList.remove('active-view');
        });

        const targetView = views[tab.id];
        if (targetView) {
          targetView.classList.add('active-view');
        }

        if (tab.id === 'challenges-tab') {
          renderChallenges();
        } else if (tab.id === 'insights-tab') {
          renderInsights();
        }
      });
    });
  }

  // --- 22. MODALS ENGINE ---
  function openModal(modalEl) {
    if (modalEl) modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('active');
  }

  function initModals() {
    document.querySelectorAll('.modal-overlay').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    document.querySelectorAll('.close-modal-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetModal = btn.closest('.modal-overlay');
        if (targetModal) closeModal(targetModal);
      });
    });

    const openBlueprintBtn = document.getElementById('open-blueprint-btn');
    const blueprintTriggerBannerBtn = document.getElementById('blueprint-trigger-btn');
    const editBlueprintFromCard = document.getElementById('edit-blueprint-from-card');
    const wizardModal = document.getElementById('wizard-modal');

    function launchOnboardingFlow(startStep = 0) {
      wizardData.step = startStep;
      renderWizardStep();
      openModal(wizardModal);
    }

    if (openBlueprintBtn) openBlueprintBtn.addEventListener('click', () => launchOnboardingFlow(0));
    if (blueprintTriggerBannerBtn) blueprintTriggerBannerBtn.addEventListener('click', () => launchOnboardingFlow(0));
    if (editBlueprintFromCard) editBlueprintFromCard.addEventListener('click', () => launchOnboardingFlow(1));

    const openPresetsBtn = document.getElementById('open-presets-btn');
    const presetsModal = document.getElementById('presets-modal');
    if (openPresetsBtn) {
      openPresetsBtn.addEventListener('click', () => {
        renderPresetsEditor();
        openModal(presetsModal);
      });
    }

    const openMobileQrBtn = document.getElementById('open-mobile-qr-btn');
    const mobileQrModal = document.getElementById('mobile-qr-modal');
    if (openMobileQrBtn && mobileQrModal) {
      openMobileQrBtn.addEventListener('click', () => {
        openModal(mobileQrModal);
      });
    }

    const streakPill = document.getElementById('streak-pill');
    if (streakPill) {
      streakPill.addEventListener('click', () => {
        const insightsTab = document.getElementById('insights-tab');
        if (insightsTab) insightsTab.click();
      });
    }
  }

  // --- 23. UTILS ---
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- 24. INITIALIZATION ---
  function init() {
    const customForm = document.getElementById('quick-add-form');
    const proteinInput = document.getElementById('protein-amount-input');
    const mealNameInput = document.getElementById('protein-name-input');

    if (customForm) {
      customForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const grams = parseInt(proteinInput.value, 10);
        const name = mealNameInput ? mealNameInput.value : '';

        if (!isNaN(grams) && grams > 0) {
          logProtein(grams, name, activeSelectedMealSlot);
          proteinInput.value = '';
          if (mealNameInput) mealNameInput.value = '';
          proteinInput.blur();
        }
      });
    }

    document.querySelectorAll('.stepper-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const add = parseInt(btn.dataset.add, 10);
        if (!isNaN(add) && proteinInput) {
          const current = parseInt(proteinInput.value, 10) || 0;
          proteinInput.value = current + add;
          proteinInput.focus();
        } else if (btn.dataset.action === 'clear' && proteinInput) {
          proteinInput.value = '';
        }
      });
    });

    window.addEventListener('online', () => {
      showToast('🟢 Back online! Syncing data...', '☁️');
      flushSyncQueue();
    });

    initNavigation();
    initModals();
    initWizardEvents();
    renderPresets();
    updateDashboard();
    initProfileAndAuth();
    initSupabase();
    renderChallenges();
    initReflectionStudio();
    analyzeTrackingAndNudge();
    checkFirstTimeOnboarding();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
