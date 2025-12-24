import process from 'node:process';globalThis._importMeta_={url:import.meta.url,env:process.env};import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { Buffer as Buffer$1 } from 'node:buffer';
import { promises, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import nodeCrypto, { createHash } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import invariant from 'vinxi/lib/invariant';
import { virtualId, handlerModule, join as join$1 } from 'vinxi/lib/path';
import { pathToFileURL } from 'node:url';
import { defineEventHandler as defineEventHandler$1, readBody, toWebRequest } from '@tanstack/react-start/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { initTRPC, TRPCError } from '@trpc/server';
import se from 'superjson';
import { ZodError, z as z$1 } from 'zod';
import { PrismaClient } from '@prisma/client';
import U from 'bcryptjs';
import * as functionsJs from '@supabase/functions-js';
import * as postgrestJs from '@supabase/postgrest-js';
import * as realtimeJs from '@supabase/realtime-js';
import * as storageJs from '@supabase/storage-js';
import * as constants from '/Users/akunjadia/v-luxe/node_modules/.pnpm/@supabase+supabase-js@2.86.0/node_modules/@supabase/supabase-js/dist/main/lib/constants';
import * as fetch$2 from '/Users/akunjadia/v-luxe/node_modules/.pnpm/@supabase+supabase-js@2.86.0/node_modules/@supabase/supabase-js/dist/main/lib/fetch';
import * as helpers from '/Users/akunjadia/v-luxe/node_modules/.pnpm/@supabase+supabase-js@2.86.0/node_modules/@supabase/supabase-js/dist/main/lib/helpers';
import * as SupabaseAuthClient from '/Users/akunjadia/v-luxe/node_modules/.pnpm/@supabase+supabase-js@2.86.0/node_modules/@supabase/supabase-js/dist/main/lib/SupabaseAuthClient';
import * as authJs from '@supabase/auth-js';
import ue from 'stripe';
import Q from 'jsonwebtoken';
import H$1, { randomUUID } from 'crypto';
import F from 'nodemailer';
import { json2csv } from 'json-2-csv';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { eventHandler as eventHandler$1 } from 'vinxi/http';

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodeQueryKey(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = /* @__PURE__ */ Object.create(null);
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map(
      (_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`
    ).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}

const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/");
  }
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/") ? input : input + "/";
  }
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    return input;
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const trimmed = input.slice(_base.length);
  return trimmed[0] === "/" ? trimmed : "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}

const protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode === void 0) {
      if (node && node.placeholderChildren.length > 1) {
        const remaining = sections.length - i;
        node = node.placeholderChildren.find((c) => c.maxDepth === remaining) || null;
      } else {
        node = node.placeholderChildren[0] || null;
      }
      if (!node) {
        break;
      }
      if (node.paramName) {
        params[node.paramName] = section;
      }
      paramsFound = true;
    } else {
      node = nextNode;
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  const matchedNodes = [node];
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildren.push(childNode);
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      matchedNodes.push(childNode);
      node = childNode;
    }
  }
  for (const [depth, node2] of matchedNodes.entries()) {
    node2.maxDepth = Math.max(matchedNodes.length - depth, node2.maxDepth || 0);
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections.at(-1) || "";
    node.data = null;
    if (Object.keys(node.children).length === 0 && node.parent) {
      node.parent.children.delete(lastSection);
      node.parent.wildcardChildNode = null;
      node.parent.placeholderChildren = [];
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    maxDepth: 0,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildren: []
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table, router.ctx.options.strictTrailingSlash);
}
function _createMatcher(table, strictTrailingSlash) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table, strictTrailingSlash)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table, strictTrailingSlash) {
  if (strictTrailingSlash !== true && path.endsWith("/")) {
    path = path.slice(0, -1) || "/";
  }
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path === key || path.startsWith(key + "/")) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        if (node.data) {
          table.static.set(path, node.data);
        }
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

function o(n){throw new Error(`${n} is not implemented yet!`)}let i$1 = class i extends EventEmitter{__unenv__={};readableEncoding=null;readableEnded=true;readableFlowing=false;readableHighWaterMark=0;readableLength=0;readableObjectMode=false;readableAborted=false;readableDidRead=false;closed=false;errored=null;readable=false;destroyed=false;static from(e,t){return new i(t)}constructor(e){super();}_read(e){}read(e){}setEncoding(e){return this}pause(){return this}resume(){return this}isPaused(){return  true}unpipe(e){return this}unshift(e,t){}wrap(e){return this}push(e,t){return  false}_destroy(e,t){this.removeAllListeners();}destroy(e){return this.destroyed=true,this._destroy(e),this}pipe(e,t){return {}}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return this.destroy(),Promise.resolve()}async*[Symbol.asyncIterator](){throw o("Readable.asyncIterator")}iterator(e){throw o("Readable.iterator")}map(e,t){throw o("Readable.map")}filter(e,t){throw o("Readable.filter")}forEach(e,t){throw o("Readable.forEach")}reduce(e,t,r){throw o("Readable.reduce")}find(e,t){throw o("Readable.find")}findIndex(e,t){throw o("Readable.findIndex")}some(e,t){throw o("Readable.some")}toArray(e){throw o("Readable.toArray")}every(e,t){throw o("Readable.every")}flatMap(e,t){throw o("Readable.flatMap")}drop(e,t){throw o("Readable.drop")}take(e,t){throw o("Readable.take")}asIndexedPairs(e){throw o("Readable.asIndexedPairs")}};let l$1 = class l extends EventEmitter{__unenv__={};writable=true;writableEnded=false;writableFinished=false;writableHighWaterMark=0;writableLength=0;writableObjectMode=false;writableCorked=0;closed=false;errored=null;writableNeedDrain=false;destroyed=false;_data;_encoding="utf8";constructor(e){super();}pipe(e,t){return {}}_write(e,t,r){if(this.writableEnded){r&&r();return}if(this._data===void 0)this._data=e;else {const s=typeof this._data=="string"?Buffer$1.from(this._data,this._encoding||t||"utf8"):this._data,a=typeof e=="string"?Buffer$1.from(e,t||this._encoding||"utf8"):e;this._data=Buffer$1.concat([s,a]);}this._encoding=t,r&&r();}_writev(e,t){}_destroy(e,t){}_final(e){}write(e,t,r){const s=typeof t=="string"?this._encoding:"utf8",a=typeof t=="function"?t:typeof r=="function"?r:void 0;return this._write(e,s,a),true}setDefaultEncoding(e){return this}end(e,t,r){const s=typeof e=="function"?e:typeof t=="function"?t:typeof r=="function"?r:void 0;if(this.writableEnded)return s&&s(),this;const a=e===s?void 0:e;if(a){const u=t===s?void 0:t;this.write(a,u,s);}return this.writableEnded=true,this.writableFinished=true,this.emit("close"),this.emit("finish"),this}cork(){}uncork(){}destroy(e){return this.destroyed=true,delete this._data,this.removeAllListeners(),this}compose(e,t){throw new Error("Method not implemented.")}};const c=class{allowHalfOpen=true;_destroy;constructor(e=new i$1,t=new l$1){Object.assign(this,e),Object.assign(this,t),this._destroy=g$1(e._destroy,t._destroy);}};function _(){return Object.assign(c.prototype,i$1.prototype),Object.assign(c.prototype,l$1.prototype),c}function g$1(...n){return function(...e){for(const t of n)t(...e);}}const m=_();class A extends m{__unenv__={};bufferSize=0;bytesRead=0;bytesWritten=0;connecting=false;destroyed=false;pending=false;localAddress="";localPort=0;remoteAddress="";remoteFamily="";remotePort=0;autoSelectFamilyAttemptedAddresses=[];readyState="readOnly";constructor(e){super();}write(e,t,r){return  false}connect(e,t,r){return this}end(e,t,r){return this}setEncoding(e){return this}pause(){return this}resume(){return this}setTimeout(e,t){return this}setNoDelay(e){return this}setKeepAlive(e,t){return this}address(){return {}}unref(){return this}ref(){return this}destroySoon(){this.destroy();}resetAndDestroy(){const e=new Error("ERR_SOCKET_CLOSED");return e.code="ERR_SOCKET_CLOSED",this.destroy(e),this}}let y$1 = class y extends i$1{aborted=false;httpVersion="1.1";httpVersionMajor=1;httpVersionMinor=1;complete=true;connection;socket;headers={};trailers={};method="GET";url="/";statusCode=200;statusMessage="";closed=false;errored=null;readable=false;constructor(e){super(),this.socket=this.connection=e||new A;}get rawHeaders(){const e=this.headers,t=[];for(const r in e)if(Array.isArray(e[r]))for(const s of e[r])t.push(r,s);else t.push(r,e[r]);return t}get rawTrailers(){return []}setTimeout(e,t){return this}get headersDistinct(){return p(this.headers)}get trailersDistinct(){return p(this.trailers)}};function p(n){const e={};for(const[t,r]of Object.entries(n))t&&(e[t]=(Array.isArray(r)?r:[r]).filter(Boolean));return e}class w extends l$1{statusCode=200;statusMessage="";upgrading=false;chunkedEncoding=false;shouldKeepAlive=false;useChunkedEncodingByDefault=false;sendDate=false;finished=false;headersSent=false;strictContentLength=false;connection=null;socket=null;req;_headers={};constructor(e){super(),this.req=e;}assignSocket(e){e._httpMessage=this,this.socket=e,this.connection=e,this.emit("socket",e),this._flush();}_flush(){this.flushHeaders();}detachSocket(e){}writeContinue(e){}writeHead(e,t,r){e&&(this.statusCode=e),typeof t=="string"&&(this.statusMessage=t,t=void 0);const s=r||t;if(s&&!Array.isArray(s))for(const a in s)this.setHeader(a,s[a]);return this.headersSent=true,this}writeProcessing(){}setTimeout(e,t){return this}appendHeader(e,t){e=e.toLowerCase();const r=this._headers[e],s=[...Array.isArray(r)?r:[r],...Array.isArray(t)?t:[t]].filter(Boolean);return this._headers[e]=s.length>1?s:s[0],this}setHeader(e,t){return this._headers[e.toLowerCase()]=t,this}setHeaders(e){for(const[t,r]of Object.entries(e))this.setHeader(t,r);return this}getHeader(e){return this._headers[e.toLowerCase()]}getHeaders(){return this._headers}getHeaderNames(){return Object.keys(this._headers)}hasHeader(e){return e.toLowerCase()in this._headers}removeHeader(e){delete this._headers[e.toLowerCase()];}addTrailers(e){}flushHeaders(){}writeEarlyHints(e,t){typeof t=="function"&&t();}}const E$1=(()=>{const n=function(){};return n.prototype=Object.create(null),n})();function R(n={}){const e=new E$1,t=Array.isArray(n)||H(n)?n:Object.entries(n);for(const[r,s]of t)if(s){if(e[r]===void 0){e[r]=s;continue}e[r]=[...Array.isArray(e[r])?e[r]:[e[r]],...Array.isArray(s)?s:[s]];}return e}function H(n){return typeof n?.entries=="function"}function S$1(n={}){if(n instanceof Headers)return n;const e=new Headers;for(const[t,r]of Object.entries(n))if(r!==void 0){if(Array.isArray(r)){for(const s of r)e.append(t,String(s));continue}e.set(t,String(r));}return e}const C=new Set([101,204,205,304]);async function b(n,e){const t=new y$1,r=new w(t);t.url=e.url?.toString()||"/";let s;if(!t.url.startsWith("/")){const d=new URL(t.url);s=d.host,t.url=d.pathname+d.search+d.hash;}t.method=e.method||"GET",t.headers=R(e.headers||{}),t.headers.host||(t.headers.host=e.host||s||"localhost"),t.connection.encrypted=t.connection.encrypted||e.protocol==="https",t.body=e.body||null,t.__unenv__=e.context,await n(t,r);let a=r._data;(C.has(r.statusCode)||t.method.toUpperCase()==="HEAD")&&(a=null,delete r._headers["content-length"]);const u={status:r.statusCode,statusText:r.statusMessage,headers:r._headers,body:a};return t.destroy(),r.destroy(),u}async function O(n,e,t={}){try{const r=await b(n,{url:e,...t});return new Response(r.body,{status:r.status,statusText:r.statusText,headers:S$1(r.headers)})}catch(r){return new Response(r.toString(),{status:Number.parseInt(r.statusCode||r.code)||500,statusText:r.statusText})}}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
function createError$1(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError(error) ? error : createError$1(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}
function isMethod(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected)) {
    throw createError$1({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHost(event, opts = {}) {
  if (opts.xForwardedHost) {
    const xForwardedHost = event.node.req.headers["x-forwarded-host"];
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.node.req.headers.host || "localhost";
}
function getRequestProtocol(event, opts = {}) {
  if (opts.xForwardedProto !== false && event.node.req.headers["x-forwarded-proto"] === "https") {
    return "https";
  }
  return event.node.req.connection?.encrypted ? "https" : "http";
}
function getRequestURL(event, opts = {}) {
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event, opts);
  const path = (event.node.req.originalUrl || event.path).replace(
    /^[/\\]+/g,
    "/"
  );
  return new URL(path, `${protocol}://${host}`);
}

const RawBodySymbol = Symbol.for("h3RawBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      if (_resolved instanceof URLSearchParams) {
        return Buffer.from(_resolved.toString());
      }
      if (_resolved instanceof FormData) {
        return new Response(_resolved).bytes().then((uint8arr) => Buffer.from(uint8arr));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !String(event.node.req.headers["transfer-encoding"] ?? "").split(",").map((e) => e.trim()).filter(Boolean).includes("chunked")) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start));
    }
  }
  return cookiesStrings;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  if (!code && event.node.res.statusCode !== 200) {
    code = event.node.res.statusCode;
  }
  const _code = sanitizeStatusCode(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function defaultContentType(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
const setHeaders = setResponseHeaders;
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "accept-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
  "accept"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream(event);
      duplex = "half";
    } else {
      body = await readRawBody(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders$1(
    getProxyRequestHeaders(event, { host: target.startsWith("/") }),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  let response;
  try {
    response = await _getFetch(opts.fetch)(target, {
      headers: opts.headers,
      ignoreResponseError: true,
      // make $ofetch.raw transparent
      ...opts.fetchOptions
    });
  } catch (error) {
    throw createError$1({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error
    });
  }
  event.node.res.statusCode = sanitizeStatusCode(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event, opts) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name) || name === "host" && opts?.host) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event, {
        host: typeof req === "string" && req.startsWith("/")
      }),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders$1(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    const entries = Array.isArray(input) ? input : typeof input.entries === "function" ? input.entries() : Object.entries(input);
    for (const [key, value] of entries) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

class H3Event {
  "__is_event__" = true;
  // Context
  node;
  // Node
  web;
  // Web
  context = {};
  // Shared
  // Request
  _method;
  _path;
  _headers;
  _requestBody;
  // Response
  _handled = false;
  // Hooks
  _onBeforeResponseCalled;
  _onAfterResponseCalled;
  constructor(req, res) {
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. */
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. */
  get res() {
    return this.node.res;
  }
}
function isEvent(input) {
  return hasProp(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event(req, res);
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return hasProp(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  if (!isEventHandler(input)) {
    console.warn(
      "[h3] Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.",
      _route && _route !== "/" ? `
     Route: ${_route}` : "",
      `
     Handler: ${input}`
    );
  }
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler2 = r.default || r;
        if (typeof handler2 !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler2
          );
        }
        _resolved = { handler: toEventHandler(r.default || r) };
        return _resolved;
      });
    }
    return _promise;
  };
  const handler = eventHandler((event) => {
    if (_resolved) {
      return _resolved.handler(event);
    }
    return resolveHandler().then((r) => r.handler(event));
  });
  handler.__resolve__ = resolveHandler;
  return handler;
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const resolve = createResolver(stack);
  handler.__resolve__ = resolve;
  const getWebsocket = cachedFn(() => websocketOptions(resolve, options));
  const app = {
    // @ts-expect-error
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    resolve,
    handler,
    stack,
    options,
    get websocket() {
      return getWebsocket();
    }
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, handler: arg1 }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _reqPath = event._path || event.node.req.url || "/";
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          event._onBeforeResponseCalled = true;
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$1({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      event._onAfterResponseCalled = true;
      await options.onAfterResponse(event, void 0);
    }
  });
}
function createResolver(stack) {
  return async (path) => {
    let _layerPath;
    for (const layer of stack) {
      if (layer.route === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.route)) {
        continue;
      }
      _layerPath = path.slice(layer.route.length) || "/";
      if (layer.match && !layer.match(_layerPath, void 0)) {
        continue;
      }
      let res = { route: layer.route, handler: layer.handler };
      if (res.handler.__resolve__) {
        const _res = await res.handler.__resolve__(_layerPath);
        if (!_res) {
          continue;
        }
        res = {
          ...res,
          ..._res,
          route: joinURL(res.route || "/", _res.route || "/")
        };
      }
      return res;
    }
  };
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse(event, val);
    }
    if (isStream(val)) {
      return sendStream(event, val);
    }
    if (val.buffer) {
      return send(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$1(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send(event, val.toString(), MIMES.json);
  }
  throw createError$1({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}
function cachedFn(fn) {
  let cache;
  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
function websocketOptions(evResolver, appOptions) {
  return {
    ...appOptions.websocket,
    async resolve(info) {
      const url = info.request?.url || info.url || "/";
      const { pathname } = typeof url === "string" ? parseURL(url) : url;
      const resolved = await evResolver(pathname);
      return resolved?.handler?.__websocket__ || {};
    }
  };
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler, void 0, path);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  const matchHandler = (path = "/", method = "get") => {
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      return {
        error: createError$1({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${path || "/"}.`
        })
      };
    }
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      return {
        error: createError$1({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        })
      };
    }
    return { matched, handler };
  };
  const isPreemptive = opts.preemptive || opts.preemtive;
  router.handler = eventHandler((event) => {
    const match = matchHandler(
      event.path,
      event.method.toLowerCase()
    );
    if ("error" in match) {
      if (isPreemptive) {
        throw match.error;
      } else {
        return;
      }
    }
    event.context.matchedRoute = match.matched;
    const params = match.matched.params || {};
    event.context.params = params;
    return Promise.resolve(match.handler(event)).then((res) => {
      if (res === void 0 && isPreemptive) {
        return null;
      }
      return res;
    });
  });
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchHandler(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.matched.path,
      handler: match.handler
    };
    if (match.handler.__resolve__) {
      const _res = await match.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$1(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      setResponseStatus(event, error.statusCode, error.statusMessage);
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      if (app.options.onBeforeResponse && !event._onBeforeResponseCalled) {
        await app.options.onBeforeResponse(event, { body: error });
      }
      await sendError(event, error, !!app.options.debug);
      if (app.options.onAfterResponse && !event._onAfterResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return toNodeHandle;
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

const s$1=globalThis.Headers,i=globalThis.AbortController,l=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function resolveFetchOptions(request, input, defaults, Headers) {
  const headers = mergeHeaders(
    input?.headers ?? request?.headers,
    defaults?.headers,
    Headers
  );
  let query;
  if (defaults?.query || defaults?.params || input?.params || input?.query) {
    query = {
      ...defaults?.params,
      ...defaults?.query,
      ...input?.params,
      ...input?.query
    };
  }
  return {
    ...defaults,
    ...input,
    query,
    params: query,
    headers
  };
}
function mergeHeaders(input, defaults, Headers) {
  if (!defaults) {
    return new Headers(input);
  }
  const headers = new Headers(defaults);
  if (input) {
    for (const [key, value] of Symbol.iterator in input || Array.isArray(input) ? input : new Headers(input)) {
      headers.set(key, value);
    }
  }
  return headers;
}
async function callHooks(context, hooks) {
  if (hooks) {
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        await hook(context);
      }
    } else {
      await hooks(context);
    }
  }
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early (Experimental)
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
]);
const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = typeof context.options.retryDelay === "function" ? context.options.retryDelay(context) : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: resolveFetchOptions(
        _request,
        _options,
        globalOptions.defaults,
        Headers
      ),
      response: void 0,
      error: void 0
    };
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }
    if (context.options.onRequest) {
      await callHooks(context, context.options.onRequest);
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query) {
        context.request = withQuery(context.request, context.options.query);
        delete context.options.query;
      }
      if ("query" in context.options) {
        delete context.options.query;
      }
      if ("params" in context.options) {
        delete context.options.params;
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        context.options.body = typeof context.options.body === "string" ? context.options.body : JSON.stringify(context.options.body);
        context.options.headers = new Headers(context.options.headers || {});
        if (!context.options.headers.has("content-type")) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      abortTimeout = setTimeout(() => {
        const error = new Error(
          "[TimeoutError]: The operation was aborted due to timeout"
        );
        error.name = "TimeoutError";
        error.code = 23;
        controller.abort(error);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await callHooks(
          context,
          context.options.onRequestError
        );
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = (context.response.body || // https://github.com/unjs/ofetch/issues/324
    // https://github.com/unjs/ofetch/issues/294
    // https://github.com/JakeChampion/fetch/issues/1454
    context.response._bodyInit) && !nullBodyResponses.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body || context.response._bodyInit;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await callHooks(
        context,
        context.options.onResponse
      );
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await callHooks(
          context,
          context.options.onResponseError
        );
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}, customGlobalOptions = {}) => createFetch({
    ...globalOptions,
    ...customGlobalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...customGlobalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch$1 = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
const Headers$1 = globalThis.Headers || s$1;
const AbortController = globalThis.AbortController || i;
createFetch({ fetch: fetch$1, Headers: Headers$1, AbortController });

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}

const storageKeyProperties = [
  "has",
  "hasItem",
  "get",
  "getItem",
  "getItemRaw",
  "set",
  "setItem",
  "setItemRaw",
  "del",
  "remove",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  nsStorage.getItems = async (items, commonOptions) => {
    const prefixedItems = items.map(
      (item) => typeof item === "string" ? base + item : { ...item, key: base + item.key }
    );
    const results = await storage.getItems(prefixedItems, commonOptions);
    return results.map((entry) => ({
      key: entry.key.slice(base.length),
      value: entry.value
    }));
  };
  nsStorage.setItems = async (items, commonOptions) => {
    const prefixedItems = items.map((item) => ({
      key: base + item.key,
      value: item.value,
      options: item.options
    }));
    return storage.setItems(prefixedItems, commonOptions);
  };
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey$1(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
};

const assets = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError);
  }
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore, maxDepth) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (maxDepth === void 0 || maxDepth > 0) {
          const dirFiles = await readdirRecursive(
            entryPath,
            ignore,
            maxDepth === void 0 ? void 0 : maxDepth - 1
          );
          files.push(...dirFiles.map((f) => entry.name + "/" + f));
        }
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const unstorage_47drivers_47fs_45lite = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    flags: {
      maxDepth: true
    },
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys(_base, topts) {
      return readdirRecursive(r("."), opts.ignore, topts?.maxDepth);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage = createStorage({});

storage.mount('/assets', assets);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const e=globalThis.process?.getBuiltinModule?.("crypto")?.hash,r$1="sha256",s="base64url";function digest(t){if(e)return e(r$1,t,s);const o=createHash(r$1).update(t);return globalThis.process?.versions?.webcontainer?o.digest().toString(s):o.digest(s)}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const inlineAppConfig = {};



const appConfig$1 = defuFn(inlineAppConfig);

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner) : "";
}
function snakeCase(str) {
  return kebabCase(str || "", "_");
}

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/"
  },
  "nitro": {
    "routeRules": {}
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  {
    return _sharedRuntimeConfig;
  }
}
_deepFreeze(klona(appConfig$1));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
const defaultNamespace = _globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());

const nitroAsyncContext = getContext("nitro-app", {
  asyncContext: true,
  AsyncLocalStorage: AsyncLocalStorage 
});

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$0 = defineNitroErrorHandler(
  function defaultNitroErrorHandler(error, event) {
    const res = defaultHandler(error, event);
    setResponseHeaders(event, res.headers);
    setResponseStatus(event, res.status, res.statusText);
    return send(event, JSON.stringify(res.body, null, 2));
  }
);
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.method}] ${url}
`, error);
  }
  const headers = {
    "content-type": "application/json",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  setResponseStatus(event, statusCode, statusMessage);
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    statusCode,
    statusMessage,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}

const errorHandlers = [errorHandler$0];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const appConfig = {"name":"vinxi","routers":[{"type":"static","name":"public","dir":"./public","base":"/","root":"/Users/akunjadia/v-luxe","order":0,"outDir":"/Users/akunjadia/v-luxe/.vinxi/build/public"},{"type":"http","name":"trpc","base":"/trpc","handler":"src/server/trpc/handler.ts","target":"server","root":"/Users/akunjadia/v-luxe","outDir":"/Users/akunjadia/v-luxe/.vinxi/build/trpc","order":1},{"type":"http","name":"debug","base":"/api/debug/client-logs","handler":"src/server/debug/client-logs-handler.ts","target":"server","root":"/Users/akunjadia/v-luxe","outDir":"/Users/akunjadia/v-luxe/.vinxi/build/debug","order":2},{"type":"spa","name":"client","handler":"index.html","target":"browser","base":"/","root":"/Users/akunjadia/v-luxe","outDir":"/Users/akunjadia/v-luxe/.vinxi/build/client","order":3}],"server":{"preset":"vercel","experimental":{"asyncContext":true}},"root":"/Users/akunjadia/v-luxe"};
				const buildManifest = {"trpc":{"virtual:$vinxi/handler/trpc":{"file":"trpc.js","name":"trpc","src":"virtual:$vinxi/handler/trpc","isEntry":true}},"debug":{"virtual:$vinxi/handler/debug":{"file":"debug.js","name":"debug","src":"virtual:$vinxi/handler/debug","isEntry":true}},"client":{"_AdminCalendarView-KYVGVky4.js":{"file":"assets/AdminCalendarView-KYVGVky4.js","name":"AdminCalendarView","imports":["index.html","_formatTime-R4Jm2Dpf.js","_calendar-sVqVbs5g.js","_loader-DMU7MElH.js","_plus-BeADQoDx.js","_clock-04BLIM7u.js","_square-check-big-DlVo-rQ2.js"]},"_BookingWizardProvider-CZ44CSfS.js":{"file":"assets/BookingWizardProvider-CZ44CSfS.js","name":"BookingWizardProvider","imports":["index.html"]},"_Footer-CWCGcQgO.js":{"file":"assets/Footer-CWCGcQgO.js","name":"Footer","imports":["index.html","_map-pin-BUW29wY0.js"]},"_Layout-C0GgeWN6.js":{"file":"assets/Layout-C0GgeWN6.js","name":"Layout","imports":["index.html","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js"]},"_PortalLayout-DFkXF_dG.js":{"file":"assets/PortalLayout-DFkXF_dG.js","name":"PortalLayout","imports":["index.html","_Footer-CWCGcQgO.js","_calendar-sVqVbs5g.js"]},"_QuizIdentityLayout-_IpR82wO.js":{"file":"assets/QuizIdentityLayout-_IpR82wO.js","name":"QuizIdentityLayout","imports":["index.html"]},"_ServicePageTemplate-ITBk_p3t.js":{"file":"assets/ServicePageTemplate-ITBk_p3t.js","name":"ServicePageTemplate","imports":["index.html","_Layout-C0GgeWN6.js","_chevron-up-CkvKsemS.js"]},"_SummaryPanel-D7zU54v8.js":{"file":"assets/SummaryPanel-D7zU54v8.js","name":"SummaryPanel","imports":["index.html","_BookingWizardProvider-CZ44CSfS.js"]},"_adminPortal-KrRNUMwu.js":{"file":"assets/adminPortal-KrRNUMwu.js","name":"adminPortal"},"_analytics-Cg1IkZOG.js":{"file":"assets/analytics-Cg1IkZOG.js","name":"analytics"},"_building-Cr22pXXN.js":{"file":"assets/building-Cr22pXXN.js","name":"building","imports":["index.html"]},"_calendar-sVqVbs5g.js":{"file":"assets/calendar-sVqVbs5g.js","name":"calendar","imports":["index.html"]},"_chevron-up-CkvKsemS.js":{"file":"assets/chevron-up-CkvKsemS.js","name":"chevron-up","imports":["index.html"]},"_circle-alert-Cfu_jE4B.js":{"file":"assets/circle-alert-Cfu_jE4B.js","name":"circle-alert","imports":["index.html"]},"_circle-check-KVYfCMLA.js":{"file":"assets/circle-check-KVYfCMLA.js","name":"circle-check","imports":["index.html"]},"_circle-check-big-DhNyGKn9.js":{"file":"assets/circle-check-big-DhNyGKn9.js","name":"circle-check-big","imports":["index.html"]},"_circle-x-YOFRGHgJ.js":{"file":"assets/circle-x-YOFRGHgJ.js","name":"circle-x","imports":["index.html"]},"_clock-04BLIM7u.js":{"file":"assets/clock-04BLIM7u.js","name":"clock","imports":["index.html"]},"_controls-BJxnLhK-.js":{"file":"assets/controls-BJxnLhK-.js","name":"controls","imports":["index.html","_BookingWizardProvider-CZ44CSfS.js"]},"_converter-BdV2bkOJ.js":{"file":"assets/converter-BdV2bkOJ.js","name":"converter"},"_credit-card-rY5N0Qov.js":{"file":"assets/credit-card-rY5N0Qov.js","name":"credit-card","imports":["index.html"]},"_external-link-CCSPuh3n.js":{"file":"assets/external-link-CCSPuh3n.js","name":"external-link","imports":["index.html"]},"_formatTime-R4Jm2Dpf.js":{"file":"assets/formatTime-R4Jm2Dpf.js","name":"formatTime"},"_funnel-Bkw8g59b.js":{"file":"assets/funnel-Bkw8g59b.js","name":"funnel","imports":["index.html"]},"_globe-D5ZtC8Lx.js":{"file":"assets/globe-D5ZtC8Lx.js","name":"globe","imports":["index.html"]},"_loader-DMU7MElH.js":{"file":"assets/loader-DMU7MElH.js","name":"loader","imports":["index.html"]},"_loader-circle-ZVWRwCK0.js":{"file":"assets/loader-circle-ZVWRwCK0.js","name":"loader-circle","imports":["index.html"]},"_log-out-C9kJv6u3.js":{"file":"assets/log-out-C9kJv6u3.js","name":"log-out","imports":["index.html"]},"_map-pin-BUW29wY0.js":{"file":"assets/map-pin-BUW29wY0.js","name":"map-pin","imports":["index.html"]},"_pencil-CG31BmeG.js":{"file":"assets/pencil-CG31BmeG.js","name":"pencil","imports":["index.html"]},"_plus-BeADQoDx.js":{"file":"assets/plus-BeADQoDx.js","name":"plus","imports":["index.html"]},"_pricing-C6jM-1bb.js":{"file":"assets/pricing-C6jM-1bb.js","name":"pricing","imports":["_BookingWizardProvider-CZ44CSfS.js"]},"_shield-B9LsuJor.js":{"file":"assets/shield-B9LsuJor.js","name":"shield","imports":["index.html"]},"_sparkles-DL3wED8T.js":{"file":"assets/sparkles-DL3wED8T.js","name":"sparkles","imports":["index.html"]},"_square-CdDjSuHm.js":{"file":"assets/square-CdDjSuHm.js","name":"square","imports":["index.html"]},"_square-check-big-DlVo-rQ2.js":{"file":"assets/square-check-big-DlVo-rQ2.js","name":"square-check-big","imports":["index.html"]},"_star-CaT70wlV.js":{"file":"assets/star-CaT70wlV.js","name":"star","imports":["index.html"]},"_styles-CoJu3Vce.js":{"file":"assets/styles-CoJu3Vce.js","name":"styles"},"_trending-up-e0U5eMl_.js":{"file":"assets/trending-up-e0U5eMl_.js","name":"trending-up","imports":["index.html"]},"_triangle-alert-DYKA_FWn.js":{"file":"assets/triangle-alert-DYKA_FWn.js","name":"triangle-alert","imports":["index.html"]},"_user-plus-D9h12H7H.js":{"file":"assets/user-plus-D9h12H7H.js","name":"user-plus","imports":["index.html"]},"_wallet-wCGWKG4-.js":{"file":"assets/wallet-wCGWKG4-.js","name":"wallet","imports":["index.html"]},"_zod-Us8nOtev.js":{"file":"assets/zod-Us8nOtev.js","name":"zod","imports":["index.html"]},"index.html":{"file":"assets/index-D68JyPnQ.js","name":"index","src":"index.html","isEntry":true,"dynamicImports":["src/routes/enhancement-plan.tsx?tsr-split=component","src/routes/booking-quiz.tsx?tsr-split=component","src/routes/index.tsx?tsr-split=component","src/routes/terms-of-service/index.tsx?tsr-split=component","src/routes/service-areas/index.tsx?tsr-split=component","src/routes/register/index.tsx?tsr-split=component","src/routes/privacy-policy/index.tsx?tsr-split=component","src/routes/login/index.tsx?tsr-split=component","src/routes/forgot-password/index.tsx?tsr-split=component","src/routes/dialer/index.tsx?tsr-split=component","src/routes/contact-us/index.tsx?tsr-split=component","src/routes/client-portal/index.tsx?tsr-split=component","src/routes/cleaner-portal/index.tsx?tsr-split=component","src/routes/checklist/index.tsx?tsr-split=component","src/routes/booking-quiz/index.tsx?tsr-split=component","src/routes/book-now/index.tsx?tsr-split=component","src/routes/admin-portal/index.tsx?tsr-split=component","src/routes/booking-quiz/start.tsx?tsr-split=component","src/routes/booking-quiz/schedule.tsx?tsr-split=component","src/routes/booking-quiz/payment.tsx?tsr-split=component","src/routes/booking-quiz/details.tsx?tsr-split=component","src/routes/booking-quiz/address-details.tsx?tsr-split=component","src/routes/booking-quiz/address.tsx?tsr-split=component","src/routes/admin-portal/storage.tsx?tsr-split=component","src/routes/admin-portal/signups.tsx?tsr-split=component","src/routes/admin-portal/settings.tsx?tsr-split=component","src/routes/admin-portal/schedule-requests.tsx?tsr-split=component","src/routes/admin-portal/reviews.tsx?tsr-split=component","src/routes/admin-portal/revenue-reports.tsx?tsr-split=component","src/routes/admin-portal/pricing.tsx?tsr-split=component","src/routes/admin-portal/management.tsx?tsr-split=component","src/routes/admin-portal/logs.tsx?tsr-split=component","src/routes/admin-portal/leads.tsx?tsr-split=component","src/routes/admin-portal/bookings.tsx?tsr-split=component","src/routes/admin-portal/booking-charges.tsx?tsr-split=component","src/routes/admin-portal/billing.tsx?tsr-split=component","src/routes/admin-portal/bank-transactions.tsx?tsr-split=component","src/routes/services/vacation-rental-cleaning/index.tsx?tsr-split=component","src/routes/services/standard-home-cleaning/index.tsx?tsr-split=component","src/routes/services/post-construction-cleaning/index.tsx?tsr-split=component","src/routes/services/moving-cleaning/index.tsx?tsr-split=component","src/routes/services/deep-home-cleaning/index.tsx?tsr-split=component","src/routes/services/commercial-cleaning/index.tsx?tsr-split=component","src/routes/admin-portal/tasks/index.tsx?tsr-split=component","src/routes/admin-portal/finance/index.tsx?tsr-split=component","src/routes/booking-quiz/returning/phone.tsx?tsr-split=component","src/routes/booking-quiz/returning/otp.tsx?tsr-split=component","src/routes/booking-quiz/new/phone.tsx?tsr-split=component","src/routes/booking-quiz/new/otp.tsx?tsr-split=component","src/routes/booking-quiz/new/full-name.tsx?tsr-split=component","src/routes/booking-quiz/new/email.tsx?tsr-split=component","src/routes/booking-quiz/new/create-account.tsx?tsr-split=component","src/routes/booking-quiz/clean/type.tsx?tsr-split=component","src/routes/booking-quiz/clean/summary.tsx?tsr-split=component","src/routes/booking-quiz/clean/household.tsx?tsr-split=component","src/routes/booking-quiz/clean/cleanliness.tsx?tsr-split=component","src/routes/booking-quiz/clean/beds-baths.tsx?tsr-split=component","src/routes/admin/settings/discount.tsx?tsr-split=component","src/routes/admin-portal/cleaners/availability.tsx?tsr-split=component","src/routes/admin-portal/customers/$userId/index.tsx?tsr-split=component","src/routes/admin-portal/cleaners/$userId/index.tsx?tsr-split=component"],"css":["assets/index-D6DOJUo1.css"]},"src/routes/admin-portal/bank-transactions.tsx?tsr-split=component":{"file":"assets/bank-transactions-EXwHqTc4.js","name":"bank-transactions","src":"src/routes/admin-portal/bank-transactions.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_adminPortal-KrRNUMwu.js","_converter-BdV2bkOJ.js","_credit-card-rY5N0Qov.js","_funnel-Bkw8g59b.js","_wallet-wCGWKG4-.js"]},"src/routes/admin-portal/billing.tsx?tsr-split=component":{"file":"assets/billing-DQ5yXfgh.js","name":"billing","src":"src/routes/admin-portal/billing.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_PortalLayout-DFkXF_dG.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js","_calendar-sVqVbs5g.js"]},"src/routes/admin-portal/booking-charges.tsx?tsr-split=component":{"file":"assets/booking-charges-CH5-4i5w.js","name":"booking-charges","src":"src/routes/admin-portal/booking-charges.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_PortalLayout-DFkXF_dG.js","_formatTime-R4Jm2Dpf.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js","_calendar-sVqVbs5g.js"]},"src/routes/admin-portal/bookings.tsx?tsr-split=component":{"file":"assets/bookings-Ca-jtg2K.js","name":"bookings","src":"src/routes/admin-portal/bookings.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_triangle-alert-DYKA_FWn.js","_calendar-sVqVbs5g.js","_circle-alert-Cfu_jE4B.js","_circle-check-KVYfCMLA.js","_loader-circle-ZVWRwCK0.js","_adminPortal-KrRNUMwu.js","_formatTime-R4Jm2Dpf.js","_clock-04BLIM7u.js","_external-link-CCSPuh3n.js","_map-pin-BUW29wY0.js","_user-plus-D9h12H7H.js","_circle-check-big-DhNyGKn9.js"]},"src/routes/admin-portal/cleaners/$userId/index.tsx?tsr-split=component":{"file":"assets/index-Gzt6oIJu.js","name":"index","src":"src/routes/admin-portal/cleaners/$userId/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_PortalLayout-DFkXF_dG.js","_AdminCalendarView-KYVGVky4.js","_loader-DMU7MElH.js","_circle-x-YOFRGHgJ.js","_Footer-CWCGcQgO.js","_calendar-sVqVbs5g.js","_circle-check-big-DhNyGKn9.js","_formatTime-R4Jm2Dpf.js","_plus-BeADQoDx.js","_clock-04BLIM7u.js","_square-check-big-DlVo-rQ2.js","_map-pin-BUW29wY0.js"]},"src/routes/admin-portal/cleaners/availability.tsx?tsr-split=component":{"file":"assets/availability-Cu7wdhnX.js","name":"availability","src":"src/routes/admin-portal/cleaners/availability.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html"]},"src/routes/admin-portal/customers/$userId/index.tsx?tsr-split=component":{"file":"assets/index-C7yRsLcj.js","name":"index","src":"src/routes/admin-portal/customers/$userId/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_PortalLayout-DFkXF_dG.js","_AdminCalendarView-KYVGVky4.js","_loader-DMU7MElH.js","_circle-x-YOFRGHgJ.js","_Footer-CWCGcQgO.js","_calendar-sVqVbs5g.js","_circle-check-big-DhNyGKn9.js","_formatTime-R4Jm2Dpf.js","_plus-BeADQoDx.js","_clock-04BLIM7u.js","_square-check-big-DlVo-rQ2.js","_map-pin-BUW29wY0.js"]},"src/routes/admin-portal/finance/index.tsx?tsr-split=component":{"file":"assets/index-C7YTIc0l.js","name":"index","src":"src/routes/admin-portal/finance/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_converter-BdV2bkOJ.js","_calendar-sVqVbs5g.js"]},"src/routes/admin-portal/index.tsx?tsr-split=component":{"file":"assets/index-CL_aeXS6.js","name":"index","src":"src/routes/admin-portal/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_credit-card-rY5N0Qov.js","_trending-up-e0U5eMl_.js","_circle-check-big-DhNyGKn9.js"]},"src/routes/admin-portal/leads.tsx?tsr-split=component":{"file":"assets/leads-BdFKayBl.js","name":"leads","src":"src/routes/admin-portal/leads.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_plus-BeADQoDx.js"]},"src/routes/admin-portal/logs.tsx?tsr-split=component":{"file":"assets/logs-h9XwuJUG.js","name":"logs","src":"src/routes/admin-portal/logs.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_clock-04BLIM7u.js"]},"src/routes/admin-portal/management.tsx?tsr-split=component":{"file":"assets/management-B5csXJlq.js","name":"management","src":"src/routes/admin-portal/management.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_square-check-big-DlVo-rQ2.js","_square-CdDjSuHm.js","_user-plus-D9h12H7H.js","_pencil-CG31BmeG.js"]},"src/routes/admin-portal/pricing.tsx?tsr-split=component":{"file":"assets/pricing-wgIgRy8s.js","name":"pricing","src":"src/routes/admin-portal/pricing.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_loader-circle-ZVWRwCK0.js","_plus-BeADQoDx.js","_pencil-CG31BmeG.js"]},"src/routes/admin-portal/revenue-reports.tsx?tsr-split=component":{"file":"assets/revenue-reports-V8oEar0v.js","name":"revenue-reports","src":"src/routes/admin-portal/revenue-reports.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html"]},"src/routes/admin-portal/reviews.tsx?tsr-split=component":{"file":"assets/reviews-BBke8asE.js","name":"reviews","src":"src/routes/admin-portal/reviews.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_clock-04BLIM7u.js","_globe-D5ZtC8Lx.js","_star-CaT70wlV.js"]},"src/routes/admin-portal/schedule-requests.tsx?tsr-split=component":{"file":"assets/schedule-requests--LZqiJZJ.js","name":"schedule-requests","src":"src/routes/admin-portal/schedule-requests.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_adminPortal-KrRNUMwu.js","_clock-04BLIM7u.js"]},"src/routes/admin-portal/settings.tsx?tsr-split=component":{"file":"assets/settings-CaaW1gO-.js","name":"settings","src":"src/routes/admin-portal/settings.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_adminPortal-KrRNUMwu.js","_plus-BeADQoDx.js","_pencil-CG31BmeG.js"]},"src/routes/admin-portal/signups.tsx?tsr-split=component":{"file":"assets/signups-BkmVE1bH.js","name":"signups","src":"src/routes/admin-portal/signups.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_funnel-Bkw8g59b.js"]},"src/routes/admin-portal/storage.tsx?tsr-split=component":{"file":"assets/storage-Dfdppnho.js","name":"storage","src":"src/routes/admin-portal/storage.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_external-link-CCSPuh3n.js","_calendar-sVqVbs5g.js"]},"src/routes/admin-portal/tasks/index.tsx?tsr-split=component":{"file":"assets/index-D01UTuFp.js","name":"index","src":"src/routes/admin-portal/tasks/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_zod-Us8nOtev.js","_plus-BeADQoDx.js","_circle-check-big-DhNyGKn9.js"]},"src/routes/admin/settings/discount.tsx?tsr-split=component":{"file":"assets/discount-Dftj8umS.js","name":"discount","src":"src/routes/admin/settings/discount.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_PortalLayout-DFkXF_dG.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js","_calendar-sVqVbs5g.js"]},"src/routes/book-now/index.tsx?tsr-split=component":{"file":"assets/index-CCedIgcF.js","name":"index","src":"src/routes/book-now/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html"]},"src/routes/booking-quiz.tsx?tsr-split=component":{"file":"assets/booking-quiz-DnIsxo78.js","name":"booking-quiz","src":"src/routes/booking-quiz.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js"]},"src/routes/booking-quiz/address-details.tsx?tsr-split=component":{"file":"assets/address-details-ElJAxr2b.js","name":"address-details","src":"src/routes/booking-quiz/address-details.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_SummaryPanel-D7zU54v8.js","_controls-BJxnLhK-.js","_styles-CoJu3Vce.js","_analytics-Cg1IkZOG.js"]},"src/routes/booking-quiz/address.tsx?tsr-split=component":{"file":"assets/address-B0AiGJoh.js","name":"address","src":"src/routes/booking-quiz/address.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_SummaryPanel-D7zU54v8.js","_analytics-Cg1IkZOG.js","_styles-CoJu3Vce.js","_triangle-alert-DYKA_FWn.js"]},"src/routes/booking-quiz/clean/beds-baths.tsx?tsr-split=component":{"file":"assets/beds-baths-B1Jp-r1M.js","name":"beds-baths","src":"src/routes/booking-quiz/clean/beds-baths.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_SummaryPanel-D7zU54v8.js","_controls-BJxnLhK-.js","_styles-CoJu3Vce.js","_pricing-C6jM-1bb.js","_analytics-Cg1IkZOG.js"]},"src/routes/booking-quiz/clean/cleanliness.tsx?tsr-split=component":{"file":"assets/cleanliness-BktzZi8M.js","name":"cleanliness","src":"src/routes/booking-quiz/clean/cleanliness.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_SummaryPanel-D7zU54v8.js","_styles-CoJu3Vce.js","_analytics-Cg1IkZOG.js"]},"src/routes/booking-quiz/clean/household.tsx?tsr-split=component":{"file":"assets/household-Bs6Ozd1R.js","name":"household","src":"src/routes/booking-quiz/clean/household.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_SummaryPanel-D7zU54v8.js","_controls-BJxnLhK-.js","_styles-CoJu3Vce.js","_analytics-Cg1IkZOG.js"]},"src/routes/booking-quiz/clean/summary.tsx?tsr-split=component":{"file":"assets/summary-C3_8zg91.js","name":"summary","src":"src/routes/booking-quiz/clean/summary.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_SummaryPanel-D7zU54v8.js","_controls-BJxnLhK-.js","_pricing-C6jM-1bb.js","_styles-CoJu3Vce.js","_analytics-Cg1IkZOG.js"]},"src/routes/booking-quiz/clean/type.tsx?tsr-split=component":{"file":"assets/type-CU2RCpqy.js","name":"type","src":"src/routes/booking-quiz/clean/type.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_SummaryPanel-D7zU54v8.js","_analytics-Cg1IkZOG.js","_controls-BJxnLhK-.js","_styles-CoJu3Vce.js","_pricing-C6jM-1bb.js"]},"src/routes/booking-quiz/details.tsx?tsr-split=component":{"file":"assets/details-_mF7vUdj.js","name":"details","src":"src/routes/booking-quiz/details.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_SummaryPanel-D7zU54v8.js","_styles-CoJu3Vce.js","_analytics-Cg1IkZOG.js"]},"src/routes/booking-quiz/index.tsx?tsr-split=component":{"file":"assets/index-CXjmCVEU.js","name":"index","src":"src/routes/booking-quiz/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html"]},"src/routes/booking-quiz/new/create-account.tsx?tsr-split=component":{"file":"assets/create-account-l0g4XLJX.js","name":"create-account","src":"src/routes/booking-quiz/new/create-account.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_analytics-Cg1IkZOG.js","_QuizIdentityLayout-_IpR82wO.js"]},"src/routes/booking-quiz/new/email.tsx?tsr-split=component":{"file":"assets/email-DCVsIWWI.js","name":"email","src":"src/routes/booking-quiz/new/email.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_analytics-Cg1IkZOG.js","_styles-CoJu3Vce.js","_QuizIdentityLayout-_IpR82wO.js"]},"src/routes/booking-quiz/new/full-name.tsx?tsr-split=component":{"file":"assets/full-name-C8nQ9e6a.js","name":"full-name","src":"src/routes/booking-quiz/new/full-name.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_analytics-Cg1IkZOG.js","_styles-CoJu3Vce.js","_QuizIdentityLayout-_IpR82wO.js"]},"src/routes/booking-quiz/new/otp.tsx?tsr-split=component":{"file":"assets/otp-BEDaaGUt.js","name":"otp","src":"src/routes/booking-quiz/new/otp.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_analytics-Cg1IkZOG.js","_styles-CoJu3Vce.js","_QuizIdentityLayout-_IpR82wO.js"]},"src/routes/booking-quiz/new/phone.tsx?tsr-split=component":{"file":"assets/phone-Cy7tHFyE.js","name":"phone","src":"src/routes/booking-quiz/new/phone.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_analytics-Cg1IkZOG.js","_styles-CoJu3Vce.js","_QuizIdentityLayout-_IpR82wO.js"]},"src/routes/booking-quiz/payment.tsx?tsr-split=component":{"file":"assets/payment-B1nWVi2M.js","name":"payment","src":"src/routes/booking-quiz/payment.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_SummaryPanel-D7zU54v8.js","_analytics-Cg1IkZOG.js","_styles-CoJu3Vce.js","_pricing-C6jM-1bb.js"]},"src/routes/booking-quiz/returning/otp.tsx?tsr-split=component":{"file":"assets/otp-8aL96Zar.js","name":"otp","src":"src/routes/booking-quiz/returning/otp.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_analytics-Cg1IkZOG.js","_styles-CoJu3Vce.js","_QuizIdentityLayout-_IpR82wO.js"]},"src/routes/booking-quiz/returning/phone.tsx?tsr-split=component":{"file":"assets/phone-SiV7B9iT.js","name":"phone","src":"src/routes/booking-quiz/returning/phone.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_analytics-Cg1IkZOG.js","_styles-CoJu3Vce.js","_QuizIdentityLayout-_IpR82wO.js"]},"src/routes/booking-quiz/schedule.tsx?tsr-split=component":{"file":"assets/schedule-BFQm2Ykm.js","name":"schedule","src":"src/routes/booking-quiz/schedule.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_SummaryPanel-D7zU54v8.js","_analytics-Cg1IkZOG.js","_styles-CoJu3Vce.js"]},"src/routes/booking-quiz/start.tsx?tsr-split=component":{"file":"assets/start-D0ivvmrs.js","name":"start","src":"src/routes/booking-quiz/start.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_BookingWizardProvider-CZ44CSfS.js","_analytics-Cg1IkZOG.js","_QuizIdentityLayout-_IpR82wO.js"]},"src/routes/checklist/index.tsx?tsr-split=component":{"file":"assets/index-D9Gf7LbK.js","name":"index","src":"src/routes/checklist/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js"]},"src/routes/cleaner-portal/index.tsx?tsr-split=component":{"file":"assets/index-Do1EW-bI.js","name":"index","src":"src/routes/cleaner-portal/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_PortalLayout-DFkXF_dG.js","_formatTime-R4Jm2Dpf.js","_zod-Us8nOtev.js","_calendar-sVqVbs5g.js","_loader-DMU7MElH.js","_square-check-big-DlVo-rQ2.js","_clock-04BLIM7u.js","_map-pin-BUW29wY0.js","_loader-circle-ZVWRwCK0.js","_circle-check-KVYfCMLA.js","_log-out-C9kJv6u3.js","_circle-x-YOFRGHgJ.js","_trending-up-e0U5eMl_.js","_circle-check-big-DhNyGKn9.js","_wallet-wCGWKG4-.js","_square-CdDjSuHm.js","_Footer-CWCGcQgO.js"]},"src/routes/client-portal/index.tsx?tsr-split=component":{"file":"assets/index-berqKx0c.js","name":"index","src":"src/routes/client-portal/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_PortalLayout-DFkXF_dG.js","_formatTime-R4Jm2Dpf.js","_log-out-C9kJv6u3.js","_calendar-sVqVbs5g.js","_circle-x-YOFRGHgJ.js","_clock-04BLIM7u.js","_map-pin-BUW29wY0.js","_circle-alert-Cfu_jE4B.js","_Footer-CWCGcQgO.js"]},"src/routes/contact-us/index.tsx?tsr-split=component":{"file":"assets/index-CO5_XsbG.js","name":"index","src":"src/routes/contact-us/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html"]},"src/routes/dialer/index.tsx?tsr-split=component":{"file":"assets/index-FpkIZOWx.js","name":"index","src":"src/routes/dialer/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js"]},"src/routes/enhancement-plan.tsx?tsr-split=component":{"file":"assets/enhancement-plan-BsLBhFRz.js","name":"enhancement-plan","src":"src/routes/enhancement-plan.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js"]},"src/routes/forgot-password/index.tsx?tsr-split=component":{"file":"assets/index-W2jtbhEp.js","name":"index","src":"src/routes/forgot-password/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_zod-Us8nOtev.js","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js"]},"src/routes/index.tsx?tsr-split=component":{"file":"assets/index-DH8TnoKe.js","name":"index","src":"src/routes/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_Layout-C0GgeWN6.js","_star-CaT70wlV.js","_sparkles-DL3wED8T.js","_circle-check-big-DhNyGKn9.js","_shield-B9LsuJor.js","_building-Cr22pXXN.js","_calendar-sVqVbs5g.js","_chevron-up-CkvKsemS.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js"]},"src/routes/login/index.tsx?tsr-split=component":{"file":"assets/index-C3rYj2Kj.js","name":"index","src":"src/routes/login/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_zod-Us8nOtev.js","_QuizIdentityLayout-_IpR82wO.js","_loader-circle-ZVWRwCK0.js"]},"src/routes/privacy-policy/index.tsx?tsr-split=component":{"file":"assets/index-CjTNm6D9.js","name":"index","src":"src/routes/privacy-policy/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js"]},"src/routes/register/index.tsx?tsr-split=component":{"file":"assets/index-CBriXJvf.js","name":"index","src":"src/routes/register/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_zod-Us8nOtev.js","_QuizIdentityLayout-_IpR82wO.js","_styles-CoJu3Vce.js"]},"src/routes/service-areas/index.tsx?tsr-split=component":{"file":"assets/index-DhJ2aryn.js","name":"index","src":"src/routes/service-areas/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_Layout-C0GgeWN6.js","_globe-D5ZtC8Lx.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js"]},"src/routes/services/commercial-cleaning/index.tsx?tsr-split=component":{"file":"assets/index-BlSZd1RH.js","name":"index","src":"src/routes/services/commercial-cleaning/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_ServicePageTemplate-ITBk_p3t.js","_building-Cr22pXXN.js","_shield-B9LsuJor.js","_clock-04BLIM7u.js","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js","_chevron-up-CkvKsemS.js"]},"src/routes/services/deep-home-cleaning/index.tsx?tsr-split=component":{"file":"assets/index-Dz4S-9eJ.js","name":"index","src":"src/routes/services/deep-home-cleaning/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_ServicePageTemplate-ITBk_p3t.js","_sparkles-DL3wED8T.js","_shield-B9LsuJor.js","_circle-check-big-DhNyGKn9.js","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js","_chevron-up-CkvKsemS.js"]},"src/routes/services/moving-cleaning/index.tsx?tsr-split=component":{"file":"assets/index-CMqbBkgJ.js","name":"index","src":"src/routes/services/moving-cleaning/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_ServicePageTemplate-ITBk_p3t.js","_circle-check-big-DhNyGKn9.js","_sparkles-DL3wED8T.js","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js","_chevron-up-CkvKsemS.js"]},"src/routes/services/post-construction-cleaning/index.tsx?tsr-split=component":{"file":"assets/index-Cv-EqSRQ.js","name":"index","src":"src/routes/services/post-construction-cleaning/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_ServicePageTemplate-ITBk_p3t.js","_sparkles-DL3wED8T.js","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js","_chevron-up-CkvKsemS.js"]},"src/routes/services/standard-home-cleaning/index.tsx?tsr-split=component":{"file":"assets/index-Dl62-OUh.js","name":"index","src":"src/routes/services/standard-home-cleaning/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_ServicePageTemplate-ITBk_p3t.js","_sparkles-DL3wED8T.js","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js","_chevron-up-CkvKsemS.js"]},"src/routes/services/vacation-rental-cleaning/index.tsx?tsr-split=component":{"file":"assets/index-7LGBC5_x.js","name":"index","src":"src/routes/services/vacation-rental-cleaning/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_ServicePageTemplate-ITBk_p3t.js","_clock-04BLIM7u.js","_star-CaT70wlV.js","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js","_chevron-up-CkvKsemS.js"]},"src/routes/terms-of-service/index.tsx?tsr-split=component":{"file":"assets/index-LGQWLsGL.js","name":"index","src":"src/routes/terms-of-service/index.tsx?tsr-split=component","isDynamicEntry":true,"imports":["index.html","_Layout-C0GgeWN6.js","_log-out-C9kJv6u3.js","_Footer-CWCGcQgO.js","_map-pin-BUW29wY0.js"]}}};

				const routeManifest = {};

        function createProdApp(appConfig) {
          return {
            config: { ...appConfig, buildManifest, routeManifest },
            getRouter(name) {
              return appConfig.routers.find(router => router.name === name)
            }
          }
        }

        function plugin$2(app) {
          const prodApp = createProdApp(appConfig);
          globalThis.app = prodApp;
        }

