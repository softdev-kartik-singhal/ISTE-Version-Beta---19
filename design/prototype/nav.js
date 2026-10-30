// Click-through wiring for the SmartGullak Stitch prototype.
// Matches links/buttons by their visible label (icon glyph text removed) and either runs an
// in-page action or routes to the mapped screen.
(function () {
  var PAGE = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  var ROUTES = {
    // Landing (public)
    '₹ smartgullak': 'index.html',
    'privacy': 'privacy-data.html',
    'privacy policy': 'privacy-data.html',
    'terms of service': 'support.html',
    'contact us': 'support.html',
    'log in': 'login.html',
    'log in to existing vault': 'login.html',
    'log in here': 'login.html',
    'sign up / get started': 'signup.html',
    'get started free': 'signup.html',
    'get started for free': 'signup.html',
    'start 14-day free trial': 'signup.html',
    'try the cashflow engine': 'signup.html',
    'sign up for early access →': 'signup.html',

    // Auth -> app
    'log in to smartgullak': 'dashboard.html',
    'finish setup & open vault': 'dashboard.html',
    'skip for now': 'dashboard.html',
    'log out': 'index.html',

    // App sidebar
    'dashboard': 'dashboard.html',
    'ask': 'ask.html',
    'ask ("can i afford...?")': 'ask.html',
    'trends & surplus': 'trends-surplus.html',
    'money flow': 'money-flow.html',
    'goals': 'goals.html',
    'surplus plan': 'surplus-plan.html',
    'statements': 'statements.html',
    'transactions': 'transactions.html',
    'flags 3': 'flags.html',
    'flags': 'flags.html',
    'track record': 'track-record.html',
    'privacy & data': 'privacy-data.html',
    'support & faq': 'support.html',

    // In-page shortcuts
    'simulate affordability': 'ask.html',
    'can i take a ₹45,000 goa trip in dec?': 'ask.html',
    'can i buy an ergonomic chair for ₹18,500?': 'ask.html',
    'can i afford iphone 16 pro emi (₹8,200/mo)?': 'ask.html',
    'how we calculated this': 'ask.html',
    'view all scheduled payments': 'transactions.html',
    'see trend': 'trends-surplus.html',
    'review & dispute': 'flags.html',
    'review allocation': 'surplus-plan.html',
    'view reconciled list': 'transactions.html',
    'view 9 duplicates': 'flags.html',
    'view 6 transfers': 'transactions.html',
    'ask ai →': 'ask.html',
    'view all 19 transactions in food': 'transactions.html',
    'upload missing statements in statements tab': 'statements.html',
    'see the calculation →': 'surplus-plan.html',
    'audit disclosures': 'track-record.html'
  };

  // ---------- helpers ----------

  function label(el) {
    var clone = el.cloneNode(true);
    clone.querySelectorAll('[class*="material-symbols"]').forEach(function (n) { n.remove(); });
    return clone.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function toast(msg) {
    var t = document.getElementById('sg-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'sg-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(20px);z-index:9999;' +
        'background:#0B2545;color:#fff;font:500 14px Inter,system-ui,sans-serif;padding:12px 18px;border-radius:10px;' +
        'box-shadow:0 8px 24px rgba(15,23,42,.25);opacity:0;transition:all .2s;pointer-events:none;max-width:90vw';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._h);
    t._h = setTimeout(function () {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2600);
  }

  // Small form dialog; resolves with {name: value} or null when cancelled.
  function dialog(title, fields, submit) {
    return new Promise(function (resolve) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(19,27,46,.45);display:flex;align-items:center;justify-content:center;padding:16px';
      var inputs = fields.map(function (f) {
        return '<label style="display:block;margin-top:12px;font:600 12px Inter,sans-serif;color:#434655">' + f.label +
          '<input name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + (f.value || '') + '" placeholder="' + (f.placeholder || '') + '" ' +
          'style="display:block;width:100%;box-sizing:border-box;margin-top:6px;height:40px;padding:0 12px;border:1px solid #c4c5d7;border-radius:8px;font:400 14px Inter,sans-serif"/></label>';
      }).join('');
      wrap.innerHTML = '<form style="background:#fff;border-radius:12px;padding:24px;width:100%;max-width:400px;box-shadow:0 20px 50px rgba(0,0,0,.2);font-family:Inter,sans-serif">' +
        '<div style="font:600 18px Inter,sans-serif;color:#131b2e">' + title + '</div>' + inputs +
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">' +
        '<button type="button" data-x style="height:38px;padding:0 16px;border-radius:8px;border:1px solid #c4c5d7;background:#fff;font:600 14px Inter,sans-serif;cursor:pointer">Cancel</button>' +
        '<button type="submit" style="height:38px;padding:0 16px;border-radius:8px;border:0;background:#1d4ed8;color:#fff;font:600 14px Inter,sans-serif;cursor:pointer">' + (submit || 'Save') + '</button>' +
        '</div></form>';
      document.body.appendChild(wrap);
      var form = wrap.querySelector('form');
      var first = form.querySelector('input');
      if (first) first.focus();
      function close(v) { wrap.remove(); resolve(v); }
      wrap.addEventListener('click', function (e) { if (e.target === wrap || e.target.hasAttribute('data-x')) close(null); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var out = {};
        fields.forEach(function (f) { out[f.name] = form.elements[f.name].value.trim(); });
        close(out);
      });
    });
  }

  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function tableCsv() {
    var table = $('main table');
    if (!table) return null;
    return $$('tr', table).filter(function (r) { return r.style.display !== 'none'; }).map(function (r) {
      return $$('th,td', r).map(function (c) {
        var clone = c.cloneNode(true);
        clone.querySelectorAll('[class*="material-symbols"],input').forEach(function (n) { n.remove(); });
        return '"' + clone.textContent.replace(/\s+/g, ' ').trim().replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');
  }

  function exportPage(base) {
    var csv = tableCsv();
    if (csv) {
      download(base + '.csv', csv, 'text/csv');
    } else {
      var main = $('main');
      download(base + '.txt', 'SmartGullak export — ' + document.title + '\nGenerated ' + new Date().toLocaleString() + '\n\n' +
        (main ? main.innerText : document.body.innerText));
    }
    toast('Downloaded ' + base + (csv ? '.csv' : '.txt'));
  }

  // Swap the "selected" look between buttons in the same group.
  function selectInGroup(btn) {
    var group = $$(':scope > button', btn.parentElement);
    if (group.length < 2) return;
    var counts = {};
    group.forEach(function (b) { counts[b.className] = (counts[b.className] || 0) + 1; });
    var active = group.filter(function (b) { return counts[b.className] === 1 && b !== btn; })[0];
    if (active && counts[btn.className] > 1) {
      var tmp = active.className;
      active.className = btn.className;
      btn.className = tmp;
    }
  }

  function resolveCard(btn, msg) {
    var card = btn.closest('.flag-card') || btn.closest('[class*="rounded-xl"]');
    if (card) {
      card.style.transition = 'opacity .3s, transform .3s';
      card.style.opacity = '0';
      card.style.transform = 'translateX(16px)';
      setTimeout(function () { card.style.display = 'none'; }, 300);
    }
    toast(msg);
  }

  // ---------- table filtering (transactions / statements / trends) ----------

  var filters = { type: null, cat: null, bank: null, q: '' };

  function applyFilters() {
    var rows = $$('main tbody tr');
    if (!rows.length) return 0;
    var shown = 0;
    rows.forEach(function (r) {
      var t = r.textContent.replace(/\s+/g, ' ').toLowerCase();
      var ok = true;
      if (filters.type === 'debits') ok = ok && / dr\b|-₹/.test(t);
      if (filters.type === 'credits') ok = ok && / cr\b|\+₹/.test(t);
      if (filters.cat) ok = ok && t.indexOf(filters.cat) !== -1;
      if (filters.bank) ok = ok && t.indexOf(filters.bank) !== -1;
      if (filters.q) ok = ok && t.indexOf(filters.q) !== -1;
      r.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    return shown;
  }

  function filterAndReport() {
    var n = applyFilters();
    toast(n ? 'Showing ' + n + ' matching row' + (n === 1 ? '' : 's') : 'No rows match these filters');
  }

  // ---------- transactions modal + undo toast ----------

  function bulkModal() {
    return $$('div.fixed.inset-0').filter(function (d) { return d.id !== 'goalModal'; })[0];
  }
  function undoBar() {
    return $$('div.fixed').filter(function (d) { return /bottom-6/.test(d.className); })[0];
  }
  function show(el, on) { if (el) el.style.display = on ? '' : 'none'; }

  function addManualTx() {
    dialog('Add manual transaction', [
      { name: 'merchant', label: 'Merchant / description', placeholder: 'e.g. Local kirana store' },
      { name: 'amount', label: 'Amount (₹)', type: 'number', placeholder: '450' },
      { name: 'date', label: 'Date', type: 'date', value: new Date().toISOString().slice(0, 10) }
    ], 'Add transaction').then(function (v) {
      if (!v || !v.merchant || !v.amount) return;
      var first = $('main tbody tr');
      if (!first) return;
      var row = first.cloneNode(true);
      var amt = Number(v.amount).toLocaleString('en-IN');
      var d = new Date(v.date || Date.now());
      var dateCell = row.querySelector('td:nth-child(2) div');
      if (dateCell) dateCell.textContent = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      var name = row.querySelector('td:nth-child(3) span');
      if (name) name.textContent = v.merchant;
      var amtCell = row.querySelector('td.text-right');
      if (amtCell) amtCell.innerHTML = '-₹' + amt + '<span class="text-secondary font-normal">.00 DR</span>';
      row.className = row.className.replace('bg-surface-container-high', '');
      row.style.background = '#ecfdf5';
      first.parentElement.insertBefore(row, first);
      toast('Added cash transaction: ' + v.merchant + ' (₹' + amt + ')');
    });
  }

  // v1 dropdown-style filter buttons cycle through options.
  var CYCLES = {
    'type:': ['Debits & Credits', 'Debits', 'Credits'],
    'account:': ['All accounts (3)', 'HDFC', 'ICICI', 'Kotak'],
    'category:': ['All Categories', 'Food & Dining', 'Shopping', 'Subscriptions']
  };
  function cycleFilter(btn, key) {
    var span = $$('span', btn).filter(function (s) { return !/material/.test(s.className) && s.textContent.trim(); }).pop() || btn;
    var opts = CYCLES[key];
    var cur = label(btn).replace(key, '').trim();
    var idx = opts.map(function (o) { return o.toLowerCase(); }).indexOf(cur);
    var next = opts[(idx + 1) % opts.length];
    var txt = span.textContent;
    span.textContent = txt.indexOf(':') !== -1 ? txt.split(':')[0] + ': ' + next : next;
    var v = next.toLowerCase();
    if (key === 'type:') filters.type = v === 'debits' ? 'debits' : v === 'credits' ? 'credits' : null;
    if (key === 'account:') filters.bank = /all/.test(v) ? null : v;
    if (key === 'category:') filters.cat = /all/.test(v) ? null : v;
    filterAndReport();
  }

  // ---------- actions (checked before routes) ----------

  var FLAG_ACTIONS = {
    'dispute / report double debit': 'Dispute drafted and sent to your bank',
    'not a duplicate (2 separate orders)': 'Marked as two separate orders',
    'change category': 'Category updated',
    'looks fine (planned purchase)': 'Marked as planned purchase',
    'reclassify as one-time capital': 'Reclassified as one-time capital expense',
    'split to 3-month emi amortize': 'Split into a 3-month EMI schedule',
    'keep shopping average unchanged': 'Shopping average left unchanged',
    'looks fine & add to subscriptions': 'Added to Subscriptions',
    'tag: freelance tax deductible': 'Tagged as freelance tax deductible',
    'do not predict future debits': 'Excluded from future predictions'
  };

  function action(el, text) {
    var inTable = !!el.closest('tbody');
    var inModal = !!el.closest('div.fixed.inset-0');

    if (FLAG_ACTIONS[text]) return function () { resolveCard(el, FLAG_ACTIONS[text]); };

    // Landing in-page sections
    if (PAGE === 'index.html') {
      var scrollTo = function (needle) {
        return function () {
          var h = $$('h2').filter(function (x) { return x.textContent.indexOf(needle) !== -1; })[0];
          var s = h && (h.closest('section') || h);
          if (s) s.scrollIntoView({ behavior: 'smooth' });
        };
      };
      if (text === 'features') return scrollTo('Designed for complex earners');
      if (text === 'how it works') return scrollTo('Why traditional budget apps fail');
      if (text === 'security' || text === 'security disclosures') return scrollTo('NFC Card');
    }

    if (/^export/.test(text)) {
      if (text === 'export merkle proof') return function () {
        var payload = tableCsv() || document.body.innerText;
        crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload)).then(function (buf) {
          var hex = Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
          download('smartgullak-merkle-proof.json', JSON.stringify({ root: hex, algorithm: 'SHA-256', generatedAt: new Date().toISOString(), records: $$('main tbody tr').length }, null, 2), 'application/json');
          toast('Merkle proof exported (root ' + hex.slice(0, 10) + '…)');
        });
      };
      if (PAGE === 'privacy-data.html') return null; // handled by the page's own modal
      return function () { exportPage('smartgullak-' + PAGE.replace('.html', '')); };
    }

    // Transactions
    var onTx = PAGE.indexOf('transactions') === 0;
    if (onTx && (text === 'bulk categorize' || (inTable && el.tagName === 'BUTTON' && text))) return function () { show(bulkModal(), true); };
    if (onTx && text === 'cancel' && inModal) return function () { show(bulkModal(), false); };
    if (onTx && text === 'update this one only') return function () { show(bulkModal(), false); toast('Category updated for this transaction'); };
    if (onTx && /^apply to \d+ transactions$/.test(text)) return function () { show(bulkModal(), false); show(undoBar(), true); setTimeout(function () { show(undoBar(), false); }, 6000); };
    if (onTx && text === 'undo') return function () { show(undoBar(), false); toast('Bulk categorization reverted'); };
    if (onTx && /^add manual/.test(text)) return addManualTx;
    if (onTx && !inModal) {
      if (text === 'all' || text === 'debits' || text === 'credits') return function () {
        selectInGroup(el); filters.type = text === 'all' ? null : text; filterAndReport();
      };
      if (text === 'reset all') return function () {
        filters = { type: null, cat: null, bank: null, q: '' }; applyFilters(); toast('Filters cleared');
      };
      if (['food & dining', 'freelance income', 'shopping', 'investment & wealth', 'automobile & fuel', 'subscriptions'].indexOf(text) !== -1) return function () {
        filters.cat = filters.cat === text ? null : text;
        el.style.outline = filters.cat ? '2px solid #1d4ed8' : '';
        $$('button', el.parentElement).forEach(function (b) { if (b !== el) b.style.outline = ''; });
        filterAndReport();
      };
      for (var k in CYCLES) if (text.indexOf(k) === 0) return (function (key) { return function () { cycleFilter(el, key); }; })(k);
      if (/^\w{3} \d{2}, \d{4}/.test(text)) return function () { toast('Showing 01 Oct – 21 Oct 2024 (custom ranges coming soon)'); };
    }
    if (inModal && onTx && el.parentElement && $$(':scope > button', el.parentElement).length > 1) {
      return function () { selectInGroup(el); };
    }

    // Statements
    if (PAGE === 'statements.html') {
      if (['all banks', 'hdfc bank', 'icici bank', 'kotak'].indexOf(text) !== -1) return function () {
        selectInGroup(el); filters.bank = text === 'all banks' ? null : text.split(' ')[0]; filterAndReport();
      };
      if (text === 'upload missing statement' || text === 're-upload') return function () {
        var f = $('#file-upload-input'); if (f) f.click();
      };
      if (text === 'previous' || text === 'next') return function () { toast(text === 'next' ? 'You are on the last page' : 'You are on the first page'); };
      if (text === 'read 2-min export tutorial') return function () { var g = $('#bank-guides'); if (g) g.scrollIntoView({ behavior: 'smooth' }); };
    }

    // Money flow
    if (PAGE === 'money-flow.html' && ['prev month', '3-mo average', 'top 5', 'top 10'].indexOf(text) !== -1) return function () {
      selectInGroup(el); toast('Comparing against ' + el.textContent.trim());
    };

    // Dashboard
    if (PAGE === 'dashboard.html') {
      if (text === 'dismiss') return function () { resolveCard(el, 'Alert dismissed'); };
      if (text === 'send reminder note') return function () { toast('Reminder note sent'); };
      if (text === 'update expected date') return function () {
        dialog('Update expected date', [{ name: 'date', label: 'Expected credit date', type: 'date' }], 'Update').then(function (v) {
          if (v && v.date) toast('Expected date updated to ' + new Date(v.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
        });
      };
    }

    // Flags
    if (PAGE === 'flags.html') {
      if (text === 'dismiss') return function () { resolveCard(el, 'Flag dismissed'); };
      if (text === 'view full resolution history') return function () { toast('18 flags resolved this month — all reconciled'); };
    }

    // Goals
    if (PAGE === 'goals.html') {
      var openGoal = function () { var m = $('#goalModal'); if (m) { m.classList.remove('hidden'); m.classList.add('flex'); } };
      var closeGoal = function () { var m = $('#goalModal'); if (m) { m.classList.add('hidden'); m.classList.remove('flex'); } };
      if (text === 'edit goal' || text === 'adjust timeline') return openGoal;
      if (text === 'create goal & lock schedule') return function () { closeGoal(); toast('Goal created and monthly schedule locked'); };
      if (text === 'adjust to realistic date') return function () { toast('Target date moved to the realistic estimate'); };
    }

    // Surplus plan
    if (PAGE === 'surplus-plan.html') {
      if (text === 'commit to next month') return function () {
        el.disabled = true; el.style.opacity = '.7';
        var s = $$('span', el).filter(function (x) { return !/material/.test(x.className); })[0];
        (s || el).textContent = 'Committed ✓';
        toast('Allocation committed for next month');
      };
      if (text === 'methodology') return function () { var b = $('#calc-toggle-btn'); if (b) { b.click(); b.scrollIntoView({ behavior: 'smooth' }); } };
    }

    // Track record
    if (text === 'load earlier records') return function () { toast('No earlier records — this is the start of your ledger'); };

    // Sign up
    if (text === 'continue to card registration') return function () { if (window.switchStep) window.switchStep(2); };

    // Auth helpers
    if (text === 'forgot password?') return function () {
      dialog('Reset your password', [{ name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' }], 'Send reset link').then(function (v) {
        if (v && v.email) toast('Reset link sent to ' + v.email);
      });
    };
    if (text === 'lost your card? verify by email instead') return function () { toast('Verification link sent to your registered email'); };

    return null;
  }

  // ---------- page setup ----------

  // Shared sidebar: older screens only had 7 entries, so every app page gets the full list.
  var NAV = [
    ['INSIGHTS', [
      ['dashboard', 'dashboard', 'Dashboard', 'dashboard.html'],
      ['ask', 'auto_awesome', 'Ask', 'ask.html'],
      ['trends', 'trending_up', 'Trends &amp; Surplus', 'trends-surplus.html'],
      ['money-flow', 'swap_horiz', 'Money Flow', 'money-flow.html'],
      ['goals', 'flag', 'Goals', 'goals.html'],
      ['surplus-plan', 'savings', 'Surplus Plan', 'surplus-plan.html']
    ]],
    ['DATA', [
      ['statements', 'receipt_long', 'Statements', 'statements.html'],
      ['transactions', 'account_balance_wallet', 'Transactions', 'transactions.html'],
      ['flags', 'notification_important', 'Flags', 'flags.html'],
      ['track-record', 'insights', 'Track Record', 'track-record.html'],
      ['privacy', 'security', 'Privacy &amp; Data', 'privacy-data.html']
    ]]
  ];

  function buildSidebar() {
    var nav = $('aside nav');
    if (!nav) return;
    var current = PAGE === 'transactions-v1.html' ? 'transactions.html' : PAGE;
    var IDLE = 'flex items-center justify-between px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all';
    var ACTIVE = 'flex items-center justify-between px-3 py-2 rounded-lg transition-all bg-primary-container text-white font-semibold';
    nav.className = 'p-space-md space-y-3 overflow-y-auto';
    nav.innerHTML = NAV.map(function (sec, i) {
      return '<div' + (i ? ' class="pt-1"' : '') + '><span class="px-3 font-label-sm text-[11px] font-semibold text-white/50 tracking-wider uppercase">' + sec[0] + '</span><div class="mt-1.5 space-y-0.5">' +
        sec[1].map(function (it) {
          var badge = it[0] === 'flags' ? '<span class="px-2 py-0.5 rounded-full bg-tertiary-container text-white font-label-sm text-[11px]">3</span>' : '';
          return '<a class="' + (it[3] === current ? ACTIVE : IDLE) + '"' + (it[3] === current ? ' aria-current="page"' : '') + ' data-path="' + it[0] + '" href="' + it[3] + '">' +
            '<div class="flex items-center gap-2.5"><span class="material-symbols-outlined text-[18px]">' + it[1] + '</span><span class="font-body-md text-body-md">' + it[2] + '</span></div>' + badge + '</a>';
        }).join('') + '</div></div>';
    }).join('');

    var support = $('aside a[data-path="support"]');
    if (support) {
      if (PAGE === 'support.html') support.className += ' !text-white font-semibold';
      if (!$('[data-sg-logout]')) {
        var out = support.cloneNode(true);
        out.setAttribute('data-sg-logout', '');
        out.removeAttribute('data-path');
        out.innerHTML = '<span class="material-symbols-outlined text-[18px]">logout</span><span>Log out</span>';
        support.parentElement.appendChild(out);
      }
    }
    var logo = $('aside img[alt="SmartGullak Logo"]');
    if (logo) {
      logo.parentElement.style.cursor = 'pointer';
      logo.parentElement.addEventListener('click', function () { location.href = 'dashboard.html'; });
    }
  }

  function wireHeader() {
    var header = $('header');
    if (!header || !$('aside')) return;
    var bell = $$('button', header).filter(function (b) { return /notifications/.test(b.textContent); })[0];
    if (bell) bell.addEventListener('click', function () { location.href = 'flags.html'; });
    var profile = $('img[alt="Profile"]', header);
    if (profile) {
      profile.parentElement.style.cursor = 'pointer';
      profile.parentElement.addEventListener('click', function () { location.href = 'privacy-data.html'; });
    }
    var search = $('input[type="text"]', header);
    if (search) {
      var q = new URLSearchParams(location.search).get('q');
      if (q) { search.value = q; filters.q = q.toLowerCase(); applyFilters(); }
      search.addEventListener('input', function () { filters.q = search.value.trim().toLowerCase(); applyFilters(); });
      search.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        if (!$('main tbody tr')) location.href = 'transactions.html?q=' + encodeURIComponent(search.value.trim());
        else filterAndReport();
      });
      document.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); search.focus(); }
      });
    }
  }

  // Switch between the two Transactions designs.
  function layoutSwitch() {
    if (PAGE.indexOf('transactions') !== 0) return;
    var right = $('header > div:last-child');
    if (!right) return;
    var isV1 = PAGE === 'transactions-v1.html';
    var box = document.createElement('div');
    box.className = 'flex items-center rounded-lg border border-[#E3E8EF] bg-surface p-0.5 font-label-md text-label-md';
    function opt(txt, href, on) {
      return '<a href="' + href + '" class="px-3 py-1 rounded-md ' + (on ? 'bg-primary-container text-white' : 'text-secondary hover:text-on-surface') + '">' + txt + '</a>';
    }
    box.innerHTML = opt('New layout', 'transactions.html', !isV1) + opt('Classic', 'transactions-v1.html', isV1);
    right.insertBefore(box, right.firstChild);
  }

  // Modals that Stitch left open for the static screenshot start closed.
  function closeDemoOverlays() {
    var g = $('#goalModal');
    if (g) { g.classList.add('hidden'); g.classList.remove('flex'); }
    if (PAGE.indexOf('transactions') === 0) { show(bulkModal(), false); show(undoBar(), false); }
  }

  function wireFileInput() {
    var f = $('#file-upload-input');
    if (f) f.addEventListener('change', function () {
      if (f.files.length) toast(f.files.length + ' statement file' + (f.files.length === 1 ? '' : 's') + ' queued for parsing');
    });
  }

  buildSidebar();
  wireHeader();
  layoutSwitch();
  closeDemoOverlays();
  wireFileInput();

  // Give mapped anchors a real href so hover/status bar and middle-click behave.
  $$('a').forEach(function (a) {
    var r = ROUTES[label(a)];
    if (r && !action(a, label(a))) a.setAttribute('href', r);
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('a, button');
    if (!el) return;
    var text = label(el);
    var fn = action(el, text);
    var r = ROUTES[text];
    if (!fn && !r) return;
    e.preventDefault();
    e.stopPropagation();
    if (fn) fn();
    else location.href = r;
  }, true);
})();
