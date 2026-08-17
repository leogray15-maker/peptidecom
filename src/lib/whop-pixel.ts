// Whop ad pixel. Whop hands you one inline snippet to paste into the <head>
// of every page; it queues events on `window.whop` and then loads t.whop.tw/s.js
// asynchronously to flush them, so nothing here blocks rendering.
//
// The snippet is kept verbatim (minified, as Whop ships it) so it can be
// re-pasted from the Whop dashboard without a diff to review. Only the scope
// — the Whop business this site's traffic is attributed to — is ours.

/** The Whop business ID traffic is attributed to. */
export const WHOP_BIZ_ID = "biz_EJICQqey26uBr1";

/** Whop's pixel loader, verbatim, minus the surrounding <script> tag. */
const WHOP_LOADER = `!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});a.q.push([+new Date,"setScope"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};b=d.createElement(s);b.async=1;b.src=u+"/s.js";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}(window,document,"script","https://t.whop.tw","whop");`;

/**
 * The full inline pixel: loader, scope, and the initial page view. Injected
 * into the document <head> by the root layout.
 */
export const WHOP_PIXEL_SNIPPET = `${WHOP_LOADER}whop.setScope(${JSON.stringify(
  WHOP_BIZ_ID,
)});whop.track("page");`;
