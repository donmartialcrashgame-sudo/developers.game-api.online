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
    var body=document.getElementById("logs-body"),search=document.getElementById("logs-search");
    var detail=document.getElementById("log-detail-backdrop"),detailContent=document.getElementById("log-detail-content"),detailTitle=document.getElementById("log-detail-title"),refresh=document.getElementById("logs-refresh");
    var logs=[],timer=null,busy=false;

    function escJson(v){try{return JSON.stringify(v,null,2)}catch(e){return String(v)}}
    function formatTime(v){
      var d=new Date(v);
      return isNaN(d.getTime())?String(v):d.toLocaleString();
    }
    function keyLabel(x){
      var prefix=x.key_prefix||"gapi";
      var last4=x.key_last4?("••••"+x.key_last4):"";
      return prefix+(last4?" · "+last4:"");
    }
    function normalize(row,i){
      return {
        id:String(row.api_key_id||("key-activity-"+i)),
        time:row.usage_updated_at||row.last_used_at||row.period_start||new Date().toISOString(),
        keyName:row.api_key_name||"Unnamed API key",
        key:keyLabel(row),
        keyId:row.api_key_id||"—",
        status:String(row.api_key_status||"unknown"),
        plan:String(row.plan||"free"),
        requests:Number(row.request_count||0),
        lastUsed:row.last_used_at||null,
        createdAt:row.api_key_created_at||null,
        expiresAt:row.expires_at||null,
        period:row.period_start||null
      };
    }
    function render(){
      var q=(search.value||"").toLowerCase();
      var filtered=logs.filter(function(x){
        return !q||(x.keyName+" "+x.key+" "+x.keyId+" "+x.plan+" "+x.status).toLowerCase().indexOf(q)>-1;
      });
      if(!filtered.length){
        body.innerHTML='<tr><td colspan="7"><div class="logs-empty"><b>No API-key activity found</b><span>Your API keys and recorded request usage will appear here.</span></div></td></tr>';
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
      if(!logs.length)body.innerHTML='<tr><td colspan="7"><div class="logs-empty"><b>Loading API-key activity…</b><span>Reading your authenticated Supabase usage records.</span></div></td></tr>';
      try{
        var sb=await connectSupabase();
        if(!sb)throw new Error("Supabase client unavailable");
        var sessionResult=await sb.auth.getSession();
        var session=sessionResult.data&&sessionResult.data.session;
        if(!session)throw new Error("Not authenticated");
        var result=await sb.from("developer_api_activity").select("*").order("usage_updated_at",{ascending:false,nullsFirst:false}).order("last_used_at",{ascending:false,nullsFirst:false});
        if(result.error)throw result.error;
        logs=(result.data||[]).map(normalize);
        render();
      }catch(e){
        console.error("API activity logs failed:",e);
        if(!logs.length){
          body.innerHTML='<tr><td colspan="7"><div class="logs-empty error"><b>API-key activity unavailable</b><span>We could not read your authenticated Supabase usage records.</span></div></td></tr>';
        }
      }finally{busy=false;}
    }
    search.oninput=render;
    refresh.onclick=function(){load();};
    document.getElementById("log-detail-close").onclick=function(){detail.classList.remove("open");};
    detail.onclick=function(e){if(e.target===detail)detail.classList.remove("open");};
    load();
    timer=setInterval(load,5000);
    window.addEventListener("beforeunload",function(){if(timer)clearInterval(timer);});
  }function logsContent(){
    return '<div class="logs-page">'+
      '<section class="glass-card logs-toolbar"><div class="logs-toolbar-main"><div><span class="card-kicker">API KEY ACTIVITY</span><h3>API usage logs</h3><p>Live usage information for the API keys connected to your account. No crash-round data is shown here.</p></div><button class="primary-btn" id="logs-refresh">Refresh activity <b>↻</b></button></div><div class="logs-filters"><input id="logs-search" placeholder="Search API key, prefix, plan or status…"></div></section>'+
      '<section class="glass-card logs-table-card"><div class="logs-table-wrap"><table class="logs-table"><thead><tr><th>UPDATED</th><th>API KEY</th><th>KEY</th><th>STATUS</th><th>REQUESTS</th><th>PLAN</th><th></th></tr></thead><tbody id="logs-body"><tr><td colspan="7"><div class="logs-empty"><b>Loading API-key activity…</b><span>Reading your authenticated usage records.</span></div></td></tr></tbody></table></div></section>'+
      '<div class="log-detail-backdrop" id="log-detail-backdrop"><section class="log-detail-panel"><div class="log-detail-head"><div><span class="card-kicker">API KEY DETAILS</span><h3 id="log-detail-title">API key activity</h3></div><button id="log-detail-close">×</button></div><div id="log-detail-content"></div></section></div>'+
      '</div>';
  };