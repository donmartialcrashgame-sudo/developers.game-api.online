(function () {
  "use strict";

  var GROUPS = [
    { id:"main", label:"MAIN", icon:"◈", items:[
      ["Dashboard","index.html","⌂","dashboard"],
      ["Overview","overview.html","◌","overview"],
      ["API Usage","usage.html","▥","usage"],
      ["Analytics","analytics.html","◒","analytics"]
    ]},
    { id:"api", label:"API", icon:"⌁", items:[
      ["API Keys","api-keys.html","⌘","keys"],
      ["Documentation","documentation.html","▤","documentation"],
      ["How to Use Game API","how-to-use-gameapi.html","?","how-to-use-gameapi"],
      ["Endpoints","endpoints.html","↗","endpoints"],
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
    "how-to-use-gameapi":["How to Use Game API","Step-by-step guide to authenticate, create a key and make your first request"],
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
    return !p ? "login" : p === "index" ? "login" : p;
  }

  var SUPABASE_URL="https://qbagxeqquskkjksoraiz.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY="sb_publishable_chfRxHSFPSA1SZJtBajtKA_I7vs8R--";
  var supabaseClientPromise=null;

  function connectSupabase(){
    if(supabaseClientPromise) return supabaseClientPromise;
    supabaseClientPromise=import("https://esm.sh/@supabase/supabase-js@2.105.0")
      .then(function(mod){
        var client=mod.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
          auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
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
    var body=document.getElementById("logs-body"), search=document.getElementById("logs-search"), method=document.getElementById("logs-method"), status=document.getElementById("logs-status");
    var detail=document.getElementById("log-detail-backdrop"), detailContent=document.getElementById("log-detail-content"), detailTitle=document.getElementById("log-detail-title");
    var logs=[];
    function sample(){return [
      {id:"demo-1",time:"10:42:18",method:"GET",endpoint:"/api/v1/crash/rounds",status:200,responseTime:"42 ms",key:"gk_live_••••91",request:{headers:{"content-type":"application/json","authorization":"Bearer ********"}},body:{},response:{success:true,game:"crash",data:[]}},
      {id:"demo-2",time:"10:41:55",method:"POST",endpoint:"/api/v1/crash/bet",status:200,responseTime:"58 ms",key:"gk_live_••••91",request:{headers:{"content-type":"application/json"}},body:{amount:100},response:{success:true,message:"Bet accepted"}},
      {id:"demo-3",time:"10:40:21",method:"GET",endpoint:"/api/v1/status",status:200,responseTime:"31 ms",key:"gk_live_••••91",request:{headers:{}},body:{},response:{success:true,status:"operational"}},
      {id:"demo-4",time:"10:39:07",method:"WS",endpoint:"/realtime",status:101,responseTime:"Live",key:"gk_live_••••91",request:{headers:{}},body:null,response:{type:"connected",authenticated:true}}
    ];}
    function escJson(v){try{return JSON.stringify(v,null,2)}catch(e){return String(v)}}
    function render(){
      var q=(search.value||"").toLowerCase(), m=method.value, s=status.value;
      var filtered=logs.filter(function(x){return (!m||x.method===m)&&(!s||String(x.status).charAt(0)===s)&&(!q||(x.endpoint+" "+x.method+" "+x.status+" "+x.key).toLowerCase().indexOf(q)>-1)});
      if(!filtered.length){body.innerHTML='<tr><td colspan="7"><div class="logs-empty"><b>No requests found</b><span>Try changing your filters or refresh the logs.</span></div></td></tr>';return;}
      body.innerHTML=filtered.map(function(x){var ok=x.status<400||x.status===101;return '<tr class="log-row" data-id="'+x.id+'"><td class="log-time">'+x.time+'</td><td><span class="method '+(ok?"green":"pink")+'">'+x.method+'</span></td><td><b class="log-endpoint">'+x.endpoint+'</b></td><td><span class="log-status '+(ok?"ok":"error")+'">'+x.status+'</span></td><td>'+x.responseTime+'</td><td><code>'+x.key+'</code></td><td><span class="row-arrow">›</span></td></tr>';}).join("");
      body.querySelectorAll(".log-row").forEach(function(row){row.onclick=function(){var x=logs.find(function(a){return a.id===row.dataset.id});if(!x)return;detailTitle.textContent=x.method+" "+x.endpoint;detailContent.innerHTML='<div class="detail-grid"><div><span>STATUS</span><b>'+x.status+'</b></div><div><span>RESPONSE TIME</span><b>'+x.responseTime+'</b></div><div><span>API KEY</span><b>'+x.key+'</b></div><div><span>TIME</span><b>'+x.time+'</b></div></div><div class="detail-section"><span>REQUEST HEADERS</span><pre>'+esc(escJson(x.request&&x.request.headers||{}))+'</pre></div><div class="detail-section"><span>REQUEST BODY</span><pre>'+esc(escJson(x.body))+'</pre></div><div class="detail-section response-block"><span>ACTUAL RESPONSE</span><pre>'+esc(escJson(x.response))+'</pre></div>';detail.classList.add("open");};});
    }
    function load(){
      body.innerHTML='<tr><td colspan="7"><div class="logs-empty"><b>Loading logs…</b><span>Reading recorded API activity.</span></div></td></tr>';
      /* The real logging endpoint can be configured without changing the UI. */
      var endpoint=localStorage.getItem("gameapi_logs_endpoint");
      if(!endpoint){logs=sample();render();return;}
      fetch(endpoint,{credentials:"include"}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(function(data){logs=Array.isArray(data)?data:(data.data||data.logs||[]);render();}).catch(function(){logs=[];body.innerHTML='<tr><td colspan="7"><div class="logs-empty error"><b>Unable to load live logs</b><span>Set the logging endpoint in API Configuration, then refresh.</span></div></td></tr>';});
    }
    search.oninput=render;method.onchange=render;status.onchange=render;document.getElementById("logs-refresh").onclick=load;
    document.getElementById("log-detail-close").onclick=function(){detail.classList.remove("open");};detail.onclick=function(e){if(e.target===detail)detail.classList.remove("open");};
    load();
  }

  function saveChatSide(side){
    try{localStorage.setItem("gameapi_chat_side",side);}catch(e){}
    document.documentElement.setAttribute("data-chat-side",side);
  }

  function loadChatSide(){
    try{return localStorage.getItem("gameapi_chat_side")||"right";}catch(e){return "right";}
  }

  function notify(type,title,msg){
    var host=document.getElementById("alerts");
    if(!host){
      host=document.createElement("div");
      host.id="alerts";
      host.className="alerts";
      document.body.appendChild(host);
    }
    var n=document.createElement("div");
    n.className="alert "+type;
    n.innerHTML='<span class="alert-mark">'+(type==="error"?"!":type==="success"?"✓":"i")+'</span><div class="alert-copy"><b>'+esc(title)+'</b><span>'+esc(msg||"")+'</span></div><button aria-label="Close">×</button>';
    n.querySelector("button").onclick=function(){n.remove();};
    host.appendChild(n);
    setTimeout(function(){if(n.parentNode)n.remove();},5500);
  }

  function renderGroups(key){
    var html="";
    GROUPS.forEach(function(g){
      var active=g.items.some(function(x){return x[3]===key;});
      html += '<section class="nav-section '+(active?"is-active":"")+'" data-group="'+g.id+'">';
      html += '<button class="nav-section-head" type="button"><span class="nav-section-chevron">›</span><span class="nav-section-name">'+g.label+'</span><span class="nav-section-icon">'+g.icon+'</span></button>';
      html += '<div class="nav-submenu '+(active?"open":"")+'">';
      g.items.forEach(function(x){
        html += '<a class="nav-link '+(key===x[3]?"active":"")+'" href="'+x[1]+'" title="'+esc(x[0])+'"><span class="nav-link-icon">'+x[2]+'</span><span class="nav-link-text">'+esc(x[0])+'</span>'+(key===x[3]?'<i class="active-pulse"></i>':"")+'</a>';
      });
      html += '</div></section>';
    });
    return html;
  }

  function dashboardContent(){
    return '<div class="dashboard-home">'+
      '<section class="hero-card">'+
        '<div class="hero-noise"></div><div class="hero-grid"></div>'+
        '<div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> GAME API · AUTHENTICATED WORKSPACE</div>'+
        '<h2>Your developer workspace, <span>connected to your account.</span></h2>'+
        '<p>Manage your real Game API account, credentials and integrations from one workspace. Live values are loaded from your authenticated session and connected services — no sample activity is shown.</p>'+
        '<div class="hero-actions"><a href="api-keys.html" class="primary-btn">Manage API Keys <b>→</b></a><a href="documentation.html" class="secondary-btn">Read documentation</a><a href="how-to-use-gameapi.html" class="secondary-btn">How to use Game API</a></div></div>'+
        '<div class="hero-visual"><div class="visual-glow"></div><div class="signal-ring r1"></div><div class="signal-ring r2"></div><div class="signal-ring r3"></div><div class="signal-core"><span>G</span><i></i></div><div class="float-chip chip-a">ACCOUNT <b>LIVE</b></div><div class="float-chip chip-b">AUTH <b>CONNECTED</b></div><div class="float-chip chip-c">API <b>ONLINE</b></div></div>'+
      '</section>'+
      '<section class="metric-grid real-metrics">'+
        metric("ACCOUNT","Connected","Authenticated session","●","blue","Live"), metric("API STATUS","Checking…","api.game-api.online","●","green","Live"), metric("API KEYS","—","Connected key records","⌘","purple","Live data"), metric("USAGE","—","Awaiting usage source","◫","orange","Live data")+
      '</section>'+
      '<section class="dashboard-grid">'+
        '<div class="glass-card activity-card"><div class="card-head"><div><span class="card-kicker">REAL-TIME</span><h3>API activity</h3><p>Only connected activity is shown here.</p></div><a href="logs.html">View logs →</a></div><div class="activity-list" id="dashboard-activity"><div class="dashboard-empty"><b>Live activity source not connected</b><span>No demo requests are displayed. Connect the real logging source to populate this panel.</span></div></div></div>'+
        '<div class="glass-card health-card"><div class="card-head"><div><span class="card-kicker">SYSTEM</span><h3>Service health</h3><p>Live status from the Game API service</p></div><span class="health-badge" id="dashboard-health-badge"><i></i> Checking</span></div><div class="health-visual"><div class="health-score" id="dashboard-health-score">—<small></small></div><div class="health-bars health-bars-live" id="dashboard-health-bars"></div></div><div class="health-footer"><span>API</span><b id="dashboard-api-health">Checking</b><span>WebSocket</span><b>Configured</b></div></div>'+
      '</section>'+
      '<section class="glass-card account-summary"><div class="card-head"><div><span class="card-kicker">YOUR ACCOUNT</span><h3 id="dashboard-user-heading">Authenticated developer</h3><p id="dashboard-user-subtitle">Loading your Supabase account details…</p></div><a href="profile.html">View profile →</a></div><div class="account-summary-grid"><div><span>NAME</span><b id="dashboard-user-name">Loading…</b></div><div><span>EMAIL</span><b id="dashboard-user-email">Loading…</b></div><div><span>USER ID</span><b id="dashboard-user-id">Loading…</b></div><div><span>AUTH PROVIDER</span><b id="dashboard-user-provider">Loading…</b></div></div></section>'+
      '<section class="live-monitor glass-card"><div class="live-monitor-head"><div><span class="card-kicker">WORKSPACE FLOW</span><h3>Build with Game API</h3><p>A clear path from account setup to your first live integration.</p></div><span class="stream-status"><i></i> READY</span></div><div class="dashboard-flow"><a href="how-to-use-gameapi.html"><span>01</span><b>Learn the flow</b><small>Authentication, API keys and requests</small><i>→</i></a><a href="api-keys.html" id="dashboard-key-action-wrap"><span>02</span><b id="dashboard-key-action">Create an API key</b><small id="dashboard-key-summary">Checking your API keys…</small><i>→</i></a><a href="documentation.html"><span>03</span><b>Choose an endpoint</b><small>Follow the request and response documentation</small><i>→</i></a><a href="logs.html"><span>04</span><b>Inspect activity</b><small>Review real recorded requests when available</small><i>→</i></a></div></section>'+
      '<section class="glass-card tools-card"><div class="card-head"><div><span class="card-kicker">WORKSPACE</span><h3>Developer tools</h3><p>Jump into the tools you use most</p></div></div><div class="tool-grid">'+
        tool("⌘","API Keys","Create, rotate and revoke credentials","api-keys.html","blue")+tool("?","How to Use Game API","Follow the complete integration guide","how-to-use-gameapi.html","purple")+tool("⌁","WebSocket","Inspect live real-time events","websocket.html","blue")+tool("▤","Documentation","Learn the API reference","documentation.html","green")+
      '</div></section>'+
      '</div>';
  }

  function liveMonitor(){
    return '<section class="live-monitor glass-card"><div class="live-monitor-head"><div><span class="card-kicker">LIVE SERVICE</span><h3>Game API connection</h3><p>The dashboard checks the production API status without inventing round or request data.</p></div><span class="stream-status"><i></i> LIVE CHECK</span></div><div class="monitor-stage"><div class="monitor-grid"></div><div class="monitor-core"><span id="live-multiplier">API</span><small id="live-service-label">STATUS CHECK</small></div><div class="monitor-dot d1"></div><div class="monitor-dot d2"></div><div class="monitor-dot d3"></div><div class="monitor-chip mc1">SERVICE <b id="live-service-status">CHECKING</b></div><div class="monitor-chip mc2">SOURCE <b>GAME API</b></div><div class="monitor-chip mc3">MODE <b>LIVE</b></div></div><div class="monitor-footer"><div><span>SERVICE</span><b id="live-footer-service">Checking</b></div><div><span>STATUS</span><b id="live-footer-status" class="live-green">Checking</b></div><div><span>SOURCE</span><b>api.game-api.online</b></div><div><span>AUTH</span><b class="live-green">Authenticated</b></div></div></section>';
  }

  function metric(label,value,sub,icon,cls,trend){
    return '<div class="metric '+cls+'"><div class="metric-icon">'+icon+'</div><div class="metric-copy"><span>'+label+'</span><strong>'+value+'</strong><small>'+sub+'</small></div><em>'+trend+'</em></div>';
  }
  function activity(method,path,status,time,cls){
    return '<div class="activity-row"><span class="method '+cls+'">'+method+'</span><div class="activity-main"><b>'+path+'</b><small>'+time+' response time</small></div><span class="request-status '+cls+'">'+status+'</span><span class="row-arrow">›</span></div>';
  }
  function tool(icon,title,desc,href,cls){
    return '<a class="tool-item '+cls+'" href="'+href+'"><span class="tool-icon">'+icon+'</span><span><b>'+title+'</b><small>'+desc+'</small></span><i>↗</i></a>';
  }

  function loginContent(){
    return '<div class="login-page"><section class="login-card"><div class="login-logo"><span>G</span></div><span class="eyebrow">GAME API · DEVELOPER CONSOLE</span><h2>Welcome back</h2><p>Sign in access will be connected later. For now, this screen is only the temporary entry point for the developer console.</p><form class="login-form" onsubmit="return false"><label>Email address</label><input type="email" placeholder="you@example.com" autocomplete="email"><label>Password</label><input type="password" placeholder="Your password" autocomplete="current-password"><button class="primary-btn" type="button" id="temporary-login">Continue to dashboard <b>→</b></button></form><div class="login-note">Authentication setup is intentionally deferred.</div></section></div>';
  }

  function logsContent(){
    return '<div class="logs-page">'
      + '<section class="glass-card logs-toolbar"><div class="logs-toolbar-main"><div><span class="card-kicker">API ACTIVITY</span><h3>Request logs</h3><p>Every recorded API call appears here. Click a request to inspect the actual response.</p></div><button class="primary-btn" id="logs-refresh">Refresh logs <b>↻</b></button></div><div class="logs-filters"><input id="logs-search" placeholder="Search endpoint, method, status or API key…"><select id="logs-method"><option value="">All methods</option><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>WS</option></select><select id="logs-status"><option value="">All status</option><option value="2">2xx Success</option><option value="4">4xx Client error</option><option value="5">5xx Server error</option></select></div></section>'
      + '<section class="glass-card logs-table-card"><div class="logs-table-wrap"><table class="logs-table"><thead><tr><th>TIME</th><th>METHOD</th><th>ENDPOINT</th><th>STATUS</th><th>RESPONSE</th><th>API KEY</th><th></th></tr></thead><tbody id="logs-body"><tr><td colspan="7"><div class="logs-empty"><b>Loading logs…</b><span>Connecting to the API logging system.</span></div></td></tr></tbody></table></div></section>'
      + '<div class="log-detail-backdrop" id="log-detail-backdrop"><section class="log-detail-panel"><div class="log-detail-head"><div><span class="card-kicker">REQUEST DETAILS</span><h3 id="log-detail-title">API request</h3></div><button id="log-detail-close">×</button></div><div id="log-detail-content"></div></section></div>'
      + '</div>';
  }

  function howToUseContent(){
    return '<div class="guide-page">'+
      '<section class="guide-hero glass-card"><div><span class="eyebrow">GAME API · GETTING STARTED</span><h2>How to use Game API</h2><p>Follow these steps to authenticate, create an API key, make requests and inspect your integration.</p></div><a class="primary-btn" href="api-keys.html">Create API key <b>→</b></a></section>'+
      '<section class="guide-grid">'+
        guideStep("01","Sign in","Use your real Game API developer account. The dashboard uses your authenticated Supabase session and displays your account identity.","login.html","Sign in")+
        guideStep("02","Create an API key","Open API Keys and create a credential for your application. Keep secret keys private and rotate them when necessary.","keys.html","Open API Keys")+
        guideStep("03","Choose an endpoint","Use the API documentation to select the resource your application needs. Follow the documented HTTP method, path, parameters and response format.","documentation.html","Open documentation")+
        guideStep("04","Send your request","Send the request from your server or trusted application using the API key required by the endpoint. Never expose secret credentials in public client code.","documentation.html","View request docs")+
        guideStep("05","Use real-time features","When your integration requires live events, follow the WebSocket documentation and use the exact production WebSocket endpoint configured for your workspace.","websocket.html","Open WebSocket")+
        guideStep("06","Inspect your activity","Use Logs to inspect recorded requests when the real logging source is available. The dashboard does not insert sample requests into your activity.","logs.html","View logs")+
      '</section>'+
      '<section class="glass-card guide-checklist"><div class="card-head"><div><span class="card-kicker">BEFORE YOU GO LIVE</span><h3>Integration checklist</h3><p>Keep credentials secure and verify each part of your integration.</p></div></div><div class="check-grid"><div><b>✓</b><span>Authenticated Game API account</span></div><div><b>✓</b><span>API key created and stored securely</span></div><div><b>✓</b><span>Endpoint selected from the documentation</span></div><div><b>✓</b><span>Error and response handling implemented</span></div><div><b>✓</b><span>WebSocket configured only when required</span></div><div><b>✓</b><span>Real request activity verified in Logs</span></div></div></section>'+
      '</div>';
  }
  function guideStep(num,title,desc,href,label){
    return '<article class="guide-step glass-card"><span class="guide-number">'+num+'</span><div><h3>'+title+'</h3><p>'+desc+'</p><a href="'+href+'">'+label+' →</a></div></article>';
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
    fetch("https://api.game-api.online/api/v1/status",{method:"GET",headers:{"Accept":"application/json"}})
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
        '<div><span class="eyebrow">GAME API · CREDENTIALS</span><h2>Your API keys</h2><p>Manage the real credentials issued to your Game API account. Each key shows its name, issued date, status and last recorded use.</p></div>'+
        '<div class="keys-hero-actions"><button class="secondary-btn" id="keys-copy-active">Copy active key</button><button class="primary-btn" id="keys-create">+ Create new key</button></div>'+
      '</section>'+
      '<section class="metric-grid keys-metrics">'+
        metric("API KEYS","—","All issued key records","⌘","blue","Live")+
        metric("ACTIVE","—","Keys currently usable","●","green","Live")+
        metric("REVOKED","—","Keys no longer usable","×","purple","Live")+
        metric("LAST USED","—","Latest recorded activity","◷","orange","Live")+
      '</section>'+
      '<section class="glass-card keys-list-card">'+
        '<div class="card-head"><div><span class="card-kicker">ISSUED CREDENTIALS</span><h3>API key records</h3><p>These records come from the authenticated Game API account.</p></div>'+
        '<div class="keys-toolbar"><button class="secondary-btn small" id="keys-refresh">Refresh ↻</button><span class="usage-badge" id="keys-source-badge"><i></i> Loading</span></div></div>'+
        '<div id="api-keys-list" class="api-keys-list"><div class="keys-empty"><b>Loading API keys…</b><span>Reading the real credentials attached to your account.</span></div></div>'+
      '</section>'+
      '<section class="keys-security-grid">'+
        '<div class="glass-card key-security"><span class="key-security-icon">◇</span><div><b>Keep your API secret private</b><p>Use the secret only where it is trusted. Never expose it in browser code or public repositories.</p></div></div>'+
        '<div class="glass-card key-security"><span class="key-security-icon">↻</span><div><b>Revoke compromised keys</b><p>Revoke an exposed key immediately. You can then create a replacement from this same page.</p></div></div>'+
      '</section>'+
      '<div class="keys-modal" id="keys-create-modal"><div class="keys-dialog"><button class="keys-dialog-close" id="keys-create-close">×</button><span class="eyebrow">NEW CREDENTIAL</span><h3>Create API key</h3><p>Give the key a clear name so you can identify the application that uses it.</p><label>KEY NAME<input id="keys-name" maxlength="80" placeholder="e.g. Production server"></label><div class="keys-dialog-actions"><button class="secondary-btn" id="keys-create-cancel">Cancel</button><button class="primary-btn" id="keys-generate">Generate key</button></div></div></div>'+
      '<div class="keys-modal" id="keys-secret-modal"><div class="keys-dialog"><button class="keys-dialog-close" id="keys-secret-close">×</button><span class="eyebrow">API SECRET</span><h3>Copy your API key</h3><p>The backend returned this real secret for your key. Keep it private.</p><div class="keys-secret-value" id="keys-secret-value"></div><div class="keys-warning">Never place your secret in frontend code or commit it to a public repository.</div><div class="keys-dialog-actions"><button class="secondary-btn" id="keys-secret-copy">Copy key</button><button class="primary-btn" id="keys-secret-done">Done</button></div></div></div>'+
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

  function genericContent(key){
    if(key==="overview") return overviewContent();
    if(key==="usage") return usageContent();
    if(key==="keys") return apiKeysContent();
    if(key==="how-to-use-gameapi") return howToUseContent();
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
    if(key==="login"){
      var temp=document.getElementById("temporary-login");
      if(temp) temp.onclick=function(){location.href="dashboard.html";};
    }
  }

  function initDashboardLive(){
    var statusUrl="https://api.game-api.online/api/v1/status";

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
          var keySummary=document.getElementById("dashboard-key-summary");
          if(keySummary)keySummary.textContent=active+" active · "+rows.length+" total";
          var keyAction=document.getElementById("dashboard-key-action");
          if(keyAction)keyAction.textContent=active?"Manage API keys":"Create your first API key";
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
    fetch("https://api.game-api.online/api/v1/status",{method:"GET",headers:{"Accept":"application/json"}})
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

  document.addEventListener("DOMContentLoaded",function(){
    try{
      var loader=document.createElement("div");
      loader.className="page-loader";
      loader.innerHTML='<div class="loader-content"><div class="loader-logo">G<span></span></div><strong>Game API</strong><small>Preparing developer workspace</small><div class="loader-track"><i></i></div></div>';
      document.body.appendChild(loader);
      boot();
      requestAnimationFrame(function(){setTimeout(function(){loader.classList.add("hide");setTimeout(function(){if(loader.parentNode)loader.remove();},420);},520);});
    }catch(e){
      var a=document.getElementById("app");
      if(a)a.innerHTML='<div class="fatal"><div><h2>Game API could not load</h2><pre>'+esc(e.stack||e.message||e)+'</pre><button onclick="location.reload()">Reload workspace</button></div></div>';
    }
  });
})();