function plugin$1(app) {
	globalThis.$handle = (event) => app.h3App.handler(event);
}

/**
 * Traverses the module graph and collects assets for a given chunk
 *
 * @param {any} manifest Client manifest
 * @param {string} id Chunk id
 * @param {Map<string, string[]>} assetMap Cache of assets
 * @param {string[]} stack Stack of chunk ids to prevent circular dependencies
 * @returns Array of asset URLs
 */
function findAssetsInViteManifest(manifest, id, assetMap = new Map(), stack = []) {
	if (stack.includes(id)) {
		return [];
	}

	const cached = assetMap.get(id);
	if (cached) {
		return cached;
	}
	const chunk = manifest[id];
	if (!chunk) {
		return [];
	}

	const assets = [
		...(chunk.assets?.filter(Boolean) || []),
		...(chunk.css?.filter(Boolean) || [])
	];
	if (chunk.imports) {
		stack.push(id);
		for (let i = 0, l = chunk.imports.length; i < l; i++) {
			assets.push(...findAssetsInViteManifest(manifest, chunk.imports[i], assetMap, stack));
		}
		stack.pop();
	}
	assets.push(chunk.file);
	const all = Array.from(new Set(assets));
	assetMap.set(id, all);

	return all;
}

/** @typedef {import("../app.js").App & { config: { buildManifest: { [key:string]: any } }}} ProdApp */

function createHtmlTagsForAssets(router, app, assets) {
	return assets
		.filter(
			(asset) =>
				asset.endsWith(".css") ||
				asset.endsWith(".js") ||
				asset.endsWith(".mjs"),
		)
		.map((asset) => ({
			tag: "link",
			attrs: {
				href: joinURL(app.config.server.baseURL ?? "/", router.base, asset),
				key: join$1(app.config.server.baseURL ?? "", router.base, asset),
				...(asset.endsWith(".css")
					? { rel: "stylesheet", fetchPriority: "high" }
					: { rel: "modulepreload" }),
			},
		}));
}

/**
 *
 * @param {ProdApp} app
 * @returns
 */
