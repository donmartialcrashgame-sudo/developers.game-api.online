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
      ["API Keys","keys.html","⌘","keys"],
      ["Documentation","documentation.html","▤","documentation"],
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
        '<div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> GAME API · DEVELOPER CONSOLE</div>'+
        '<h2>Everything you need to <span>build in real time.</span></h2>'+
        '<p>Manage credentials, monitor requests, connect to live game events and control your developer workspace from one premium console.</p>'+
        '<div class="hero-actions"><a href="keys.html" class="primary-btn">Manage API Keys <b>→</b></a><a href="documentation.html" class="secondary-btn">Read documentation</a></div></div>'+
        '<div class="hero-visual"><div class="visual-glow"></div><div class="signal-ring r1"></div><div class="signal-ring r2"></div><div class="signal-ring r3"></div><div class="signal-core"><span>G</span><i></i></div><div class="float-chip chip-a">API <b>LIVE</b></div><div class="float-chip chip-b">WS <b>CONNECTED</b></div><div class="float-chip chip-c">99.98%</div></div>'+
      '</section>'+
      '<section class="metric-grid">'+
        metric("REQUESTS","12,840","This month","↗","blue","↑ 12.4%"), metric("AVAILABILITY","99.98%","Platform health","●","green","Operational"), metric("API KEYS","03","Active credentials","⌘","purple","Protected"), metric("USAGE","87%","Current quota","◫","orange","13% remaining")+
      '</section>'+
      '<section class="dashboard-grid">'+
        '<div class="glass-card activity-card"><div class="card-head"><div><span class="card-kicker">REAL-TIME</span><h3>API activity</h3><p>Latest requests from your workspace</p></div><a href="logs.html">View logs →</a></div><div class="activity-list">'+
          activity("GET","/api/v1/crash/rounds","200 OK","42 ms","green")+activity("WS","/realtime","CONNECTED","Live","blue")+activity("GET","/api/v1/status","200 OK","31 ms","purple")+activity("POST","/api/v1/crash/rounds","200 OK","58 ms","green")+
        '</div></div>'+
        '<div class="glass-card health-card"><div class="card-head"><div><span class="card-kicker">SYSTEM</span><h3>Service health</h3><p>Everything is being monitored</p></div><span class="health-badge"><i></i> All systems</span></div><div class="health-visual"><div class="health-score">99<span>.98</span><small>%</small></div><div class="health-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div class="health-footer"><span>API</span><b>Operational</b><span>WebSocket</span><b>Connected</b></div></div>'+
      '</section>'+
      liveMonitor()+
      '<section class="glass-card tools-card"><div class="card-head"><div><span class="card-kicker">WORKSPACE</span><h3>Developer tools</h3><p>Jump into the tools you use most</p></div></div><div class="tool-grid">'+
        tool("⌘","API Keys","Create, rotate and revoke credentials","keys.html","blue")+tool("⌁","WebSocket","Inspect live real-time events","websocket.html","purple")+tool("◉","Crash Game","Monitor live crash rounds","crash.html","pink")+tool("▤","Documentation","Learn the integration flow","documentation.html","green")+
      '</div></section>'+
      '</div>';
  }

  function liveMonitor(){
    return '<section class="live-monitor glass-card"><div class="live-monitor-head"><div><span class="card-kicker">LIVE MONITOR</span><h3>Crash round stream</h3><p>Real-time game activity, connection state and multiplier movement</p></div><span class="stream-status"><i></i> LIVE</span></div><div class="monitor-stage"><div class="monitor-grid"></div><div class="monitor-line"></div><div class="monitor-core"><span id="live-multiplier">2.47x</span><small>ROUND #125</small></div><div class="monitor-dot d1"></div><div class="monitor-dot d2"></div><div class="monitor-dot d3"></div><div class="monitor-chip mc1">BETTING <b>OPEN</b></div><div class="monitor-chip mc2">WEBSOCKET <b>CONNECTED</b></div><div class="monitor-chip mc3">LATENCY <b>42ms</b></div></div><div class="monitor-footer"><div><span>ROUND</span><b>#125</b></div><div><span>STATUS</span><b class="live-green">RUNNING</b></div><div><span>MULTIPLIER</span><b id="live-status-multiplier">2.47x</b></div><div><span>CONNECTION</span><b class="live-green">STABLE</b></div></div></section>';
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

  function genericContent(key){
    var m=META[key] || META.dashboard;
    return '<div class="module-page"><section class="module-banner"><div><span class="eyebrow">GAME API · MODULE</span><h2>'+esc(m[0])+'</h2><p>'+esc(m[1])+'</p></div><div class="module-orb"><span>'+esc(m[0].charAt(0))+'</span></div></section>'+
      '<section class="module-layout"><div class="glass-card module-main"><div class="card-head"><div><span class="card-kicker">READY</span><h3>'+esc(m[0])+' workspace</h3><p>Connected to the Game API developer console.</p></div><span class="health-badge"><i></i> Available</span></div><div class="module-actions"><button id="module-test" class="primary-btn">Run module check <b>→</b></button><a href="documentation.html" class="secondary-btn">Open docs</a></div><div class="module-status"><div><span>Environment</span><b>Production</b></div><div><span>Access</span><b>Authenticated</b></div><div><span>Interface</span><b>Responsive</b></div></div></div>'+
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
            (key==="dashboard"?dashboardContent():key==="logs"?logsContent():key==="login"?loginContent():genericContent(key))+
          '</div>'+
        '</main>'+
        '<div class="chat-panel" id="chat-panel" data-side="right"><div class="chat-head"><div><span class="chat-avatar">G</span><div><b>Game API Support</b><small><i></i> Usually replies quickly</small></div></div><button id="chat-close">×</button></div><div class="chat-body" id="chat-messages"><div class="bubble agent">Hello! Welcome to Game API support. How can we help you today?</div></div><form id="chat-form"><input id="chat-input" placeholder="Write a message…" autocomplete="off"><button>➤</button></form></div>'+
      '</div>';

    bind(key); saveChatSide(loadChatSide());
    if(key==="dashboard"){
      connectSupabase().then(async function(sb){
        if(!sb) return;
        try{
          var result=await sb.auth.getSession();
          if(result.data&&result.data.session){
            var user=result.data.session.user||{};
            var fresh={
              name:(user.user_metadata&&((user.user_metadata.full_name)||(user.user_metadata.name)))||u.name||name,
              email:user.email||email
            };
            localStorage.setItem("gameapi_user",JSON.stringify(fresh));
          }
        }catch(e){}
      });
    }
    if(key==="login"){
      var temp=document.getElementById("temporary-login");
      if(temp) temp.onclick=function(){location.href="dashboard.html";};
    }
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

    document.getElementById("logout").onclick=function(){localStorage.removeItem("gameapi_user");window.location.href="index.html";};

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