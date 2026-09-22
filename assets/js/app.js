(function(){
"use strict";
var NAV=[
["MAIN",[["Dashboard","◫","dashboard"],["Overview","⌂","overview"],["API Usage","▥","usage"],["Analytics","◒","analytics"]]],
["API",[["API Keys","⌘","keys"],["Documentation","▤","documentation"],["Endpoints","↗","endpoints"],["WebSocket","⌁","websocket"],["Request Logs","☷","logs"],["API Status","●","status"]]],
["GAMES",[["Crash Game","◉","crash"],["Live Rounds","◌","live"],["Round History","◴","history"],["Game Settings","⚙","game-settings"]]],
["SETUP",[["Security","◇","security"],["Authentication","◈","authentication"],["API Configuration","⚙","configuration"],["Webhooks","↗","webhooks"],["Notifications","♢","notifications"],["Developer Settings","☷","developer-settings"]]],
["ACCOUNT",[["My Profile","○","profile"],["Subscription","▣","subscription"],["Billing","◫","billing"],["Usage Limits","▥","limits"]]],
["SYSTEM",[["System Status","●","system-status"],["Support","?","support"],["Help Center","?","help"]]]
];
var META={
dashboard:["Dashboard","Your real-time Game API developer workspace"],
overview:["Overview","A visual summary of your developer environment"],
usage:["API Usage","Requests, quota and traffic"],
analytics:["Analytics","API activity and trends"],
keys:["API Keys","Manage application credentials"],
documentation:["Documentation","Build with Game API"],
endpoints:["Endpoints","Explore API resources"],
websocket:["WebSocket","Real-time connection tools"],
logs:["Request Logs","Inspect API requests"],
status:["API Status","Live service health"],
crash:["Crash Game","Live crash-game tools"],
live:["Live Rounds","Real-time round monitor"],
"round-history":["Round History","Completed round activity"],
"game-settings":["Game Settings","Game configuration"],
security:["Security","Protect your account and credentials"],
authentication:["Authentication","Authentication configuration"],
configuration:["API Configuration","Runtime controls"],
webhooks:["Webhooks","Event delivery configuration"],
notifications:["Notifications","Platform notifications"],
"developer-settings":["Developer Settings","Workspace preferences"],
profile:["My Profile","Your account profile"],
subscription:["Subscription","Plan and access"],
billing:["Billing","Payments and invoices"],
limits:["Usage Limits","Quota and usage controls"],
"system-status":["System Status","Platform health"],
support:["Support","Get help from Game API"],
help:["Help Center","Guides and support"]
};
function esc(v){return String(v).replace(/[&<>"']/g,function(x){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]);});}
function current(){var p=location.pathname.split("/").pop().replace(".html","");return p||"dashboard";}
function notify(type,title,msg){
 var host=document.getElementById("alerts");if(!host){host=document.createElement("div");host.id="alerts";host.className="alerts";document.body.appendChild(host);}
 var n=document.createElement("div");n.className="alert "+type;n.innerHTML="<b>"+esc(title)+"</b><span>"+esc(msg||"")+"</span><button>×</button>";n.querySelector("button").onclick=function(){n.remove()};host.appendChild(n);setTimeout(function(){if(n.parentNode)n.remove()},6000);
}
function user(){try{return JSON.parse(localStorage.getItem("gameapi_user"))||{};}catch(e){return{};}}
function sidebar(key){
 var out="";
 NAV.forEach(function(group){
  out+='<div class="nav-group"><div class="nav-label">'+group[0]+"</div>";
  group[1].forEach(function(item){out+='<a class="nav-item '+(key===item[2]?"active":"")+'" href="'+item[2]+'.html"><span class="nav-icon">'+item[1]+"</span><span>"+item[0]+"</span></a>";});
  out+="</div>";
 });
 return out;
}
function pageContent(key){
 var m=META[key]||META.dashboard;
 if(key==="dashboard") return '<section class="hero"><div><span class="eyebrow">GAME API • DEVELOPER CONSOLE</span><h2>Build faster with Game API <span>⚡</span></h2><p>Manage API keys, authentication, real-time WebSocket connections, crash-game data and developer settings from one workspace.</p><div class="hero-actions"><a href="api-keys.html">Manage API Keys →</a><a href="documentation.html" class="ghost">Open Documentation</a></div></div><div class="hero-orbit"><div class="orbit orbit1"></div><div class="orbit orbit2"></div><div class="core">G</div></div></section><section class="kpi-grid"><div class="kpi blue"><div class="kpi-icon">↗</div><div><small>Requests this month</small><strong>12,840</strong><span>Live data</span></div></div><div class="kpi green"><div class="kpi-icon">●</div><div><small>API availability</small><strong>99.98%</strong><span>Operational</span></div></div><div class="kpi purple"><div class="kpi-icon">⌘</div><div><small>Active API keys</small><strong>3</strong><span>Credentials</span></div></div><div class="kpi orange"><div class="kpi-icon">◫</div><div><small>Monthly usage</small><strong>87%</strong><span>Quota consumed</span></div></div></section><section class="content-grid"><div class="panel"><div class="panel-head"><div><h3>Live API activity</h3><span>Recent developer requests</span></div><a href="logs.html">View all →</a></div><div class="activity"><div><i class="dot green-dot"></i><b>/api/crash/current</b><small>200 OK</small></div><div><i class="dot blue-dot"></i><b>/api/crash/history</b><small>200 OK</small></div><div><i class="dot purple-dot"></i><b>/realtime</b><small>Connected</small></div><div><i class="dot green-dot"></i><b>/api/status</b><small>200 OK</small></div></div></div><div class="panel"><div class="panel-head"><div><h3>Setup</h3><span>Configure your workspace</span></div></div><div class="setup"><a href="security.html">◇ <b>Security</b><em>→</em></a><a href="authentication.html">◈ <b>Authentication</b><em>→</em></a><a href="webhooks.html">↗ <b>Webhooks</b><em>→</em></a><a href="notifications.html">♢ <b>Notifications</b><em>→</em></a></div></div></section><section class="panel feature-panel"><div class="panel-head"><div><h3>Game API services</h3><span>Developer tools</span></div></div><div class="feature-grid"><a href="crash.html"><span class="feature-icon pink">◉</span><b>Crash Game</b><small>Live game tools</small></a><a href="websocket.html"><span class="feature-icon blue2">⌁</span><b>WebSocket</b><small>Real-time events</small></a><a href="documentation.html"><span class="feature-icon purple2">▤</span><b>Documentation</b><small>Integration guides</small></a><a href="system-status.html"><span class="feature-icon green2">●</span><b>System Status</b><small>Service health</small></a></div></section>';
 return '<section class="section-hero"><span class="eyebrow">GAME API</span><h2>'+esc(m[0])+'</h2><p>'+esc(m[1])+'</p></section><section class="content-grid"><div class="panel"><div class="panel-head"><div><h3>'+esc(m[0])+' workspace</h3><span>This module is connected to the shared developer console.</span></div><span class="live-pill"><i></i> Ready</span></div><div class="tool-list"><div><span class="tool-icon blue2">✦</span><div><b>Interactive module</b><small>Controls for '+esc(m[0])+' are ready.</small></div><button id="test-action">Test</button></div><div><span class="tool-icon purple2">⌁</span><div><b>Live feedback</b><small>Success and error messages appear at the top.</small></div><span class="status-tag">Enabled</span></div><div><span class="tool-icon green2">✓</span><div><b>Responsive design</b><small>Works across desktop and mobile.</small></div><span class="status-tag">Ready</span></div></div></div><div class="panel"><div class="panel-head"><div><h3>Quick controls</h3><span>Dashboard preferences</span></div></div><div class="control-card"><label>Chat position</label><div class="segmented"><button id="chat-left">Left</button><button id="chat-right">Right</button></div></div><div class="control-card"><label>Sidebar</label><button class="outline" id="collapse">Collapse / Expand</button></div></div></section>';
}
function boot(){
 var app=document.getElementById("app");if(!app)throw new Error("Dashboard mount #app was not found.");
 var key=current(),m=META[key]||META.dashboard,u=user(),name=u.name||"Developer",email=u.email||"developer@example.com",initial=(name.charAt(0)||"D").toUpperCase();
 app.innerHTML='<div class="dashboard-shell"><aside class="sidebar" id="sidebar"><div class="brand"><div class="brand-icon">G</div><div><b>Game API</b><small>Developer Console</small></div></div><div class="sidebar-scroll">'+sidebar(key)+'</div><div class="sidebar-bottom"><button class="chat-open" id="chat-open">◌ <span>Chat us</span></button></div></aside><main class="workspace"><header class="topbar"><button class="side-toggle" id="side-toggle" aria-label="Open menu">☰</button><div class="heading"><h1>'+esc(m[0])+'</h1><p>'+esc(m[1])+'</p></div><div class="account"><button class="account-btn" id="account-btn"><span class="avatar">'+initial+'</span><span class="account-text"><b>'+esc(name)+'</b><small>'+esc(email)+'</small></span>⌄</button><div class="account-menu" id="account-menu"><a href="profile.html">○ My Profile</a><button id="logout">↪ Logout</button></div></div></header><div class="page-wrap">'+pageContent(key)+'</div></main><div class="chat-panel" id="chat-panel"><header><b>Game API Support</b><button id="chat-close">×</button><small>Live support</small></header><div class="chat-messages" id="chat-messages"><div class="message agent">Hello! How can we help you?</div></div><form id="chat-form"><input id="chat-input" placeholder="Write a message…"><button>➤</button></form></div></div>';
 bind();notify("success","Dashboard ready","Game API developer workspace loaded successfully.");
}
function bind(){
 document.getElementById("side-toggle").onclick=function(){var s=document.getElementById("sidebar");if(window.innerWidth<=700){s.classList.toggle("mobile-open");var o=document.getElementById("mobile-overlay");if(s.classList.contains("mobile-open")){if(!o){o=document.createElement("div");o.id="mobile-overlay";o.className="mobile-overlay";document.body.appendChild(o);o.onclick=function(){s.classList.remove("mobile-open");o.remove();};}}else if(o)o.remove();}else{s.classList.toggle("collapsed");}};
 document.getElementById("account-btn").onclick=function(){document.getElementById("account-menu").classList.toggle("open");};
 document.getElementById("logout").onclick=function(){localStorage.removeItem("gameapi_user");notify("success","Signed out","Session cleared.");};
 document.getElementById("chat-open").onclick=function(){document.getElementById("chat-panel").classList.add("open");};
 document.getElementById("chat-close").onclick=function(){document.getElementById("chat-panel").classList.remove("open");};
 document.getElementById("chat-form").onsubmit=function(e){e.preventDefault();var i=document.getElementById("chat-input"),v=i.value.trim();if(!v)return;document.getElementById("chat-messages").insertAdjacentHTML("beforeend",'<div class="message me">'+esc(v)+'</div>');i.value="";notify("success","Message queued","Your support message was added.");};
 var t=document.getElementById("test-action");if(t)t.onclick=function(){notify("success","Module ready","The current developer module is responding correctly.");};
 var l=document.getElementById("chat-left");if(l)l.onclick=function(){document.getElementById("chat-panel").classList.add("left");notify("success","Chat moved","Support chat is now on the left.");};
 var r=document.getElementById("chat-right");if(r)r.onclick=function(){document.getElementById("chat-panel").classList.remove("left");notify("success","Chat moved","Support chat is now on the right.");};
 var c=document.getElementById("collapse");if(c)c.onclick=function(){document.getElementById("sidebar").classList.toggle("collapsed");};
}
window.addEventListener("error",function(e){notify("error","Page error",e.message||"Unexpected error");});
window.addEventListener("unhandledrejection",function(e){notify("error","Operation failed",e.reason&&e.reason.message?e.reason.message:String(e.reason||"Unhandled error"));});
document.addEventListener("DOMContentLoaded",function(){try{var loader=document.createElement("div");loader.className="page-loader";loader.innerHTML='<div><div class="loader-ring"></div><div class="loader-title">Game API</div><div class="loader-sub">Loading developer workspace…</div><div class="loader-progress"><i></i></div></div>';document.body.appendChild(loader);boot();setTimeout(function(){loader.classList.add("hide");setTimeout(function(){if(loader.parentNode)loader.remove();},350);},550);}catch(e){var a=document.getElementById("app");if(a)a.innerHTML='<div style="padding:40px;font-family:Arial"><h2>Game API could not load</h2><pre style="white-space:pre-wrap">'+esc(e.stack||e.message||e)+'</pre><button onclick="location.reload()">Reload</button></div>';notify("error","Dashboard failed to load",e.message||String(e));}});
})();