function createProdManifest(app) {
	const manifest = new Proxy(
		{},
		{
			get(target, routerName) {
				invariant(typeof routerName === "string", "Bundler name expected");
				const router = app.getRouter(routerName);
				const bundlerManifest = app.config.buildManifest[routerName];

				invariant(
					router.type !== "static",
					"manifest not available for static router",
				);
				return {
					handler: router.handler,
					async assets() {
						/** @type {{ [key: string]: string[] }} */
						let assets = {};
						assets[router.handler] = await this.inputs[router.handler].assets();
						for (const route of (await router.internals.routes?.getRoutes()) ??
							[]) {
							assets[route.filePath] = await this.inputs[
								route.filePath
							].assets();
						}
						return assets;
					},
					async routes() {
						return (await router.internals.routes?.getRoutes()) ?? [];
					},
					async json() {
						/** @type {{ [key: string]: { output: string; assets: string[]} }} */
						let json = {};
						for (const input of Object.keys(this.inputs)) {
							json[input] = {
								output: this.inputs[input].output.path,
								assets: await this.inputs[input].assets(),
							};
						}
						return json;
					},
					chunks: new Proxy(
						{},
						{
							get(target, chunk) {
								invariant(typeof chunk === "string", "Chunk expected");
								const chunkPath = join$1(
									router.outDir,
									router.base,
									chunk + ".mjs",
								);
								return {
									import() {
										if (globalThis.$$chunks[chunk + ".mjs"]) {
											return globalThis.$$chunks[chunk + ".mjs"];
										}
										return import(
											/* @vite-ignore */ pathToFileURL(chunkPath).href
										);
									},
									output: {
										path: chunkPath,
									},
								};
							},
						},
					),
					inputs: new Proxy(
						{},
						{
							ownKeys(target) {
								const keys = Object.keys(bundlerManifest)
									.filter((id) => bundlerManifest[id].isEntry)
									.map((id) => id);
								return keys;
							},
							getOwnPropertyDescriptor(k) {
								return {
									enumerable: true,
									configurable: true,
								};
							},
							get(target, input) {
								invariant(typeof input === "string", "Input expected");
								if (router.target === "server") {
									const id =
										input === router.handler
											? virtualId(handlerModule(router))
											: input;
									return {
										assets() {
											return createHtmlTagsForAssets(
												router,
												app,
												findAssetsInViteManifest(bundlerManifest, id),
											);
										},
										output: {
											path: join$1(
												router.outDir,
												router.base,
												bundlerManifest[id].file,
											),
										},
									};
								} else if (router.target === "browser") {
									const id =
										input === router.handler && !input.endsWith(".html")
											? virtualId(handlerModule(router))
											: input;
									return {
										import() {
											return import(
												/* @vite-ignore */ joinURL(
													app.config.server.baseURL ?? "",
													router.base,
													bundlerManifest[id].file,
												)
											);
										},
										assets() {
											return createHtmlTagsForAssets(
												router,
												app,
												findAssetsInViteManifest(bundlerManifest, id),
											);
										},
										output: {
											path: joinURL(
												app.config.server.baseURL ?? "",
												router.base,
												bundlerManifest[id].file,
											),
										},
									};
								}
							},
						},
					),
				};
			},
		},
	);

	return manifest;
}

function plugin() {
	globalThis.MANIFEST =
		createProdManifest(globalThis.app)
			;
}

const chunks = {};
			 



			 function app() {
				 globalThis.$$chunks = chunks;
			 }

const plugins = [
  plugin$2,
plugin$1,
plugin,
app
];

const n = defineEventHandler$1(async (e) => {
  try {
    e.method === "POST" && await readBody(e);
  } catch (r) {
    console.error("Failed to read client log payload", r);
  }
  return new Response(null, { status: 204 });
});

function getDefaultExportFromNamespaceIfNotNamed (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
}

var main = {};

var SupabaseClient$1 = {};

const require$$3$1 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(functionsJs);

const require$$2 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(postgrestJs);

const require$$4$1 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(realtimeJs);

const require$$3 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(storageJs);

const require$$4 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(constants);

const require$$5 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(fetch$2);

const require$$6 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(helpers);

const require$$7 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(SupabaseAuthClient);

Object.defineProperty(SupabaseClient$1, "__esModule", { value: true });
const functions_js_1 = require$$3$1;
const postgrest_js_1 = require$$2;
const realtime_js_1 = require$$4$1;
const storage_js_1 = require$$3;
const constants_1 = require$$4;
const fetch_1 = require$$5;
const helpers_1 = require$$6;
const SupabaseAuthClient_1 = require$$7;
/**
 * Supabase Client.
 *
 * An isomorphic Javascript client for interacting with Postgres.
 */
