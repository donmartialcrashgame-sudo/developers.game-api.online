(function () {
  "use strict";

  var GROUPS = [
    { id:"main", label:"MAIN", icon:"◈", items:[
      ["Dashboard","dashboard.html","⌂","dashboard"],
      ["Overview","overview.html","◌","overview"],
      ["API Usage","usage.html","▥","usage"],
      ["Analytics","analytics.html","◒","analytics"]
    ]},
    { id:"api", label:"API", icon:"⌁", items:[
      ["API Keys","api-keys.html","⌘","keys"],
      ["Documentation","private-documentation.html","▤","private-documentation"],
      ["How to Use Game API","private-how-to-use-gameapi.html","?","private-how-to-use-gameapi"],
      ["Endpoints","private-endpoints.html","↗","private-endpoints"],
      ["Public Endpoints","endpoints.html","↗","endpoints"],
      ["WebSocket","websocket.html","⌁","websocket"],
      ["Logs","logs.html","☷","logs"],
      ["API Status","status.html","●","status"]
    ]},
    { id:"games", label:"GAMES", icon:"◉", items:[
      ["Crash Game","crash.html","◉","crash"],
      ["Live Rounds","live.html","◌","live"],
      ["Round History","round-history.html","◴","round-history"],
      ["Game Settings","game-settings.html","⚙","game-settings"]
    ]},
    { id:"setup", label:"SETUP", icon:"◇", items:[
      ["Security","security.html","◇","security"],
      ["Authentication","authentication.html","◈","authentication"],
      ["API Configuration","configuration.html","⚙","configuration"],
      ["Webhooks","webhooks.html","↗","webhooks"],
      ["Notifications","notifications.html","♢","notifications"],
      ["Developer Settings","developer-settings.html","☷","developer-settings"]
    ]},
    { id:"account", label:"ACCOUNT", icon:"○", items:[
      ["My Profile","profile.html","○","profile"],
      ["Subscription","subscription.html","▣","subscription"],
      ["Billing","billing.html","◫","billing"],
      ["Usage Limits","limits.html","▥","limits"]
    ]},
    { id:"system", label:"SYSTEM", icon:"●", items:[
      ["System Status","system-status.html","●","system-status"],
      ["Support","support.html","?","support"],
      ["Help Center","help.html","?","help"]
    ]}
  ];

  var META = {
    dashboard:["Dashboard","Your real-time developer command center"],
    overview:["Overview","A live snapshot of your Game API workspace"],
    usage:["API Usage","Requests, traffic and consumption"],
    analytics:["Analytics","Performance and integration insights"],
    keys:["API Keys","Secure credentials for your applications"],
    documentation:["Documentation","Build and integrate with Game API"],
    "private-documentation":["Private Documentation","Authenticated integration reference for your developer workspace"],
    "how-to-use-gameapi":["How to Use Game API","Public step-by-step guide to connect and make your first request"],
    "private-how-to-use-gameapi":["Private How to Use Game API","Authenticated step-by-step integration guide for your developer workspace"],
      "private-endpoints":["Private Endpoints","Authenticated endpoint reference for your developer workspace"],
    endpoints:["Endpoints","Explore available API resources"],
    websocket:["WebSocket","Real-time connection and event tools"],
    logs:["Logs","Inspect every API request and its response"],
    status:["API Status","Live platform health and availability"],
    crash:["Crash Game","Live crash-game developer tools"],
    live:["Live Rounds","Real-time round monitor"],
    "round-history":["Round History","Explore completed game rounds"],
    "game-settings":["Game Settings","Game configuration and preferences"],
    security:["Security","Protect credentials and account access"],
    authentication:["Authentication","Authentication and access controls"],
    configuration:["API Configuration","Configure your integration"],
    webhooks:["Webhooks","Event delivery and callbacks"],
    notifications:["Notifications","Alerts and platform messages"],
    "developer-settings":["Developer Settings","Developer workspace preferences"],
    profile:["My Profile","Manage your developer identity"],
    subscription:["Subscription","Plan and access"],
    billing:["Billing","Payments and invoices"],
    limits:["Usage Limits","Quota and request controls"],
    "system-status":["System Status","Platform health and services"],
    support:["Support","Get help from Game API"],
    help:["Help Center","Guides and answers"],
    login:["Sign in","Temporary developer console entry screen"]
  };

  function esc(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g,function(x){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[x];
    });
  }

  function pageKey(){
    var p = location.pathname.split("/").pop().replace(/\.html$/,"");
    if(!p || p==="index") return "login";
    if(p==="api-keys") return "keys";
    return p;
  }

  var SUPABASE_URL="https://qbagxeqquskkjksoraiz.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY="sb_publishable_chfRxHSFPSA1SZJtBajtKA_I7vs8R--";
  var supabaseClientPromise=null;

  function connectSupabase(){
    if(supabaseClientPromise) return supabaseClientPromise;
    supabaseClientPromise=import("https://esm.sh/@supabase/supabase-js@2.105.0")
      .then(function(mod){
        var client=mod.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
          auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,experimental:{passkey:true}}
        });
        window.gameApiSupabase=client;
        document.documentElement.setAttribute("data-supabase","connected");
        var live=document.querySelector(".page-live");
        if(live) live.innerHTML="<i></i> Supabase connected";
        return client;
      })
      .catch(function(err){
        document.documentElement.setAttribute("data-supabase","error");
        console.warn("Game API Supabase connection failed:",err);
        return null;
      });
    return supabaseClientPromise;
  }

  function getUser(){
    try {
      var raw=localStorage.getItem("gameapi_user");
      if(raw) return JSON.parse(raw) || {};
      var supa=localStorage.getItem("supabase.auth.token");
      if(supa){
        var token=JSON.parse(supa);
        var meta=(token.user&&token.user.user_metadata)||{};
        return {name:meta.full_name||meta.name||meta.username,email:(token.user&&token.user.email)||""};
      }
    } catch(e){}
    return {};
  }

  function initLogs(){
    var body=document.getElementById("logs-body"), search=document.getElementById("logs-search");
    var detail=document.getElementById("log-detail-backdrop"), detailContent=document.getElementById("log-detail-content"), detailTitle=document.getElementById("log-detail-title"), refresh=document.getElementById("logs-refresh");
    var logs=[],busy=false,timer=null;

    function formatTime(v){
      var d=new Date(v);
      return isNaN(d.getTime())?String(v):d.toLocaleString();
    }
    function normalize(row){
      var prefix=row.key_prefix||"gapi";
      return {
        id:String(row.api_key_id),
        time:row.usage_updated_at||row.last_used_at||row.period_start,
        keyName:row.api_key_name||"Unnamed API key",
        key:prefix+(row.key_last4?" · ••••"+row.key_last4:""),
        keyId:row.api_key_id||"—",
        status:String(row.api_key_status||"unknown"),
        plan:String(row.plan||"free"),
        requests:Number(row.request_count||0),
        lastUsed:row.last_used_at,
        createdAt:row.api_key_created_at,
        expiresAt:row.expires_at,
        period:row.period_start
      };
    }
    function render(){
      var q=(search.value||"").toLowerCase();
      var filtered=logs.filter(function(x){
        return !q||(x.keyName+" "+x.key+" "+x.keyId+" "+x.plan+" "+x.status).toLowerCase().indexOf(q)>-1;
      });
      if(!filtered.length){
        body.innerHTML='<tr><td colspan="7"><div class="logs-empty"><b>No API-key activity found</b><span>Supabase has no recorded usage for the API keys available to this account yet.</span></div></td></tr>';
        return;
      }
      body.innerHTML=filtered.map(function(x){
        var active=x.status==="active";
        return '<tr class="log-row" data-id="'+esc(x.id)+'">'+
          '<td class="log-time">'+esc(formatTime(x.time))+'</td>'+
          '<td><b>'+esc(x.keyName)+'</b></td>'+
          '<td><code>'+esc(x.key)+'</code></td>'+
          '<td><span class="log-status '+(active?"ok":"error")+'">'+esc(x.status)+'</span></td>'+
          '<td><b>'+esc(String(x.requests))+'</b> requests</td>'+
          '<td>'+esc(x.plan.charAt(0).toUpperCase()+x.plan.slice(1))+'</td>'+
          '<td><span class="row-arrow">›</span></td>'+
        '</tr>';
      }).join("");
      body.querySelectorAll(".log-row").forEach(function(row){
        row.onclick=function(){
          var x=logs.find(function(a){return a.id===row.dataset.id});
          if(!x)return;
          detailTitle.textContent=x.keyName+" · API key activity";
          detailContent.innerHTML=
            '<div class="detail-grid">'+
              '<div><span>API KEY</span><b>'+esc(x.keyName)+'</b></div>'+
              '<div><span>KEY</span><b>'+esc(x.key)+'</b></div>'+
              '<div><span>STATUS</span><b>'+esc(x.status)+'</b></div>'+
              '<div><span>PLAN</span><b>'+esc(x.plan)+'</b></div>'+
              '<div><span>REQUESTS THIS PERIOD</span><b>'+esc(String(x.requests))+'</b></div>'+
              '<div><span>KEY ID</span><b>'+esc(x.keyId)+'</b></div>'+
            '</div>'+
            '<div class="detail-section"><span>LAST USED</span><pre>'+esc(x.lastUsed?formatTime(x.lastUsed):"No recorded API use yet")+'</pre></div>'+
            '<div class="detail-section"><span>USAGE PERIOD</span><pre>'+esc(x.period||"—")+'</pre></div>'+
            '<div class="detail-section"><span>KEY CREATED</span><pre>'+esc(x.createdAt?formatTime(x.createdAt):"—")+'</pre></div>'+
            '<div class="detail-section"><span>KEY EXPIRY</span><pre>'+esc(x.expiresAt?formatTime(x.expiresAt):"No expiry recorded")+'</pre></div>';
          detail.classList.add("open");
        };
      });
    }
    async function load(){
      if(busy)return;
      busy=true;
      try{
        var sb=await connectSupabase();
        if(!sb)throw new Error("Supabase client unavailable");
        var sessionResult=await sb.auth.getSession();
        var session=sessionResult.data&&sessionResult.data.session;
        if(!session)throw new Error("Not authenticated");
        var result=await sb.from("developer_api_activity")
          .select("api_key_id,customer_id,api_key_name,key_prefix,key_last4,api_key_status,plan,last_used_at,api_key_created_at,expires_at,period_start,request_count,usage_updated_at")
          .order("usage_updated_at",{ascending:false,nullsFirst:false})
          .order("last_used_at",{ascending:false,nullsFirst:false});
        if(result.error)throw result.error;
        logs=(result.data||[]).map(normalize);
        render();
      }catch(e){
        console.error("Supabase API activity logs failed:",e);
        if(!logs.length)body.innerHTML='<tr><td colspan="7"><div class="logs-empty error"><b>Could not load Supabase API activity</b><span>Check that you are signed in and your API usage records are available.</span></div></td></tr>';
      }finally{busy=false;}
    }
    search.oninput=render;
    refresh.onclick=load;
    document.getElementById("log-detail-close").onclick=function(){detail.classList.remove("open");};
    detail.onclick=function(e){if(e.target===detail)detail.classList.remove("open");};
    load();
    timer=setInterval(load,5000);
    window.addEventListener("beforeunload",function(){if(timer)clearInterval(timer);});
  }

  function logsContent(){
    return '<div class="logs-page">'
      + '<section class="glass-card logs-toolbar"><div class="logs-toolbar-main"><div><span class="card-kicker">SUPABASE · API ACTIVITY</span><h3>API usage logs</h3><p>Live API-key usage records loaded directly from your authenticated Supabase account.</p></div><button class="primary-btn" id="logs-refresh">Refresh activity <b>↻</b></button></div><div class="logs-filters"><input id="logs-search" placeholder="Search API key, prefix, plan or status…"></div></section>'
      + '<section class="glass-card logs-table-card"><div class="logs-table-wrap"><table class="logs-table"><thead><tr><th>UPDATED</th><th>API KEY</th><th>KEY</th><th>STATUS</th><th>REQUESTS</th><th>PLAN</th><th></th></tr></thead><tbody id="logs-body"><tr><td colspan="7"><div class="logs-empty"><b>Loading Supabase activity…</b><span>Reading your authenticated API usage records.</span></div></td></tr></tbody></table></div></section>'
      + '<div class="log-detail-backdrop" id="log-detail-backdrop"><section class="log-detail-panel"><div class="log-detail-head"><div><span class="card-kicker">API KEY DETAILS</span><h3 id="log-detail-title">API key activity</h3></div><button id="log-detail-close">×</button></div><div id="log-detail-content"></div></section></div>'
      + '</div>';
  }

  function howToUseContent(){
    return '<div class="guide-page">'+
      '<section class="guide-hero glass-card"><div><span class="eyebrow">GAME API · PUBLIC GUIDE</span><h2>How to use Game API</h2><p>Learn the basic integration flow, from creating an API key to making requests and connecting to real-time services.</p></div><a class="primary-btn" href="documentation.html">Read documentation <b>→</b></a></section>'+
      '<section class="glass-card guide-visual"><img src="assets/game-api-how-to-use.svg" alt="Game API integration flow illustration"></section>'+
      '<section class="guide-grid">'+
        guideStep("01","Create your account","Register for a Game API developer account and complete the available verification steps.","register.html","Create account")+
        guideStep("02","Create an API key","Open the developer console, create a key and give it a clear application or environment name.","login.html","Open console")+
        guideStep("03","Store the key securely","Keep production secrets on your backend or secret manager. Never put them in public browser code.","documentation.html","Security guide")+
        guideStep("04","Choose an endpoint","Read the public API documentation for the method, URL, parameters and response format you need.","documentation.html","Open documentation")+
        guideStep("05","Send your request","Call the endpoint from a trusted server with the authentication format required by that service.","documentation.html","View request docs")+
        guideStep("06","Use real-time events","Connect to the production WebSocket endpoint when your application needs live game updates.","documentation.html#websocket","WebSocket docs")+
      '</section>'+
      '<section class="glass-card guide-checklist"><div class="card-head"><div><span class="card-kicker">PUBLIC CHECKLIST</span><h3>Ready for the next step?</h3><p>Once you understand the basics, sign in for the private developer workflow.</p></div></div><div class="check-grid"><div><b>✓</b><span>Developer account created</span></div><div><b>✓</b><span>API key created securely</span></div><div><b>✓</b><span>Endpoint selected</span></div><div><b>✓</b><span>Request and error handling planned</span></div><div><b>✓</b><span>WebSocket used only when needed</span></div><div><b>✓</b><span>Production secrets protected</span></div></div></section>'+
      '<section class="glass-card guide-private-link"><span class="card-kicker">PRIVATE DEVELOPER GUIDE</span><h3>Need the detailed workspace instructions?</h3><p>The private guide includes the complete integration workflow, API-key handling, request patterns, crash-game integration, WebSocket flow, troubleshooting and production checklist.</p><a class="primary-btn" href="private-how-to-use-gameapi.html">Open private guide <b>→</b></a></section>'+
      '</div>';
  }
  function privateHowToUseContent(){
    return `<style>
      .private-guide{display:grid;gap:18px}
      .private-guide .guide-hero{padding:30px}
      .private-guide h2{margin:6px 0 10px;font-size:30px;letter-spacing:-.04em}
      .private-guide p,.private-guide li{font-size:11px;line-height:1.8;color:#64748b}
      .private-guide .guide-art{margin:18px 0;border:1px solid #203858;border-radius:16px;overflow:hidden;background:#071126}
      .private-guide .guide-art img{display:block;width:100%;height:auto}
      .private-guide .steps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .private-guide .step{padding:22px}
      .private-guide .step h3{margin:7px 0 8px;color:#172033;font-size:16px}
      .private-guide pre{margin:12px 0;padding:15px;border-radius:12px;background:#071126;color:#dbeafe;overflow:auto;font-size:10px;line-height:1.7}
      .private-guide .callout{padding:15px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe}
      .private-guide .callout b{display:block;color:#1d4ed8;margin-bottom:4px;font-size:11px}
      .private-guide .callout span{font-size:10px;line-height:1.7;color:#475569}
      .private-guide .checklist{display:grid;gap:9px}
      .private-guide .checklist div{padding:11px 13px;border:1px solid #e5eaf1;border-radius:10px;background:#f8fafc;color:#475569;font-size:10px}
      @media(max-width:850px){.private-guide .steps{grid-template-columns:1fr}}
    </style>
    <div class="private-guide">
      <section class="guide-hero glass-card">
        <span class="eyebrow">GAME API · PRIVATE GUIDE</span>
        <h2>How to use Game API</h2>
        <p>This authenticated guide takes you from your developer account to a working API integration. Use the public guide when you need a shareable introduction.</p>
        <div class="module-actions">
          <a class="primary-btn" href="api-keys.html">Manage API Keys <b>→</b></a>
          <a class="secondary-btn" href="documentation.html">Public Documentation</a>
        </div>
      </section>

      <section class="glass-card doc-section">
        <span class="card-kicker">01 · VISUAL FLOW</span>
        <h3>Your integration</h3>
        <p>Your application sends an authenticated request to the Game API server. The server validates the credential, processes the request and returns JSON. Real-time applications can also listen through WebSocket.</p>
        <div class="guide-art"><img src="assets/game-api-how-to-use.svg" alt="Game API integration flow"></div>
      </section>

      <section class="steps">
        <article class="glass-card step">
          <span class="card-kicker">02 · ACCOUNT</span>
          <h3>Sign in to your developer workspace</h3>
          <p>Use your Game API developer account. If MFA is enabled, complete the authenticator verification before entering the protected workspace.</p>
          <a href="profile.html">Open Profile →</a>
        </article>
        <article class="glass-card step">
          <span class="card-kicker">03 · CREDENTIALS</span>
          <h3>Create an API key</h3>
          <p>Open API Keys, create a credential for the application, and keep the secret on your trusted backend. Never publish a production secret in browser code.</p>
          <a href="api-keys.html">Open API Keys →</a>
        </article>
        <article class="glass-card step">
          <span class="card-kicker">04 · REQUEST</span>
          <h3>Make your first request</h3>
          <p>Send the API key in the Authorization header when the endpoint requires authentication.</p>
          <pre><code>fetch("https://api.game-api.online/api/v1/status", {
  headers: { Authorization: "Bearer YOUR_API_KEY" }
});</code></pre>
        </article>
        <article class="glass-card step">
          <span class="card-kicker">05 · RESPONSE</span>
          <h3>Handle the response</h3>
          <p>Check the HTTP status and parse JSON. Handle 401, 403, 429 and 5xx responses explicitly instead of retrying every failure forever.</p>
          <pre><code>const response = await fetch(url, options);
const data = await response.json();
if (!response.ok) throw new Error(data.message || "Request failed");</code></pre>
        </article>
      </section>

      <section class="glass-card doc-section">
        <span class="card-kicker">06 · CRASH GAME</span>
        <h3>Use crash-game data</h3>
        <p>Crash rounds follow the documented game lifecycle. Treat the returned fields as data from the API and do not assume a fixed round number or multiplier.</p>
        <pre><code>{
  "type": "crash_status",
  "status": "crash",
  "round_number": 125,
  "multiplier": "3.47",
  "crashed_at": "2026-09-24T08:00:00Z"
}</code></pre>
      </section>

      <section class="glass-card doc-section">
        <span class="card-kicker">07 · REAL TIME</span>
        <h3>Connect to WebSocket</h3>
        <p>For supported live events, connect to:</p>
        <pre><code>wss://api.game-api.online/realtime</code></pre>
        <ol>
          <li>Open the connection.</li>
          <li>Wait for the server connection response.</li>
          <li>Authenticate with the required credential.</li>
          <li>Listen for supported events.</li>
          <li>Reconnect with backoff after an unexpected close.</li>
        </ol>
      </section>

      <section class="glass-card doc-section">
        <span class="card-kicker">08 · PRODUCTION</span>
        <h3>Before you go live</h3>
        <div class="checklist">
          <div>✓ Keep API secrets in environment variables or a secret manager.</div>
          <div>✓ Separate test and production credentials.</div>
          <div>✓ Use HTTPS for production HTTP requests.</div>
          <div>✓ Do not log Authorization headers or API secrets.</div>
          <div>✓ Handle authentication, rate-limit and server errors.</div>
          <div>✓ Monitor usage and plan limits.</div>
          <div>✓ Enable MFA or passkeys on the developer account.</div>
        </div>
      </section>

      <section class="callout">
        <b>Need the public introduction?</b>
        <span>Use the public How to Use Game API page when sharing onboarding instructions with someone who is not signed in.</span>
        <br><a href="how-to-use-gameapi.html">Open public guide →</a>
      </section>
    </div>`;
  }

  function overviewContent(){
    return '<div class="overview-page">'+
      '<section class="overview-hero glass-card"><div><span class="eyebrow"><span class="live-dot"></span> GAME API · WORKSPACE OVERVIEW</span><h2>One place to understand your integration.</h2><p>See your authenticated workspace, production API connection and the areas that need attention. Values that require backend data are clearly marked instead of using demo figures.</p></div><a href="how-to-use-gameapi.html" class="primary-btn">How to use Game API <b>→</b></a></section>'+
      '<section class="metric-grid overview-metrics">'+
        metric("ACCOUNT","Connected","Authenticated workspace","●","blue","Live"), metric("API STATUS","Checking…","Production API","●","green","Live"), metric("API USAGE","—","Awaiting usage source","◫","orange","Live data"), metric("API KEYS","—","Awaiting key source","⌘","purple","Live data")+
      '</section>'+
      '<section class="overview-columns">'+
        '<div class="glass-card overview-status-card"><div class="card-head"><div><span class="card-kicker">CONNECTION</span><h3>Production API</h3><p>Current availability check</p></div><span class="health-badge" id="overview-api-badge"><i></i> Checking</span></div><div class="overview-status-main"><div class="overview-status-icon" id="overview-api-icon">◎</div><div><strong id="overview-api-status">Checking service…</strong><small id="overview-api-detail">Contacting api.game-api.online</small></div></div><div class="overview-status-list"><div><span>Endpoint</span><b>api.game-api.online</b></div><div><span>Environment</span><b>Production</b></div><div><span>Authentication</span><b>Supabase session</b></div></div></div>'+
        '<div class="glass-card overview-account-card"><div class="card-head"><div><span class="card-kicker">ACCOUNT</span><h3>Your workspace</h3><p>Loaded from your authenticated account</p></div><a href="profile.html">Profile →</a></div><div class="overview-user"><span class="avatar large" id="overview-avatar">G</span><div><strong id="overview-name">Loading…</strong><small id="overview-email">Loading account…</small></div></div><div class="overview-user-meta"><div><span>User ID</span><b id="overview-user-id">Loading…</b></div><div><span>Provider</span><b id="overview-provider">Loading…</b></div></div></div>'+
      '</section>'+
      '<section class="glass-card overview-roadmap"><div class="card-head"><div><span class="card-kicker">DEVELOPER WORKFLOW</span><h3>Next steps</h3><p>Move from account setup to a working integration.</p></div></div><div class="overview-steps">'+
        overviewStep("01","Secure your API key","Create and manage credentials for your application.","keys.html","API Keys","blue")+
        overviewStep("02","Read the API reference","Check methods, endpoints, parameters and responses.","documentation.html","Documentation","green")+
        overviewStep("03","Test your integration","Use the exact production endpoint required by your application.","endpoints.html","Explore endpoints","purple")+
        overviewStep("04","Monitor requests","Review recorded activity through Logs when the backend logging source is connected.","logs.html","View logs","orange")+
      '</div></section>'+
      '<section class="overview-bottom-grid">'+
        '<div class="glass-card"><div class="card-head"><div><span class="card-kicker">ACTIVITY</span><h3>Request activity</h3><p>Real recorded requests only</p></div><a href="logs.html">View logs →</a></div><div id="overview-activity" class="overview-empty"><b>No live activity source connected</b><span>This panel stays empty rather than displaying sample requests.</span></div></div>'+
        '<div class="glass-card"><div class="card-head"><div><span class="card-kicker">SUPPORT</span><h3>Need help?</h3><p>Get started with the platform</p></div></div><div class="overview-help"><a href="how-to-use-gameapi.html"><b>How to use Game API</b><small>Follow the integration steps from sign-in to your first request.</small><i>→</i></a><a href="support.html"><b>Contact support</b><small>Open the support area for account and integration questions.</small><i>→</i></a></div></div>'+
      '</section>'+
      '</div>';
  }
  function overviewStep(num,title,desc,href,label,cls){
    return '<a class="overview-step '+cls+'" href="'+href+'"><span>'+num+'</span><div><b>'+title+'</b><small>'+desc+'</small></div><i>'+label+' →</i></a>';
  }
  function usageContent(){
    return '<div class="usage-page">'+
      '<section class="usage-hero glass-card"><div><span class="eyebrow">GAME API · LIVE CONSUMPTION</span><h2>Understand your API usage without fake numbers.</h2><p>This page only displays usage values when a connected usage source provides them. Until then, the dashboard keeps the figures empty instead of showing sample or demo traffic.</p></div><a href="api-keys.html" class="primary-btn">Manage API Keys <b>→</b></a></section>'+
      '<section class="metric-grid usage-metrics">'+
        metric("REQUESTS","—","Live usage source not connected","↗","blue","Live data")+
        metric("SUCCESS RATE","—","Calculated from recorded requests","✓","green","Live data")+
        metric("AVG RESPONSE","—","Calculated from recorded requests","◷","purple","Live data")+
        metric("QUOTA USED","—","Plan limit source not connected","◫","orange","Live data")+
      '</section>'+
      '<section class="usage-grid">'+
        '<div class="glass-card usage-chart-card"><div class="card-head"><div><span class="card-kicker">REQUEST TRAFFIC</span><h3>API request activity</h3><p>Recorded requests from your authenticated workspace</p></div><span class="usage-badge" id="usage-source-badge"><i></i> Waiting for source</span></div><div class="usage-chart-empty" id="usage-chart"><div class="usage-empty-icon">↗</div><b>No live usage data available</b><span>Connect the real request-usage source to populate this chart. No sample traffic is shown.</span></div></div>'+
        '<div class="glass-card usage-status-card"><div class="card-head"><div><span class="card-kicker">SERVICE</span><h3>Production API</h3><p>Live connectivity check</p></div><span class="health-badge" id="usage-api-badge"><i></i> Checking</span></div><div class="usage-service"><div class="usage-service-icon" id="usage-api-icon">G</div><div><b id="usage-api-status">Checking</b><small id="usage-api-detail">Checking api.game-api.online</small></div></div><div class="usage-service-grid"><div><span>ENVIRONMENT</span><b>Production</b></div><div><span>ENDPOINT</span><b>api.game-api.online</b></div><div><span>ACCOUNT</span><b>Authenticated</b></div><div><span>USAGE SOURCE</span><b id="usage-source-label">Not connected</b></div></div></div>'+
      '</section>'+
      '<section class="glass-card usage-breakdown"><div class="card-head"><div><span class="card-kicker">BREAKDOWN</span><h3>Usage details</h3><p>Only verified backend data will appear here.</p></div><a href="logs.html">Open logs →</a></div><div class="usage-detail-grid"><div><span>PERIOD</span><b>Not available</b><small>No reporting period is supplied by a live usage source.</small></div><div><span>REQUEST COUNT</span><b>—</b><small>Waiting for recorded request data.</small></div><div><span>ERROR COUNT</span><b>—</b><small>Waiting for recorded request data.</small></div><div><span>DATA SOURCE</span><b>Not connected</b><small>Usage endpoint or backend aggregation has not been configured.</small></div></div></section>'+
      '<section class="usage-actions"><a href="how-to-use-gameapi.html" class="glass-card usage-action"><span>01</span><div><b>Learn how requests are counted</b><small>Review the integration flow and authentication steps.</small></div><i>→</i></a><a href="logs.html" class="glass-card usage-action"><span>02</span><div><b>Inspect recorded requests</b><small>Open request logs when the backend logging source is available.</small></div><i>→</i></a><a href="limits.html" class="glass-card usage-action"><span>03</span><div><b>Check usage limits</b><small>Review plan limits and quotas from the connected billing source.</small></div><i>→</i></a></section>'+
      '</div>';
  }

  function initUsageLive(){
    fetch("https://x-api.game-api.online/api/v1/status",{method:"GET",headers:{"Accept":"application/json"}})
      .then(function(r){return {ok:r.ok,status:r.status};})
      .then(function(result){
        var operational=result.ok&&result.status>=200&&result.status<300;
        var label=operational?"Operational":"Unavailable";
        var s=document.getElementById("usage-api-status"),d=document.getElementById("usage-api-detail"),b=document.getElementById("usage-api-badge"),i=document.getElementById("usage-api-icon");
        if(s)s.textContent=label;
        if(d)d.textContent=operational?"Production API responded successfully":"Production API returned HTTP "+result.status;
        if(b)b.innerHTML='<i></i> '+label;
        if(i)i.textContent=operational?"✓":"!";
      }).catch(function(){
        var s=document.getElementById("usage-api-status"),d=document.getElementById("usage-api-detail"),b=document.getElementById("usage-api-badge"),i=document.getElementById("usage-api-icon");
        if(s)s.textContent="Unavailable";if(d)d.textContent="Unable to reach the production API";if(b)b.innerHTML="<i></i> Unavailable";if(i)i.textContent="!";
      });
  }

  function apiKeysContent(){
    return '<div class="keys-page">'+
      '<section class="keys-hero glass-card">'+
        '<div><span class="eyebrow">GAME API · CREDENTIALS</span><h2>Manage your API keys</h2><p>These are the real API keys connected to your authenticated Game API account. You can see the key name, issued date, status and last use, then copy or revoke an active key.</p></div>'+
        '<div class="keys-hero-actions"><button class="secondary-btn" id="keys-copy-active">Copy active key</button><button class="primary-btn" id="keys-create">+ Create new key</button></div>'+
      '</section>'+
      '<section class="metric-grid keys-metrics">'+
        metric("API KEYS","—","All issued key records","⌘","blue","Live data")+
        metric("ACTIVE","—","Currently usable","●","green","Live data")+
        metric("REVOKED","—","No longer usable","×","purple","Live data")+
        metric("LAST USED","—","Latest recorded activity","◷","orange","Live data")+
      '</section>'+
      '<section class="glass-card keys-list-card">'+
        '<div class="card-head"><div><span class="card-kicker">YOUR API KEYS</span><h3>Issued credentials</h3><p>Every key below comes from your real authenticated Game API workspace.</p></div><div class="keys-toolbar"><button class="secondary-btn small" id="keys-refresh">Refresh ↻</button><span class="usage-badge" id="keys-source-badge"><i></i> Loading</span></div></div>'+
        '<div id="api-keys-list" class="api-keys-list"><div class="keys-empty"><b>Loading API keys…</b><span>Reading the real key records attached to your account.</span></div></div>'+
      '</section>'+
      '<section class="keys-security-grid">'+
        '<div class="glass-card key-security"><span class="key-security-icon">◇</span><div><b>API key security</b><p>Your secret is only requested from the backend when you click Copy key. Keep it out of frontend source code and public repositories.</p></div></div>'+
        '<div class="glass-card key-security"><span class="key-security-icon">↻</span><div><b>Need a new key?</b><p>Revoke an exposed credential and create a replacement. Revoked keys stay visible here for account history.</p></div></div>'+
      '</section>'+
      '<div class="keys-modal" id="keys-create-modal"><div class="keys-dialog"><button class="keys-dialog-close" id="keys-create-close">×</button><span class="eyebrow">NEW CREDENTIAL</span><h3>Create API key</h3><p>Give your key a clear name such as Production, Staging, or Mobile App.</p><label>KEY NAME<input id="keys-name" maxlength="80" placeholder="e.g. Production server"></label><div class="keys-dialog-actions"><button class="secondary-btn" id="keys-create-cancel">Cancel</button><button class="primary-btn" id="keys-generate">Generate key</button></div></div></div>'+
      '<div class="keys-modal" id="keys-secret-modal"><div class="keys-dialog"><button class="keys-dialog-close" id="keys-secret-close">×</button><span class="eyebrow">YOUR API KEY</span><h3>Copy your API key</h3><p>The real secret for this credential was returned securely by the backend.</p><div class="keys-secret-value" id="keys-secret-value"></div><div class="keys-warning">Keep this secret private. Anyone with it may be able to make API requests on your behalf.</div><div class="keys-dialog-actions"><button class="secondary-btn" id="keys-secret-copy">Copy key</button><button class="primary-btn" id="keys-secret-done">Done</button></div></div></div>'+
      '<div class="keys-toast" id="keys-toast"></div>'+
      '</div>';
  }
  function initApiKeys(){
    var list=document.getElementById("api-keys-list"), badge=document.getElementById("keys-source-badge");
    var refresh=document.getElementById("keys-refresh"), create=document.getElementById("keys-create");
    var createModal=document.getElementById("keys-create-modal"), secretModal=document.getElementById("keys-secret-modal");
    var nameInput=document.getElementById("keys-name"), generate=document.getElementById("keys-generate");
    var secretValue=document.getElementById("keys-secret-value"), keysCopyActive=document.getElementById("keys-copy-active");
    var rows=[], session=null;

    function toast(message,error){
      var el=document.getElementById("keys-toast"); if(!el)return;
      el.textContent=message; el.className="keys-toast show"+(error?" error":"");
      clearTimeout(el._timer); el._timer=setTimeout(function(){el.className="keys-toast";},2800);
    }
    function setMessage(title,msg,error){
      if(list)list.innerHTML='<div class="keys-empty '+(error?"error":"")+'"><b>'+esc(title)+'</b><span>'+esc(msg)+'</span></div>';
    }
    async function backend(action,extra){
      extra=extra||{};
      if(!session) throw new Error("Your session has expired. Please sign in again.");
      var route;
      if(action==="list") route={method:"GET",path:"/api/keys"};
      else if(action==="create") route={method:"POST",path:"/api/keys"};
      else if(action==="revoke") route={method:"POST",path:"/api/keys/"+encodeURIComponent(extra.id)+"/revoke"};
      else if(action==="secret") route={method:"GET",path:"/api/keys/"+encodeURIComponent(extra.id)+"/secret"};
      else throw new Error("Invalid API key action");
      var response=await fetch("https://api.game-api.online"+route.path,{method:route.method,headers:{"Accept":"application/json","Content-Type":"application/json","Authorization":"Bearer "+session.access_token},body:route.method==="POST"&&action==="create"?JSON.stringify({name:extra.name}):undefined});
      var body=await response.text(),data={};
      try{data=body?JSON.parse(body):{};}catch(e){}
      if(response.status===401){location.replace("login.html");throw new Error("Your session has expired. Please sign in again.");}
      if(!response.ok) throw new Error(data.error||data.message||("Key service returned HTTP "+response.status));
      return data;
    }
    function normalize(payload){
      return Array.isArray(payload)?payload:(payload&&Array.isArray(payload.keys)?payload.keys:(payload&&Array.isArray(payload.data)?payload.data:[]));
    }
    function preview(x){
      var prefix=x.key_prefix||x.prefix||"gk_live";
      var last=x.key_last4||x.last4||"";
      return prefix+(last?"_••••••••"+last:"_••••••••");
    }
    function formatDate(v,empty){
      if(!v)return empty||"—";
      var d=new Date(v); return isNaN(d.getTime())?(empty||"—"):d.toLocaleString();
    }
    function render(){
      var active=rows.filter(function(x){return String(x.status||"active").toLowerCase()==="active"}).length;
      var revoked=rows.filter(function(x){return String(x.status||"").toLowerCase()==="revoked"}).length;
      var latest=rows.map(function(x){return x.last_used_at||x.last_used||""}).filter(Boolean).sort().pop()||"";
      var cards=document.querySelectorAll(".keys-metrics .metric");
      if(cards[0])cards[0].querySelector("strong").textContent=String(rows.length);
      if(cards[1])cards[1].querySelector("strong").textContent=String(active);
      if(cards[2])cards[2].querySelector("strong").textContent=String(revoked);
      if(cards[3])cards[3].querySelector("strong").textContent=latest?formatDate(latest,"—"):"—";
      if(!rows.length){setMessage("No API keys yet","Create your first key to connect an application to Game API.");return;}
      list.innerHTML=rows.map(function(x){
        var status=String(x.status||"active").toLowerCase(), safe=status==="revoked"?"revoked":"active";
        var name=x.name||"Unnamed key", id=x.id||"";
        var used=x.last_used_at||x.last_used;
        var plan=x.plan||"free";
        return '<article class="api-key-row">'+
          '<div class="api-key-main"><div class="api-key-icon">⌘</div><div><b>'+esc(name)+'</b><span>'+esc(preview(x))+'</span></div></div>'+
          '<div class="api-key-meta">'+
            '<div><span>STATUS</span><b class="'+safe+'">'+esc(status.toUpperCase())+'</b></div>'+
            '<div><span>PLAN</span><b>'+esc(String(plan).toUpperCase())+'</b></div>'+
            '<div><span>ISSUED</span><b>'+esc(formatDate(x.created_at))+'</b></div>'+
            '<div><span>LAST USED</span><b>'+esc(formatDate(used,"Never"))+'</b></div>'+
          '</div>'+
          '<div class="api-key-actions">'+
            (status==="active"?'<button class="secondary-btn small" data-copy="'+esc(id)+'">Copy secret</button><button class="danger-btn" data-revoke="'+esc(id)+'">Revoke</button>':'<span class="revoked-label">Revoked</span>')+
          '</div>'+
        '</article>';
      }).join("");
      list.querySelectorAll("[data-copy]").forEach(function(btn){
        btn.onclick=async function(){
          btn.disabled=true;
          try{var result=await backend("secret",{id:btn.dataset.copy});await navigator.clipboard.writeText(result.secret);toast("API secret copied to clipboard.");}
          catch(e){toast(e.message||"Could not retrieve the API secret.",true);}
          finally{btn.disabled=false;}
        };
      });
      list.querySelectorAll("[data-revoke]").forEach(function(btn){
        btn.onclick=async function(){
          if(!confirm("Revoke this API key? This cannot be undone."))return;
          btn.disabled=true;
          try{await backend("revoke",{id:btn.dataset.revoke});toast("API key revoked.");await load();}
          catch(e){toast(e.message||"Could not revoke this key.",true);btn.disabled=false;}
        };
      });
      if(create)create.disabled=active>=Number(window.gameApiMaxActiveKeys||2);
    }
    async function load(){
      setMessage("Loading API keys…","Reading your connected credentials.");
      if(badge)badge.innerHTML="<i></i> Loading";
      try{
        var sb=await connectSupabase();
        if(!sb)throw new Error("Supabase is unavailable");
        var auth=await sb.auth.getSession();
        session=auth.data&&auth.data.session;
        if(!session){location.replace("login.html");return;}
        var payload=await backend("list");
        rows=normalize(payload);
        window.gameApiMaxActiveKeys=Number(payload.max_active_keys||2);
        render();
        if(badge)badge.innerHTML="<i></i> Live source";
      }catch(e){
        setMessage("Unable to load live API keys","The authenticated key service could not be read right now. "+(e.message||"Please try again."),true);
        if(badge)badge.innerHTML="<i></i> Unavailable";
      }
    }
    async function openCreate(){
      createModal.classList.add("open"); nameInput.value=""; setTimeout(function(){nameInput.focus();},50);
    }
    function closeCreate(){createModal.classList.remove("open");}
    function closeSecret(){secretModal.classList.remove("open");}
    async function generateKey(){
      var name=(nameInput.value||"").trim()||"Untitled key";
      generate.disabled=true; generate.textContent="Generating…";
      try{
        var result=await backend("create",{name:name});
        closeCreate();
        secretValue.textContent=result.secret||"";
        secretModal.classList.add("open");
        toast("API key created.");
        await load();
      }catch(e){toast(e.message||"Could not create API key.",true);}
      finally{generate.disabled=false;generate.textContent="Generate key";}
    }
    if(refresh)refresh.onclick=load;
    if(create)create.onclick=openCreate;
    document.getElementById("keys-create-close").onclick=closeCreate;
    document.getElementById("keys-create-cancel").onclick=closeCreate;
    document.getElementById("keys-generate").onclick=generateKey;
    document.getElementById("keys-secret-close").onclick=closeSecret;
    document.getElementById("keys-secret-done").onclick=closeSecret;
    document.getElementById("keys-secret-copy").onclick=async function(){
      try{await navigator.clipboard.writeText(secretValue.textContent);toast("API secret copied.");}
      catch(e){toast("Clipboard access failed. Copy the key manually.",true);}
    };
    keysCopyActive.onclick=async function(){
      var active=rows.find(function(x){return String(x.status||"active").toLowerCase()==="active"});
      if(!active){toast("No active API key is available.",true);return;}
      try{var result=await backend("secret",{id:active.id});await navigator.clipboard.writeText(result.secret);toast("Active API secret copied.");}
      catch(e){toast(e.message||"Could not retrieve the API secret.",true);}
    };
    [createModal,secretModal].forEach(function(modal){modal.addEventListener("click",function(e){if(e.target===modal)modal.classList.remove("open");});});
    load();
  }


  function profileContent(){
    return '<div class="profile-page">'+
      '<section class="profile-hero glass-card">'+
        '<div class="profile-hero-bg"></div>'+
        '<div class="profile-identity">'+
          '<div class="profile-avatar-large" id="profile-avatar">D</div>'+
          '<div><span class="eyebrow">GAME API · ACCOUNT</span><h2 id="profile-display-name">Loading profile…</h2><p id="profile-display-email">Loading account details…</p><div class="profile-badges"><span class="health-badge"><i></i> Authenticated</span><span class="profile-provider" id="profile-provider">Provider</span></div></div>'+
        '</div>'+
        '<div class="profile-hero-actions"><a class="secondary-btn" href="subscription.html">View subscription</a><button class="primary-btn" id="profile-save-top">Save changes <b>→</b></button></div>'+
      '</section>'+
      '<section class="profile-layout">'+
        '<div class="glass-card profile-form-card">'+
          '<div class="card-head"><div><span class="card-kicker">PERSONAL INFORMATION</span><h3>Your profile</h3><p>Update the developer information shown across your Game API workspace.</p></div><span class="usage-badge" id="profile-save-status"><i></i> Synced</span></div>'+
          '<form id="profile-form" class="profile-form">'+
            '<div class="profile-form-grid">'+
              '<label>DISPLAY NAME<input id="profile-name" maxlength="120" autocomplete="name" placeholder="Your name"></label>'+
              '<label>EMAIL ADDRESS<input id="profile-email" type="email" readonly autocomplete="email"></label>'+
            '</div>'+
            '<label>PROFILE PHOTO URL<input id="profile-avatar-url" type="url" maxlength="500" placeholder="https://…"></label>'+
            '<div class="profile-preview"><div class="profile-preview-avatar" id="profile-preview-avatar">D</div><div><b>Profile appearance</b><span>Your avatar and name are used in the developer console header.</span></div></div>'+
            '<div class="profile-actions"><button type="submit" class="primary-btn" id="profile-save">Save profile <b>→</b></button><button type="button" class="secondary-btn" id="profile-reset">Reset</button></div>'+
          '</form>'+
        '</div>'+
        '<aside class="profile-side">'+
          '<div class="glass-card profile-account-card"><div class="card-head"><div><span class="card-kicker">ACCOUNT</span><h3>Account details</h3></div></div><div class="profile-details"><div><span>USER ID</span><code id="profile-user-id">Loading…</code></div><div><span>AUTH PROVIDER</span><b id="profile-auth-provider">Loading…</b></div><div><span>ACCOUNT CREATED</span><b id="profile-created">Loading…</b></div><div><span>EMAIL STATUS</span><b id="profile-email-status">Loading…</b></div></div></div>'+
          '<div class="glass-card profile-security-card"><div class="card-head"><div><span class="card-kicker">SECURITY</span><h3>Account security</h3><p>Keep your account credentials protected.</p></div></div><div class="security-row"><span>Session</span><b class="active">Active</b></div><a class="quick-control" href="security.html">Security settings <span>→</span></a><a class="quick-control" href="authentication.html">Authentication settings <span>→</span></a></div>'+
        '</aside>'+
      '</section>'+
    '</div>';
  }

  function initProfile(){
    var form=document.getElementById("profile-form");
    if(!form)return;
    var nameInput=document.getElementById("profile-name"), emailInput=document.getElementById("profile-email"), avatarInput=document.getElementById("profile-avatar-url");
    var displayName=document.getElementById("profile-display-name"), displayEmail=document.getElementById("profile-display-email"), avatar=document.getElementById("profile-avatar"), preview=document.getElementById("profile-preview-avatar");
    var providerEl=document.getElementById("profile-provider"), provider2=document.getElementById("profile-auth-provider"), userId=document.getElementById("profile-user-id"), created=document.getElementById("profile-created"), emailStatus=document.getElementById("profile-email-status"), status=document.getElementById("profile-save-status");
    function applyAvatar(el,url,initial){
      if(!el)return;
      if(url)el.innerHTML='<img src="'+esc(url)+'" alt="Profile photo">';
      else el.textContent=initial;
    }
    function syncPreview(){
      var n=(nameInput.value||"").trim()||"Developer", url=(avatarInput.value||"").trim(), initial=(n.charAt(0)||"D").toUpperCase();
      displayName.textContent=n; displayEmail.textContent=emailInput.value||"";
      applyAvatar(avatar,url,initial); applyAvatar(preview,url,initial);
    }
    function setStatus(label,error){
      if(status){status.innerHTML='<i></i> '+esc(label);status.classList.toggle("error",!!error);}
    }
    async function load(){
      try{
        var sb=await connectSupabase();
        if(!sb)throw new Error("Supabase is unavailable.");
        var result=await sb.auth.getSession(),session=result.data&&result.data.session;
        if(!session){location.replace("login.html");return;}
        var user=session.user||{},md=user.user_metadata||{},appmd=user.app_metadata||{};
        var name=md.full_name||md.name||md.user_name||md.preferred_username||((user.email||"").split("@")[0])||"Developer";
        var provider=appmd.provider||"email",avatarUrl=md.avatar_url||md.picture||"";
        nameInput.value=name;emailInput.value=user.email||"";avatarInput.value=avatarUrl;
        userId.textContent=user.id||"—";providerEl.textContent=provider;provider2.textContent=provider;
        created.textContent=user.created_at?new Date(user.created_at).toLocaleString():"—";
        emailStatus.textContent=user.email_confirmed_at?"Verified":"Not verified";
        syncPreview();setStatus("Synced");
      }catch(e){setStatus(e.message||"Unable to load profile.",true);}
    }
    async function save(){
      var n=(nameInput.value||"").trim(),url=(avatarInput.value||"").trim();
      if(!n){notify("error","Profile update","Please enter a display name.");return;}
      setStatus("Saving…");document.getElementById("profile-save").disabled=true;
      try{
        var sb=await connectSupabase();
        if(!sb)throw new Error("Supabase is unavailable.");
        var result=await sb.auth.updateUser({data:{full_name:n,avatar_url:url}});
        if(result.error)throw result.error;
        var user=result.data&&result.data.user||{},provider=(user.app_metadata&&user.app_metadata.provider)||"email";
        localStorage.setItem("gameapi_user",JSON.stringify({name:n,email:user.email||emailInput.value,id:user.id||userId.textContent,avatar:url}));
        document.querySelectorAll(".account-meta b,.account-menu-head b").forEach(function(el){el.textContent=n;});
        document.querySelectorAll(".account-meta small,.account-menu-head small").forEach(function(el){el.textContent=user.email||emailInput.value;});
        document.querySelectorAll(".avatar").forEach(function(el){applyAvatar(el,url,(n.charAt(0)||"D").toUpperCase());});
        providerEl.textContent=provider;provider2.textContent=provider;syncPreview();setStatus("Saved just now");
        notify("success","Profile updated","Your developer profile has been saved.");
      }catch(e){setStatus(e.message||"Could not save profile.",true);notify("error","Profile update failed",e.message||"Please try again.");}
      finally{document.getElementById("profile-save").disabled=false;}
    }
    nameInput.oninput=syncPreview;avatarInput.oninput=syncPreview;
    form.onsubmit=function(e){e.preventDefault();save();};
    document.getElementById("profile-save-top").onclick=save;
    document.getElementById("profile-reset").onclick=load;
    load();
  }

  function authenticationContent(){
    return '<div class="auth-security-page">'+
      '<section class="module-banner auth-banner"><div><span class="eyebrow">GAME API · AUTHENTICATION</span><h2>Sign-in & verification methods</h2><p>Manage the authentication methods connected to your real Supabase account.</p></div><div class="module-orb"><span>🔐</span></div></section>'+
      '<section class="auth-method-grid">'+
        '<div class="glass-card auth-method-card"><div class="auth-method-icon passkey">⌁</div><div class="auth-method-copy"><span class="card-kicker">PASSWORDLESS SIGN-IN</span><h3>Passkey</h3><p>Use your device, biometric, PIN or security key to sign in without typing a password.</p><div class="auth-status" id="auth-passkey-status"><i></i> Checking…</div></div><div class="auth-method-actions"><button class="primary-btn" id="auth-passkey-add">Add passkey <b>→</b></button></div><div class="auth-factor-list" id="auth-passkey-list"></div></div>'+
        '<div class="glass-card auth-method-card"><div class="auth-method-icon totp">6·6</div><div class="auth-method-copy"><span class="card-kicker">AUTHENTICATOR APP</span><h3>TOTP</h3><p>Use a six-digit code from Google Authenticator, Microsoft Authenticator, 1Password or another TOTP app.</p><div class="auth-status" id="auth-totp-status"><i></i> Checking…</div></div><div class="auth-method-actions"><button class="primary-btn" id="auth-totp-add">Set up TOTP <b>→</b></button></div><div class="auth-factor-list" id="auth-totp-list"></div></div>'+
      '</section>'+
      '<section class="glass-card auth-info-card"><div class="card-head"><div><span class="card-kicker">SECURITY LEVEL</span><h3>Current authentication assurance</h3><p id="auth-aal-copy">Checking the current session assurance level…</p></div><span class="health-badge" id="auth-aal-badge"><i></i> Checking</span></div><div class="module-status"><div><span>Session</span><b id="auth-session-status">Checking</b></div><div><span>Passkeys</span><b id="auth-passkey-count">—</b></div><div><span>TOTP factors</span><b id="auth-totp-count">—</b></div></div></section>'+
      '<div class="auth-modal" id="totp-modal"><div class="auth-modal-panel"><button class="auth-modal-close" id="totp-close">×</button><span class="card-kicker">TOTP SETUP</span><h3>Connect your authenticator app</h3><p>Scan this QR code, then enter the six-digit code shown in your authenticator app to finish setup.</p><div class="totp-qr-wrap"><img id="totp-qr" alt="TOTP QR code"></div><label class="totp-secret-label">MANUAL SECRET<input id="totp-secret" readonly></label><label class="totp-code-label">VERIFICATION CODE<input id="totp-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="123456"></label><div class="auth-modal-actions"><button class="secondary-btn" id="totp-cancel">Cancel</button><button class="primary-btn" id="totp-verify">Verify & enable <b>→</b></button></div><div class="auth-modal-error" id="totp-error"></div></div></div>'+
    '</div>';
  }

  function securityContent(){
    return '<div class="auth-security-page">'+
      '<section class="module-banner security-banner"><div><span class="eyebrow">GAME API · SECURITY</span><h2>Protect your developer account</h2><p>Review your active authentication factors and strengthen account access with passkeys and TOTP.</p></div><div class="module-orb"><span>◇</span></div></section>'+
      '<section class="glass-card security-overview-card"><div class="card-head"><div><span class="card-kicker">ACCOUNT PROTECTION</span><h3>Security overview</h3><p>These controls are connected to your authenticated Supabase session.</p></div><span class="health-badge" id="security-aal-badge"><i></i> Checking</span></div><div class="security-overview-grid"><div><span>AUTHENTICATION ASSURANCE</span><b id="security-aal">Checking…</b></div><div><span>PASSKEYS</span><b id="security-passkey-count">—</b></div><div><span>TOTP</span><b id="security-totp-count">—</b></div><div><span>SESSION</span><b class="active">Active</b></div></div></section>'+
      '<section class="security-control-grid">'+
        '<div class="glass-card security-control-card"><div class="security-control-top"><div class="auth-method-icon passkey">⌁</div><div><span class="card-kicker">WEBAUTHN</span><h3>Passkeys</h3></div></div><p>Passkeys are phishing-resistant credentials stored by your device or password manager.</p><div class="security-list" id="security-passkeys"><div class="security-empty">Loading passkeys…</div></div><button class="primary-btn" id="security-passkey-add">Add passkey <b>→</b></button></div>'+
        '<div class="glass-card security-control-card"><div class="security-control-top"><div class="auth-method-icon totp">6·6</div><div><span class="card-kicker">APP AUTHENTICATOR</span><h3>TOTP</h3></div></div><p>Use a time-based six-digit code from your authenticator app as an additional verification factor.</p><div class="security-list" id="security-totps"><div class="security-empty">Loading TOTP factors…</div></div><button class="primary-btn" id="security-totp-add">Set up TOTP <b>→</b></button></div>'+
      '</section>'+
      '<div class="auth-modal" id="security-totp-modal"><div class="auth-modal-panel"><button class="auth-modal-close" id="security-totp-close">×</button><span class="card-kicker">TOTP SETUP</span><h3>Connect your authenticator app</h3><p>Scan the QR code, then enter the six-digit code from your authenticator app.</p><div class="totp-qr-wrap"><img id="security-totp-qr" alt="TOTP QR code"></div><label class="totp-secret-label">MANUAL SECRET<input id="security-totp-secret" readonly></label><label class="totp-code-label">VERIFICATION CODE<input id="security-totp-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="123456"></label><div class="auth-modal-actions"><button class="secondary-btn" id="security-totp-cancel">Cancel</button><button class="primary-btn" id="security-totp-verify">Verify & enable <b>→</b></button></div><div class="auth-modal-error" id="security-totp-error"></div></div></div>'+
    '</div>';
  }

  async function getAuthSecurityData(sb){
    var factorsResult=await sb.auth.mfa.listFactors();
    if(factorsResult.error)throw factorsResult.error;
    var factors=factorsResult.data||{};
    var allFactors=(factors.all||[]);
    var totps=allFactors.filter(function(x){return String(x.factor_type||x.type||"").toLowerCase()==="totp" && String(x.status||"").toLowerCase()!=="unverified";});
    var aal=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    var passkeys=[];
    if(sb.auth.passkey && typeof sb.auth.passkey.list==="function"){
      var p=await sb.auth.passkey.list();
      if(!p.error)passkeys=p.data||[];
    }
    return {totps:totps,passkeys:passkeys,aal:aal.data||{}};
  }

  function formatSecurityDate(v){
    if(!v)return "—";
    var d=new Date(v); return isNaN(d.getTime())?"—":d.toLocaleString();
  }

  function securityAuthError(error){
    var msg=error&&error.message?error.message:String(error||"Unknown error");
    if(/passkey_disabled/i.test(msg))return "Passkey authentication is not enabled for this Supabase project yet.";
    if(/webauthn/i.test(msg))return "Passkey setup could not be completed. Make sure this site is opened on a supported browser and the device has a screen lock or authenticator.";
    return msg;
  }

  function openTotpSetup(sb, ids){
    var modal=document.getElementById(ids.modal), qr=document.getElementById(ids.qr), secret=document.getElementById(ids.secret), code=document.getElementById(ids.code), error=document.getElementById(ids.error);
    if(!modal)return;
    error.textContent=""; code.value=""; modal.classList.add("open");
    sb.auth.mfa.enroll({factorType:"totp",friendlyName:"Game API Authenticator"}).then(function(result){
      if(result.error)throw result.error;
      var data=result.data||{};
      qr.src=data.totp&&data.totp.qr_code||""; secret.value=data.totp&&data.totp.secret||""; modal.dataset.factorId=data.id||"";
    }).catch(function(e){error.textContent=e.message||"Could not start TOTP setup.";});
  }

  function initAuthSecurity(key){
    var isAuth=key==="authentication";
    connectSupabase().then(async function(sb){
      if(!sb)return;
      var sessionResult=await sb.auth.getSession().catch(function(){return null;});
      if(!sessionResult||!sessionResult.data||!sessionResult.data.session){location.replace("login.html");return;}
      var ids=isAuth?{passkeyStatus:"auth-passkey-status",passkeyList:"auth-passkey-list",passkeyCount:"auth-passkey-count",totpStatus:"auth-totp-status",totpList:"auth-totp-list",totpCount:"auth-totp-count",aalBadge:"auth-aal-badge",aalCopy:"auth-aal-copy",session:"auth-session-status",passkeyAdd:"auth-passkey-add",totpAdd:"auth-totp-add",modal:"totp-modal",close:"totp-close",cancel:"totp-cancel",verify:"totp-verify",qr:"totp-qr",secret:"totp-secret",code:"totp-code",error:"totp-error"}:{passkeyStatus:null,passkeyList:"security-passkeys",passkeyCount:"security-passkey-count",totpStatus:null,totpList:"security-totps",totpCount:"security-totp-count",aalBadge:"security-aal-badge",aalCopy:null,session:null,passkeyAdd:"security-passkey-add",totpAdd:"security-totp-add",modal:"security-totp-modal",close:"security-totp-close",cancel:"security-totp-cancel",verify:"security-totp-verify",qr:"security-totp-qr",secret:"security-totp-secret",code:"security-totp-code",error:"security-totp-error"};
      var passkeyStatus=document.getElementById(ids.passkeyStatus),totpStatus=document.getElementById(ids.totpStatus),passkeyList=document.getElementById(ids.passkeyList),totpList=document.getElementById(ids.totpList);
      function setAal(aal){
        var current=aal&&aal.currentLevel||"aal1", label=current==="aal2"?"AAL2 · MFA verified":"AAL1 · Standard sign-in";
        var badge=document.getElementById(ids.aalBadge),copy=ids.aalCopy&&document.getElementById(ids.aalCopy);
        if(badge)badge.innerHTML='<i></i> '+label;
        if(copy)copy.textContent=current==="aal2"?"This session has been verified with an additional factor.":"This session is using standard authentication. Add and verify TOTP to reach AAL2.";
        var securityAal=document.getElementById("security-aal"); if(securityAal)securityAal.textContent=label;
      }
      function render(data){
        setAal(data.aal);
        var pcount=data.passkeys.length,tcount=data.totps.length;
        var pc=document.getElementById(ids.passkeyCount),tc=document.getElementById(ids.totpCount);
        if(pc)pc.textContent=pcount+" registered"; if(tc)tc.textContent=tcount+" enabled";
        var sp=document.getElementById("security-passkey-count"),st=document.getElementById("security-totp-count");
        if(sp)sp.textContent=pcount+" registered"; if(st)st.textContent=tcount+" enabled";
        if(passkeyStatus)passkeyStatus.innerHTML='<i></i> '+(pcount?"Enabled":"Not configured");
        if(totpStatus)totpStatus.innerHTML='<i></i> '+(tcount?"Enabled":"Not configured");
        if(passkeyList)passkeyList.innerHTML=pcount?data.passkeys.map(function(p){return '<div class="auth-factor-item"><div><b>'+esc(p.friendly_name||"Passkey")+'</b><small>Added '+esc(formatSecurityDate(p.created_at))+(p.last_used_at?" · Last used "+esc(formatSecurityDate(p.last_used_at)):"")+'</small></div><button class="text-danger auth-passkey-delete" data-id="'+esc(p.id)+'">Remove</button></div>';}).join(""):'<div class="security-empty">No passkeys are registered on this account.</div>';
        if(totpList)totpList.innerHTML=tcount?data.totps.map(function(f){return '<div class="auth-factor-item"><div><b>'+esc(f.friendly_name||"Authenticator app")+'</b><small>Enabled '+esc(formatSecurityDate(f.created_at))+'</small></div><button class="text-danger auth-totp-delete" data-id="'+esc(f.id)+'">Remove</button></div>';}).join(""):'<div class="security-empty">No TOTP authenticator is enabled.</div>';
        document.querySelectorAll(".auth-passkey-delete").forEach(function(btn){btn.onclick=async function(){if(!confirm("Remove this passkey from your Game API account?"))return;try{var result=await sb.auth.passkey.delete({passkeyId:btn.dataset.id});if(result&&result.error)throw result.error;notify("success","Passkey removed","The passkey has been removed from your account.");load();}catch(e){notify("error","Passkey removal failed",securityAuthError(e));}};});
        document.querySelectorAll(".auth-totp-delete").forEach(function(btn){btn.onclick=async function(){if(!confirm("Disable this TOTP factor?"))return;try{var result=await sb.auth.mfa.unenroll({factorId:btn.dataset.id});if(result.error)throw result.error;notify("success","TOTP disabled","The authenticator factor has been removed.");load();}catch(e){notify("error","TOTP removal failed",securityAuthError(e));}};});
      }
      async function load(){try{var data=await getAuthSecurityData(sb);render(data);}catch(e){notify("error","Security data unavailable",securityAuthError(e));}}
      async function addPasskey(){
        try{if(typeof sb.auth.registerPasskey!=="function")throw new Error("Passkey support is not available in this client.");var result=await sb.auth.registerPasskey();if(result.error)throw result.error;notify("success","Passkey added","Your passkey is now registered with Game API.");load();}
        catch(e){notify("error","Passkey setup failed",securityAuthError(e));}
      }
      var add=document.getElementById(ids.passkeyAdd);if(add)add.onclick=addPasskey;
      var addTotp=document.getElementById(ids.totpAdd);if(addTotp)addTotp.onclick=function(){openTotpSetup(sb,ids);};
      var modal=document.getElementById(ids.modal),close=document.getElementById(ids.close),cancel=document.getElementById(ids.cancel),verify=document.getElementById(ids.verify);
      if(close)close.onclick=function(){modal.classList.remove("open");}; if(cancel)cancel.onclick=function(){modal.classList.remove("open");}; if(modal)modal.onclick=function(e){if(e.target===modal)modal.classList.remove("open");};
      if(verify)verify.onclick=async function(){
        var factorId=modal.dataset.factorId, code=(document.getElementById(ids.code).value||"").replace(/\D/g,""), err=document.getElementById(ids.error); err.textContent="";
        if(!factorId){err.textContent="TOTP setup has not finished loading yet.";return;} if(code.length!==6){err.textContent="Enter the six-digit code from your authenticator app.";return;}
        try{var result=await sb.auth.mfa.challenge({factorId:factorId});if(result.error)throw result.error;var verified=await sb.auth.mfa.verify({factorId:factorId,challengeId:result.data.id,code:code});if(verified.error)throw verified.error;modal.classList.remove("open");notify("success","TOTP enabled","Your authenticator app is now protecting this account.");load();}
        catch(e){err.textContent=e.message||"The verification code was not accepted. Check your authenticator app and try again.";}
      };
      load();
    }).catch(function(e){notify("error","Security setup failed",securityAuthError(e));});
  }


  function analyticsContent(){
    return '<div class="analytics-page">'+
      '<section class="analytics-hero glass-card"><div><span class="eyebrow">GAME API · ANALYTICS</span><h2>Request analytics</h2><p>Track the real request counts recorded against your API keys. Move your mouse over the chart or touch a point to inspect its request count.</p></div><div class="analytics-live"><i></i><span>LIVE DATA</span></div></section>'+
      '<section class="metric-grid analytics-metrics">'+
        metric("TOTAL REQUESTS","—","Recorded across your API keys","↗","blue","Live data")+
        metric("ACTIVE KEYS","—","Keys currently usable","●","green","Live data")+
        metric("TOP KEY","—","Highest recorded request count","⌁","purple","Live data")+
        metric("LAST ACTIVITY","—","Most recent key activity","◷","orange","Live data")+
      '</section>'+
      '<section class="glass-card analytics-chart-card">'+
        '<div class="card-head"><div><span class="card-kicker">REQUEST FLOW</span><h3>API request activity</h3><p>Each point represents the real request count recorded for an API key. Hover or touch a point for details.</p></div><span class="usage-badge" id="analytics-total-badge"><i></i> Loading</span></div>'+
        '<div class="analytics-chart-wrap"><div class="analytics-chart-grid"></div><div class="analytics-chart-y" id="analytics-chart-y"></div><svg id="analytics-chart" class="analytics-svg" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-label="API request activity chart"></svg><div id="analytics-tooltip" class="analytics-tooltip"></div><div id="analytics-chart-x" class="analytics-chart-x"></div></div>'+
        '<div class="analytics-chart-note"><span><i></i> Request count</span><span>Hover/touch points for exact values</span></div>'+
      '</section>'+
      '<section class="analytics-grid">'+
        '<div class="glass-card analytics-table-card"><div class="card-head"><div><span class="card-kicker">KEY BREAKDOWN</span><h3>Requests by API key</h3><p>Live totals returned by the key service.</p></div></div><div id="analytics-key-table" class="analytics-key-table"><div class="dashboard-empty"><b>Loading request data…</b></div></div></div>'+
        '<div class="glass-card analytics-explain"><span class="card-kicker">HOW IT WORKS</span><h3>Understand your traffic</h3><div class="analytics-steps"><div><b>01</b><span><strong>Make a request</strong>Your application sends a request with its Game API key.</span></div><div><b>02</b><span><strong>Usage is recorded</strong>The API associates the request with the authenticated key.</span></div><div><b>03</b><span><strong>Chart updates</strong>Refresh the page to read the latest recorded totals.</span></div></div><p class="analytics-disclaimer">This page does not invent traffic history. If the API has not recorded requests for a key, its value remains zero.</p></div>'+
      '</section>'+
    '</div>';
  }

  function initAnalytics(){
    connectSupabase().then(async function(sb){
      if(!sb)return;
      var sessionResult=await sb.auth.getSession().catch(function(){return null;});
      if(!sessionResult||!sessionResult.data||!sessionResult.data.session){location.replace("login.html");return;}
      var token=sessionResult.data.session.access_token;
      var response=await fetch("https://api.game-api.online/api/keys",{headers:{"Accept":"application/json","Authorization":"Bearer "+token}});
      var body=await response.text(),payload={};
      try{payload=body?JSON.parse(body):{};}catch(e){}
      if(!response.ok)throw new Error(payload.error||payload.message||("Usage service returned HTTP "+response.status));
      var rows=Array.isArray(payload)?payload:(payload&&Array.isArray(payload.keys)?payload.keys:(payload&&Array.isArray(payload.data)?payload.data:[]));
      renderAnalytics(rows);
    }).catch(function(e){
      var table=document.getElementById("analytics-key-table"), chart=document.getElementById("analytics-chart");
      if(table)table.innerHTML='<div class="analytics-error"><b>Unable to load analytics</b><span>'+esc(e.message||"The request analytics source is unavailable.")+'</span></div>';
      if(chart)chart.innerHTML="";
      notify("error","Analytics unavailable",e.message||"Could not load request analytics.");
    });
  }

  function renderAnalytics(rows){
    var normalized=rows.map(function(x){return {
      id:x.id||"",
      name:x.name||"Unnamed key",
      used:Math.max(0,Number(x.requests_used||0)),
      status:String(x.status||"active").toLowerCase(),
      lastUsed:x.last_used_at||x.last_used||""
    };});
    var total=normalized.reduce(function(s,x){return s+x.used;},0);
    var active=normalized.filter(function(x){return x.status==="active";}).length;
    var sorted=normalized.slice().sort(function(a,b){return b.used-a.used;});
    var top=sorted[0];
    var last=normalized.map(function(x){return x.lastUsed;}).filter(Boolean).sort().pop()||"—";
    var cards=document.querySelectorAll(".analytics-metrics .metric");
    if(cards[0])cards[0].querySelector("strong").textContent=String(total);
    if(cards[1])cards[1].querySelector("strong").textContent=String(active);
    if(cards[2])cards[2].querySelector("strong").textContent=top?top.name:"—";
    if(cards[3])cards[3].querySelector("strong").textContent=last&&last!=="—"?formatAnalyticsDate(last):"—";
    var badge=document.getElementById("analytics-total-badge");if(badge)badge.innerHTML='<i></i> '+total+' requests';
    renderAnalyticsChart(sorted);
    var table=document.getElementById("analytics-key-table");
    if(!table)return;
    if(!sorted.length){table.innerHTML='<div class="analytics-empty"><b>No API keys yet</b><span>Create an API key and make requests to see analytics here.</span></div>';return;}
    table.innerHTML=sorted.map(function(x,i){
      var pct=total?Math.round(x.used/total*100):0;
      return '<div class="analytics-key-row"><div class="analytics-rank">'+String(i+1).padStart(2,"0")+'</div><div class="analytics-key-name"><b>'+esc(x.name)+'</b><small>'+esc(x.status.toUpperCase())+'</small></div><div class="analytics-key-progress"><i style="width:'+pct+'%"></i></div><strong>'+x.used.toLocaleString()+'</strong><span>'+pct+'%</span></div>';
    }).join("");
  }

  function formatAnalyticsDate(v){
    var d=new Date(v);return isNaN(d.getTime())?"—":d.toLocaleString();
  }

  function renderAnalyticsChart(rows){
    var svg=document.getElementById("analytics-chart"),xhost=document.getElementById("analytics-chart-x"),yhost=document.getElementById("analytics-chart-y"),tip=document.getElementById("analytics-tooltip");
    if(!svg)return;
    if(!rows.length){svg.innerHTML='<text x="500" y="185" text-anchor="middle" class="analytics-svg-empty">No recorded requests yet</text>';return;}
    var data=rows.slice(0,12),max=Math.max.apply(null,data.map(function(x){return x.used;}).concat([1])),w=1000,h=360,padX=48,padY=28,base=315,usableH=260;
    var pts=data.map(function(x,i){var px=data.length===1?500:padX+i*(w-padX*2)/(data.length-1);var py=base-(x.used/max)*usableH;return {x:px,y:py,d:x};});
    var line=pts.map(function(p,i){return (i?"L":"M")+" "+p.x.toFixed(1)+" "+p.y.toFixed(1);}).join(" ");
    var area=line+" L "+pts[pts.length-1].x.toFixed(1)+" "+base+" L "+pts[0].x.toFixed(1)+" "+base+" Z";
    var guides=[0,.25,.5,.75,1].map(function(v){return '<line x1="'+padX+'" y1="'+(base-v*usableH)+'" x2="'+(w-padX)+'" y2="'+(base-v*usableH)+'" class="analytics-guide"/>';}).join("");
    svg.innerHTML='<defs><linearGradient id="analyticsArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".24"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>'+guides+'<path d="'+area+'" class="analytics-area"></path><path d="'+line+'" class="analytics-line"></path>'+pts.map(function(p,i){return '<circle cx="'+p.x+'" cy="'+p.y+'" r="7" class="analytics-point" tabindex="0" data-index="'+i+'"></circle>';}).join("");
    if(yhost)yhost.innerHTML=[max,Math.round(max*.75),Math.round(max*.5),Math.round(max*.25),0].map(function(v){return '<span>'+v.toLocaleString()+'</span>';}).join("");
    if(xhost)xhost.innerHTML=data.map(function(x){return '<span title="'+esc(x.name)+'">'+esc(x.name.length>14?x.name.slice(0,13)+"…":x.name)+'</span>';}).join("");
    function show(i,el){var p=pts[i];if(!p||!tip)return;tip.innerHTML='<b>'+esc(p.d.name)+'</b><strong>'+p.d.used.toLocaleString()+' requests</strong><small>'+esc(p.d.status.toUpperCase())+'</small>';tip.style.left=(p.x/10)+'%';tip.style.top=Math.max(4,(p.y/h*100)-8)+'%';tip.classList.add("show");svg.querySelectorAll(".analytics-point").forEach(function(q){q.classList.remove("active")});if(el)el.classList.add("active");}
    function hide(){if(tip)tip.classList.remove("show");svg.querySelectorAll(".analytics-point").forEach(function(q){q.classList.remove("active")});}
    svg.querySelectorAll(".analytics-point").forEach(function(el){var i=Number(el.dataset.index);el.addEventListener("mouseenter",function(){show(i,el)});el.addEventListener("focus",function(){show(i,el)});el.addEventListener("mouseleave",hide);el.addEventListener("touchstart",function(){show(i,el)},{passive:true});});
  }

  function privateDocumentationContent(){
    return '<style>.documentation-page{display:grid;gap:18px}.documentation-hero{display:flex;justify-content:space-between;gap:25px;align-items:center;padding:30px}.documentation-hero h2{margin:5px 0 8px;font-size:30px;letter-spacing:-.045em}.documentation-hero p{max-width:760px;color:#aab7ca;font-size:12px;line-height:1.8}.documentation-hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.documentation-orb{width:110px;height:110px;flex:0 0 110px;border-radius:28px;display:grid;place-items:center;background:linear-gradient(135deg,#2563eb,#7c3aed);font-size:20px;font-weight:900;box-shadow:0 20px 45px rgba(37,99,235,.25)}.documentation-layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:18px;align-items:start}.documentation-toc{position:sticky;top:18px;padding:18px}.documentation-toc nav{display:grid;gap:3px}.documentation-toc a{display:block;padding:9px 10px;border-radius:9px;color:#9fb0d0;font-size:10px}.documentation-toc a:hover{background:#ffffff08;color:#fff}.documentation-content{display:grid;gap:15px}.doc-section{padding:27px}.doc-section h3{margin:6px 0 10px;font-size:22px;letter-spacing:-.035em}.doc-section h4{margin:22px 0 8px;color:#172033;font-size:13px}.doc-section p,.doc-section li{color:#64748b;font-size:11px;line-height:1.8}.doc-section ul,.doc-section ol{padding-left:20px}.doc-section pre{margin:14px 0;background:#071126;color:#dbeafe;padding:16px;border-radius:12px;overflow:auto;font-size:10px;line-height:1.7;border:1px solid #203858}.doc-section code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.doc-callout{margin:16px 0;padding:14px 16px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe}.doc-callout b,.doc-callout span{display:block;font-size:10px}.doc-callout b{color:#1d4ed8;margin-bottom:3px}.doc-callout span{color:#475569;line-height:1.7}.doc-table{border:1px solid #e5eaf1;border-radius:12px;overflow:hidden;margin:16px 0}.doc-table>div{display:grid;grid-template-columns:180px 1fr;border-top:1px solid #e5eaf1}.doc-table>div:first-child{border-top:0;background:#f8fafc}.doc-table>div>*{padding:10px 12px;font-size:10px;color:#475569}.doc-table>div>*+*{border-left:1px solid #e5eaf1}.doc-table b{font-weight:800;color:#334155}.doc-checklist{display:grid;gap:9px;margin:14px 0}.doc-checklist label{padding:11px 13px;border:1px solid #e5eaf1;border-radius:10px;background:#f8fafc;color:#475569;font-size:10px}.doc-footer-note{margin-top:18px;padding:15px;border-radius:12px;background:#f8fafc;border:1px solid #e5eaf1}.doc-footer-note b,.doc-footer-note span{display:block;font-size:10px}.doc-footer-note b{color:#172033;margin-bottom:4px}.doc-footer-note span{color:#64748b;line-height:1.7}@media(max-width:900px){.documentation-layout{grid-template-columns:1fr}.documentation-toc{position:relative;top:auto}.documentation-hero{align-items:flex-start}.documentation-orb{display:none}}@media(max-width:600px){.doc-section{padding:21px}.doc-table>div{grid-template-columns:1fr}.doc-table>div>*+*{border-left:0;border-top:1px solid #e5eaf1}.documentation-hero{padding:22px}.documentation-hero h2{font-size:24px}}</style><div class="documentation-page private-documentation-page">'+
      '<section class="documentation-hero glass-card"><div><span class="eyebrow">GAME API · PRIVATE DOCUMENTATION</span><h2>Developer integration reference</h2><p>This authenticated documentation is for developers working inside the Game API console. It covers credentials, requests, API usage, crash-game data, real-time connections, security and troubleshooting.</p><div class="documentation-hero-actions"><a class="primary-btn" href="api-keys.html">Manage API keys <b>→</b></a><a class="secondary-btn" href="documentation.html">Public documentation</a></div></div><div class="documentation-orb"><span>API</span></div></section>'+
      '<section class="documentation-layout">'+
        '<aside class="documentation-toc glass-card"><div class="card-head"><div><span class="card-kicker">ON THIS PAGE</span><h3>Private reference</h3></div></div><nav>'+
          '<a href="#private-overview">Overview</a><a href="#private-architecture">Architecture</a><a href="#private-auth">Authentication</a><a href="#private-keys">API keys</a><a href="#private-requests">Making requests</a><a href="#private-errors">Errors</a><a href="#private-crash">Crash API</a><a href="#private-websocket">WebSocket</a><a href="#private-usage">Usage & limits</a><a href="#private-security">Security</a><a href="#private-troubleshooting">Troubleshooting</a><a href="#private-checklist">Production checklist</a></nav></aside>'+
        '<article class="documentation-content">'+
          '<section id="private-overview" class="glass-card doc-section"><span class="card-kicker">01 · OVERVIEW</span><h3>Build with Game API</h3><p>Game API provides a developer-facing interface for applications that need game data, crash-game information and real-time events. Your application should keep credentials on a trusted server whenever possible and use the developer console to create, inspect and revoke keys.</p><div class="doc-callout"><b>Recommended architecture</b><span>Browser or mobile app → your backend → Game API. Do not expose a production secret API key in client-side JavaScript.</span></div><h4>Core services</h4><ul><li>Authenticated API access through API keys.</li><li>Developer-console management for credentials and usage.</li><li>Crash-game round data and live game events.</li><li>WebSocket connectivity for real-time integrations.</li></ul></section>'+
          '<section id="private-architecture" class="glass-card doc-section"><span class="card-kicker">02 · ARCHITECTURE</span><h3>Game API system architecture</h3><p>The diagram below shows the application path from a user or client to the Game API server, including HTTPS, WebSocket, API-key validation, REST endpoints, the crash-game engine and supported external integrations.</p><div style="margin:18px 0;border:1px solid #e5eaf1;border-radius:16px;overflow:hidden;background:#071126"><img src="assets/game-api-architecture.svg" alt="Game API system architecture diagram" style="display:block;width:100%;height:auto"></div><h4>Integration flow</h4><ol><li>Client sends an HTTPS request or opens a WebSocket connection.</li><li>Game API validates the required credential and access rules.</li><li>The request is routed to the relevant endpoint or real-time service.</li><li>Game data is fetched or the live crash-game engine produces an event.</li><li>The result is returned as JSON or delivered through WebSocket.</li></ol><div class="doc-callout"><b>Security boundary</b><span>Keep production API secrets on a trusted backend. Do not expose secret credentials in browser JavaScript or public repositories.</span></div></section><section id="private-auth" class="glass-card doc-section"><span class="card-kicker">02 · AUTHENTICATION</span><h3>Authenticate your integration</h3><p>API requests that require developer access use the API key issued to your Game API account. The developer console session is separate from the API credential used by your application.</p><h4>HTTP authorization</h4><pre><code>Authorization: Bearer YOUR_API_KEY</code></pre><p>Keep the complete secret out of public repositories, browser bundles, screenshots, logs and support tickets. If a credential is exposed, revoke it and create a replacement.</p><h4>Developer console authentication</h4><p>The console uses Supabase Auth for account sessions. Depending on the account configuration, sign-in may use password, email OTP, OAuth, passkey or additional TOTP verification.</p></section>'+
          '<section id="private-keys" class="glass-card doc-section"><span class="card-kicker">03 · API KEYS</span><h3>Manage credentials</h3><p>Use <a href="api-keys.html">API Keys</a> in the console to create, view metadata for, copy an available secret, refresh records and revoke credentials.</p><div class="doc-table"><div><b>Action</b><b>Purpose</b></div><div><span>Create</span><span>Issue a new credential for an application or environment.</span></div><div><span>Copy secret</span><span>Retrieve the secret for an active key when the backend permits it.</span></div><div><span>Revoke</span><span>Immediately disable a credential that should no longer be used.</span></div><div><span>Refresh</span><span>Reload the latest key records from the authenticated key service.</span></div></div><h4>Environment naming</h4><p>Use names such as Production, Staging, Mobile, Backend or Testing so a compromised or retired credential can be identified quickly.</p></section>'+
          '<section id="private-requests" class="glass-card doc-section"><span class="card-kicker">04 · HTTP REQUESTS</span><h3>Make your first request</h3><p>Use your API key from a server-side application. Replace the example resource with the endpoint documented for the service you are integrating.</p><pre><code>curl -X GET "https://api.game-api.online/api/keys" \\\n  -H "Accept: application/json" \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"</code></pre><p>The authenticated developer-console key-management route uses a Supabase access token. Game API application endpoints may use the API credential format documented for that service. Do not confuse a Supabase user session token with a Game API secret API key.</p><h4>Request habits</h4><ul><li>Send an explicit <code>Accept: application/json</code> header.</li><li>Send <code>Content-Type: application/json</code> for JSON request bodies.</li><li>Use timeouts and retry policies in production clients.</li><li>Never retry a request blindly when an operation may create a duplicate resource.</li></ul></section>'+
          '<section id="private-errors" class="glass-card doc-section"><span class="card-kicker">05 · ERRORS</span><h3>Handle errors safely</h3><p>Always inspect the HTTP status and parse the response body as JSON when possible. Authentication failures should trigger a controlled re-authentication or credential rotation flow rather than an infinite retry loop.</p><div class="doc-table"><div><b>Situation</b><b>What to check</b></div><div><span>401 Unauthorized</span><span>Session or API credential is missing, expired, invalid or revoked.</span></div><div><span>403 Forbidden</span><span>Credential is valid but the requested operation is not permitted.</span></div><div><span>429 Too Many Requests</span><span>Slow down and follow the service retry guidance.</span></div><div><span>5xx Server error</span><span>Retry with backoff and check Game API status before escalating.</span></div></div><pre><code>try {\n  const response = await fetch(url, options);\n  const body = await response.json();\n  if (!response.ok) throw new Error(body.error || body.message || "Request failed");\n} catch (error) {\n  console.error("Game API request failed", error);\n}</code></pre></section>'+
          '<section id="private-crash" class="glass-card doc-section"><span class="card-kicker">06 · CRASH GAME</span><h3>Crash-game integration</h3><p>The crash service operates continuously through round states such as betting, running and crash. Client applications should treat the server event stream as the source of truth rather than attempting to start or stop rounds from the browser.</p><h4>Example status event</h4><pre><code>{\n  "type": "crash_status",\n  "status": "crash",\n  "round_number": 125,\n  "multiplier": "3.47",\n  "crashed_at": "2026-09-24T08:00:00Z"\n}</code></pre><p>Consumers should handle unknown fields gracefully and should not assume a specific round number, multiplier or timestamp format beyond the documented contract.</p></section>'+
          '<section id="private-websocket" class="glass-card doc-section"><span class="card-kicker">07 · REAL TIME</span><h3>WebSocket connection</h3><p>For real-time integrations, connect to the Game API WebSocket endpoint:</p><pre><code>wss://api.game-api.online/realtime</code></pre><p>After connecting, authenticate using the mechanism required by the current WebSocket service. Handle connection closure, authentication errors and reconnects explicitly.</p><h4>Recommended client flow</h4><ol><li>Open the WebSocket connection.</li><li>Wait for the server connection response.</li><li>Authenticate with the required credential.</li><li>Subscribe or listen for supported events.</li><li>Process events idempotently.</li><li>Reconnect with exponential backoff after an unexpected close.</li></ol></section>'+
          '<section id="private-usage" class="glass-card doc-section"><span class="card-kicker">08 · USAGE</span><h3>Usage, plans and limits</h3><p>The developer console can display usage recorded against your API keys. Usage counters are associated with the key that made the request. Your plan determines the limits and access available to the account.</p><p>Because limits can change with your subscription, applications should treat the current API response and account configuration as authoritative instead of hard-coding a quota into production logic.</p><div class="doc-callout"><b>Build for limits</b><span>Cache safe read operations where appropriate, avoid unnecessary polling, and implement backoff when the service asks your client to slow down.</span></div></section>'+
          '<section id="private-security" class="glass-card doc-section"><span class="card-kicker">09 · SECURITY</span><h3>Protect your integration</h3><ul><li>Store API secrets in server-side environment variables or a secret manager.</li><li>Use separate credentials for separate applications or environments.</li><li>Rotate credentials after exposure or personnel changes.</li><li>Use HTTPS for every production HTTP request.</li><li>Do not log Authorization headers.</li><li>Do not place production secrets in GitHub repositories.</li><li>Enable MFA/TOTP and passkeys on your developer account where appropriate.</li><li>Review API-key activity and revoke credentials that are no longer required.</li></ul><h4>Secret handling example</h4><pre><code>const apiKey = process.env.GAME_API_KEY;\nif (!apiKey) throw new Error("GAME_API_KEY is not configured");</code></pre></section>'+
          '<section id="private-troubleshooting" class="glass-card doc-section"><span class="card-kicker">10 · TROUBLESHOOTING</span><h3>Common integration problems</h3><div class="doc-table"><div><b>Problem</b><b>Resolution</b></div><div><span>Invalid or revoked API key</span><span>Confirm the credential is active, then create a replacement if it was revoked or exposed.</span></div><div><span>Permission denied</span><span>Confirm the authenticated account, plan and resource permissions required by the endpoint.</span></div><div><span>WebSocket authentication error</span><span>Check the credential format, expiration/revocation state and server handshake sequence.</span></div><div><span>Unexpected HTML response</span><span>Inspect the HTTP status and server URL; an HTML response often indicates that the request reached the wrong route or host.</span></div><div><span>CORS in a browser</span><span>Prefer a server-side integration for secrets. If browser access is supported for the resource, confirm the origin is permitted by the API service.</span></div></div></section>'+
          '<section id="private-checklist" class="glass-card doc-section"><span class="card-kicker">11 · PRODUCTION CHECKLIST</span><h3>Before you go live</h3><div class="doc-checklist"><label>☐ API secret is stored outside source code</label><label>☐ Production and test credentials are separated</label><label>☐ HTTPS is enforced</label><label>☐ 401, 403, 429 and 5xx responses are handled</label><label>☐ WebSocket reconnect logic is implemented</label><label>☐ Logs do not contain secrets</label><label>☐ Usage and plan limits are monitored</label><label>☐ MFA or passkey protection is enabled for the developer account</label><label>☐ A support contact path is available to the application team</label></div><div class="doc-footer-note"><b>Need the public introduction?</b><span>Use the public documentation to understand the platform before signing in. This private reference is intended for authenticated developers working on an integration.</span></div></section>'+
        '</article></section></div>';
  }

  function privateEndpointsContent(){
    return `<style>
      .private-endpoints{display:grid;gap:18px}
      .private-endpoints .pe-hero{padding:30px}
      .private-endpoints h2{margin:7px 0 10px;font-size:30px;letter-spacing:-.04em}
      .private-endpoints h3{margin:0 0 8px;font-size:17px}
      .private-endpoints p,.private-endpoints li{color:#64748b;font-size:11px;line-height:1.8}
      .private-endpoints .pe-bases,.private-endpoints .pe-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .private-endpoints .pe-box{padding:20px}
      .private-endpoints .pe-base{padding:15px;border:1px solid #e5eaf1;border-radius:13px;background:#f8fafc}
      .private-endpoints .pe-base small{display:block;color:#64748b;font-size:9px;font-weight:800;letter-spacing:.1em;margin-bottom:7px}
      .private-endpoints code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
      .private-endpoints .pe-base code{font-size:12px;word-break:break-all}
      .private-endpoints .pe-row{display:grid;grid-template-columns:65px 1fr;gap:10px;padding:11px;border:1px solid #e5eaf1;border-radius:10px;margin-top:8px}
      .private-endpoints .method{font-size:9px;font-weight:900;text-align:center;padding:6px;border-radius:7px;background:#dbeafe;color:#1d4ed8;height:max-content}
      .private-endpoints .ws{background:#cffafe;color:#0e7490}
      .private-endpoints .path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;word-break:break-all}
      .private-endpoints .note{padding:15px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe}
      .private-endpoints .note b{display:block;color:#1d4ed8;margin-bottom:5px}
      .private-endpoints pre{background:#071126;color:#dbeafe;padding:15px;border-radius:12px;overflow:auto;font-size:10px;line-height:1.7}
      .private-endpoints .art{border:1px solid #e5eaf1;border-radius:16px;overflow:hidden;background:#f8fafc}
      .private-endpoints .art img{display:block;width:100%;height:auto}
      @media(max-width:850px){.private-endpoints .pe-bases,.private-endpoints .pe-grid{grid-template-columns:1fr}}
    </style>
    <div class="private-endpoints">
      <section class="glass-card pe-hero">
        <span class="card-kicker">PRIVATE DEVELOPER ENDPOINTS</span>
        <h2>Game API endpoint reference</h2>
        <p>Use this authenticated reference while integrating your Game API account. It covers the production REST base URL, Crash Game and Big Odd endpoints, API-key operations, subscription routes and the live WebSocket service.</p>
        <div class="pe-bases">
          <div class="pe-base"><small>REST BASE URL</small><code>https://api.game-api.online</code></div>
          <div class="pe-base"><small>WEBSOCKET</small><code>wss://api.game-api.online/realtime</code></div>
        </div>
      </section>
      <section class="glass-card pe-box art"><img src="assets/game-api-architecture.svg" alt="Game API architecture"></section>
      <section class="pe-grid">
        <article class="glass-card pe-box"><h3>System</h3><p>Public service endpoints.</p><div class="pe-row"><span class="method">GET</span><div><div class="path">/</div><small>Service information</small></div></div><div class="pe-row"><span class="method">GET</span><div><div class="path">/health</div><small>Health check</small></div></div></article>
        <article class="glass-card pe-box"><h3>Game data</h3><p>Protected game-data resources.</p><div class="pe-row"><span class="method">POST</span><div><div class="path">/api/v1/crash/rounds</div><small>API key · JSON body: { "limit": 20 }</small></div></div><div class="pe-row"><span class="method">POST</span><div><div class="path">/api/v1/big-odd/rounds</div><small>API key · JSON body: { "limit": 20 }</small></div></div></article>
        <article class="glass-card pe-box"><h3>API keys</h3><p>Developer account operations.</p><div class="pe-row"><span class="method">GET</span><div><div class="path">/api/keys</div><small>List keys</small></div></div><div class="pe-row"><span class="method">POST</span><div><div class="path">/api/keys</div><small>Create key</small></div></div><div class="pe-row"><span class="method">GET</span><div><div class="path">/api/keys/:id/secret</div><small>Recover encrypted secret</small></div></div><div class="pe-row"><span class="method">POST</span><div><div class="path">/api/keys/:id/revoke</div><small>Revoke key</small></div></div></article>
        <article class="glass-card pe-box"><h3>Account services</h3><p>Authenticated subscription and messaging operations.</p><div class="pe-row"><span class="method">GET</span><div><div class="path">/api/payments/subscription</div><small>Current subscription</small></div></div><div class="pe-row"><span class="method">POST</span><div><div class="path">/api/payments/cancel</div><small>Cancel subscription</small></div></div><div class="pe-row"><span class="method">POST</span><div><div class="path">/api/mail/contact</div><small>Routed account message</small></div></div></article>
      </section>
      <section class="glass-card pe-box">
        <span class="card-kicker">CRASH GAME</span><h3>Authenticated request</h3>
        <pre>POST https://api.game-api.online/api/v1/crash/rounds
Authorization: Bearer YOUR_GAME_API_KEY
Content-Type: application/json

{"limit":20}</pre>
        <pre>{
  "success": true,
  "game": "crash",
  "data": [
    {
      "round_number": 125,
      "status": "crash",
      "multiplier": "3.47",
      "started_at": "2026-09-24T08:00:00.000Z",
      "crashed_at": "2026-09-24T08:00:07.000Z"
    }
  ],
  "count": 1
}</pre>
      </section>
      <section class="glass-card pe-box">
        <span class="card-kicker">WEBSOCKET / REALTIME</span><h3>wss://api.game-api.online/realtime</h3>
        <p>Connect to the production realtime service. The server owns the live Crash Game lifecycle; clients consume published events.</p>
        <pre>const socket = new WebSocket("wss://api.game-api.online/realtime");

socket.onopen = () => {
  socket.send(JSON.stringify({
    type: "auth",
    apiKey: "YOUR_GAME_API_KEY"
  }));
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
};</pre>
        <div class="note"><b>Realtime channels</b><span>crash_rounds and big_odd_rounds are supported subscription channels. Crash status messages can report betting, running and crash states.</span></div>
      </section>
      <section class="glass-card pe-box">
        <span class="card-kicker">SECURITY</span><h3>Production rules</h3>
        <ul><li>Keep production API secrets on a trusted backend.</li><li>Use HTTPS and WSS in production.</li><li>Handle WebSocket reconnects and auth errors.</li><li>Do not expose private API secrets in public source repositories.</li><li>Use the public <a href="endpoints.html">Endpoints reference</a> when you need a shareable, indexable page.</li></ul>
      </section>
    </div>`;
  }

  function endpointsContent(){
    return `
      <style>
        .endpoints-page{display:grid;gap:18px}
        .endpoint-hero{position:relative;overflow:hidden;border:1px solid var(--line,#24304a);border-radius:24px;padding:28px;background:linear-gradient(135deg,rgba(47,128,255,.14),rgba(124,92,255,.08)),var(--panel,#0d1424)}
        .endpoint-hero:after{content:"";position:absolute;width:280px;height:280px;border-radius:50%;right:-90px;top:-130px;border:1px solid rgba(90,150,255,.18);box-shadow:0 0 0 35px rgba(90,150,255,.035),0 0 0 70px rgba(90,150,255,.02)}
        .endpoint-kicker{display:inline-flex;gap:8px;align-items:center;font-size:11px;font-weight:800;letter-spacing:.16em;color:#7db4ff}
        .endpoint-hero h2{margin:10px 0 8px;font-size:30px}
        .endpoint-hero p{max-width:760px;color:var(--muted,#91a0ba);line-height:1.7;margin:0}
        .endpoint-base-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:22px}
        .endpoint-base{position:relative;z-index:1;border:1px solid var(--line,#24304a);border-radius:16px;padding:16px;background:rgba(7,12,23,.5)}
        .endpoint-base span{display:block;font-size:10px;font-weight:800;letter-spacing:.12em;color:#7e8ca7;margin-bottom:8px}
        .endpoint-base code{font-size:14px;color:#eaf1ff;word-break:break-all}
        .endpoint-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
        .endpoint-card{border:1px solid var(--line,#24304a);border-radius:20px;background:var(--panel,#0d1424);padding:20px}
        .endpoint-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}
        .endpoint-card h3{margin:0 0 5px;font-size:17px}
        .endpoint-card p{margin:0;color:var(--muted,#91a0ba);font-size:13px;line-height:1.6}
        .endpoint-list{display:grid;gap:9px}
        .endpoint-row{display:grid;grid-template-columns:70px minmax(0,1fr);gap:10px;align-items:center;padding:11px 12px;border:1px solid rgba(130,150,190,.12);border-radius:12px;background:rgba(255,255,255,.018)}
        .endpoint-method{font-size:10px;font-weight:900;letter-spacing:.08em;text-align:center;padding:6px 7px;border-radius:7px;background:rgba(65,145,255,.12);color:#83b9ff}
        .endpoint-method.ws{background:rgba(157,108,255,.12);color:#b99aff}
        .endpoint-path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#e8efff;word-break:break-all}
        .endpoint-auth{display:block;color:#75839d;font-size:10px;margin-top:4px}
        .endpoint-code{border:1px solid var(--line,#24304a);border-radius:18px;background:#070c16;overflow:hidden}
        .endpoint-code-head{padding:12px 15px;border-bottom:1px solid rgba(130,150,190,.12);font-size:11px;font-weight:800;letter-spacing:.1em;color:#7e8ca7}
        .endpoint-code pre{margin:0;padding:17px;overflow:auto;color:#dce7ff;font:12px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace}
        .endpoint-note{border-left:3px solid #4e9aff;padding:14px 16px;border-radius:0 12px 12px 0;background:rgba(78,154,255,.07);color:#aebbd2;font-size:13px;line-height:1.65}
        .endpoint-note b{color:#edf4ff}
        .endpoint-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .endpoint-step{padding:15px;border:1px solid var(--line,#24304a);border-radius:15px;background:rgba(255,255,255,.018)}
        .endpoint-step strong{display:block;color:#75adff;font-size:11px;margin-bottom:7px}
        .endpoint-step b{display:block;font-size:13px;margin-bottom:4px}
        .endpoint-step span{display:block;color:#7f8da7;font-size:11px;line-height:1.5}
        @media(max-width:850px){.endpoint-grid,.endpoint-base-grid{grid-template-columns:1fr}.endpoint-flow{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:520px){.endpoint-flow{grid-template-columns:1fr}.endpoint-hero{padding:20px}.endpoint-hero h2{font-size:24px}}
      </style>
      <div class="endpoints-page">
        <section class="endpoint-hero">
          <span class="endpoint-kicker"><i class="live-dot"></i> GAME API / PRODUCTION ENDPOINTS</span>
          <h2>Connect to Game API</h2>
          <p>Use the production HTTPS API for authenticated requests and the production WebSocket for live events. API keys are required for game-data endpoints and WebSocket authentication.</p>
          <div class="endpoint-base-grid">
            <div class="endpoint-base"><span>REST API BASE URL</span><code>https://api.game-api.online</code></div>
            <div class="endpoint-base"><span>WEBSOCKET ENDPOINT</span><code>wss://api.game-api.online/realtime</code></div>
          </div>
        </section>

        <section class="endpoint-grid">
          <article class="endpoint-card">
            <div class="endpoint-card-head"><div><h3>System</h3><p>Public service information and health checks.</p></div><span class="health-badge"><i></i> Public</span></div>
            <div class="endpoint-list">
              <div class="endpoint-row"><span class="endpoint-method">GET</span><div><div class="endpoint-path">/</div><small class="endpoint-auth">Service information</small></div></div>
              <div class="endpoint-row"><span class="endpoint-method">GET</span><div><div class="endpoint-path">/health</div><small class="endpoint-auth">Health check</small></div></div>
            </div>
          </article>

          <article class="endpoint-card">
            <div class="endpoint-card-head"><div><h3>Game data</h3><p>Authenticated game-data resources.</p></div><span class="health-badge"><i></i> API key</span></div>
            <div class="endpoint-list">
              <div class="endpoint-row"><span class="endpoint-method">POST</span><div><div class="endpoint-path">/api/v1/crash/rounds</div><small class="endpoint-auth">Bearer API key · body: { "limit": 20 }</small></div></div>
              <div class="endpoint-row"><span class="endpoint-method">POST</span><div><div class="endpoint-path">/api/v1/big-odd/rounds</div><small class="endpoint-auth">Bearer API key · body: { "limit": 20 }</small></div></div>
            </div>
          </article>

          <article class="endpoint-card">
            <div class="endpoint-card-head"><div><h3>API keys & usage</h3><p>Developer-console account operations.</p></div><span class="health-badge"><i></i> Session</span></div>
            <div class="endpoint-list">
              <div class="endpoint-row"><span class="endpoint-method">GET</span><div><div class="endpoint-path">/api/keys</div><small class="endpoint-auth">Authenticated user session</small></div></div>
              <div class="endpoint-row"><span class="endpoint-method">GET</span><div><div class="endpoint-path">/api/keys/usage</div><small class="endpoint-auth">Authenticated user session</small></div></div>
              <div class="endpoint-row"><span class="endpoint-method">POST</span><div><div class="endpoint-path">/api/keys</div><small class="endpoint-auth">Authenticated user session</small></div></div>
              <div class="endpoint-row"><span class="endpoint-method">GET</span><div><div class="endpoint-path">/api/keys/:id/secret</div><small class="endpoint-auth">Authenticated user session</small></div></div>
              <div class="endpoint-row"><span class="endpoint-method">POST</span><div><div class="endpoint-path">/api/keys/:id/revoke</div><small class="endpoint-auth">Authenticated user session</small></div></div>
            </div>
          </article>

          <article class="endpoint-card">
            <div class="endpoint-card-head"><div><h3>Subscription & mail</h3><p>Account subscription and routed messaging.</p></div><span class="health-badge"><i></i> Session</span></div>
            <div class="endpoint-list">
              <div class="endpoint-row"><span class="endpoint-method">GET</span><div><div class="endpoint-path">/api/payments/subscription</div><small class="endpoint-auth">Authenticated user session</small></div></div>
              <div class="endpoint-row"><span class="endpoint-method">POST</span><div><div class="endpoint-path">/api/payments/cancel</div><small class="endpoint-auth">Authenticated user session</small></div></div>
              <div class="endpoint-row"><span class="endpoint-method">POST</span><div><div class="endpoint-path">/api/mail/contact</div><small class="endpoint-auth">Authenticated user session</small></div></div>
              <div class="endpoint-row"><span class="endpoint-method">POST</span><div><div class="endpoint-path">/api/mail/security/login</div><small class="endpoint-auth">Authenticated user session</small></div></div>
            </div>
          </article>
        </section>

        <section class="endpoint-card">
          <div class="endpoint-card-head"><div><h3>WebSocket / Real-time</h3><p>Connect directly to the Game API real-time server.</p></div><span class="health-badge"><i></i> Live</span></div>
          <div class="endpoint-base-grid">
            <div class="endpoint-base"><span>WEBSOCKET URL</span><code>wss://api.game-api.online/realtime</code></div>
            <div class="endpoint-base"><span>DEFAULT CHANNEL</span><code>crash_rounds</code></div>
          </div>
          <div class="endpoint-flow" style="margin-top:14px">
            <div class="endpoint-step"><strong>01</strong><b>Connect</b><span>Open the WebSocket URL.</span></div>
            <div class="endpoint-step"><strong>02</strong><b>Authenticate</b><span>Send an auth message with your API key when authentication is required.</span></div>
            <div class="endpoint-step"><strong>03</strong><b>Subscribe</b><span>Use crash_rounds or big_odd_rounds.</span></div>
            <div class="endpoint-step"><strong>04</strong><b>Receive</b><span>Live round events are pushed by the server.</span></div>
          </div>
        </section>

        <section class="endpoint-code">
          <div class="endpoint-code-head">HTTPS REQUEST · CRASH ROUNDS</div>
          <pre>POST https://api.game-api.online/api/v1/crash/rounds
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "limit": 20
}</pre>
        </section>

        <section class="endpoint-code">
          <div class="endpoint-code-head">WEBSOCKET · JAVASCRIPT</div>
          <pre>const socket = new WebSocket("wss://api.game-api.online/realtime");

socket.onopen = () =&gt; {
  socket.send(JSON.stringify({
    type: "auth",
    apiKey: "YOUR_API_KEY"
  }));
};

socket.onmessage = (event) =&gt; {
  const message = JSON.parse(event.data);
  console.log(message);
};</pre>
        </section>

        <div class="endpoint-note"><b>Security:</b> keep production API secrets on a trusted backend. Do not expose a secret API key in public browser code. The WebSocket server supports authenticated connections and read-only real-time subscriptions.</div>

        <section class="endpoint-card">
          <div class="endpoint-card-head"><div><h3>Common WebSocket messages</h3><p>Messages supported by the real-time server.</p></div></div>
          <div class="endpoint-list">
            <div class="endpoint-row"><span class="endpoint-method ws">EVENT</span><div><div class="endpoint-path">connected</div><small class="endpoint-auth">Initial connection message</small></div></div>
            <div class="endpoint-row"><span class="endpoint-method ws">EVENT</span><div><div class="endpoint-path">authenticated</div><small class="endpoint-auth">API key accepted</small></div></div>
            <div class="endpoint-row"><span class="endpoint-method ws">EVENT</span><div><div class="endpoint-path">crash_status</div><small class="endpoint-auth">Betting, running and crash state</small></div></div>
            <div class="endpoint-row"><span class="endpoint-method ws">SEND</span><div><div class="endpoint-path">ping</div><small class="endpoint-auth">Returns pong</small></div></div>
            <div class="endpoint-row"><span class="endpoint-method ws">SEND</span><div><div class="endpoint-path">subscribe</div><small class="endpoint-auth">Channels: crash_rounds, big_odd_rounds</small></div></div>
            <div class="endpoint-row"><span class="endpoint-method ws">SEND</span><div><div class="endpoint-path">unsubscribe</div><small class="endpoint-auth">Remove a channel subscription</small></div></div>
          </div>
        </section>
      </div>`;
  }

  function websocketContent(){
    return `
      <style>
        .ws-page{display:grid;gap:18px}
        .ws-hero{padding:28px;border:1px solid var(--line,#24304a);border-radius:24px;background:linear-gradient(135deg,rgba(47,128,255,.14),rgba(124,92,255,.08)),var(--panel,#0d1424)}
        .ws-hero h2{margin:8px 0;font-size:30px}.ws-hero p{max-width:800px;color:#91a0ba;line-height:1.7}
        .ws-url{margin-top:18px;padding:15px;border-radius:14px;background:#070c16;border:1px solid #24304a;font:13px ui-monospace;color:#dce7ff;word-break:break-all}
        .ws-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.ws-card{padding:20px;border:1px solid #24304a;border-radius:20px;background:#0d1424}
        .ws-card h3{margin:0 0 7px;font-size:17px}.ws-card p{color:#91a0ba;font-size:12px;line-height:1.6}
        .ws-form{display:grid;gap:10px}.ws-form label{font-size:10px;color:#7e8ca7;font-weight:800;letter-spacing:.08em}.ws-form input{width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #2a3854;background:#070c16;color:#e8efff;outline:none}
        .ws-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:4px}.ws-actions button{border:0;border-radius:10px;padding:11px 14px;font-weight:800;cursor:pointer}.ws-primary{background:#2563eb;color:#fff}.ws-secondary{background:#18243a;color:#dce7ff}
        .ws-status{display:flex;align-items:center;gap:8px;color:#91a0ba;font-size:11px;margin-top:8px}.ws-status i{width:8px;height:8px;border-radius:50%;background:#64748b}.ws-status.live i{background:#22c55e;box-shadow:0 0 12px #22c55e}
        .round-box{min-height:150px;padding:18px;border-radius:15px;background:#070c16;border:1px solid #24304a}.round-big{font-size:34px;font-weight:900;letter-spacing:-.04em}.round-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.round-meta div{padding:10px;border:1px solid #24304a;border-radius:10px}.round-meta span{display:block;color:#75839d;font-size:9px;text-transform:uppercase}.round-meta b{display:block;margin-top:4px;color:#e8efff;font-size:12px;word-break:break-word}
        .ws-log{height:230px;overflow:auto;background:#070c16;border:1px solid #24304a;border-radius:15px;padding:13px;font:11px/1.7 ui-monospace;color:#b9c7df}.ws-log div{border-bottom:1px solid #17233a;padding:5px 0}
        .ws-code{margin:0;background:#070c16;color:#dce7ff;border:1px solid #24304a;border-radius:15px;padding:16px;overflow:auto;font:11px/1.7 ui-monospace}
        .ws-note{padding:14px;border-left:3px solid #4e9aff;border-radius:0 12px 12px 0;background:rgba(78,154,255,.07);color:#aebbd2;font-size:12px;line-height:1.7}
        @media(max-width:850px){.ws-grid{grid-template-columns:1fr}.round-meta{grid-template-columns:1fr}}
      </style>
      <div class="ws-page">
        <section class="ws-hero">
          <span class="endpoint-kicker"><i class="live-dot"></i> REALTIME GAME API</span>
          <h2>WebSocket & Live Round Monitor</h2>
          <p>Use the production WebSocket for live updates, or use the authenticated REST endpoint to fetch the latest/current round and look up a specific round number.</p>
          <div class="ws-url">wss://api.game-api.online/realtime</div>
        </section>

        <section class="ws-grid">
          <article class="ws-card">
            <h3>Connect to live rounds</h3>
            <p>Enter an API key, connect, and listen for <code>crash_status</code> messages. The latest round is updated automatically as events arrive.</p>
            <div class="ws-form">
              <label for="ws-api-key">GAME API KEY</label>
              <input id="ws-api-key" type="password" autocomplete="off" placeholder="Paste your API key">
              <div class="ws-actions"><button class="ws-primary" id="ws-connect">Connect</button><button class="ws-secondary" id="ws-disconnect">Disconnect</button></div>
              <div class="ws-status" id="ws-status"><i></i><span>Disconnected</span></div>
            </div>
          </article>

          <article class="ws-card">
            <h3>Current round</h3>
            <p>Fetch the latest round directly from the Crash Game REST endpoint. After connecting, WebSocket events continue to update this card live.</p>
            <div class="ws-actions"><button class="ws-primary" id="ws-fetch-current">Fetch current round</button></div>
            <div class="round-box" id="ws-current-round"><div class="round-big">—</div><div class="round-meta"><div><span>Status</span><b>Waiting</b></div><div><span>Multiplier</span><b>—</b></div><div><span>Updated</span><b>—</b></div></div></div>
          </article>

          <article class="ws-card">
            <h3>Get a specific round</h3>
            <p>Enter a round number. The page requests recent Crash Game rounds and searches the returned records for that exact round.</p>
            <div class="ws-form">
              <label for="ws-round-number">ROUND NUMBER</label>
              <input id="ws-round-number" inputmode="numeric" type="number" min="1" placeholder="125">
              <button class="ws-primary" id="ws-get-round">Get round</button>
              <div id="ws-round-result" class="round-box"><div class="round-big">—</div><div class="round-meta"><div><span>Status</span><b>Enter a round number</b></div><div><span>Multiplier</span><b>—</b></div><div><span>Crash time</span><b>—</b></div></div></div>
            </div>
          </article>

          <article class="ws-card">
            <h3>Connection events</h3>
            <p>Realtime messages and REST lookup results appear here for debugging.</p>
            <div class="ws-log" id="ws-log"><div>Waiting for connection…</div></div>
          </article>
        </section>

        <section class="ws-card">
          <h3>Integration example</h3>
          <pre class="ws-code">const socket = new WebSocket("wss://api.game-api.online/realtime");

socket.onopen = () =&gt; {
  socket.send(JSON.stringify({
    type: "auth",
    apiKey: "YOUR_GAME_API_KEY"
  }));
};

socket.onmessage = event =&gt; {
  const message = JSON.parse(event.data);
  if (message.type === "crash_status") {
    console.log("Current round:", message.round_number);
    console.log("Status:", message.status);
    console.log("Multiplier:", message.multiplier);
  }
};</pre>
          <div class="ws-note"><b>Security:</b> the private console tool does not save the API key to your account. Keep production API keys on your trusted backend and never commit them to source control.</div>
        </section>
      </div>`;
  }

  function initWebsocketPage(){
    var socket=null;
    var keyInput=document.getElementById("ws-api-key");
    var status=document.getElementById("ws-status");
    var current=document.getElementById("ws-current-round");
    var roundInput=document.getElementById("ws-round-number");
    var roundResult=document.getElementById("ws-round-result");
    var log=document.getElementById("ws-log");
    function writeLog(value){
      if(!log)return;
      var line=document.createElement("div");
      line.textContent=new Date().toLocaleTimeString()+"  "+(typeof value==="string"?value:JSON.stringify(value));
      log.prepend(line);
    }
    function setStatus(text,live){
      if(status){status.className="ws-status"+(live?" live":"");status.querySelector("span").textContent=text;}
    }
    function renderCurrent(m){
      if(!current)return;
      current.innerHTML='<div class="round-big">#'+esc(m.round_number||"—")+'</div><div class="round-meta"><div><span>Status</span><b>'+esc(m.status||"—")+'</b></div><div><span>Multiplier</span><b>'+esc(m.multiplier||"—")+'</b></div><div><span>Updated</span><b>'+esc(new Date().toLocaleTimeString())+'</b></div></div>';
    }
    function connect(){
      var apiKey=String(keyInput&&keyInput.value||"").trim();
      if(!apiKey){alert("Enter your Game API key first.");return;}
      if(socket){try{socket.close();}catch(e){}}
      setStatus("Connecting…",false); writeLog("Opening WebSocket…");
      socket=new WebSocket("wss://api.game-api.online/realtime");
      socket.onopen=function(){
        setStatus("Connected — authenticating",true); writeLog({type:"open"});
        socket.send(JSON.stringify({type:"auth",apiKey:apiKey}));
      };
      socket.onmessage=function(event){
        var message;
        try{message=JSON.parse(event.data);}catch(e){writeLog(event.data);return;}
        writeLog(message);
        if(message.type==="crash_status" || message.round_number!=null){
          renderCurrent(message);
        }
        if(message.type==="auth_error") setStatus("Authentication error",false);
      };
      socket.onerror=function(){setStatus("WebSocket error",false);writeLog("WebSocket error");};
      socket.onclose=function(){setStatus("Disconnected",false);writeLog("Connection closed");socket=null;};
    }
    function disconnect(){if(socket){socket.close();socket=null;}setStatus("Disconnected",false);}
    async function getRound(){
      var apiKey=String(keyInput&&keyInput.value||"").trim(), n=Number(roundInput&&roundInput.value);
      if(!apiKey){alert("Enter your Game API key first.");return;}
      if(!n){alert("Enter a round number.");return;}
      roundResult.innerHTML='<div class="round-big">Loading…</div><div class="round-meta"><div><span>Status</span><b>Fetching</b></div><div><span>Round</span><b>#'+esc(n)+'</b></div><div><span>Source</span><b>REST API</b></div></div>';
      try{
        var response=await fetch("https://api.game-api.online/api/v1/crash/rounds",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},body:JSON.stringify({limit:100})});
        var data=await response.json().catch(function(){return{};});
        if(!response.ok) throw new Error(data.error||data.message||("HTTP "+response.status));
        var rows=Array.isArray(data.data)?data.data:[];
        var found=rows.find(function(r){return Number(r.round_number)===n;});
        if(!found) throw new Error("Round #"+n+" was not included in the latest "+rows.length+" returned rounds.");
        roundResult.innerHTML='<div class="round-big">#'+esc(found.round_number)+'</div><div class="round-meta"><div><span>Status</span><b>'+esc(found.status||"—")+'</b></div><div><span>Multiplier</span><b>'+esc(found.multiplier||"—")+'</b></div><div><span>Crash time</span><b>'+esc(found.crashed_at||found.ended_at||"—")+'</b></div></div>';
        writeLog({type:"round_lookup",round_number:n,success:true});
      }catch(e){
        roundResult.innerHTML='<div class="round-big">Not found</div><div class="round-meta"><div><span>Result</span><b>'+esc(e.message||"Request failed")+'</b></div><div><span>Round</span><b>#'+esc(n)+'</b></div><div><span>Source</span><b>REST API</b></div></div>';
        writeLog({type:"round_lookup",success:false,error:e.message});
      }
    }
    var connectBtn=document.getElementById("ws-connect"), disconnectBtn=document.getElementById("ws-disconnect"), getBtn=document.getElementById("ws-get-round");
    if(connectBtn)connectBtn.onclick=connect;
    if(disconnectBtn)disconnectBtn.onclick=disconnect;
    if(getBtn)getBtn.onclick=getRound;
  }

  function genericContent(key){
    if(key==="overview") return overviewContent();
    if(key==="usage") return usageContent();
    if(key==="keys") return apiKeysContent();
    if(key==="profile") return profileContent();
    if(key==="authentication") return authenticationContent();
    if(key==="security") return securityContent();
    if(key==="analytics") return analyticsContent();
    if(key==="private-documentation") return privateDocumentationContent();
    if(key==="how-to-use-gameapi") return howToUseContent();
    if(key==="private-how-to-use-gameapi") return privateHowToUseContent();
    if(key==="private-endpoints") return privateEndpointsContent();
    if(key==="endpoints") return endpointsContent();
    var m=META[key] || META.dashboard;
    return '<div class="module-page"><section class="module-banner"><div><span class="eyebrow">GAME API · MODULE</span><h2>'+esc(m[0])+'</h2><p>'+esc(m[1])+'</p></div><div class="module-orb"><span>'+esc(m[0].charAt(0))+'</span></div></section>'+
      '<section class="module-layout"><div class="glass-card module-main"><div class="card-head"><div><span class="card-kicker">CONNECTED</span><h3>'+esc(m[0])+' workspace</h3><p>This page uses the authenticated developer console shell.</p></div><span class="health-badge"><i></i> Authenticated</span></div><div class="module-actions"><button id="module-test" class="primary-btn">Run module check <b>→</b></button><a href="how-to-use-gameapi.html" class="secondary-btn">How to use Game API</a></div><div class="module-status"><div><span>Environment</span><b>Production</b></div><div><span>Access</span><b>Authenticated</b></div><div><span>Interface</span><b>Responsive</b></div></div></div>'+
      '<aside class="glass-card quick-panel"><div class="card-head"><div><span class="card-kicker">QUICK CONTROL</span><h3>Workspace</h3></div></div><button class="quick-control" id="chat-left">Move chat left <span>←</span></button><button class="quick-control" id="chat-right">Move chat right <span>→</span></button><button class="quick-control" id="collapse">Toggle sidebar <span>☰</span></button></aside></section></div>';
  }

  function boot(){
    var app=document.getElementById("app");
    if(!app) throw new Error("Dashboard mount #app was not found.");
    var key=pageKey(), meta=META[key]||META.dashboard, u=getUser();
    if(key==="login"){
      app.innerHTML=loginContent();
      var temp=document.getElementById("temporary-login");
      if(temp) temp.onclick=function(){location.href="dashboard.html";};
      return;
    }
    if(key==="dashboard"){
      connectSupabase().then(function(sb){
        if(!sb) return;
        sb.auth.getSession().then(function(result){
          if(!result.data || !result.data.session) location.replace("login.html");
        }).catch(function(){ location.replace("login.html"); });
      });
    }
    var name=u.name||u.full_name||u.fullName||u.display_name||u.username||"Developer", email=u.email||"developer@example.com", initial=(name.charAt(0)||"D").toUpperCase();

    app.innerHTML =
      '<div class="app-shell">'+
        '<aside class="sidebar" id="sidebar">'+
          '<div class="brand"><div class="brand-mark"><span>G</span><i></i></div><div class="brand-copy"><b>Game API</b><small>Developer Console</small></div><button class="sidebar-close" id="sidebar-close">×</button></div>'+
          '<div class="workspace-status"><span><i></i> PLATFORM ONLINE</span><b>v1.0</b></div>'+
          '<nav class="sidebar-nav">'+renderGroups(key)+'</nav>'+
          '<div class="sidebar-bottom"><button class="chat-launch" id="chat-open"><span class="chat-icon">◌</span><span><b>Chat with us</b><small>Support is available</small></span><i>→</i></button><div class="sidebar-mini"><span>SECURE WORKSPACE</span><i>●</i></div></div>'+
        '</aside>'+
        '<div class="mobile-backdrop" id="mobile-backdrop"></div>'+
        '<main class="workspace">'+
          '<header class="topbar">'+
            '<div class="top-left"><button class="menu-btn" id="menu-btn" aria-label="Open navigation"><span></span><span></span><span></span></button><div class="breadcrumbs"><span>Developer Console</span><b>/</b><strong>'+esc(meta[0])+'</strong></div></div>'+
            '<div class="top-right"><button class="top-icon" title="Notifications">♢<i></i></button><div class="account"><button class="account-btn" id="account-btn"><span class="avatar">'+initial+'</span><span class="account-meta"><b>'+esc(name)+'</b><small>'+esc(email)+'</small></span><span class="account-chevron">⌄</span></button><div class="account-menu" id="account-menu"><div class="account-menu-head"><span class="avatar small">'+initial+'</span><div><b>'+esc(name)+'</b><small>'+esc(email)+'</small></div></div><a href="profile.html">○ My Profile <span>→</span></a><a href="subscription.html">▣ Subscription <span>→</span></a><button id="logout">↪ Sign out <span>→</span></button></div></div></div>'+
          '</header>'+
          '<div class="page-content"><div class="page-title-row"><div><span class="page-kicker">GAME API / '+esc(meta[0].toUpperCase())+'</span><h1>'+esc(meta[0])+'</h1><p>'+esc(meta[1])+'</p></div><div class="page-live"><i></i> Live platform</div></div>'+
            (key==="dashboard"?dashboardContent():key==="logs"?logsContent():key==="keys"?apiKeysContent():key==="login"?loginContent():genericContent(key))+
          '</div>'+
        '</main>'+
        '<div class="chat-panel" id="chat-panel" data-side="right"><div class="chat-head"><div><span class="chat-avatar">G</span><div><b>Game API Support</b><small><i></i> Usually replies quickly</small></div></div><button id="chat-close">×</button></div><div class="chat-body" id="chat-messages"><div class="bubble agent">Hello! Welcome to Game API support. How can we help you today?</div></div><form id="chat-form"><input id="chat-input" placeholder="Write a message…" autocomplete="off"><button>➤</button></form></div>'+
      '</div>';

    bind(key); saveChatSide(loadChatSide());
    refreshAuthenticatedChrome();
    if(key==="dashboard"){
      connectSupabase().then(async function(sb){
        if(!sb) return;
        try{
          var result=await sb.auth.getSession();
          if(!result.data||!result.data.session){
            location.replace("login.html");
            return;
          }
          var user=result.data.session.user||{};
          var md=user.user_metadata||{};
          var realName=md.full_name||md.name||md.user_name||md.preferred_username||((user.email||"").split("@")[0])||"Developer";
          var realEmail=user.email||"";
          var fresh={name:realName,email:realEmail,id:user.id,avatar:md.avatar_url||md.picture||""};
          localStorage.setItem("gameapi_user",JSON.stringify(fresh));
          var realInitial=(realName.charAt(0)||"D").toUpperCase();
          document.querySelectorAll(".account-meta b,.account-menu-head b").forEach(function(el){el.textContent=realName;});
          document.querySelectorAll(".account-meta small,.account-menu-head small").forEach(function(el){el.textContent=realEmail;});
          document.querySelectorAll(".avatar").forEach(function(el){el.textContent=realInitial;});
          var accountAvatar=document.querySelector(".account-btn .avatar");
          if(accountAvatar&&fresh.avatar){
            accountAvatar.innerHTML='<img src="'+esc(fresh.avatar)+'" alt="" style="width:100%;height:100%;border-radius:inherit;object-fit:cover">';
          }
          var menuAvatar=document.querySelector(".account-menu-head .avatar");
          if(menuAvatar&&fresh.avatar){
            menuAvatar.innerHTML='<img src="'+esc(fresh.avatar)+'" alt="" style="width:100%;height:100%;border-radius:inherit;object-fit:cover">';
          }
        }catch(e){
          console.warn("Unable to load authenticated Game API user:",e);
        }
      });
    }
    if(key==="dashboard"){
      initDashboardLive();
    }
    if(key==="overview"){
      initOverviewLive();
    }
    if(key==="usage"){
      initUsageLive();
    }
    if(key==="keys"){
      initApiKeys();
    }
    if(key==="profile"){
      initProfile();
    }
    if(key==="authentication" || key==="security"){
      initAuthSecurity(key);
    }
    if(key==="analytics"){
      initAnalytics();
    }
    if(key==="websocket"){
      initWebsocketPage();
    }
    if(key==="login"){
      var temp=document.getElementById("temporary-login");
      if(temp) temp.onclick=function(){location.href="dashboard.html";};
    }
  }

  function renderDashboardRecentKey(rows){
    var host=document.getElementById("dashboard-recent-key");
    if(!host)return;
    if(!rows.length){
      host.innerHTML='<div class="dashboard-empty"><b>No API keys found</b><span>Create an API key to connect your application to Game API.</span></div>';
      return;
    }
    var latest=rows.slice().sort(function(a,b){return new Date(b.created_at||0)-new Date(a.created_at||0);})[0];
    var status=String(latest.status||"active").toLowerCase();
    var prefix=latest.key_prefix||latest.prefix||"gk_live";
    var last=latest.key_last4||latest.last4||"";
    var safeKey=prefix+(last?"_••••••••"+last:"_••••••••");
    var issued=latest.created_at?new Date(latest.created_at):null;
    var issuedText=issued&&!isNaN(issued.getTime())?issued.toLocaleString():"—";
    host.innerHTML='<div class="recent-key-main"><div class="recent-key-icon">⌘</div><div class="recent-key-copy"><b>'+esc(latest.name||"Unnamed key")+'</b><code>'+esc(safeKey)+'</code><small>Issued '+esc(issuedText)+'</small></div><span class="recent-key-status '+(status==="revoked"?"revoked":"active")+'">'+esc(status.toUpperCase())+'</span></div>';
  }

  function renderDashboardKeyChart(rows){
    var host=document.getElementById("dashboard-key-chart"),badge=document.getElementById("dashboard-chart-badge");
    if(!host)return;
    var data=rows.map(function(x){return {name:x.name||"Unnamed key",used:Number(x.requests_used||0)};});
    var total=data.reduce(function(sum,x){return sum+x.used;},0);
    var max=Math.max.apply(null,data.map(function(x){return x.used;}).concat([1]));
    if(badge)badge.innerHTML='<i></i> '+total+' requests';
    if(!rows.length){
      host.innerHTML='<div class="dashboard-empty"><b>No API key usage yet</b><span>The chart will populate when your API keys have recorded requests.</span></div>';
      return;
    }
    host.innerHTML='<div class="dashboard-chart-axis"><span>Requests</span><b>This month</b></div><div class="dashboard-chart-bars">'+data.slice(0,8).map(function(x){
      var height=Math.max(8,Math.round((x.used/max)*100));
      return '<div class="dashboard-chart-bar-wrap" title="'+esc(x.name)+' · '+x.used+' requests"><div class="dashboard-chart-value">'+x.used+'</div><div class="dashboard-chart-bar" style="height:'+height+'%"></div><span>'+esc(x.name)+'</span></div>';
    }).join("")+'</div>';
  }

  function initDashboardLive(){
    var statusUrl="https://x-api.game-api.online/api/v1/status";

    function setMetric(index,value){
      var cards=document.querySelectorAll(".real-metrics .metric");
      if(cards[index]){
        var strong=cards[index].querySelector("strong");
        if(strong)strong.textContent=value;
      }
    }

    function setWelcome(name){
      var el=document.getElementById("dashboard-welcome");
      if(!el)return;
      el.innerHTML="Welcome back, <span>"+esc(name)+"</span>.";
    }

    fetch(statusUrl,{method:"GET",headers:{"Accept":"application/json"}})
      .then(function(r){return r.text().then(function(t){return {ok:r.ok,status:r.status,text:t};});})
      .then(function(result){
        var operational=result.ok && result.status>=200 && result.status<300;
        var label=operational?"Operational":"Unavailable";
        var health=document.getElementById("dashboard-api-health");
        var badge=document.getElementById("dashboard-health-badge");
        var score=document.getElementById("dashboard-health-score");
        var bars=document.getElementById("dashboard-health-bars");
        var liveStatus=document.getElementById("live-service-status");
        var footerService=document.getElementById("live-footer-service");
        var footerStatus=document.getElementById("live-footer-status");
        if(health)health.textContent=label;
        if(badge)badge.innerHTML='<i></i> '+esc(label);
        if(score)score.innerHTML=operational?'OK<small>LIVE</small>':'—<small>CHECK</small>';
        if(bars)bars.innerHTML=Array.from({length:12}).map(function(){return '<i></i>';}).join("");
        if(liveStatus)liveStatus.textContent=label.toUpperCase();
        if(footerService)footerService.textContent="Game API";
        if(footerStatus){
          footerStatus.textContent=label;
          footerStatus.className=operational?"live-green":"";
        }
        setMetric(1,label);
      })
      .catch(function(){
        var health=document.getElementById("dashboard-api-health");
        if(health)health.textContent="Unavailable";
        var badge=document.getElementById("dashboard-health-badge");
        if(badge)badge.innerHTML='<i></i> Unavailable';
        var score=document.getElementById("dashboard-health-score");
        if(score)score.innerHTML='—<small>CHECK</small>';
        var liveStatus=document.getElementById("live-service-status");
        if(liveStatus)liveStatus.textContent="UNAVAILABLE";
        setMetric(1,"Unavailable");
      });

    connectSupabase().then(async function(sb){
      if(!sb)return;
      try{
        var result=await sb.auth.getSession();
        if(!result.data || !result.data.session){
          location.replace("login.html");
          return;
        }

        var session=result.data.session;
        var user=session.user||{};
        var md=user.user_metadata||{};
        var provider=(user.app_metadata&&user.app_metadata.provider)||"email";
        var realName=md.full_name||md.name||md.user_name||md.preferred_username||((user.email||"").split("@")[0])||"Developer";
        var realEmail=user.email||"";

        setWelcome(realName);
        setMetric(0,"Connected");

        var n=document.getElementById("dashboard-user-name");
        var e=document.getElementById("dashboard-user-email");
        var id=document.getElementById("dashboard-user-id");
        var p=document.getElementById("dashboard-user-provider");
        var sub=document.getElementById("dashboard-user-subtitle");
        if(n)n.textContent=realName;
        if(e)e.textContent=realEmail;
        if(id)id.textContent=user.id||"";
        if(p)p.textContent=provider;
        if(sub)sub.textContent="Signed in as "+(realEmail||realName)+".";

        try{
          var response=await fetch("https://api.game-api.online/api/keys",{
            method:"GET",
            headers:{
              "Accept":"application/json",
              "Authorization":"Bearer "+session.access_token
            }
          });
          var raw=await response.text();
          var payload={};
          try{payload=raw?JSON.parse(raw):{};}catch(ignore){}
          if(response.status===401){
            location.replace("login.html");
            return;
          }
          if(!response.ok) throw new Error(payload.error||payload.message||("Key service returned HTTP "+response.status));
          var rows=Array.isArray(payload)?payload:(Array.isArray(payload.keys)?payload.keys:(Array.isArray(payload.data)?payload.data:[]));
          var active=rows.filter(function(x){return String(x.status||"active").toLowerCase()==="active";}).length;
          setMetric(2,String(rows.length));

          var totalUsage=rows.reduce(function(sum,x){return sum+Number(x.requests_used||0);},0);
          setMetric(3,String(totalUsage));
          var keySummary=document.getElementById("dashboard-key-summary");
          if(keySummary)keySummary.textContent=active+" active · "+rows.length+" total";
          var keyAction=document.getElementById("dashboard-key-action");
          if(keyAction)keyAction.textContent=active?"Manage API keys":"Create your first API key";

          var recent=rows.slice().sort(function(a,b){return new Date(b.created_at||0)-new Date(a.created_at||0);})[0];
          var recentEl=document.getElementById("dashboard-recent-key");
          if(recentEl){
            if(recent){
              var prefix=recent.key_prefix||recent.prefix||"gk_live";
              var last4=recent.key_last4||recent.last4||"";
              var safePrefix=prefix+(last4?"_••••••••"+last4:"_••••••••");
              var recentStatus=String(recent.status||"active").toLowerCase();
              var recentPlan=String(recent.plan||"free").toUpperCase();
              var issued=recent.created_at?new Date(recent.created_at).toLocaleString():"—";
              recentEl.innerHTML='<div class="key-snapshot-main"><div class="key-snapshot-icon">⌘</div><div class="key-snapshot-copy"><b>'+esc(recent.name||"Unnamed key")+'</b><code>'+esc(safePrefix)+'</code></div><span class="key-snapshot-status '+(recentStatus==="active"?"active":"revoked")+'">'+esc(recentStatus.toUpperCase())+'</span></div><div class="key-snapshot-meta"><div><span>ISSUED</span><b>'+esc(issued)+'</b></div><div><span>PLAN</span><b>'+esc(recentPlan)+'</b></div><div><span>USAGE</span><b>'+esc(String(recent.requests_used||0))+' requests</b></div></div>';
            }else{
              recentEl.innerHTML='<div class="dashboard-empty"><b>No API key yet</b><span>Create your first key and it will appear here.</span></div>';
            }
          }

          var chart=document.getElementById("dashboard-key-chart");
          var chartBadge=document.getElementById("dashboard-chart-badge");
          if(chart){
            var chartRows=rows.slice().sort(function(a,b){return Number(b.requests_used||0)-Number(a.requests_used||0);}).slice(0,6);
            if(!chartRows.length){
              chart.innerHTML='<div class="dashboard-empty"><b>No usage data yet</b><span>Request counts will appear here after your API keys are used.</span></div>';
            }else{
              var maxUsage=Math.max.apply(null,chartRows.map(function(x){return Number(x.requests_used||0);} ).concat([1]));
              chart.innerHTML=chartRows.map(function(x){
                var used=Number(x.requests_used||0);
                var width=Math.max(3,Math.round((used/maxUsage)*100));
                var label=(x.name||"Unnamed key").slice(0,22);
                return '<div class="usage-chart-row"><div class="usage-chart-top"><span title="'+esc(x.name||"Unnamed key")+'">'+esc(label)+'</span><b>'+esc(String(used))+'</b></div><div class="usage-chart-track"><i style="width:'+width+'%"></i></div></div>';
              }).join("");
            }
          }
          if(chartBadge)chartBadge.innerHTML='<i></i> Live data';

          renderDashboardRecentKey(rows);
          renderDashboardKeyChart(rows);
        }catch(keyError){
          setMetric(2,"—");
          var keySummary=document.getElementById("dashboard-key-summary");
          if(keySummary)keySummary.textContent="Key service unavailable";
        }
      }catch(e){
        console.warn("Dashboard authenticated data refresh failed:",e);
      }
    });
  }

  function initOverviewLive(){
    fetch("https://x-api.game-api.online/api/v1/status",{method:"GET",headers:{"Accept":"application/json"}})
      .then(function(r){return {ok:r.ok,status:r.status};})
      .then(function(result){
        var operational=result.ok&&result.status>=200&&result.status<300;
        var label=operational?"Operational":"Unavailable";
        var s=document.getElementById("overview-api-status"),d=document.getElementById("overview-api-detail"),b=document.getElementById("overview-api-badge"),i=document.getElementById("overview-api-icon");
        if(s)s.textContent=label;
        if(d)d.textContent=operational?"Production API responded successfully":"Production API returned HTTP "+result.status;
        if(b)b.innerHTML='<i></i> '+label;
        if(i)i.textContent=operational?"✓":"!";
        var m=document.querySelector(".overview-metrics .metric:nth-child(2) strong");if(m)m.textContent=label;
      }).catch(function(){
        var s=document.getElementById("overview-api-status"),d=document.getElementById("overview-api-detail"),b=document.getElementById("overview-api-badge");
        if(s)s.textContent="Unavailable";if(d)d.textContent="Unable to reach the production API";if(b)b.innerHTML="<i></i> Unavailable";
      });
    connectSupabase().then(async function(sb){
      if(!sb)return;
      try{
        var result=await sb.auth.getSession();if(!result.data||!result.data.session)return;
        var user=result.data.session.user||{},md=user.user_metadata||{},name=md.full_name||md.name||md.user_name||((user.email||"").split("@")[0])||"Developer",provider=(user.app_metadata&&user.app_metadata.provider)||"email";
        var n=document.getElementById("overview-name"),e=document.getElementById("overview-email"),id=document.getElementById("overview-user-id"),p=document.getElementById("overview-provider"),a=document.getElementById("overview-avatar");
        if(n)n.textContent=name;if(e)e.textContent=user.email||"";if(id)id.textContent=user.id||"";if(p)p.textContent=provider;if(a){a.textContent=(name.charAt(0)||"D").toUpperCase();if(md.avatar_url)a.innerHTML='<img src="'+esc(md.avatar_url)+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">';}
        var m=document.querySelector(".overview-metrics .metric:first-child strong");if(m)m.textContent="Connected";
      }catch(e){console.warn("Overview user load failed:",e);}
    });
  }

  function refreshAuthenticatedChrome(){
    connectSupabase().then(async function(sb){
      if(!sb)return;
      try{
        var result=await sb.auth.getSession(),session=result.data&&result.data.session;
        if(!session)return;
        var user=session.user||{},md=user.user_metadata||{};
        var name=md.full_name||md.name||md.user_name||md.preferred_username||((user.email||"").split("@")[0])||"Developer";
        var email=user.email||"", avatar=md.avatar_url||md.picture||"";
        var initial=(name.charAt(0)||"D").toUpperCase();
        var fresh={name:name,email:email,id:user.id||"",avatar:avatar};
        localStorage.setItem("gameapi_user",JSON.stringify(fresh));
        document.querySelectorAll(".account-meta b,.account-menu-head b").forEach(function(el){el.textContent=name;});
        document.querySelectorAll(".account-meta small,.account-menu-head small").forEach(function(el){el.textContent=email;});
        document.querySelectorAll(".avatar").forEach(function(el){
          if(avatar)el.innerHTML='<img src="'+esc(avatar)+'" alt="Profile photo" style="width:100%;height:100%;border-radius:inherit;object-fit:cover">';
          else el.textContent=initial;
        });
      }catch(e){console.warn("Authenticated chrome refresh failed:",e);}
    });
  }

  function bind(key){
    document.querySelectorAll(".nav-section-head").forEach(function(btn){
      btn.addEventListener("click",function(){
        var section=btn.parentElement, submenu=section.querySelector(".nav-submenu");
        var open=submenu.classList.contains("open");
        document.querySelectorAll(".nav-submenu.open").forEach(function(x){if(x!==submenu)x.classList.remove("open");});
        submenu.classList.toggle("open",!open);
        section.classList.toggle("is-open",!open);
      });
    });

    var menu=document.getElementById("menu-btn"), side=document.getElementById("sidebar"), back=document.getElementById("mobile-backdrop");
    menu.onclick=function(){side.classList.add("mobile-open");back.classList.add("show");};
    document.getElementById("sidebar-close").onclick=function(){side.classList.remove("mobile-open");back.classList.remove("show");};
    back.onclick=function(){side.classList.remove("mobile-open");back.classList.remove("show");};

    document.getElementById("account-btn").onclick=function(){document.getElementById("account-menu").classList.toggle("open");};
    document.addEventListener("click",function(e){if(!e.target.closest(".account"))document.getElementById("account-menu").classList.remove("open");});

    document.getElementById("logout").onclick=async function(){
      localStorage.removeItem("gameapi_user");
      try{var sb=await connectSupabase();if(sb)await sb.auth.signOut();}catch(e){}
      window.location.href="login.html";
    };

    document.getElementById("chat-open").onclick=function(){document.getElementById("chat-panel").classList.add("open");};
    document.getElementById("chat-close").onclick=function(){document.getElementById("chat-panel").classList.remove("open");};

    document.getElementById("chat-form").onsubmit=function(e){
      e.preventDefault();var input=document.getElementById("chat-input"),v=input.value.trim();if(!v)return;
      document.getElementById("chat-messages").insertAdjacentHTML("beforeend",'<div class="bubble me">'+esc(v)+'</div>');
      input.value="";notify("success","Message ready","Your support message has been added to the conversation.");
    };

    if(key==="logs") initLogs();
    if(key==="websocket") initWebsocketPage();

    var left=document.getElementById("chat-left"),right=document.getElementById("chat-right");
    if(left)left.onclick=function(){saveChatSide("left");document.getElementById("chat-panel").classList.add("left");notify("success","Chat moved","Support chat is now on the left.");};
    if(right)right.onclick=function(){saveChatSide("right");document.getElementById("chat-panel").classList.remove("left");notify("success","Chat moved","Support chat is now on the right.");};
    var collapse=document.getElementById("collapse");
    if(collapse)collapse.onclick=function(){side.classList.toggle("collapsed");};

    var test=document.getElementById("module-test");
    if(test)test.onclick=function(){notify("success","Module check passed",(META[key]||META.dashboard)[0]+" is responding inside the developer console.");};
  }

  window.addEventListener("error",function(e){notify("error","Page error",e.message||"Unexpected error");});
  window.addEventListener("unhandledrejection",function(e){notify("error","Operation failed",e.reason&&e.reason.message?e.reason.message:String(e.reason||"Unhandled error"));});

  async function enforceAuthGate(key){
    if(key==="login") return true;
    var sb=await connectSupabase();
    if(!sb){location.replace("login.html");return false;}
    try{
      var sessionResult=await sb.auth.getSession();
      var session=sessionResult.data&&sessionResult.data.session;
      if(!session){location.replace("login.html");return false;}
      var aalResult=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if(aalResult.error) throw aalResult.error;
      var aal=aalResult.data||{};
      if(key!=="entertotp" && aal.currentLevel==="aal1" && aal.nextLevel==="aal2"){
        location.replace("entertotp.html");
        return false;
      }
      return true;
    }catch(e){
      console.warn("Authentication gate check failed:",e);
      location.replace("login.html");
      return false;
    }
  }

  document.addEventListener("DOMContentLoaded",async function(){
    try{
      var loader=document.createElement("div");
      loader.className="page-loader";
      loader.innerHTML='<div class="loader-content"><div class="loader-logo">G<span></span></div><strong>Game API</strong><small>Preparing developer workspace</small><div class="loader-track"><i></i></div></div>';
      document.body.appendChild(loader);
      var key=pageKey();
      var allowed=await enforceAuthGate(key);
      if(!allowed)return;
      boot();
      // Hide the global loader as soon as the dashboard shell is ready.\n      // Logs and other page data must not keep the workspace animation visible.\n      loader.classList.add("hide");\n      setTimeout(function(){if(loader.parentNode)loader.remove();},420);
    }catch(e){
      var a=document.getElementById("app");
      if(a)a.innerHTML='<div class="fatal"><div><h2>Game API could not load</h2><pre>'+esc(e.stack||e.message||e)+'</pre><button onclick="location.reload()">Reload workspace</button></div></div>';
    }
  });
})();