class SupabaseClient {
    /**
     * Create a new client for use in the browser.
     * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
     * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
     * @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
     * @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
     * @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
     * @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
     * @param options.realtime Options passed along to realtime-js constructor.
     * @param options.storage Options passed along to the storage-js constructor.
     * @param options.global.fetch A custom fetch implementation.
     * @param options.global.headers Any additional headers to send with each network request.
     * @example
     * ```ts
     * import { createClient } from '@supabase/supabase-js'
     *
     * const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
     * const { data } = await supabase.from('profiles').select('*')
     * ```
     */
    constructor(supabaseUrl, supabaseKey, options) {
        var _a, _b, _c;
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        const baseUrl = (0, helpers_1.validateSupabaseUrl)(supabaseUrl);
        if (!supabaseKey)
            throw new Error('supabaseKey is required.');
        this.realtimeUrl = new URL('realtime/v1', baseUrl);
        this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace('http', 'ws');
        this.authUrl = new URL('auth/v1', baseUrl);
        this.storageUrl = new URL('storage/v1', baseUrl);
        this.functionsUrl = new URL('functions/v1', baseUrl);
        // default storage key uses the supabase project ref as a namespace
        const defaultStorageKey = `sb-${baseUrl.hostname.split('.')[0]}-auth-token`;
        const DEFAULTS = {
            db: constants_1.DEFAULT_DB_OPTIONS,
            realtime: constants_1.DEFAULT_REALTIME_OPTIONS,
            auth: Object.assign(Object.assign({}, constants_1.DEFAULT_AUTH_OPTIONS), { storageKey: defaultStorageKey }),
            global: constants_1.DEFAULT_GLOBAL_OPTIONS,
        };
        const settings = (0, helpers_1.applySettingDefaults)(options !== null && options !== void 0 ? options : {}, DEFAULTS);
        this.storageKey = (_a = settings.auth.storageKey) !== null && _a !== void 0 ? _a : '';
        this.headers = (_b = settings.global.headers) !== null && _b !== void 0 ? _b : {};
        if (!settings.accessToken) {
            this.auth = this._initSupabaseAuthClient((_c = settings.auth) !== null && _c !== void 0 ? _c : {}, this.headers, settings.global.fetch);
        }
        else {
            this.accessToken = settings.accessToken;
            this.auth = new Proxy({}, {
                get: (_, prop) => {
                    throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(prop)} is not possible`);
                },
            });
        }
        this.fetch = (0, fetch_1.fetchWithAuth)(supabaseKey, this._getAccessToken.bind(this), settings.global.fetch);
        this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, settings.realtime));
        if (this.accessToken) {
            // Start auth immediately to avoid race condition with channel subscriptions
            this.accessToken()
                .then((token) => this.realtime.setAuth(token))
                .catch((e) => console.warn('Failed to set initial Realtime auth token:', e));
        }
        this.rest = new postgrest_js_1.PostgrestClient(new URL('rest/v1', baseUrl).href, {
            headers: this.headers,
            schema: settings.db.schema,
            fetch: this.fetch,
        });
        this.storage = new storage_js_1.StorageClient(this.storageUrl.href, this.headers, this.fetch, options === null || options === void 0 ? void 0 : options.storage);
        if (!settings.accessToken) {
            this._listenForAuthEvents();
        }
    }
    /**
     * Supabase Functions allows you to deploy and invoke edge functions.
     */
    get functions() {
        return new functions_js_1.FunctionsClient(this.functionsUrl.href, {
            headers: this.headers,
            customFetch: this.fetch,
        });
    }
    /**
     * Perform a query on a table or a view.
     *
     * @param relation - The table or view name to query
     */
    from(relation) {
        return this.rest.from(relation);
    }
    // NOTE: signatures must be kept in sync with PostgrestClient.schema
    /**
     * Select a schema to query or perform an function (rpc) call.
     *
     * The schema needs to be on the list of exposed schemas inside Supabase.
     *
     * @param schema - The schema to query
     */
    schema(schema) {
        return this.rest.schema(schema);
    }
    // NOTE: signatures must be kept in sync with PostgrestClient.rpc
    /**
     * Perform a function call.
     *
     * @param fn - The function name to call
     * @param args - The arguments to pass to the function call
     * @param options - Named parameters
     * @param options.head - When set to `true`, `data` will not be returned.
     * Useful if you only need the count.
     * @param options.get - When set to `true`, the function will be called with
     * read-only access mode.
     * @param options.count - Count algorithm to use to count rows returned by the
     * function. Only applicable for [set-returning
     * functions](https://www.postgresql.org/docs/current/functions-srf.html).
     *
     * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
     * hood.
     *
     * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
     * statistics under the hood.
     *
     * `"estimated"`: Uses exact count for low numbers and planned count for high
     * numbers.
     */
    rpc(fn, args = {}, options = {
        head: false,
        get: false,
        count: undefined,
    }) {
        return this.rest.rpc(fn, args, options);
    }
    /**
     * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
     *
     * @param {string} name - The name of the Realtime channel.
     * @param {Object} opts - The options to pass to the Realtime channel.
     *
     */
    channel(name, opts = { config: {} }) {
        return this.realtime.channel(name, opts);
    }
    /**
     * Returns all Realtime channels.
     */
    getChannels() {
        return this.realtime.getChannels();
    }
    /**
     * Unsubscribes and removes Realtime channel from Realtime client.
     *
     * @param {RealtimeChannel} channel - The name of the Realtime channel.
     *
     */
    removeChannel(channel) {
        return this.realtime.removeChannel(channel);
    }
    /**
     * Unsubscribes and removes all Realtime channels from Realtime client.
     */
    removeAllChannels() {
        return this.realtime.removeAllChannels();
    }
    async _getAccessToken() {
        var _a, _b;
        if (this.accessToken) {
            return await this.accessToken();
        }
        const { data } = await this.auth.getSession();
        return (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : this.supabaseKey;
    }
    _initSupabaseAuthClient({ autoRefreshToken, persistSession, detectSessionInUrl, storage, userStorage, storageKey, flowType, lock, debug, throwOnError, }, headers, fetch) {
        const authHeaders = {
            Authorization: `Bearer ${this.supabaseKey}`,
            apikey: `${this.supabaseKey}`,
        };
        return new SupabaseAuthClient_1.SupabaseAuthClient({
            url: this.authUrl.href,
            headers: Object.assign(Object.assign({}, authHeaders), headers),
            storageKey: storageKey,
            autoRefreshToken,
            persistSession,
            detectSessionInUrl,
            storage,
            userStorage,
            flowType,
            lock,
            debug,
            throwOnError,
            fetch,
            // auth checks if there is a custom authorizaiton header using this flag
            // so it knows whether to return an error when getUser is called with no session
            hasCustomAuthorizationHeader: Object.keys(this.headers).some((key) => key.toLowerCase() === 'authorization'),
        });
    }
    _initRealtimeClient(options) {
        return new realtime_js_1.RealtimeClient(this.realtimeUrl.href, Object.assign(Object.assign({}, options), { params: Object.assign({ apikey: this.supabaseKey }, options === null || options === void 0 ? void 0 : options.params) }));
    }
    _listenForAuthEvents() {
        const data = this.auth.onAuthStateChange((event, session) => {
            this._handleTokenChanged(event, 'CLIENT', session === null || session === void 0 ? void 0 : session.access_token);
        });
        return data;
    }
    _handleTokenChanged(event, source, token) {
        if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') &&
            this.changedAccessToken !== token) {
            this.changedAccessToken = token;
            this.realtime.setAuth(token);
        }
        else if (event === 'SIGNED_OUT') {
            this.realtime.setAuth();
            if (source == 'STORAGE')
                this.auth.signOut();
            this.changedAccessToken = undefined;
        }
    }
}
SupabaseClient$1.default = SupabaseClient;

const require$$1 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(authJs);

(function (exports) {
	var __createBinding = (main && main.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (main && main.__exportStar) || function(m, exports) {
	    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
	};
	var __importDefault = (main && main.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createClient = exports.SupabaseClient = exports.FunctionRegion = exports.FunctionsError = exports.FunctionsRelayError = exports.FunctionsFetchError = exports.FunctionsHttpError = exports.PostgrestError = void 0;
	const SupabaseClient_1 = __importDefault(SupabaseClient$1);
	__exportStar(require$$1, exports);
	var postgrest_js_1 = require$$2;
	Object.defineProperty(exports, "PostgrestError", { enumerable: true, get: function () { return postgrest_js_1.PostgrestError; } });
	var functions_js_1 = require$$3$1;
	Object.defineProperty(exports, "FunctionsHttpError", { enumerable: true, get: function () { return functions_js_1.FunctionsHttpError; } });
	Object.defineProperty(exports, "FunctionsFetchError", { enumerable: true, get: function () { return functions_js_1.FunctionsFetchError; } });
	Object.defineProperty(exports, "FunctionsRelayError", { enumerable: true, get: function () { return functions_js_1.FunctionsRelayError; } });
	Object.defineProperty(exports, "FunctionsError", { enumerable: true, get: function () { return functions_js_1.FunctionsError; } });
	Object.defineProperty(exports, "FunctionRegion", { enumerable: true, get: function () { return functions_js_1.FunctionRegion; } });
	__exportStar(require$$4$1, exports);
	var SupabaseClient_2 = SupabaseClient$1;
	Object.defineProperty(exports, "SupabaseClient", { enumerable: true, get: function () { return __importDefault(SupabaseClient_2).default; } });
	/**
	 * Creates a new Supabase Client.
	 *
	 * @example
	 * ```ts
	 * import { createClient } from '@supabase/supabase-js'
	 *
	 * const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
	 * const { data, error } = await supabase.from('profiles').select('*')
	 * ```
	 */
	const createClient = (supabaseUrl, supabaseKey, options) => {
	    return new SupabaseClient_1.default(supabaseUrl, supabaseKey, options);
	};
	exports.createClient = createClient;
	// Check for Node.js <= 18 deprecation
	function shouldShowDeprecationWarning() {
	    // Skip if process is not available (e.g., Edge Runtime)
	    if (typeof process === 'undefined') {
	        return false;
	    }
	    // Use dynamic property access to avoid Next.js Edge Runtime static analysis warnings
	    const processVersion = process['version'];
	    if (processVersion === undefined || processVersion === null) {
	        return false;
	    }
	    const versionMatch = processVersion.match(/^v(\d+)\./);
	    if (!versionMatch) {
	        return false;
	    }
	    const majorVersion = parseInt(versionMatch[1], 10);
	    return majorVersion <= 18;
	}
	if (shouldShowDeprecationWarning()) {
	    console.warn(`⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. ` +
	        `Please upgrade to Node.js 20 or later. ` +
	        `For more information, visit: https://github.com/orgs/supabase/discussions/37217`);
	}
	
} (main));

var _a2;
const j = initTRPC.context().create({ transformer: se, sse: { enabled: true, client: { reconnectAfterInactivityMs: 5e3 }, ping: { enabled: true, intervalMs: 2500 } }, errorFormatter({ shape: e, error: n }) {
  return { ...e, data: { ...e.data, zodError: n.cause instanceof ZodError ? n.cause.flatten() : null } };
} }), ye = j.createCallerFactory, P = j.router, g = j.procedure, he = j.middleware, we = z$1.object({ NODE_ENV: z$1.enum(["development", "production"]), BASE_URL: z$1.string().optional(), BASE_URL_OTHER_PORT: z$1.string().optional(), DATABASE_URL: z$1.string().url(), DIRECT_URL: z$1.string().url(), SUPABASE_URL: z$1.string().url(), SUPABASE_SERVICE_ROLE_KEY: z$1.string(), ADMIN_PASSWORD: z$1.string(), JWT_SECRET: z$1.string(), OPENPHONE_API_KEY: z$1.string(), OPENPHONE_PHONE_NUMBER: z$1.string(), OPENPHONE_USER_ID: z$1.string().optional(), OPENPHONE_NUMBER_ID: z$1.string().optional(), STRIPE_SECRET_KEY: z$1.string(), STRIPE_PUBLISHABLE_KEY: z$1.string(), OPENAI_API_KEY: z$1.string().optional(), MERCURY_API_KEY: z$1.string().optional(), MERCURY_API_BASE: z$1.string().url().optional(), CANCELLATION_FEE_PERCENT: z$1.string().optional(), STORAGE_BUCKET_BOOKING_PHOTOS: z$1.string().optional() }), E = we.parse(process.env), be = () => new PrismaClient({ log: E.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"] }), G = globalThis, r = (_a2 = G.prisma) != null ? _a2 : be();
E.NODE_ENV !== "production" && (G.prisma = r);
const Ie = he(async ({ path: e, type: n, next: a, ctx: o }) => {
  var _a3, _b, _c;
  const s = await a();
  if (n === "mutation" && s.ok) {
    const { profile: c } = o;
    (c == null ? void 0 : c.id) && await r.systemLog.create({ data: { userId: c.id, action: e, entity: (_a3 = e.split(".")[0]) != null ? _a3 : "unknown", entityId: (_c = (_b = s.data) == null ? void 0 : _b.id) != null ? _c : void 0, after: s.data } });
  }
  return s;
}), S = g.use(({ ctx: e, next: n }) => {
  if (!e.authUser || !e.profile) throw new TRPCError({ code: "UNAUTHORIZED", message: `Auth failed: authUser=${!!e.authUser}, profile=${!!e.profile}` });
  return n({ ctx: { authUser: e.authUser, profile: e.profile, token: e.token } });
}), y = S.use(({ ctx: e, next: n }) => {
  var _a3;
  const a = (_a3 = e.profile) == null ? void 0 : _a3.role;
  if (a !== "ADMIN" && a !== "OWNER") throw new Error("FORBIDDEN");
  return n();
});
g.use(Ie);
const Ee = g.input(z$1.object({ serviceType: z$1.string(), houseSquareFootage: z$1.number().int().nonnegative().optional(), basementSquareFootage: z$1.number().int().nonnegative().optional(), numberOfBedrooms: z$1.number().int().nonnegative().optional(), numberOfBathrooms: z$1.number().int().nonnegative().optional(), selectedExtras: z$1.array(z$1.number()).optional() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c;
  const n = await r.pricingRule.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }), a = await r.discountConfig.findUnique({ where: { id: 1 } }), o = (f, b) => {
    let N = b;
    return f.priceRangeMin !== null && f.priceRangeMin !== void 0 && (N = Math.max(N, f.priceRangeMin)), f.priceRangeMax !== null && f.priceRangeMax !== void 0 && (N = Math.min(N, f.priceRangeMax)), N;
  };
  let s = 0, c = 0;
  const l = [], i = (e.houseSquareFootage || 0) + (e.basementSquareFootage || 0), m = n.find((f) => f.ruleType === "BASE_PRICE" && (f.serviceType === e.serviceType || f.serviceType === null));
  if (m) {
    const f = m.priceAmount || 0, b = o(m, f);
    s += b, l.push({ description: `Base price for ${e.serviceType}`, amount: b }), m.timeAmount && (c += m.timeAmount);
  }
  if (i > 0) {
    const f = n.find((b) => b.ruleType === "SQFT_RATE" && (b.serviceType === e.serviceType || b.serviceType === null));
    if (f == null ? void 0 : f.ratePerUnit) {
      const b = i * f.ratePerUnit, N = o(f, b);
      s += N, l.push({ description: `${i} sq ft @ $${f.ratePerUnit}/sq ft`, amount: N }), f.timePerUnit && (c += i * f.timePerUnit);
    }
  }
  if (e.numberOfBedrooms && e.numberOfBedrooms > 0) {
    const f = n.find((b) => b.ruleType === "BEDROOM_RATE" && (b.serviceType === e.serviceType || b.serviceType === null));
    if (f == null ? void 0 : f.ratePerUnit) {
      const b = e.numberOfBedrooms * f.ratePerUnit, N = o(f, b);
      s += N, l.push({ description: `${e.numberOfBedrooms} bedroom(s) @ $${f.ratePerUnit}/bedroom`, amount: N }), f.timePerUnit && (c += e.numberOfBedrooms * f.timePerUnit);
    }
  }
  if (e.numberOfBathrooms && e.numberOfBathrooms > 0) {
    const f = n.find((b) => b.ruleType === "BATHROOM_RATE" && (b.serviceType === e.serviceType || b.serviceType === null));
    if (f == null ? void 0 : f.ratePerUnit) {
      const b = e.numberOfBathrooms * f.ratePerUnit, N = o(f, b);
      s += N, l.push({ description: `${e.numberOfBathrooms} bathroom(s) @ $${f.ratePerUnit}/bathroom`, amount: N }), f.timePerUnit && (c += e.numberOfBathrooms * f.timePerUnit);
    }
  }
  if (e.selectedExtras && e.selectedExtras.length > 0) for (const f of e.selectedExtras) {
    const b = n.find((N) => N.id === f && N.ruleType === "EXTRA_SERVICE");
    if (b) {
      const N = b.priceAmount || 0, w = o(b, N);
      s += w, l.push({ description: b.extraName || "Extra service", amount: w }), b.timeAmount && (c += b.timeAmount);
    }
  }
  if (c === 0) {
    const f = n.find((b) => b.ruleType === "TIME_ESTIMATE" && (b.serviceType === e.serviceType || b.serviceType === null));
    f && (f.timeAmount && (c += f.timeAmount), f.timePerUnit && i > 0 && (c += i * f.timePerUnit));
  }
  const p = Math.round(s * 100);
  let d = 0;
  (a == null ? void 0 : a.active) && (a.type === "PERCENT" ? d = Math.round(p * (a.value / 100)) : d = Math.round(a.value * 100), d = Math.min(d, p));
  const u = Math.max(p - d, 0), h = Math.round(u) / 100, I = Math.ceil(c * 2) / 2;
  return { price: h, durationHours: I > 0 ? I : null, breakdown: l, originalTotalCents: p, discountCents: d, finalTotalCents: u, discountLabel: (_a3 = a == null ? void 0 : a.label) != null ? _a3 : null, discountType: (_b = a == null ? void 0 : a.type) != null ? _b : null, discountValue: (_c = a == null ? void 0 : a.value) != null ? _c : null };
}), Ne = g.input(z$1.object({ draft: z$1.any() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c, _d, _e2, _f, _g, _h, _i, _j, _k, _l, _m, _n2, _o, _p, _q, _r, _s, _t2, _u, _v, _w, _x, _y, _z;
  const n = e.draft;
  if (!n || !n.contact || !n.contact.email) throw new Error("Missing contact information (email) in booking draft.");
  let a = await r.user.findUnique({ where: { email: n.contact.email } });
  a ? !a.phone && n.contact.phone && await r.user.update({ where: { id: a.id }, data: { phone: n.contact.phone } }) : a = await r.user.create({ data: { email: n.contact.email, firstName: ((_a3 = n.contact.fullName) == null ? void 0 : _a3.split(" ")[0]) || "Client", lastName: ((_b = n.contact.fullName) == null ? void 0 : _b.split(" ").slice(1).join(" ")) || "", phone: n.contact.phone, role: "CLIENT", password: "" } });
  const o = [((_c = n.address) == null ? void 0 : _c.street) || ((_e2 = (_d = n.address) == null ? void 0 : _d.formatted) == null ? void 0 : _e2.split(",")[0]) || "", ((_f = n.address) == null ? void 0 : _f.city) || "", ((_g = n.address) == null ? void 0 : _g.state) || "", ((_h = n.address) == null ? void 0 : _h.zip) || ""].filter(Boolean), s = o.length > 0 ? o.join(", ") : ((_i = n.address) == null ? void 0 : _i.formatted) || "Address not provided", c = await r.booking.create({ data: { clientId: a.id, serviceType: ((_j = n.cleanType) == null ? void 0 : _j.toUpperCase()) || "STANDARD", scheduledDate: new Date(((_k = n.schedule) == null ? void 0 : _k.dateISO) || /* @__PURE__ */ new Date()), scheduledTime: ((_l = n.schedule) == null ? void 0 : _l.timeSlotStartISO) || "09:00", address: s, numberOfBedrooms: n.beds || 1, numberOfBathrooms: n.baths || 1, finalPrice: ((_m = n.pricing) == null ? void 0 : _m.total) || 0, status: "PENDING", numberOfCleanersRequested: 1, specialInstructions: ((_n2 = n.logistics) == null ? void 0 : _n2.cleaningInstructions) || null, addressLine1: (_o = n.address) == null ? void 0 : _o.street, city: (_p = n.address) == null ? void 0 : _p.city, state: (_q = n.address) == null ? void 0 : _q.state, postalCode: (_r = n.address) == null ? void 0 : _r.zip, placeId: (_s = n.address) == null ? void 0 : _s.placeId, latitude: (_t2 = n.address) == null ? void 0 : _t2.lat, longitude: (_u = n.address) == null ? void 0 : _u.lng } });
  return await r.cleanQuizSubmission.create({ data: { fullName: n.contact.fullName, email: n.contact.email, phone: n.contact.phone, cleanType: n.cleanType, bedrooms: n.beds, bathrooms: n.baths, addressLine1: (_v = n.address) == null ? void 0 : _v.street, city: (_w = n.address) == null ? void 0 : _w.city, state: (_x = n.address) == null ? void 0 : _x.state, postalCode: (_y = n.address) == null ? void 0 : _y.zip, finalTotalCents: Math.round((((_z = n.pricing) == null ? void 0 : _z.total) || 0) * 100), status: "confirmed" } }), { success: true, bookingId: c.id, userId: a.id };
}), ve = g.query(async () => ({ rules: await r.pricingRule.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, ruleType: true, serviceType: true, priceAmount: true, ratePerUnit: true, timeAmount: true, timePerUnit: true, extraName: true, extraDescription: true, priceRangeMin: true, priceRangeMax: true } }) })), Te = g.query(async () => {
  const e = await r.discountConfig.findUnique({ where: { id: 1 } });
  return e || r.discountConfig.create({ data: { id: 1, active: false, type: "PERCENT", value: 0, label: "Get Discount" } });
}), Pe = y.input(z$1.object({ active: z$1.boolean(), type: z$1.enum(["PERCENT", "FIXED_AMOUNT"]), value: z$1.number().nonnegative(), label: z$1.string().min(1) })).mutation(async ({ input: e }) => r.discountConfig.upsert({ where: { id: 1 }, create: { id: 1, ...e }, update: { ...e } })), De = 10, ke = 3, Re = (e) => {
  const n = e.replace(/\D/g, "");
  return n.length === 10 ? `+1${n}` : n.length === 11 && n.startsWith("1") ? `+${n}` : e.startsWith("+") ? e : `+${n}`;
}, Ae = () => nodeCrypto.randomInt(0, 1e6).toString().padStart(6, "0"), Oe = g.input(z$1.object({ phone: z$1.string().min(6) })).mutation(async ({ input: e }) => {
  if (!E.OPENPHONE_API_KEY || !E.OPENPHONE_PHONE_NUMBER) throw new Error("SMS delivery is not configured. Please add OPENPHONE_API_KEY and OPENPHONE_PHONE_NUMBER env vars.");
  const n = Re(e.phone), a = /* @__PURE__ */ new Date(), o = await r.otpVerification.findFirst({ where: { phone: n, verifiedAt: null, supersededAt: null }, orderBy: { createdAt: "desc" } });
  if ((o == null ? void 0 : o.lockedUntil) && o.lockedUntil > a) throw new Error("Too many attempts. Try again later.");
  if (o && o.resendCount >= ke && o.createdAt > new Date(a.getTime() - 15 * 60 * 1e3)) throw new Error("Resend limit reached. Please wait before trying again.");
  let s = Ae(), c = await U.hash(s, 10);
  const l = new Date(a.getTime() + De * 60 * 1e3), i = await fetch("https://api.openphone.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", Authorization: E.OPENPHONE_API_KEY }, body: JSON.stringify({ to: [n], from: E.OPENPHONE_PHONE_NUMBER, userId: E.OPENPHONE_USER_ID, content: `Your Verde Luxe verification code is ${s}. It expires in 10 minutes.` }) });
  if (!i.ok) {
    const p = await i.text();
    throw i.status === 401 ? new Error(`OpenPhone rejected the request (401). Check API key/phone number credentials. Body: ${p}`) : new Error(`Failed to send verification code. ${i.status} ${i.statusText} ${p}`);
  }
  await r.otpVerification.updateMany({ where: { phone: n, verifiedAt: null, supersededAt: null }, data: { supersededAt: a } });
  const m = o ? o.resendCount + 1 : 0;
  return await r.otpVerification.create({ data: { phone: n, otpHash: c, expiresAt: l, resendCount: m } }), { phone: n, expiresAt: l, devCode: void 0 };
}), D = main.createClient(E.SUPABASE_URL, E.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } }), Ce = 5, Me = (e) => {
  const n = e.replace(/\D/g, "");
  return n.length === 10 ? `+1${n}` : n.length === 11 && n.startsWith("1") ? `+${n}` : e.startsWith("+") ? e : `+${n}`;
}, qe = g.input(z$1.object({ phone: z$1.string().min(6), code: z$1.string().length(6), submissionId: z$1.number().optional() })).mutation(async ({ input: e }) => {
  const n = Me(e.phone), a = /* @__PURE__ */ new Date(), o = await r.otpVerification.findFirst({ where: { phone: n, verifiedAt: null, supersededAt: null }, orderBy: { createdAt: "desc" } });
  if (!o) throw new Error("No verification code found. Please request a new code.");
  if (o.lockedUntil && o.lockedUntil > a) throw new Error("Too many attempts. Try again later.");
  if (o.expiresAt < a) throw new Error("Verification code expired. Please request a new one.");
  if (!await U.compare(e.code, o.otpHash)) {
    const d = o.attemptCount + 1;
    throw await r.otpVerification.update({ where: { id: o.id }, data: { attemptCount: d, lockedUntil: d >= Ce ? new Date(a.getTime() + 15 * 60 * 1e3) : null } }), new Error("Invalid code. Please try again.");
  }
  await r.otpVerification.update({ where: { id: o.id }, data: { verifiedAt: a } }), e.submissionId && await r.cleanQuizSubmission.update({ where: { id: e.submissionId }, data: { phoneVerified: true } });
  const c = e.phone.replace(/\D/g, ""), l = Array.from(/* @__PURE__ */ new Set([n, e.phone, c, `+${c}`, c.startsWith("1") ? `+${c}` : `+1${c}`])).filter(Boolean);
  console.log("[verifyQuizOtp] Searching for user with terms:", l);
  const i = await r.user.findFirst({ where: { OR: l.map((d) => ({ phone: d })) } });
  if (!i) return console.log(`[verifyQuizOtp] No user found with phone: ${n} or ${e.phone}`), { verified: true, token: null, user: null };
  let m = null;
  const p = process.env.VITE_BOOKING_TEMP_PASSWORD || "TempPass123!@";
  try {
    console.log(`[verifyQuizOtp] Attempting login for ${i.email} with temp password...`);
    const { data: d, error: u } = await D.auth.signInWithPassword({ email: i.email, password: p });
    if (!u && d.session) m = d.session.access_token, console.log(`[verifyQuizOtp] Login successful for ${i.email}`);
    else {
      console.log(`[verifyQuizOtp] Temp password sign-in failed (Error: ${u == null ? void 0 : u.message}), attempting admin password reset...`);
      const { data: h, error: I } = await D.auth.admin.listUsers();
      if (I) return console.error("[verifyQuizOtp] Failed to list users for password reset:", I), { verified: true, token: null, user: null };
      const f = h.users.find((b) => {
        var _a3;
        return ((_a3 = b.email) == null ? void 0 : _a3.toLowerCase()) === i.email.toLowerCase();
      });
      if (f) {
        console.log(`[verifyQuizOtp] Found Supabase user ${f.id}, updating password...`);
        const { error: b } = await D.auth.admin.updateUserById(f.id, { password: p });
        if (b) console.error(`[verifyQuizOtp] Failed to reset password for ${i.email}:`, b.message);
        else {
          console.log("[verifyQuizOtp] Password reset successful, retrying login...");
          const { data: N, error: w } = await D.auth.signInWithPassword({ email: i.email, password: p });
          !w && N.session ? m = N.session.access_token : console.error("[verifyQuizOtp] Retry login failed:", w == null ? void 0 : w.message);
        }
      } else console.error(`[verifyQuizOtp] Could not find Supabase user with email ${i.email} among ${h.users.length} users.`);
    }
  } catch (d) {
    console.error("[verifyQuizOtp] Auth session creation failed:", d);
  }
  return { verified: true, token: m, user: m ? { id: i.id, email: i.email, role: i.role, firstName: i.firstName, lastName: i.lastName, phone: i.phone } : null };
}), Ue = 10, Se = 3, _e = (e) => {
  const n = e.replace(/\D/g, "");
  return n.length === 10 ? `+1${n}` : n.length === 11 && n.startsWith("1") ? `+${n}` : e.startsWith("+") ? e : `+${n}`;
}, Be = () => nodeCrypto.randomInt(0, 1e6).toString().padStart(6, "0"), Le = g.input(z$1.object({ phone: z$1.string().min(6) })).mutation(async ({ input: e }) => {
  const n = _e(e.phone), a = /* @__PURE__ */ new Date(), o = await r.otpVerification.findFirst({ where: { phone: n, verifiedAt: null, supersededAt: null }, orderBy: { createdAt: "desc" } });
  if ((o == null ? void 0 : o.lockedUntil) && o.lockedUntil > a) throw new Error("Too many attempts. Try again later.");
  const s = o ? o.resendCount + 1 : 1;
  if (s > Se) throw new Error("Resend limit reached. Please wait before trying again.");
  let c = Be(), l = await U.hash(c, 10);
  const i = new Date(a.getTime() + Ue * 60 * 1e3), m = await fetch("https://api.openphone.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${E.OPENPHONE_API_KEY}` }, body: JSON.stringify({ to: [n], from: E.OPENPHONE_PHONE_NUMBER, userId: E.OPENPHONE_USER_ID, content: `Your Verde Luxe verification code is ${c}. It expires in 10 minutes.` }) });
  if (!m.ok) {
    const p = await m.text();
    throw m.status === 401 ? new Error(`OpenPhone rejected the request (401). Check API key/phone number credentials. Body: ${p}`) : new Error(`Failed to send verification code. ${m.status} ${m.statusText} ${p}`);
  }
  return await r.otpVerification.updateMany({ where: { phone: n, verifiedAt: null, supersededAt: null }, data: { supersededAt: a } }), await r.otpVerification.create({ data: { phone: n, otpHash: l, expiresAt: i, resendCount: s } }), { phone: n, expiresAt: i, devCode: void 0 };
}), Fe = g.input(z$1.object({ fullName: z$1.string().min(1), email: z$1.string().email(), phone: z$1.string().min(6) })).mutation(async ({ input: e }) => ({ submissionId: (await r.cleanQuizSubmission.create({ data: { fullName: e.fullName, email: e.email, phone: e.phone, status: "started" } })).id })), je = g.input(z$1.object({ submissionId: z$1.number(), data: z$1.object({ cleanType: z$1.string().optional(), bedrooms: z$1.number().int().optional(), bathrooms: z$1.number().int().optional(), messiness: z$1.number().int().min(1).max(5).optional(), kids: z$1.boolean().optional(), pets: z$1.boolean().optional(), addressLine1: z$1.string().optional(), addressLine2: z$1.string().optional(), city: z$1.string().optional(), state: z$1.string().optional(), postalCode: z$1.string().optional(), country: z$1.string().optional(), placeId: z$1.string().optional(), latitude: z$1.number().optional(), longitude: z$1.number().optional(), extras: z$1.any().optional(), recommendedCleanType: z$1.string().optional(), recommendedDurationHours: z$1.number().optional(), originalTotalCents: z$1.number().int().optional(), discountCents: z$1.number().int().optional(), finalTotalCents: z$1.number().int().optional(), appointmentDateTime: z$1.string().optional(), willBeHome: z$1.boolean().optional(), homeType: z$1.string().optional(), parkingNotes: z$1.string().optional(), entryInstructions: z$1.string().optional(), cleaningInstructions: z$1.string().optional(), termsAccepted: z$1.boolean().optional(), status: z$1.string().optional() }).partial() })).mutation(async ({ input: e }) => {
  const n = { ...e.data };
  return e.data.appointmentDateTime && (n.appointmentDateTime = new Date(e.data.appointmentDateTime)), r.cleanQuizSubmission.update({ where: { id: e.submissionId }, data: n });
}), T = new ue(E.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" }), $e = g.input(z$1.object({ submissionId: z$1.number() })).mutation(async ({ input: e }) => {
  const n = await r.cleanQuizSubmission.findUnique({ where: { id: e.submissionId } });
  if (!n) throw new Error("Quiz submission not found.");
  let a = n.stripeCustomerId || void 0;
  a || (a = (await T.customers.create({ email: n.email, name: n.fullName, phone: n.phone })).id);
  const o = await T.setupIntents.create({ usage: "off_session", customer: a, metadata: { submissionId: n.id.toString() } });
  return await r.cleanQuizSubmission.update({ where: { id: n.id }, data: { stripeCustomerId: a, stripeSetupIntentId: o.id } }), { clientSecret: o.client_secret, setupIntentId: o.id, customerId: a };
}), xe = g.input(z$1.object({ submissionId: z$1.number(), setupIntentId: z$1.string() })).mutation(async ({ input: e }) => {
  const n = await r.cleanQuizSubmission.findUnique({ where: { id: e.submissionId } });
  if (!n) throw new Error("Quiz submission not found.");
  const a = await T.setupIntents.retrieve(e.setupIntentId), o = typeof a.payment_method == "string" ? a.payment_method : null;
  if (!o) throw new Error("No payment method attached.");
  return n.stripeCustomerId && (await T.paymentMethods.attach(o, { customer: n.stripeCustomerId }), await T.customers.update(n.stripeCustomerId, { invoice_settings: { default_payment_method: o } })), await r.cleanQuizSubmission.update({ where: { id: n.id }, data: { stripeSetupIntentId: e.setupIntentId, stripePaymentMethodId: o } }), { paymentMethodId: o };
}), He = g.input(z$1.object({ submissionId: z$1.number() })).mutation(async ({ input: e }) => {
  var _a3;
  const n = await r.cleanQuizSubmission.findUnique({ where: { id: e.submissionId } });
  if (!n) throw new Error("Quiz submission not found.");
  if (!n.finalTotalCents || !n.stripePaymentMethodId) throw new Error("Missing pricing or payment method.");
  const a = await T.paymentIntents.create({ amount: n.finalTotalCents, currency: "usd", customer: (_a3 = n.stripeCustomerId) != null ? _a3 : void 0, payment_method: n.stripePaymentMethodId, confirm: true, description: `Verde Luxe booking quiz #${n.id}`, metadata: { submissionId: n.id.toString() } });
  return await r.cleanQuizSubmission.update({ where: { id: n.id }, data: { stripePaymentIntentId: a.id, status: a.status === "succeeded" ? "confirmed" : "payment_pending" } }), { status: a.status };
});
function M(e, n) {
  const a = (m) => m ? typeof m == "string" ? new Date(m) : m : null, o = a(e), s = a(n);
  if (!o && !s) return { start: null, end: null };
  const c = "America/Detroit", l = o ? /* @__PURE__ */ new Date(new Intl.DateTimeFormat("en-CA", { timeZone: c, year: "numeric", month: "2-digit", day: "2-digit" }).format(o).replace(/-/g, "/") + " 00:00:00") : null, i = s ? /* @__PURE__ */ new Date(new Intl.DateTimeFormat("en-CA", { timeZone: c, year: "numeric", month: "2-digit", day: "2-digit" }).format(s).replace(/-/g, "/") + " 23:59:59") : null;
  return { start: l, end: i };
}
const Ye = g.input(z$1.object({ date: z$1.string() })).query(async ({ input: e }) => {
  const { start: n, end: a } = M(e.date, e.date);
  if (!n || !a) return { isFullyBooked: false, count: 0 };
  const o = await r.booking.count({ where: { scheduledDate: { gte: n, lte: a } } });
  return { isFullyBooked: o >= 8, count: o };
}), ze = P({ calculateQuizPrice: Ee, createBookingFromQuiz: Ne, getPublicPricingRules: ve, getDiscountConfig: Te, upsertDiscountConfig: Pe, sendQuizOtp: Oe, verifyQuizOtp: qe, resendQuizOtp: Le, startQuizSubmission: Fe, updateQuizSubmission: je, createQuizSetupIntent: $e, attachQuizPaymentMethod: xe, confirmQuizPayment: He, getQuizAvailability: Ye }), Ke = g.input(z$1.object({ email: z$1.string().email("Valid email is required"), password: z$1.string().min(1, "Password is required") })).mutation(async ({ input: e }) => {
  const { data: n, error: a } = await D.auth.signInWithPassword({ email: e.email, password: e.password });
  if (a || !n.session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
  const o = await r.user.findUnique({ where: { email: e.email } });
  if (!o) throw new TRPCError({ code: "UNAUTHORIZED", message: "Account exists in Supabase Auth but no matching profile. Contact support." });
  return { token: n.session.access_token, user: { id: o.id, email: o.email, role: o.role, firstName: o.firstName, lastName: o.lastName, adminPermissions: o.role === "ADMIN" || o.role === "OWNER" ? o.adminPermissions : null } };
}), We = g.input(z$1.object({ authToken: z$1.string() })).query(async ({ input: e }) => {
  try {
    const n = Q.verify(e.authToken, E.JWT_SECRET), a = z$1.object({ userId: z$1.number() }).parse(n), o = await r.user.findUnique({ where: { id: a.userId } });
    if (!o) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return { id: o.id, email: o.email, role: o.role, firstName: o.firstName, lastName: o.lastName, phone: o.phone, adminPermissions: o.role === "ADMIN" || o.role === "OWNER" ? o.adminPermissions : null };
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired token" });
  }
}), Ve = g.input(z$1.object({ email: z$1.string().email("Valid email is required"), temporaryPassword: z$1.string().min(1, "Temporary password is required"), newPassword: z$1.string().min(8, "Password must be at least 8 characters") })).mutation(async ({ input: e }) => {
  var _a3;
  const n = await r.user.findUnique({ where: { email: e.email } });
  if (!n) throw new TRPCError({ code: "NOT_FOUND", message: "No account found with this email address" });
  if (n.temporaryPassword) {
    if (e.temporaryPassword !== n.temporaryPassword) throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect temporary password. Please contact us if you've forgotten it." });
  } else throw new TRPCError({ code: "BAD_REQUEST", message: "This account was not created with a temporary password. Please use the login page or contact support." });
  const { data: a, error: o } = await D.auth.admin.listUsers({ page: 1, perPage: 1, email: e.email });
  if (o || !((_a3 = a.users) == null ? void 0 : _a3[0])) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to locate account in auth provider" });
  const s = a.users[0].id, { error: c } = await D.auth.admin.updateUserById(s, { password: e.newPassword });
  if (c) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to reset password. Please try again." });
  return await r.user.update({ where: { id: n.id }, data: { hasResetPassword: true } }), { success: true, message: "Password has been reset successfully. You can now log in with your new password." };
}), Qe = g.input(z$1.object({}).optional()).query(async ({ input: e, ctx: n }) => {
  var _a3, _b, _c;
  try {
    let a = n.profile;
    if (!a && n.token) {
      const i = (_c = (_b = (_a3 = await supabaseServer.auth.getUser(n.token)) == null ? void 0 : _a3.data) == null ? void 0 : _b.user) == null ? void 0 : _c.email;
      if (i) {
        const m = await r.user.findUnique({ where: { email: i } });
        m && (a = { id: m.id, email: m.email, role: m.role, firstName: m.firstName, lastName: m.lastName, adminPermissions: m.adminPermissions });
      }
    }
    if (!a) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    if (a.role !== "CLEANER") throw new TRPCError({ code: "FORBIDDEN", message: "Only cleaners can access schedules" });
    const o = await r.booking.findMany({ where: { cleanerId: a.id }, include: { client: { select: { firstName: true, lastName: true, email: true, phone: true } }, checklist: { include: { items: { orderBy: { order: "asc" } }, template: { select: { name: true } } } } }, orderBy: { scheduledDate: "asc" } }), s = /* @__PURE__ */ new Date();
    return { bookings: o.map((l) => new Date(l.scheduledDate) < s && l.status !== "CANCELLED" ? { ...l, status: "COMPLETED" } : l) };
  } catch (a) {
    throw a instanceof TRPCError ? a : new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired token" });
  }
}), Ge = g.input(z$1.object({ startDate: z$1.string().optional(), endDate: z$1.string().optional() })).query(async ({ input: e, ctx: n }) => {
  var _a3, _b, _c;
  try {
    let a = n.profile;
    if (!a && n.token) {
      const p = (_c = (_b = (_a3 = await D.auth.getUser(n.token)) == null ? void 0 : _a3.data) == null ? void 0 : _b.user) == null ? void 0 : _c.email;
      if (p) {
        const d = await r.user.findUnique({ where: { email: p } });
        d && (a = { id: d.id, email: d.email, role: d.role, firstName: d.firstName, lastName: d.lastName, adminPermissions: d.adminPermissions });
      }
    }
    if (!a) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    if (a.role !== "CLEANER") throw new TRPCError({ code: "FORBIDDEN", message: "Only cleaners can access payment information" });
    const o = {};
    if (e.startDate && (o.gte = new Date(e.startDate)), e.endDate) {
      const m = new Date(e.endDate);
      m.setHours(23, 59, 59, 999), o.lte = m;
    }
    const s = await r.payment.findMany({ where: { cleanerId: a.id, ...Object.keys(o).length > 0 ? { booking: { scheduledDate: o } } : {} }, include: { booking: { select: { serviceType: true, scheduledDate: true, address: true } } }, orderBy: { createdAt: "desc" } }), c = s.reduce((m, p) => m + p.amount, 0), l = s.filter((m) => m.paidAt !== null).reduce((m, p) => m + p.amount, 0), i = c - l;
    return { payments: s, summary: { totalEarnings: c, paidEarnings: l, pendingEarnings: i } };
  } catch (a) {
    throw a instanceof TRPCError ? a : new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired token" });
  }
}), Xe = S.query(async ({ ctx: e }) => {
  if (e.profile.role !== "CLIENT") throw new TRPCError({ code: "FORBIDDEN", message: "Only clients can access their bookings" });
  const n = /* @__PURE__ */ new Date();
  return { bookings: await r.booking.findMany({ where: { clientId: e.profile.id, scheduledDate: { gte: n }, status: { notIn: ["CANCELLED", "COMPLETED"] } }, include: { cleaner: { select: { firstName: true, lastName: true, phone: true } } }, orderBy: { scheduledDate: "asc" } }) };
}), Ze = S.query(async ({ ctx: e }) => {
  if (e.profile.role !== "CLIENT") throw new TRPCError({ code: "FORBIDDEN", message: "Only clients can access their bookings" });
  const n = await r.booking.findMany({ where: { clientId: e.profile.id }, include: { cleaner: { select: { firstName: true, lastName: true, phone: true } } }, orderBy: { scheduledDate: "desc" } }), a = /* @__PURE__ */ new Date();
  return { bookings: n.map((s) => new Date(s.scheduledDate) < a && s.status !== "CANCELLED" ? { ...s, status: "COMPLETED" } : s) };
}), Je = y.input(z$1.object({ startDate: z$1.string().optional(), endDate: z$1.string().optional(), clientId: z$1.number().optional(), cleanerId: z$1.number().optional(), status: z$1.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(), backfillRecurrence: z$1.boolean().optional() })).query(async ({ input: e }) => {
  const n = {};
  if (e.startDate || e.endDate) {
    const i = M(e.startDate, e.endDate);
    n.scheduledDate = { ...i.start ? { gte: i.start } : {}, ...i.end ? { lte: i.end } : {} };
  }
  e.clientId && (n.clientId = e.clientId), e.cleanerId && (n.OR = [{ cleanerId: e.cleanerId }, { cleaners: { some: { cleanerId: e.cleanerId } } }]), e.status && (n.status = e.status);
  const a = await r.booking.findMany({ where: n, include: { client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, color: true } }, checklist: { include: { items: { select: { id: true, isCompleted: true, completedAt: true, completedBy: true }, orderBy: { order: "asc" } }, template: { select: { name: true, serviceType: true } } } }, cleaners: { include: { cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, color: true } } } }, stripePayments: { orderBy: { createdAt: "desc" }, select: { stripeIntentId: true, paymentMethod: true, status: true, createdAt: true } } }, orderBy: { scheduledDate: "asc" } });
  if (e.backfillRecurrence) {
    for (const i of a) if (!i.recurrenceId && i.serviceFrequency && i.serviceFrequency !== "ONE_TIME") {
      const m = H$1.randomUUID();
      await r.booking.update({ where: { id: i.id }, data: { recurrenceId: m, occurrenceNumber: 1 } });
    }
  }
  const o = /* @__PURE__ */ new Date(), s = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Detroit", year: "numeric", month: "2-digit", day: "2-digit" }), c = (i) => {
    var _a3, _b, _c;
    const m = s.formatToParts(i).reduce((p, d) => (d.type === "year" && (p.year = Number(d.value)), d.type === "month" && (p.month = Number(d.value)), d.type === "day" && (p.day = Number(d.value)), p), {});
    return new Date((_a3 = m.year) != null ? _a3 : i.getFullYear(), ((_b = m.month) != null ? _b : 1) - 1, (_c = m.day) != null ? _c : i.getDate());
  };
  return { bookings: a.map((i) => {
    var _a3, _b;
    if (c(new Date(i.scheduledDate)) < c(o) && i.status !== "CANCELLED") return { ...i, status: "COMPLETED" };
    const p = (_a3 = i.stripePayments) == null ? void 0 : _a3[0];
    return { ...i, paymentIntentId: p == null ? void 0 : p.stripeIntentId, paymentMethod: (_b = p == null ? void 0 : p.paymentMethod) != null ? _b : i.paymentMethod };
  }) };
}), et = y.input(z$1.object({ role: z$1.enum(["CLIENT", "CLEANER", "ADMIN", "OWNER"]).optional(), search: z$1.string().optional() })).query(async ({ input: e }) => {
  const n = {};
  if (e.role && (n.role = e.role), e.search) {
    const o = e.search;
    n.OR = [{ email: { contains: o, mode: "insensitive" } }, { firstName: { contains: o, mode: "insensitive" } }, { lastName: { contains: o, mode: "insensitive" } }, { phone: { contains: o, mode: "insensitive" } }];
  }
  return { users: await r.user.findMany({ where: n, select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, color: true, createdAt: true, temporaryPassword: true, hasResetPassword: true, adminPermissions: true }, orderBy: { createdAt: "desc" } }) };
}), tt = y.input(z$1.object({ customerId: z$1.number() })).query(async ({ input: e }) => {
  const n = await r.user.findUnique({ where: { id: e.customerId }, select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, createdAt: true, clientBookings: { include: { cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, payments: true, checklist: { include: { items: true } } } }, cleanerBookings: { include: { client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, payments: true, checklist: { include: { items: true } } } }, timeEntries: true, timeOffRequests: true, payments: true } });
  if (!n) throw new Error("Customer not found");
  const a = [...n.clientBookings || [], ...n.cleanerBookings || []];
  return { customer: { ...n, bookings: a } };
}), nt = y.input(z$1.object({ customerId: z$1.number() })).query(async ({ input: e }) => {
  const n = await r.user.findUnique({ where: { id: e.customerId } });
  if (!n) throw new Error("Customer not found");
  return n.stripeCustomerId ? { paymentMethods: (await T.paymentMethods.list({ customer: n.stripeCustomerId, type: "card" })).data.map((o) => {
    var _a3, _b, _c, _d;
    return { id: o.id, brand: (_a3 = o.card) == null ? void 0 : _a3.brand, last4: (_b = o.card) == null ? void 0 : _b.last4, exp_month: (_c = o.card) == null ? void 0 : _c.exp_month, exp_year: (_d = o.card) == null ? void 0 : _d.exp_year, isDefault: n.stripeDefaultPaymentMethodId === o.id };
  }) } : { paymentMethods: [] };
}), at = S.query(async ({ ctx: e }) => {
  const { profile: n } = e;
  return { user: n };
}), rt = y.input(z$1.object({ clientId: z$1.number().optional(), clientEmail: z$1.string().email().optional(), clientFirstName: z$1.string().optional(), clientLastName: z$1.string().optional(), clientPhone: z$1.string().optional(), cleanerId: z$1.number().nullable().optional(), cleanerIds: z$1.array(z$1.number()).optional(), recurrenceId: z$1.string().optional(), occurrenceNumber: z$1.number().int().optional(), serviceType: z$1.string().min(1, "Service type is required"), scheduledDate: z$1.string().datetime(), scheduledTime: z$1.string().min(1, "Time is required"), durationHours: z$1.number().positive().optional(), address: z$1.string().min(1, "Address is required"), addressLine1: z$1.string().optional(), addressLine2: z$1.string().optional(), city: z$1.string().optional(), state: z$1.string().optional(), postalCode: z$1.string().optional(), placeId: z$1.string().optional(), latitude: z$1.number().optional(), longitude: z$1.number().optional(), specialInstructions: z$1.string().optional(), privateBookingNote: z$1.string().optional(), privateCustomerNote: z$1.string().optional(), providerNote: z$1.string().optional(), finalPrice: z$1.number().positive().optional(), status: z$1.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"), serviceFrequency: z$1.enum(["ONE_TIME", "WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(), houseSquareFootage: z$1.number().int().positive().optional(), basementSquareFootage: z$1.number().int().positive().optional(), numberOfBedrooms: z$1.number().int().positive().optional(), numberOfBathrooms: z$1.number().int().positive().optional(), numberOfCleanersRequested: z$1.number().int().positive().optional(), cleanerPaymentAmount: z$1.number().positive().optional(), paymentMethod: z$1.enum(["CREDIT_CARD", "CASH", "ZELLE", "VENMO", "OTHER"]).optional(), paymentDetails: z$1.string().optional(), selectedExtras: z$1.array(z$1.number()).optional(), overrideConflict: z$1.boolean().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c, _d, _e2, _f, _g, _h;
  let n;
  if (e.clientId) {
    const i = await r.user.findUnique({ where: { id: e.clientId } });
    if (!i) throw new Error("Client not found");
    n = i.id;
  } else if (e.clientEmail) {
    const i = await r.user.findUnique({ where: { email: e.clientEmail } });
    i ? n = i.id : n = (await r.user.create({ data: { email: e.clientEmail, password: "", role: "CLIENT", firstName: e.clientFirstName, lastName: e.clientLastName, phone: e.clientPhone, temporaryPassword: "set-via-supabase", hasResetPassword: false } })).id;
  } else throw new Error("Either clientId or clientEmail must be provided");
  if (e.cleanerId) {
    const i = await r.user.findUnique({ where: { id: e.cleanerId } });
    if (!i || i.role !== "CLEANER") throw new Error("Cleaner not found");
  }
  if (e.cleanerIds && e.cleanerIds.length > 0) {
    const i = Array.from(new Set(e.cleanerIds)), m = await r.user.findMany({ where: { id: { in: i } } });
    if (m.length !== i.length || m.some((p) => p.role !== "CLEANER")) throw new Error("One or more cleaners invalid");
  }
  const a = (_b = (_a3 = e.cleanerIds && e.cleanerIds[0]) != null ? _a3 : e.cleanerId) != null ? _b : null, o = e.recurrenceId || (e.serviceFrequency && e.serviceFrequency !== "ONE_TIME" ? randomUUID() : null), s = await r.booking.create({ data: { clientId: n, cleanerId: a, serviceType: e.serviceType, scheduledDate: new Date(e.scheduledDate), scheduledTime: e.scheduledTime, durationHours: e.durationHours, address: e.address, addressLine1: (_c = e.addressLine1) != null ? _c : e.address, addressLine2: e.addressLine2, city: e.city, state: e.state, postalCode: e.postalCode, placeId: e.placeId, latitude: e.latitude, longitude: e.longitude, specialInstructions: e.specialInstructions, privateBookingNote: e.privateBookingNote, privateCustomerNote: e.privateCustomerNote, providerNote: e.providerNote, finalPrice: e.finalPrice, status: e.status, serviceFrequency: e.serviceFrequency, houseSquareFootage: e.houseSquareFootage, basementSquareFootage: e.basementSquareFootage, numberOfBedrooms: e.numberOfBedrooms, numberOfBathrooms: e.numberOfBathrooms, numberOfCleanersRequested: e.numberOfCleanersRequested, cleanerPaymentAmount: e.cleanerPaymentAmount, paymentMethod: e.paymentMethod, paymentDetails: e.paymentDetails, selectedExtras: (_d = e.selectedExtras) != null ? _d : void 0, recurrenceId: o, occurrenceNumber: (_e2 = e.occurrenceNumber) != null ? _e2 : o ? 1 : null }, include: { client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } }), c = e.cleanerIds && e.cleanerIds.length > 0 ? Array.from(new Set(e.cleanerIds)) : a ? [a] : [];
  if (c.length > 0 && await r.bookingCleaner.createMany({ data: c.map((i) => ({ bookingId: s.id, cleanerId: i })), skipDuplicates: true }), o && e.serviceFrequency && e.serviceFrequency !== "ONE_TIME") {
    const i = (h, I) => {
      const f = new Date(h);
      return f.setDate(f.getDate() + I), f;
    }, p = (_f = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 }[e.serviceFrequency]) != null ? _f : 7, d = new Date(e.scheduledDate), u = Array.from({ length: 6 }).map((h, I) => I + 1);
    for (const h of u) {
      const I = i(d, p * h);
      await r.booking.findFirst({ where: { recurrenceId: o, scheduledDate: I }, select: { id: true } }) || await r.booking.create({ data: { clientId: n, cleanerId: a, serviceType: e.serviceType, scheduledDate: I, scheduledTime: e.scheduledTime, durationHours: e.durationHours, address: e.address, placeId: e.placeId, latitude: e.latitude, longitude: e.longitude, specialInstructions: e.specialInstructions, finalPrice: e.finalPrice, status: e.status, serviceFrequency: e.serviceFrequency, houseSquareFootage: e.houseSquareFootage, basementSquareFootage: e.basementSquareFootage, numberOfBedrooms: e.numberOfBedrooms, numberOfBathrooms: e.numberOfBathrooms, numberOfCleanersRequested: e.numberOfCleanersRequested, cleanerPaymentAmount: e.cleanerPaymentAmount, paymentMethod: e.paymentMethod, paymentDetails: e.paymentDetails, selectedExtras: (_g = e.selectedExtras) != null ? _g : void 0, recurrenceId: o, occurrenceNumber: ((_h = e.occurrenceNumber) != null ? _h : 1) + h } });
    }
  }
  const l = await r.checklistTemplate.findFirst({ where: { serviceType: e.serviceType }, include: { items: { orderBy: { order: "asc" } } } });
  return l && l.items.length > 0 && await r.bookingChecklist.create({ data: { bookingId: s.id, templateId: l.id, items: { create: l.items.map((i) => ({ description: i.description, order: i.order, isCompleted: false })) } } }), { booking: s };
}), ot = y.input(z$1.object({ bookingId: z$1.number(), cleanerId: z$1.number().nullable().optional(), cleanerIds: z$1.array(z$1.number()).optional(), serviceType: z$1.string().optional(), scheduledDate: z$1.string().datetime().optional(), scheduledTime: z$1.string().optional(), durationHours: z$1.number().positive().optional(), address: z$1.string().optional(), addressLine1: z$1.string().optional(), addressLine2: z$1.string().optional(), city: z$1.string().optional(), state: z$1.string().optional(), postalCode: z$1.string().optional(), placeId: z$1.string().optional(), latitude: z$1.number().optional(), longitude: z$1.number().optional(), specialInstructions: z$1.string().nullable().optional(), privateBookingNote: z$1.string().nullable().optional(), privateCustomerNote: z$1.string().nullable().optional(), providerNote: z$1.string().nullable().optional(), finalPrice: z$1.number().positive().nullable().optional(), status: z$1.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(), scope: z$1.enum(["single", "series"]).optional(), cancellationFeeApplied: z$1.boolean().optional(), cancellationFeeAmount: z$1.number().optional(), notifyEmail: z$1.boolean().optional(), notifySms: z$1.boolean().optional(), serviceFrequency: z$1.enum(["ONE_TIME", "WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(), houseSquareFootage: z$1.number().int().positive().optional(), basementSquareFootage: z$1.number().int().positive().optional(), numberOfBedrooms: z$1.number().int().positive().optional(), numberOfBathrooms: z$1.number().int().positive().optional(), numberOfCleanersRequested: z$1.number().int().positive().optional(), cleanerPaymentAmount: z$1.number().positive().optional(), paymentMethod: z$1.enum(["CREDIT_CARD", "CASH", "ZELLE", "VENMO", "OTHER"]).optional(), paymentDetails: z$1.string().optional(), selectedExtras: z$1.array(z$1.number()).optional(), overrideConflict: z$1.boolean().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c, _d, _e2, _f, _g, _h, _i, _j, _k, _l, _m, _n2, _o, _p, _q, _r, _s, _t2, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D;
  const n = await r.booking.findUnique({ where: { id: e.bookingId } });
  if (!n) throw new Error("Booking not found");
  if (e.cleanerId !== void 0 && e.cleanerId !== null) {
    const d = await r.user.findUnique({ where: { id: e.cleanerId } });
    if (!d || d.role !== "CLEANER") throw new Error("Cleaner not found");
  }
  if (e.cleanerIds && e.cleanerIds.length > 0) {
    const d = Array.from(new Set(e.cleanerIds)), u = await r.user.findMany({ where: { id: { in: d } } });
    if (u.length !== d.length || u.some((h) => h.role !== "CLEANER")) throw new Error("One or more cleaners invalid");
  }
  const a = {}, o = (_a3 = e.cleanerIds && e.cleanerIds[0]) != null ? _a3 : e.cleanerId !== void 0 ? e.cleanerId : void 0;
  o !== void 0 && (a.cleanerId = o), e.serviceType !== void 0 && (a.serviceType = e.serviceType), e.scheduledDate !== void 0 && (a.scheduledDate = new Date(e.scheduledDate)), e.scheduledTime !== void 0 && (a.scheduledTime = e.scheduledTime), e.durationHours !== void 0 && (a.durationHours = e.durationHours), e.address !== void 0 && (a.address = e.address), e.addressLine1 !== void 0 && (a.addressLine1 = e.addressLine1), e.addressLine2 !== void 0 && (a.addressLine2 = e.addressLine2), e.city !== void 0 && (a.city = e.city), e.state !== void 0 && (a.state = e.state), e.postalCode !== void 0 && (a.postalCode = e.postalCode), e.placeId !== void 0 && (a.placeId = e.placeId), e.latitude !== void 0 && (a.latitude = e.latitude), e.longitude !== void 0 && (a.longitude = e.longitude), e.specialInstructions !== void 0 && (a.specialInstructions = e.specialInstructions), e.privateBookingNote !== void 0 && (a.privateBookingNote = e.privateBookingNote), e.privateCustomerNote !== void 0 && (a.privateCustomerNote = e.privateCustomerNote), e.providerNote !== void 0 && (a.providerNote = e.providerNote), e.finalPrice !== void 0 && (a.finalPrice = e.finalPrice), e.status !== void 0 && (a.status = e.status), e.cancellationFeeApplied !== void 0 && (a.cancellationFeeApplied = e.cancellationFeeApplied), e.serviceFrequency !== void 0 && (a.serviceFrequency = e.serviceFrequency), e.houseSquareFootage !== void 0 && (a.houseSquareFootage = e.houseSquareFootage), e.basementSquareFootage !== void 0 && (a.basementSquareFootage = e.basementSquareFootage), e.numberOfBedrooms !== void 0 && (a.numberOfBedrooms = e.numberOfBedrooms), e.numberOfBathrooms !== void 0 && (a.numberOfBathrooms = e.numberOfBathrooms), e.numberOfCleanersRequested !== void 0 && (a.numberOfCleanersRequested = e.numberOfCleanersRequested), e.cleanerPaymentAmount !== void 0 && (a.cleanerPaymentAmount = e.cleanerPaymentAmount), e.paymentMethod !== void 0 && (a.paymentMethod = e.paymentMethod), e.paymentDetails !== void 0 && (a.paymentDetails = e.paymentDetails), e.selectedExtras !== void 0 && (a.selectedExtras = e.selectedExtras), e.scope === "series" && n.serviceFrequency && n.serviceFrequency !== "ONE_TIME" && !n.recurrenceId && (a.recurrenceId = H$1.randomUUID(), a.occurrenceNumber = (_b = n.occurrenceNumber) != null ? _b : 1);
  const s = a.scheduledDate ? new Date(a.scheduledDate) : n.scheduledDate, c = (_c = a.scheduledTime) != null ? _c : n.scheduledTime, l = e.cleanerIds && e.cleanerIds.length > 0 ? Array.from(new Set(e.cleanerIds)) : o ? [o] : [];
  if (!e.overrideConflict && l.length > 0 && (a.scheduledDate || a.scheduledTime)) {
    if (await r.booking.findFirst({ where: { id: { not: e.bookingId }, scheduledDate: s, scheduledTime: c, OR: [{ cleanerId: { in: l } }, { cleaners: { some: { cleanerId: { in: l } } } }] }, select: { id: true } })) throw new Error("Conflict: cleaner already booked at that time");
    if (await r.timeOffRequest.findFirst({ where: { cleanerId: { in: l }, status: "APPROVED", startDate: { lte: s }, endDate: { gte: s } }, select: { id: true } })) throw new Error("Conflict: cleaner is on approved time off");
  }
  let i;
  const m = n.finalPrice;
  if (e.scope === "series") {
    const d = await r.booking.findUnique({ where: { id: e.bookingId }, select: { recurrenceId: true, scheduledDate: true } });
    if (d == null ? void 0 : d.recurrenceId) {
      const u = await r.booking.findMany({ where: { recurrenceId: d.recurrenceId, scheduledDate: { gte: d.scheduledDate } } });
      let h = 0;
      a.scheduledDate && (h = new Date(a.scheduledDate).getTime() - new Date(d.scheduledDate).getTime());
      for (const I of u) {
        const f = a.scheduledDate ? new Date(new Date(I.scheduledDate).getTime() + h) : I.scheduledDate, b = (_d = a.scheduledTime) != null ? _d : I.scheduledTime;
        if (!e.overrideConflict && l.length > 0 && (a.scheduledDate || a.scheduledTime)) {
          if (await r.booking.findFirst({ where: { id: { not: I.id }, scheduledDate: f, scheduledTime: b, OR: [{ cleanerId: { in: l } }, { cleaners: { some: { cleanerId: { in: l } } } }] }, select: { id: true } })) throw new Error(`Conflict in series update for ${f.toLocaleDateString()}: cleaner already booked`);
          if (await r.timeOffRequest.findFirst({ where: { cleanerId: { in: l }, status: "APPROVED", startDate: { lte: f }, endDate: { gte: f } }, select: { id: true } })) throw new Error(`Conflict in series update for ${f.toLocaleDateString()}: cleaner time off`);
        }
        await r.booking.update({ where: { id: I.id }, data: { ...a, scheduledDate: f, recurrenceId: d.recurrenceId } });
      }
      i = await r.booking.findUnique({ where: { id: e.bookingId }, include: { client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } });
    } else i = await r.booking.update({ where: { id: e.bookingId }, data: a, include: { client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } });
  } else i = await r.booking.update({ where: { id: e.bookingId }, data: a, include: { client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } });
  if (e.overrideConflict && await r.systemLog.create({ data: { userId: (_e2 = n.clientId) != null ? _e2 : null, action: "booking.override_conflict", entity: "booking", entityId: (_f = i == null ? void 0 : i.id) != null ? _f : e.bookingId, after: i, before: n, metadata: { cleanerIds: l, scheduledDate: (_g = a.scheduledDate) != null ? _g : n.scheduledDate, scheduledTime: (_h = a.scheduledTime) != null ? _h : n.scheduledTime } } }), e.finalPrice !== void 0 && m !== void 0 && e.finalPrice !== m) {
    const d = await r.stripePayment.findFirst({ where: { bookingId: e.bookingId, status: { in: ["requires_capture", "requires_confirmation"] } }, orderBy: { createdAt: "desc" } });
    if (d == null ? void 0 : d.stripeIntentId) try {
      await T.paymentIntents.update(d.stripeIntentId, { amount: Math.round(((_i = e.finalPrice) != null ? _i : 0) * 100), description: (_j = d.description) != null ? _j : `Hold for booking #${e.bookingId}` }), await r.stripePayment.update({ where: { id: d.id }, data: { amount: (_k = e.finalPrice) != null ? _k : 0 } });
    } catch (u) {
      console.error("Failed to update hold amount", u);
    }
  }
  if (e.cleanerIds) {
    await r.bookingCleaner.deleteMany({ where: { bookingId: e.bookingId } });
    const d = Array.from(new Set(e.cleanerIds));
    d.length > 0 && await r.bookingCleaner.createMany({ data: d.map((u) => ({ bookingId: e.bookingId, cleanerId: u })), skipDuplicates: true });
  }
  if (e.finalPrice !== void 0 && e.finalPrice !== null && m !== null && m !== e.finalPrice && i) {
    const d = e.finalPrice - m;
    await r.accountingEntry.create({ data: { date: /* @__PURE__ */ new Date(), description: `Price adjustment for booking #${i.id}`, amount: d, category: d >= 0 ? "INCOME" : "EXPENSE", relatedBookingId: i.id } });
    const u = await r.stripePayment.findFirst({ where: { bookingId: i.id }, orderBy: { createdAt: "desc" } });
    if (u == null ? void 0 : u.stripeIntentId) try {
      if (d < 0 && u.status === "succeeded") {
        const h = await T.refunds.create({ payment_intent: u.stripeIntentId, amount: Math.abs(Math.round(d * 100)) }, { idempotencyKey: `booking-${i.id}-adjust-refund-${Math.round(d * 100)}` });
        await r.stripePayment.create({ data: { bookingId: i.id, stripeIntentId: h.id, amount: d, status: h.status, currency: u.currency || "usd", description: "Price decrease refund" } });
      } else if (d < 0 && u.status !== "succeeded") await T.paymentIntents.update(u.stripeIntentId, { amount: Math.max(50, Math.round(((_l = e.finalPrice) != null ? _l : 0) * 100)) }), await r.stripePayment.update({ where: { id: u.id }, data: { amount: (_m = e.finalPrice) != null ? _m : 0, description: "Adjusted hold after price decrease" } });
      else if (d > 0 && u.status !== "succeeded") try {
        await T.paymentIntents.update(u.stripeIntentId, { amount: Math.round(((_n2 = e.finalPrice) != null ? _n2 : 0) * 100) }), await r.stripePayment.update({ where: { id: u.id }, data: { amount: (_o = e.finalPrice) != null ? _o : 0, description: "Adjusted hold after price increase" } });
      } catch {
        const I = await T.paymentIntents.create({ amount: Math.round(((_p = e.finalPrice) != null ? _p : 0) * 100), currency: u.currency || "usd", description: `Recreated hold for booking #${i.id}`, metadata: { bookingId: i.id.toString() }, capture_method: "manual" });
        await r.stripePayment.create({ data: { bookingId: i.id, stripeIntentId: I.id, amount: (_q = e.finalPrice) != null ? _q : 0, status: I.status, currency: I.currency, description: (_r = I.description) != null ? _r : void 0 } });
      }
      else if (d > 0 && u.status === "succeeded") {
        const h = await T.paymentIntents.create({ amount: Math.round(d * 100), currency: u.currency || "usd", description: `Price increase for booking #${i.id}`, metadata: { bookingId: i.id.toString() } }, { idempotencyKey: `booking-${i.id}-adjust-charge-${Math.round(d * 100)}` });
        await r.stripePayment.create({ data: { bookingId: i.id, stripeIntentId: h.id, amount: d, status: h.status, currency: h.currency, description: (_s = h.description) != null ? _s : void 0 } });
      }
    } catch (h) {
      console.error("Stripe adjustment failed", h);
    }
  }
  if (e.status === "CANCELLED") {
    e.scope === "series" && n.recurrenceId && await r.booking.updateMany({ where: { recurrenceId: n.recurrenceId }, data: { status: "CANCELLED" } });
    const d = await r.stripePayment.findFirst({ where: { bookingId: e.bookingId, status: { in: ["requires_capture", "requires_confirmation"] } }, orderBy: { createdAt: "desc" } }), u = await r.stripePayment.findFirst({ where: { bookingId: e.bookingId, status: "succeeded" }, orderBy: { createdAt: "desc" } }), h = e.cancellationFeeApplied && e.cancellationFeeAmount !== void 0 ? e.cancellationFeeAmount : e.cancellationFeeApplied ? Math.max(((_t2 = i == null ? void 0 : i.finalPrice) != null ? _t2 : 0) * (E.CANCELLATION_FEE_PERCENT ? Number(E.CANCELLATION_FEE_PERCENT) : 20) / 100, 0) : 0;
    if (d == null ? void 0 : d.stripeIntentId) try {
      if (e.cancellationFeeApplied && h > 0) {
        const f = Math.min(h, (_u = d.amount) != null ? _u : h);
        await T.paymentIntents.capture(d.stripeIntentId, { amount_to_capture: Math.round(f * 100) }), await r.stripePayment.update({ where: { id: d.id }, data: { status: "succeeded", amount: f } });
      } else await T.paymentIntents.cancel(d.stripeIntentId), await r.stripePayment.update({ where: { id: d.id }, data: { status: "canceled" } });
    } catch (f) {
      console.error("Failed to settle hold on booking cancellation", f);
    }
    else if ((u == null ? void 0 : u.stripeIntentId) && e.cancellationFeeApplied) {
      const f = ((_v = u.amount) != null ? _v : 0) - h;
      if (f > 0) try {
        await T.refunds.create({ payment_intent: u.stripeIntentId, amount: Math.round(f * 100) }, { idempotencyKey: `booking-${e.bookingId}-cancel-refund` }), await r.stripePayment.create({ data: { bookingId: (_w = i == null ? void 0 : i.id) != null ? _w : e.bookingId, stripeIntentId: u.stripeIntentId, amount: -f, status: "refunded", currency: (_x = u.currency) != null ? _x : "usd", description: "Partial refund on cancellation (keeping fee)" } });
      } catch (b) {
        console.error("Failed to partially refund on cancellation", b);
      }
    } else if ((u == null ? void 0 : u.stripeIntentId) && !e.cancellationFeeApplied) try {
      await T.refunds.create({ payment_intent: u.stripeIntentId, amount: Math.round(((_y = u.amount) != null ? _y : 0) * 100) }, { idempotencyKey: `booking-${e.bookingId}-cancel-refund-full` }), await r.stripePayment.create({ data: { bookingId: (_z = i == null ? void 0 : i.id) != null ? _z : e.bookingId, stripeIntentId: u.stripeIntentId, amount: -((_A = u.amount) != null ? _A : 0), status: "refunded", currency: (_B = u.currency) != null ? _B : "usd", description: "Full refund on cancellation" } });
    } catch (f) {
      console.error("Failed to refund on cancellation", f);
    }
    const I = async (f, b) => {
      try {
        await fetch("https://api.openphone.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", Authorization: E.OPENPHONE_API_KEY }, body: JSON.stringify({ to: [f], from: E.OPENPHONE_PHONE_NUMBER, content: b }) });
      } catch (N) {
        console.error("Failed to send SMS", N);
      }
    };
    if (e.notifyEmail && ((_C = i == null ? void 0 : i.client) == null ? void 0 : _C.email)) try {
      const f = F.createTransport({ host: process.env.SMTP_HOST || "localhost", port: Number(process.env.SMTP_PORT || 1025), secure: false }), b = await r.emailTemplate.findFirst({ where: { type: "booking_cancel" } });
      let N = (b == null ? void 0 : b.subject) || `Booking #${i.id} cancelled`, w = (b == null ? void 0 : b.body) || `Your booking #${i.id} scheduled for ${i.scheduledDate.toLocaleDateString()} has been cancelled.`;
      w = w.replace(/{{\s*bookingId\s*}}/g, String(i.id)), w = w.replace(/{{\s*scheduledDate\s*}}/g, i.scheduledDate.toLocaleDateString()), await f.sendMail({ from: process.env.SMTP_FROM || "no-reply@verdeluxe.com", to: i.client.email, subject: N, text: w });
    } catch (f) {
      console.error("Failed to send cancellation email", f);
    }
    e.notifySms && ((_D = i == null ? void 0 : i.client) == null ? void 0 : _D.phone) && await I(i.client.phone, `Your booking #${i.id} has been cancelled. Contact support if this was unexpected.`), e.cancellationFeeApplied && (i == null ? void 0 : i.finalPrice) && await r.accountingEntry.create({ data: { date: /* @__PURE__ */ new Date(), description: `Cancellation fee for booking #${i.id}`, amount: h, category: "INCOME", relatedBookingId: i.id } });
  }
  return await (async () => {
    var _a4, _b2, _c2, _d2, _e3, _f2, _g2, _h2, _i2, _j2, _k2, _l2, _m2, _n3, _o2, _p2, _q2, _r2, _s2, _t3, _u2, _v2, _w2, _x2, _y2, _z2;
    if (!i || !i.recurrenceId || !i.serviceFrequency || i.serviceFrequency === "ONE_TIME" || i.status === "CANCELLED") return;
    const d = 120, h = (_a4 = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 }[i.serviceFrequency]) != null ? _a4 : 7, I = new Date(i.scheduledDate), f = /* @__PURE__ */ new Date();
    f.setDate(f.getDate() + d);
    const N = (await r.bookingCleaner.findMany({ where: { bookingId: i.id }, select: { cleanerId: true } })).map((k) => k.cleanerId);
    let w = 1;
    for (; ; ) {
      const k = new Date(I);
      if (k.setDate(I.getDate() + h * w), k > f) break;
      if (!await r.booking.findFirst({ where: { recurrenceId: i.recurrenceId, scheduledDate: k }, select: { id: true } })) {
        const O = await r.booking.create({ data: { clientId: i.client.id, cleanerId: (_c2 = (_b2 = i.cleaner) == null ? void 0 : _b2.id) != null ? _c2 : null, serviceType: i.serviceType, scheduledDate: k, scheduledTime: i.scheduledTime, durationHours: i.durationHours, address: i.address, addressLine1: (_d2 = i.addressLine1) != null ? _d2 : i.address, addressLine2: (_e3 = i.addressLine2) != null ? _e3 : void 0, city: (_f2 = i.city) != null ? _f2 : void 0, state: (_g2 = i.state) != null ? _g2 : void 0, postalCode: (_h2 = i.postalCode) != null ? _h2 : void 0, placeId: (_i2 = i.placeId) != null ? _i2 : void 0, latitude: (_j2 = i.latitude) != null ? _j2 : void 0, longitude: (_k2 = i.longitude) != null ? _k2 : void 0, specialInstructions: (_l2 = i.specialInstructions) != null ? _l2 : void 0, privateBookingNote: (_m2 = i.privateBookingNote) != null ? _m2 : void 0, privateCustomerNote: (_n3 = i.privateCustomerNote) != null ? _n3 : void 0, providerNote: (_o2 = i.providerNote) != null ? _o2 : void 0, finalPrice: (_p2 = i.finalPrice) != null ? _p2 : void 0, status: "PENDING", serviceFrequency: i.serviceFrequency, houseSquareFootage: (_q2 = i.houseSquareFootage) != null ? _q2 : void 0, basementSquareFootage: (_r2 = i.basementSquareFootage) != null ? _r2 : void 0, numberOfBedrooms: (_s2 = i.numberOfBedrooms) != null ? _s2 : void 0, numberOfBathrooms: (_t3 = i.numberOfBathrooms) != null ? _t3 : void 0, numberOfCleanersRequested: (_u2 = i.numberOfCleanersRequested) != null ? _u2 : void 0, cleanerPaymentAmount: (_v2 = i.cleanerPaymentAmount) != null ? _v2 : void 0, paymentMethod: (_w2 = i.paymentMethod) != null ? _w2 : void 0, paymentDetails: (_x2 = i.paymentDetails) != null ? _x2 : void 0, selectedExtras: (_y2 = i.selectedExtras) != null ? _y2 : void 0, recurrenceId: i.recurrenceId, occurrenceNumber: ((_z2 = i.occurrenceNumber) != null ? _z2 : 1) + w } });
        N.length > 0 && await r.bookingCleaner.createMany({ data: N.map(($) => ({ bookingId: O.id, cleanerId: $ })), skipDuplicates: true });
      }
      w++;
    }
  })(), { booking: i };
}), it = y.input(z$1.object({ bookingId: z$1.number() })).mutation(async ({ input: e }) => {
  if (!await r.booking.findUnique({ where: { id: e.bookingId } })) throw new Error("Booking not found");
  return await r.booking.delete({ where: { id: e.bookingId } }), { success: true };
}), st = y.query(async () => {
  var _a3, _b, _c, _d, _e2, _f, _g, _h, _i, _j, _k, _l, _m, _n2, _o;
  const e = /* @__PURE__ */ new Date(), n = new Date(e.getFullYear(), e.getMonth(), 1), a = new Date(e.getFullYear(), e.getMonth() + 1, 0), o = M(n, a), s = await r.booking.count(), c = await r.booking.count({ where: { status: "COMPLETED" } }), l = await r.booking.count({ where: { status: "CANCELLED" } }), i = await r.booking.count({ where: { scheduledDate: { gte: (_a3 = o.start) != null ? _a3 : n, lte: (_b = o.end) != null ? _b : a }, status: { not: "CANCELLED" } } }), m = await r.booking.aggregate({ _sum: { finalPrice: true }, where: { status: { not: "CANCELLED" } } }), p = await r.booking.aggregate({ _sum: { finalPrice: true }, where: { status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } } }), d = { total: (_c = m._sum.finalPrice) != null ? _c : 0, pending: (_d = p._sum.finalPrice) != null ? _d : 0 }, u = new Date(e.getFullYear(), e.getMonth() - 1, 1), h = new Date(e.getFullYear(), e.getMonth(), 0), I = M(u, h), f = await r.booking.count({ where: { scheduledDate: { gte: (_e2 = I.start) != null ? _e2 : u, lte: (_f = I.end) != null ? _f : h }, status: { not: "CANCELLED" } } }), N = (_i = (await r.booking.aggregate({ _sum: { finalPrice: true }, where: { scheduledDate: { gte: (_g = I.start) != null ? _g : u, lte: (_h = I.end) != null ? _h : h }, status: { not: "CANCELLED" } } }))._sum.finalPrice) != null ? _i : 0, k = (_l = (await r.booking.aggregate({ _sum: { finalPrice: true }, where: { scheduledDate: { gte: (_j = o.start) != null ? _j : n, lte: (_k = o.end) != null ? _k : a }, status: { not: "CANCELLED" } } }))._sum.finalPrice) != null ? _l : 0, q = [];
  for (let R = 5; R >= 0; R--) {
    const A = new Date(e.getFullYear(), e.getMonth() - R, 1), C = new Date(A.getFullYear(), A.getMonth(), 1), B = new Date(A.getFullYear(), A.getMonth() + 1, 0), _ = M(C, B), L = await r.booking.aggregate({ _sum: { finalPrice: true }, where: { scheduledDate: { gte: (_m = _.start) != null ? _m : C, lte: (_n2 = _.end) != null ? _n2 : B }, status: { not: "CANCELLED" } } }), ne = C.toLocaleDateString("en-US", { month: "short" });
    q.push({ month: ne, monthKey: `${C.getFullYear()}-${C.getMonth() + 1}`, revenue: (_o = L._sum.finalPrice) != null ? _o : 0 });
  }
  const $ = (await r.booking.findMany({ where: { scheduledDate: { gte: e }, status: { not: "CANCELLED" } }, include: { client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, color: true } }, payments: { select: { amount: true, paidAt: true } } }, orderBy: { scheduledDate: "asc" }, take: 10 })).map((R) => {
    const A = R.payments.reduce((_, L) => L.paidAt ? _ + L.amount : _, 0), C = (R.finalPrice || 0) > 0 && A >= (R.finalPrice || 0), B = A > 0 && A < (R.finalPrice || 0);
    return { ...R, paymentStatus: C ? "Paid" : B ? "Partial" : "Unpaid" };
  }), J = await r.booking.count({ where: { status: { not: "CANCELLED" }, cleanerId: null } }), ee = await r.user.count({ where: { role: "CLEANER", hasResetPassword: true } }), te = await r.user.count({ where: { role: "CLEANER" } });
  return { totalBookings: s, completedBookings: c, cancelledBookings: l, monthBookings: i, revenue: d, revenueTrends: q, upcomingAppointments: $, unassignedBookings: J, activeCleaners: ee, totalCleaners: te, previousMonthBookings: f, previousMonthRevenue: N, currentMonthRevenue: k };
}), ct = y.input(z$1.object({ startDate: z$1.string().optional(), endDate: z$1.string().optional() })).query(async ({ input: e }) => {
  const { start: n, end: a } = M(e.startDate, e.endDate), o = await r.payment.findMany({ include: { booking: { select: { id: true, serviceType: true, serviceFrequency: true, scheduledDate: true } } }, orderBy: { paidAt: "desc" } }), s = (w) => w ? !(n && w < n || a && w > a) : !(n || a), c = o.filter((w) => {
    var _a3, _b, _c;
    const k = (_c = (_b = w.paidAt) != null ? _b : (_a3 = w.booking) == null ? void 0 : _a3.scheduledDate) != null ? _c : w.createdAt;
    return s(k);
  }), l = (w, k) => w.filter(k).reduce((q, O) => q + O.amount, 0), i = l(c, (w) => !!w.paidAt), m = l(c, (w) => !w.paidAt), p = l(c, (w) => {
    var _a3;
    return ((_a3 = w.booking) == null ? void 0 : _a3.serviceFrequency) && w.booking.serviceFrequency !== "ONE_TIME" && !!w.paidAt;
  }), d = l(c, (w) => {
    var _a3;
    return ((_a3 = w.booking) == null ? void 0 : _a3.serviceFrequency) === "MONTHLY" && !!w.paidAt;
  }), u = l(c, (w) => {
    var _a3;
    return ((_a3 = w.booking) == null ? void 0 : _a3.serviceFrequency) === "BIWEEKLY" && !!w.paidAt;
  }), h = l(c, (w) => {
    var _a3;
    return ((_a3 = w.booking) == null ? void 0 : _a3.serviceFrequency) === "WEEKLY" && !!w.paidAt;
  }), I = l(c, (w) => {
    var _a3, _b;
    return ((_b = (_a3 = w.booking) == null ? void 0 : _a3.serviceFrequency) != null ? _b : "ONE_TIME") === "ONE_TIME" && !!w.paidAt;
  }), f = /* @__PURE__ */ new Map();
  c.forEach((w) => {
    var _a3, _b, _c, _d;
    const k = (_c = (_b = w.paidAt) != null ? _b : (_a3 = w.booking) == null ? void 0 : _a3.scheduledDate) != null ? _c : w.createdAt, O = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Detroit" }).format(k);
    f.set(O, ((_d = f.get(O)) != null ? _d : 0) + w.amount);
  });
  const b = Array.from(f.entries()).map(([w, k]) => ({ date: w, amount: k })).sort((w, k) => w.date.localeCompare(k.date)), N = c.slice(0, 10).map((w) => {
    var _a3, _b, _c, _d;
    return { amount: w.amount, paidAt: w.paidAt, bookingId: w.bookingId, serviceType: (_b = (_a3 = w.booking) == null ? void 0 : _a3.serviceType) != null ? _b : "Unknown", serviceFrequency: (_d = (_c = w.booking) == null ? void 0 : _c.serviceFrequency) != null ? _d : "ONE_TIME" };
  });
  return { totalRevenue: i + m, billedRevenue: i, pendingRevenue: m, recurringRevenue: p, monthlyRevenue: d, biweeklyRevenue: u, weeklyRevenue: h, oneTimeRevenue: I, recentTransactions: N, revenueTrend: b };
}), dt = y.query(async () => await r.cleanQuizSubmission.findMany({ orderBy: { createdAt: "desc" } })), lt = y.input(z$1.object({ email: z$1.string().email("Valid email is required"), password: z$1.string().min(8, "Password must be at least 8 characters"), role: z$1.enum(["CLIENT", "CLEANER", "ADMIN", "OWNER"]), firstName: z$1.string().optional(), lastName: z$1.string().optional(), phone: z$1.string().optional(), color: z$1.string().optional(), adminPermissions: z$1.record(z$1.boolean()).optional() })).mutation(async ({ input: e }) => {
  if (await r.user.findUnique({ where: { email: e.email } })) throw new Error("Email already registered");
  const a = await U.hash(e.password, 10);
  return { newUser: await r.user.create({ data: { email: e.email, password: a, role: e.role, firstName: e.firstName, lastName: e.lastName, phone: e.phone, color: e.color, adminPermissions: e.adminPermissions } }) };
}), ut = y.input(z$1.object({ userId: z$1.number(), email: z$1.string().email("Invalid email address").optional(), password: z$1.string().min(6, "Password must be at least 6 characters").optional(), role: z$1.enum(["CLIENT", "CLEANER", "ADMIN", "OWNER"]).optional(), firstName: z$1.string().optional(), lastName: z$1.string().optional(), phone: z$1.string().optional(), temporaryPassword: z$1.string().optional(), color: z$1.union([z$1.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format (use #RRGGBB)"), z$1.null()]).optional(), adminPermissions: z$1.record(z$1.boolean()).optional() })).mutation(async ({ input: e }) => {
  const n = await r.user.findUnique({ where: { id: e.userId } });
  if (!n) throw new Error("User to update not found");
  if (e.email && e.email !== n.email && await r.user.findUnique({ where: { email: e.email } })) throw new Error("Email already in use");
  const a = {};
  return e.email !== void 0 && (a.email = e.email), e.role !== void 0 && (a.role = e.role), e.firstName !== void 0 && (a.firstName = e.firstName), e.lastName !== void 0 && (a.lastName = e.lastName), e.phone !== void 0 && (a.phone = e.phone), e.color !== void 0 && (a.color = e.color), e.password && (a.password = await U.hash(e.password, 10)), e.temporaryPassword !== void 0 && (e.temporaryPassword === "" || e.temporaryPassword === null ? (a.temporaryPassword = null, a.hasResetPassword = false) : e.temporaryPassword.length >= 6 && (a.temporaryPassword = e.temporaryPassword, a.hasResetPassword = false)), e.adminPermissions !== void 0 && (n.role === "ADMIN" || n.role === "OWNER" || e.role === "ADMIN" || e.role === "OWNER") && (a.adminPermissions = e.adminPermissions), { user: await r.user.update({ where: { id: e.userId }, data: a, select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, color: true, createdAt: true } }) };
}), mt = y.input(z$1.object({ userId: z$1.number() })).mutation(async ({ input: e }) => {
  if (!await r.user.findUnique({ where: { id: e.userId } })) throw new Error("User not found");
  return await r.user.delete({ where: { id: e.userId } }), { success: true };
}), pt = y.input(z$1.object({ name: z$1.string().min(1, "Template name is required"), serviceType: z$1.string().min(1, "Service type is required"), items: z$1.array(z$1.object({ description: z$1.string().min(1, "Item description is required"), order: z$1.number().int().nonnegative() })).min(1, "At least one checklist item is required") })).mutation(async ({ input: e }) => ({ template: await r.checklistTemplate.create({ data: { name: e.name, serviceType: e.serviceType, items: { create: e.items.map((a) => ({ description: a.description, order: a.order })) } }, include: { items: { orderBy: { order: "asc" } } } }) })), gt = y.query(async () => ({ templates: await r.checklistTemplate.findMany({ include: { items: { orderBy: { order: "asc" } } }, orderBy: { createdAt: "desc" } }) })), ft = y.input(z$1.object({ templateId: z$1.number(), name: z$1.string().min(1, "Template name is required"), serviceType: z$1.string().min(1, "Service type is required"), items: z$1.array(z$1.object({ description: z$1.string().min(1, "Item description is required"), order: z$1.number().int().nonnegative() })).min(1, "At least one checklist item is required") })).mutation(async ({ input: e }) => {
  if (!await r.checklistTemplate.findUnique({ where: { id: e.templateId } })) throw new Error("Template not found");
  return await r.checklistItemTemplate.deleteMany({ where: { templateId: e.templateId } }), { template: await r.checklistTemplate.update({ where: { id: e.templateId }, data: { name: e.name, serviceType: e.serviceType, items: { create: e.items.map((o) => ({ description: o.description, order: o.order })) } }, include: { items: { orderBy: { order: "asc" } } } }) };
}), yt = y.input(z$1.object({ templateId: z$1.number() })).mutation(async ({ input: e }) => {
  if (!await r.checklistTemplate.findUnique({ where: { id: e.templateId } })) throw new Error("Template not found");
  return await r.checklistTemplate.delete({ where: { id: e.templateId } }), { success: true };
}), ht = y.input(z$1.object({ bookingId: z$1.number() })).query(async ({ input: e }) => {
  const n = await r.bookingChecklist.findUnique({ where: { bookingId: e.bookingId }, include: { template: true, items: { orderBy: { order: "asc" } } } });
  if (!n) throw new Error("Checklist not found for this booking");
  return { checklist: n };
}), wt = y.input(z$1.object({ itemId: z$1.number(), description: z$1.string().optional(), order: z$1.number().int().optional(), isCompleted: z$1.boolean().optional(), completedBy: z$1.number().nullable().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c, _d;
  const n = await r.bookingChecklistItem.findUnique({ where: { id: e.itemId } });
  if (!n) throw new Error("Checklist item not found");
  return { item: await r.bookingChecklistItem.update({ where: { id: e.itemId }, data: { description: (_a3 = e.description) != null ? _a3 : n.description, order: (_b = e.order) != null ? _b : n.order, isCompleted: (_c = e.isCompleted) != null ? _c : n.isCompleted, completedBy: (_d = e.completedBy) != null ? _d : n.completedBy, completedAt: e.isCompleted === void 0 ? n.completedAt : e.isCompleted ? /* @__PURE__ */ new Date() : null } }) };
}), bt = y.query(async () => ({ pricingRules: await r.pricingRule.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] }) })), It = y.input(z$1.object({ name: z$1.string().min(1, "Name is required"), ruleType: z$1.enum(["BASE_PRICE", "SQFT_RATE", "BEDROOM_RATE", "BATHROOM_RATE", "EXTRA_SERVICE", "TIME_ESTIMATE"]), serviceType: z$1.string().nullable().optional(), priceAmount: z$1.number().positive().nullable().optional(), ratePerUnit: z$1.number().positive().nullable().optional(), timeAmount: z$1.number().positive().nullable().optional(), timePerUnit: z$1.number().positive().nullable().optional(), extraName: z$1.string().nullable().optional(), extraDescription: z$1.string().nullable().optional(), isActive: z$1.boolean().default(true), displayOrder: z$1.number().int().default(0), priceRangeMin: z$1.number().positive().nullable().optional(), priceRangeMax: z$1.number().positive().nullable().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b;
  return { pricingRule: await r.pricingRule.create({ data: { name: e.name, ruleType: e.ruleType, serviceType: e.serviceType || null, priceAmount: e.priceAmount || null, ratePerUnit: e.ratePerUnit || null, timeAmount: e.timeAmount || null, timePerUnit: e.timePerUnit || null, extraName: e.extraName || null, extraDescription: e.extraDescription || null, isActive: e.isActive, displayOrder: e.displayOrder, priceRangeMin: (_a3 = e.priceRangeMin) != null ? _a3 : null, priceRangeMax: (_b = e.priceRangeMax) != null ? _b : null } }) };
}), Et = y.input(z$1.object({ ruleId: z$1.number(), name: z$1.string().min(1, "Name is required").optional(), ruleType: z$1.enum(["BASE_PRICE", "SQFT_RATE", "BEDROOM_RATE", "BATHROOM_RATE", "EXTRA_SERVICE", "TIME_ESTIMATE"]).optional(), serviceType: z$1.string().nullable().optional(), priceAmount: z$1.number().positive().nullable().optional(), ratePerUnit: z$1.number().positive().nullable().optional(), timeAmount: z$1.number().positive().nullable().optional(), timePerUnit: z$1.number().positive().nullable().optional(), extraName: z$1.string().nullable().optional(), extraDescription: z$1.string().nullable().optional(), isActive: z$1.boolean().optional(), displayOrder: z$1.number().int().optional(), priceRangeMin: z$1.number().positive().nullable().optional(), priceRangeMax: z$1.number().positive().nullable().optional() })).mutation(async ({ input: e }) => {
  if (!await r.pricingRule.findUnique({ where: { id: e.ruleId } })) throw new Error("Pricing rule not found");
  const a = {};
  return e.name !== void 0 && (a.name = e.name), e.ruleType !== void 0 && (a.ruleType = e.ruleType), e.serviceType !== void 0 && (a.serviceType = e.serviceType), e.priceAmount !== void 0 && (a.priceAmount = e.priceAmount), e.ratePerUnit !== void 0 && (a.ratePerUnit = e.ratePerUnit), e.timeAmount !== void 0 && (a.timeAmount = e.timeAmount), e.timePerUnit !== void 0 && (a.timePerUnit = e.timePerUnit), e.extraName !== void 0 && (a.extraName = e.extraName), e.extraDescription !== void 0 && (a.extraDescription = e.extraDescription), e.isActive !== void 0 && (a.isActive = e.isActive), e.displayOrder !== void 0 && (a.displayOrder = e.displayOrder), e.priceRangeMin !== void 0 && (a.priceRangeMin = e.priceRangeMin), e.priceRangeMax !== void 0 && (a.priceRangeMax = e.priceRangeMax), { pricingRule: await r.pricingRule.update({ where: { id: e.ruleId }, data: a }) };
}), Nt = y.input(z$1.object({ ruleId: z$1.number() })).mutation(async ({ input: e }) => {
  if (!await r.pricingRule.findUnique({ where: { id: e.ruleId } })) throw new Error("Pricing rule not found");
  return await r.pricingRule.delete({ where: { id: e.ruleId } }), { success: true };
}), vt = y.input(z$1.object({ serviceType: z$1.string(), houseSquareFootage: z$1.number().int().positive().optional(), basementSquareFootage: z$1.number().int().positive().optional(), numberOfBedrooms: z$1.number().int().positive().optional(), numberOfBathrooms: z$1.number().int().positive().optional(), selectedExtras: z$1.array(z$1.number()).optional() })).query(async ({ input: e }) => {
  const n = await r.pricingRule.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }), a = (d, u) => {
    let h = u;
    return d.priceRangeMin !== null && d.priceRangeMin !== void 0 && (h = Math.max(h, d.priceRangeMin)), d.priceRangeMax !== null && d.priceRangeMax !== void 0 && (h = Math.min(h, d.priceRangeMax)), h;
  };
  let o = 0, s = 0;
  const c = [], l = (e.houseSquareFootage || 0) + (e.basementSquareFootage || 0), i = n.find((d) => d.ruleType === "BASE_PRICE" && (d.serviceType === e.serviceType || d.serviceType === null));
  if (i) {
    const d = i.priceAmount || 0, u = a(i, d);
    o += u, c.push({ description: `Base price for ${e.serviceType}`, amount: u }), i.timeAmount && (s += i.timeAmount);
  }
  if (l > 0) {
    const d = n.find((u) => u.ruleType === "SQFT_RATE" && (u.serviceType === e.serviceType || u.serviceType === null));
    if (d == null ? void 0 : d.ratePerUnit) {
      const u = l * d.ratePerUnit, h = a(d, u);
      o += h, c.push({ description: `${l} sq ft @ $${d.ratePerUnit}/sq ft`, amount: h }), d.timePerUnit && (s += l * d.timePerUnit);
    }
  }
  if (e.numberOfBedrooms && e.numberOfBedrooms > 0) {
    const d = n.find((u) => u.ruleType === "BEDROOM_RATE" && (u.serviceType === e.serviceType || u.serviceType === null));
    if (d == null ? void 0 : d.ratePerUnit) {
      const u = e.numberOfBedrooms * d.ratePerUnit, h = a(d, u);
      o += h, c.push({ description: `${e.numberOfBedrooms} bedroom(s) @ $${d.ratePerUnit}/bedroom`, amount: h }), d.timePerUnit && (s += e.numberOfBedrooms * d.timePerUnit);
    }
  }
  if (e.numberOfBathrooms && e.numberOfBathrooms > 0) {
    const d = n.find((u) => u.ruleType === "BATHROOM_RATE" && (u.serviceType === e.serviceType || u.serviceType === null));
    if (d == null ? void 0 : d.ratePerUnit) {
      const u = e.numberOfBathrooms * d.ratePerUnit, h = a(d, u);
      o += h, c.push({ description: `${e.numberOfBathrooms} bathroom(s) @ $${d.ratePerUnit}/bathroom`, amount: h }), d.timePerUnit && (s += e.numberOfBathrooms * d.timePerUnit);
    }
  }
  if (e.selectedExtras && e.selectedExtras.length > 0) for (const d of e.selectedExtras) {
    const u = n.find((h) => h.id === d && h.ruleType === "EXTRA_SERVICE");
    if (u) {
      const h = u.priceAmount || 0, I = a(u, h);
      o += I, c.push({ description: u.extraName || "Extra service", amount: I }), u.timeAmount && (s += u.timeAmount);
    }
  }
  if (s === 0) {
    const d = n.find((u) => u.ruleType === "TIME_ESTIMATE" && (u.serviceType === e.serviceType || u.serviceType === null));
    d && (d.timeAmount && (s += d.timeAmount), d.timePerUnit && l > 0 && (s += l * d.timePerUnit));
  }
  const m = Math.round(o * 100) / 100, p = Math.ceil(s * 2) / 2;
  return { price: m, durationHours: p > 0 ? p : null, breakdown: c };
}), Tt = y.input(z$1.object({ startDate: z$1.string(), endDate: z$1.string() })).query(async ({ input: e }) => {
  const n = new Date(e.endDate);
  return n.setHours(23, 59, 59, 999), { bookings: await r.booking.findMany({ where: { scheduledDate: { gte: new Date(e.startDate), lte: n }, status: { not: "CANCELLED" } }, select: { id: true, scheduledDate: true, scheduledTime: true, durationHours: true, serviceType: true, cleaner: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { scheduledTime: "asc" } }) };
}), Pt = y.input(z$1.object({ cleanerId: z$1.number(), startDate: z$1.string().optional(), endDate: z$1.string().optional() })).query(async ({ input: e }) => {
  const n = await r.user.findUnique({ where: { id: e.cleanerId }, select: { id: true, firstName: true, lastName: true, email: true, phone: true } });
  if (!n) throw new Error("Cleaner not found");
  const a = { cleanerId: e.cleanerId };
  if ((e.startDate || e.endDate) && (a.scheduledDate = {}, e.startDate && (a.scheduledDate.gte = new Date(e.startDate)), e.endDate)) {
    const c = new Date(e.endDate);
    c.setHours(23, 59, 59, 999), a.scheduledDate.lte = c;
  }
  const o = await r.booking.findMany({ where: a, select: { id: true, scheduledDate: true, scheduledTime: true, durationHours: true, serviceType: true, status: true }, orderBy: { scheduledDate: "asc" } }), s = await r.timeOffRequest.findMany({ where: { cleanerId: e.cleanerId }, orderBy: { startDate: "asc" } });
  return { cleaner: n, bookings: o, timeOff: s };
}), Dt = S.input(z$1.void()).query(async ({ ctx: e }) => {
  var _a3;
  const n = (_a3 = e.profile) == null ? void 0 : _a3.id;
  if (!n) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
  const a = await r.user.findUnique({ where: { id: n } });
  if (!a) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  return { token: null, identity: `user_${a.id}`, note: "Voice calling is disabled while migrating to OpenPhone." };
}), kt = g.input(z$1.object({ authToken: z$1.string(), toNumber: z$1.string().min(10, "Valid phone number is required") })).mutation(async ({ input: e }) => {
  let n;
  try {
    n = Q.verify(e.authToken, E.JWT_SECRET).userId;
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid authentication token" });
  }
  if (!await r.user.findUnique({ where: { id: n } })) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  const o = await r.user.findFirst({ where: { phone: { contains: e.toNumber.replace(/\D/g, "") } } });
  try {
    const s = await fetch("https://api.openphone.com/v1/calls", { method: "POST", headers: { "Content-Type": "application/json", Authorization: E.OPENPHONE_API_KEY }, body: JSON.stringify({ to: e.toNumber, from: E.OPENPHONE_PHONE_NUMBER }) });
    if (!s.ok) {
      const i = await s.text();
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to initiate call: ${i}` });
    }
    const c = await s.json(), l = await r.callLog.create({ data: { userId: n, contactId: o == null ? void 0 : o.id, callSid: c.id, fromNumber: E.OPENPHONE_PHONE_NUMBER, toNumber: e.toNumber, status: c.status, direction: "outbound", startTime: /* @__PURE__ */ new Date() } });
    return { success: true, callSid: c.id, status: c.status, callLogId: l.id, note: "Call initiated successfully." };
  } catch (s) {
    let c = "An unknown error occurred.";
    throw s instanceof Error && (c = s.message), console.error("Error making call:", s), await r.callLog.create({ data: { userId: n, contactId: o == null ? void 0 : o.id, callSid: `failed-${Date.now()}`, fromNumber: E.OPENPHONE_PHONE_NUMBER, toNumber: e.toNumber, status: "failed", direction: "outbound", startTime: /* @__PURE__ */ new Date() } }), new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to make a call: ${c}`, cause: s });
  }
}), Rt = S.input(z$1.object({ limit: z$1.number().optional().default(50) })).query(async ({ input: e, ctx: n }) => {
  var _a3;
  const a = (_a3 = n.profile) == null ? void 0 : _a3.id;
  if (!a) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
  return { callLogs: await r.callLog.findMany({ where: { userId: a }, include: { user: { select: { firstName: true, lastName: true, email: true } }, contact: { select: { firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: "desc" }, take: e.limit }) };
}), At = g.input(z$1.object({ startDate: z$1.string().datetime(), endDate: z$1.string().datetime(), reason: z$1.string().optional() })).mutation(async ({ input: e, ctx: n }) => {
  var _a3, _b;
  const a = (_a3 = n.profile) == null ? void 0 : _a3.id;
  if (!a || ((_b = n.profile) == null ? void 0 : _b.role) !== "CLEANER") throw new Error("Only cleaners can submit time-off requests");
  const o = new Date(e.startDate), s = new Date(e.endDate);
  if (s < o) throw new Error("End date must be after start date");
  return { success: true, request: await r.timeOffRequest.create({ data: { cleanerId: a, startDate: o, endDate: s, reason: e.reason, status: "PENDING" } }) };
}), Ot = g.input(z$1.object({}).optional()).query(async ({ input: e, ctx: n }) => {
  var _a3, _b, _c;
  let a = n.profile;
  if (!a && n.token) {
    const c = (_c = (_b = (_a3 = await D.auth.getUser(n.token)) == null ? void 0 : _a3.data) == null ? void 0 : _b.user) == null ? void 0 : _c.email;
    if (c) {
      const l = await r.user.findUnique({ where: { email: c } });
      l && (a = l);
    }
  }
  if (a.role !== "CLEANER") throw new Error("Only cleaners can view time-off requests");
  return { requests: await r.timeOffRequest.findMany({ where: { cleanerId: a.id }, include: { reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: "desc" } }) };
}), Ct = g.input(z$1.object({ requestId: z$1.number() })).mutation(async ({ input: e, ctx: n }) => {
  var _a3, _b;
  const a = (_a3 = n.profile) == null ? void 0 : _a3.id;
  if (!a || ((_b = n.profile) == null ? void 0 : _b.role) !== "CLEANER") throw new Error("Only cleaners can delete time-off requests");
  const o = await r.timeOffRequest.findUnique({ where: { id: e.requestId } });
  if (!o) throw new Error("Time-off request not found");
  if (o.cleanerId !== a) throw new Error("You can only delete your own time-off requests");
  if (o.status !== "PENDING") throw new Error("Only pending requests can be deleted");
  return await r.timeOffRequest.delete({ where: { id: e.requestId } }), { success: true };
}), Mt = g.input(z$1.object({ requestId: z$1.number(), startDate: z$1.string().datetime(), endDate: z$1.string().datetime(), reason: z$1.string().optional() })).mutation(async ({ input: e, ctx: n }) => {
  var _a3, _b;
  const a = (_a3 = n.profile) == null ? void 0 : _a3.id;
  if (!a || ((_b = n.profile) == null ? void 0 : _b.role) !== "CLEANER") throw new Error("Only cleaners can update time-off requests");
  const o = await r.timeOffRequest.findUnique({ where: { id: e.requestId } });
  if (!o) throw new Error("Time-off request not found");
  if (o.cleanerId !== a) throw new Error("You can only update your own time-off requests");
  if (o.status !== "PENDING") throw new Error("Only pending requests can be updated");
  const s = new Date(e.startDate), c = new Date(e.endDate);
  if (c < s) throw new Error("End date must be after start date");
  return { success: true, request: await r.timeOffRequest.update({ where: { id: e.requestId }, data: { startDate: s, endDate: c, reason: e.reason } }) };
}), qt = y.query(async () => ({ requests: await r.timeOffRequest.findMany({ include: { cleaner: { select: { id: true, firstName: true, lastName: true, email: true } }, reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: "desc" } }) })), Ut = y.input(z$1.object({ requestId: z$1.number(), status: z$1.enum(["PENDING", "APPROVED", "REJECTED"]), adminNotes: z$1.string().nullable().optional() })).mutation(async ({ input: e }) => {
  var _a3;
  if (!await r.timeOffRequest.findUnique({ where: { id: e.requestId } })) throw new Error("Request not found");
  return { request: await r.timeOffRequest.update({ where: { id: e.requestId }, data: { status: e.status, adminNotes: (_a3 = e.adminNotes) != null ? _a3 : null } }) };
}), St = y.input(z$1.object({ requestId: z$1.number() })).mutation(async ({ input: e }) => {
  if (!await r.timeOffRequest.findUnique({ where: { id: e.requestId } })) throw new Error("Request not found");
  return { request: await r.timeOffRequest.update({ where: { id: e.requestId }, data: { isCleared: true } }) };
}), _t = g.input(z$1.object({ userId: z$1.number(), bookingId: z$1.number().optional(), lat: z$1.number().optional(), lng: z$1.number().optional(), locationNote: z$1.string().optional() })).mutation(async ({ input: e }) => {
  if (await r.timeEntry.findFirst({ where: { userId: e.userId, endTime: null } })) throw new TRPCError({ code: "CONFLICT", message: "User is already punched in." });
  return await r.timeEntry.create({ data: { userId: e.userId, bookingId: e.bookingId, lat: e.lat, lng: e.lng, locationNote: e.locationNote, startTime: /* @__PURE__ */ new Date() } });
}), Bt = g.input(z$1.object({ userId: z$1.number(), lat: z$1.number().optional(), lng: z$1.number().optional(), locationNote: z$1.string().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c;
  const n = await r.timeEntry.findFirst({ where: { userId: e.userId, endTime: null } });
  if (!n) throw new TRPCError({ code: "NOT_FOUND", message: "User is not punched in." });
  return await r.timeEntry.update({ where: { id: n.id }, data: { endTime: /* @__PURE__ */ new Date(), lat: (_a3 = e.lat) != null ? _a3 : n.lat, lng: (_b = e.lng) != null ? _b : n.lng, locationNote: (_c = e.locationNote) != null ? _c : n.locationNote } });
}), Lt = g.input(z$1.object({ userId: z$1.number().optional(), bookingId: z$1.number().optional() })).query(async ({ input: e }) => {
  const n = {};
  return e.userId && (n.userId = e.userId), e.bookingId && (n.bookingId = e.bookingId), await r.timeEntry.findMany({ where: n, orderBy: { startTime: "desc" } });
}), Ft = g.input(z$1.object({ id: z$1.number(), startTime: z$1.date().optional(), endTime: z$1.date().optional(), notes: z$1.string().optional() })).mutation(async ({ input: e }) => {
  const { id: n, ...a } = e;
  return await r.timeEntry.update({ where: { id: n }, data: a });
}), jt = g.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => (await r.timeEntry.delete({ where: { id: e.id } }), { success: true })), $t = P({ punchIn: _t, punchOut: Bt, getTimeEntries: Lt, updateTimeEntry: Ft, deleteTimeEntry: jt }), x = "https://api.openphone.com/v1", Y = { async sendMessage({ to: e, content: n, mediaUrls: a }) {
  const o = await fetch(`${x}/messages`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `${E.OPENPHONE_API_KEY}` }, body: JSON.stringify({ to: [e], from: E.OPENPHONE_PHONE_NUMBER, content: n, media: a }) });
  if (!o.ok) {
    const s = await o.text();
    throw new Error(`OpenPhone API Error: ${o.status} ${s}`);
  }
  return await o.json();
}, async getMessages(e, n) {
  const a = new URL(`${x}/messages`);
  a.searchParams.append("phoneNumber", E.OPENPHONE_PHONE_NUMBER), e && a.searchParams.append("participants", e), n && a.searchParams.append("pageToken", n);
  const o = await fetch(a.toString(), { headers: { Authorization: `${E.OPENPHONE_API_KEY}` } });
  if (!o.ok) {
    const s = await o.text();
    throw new Error(`OpenPhone API Error: ${o.status} ${s}`);
  }
  return await o.json();
}, async getCalls(e) {
  const n = new URL(`${x}/calls`);
  e && n.searchParams.append("pageToken", e);
  const a = await fetch(n.toString(), { headers: { Authorization: `${E.OPENPHONE_API_KEY}` } });
  if (!a.ok) {
    const o = await a.text();
    throw new Error(`OpenPhone API Error: ${a.status} ${o}`);
  }
  return await a.json();
} }, xt = y.input(z$1.object({ recipientId: z$1.number(), content: z$1.string(), mediaUrls: z$1.array(z$1.string()).optional() })).mutation(async ({ input: e, ctx: n }) => {
  var _a3, _b;
  const a = n.profile.id, o = await r.user.findUnique({ where: { id: e.recipientId }, select: { phone: true } });
  if (!o || !o.phone) throw new TRPCError({ code: "BAD_REQUEST", message: "Recipient not found or has no phone number" });
  let s = o.phone.replace(/\D/g, "");
  s.length === 10 ? s = `+1${s}` : s.startsWith("+") || (s = `+${s}`);
  let c = null;
  try {
    const i = await Y.sendMessage({ to: s, content: e.content, mediaUrls: e.mediaUrls }), m = (_b = (_a3 = i == null ? void 0 : i.data) == null ? void 0 : _a3.id) != null ? _b : i == null ? void 0 : i.id;
    m && (c = String(m));
  } catch (i) {
    console.error("OpenPhone Send Error:", i);
  }
  return await r.message.create({ data: { sender: { connect: { id: a } }, recipient: { connect: { id: e.recipientId } }, content: e.content, mediaUrls: e.mediaUrls || [], externalId: c, isRead: true } });
}), Ht = y.input(z$1.object({ userId: z$1.number().optional() })).query(async ({ input: e }) => await r.message.findMany({ where: e.userId ? { OR: [{ senderId: e.userId }, { recipientId: e.userId }] } : void 0, orderBy: { createdAt: "asc" } })), Yt = y.input(z$1.object({ userId: z$1.number().optional() })).query(async ({ input: e }) => await r.callLog.findMany({ where: e.userId ? { contactId: e.userId } : {}, orderBy: { createdAt: "desc" } })), zt = g.input(z$1.object({ messageId: z$1.number() })).mutation(async ({ input: e }) => await r.message.update({ where: { id: e.messageId }, data: { isRead: true, readAt: /* @__PURE__ */ new Date() } })), Kt = g.input(z$1.object({ userId: z$1.number() })).query(async ({ input: e }) => ({ count: await r.message.count({ where: { recipientId: e.userId, isRead: false } }) })), Wt = y.mutation(async ({ ctx: e }) => {
  var _a3, _b;
  try {
    const a = (await Y.getMessages()).data || [];
    let o = 0;
    const s = e.profile.id;
    for (const c of a) {
      const l = c.from, i = c.to || [], m = process.env.OPENPHONE_PHONE_NUMBER || "", p = l === m ? i[0] : l;
      if (!p) continue;
      const d = p.replace(/\D/g, "");
      let u = await r.user.findFirst({ where: { phone: { contains: d.slice(-10) } } });
      u || (u = await r.user.create({ data: { firstName: "Guest", lastName: p, phone: p, email: `${d}@guest.v-luxe.com`, password: "guest-no-login-permitted", role: "CLIENT" } }));
      const h = l === m, I = h ? s : u.id, f = h ? u.id : s;
      await r.message.upsert({ where: { externalId: c.id }, create: { externalId: c.id, sender: { connect: { id: I } }, recipient: { connect: { id: f } }, content: c.content || "", mediaUrls: ((_a3 = c.media) == null ? void 0 : _a3.map((b) => b.url)) || [], createdAt: new Date(c.createdAt), isRead: true }, update: { content: c.content || "", mediaUrls: ((_b = c.media) == null ? void 0 : _b.map((b) => b.url)) || [] } }), o++;
    }
    return { success: true, count: o };
  } catch (n) {
    return console.error("Sync Error:", n), { success: false, error: n.message };
  }
}), Vt = y.mutation(async ({ ctx: e }) => {
  var _a3, _b, _c, _d;
  try {
    const a = (await Y.getCalls()).data || [];
    let o = 0;
    const s = e.profile.id;
    for (const c of a) {
      const l = c.from, i = c.to, m = process.env.OPENPHONE_PHONE_NUMBER || "", p = l === m ? i : l;
      if (!p) continue;
      const d = p.replace(/\D/g, "");
      let u = await r.user.findFirst({ where: { phone: { contains: d.slice(-10) } } });
      u || (u = await r.user.create({ data: { firstName: "Guest", lastName: p, phone: p, email: `${d}@guest-call.v-luxe.com`, password: "guest-no-login-permitted", role: "CLIENT" } })), await r.callLog.upsert({ where: { externalId: c.id }, create: { externalId: c.id, direction: c.direction, status: c.status, duration: c.duration, fromNumber: c.from, toNumber: c.to, recordingUrl: (_a3 = c.recording) == null ? void 0 : _a3.url, startTime: new Date(c.createdAt), user: { connect: { id: s } }, contact: { connect: { id: u.id } }, transcript: c.transcript, summary: c.summary, voicemailUrl: (_b = c.voicemail) == null ? void 0 : _b.url }, update: { status: c.status, duration: c.duration, recordingUrl: (_c = c.recording) == null ? void 0 : _c.url, transcript: c.transcript, summary: c.summary, voicemailUrl: (_d = c.voicemail) == null ? void 0 : _d.url } }), o++;
    }
    return { success: true, count: o };
  } catch (n) {
    return console.error("Sync Calls Error:", n), { success: false, error: n.message };
  }
}), Qt = y.input(z$1.object({ contactId: z$1.number() })).mutation(async ({ input: e }) => (await r.message.deleteMany({ where: { OR: [{ senderId: e.contactId }, { recipientId: e.contactId }] } }), await r.callLog.deleteMany({ where: { contactId: e.contactId } }), { success: true })), Gt = y.input(z$1.object({ contactId: z$1.number(), firstName: z$1.string().min(1), lastName: z$1.string().optional() })).mutation(async ({ input: e }) => ({ user: await r.user.update({ where: { id: e.contactId }, data: { firstName: e.firstName, lastName: e.lastName || "" }, select: { id: true, firstName: true, lastName: true } }) })), Xt = P({ sendMessage: xt, getMessages: Ht, getCalls: Yt, markMessageRead: zt, getUnreadCount: Kt, syncMessages: Wt, syncCalls: Vt, deleteConversation: Qt, renameContact: Gt }), Zt = g.query(async () => await r.systemLog.findMany({ orderBy: { createdAt: "desc" } })), Jt = P({ getSystemLogs: Zt }), en = g.input(z$1.object({ cleanerId: z$1.number(), availability: z$1.array(z$1.object({ dayOfWeek: z$1.number(), startTime: z$1.string(), endTime: z$1.string(), isAvailable: z$1.boolean() })) })).mutation(async ({ input: e, ctx: n }) => {
  if (!n.profile || n.profile.role !== "OWNER" && n.profile.role !== "ADMIN" && n.profile.id !== e.cleanerId) throw new Error("FORBIDDEN");
  if (await r.cleanerAvailability.count({ where: { cleanerId: e.cleanerId } }) > 0 && n.profile.role !== "OWNER" && n.profile.role !== "ADMIN") throw new Error("Changes require admin approval");
  return await r.cleanerAvailability.deleteMany({ where: { cleanerId: e.cleanerId } }), await r.cleanerAvailability.createMany({ data: e.availability.map((s) => ({ ...s, cleanerId: e.cleanerId })) });
}), tn = g.input(z$1.object({ cleanerId: z$1.number() })).query(async ({ input: e }) => await r.cleanerAvailability.findMany({ where: { cleanerId: e.cleanerId } })), nn = y.query(async () => await r.cleanerAvailability.findMany({ include: { cleaner: { select: { id: true, firstName: true, lastName: true, color: true } } } })), an = P({ setCleanerAvailability: en, getCleanerAvailability: tn, getAllCleanerAvailability: nn }), rn = g.input(z$1.object({ bookingId: z$1.number(), uploaderId: z$1.number(), fileName: z$1.string(), contentType: z$1.string().optional(), fileData: z$1.string(), imageType: z$1.enum(["BEFORE", "AFTER", "DURING"]), caption: z$1.string().optional() })).mutation(async ({ input: e }) => {
  var _a3;
  const n = E.STORAGE_BUCKET_BOOKING_PHOTOS || "booking-photos", a = Buffer.from(e.fileData, "base64"), o = `booking-${e.bookingId}/${Date.now()}-${e.fileName}`, { error: s } = await D.storage.from(n).upload(o, a, { contentType: e.contentType || "image/jpeg", upsert: false });
  if (s) throw new Error(s.message);
  const c = await D.storage.from(n).createSignedUrl(o, 60 * 60 * 24);
  return { ...await r.bookingImage.create({ data: { bookingId: e.bookingId, uploaderId: e.uploaderId, imageUrl: o, imageType: e.imageType, caption: e.caption } }), signedUrl: (_a3 = c.data) == null ? void 0 : _a3.signedUrl };
}), on = g.input(z$1.object({ bookingId: z$1.number() })).query(async ({ input: e }) => {
  const n = E.STORAGE_BUCKET_BOOKING_PHOTOS || "booking-photos", a = await r.bookingImage.findMany({ where: { bookingId: e.bookingId } });
  return await Promise.all(a.map(async (s) => {
    var _a3;
    const c = await D.storage.from(n).createSignedUrl(s.imageUrl, 86400);
    return { ...s, signedUrl: (_a3 = c.data) == null ? void 0 : _a3.signedUrl };
  }));
}), sn = g.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => {
  const n = E.STORAGE_BUCKET_BOOKING_PHOTOS || "booking-photos", a = await r.bookingImage.findUnique({ where: { id: e.id } });
  return a && await D.storage.from(n).remove([a.imageUrl]), await r.bookingImage.delete({ where: { id: e.id } }), { success: true };
}), cn = g.input(z$1.object({ bookingId: z$1.number(), fileName: z$1.string(), contentType: z$1.string() })).mutation(async ({ input: e }) => {
  const n = E.STORAGE_BUCKET_BOOKING_PHOTOS || "booking-photos", a = `booking-${e.bookingId}/${Date.now()}-${e.fileName}`, { data: o, error: s } = await D.storage.from(n).createSignedUploadUrl(a, { upsert: false, contentType: e.contentType });
  if (s || !(o == null ? void 0 : o.signedUrl)) throw new Error((s == null ? void 0 : s.message) || "Unable to create upload URL");
  return { path: a, signedUrl: o.signedUrl, token: o.token };
}), dn = g.input(z$1.object({ bookingId: z$1.number(), uploaderId: z$1.number(), path: z$1.string(), imageType: z$1.enum(["BEFORE", "AFTER", "DURING"]), caption: z$1.string().optional(), contentType: z$1.string().optional() })).mutation(async ({ input: e }) => await r.bookingImage.create({ data: { bookingId: e.bookingId, uploaderId: e.uploaderId, imageUrl: e.path, imageType: e.imageType, caption: e.caption } })), ln = P({ uploadBookingImage: rn, getBookingImages: on, deleteBookingImage: sn, createSignedUpload: cn, savePhotoRecord: dn }), un = g.input(z$1.object({ userIds: z$1.array(z$1.number()) })).mutation(async ({ input: e }) => await r.user.deleteMany({ where: { id: { in: e.userIds } } })), mn = g.input(z$1.object({ userIds: z$1.array(z$1.number()), data: z$1.object({ role: z$1.enum(["CLIENT", "CLEANER", "ADMIN", "OWNER"]).optional() }) })).mutation(async ({ input: e }) => await r.user.updateMany({ where: { id: { in: e.userIds } }, data: e.data })), pn = g.query(async () => {
  const e = await r.user.findMany();
  return await json2csv(e);
}), gn = P({ bulkDeleteUsers: un, bulkUpdateUsers: mn, exportUsersToCsv: pn }), fn = g.input(z$1.object({ name: z$1.string(), subject: z$1.string(), body: z$1.string() })).mutation(async ({ input: e }) => await r.emailTemplate.create({ data: e })), yn = g.query(async () => await r.emailTemplate.findMany()), hn = g.input(z$1.object({ id: z$1.number(), name: z$1.string().optional(), subject: z$1.string().optional(), body: z$1.string().optional() })).mutation(async ({ input: e }) => {
  const { id: n, ...a } = e;
  return await r.emailTemplate.update({ where: { id: n }, data: a });
}), wn = g.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => (await r.emailTemplate.delete({ where: { id: e.id } }), { success: true })), bn = P({ createEmailTemplate: fn, getEmailTemplates: yn, updateEmailTemplate: hn, deleteEmailTemplate: wn }), In = g.input(z$1.object({ bookingId: z$1.number(), amount: z$1.number() })).mutation(async ({ input: e }) => (console.log(`Requesting off-platform payment for booking ${e.bookingId} of amount ${e.amount}`), { success: true })), En = y.query(async () => await r.billingConfig.findFirst({ orderBy: { id: "asc" } }) || { id: 1, holdDelayHours: null }), Nn = y.input(z$1.object({ holdDelayHours: z$1.number().int().nonnegative().optional().nullable() })).mutation(async ({ input: e }) => {
  var _a3, _b;
  return await r.billingConfig.upsert({ where: { id: 1 }, update: { holdDelayHours: (_a3 = e.holdDelayHours) != null ? _a3 : null }, create: { id: 1, holdDelayHours: (_b = e.holdDelayHours) != null ? _b : null } });
}), vn = y.input(z$1.object({ bookingId: z$1.number().optional(), amount: z$1.number().positive(), currency: z$1.string().default("usd"), description: z$1.string().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c, _d;
  const n = await T.paymentIntents.create({ amount: Math.round(e.amount * 100), currency: e.currency, capture_method: "manual", description: e.description, metadata: e.bookingId ? { bookingId: e.bookingId.toString() } : void 0 });
  return await r.stripePayment.upsert({ where: { stripeIntentId: n.id }, update: { amount: e.amount, status: n.status, currency: e.currency, bookingId: (_a3 = e.bookingId) != null ? _a3 : null, description: (_b = e.description) != null ? _b : null }, create: { stripeIntentId: n.id, amount: e.amount, status: n.status, currency: e.currency, bookingId: (_c = e.bookingId) != null ? _c : null, description: (_d = e.description) != null ? _d : null } }), n;
}), Tn = y.input(z$1.object({ paymentIntentId: z$1.string() })).mutation(async ({ input: e }) => {
  const n = await T.paymentIntents.capture(e.paymentIntentId);
  return await r.stripePayment.updateMany({ where: { stripeIntentId: e.paymentIntentId }, data: { status: n.status } }), n;
}), Pn = y.input(z$1.object({ paymentIntentId: z$1.string() })).mutation(async ({ input: e }) => {
  const n = await T.paymentIntents.cancel(e.paymentIntentId);
  return await r.stripePayment.updateMany({ where: { stripeIntentId: e.paymentIntentId }, data: { status: n.status } }), n;
}), Dn = y.input(z$1.object({ paymentIntentId: z$1.string(), amount: z$1.number().positive(), description: z$1.string().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c;
  const n = await T.paymentIntents.retrieve(e.paymentIntentId);
  if (n.capture_method !== "manual") throw new Error("Not a manual capture hold");
  const a = await T.paymentIntents.update(e.paymentIntentId, { amount: Math.round(e.amount * 100), description: (_b = (_a3 = e.description) != null ? _a3 : n.description) != null ? _b : void 0 });
  return await r.stripePayment.updateMany({ where: { stripeIntentId: e.paymentIntentId }, data: { amount: e.amount, status: a.status, currency: a.currency, description: (_c = a.description) != null ? _c : void 0 } }), { id: a.id, amount: a.amount / 100, status: a.status, description: a.description };
}), kn = y.query(async () => (await T.paymentIntents.list({ limit: 50 })).data.filter((a) => a.capture_method === "manual").map((a) => {
  var _a3;
  return { id: a.id, amount: a.amount / 100, currency: a.currency, status: a.status, description: a.description, bookingId: (_a3 = a.metadata) == null ? void 0 : _a3.bookingId, created: a.created ? new Date(a.created * 1e3) : null, paymentMethod: Rn(a), paymentIntentId: a.id };
}));
function Rn(e) {
  var _a3, _b, _c, _d;
  const n = e.payment_method, o = (_b = (((_a3 = e.charges) == null ? void 0 : _a3.data) || [])[0]) == null ? void 0 : _b.payment_method_details;
  return (o == null ? void 0 : o.card) ? `Card \u2022 ${(_d = (_c = o.card.last4) != null ? _c : n) != null ? _d : ""}` : (o == null ? void 0 : o.type) ? o.type : typeof n == "string" ? n : "Unknown";
}
const An = y.query(async () => (await T.paymentIntents.list({ limit: 50 })).data.filter((a) => a.status === "succeeded" || a.status === "processing").map((a) => {
  var _a3;
  return { id: a.id, amount: (a.amount_received || a.amount) / 100, currency: a.currency, status: a.status, description: a.description, bookingId: (_a3 = a.metadata) == null ? void 0 : _a3.bookingId, created: a.created ? new Date(a.created * 1e3) : null, paymentMethod: On(a), paymentIntentId: a.id };
}));
function On(e) {
  var _a3, _b, _c, _d;
  const n = e.payment_method, o = (_b = (((_a3 = e.charges) == null ? void 0 : _a3.data) || [])[0]) == null ? void 0 : _b.payment_method_details;
  return (o == null ? void 0 : o.card) ? `Card \u2022 ${(_d = (_c = o.card.last4) != null ? _c : n) != null ? _d : ""}` : (o == null ? void 0 : o.type) ? o.type : typeof n == "string" ? n : "Unknown";
}
const Cn = y.input(z$1.object({ bookingId: z$1.number() })).query(async ({ input: e }) => {
  var _a3, _b, _c, _d, _e2, _f;
  const n = await r.stripePayment.findMany({ where: { bookingId: e.bookingId }, orderBy: { createdAt: "desc" } }), a = n[0], o = (_a3 = a == null ? void 0 : a.status) != null ? _a3 : "unknown", s = n.find((i) => i.status === "requires_capture" || i.status === "requires_confirmation"), c = n.find((i) => i.status === "succeeded" || i.status === "processing"), l = n.find((i) => i.status === "refunded");
  return { status: o, heldAmount: (_b = s == null ? void 0 : s.amount) != null ? _b : 0, capturedAmount: (_c = c == null ? void 0 : c.amount) != null ? _c : 0, refundedAmount: (_d = l == null ? void 0 : l.amount) != null ? _d : 0, currency: (_e2 = a == null ? void 0 : a.currency) != null ? _e2 : "usd", paymentMethodLabel: (_f = a == null ? void 0 : a.description) != null ? _f : "Card on file", raw: n };
}), Mn = y.input(z$1.object({ id: z$1.string(), status: z$1.enum(["posted", "pending", "excluded"]) })).mutation(async ({ input: e }) => ({ updated: (await r.mercuryTransaction.updateMany({ where: { externalId: e.id }, data: { status: e.status } })).count })), qn = y.input(z$1.object({ id: z$1.string(), category: z$1.string(), subCategory: z$1.string().optional() })).mutation(async ({ input: e }) => ({ updated: (await r.mercuryTransaction.updateMany({ where: { externalId: e.id }, data: { category: e.category, description: e.subCategory ? { set: e.subCategory } : void 0 } })).count })), Un = "https://api.mercury.com";
async function z(e, n) {
  if (!E.MERCURY_API_KEY) throw new Error("MERCURY_API_KEY is not configured");
  const o = `${E.MERCURY_API_BASE || Un}${e}`, s = await fetch(o, { method: "GET", ...n, headers: { Authorization: `Bearer ${E.MERCURY_API_KEY}`, "Content-Type": "application/json", ...(n == null ? void 0 : n.headers) || {} } });
  if (!s.ok) {
    const c = await s.text();
    throw new Error(`Mercury API error: ${s.status} ${c}`);
  }
  return s.json();
}
const Sn = y.input(z$1.object({ paymentIds: z$1.array(z$1.string()), payoutAccountId: z$1.string().optional() })).mutation(async ({ input: e }) => {
  if (!E.MERCURY_API_KEY) throw new Error("MERCURY_API_KEY is not configured");
  const n = { payouts: e.paymentIds.map((a) => ({ amount: 0, currency: "usd", account_id: e.payoutAccountId || E.MERCURY_PAYOUT_ACCOUNT_ID || void 0, memo: `Payout for ${a}` })) };
  try {
    const a = await z("/v1/payouts", { method: "POST", body: JSON.stringify(n) });
    return { initiated: e.paymentIds.length, status: "submitted", response: a };
  } catch (a) {
    return console.warn("\u26A0\uFE0F Mercury API error caught. Falling back to mock success for dev/demo."), console.error(a.message), console.log(`[Mercury Mock] Initiated ACH payout for ${e.paymentIds.length} items`), console.log("[Mercury Mock] Payload:", JSON.stringify(n, null, 2)), { initiated: e.paymentIds.length, status: "submitted", mock: true, note: "Processed via mock fallback (Mercury API returned error)" };
  }
}), _n = y.query(async () => (await r.booking.findMany({ where: { status: "COMPLETED" }, include: { client: { select: { id: true, firstName: true, lastName: true, email: true } }, payments: { select: { amount: true, paidAt: true } } }, orderBy: { scheduledDate: "desc" } })).filter((a) => {
  const o = a.payments.reduce((s, c) => c.paidAt ? s + c.amount : s, 0);
  return (a.finalPrice || 0) > o;
}).map((a) => {
  const o = a.payments.reduce((s, c) => c.paidAt ? s + c.amount : s, 0);
  return { id: a.id.toString(), customer: { id: a.clientId, name: `${a.client.firstName} ${a.client.lastName}`, email: a.client.email }, amount: (a.finalPrice || 0) - o, serviceDate: new Date(a.scheduledDate).toLocaleDateString(), serviceTime: a.scheduledTime, location: a.address };
})), Bn = P({ requestOffPlatformPayment: In, getBillingConfig: En, setBillingConfig: Nn, createHold: vn, captureHold: Tn, cancelHold: Pn, updateHold: Dn, listHolds: kn, listCharges: An, getPaymentStatus: Cn, updateTransactionStatus: Mn, updateTransactionCategory: qn, initiateAchPayout: Sn, getPendingCharges: _n }), Ln = g.input(z$1.object({ to: z$1.string(), task: z$1.string() })).mutation(async ({ input: e }) => {
  if (!(await fetch("https://api.openphone.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", Authorization: E.OPENPHONE_API_KEY }, body: JSON.stringify({ to: [e.to], from: E.OPENPHONE_PHONE_NUMBER, content: `Reminder: ${e.task}` }) })).ok) throw new Error("Failed to send SMS");
  return { success: true };
}), Fn = P({ sendTaskReminderSms: Ln }), jn = g.query(async () => await r.document.findMany()), $n = P({ getDocuments: jn }), xn = g.input(z$1.object({ amount: z$1.number().positive(), currency: z$1.string().default("usd"), bookingId: z$1.number().optional(), description: z$1.string().optional(), paymentMethodTypes: z$1.array(z$1.string()).optional(), customerId: z$1.string().optional(), paymentMethodId: z$1.string().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c, _d, _e2;
  const n = await T.paymentIntents.create({ amount: Math.round(e.amount * 100), currency: e.currency, description: e.description, metadata: e.bookingId ? { bookingId: e.bookingId.toString() } : void 0, payment_method_types: (_a3 = e.paymentMethodTypes) != null ? _a3 : ["card"], capture_method: "automatic", customer: e.customerId, payment_method: e.paymentMethodId });
  return await r.stripePayment.upsert({ where: { stripeIntentId: n.id }, update: { amount: e.amount, status: n.status, currency: e.currency, bookingId: (_b = e.bookingId) != null ? _b : null, description: (_c = e.description) != null ? _c : null }, create: { stripeIntentId: n.id, amount: e.amount, status: n.status, currency: e.currency, bookingId: (_d = e.bookingId) != null ? _d : null, description: (_e2 = e.description) != null ? _e2 : null } }), { clientSecret: n.client_secret, intentId: n.id, status: n.status };
}), Hn = g.input(z$1.object({ paymentIntentId: z$1.string() })).mutation(async ({ input: e }) => {
  const n = await T.paymentIntents.capture(e.paymentIntentId);
  return await r.stripePayment.updateMany({ where: { stripeIntentId: e.paymentIntentId }, data: { status: n.status } }), { intentId: n.id, status: n.status, charges: n.charges };
}), Yn = g.input(z$1.object({ paymentIntentId: z$1.string(), amount: z$1.number().positive().optional(), reason: z$1.string().optional() })).mutation(async ({ input: e }) => {
  const n = await T.refunds.create({ payment_intent: e.paymentIntentId, amount: e.amount ? Math.round(e.amount * 100) : void 0, reason: e.reason });
  return n.status === "succeeded" && await r.stripePayment.updateMany({ where: { stripeIntentId: e.paymentIntentId }, data: { status: "refunded" } }), { refundId: n.id, status: n.status };
}), zn = y.input(z$1.object({ bookingId: z$1.number() })).query(async ({ input: e }) => ({ payments: await r.stripePayment.findMany({ where: { bookingId: e.bookingId }, orderBy: { createdAt: "desc" } }) })), Kn = g.input(z$1.object({ bookingId: z$1.number().optional(), customerEmail: z$1.string().email().optional(), userId: z$1.number().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b;
  let n;
  if (e.userId) {
    const o = await r.user.findUnique({ where: { id: e.userId } });
    if (o == null ? void 0 : o.stripeCustomerId) n = o.stripeCustomerId;
    else if (o == null ? void 0 : o.email) {
      const s = await T.customers.create({ email: o.email, name: `${(_a3 = o.firstName) != null ? _a3 : ""} ${(_b = o.lastName) != null ? _b : ""}`.trim() });
      n = s.id, await r.user.update({ where: { id: o.id }, data: { stripeCustomerId: s.id } });
    }
  }
  const a = await T.setupIntents.create({ usage: "off_session", customer: n, metadata: e.bookingId ? { bookingId: e.bookingId.toString() } : void 0 });
  return { clientSecret: a.client_secret, setupIntentId: a.id };
}), Wn = y.input(z$1.object({ setupIntentId: z$1.string(), userId: z$1.number(), setDefault: z$1.boolean().optional() })).mutation(async ({ input: e }) => {
  const n = await r.user.findUnique({ where: { id: e.userId } });
  if (!(n == null ? void 0 : n.stripeCustomerId)) throw new Error("User missing stripe customer");
  const a = await T.setupIntents.retrieve(e.setupIntentId);
  if (!a.payment_method) throw new Error("No payment method on setup intent");
  const o = typeof a.payment_method == "string" ? a.payment_method : a.payment_method.id;
  return await T.paymentMethods.attach(o, { customer: n.stripeCustomerId }), e.setDefault && (await T.customers.update(n.stripeCustomerId, { invoice_settings: { default_payment_method: o } }), await r.user.update({ where: { id: e.userId }, data: { stripeDefaultPaymentMethodId: o } })), { paymentMethodId: o };
}), Vn = y.input(z$1.object({ userId: z$1.number(), bookingId: z$1.number(), amount: z$1.number().positive(), currency: z$1.string().default("usd"), description: z$1.string().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c, _d, _e2, _f, _g;
  const n = await r.user.findUnique({ where: { id: e.userId } });
  if (!(n == null ? void 0 : n.stripeCustomerId) || !n.stripeDefaultPaymentMethodId) throw new Error("User missing saved payment method");
  const a = await T.paymentIntents.create({ amount: Math.round(e.amount * 100), currency: e.currency, customer: n.stripeCustomerId, payment_method: n.stripeDefaultPaymentMethodId, off_session: true, confirm: true, description: (_a3 = e.description) != null ? _a3 : `Charge for booking #${e.bookingId}`, metadata: { bookingId: e.bookingId.toString() } }), o = a.charges, s = ((_e2 = (_d = (_c = (_b = o == null ? void 0 : o.data) == null ? void 0 : _b[0]) == null ? void 0 : _c.payment_method_details) == null ? void 0 : _d.card) == null ? void 0 : _e2.last4) ? `Card \u2022 ${o.data[0].payment_method_details.card.last4}` : (_f = a.payment_method) != null ? _f : void 0;
  return await r.stripePayment.create({ data: { bookingId: e.bookingId, stripeIntentId: a.id, amount: e.amount, status: a.status, currency: a.currency, description: (_g = a.description) != null ? _g : void 0, paymentMethod: s } }), { intentId: a.id, status: a.status };
}), Qn = P({ createPaymentIntent: xn, capturePayment: Hn, refundPayment: Yn, getBookingPayments: zn, createSetupIntent: Kn, attachPaymentMethodFromSetupIntent: Wn, createChargeWithSavedMethod: Vn }), Gn = g.input(z$1.object({ date: z$1.date(), description: z$1.string(), amount: z$1.number(), category: z$1.enum(["INCOME", "EXPENSE", "ASSET", "LIABILITY", "EQUITY"]), relatedBookingId: z$1.number().optional() })).mutation(async ({ input: e }) => await r.accountingEntry.create({ data: e })), Xn = g.query(async () => await r.accountingEntry.findMany()), Zn = g.input(z$1.object({ id: z$1.number(), date: z$1.date().optional(), description: z$1.string().optional(), amount: z$1.number().optional(), category: z$1.enum(["INCOME", "EXPENSE", "ASSET", "LIABILITY", "EQUITY"]).optional(), relatedBookingId: z$1.number().optional() })).mutation(async ({ input: e }) => {
  const { id: n, ...a } = e;
  return await r.accountingEntry.update({ where: { id: n }, data: a });
}), Jn = g.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => (await r.accountingEntry.delete({ where: { id: e.id } }), { success: true })), K = E.MERCURY_API_BASE || "https://api.mercury.com", W = { async getAccounts() {
  if (!E.MERCURY_API_KEY) return [];
  const e = await fetch(`${K}/v1/accounts`, { headers: { Authorization: `Bearer ${E.MERCURY_API_KEY}`, "Content-Type": "application/json" } });
  return e.ok ? (await e.json()).accounts || [] : (console.error("Mercury GetAccounts Error:", e.status, await e.text()), []);
}, async getTransactions(e) {
  if (!E.MERCURY_API_KEY) return [];
  const n = await fetch(`${K}/v1/account/${e}/transactions`, { headers: { Authorization: `Bearer ${E.MERCURY_API_KEY}`, "Content-Type": "application/json" } });
  return n.ok ? (await n.json()).transactions || [] : (console.error("Mercury GetTransactions Error:", n.status, await n.text()), []);
} }, ea = g.mutation(async () => {
  try {
    const e = await W.getAccounts();
    let n = 0;
    for (const a of e) {
      const o = await r.mercuryAccount.upsert({ where: { externalId: a.id }, create: { externalId: a.id, name: a.name, balance: a.balance, status: "active" }, update: { balance: a.balance, name: a.name } }), s = await W.getTransactions(a.id);
      for (const c of s) {
        if (await r.mercuryTransaction.findUnique({ where: { externalId: c.id } })) continue;
        const i = await r.mercuryTransaction.create({ data: { externalId: c.id, accountId: o.id, amount: c.amount, status: c.status, description: c.counterpartyName || c.note || "Mercury Transaction", transactionAt: new Date(c.postedAt || c.createdAt), category: c.amount > 0 ? "INCOME" : "EXPENSE" } }), m = Math.abs(c.amount), p = c.amount > 0 ? "INCOME" : "EXPENSE", d = await r.accountingEntry.create({ data: { date: new Date(c.postedAt || c.createdAt), amount: m, category: p, description: `${c.counterpartyName || "Mercury"} (Sync)`, mercuryTransactionId: i.id } });
        p === "EXPENSE" && await r.expense.create({ data: { date: new Date(c.postedAt || c.createdAt), amount: m, category: "EXPENSE", description: c.description || c.counterpartyName || "Expense", vendor: c.counterpartyName, accountingEntryId: d.id } }), n++;
      }
    }
    return { success: true, count: n };
  } catch (e) {
    return console.error("Mercury Sync Error:", e), { success: false, error: e.message };
  }
}), ta = y.query(async () => {
  try {
    return await z("/v1/accounts");
  } catch (e) {
    return { accounts: [], error: (e == null ? void 0 : e.message) || "Mercury accounts unavailable" };
  }
}), na = y.input(z$1.object({ limit: z$1.number().int().positive().max(100).optional().default(50), page: z$1.number().int().positive().optional().default(1), startDate: z$1.string().optional(), endDate: z$1.string().optional() }).optional()).query(async ({ input: e }) => {
  var _a3, _b;
  const n = new URLSearchParams(), a = (_a3 = e == null ? void 0 : e.limit) != null ? _a3 : 50, o = (_b = e == null ? void 0 : e.page) != null ? _b : 1;
  n.set("per_page", a.toString()), n.set("page", o.toString()), (e == null ? void 0 : e.startDate) && n.set("start_date", e.startDate), (e == null ? void 0 : e.endDate) && n.set("end_date", e.endDate);
  let s;
  try {
    s = await z(`/v1/transactions?${n.toString()}`);
  } catch (l) {
    return { transactions: [], error: (l == null ? void 0 : l.message) || "Mercury transactions unavailable" };
  }
  const c = ((s == null ? void 0 : s.transactions) || (s == null ? void 0 : s.data) || []).map((l) => {
    let i = null;
    const p = (l.description || l.memo || "").toString().match(/#(\d+)/);
    return p && (i = Number(p[1])), { ...l, bookingId: i };
  });
  if ((e == null ? void 0 : e.startDate) || (e == null ? void 0 : e.endDate)) {
    const l = M(e == null ? void 0 : e.startDate, e == null ? void 0 : e.endDate), i = (m) => {
      if (!m) return false;
      const p = typeof m == "string" ? new Date(m) : m;
      return !(l.start && p < l.start || l.end && p > l.end);
    };
    return { transactions: c.filter((m) => i(m.transactionAt || m.date || m.created_at)) };
  }
  return { transactions: c };
}), aa = y.input(z$1.object({ startDate: z$1.date(), endDate: z$1.date() })).query(async ({ input: e }) => {
  const n = await r.accountingEntry.findMany({ where: { date: { gte: e.startDate, lte: e.endDate } }, include: { expense: true, mercuryTransaction: true } }), a = await r.expense.findMany({ where: { date: { gte: e.startDate, lte: e.endDate }, accountingEntryId: null } });
  let o = 0, s = 0;
  for (const p of n) p.category === "INCOME" ? o += p.amount : p.category === "EXPENSE" && (s += p.amount);
  const c = {}, l = (p, d, u) => {
    const h = p.toISOString().split("T")[0];
    h && (c[h] || (c[h] = { income: 0, expense: 0 }), u ? c[h].income += d : c[h].expense += d);
  };
  for (const p of n) l(p.date, p.amount, p.category === "INCOME");
  for (const p of a) l(p.date, p.amount, false), s += p.amount;
  const i = Object.entries(c).map(([p, d]) => ({ date: p, income: d.income, expense: d.expense, profit: d.income - d.expense })).sort((p, d) => p.date.localeCompare(d.date)), m = [...n.map((p) => ({ ...p, type: "entry" })), ...a.map((p) => ({ ...p, type: "manual", expense: p }))].sort((p, d) => d.date.getTime() - p.date.getTime());
  return { totalIncome: o, totalExpense: s, netProfit: o - s, chartData: i, entries: m, manualExpenses: a };
}), ra = y.input(z$1.object({ startDate: z$1.date().optional(), endDate: z$1.date().optional() })).query(async ({ input: e }) => {
  const n = e.startDate || new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1), a = e.endDate || /* @__PURE__ */ new Date(), o = await r.booking.findMany({ where: { status: "COMPLETED", scheduledDate: { gte: n, lte: a } } }), s = await r.booking.findMany({ where: { status: "PENDING", scheduledDate: { gte: n, lte: a } } });
  return [{ key: "billedRevenue", value: o.reduce((l, i) => l + (i.finalPrice || 0), 0) }, { key: "pendingPayments", value: s.reduce((l, i) => l + (i.finalPrice || 0), 0) }, { key: "recurringRevenue", value: o.filter((l) => l.serviceFrequency !== "ONE_TIME").reduce((l, i) => l + (i.finalPrice || 0), 0) }, { key: "monthlyRevenue", value: o.filter((l) => l.serviceFrequency === "MONTHLY").reduce((l, i) => l + (i.finalPrice || 0), 0) }, { key: "everyOtherWeekRevenue", value: o.filter((l) => l.serviceFrequency === "BIWEEKLY").reduce((l, i) => l + (i.finalPrice || 0), 0) }, { key: "weeklyRevenue", value: o.filter((l) => l.serviceFrequency === "WEEKLY").reduce((l, i) => l + (i.finalPrice || 0), 0) }];
}), oa = P({ createAccountingEntry: Gn, getAccountingEntries: Xn, updateAccountingEntry: Zn, deleteAccountingEntry: Jn, syncMercuryTransactions: ea, listAccounts: ta, listTransactions: na, getProfitAndLoss: aa, getRevenueMetrics: ra }), ia = g.input(z$1.object({ name: z$1.string(), email: z$1.string(), phone: z$1.string(), source: z$1.string(), message: z$1.string(), status: z$1.string() })).mutation(async ({ input: e }) => await r.lead.create({ data: e })), sa = g.query(async () => await r.lead.findMany()), ca = g.input(z$1.object({ id: z$1.number(), name: z$1.string().optional(), email: z$1.string().optional(), phone: z$1.string().optional(), source: z$1.enum(["GOOGLE_LSA", "THUMBTACK", "FACEBOOK_AD", "REDDIT", "NEXTDOOR", "WEBSITE", "REFERRAL"]).optional(), message: z$1.string().optional(), status: z$1.string().optional() })).mutation(async ({ input: e }) => {
  const { id: n, ...a } = e;
  return await r.lead.update({ where: { id: n }, data: a });
}), da = g.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => (await r.lead.delete({ where: { id: e.id } }), { success: true })), X = g.input(z$1.object({ transcript: z$1.string() })).mutation(async ({ input: e }) => {
  if (!E.OPENAI_API_KEY) throw new Error("OpenAI API key not configured.");
  try {
    const { object: n } = await generateObject({ model: openai("gpt-4o-mini"), schema: z$1.object({ sentiment: z$1.enum(["positive", "neutral", "negative"]), actionItems: z$1.array(z$1.string()), summary: z$1.string() }), prompt: `Analyze the following call transcript from a professional cleaning service "Verde Luxe". 
        Identify the overall sentiment, key action items (e.g. scheduling, follow-ups, complaints), and provide a short summary.
        
        Transcript:
        ${e.transcript}` });
    return n;
  } catch (n) {
    throw console.error("AI analysis failed:", n), new Error("Failed to analyze transcript via AI.");
  }
}), la = y.input(z$1.object({ leadId: z$1.number() })).mutation(async ({ input: e }) => {
  const n = await r.lead.findUnique({ where: { id: e.leadId } });
  if (!n) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
  let a = await r.user.findUnique({ where: { email: n.email } });
  if (!a) {
    const s = Math.random().toString(36).slice(-8), c = await U.hash(s, 10), l = n.name.split(" "), i = l[0] || "Unknown", m = l.slice(1).join(" ") || "";
    a = await r.user.create({ data: { email: n.email, firstName: i, lastName: m, phone: n.phone, password: c, role: "CLIENT", temporaryPassword: s } });
  }
  const o = await r.booking.create({ data: { clientId: a.id, serviceType: "Standard Cleaning", address: "Address Pending", scheduledDate: /* @__PURE__ */ new Date(), scheduledTime: "09:00", status: "PENDING", finalPrice: 150 } });
  return await r.lead.update({ where: { id: n.id }, data: { status: "CONVERTED" } }), { bookingId: o.id, clientId: a.id };
}), ua = g.query(async () => r.leadSourceCategory.findMany({ orderBy: { name: "asc" } })), ma = y.input(z$1.object({ name: z$1.string() })).mutation(async ({ input: e }) => r.leadSourceCategory.create({ data: { name: e.name } })), pa = y.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => r.leadSourceCategory.delete({ where: { id: e.id } })), ga = P({ createLead: ia, getLeads: sa, updateLead: ca, deleteLead: da, analyzeCallTranscript: X, convertLeadToBooking: la, getLeadSources: ua, createLeadSource: ma, deleteLeadSource: pa }), fa = g.input(z$1.object({ callId: z$1.number() })).query(async ({ input: e }) => await r.aITranscript.findFirst({ where: { callId: e.callId } })), ya = P({ getTranscript: fa, analyzeCallTranscript: X }), ha = g.input(z$1.object({ name: z$1.string() })).mutation(async ({ input: e }) => (console.log("Creating campaign..."), { success: true })), wa = g.input(z$1.object({ campaignId: z$1.number(), sendAt: z$1.date() })).mutation(async ({ input: e }) => (console.log("Scheduling campaign..."), { success: true })), ba = P({ createCampaign: ha, scheduleCampaign: wa }), Ia = g.input(z$1.object({ platform: z$1.string(), content: z$1.string(), scheduledAt: z$1.date().optional() })).mutation(async ({ input: e }) => await r.socialMediaPost.create({ data: { ...e, status: e.scheduledAt ? "scheduled" : "draft" } })), Ea = g.query(async () => await r.socialMediaPost.findMany()), Na = g.input(z$1.object({ id: z$1.number(), platform: z$1.string().optional(), content: z$1.string().optional(), scheduledAt: z$1.date().optional(), status: z$1.string().optional() })).mutation(async ({ input: e }) => {
  const { id: n, ...a } = e;
  return await r.socialMediaPost.update({ where: { id: n }, data: a });
}), va = g.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => (await r.socialMediaPost.delete({ where: { id: e.id } }), { success: true })), Ta = P({ createSocialMediaPost: Ia, getSocialMediaPosts: Ea, updateSocialMediaPost: Na, deleteSocialMediaPost: va }), Pa = g.input(z$1.object({ path: z$1.string(), title: z$1.string(), description: z$1.string(), keywords: z$1.string() })).mutation(async ({ input: e }) => await r.sEOMetadata.create({ data: e })), Da = g.query(async () => await r.sEOMetadata.findMany()), ka = g.input(z$1.object({ id: z$1.number(), path: z$1.string().optional(), title: z$1.string().optional(), description: z$1.string().optional(), keywords: z$1.string().optional() })).mutation(async ({ input: e }) => {
  const { id: n, ...a } = e;
  return await r.sEOMetadata.update({ where: { id: n }, data: a });
}), Ra = g.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => (await r.sEOMetadata.delete({ where: { id: e.id } }), { success: true })), Aa = g.mutation(async () => (console.log("Generating sitemap..."), { success: true })), Oa = P({ createSEOMetadata: Pa, getSEOMetadata: Da, updateSEOMetadata: ka, deleteSEOMetadata: Ra, generateSitemap: Aa }), Ca = g.input(z$1.object({ title: z$1.string(), description: z$1.string(), videoUrl: z$1.string(), duration: z$1.number() })).mutation(async ({ input: e }) => await r.trainingVideo.create({ data: e })), Ma = g.query(async () => await r.trainingVideo.findMany()), qa = g.input(z$1.object({ id: z$1.number(), title: z$1.string().optional(), description: z$1.string().optional(), videoUrl: z$1.string().optional(), duration: z$1.number().optional() })).mutation(async ({ input: e }) => {
  const { id: n, ...a } = e;
  return await r.trainingVideo.update({ where: { id: n }, data: a });
}), Ua = g.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => (await r.trainingVideo.delete({ where: { id: e.id } }), { success: true })), Sa = g.input(z$1.object({ cleanerId: z$1.number(), videoId: z$1.number(), score: z$1.number().optional() })).mutation(async ({ input: e }) => await r.cleanerTrainingProgress.create({ data: { ...e, completedAt: /* @__PURE__ */ new Date() } })), _a = g.input(z$1.object({ cleanerId: z$1.number() })).query(async ({ input: e }) => await r.cleanerTrainingProgress.findMany({ where: { cleanerId: e.cleanerId } })), Ba = P({ createTrainingVideo: Ca, getTrainingVideos: Ma, updateTrainingVideo: qa, deleteTrainingVideo: Ua, trackTrainingProgress: Sa, getTrainingProgress: _a }), La = g.input(z$1.object({ question: z$1.string(), answer: z$1.string(), category: z$1.string(), order: z$1.number().optional() })).mutation(async ({ input: e }) => await r.fAQ.create({ data: e })), Fa = g.query(async () => await r.fAQ.findMany()), ja = g.input(z$1.object({ id: z$1.number(), question: z$1.string().optional(), answer: z$1.string().optional(), category: z$1.string().optional(), order: z$1.number().optional() })).mutation(async ({ input: e }) => {
  const { id: n, ...a } = e;
  return await r.fAQ.update({ where: { id: n }, data: a });
}), $a = g.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => (await r.fAQ.delete({ where: { id: e.id } }), { success: true })), xa = P({ createFaq: La, getFaqs: Fa, updateFaq: ja, deleteFaq: $a }), Ha = y.query(async () => await r.review.findMany({ include: { booking: { include: { client: true } } }, orderBy: { createdAt: "desc" } })), Ya = y.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => (await r.review.delete({ where: { id: e.id } }), { success: true })), za = y.input(z$1.object({ id: z$1.number(), isPublic: z$1.boolean().optional(), comment: z$1.string().optional(), rating: z$1.number().min(1).max(5).optional() })).mutation(async ({ input: e }) => {
  const { id: n, ...a } = e;
  return await r.review.update({ where: { id: n }, data: a });
}), Ka = P({ getReviewsAdmin: Ha, deleteReviewAdmin: Ya, updateReviewAdmin: za }), Wa = P({ getDailyTasks: y.input(z$1.object({ date: z$1.date() })).query(async ({ input: e }) => {
  const n = new Date(e.date);
  n.setHours(0, 0, 0, 0);
  const a = new Date(e.date);
  return a.setHours(23, 59, 59, 999), await r.manualTask.findMany({ where: { date: { gte: n, lte: a } }, orderBy: { priority: "desc" }, include: { assignedTo: true } });
}), createTask: y.input(z$1.object({ title: z$1.string().min(1), description: z$1.string().optional(), date: z$1.date(), priority: z$1.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"), assignedToId: z$1.number().optional() })).mutation(async ({ input: e }) => await r.manualTask.create({ data: e })), updateTask: y.input(z$1.object({ id: z$1.number(), title: z$1.string().optional(), description: z$1.string().optional(), status: z$1.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(), priority: z$1.enum(["LOW", "MEDIUM", "HIGH"]).optional(), assignedToId: z$1.number().optional().nullable() })).mutation(async ({ input: e }) => {
  const { id: n, ...a } = e;
  return await r.manualTask.update({ where: { id: n }, data: a });
}), deleteTask: y.input(z$1.object({ id: z$1.number() })).mutation(async ({ input: e }) => await r.manualTask.delete({ where: { id: e.id } })) }), Va = y.input(z$1.object({ horizonDays: z$1.number().int().positive().max(365).default(120) })).mutation(async ({ input: e }) => {
  var _a3, _b, _c, _d;
  const n = await r.booking.findMany({ where: { serviceFrequency: { not: "ONE_TIME" }, status: { not: "CANCELLED" } } });
  let a = 0, o = [];
  for (const s of n) {
    const c = (_a3 = s.recurrenceId) != null ? _a3 : H$1.randomUUID();
    s.recurrenceId || (await r.booking.update({ where: { id: s.id }, data: { recurrenceId: c, occurrenceNumber: (_b = s.occurrenceNumber) != null ? _b : 1 } }), o.push(s.id));
    const i = (_c = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 }[s.serviceFrequency]) != null ? _c : 7, m = new Date(s.scheduledDate), p = /* @__PURE__ */ new Date();
    p.setDate(p.getDate() + e.horizonDays);
    let d = 1;
    for (; ; ) {
      const u = new Date(m);
      if (u.setDate(m.getDate() + i * d), u > p) break;
      if (!await r.booking.findFirst({ where: { recurrenceId: c, scheduledDate: u }, select: { id: true } })) {
        const I = await r.booking.findFirst({ where: { clientId: s.clientId, scheduledDate: u, scheduledTime: s.scheduledTime }, select: { id: true } }), f = s.cleanerId && await r.booking.findFirst({ where: { scheduledDate: u, scheduledTime: s.scheduledTime, OR: [{ cleanerId: s.cleanerId }, { cleaners: { some: { cleanerId: s.cleanerId } } }] }, select: { id: true } }), b = s.cleanerId && await r.timeOffRequest.findFirst({ where: { cleanerId: s.cleanerId, status: "APPROVED", startDate: { lte: u }, endDate: { gte: u } }, select: { id: true } });
        if (I) {
          d++;
          continue;
        }
        if (f || b) {
          d++;
          continue;
        }
        await r.booking.create({ data: { clientId: s.clientId, cleanerId: s.cleanerId, serviceType: s.serviceType, scheduledDate: u, scheduledTime: s.scheduledTime, durationHours: s.durationHours, address: s.address, specialInstructions: s.specialInstructions, finalPrice: s.finalPrice, status: s.status, serviceFrequency: s.serviceFrequency, houseSquareFootage: s.houseSquareFootage, basementSquareFootage: s.basementSquareFootage, numberOfBedrooms: s.numberOfBedrooms, numberOfBathrooms: s.numberOfBathrooms, numberOfCleanersRequested: s.numberOfCleanersRequested, cleanerPaymentAmount: s.cleanerPaymentAmount, paymentMethod: s.paymentMethod, paymentDetails: s.paymentDetails, selectedExtras: s.selectedExtras, recurrenceId: c, occurrenceNumber: ((_d = s.occurrenceNumber) != null ? _d : 1) + d } }), a++;
      }
      d++;
    }
  }
  return { created: a, updated: o.length };
}), Qa = g.input(z$1.object({ to: z$1.string().email(), templateType: z$1.string(), context: z$1.record(z$1.any()).optional(), fallbackSubject: z$1.string().optional(), fallbackBody: z$1.string().optional() })).mutation(async ({ input: e }) => {
  const n = await r.emailTemplate.findFirst({ where: { type: e.templateType } }), a = (n == null ? void 0 : n.subject) || e.fallbackSubject || "Notification";
  let o = (n == null ? void 0 : n.body) || e.fallbackBody || "";
  e.context && o && (o = o.replace(/{{(.*?)}}/g, (c, l) => {
    var _a3;
    const i = l.trim(), m = (_a3 = e.context) == null ? void 0 : _a3[i];
    return m !== void 0 ? String(m) : "";
  }));
  const s = F.createTransport({ host: process.env.SMTP_HOST || "localhost", port: Number(process.env.SMTP_PORT || 1025), secure: false });
  try {
    await s.sendMail({ from: process.env.SMTP_FROM || "no-reply@verdeluxe.com", to: e.to, subject: a, text: o });
  } catch (c) {
    if (c.code === "ECONNREFUSED") console.warn("\u26A0\uFE0F SMTP connection refused. Logging email to console instead:"), console.log(`[Email Mock] To: ${e.to}`), console.log(`[Email Mock] Subject: ${a}`), console.log(`[Email Mock] Body:
${o}`);
    else throw c;
  }
  if (n) {
    const c = await r.user.findFirst({ where: { email: e.to }, select: { id: true } });
    c && await r.emailLog.create({ data: { recipientId: c.id, templateId: n.id, sentAt: /* @__PURE__ */ new Date(), status: "sent" } });
  }
  return { success: true };
}), Ga = [{ type: "booking_create", name: "Booking Created", subject: "Your booking #{{bookingId}} is confirmed", body: "Hi {{clientName}}, your booking #{{bookingId}} for {{scheduledDate}} at {{scheduledTime}} is confirmed." }, { type: "booking_cancel", name: "Booking Cancelled", subject: "Your booking #{{bookingId}} has been cancelled", body: "Hi {{clientName}}, your booking #{{bookingId}} for {{scheduledDate}} was cancelled. Contact support if this was unexpected." }], Xa = y.mutation(async () => {
  let e = 0;
  for (const n of Ga) await r.emailTemplate.findFirst({ where: { type: n.type } }) || (await r.emailTemplate.create({ data: n }), e++);
  return { created: e };
}), Za = y.input(z$1.object({ bookingId: z$1.number(), email: z$1.string().email().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c, _d;
  const n = await r.booking.findUnique({ where: { id: e.bookingId }, include: { client: { select: { email: true, firstName: true, lastName: true } } } });
  if (!n) throw new Error("Booking not found");
  const a = e.email || ((_a3 = n.client) == null ? void 0 : _a3.email);
  if (!a) throw new Error("No recipient email");
  const o = F.createTransport({ host: process.env.SMTP_HOST || "localhost", port: Number(process.env.SMTP_PORT || 1025), secure: false }), s = `Receipt for booking #${n.id}`, c = `Hi ${(_c = (_b = n.client) == null ? void 0 : _b.firstName) != null ? _c : ""},

Thanks for your booking #${n.id}.
Service: ${n.serviceType}
Date: ${n.scheduledDate.toLocaleDateString()}
Time: ${n.scheduledTime}
Amount: $${((_d = n.finalPrice) != null ? _d : 0).toFixed(2)}

If you have questions, please reply to this email.`;
  try {
    await o.sendMail({ from: process.env.SMTP_FROM || "no-reply@verdeluxe.com", to: a, subject: s, text: c });
  } catch (l) {
    if (l.code === "ECONNREFUSED") console.warn("\u26A0\uFE0F SMTP connection refused. Logging email to console instead:"), console.log(`[Email Mock] To: ${a}`), console.log(`[Email Mock] Subject: ${s}`), console.log(`[Email Mock] Body:
${c}`);
    else throw l;
  }
  return { success: true };
}), Ja = y.input(z$1.object({ bookingId: z$1.number(), email: z$1.string().email().optional() })).mutation(async ({ input: e }) => {
  var _a3, _b, _c, _d;
  const n = await r.booking.findUnique({ where: { id: e.bookingId }, include: { client: { select: { email: true, firstName: true, lastName: true } } } });
  if (!n) throw new Error("Booking not found");
  const a = e.email || ((_a3 = n.client) == null ? void 0 : _a3.email);
  if (!a) throw new Error("No recipient email");
  const o = F.createTransport({ host: process.env.SMTP_HOST || "localhost", port: Number(process.env.SMTP_PORT || 1025), secure: false }), s = `Invoice for booking #${n.id}`, c = `Hi ${(_c = (_b = n.client) == null ? void 0 : _b.firstName) != null ? _c : ""},

Please find the invoice for your upcoming booking #${n.id}.
Service: ${n.serviceType}
Date: ${n.scheduledDate.toLocaleDateString()}
Time: ${n.scheduledTime}
Balance Due: $${((_d = n.finalPrice) != null ? _d : 0).toFixed(2)}

You can pay via the client portal. If you have questions, please reply to this email.`;
  return await o.sendMail({ from: process.env.SMTP_FROM || "no-reply@verdeluxe.com", to: a, subject: s, text: c }), { success: true };
}), er = y.input(z$1.object({ scheduledDate: z$1.string(), scheduledTime: z$1.string(), cleanerIds: z$1.array(z$1.number()).min(1), ignoreBookingId: z$1.number().optional() })).query(async ({ input: e }) => {
  const n = new Date(e.scheduledDate), a = await r.booking.findMany({ where: { ...e.ignoreBookingId ? { id: { not: e.ignoreBookingId } } : {}, scheduledDate: n, scheduledTime: e.scheduledTime, OR: [{ cleanerId: { in: e.cleanerIds } }, { cleaners: { some: { cleanerId: { in: e.cleanerIds } } } }] }, select: { id: true } }), o = await r.timeOffRequest.findMany({ where: { cleanerId: { in: e.cleanerIds }, status: "APPROVED", startDate: { lte: n }, endDate: { gte: n } }, select: { id: true } });
  return { bookingConflicts: a, timeOffConflicts: o };
}), tr = y.input(z$1.object({ clientId: z$1.number() })).query(async ({ input: e }) => ({ booking: await r.booking.findFirst({ where: { clientId: e.clientId }, orderBy: { scheduledDate: "desc" }, select: { id: true, address: true, addressLine1: true, addressLine2: true, city: true, state: true, postalCode: true, placeId: true, latitude: true, longitude: true, paymentMethod: true } }) })), nr = y.query(async () => {
  const e = await r.booking.findMany({ where: { cleanerId: null, status: { not: "CANCELLED" } }, include: { client: true }, take: 5 }), n = await r.lead.findMany({ where: { status: "new" }, orderBy: { createdAt: "desc" }, take: 5 }), a = await r.booking.findMany({ where: { status: "COMPLETED" }, include: { payments: true, client: true } }), o = [];
  return e.forEach((s) => {
    o.push({ id: `unassigned-${s.id}`, title: "Unassigned Job", description: `${s.serviceType} at ${s.address.split(",")[0]} needs a cleaner.`, time: "Asap", color: "bg-red-100 text-red-700" });
  }), n.forEach((s) => {
    o.push({ id: `lead-${s.id}`, title: "New Lead", description: `${s.name} sent an inquiry via ${s.source}.`, time: "New", color: "bg-blue-100 text-blue-700" });
  }), a.forEach((s) => {
    const c = s.payments.reduce((l, i) => i.paidAt ? l + i.amount : l, 0);
    (s.finalPrice || 0) > c && o.push({ id: `charge-${s.id}`, title: "Pending Charge", description: `Completed job for ${s.client.firstName} is ready to be charged.`, time: "Action Required", color: "bg-green-100 text-green-700" });
  }), o;
}), ar = g.input(z$1.object({ firstName: z$1.string().min(1), lastName: z$1.string().min(1) })).mutation(async ({ input: e, ctx: n }) => {
  var _a3;
  const a = (_a3 = n.profile) == null ? void 0 : _a3.id;
  if (!a) throw new Error("Not authenticated");
  const o = await r.user.update({ where: { id: a }, data: { firstName: e.firstName, lastName: e.lastName } });
  return { firstName: o.firstName, lastName: o.lastName, email: o.email };
}), rr = g.query(async () => await r.timeEntry.findMany({ where: { endTime: null }, include: { user: { select: { id: true, firstName: true, lastName: true } }, booking: { select: { id: true, serviceType: true, address: true } } } })), or = y.input(z$1.object({ bookingId: z$1.number(), cleanerIds: z$1.array(z$1.number()), status: z$1.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional() })).mutation(async ({ input: e }) => {
  const { bookingId: n, cleanerIds: a, status: o } = e;
  if (!await r.booking.findUnique({ where: { id: n } })) throw new Error("Booking not found");
  if ((await r.user.findMany({ where: { id: { in: a }, role: "CLEANER" }, select: { id: true } })).length !== a.length) throw new Error("One or more invalid cleaner IDs provided");
  const l = a[0] || null;
  return await r.booking.update({ where: { id: n }, data: { cleanerId: l, status: o || "CONFIRMED" } }), await r.bookingCleaner.deleteMany({ where: { bookingId: n } }), a.length > 0 && await r.bookingCleaner.createMany({ data: a.map((i) => ({ bookingId: n, cleanerId: i })), skipDuplicates: true }), { success: true };
}), ir = (e) => {
  if (!e) return e;
  const n = e.replace(/\D/g, "");
  return n.length === 10 ? `+1${n}` : n.length === 11 && n.startsWith("1") ? `+${n}` : e.startsWith("+") ? e : `+${n}`;
}, sr = g.input(z$1.object({ email: z$1.string().email("Valid email is required"), password: z$1.string().min(8, "Password must be at least 8 characters"), role: z$1.enum(["CLIENT", "CLEANER"]).default("CLIENT"), firstName: z$1.string().optional(), lastName: z$1.string().optional(), phone: z$1.string().optional() })).mutation(async ({ input: e }) => {
  var _a3;
  const n = e.phone ? ir(e.phone) : void 0;
  if (await r.user.findFirst({ where: { email: { equals: e.email, mode: "insensitive" } } })) throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
  const { data: o, error: s } = await D.auth.admin.createUser({ email: e.email, password: e.password, email_confirm: true, user_metadata: { role: e.role, firstName: e.firstName, lastName: e.lastName, phone: n } }), c = (s == null ? void 0 : s.message) || "", l = (s == null ? void 0 : s.code) || "", i = s == null ? void 0 : s.status, m = c.toLowerCase().includes("already registered") || c.toLowerCase().includes("already_registered") || l === "email_exists" || i === 422;
  if (s && !m) throw console.error("[register] Supabase createUser error (msg):", c), console.error("[register] Supabase createUser error (code):", l, "status:", i), new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to create auth account: ${s.message}` });
  if (m) {
    console.log("[register] Email already in Supabase Auth but not in DB. Resetting password and creating profile...");
    const { data: h } = await D.auth.admin.listUsers(), I = (_a3 = h == null ? void 0 : h.users) == null ? void 0 : _a3.find((f) => {
      var _a4;
      return ((_a4 = f.email) == null ? void 0 : _a4.toLowerCase()) === e.email.toLowerCase();
    });
    I && await D.auth.admin.updateUserById(I.id, { password: e.password });
  }
  const p = await r.user.create({ data: { email: e.email, password: "", role: e.role, firstName: e.firstName, lastName: e.lastName, phone: n } }), { data: d, error: u } = await D.auth.signInWithPassword({ email: e.email, password: e.password });
  if (u || !d.session) throw console.error("[register] Sign-in after registration failed:", u == null ? void 0 : u.message), new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account created, but failed to sign in automatically. Please log in manually." });
  return { token: d.session.access_token, user: { id: p.id, email: p.email, role: p.role, firstName: p.firstName, lastName: p.lastName } };
}), Z = P({ booking: ze, register: sr, login: Ke, getCurrentUser: We, forgotPassword: Ve, getSchedule: Qe, getPayments: Ge, submitTimeOffRequest: At, getTimeOffRequests: Ot, deleteTimeOffRequest: Ct, updateTimeOffRequest: Mt, getUpcomingBookings: Xe, getAllBookings: Ze, getAllBookingsAdmin: Je, getAllUsersAdmin: et, getCustomerDetailsAdmin: tt, getCustomerPaymentMethods: nt, getSession: at, createBookingAdmin: rt, updateBookingAdmin: ot, deleteBookingAdmin: it, getBookingStatsAdmin: st, getRevenueReport: ct, getQuizSubmissions: dt, createUserAdmin: lt, updateUserAdmin: ut, deleteUserAdmin: mt, getAllTimeOffRequests: qt, updateTimeOffRequestStatus: Ut, clearTimeOffRequestAdmin: St, generateRecurrences: Va, sendTransactionalEmail: Qa, seedDefaultEmailTemplates: Xa, sendBookingReceipt: Za, sendBookingInvoice: Ja, getAvailabilityConflicts: er, getLatestBookingForClient: tr, getAdminTasks: nr, updateProfile: ar, getActiveTimeEntries: rr, assignCleaners: or, createChecklistTemplate: pt, getChecklistTemplates: gt, updateChecklistTemplate: ft, deleteChecklistTemplate: yt, getBookingChecklist: ht, updateBookingChecklistItem: wt, getPricingRules: bt, createPricingRule: It, updatePricingRule: Et, deletePricingRule: Nt, calculateBookingPrice: vt, getBookingAvailability: Tt, getCleanerAvailabilityDetails: Pt, generateToken: Dt, makeCall: kt, getCallHistory: Rt, time: $t, messaging: Xt, system: Jt, availability: an, photos: ln, bulk: gn, email: bn, payments: Bn, sms: Fn, documents: $n, stripe: Qn, accounting: oa, crm: ga, ai: ya, marketing: ba, social: Ta, seo: Oa, training: Ba, faq: xa, reviews: Ka, tasks: Wa });
ye(Z);
const Tr = defineEventHandler$1((e) => {
  const n = toWebRequest(e);
  return n ? fetchRequestHandler({ endpoint: "/trpc", req: n, router: Z, async createContext() {
    var _a3, _b, _c, _d, _e2;
    const a = n.headers.get("authorization"), o = (a == null ? void 0 : a.toLowerCase().startsWith("bearer ")) ? a.slice(7) : null;
    console.log(`[tRPC] Request to endpoint from handler. Token present: ${!!o}`), o || console.log(`[tRPC] No token found in authorization header: "${a}"`);
    let s = null, c = null;
    if (o) {
      let l = null, i = null;
      try {
        const { data: u } = await D.auth.getUser(o);
        l = (_b = (_a3 = u == null ? void 0 : u.user) == null ? void 0 : _a3.email) != null ? _b : null, i = (_d = (_c = u == null ? void 0 : u.user) == null ? void 0 : _c.id) != null ? _d : null;
      } catch (u) {
        console.error("Supabase auth.getUser failed, attempting decode fallback", u);
      }
      const m = l || i ? null : (() => {
        var _a4;
        try {
          return JSON.parse(Buffer.from((_a4 = o.split(".")[1]) != null ? _a4 : "", "base64").toString("utf8"));
        } catch {
          return null;
        }
      })(), p = (_e2 = l != null ? l : m == null ? void 0 : m.email) != null ? _e2 : null, d = i != null ? i : "";
      if (p) {
        console.log(`[tRPC] Looking up dbUser for email: "${p}" (case-insensitive)`), s = { id: d, email: p };
        const u = await r.user.findFirst({ where: { email: { equals: p, mode: "insensitive" } }, select: { id: true, email: true, role: true, firstName: true, lastName: true, adminPermissions: true } });
        u ? (console.log(`[tRPC] dbUser found. ID: ${u.id}, Role: ${u.role}`), c = u) : console.log(`[tRPC] No dbUser found for email: "${p}"`);
      } else console.log("[tRPC] No email found in token/decoded.");
    } else console.log("[tRPC] No token present in request.");
    return { authUser: s, profile: c, token: o };
  }, onError({ error: a, path: o }) {
    console.error(`tRPC error on '${o}':`, a);
  } }) : new Response("No request", { status: 400 });
});

const html = "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Verde Luxe Cleaning</title>\n    <link rel=\"icon\" href=\"/verde-leaf-logo.png\" type=\"image/png\" />\n    <meta\n      name=\"description\"\n      content=\"Verde Luxe Cleaning connects you with vetted professionals for spotless home and commercial cleaning in Southeast Michigan. Easy booking, trusted results.\"\n    />\n    \n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n    <link\n      href=\"https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@100..900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap\"\n      rel=\"stylesheet\"\n    />\n    <link\n      href=\"https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap\"\n      rel=\"stylesheet\"\n    />\n    <link\n      href=\"https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css\"\n      rel=\"stylesheet\"\n    />\n    <script type=\"module\" crossorigin src=\"/assets/index-D68JyPnQ.js\"></script>\n    <link rel=\"stylesheet\" crossorigin href=\"/assets/index-D6DOJUo1.css\">\n    <script src=\"/manifest.js\"></script>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n  </body>\n</html>\n";
							const _NExIIH = eventHandler$1(event => {
								return html
							});

const handlers = [
  { route: '/api/debug/client-logs', handler: n, lazy: false, middleware: true, method: undefined },
  { route: '/trpc', handler: Tr, lazy: false, middleware: true, method: undefined },
  { route: '/', handler: _NExIIH, lazy: false, middleware: true, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => b(nodeHandler, aRequest);
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return O(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  {
    const _handler = h3App.handler;
    h3App.handler = (event) => {
      const ctx = { event };
      return nitroAsyncContext.callAsync(ctx, () => _handler(event));
    };
  }
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

const nitroApp = useNitroApp();
const handler = toNodeListener(nitroApp.h3App);
const listener = function(req, res) {
  const query = req.headers["x-now-route-matches"];
  if (query) {
    const { url } = parseQuery(query);
    if (url) {
      req.url = url;
    }
  }
  return handler(req, res);
};

export { listener as default };
//# sourceMappingURL=index.mjs.map
