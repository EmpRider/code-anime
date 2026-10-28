// \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), s = (e, n) => {
	let r = {};
	for (var i in e) t(r, i, {
		get: e[i],
		enumerable: !0
	});
	return n || t(r, Symbol.toStringTag, { value: "Module" }), r;
}, c = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, l = (n, r, o) => (o = n == null ? {} : e(i(n)), c(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), u = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, { get: (e, t) => (typeof require < "u" ? require : e)[t] }) : e)(function(e) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
});
// node_modules/tslib/tslib.es6.mjs
function d(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}
function f(e, t, n, r) {
	var i = arguments.length, a = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, o;
	if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, n, r);
	else for (var s = e.length - 1; s >= 0; s--) (o = e[s]) && (a = (i < 3 ? o(a) : i > 3 ? o(t, n, a) : o(t, n)) || a);
	return i > 3 && a && Object.defineProperty(t, n, a), a;
}
function p(e, t, n, r) {
	function i(e) {
		return e instanceof n ? e : new n(function(t) {
			t(e);
		});
	}
	return new (n ||= Promise)(function(n, a) {
		function o(e) {
			try {
				c(r.next(e));
			} catch (e) {
				a(e);
			}
		}
		function s(e) {
			try {
				c(r.throw(e));
			} catch (e) {
				a(e);
			}
		}
		function c(e) {
			e.done ? n(e.value) : i(e.value).then(o, s);
		}
		c((r = r.apply(e, t || [])).next());
	});
}
// node_modules/@antv/x6/es/common/polyfill/index.js
function m(e) {
	e.forEach((e) => {
		Object.hasOwn(e, "append") || Object.defineProperty(e, "append", {
			configurable: !0,
			enumerable: !0,
			writable: !0,
			value(...e) {
				let t = document.createDocumentFragment();
				e.forEach((e) => {
					let n = e instanceof Node;
					t.appendChild(n ? e : document.createTextNode(String(e)));
				}), this.appendChild(t);
			}
		});
	});
}
typeof window == "object" && window.NodeList && !NodeList.prototype.forEach && (NodeList.prototype.forEach = Array.prototype.forEach), typeof window < "u" && ((e) => {
	m(e);
})([
	Element.prototype,
	Document.prototype,
	DocumentFragment.prototype
]);
// node_modules/lodash-es/_freeGlobal.js
var h = typeof global == "object" && global && global.Object === Object && global, g = typeof self == "object" && self && self.Object === Object && self, _ = h || g || Function("return this")(), v = _.Symbol, y = Object.prototype, b = y.hasOwnProperty, x = y.toString, S = v ? v.toStringTag : void 0;
function C(e) {
	var t = b.call(e, S), n = e[S];
	try {
		e[S] = void 0;
		var r = !0;
	} catch {}
	var i = x.call(e);
	return r && (t ? e[S] = n : delete e[S]), i;
}
// node_modules/lodash-es/_objectToString.js
var w = Object.prototype.toString;
function T(e) {
	return w.call(e);
}
// node_modules/lodash-es/_baseGetTag.js
var E = "[object Null]", D = "[object Undefined]", O = v ? v.toStringTag : void 0;
function k(e) {
	return e == null ? e === void 0 ? D : E : O && O in Object(e) ? C(e) : T(e);
}
// node_modules/lodash-es/isObjectLike.js
function A(e) {
	return typeof e == "object" && !!e;
}
// node_modules/lodash-es/isSymbol.js
var ee = "[object Symbol]";
function te(e) {
	return typeof e == "symbol" || A(e) && k(e) == ee;
}
// node_modules/lodash-es/_arrayMap.js
function ne(e, t) {
	for (var n = -1, r = e == null ? 0 : e.length, i = Array(r); ++n < r;) i[n] = t(e[n], n, e);
	return i;
}
// node_modules/lodash-es/isArray.js
var j = Array.isArray, re = 1 / 0, ie = v ? v.prototype : void 0, ae = ie ? ie.toString : void 0;
function oe(e) {
	if (typeof e == "string") return e;
	if (j(e)) return ne(e, oe) + "";
	if (te(e)) return ae ? ae.call(e) : "";
	var t = e + "";
	return t == "0" && 1 / e == -re ? "-0" : t;
}
// node_modules/lodash-es/_trimmedEndIndex.js
var se = /\s/;
function M(e) {
	for (var t = e.length; t-- && se.test(e.charAt(t)););
	return t;
}
// node_modules/lodash-es/_baseTrim.js
var ce = /^\s+/;
function le(e) {
	return e && e.slice(0, M(e) + 1).replace(ce, "");
}
// node_modules/lodash-es/isObject.js
function N(e) {
	var t = typeof e;
	return e != null && (t == "object" || t == "function");
}
// node_modules/lodash-es/toNumber.js
var P = NaN, ue = /^[-+]0x[0-9a-f]+$/i, de = /^0b[01]+$/i, fe = /^0o[0-7]+$/i, pe = parseInt;
function me(e) {
	if (typeof e == "number") return e;
	if (te(e)) return P;
	if (N(e)) {
		var t = typeof e.valueOf == "function" ? e.valueOf() : e;
		e = N(t) ? t + "" : t;
	}
	if (typeof e != "string") return e === 0 ? e : +e;
	e = le(e);
	var n = de.test(e);
	return n || fe.test(e) ? pe(e.slice(2), n ? 2 : 8) : ue.test(e) ? P : +e;
}
// node_modules/lodash-es/identity.js
function he(e) {
	return e;
}
// node_modules/lodash-es/isFunction.js
var F = "[object AsyncFunction]", ge = "[object Function]", I = "[object GeneratorFunction]", _e = "[object Proxy]";
function ve(e) {
	if (!N(e)) return !1;
	var t = k(e);
	return t == ge || t == I || t == F || t == _e;
}
// node_modules/lodash-es/_coreJsData.js
var ye = _["__core-js_shared__"], be = function() {
	var e = /[^.]+$/.exec(ye && ye.keys && ye.keys.IE_PROTO || "");
	return e ? "Symbol(src)_1." + e : "";
}();
function xe(e) {
	return !!be && be in e;
}
// node_modules/lodash-es/_toSource.js
var Se = Function.prototype.toString;
function Ce(e) {
	if (e != null) {
		try {
			return Se.call(e);
		} catch {}
		try {
			return e + "";
		} catch {}
	}
	return "";
}
// node_modules/lodash-es/_baseIsNative.js
var we = /[\\^$.*+?()[\]{}|]/g, Te = /^\[object .+?Constructor\]$/, Ee = Function.prototype, De = Object.prototype, L = Ee.toString, Oe = De.hasOwnProperty, ke = RegExp("^" + L.call(Oe).replace(we, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
function Ae(e) {
	return !N(e) || xe(e) ? !1 : (ve(e) ? ke : Te).test(Ce(e));
}
// node_modules/lodash-es/_getValue.js
function je(e, t) {
	return e?.[t];
}
// node_modules/lodash-es/_getNative.js
function Me(e, t) {
	var n = je(e, t);
	return Ae(n) ? n : void 0;
}
// node_modules/lodash-es/_WeakMap.js
var Ne = Me(_, "WeakMap"), Pe = Object.create, Fe = function() {
	function e() {}
	return function(t) {
		if (!N(t)) return {};
		if (Pe) return Pe(t);
		e.prototype = t;
		var n = new e();
		return e.prototype = void 0, n;
	};
}();
// node_modules/lodash-es/_apply.js
function Ie(e, t, n) {
	switch (n.length) {
		case 0: return e.call(t);
		case 1: return e.call(t, n[0]);
		case 2: return e.call(t, n[0], n[1]);
		case 3: return e.call(t, n[0], n[1], n[2]);
	}
	return e.apply(t, n);
}
// node_modules/lodash-es/noop.js
function Le() {}
// node_modules/lodash-es/_copyArray.js
function Re(e, t) {
	var n = -1, r = e.length;
	for (t ||= Array(r); ++n < r;) t[n] = e[n];
	return t;
}
// node_modules/lodash-es/_shortOut.js
var ze = 800, Be = 16, Ve = Date.now;
function He(e) {
	var t = 0, n = 0;
	return function() {
		var r = Ve(), i = Be - (r - n);
		if (n = r, i > 0) {
			if (++t >= ze) return arguments[0];
		} else t = 0;
		return e.apply(void 0, arguments);
	};
}
// node_modules/lodash-es/constant.js
function Ue(e) {
	return function() {
		return e;
	};
}
// node_modules/lodash-es/_defineProperty.js
var We = function() {
	try {
		var e = Me(Object, "defineProperty");
		return e({}, "", {}), e;
	} catch {}
}(), Ge = He(We ? function(e, t) {
	return We(e, "toString", {
		configurable: !0,
		enumerable: !1,
		value: Ue(t),
		writable: !0
	});
} : he);
// node_modules/lodash-es/_arrayEach.js
function Ke(e, t) {
	for (var n = -1, r = e == null ? 0 : e.length; ++n < r && t(e[n], n, e) !== !1;);
	return e;
}
// node_modules/lodash-es/_baseFindIndex.js
function qe(e, t, n, r) {
	for (var i = e.length, a = n + (r ? 1 : -1); r ? a-- : ++a < i;) if (t(e[a], a, e)) return a;
	return -1;
}
// node_modules/lodash-es/_baseIsNaN.js
function Je(e) {
	return e !== e;
}
// node_modules/lodash-es/_strictIndexOf.js
function Ye(e, t, n) {
	for (var r = n - 1, i = e.length; ++r < i;) if (e[r] === t) return r;
	return -1;
}
// node_modules/lodash-es/_baseIndexOf.js
function Xe(e, t, n) {
	return t === t ? Ye(e, t, n) : qe(e, Je, n);
}
// node_modules/lodash-es/_arrayIncludes.js
function Ze(e, t) {
	return !!(e != null && e.length) && Xe(e, t, 0) > -1;
}
// node_modules/lodash-es/_isIndex.js
var Qe = 9007199254740991, $e = /^(?:0|[1-9]\d*)$/;
function et(e, t) {
	var n = typeof e;
	return t ??= Qe, !!t && (n == "number" || n != "symbol" && $e.test(e)) && e > -1 && e % 1 == 0 && e < t;
}
// node_modules/lodash-es/_baseAssignValue.js
function tt(e, t, n) {
	t == "__proto__" && We ? We(e, t, {
		configurable: !0,
		enumerable: !0,
		value: n,
		writable: !0
	}) : e[t] = n;
}
// node_modules/lodash-es/eq.js
function nt(e, t) {
	return e === t || e !== e && t !== t;
}
// node_modules/lodash-es/_assignValue.js
var rt = Object.prototype.hasOwnProperty;
function it(e, t, n) {
	var r = e[t];
	(!(rt.call(e, t) && nt(r, n)) || n === void 0 && !(t in e)) && tt(e, t, n);
}
// node_modules/lodash-es/_copyObject.js
function at(e, t, n, r) {
	var i = !n;
	n ||= {};
	for (var a = -1, o = t.length; ++a < o;) {
		var s = t[a], c = r ? r(n[s], e[s], s, n, e) : void 0;
		c === void 0 && (c = e[s]), i ? tt(n, s, c) : it(n, s, c);
	}
	return n;
}
// node_modules/lodash-es/_overRest.js
var ot = Math.max;
function st(e, t, n) {
	return t = ot(t === void 0 ? e.length - 1 : t, 0), function() {
		for (var r = arguments, i = -1, a = ot(r.length - t, 0), o = Array(a); ++i < a;) o[i] = r[t + i];
		i = -1;
		for (var s = Array(t + 1); ++i < t;) s[i] = r[i];
		return s[t] = n(o), Ie(e, this, s);
	};
}
// node_modules/lodash-es/_baseRest.js
function ct(e, t) {
	return Ge(st(e, t, he), e + "");
}
// node_modules/lodash-es/isLength.js
var lt = 9007199254740991;
function ut(e) {
	return typeof e == "number" && e > -1 && e % 1 == 0 && e <= lt;
}
// node_modules/lodash-es/isArrayLike.js
function dt(e) {
	return e != null && ut(e.length) && !ve(e);
}
// node_modules/lodash-es/_isIterateeCall.js
function ft(e, t, n) {
	if (!N(n)) return !1;
	var r = typeof t;
	return (r == "number" ? dt(n) && et(t, n.length) : r == "string" && t in n) ? nt(n[t], e) : !1;
}
// node_modules/lodash-es/_createAssigner.js
function pt(e) {
	return ct(function(t, n) {
		var r = -1, i = n.length, a = i > 1 ? n[i - 1] : void 0, o = i > 2 ? n[2] : void 0;
		for (a = e.length > 3 && typeof a == "function" ? (i--, a) : void 0, o && ft(n[0], n[1], o) && (a = i < 3 ? void 0 : a, i = 1), t = Object(t); ++r < i;) {
			var s = n[r];
			s && e(t, s, r, a);
		}
		return t;
	});
}
// node_modules/lodash-es/_isPrototype.js
var mt = Object.prototype;
function ht(e) {
	var t = e && e.constructor;
	return e === (typeof t == "function" && t.prototype || mt);
}
// node_modules/lodash-es/_baseTimes.js
function gt(e, t) {
	for (var n = -1, r = Array(e); ++n < e;) r[n] = t(n);
	return r;
}
// node_modules/lodash-es/_baseIsArguments.js
var _t = "[object Arguments]";
function vt(e) {
	return A(e) && k(e) == _t;
}
// node_modules/lodash-es/isArguments.js
var yt = Object.prototype, bt = yt.hasOwnProperty, xt = yt.propertyIsEnumerable, St = vt(function() {
	return arguments;
}()) ? vt : function(e) {
	return A(e) && bt.call(e, "callee") && !xt.call(e, "callee");
};
// node_modules/lodash-es/stubFalse.js
function Ct() {
	return !1;
}
// node_modules/lodash-es/isBuffer.js
var wt = typeof exports == "object" && exports && !exports.nodeType && exports, Tt = wt && typeof module == "object" && module && !module.nodeType && module, Et = Tt && Tt.exports === wt ? _.Buffer : void 0, Dt = (Et ? Et.isBuffer : void 0) || Ct, Ot = "[object Arguments]", kt = "[object Array]", At = "[object Boolean]", jt = "[object Date]", Mt = "[object Error]", Nt = "[object Function]", Pt = "[object Map]", Ft = "[object Number]", It = "[object Object]", Lt = "[object RegExp]", Rt = "[object Set]", zt = "[object String]", Bt = "[object WeakMap]", Vt = "[object ArrayBuffer]", Ht = "[object DataView]", Ut = "[object Float32Array]", Wt = "[object Float64Array]", Gt = "[object Int8Array]", Kt = "[object Int16Array]", qt = "[object Int32Array]", Jt = "[object Uint8Array]", Yt = "[object Uint8ClampedArray]", Xt = "[object Uint16Array]", Zt = "[object Uint32Array]", Qt = {};
Qt[Ut] = Qt[Wt] = Qt[Gt] = Qt[Kt] = Qt[qt] = Qt[Jt] = Qt[Yt] = Qt[Xt] = Qt[Zt] = !0, Qt[Ot] = Qt[kt] = Qt[Vt] = Qt[At] = Qt[Ht] = Qt[jt] = Qt[Mt] = Qt[Nt] = Qt[Pt] = Qt[Ft] = Qt[It] = Qt[Lt] = Qt[Rt] = Qt[zt] = Qt[Bt] = !1;
function $t(e) {
	return A(e) && ut(e.length) && !!Qt[k(e)];
}
// node_modules/lodash-es/_baseUnary.js
function en(e) {
	return function(t) {
		return e(t);
	};
}
// node_modules/lodash-es/_nodeUtil.js
var tn = typeof exports == "object" && exports && !exports.nodeType && exports, nn = tn && typeof module == "object" && module && !module.nodeType && module, rn = nn && nn.exports === tn && h.process, an = function() {
	try {
		return nn && nn.require && nn.require("util").types || rn && rn.binding && rn.binding("util");
	} catch {}
}(), on = an && an.isTypedArray, sn = on ? en(on) : $t, cn = Object.prototype.hasOwnProperty;
function ln(e, t) {
	var n = j(e), r = !n && St(e), i = !n && !r && Dt(e), a = !n && !r && !i && sn(e), o = n || r || i || a, s = o ? gt(e.length, String) : [], c = s.length;
	for (var l in e) (t || cn.call(e, l)) && !(o && (l == "length" || i && (l == "offset" || l == "parent") || a && (l == "buffer" || l == "byteLength" || l == "byteOffset") || et(l, c))) && s.push(l);
	return s;
}
// node_modules/lodash-es/_overArg.js
function un(e, t) {
	return function(n) {
		return e(t(n));
	};
}
// node_modules/lodash-es/_nativeKeys.js
var dn = un(Object.keys, Object), fn = Object.prototype.hasOwnProperty;
function pn(e) {
	if (!ht(e)) return dn(e);
	var t = [];
	for (var n in Object(e)) fn.call(e, n) && n != "constructor" && t.push(n);
	return t;
}
// node_modules/lodash-es/keys.js
function mn(e) {
	return dt(e) ? ln(e) : pn(e);
}
// node_modules/lodash-es/_nativeKeysIn.js
function hn(e) {
	var t = [];
	if (e != null) for (var n in Object(e)) t.push(n);
	return t;
}
// node_modules/lodash-es/_baseKeysIn.js
var gn = Object.prototype.hasOwnProperty;
function _n(e) {
	if (!N(e)) return hn(e);
	var t = ht(e), n = [];
	for (var r in e) (r != "constructor" || !t && gn.call(e, r)) && n.push(r);
	return n;
}
// node_modules/lodash-es/keysIn.js
function vn(e) {
	return dt(e) ? ln(e, !0) : _n(e);
}
// node_modules/lodash-es/_isKey.js
var yn = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, bn = /^\w*$/;
function xn(e, t) {
	if (j(e)) return !1;
	var n = typeof e;
	return n == "number" || n == "symbol" || n == "boolean" || e == null || te(e) ? !0 : bn.test(e) || !yn.test(e) || t != null && e in Object(t);
}
// node_modules/lodash-es/_nativeCreate.js
var Sn = Me(Object, "create");
// node_modules/lodash-es/_hashClear.js
function Cn() {
	this.__data__ = Sn ? Sn(null) : {}, this.size = 0;
}
// node_modules/lodash-es/_hashDelete.js
function wn(e) {
	var t = this.has(e) && delete this.__data__[e];
	return this.size -= +!!t, t;
}
// node_modules/lodash-es/_hashGet.js
var Tn = "__lodash_hash_undefined__", En = Object.prototype.hasOwnProperty;
function Dn(e) {
	var t = this.__data__;
	if (Sn) {
		var n = t[e];
		return n === Tn ? void 0 : n;
	}
	return En.call(t, e) ? t[e] : void 0;
}
// node_modules/lodash-es/_hashHas.js
var On = Object.prototype.hasOwnProperty;
function kn(e) {
	var t = this.__data__;
	return Sn ? t[e] !== void 0 : On.call(t, e);
}
// node_modules/lodash-es/_hashSet.js
var An = "__lodash_hash_undefined__";
function jn(e, t) {
	var n = this.__data__;
	return this.size += +!this.has(e), n[e] = Sn && t === void 0 ? An : t, this;
}
// node_modules/lodash-es/_Hash.js
function Mn(e) {
	var t = -1, n = e == null ? 0 : e.length;
	for (this.clear(); ++t < n;) {
		var r = e[t];
		this.set(r[0], r[1]);
	}
}
Mn.prototype.clear = Cn, Mn.prototype.delete = wn, Mn.prototype.get = Dn, Mn.prototype.has = kn, Mn.prototype.set = jn;
// node_modules/lodash-es/_listCacheClear.js
function Nn() {
	this.__data__ = [], this.size = 0;
}
// node_modules/lodash-es/_assocIndexOf.js
function Pn(e, t) {
	for (var n = e.length; n--;) if (nt(e[n][0], t)) return n;
	return -1;
}
// node_modules/lodash-es/_listCacheDelete.js
var Fn = Array.prototype.splice;
function In(e) {
	var t = this.__data__, n = Pn(t, e);
	return n < 0 ? !1 : (n == t.length - 1 ? t.pop() : Fn.call(t, n, 1), --this.size, !0);
}
// node_modules/lodash-es/_listCacheGet.js
function Ln(e) {
	var t = this.__data__, n = Pn(t, e);
	return n < 0 ? void 0 : t[n][1];
}
// node_modules/lodash-es/_listCacheHas.js
function Rn(e) {
	return Pn(this.__data__, e) > -1;
}
// node_modules/lodash-es/_listCacheSet.js
function zn(e, t) {
	var n = this.__data__, r = Pn(n, e);
	return r < 0 ? (++this.size, n.push([e, t])) : n[r][1] = t, this;
}
// node_modules/lodash-es/_ListCache.js
function Bn(e) {
	var t = -1, n = e == null ? 0 : e.length;
	for (this.clear(); ++t < n;) {
		var r = e[t];
		this.set(r[0], r[1]);
	}
}
Bn.prototype.clear = Nn, Bn.prototype.delete = In, Bn.prototype.get = Ln, Bn.prototype.has = Rn, Bn.prototype.set = zn;
// node_modules/lodash-es/_Map.js
var Vn = Me(_, "Map");
// node_modules/lodash-es/_mapCacheClear.js
function Hn() {
	this.size = 0, this.__data__ = {
		hash: new Mn(),
		map: new (Vn || Bn)(),
		string: new Mn()
	};
}
// node_modules/lodash-es/_isKeyable.js
function Un(e) {
	var t = typeof e;
	return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
}
// node_modules/lodash-es/_getMapData.js
function Wn(e, t) {
	var n = e.__data__;
	return Un(t) ? n[typeof t == "string" ? "string" : "hash"] : n.map;
}
// node_modules/lodash-es/_mapCacheDelete.js
function Gn(e) {
	var t = Wn(this, e).delete(e);
	return this.size -= +!!t, t;
}
// node_modules/lodash-es/_mapCacheGet.js
function Kn(e) {
	return Wn(this, e).get(e);
}
// node_modules/lodash-es/_mapCacheHas.js
function qn(e) {
	return Wn(this, e).has(e);
}
// node_modules/lodash-es/_mapCacheSet.js
function Jn(e, t) {
	var n = Wn(this, e), r = n.size;
	return n.set(e, t), this.size += n.size == r ? 0 : 1, this;
}
// node_modules/lodash-es/_MapCache.js
function Yn(e) {
	var t = -1, n = e == null ? 0 : e.length;
	for (this.clear(); ++t < n;) {
		var r = e[t];
		this.set(r[0], r[1]);
	}
}
Yn.prototype.clear = Hn, Yn.prototype.delete = Gn, Yn.prototype.get = Kn, Yn.prototype.has = qn, Yn.prototype.set = Jn;
// node_modules/lodash-es/memoize.js
var Xn = "Expected a function";
function Zn(e, t) {
	if (typeof e != "function" || t != null && typeof t != "function") throw TypeError(Xn);
	var n = function() {
		var r = arguments, i = t ? t.apply(this, r) : r[0], a = n.cache;
		if (a.has(i)) return a.get(i);
		var o = e.apply(this, r);
		return n.cache = a.set(i, o) || a, o;
	};
	return n.cache = new (Zn.Cache || Yn)(), n;
}
Zn.Cache = Yn;
// node_modules/lodash-es/_memoizeCapped.js
var Qn = 500;
function $n(e) {
	var t = Zn(e, function(e) {
		return n.size === Qn && n.clear(), e;
	}), n = t.cache;
	return t;
}
// node_modules/lodash-es/_stringToPath.js
var er = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, tr = /\\(\\)?/g, nr = $n(function(e) {
	var t = [];
	return e.charCodeAt(0) === 46 && t.push(""), e.replace(er, function(e, n, r, i) {
		t.push(r ? i.replace(tr, "$1") : n || e);
	}), t;
});
// node_modules/lodash-es/toString.js
function rr(e) {
	return e == null ? "" : oe(e);
}
// node_modules/lodash-es/_castPath.js
function ir(e, t) {
	return j(e) ? e : xn(e, t) ? [e] : nr(rr(e));
}
// node_modules/lodash-es/_toKey.js
var ar = 1 / 0;
function or(e) {
	if (typeof e == "string" || te(e)) return e;
	var t = e + "";
	return t == "0" && 1 / e == -ar ? "-0" : t;
}
// node_modules/lodash-es/_baseGet.js
function sr(e, t) {
	t = ir(t, e);
	for (var n = 0, r = t.length; e != null && n < r;) e = e[or(t[n++])];
	return n && n == r ? e : void 0;
}
// node_modules/lodash-es/get.js
function cr(e, t, n) {
	var r = e == null ? void 0 : sr(e, t);
	return r === void 0 ? n : r;
}
// node_modules/lodash-es/_arrayPush.js
function lr(e, t) {
	for (var n = -1, r = t.length, i = e.length; ++n < r;) e[i + n] = t[n];
	return e;
}
// node_modules/lodash-es/_isFlattenable.js
var ur = v ? v.isConcatSpreadable : void 0;
function dr(e) {
	return j(e) || St(e) || !!(ur && e && e[ur]);
}
// node_modules/lodash-es/_baseFlatten.js
function fr(e, t, n, r, i) {
	var a = -1, o = e.length;
	for (n ||= dr, i ||= []; ++a < o;) {
		var s = e[a];
		t > 0 && n(s) ? t > 1 ? fr(s, t - 1, n, r, i) : lr(i, s) : r || (i[i.length] = s);
	}
	return i;
}
// node_modules/lodash-es/flatten.js
function pr(e) {
	return e != null && e.length ? fr(e, 1) : [];
}
// node_modules/lodash-es/_flatRest.js
function mr(e) {
	return Ge(st(e, void 0, pr), e + "");
}
// node_modules/lodash-es/_getPrototype.js
var hr = un(Object.getPrototypeOf, Object), gr = "[object Object]", _r = Function.prototype, vr = Object.prototype, yr = _r.toString, br = vr.hasOwnProperty, xr = yr.call(Object);
function Sr(e) {
	if (!A(e) || k(e) != gr) return !1;
	var t = hr(e);
	if (t === null) return !0;
	var n = br.call(t, "constructor") && t.constructor;
	return typeof n == "function" && n instanceof n && yr.call(n) == xr;
}
// node_modules/lodash-es/_baseSlice.js
function Cr(e, t, n) {
	var r = -1, i = e.length;
	t < 0 && (t = -t > i ? 0 : i + t), n = n > i ? i : n, n < 0 && (n += i), i = t > n ? 0 : n - t >>> 0, t >>>= 0;
	for (var a = Array(i); ++r < i;) a[r] = e[r + t];
	return a;
}
// node_modules/lodash-es/_castSlice.js
function wr(e, t, n) {
	var r = e.length;
	return n = n === void 0 ? r : n, !t && n >= r ? e : Cr(e, t, n);
}
// node_modules/lodash-es/_hasUnicode.js
var Tr = RegExp("[\\u200d\\ud800-\\udfff\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff\\ufe0e\\ufe0f]");
function Er(e) {
	return Tr.test(e);
}
// node_modules/lodash-es/_asciiToArray.js
function Dr(e) {
	return e.split("");
}
// node_modules/lodash-es/_unicodeToArray.js
var Or = "\\ud800-\\udfff", kr = "\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff", Ar = "\\ufe0e\\ufe0f", jr = "[" + Or + "]", Mr = "[" + kr + "]", Nr = "\\ud83c[\\udffb-\\udfff]", Pr = "(?:" + Mr + "|" + Nr + ")", Fr = "[^" + Or + "]", Ir = "(?:\\ud83c[\\udde6-\\uddff]){2}", Lr = "[\\ud800-\\udbff][\\udc00-\\udfff]", Rr = "\\u200d", zr = Pr + "?", Br = "[" + Ar + "]?", Vr = "(?:" + Rr + "(?:" + [
	Fr,
	Ir,
	Lr
].join("|") + ")" + Br + zr + ")*", Hr = Br + zr + Vr, Ur = "(?:" + [
	Fr + Mr + "?",
	Mr,
	Ir,
	Lr,
	jr
].join("|") + ")", Wr = RegExp(Nr + "(?=" + Nr + ")|" + Ur + Hr, "g");
function Gr(e) {
	return e.match(Wr) || [];
}
// node_modules/lodash-es/_stringToArray.js
function Kr(e) {
	return Er(e) ? Gr(e) : Dr(e);
}
// node_modules/lodash-es/_createCaseFirst.js
function qr(e) {
	return function(t) {
		t = rr(t);
		var n = Er(t) ? Kr(t) : void 0, r = n ? n[0] : t.charAt(0), i = n ? wr(n, 1).join("") : t.slice(1);
		return r[e]() + i;
	};
}
// node_modules/lodash-es/upperFirst.js
var Jr = qr("toUpperCase");
// node_modules/lodash-es/capitalize.js
function Yr(e) {
	return Jr(rr(e).toLowerCase());
}
// node_modules/lodash-es/_arrayReduce.js
function Xr(e, t, n, r) {
	var i = -1, a = e == null ? 0 : e.length;
	for (r && a && (n = e[++i]); ++i < a;) n = t(n, e[i], i, e);
	return n;
}
// node_modules/lodash-es/_basePropertyOf.js
function Zr(e) {
	return function(t) {
		return e?.[t];
	};
}
// node_modules/lodash-es/_deburrLetter.js
var Qr = Zr({
	À: "A",
	Á: "A",
	Â: "A",
	Ã: "A",
	Ä: "A",
	Å: "A",
	à: "a",
	á: "a",
	â: "a",
	ã: "a",
	ä: "a",
	å: "a",
	Ç: "C",
	ç: "c",
	Ð: "D",
	ð: "d",
	È: "E",
	É: "E",
	Ê: "E",
	Ë: "E",
	è: "e",
	é: "e",
	ê: "e",
	ë: "e",
	Ì: "I",
	Í: "I",
	Î: "I",
	Ï: "I",
	ì: "i",
	í: "i",
	î: "i",
	ï: "i",
	Ñ: "N",
	ñ: "n",
	Ò: "O",
	Ó: "O",
	Ô: "O",
	Õ: "O",
	Ö: "O",
	Ø: "O",
	ò: "o",
	ó: "o",
	ô: "o",
	õ: "o",
	ö: "o",
	ø: "o",
	Ù: "U",
	Ú: "U",
	Û: "U",
	Ü: "U",
	ù: "u",
	ú: "u",
	û: "u",
	ü: "u",
	Ý: "Y",
	ý: "y",
	ÿ: "y",
	Æ: "Ae",
	æ: "ae",
	Þ: "Th",
	þ: "th",
	ß: "ss",
	Ā: "A",
	Ă: "A",
	Ą: "A",
	ā: "a",
	ă: "a",
	ą: "a",
	Ć: "C",
	Ĉ: "C",
	Ċ: "C",
	Č: "C",
	ć: "c",
	ĉ: "c",
	ċ: "c",
	č: "c",
	Ď: "D",
	Đ: "D",
	ď: "d",
	đ: "d",
	Ē: "E",
	Ĕ: "E",
	Ė: "E",
	Ę: "E",
	Ě: "E",
	ē: "e",
	ĕ: "e",
	ė: "e",
	ę: "e",
	ě: "e",
	Ĝ: "G",
	Ğ: "G",
	Ġ: "G",
	Ģ: "G",
	ĝ: "g",
	ğ: "g",
	ġ: "g",
	ģ: "g",
	Ĥ: "H",
	Ħ: "H",
	ĥ: "h",
	ħ: "h",
	Ĩ: "I",
	Ī: "I",
	Ĭ: "I",
	Į: "I",
	İ: "I",
	ĩ: "i",
	ī: "i",
	ĭ: "i",
	į: "i",
	ı: "i",
	Ĵ: "J",
	ĵ: "j",
	Ķ: "K",
	ķ: "k",
	ĸ: "k",
	Ĺ: "L",
	Ļ: "L",
	Ľ: "L",
	Ŀ: "L",
	Ł: "L",
	ĺ: "l",
	ļ: "l",
	ľ: "l",
	ŀ: "l",
	ł: "l",
	Ń: "N",
	Ņ: "N",
	Ň: "N",
	Ŋ: "N",
	ń: "n",
	ņ: "n",
	ň: "n",
	ŋ: "n",
	Ō: "O",
	Ŏ: "O",
	Ő: "O",
	ō: "o",
	ŏ: "o",
	ő: "o",
	Ŕ: "R",
	Ŗ: "R",
	Ř: "R",
	ŕ: "r",
	ŗ: "r",
	ř: "r",
	Ś: "S",
	Ŝ: "S",
	Ş: "S",
	Š: "S",
	ś: "s",
	ŝ: "s",
	ş: "s",
	š: "s",
	Ţ: "T",
	Ť: "T",
	Ŧ: "T",
	ţ: "t",
	ť: "t",
	ŧ: "t",
	Ũ: "U",
	Ū: "U",
	Ŭ: "U",
	Ů: "U",
	Ű: "U",
	Ų: "U",
	ũ: "u",
	ū: "u",
	ŭ: "u",
	ů: "u",
	ű: "u",
	ų: "u",
	Ŵ: "W",
	ŵ: "w",
	Ŷ: "Y",
	ŷ: "y",
	Ÿ: "Y",
	Ź: "Z",
	Ż: "Z",
	Ž: "Z",
	ź: "z",
	ż: "z",
	ž: "z",
	Ĳ: "IJ",
	ĳ: "ij",
	Œ: "Oe",
	œ: "oe",
	ŉ: "'n",
	ſ: "s"
}), $r = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, ei = RegExp("[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]", "g");
function ti(e) {
	return e = rr(e), e && e.replace($r, Qr).replace(ei, "");
}
// node_modules/lodash-es/_asciiWords.js
var ni = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
function ri(e) {
	return e.match(ni) || [];
}
// node_modules/lodash-es/_hasUnicodeWord.js
var ii = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
function ai(e) {
	return ii.test(e);
}
// node_modules/lodash-es/_unicodeWords.js
var oi = "\\ud800-\\udfff", si = "\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff", ci = "\\u2700-\\u27bf", li = "a-z\\xdf-\\xf6\\xf8-\\xff", ui = "\\xac\\xb1\\xd7\\xf7", di = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", fi = "\\u2000-\\u206f", pi = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", mi = "A-Z\\xc0-\\xd6\\xd8-\\xde", hi = "\\ufe0e\\ufe0f", gi = ui + di + fi + pi, _i = "['’]", vi = "[" + gi + "]", yi = "[" + si + "]", bi = "\\d+", xi = "[" + ci + "]", Si = "[" + li + "]", Ci = "[^" + oi + gi + bi + ci + li + mi + "]", wi = "(?:" + yi + "|\\ud83c[\\udffb-\\udfff])", Ti = "[^" + oi + "]", Ei = "(?:\\ud83c[\\udde6-\\uddff]){2}", Di = "[\\ud800-\\udbff][\\udc00-\\udfff]", Oi = "[" + mi + "]", ki = "\\u200d", Ai = "(?:" + Si + "|" + Ci + ")", ji = "(?:" + Oi + "|" + Ci + ")", Mi = "(?:" + _i + "(?:d|ll|m|re|s|t|ve))?", Ni = "(?:" + _i + "(?:D|LL|M|RE|S|T|VE))?", Pi = wi + "?", Fi = "[" + hi + "]?", Ii = "(?:" + ki + "(?:" + [
	Ti,
	Ei,
	Di
].join("|") + ")" + Fi + Pi + ")*", Li = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", Ri = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", zi = Fi + Pi + Ii, Bi = "(?:" + [
	xi,
	Ei,
	Di
].join("|") + ")" + zi, Vi = RegExp([
	Oi + "?" + Si + "+" + Mi + "(?=" + [
		vi,
		Oi,
		"$"
	].join("|") + ")",
	ji + "+" + Ni + "(?=" + [
		vi,
		Oi + Ai,
		"$"
	].join("|") + ")",
	Oi + "?" + Ai + "+" + Mi,
	Oi + "+" + Ni,
	Ri,
	Li,
	bi,
	Bi
].join("|"), "g");
function Hi(e) {
	return e.match(Vi) || [];
}
// node_modules/lodash-es/words.js
function Ui(e, t, n) {
	return e = rr(e), t = n ? void 0 : t, t === void 0 ? ai(e) ? Hi(e) : ri(e) : e.match(t) || [];
}
// node_modules/lodash-es/_createCompounder.js
var Wi = RegExp("['’]", "g");
function Gi(e) {
	return function(t) {
		return Xr(Ui(ti(t).replace(Wi, "")), e, "");
	};
}
// node_modules/lodash-es/camelCase.js
var Ki = Gi(function(e, t, n) {
	return t = t.toLowerCase(), e + (n ? Yr(t) : t);
});
// node_modules/lodash-es/castArray.js
function qi() {
	if (!arguments.length) return [];
	var e = arguments[0];
	return j(e) ? e : [e];
}
// node_modules/lodash-es/_baseClamp.js
function Ji(e, t, n) {
	return e === e && (n !== void 0 && (e = e <= n ? e : n), t !== void 0 && (e = e >= t ? e : t)), e;
}
// node_modules/lodash-es/clamp.js
function Yi(e, t, n) {
	return n === void 0 && (n = t, t = void 0), n !== void 0 && (n = me(n), n = n === n ? n : 0), t !== void 0 && (t = me(t), t = t === t ? t : 0), Ji(me(e), t, n);
}
// node_modules/lodash-es/_stackClear.js
function Xi() {
	this.__data__ = new Bn(), this.size = 0;
}
// node_modules/lodash-es/_stackDelete.js
function Zi(e) {
	var t = this.__data__, n = t.delete(e);
	return this.size = t.size, n;
}
// node_modules/lodash-es/_stackGet.js
function Qi(e) {
	return this.__data__.get(e);
}
// node_modules/lodash-es/_stackHas.js
function $i(e) {
	return this.__data__.has(e);
}
// node_modules/lodash-es/_stackSet.js
var ea = 200;
function ta(e, t) {
	var n = this.__data__;
	if (n instanceof Bn) {
		var r = n.__data__;
		if (!Vn || r.length < ea - 1) return r.push([e, t]), this.size = ++n.size, this;
		n = this.__data__ = new Yn(r);
	}
	return n.set(e, t), this.size = n.size, this;
}
// node_modules/lodash-es/_Stack.js
function na(e) {
	var t = this.__data__ = new Bn(e);
	this.size = t.size;
}
na.prototype.clear = Xi, na.prototype.delete = Zi, na.prototype.get = Qi, na.prototype.has = $i, na.prototype.set = ta;
// node_modules/lodash-es/_baseAssign.js
function ra(e, t) {
	return e && at(t, mn(t), e);
}
// node_modules/lodash-es/_baseAssignIn.js
function ia(e, t) {
	return e && at(t, vn(t), e);
}
// node_modules/lodash-es/_cloneBuffer.js
var aa = typeof exports == "object" && exports && !exports.nodeType && exports, oa = aa && typeof module == "object" && module && !module.nodeType && module, sa = oa && oa.exports === aa ? _.Buffer : void 0, ca = sa ? sa.allocUnsafe : void 0;
function la(e, t) {
	if (t) return e.slice();
	var n = e.length, r = ca ? ca(n) : new e.constructor(n);
	return e.copy(r), r;
}
// node_modules/lodash-es/_arrayFilter.js
function ua(e, t) {
	for (var n = -1, r = e == null ? 0 : e.length, i = 0, a = []; ++n < r;) {
		var o = e[n];
		t(o, n, e) && (a[i++] = o);
	}
	return a;
}
// node_modules/lodash-es/stubArray.js
function da() {
	return [];
}
// node_modules/lodash-es/_getSymbols.js
var fa = Object.prototype.propertyIsEnumerable, pa = Object.getOwnPropertySymbols, ma = pa ? function(e) {
	return e == null ? [] : (e = Object(e), ua(pa(e), function(t) {
		return fa.call(e, t);
	}));
} : da;
// node_modules/lodash-es/_copySymbols.js
function ha(e, t) {
	return at(e, ma(e), t);
}
// node_modules/lodash-es/_getSymbolsIn.js
var ga = Object.getOwnPropertySymbols ? function(e) {
	for (var t = []; e;) lr(t, ma(e)), e = hr(e);
	return t;
} : da;
// node_modules/lodash-es/_copySymbolsIn.js
function _a(e, t) {
	return at(e, ga(e), t);
}
// node_modules/lodash-es/_baseGetAllKeys.js
function va(e, t, n) {
	var r = t(e);
	return j(e) ? r : lr(r, n(e));
}
// node_modules/lodash-es/_getAllKeys.js
function ya(e) {
	return va(e, mn, ma);
}
// node_modules/lodash-es/_getAllKeysIn.js
function ba(e) {
	return va(e, vn, ga);
}
// node_modules/lodash-es/_DataView.js
var xa = Me(_, "DataView"), Sa = Me(_, "Promise"), Ca = Me(_, "Set"), wa = "[object Map]", Ta = "[object Object]", Ea = "[object Promise]", Da = "[object Set]", Oa = "[object WeakMap]", ka = "[object DataView]", Aa = Ce(xa), ja = Ce(Vn), Ma = Ce(Sa), Na = Ce(Ca), Pa = Ce(Ne), Fa = k;
(xa && Fa(new xa(/* @__PURE__ */ new ArrayBuffer(1))) != ka || Vn && Fa(new Vn()) != wa || Sa && Fa(Sa.resolve()) != Ea || Ca && Fa(new Ca()) != Da || Ne && Fa(new Ne()) != Oa) && (Fa = function(e) {
	var t = k(e), n = t == Ta ? e.constructor : void 0, r = n ? Ce(n) : "";
	if (r) switch (r) {
		case Aa: return ka;
		case ja: return wa;
		case Ma: return Ea;
		case Na: return Da;
		case Pa: return Oa;
	}
	return t;
});
var Ia = Fa, La = Object.prototype.hasOwnProperty;
function Ra(e) {
	var t = e.length, n = new e.constructor(t);
	return t && typeof e[0] == "string" && La.call(e, "index") && (n.index = e.index, n.input = e.input), n;
}
// node_modules/lodash-es/_Uint8Array.js
var za = _.Uint8Array;
// node_modules/lodash-es/_cloneArrayBuffer.js
function Ba(e) {
	var t = new e.constructor(e.byteLength);
	return new za(t).set(new za(e)), t;
}
// node_modules/lodash-es/_cloneDataView.js
function Va(e, t) {
	var n = t ? Ba(e.buffer) : e.buffer;
	return new e.constructor(n, e.byteOffset, e.byteLength);
}
// node_modules/lodash-es/_cloneRegExp.js
var Ha = /\w*$/;
function Ua(e) {
	var t = new e.constructor(e.source, Ha.exec(e));
	return t.lastIndex = e.lastIndex, t;
}
// node_modules/lodash-es/_cloneSymbol.js
var Wa = v ? v.prototype : void 0, Ga = Wa ? Wa.valueOf : void 0;
function Ka(e) {
	return Ga ? Object(Ga.call(e)) : {};
}
// node_modules/lodash-es/_cloneTypedArray.js
function qa(e, t) {
	var n = t ? Ba(e.buffer) : e.buffer;
	return new e.constructor(n, e.byteOffset, e.length);
}
// node_modules/lodash-es/_initCloneByTag.js
var Ja = "[object Boolean]", Ya = "[object Date]", Xa = "[object Map]", Za = "[object Number]", Qa = "[object RegExp]", $a = "[object Set]", eo = "[object String]", to = "[object Symbol]", no = "[object ArrayBuffer]", ro = "[object DataView]", io = "[object Float32Array]", ao = "[object Float64Array]", oo = "[object Int8Array]", so = "[object Int16Array]", co = "[object Int32Array]", lo = "[object Uint8Array]", uo = "[object Uint8ClampedArray]", fo = "[object Uint16Array]", po = "[object Uint32Array]";
function mo(e, t, n) {
	var r = e.constructor;
	switch (t) {
		case no: return Ba(e);
		case Ja:
		case Ya: return new r(+e);
		case ro: return Va(e, n);
		case io:
		case ao:
		case oo:
		case so:
		case co:
		case lo:
		case uo:
		case fo:
		case po: return qa(e, n);
		case Xa: return new r();
		case Za:
		case eo: return new r(e);
		case Qa: return Ua(e);
		case $a: return new r();
		case to: return Ka(e);
	}
}
// node_modules/lodash-es/_initCloneObject.js
function ho(e) {
	return typeof e.constructor == "function" && !ht(e) ? Fe(hr(e)) : {};
}
// node_modules/lodash-es/_baseIsMap.js
var go = "[object Map]";
function _o(e) {
	return A(e) && Ia(e) == go;
}
// node_modules/lodash-es/isMap.js
var vo = an && an.isMap, yo = vo ? en(vo) : _o, bo = "[object Set]";
function xo(e) {
	return A(e) && Ia(e) == bo;
}
// node_modules/lodash-es/isSet.js
var So = an && an.isSet, Co = So ? en(So) : xo, wo = 1, To = 2, Eo = 4, Do = "[object Arguments]", Oo = "[object Array]", ko = "[object Boolean]", Ao = "[object Date]", jo = "[object Error]", Mo = "[object Function]", No = "[object GeneratorFunction]", Po = "[object Map]", Fo = "[object Number]", Io = "[object Object]", Lo = "[object RegExp]", Ro = "[object Set]", zo = "[object String]", Bo = "[object Symbol]", Vo = "[object WeakMap]", Ho = "[object ArrayBuffer]", Uo = "[object DataView]", Wo = "[object Float32Array]", Go = "[object Float64Array]", Ko = "[object Int8Array]", qo = "[object Int16Array]", Jo = "[object Int32Array]", Yo = "[object Uint8Array]", Xo = "[object Uint8ClampedArray]", Zo = "[object Uint16Array]", Qo = "[object Uint32Array]", $o = {};
$o[Do] = $o[Oo] = $o[Ho] = $o[Uo] = $o[ko] = $o[Ao] = $o[Wo] = $o[Go] = $o[Ko] = $o[qo] = $o[Jo] = $o[Po] = $o[Fo] = $o[Io] = $o[Lo] = $o[Ro] = $o[zo] = $o[Bo] = $o[Yo] = $o[Xo] = $o[Zo] = $o[Qo] = !0, $o[jo] = $o[Mo] = $o[Vo] = !1;
function es(e, t, n, r, i, a) {
	var o, s = t & wo, c = t & To, l = t & Eo;
	if (n && (o = i ? n(e, r, i, a) : n(e)), o !== void 0) return o;
	if (!N(e)) return e;
	var u = j(e);
	if (u) {
		if (o = Ra(e), !s) return Re(e, o);
	} else {
		var d = Ia(e), f = d == Mo || d == No;
		if (Dt(e)) return la(e, s);
		if (d == Io || d == Do || f && !i) {
			if (o = c || f ? {} : ho(e), !s) return c ? _a(e, ia(o, e)) : ha(e, ra(o, e));
		} else {
			if (!$o[d]) return i ? e : {};
			o = mo(e, d, s);
		}
	}
	a ||= new na();
	var p = a.get(e);
	if (p) return p;
	a.set(e, o), Co(e) ? e.forEach(function(r) {
		o.add(es(r, t, n, r, e, a));
	}) : yo(e) && e.forEach(function(r, i) {
		o.set(i, es(r, t, n, i, e, a));
	});
	var m = u ? void 0 : (l ? c ? ba : ya : c ? vn : mn)(e);
	return Ke(m || e, function(r, i) {
		m && (i = r, r = e[i]), it(o, i, es(r, t, n, i, e, a));
	}), o;
}
// node_modules/lodash-es/clone.js
var ts = 4;
function ns(e) {
	return es(e, ts);
}
// node_modules/lodash-es/cloneDeep.js
var rs = 1, is = 4;
function as(e) {
	return es(e, rs | is);
}
// node_modules/lodash-es/_setCacheAdd.js
var os = "__lodash_hash_undefined__";
function ss(e) {
	return this.__data__.set(e, os), this;
}
// node_modules/lodash-es/_setCacheHas.js
function cs(e) {
	return this.__data__.has(e);
}
// node_modules/lodash-es/_SetCache.js
function ls(e) {
	var t = -1, n = e == null ? 0 : e.length;
	for (this.__data__ = new Yn(); ++t < n;) this.add(e[t]);
}
ls.prototype.add = ls.prototype.push = ss, ls.prototype.has = cs;
// node_modules/lodash-es/_arraySome.js
function us(e, t) {
	for (var n = -1, r = e == null ? 0 : e.length; ++n < r;) if (t(e[n], n, e)) return !0;
	return !1;
}
// node_modules/lodash-es/_cacheHas.js
function ds(e, t) {
	return e.has(t);
}
// node_modules/lodash-es/_equalArrays.js
var fs = 1, ps = 2;
function ms(e, t, n, r, i, a) {
	var o = n & fs, s = e.length, c = t.length;
	if (s != c && !(o && c > s)) return !1;
	var l = a.get(e), u = a.get(t);
	if (l && u) return l == t && u == e;
	var d = -1, f = !0, p = n & ps ? new ls() : void 0;
	for (a.set(e, t), a.set(t, e); ++d < s;) {
		var m = e[d], h = t[d];
		if (r) var g = o ? r(h, m, d, t, e, a) : r(m, h, d, e, t, a);
		if (g !== void 0) {
			if (g) continue;
			f = !1;
			break;
		}
		if (p) {
			if (!us(t, function(e, t) {
				if (!ds(p, t) && (m === e || i(m, e, n, r, a))) return p.push(t);
			})) {
				f = !1;
				break;
			}
		} else if (!(m === h || i(m, h, n, r, a))) {
			f = !1;
			break;
		}
	}
	return a.delete(e), a.delete(t), f;
}
// node_modules/lodash-es/_mapToArray.js
function hs(e) {
	var t = -1, n = Array(e.size);
	return e.forEach(function(e, r) {
		n[++t] = [r, e];
	}), n;
}
// node_modules/lodash-es/_setToArray.js
function gs(e) {
	var t = -1, n = Array(e.size);
	return e.forEach(function(e) {
		n[++t] = e;
	}), n;
}
// node_modules/lodash-es/_equalByTag.js
var _s = 1, vs = 2, ys = "[object Boolean]", bs = "[object Date]", xs = "[object Error]", Ss = "[object Map]", Cs = "[object Number]", ws = "[object RegExp]", Ts = "[object Set]", Es = "[object String]", Ds = "[object Symbol]", Os = "[object ArrayBuffer]", ks = "[object DataView]", As = v ? v.prototype : void 0, js = As ? As.valueOf : void 0;
function Ms(e, t, n, r, i, a, o) {
	switch (n) {
		case ks:
			if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset) return !1;
			e = e.buffer, t = t.buffer;
		case Os: return !(e.byteLength != t.byteLength || !a(new za(e), new za(t)));
		case ys:
		case bs:
		case Cs: return nt(+e, +t);
		case xs: return e.name == t.name && e.message == t.message;
		case ws:
		case Es: return e == t + "";
		case Ss: var s = hs;
		case Ts:
			var c = r & _s;
			if (s ||= gs, e.size != t.size && !c) return !1;
			var l = o.get(e);
			if (l) return l == t;
			r |= vs, o.set(e, t);
			var u = ms(s(e), s(t), r, i, a, o);
			return o.delete(e), u;
		case Ds: if (js) return js.call(e) == js.call(t);
	}
	return !1;
}
// node_modules/lodash-es/_equalObjects.js
var Ns = 1, Ps = Object.prototype.hasOwnProperty;
function Fs(e, t, n, r, i, a) {
	var o = n & Ns, s = ya(e), c = s.length;
	if (c != ya(t).length && !o) return !1;
	for (var l = c; l--;) {
		var u = s[l];
		if (!(o ? u in t : Ps.call(t, u))) return !1;
	}
	var d = a.get(e), f = a.get(t);
	if (d && f) return d == t && f == e;
	var p = !0;
	a.set(e, t), a.set(t, e);
	for (var m = o; ++l < c;) {
		u = s[l];
		var h = e[u], g = t[u];
		if (r) var _ = o ? r(g, h, u, t, e, a) : r(h, g, u, e, t, a);
		if (!(_ === void 0 ? h === g || i(h, g, n, r, a) : _)) {
			p = !1;
			break;
		}
		m ||= u == "constructor";
	}
	if (p && !m) {
		var v = e.constructor, y = t.constructor;
		v != y && "constructor" in e && "constructor" in t && !(typeof v == "function" && v instanceof v && typeof y == "function" && y instanceof y) && (p = !1);
	}
	return a.delete(e), a.delete(t), p;
}
// node_modules/lodash-es/_baseIsEqualDeep.js
var Is = 1, Ls = "[object Arguments]", Rs = "[object Array]", zs = "[object Object]", Bs = Object.prototype.hasOwnProperty;
function Vs(e, t, n, r, i, a) {
	var o = j(e), s = j(t), c = o ? Rs : Ia(e), l = s ? Rs : Ia(t);
	c = c == Ls ? zs : c, l = l == Ls ? zs : l;
	var u = c == zs, d = l == zs, f = c == l;
	if (f && Dt(e)) {
		if (!Dt(t)) return !1;
		o = !0, u = !1;
	}
	if (f && !u) return a ||= new na(), o || sn(e) ? ms(e, t, n, r, i, a) : Ms(e, t, c, n, r, i, a);
	if (!(n & Is)) {
		var p = u && Bs.call(e, "__wrapped__"), m = d && Bs.call(t, "__wrapped__");
		if (p || m) {
			var h = p ? e.value() : e, g = m ? t.value() : t;
			return a ||= new na(), i(h, g, n, r, a);
		}
	}
	return f ? (a ||= new na(), Fs(e, t, n, r, i, a)) : !1;
}
// node_modules/lodash-es/_baseIsEqual.js
function Hs(e, t, n, r, i) {
	return e === t ? !0 : e == null || t == null || !A(e) && !A(t) ? e !== e && t !== t : Vs(e, t, n, r, Hs, i);
}
// node_modules/lodash-es/_baseIsMatch.js
var Us = 1, Ws = 2;
function Gs(e, t, n, r) {
	var i = n.length, a = i, o = !r;
	if (e == null) return !a;
	for (e = Object(e); i--;) {
		var s = n[i];
		if (o && s[2] ? s[1] !== e[s[0]] : !(s[0] in e)) return !1;
	}
	for (; ++i < a;) {
		s = n[i];
		var c = s[0], l = e[c], u = s[1];
		if (o && s[2]) {
			if (l === void 0 && !(c in e)) return !1;
		} else {
			var d = new na();
			if (r) var f = r(l, u, c, e, t, d);
			if (!(f === void 0 ? Hs(u, l, Us | Ws, r, d) : f)) return !1;
		}
	}
	return !0;
}
// node_modules/lodash-es/_isStrictComparable.js
function Ks(e) {
	return e === e && !N(e);
}
// node_modules/lodash-es/_getMatchData.js
function qs(e) {
	for (var t = mn(e), n = t.length; n--;) {
		var r = t[n], i = e[r];
		t[n] = [
			r,
			i,
			Ks(i)
		];
	}
	return t;
}
// node_modules/lodash-es/_matchesStrictComparable.js
function Js(e, t) {
	return function(n) {
		return n != null && n[e] === t && (t !== void 0 || e in Object(n));
	};
}
// node_modules/lodash-es/_baseMatches.js
function Ys(e) {
	var t = qs(e);
	return t.length == 1 && t[0][2] ? Js(t[0][0], t[0][1]) : function(n) {
		return n === e || Gs(n, e, t);
	};
}
// node_modules/lodash-es/_baseHasIn.js
function Xs(e, t) {
	return e != null && t in Object(e);
}
// node_modules/lodash-es/_hasPath.js
function Zs(e, t, n) {
	t = ir(t, e);
	for (var r = -1, i = t.length, a = !1; ++r < i;) {
		var o = or(t[r]);
		if (!(a = e != null && n(e, o))) break;
		e = e[o];
	}
	return a || ++r != i ? a : (i = e == null ? 0 : e.length, !!i && ut(i) && et(o, i) && (j(e) || St(e)));
}
// node_modules/lodash-es/hasIn.js
function Qs(e, t) {
	return e != null && Zs(e, t, Xs);
}
// node_modules/lodash-es/_baseMatchesProperty.js
var $s = 1, ec = 2;
function tc(e, t) {
	return xn(e) && Ks(t) ? Js(or(e), t) : function(n) {
		var r = cr(n, e);
		return r === void 0 && r === t ? Qs(n, e) : Hs(t, r, $s | ec);
	};
}
// node_modules/lodash-es/_baseProperty.js
function nc(e) {
	return function(t) {
		return t?.[e];
	};
}
// node_modules/lodash-es/_basePropertyDeep.js
function rc(e) {
	return function(t) {
		return sr(t, e);
	};
}
// node_modules/lodash-es/property.js
function ic(e) {
	return xn(e) ? nc(or(e)) : rc(e);
}
// node_modules/lodash-es/_baseIteratee.js
function ac(e) {
	return typeof e == "function" ? e : e == null ? he : typeof e == "object" ? j(e) ? tc(e[0], e[1]) : Ys(e) : ic(e);
}
// node_modules/lodash-es/_arrayAggregator.js
function oc(e, t, n, r) {
	for (var i = -1, a = e == null ? 0 : e.length; ++i < a;) {
		var o = e[i];
		t(r, o, n(o), e);
	}
	return r;
}
// node_modules/lodash-es/_createBaseFor.js
function sc(e) {
	return function(t, n, r) {
		for (var i = -1, a = Object(t), o = r(t), s = o.length; s--;) {
			var c = o[e ? s : ++i];
			if (n(a[c], c, a) === !1) break;
		}
		return t;
	};
}
// node_modules/lodash-es/_baseFor.js
var cc = sc();
// node_modules/lodash-es/_baseForOwn.js
function lc(e, t) {
	return e && cc(e, t, mn);
}
// node_modules/lodash-es/_createBaseEach.js
function uc(e, t) {
	return function(n, r) {
		if (n == null) return n;
		if (!dt(n)) return e(n, r);
		for (var i = n.length, a = t ? i : -1, o = Object(n); (t ? a-- : ++a < i) && r(o[a], a, o) !== !1;);
		return n;
	};
}
// node_modules/lodash-es/_baseEach.js
var dc = uc(lc);
// node_modules/lodash-es/_baseAggregator.js
function fc(e, t, n, r) {
	return dc(e, function(e, i, a) {
		t(r, e, n(e), a);
	}), r;
}
// node_modules/lodash-es/_createAggregator.js
function pc(e, t) {
	return function(n, r) {
		var i = j(n) ? oc : fc, a = t ? t() : {};
		return i(n, e, ac(r, 2), a);
	};
}
// node_modules/lodash-es/now.js
var mc = function() {
	return _.Date.now();
}, hc = "Expected a function", gc = Math.max, _c = Math.min;
function vc(e, t, n) {
	var r, i, a, o, s, c, l = 0, u = !1, d = !1, f = !0;
	if (typeof e != "function") throw TypeError(hc);
	t = me(t) || 0, N(n) && (u = !!n.leading, d = "maxWait" in n, a = d ? gc(me(n.maxWait) || 0, t) : a, f = "trailing" in n ? !!n.trailing : f);
	function p(t) {
		var n = r, a = i;
		return r = i = void 0, l = t, o = e.apply(a, n), o;
	}
	function m(e) {
		return l = e, s = setTimeout(_, t), u ? p(e) : o;
	}
	function h(e) {
		var n = e - c, r = e - l, i = t - n;
		return d ? _c(i, a - r) : i;
	}
	function g(e) {
		var n = e - c, r = e - l;
		return c === void 0 || n >= t || n < 0 || d && r >= a;
	}
	function _() {
		var e = mc();
		if (g(e)) return v(e);
		s = setTimeout(_, h(e));
	}
	function v(e) {
		return s = void 0, f && r ? p(e) : (r = i = void 0, o);
	}
	function y() {
		s !== void 0 && clearTimeout(s), l = 0, r = c = i = s = void 0;
	}
	function b() {
		return s === void 0 ? o : v(mc());
	}
	function x() {
		var e = mc(), n = g(e);
		if (r = arguments, i = this, c = e, n) {
			if (s === void 0) return m(c);
			if (d) return clearTimeout(s), s = setTimeout(_, t), p(c);
		}
		return s === void 0 && (s = setTimeout(_, t)), o;
	}
	return x.cancel = y, x.flush = b, x;
}
// node_modules/lodash-es/defaults.js
var yc = Object.prototype, bc = yc.hasOwnProperty, xc = ct(function(e, t) {
	e = Object(e);
	var n = -1, r = t.length, i = r > 2 ? t[2] : void 0;
	for (i && ft(t[0], t[1], i) && (r = 1); ++n < r;) for (var a = t[n], o = vn(a), s = -1, c = o.length; ++s < c;) {
		var l = o[s], u = e[l];
		(u === void 0 || nt(u, yc[l]) && !bc.call(e, l)) && (e[l] = a[l]);
	}
	return e;
});
// node_modules/lodash-es/_assignMergeValue.js
function Sc(e, t, n) {
	(n !== void 0 && !nt(e[t], n) || n === void 0 && !(t in e)) && tt(e, t, n);
}
// node_modules/lodash-es/isArrayLikeObject.js
function Cc(e) {
	return A(e) && dt(e);
}
// node_modules/lodash-es/_safeGet.js
function wc(e, t) {
	if ((t !== "constructor" || typeof e[t] != "function") && t != "__proto__") return e[t];
}
// node_modules/lodash-es/toPlainObject.js
function Tc(e) {
	return at(e, vn(e));
}
// node_modules/lodash-es/_baseMergeDeep.js
function Ec(e, t, n, r, i, a, o) {
	var s = wc(e, n), c = wc(t, n), l = o.get(c);
	if (l) Sc(e, n, l);
	else {
		var u = a ? a(s, c, n + "", e, t, o) : void 0, d = u === void 0;
		if (d) {
			var f = j(c), p = !f && Dt(c), m = !f && !p && sn(c);
			u = c, f || p || m ? j(s) ? u = s : Cc(s) ? u = Re(s) : p ? (d = !1, u = la(c, !0)) : m ? (d = !1, u = qa(c, !0)) : u = [] : Sr(c) || St(c) ? (u = s, St(s) ? u = Tc(s) : (!N(s) || ve(s)) && (u = ho(c))) : d = !1;
		}
		d && (o.set(c, u), i(u, c, r, a, o), o.delete(c)), Sc(e, n, u);
	}
}
// node_modules/lodash-es/_baseMerge.js
function Dc(e, t, n, r, i) {
	e !== t && cc(t, function(a, o) {
		if (i ||= new na(), N(a)) Ec(e, t, o, n, Dc, r, i);
		else {
			var s = r ? r(wc(e, o), a, o + "", e, t, i) : void 0;
			s === void 0 && (s = a), Sc(e, o, s);
		}
	}, vn);
}
// node_modules/lodash-es/_customDefaultsMerge.js
function Oc(e, t, n, r, i, a) {
	return N(e) && N(t) && (a.set(t, e), Dc(e, t, void 0, Oc, a), a.delete(t)), e;
}
// node_modules/lodash-es/mergeWith.js
var kc = pt(function(e, t, n, r) {
	Dc(e, t, n, r);
}), Ac = ct(function(e) {
	return e.push(void 0, Oc), Ie(kc, void 0, e);
});
// node_modules/lodash-es/_arrayIncludesWith.js
function jc(e, t, n) {
	for (var r = -1, i = e == null ? 0 : e.length; ++r < i;) if (n(t, e[r])) return !0;
	return !1;
}
// node_modules/lodash-es/_baseDifference.js
var Mc = 200;
function Nc(e, t, n, r) {
	var i = -1, a = Ze, o = !0, s = e.length, c = [], l = t.length;
	if (!s) return c;
	n && (t = ne(t, en(n))), r ? (a = jc, o = !1) : t.length >= Mc && (a = ds, o = !1, t = new ls(t));
	outer: for (; ++i < s;) {
		var u = e[i], d = n == null ? u : n(u);
		if (u = r || u !== 0 ? u : 0, o && d === d) {
			for (var f = l; f--;) if (t[f] === d) continue outer;
			c.push(u);
		} else a(t, d, r) || c.push(u);
	}
	return c;
}
// node_modules/lodash-es/difference.js
var Pc = ct(function(e, t) {
	return Cc(e) ? Nc(e, fr(t, 1, Cc, !0)) : [];
});
// node_modules/lodash-es/_baseMap.js
function Fc(e, t) {
	var n = -1, r = dt(e) ? Array(e.length) : [];
	return dc(e, function(e, i, a) {
		r[++n] = t(e, i, a);
	}), r;
}
// node_modules/lodash-es/groupBy.js
var Ic = Object.prototype.hasOwnProperty, Lc = pc(function(e, t, n) {
	Ic.call(e, n) ? e[n].push(t) : tt(e, n, [t]);
});
// node_modules/lodash-es/_baseGt.js
function Rc(e, t) {
	return e > t;
}
// node_modules/lodash-es/_baseHas.js
var zc = Object.prototype.hasOwnProperty;
function Bc(e, t) {
	return e != null && zc.call(e, t);
}
// node_modules/lodash-es/has.js
function Vc(e, t) {
	return e != null && Zs(e, t, Bc);
}
// node_modules/lodash-es/isEmpty.js
var Hc = "[object Map]", Uc = "[object Set]", Wc = Object.prototype.hasOwnProperty;
function Gc(e) {
	if (e == null) return !0;
	if (dt(e) && (j(e) || typeof e == "string" || typeof e.splice == "function" || Dt(e) || sn(e) || St(e))) return !e.length;
	var t = Ia(e);
	if (t == Hc || t == Uc) return !e.size;
	if (ht(e)) return !pn(e).length;
	for (var n in e) if (Wc.call(e, n)) return !1;
	return !0;
}
// node_modules/lodash-es/isEqual.js
function Kc(e, t) {
	return Hs(e, t);
}
// node_modules/lodash-es/isNumber.js
var qc = "[object Number]";
function Jc(e) {
	return typeof e == "number" || A(e) && k(e) == qc;
}
// node_modules/lodash-es/lowerCase.js
var Yc = qr("toLowerCase");
// node_modules/lodash-es/_baseExtremum.js
function Xc(e, t, n) {
	for (var r = -1, i = e.length; ++r < i;) {
		var a = e[r], o = t(a);
		if (o != null && (s === void 0 ? o === o && !te(o) : n(o, s))) var s = o, c = a;
	}
	return c;
}
// node_modules/lodash-es/max.js
function Zc(e) {
	return e && e.length ? Xc(e, he, Rc) : void 0;
}
// node_modules/lodash-es/merge.js
var Qc = pt(function(e, t, n) {
	Dc(e, t, n);
});
// node_modules/lodash-es/_baseSet.js
function $c(e, t, n, r) {
	if (!N(e)) return e;
	t = ir(t, e);
	for (var i = -1, a = t.length, o = a - 1, s = e; s != null && ++i < a;) {
		var c = or(t[i]), l = n;
		if (c === "__proto__" || c === "constructor" || c === "prototype") return e;
		if (i != o) {
			var u = s[c];
			l = r ? r(u, c, s) : void 0, l === void 0 && (l = N(u) ? u : et(t[i + 1]) ? [] : {});
		}
		it(s, c, l), s = s[c];
	}
	return e;
}
// node_modules/lodash-es/_basePickBy.js
function el(e, t, n) {
	for (var r = -1, i = t.length, a = {}; ++r < i;) {
		var o = t[r], s = sr(e, o);
		n(s, o) && $c(a, ir(o, e), s);
	}
	return a;
}
// node_modules/lodash-es/_baseSortBy.js
function tl(e, t) {
	var n = e.length;
	for (e.sort(t); n--;) e[n] = e[n].value;
	return e;
}
// node_modules/lodash-es/_compareAscending.js
function nl(e, t) {
	if (e !== t) {
		var n = e !== void 0, r = e === null, i = e === e, a = te(e), o = t !== void 0, s = t === null, c = t === t, l = te(t);
		if (!s && !l && !a && e > t || a && o && c && !s && !l || r && o && c || !n && c || !i) return 1;
		if (!r && !a && !l && e < t || l && n && i && !r && !a || s && n && i || !o && i || !c) return -1;
	}
	return 0;
}
// node_modules/lodash-es/_compareMultiple.js
function rl(e, t, n) {
	for (var r = -1, i = e.criteria, a = t.criteria, o = i.length, s = n.length; ++r < o;) {
		var c = nl(i[r], a[r]);
		if (c) return r >= s ? c : c * (n[r] == "desc" ? -1 : 1);
	}
	return e.index - t.index;
}
// node_modules/lodash-es/_baseOrderBy.js
function il(e, t, n) {
	t = t.length ? ne(t, function(e) {
		return j(e) ? function(t) {
			return sr(t, e.length === 1 ? e[0] : e);
		} : e;
	}) : [he];
	var r = -1;
	return t = ne(t, en(ac)), tl(Fc(e, function(e, n, i) {
		return {
			criteria: ne(t, function(t) {
				return t(e);
			}),
			index: ++r,
			value: e
		};
	}), function(e, t) {
		return rl(e, t, n);
	});
}
// node_modules/lodash-es/_basePick.js
function al(e, t) {
	return el(e, t, function(t, n) {
		return Qs(e, n);
	});
}
// node_modules/lodash-es/pick.js
var ol = mr(function(e, t) {
	return e == null ? {} : al(e, t);
}), sl = ct(function(e, t) {
	if (e == null) return [];
	var n = t.length;
	return n > 1 && ft(e, t[0], t[1]) ? t = [] : n > 2 && ft(t[0], t[1], t[2]) && (t = [t[0]]), il(e, fr(t, 1), []);
}), cl = 4294967294, ll = Math.floor, ul = Math.min;
function dl(e, t, n, r) {
	var i = 0, a = e == null ? 0 : e.length;
	if (a === 0) return 0;
	t = n(t);
	for (var o = t !== t, s = t === null, c = te(t), l = t === void 0; i < a;) {
		var u = ll((i + a) / 2), d = n(e[u]), f = d !== void 0, p = d === null, m = d === d, h = te(d);
		if (o) var g = r || m;
		else g = l ? m && (r || f) : s ? m && f && (r || !p) : c ? m && f && !p && (r || !h) : p || h ? !1 : r ? d <= t : d < t;
		g ? i = u + 1 : a = u;
	}
	return ul(a, cl);
}
// node_modules/lodash-es/_baseSortedIndex.js
var fl = 2147483647;
function pl(e, t, n) {
	var r = 0, i = e == null ? r : e.length;
	if (typeof t == "number" && t === t && i <= fl) {
		for (; r < i;) {
			var a = r + i >>> 1, o = e[a];
			o !== null && !te(o) && (n ? o <= t : o < t) ? r = a + 1 : i = a;
		}
		return i;
	}
	return dl(e, t, he, n);
}
// node_modules/lodash-es/sortedIndex.js
function ml(e, t) {
	return pl(e, t);
}
// node_modules/lodash-es/startCase.js
var hl = Gi(function(e, t, n) {
	return e + (n ? " " : "") + Jr(t);
}), gl = "Expected a function";
function _l(e, t, n) {
	var r = !0, i = !0;
	if (typeof e != "function") throw TypeError(gl);
	return N(n) && (r = "leading" in n ? !!n.leading : r, i = "trailing" in n ? !!n.trailing : i), vc(e, t, {
		leading: r,
		maxWait: t,
		trailing: i
	});
}
// node_modules/lodash-es/_createSet.js
var vl = Ca && 1 / gs(new Ca([, -0]))[1] == 1 / 0 ? function(e) {
	return new Ca(e);
} : Le, yl = 200;
function bl(e, t, n) {
	var r = -1, i = Ze, a = e.length, o = !0, s = [], c = s;
	if (n) o = !1, i = jc;
	else if (a >= yl) {
		var l = t ? null : vl(e);
		if (l) return gs(l);
		o = !1, i = ds, c = new ls();
	} else c = t ? [] : s;
	outer: for (; ++r < a;) {
		var u = e[r], d = t ? t(u) : u;
		if (u = n || u !== 0 ? u : 0, o && d === d) {
			for (var f = c.length; f--;) if (c[f] === d) continue outer;
			t && c.push(d), s.push(u);
		} else i(c, d, n) || (c !== s && c.push(d), s.push(u));
	}
	return s;
}
// node_modules/lodash-es/union.js
var xl = ct(function(e) {
	return bl(fr(e, 1, Cc, !0));
});
// node_modules/lodash-es/uniq.js
function Sl(e) {
	return e && e.length ? bl(e) : [];
}
// node_modules/lodash-es/uniqueId.js
var Cl = 0;
function wl(e) {
	var t = ++Cl;
	return rr(e) + t;
}
// node_modules/@antv/x6/es/common/number/number.js
function Tl(e) {
	return typeof e == "string" && e.slice(-1) === "%";
}
function El(e, t) {
	if (e == null) return 0;
	let n;
	if (typeof e == "string") {
		if (n = parseFloat(e), Tl(e) && (n /= 100, Number.isFinite(n))) return n * t;
	} else n = e;
	return Number.isFinite(n) ? n > 0 && n < 1 ? n * t : n : 0;
}
function Dl(e) {
	if (typeof e == "object") {
		let t = 0, n = 0, r = 0, i = 0;
		return e.vertical != null && Number.isFinite(e.vertical) && (n = i = e.vertical), e.horizontal != null && Number.isFinite(e.horizontal) && (r = t = e.horizontal), e.left != null && Number.isFinite(e.left) && (t = e.left), e.top != null && Number.isFinite(e.top) && (n = e.top), e.right != null && Number.isFinite(e.right) && (r = e.right), e.bottom != null && Number.isFinite(e.bottom) && (i = e.bottom), {
			top: n,
			right: r,
			bottom: i,
			left: t
		};
	}
	let t = 0;
	return e != null && Number.isFinite(e) && (t = e), {
		top: t,
		right: t,
		bottom: t,
		left: t
	};
}
// node_modules/@antv/x6/es/common/platform/index.js
var Ol = !1, kl = !1, Al = !1, jl = !1;
if (typeof navigator == "object") {
	let e = navigator.userAgent;
	e.indexOf("Macintosh"), e.match(/(iPad|iPhone|iPod)/g), e.indexOf("Windows"), Ol = e.indexOf("MSIE") >= 0, e.match(/Trident\/7\./), kl = !!e.match(/Edge\//), e.indexOf("Mozilla/") >= 0 && e.indexOf("MSIE") < 0 && e.indexOf("Edge/"), e.indexOf("Chrome/") >= 0 && e.indexOf("Edge/"), e.indexOf("Opera/") >= 0 || e.indexOf("OPR/"), e.indexOf("Firefox/"), Al = e.indexOf("AppleWebKit/") >= 0 && e.indexOf("Chrome/") < 0 && e.indexOf("Edge/") < 0, typeof document == "object" && (jl = !document.createElementNS || `${document.createElementNS("http://www.w3.org/2000/svg", "foreignObject")}` != "[object SVGForeignObjectElement]" || e.indexOf("Opera/") >= 0);
}
if (typeof window == "object" && (window.chrome != null && window.chrome.app != null && window.chrome.app.runtime, window.PointerEvent), typeof document == "object") {
	"ontouchstart" in document.documentElement;
	try {
		let e = Object.defineProperty({}, "passive", { get() {} }), t = document.createElement("div");
		t.addEventListener && t.addEventListener("click", () => {}, e);
	} catch {}
}
var Ml = Ol, Nl = kl, Pl = Al, Fl = !jl;
function Il() {
	let e = window.module;
	return e != null && e.hot != null && e.hot.status != null ? e.hot.status() : "unkonwn";
}
function Ll() {
	return Il() === "apply";
}
var Rl = {
	select: "input",
	change: "input",
	submit: "form",
	reset: "form",
	error: "img",
	load: "img",
	abort: "img"
};
function zl(e) {
	let t = document.createElement(Rl[e] || "div"), n = `on${e}`, r = n in t;
	return r ||= (t.setAttribute(n, "return;"), typeof t[n] == "function"), r;
}
// node_modules/@antv/x6/es/common/css-loader/index.js
var Bl = [];
function Vl(e, t) {
	let n = Bl.find((t) => t.name === e);
	if (!(n && (n.loadTimes += 1, n.loadTimes > 1)) && !Ll()) {
		let n = document.createElement("style");
		n.setAttribute("type", "text/css"), n.textContent = t;
		let r = document.querySelector("head");
		r && r.insertBefore(n, r.firstChild), Bl.push({
			name: e,
			loadTimes: 1,
			styleElement: n
		});
	}
}
function Hl(e) {
	let t = Bl.findIndex((t) => t.name === e);
	if (t > -1) {
		let e = Bl[t];
		if (--e.loadTimes, e.loadTimes > 0) return;
		let n = e.styleElement;
		n && n.parentNode && n.parentNode.removeChild(n), n = null, Bl.splice(t, 1);
	}
}
// node_modules/@antv/x6/es/common/datauri/index.js
function Ul(e) {
	let t = e.match(/<svg[^>]*viewBox\s*=\s*(["']?)(.+?)\1[^>]*>/i);
	return t && t[2] ? t[2].replace(/\s+/, " ").split(" ") : null;
}
function Wl(e) {
	let t = parseFloat(e);
	return Number.isNaN(t) ? null : t;
}
function Gl(e) {
	return e.substr(0, 5) === "data:";
}
function Kl(e, t) {
	if (!e || Gl(e)) {
		setTimeout(() => t(null, e));
		return;
	}
	let n = () => {
		t(/* @__PURE__ */ Error(`Failed to load image: ${e}`));
	}, r = window.FileReader ? (e) => {
		if (e.status === 200) {
			let r = new FileReader();
			r.onload = (e) => {
				let n = e.target.result;
				t(null, n);
			}, r.onerror = n, r.readAsDataURL(e.response);
		} else n();
	} : (r) => {
		let i = (e) => {
			let t = 32768, n = [];
			for (let r = 0; r < e.length; r += t) n.push(String.fromCharCode.apply(null, e.subarray(r, r + t)));
			return n.join("");
		};
		if (r.status === 200) {
			let n = e.split(".").pop() || "png";
			n === "svg" && (n = "svg+xml");
			let a = `data:image/${n};base64,`, o = new Uint8Array(r.response);
			t(null, a + btoa(i(o)));
		} else n();
	}, i = new XMLHttpRequest();
	i.responseType = window.FileReader ? "blob" : "arraybuffer", i.open("GET", e, !0), i.addEventListener("error", n), i.addEventListener("load", () => r(i)), i.send();
}
function ql(e) {
	let t = e.replace(/\s/g, "");
	t = decodeURIComponent(t);
	let n = t.indexOf(","), r = t.slice(0, n), i = r.split(":")[1].split(";")[0], a = t.slice(n + 1), o;
	o = r.indexOf("base64") >= 0 ? atob(a) : unescape(encodeURIComponent(a));
	let s = new Uint8Array(o.length);
	for (let e = 0; e < o.length; e += 1) s[e] = o.charCodeAt(e);
	return new Blob([s], { type: i });
}
function Jl(e, t) {
	let n = window.navigator.msSaveBlob;
	if (n) n(e, t);
	else {
		let n = window.URL.createObjectURL(e), r = document.createElement("a");
		r.href = n, r.download = t, document.body.appendChild(r), r.click(), document.body.removeChild(r), window.URL.revokeObjectURL(n);
	}
}
function Yl(e, t) {
	Jl(ql(e), t);
}
function Xl(e, t = {}) {
	let n = null, r = (t) => (n ??= Ul(e), n == null ? null : Wl(n[t])), i = (t) => {
		let n = e.match(t);
		return n && n[2] ? Wl(n[2]) : null;
	}, a = t.width;
	if (a ??= i(/<svg[^>]*width\s*=\s*(["']?)(.+?)\1[^>]*>/i), a ??= r(2), a == null) throw Error("Can not parse width from svg string");
	let o = t.height;
	if (o ??= i(/<svg[^>]*height\s*=\s*(["']?)(.+?)\1[^>]*>/i), o ??= r(3), o == null) throw Error("Can not parse height from svg string");
	return `data:image/svg+xml,${encodeURIComponent(e).replace(/'/g, "%27").replace(/"/g, "%22")}`;
}
// node_modules/@antv/x6/es/common/function/async.js
function Zl(e) {
	return typeof e == "object" && e.then && typeof e.then == "function";
}
function Ql(e) {
	return e != null && (e instanceof Promise || Zl(e));
}
function $l(...e) {
	let t = [];
	if (e.forEach((e) => {
		Array.isArray(e) ? t.push(...e) : t.push(e);
	}), t.some((e) => Ql(e))) {
		let e = t.map((e) => Ql(e) ? e : Promise.resolve(e !== !1));
		return Promise.all(e).then((e) => e.reduce((e, t) => t !== !1 && e, !0));
	}
	return t.every((e) => e !== !1);
}
function eu(...e) {
	let t = $l(e);
	return typeof t == "boolean" ? Promise.resolve(t) : t;
}
// node_modules/@antv/x6/es/common/function/function.js
function tu(e, t, n) {
	if (n) switch (n.length) {
		case 0: return e.call(t);
		case 1: return e.call(t, n[0]);
		case 2: return e.call(t, n[0], n[1]);
		case 3: return e.call(t, n[0], n[1], n[2]);
		case 4: return e.call(t, n[0], n[1], n[2], n[3]);
		case 5: return e.call(t, n[0], n[1], n[2], n[3], n[4]);
		case 6: return e.call(t, n[0], n[1], n[2], n[3], n[4], n[5]);
		default: return e.apply(t, n);
	}
	return e.call(t);
}
function R(e, t, ...n) {
	return tu(e, t, n);
}
// node_modules/@antv/x6/es/geometry/angle.js
function nu(e) {
	return 180 * e / Math.PI % 360;
}
var ru = function(e, t = !1) {
	return (t ? e : e % 360) * Math.PI / 180;
};
function iu(e) {
	return e % 360 + (e < 0 ? 360 : 0);
}
// node_modules/@antv/x6/es/geometry/util.js
function au(e, t = 0) {
	return Number.isInteger(e) ? e : +e.toFixed(t);
}
function ou(e, t) {
	let n, r;
	if (t == null ? (r = e ?? 1, n = 0) : (r = t, n = e ?? 0), r < n) {
		let e = n;
		n = r, r = e;
	}
	return Math.floor(Math.random() * (r - n + 1) + n);
}
function su(e, t, n) {
	return Number.isNaN(e) ? NaN : Number.isNaN(t) || Number.isNaN(n) ? 0 : t < n ? e < t ? t : e > n ? n : e : e < n ? n : e > t ? t : e;
}
function cu(e, t) {
	return t * Math.round(e / t);
}
function lu(e, t) {
	return t != null && e != null && t.x >= e.x && t.x <= e.x + e.width && t.y >= e.y && t.y <= e.y + e.height;
}
function uu(e, t) {
	let n = e.x - t.x, r = e.y - t.y;
	return n * n + r * r;
}
// node_modules/@antv/x6/es/geometry/geometry.js
var du = class {
	valueOf() {
		return this.toJSON();
	}
	toString() {
		return JSON.stringify(this.toJSON());
	}
}, z = class e extends du {
	static create(t, n) {
		return t == null || typeof t == "number" ? new e(t, n) : e.clone(t);
	}
	static clone(t) {
		return e.isPoint(t) ? new e(t.x, t.y) : Array.isArray(t) ? new e(t[0], t[1]) : new e(t.x, t.y);
	}
	static equals(e, t) {
		return e === t || e != null && t != null && e.x === t.x && e.y === t.y;
	}
	static rotateEx(t, n, r, i = new e()) {
		let a = e.clone(t), o = e.clone(i), s = a.x - o.x, c = a.y - o.y, l = s * n - c * r, u = c * n + s * r;
		return new e(l + o.x, u + o.y);
	}
	static toJSON(t) {
		return e.isPoint(t) ? {
			x: t.x,
			y: t.y
		} : Array.isArray(t) ? {
			x: t[0],
			y: t[1]
		} : {
			x: t.x,
			y: t.y
		};
	}
	static fromPolar(t, n, r = new e()) {
		let i = Math.abs(t * Math.cos(n)), a = Math.abs(t * Math.sin(n)), o = e.clone(r), s = iu(nu(n));
		return s < 90 ? a = -a : s < 180 ? (i = -i, a = -a) : s < 270 && (i = -i), new e(o.x + i, o.y + a);
	}
	static toPolar(t, n = new e()) {
		let r = e.clone(t), i = e.clone(n), a = r.x - i.x, o = r.y - i.y;
		return new e(Math.sqrt(a * a + o * o), ru(i.theta(r)));
	}
	static equalPoints(t, n) {
		if (t == null && n != null || t != null && n == null || t != null && n != null && t.length !== n.length) return !1;
		if (t != null && n != null) {
			for (let r = 0, i = t.length; r < i; r += 1) if (!e.equals(t[r], n[r])) return !1;
		}
		return !0;
	}
	static random(t, n, r, i) {
		return new e(ou(t, n), ou(r, i));
	}
	static rotate(t, n, r) {
		let i = ru(iu(-n)), a = Math.sin(i), o = Math.cos(i);
		return e.rotateEx(t, o, a, r);
	}
	static isPoint(t) {
		return t != null && t instanceof e;
	}
	static isPointLike(e) {
		return typeof e == "object" && !!e && typeof e.x == "number" && typeof e.y == "number";
	}
	static isPointData(e) {
		return e != null && Array.isArray(e) && e.length === 2 && typeof e[0] == "number" && typeof e[1] == "number";
	}
	constructor(e, t) {
		super(), this.x = e ?? 0, this.y = t ?? 0;
	}
	round(e = 0) {
		return this.x = au(this.x, e), this.y = au(this.y, e), this;
	}
	add(t, n) {
		let r = e.create(t, n);
		return this.x += r.x, this.y += r.y, this;
	}
	update(t, n) {
		let r = e.create(t, n);
		return this.x = r.x, this.y = r.y, this;
	}
	translate(t, n) {
		let r = e.create(t, n);
		return this.x += r.x, this.y += r.y, this;
	}
	rotate(t, n) {
		let r = e.rotate(this, t, n);
		return this.x = r.x, this.y = r.y, this;
	}
	scale(t, n, r = new e()) {
		let i = e.create(r);
		return this.x = i.x + t * (this.x - i.x), this.y = i.y + n * (this.y - i.y), this;
	}
	closest(t) {
		if (t.length === 1) return e.create(t[0]);
		let n = null, r = Infinity;
		return t.forEach((e) => {
			let t = this.squaredDistance(e);
			t < r && (n = e, r = t);
		}), n ? e.create(n) : null;
	}
	distance(e) {
		return Math.sqrt(this.squaredDistance(e));
	}
	squaredDistance(t) {
		let n = e.create(t), r = this.x - n.x, i = this.y - n.y;
		return r * r + i * i;
	}
	manhattanDistance(t) {
		let n = e.create(t);
		return Math.abs(n.x - this.x) + Math.abs(n.y - this.y);
	}
	magnitude() {
		return Math.sqrt(this.x * this.x + this.y * this.y) || .01;
	}
	theta(t = new e()) {
		let n = e.create(t), r = -(n.y - this.y), i = n.x - this.x, a = Math.atan2(r, i);
		return a < 0 && (a = 2 * Math.PI + a), 180 * a / Math.PI;
	}
	angleBetween(e, t) {
		if (this.equals(e) || this.equals(t)) return NaN;
		let n = this.theta(t) - this.theta(e);
		return n < 0 && (n += 360), n;
	}
	vectorAngle(t) {
		return new e(0, 0).angleBetween(this, t);
	}
	toPolar(t) {
		return this.update(e.toPolar(this, t)), this;
	}
	changeInAngle(t, n, r = new e()) {
		return this.clone().translate(-t, -n).theta(r) - this.theta(r);
	}
	adhereToRect(e) {
		return lu(e, this) || (this.x = Math.min(Math.max(this.x, e.x), e.x + e.width), this.y = Math.min(Math.max(this.y, e.y), e.y + e.height)), this;
	}
	bearing(t) {
		let n = e.create(t), r = ru(this.y), i = ru(n.y), a = this.x, o = n.x, s = ru(o - a), c = Math.sin(s) * Math.cos(i), l = Math.cos(r) * Math.sin(i) - Math.sin(r) * Math.cos(i) * Math.cos(s), u = nu(Math.atan2(c, l)), d = [
			"NE",
			"E",
			"SE",
			"S",
			"SW",
			"W",
			"NW",
			"N"
		], f = u - 22.5;
		return f < 0 && (f += 360), f = parseInt(f / 45, 10), d[f];
	}
	cross(t, n) {
		if (t != null && n != null) {
			let r = e.create(t), i = e.create(n);
			return (i.x - this.x) * (r.y - this.y) - (i.y - this.y) * (r.x - this.x);
		}
		return NaN;
	}
	dot(t) {
		let n = e.create(t);
		return this.x * n.x + this.y * n.y;
	}
	diff(t, n) {
		if (typeof t == "number") return new e(this.x - t, this.y - n);
		let r = e.create(t);
		return new e(this.x - r.x, this.y - r.y);
	}
	lerp(t, n) {
		let r = e.create(t);
		return new e((1 - n) * this.x + n * r.x, (1 - n) * this.y + n * r.y);
	}
	normalize(e = 1) {
		let t = e / this.magnitude();
		return this.scale(t, t);
	}
	move(t, n) {
		let r = ru(e.create(t).theta(this));
		return this.translate(Math.cos(r) * n, -Math.sin(r) * n);
	}
	reflection(t) {
		return e.create(t).move(this, this.distance(t));
	}
	snapToGrid(e, t) {
		return this.x = cu(this.x, e), this.y = cu(this.y, t ?? e), this;
	}
	equals(t) {
		let n = e.create(t);
		return n != null && n.x === this.x && n.y === this.y;
	}
	clone() {
		return e.clone(this);
	}
	toJSON() {
		return e.toJSON(this);
	}
	serialize() {
		return `${this.x} ${this.y}`;
	}
}, B = class e extends du {
	static isRectangle(t) {
		return t != null && t instanceof e;
	}
	static isRectangleLike(e) {
		return typeof e == "object" && !!e && typeof e.x == "number" && typeof e.y == "number" && typeof e.width == "number" && typeof e.height == "number";
	}
	static create(t, n, r, i) {
		return t == null || typeof t == "number" ? new e(t, n, r, i) : e.clone(t);
	}
	static clone(t) {
		return e.isRectangle(t) ? t.clone() : Array.isArray(t) ? new e(t[0], t[1], t[2], t[3]) : new e(t.x, t.y, t.width, t.height);
	}
	static fromEllipse(t) {
		return new e(t.x - t.a, t.y - t.b, 2 * t.a, 2 * t.b);
	}
	static fromSize(t) {
		return new e(0, 0, t.width, t.height);
	}
	static fromPositionAndSize(t, n) {
		return new e(t.x, t.y, n.width, n.height);
	}
	get left() {
		return this.x;
	}
	get top() {
		return this.y;
	}
	get right() {
		return this.x + this.width;
	}
	get bottom() {
		return this.y + this.height;
	}
	get origin() {
		return new z(this.x, this.y);
	}
	get topLeft() {
		return new z(this.x, this.y);
	}
	get topCenter() {
		return new z(this.x + this.width / 2, this.y);
	}
	get topRight() {
		return new z(this.x + this.width, this.y);
	}
	get center() {
		return new z(this.x + this.width / 2, this.y + this.height / 2);
	}
	get bottomLeft() {
		return new z(this.x, this.y + this.height);
	}
	get bottomCenter() {
		return new z(this.x + this.width / 2, this.y + this.height);
	}
	get bottomRight() {
		return new z(this.x + this.width, this.y + this.height);
	}
	get corner() {
		return new z(this.x + this.width, this.y + this.height);
	}
	get rightMiddle() {
		return new z(this.x + this.width, this.y + this.height / 2);
	}
	get leftMiddle() {
		return new z(this.x, this.y + this.height / 2);
	}
	get topLine() {
		return new V(this.topLeft, this.topRight);
	}
	get rightLine() {
		return new V(this.topRight, this.bottomRight);
	}
	get bottomLine() {
		return new V(this.bottomLeft, this.bottomRight);
	}
	get leftLine() {
		return new V(this.topLeft, this.bottomLeft);
	}
	constructor(e, t, n, r) {
		super(), this.x = e ?? 0, this.y = t ?? 0, this.width = n ?? 0, this.height = r ?? 0;
	}
	getOrigin() {
		return this.origin;
	}
	getTopLeft() {
		return this.topLeft;
	}
	getTopCenter() {
		return this.topCenter;
	}
	getTopRight() {
		return this.topRight;
	}
	getCenter() {
		return this.center;
	}
	getCenterX() {
		return this.x + this.width / 2;
	}
	getCenterY() {
		return this.y + this.height / 2;
	}
	getBottomLeft() {
		return this.bottomLeft;
	}
	getBottomCenter() {
		return this.bottomCenter;
	}
	getBottomRight() {
		return this.bottomRight;
	}
	getCorner() {
		return this.corner;
	}
	getRightMiddle() {
		return this.rightMiddle;
	}
	getLeftMiddle() {
		return this.leftMiddle;
	}
	getTopLine() {
		return this.topLine;
	}
	getRightLine() {
		return this.rightLine;
	}
	getBottomLine() {
		return this.bottomLine;
	}
	getLeftLine() {
		return this.leftLine;
	}
	bbox(t) {
		if (!t) return this.clone();
		let n = ru(t), r = Math.abs(Math.sin(n)), i = Math.abs(Math.cos(n)), a = this.width * i + this.height * r, o = this.width * r + this.height * i;
		return new e(this.x + (this.width - a) / 2, this.y + (this.height - o) / 2, a, o);
	}
	round(e = 0) {
		return this.x = au(this.x, e), this.y = au(this.y, e), this.width = au(this.width, e), this.height = au(this.height, e), this;
	}
	add(t, n, r, i) {
		let a = e.create(t, n, r, i), o = Math.min(this.x, a.x), s = Math.min(this.y, a.y), c = Math.max(this.x + this.width, a.x + a.width), l = Math.max(this.y + this.height, a.y + a.height);
		return this.x = o, this.y = s, this.width = c - o, this.height = l - s, this;
	}
	update(t, n, r, i) {
		let a = e.create(t, n, r, i);
		return this.x = a.x, this.y = a.y, this.width = a.width, this.height = a.height, this;
	}
	inflate(e, t) {
		let n = e, r = t ?? e;
		return this.x -= n, this.y -= r, this.width += 2 * n, this.height += 2 * r, this;
	}
	snapToGrid(e, t) {
		let n = this.origin.snapToGrid(e, t), r = this.corner.snapToGrid(e, t);
		return this.x = n.x, this.y = n.y, this.width = r.x - n.x, this.height = r.y - n.y, this;
	}
	translate(e, t) {
		let n = z.create(e, t);
		return this.x += n.x, this.y += n.y, this;
	}
	scale(e, t, n = new z()) {
		let r = this.origin.scale(e, t, n);
		return this.x = r.x, this.y = r.y, this.width *= e, this.height *= t, this;
	}
	rotate(t, n = this.getCenter()) {
		if (t !== 0) {
			let r = ru(t), i = Math.cos(r), a = Math.sin(r), o = this.getOrigin(), s = this.getTopRight(), c = this.getBottomRight(), l = this.getBottomLeft();
			o = z.rotateEx(o, i, a, n), s = z.rotateEx(s, i, a, n), c = z.rotateEx(c, i, a, n), l = z.rotateEx(l, i, a, n);
			let u = new e(o.x, o.y, 0, 0);
			u.add(s.x, s.y, 0, 0), u.add(c.x, c.y, 0, 0), u.add(l.x, l.y, 0, 0), this.update(u);
		}
		return this;
	}
	rotate90() {
		let e = (this.width - this.height) / 2;
		this.x += e, this.y -= e;
		let t = this.width;
		return this.width = this.height, this.height = t, this;
	}
	moveAndExpand(t) {
		let n = e.clone(t);
		return this.x += n.x || 0, this.y += n.y || 0, this.width += n.width || 0, this.height += n.height || 0, this;
	}
	getMaxScaleToFit(t, n = this.center) {
		let r = e.clone(t), i = n.x, a = n.y, o = Infinity, s = Infinity, c = Infinity, l = Infinity, u = Infinity, d = Infinity, f = Infinity, p = Infinity, m = r.topLeft;
		m.x < i && (o = (this.x - i) / (m.x - i)), m.y < a && (u = (this.y - a) / (m.y - a));
		let h = r.bottomRight;
		h.x > i && (s = (this.x + this.width - i) / (h.x - i)), h.y > a && (d = (this.y + this.height - a) / (h.y - a));
		let g = r.topRight;
		g.x > i && (c = (this.x + this.width - i) / (g.x - i)), g.y < a && (f = (this.y - a) / (g.y - a));
		let _ = r.bottomLeft;
		return _.x < i && (l = (this.x - i) / (_.x - i)), _.y > a && (p = (this.y + this.height - a) / (_.y - a)), {
			sx: Math.min(o, s, c, l),
			sy: Math.min(u, d, f, p)
		};
	}
	getMaxUniformScaleToFit(e, t = this.center) {
		let n = this.getMaxScaleToFit(e, t);
		return Math.min(n.sx, n.sy);
	}
	containsPoint(e, t) {
		return lu(this, z.create(e, t));
	}
	containsRect(t, n, r, i) {
		let a = e.create(t, n, r, i), o = this.x, s = this.y, c = this.width, l = this.height, u = a.x, d = a.y, f = a.width, p = a.height;
		return c === 0 || l === 0 || f === 0 || p === 0 ? !1 : u >= o && d >= s && u + f <= o + c && d + p <= s + l;
	}
	intersectsWithLine(e) {
		let t = [
			this.topLine,
			this.rightLine,
			this.bottomLine,
			this.leftLine
		], n = [], r = [];
		return t.forEach((t) => {
			let i = e.intersectsWithLine(t);
			i !== null && r.indexOf(i.toString()) < 0 && (n.push(i), r.push(i.toString()));
		}), n.length > 0 ? n : null;
	}
	intersectsWithLineFromCenterToPoint(e, t) {
		let n = z.clone(e), r = this.center, i = null;
		t != null && t !== 0 && n.rotate(t, r);
		let a = [
			this.topLine,
			this.rightLine,
			this.bottomLine,
			this.leftLine
		], o = new V(r, n);
		for (let e = a.length - 1; e >= 0; --e) {
			let t = a[e].intersectsWithLine(o);
			if (t !== null) {
				i = t;
				break;
			}
		}
		return i && t != null && t !== 0 && i.rotate(-t, r), i;
	}
	intersectsWithRect(t, n, r, i) {
		let a = e.create(t, n, r, i);
		if (!this.isIntersectWithRect(a)) return null;
		let o = this.origin, s = this.corner, c = a.origin, l = a.corner, u = Math.max(o.x, c.x), d = Math.max(o.y, c.y);
		return new e(u, d, Math.min(s.x, l.x) - u, Math.min(s.y, l.y) - d);
	}
	isIntersectWithRect(t, n, r, i) {
		let a = e.create(t, n, r, i), o = this.origin, s = this.corner, c = a.origin, l = a.corner;
		return !(l.x <= o.x || l.y <= o.y || c.x >= s.x || c.y >= s.y);
	}
	normalize() {
		let e = this.x, t = this.y, n = this.width, r = this.height;
		return this.width < 0 && (e = this.x + this.width, n = -this.width), this.height < 0 && (t = this.y + this.height, r = -this.height), this.x = e, this.y = t, this.width = n, this.height = r, this;
	}
	union(t) {
		let n = e.clone(t), r = this.origin, i = this.corner, a = n.origin, o = n.corner, s = Math.min(r.x, a.x), c = Math.min(r.y, a.y), l = Math.max(i.x, o.x), u = Math.max(i.y, o.y);
		return new e(s, c, l - s, u - c);
	}
	getNearestSideToPoint(e) {
		let t = z.clone(e), n = t.x - this.x, r = this.x + this.width - t.x, i = t.y - this.y, a = this.y + this.height - t.y, o = n, s = "left";
		return r < o && (o = r, s = "right"), i < o && (o = i, s = "top"), a < o && (s = "bottom"), s;
	}
	getNearestPointToPoint(e) {
		let t = z.clone(e);
		if (this.containsPoint(t)) {
			let e = this.getNearestSideToPoint(t);
			if (e === "left") return new z(this.x, t.y);
			if (e === "top") return new z(t.x, this.y);
			if (e === "right") return new z(this.x + this.width, t.y);
			if (e === "bottom") return new z(t.x, this.y + this.height);
		}
		return t.adhereToRect(this);
	}
	equals(e) {
		return e != null && e.x === this.x && e.y === this.y && e.width === this.width && e.height === this.height;
	}
	clone() {
		return new e(this.x, this.y, this.width, this.height);
	}
	toJSON() {
		return {
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height
		};
	}
	serialize() {
		return `${this.x} ${this.y} ${this.width} ${this.height}`;
	}
}, V = class e extends du {
	static isLine(t) {
		return t != null && t instanceof e;
	}
	get center() {
		return new z((this.start.x + this.end.x) / 2, (this.start.y + this.end.y) / 2);
	}
	constructor(e, t, n, r) {
		super(), typeof e == "number" && typeof t == "number" ? (this.start = new z(e, t), this.end = new z(n, r)) : (this.start = z.create(e), this.end = z.create(t));
	}
	getCenter() {
		return this.center;
	}
	round(e = 0) {
		return this.start.round(e), this.end.round(e), this;
	}
	translate(e, t) {
		return typeof e == "number" ? (this.start.translate(e, t), this.end.translate(e, t)) : (this.start.translate(e), this.end.translate(e)), this;
	}
	rotate(e, t) {
		return this.start.rotate(e, t), this.end.rotate(e, t), this;
	}
	scale(e, t, n) {
		return this.start.scale(e, t, n), this.end.scale(e, t, n), this;
	}
	length() {
		return Math.sqrt(this.squaredLength());
	}
	squaredLength() {
		let e = this.start.x - this.end.x, t = this.start.y - this.end.y;
		return e * e + t * t;
	}
	setLength(e) {
		let t = this.length();
		if (!t) return this;
		let n = e / t;
		return this.scale(n, n, this.start);
	}
	parallel(e) {
		let t = this.clone();
		if (!t.isDifferentiable()) return t;
		let { start: n, end: r } = t, i = n.clone().rotate(270, r), a = r.clone().rotate(90, n);
		return n.move(a, e), r.move(i, e), t;
	}
	vector() {
		return new z(this.end.x - this.start.x, this.end.y - this.start.y);
	}
	angle() {
		let e = new z(this.start.x + 1, this.start.y);
		return this.start.angleBetween(this.end, e);
	}
	bbox() {
		let e = Math.min(this.start.x, this.end.x), t = Math.min(this.start.y, this.end.y), n = Math.max(this.start.x, this.end.x), r = Math.max(this.start.y, this.end.y);
		return new B(e, t, n - e, r - t);
	}
	bearing() {
		return this.start.bearing(this.end);
	}
	closestPoint(e) {
		return this.pointAt(this.closestPointNormalizedLength(e));
	}
	closestPointLength(e) {
		return this.closestPointNormalizedLength(e) * this.length();
	}
	closestPointTangent(e) {
		return this.tangentAt(this.closestPointNormalizedLength(e));
	}
	closestPointNormalizedLength(t) {
		let n = this.vector().dot(new e(this.start, t).vector()), r = Math.min(1, Math.max(0, n / this.squaredLength()));
		return Number.isNaN(r) ? 0 : r;
	}
	pointAt(e) {
		let t = this.start, n = this.end;
		return e <= 0 ? t.clone() : e >= 1 ? n.clone() : t.lerp(n, e);
	}
	pointAtLength(e) {
		let t = this.start, n = this.end, r = !0;
		e < 0 && (r = !1, e = -e);
		let i = this.length();
		if (e >= i) return r ? n.clone() : t.clone();
		let a = (r ? e : i - e) / i;
		return this.pointAt(a);
	}
	divideAt(t) {
		let n = this.pointAt(t);
		return [new e(this.start, n), new e(n, this.end)];
	}
	divideAtLength(t) {
		let n = this.pointAtLength(t);
		return [new e(this.start, n), new e(n, this.end)];
	}
	containsPoint(t) {
		let n = this.start, r = this.end;
		if (n.cross(t, r) !== 0) return !1;
		let i = this.length();
		return !(new e(n, t).length() > i || new e(t, r).length() > i);
	}
	intersect(e, t) {
		let n = e.intersectsWithLine(this, t);
		return n ? Array.isArray(n) ? n : [n] : null;
	}
	intersectsWithLine(e) {
		let t = new z(this.end.x - this.start.x, this.end.y - this.start.y), n = new z(e.end.x - e.start.x, e.end.y - e.start.y), r = t.x * n.y - t.y * n.x, i = new z(e.start.x - this.start.x, e.start.y - this.start.y), a = i.x * n.y - i.y * n.x, o = i.x * t.y - i.y * t.x;
		if (r === 0 || a * r < 0 || o * r < 0) return null;
		if (r > 0) {
			if (a > r || o > r) return null;
		} else if (a < r || o < r) return null;
		return new z(this.start.x + a * t.x / r, this.start.y + a * t.y / r);
	}
	isDifferentiable() {
		return !this.start.equals(this.end);
	}
	pointOffset(e) {
		let t = z.clone(e), n = this.start, r = this.end;
		return ((r.x - n.x) * (t.y - n.y) - (r.y - n.y) * (t.x - n.x)) / this.length();
	}
	pointSquaredDistance(e, t) {
		let n = z.create(e, t);
		return this.closestPoint(n).squaredDistance(n);
	}
	pointDistance(e, t) {
		let n = z.create(e, t);
		return this.closestPoint(n).distance(n);
	}
	tangentAt(t) {
		if (!this.isDifferentiable()) return null;
		let n = this.start, r = this.end, i = this.pointAt(t), a = new e(n, r);
		return a.translate(i.x - n.x, i.y - n.y), a;
	}
	tangentAtLength(t) {
		if (!this.isDifferentiable()) return null;
		let n = this.start, r = this.end, i = this.pointAtLength(t), a = new e(n, r);
		return a.translate(i.x - n.x, i.y - n.y), a;
	}
	relativeCcw(e, t) {
		let n = z.create(e, t), r = n.x - this.start.x, i = n.y - this.start.y, a = this.end.x - this.start.x, o = this.end.y - this.start.y, s = r * o - i * a;
		return s === 0 && (s = r * a + i * o, s > 0 && (r -= a, i -= o, s = r * a + i * o, s < 0 && (s = 0))), s < 0 ? -1 : +(s > 0);
	}
	equals(e) {
		return e != null && this.start.x === e.start.x && this.start.y === e.start.y && this.end.x === e.end.x && this.end.y === e.end.y;
	}
	clone() {
		return new e(this.start, this.end);
	}
	toJSON() {
		return {
			start: this.start.toJSON(),
			end: this.end.toJSON()
		};
	}
	serialize() {
		return [this.start.serialize(), this.end.serialize()].join(" ");
	}
}, fu = class e extends du {
	static isEllipse(t) {
		return t != null && t instanceof e;
	}
	static create(t, n, r, i) {
		return t == null || typeof t == "number" ? new e(t, n, r, i) : e.parse(t);
	}
	static parse(t) {
		return e.isEllipse(t) ? t.clone() : Array.isArray(t) ? new e(t[0], t[1], t[2], t[3]) : new e(t.x, t.y, t.a, t.b);
	}
	static fromRect(t) {
		let n = t.center;
		return new e(n.x, n.y, t.width / 2, t.height / 2);
	}
	get center() {
		return new z(this.x, this.y);
	}
	constructor(e, t, n, r) {
		super(), this.x = e ?? 0, this.y = t ?? 0, this.a = n ?? 0, this.b = r ?? 0;
	}
	bbox() {
		return B.fromEllipse(this);
	}
	getCenter() {
		return this.center;
	}
	inflate(e, t) {
		let n = e, r = t ?? e;
		return this.a += 2 * n, this.b += 2 * r, this;
	}
	normalizedDistance(e, t) {
		let n = z.create(e, t), r = n.x - this.x, i = n.y - this.y, a = this.a, o = this.b;
		return r * r / (a * a) + i * i / (o * o);
	}
	containsPoint(e, t) {
		return this.normalizedDistance(e, t) <= 1;
	}
	intersectsWithLine(e) {
		let t = [], n = this.a, r = this.b, i = e.start, a = e.end, o = e.vector(), s = i.diff(new z(this.x, this.y)), c = new z(o.x / (n * n), o.y / (r * r)), l = new z(s.x / (n * n), s.y / (r * r)), u = o.dot(c), d = o.dot(l), f = s.dot(l) - 1, p = d * d - u * f;
		if (p < 0) return null;
		if (p > 0) {
			let e = Math.sqrt(p), n = (-d - e) / u, r = (-d + e) / u;
			if ((n < 0 || n > 1) && (r < 0 || r > 1)) return null;
			n >= 0 && n <= 1 && t.push(i.lerp(a, n)), r >= 0 && r <= 1 && t.push(i.lerp(a, r));
		} else {
			let e = -d / u;
			if (e >= 0 && e <= 1) t.push(i.lerp(a, e));
			else return null;
		}
		return t;
	}
	intersectsWithLineFromCenterToPoint(e, t = 0) {
		let n = z.clone(e);
		t && n.rotate(t, this.getCenter());
		let r = n.x - this.x, i = n.y - this.y, a;
		if (r === 0) return a = this.bbox().getNearestPointToPoint(n), t ? a.rotate(-t, this.getCenter()) : a;
		let o = i / r, s = o * o, c = this.a * this.a, l = this.b * this.b, u = Math.sqrt(1 / (1 / c + s / l));
		u = r < 0 ? -u : u;
		let d = o * u;
		return a = new z(this.x + u, this.y + d), t ? a.rotate(-t, this.getCenter()) : a;
	}
	tangentTheta(e) {
		let t = z.clone(e), n = t.x, r = t.y, i = this.a, a = this.b, o = this.bbox().center, s = o.x, c = o.y, l = n > o.x + i / 2, u = n < o.x - i / 2, d, f;
		return l || u ? (f = n > o.x ? r - 30 : r + 30, d = i * i / (n - s) - i * i * (r - c) * (f - c) / (a * a * (n - s)) + s) : (d = r > o.y ? n + 30 : n - 30, f = a * a / (r - c) - a * a * (n - s) * (d - s) / (i * i * (r - c)) + c), new z(d, f).theta(t);
	}
	scale(e, t) {
		return this.a *= e, this.b *= t, this;
	}
	rotate(t, n) {
		let r = B.fromEllipse(this);
		r.rotate(t, n);
		let i = e.fromRect(r);
		return this.a = i.a, this.b = i.b, this.x = i.x, this.y = i.y, this;
	}
	translate(e, t) {
		let n = z.create(e, t);
		return this.x += n.x, this.y += n.y, this;
	}
	equals(e) {
		return e != null && e.x === this.x && e.y === this.y && e.a === this.a && e.b === this.b;
	}
	clone() {
		return new e(this.x, this.y, this.a, this.b);
	}
	toJSON() {
		return {
			x: this.x,
			y: this.y,
			a: this.a,
			b: this.b
		};
	}
	serialize() {
		return `${this.x} ${this.y} ${this.a} ${this.b}`;
	}
}, pu = /* @__PURE__ */ RegExp("^[\\s\\dLMCZz,.]*$");
function mu(e) {
	return typeof e == "string" && pu.test(e);
}
function hu(e, t) {
	return (e % t + t) % t;
}
function gu(e, t, n, r, i) {
	if (!e || e.length === 0) return "";
	let a = [], o = e[e.length - 1], s = t != null && t > 0, c = t || 0;
	if (r && s) {
		e = e.slice();
		let t = e[0], n = new z(o.x + (t.x - o.x) / 2, o.y + (t.y - o.y) / 2);
		e.splice(0, 0, n);
	}
	let l = e[0], u = 1;
	for (n ? a.push("M", l.x, l.y) : a.push("L", l.x, l.y); u < (r ? e.length : e.length - 1);) {
		let t = e[hu(u, e.length)], n = l.x - t.x, r = l.y - t.y;
		if (s && (n !== 0 || r !== 0) && (i == null || i.indexOf(u - 1) < 0)) {
			let i = Math.sqrt(n * n + r * r), o = n * Math.min(c, i / 2) / i, s = r * Math.min(c, i / 2) / i, l = t.x + o, d = t.y + s;
			a.push("L", l, d);
			let f = e[hu(u + 1, e.length)];
			for (; u < e.length - 2 && Math.round(f.x - t.x) === 0 && Math.round(f.y - t.y) === 0;) f = e[hu(u + 2, e.length)], u += 1;
			n = f.x - t.x, r = f.y - t.y, i = Math.max(1, Math.sqrt(n * n + r * r));
			let p = n * Math.min(c, i / 2) / i, m = r * Math.min(c, i / 2) / i, h = t.x + p, g = t.y + m;
			a.push("Q", t.x, t.y, h, g), t = new z(h, g);
		} else a.push("L", t.x, t.y);
		l = t, u += 1;
	}
	return r ? a.push("Z") : a.push("L", o.x, o.y), a.map((e) => typeof e == "string" ? e : +e.toFixed(3)).join(" ");
}
function _u(e, t = {}) {
	let n = [];
	return e && e.length && e.forEach((e) => {
		Array.isArray(e) ? n.push({
			x: e[0],
			y: e[1]
		}) : n.push({
			x: e.x,
			y: e.y
		});
	}), gu(n, t.round, t.initialMove == null || t.initialMove, t.close, t.exclude);
}
function vu(e, t, n, r, i = 0, a = 0, o = 0, s, c) {
	if (n === 0 || r === 0) return [];
	s -= e, c -= t, n = Math.abs(n), r = Math.abs(r);
	let l = -s / 2, u = -c / 2, d = Math.cos(i * Math.PI / 180), f = Math.sin(i * Math.PI / 180), p = d * l + f * u, m = -1 * f * l + d * u, h = p * p, g = m * m, _ = n * n, v = r * r, y = h / _ + g / v, b;
	if (y > 1) n = Math.sqrt(y) * n, r = Math.sqrt(y) * r, b = 0;
	else {
		let e = 1;
		a === o && (e = -1), b = e * Math.sqrt((_ * v - _ * g - v * h) / (_ * g + v * h));
	}
	let x = b * n * m / r, S = -1 * b * r * p / n, C = d * x - f * S + s / 2, w = f * x + d * S + c / 2, T = Math.atan2((m - S) / r, (p - x) / n) - Math.atan2(0, 1), E = T >= 0 ? T : 2 * Math.PI + T;
	T = Math.atan2((-m - S) / r, (-p - x) / n) - Math.atan2((m - S) / r, (p - x) / n);
	let D = T >= 0 ? T : 2 * Math.PI + T;
	o === 0 && D > 0 ? D -= 2 * Math.PI : o !== 0 && D < 0 && (D += 2 * Math.PI);
	let O = D * 2 / Math.PI, k = Math.ceil(O < 0 ? -1 * O : O), A = D / k, ee = 8 / 3 * Math.sin(A / 4) * Math.sin(A / 4) / Math.sin(A / 2), te = d * n, ne = d * r, j = f * n, re = f * r, ie = Math.cos(E), ae = Math.sin(E), oe = -ee * (te * ae + re * ie), se = -ee * (j * ae - ne * ie), M = 0, ce = 0, le = [];
	for (let n = 0; n < k; n += 1) {
		E += A, ie = Math.cos(E), ae = Math.sin(E), M = te * ie - re * ae + C, ce = j * ie + ne * ae + w;
		let r = -ee * (te * ae + re * ie), i = -ee * (j * ae - ne * ie), a = n * 6;
		le[a] = Number(oe + e), le[a + 1] = Number(se + t), le[a + 2] = Number(M - r + e), le[a + 3] = Number(ce - i + t), le[a + 4] = Number(M + e), le[a + 5] = Number(ce + t), oe = M + r, se = ce + i;
	}
	return le.map((e) => +e.toFixed(2));
}
// node_modules/@antv/x6/es/geometry/polyline.js
var yu = class e extends du {
	static isPolyline(t) {
		return t != null && t instanceof e;
	}
	static parse(t) {
		let n = t.trim();
		if (n === "") return new e();
		let r = [], i = n.split(/\s*,\s*|\s+/);
		for (let e = 0, t = i.length; e < t; e += 2) r.push({
			x: +i[e],
			y: +i[e + 1]
		});
		return new e(r);
	}
	get start() {
		return this.points[0] || null;
	}
	get end() {
		return this.points[this.points.length - 1] || null;
	}
	constructor(t) {
		if (super(), t != null) {
			if (typeof t == "string") return e.parse(t);
			this.points = t.map((e) => z.create(e));
		} else this.points = [];
	}
	scale(e, t, n = new z()) {
		return this.points.forEach((r) => r.scale(e, t, n)), this;
	}
	rotate(e, t) {
		return this.points.forEach((n) => n.rotate(e, t)), this;
	}
	translate(e, t) {
		let n = z.create(e, t);
		return this.points.forEach((e) => e.translate(n.x, n.y)), this;
	}
	round(e = 0) {
		return this.points.forEach((t) => t.round(e)), this;
	}
	bbox() {
		if (this.points.length === 0) return new B();
		let e = Infinity, t = -Infinity, n = Infinity, r = -Infinity, i = this.points;
		for (let a = 0, o = i.length; a < o; a += 1) {
			let o = i[a], s = o.x, c = o.y;
			s < e && (e = s), s > t && (t = s), c < n && (n = c), c > r && (r = c);
		}
		return new B(e, n, t - e, r - n);
	}
	closestPoint(e) {
		let t = this.closestPointLength(e);
		return this.pointAtLength(t);
	}
	closestPointLength(e) {
		let t = this.points, n = t.length;
		if (n === 0 || n === 1) return 0;
		let r = 0, i = 0, a = Infinity;
		for (let o = 0, s = n - 1; o < s; o += 1) {
			let n = new V(t[o], t[o + 1]), s = n.length(), c = n.closestPointNormalizedLength(e), l = n.pointAt(c).squaredDistance(e);
			l < a && (a = l, i = r + c * s), r += s;
		}
		return i;
	}
	closestPointNormalizedLength(e) {
		let t = this.length();
		return t === 0 ? 0 : this.closestPointLength(e) / t;
	}
	closestPointTangent(e) {
		let t = this.closestPointLength(e);
		return this.tangentAtLength(t);
	}
	containsPoint(e) {
		if (this.points.length === 0) return !1;
		let t = z.clone(e), n = t.x, r = t.y, i = this.points, a = i.length, o = a - 1, s = 0;
		for (let c = 0; c < a; c += 1) {
			let a = i[o], l = i[c];
			if (t.equals(a)) return !0;
			let u = new V(a, l);
			if (u.containsPoint(e)) return !0;
			if (r <= a.y && r > l.y || r > a.y && r <= l.y) {
				let t = a.x - n > l.x - n ? a.x - n : l.x - n;
				if (t >= 0) {
					let i = new V(e, new z(n + t, r));
					u.intersectsWithLine(i) && (s += 1);
				}
			}
			o = c;
		}
		return s % 2 == 1;
	}
	intersectsWithLine(e) {
		let t = [];
		for (let n = 0, r = this.points.length - 1; n < r; n += 1) {
			let r = this.points[n], i = this.points[n + 1], a = e.intersectsWithLine(new V(r, i));
			a && t.push(a);
		}
		return t.length > 0 ? t : null;
	}
	isDifferentiable() {
		for (let e = 0, t = this.points.length - 1; e < t; e += 1) {
			let t = this.points[e], n = this.points[e + 1];
			if (new V(t, n).isDifferentiable()) return !0;
		}
		return !1;
	}
	length() {
		let e = 0;
		for (let t = 0, n = this.points.length - 1; t < n; t += 1) {
			let n = this.points[t], r = this.points[t + 1];
			e += n.distance(r);
		}
		return e;
	}
	pointAt(e) {
		let t = this.points, n = t.length;
		if (n === 0) return null;
		if (n === 1 || e <= 0) return t[0].clone();
		if (e >= 1) return t[n - 1].clone();
		let r = this.length() * e;
		return this.pointAtLength(r);
	}
	pointAtLength(e) {
		let t = this.points, n = t.length;
		if (n === 0) return null;
		if (n === 1) return t[0].clone();
		let r = !0;
		e < 0 && (r = !1, e = -e);
		let i = 0;
		for (let a = 0, o = n - 1; a < o; a += 1) {
			let n = r ? a : o - 1 - a, s = t[n], c = t[n + 1], l = new V(s, c), u = s.distance(c);
			if (e <= i + u) return l.pointAtLength((r ? 1 : -1) * (e - i));
			i += u;
		}
		return (r ? t[n - 1] : t[0]).clone();
	}
	tangentAt(e) {
		let t = this.points.length;
		if (t === 0 || t === 1) return null;
		e < 0 && (e = 0), e > 1 && (e = 1);
		let n = this.length() * e;
		return this.tangentAtLength(n);
	}
	tangentAtLength(e) {
		let t = this.points, n = t.length;
		if (n === 0 || n === 1) return null;
		let r = !0;
		e < 0 && (r = !1, e = -e);
		let i, a = 0;
		for (let o = 0, s = n - 1; o < s; o += 1) {
			let n = r ? o : s - 1 - o, c = t[n], l = t[n + 1], u = new V(c, l), d = c.distance(l);
			if (u.isDifferentiable()) {
				if (e <= a + d) return u.tangentAtLength((r ? 1 : -1) * (e - a));
				i = u;
			}
			a += d;
		}
		if (i) {
			let e = +!!r;
			return i.tangentAt(e);
		}
		return null;
	}
	simplify(e = {}) {
		let t = this.points;
		if (t.length < 3) return this;
		let n = e.threshold || 0, r = 0;
		for (; t[r + 2];) {
			let e = r, i = r + 1, a = r + 2, o = t[e], s = t[i], c = t[a];
			new V(o, c).closestPoint(s).distance(s) <= n ? t.splice(i, 1) : r += 1;
		}
		return this;
	}
	toHull() {
		let t = this.points, n = t.length;
		if (n === 0) return new e();
		let r = t[0];
		for (let e = 1; e < n; e += 1) (t[e].y < r.y || t[e].y === r.y && t[e].x > r.x) && (r = t[e]);
		let i = [];
		for (let e = 0; e < n; e += 1) {
			let n = r.theta(t[e]);
			n === 0 && (n = 360), i.push([
				t[e],
				e,
				n
			]);
		}
		if (i.sort((e, t) => {
			let n = e[2] - t[2];
			return n === 0 && (n = t[1] - e[1]), n;
		}), i.length > 2) {
			let e = i[i.length - 1];
			i.unshift(e);
		}
		let a = {}, o = [], s = (e) => `${e[0].toString()}@${e[1]}`;
		for (; i.length !== 0;) {
			let e = i.pop(), t = e[0];
			if (a[s(e)]) continue;
			let n = !1;
			for (; !n;) if (o.length < 2) o.push(e), n = !0;
			else {
				let r = o.pop(), c = r[0], l = o.pop(), u = l[0], d = u.cross(c, t);
				if (d < 0) o.push(l), o.push(r), o.push(e), n = !0;
				else if (d === 0) {
					let e = 1e-10, n = c.angleBetween(u, t);
					Math.abs(n - 180) < e || c.equals(t) || u.equals(c) ? (a[s(r)] = c, o.push(l)) : Math.abs((n + 1) % 360 - 1) < e && (o.push(l), i.push(r));
				} else a[s(r)] = c, o.push(l);
			}
		}
		o.length > 2 && o.pop();
		let c, l = -1;
		for (let e = 0, t = o.length; e < t; e += 1) {
			let t = o[e][1];
			(c === void 0 || t < c) && (c = t, l = e);
		}
		let u = [];
		if (l > 0) {
			let e = o.slice(l), t = o.slice(0, l);
			u = e.concat(t);
		} else u = o;
		let d = [];
		for (let e = 0, t = u.length; e < t; e += 1) d.push(u[e][0]);
		return new e(d);
	}
	equals(e) {
		return e == null || e.points.length !== this.points.length ? !1 : e.points.every((e, t) => e.equals(this.points[t]));
	}
	clone() {
		return new e(this.points.map((e) => e.clone()));
	}
	toJSON() {
		return this.points.map((e) => e.toJSON());
	}
	serialize() {
		return this.points.map((e) => `${e.serialize()}`).join(" ");
	}
}, bu = class e extends du {
	static isCurve(t) {
		return t != null && t instanceof e;
	}
	static throughPoints(t) {
		if (t == null || Array.isArray(t) && t.length < 2) throw Error("At least 2 points are required");
		let n = Su(t), r = [];
		for (let i = 0, a = n[0].length; i < a; i += 1) {
			let a = new z(n[0][i].x, n[0][i].y), o = new z(n[1][i].x, n[1][i].y);
			r.push(new e(t[i], a, o, t[i + 1]));
		}
		return r;
	}
	constructor(e, t, n, r) {
		super(), this.PRECISION = 3, this.start = z.create(e), this.controlPoint1 = z.create(t), this.controlPoint2 = z.create(n), this.end = z.create(r);
	}
	bbox() {
		let e = this.start, t = this.controlPoint1, n = this.controlPoint2, r = this.end, i = e.x, a = e.y, o = t.x, s = t.y, c = n.x, l = n.y, u = r.x, d = r.y, f = [], p = [], m = [[], []], h, g, _, v, y, b, x, S;
		for (let e = 0; e < 2; e += 1) if (e === 0 ? (g = 6 * i - 12 * o + 6 * c, h = -3 * i + 9 * o - 9 * c + 3 * u, _ = 3 * o - 3 * i) : (g = 6 * a - 12 * s + 6 * l, h = -3 * a + 9 * s - 9 * l + 3 * d, _ = 3 * s - 3 * a), Math.abs(h) < 1e-12) {
			if (Math.abs(g) < 1e-12) continue;
			v = -_ / g, v > 0 && v < 1 && p.push(v);
		} else x = g * g - 4 * _ * h, S = Math.sqrt(x), !(x < 0) && (y = (-g + S) / (2 * h), y > 0 && y < 1 && p.push(y), b = (-g - S) / (2 * h), b > 0 && b < 1 && p.push(b));
		let C, w, T, E = p.length, D = E;
		for (; E;) --E, v = p[E], T = 1 - v, C = T * T * T * i + 3 * T * T * v * o + 3 * T * v * v * c + v * v * v * u, m[0][E] = C, w = T * T * T * a + 3 * T * T * v * s + 3 * T * v * v * l + v * v * v * d, m[1][E] = w, f[E] = {
			X: C,
			Y: w
		};
		p[D] = 0, p[D + 1] = 1, f[D] = {
			X: i,
			Y: a
		}, f[D + 1] = {
			X: u,
			Y: d
		}, m[0][D] = i, m[1][D] = a, m[0][D + 1] = u, m[1][D + 1] = d, p.length = D + 2, m[0].length = D + 2, m[1].length = D + 2, f.length = D + 2;
		let O = Math.min.apply(null, m[0]), k = Math.min.apply(null, m[1]), A = Math.max.apply(null, m[0]), ee = Math.max.apply(null, m[1]);
		return new B(O, k, A - O, ee - k);
	}
	closestPoint(e, t = {}) {
		return this.pointAtT(this.closestPointT(e, t));
	}
	closestPointLength(e, t = {}) {
		let n = this.getOptions(t);
		return this.lengthAtT(this.closestPointT(e, n), n);
	}
	closestPointNormalizedLength(e, t = {}) {
		let n = this.getOptions(t), r = this.closestPointLength(e, n);
		if (!r) return 0;
		let i = this.length(n);
		return i === 0 ? 0 : r / i;
	}
	closestPointT(e, t = {}) {
		let n = this.getPrecision(t), r = this.getDivisions(t), i = 10 ** -n, a = null, o = 0, s = 0, c = 0, l = 0, u = 0, d = null, f = r.length, p = f > 0 ? 1 / f : 0;
		for (r.forEach((t, n) => {
			let r = t.start.distance(e), i = t.end.distance(e), f = r + i;
			(d == null || f < d) && (a = t, o = n * p, s = (n + 1) * p, c = r, l = i, d = f, u = t.endpointDistance());
		});;) {
			let t = c ? Math.abs(c - l) / c : 0, n = l == null ? 0 : Math.abs(c - l) / l, r = t < i || n < i, d = !c || c < u * i, f = !l || l < u * i;
			if (r || d || f) return c <= l ? o : s;
			let m = a.divide(.5);
			p /= 2;
			let h = m[0].start.distance(e), g = m[0].end.distance(e), _ = h + g, v = m[1].start.distance(e), y = m[1].end.distance(e);
			_ <= v + y ? (a = m[0], s -= p, c = h, l = g) : (a = m[1], o += p, c = v, l = y);
		}
	}
	closestPointTangent(e, t = {}) {
		return this.tangentAtT(this.closestPointT(e, t));
	}
	containsPoint(e, t = {}) {
		return this.toPolyline(t).containsPoint(e);
	}
	divideAt(e, t = {}) {
		if (e <= 0) return this.divideAtT(0);
		if (e >= 1) return this.divideAtT(1);
		let n = this.tAt(e, t);
		return this.divideAtT(n);
	}
	divideAtLength(e, t = {}) {
		let n = this.tAtLength(e, t);
		return this.divideAtT(n);
	}
	divide(e) {
		return this.divideAtT(e);
	}
	divideAtT(t) {
		let n = this.start, r = this.controlPoint1, i = this.controlPoint2, a = this.end;
		if (t <= 0) return [new e(n, n, n, n), new e(n, r, i, a)];
		if (t >= 1) return [new e(n, r, i, a), new e(a, a, a, a)];
		let o = this.getSkeletonPoints(t), s = o.startControlPoint1, c = o.startControlPoint2, l = o.divider, u = o.dividerControlPoint1, d = o.dividerControlPoint2;
		return [new e(n, s, c, l), new e(l, u, d, a)];
	}
	endpointDistance() {
		return this.start.distance(this.end);
	}
	getSkeletonPoints(e) {
		let t = this.start, n = this.controlPoint1, r = this.controlPoint2, i = this.end;
		if (e <= 0) return {
			startControlPoint1: t.clone(),
			startControlPoint2: t.clone(),
			divider: t.clone(),
			dividerControlPoint1: n.clone(),
			dividerControlPoint2: r.clone()
		};
		if (e >= 1) return {
			startControlPoint1: n.clone(),
			startControlPoint2: r.clone(),
			divider: i.clone(),
			dividerControlPoint1: i.clone(),
			dividerControlPoint2: i.clone()
		};
		let a = new V(t, n).pointAt(e), o = new V(n, r).pointAt(e), s = new V(r, i).pointAt(e), c = new V(a, o).pointAt(e), l = new V(o, s).pointAt(e);
		return {
			startControlPoint1: a,
			startControlPoint2: c,
			divider: new V(c, l).pointAt(e),
			dividerControlPoint1: l,
			dividerControlPoint2: s
		};
	}
	getSubdivisions(t = {}) {
		let n = this.getPrecision(t), r = [new e(this.start, this.controlPoint1, this.controlPoint2, this.end)];
		if (n === 0) return r;
		let i = this.endpointDistance(), a = 10 ** -n, o = 0;
		for (;;) {
			o += 1;
			let e = [];
			r.forEach((t) => {
				let n = t.divide(.5);
				e.push(n[0], n[1]);
			});
			let t = e.reduce((e, t) => e + t.endpointDistance(), 0), n = t === 0 ? 0 : (t - i) / t;
			if (o > 1 && n < a) return e;
			r = e, i = t;
		}
	}
	length(e = {}) {
		return this.getDivisions(e).reduce((e, t) => e + t.endpointDistance(), 0);
	}
	lengthAtT(e, t = {}) {
		if (e <= 0) return 0;
		let n = t.precision === void 0 ? this.PRECISION : t.precision;
		return this.divide(e)[0].length({ precision: n });
	}
	pointAt(e, t = {}) {
		if (e <= 0) return this.start.clone();
		if (e >= 1) return this.end.clone();
		let n = this.tAt(e, t);
		return this.pointAtT(n);
	}
	pointAtLength(e, t = {}) {
		let n = this.tAtLength(e, t);
		return this.pointAtT(n);
	}
	pointAtT(e) {
		return e <= 0 ? this.start.clone() : e >= 1 ? this.end.clone() : this.getSkeletonPoints(e).divider;
	}
	isDifferentiable() {
		let e = this.start, t = this.controlPoint1, n = this.controlPoint2, r = this.end;
		return !(e.equals(t) && t.equals(n) && n.equals(r));
	}
	tangentAt(e, t = {}) {
		if (!this.isDifferentiable()) return null;
		e < 0 ? e = 0 : e > 1 && (e = 1);
		let n = this.tAt(e, t);
		return this.tangentAtT(n);
	}
	tangentAtLength(e, t = {}) {
		if (!this.isDifferentiable()) return null;
		let n = this.tAtLength(e, t);
		return this.tangentAtT(n);
	}
	tangentAtT(e) {
		if (!this.isDifferentiable()) return null;
		e < 0 && (e = 0), e > 1 && (e = 1);
		let t = this.getSkeletonPoints(e), n = t.startControlPoint2, r = t.dividerControlPoint1, i = t.divider, a = new V(n, r);
		return a.translate(i.x - n.x, i.y - n.y), a;
	}
	getPrecision(e = {}) {
		return e.precision == null ? this.PRECISION : e.precision;
	}
	getDivisions(e = {}) {
		if (e.subdivisions != null) return e.subdivisions;
		let t = this.getPrecision(e);
		return this.getSubdivisions({ precision: t });
	}
	getOptions(e = {}) {
		return {
			precision: this.getPrecision(e),
			subdivisions: this.getDivisions(e)
		};
	}
	tAt(e, t = {}) {
		if (e <= 0) return 0;
		if (e >= 1) return 1;
		let n = this.getOptions(t), r = this.length(n) * e;
		return this.tAtLength(r, n);
	}
	tAtLength(e, t = {}) {
		let n = !0;
		e < 0 && (n = !1, e = -e);
		let r = this.getPrecision(t), i = this.getDivisions(t), a = {
			precision: r,
			subdivisions: i
		}, o = null, s, c, l = 0, u = 0, d = 0, f = i.length, p = f > 0 ? 1 / f : 0;
		for (let t = 0; t < f; t += 1) {
			let r = n ? t : f - 1 - t, a = i[t], m = a.endpointDistance();
			if (e <= d + m) {
				o = a, s = r * p, c = (r + 1) * p, l = n ? e - d : m + d - e, u = n ? m + d - e : e - d;
				break;
			}
			d += m;
		}
		if (o == null) return +!!n;
		let m = this.length(a), h = 10 ** -r;
		for (;;) {
			let e;
			if (e = m === 0 ? 0 : l / m, e < h) return s;
			if (e = m === 0 ? 0 : u / m, e < h) return c;
			let t, n, r = o.divide(.5);
			p /= 2;
			let i = r[0].endpointDistance(), a = r[1].endpointDistance();
			l <= i ? (o = r[0], c -= p, t = l, n = i - t) : (o = r[1], s += p, t = l - i, n = a - t), l = t, u = n;
		}
	}
	toPoints(e = {}) {
		let t = this.getDivisions(e), n = [t[0].start.clone()];
		return t.forEach((e) => n.push(e.end.clone())), n;
	}
	toPolyline(e = {}) {
		return new yu(this.toPoints(e));
	}
	scale(e, t, n) {
		return this.start.scale(e, t, n), this.controlPoint1.scale(e, t, n), this.controlPoint2.scale(e, t, n), this.end.scale(e, t, n), this;
	}
	rotate(e, t) {
		return this.start.rotate(e, t), this.controlPoint1.rotate(e, t), this.controlPoint2.rotate(e, t), this.end.rotate(e, t), this;
	}
	translate(e, t) {
		return typeof e == "number" ? (this.start.translate(e, t), this.controlPoint1.translate(e, t), this.controlPoint2.translate(e, t), this.end.translate(e, t)) : (this.start.translate(e), this.controlPoint1.translate(e), this.controlPoint2.translate(e), this.end.translate(e)), this;
	}
	equals(e) {
		return e != null && this.start.equals(e.start) && this.controlPoint1.equals(e.controlPoint1) && this.controlPoint2.equals(e.controlPoint2) && this.end.equals(e.end);
	}
	clone() {
		return new e(this.start, this.controlPoint1, this.controlPoint2, this.end);
	}
	toJSON() {
		return {
			start: this.start.toJSON(),
			controlPoint1: this.controlPoint1.toJSON(),
			controlPoint2: this.controlPoint2.toJSON(),
			end: this.end.toJSON()
		};
	}
	serialize() {
		return [
			this.start.serialize(),
			this.controlPoint1.serialize(),
			this.controlPoint2.serialize(),
			this.end.serialize()
		].join(" ");
	}
};
function xu(e) {
	let t = e.length, n = [], r = [], i = 2;
	n[0] = e[0] / i;
	for (let a = 1; a < t; a += 1) r[a] = 1 / i, i = (a < t - 1 ? 4 : 3.5) - r[a], n[a] = (e[a] - n[a - 1]) / i;
	for (let e = 1; e < t; e += 1) n[t - e - 1] -= r[t - e] * n[t - e];
	return n;
}
function Su(e) {
	let t = e.map((e) => z.clone(e)), n = [], r = [], i = t.length - 1;
	if (i === 1) return n[0] = new z((2 * t[0].x + t[1].x) / 3, (2 * t[0].y + t[1].y) / 3), r[0] = new z(2 * n[0].x - t[0].x, 2 * n[0].y - t[0].y), [n, r];
	let a = [];
	for (let e = 1; e < i - 1; e += 1) a[e] = 4 * t[e].x + 2 * t[e + 1].x;
	a[0] = t[0].x + 2 * t[1].x, a[i - 1] = (8 * t[i - 1].x + t[i].x) / 2;
	let o = xu(a);
	for (let e = 1; e < i - 1; e += 1) a[e] = 4 * t[e].y + 2 * t[e + 1].y;
	a[0] = t[0].y + 2 * t[1].y, a[i - 1] = (8 * t[i - 1].y + t[i].y) / 2;
	let s = xu(a);
	for (let e = 0; e < i; e += 1) n.push(new z(o[e], s[e])), e < i - 1 ? r.push(new z(2 * t[e + 1].x - o[e + 1], 2 * t[e + 1].y - s[e + 1])) : r.push(new z((t[i].x + o[i - 1]) / 2, (t[i].y + s[i - 1]) / 2));
	return [n, r];
}
// node_modules/@antv/x6/es/geometry/path/segment.js
var Cu = class extends du {
	constructor() {
		super(...arguments), this.isVisible = !0, this.isSegment = !0, this.isSubpathStart = !1;
	}
	get end() {
		return this.endPoint;
	}
	get start() {
		if (this.previousSegment == null) throw Error("Missing previous segment. (This segment cannot be the first segment of a path, or segment has not yet been added to a path.)");
		return this.previousSegment.end;
	}
	closestPointT(e, t) {
		if (this.closestPointNormalizedLength) return this.closestPointNormalizedLength(e);
		throw Error("Neither `closestPointT` nor `closestPointNormalizedLength` method is implemented.");
	}
	lengthAtT(e, t) {
		if (e <= 0) return 0;
		let n = this.length();
		return e >= 1 ? n : n * e;
	}
	divideAtT(e) {
		if (this.divideAt) return this.divideAt(e);
		throw Error("Neither `divideAtT` nor `divideAt` method is implemented.");
	}
	pointAtT(e) {
		if (this.pointAt) return this.pointAt(e);
		throw Error("Neither `pointAtT` nor `pointAt` method is implemented.");
	}
	tangentAtT(e) {
		if (this.tangentAt) return this.tangentAt(e);
		throw Error("Neither `tangentAtT` nor `tangentAt` method is implemented.");
	}
}, wu = class e extends Cu {
	static create(...t) {
		let n = t.length, r = t[0];
		if (V.isLine(r)) return new e(r);
		if (z.isPointLike(r)) return n === 1 ? new e(r) : t.map((t) => new e(t));
		if (n === 2) return new e(+t[0], +t[1]);
		let i = [];
		for (let r = 0; r < n; r += 2) {
			let n = +t[r], a = +t[r + 1];
			i.push(new e(n, a));
		}
		return i;
	}
	constructor(e, t) {
		super(), this.endPoint = V.isLine(e) ? e.end.clone().round(2) : z.create(e, t).round(2);
	}
	get type() {
		return "L";
	}
	get line() {
		return new V(this.start, this.end);
	}
	bbox() {
		return this.line.bbox();
	}
	closestPoint(e) {
		return this.line.closestPoint(e);
	}
	closestPointLength(e) {
		return this.line.closestPointLength(e);
	}
	closestPointNormalizedLength(e) {
		return this.line.closestPointNormalizedLength(e);
	}
	closestPointTangent(e) {
		return this.line.closestPointTangent(e);
	}
	length() {
		return this.line.length();
	}
	divideAt(t) {
		let n = this.line.divideAt(t);
		return [new e(n[0]), new e(n[1])];
	}
	divideAtLength(t) {
		let n = this.line.divideAtLength(t);
		return [new e(n[0]), new e(n[1])];
	}
	getSubdivisions() {
		return [];
	}
	pointAt(e) {
		return this.line.pointAt(e);
	}
	pointAtLength(e) {
		return this.line.pointAtLength(e);
	}
	tangentAt(e) {
		return this.line.tangentAt(e);
	}
	tangentAtLength(e) {
		return this.line.tangentAtLength(e);
	}
	isDifferentiable() {
		return this.previousSegment != null && !this.start.equals(this.end);
	}
	clone() {
		return new e(this.end);
	}
	scale(e, t, n) {
		return this.end.scale(e, t, n), this;
	}
	rotate(e, t) {
		return this.end.rotate(e, t), this;
	}
	translate(e, t) {
		return typeof e == "number" ? this.end.translate(e, t) : this.end.translate(e), this;
	}
	equals(e) {
		return this.type === e.type && this.start.equals(e.start) && this.end.equals(e.end);
	}
	toJSON() {
		return {
			type: this.type,
			start: this.start.toJSON(),
			end: this.end.toJSON()
		};
	}
	serialize() {
		let e = this.end;
		return `${this.type} ${e.x} ${e.y}`;
	}
}, Tu = class e extends Cu {
	static create() {
		return new e();
	}
	get end() {
		if (!this.subpathStartSegment) throw Error("Missing subpath start segment. (This segment needs a subpath start segment (e.g. MoveTo), or segment has not yet been added to a path.)");
		return this.subpathStartSegment.end;
	}
	get type() {
		return "Z";
	}
	get line() {
		return new V(this.start, this.end);
	}
	bbox() {
		return this.line.bbox();
	}
	closestPoint(e) {
		return this.line.closestPoint(e);
	}
	closestPointLength(e) {
		return this.line.closestPointLength(e);
	}
	closestPointNormalizedLength(e) {
		return this.line.closestPointNormalizedLength(e);
	}
	closestPointTangent(e) {
		return this.line.closestPointTangent(e);
	}
	length() {
		return this.line.length();
	}
	divideAt(e) {
		let t = this.line.divideAt(e);
		return [t[1].isDifferentiable() ? new wu(t[0]) : this.clone(), new wu(t[1])];
	}
	divideAtLength(e) {
		let t = this.line.divideAtLength(e);
		return [t[1].isDifferentiable() ? new wu(t[0]) : this.clone(), new wu(t[1])];
	}
	getSubdivisions() {
		return [];
	}
	pointAt(e) {
		return this.line.pointAt(e);
	}
	pointAtLength(e) {
		return this.line.pointAtLength(e);
	}
	tangentAt(e) {
		return this.line.tangentAt(e);
	}
	tangentAtLength(e) {
		return this.line.tangentAtLength(e);
	}
	isDifferentiable() {
		return !this.previousSegment || !this.subpathStartSegment ? !1 : !this.start.equals(this.end);
	}
	scale() {
		return this;
	}
	rotate() {
		return this;
	}
	translate() {
		return this;
	}
	equals(e) {
		return this.type === e.type && this.start.equals(e.start) && this.end.equals(e.end);
	}
	clone() {
		return new e();
	}
	toJSON() {
		return {
			type: this.type,
			start: this.start.toJSON(),
			end: this.end.toJSON()
		};
	}
	serialize() {
		return this.type;
	}
}, Eu = class e extends Cu {
	static create(...t) {
		let n = t.length, r = t[0];
		if (V.isLine(r) || bu.isCurve(r)) return new e(r);
		if (z.isPointLike(r)) {
			if (n === 1) return new e(r);
			let i = [];
			for (let r = 0; r < n; r += 1) r === 0 ? i.push(new e(t[r])) : i.push(new wu(t[r]));
			return i;
		}
		if (n === 2) return new e(+t[0], +t[1]);
		let i = [];
		for (let r = 0; r < n; r += 2) {
			let n = +t[r], a = +t[r + 1];
			r === 0 ? i.push(new e(n, a)) : i.push(new wu(n, a));
		}
		return i;
	}
	constructor(e, t) {
		super(), this.isVisible = !1, this.isSubpathStart = !0, this.endPoint = V.isLine(e) || bu.isCurve(e) ? e.end.clone().round(2) : z.create(e, t).round(2);
	}
	get start() {
		throw Error("Illegal access. Moveto segments should not need a start property.");
	}
	get type() {
		return "M";
	}
	bbox() {
		return null;
	}
	closestPoint() {
		return this.end.clone();
	}
	closestPointLength() {
		return 0;
	}
	closestPointNormalizedLength() {
		return 0;
	}
	closestPointT() {
		return 1;
	}
	closestPointTangent() {
		return null;
	}
	length() {
		return 0;
	}
	lengthAtT() {
		return 0;
	}
	divideAt() {
		return [this.clone(), this.clone()];
	}
	divideAtLength() {
		return [this.clone(), this.clone()];
	}
	getSubdivisions() {
		return [];
	}
	pointAt() {
		return this.end.clone();
	}
	pointAtLength() {
		return this.end.clone();
	}
	pointAtT() {
		return this.end.clone();
	}
	tangentAt() {
		return null;
	}
	tangentAtLength() {
		return null;
	}
	tangentAtT() {
		return null;
	}
	isDifferentiable() {
		return !1;
	}
	scale(e, t, n) {
		return this.end.scale(e, t, n), this;
	}
	rotate(e, t) {
		return this.end.rotate(e, t), this;
	}
	translate(e, t) {
		return typeof e == "number" ? this.end.translate(e, t) : this.end.translate(e), this;
	}
	clone() {
		return new e(this.end);
	}
	equals(e) {
		return this.type === e.type && this.end.equals(e.end);
	}
	toJSON() {
		return {
			type: this.type,
			end: this.end.toJSON()
		};
	}
	serialize() {
		let e = this.end;
		return `${this.type} ${e.x} ${e.y}`;
	}
}, Du = class e extends Cu {
	static create(...t) {
		let n = t.length, r = t[0];
		if (bu.isCurve(r)) return new e(r);
		if (z.isPointLike(r)) {
			if (n === 3) return new e(t[0], t[1], t[2]);
			let r = [];
			for (let i = 0; i < n; i += 3) r.push(new e(t[i], t[i + 1], t[i + 2]));
			return r;
		}
		if (n === 6) return new e(t[0], t[1], t[2], t[3], t[4], t[5]);
		let i = [];
		for (let r = 0; r < n; r += 6) i.push(new e(t[r], t[r + 1], t[r + 2], t[r + 3], t[r + 4], t[r + 5]));
		return i;
	}
	constructor(e, t, n, r, i, a) {
		super(), bu.isCurve(e) ? (this.controlPoint1 = e.controlPoint1.clone().round(2), this.controlPoint2 = e.controlPoint2.clone().round(2), this.endPoint = e.end.clone().round(2)) : typeof e == "number" ? (this.controlPoint1 = new z(e, t).round(2), this.controlPoint2 = new z(n, r).round(2), this.endPoint = new z(i, a).round(2)) : (this.controlPoint1 = z.create(e).round(2), this.controlPoint2 = z.create(t).round(2), this.endPoint = z.create(n).round(2));
	}
	get type() {
		return "C";
	}
	get curve() {
		return new bu(this.start, this.controlPoint1, this.controlPoint2, this.end);
	}
	bbox() {
		return this.curve.bbox();
	}
	closestPoint(e) {
		return this.curve.closestPoint(e);
	}
	closestPointLength(e) {
		return this.curve.closestPointLength(e);
	}
	closestPointNormalizedLength(e) {
		return this.curve.closestPointNormalizedLength(e);
	}
	closestPointTangent(e) {
		return this.curve.closestPointTangent(e);
	}
	length() {
		return this.curve.length();
	}
	divideAt(t, n = {}) {
		let r = this.curve.divideAt(t, n);
		return [new e(r[0]), new e(r[1])];
	}
	divideAtLength(t, n = {}) {
		let r = this.curve.divideAtLength(t, n);
		return [new e(r[0]), new e(r[1])];
	}
	divideAtT(t) {
		let n = this.curve.divideAtT(t);
		return [new e(n[0]), new e(n[1])];
	}
	getSubdivisions() {
		return [];
	}
	pointAt(e) {
		return this.curve.pointAt(e);
	}
	pointAtLength(e) {
		return this.curve.pointAtLength(e);
	}
	tangentAt(e) {
		return this.curve.tangentAt(e);
	}
	tangentAtLength(e) {
		return this.curve.tangentAtLength(e);
	}
	isDifferentiable() {
		if (!this.previousSegment) return !1;
		let e = this.start, t = this.controlPoint1, n = this.controlPoint2, r = this.end;
		return !(e.equals(t) && t.equals(n) && n.equals(r));
	}
	scale(e, t, n) {
		return this.controlPoint1.scale(e, t, n), this.controlPoint2.scale(e, t, n), this.end.scale(e, t, n), this;
	}
	rotate(e, t) {
		return this.controlPoint1.rotate(e, t), this.controlPoint2.rotate(e, t), this.end.rotate(e, t), this;
	}
	translate(e, t) {
		return typeof e == "number" ? (this.controlPoint1.translate(e, t), this.controlPoint2.translate(e, t), this.end.translate(e, t)) : (this.controlPoint1.translate(e), this.controlPoint2.translate(e), this.end.translate(e)), this;
	}
	equals(e) {
		return this.start.equals(e.start) && this.end.equals(e.end) && this.controlPoint1.equals(e.controlPoint1) && this.controlPoint2.equals(e.controlPoint2);
	}
	clone() {
		return new e(this.controlPoint1, this.controlPoint2, this.end);
	}
	toJSON() {
		return {
			type: this.type,
			start: this.start.toJSON(),
			controlPoint1: this.controlPoint1.toJSON(),
			controlPoint2: this.controlPoint2.toJSON(),
			end: this.end.toJSON()
		};
	}
	serialize() {
		let e = this.controlPoint1, t = this.controlPoint2, n = this.end;
		return [
			this.type,
			e.x,
			e.y,
			t.x,
			t.y,
			n.x,
			n.y
		].join(" ");
	}
};
// node_modules/@antv/x6/es/geometry/path/normalize.js
function Ou(e, t, n) {
	return {
		x: e * Math.cos(n) - t * Math.sin(n),
		y: e * Math.sin(n) + t * Math.cos(n)
	};
}
function ku(e, t, n, r, i, a) {
	let o = 1 / 3, s = 2 / 3;
	return [
		o * e + s * n,
		o * t + s * r,
		o * i + s * n,
		o * a + s * r,
		i,
		a
	];
}
function Au(e, t, n, r, i, a, o, s, c, l) {
	let u = Math.PI * 120 / 180, d = Math.PI / 180 * (+i || 0), f = [], p, m, h, g, _;
	if (l) m = l[0], h = l[1], g = l[2], _ = l[3];
	else {
		p = Ou(e, t, -d), e = p.x, t = p.y, p = Ou(s, c, -d), s = p.x, c = p.y;
		let i = (e - s) / 2, l = (t - c) / 2, u = i * i / (n * n) + l * l / (r * r);
		u > 1 && (u = Math.sqrt(u), n = u * n, r = u * r);
		let f = n * n, v = r * r, y = (a === o ? -1 : 1) * Math.sqrt(Math.abs((f * v - f * l * l - v * i * i) / (f * l * l + v * i * i)));
		g = y * n * l / r + (e + s) / 2, _ = y * -r * i / n + (t + c) / 2, m = Math.asin((t - _) / r), h = Math.asin((c - _) / r), m = e < g ? Math.PI - m : m, h = s < g ? Math.PI - h : h, m < 0 && (m = Math.PI * 2 + m), h < 0 && (h = Math.PI * 2 + h), o && m > h && (m -= Math.PI * 2), !o && h > m && (h -= Math.PI * 2);
	}
	let v = h - m;
	if (Math.abs(v) > u) {
		let e = h, t = s, a = c;
		h = m + u * (o && h > m ? 1 : -1), s = g + n * Math.cos(h), c = _ + r * Math.sin(h), f = Au(s, c, n, r, i, 0, o, t, a, [
			h,
			e,
			g,
			_
		]);
	}
	v = h - m;
	let y = Math.cos(m), b = Math.sin(m), x = Math.cos(h), S = Math.sin(h), C = Math.tan(v / 4), w = 4 / 3 * (n * C), T = 4 / 3 * (r * C), E = [e, t], D = [e + w * b, t - T * y], O = [s + w * S, c - T * x], k = [s, c];
	if (D[0] = 2 * E[0] - D[0], D[1] = 2 * E[1] - D[1], l) return [
		D,
		O,
		k
	].concat(f);
	{
		f = [
			D,
			O,
			k
		].concat(f).join().split(",");
		let e = [], t = f.length;
		for (let n = 0; n < t; n += 1) e[n] = n % 2 ? Ou(+f[n - 1], +f[n], d).y : Ou(+f[n], +f[n + 1], d).x;
		return e;
	}
}
function ju(e) {
	if (!e) return null;
	let t = "	\n\v\f\r \xA0 ᠎             　\u2028\u2029", n = RegExp(`([a-z])[${t},]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?[${t}]*,?[${t}]*)+)`, "ig"), r = RegExp(`(-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?)[${t}]*,?[${t}]*`, "ig"), i = {
		a: 7,
		c: 6,
		h: 1,
		l: 2,
		m: 2,
		q: 4,
		s: 4,
		t: 2,
		v: 1,
		z: 0
	}, a = [];
	return e.replace(n, (e, t, n) => {
		let o = [], s = t.toLowerCase();
		n.replace(r, (e, t) => (t && o.push(+t), e)), s === "m" && o.length > 2 && (a.push([t, ...o.splice(0, 2)]), s = "l", t = t === "m" ? "l" : "L");
		let c = i[s];
		for (; o.length >= c && (a.push([t, ...o.splice(0, c)]), c););
		return e;
	}), a;
}
function Mu(e) {
	let t = ju(e);
	if (!t || !t.length) return [[
		"M",
		0,
		0
	]];
	let n = 0, r = 0, i = 0, a = 0, o = [];
	for (let e = 0, s = t.length; e < s; e += 1) {
		let s = [];
		o.push(s);
		let c = t[e], l = c[0];
		if (l !== l.toUpperCase()) switch (s[0] = l.toUpperCase(), s[0]) {
			case "A":
				s[1] = c[1], s[2] = c[2], s[3] = c[3], s[4] = c[4], s[5] = c[5], s[6] = +c[6] + n, s[7] = +c[7] + r;
				break;
			case "V":
				s[1] = +c[1] + r;
				break;
			case "H":
				s[1] = +c[1] + n;
				break;
			case "M":
				i = +c[1] + n, a = +c[2] + r;
				for (let e = 1, t = c.length; e < t; e += 1) s[e] = +c[e] + (e % 2 ? n : r);
				break;
			default: for (let e = 1, t = c.length; e < t; e += 1) s[e] = +c[e] + (e % 2 ? n : r);
		}
		else for (let e = 0, t = c.length; e < t; e += 1) s[e] = c[e];
		switch (s[0]) {
			case "Z":
				n = +i, r = +a;
				break;
			case "H":
				n = s[1];
				break;
			case "V":
				r = s[1];
				break;
			case "M":
				i = s[s.length - 2], a = s[s.length - 1], n = s[s.length - 2], r = s[s.length - 1];
				break;
			default: n = s[s.length - 2], r = s[s.length - 1];
		}
	}
	return o;
}
function Nu(e) {
	let t = Mu(e), n = {
		x: 0,
		y: 0,
		bx: 0,
		by: 0,
		X: 0,
		Y: 0,
		qx: null,
		qy: null
	};
	function r(e, t, n) {
		let r, i;
		if (!e) return [
			"C",
			t.x,
			t.y,
			t.x,
			t.y,
			t.x,
			t.y
		];
		switch (e[0] in {
			T: 1,
			Q: 1
		} || (t.qx = null, t.qy = null), e[0]) {
			case "M":
				t.X = e[1], t.Y = e[2];
				break;
			case "A": return parseFloat(e[1]) === 0 || parseFloat(e[2]) === 0 ? [
				"L",
				e[6],
				e[7]
			] : ["C"].concat(Au.apply(0, [t.x, t.y].concat(e.slice(1))));
			case "S": return n === "C" || n === "S" ? (r = t.x * 2 - t.bx, i = t.y * 2 - t.by) : (r = t.x, i = t.y), [
				"C",
				r,
				i
			].concat(e.slice(1));
			case "T": return n === "Q" || n === "T" ? (t.qx = t.x * 2 - t.qx, t.qy = t.y * 2 - t.qy) : (t.qx = t.x, t.qy = t.y), ["C"].concat(ku(t.x, t.y, t.qx, t.qy, e[1], e[2]));
			case "Q": return t.qx = e[1], t.qy = e[2], ["C"].concat(ku(t.x, t.y, e[1], e[2], e[3], e[4]));
			case "H": return ["L"].concat(e[1], t.y);
			case "V": return ["L"].concat(t.x, e[1]);
		}
		return e;
	}
	function i(e, n) {
		if (e[n].length > 7) {
			e[n].shift();
			let r = e[n];
			for (; r.length;) a[n] = "A", n += 1, e.splice(n, 0, ["C"].concat(r.splice(0, 6)));
			e.splice(n, 1), s = t.length;
		}
	}
	let a = [], o = "", s = t.length;
	for (let e = 0; e < s; e += 1) {
		let s = "";
		t[e] && (s = t[e][0]), s !== "C" && (a[e] = s, e > 0 && (o = a[e - 1])), t[e] = r(t[e], n, o), a[e] !== "A" && s === "C" && (a[e] = "C"), i(t, e);
		let c = t[e], l = c.length;
		n.x = c[l - 2], n.y = c[l - 1], n.bx = parseFloat(c[l - 4]) || n.x, n.by = parseFloat(c[l - 3]) || n.y;
	}
	return t[0][0] && t[0][0] === "M" || t.unshift([
		"M",
		0,
		0
	]), t;
}
function Pu(e) {
	return Nu(e).map((e) => e.map((e) => typeof e == "string" ? e : au(e, 2))).join(",").split(",").join(" ");
}
// node_modules/@antv/x6/es/geometry/path/path.js
var H = class e extends du {
	static isPath(t) {
		return t != null && t instanceof e;
	}
	static parse(t) {
		if (!t) return new e();
		let n = new e(), r = Pu(t).match(/(?:[a-zA-Z] *)(?:(?:-?\d+(?:\.\d+)?(?:e[-+]?\d+)? *,? *)|(?:-?\.\d+ *,? *))+|(?:[a-zA-Z] *)(?! |\d|-|\.)/g);
		if (r != null) for (let t = 0, i = r.length; t < i; t += 1) {
			let i = r[t].match(/(?:[a-zA-Z])|(?:(?:-?\d+(?:\.\d+)?(?:e[-+]?\d+)?))|(?:(?:-?\.\d+))/g);
			if (i != null) {
				let t = i[0], r = i.slice(1).map((e) => +e), a = e.createSegment.call(null, t, ...r);
				n.appendSegment(a);
			}
		}
		return n;
	}
	static createSegment(e, ...t) {
		if (e === "M") return Eu.create.call(null, ...t);
		if (e === "L") return wu.create.call(null, ...t);
		if (e === "C") return Du.create.call(null, ...t);
		if (e === "z" || e === "Z") return Tu.create();
		throw Error(`Invalid path segment type "${e}"`);
	}
	constructor(t) {
		if (super(), this.PRECISION = 3, this.segments = [], Array.isArray(t)) {
			if (V.isLine(t[0]) || bu.isCurve(t[0])) {
				let n = null;
				t.forEach((t, r) => {
					r === 0 && this.appendSegment(e.createSegment("M", t.start)), n != null && !n.end.equals(t.start) && this.appendSegment(e.createSegment("M", t.start)), V.isLine(t) ? this.appendSegment(e.createSegment("L", t.end)) : bu.isCurve(t) && this.appendSegment(e.createSegment("C", t.controlPoint1, t.controlPoint2, t.end)), n = t;
				});
			} else t.forEach((e) => {
				e.isSegment && this.appendSegment(e);
			});
		} else t != null && (V.isLine(t) ? (this.appendSegment(e.createSegment("M", t.start)), this.appendSegment(e.createSegment("L", t.end))) : bu.isCurve(t) ? (this.appendSegment(e.createSegment("M", t.start)), this.appendSegment(e.createSegment("C", t.controlPoint1, t.controlPoint2, t.end))) : yu.isPolyline(t) ? t.points && t.points.length && t.points.forEach((t, n) => {
			let r = n === 0 ? e.createSegment("M", t) : e.createSegment("L", t);
			this.appendSegment(r);
		}) : t.isSegment && this.appendSegment(t));
	}
	get start() {
		let e = this.segments, t = e.length;
		if (t === 0) return null;
		for (let n = 0; n < t; n += 1) {
			let t = e[n];
			if (t.isVisible) return t.start;
		}
		return e[t - 1].end;
	}
	get end() {
		let e = this.segments, t = e.length;
		if (t === 0) return null;
		for (let n = t - 1; n >= 0; --n) {
			let t = e[n];
			if (t.isVisible) return t.end;
		}
		return e[t - 1].end;
	}
	moveTo(...e) {
		return this.appendSegment(Eu.create.call(null, ...e));
	}
	lineTo(...e) {
		return this.appendSegment(wu.create.call(null, ...e));
	}
	curveTo(...e) {
		return this.appendSegment(Du.create.call(null, ...e));
	}
	arcTo(e, t, n, r, i, a, o) {
		let s = this.end || new z(), c = typeof a == "number" ? vu(s.x, s.y, e, t, n, r, i, a, o) : vu(s.x, s.y, e, t, n, r, i, a.x, a.y);
		if (c != null) for (let e = 0, t = c.length; e < t; e += 6) this.curveTo(c[e], c[e + 1], c[e + 2], c[e + 3], c[e + 4], c[e + 5]);
		return this;
	}
	quadTo(t, n, r, i) {
		let a = this.end || new z(), o = [
			"M",
			a.x,
			a.y
		];
		if (typeof t == "number") o.push("Q", t, n, r, i);
		else {
			let e = n;
			o.push("Q", t.x, t.y, e.x, e.y);
		}
		let s = e.parse(o.join(" "));
		return this.appendSegment(s.segments.slice(1)), this;
	}
	close() {
		return this.appendSegment(Tu.create());
	}
	drawPoints(t, n = {}) {
		let r = _u(t, n), i = e.parse(r);
		i && i.segments && this.appendSegment(i.segments);
	}
	bbox() {
		let e = this.segments, t = e.length;
		if (t === 0) return null;
		let n;
		for (let r = 0; r < t; r += 1) {
			let t = e[r];
			if (t.isVisible) {
				let e = t.bbox();
				e != null && (n = n ? n.union(e) : e);
			}
		}
		if (n != null) return n;
		let r = e[t - 1];
		return new B(r.end.x, r.end.y, 0, 0);
	}
	appendSegment(e) {
		let t = this.segments.length, n = t === 0 ? null : this.segments[t - 1], r;
		if (Array.isArray(e)) for (let t = 0, i = e.length; t < i; t += 1) {
			let i = e[t];
			r = this.prepareSegment(i, n, null), this.segments.push(r), n = r;
		}
		else e != null && e.isSegment && (r = this.prepareSegment(e, n, null), this.segments.push(r));
		return this;
	}
	insertSegment(e, t) {
		let n = this.segments.length;
		if (e < 0 && (e = n + e + 1), e > n || e < 0) throw Error("Index out of range.");
		let r, i = null, a = null;
		if (n !== 0 && (e >= 1 ? (i = this.segments[e - 1], a = i.nextSegment) : (i = null, a = this.segments[0])), !Array.isArray(t)) r = this.prepareSegment(t, i, a), this.segments.splice(e, 0, r);
		else for (let n = 0, o = t.length; n < o; n += 1) {
			let o = t[n];
			r = this.prepareSegment(o, i, a), this.segments.splice(e + n, 0, r), i = r;
		}
		return this;
	}
	removeSegment(e) {
		let t = this.fixIndex(e), n = this.segments.splice(t, 1)[0], r = n.previousSegment, i = n.nextSegment;
		return r && (r.nextSegment = i), i && (i.previousSegment = r), n.isSubpathStart && i && this.updateSubpathStartSegment(i), n;
	}
	replaceSegment(e, t) {
		let n = this.fixIndex(e), r, i = this.segments[n], a = i.previousSegment, o = i.nextSegment, s = i.isSubpathStart;
		if (!Array.isArray(t)) r = this.prepareSegment(t, a, o), this.segments.splice(n, 1, r), s && r.isSubpathStart && (s = !1);
		else {
			this.segments.splice(e, 1);
			for (let n = 0, i = t.length; n < i; n += 1) {
				let i = t[n];
				r = this.prepareSegment(i, a, o), this.segments.splice(e + n, 0, r), a = r, s && r.isSubpathStart && (s = !1);
			}
		}
		s && o && this.updateSubpathStartSegment(o);
	}
	getSegment(e) {
		let t = this.fixIndex(e);
		return this.segments[t];
	}
	fixIndex(e) {
		let t = this.segments.length;
		if (t === 0) throw Error("Path has no segments.");
		let n = e;
		for (; n < 0;) n = t + n;
		if (n >= t || n < 0) throw Error("Index out of range.");
		return n;
	}
	segmentAt(e, t = {}) {
		let n = this.segmentIndexAt(e, t);
		return n ? this.getSegment(n) : null;
	}
	segmentAtLength(e, t = {}) {
		let n = this.segmentIndexAtLength(e, t);
		return n ? this.getSegment(n) : null;
	}
	segmentIndexAt(e, t = {}) {
		if (this.segments.length === 0) return null;
		let n = su(e, 0, 1), r = this.getOptions(t), i = this.length(r) * n;
		return this.segmentIndexAtLength(i, r);
	}
	segmentIndexAtLength(e, t = {}) {
		let n = this.segments.length;
		if (n === 0) return null;
		let r = !0;
		e < 0 && (r = !1, e = -e);
		let i = this.getPrecision(t), a = this.getSubdivisions(t), o = 0, s = null;
		for (let t = 0; t < n; t += 1) {
			let c = r ? t : n - 1 - t, l = this.segments[c], u = a[c], d = l.length({
				precision: i,
				subdivisions: u
			});
			if (l.isVisible) {
				if (e <= o + d) return c;
				s = c;
			}
			o += d;
		}
		return s;
	}
	getSegmentSubdivisions(e = {}) {
		let t = this.getPrecision(e), n = [];
		for (let e = 0, r = this.segments.length; e < r; e += 1) {
			let r = this.segments[e].getSubdivisions({ precision: t });
			n.push(r);
		}
		return n;
	}
	updateSubpathStartSegment(e) {
		let t = e.previousSegment, n = e;
		for (; n && !n.isSubpathStart;) t == null ? n.subpathStartSegment = null : n.subpathStartSegment = t.subpathStartSegment, t = n, n = n.nextSegment;
	}
	prepareSegment(e, t, n) {
		e.previousSegment = t, e.nextSegment = n, t != null && (t.nextSegment = e), n != null && (n.previousSegment = e);
		let r = e;
		return e.isSubpathStart && (e.subpathStartSegment = e, r = n), r != null && this.updateSubpathStartSegment(r), e;
	}
	closestPoint(e, t = {}) {
		let n = this.closestPointT(e, t);
		return n ? this.pointAtT(n) : null;
	}
	closestPointLength(e, t = {}) {
		let n = this.getOptions(t), r = this.closestPointT(e, n);
		return r ? this.lengthAtT(r, n) : 0;
	}
	closestPointNormalizedLength(e, t = {}) {
		let n = this.getOptions(t), r = this.closestPointLength(e, n);
		if (r === 0) return 0;
		let i = this.length(n);
		return i === 0 ? 0 : r / i;
	}
	closestPointT(e, t = {}) {
		if (this.segments.length === 0) return null;
		let n = this.getPrecision(t), r = this.getSubdivisions(t), i, a = Infinity;
		for (let t = 0, o = this.segments.length; t < o; t += 1) {
			let o = this.segments[t], s = r[t];
			if (o.isVisible) {
				let r = o.closestPointT(e, {
					precision: n,
					subdivisions: s
				}), c = uu(o.pointAtT(r), e);
				c < a && (i = {
					segmentIndex: t,
					value: r
				}, a = c);
			}
		}
		return i || {
			segmentIndex: this.segments.length - 1,
			value: 1
		};
	}
	closestPointTangent(e, t = {}) {
		if (this.segments.length === 0) return null;
		let n = this.getPrecision(t), r = this.getSubdivisions(t), i, a = Infinity;
		for (let t = 0, o = this.segments.length; t < o; t += 1) {
			let o = this.segments[t], s = r[t];
			if (o.isDifferentiable()) {
				let t = o.closestPointT(e, {
					precision: n,
					subdivisions: s
				}), r = uu(o.pointAtT(t), e);
				r < a && (i = o.tangentAtT(t), a = r);
			}
		}
		return i || null;
	}
	containsPoint(e, t = {}) {
		let n = this.toPolylines(t);
		if (!n) return !1;
		let r = 0;
		for (let t = 0, i = n.length; t < i; t += 1) n[t].containsPoint(e) && (r += 1);
		return r % 2 == 1;
	}
	pointAt(e, t = {}) {
		if (this.segments.length === 0) return null;
		if (e <= 0) return this.start.clone();
		if (e >= 1) return this.end.clone();
		let n = this.getOptions(t), r = this.length(n) * e;
		return this.pointAtLength(r, n);
	}
	pointAtLength(e, t = {}) {
		if (this.segments.length === 0) return null;
		if (e === 0) return this.start.clone();
		let n = !0;
		e < 0 && (n = !1, e = -e);
		let r = this.getPrecision(t), i = this.getSubdivisions(t), a, o = 0;
		for (let t = 0, s = this.segments.length; t < s; t += 1) {
			let c = n ? t : s - 1 - t, l = this.segments[c], u = i[c], d = l.length({
				precision: r,
				subdivisions: u
			});
			if (l.isVisible) {
				if (e <= o + d) return l.pointAtLength((n ? 1 : -1) * (e - o), {
					precision: r,
					subdivisions: u
				});
				a = l;
			}
			o += d;
		}
		return a ? n ? a.end : a.start : this.segments[this.segments.length - 1].end.clone();
	}
	pointAtT(e) {
		let t = this.segments, n = t.length;
		if (n === 0) return null;
		let r = e.segmentIndex;
		if (r < 0) return t[0].pointAtT(0);
		if (r >= n) return t[n - 1].pointAtT(1);
		let i = su(e.value, 0, 1);
		return t[r].pointAtT(i);
	}
	divideAt(e, t = {}) {
		if (this.segments.length === 0) return null;
		let n = su(e, 0, 1), r = this.getOptions(t), i = this.length(r) * n;
		return this.divideAtLength(i, r);
	}
	divideAtLength(t, n = {}) {
		if (this.segments.length === 0) return null;
		let r = !0;
		t < 0 && (r = !1, t = -t);
		let i = this.getPrecision(n), a = this.getSubdivisions(n), o = 0, s, c, l, u, d;
		for (let e = 0, n = this.segments.length; e < n; e += 1) {
			let d = r ? e : n - 1 - e, f = this.getSegment(d), p = {
				precision: i,
				subdivisions: a[d]
			}, m = f.length(p);
			if (f.isDifferentiable() && (l = f, u = d, t <= o + m)) {
				c = d, s = f.divideAtLength((r ? 1 : -1) * (t - o), p);
				break;
			}
			o += m;
		}
		if (!l) return null;
		s ||= (c = u, d = +!!r, l.divideAtT(d));
		let f = this.clone(), p = c;
		f.replaceSegment(p, s);
		let m = p, h = p + 1, g = p + 2;
		s[0].isDifferentiable() || (f.removeSegment(m), --h, --g);
		let _ = f.getSegment(h).start;
		f.insertSegment(h, e.createSegment("M", _)), g += 1, s[1].isDifferentiable() || (f.removeSegment(g - 1), --g);
		let v = g - m - 1;
		for (let t = g, n = f.segments.length; t < n; t += 1) {
			let n = this.getSegment(t - v), r = f.getSegment(t);
			if (r.type === "Z" && !n.subpathStartSegment.end.equals(r.subpathStartSegment.end)) {
				let r = e.createSegment("L", n.end);
				f.replaceSegment(t, r);
			}
		}
		return [new e(f.segments.slice(0, h)), new e(f.segments.slice(h))];
	}
	intersectsWithLine(e, t = {}) {
		let n = this.toPolylines(t);
		if (n == null) return null;
		let r = null;
		for (let t = 0, i = n.length; t < i; t += 1) {
			let i = n[t], a = e.intersect(i);
			a && (r ??= [], Array.isArray(a) ? r.push(...a) : r.push(a));
		}
		return r;
	}
	isDifferentiable() {
		for (let e = 0, t = this.segments.length; e < t; e += 1) if (this.segments[e].isDifferentiable()) return !0;
		return !1;
	}
	isValid() {
		let e = this.segments;
		return e.length === 0 || e[0].type === "M";
	}
	length(e = {}) {
		if (this.segments.length === 0) return 0;
		let t = this.getSubdivisions(e), n = 0;
		for (let e = 0, r = this.segments.length; e < r; e += 1) {
			let r = this.segments[e], i = t[e];
			n += r.length({ subdivisions: i });
		}
		return n;
	}
	lengthAtT(e, t = {}) {
		let n = this.segments.length;
		if (n === 0) return 0;
		let r = e.segmentIndex;
		if (r < 0) return 0;
		let i = su(e.value, 0, 1);
		r >= n && (r = n - 1, i = 1);
		let a = this.getPrecision(t), o = this.getSubdivisions(t), s = 0;
		for (let e = 0; e < r; e += 1) {
			let t = this.segments[e], n = o[e];
			s += t.length({
				precision: a,
				subdivisions: n
			});
		}
		let c = this.segments[r], l = o[r];
		return s += c.lengthAtT(i, {
			precision: a,
			subdivisions: l
		}), s;
	}
	tangentAt(e, t = {}) {
		if (this.segments.length === 0) return null;
		let n = su(e, 0, 1), r = this.getOptions(t), i = this.length(r) * n;
		return this.tangentAtLength(i, r);
	}
	tangentAtLength(e, t = {}) {
		if (this.segments.length === 0) return null;
		let n = !0;
		e < 0 && (n = !1, e = -e);
		let r = this.getPrecision(t), i = this.getSubdivisions(t), a, o = 0;
		for (let t = 0, s = this.segments.length; t < s; t += 1) {
			let c = n ? t : s - 1 - t, l = this.segments[c], u = i[c], d = l.length({
				precision: r,
				subdivisions: u
			});
			if (l.isDifferentiable()) {
				if (e <= o + d) return l.tangentAtLength((n ? 1 : -1) * (e - o), {
					precision: r,
					subdivisions: u
				});
				a = l;
			}
			o += d;
		}
		if (a) {
			let e = +!!n;
			return a.tangentAtT(e);
		}
		return null;
	}
	tangentAtT(e) {
		let t = this.segments.length;
		if (t === 0) return null;
		let n = e.segmentIndex;
		if (n < 0) return this.segments[0].tangentAtT(0);
		if (n >= t) return this.segments[t - 1].tangentAtT(1);
		let r = su(e.value, 0, 1);
		return this.segments[n].tangentAtT(r);
	}
	getPrecision(e = {}) {
		return e.precision == null ? this.PRECISION : e.precision;
	}
	getSubdivisions(e = {}) {
		if (e.segmentSubdivisions == null) {
			let t = this.getPrecision(e);
			return this.getSegmentSubdivisions({ precision: t });
		}
		return e.segmentSubdivisions;
	}
	getOptions(e = {}) {
		return {
			precision: this.getPrecision(e),
			segmentSubdivisions: this.getSubdivisions(e)
		};
	}
	toPoints(e = {}) {
		let t = this.segments, n = t.length;
		if (n === 0) return null;
		let r = this.getSubdivisions(e), i = [], a = [];
		for (let e = 0; e < n; e += 1) {
			let n = t[e];
			if (n.isVisible) {
				let t = r[e];
				t.length > 0 ? t.forEach((e) => a.push(e.start)) : a.push(n.start);
			} else a.length > 0 && (a.push(t[e - 1].end), i.push(a), a = []);
		}
		return a.length > 0 && (a.push(this.end), i.push(a)), i;
	}
	toPolylines(e = {}) {
		let t = this.toPoints(e);
		return t ? t.map((e) => new yu(e)) : null;
	}
	scale(e, t, n) {
		return this.segments.forEach((r) => r.scale(e, t, n)), this;
	}
	rotate(e, t) {
		return this.segments.forEach((n) => n.rotate(e, t)), this;
	}
	translate(e, t) {
		return typeof e == "number" ? this.segments.forEach((n) => n.translate(e, t)) : this.segments.forEach((t) => t.translate(e)), this;
	}
	clone() {
		let t = new e();
		return this.segments.forEach((e) => t.appendSegment(e.clone())), t;
	}
	equals(e) {
		if (e == null) return !1;
		let t = this.segments, n = e.segments, r = t.length;
		if (n.length !== r) return !1;
		for (let e = 0; e < r; e += 1) {
			let r = t[e], i = n[e];
			if (r.type !== i.type || !r.equals(i)) return !1;
		}
		return !0;
	}
	toJSON() {
		return this.segments.map((e) => e.toJSON());
	}
	serialize() {
		if (!this.isValid()) throw Error("Invalid path segments.");
		return this.segments.map((e) => e.serialize()).join(" ");
	}
	toString() {
		return this.serialize();
	}
};
// node_modules/@antv/x6/es/registry/marker/util.js
function Fu(e, t, n) {
	let r, i;
	typeof t == "object" ? (r = t.x, i = t.y) : (r = t, i = n);
	let a = H.parse(e), o = a.bbox();
	if (o) {
		let e = -o.height / 2 - o.y, t = -o.width / 2 - o.x;
		typeof r == "number" && (t -= r), typeof i == "number" && (e -= i), a.translate(t, e);
	}
	return a.serialize();
}
// node_modules/@antv/x6/es/common/dom/class.js
var Iu = /[\t\r\n\f]/g, Lu = /\S+/g, Ru = (e) => ` ${e} `;
function zu(e) {
	return e && e.getAttribute && e.getAttribute("class") || "";
}
function Bu(e, t) {
	if (e == null || t == null) return !1;
	let n = Ru(zu(e)), r = Ru(t);
	return e.nodeType === 1 && n.replace(Iu, " ").includes(r);
}
function U(e, t) {
	if (e != null && t != null) {
		if (typeof t == "function") return U(e, t(zu(e)));
		if (typeof t == "string" && e.nodeType === 1) {
			let n = t.match(Lu) || [], r = Ru(zu(e)).replace(Iu, " "), i = n.reduce((e, t) => e.indexOf(Ru(t)) < 0 ? `${e}${t} ` : e, r);
			i = i.trim(), r !== i && e.setAttribute("class", i);
		}
	}
}
function Vu(e, t) {
	if (e != null) {
		if (typeof t == "function") return Vu(e, t(zu(e)));
		if ((!t || typeof t == "string") && e.nodeType === 1) {
			let n = (t || "").match(Lu) || [], r = Ru(zu(e)).replace(Iu, " "), i = n.reduce((e, t) => {
				let n = Ru(t);
				return e.indexOf(n) > -1 ? e.replace(n, " ") : e;
			}, r);
			i = t ? i.trim() : "", r !== i && e.setAttribute("class", i);
		}
	}
}
function Hu(e, t, n) {
	if (e != null && t != null) {
		if (n != null && typeof t == "string") n ? U(e, t) : Vu(e, t);
		else {
			if (typeof t == "function") return Hu(e, t(zu(e), n), n);
			typeof t == "string" && (t.match(Lu) || []).forEach((t) => {
				Bu(e, t) ? Vu(e, t) : U(e, t);
			});
		}
	}
}
// node_modules/@antv/x6/es/common/dom/elem.js
var Uu = 0;
function Wu() {
	return Uu += 1, `v${Uu}`;
}
function Gu(e) {
	return (e.id == null || e.id === "") && (e.id = Wu()), e.id;
}
function Ku(e) {
	return e != null && typeof e.getScreenCTM == "function" && e instanceof SVGElement;
}
var qu = {
	svg: "http://www.w3.org/2000/svg",
	xmlns: "http://www.w3.org/2000/xmlns/",
	xml: "http://www.w3.org/XML/1998/namespace",
	xlink: "http://www.w3.org/1999/xlink",
	xhtml: "http://www.w3.org/1999/xhtml"
};
function Ju(e, t = document) {
	return t.createElement(e);
}
function Yu(e, t = qu.xhtml, n = document) {
	return n.createElementNS(t, e);
}
function Xu(e, t = document) {
	return Yu(e, qu.svg, t);
}
function Zu(e) {
	if (e) {
		let { documentElement: t } = Qu(`<svg xmlns="${qu.svg}" xmlns:xlink="${qu.xlink}" version="1.1">${e}</svg>`, { async: !1 });
		return t;
	}
	let t = document.createElementNS(qu.svg, "svg");
	return t.setAttributeNS(qu.xmlns, "xmlns:xlink", qu.xlink), t.setAttribute("version", "1.1"), t;
}
function Qu(e, t = {}) {
	let n;
	try {
		let r = new DOMParser();
		if (t.async != null) {
			let e = r;
			e.async = t.async;
		}
		n = r.parseFromString(e, t.mimeType || "text/xml");
	} catch {
		n = void 0;
	}
	if (!n || n.getElementsByTagName("parsererror").length) throw Error(`Invalid XML: ${e}`);
	return n;
}
function $u(e, t = !0) {
	let n = e.nodeName;
	return t ? n.toLowerCase() : n.toUpperCase();
}
function ed(e) {
	let t = 0, n = e.previousSibling;
	for (; n;) n.nodeType === 1 && (t += 1), n = n.previousSibling;
	return t;
}
function td(e, t) {
	return e.querySelectorAll(t);
}
function nd(e, t) {
	return e.querySelector(t);
}
function rd(e, t, n) {
	let r = e.ownerSVGElement, i = e.parentNode;
	for (; i && i !== n && i !== r;) {
		if (Bu(i, t)) return i;
		i = i.parentNode;
	}
	return null;
}
function id(e, t) {
	let n = t && t.parentNode;
	return e === n || !!(n && n.nodeType === 1 && e.compareDocumentPosition(n) & 16);
}
function ad(e) {
	e && (Array.isArray(e) ? e : [e]).forEach((e) => {
		e.parentNode && e.parentNode.removeChild(e);
	});
}
function od(e) {
	for (; e.firstChild;) e.removeChild(e.firstChild);
}
function sd(e, t) {
	(Array.isArray(t) ? t : [t]).forEach((t) => {
		t != null && e.appendChild(t);
	});
}
function cd(e, t) {
	let n = e.firstChild;
	return n ? ld(n, t) : sd(e, t);
}
function ld(e, t) {
	let n = e.parentNode;
	n && (Array.isArray(t) ? t : [t]).forEach((t) => {
		t != null && n.insertBefore(t, e);
	});
}
function ud(e, t) {
	let n = e.parentNode;
	n && (Array.isArray(t) ? t : [t]).forEach((t) => {
		t != null && n.insertBefore(t, e.nextSibling);
	});
}
function dd(e, t) {
	t?.appendChild(e);
}
function fd(e) {
	return !!e && e.nodeType === 1;
}
function pd(e) {
	try {
		return e instanceof HTMLElement;
	} catch {
		return typeof e == "object" && e.nodeType === 1 && typeof e.style == "object" && typeof e.ownerDocument == "object";
	}
}
function md(e, t) {
	let n = [], r = e.firstChild;
	for (; r; r = r.nextSibling) r.nodeType === 1 && (!t || Bu(r, t)) && n.push(r);
	return n;
}
// node_modules/@antv/x6/es/common/string/format.js
var hd = (e) => {
	let t = Object.create(null);
	return ((n) => t[n] || (t[n] = e(n)));
}, gd = hd((e) => e.replace(/\B([A-Z])/g, "-$1").toLowerCase()), _d = hd((e) => hl(Ki(e)).replace(/ /g, "")), vd = [
	"viewBox",
	"attributeName",
	"attributeType",
	"repeatCount",
	"textLength",
	"lengthAdjust",
	"gradientUnits",
	"preserveAspectRatio"
];
function yd(e, t) {
	return e.getAttribute(t);
}
function bd(e, t) {
	let n = Cd(t);
	n.ns ? e.hasAttributeNS(n.ns, n.local) && e.removeAttributeNS(n.ns, n.local) : e.hasAttribute(t) && e.removeAttribute(t);
}
function xd(e, t, n) {
	if (n == null) return bd(e, t);
	let r = Cd(t);
	r.ns && typeof n == "string" ? e.setAttributeNS(r.ns, t, n) : t === "id" ? e.id = `${n}` : e.setAttribute(t, `${n}`);
}
function Sd(e, t) {
	Object.keys(t).forEach((n) => {
		xd(e, n, t[n]);
	});
}
function W(e, t, n) {
	if (t == null) {
		let t = e.attributes, n = {};
		for (let e = 0; e < t.length; e += 1) n[t[e].name] = t[e].value;
		return n;
	}
	if (typeof t == "string" && n === void 0) return e.getAttribute(t);
	typeof t == "object" ? Sd(e, t) : xd(e, t, n);
}
function Cd(e) {
	if (e.indexOf(":") !== -1) {
		let t = e.split(":");
		return {
			ns: qu[t[0]],
			local: t[1]
		};
	}
	return {
		ns: null,
		local: e
	};
}
function wd(e) {
	let t = {};
	return Object.keys(e).forEach((n) => {
		let r = vd.includes(n) ? n : gd(n);
		t[r] = e[n];
	}), t;
}
function Td(e) {
	let t = {};
	return e.split(";").forEach((e) => {
		let n = e.trim();
		if (n) {
			let e = n.split("=");
			e.length && (t[e[0].trim()] = e[1] ? e[1].trim() : "");
		}
	}), t;
}
function Ed(e, t) {
	return Object.keys(t).forEach((n) => {
		if (n === "class") e[n] = e[n] ? `${e[n]} ${t[n]}` : t[n];
		else if (n === "style") {
			let r = typeof e[n] == "object", i = typeof t[n] == "object", a, o;
			r && i ? (a = e[n], o = t[n]) : r ? (a = e[n], o = Td(t[n])) : i ? (a = Td(e[n]), o = t[n]) : (a = Td(e[n]), o = Td(t[n])), e[n] = Ed(a, o);
		} else e[n] = t[n];
	}), e;
}
// node_modules/@antv/x6/es/common/dom/prefix.js
var Dd = /-(.)/g;
function Od(e) {
	return e.replace(Dd, (e, t) => t.toUpperCase());
}
var kd = {}, Ad = [
	"webkit",
	"ms",
	"moz",
	"o"
], jd = typeof document < "u" ? document.createElement("div").style : {};
function Md(e) {
	for (let t = 0; t < Ad.length; t += 1) {
		let n = Ad[t] + e;
		if (n in jd) return n;
	}
	return null;
}
function Nd(e) {
	let t = Od(e);
	if (kd[t] == null) {
		let e = t.charAt(0).toUpperCase() + t.slice(1);
		kd[t] = t in jd ? t : Md(e);
	}
	return kd[t];
}
// node_modules/@antv/x6/es/common/dom/style.js
function Pd(e, t) {
	let n = e.ownerDocument && e.ownerDocument.defaultView && e.ownerDocument.defaultView.opener ? e.ownerDocument.defaultView.getComputedStyle(e, null) : window.getComputedStyle(e, null);
	return n && t ? n.getPropertyValue(t) || n[t] : n;
}
(function() {
	if (typeof document > "u") return function() {};
	let e = document;
	return e.selection ? function() {
		e.selection.empty();
	} : window.getSelection ? function() {
		let e = window.getSelection();
		e && (e.empty ? e.empty() : e.removeAllRanges && e.removeAllRanges());
	} : function() {};
})();
// node_modules/@antv/x6/es/common/dom/css.js
var Fd = {
	animationIterationCount: !0,
	columnCount: !0,
	flexGrow: !0,
	flexShrink: !0,
	fontWeight: !0,
	gridArea: !0,
	gridColumn: !0,
	gridColumnEnd: !0,
	gridColumnStart: !0,
	gridRow: !0,
	gridRowEnd: !0,
	gridRowStart: !0,
	lineHeight: !0,
	opacity: !0,
	order: !0,
	orphans: !0,
	widows: !0,
	zIndex: !0
};
function Id(e) {
	return /^--/.test(e);
}
function Ld(e, t, n) {
	let r = window.getComputedStyle(e, null);
	return n ? r.getPropertyValue(t) || void 0 : r[t] || e.style[t];
}
function Rd(e, t) {
	return parseInt(Ld(e, t), 10) || 0;
}
function zd(e, t) {
	return !Fd[e] && typeof t == "number" ? `${t}px` : t;
}
function G(e, t, n) {
	if (typeof t == "string") {
		let r = Id(t);
		if (r || (t = Nd(t)), n === void 0) return Ld(e, t, r);
		r || (n = zd(t, n));
		let i = e.style;
		r ? i.setProperty(t, n) : i[t] = n;
	} else for (let n in t) G(e, n, t[n]);
}
// node_modules/@antv/x6/es/common/string/hashcode.js
function Bd(e) {
	let t = 2166136261, n = !1, r = e;
	for (let e = 0, i = r.length; e < i; e += 1) {
		let i = r.charCodeAt(e);
		i > 127 && !n && (r = unescape(encodeURIComponent(r)), i = r.charCodeAt(e), n = !0), t ^= i, t += (t << 1) + (t << 4) + (t << 7) + (t << 8) + (t << 24);
	}
	return t >>> 0;
}
// node_modules/@antv/x6/es/common/string/uuid.js
function Vd() {
	let e = "";
	for (let t = 0; t < 36; t += 1) {
		let n = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"[t], r = Math.random() * 16 | 0, i = n === "x" ? r : n === "y" ? r & 3 | 8 : n;
		e += i.toString(16);
	}
	return e;
}
// node_modules/@antv/x6/es/common/string/suggestion.js
function Hd(e, t, n) {
	let r = Math.min(2, Math.floor(e.length * .34)), i = Math.floor(e.length * .4) + 1, a, o = !1, s = e.toLowerCase();
	for (let c of t) {
		let t = n(c);
		if (t !== void 0 && Math.abs(t.length - s.length) <= r) {
			let n = t.toLowerCase();
			if (n === s) {
				if (t === e) continue;
				return c;
			}
			if (o || t.length < 3) continue;
			let r = Ud(s, n, i - 1);
			if (r === void 0) continue;
			r < 3 ? (o = !0, a = c) : (i = r, a = c);
		}
	}
	return a;
}
function Ud(e, t, n) {
	let r = Array(t.length + 1), i = Array(t.length + 1), a = n + 1;
	for (let e = 0; e <= t.length; e += 1) r[e] = e;
	for (let o = 1; o <= e.length; o += 1) {
		let s = e.charCodeAt(o - 1), c = o > n ? o - n : 1, l = t.length > n + o ? n + o : t.length;
		i[0] = o;
		let u = o;
		for (let e = 1; e < c; e += 1) i[e] = a;
		for (let e = c; e <= l; e += 1) {
			let n = s === t.charCodeAt(e - 1) ? r[e - 1] : Math.min(r[e] + 1, i[e - 1] + 1, r[e - 1] + 2);
			i[e] = n, u = Math.min(u, n);
		}
		for (let e = l + 1; e <= t.length; e += 1) i[e] = a;
		if (u > n) return;
		let d = r;
		r = i, i = d;
	}
	let o = r[t.length];
	return o > n ? void 0 : o;
}
// node_modules/@antv/x6/es/common/dom/data.js
var Wd = /* @__PURE__ */ new WeakMap();
function Gd(e, t) {
	let n = Ki(t), r = Wd.get(e);
	if (r) return r[n];
}
function Kd(e, t, n) {
	let r = Ki(t), i = Wd.get(e);
	i ? i[r] = n : Wd.set(e, { [r]: n });
}
function qd(e, t, n) {
	if (!t) return Wd.get(e);
	if (typeof t == "string") {
		if (n === void 0) return Gd(e, t);
		Kd(e, t, n);
	} else for (let n in t) qd(e, n, t[n]);
}
// node_modules/@antv/x6/es/common/dom/prop.js
var Jd = {
	class: "className",
	contenteditable: "contentEditable",
	for: "htmlFor",
	readonly: "readOnly",
	maxlength: "maxLength",
	tabindex: "tabIndex",
	colspan: "colSpan",
	rowspan: "rowSpan",
	usemap: "useMap"
};
function Yd(e, t, n) {
	if (t) {
		if (typeof t == "string") {
			if (t = Jd[t] || t, arguments.length < 3) return e[t];
			e[t] = n;
		} else for (let n in t) Yd(e, n, t[n]);
	}
}
// node_modules/@antv/x6/es/common/object/mixins.js
function Xd(e, ...t) {
	t.forEach((t) => {
		Object.getOwnPropertyNames(t.prototype).forEach((n) => {
			n !== "constructor" && Object.defineProperty(e.prototype, n, Object.getOwnPropertyDescriptor(t.prototype, n));
		});
	});
}
// node_modules/@antv/x6/es/common/object/inherit.js
var Zd = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, t) {
	e.__proto__ = t;
} || function(e, t) {
	for (let n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
};
function Qd(e, t) {
	Zd(e, t);
	function n() {
		this.constructor = e;
	}
	e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n());
}
var $d = class {}, ef = /^\s*class\s+/.test(`${$d}`) || /^\s*class\s*\{/.test(`${class {}}`);
function tf(e, t) {
	let n;
	return ef ? n = class extends t {} : (n = function() {
		return t.apply(this, arguments);
	}, Qd(n, t)), Object.defineProperty(n, "name", { value: e }), n;
}
// node_modules/@antv/x6/es/common/object/object.js
function nf(e) {
	return e === "__proto__";
}
function rf(e, t, n = "/") {
	let r, i = Array.isArray(t) ? t : t.split(n);
	if (i.length) for (r = e; i.length;) {
		let e = i.shift();
		if (Object(r) === r && e && e in r) r = r[e];
		else return;
	}
	return r;
}
function af(e, t, n, r = "/") {
	let i = Array.isArray(t) ? t : t.split(r), a = i.pop();
	if (a && !nf(a)) {
		let t = e;
		i.forEach((e) => {
			nf(e) || (t[e] ?? (t[e] = {}), t = t[e]);
		}), t[a] = n;
	}
	return e;
}
function of(e, t, n = "/") {
	let r = Array.isArray(t) ? t.slice() : t.split(n), i = r.pop();
	if (i) {
		if (r.length > 0) {
			let t = rf(e, r);
			t && delete t[i];
		} else delete e[i];
	}
	return e;
}
// node_modules/@antv/x6/es/common/text/annotate.js
function sf(e, t, n = {}) {
	let r = n.offset || 0, i = [], a = [], o, s, c = null;
	for (let l = 0; l < e.length; l += 1) {
		o = a[l] = e[l];
		for (let i = 0, s = t.length; i < s; i += 1) {
			let s = t[i], c = s.start + r, u = s.end + r;
			l >= c && l < u && (typeof o == "string" ? o = a[l] = {
				t: e[l],
				attrs: s.attrs
			} : o.attrs = Ed(Ed({}, o.attrs), s.attrs), n.includeAnnotationIndices && (o.annotations ?? (o.annotations = []), o.annotations.push(i)));
		}
		s = a[l - 1], s ? N(o) && N(s) ? (c = c, JSON.stringify(o.attrs) === JSON.stringify(s.attrs) ? c.t += o.t : (i.push(c), c = o)) : N(o) || N(s) ? (c = c, i.push(c), c = o) : c = String(c || "") + String(o) : c = o;
	}
	return c != null && i.push(c), i;
}
// node_modules/@antv/x6/es/common/text/sanitize.js
function cf(e) {
	return e.replace(/ /g, "\xA0");
}
// node_modules/@antv/x6/es/common/vector/index.js
var lf = class e {
	get [Symbol.toStringTag]() {
		return uf;
	}
	get type() {
		return this.node.nodeName;
	}
	get id() {
		return this.node.id;
	}
	set id(e) {
		this.node.id = e;
	}
	static isVector(t) {
		if (t == null) return !1;
		if (t instanceof e) return !0;
		let n = t[Symbol.toStringTag], r = t;
		return (n == null || n === uf) && r.node instanceof SVGElement && typeof r.sample == "function" && typeof r.toPath == "function";
	}
	static create(t, n, r) {
		return new e(t, n, r);
	}
	static createVectors(t) {
		if (t[0] === "<") {
			let n = Zu(t), r = [];
			for (let t = 0, i = n.childNodes.length; t < i; t += 1) {
				let i = n.childNodes[t];
				r.push(e.create(document.importNode(i, !0)));
			}
			return r;
		}
		return [e.create(t)];
	}
	static toNode(t) {
		return e.isVector(t) ? t.node : t;
	}
	static toNodes(t) {
		return Array.isArray(t) ? t.map((t) => e.toNode(t)) : [e.toNode(t)];
	}
	constructor(t, n, r) {
		if (!t) throw TypeError("Invalid element to create vector");
		let i;
		if (e.isVector(t)) i = t.node;
		else if (typeof t == "string") {
			if (t.toLowerCase() === "svg") i = Zu();
			else if (t[0] === "<") {
				let e = Zu(t);
				i = document.importNode(e.firstChild, !0);
			} else i = document.createElementNS(qu.svg, t);
		} else i = t;
		this.node = i, n && this.setAttributes(n), r && this.append(r);
	}
	transform(e, t) {
		return e == null ? Jf(this.node) : (Jf(this.node, e, t), this);
	}
	translate(e, t = 0, n = {}) {
		return e == null ? Yf(this.node) : (Yf(this.node, e, t, n), this);
	}
	rotate(e, t, n, r = {}) {
		return e == null ? Xf(this.node) : (Xf(this.node, e, t, n, r), this);
	}
	scale(e, t) {
		return e == null ? Zf(this.node) : (Zf(this.node, e, t), this);
	}
	getTransformToElement(t) {
		let n = e.toNode(t);
		return Qf(this.node, n);
	}
	removeAttribute(e) {
		return bd(this.node, e), this;
	}
	getAttribute(e) {
		return yd(this.node, e);
	}
	setAttribute(e, t) {
		return xd(this.node, e, t), this;
	}
	setAttributes(e) {
		return Sd(this.node, e), this;
	}
	attr(e, t) {
		return e == null ? W(this.node) : typeof e == "string" && t === void 0 ? W(this.node, e) : (typeof e == "object" ? W(this.node, e) : W(this.node, e, t), this);
	}
	svg() {
		return this.node instanceof SVGSVGElement ? this : e.create(this.node.ownerSVGElement);
	}
	defs() {
		let t = this.svg() || this, n = t.node.getElementsByTagName("defs")[0];
		return n ? e.create(n) : e.create("defs").appendTo(t);
	}
	text(e, t = {}) {
		return gf(this.node, e, t), this;
	}
	tagName() {
		return $u(this.node);
	}
	clone() {
		return e.create(this.node.cloneNode(!0));
	}
	remove() {
		return ad(this.node), this;
	}
	empty() {
		return od(this.node), this;
	}
	append(t) {
		return sd(this.node, e.toNodes(t)), this;
	}
	appendTo(t) {
		return dd(this.node, e.isVector(t) ? t.node : t), this;
	}
	prepend(t) {
		return cd(this.node, e.toNodes(t)), this;
	}
	before(t) {
		return ld(this.node, e.toNodes(t)), this;
	}
	replace(t) {
		return this.node.parentNode && this.node.parentNode.replaceChild(e.toNode(t), this.node), e.create(t);
	}
	first() {
		return this.node.firstChild ? e.create(this.node.firstChild) : null;
	}
	last() {
		return this.node.lastChild ? e.create(this.node.lastChild) : null;
	}
	get(t) {
		let n = this.node.childNodes[t];
		return n ? e.create(n) : null;
	}
	indexOf(t) {
		return Array.prototype.slice.call(this.node.childNodes).indexOf(e.toNode(t));
	}
	find(t) {
		let n = [], r = td(this.node, t);
		if (r) for (let t = 0, i = r.length; t < i; t += 1) n.push(e.create(r[t]));
		return n;
	}
	findOne(t) {
		let n = nd(this.node, t);
		return n ? e.create(n) : null;
	}
	findParentByClass(t, n) {
		let r = rd(this.node, t, n);
		return r ? e.create(r) : null;
	}
	matches(e) {
		let t = this.node;
		this.node.matches;
		let n = t.matches || t.matchesSelector || t.msMatchesSelector || t.mozMatchesSelector || t.webkitMatchesSelector || t.oMatchesSelector || null;
		return n && n.call(t, e);
	}
	contains(t) {
		return id(this.node, e.isVector(t) ? t.node : t);
	}
	wrap(t) {
		let n = e.create(t);
		return this.node.parentNode?.insertBefore(n.node, this.node), n.append(this);
	}
	parent(t) {
		let n = this;
		if (n.node.parentNode == null) return null;
		if (n = e.create(n.node.parentNode), t == null) return n;
		do
			if (typeof t == "string" ? n.matches(t) : n instanceof t) return n;
		while (n = e.create(n.node.parentNode));
		return n;
	}
	children() {
		let t = this.node.childNodes, n = [];
		for (let r = 0; r < t.length; r += 1) t[r].nodeType === 1 && n.push(e.create(t[r]));
		return n;
	}
	eachChild(e, t) {
		let n = this.children();
		for (let r = 0, i = n.length; r < i; r += 1) e.call(n[r], n[r], r, n), t && n[r].eachChild(e, t);
		return this;
	}
	index() {
		return ed(this.node);
	}
	hasClass(e) {
		return Bu(this.node, e);
	}
	addClass(e) {
		return U(this.node, e), this;
	}
	removeClass(e) {
		return Vu(this.node, e), this;
	}
	toggleClass(e, t) {
		return Hu(this.node, e, t), this;
	}
	toLocalPoint(e, t) {
		return ep(this.node, e, t);
	}
	sample(e = 1) {
		return this.node instanceof SVGPathElement ? Sf(this.node, e) : [];
	}
	toPath() {
		return e.create(Mf(this.node));
	}
	toPathData() {
		return Nf(this.node);
	}
}, uf = `X6.${lf.name}`;
// node_modules/@antv/x6/es/common/dom/text.js
function df(e, t) {
	let n = lf.create(t), r = lf.create("textPath"), i = e.d;
	if (i && e["xlink:href"] === void 0) {
		let e = lf.create("path").attr("d", i).appendTo(n.defs());
		r.attr("xlink:href", `#${e.id}`);
	}
	return typeof e == "object" && r.attr(e), r.node;
}
function ff(e, t, n) {
	let r = n.eol, i = n.baseSize, a = n.lineHeight, o = 0, s, c = {}, l = t.length - 1;
	for (let a = 0; a <= l; a += 1) {
		let c = t[a], u = null;
		if (typeof c == "object") {
			let e = c.attrs, t = lf.create("tspan", e);
			s = t.node;
			let d = c.t;
			r && a === l && (d += r), s.textContent = d;
			let f = e.class;
			f && t.addClass(f), n.includeAnnotationIndices && t.attr("annotations", c.annotations.join(",")), u = parseFloat(e["font-size"]), u === void 0 && (u = i), u && u > o && (o = u);
		} else r && a === l && (c += r), s = document.createTextNode(c || " "), i && i > o && (o = i);
		e.appendChild(s);
	}
	return o && (c.maxFontSize = o), a ? c.lineHeight = a : o && (c.lineHeight = o * 1.2), c;
}
var pf = /em$/;
function mf(e, t) {
	let n = parseFloat(e);
	return pf.test(e) ? n * t : n;
}
function hf(e, t, n, r) {
	if (!Array.isArray(t)) return 0;
	let i = t.length;
	if (!i) return 0;
	let a = t[0], o = mf(a.maxFontSize, n) || n, s = 0, c = mf(r, n);
	for (let e = 1; e < i; e += 1) {
		a = t[e];
		let r = mf(a.lineHeight, n) || c;
		s += r;
	}
	let l = mf(a.maxFontSize, n) || n, u;
	switch (e) {
		case "middle":
			u = o / 2 - .15 * l - s / 2;
			break;
		case "bottom":
			u = -(.25 * l) - s;
			break;
		default: u = .8 * o;
	}
	return u;
}
function gf(e, t, n = {}) {
	t = cf(t);
	let r = n.eol, i = n.textPath, a = n.textVerticalAnchor, o = a === "middle" || a === "bottom" || a === "top", s = n.x;
	s === void 0 && (s = e.getAttribute("x") || 0);
	let c = n.includeAnnotationIndices, l = n.annotations;
	l && !Array.isArray(l) && (l = [l]);
	let u = n.lineHeight, d = u === "auto", f = d ? "1.5em" : u || "1em", p = !0, m = e.childNodes;
	if (m.length === 1) {
		let e = m[0];
		e && e.tagName.toUpperCase() === "TITLE" && (p = !1);
	}
	p && od(e), W(e, {
		"xml:space": "preserve",
		display: t || n.displayEmpty ? null : "none"
	});
	let h = W(e, "font-size"), g = parseFloat(h);
	g || (g = 16, (o || l) && !h && W(e, "font-size", `${g}`));
	let _;
	i ? (typeof i == "string" && (i = { d: i }), _ = df(i, e)) : _ = document.createDocumentFragment();
	let v, y = 0, b, x = t.split("\n"), S = [], C = x.length - 1;
	for (let e = 0; e <= C; e += 1) {
		v = f;
		let t = "v-line", n = Xu("tspan"), a, o = x[e];
		if (o) {
			if (l) {
				a = ff(n, sf(o, l, {
					offset: -y,
					includeAnnotationIndices: c
				}), {
					eol: e !== C && r,
					baseSize: g,
					lineHeight: d ? null : f,
					includeAnnotationIndices: c
				});
				let t = a.lineHeight;
				t && d && e !== 0 && (v = t), e === 0 && (b = a.maxFontSize * .8);
			} else r && e !== C && (o += r), n.textContent = o;
		} else {
			n.textContent = "-", t += " v-empty-line";
			let e = n.style;
			e.fillOpacity = 0, e.strokeOpacity = 0, l && (a = {});
		}
		a && S.push(a), e > 0 && n.setAttribute("dy", v), (e > 0 || i) && n.setAttribute("x", s), n.className.baseVal = t, _.appendChild(n), y += o.length + 1;
	}
	if (o) {
		if (l) v = hf(a, S, g, f);
		else if (a === "top") v = "0.8em";
		else {
			let e;
			switch (C > 0 ? (e = parseFloat(f) || 1, e *= C, pf.test(f) || (e /= g)) : e = 0, a) {
				case "middle":
					v = `${.3 - e / 2}em`;
					break;
				case "bottom": v = `${-e - .3}em`;
			}
		}
	} else a === 0 ? v = "0em" : a ? v = a : (v = 0, e.getAttribute("y") ?? e.setAttribute("y", `${b || "0.8em"}`));
	_.firstChild.setAttribute("dy", v), e.appendChild(_);
}
function _f(e, t = {}) {
	let n = document.createElement("canvas").getContext("2d");
	if (!e) return { width: 0 };
	let r = [], i = t["font-size"] ? `${parseFloat(t["font-size"])}px` : "14px";
	return r.push(t["font-style"] || "normal"), r.push(t["font-variant"] || "normal"), r.push(t["font-weight"] || 400), r.push(i), r.push(t["font-family"] || "sans-serif"), n.font = r.join(" "), n.measureText(e);
}
function vf(e, t, n, r = {}) {
	if (t >= n) return [e, ""];
	let i = e.length, a = {}, o = Math.round(t / n * i - 1);
	for (o < 0 && (o = 0); o >= 0 && o < i;) {
		let n = e.slice(0, o), i = a[n] || _f(n, r).width, s = e.slice(0, o + 1), c = a[s] || _f(s, r).width;
		if (a[n] = i, a[s] = c, i > t) --o;
		else if (c <= t) o += 1;
		else break;
	}
	return [e.slice(0, o), e.slice(o)];
}
function yf(e, t, n = {}, r = {}) {
	let i = t.width, a = t.height, o = r.eol || "\n", s = n.fontSize || 14, c = n.lineHeight ? parseFloat(n.lineHeight) : Math.ceil(s * 1.4), l = Math.floor(a / c);
	if (e.indexOf(o) > -1) {
		let i = Vd(), a = [];
		return e.split(o).forEach((e) => {
			let o = yf(e, Object.assign(Object.assign({}, t), { height: 2 ** 53 - 1 }), n, Object.assign(Object.assign({}, r), { eol: i }));
			o && a.push(...o.split(i));
		}), a.slice(0, l).join(o);
	}
	let { width: u } = _f(e, n);
	if (u < i) return e;
	let d = [], f = e, p = u, m = r.ellipsis, h = 0;
	m && (typeof m != "string" && (m = "…"), h = _f(m, n).width);
	for (let e = 0; e < l; e += 1) if (p > i) {
		if (e === l - 1) {
			let [e] = vf(f, i - h, p, n);
			d.push(m ? `${e}${m}` : e);
		} else {
			let [e, t] = vf(f, i, p, n);
			d.push(e), f = t, p = _f(f, n).width;
		}
	} else {
		d.push(f);
		break;
	}
	return d.join(o);
}
// node_modules/@antv/x6/es/common/dom/path.js
var bf = .551784;
function xf(e, t, n = NaN) {
	let r = e.getAttribute(t);
	if (r == null) return n;
	let i = parseFloat(r);
	return Number.isNaN(i) ? n : i;
}
function Sf(e, t = 1) {
	let n = e.getTotalLength(), r = [], i = 0, a;
	for (; i < n;) a = e.getPointAtLength(i), r.push({
		distance: i,
		x: a.x,
		y: a.y
	}), i += t;
	return r;
}
function Cf(e) {
	return [
		"M",
		xf(e, "x1"),
		xf(e, "y1"),
		"L",
		xf(e, "x2"),
		xf(e, "y2")
	].join(" ");
}
function wf(e) {
	let t = Df(e);
	return t.length === 0 ? null : `${Ef(t)} Z`;
}
function Tf(e) {
	let t = Df(e);
	return t.length === 0 ? null : Ef(t);
}
function Ef(e) {
	return `M ${e.map((e) => `${e.x} ${e.y}`).join(" L")}`;
}
function Df(e) {
	let t = [], n = e.points;
	if (n) for (let e = 0, r = n.numberOfItems; e < r; e += 1) t.push(n.getItem(e));
	return t;
}
function Of(e) {
	let t = xf(e, "cx", 0), n = xf(e, "cy", 0), r = xf(e, "r"), i = r * bf;
	return [
		"M",
		t,
		n - r,
		"C",
		t + i,
		n - r,
		t + r,
		n - i,
		t + r,
		n,
		"C",
		t + r,
		n + i,
		t + i,
		n + r,
		t,
		n + r,
		"C",
		t - i,
		n + r,
		t - r,
		n + i,
		t - r,
		n,
		"C",
		t - r,
		n - i,
		t - i,
		n - r,
		t,
		n - r,
		"Z"
	].join(" ");
}
function kf(e) {
	let t = xf(e, "cx", 0), n = xf(e, "cy", 0), r = xf(e, "rx"), i = xf(e, "ry") || r, a = r * bf, o = i * bf;
	return [
		"M",
		t,
		n - i,
		"C",
		t + a,
		n - i,
		t + r,
		n - o,
		t + r,
		n,
		"C",
		t + r,
		n + o,
		t + a,
		n + i,
		t,
		n + i,
		"C",
		t - a,
		n + i,
		t - r,
		n + o,
		t - r,
		n,
		"C",
		t - r,
		n - o,
		t - a,
		n - i,
		t,
		n - i,
		"Z"
	].join(" ");
}
function Af(e) {
	return jf({
		x: xf(e, "x", 0),
		y: xf(e, "y", 0),
		width: xf(e, "width", 0),
		height: xf(e, "height", 0),
		rx: xf(e, "rx", 0),
		ry: xf(e, "ry", 0)
	});
}
function jf(e) {
	let t, n = e.x, r = e.y, i = e.width, a = e.height, o = Math.min(e.rx || e["top-rx"] || 0, i / 2), s = Math.min(e.rx || e["bottom-rx"] || 0, i / 2), c = Math.min(e.ry || e["top-ry"] || 0, a / 2), l = Math.min(e.ry || e["bottom-ry"] || 0, a / 2);
	return t = o || s || c || l ? [
		"M",
		n,
		r + c,
		"v",
		a - c - l,
		"a",
		s,
		l,
		0,
		0,
		0,
		s,
		l,
		"h",
		i - 2 * s,
		"a",
		s,
		l,
		0,
		0,
		0,
		s,
		-l,
		"v",
		-(a - l - c),
		"a",
		o,
		c,
		0,
		0,
		0,
		-o,
		-c,
		"h",
		-(i - 2 * o),
		"a",
		o,
		c,
		0,
		0,
		0,
		-o,
		c,
		"Z"
	] : [
		"M",
		n,
		r,
		"H",
		n + i,
		"V",
		r + a,
		"H",
		n,
		"V",
		r,
		"Z"
	], t.join(" ");
}
function Mf(e) {
	let t = Xu("path");
	W(t, W(e));
	let n = Nf(e);
	return n && t.setAttribute("d", n), t;
}
function Nf(e) {
	let t = e.tagName.toLowerCase();
	switch (t) {
		case "path": return e.getAttribute("d");
		case "line": return Cf(e);
		case "polygon": return wf(e);
		case "polyline": return Tf(e);
		case "ellipse": return kf(e);
		case "circle": return Of(e);
		case "rect": return Af(e);
	}
	throw Error(`"${t}" cannot be converted to svg path element.`);
}
// node_modules/@antv/x6/es/common/dom/matrix.js
var Pf = /(\w+)\(([^,)]+),?([^)]+)?\)/gi, Ff = /[ ,]+/, If = /^(\w+)\((.*)\)/;
function Lf(e, t) {
	let n = Xu("svg").createSVGPoint();
	return n.x = e, n.y = t, n;
}
function Rf(e) {
	let t = Xu("svg").createSVGMatrix();
	if (e != null) {
		let n = e;
		for (let e of [
			"a",
			"b",
			"c",
			"d",
			"e",
			"f"
		]) n[e] !== void 0 && (t[e] = n[e]);
	}
	return t;
}
function zf(e) {
	let t = Xu("svg");
	return e == null ? t.createSVGTransform() : (e instanceof DOMMatrix || (e = Rf(e)), t.createSVGTransformFromMatrix(e));
}
function Bf(e) {
	let t = Rf(), n = e != null && e.match(Pf);
	if (!n) return t;
	for (let e = 0, r = n.length; e < r; e += 1) {
		let r = n[e].match(If);
		if (r) {
			let e, n, i, a, o, s = Rf(), c = r[2].split(Ff);
			switch (r[1].toLowerCase()) {
				case "scale":
					e = parseFloat(c[0]), n = c[1] === void 0 ? e : parseFloat(c[1]), s = s.scaleNonUniform(e, n);
					break;
				case "translate":
					i = parseFloat(c[0]), a = parseFloat(c[1]), s = s.translate(i, a);
					break;
				case "rotate":
					o = parseFloat(c[0]), i = parseFloat(c[1]) || 0, a = parseFloat(c[2]) || 0, s = i !== 0 || a !== 0 ? s.translate(i, a).rotate(o).translate(-i, -a) : s.rotate(o);
					break;
				case "skewx":
					o = parseFloat(c[0]), s = s.skewX(o);
					break;
				case "skewy":
					o = parseFloat(c[0]), s = s.skewY(o);
					break;
				case "matrix":
					s.a = parseFloat(c[0]), s.b = parseFloat(c[1]), s.c = parseFloat(c[2]), s.d = parseFloat(c[3]), s.e = parseFloat(c[4]), s.f = parseFloat(c[5]);
					break;
				default: continue;
			}
			t = t.multiply(s);
		}
	}
	return t;
}
function Vf(e) {
	let t = e || {};
	return `matrix(${t.a == null ? 1 : t.a},${t.b == null ? 0 : t.b},${t.c == null ? 0 : t.c},${t.d == null ? 1 : t.d},${t.e == null ? 0 : t.e},${t.f == null ? 0 : t.f})`;
}
function Hf(e) {
	let t, n, r;
	if (e) {
		let i = Ff;
		if (e.trim().indexOf("matrix") >= 0) {
			let i = Wf(Bf(e));
			t = [i.translateX, i.translateY], n = [i.rotation], r = [i.scaleX, i.scaleY];
			let a = [];
			(t[0] !== 0 || t[1] !== 0) && a.push(`translate(${t.join(",")})`), (r[0] !== 1 || r[1] !== 1) && a.push(`scale(${r.join(",")})`), n[0] !== 0 && a.push(`rotate(${n[0]})`), e = a.join(" ");
		} else {
			let a = e.match(/translate\((.*?)\)/);
			a && (t = a[1].split(i));
			let o = e.match(/rotate\((.*?)\)/);
			o && (n = o[1].split(i));
			let s = e.match(/scale\((.*?)\)/);
			s && (r = s[1].split(i));
		}
	}
	let i = r && r[0] ? parseFloat(r[0]) : 1;
	return {
		raw: e || "",
		translation: {
			tx: t && t[0] ? parseInt(t[0], 10) : 0,
			ty: t && t[1] ? parseInt(t[1], 10) : 0
		},
		rotation: {
			angle: n && n[0] ? parseInt(n[0], 10) : 0,
			cx: n && n[1] ? parseInt(n[1], 10) : void 0,
			cy: n && n[2] ? parseInt(n[2], 10) : void 0
		},
		scale: {
			sx: i,
			sy: r && r[1] ? parseFloat(r[1]) : i
		}
	};
}
function Uf(e, t) {
	return {
		x: t.x * e.a + t.y * e.c + 0,
		y: t.x * e.b + t.y * e.d + 0
	};
}
function Wf(e) {
	let t = Uf(e, {
		x: 0,
		y: 1
	}), n = Uf(e, {
		x: 1,
		y: 0
	}), r = 180 / Math.PI * Math.atan2(t.y, t.x) - 90;
	return {
		skewX: r,
		skewY: 180 / Math.PI * Math.atan2(n.y, n.x),
		translateX: e.e,
		translateY: e.f,
		scaleX: Math.sqrt(e.a * e.a + e.b * e.b),
		scaleY: Math.sqrt(e.c * e.c + e.d * e.d),
		rotation: r
	};
}
function Gf(e) {
	let t, n, r, i;
	return e ? (t = e.a == null ? 1 : e.a, i = e.d == null ? 1 : e.d, n = e.b, r = e.c) : t = i = 1, {
		sx: n ? Math.sqrt(t * t + n * n) : t,
		sy: r ? Math.sqrt(r * r + i * i) : i
	};
}
function Kf(e) {
	let t = {
		x: 0,
		y: 1
	};
	e && (t = Uf(e, t));
	let n = 180 * Math.atan2(t.y, t.x) / Math.PI % 360 - 90;
	return { angle: n % 360 + (n < 0 ? 360 : 0) };
}
function qf(e) {
	return {
		tx: e && e.e || 0,
		ty: e && e.f || 0
	};
}
// node_modules/@antv/x6/es/common/dom/transform.js
function Jf(e, t, n = {}) {
	if (t == null) return Bf(W(e, "transform"));
	if (n.absolute) {
		e.setAttribute("transform", Vf(t));
		return;
	}
	let r = e.transform, i = zf(t);
	r.baseVal.appendItem(i);
}
function Yf(e, t, n = 0, r = {}) {
	let i = W(e, "transform"), a = Hf(i);
	if (t == null) return a.translation;
	i = a.raw, i = i.replace(/translate\([^)]*\)/g, "").trim();
	let o = `translate(${r.absolute ? t : a.translation.tx + t},${r.absolute ? n : a.translation.ty + n})`;
	e.setAttribute("transform", `${o} ${i}`.trim());
}
function Xf(e, t, n, r, i = {}) {
	let a = W(e, "transform"), o = Hf(a);
	if (t == null) return o.rotation;
	a = o.raw, a = a.replace(/rotate\([^)]*\)/g, "").trim(), t %= 360;
	let s = `rotate(${i.absolute ? t : o.rotation.angle + t}${n != null && r != null ? `,${n},${r}` : ""})`;
	e.setAttribute("transform", `${a} ${s}`.trim());
}
function Zf(e, t, n) {
	let r = W(e, "transform"), i = Hf(r);
	if (t == null) return i.scale;
	n ??= t, r = i.raw, r = r.replace(/scale\([^)]*\)/g, "").trim();
	let a = `scale(${t},${n})`;
	e.setAttribute("transform", `${r} ${a}`.trim());
}
function Qf(e, t) {
	if (Ku(t) && Ku(e)) {
		let n = t.getScreenCTM(), r = e.getScreenCTM();
		if (n && r) return n.inverse().multiply(r);
	}
	return Rf();
}
function $f(e, t) {
	let n = Rf();
	if (Ku(t) && Ku(e)) {
		let r = e, i = [];
		for (; r && r !== t;) {
			let e = Bf(r.getAttribute("transform") || null);
			i.push(e), r = r.parentNode;
		}
		i.reverse().forEach((e) => {
			n = n.multiply(e);
		});
	}
	return n;
}
function ep(e, t, n) {
	let r = e instanceof SVGSVGElement ? e : e.ownerSVGElement, i = r.createSVGPoint();
	i.x = t, i.y = n;
	try {
		let t = r.getScreenCTM(), n = i.matrixTransform(t.inverse()), a = Qf(e, r).inverse();
		return n.matrixTransform(a);
	} catch {
		return i;
	}
}
// node_modules/@antv/x6/es/common/dom/event/hook.js
var tp = {};
function np(e) {
	return tp[e] || {};
}
function rp(e, t) {
	tp[e] = t;
}
// node_modules/@antv/x6/es/common/dom/event/store.js
var ip = /* @__PURE__ */ new WeakMap();
function ap(e) {
	return ip.has(e) || ip.set(e, { events: Object.create(null) }), ip.get(e);
}
function op(e) {
	return ip.get(e);
}
function sp(e) {
	return ip.delete(e);
}
// node_modules/@antv/x6/es/common/dom/event/util.js
var cp = () => !0, lp = () => !1;
function up(e) {
	e.stopPropagation();
}
function dp(e, t, n) {
	e.addEventListener != null && e.addEventListener(t, n);
}
function fp(e, t, n) {
	e.removeEventListener != null && e.removeEventListener(t, n);
}
var pp = /[^\x20\t\r\n\f]+/g, mp = /^([^.]*)(?:\.(.+)|)/;
function hp(e) {
	return (e || "").match(pp) || [""];
}
function gp(e) {
	let t = mp.exec(e) || [];
	return {
		originType: t[1] ? t[1].trim() : t[1],
		namespaces: t[2] ? t[2].split(".").map((e) => e.trim()).sort() : []
	};
}
function _p(e) {
	return e.nodeType === 1 || e.nodeType === 9 || !+e.nodeType;
}
var vp = 0, yp = /* @__PURE__ */ new WeakMap();
function bp(e) {
	return yp.has(e) || (yp.set(e, vp), vp += 1), yp.get(e);
}
function xp(e) {
	return yp.get(e);
}
function Sp(e) {
	return yp.delete(e);
}
function Cp(e, t) {
	return yp.set(e, t);
}
function wp(e, t) {
	let n = [], r = op(e), i = r && r.events && r.events[t.type], a = i && i.handlers || [], o = i ? i.delegateCount : 0;
	if (o > 0 && !(t.type === "click" && typeof t.button == "number" && t.button >= 1)) {
		for (let r = t.target; r !== e; r = r.parentNode || e) if (r.nodeType === 1 && (t.type !== "click" || r.disabled !== !0)) {
			let t = [], i = {};
			for (let n = 0; n < o; n += 1) {
				let o = a[n], s = o.selector;
				if (s != null && i[s] == null) {
					let t = e, n = [];
					t.querySelectorAll(s).forEach((e) => {
						n.push(e);
					}), i[s] = n.includes(r);
				}
				i[s] && t.push(o);
			}
			t.length && n.push({
				elem: r,
				handlers: t
			});
		}
	}
	return o < a.length && n.push({
		elem: e,
		handlers: a.slice(o)
	}), n;
}
function Tp(e) {
	return e != null && e === e.window;
}
function Ep(e, t) {
	let n = e.nodeType === 9 ? e.documentElement : e, r = t && t.parentNode;
	return e === r || !!(r && r.nodeType === 1 && (n.contains ? n.contains(r) : e.compareDocumentPosition && e.compareDocumentPosition(r) & 16));
}
// node_modules/@antv/x6/es/common/dom/event/object.js
var Dp = class e {
	static create(t) {
		return t instanceof e ? t : new e(t);
	}
	static addProperty(t, n) {
		Object.defineProperty(e.prototype, t, {
			enumerable: !0,
			configurable: !0,
			get: typeof n == "function" ? function() {
				if (this.originalEvent) return n(this.originalEvent);
			} : function() {
				if (this.originalEvent) return this.originalEvent[t];
			},
			set(e) {
				Object.defineProperty(this, t, {
					enumerable: !0,
					configurable: !0,
					writable: !0,
					value: e
				});
			}
		});
	}
	constructor(e, t) {
		this.isDefaultPrevented = lp, this.isPropagationStopped = lp, this.isImmediatePropagationStopped = lp, this.isSimulated = !1, this.preventDefault = () => {
			let e = this.originalEvent;
			this.isDefaultPrevented = cp, e && !this.isSimulated && e.preventDefault();
		}, this.stopPropagation = () => {
			let e = this.originalEvent;
			this.isPropagationStopped = cp, e && !this.isSimulated && e.stopPropagation();
		}, this.stopImmediatePropagation = () => {
			let e = this.originalEvent;
			this.isImmediatePropagationStopped = cp, e && !this.isSimulated && e.stopImmediatePropagation(), this.stopPropagation();
		}, typeof e == "string" ? this.type = e : e.type && (this.originalEvent = e, this.type = e.type, this.isDefaultPrevented = e.defaultPrevented ? cp : lp, this.target = e.target, this.currentTarget = e.currentTarget, this.relatedTarget = e.relatedTarget, this.timeStamp = e.timeStamp), t && Object.assign(this, t), this.timeStamp ||= Date.now();
	}
}, Op = {
	bubbles: !0,
	cancelable: !0,
	eventPhase: !0,
	detail: !0,
	view: !0,
	button: !0,
	buttons: !0,
	clientX: !0,
	clientY: !0,
	offsetX: !0,
	offsetY: !0,
	pageX: !0,
	pageY: !0,
	screenX: !0,
	screenY: !0,
	toElement: !0,
	pointerId: !0,
	pointerType: !0,
	char: !0,
	code: !0,
	charCode: !0,
	key: !0,
	keyCode: !0,
	touches: !0,
	changedTouches: !0,
	targetTouches: !0,
	which: !0,
	altKey: !0,
	ctrlKey: !0,
	metaKey: !0,
	shiftKey: !0
};
Object.keys(Op).forEach((e) => Dp.addProperty(e, Op[e])), rp("load", { noBubble: !0 }), rp("beforeunload", { postDispatch(e, t) {
	t.result !== void 0 && t.originalEvent && (t.originalEvent.returnValue = t.result);
} }), rp("mouseenter", {
	delegateType: "mouseover",
	bindType: "mouseover",
	handle(e, t) {
		let n, r = t.relatedTarget, i = t.handleObj;
		return (!r || r !== e && !Ep(e, r)) && (t.type = i.originType, n = i.handler.call(e, t), t.type = "mouseover"), n;
	}
}), rp("mouseleave", {
	delegateType: "mouseout",
	bindType: "mouseout",
	handle(e, t) {
		let n, r = t.relatedTarget, i = t.handleObj;
		return (!r || r !== e && !Ep(e, r)) && (t.type = i.originType, n = i.handler.call(e, t), t.type = "mouseout"), n;
	}
});
// node_modules/@antv/x6/es/common/dom/event/core.js
var kp;
function Ap(e, t, n, r, i) {
	if (!_p(e)) return;
	let a;
	if (typeof n != "function") {
		let { handler: e, selector: t } = n, r = d(n, ["handler", "selector"]);
		n = e, i = t, a = r;
	}
	let o = ap(e), s = o.handler;
	s ??= o.handler = function(t, ...n) {
		return kp === t.type ? void 0 : Mp(e, t, ...n);
	};
	let c = bp(n);
	hp(t).forEach((t) => {
		let { originType: l, namespaces: u } = gp(t);
		if (!l) return;
		let d = l, f = np(d);
		d = (i ? f.delegateType : f.bindType) || d, f = np(d);
		let p = Object.assign({
			type: d,
			originType: l,
			data: r,
			selector: i,
			guid: c,
			handler: n,
			namespace: u.join(".")
		}, a), m = o.events, h = m[d];
		h || (h = m[d] = {
			handlers: [],
			delegateCount: 0
		}, f.setup && f.setup(e, r, u, s) !== !1 || dp(e, d, s)), f.add && (Sp(p.handler), f.add(e, p), Cp(p.handler, c)), i ? (h.handlers.splice(h.delegateCount, 0, p), h.delegateCount += 1) : h.handlers.push(p);
	});
}
function jp(e, t, n, r, i) {
	let a = op(e);
	if (!a) return;
	let o = a.events;
	o && (hp(t).forEach((t) => {
		let { originType: s, namespaces: c } = gp(t);
		if (!s) {
			Object.keys(o).forEach((i) => {
				jp(e, i + t, n, r, !0);
			});
			return;
		}
		let l = s, u = np(l);
		l = (r ? u.delegateType : u.bindType) || l;
		let d = o[l];
		if (!d) return;
		let f = c.length > 0 ? RegExp(`(^|\\.)${c.join("\\.(?:.*\\.|)")}(\\.|$)`) : null, p = d.handlers.length;
		for (let t = d.handlers.length - 1; t >= 0; --t) {
			let a = d.handlers[t];
			(i || s === a.originType) && (!n || xp(n) === a.guid) && (f == null || a.namespace && f.test(a.namespace)) && (r == null || r === a.selector || r === "**" && a.selector) && (d.handlers.splice(t, 1), a.selector && --d.delegateCount, u.remove && u.remove(e, a));
		}
		p && d.handlers.length === 0 && (u.teardown && u.teardown(e, c, a.handler) !== !1 || fp(e, l, a.handler), delete o[l]);
	}), Object.keys(o).length === 0 && sp(e));
}
function Mp(e, t, ...n) {
	let r = Dp.create(t);
	r.delegateTarget = e;
	let i = np(r.type);
	if (i.preDispatch && i.preDispatch(e, r) === !1) return;
	let a = wp(e, r);
	for (let e = 0, t = a.length; e < t && !r.isPropagationStopped(); e += 1) {
		let t = a[e];
		r.currentTarget = t.elem;
		for (let e = 0, i = t.handlers.length; e < i && !r.isImmediatePropagationStopped(); e += 1) {
			let i = t.handlers[e];
			if (r.rnamespace == null || i.namespace && r.rnamespace.test(i.namespace)) {
				r.handleObj = i, r.data = i.data;
				let e = np(i.originType).handle, a = e ? e(t.elem, r, ...n) : i.handler.call(t.elem, r, ...n);
				a !== void 0 && (r.result = a, a === !1 && (r.preventDefault(), r.stopPropagation()));
			}
		}
	}
	return i.postDispatch && i.postDispatch(e, r), r.result;
}
function Np(e, t, n, r) {
	let i = e, a = typeof e == "string" ? e : e.type, o = typeof e == "string" || i.namespace == null ? [] : i.namespace.split("."), s = n;
	if (s.nodeType === 3 || s.nodeType === 8) return;
	a.indexOf(".") > -1 && (o = a.split("."), a = o.shift(), o.sort());
	let c = a.indexOf(":") < 0 && `on${a}`;
	i = e instanceof Dp ? e : new Dp(a, typeof e == "object" ? e : null), i.namespace = o.join("."), i.rnamespace = i.namespace ? RegExp(`(^|\\.)${o.join("\\.(?:.*\\.|)")}(\\.|$)`) : null, i.result = void 0, i.target || (i.target = s);
	let l = [i];
	Array.isArray(t) ? l.push(...t) : l.push(t);
	let u = np(a);
	if (!r && u.trigger && u.trigger(s, i, t) === !1) return;
	let d, f = [s];
	if (!r && !u.noBubble && !Tp(s)) {
		d = u.delegateType || a;
		let e = s, t = s.parentNode;
		for (; t != null;) f.push(t), e = t, t = t.parentNode;
		let n = s.ownerDocument || document;
		if (e === n) {
			let t = e.defaultView || e.parentWindow || window;
			f.push(t);
		}
	}
	let p = s;
	for (let e = 0, t = f.length; e < t && !i.isPropagationStopped(); e += 1) {
		let t = f[e];
		p = t, i.type = e > 1 ? d : u.bindType || a;
		let n = op(t);
		n && n.events[i.type] && n.handler && n.handler.call(t, ...l);
		let r = c && t[c] || null;
		r && _p(t) && (i.result = r.call(t, ...l), i.result === !1 && i.preventDefault());
	}
	if (i.type = a, !r && !i.isDefaultPrevented()) {
		let e = u.preventDefault;
		if ((e == null || e(f.pop(), i, t) === !1) && _p(s) && c && typeof s[a] == "function" && !Tp(s)) {
			let e = s[c];
			e && (s[c] = null), kp = a, i.isPropagationStopped() && p.addEventListener(a, up), s[a](), i.isPropagationStopped() && p.removeEventListener(a, up), kp = void 0, e && (s[c] = e);
		}
	}
	return i.result;
}
// node_modules/@antv/x6/es/common/dom/event/main.js
var K = class {
	static on(e, t, n, r, i) {
		return Pp.on(e, t, n, r, i), e;
	}
	static once(e, t, n, r, i) {
		return Pp.on(e, t, n, r, i, !0), e;
	}
	static off(e, t, n, r) {
		return Pp.off(e, t, n, r), e;
	}
	static trigger(e, t, n, r) {
		return Np(t, n, e, r), e;
	}
}, Pp;
(function(e) {
	function t(n, r, i, a, o, s) {
		if (typeof r == "object") typeof i != "string" && (a ||= i, i = void 0), Object.keys(r).forEach((e) => t(n, e, i, a, r[e], s));
		else {
			if (a == null && o == null ? (o = i, a = i = void 0) : o ?? (typeof i == "string" ? (o = a, a = void 0) : (o = a, a = i, i = void 0)), o === !1) o = lp;
			else if (!o) return;
			if (s) {
				let t = o;
				o = function(r, ...i) {
					return e.off(n, r), t.call(this, r, ...i);
				}, Cp(o, bp(t));
			}
			Ap(n, r, o, a, i);
		}
	}
	e.on = t;
	function n(e, t, r, i) {
		let a = t;
		if (a && a.preventDefault != null && a.handleObj != null) {
			let e = a.handleObj;
			n(a.delegateTarget, e.namespace ? `${e.originType}.${e.namespace}` : e.originType, e.selector, e.handler);
		} else if (typeof t == "object") {
			let i = t;
			Object.keys(i).forEach((t) => n(e, t, r, i[t]));
		} else (r === !1 || typeof r == "function") && (i = r, r = void 0), i === !1 && (i = lp), jp(e, t, i, r);
	}
	e.off = n;
})(Pp ||= {});
// node_modules/@antv/x6/es/common/dom/mousewheel.js
var Fp = class {
	constructor(e, t, n) {
		this.animationFrameId = 0, this.deltaX = 0, this.deltaY = 0, this.eventName = zl("wheel") ? "wheel" : "mousewheel", this.target = e, this.onWheelCallback = t, this.onWheelGuard = n, this.onWheel = this.onWheel.bind(this), this.didWheel = this.didWheel.bind(this);
	}
	enable() {
		this.target.addEventListener(this.eventName, this.onWheel, { passive: !1 });
	}
	disable() {
		this.target.removeEventListener(this.eventName, this.onWheel);
	}
	onWheel(e) {
		if (this.onWheelGuard != null && !this.onWheelGuard(e)) return;
		this.deltaX += e.deltaX, this.deltaY += e.deltaY, e.preventDefault();
		let t;
		(this.deltaX !== 0 || this.deltaY !== 0) && (e.stopPropagation(), t = !0), t === !0 && this.animationFrameId === 0 && (this.animationFrameId = requestAnimationFrame(() => {
			this.didWheel(e);
		}));
	}
	didWheel(e) {
		this.animationFrameId = 0, this.onWheelCallback(e, this.deltaX, this.deltaY), this.deltaX = 0, this.deltaY = 0;
	}
};
// node_modules/@antv/x6/es/common/dom/position.js
function Ip(e) {
	let t = e.getBoundingClientRect(), n = e.ownerDocument.defaultView;
	return {
		top: t.top + n.pageYOffset,
		left: t.left + n.pageXOffset
	};
}
function Lp(e) {
	return e.getBoundingClientRect().width;
}
function Rp(e) {
	return e.getBoundingClientRect().height;
}
function zp(e) {
	let t = Ld(e, "position") === "fixed", n;
	if (t) {
		let t = e.getBoundingClientRect();
		n = {
			left: t.left,
			top: t.top
		};
	} else n = Ip(e);
	if (!t) {
		let t = e.ownerDocument, r = e.offsetParent || t.documentElement;
		for (; (r === t.body || r === t.documentElement) && Ld(r, "position") === "static";) r = r.parentNode;
		if (r !== e && fd(r)) {
			let e = Ip(r);
			n.top -= e.top + Rd(r, "borderTopWidth"), n.left -= e.left + Rd(r, "borderLeftWidth");
		}
	}
	return {
		top: n.top - Rd(e, "marginTop"),
		left: n.left - Rd(e, "marginLeft")
	};
}
// node_modules/@antv/x6/es/common/util/index.js
function Bp(e, t) {
	let n = Lf(e.x, e.y).matrixTransform(t);
	return new z(n.x, n.y);
}
function Vp(e, t) {
	return new V(Bp(e.start, t), Bp(e.end, t));
}
function Hp(e, t) {
	let n = Xu("svg").createSVGPoint();
	n.x = e.x, n.y = e.y;
	let r = n.matrixTransform(t);
	n.x = e.x + e.width, n.y = e.y;
	let i = n.matrixTransform(t);
	n.x = e.x + e.width, n.y = e.y + e.height;
	let a = n.matrixTransform(t);
	n.x = e.x, n.y = e.y + e.height;
	let o = n.matrixTransform(t), s = Math.min(r.x, i.x, a.x, o.x), c = Math.max(r.x, i.x, a.x, o.x), l = Math.min(r.y, i.y, a.y, o.y), u = Math.max(r.y, i.y, a.y, o.y);
	return new B(s, l, c - s, u - l);
}
function Up(e, t, n) {
	let r = null, i = e.ownerSVGElement;
	if (!i) return new B(0, 0, 0, 0);
	try {
		r = e.getBBox();
	} catch {
		r = {
			x: e.clientLeft,
			y: e.clientTop,
			width: e.clientWidth,
			height: e.clientHeight
		};
	}
	if (t) return B.create(r);
	let a = Qf(e, n || i);
	return Hp(r, a);
}
function Wp(e, t = {}) {
	let n = null;
	if (!e.ownerSVGElement || !Ku(e)) {
		if (pd(e)) {
			let { left: t, top: n, width: r, height: i } = Gp(e);
			return new B(t, n, r, i);
		}
		return new B(0, 0, 0, 0);
	}
	let r = t.target;
	if (!t.recursive) {
		try {
			n = e.getBBox();
		} catch {
			n = {
				x: e.clientLeft,
				y: e.clientTop,
				width: e.clientWidth,
				height: e.clientHeight
			};
		}
		if (!r) return B.create(n);
		let t = Qf(e, r);
		return Hp(n, t);
	}
	{
		let t = e.childNodes, n = t.length;
		if (n === 0) return Wp(e, { target: r });
		r ||= e;
		let i = null;
		for (let e = 0; e < n; e += 1) {
			let n = t[e], a = null;
			a = n.childNodes.length === 0 ? Wp(n, { target: r }) : Wp(n, {
				target: r,
				recursive: !0
			}), i = i ? i.union(a) : B.create(a);
		}
		return i || new B(0, 0, 0, 0);
	}
}
function Gp(e) {
	let t = 0, n = 0, r = 0, i = 0;
	if (e) {
		let a = e;
		for (; a;) t += a.offsetLeft, n += a.offsetTop, a = a.offsetParent, a && (t += parseInt(Pd(a, "borderLeft"), 10), n += parseInt(Pd(a, "borderTop"), 10));
		r = e.offsetWidth, i = e.offsetHeight;
	}
	return {
		left: t,
		top: n,
		width: r,
		height: i
	};
}
function Kp(e) {
	let t = (t) => {
		let n = e.getAttribute(t), r = n ? parseFloat(n) : 0;
		return Number.isNaN(r) ? 0 : r;
	};
	switch (e instanceof SVGElement && e.nodeName.toLowerCase()) {
		case "rect": return new B(t("x"), t("y"), t("width"), t("height"));
		case "circle": return new fu(t("cx"), t("cy"), t("r"), t("r"));
		case "ellipse": return new fu(t("cx"), t("cy"), t("rx"), t("ry"));
		case "polyline": return new yu(Df(e));
		case "polygon": {
			let t = Df(e);
			return t.length > 1 && t.push(t[0]), new yu(t);
		}
		case "path": {
			let t = e.getAttribute("d");
			return mu(t) || (t = Pu(t)), H.parse(t);
		}
		case "line": return new V(t("x1"), t("y1"), t("x2"), t("y2"));
	}
	return Wp(e);
}
function qp(e) {
	if (e == null) return null;
	let t = e;
	do {
		let e = t.tagName;
		if (typeof e != "string") return null;
		if (e = e.toUpperCase(), Bu(t, "x6-port")) t = t.nextElementSibling;
		else if (e === "G") t = t.firstElementChild;
		else if (e === "TITLE") t = t.nextElementSibling;
		else break;
	} while (t);
	return t;
}
function Jp(e) {
	let t = qp(e);
	if (!Ku(t)) {
		if (pd(e)) {
			let { left: t, top: n, width: r, height: i } = Gp(e);
			return new B(t, n, r, i);
		}
		return new B(0, 0, 0, 0);
	}
	return Kp(t).bbox() || B.create();
}
// node_modules/@antv/x6/es/common/algorithm/priorityqueue.js
var Yp = (e, t) => e - t, Xp = class {
	constructor(e = {}) {
		this.comparator = e.comparator || Yp, this.index = {}, this.data = e.data || [], this.heapify();
	}
	isEmpty() {
		return this.data.length === 0;
	}
	insert(e, t, n) {
		let r = {
			priority: e,
			value: t
		}, i = this.data.length;
		return n && (r.id = n, this.index[n] = i), this.data.push(r), this.bubbleUp(i), this;
	}
	peek() {
		return this.data[0] ? this.data[0].value : null;
	}
	peekPriority() {
		return this.data[0] ? this.data[0].priority : null;
	}
	updatePriority(e, t) {
		let n = this.index[e];
		if (n === void 0) throw Error(`Node with id '${e}' was not found in the heap.`);
		let r = this.data, i = r[n].priority, a = this.comparator(t, i);
		a < 0 ? (r[n].priority = t, this.bubbleUp(n)) : a > 0 && (r[n].priority = t, this.bubbleDown(n));
	}
	remove() {
		let e = this.data, t = e[0], n = e.pop();
		return t?.id && delete this.index[t.id], e.length > 0 && (e[0] = n, n.id && (this.index[n.id] = 0), this.bubbleDown(0)), t ? t.value : null;
	}
	heapify() {
		for (let e = 0; e < this.data.length; e += 1) this.bubbleUp(e);
	}
	bubbleUp(e) {
		let t = this.data, n, r, i = e;
		for (; i > 0 && (r = i - 1 >>> 1, this.comparator(t[i].priority, t[r].priority) < 0);) {
			n = t[r], t[r] = t[i];
			let e = t[i].id;
			e != null && (this.index[e] = r), t[i] = n, e = t[i].id, e != null && (this.index[e] = i), i = r;
		}
	}
	bubbleDown(e) {
		let t = this.data, n = t.length - 1, r = e;
		for (;;) {
			let e = (r << 1) + 1, i = e + 1, a = r;
			if (e <= n && this.comparator(t[e].priority, t[a].priority) < 0 && (a = e), i <= n && this.comparator(t[i].priority, t[a].priority) < 0 && (a = i), a !== r) {
				let e = t[a];
				t[a] = t[r];
				let n = t[r].id;
				n != null && (this.index[n] = a), t[r] = e, n = t[r].id, n != null && (this.index[n] = r), r = a;
			} else break;
		}
	}
};
// node_modules/@antv/x6/es/common/algorithm/dijkstra.js
function Zp(e, t, n = (e, t) => 1) {
	let r = {}, i = {}, a = {}, o = new Xp();
	for (r[t] = 0, Object.keys(e).forEach((e) => {
		e !== t && (r[e] = Infinity), o.insert(r[e], e, e);
	}); !o.isEmpty();) {
		let t = o.remove();
		a[t] = !0;
		let s = e[t];
		for (let e = 0; e < s.length; e += 1) {
			let c = s[e];
			if (!a[c]) {
				let e = r[t] + n(t, c);
				e < r[c] && (r[c] = e, i[c] = t, o.updatePriority(c, e));
			}
		}
	}
	return i;
}
// node_modules/@antv/x6/es/common/animation/util.js
var Qp = /(-?(?:\d*\.\d+|\d+))\s*(px|em|rem|ch|vh|vw|vmin|vmax|%|cm|mm|in|pt|pc|ex|fr|deg|rad|turn)$/, $p = (e, t) => {
	let n = t - e;
	return (t) => e + n * t;
}, em = (e, t) => {
	let n = Qp, r = n.exec(e), i = n.exec(t), a = i ? i[1] : "", o = r ? +r[1] : 0, s = i ? +i[1] : 0, c = a.indexOf("."), l = c > 0 ? a[1].length - c - 1 : 0, u = s - o, d = r ? r[2] : "";
	return (e) => (o + u * e).toFixed(l) + d;
}, tm = (e, t) => {
	let n = parseInt(e.slice(1), 16), r = parseInt(t.slice(1), 16), i = n & 255, a = (r & 255) - i, o = n & 65280, s = (r & 65280) - o, c = n & 16711680, l = (r & 16711680) - c;
	return (e) => {
		let t = i + a * e & 255, n = o + s * e & 65280, r = c + l * e & 16711680;
		return `#${(1 << 24 | t | n | r).toString(16).slice(1)}`;
	};
}, nm = (e, t) => {
	let n = (e) => {
		let t = [];
		if (!e) return t;
		let n = /(\w+)\(([^)]+)\)/g, r = n.exec(e);
		for (; r !== null;) r[1] && r[2] && t.push({
			name: r[1],
			values: r[2].split(/\s*,\s*/).filter(Boolean)
		}), r = n.exec(e);
		return t;
	}, r = n(e), i = n(t);
	return r.length === 0 || i.length === 0 ? () => e : (t) => {
		let n = [];
		for (let e = 0; e < Math.min(r.length, i.length); e++) {
			let a = r[e], o = i[e];
			if (a && o && a.name === o.name && a.values.length > 0 && a.values.length === o.values.length) {
				let e = [];
				for (let n = 0; n < a.values.length; n++) {
					let r = a.values[n], i = o.values[n];
					if (r !== void 0 && i !== void 0) {
						if (Qp.test(r) || Qp.test(i)) {
							let n = em(r, i);
							e.push(n(t));
						} else if (!Number.isNaN(parseFloat(r)) && !Number.isNaN(parseFloat(i))) {
							let n = $p(parseFloat(r), parseFloat(i));
							e.push(n(t).toString());
						} else e.push(r);
					}
				}
				e.length > 0 && n.push(`${a.name}(${e.join(", ")})`);
			}
		}
		return n.length > 0 ? n.join(" ") : e;
	};
}, rm = /* @__PURE__ */ s({
	bounce: () => lm,
	cubic: () => om,
	decorators: () => um,
	easeInBack: () => Mm,
	easeInBounce: () => zm,
	easeInCirc: () => km,
	easeInCubic: () => _m,
	easeInElastic: () => Fm,
	easeInExpo: () => Em,
	easeInOutBack: () => Pm,
	easeInOutBounce: () => Bm,
	easeInOutCirc: () => jm,
	easeInOutCubic: () => ym,
	easeInOutElastic: () => Lm,
	easeInOutExpo: () => Om,
	easeInOutQuad: () => gm,
	easeInOutQuart: () => Sm,
	easeInOutQuint: () => Tm,
	easeInOutSine: () => pm,
	easeInQuad: () => mm,
	easeInQuart: () => bm,
	easeInQuint: () => Cm,
	easeInSine: () => dm,
	easeOutBack: () => Nm,
	easeOutBounce: () => Rm,
	easeOutCirc: () => Am,
	easeOutCubic: () => vm,
	easeOutElastic: () => Im,
	easeOutExpo: () => Dm,
	easeOutQuad: () => hm,
	easeOutQuart: () => xm,
	easeOutQuint: () => wm,
	easeOutSine: () => fm,
	exponential: () => cm,
	inout: () => sm,
	linear: () => im,
	quad: () => am
}), im = (e) => e, am = (e) => e * e, om = (e) => e * e * e, sm = (e) => {
	if (e <= 0) return 0;
	if (e >= 1) return 1;
	let t = e * e, n = t * e;
	return 4 * (e < .5 ? n : 3 * (e - t) + n - .75);
}, cm = (e) => 2 ** (10 * (e - 1)), lm = ((e) => {
	for (let t = 0, n = 1;; t += n, n /= 2) if (e >= (7 - 4 * t) / 11) {
		let r = (11 - 6 * t - 11 * e) / 4;
		return -r * r + n * n;
	}
}), um = {
	reverse(e) {
		return (t) => 1 - e(1 - t);
	},
	reflect(e) {
		return (t) => .5 * (t < .5 ? e(2 * t) : 2 - e(2 - 2 * t));
	},
	clamp(e, t = 0, n = 1) {
		return (r) => {
			let i = e(r);
			return i < t ? t : i > n ? n : i;
		};
	},
	back(e = 1.70158) {
		return (t) => t * t * ((e + 1) * t - e);
	},
	elastic(e = 1.5) {
		return (t) => 2 ** (10 * (t - 1)) * Math.cos(20 * Math.PI * e / 3 * t);
	}
};
function dm(e) {
	return -1 * Math.cos(Math.PI / 2 * e) + 1;
}
function fm(e) {
	return Math.sin(Math.PI / 2 * e);
}
function pm(e) {
	return -.5 * (Math.cos(Math.PI * e) - 1);
}
function mm(e) {
	return e * e;
}
function hm(e) {
	return e * (2 - e);
}
function gm(e) {
	return e < .5 ? 2 * e * e : -1 + (4 - 2 * e) * e;
}
function _m(e) {
	return e * e * e;
}
function vm(e) {
	let t = e - 1;
	return t * t * t + 1;
}
function ym(e) {
	return e < .5 ? 4 * e * e * e : (e - 1) * (2 * e - 2) * (2 * e - 2) + 1;
}
function bm(e) {
	return e * e * e * e;
}
function xm(e) {
	let t = e - 1;
	return 1 - t * t * t * t;
}
function Sm(e) {
	let t = e - 1;
	return e < .5 ? 8 * e * e * e * e : 1 - 8 * t * t * t * t;
}
function Cm(e) {
	return e * e * e * e * e;
}
function wm(e) {
	let t = e - 1;
	return 1 + t * t * t * t * t;
}
function Tm(e) {
	let t = e - 1;
	return e < .5 ? 16 * e * e * e * e * e : 1 + 16 * t * t * t * t * t;
}
function Em(e) {
	return e === 0 ? 0 : 2 ** (10 * (e - 1));
}
function Dm(e) {
	return e === 1 ? 1 : -(2 ** (-10 * e)) + 1;
}
function Om(e) {
	if (e === 0 || e === 1) return e;
	let t = e * 2, n = t - 1;
	return t < 1 ? .5 * 2 ** (10 * n) : .5 * (-(2 ** (-10 * n)) + 2);
}
function km(e) {
	let t = e / 1;
	return -1 * (Math.sqrt(1 - t * e) - 1);
}
function Am(e) {
	let t = e - 1;
	return Math.sqrt(1 - t * t);
}
function jm(e) {
	let t = e * 2, n = t - 2;
	return t < 1 ? -.5 * (Math.sqrt(1 - t * t) - 1) : .5 * (Math.sqrt(1 - n * n) + 1);
}
function Mm(e, t = 1.70158) {
	return e * e * ((t + 1) * e - t);
}
function Nm(e, t = 1.70158) {
	let n = e / 1 - 1;
	return n * n * ((t + 1) * n + t) + 1;
}
function Pm(e, t = 1.70158) {
	let n = e * 2, r = n - 2, i = t * 1.525;
	return n < 1 ? .5 * n * n * ((i + 1) * n - i) : .5 * (r * r * ((i + 1) * r + i) + 2);
}
function Fm(e, t = .7) {
	if (e === 0 || e === 1) return e;
	let n = e / 1 - 1, r = 1 - t, i = r / (2 * Math.PI) * Math.asin(1);
	return -(2 ** (10 * n) * Math.sin((n - i) * (2 * Math.PI) / r));
}
function Im(e, t = .7) {
	let n = 1 - t, r = e * 2;
	if (e === 0 || e === 1) return e;
	let i = n / (2 * Math.PI) * Math.asin(1);
	return 2 ** (-10 * r) * Math.sin((r - i) * (2 * Math.PI) / n) + 1;
}
function Lm(e, t = .65) {
	let n = 1 - t;
	if (e === 0 || e === 1) return e;
	let r = e * 2, i = r - 1, a = n / (2 * Math.PI) * Math.asin(1);
	return r < 1 ? -.5 * (2 ** (10 * i) * Math.sin((i - a) * (2 * Math.PI) / n)) : 2 ** (-10 * i) * Math.sin((i - a) * (2 * Math.PI) / n) * .5 + 1;
}
function Rm(e) {
	let t = e / 1;
	if (t < 1 / 2.75) return 7.5625 * t * t;
	if (t < 2 / 2.75) {
		let e = t - 1.5 / 2.75;
		return 7.5625 * e * e + .75;
	}
	if (t < 2.5 / 2.75) {
		let e = t - 2.25 / 2.75;
		return 7.5625 * e * e + .9375;
	}
	{
		let e = t - 2.625 / 2.75;
		return 7.5625 * e * e + .984375;
	}
}
function zm(e) {
	return 1 - Rm(1 - e);
}
function Bm(e) {
	return e < .5 ? zm(e * 2) * .5 : Rm(e * 2 - 1) * .5 + .5;
}
// node_modules/@antv/x6/es/common/event/util.js
function Vm(e, t) {
	let n = [];
	for (let r = 0; r < e.length; r += 2) {
		let i = e[r], a = e[r + 1], o = tu(i, a, Array.isArray(t) ? t : [t]);
		n.push(o);
	}
	return $l(n);
}
// node_modules/@antv/x6/es/common/event/events.js
var Hm = class {
	constructor() {
		this.listeners = {};
	}
	on(e, t, n) {
		return t == null || (this.listeners[e] || (this.listeners[e] = []), this.listeners[e].push(t, n)), this;
	}
	once(e, t, n) {
		let r = (...i) => (this.off(e, r), Vm([t, n], i));
		return this.on(e, r, this);
	}
	off(e, t, n) {
		if (!(e || t || n)) return this.listeners = {}, this;
		let r = this.listeners;
		return (e ? [e] : Object.keys(r)).forEach((e) => {
			let i = r[e];
			if (i) {
				if (!(t || n)) delete r[e];
				else for (let e = i.length - 2; e >= 0; e -= 2) t && i[e] !== t || n && i[e + 1] !== n || i.splice(e, 2);
			}
		}), this;
	}
	trigger(e, ...t) {
		let n = !0;
		if (e !== "*") {
			let r = this.listeners[e];
			r != null && (n = Vm([...r], t));
		}
		let r = this.listeners["*"];
		return r == null ? n : $l([n, Vm([...r], [e, ...t])]);
	}
	emit(e, ...t) {
		return this.trigger(e, ...t);
	}
}, Um = class {
	get disposed() {
		return this._disposed === !0;
	}
	dispose() {
		this._disposed = !0;
	}
};
function q() {
	return (e, t, n) => {
		let r = n.value, i = e.__proto__;
		n.value = function(...e) {
			this.disposed || (r.call(this, ...e), i.dispose.call(this));
		};
	};
}
// node_modules/@antv/x6/es/common/base/basecoat.js
var Wm = class extends Hm {
	dispose() {
		this.off();
	}
};
f([q()], Wm.prototype, "dispose", null), Xd(Wm, Um);
// node_modules/@antv/x6/es/common/dictionary/index.js
var Gm = class {
	constructor() {
		this.clear();
	}
	clear() {
		this.map = /* @__PURE__ */ new WeakMap(), this.arr = [];
	}
	has(e) {
		return this.map.has(e);
	}
	get(e) {
		return this.map.get(e);
	}
	set(e, t) {
		this.map.set(e, t), this.arr.push(e);
	}
	delete(e) {
		let t = this.arr.indexOf(e);
		t >= 0 && this.arr.splice(t, 1);
		let n = this.map.get(e);
		return this.map.delete(e), n;
	}
	each(e) {
		this.arr.forEach((t) => {
			e(this.map.get(t), t);
		});
	}
	dispose() {
		this.clear();
	}
};
// node_modules/@antv/x6/es/common/modifier/index.js
function Km(e) {
	let t = [], n = [];
	return Array.isArray(e) ? t.push(...e) : e.split("|").forEach((e) => {
		e.indexOf("&") === -1 ? t.push(e) : n.push(...e.split("&"));
	}), {
		or: t,
		and: n
	};
}
function qm(e, t) {
	if (e != null && t != null) {
		let n = Km(e), r = Km(t), i = n.or.sort(), a = r.or.sort(), o = n.and.sort(), s = r.and.sort(), c = (e, t) => e.length === t.length && (e.length === 0 || e.every((e, n) => e === t[n]));
		return c(i, a) && c(o, s);
	}
	return e == null && t == null;
}
function Jm(e, t, n) {
	if (t == null || Array.isArray(t) && t.length === 0) return !n || e.altKey !== !0 && e.ctrlKey !== !0 && e.metaKey !== !0 && e.shiftKey !== !0;
	let { or: r, and: i } = Km(t), a = (t) => e[`${t.toLowerCase()}Key`] === !0;
	return r.some((e) => a(e)) && i.every((e) => a(e));
}
// node_modules/@antv/x6/es/registry/registry.js
var Ym = class e {
	static create(t) {
		return new e(t);
	}
	constructor(e) {
		this.options = Object.assign({}, e), this.data = this.options.data || {}, this.register = this.register.bind(this), this.unregister = this.unregister.bind(this);
	}
	get names() {
		return Object.keys(this.data);
	}
	register(e, t, n = !1) {
		if (typeof e == "object") {
			Object.entries(e).forEach(([e, n]) => {
				this.register(e, n, t);
			});
			return;
		}
		this.exist(e) && !n && !Ll() && this.onDuplicated(e);
		let r = this.options.process, i = r ? R(r, this, e, t) : t;
		return this.data[e] = i, i;
	}
	unregister(e) {
		let t = e ? this.data[e] : null;
		return delete this.data[e], t;
	}
	get(e) {
		return e ? this.data[e] : null;
	}
	exist(e) {
		return e ? this.data[e] != null : !1;
	}
	onDuplicated(e) {
		try {
			throw this.options.onConflict && R(this.options.onConflict, this, e), Error(`${Jr(this.options.type)} with name '${e}' already registered.`);
		} catch (e) {
			throw e;
		}
	}
	onNotFound(e, t) {
		throw Error(this.getSpellingSuggestion(e, t));
	}
	getSpellingSuggestion(e, t) {
		let n = this.getSpellingSuggestionForName(e);
		return `${Jr(t ? `${t} ${Yc(this.options.type)}` : this.options.type)} with name '${e}' does not exist.${n ? ` Did you mean '${n}'?` : ""}`;
	}
	getSpellingSuggestionForName(e) {
		return Hd(e, Object.keys(this.data), (e) => e);
	}
}, Xm = {}, Zm = { position: bh("x", "width", "origin") }, Qm = { position: bh("y", "height", "origin") }, $m = { position: bh("x", "width", "corner") }, eh = { position: bh("y", "height", "corner") }, th = { set: xh("width", "width") }, nh = { set: xh("height", "height") }, rh = { set: xh("rx", "width") }, ih = { set: xh("ry", "height") }, ah = { set: ((e) => {
	let t = xh(e, "width"), n = xh(e, "height");
	return function(e, r) {
		let i = r.refBBox;
		return R(i.height > i.width ? t : n, this, e, r);
	};
})("r") }, oh = { set(e, { refBBox: t }) {
	let n = parseFloat(e), r = Tl(e);
	r && (n /= 100);
	let i = Math.sqrt(t.height * t.height + t.width * t.width), a;
	return Number.isFinite(n) && (a = r || n >= 0 && n <= 1 ? n * i : Math.max(n + i, 0)), { r: a };
} }, sh = { set: xh("cx", "width") }, ch = { set: xh("cy", "height") }, lh = { set: Ch({ resetOffset: !0 }) }, uh = { set: Ch({ resetOffset: !1 }) }, dh = { set: wh({ resetOffset: !0 }) }, fh = { set: wh({ resetOffset: !1 }) }, ph = ah, mh = lh, hh = dh, gh = Zm, _h = Qm, vh = th, yh = nh;
function bh(e, t, n) {
	return (r, { refBBox: i }) => {
		if (r == null) return null;
		let a = parseFloat(r), o = Tl(r);
		o && (a /= 100);
		let s;
		if (Number.isFinite(a)) {
			let r = i[n];
			s = o || a > 0 && a < 1 ? r[e] + i[t] * a : r[e] + a;
		}
		let c = new z();
		return c[e] = s || 0, c;
	};
}
function xh(e, t) {
	return (n, { refBBox: r }) => {
		let i = parseFloat(n), a = Tl(n);
		a && (i /= 100);
		let o = {};
		return Number.isFinite(i) && (o[e] = a || i >= 0 && i <= 1 ? i * r[t] : Math.max(i + r[t], 0)), o;
	};
}
function Sh(e, t) {
	let n = "x6-shape", r = t && t.resetOffset;
	return (t, { elem: i, refBBox: a }) => {
		let o = qd(i, n);
		if (!o || o.value !== t) {
			let r = e(t);
			o = {
				value: t,
				shape: r,
				shapeBBox: r.bbox()
			}, qd(i, n, o);
		}
		let s = o.shape.clone(), c = o.shapeBBox.clone(), l = c.getOrigin(), u = a.getOrigin();
		c.x = u.x, c.y = u.y;
		let d = a.getMaxScaleToFit(c, u), f = c.width === 0 || a.width === 0 ? 1 : d.sx, p = c.height === 0 || a.height === 0 ? 1 : d.sy;
		return s.scale(f, p, l), r && s.translate(-l.x, -l.y), s;
	};
}
function Ch(e) {
	function t(e) {
		return H.parse(e);
	}
	let n = Sh(t, e);
	return (e, t) => ({ d: n(e, t).serialize() });
}
function wh(e) {
	let t = Sh((e) => new yu(e), e);
	return (e, n) => ({ points: t(e, n).serialize() });
}
// node_modules/@antv/x6/es/registry/attr/fill.js
var Th = {
	qualify: Sr,
	set(e, { view: t }) {
		return `url(#${t.graph.defineGradient(e)})`;
	}
}, Eh = {
	qualify: Sr,
	set(e, { view: t }) {
		let n = t.cell, r = Object.assign({}, e);
		if (n.isEdge() && r.type === "linearGradient") {
			let e = t, i = e.sourcePoint, a = e.targetPoint;
			r.id = `gradient-${r.type}-${n.id}`, r.attrs = Object.assign(Object.assign({}, r.attrs), {
				x1: i.x,
				y1: i.y,
				x2: a.x,
				y2: a.y,
				gradientUnits: "userSpaceOnUse"
			}), t.graph.defs.remove(r.id);
		}
		return `url(#${t.graph.defineGradient(r)})`;
	}
}, Dh = {
	qualify(e, { attrs: t }) {
		return t.textWrap == null || !Sr(t.textWrap);
	},
	set(e, { view: t, elem: n, attrs: r }) {
		let i = "x6-text", a = qd(n, i), o = (e) => {
			try {
				if (typeof e == "string") return JSON.parse(e);
			} catch {}
			return e;
		}, s = {
			x: r.x,
			eol: r.eol,
			annotations: o(r.annotations),
			textPath: o(r["text-path"] || r.textPath),
			textVerticalAnchor: r["text-vertical-anchor"] || r.textVerticalAnchor,
			displayEmpty: (r["display-empty"] || r.displayEmpty) === "true",
			lineHeight: r["line-height"] || r.lineHeight
		}, c = r["font-size"] || r.fontSize, l = JSON.stringify([e, s]);
		if (c && n.setAttribute("font-size", c), a == null || a !== l) {
			let r = s.textPath;
			if (typeof r == "object" && r) {
				let e = r.selector;
				if (typeof e == "string") {
					let n = t.find(e)[0];
					n instanceof SVGPathElement && (Gu(n), s.textPath = Object.assign({ "xlink:href": `#${n.id}` }, r));
				}
			}
			gf(n, `${e}`, s), qd(n, i, l);
		}
	}
}, Oh = {
	qualify: Sr,
	set(e, { view: t, elem: n, attrs: r, refBBox: i }) {
		let a = e, o = a.width || 0;
		Tl(o) ? i.width *= parseFloat(o) / 100 : o <= 0 ? i.width += o : i.width = o;
		let s = a.height || 0;
		Tl(s) ? i.height *= parseFloat(s) / 100 : s <= 0 ? i.height += s : i.height = s;
		let c, l = a.text ?? r.text ?? n?.textContent;
		c = l == null ? "" : yf(`${l}`, i, {
			"font-weight": r["font-weight"] || r.fontWeight,
			"font-size": r["font-size"] || r.fontSize,
			"font-family": r["font-family"] || r.fontFamily,
			lineHeight: r.lineHeight
		}, { ellipsis: a.ellipsis }), R(Dh.set, this, c, {
			view: t,
			elem: n,
			attrs: r,
			refBBox: i,
			cell: t.cell
		});
	}
}, kh = (e, { attrs: t }) => t.text !== void 0, Ah = { qualify: kh }, jh = { qualify: kh }, Mh = { qualify: kh }, Nh = { qualify: kh }, Ph = { qualify: kh }, Fh = { qualify: kh }, Ih = {
	qualify(e, { elem: t }) {
		return t instanceof SVGElement;
	},
	set(e, { elem: t }) {
		let n = "x6-title", r = `${e}`, i = qd(t, n);
		if (i == null || i !== r) {
			qd(t, n, r);
			let e = t.firstChild;
			if (e && e.tagName.toUpperCase() === "TITLE") {
				let t = e;
				t.textContent = r;
			} else {
				let n = document.createElementNS(t.namespaceURI, "title");
				n.textContent = r, t.insertBefore(n, e);
			}
		}
	}
}, Lh = { offset: Bh("x", "width", "right") }, Rh = { offset: Bh("y", "height", "bottom") }, zh = { offset(e, { refBBox: t }) {
	return e ? {
		x: -t.x,
		y: -t.y
	} : {
		x: 0,
		y: 0
	};
} };
function Bh(e, t, n) {
	return (r, { refBBox: i }) => {
		let a = new z(), o;
		return o = r === "middle" ? i[t] / 2 : r === n ? i[t] : typeof r == "number" && Number.isFinite(r) ? r > -1 && r < 1 ? -i[t] * r : -r : Tl(r) ? i[t] * parseFloat(r) / 100 : 0, a[e] = -(i[e] + o), a;
	};
}
// node_modules/@antv/x6/es/registry/attr/style.js
var Vh = {
	qualify: Sr,
	set(e, { elem: t }) {
		G(t, e);
	}
}, Hh = { set(e, { elem: t }) {
	t.innerHTML = `${e}`;
} }, Uh = {
	qualify: Sr,
	set(e, { view: t }) {
		return `url(#${t.graph.defineFilter(e)})`;
	}
}, Wh = { set(e) {
	return typeof e == "object" && e && e.id ? e.id : e;
} }, Gh = (e) => {
	var { size: t, width: n, height: r, offset: i, open: a } = e, o = d(e, [
		"size",
		"width",
		"height",
		"offset",
		"open"
	]);
	return qh({
		size: t,
		width: n,
		height: r,
		offset: i
	}, a === !0, !0, void 0, o);
}, Kh = (e) => {
	var { size: t, width: n, height: r, offset: i, factor: a } = e, o = d(e, [
		"size",
		"width",
		"height",
		"offset",
		"factor"
	]);
	return qh({
		size: t,
		width: n,
		height: r,
		offset: i
	}, !1, !1, a, o);
};
function qh(e, t, n, r = 3 / 4, i = {}) {
	let a = e.size || 10, o = e.width || a, s = e.height || a, c = new H(), l = {};
	if (t) c.moveTo(o, 0).lineTo(0, s / 2).lineTo(o, s), l.fill = "none";
	else {
		if (c.moveTo(0, s / 2), c.lineTo(o, 0), !n) {
			let e = Yi(r, 0, 1);
			c.lineTo(o * e, s / 2);
		}
		c.lineTo(o, s), c.close();
	}
	return Object.assign(Object.assign(Object.assign({}, l), i), {
		tagName: "path",
		d: Fu(c.serialize(), { x: e.offset == null ? -o / 2 : e.offset })
	});
}
// node_modules/@antv/x6/es/registry/marker/diamond.js
var Jh = (e) => {
	var { size: t, width: n, height: r, offset: i } = e, a = d(e, [
		"size",
		"width",
		"height",
		"offset"
	]);
	let o = t || 10, s = n || o, c = r || o, l = new H();
	return l.moveTo(0, c / 2).lineTo(s / 2, 0).lineTo(s, c / 2).lineTo(s / 2, c).close(), Object.assign(Object.assign({}, a), {
		tagName: "path",
		d: Fu(l.serialize(), i ?? -s / 2)
	});
}, Yh = (e) => {
	var { d: t, offsetX: n, offsetY: r } = e, i = d(e, [
		"d",
		"offsetX",
		"offsetY"
	]);
	return Object.assign(Object.assign({}, i), {
		tagName: "path",
		d: Fu(t, n, r)
	});
}, Xh = (e) => {
	var { size: t, width: n, height: r, offset: i } = e, a = d(e, [
		"size",
		"width",
		"height",
		"offset"
	]);
	let o = t || 10, s = n || o, c = r || o, l = new H();
	return l.moveTo(0, 0).lineTo(s, c).moveTo(0, c).lineTo(s, 0), Object.assign(Object.assign({}, a), {
		tagName: "path",
		fill: "none",
		d: Fu(l.serialize(), i || -s / 2)
	});
}, Zh = (e) => {
	var { width: t, height: n, offset: r, open: i, flip: a } = e, o = d(e, [
		"width",
		"height",
		"offset",
		"open",
		"flip"
	]);
	let s = n || 6, c = t || 10, l = i === !0, u = a === !0, f = Object.assign(Object.assign({}, o), { tagName: "path" });
	u && (s = -s);
	let p = new H();
	return p.moveTo(0, s).lineTo(c, 0), l ? f.fill = "none" : (p.lineTo(c, s), p.close()), f.d = Fu(p.serialize(), {
		x: r || -c / 2,
		y: s / 2
	}), f;
}, Qh = (e) => {
	var { r: t } = e, n = d(e, ["r"]);
	let r = t || 5;
	return Object.assign(Object.assign({ cx: r }, n), {
		tagName: "circle",
		r
	});
}, $h = (e) => {
	var { r: t } = e, n = d(e, ["r"]);
	let r = t || 5, i = new H();
	return i.moveTo(r, 0).lineTo(r, r * 2), i.moveTo(0, r).lineTo(r * 2, r), { children: [Object.assign(Object.assign({}, Qh({ r })), { fill: "none" }), Object.assign(Object.assign({}, n), {
		tagName: "path",
		d: Fu(i.serialize(), -r)
	})] };
}, eg = (e) => {
	var { rx: t, ry: n } = e, r = d(e, ["rx", "ry"]);
	let i = t || 5, a = n || 5;
	return Object.assign(Object.assign({ cx: i }, r), {
		tagName: "ellipse",
		rx: i,
		ry: a
	});
}, tg = /* @__PURE__ */ s({
	async: () => Zh,
	block: () => Gh,
	circle: () => Qh,
	circlePlus: () => $h,
	classic: () => Kh,
	cross: () => Xh,
	diamond: () => Jh,
	ellipse: () => eg,
	path: () => Yh
}), ng = Ym.create({ type: "marker" });
ng.register(tg, !0);
// node_modules/@antv/x6/es/registry/attr/marker.js
function rg(e) {
	return typeof e == "string" || Sr(e);
}
var ig = {
	qualify: rg,
	set(e, { view: t, attrs: n }) {
		return sg("marker-start", e, t, n);
	}
}, ag = {
	qualify: rg,
	set(e, { view: t, attrs: n }) {
		return sg("marker-end", e, t, n, { transform: "rotate(180)" });
	}
}, og = {
	qualify: rg,
	set(e, { view: t, attrs: n }) {
		return sg("marker-mid", e, t, n);
	}
};
function sg(e, t, n, r, i = {}) {
	let a = typeof t == "string" ? { name: t } : t, { name: o, args: s } = a, c = d(a, ["name", "args"]), l = c;
	if (o && typeof o == "string") {
		let e = ng.get(o);
		if (e) l = e(Object.assign(Object.assign({}, c), s));
		else return ng.onNotFound(o);
	}
	let u = Object.assign(Object.assign(Object.assign({}, cg(r, e)), i), l);
	return { [e]: `url(#${n.graph.defineMarker(u)})` };
}
function cg(e, t) {
	let n = {}, r = e.stroke;
	if (typeof r == "string" && (n.stroke = r, n.fill = r), t !== "marker-mid") {
		let r = parseFloat(e.strokeWidth || e["stroke-width"]);
		if (Number.isFinite(r) && r > 1) {
			let e = Math.ceil(r / 2);
			n.refX = t === "marker-start" ? e : -e;
		}
	}
	return n;
}
// node_modules/@antv/x6/es/registry/attr/connection.js
var lg = (e, { view: t }) => t.cell.isEdge(), ug = {
	qualify: lg,
	set(e, t) {
		let n = t.view, r = e.reverse || !1, i = e.stubs || 0, a;
		if (Number.isFinite(i) && i !== 0) {
			if (r) {
				let e, t, r = n.getConnectionLength() || 0;
				i < 0 ? (e = (r + i) / 2, t = -i) : (e = i, t = r - i * 2), a = ((n.getConnection()?.divideAtLength(e)?.[1])?.divideAtLength(t)?.[0])?.serialize();
			} else {
				let e;
				e = i < 0 ? ((n.getConnectionLength() || 0) + i) / 2 : i;
				let t = n.getConnection();
				if (t) {
					let n = t.divideAtLength(e), r = t.divideAtLength(-e);
					n && r && (a = `${n[0].serialize()} ${r[1].serialize()}`);
				}
			}
		}
		return { d: a || n.getConnectionPathData() };
	}
}, dg = {
	qualify: lg,
	set: _g("getTangentAtLength", { rotate: !0 })
}, fg = {
	qualify: lg,
	set: _g("getTangentAtLength", { rotate: !1 })
}, pg = {
	qualify: lg,
	set: _g("getTangentAtRatio", { rotate: !0 })
}, mg = {
	qualify: lg,
	set: _g("getTangentAtRatio", { rotate: !1 })
}, hg = dg, gg = pg;
function _g(e, t) {
	let n = {
		x: 1,
		y: 0
	};
	return (r, i) => {
		let a, o, s = i.view, c = s[e](Number(r));
		return c ? (o = t.rotate ? c.vector().vectorAngle(n) : 0, a = c.start) : (a = s.path.start, o = 0), o === 0 || Number.isNaN(o) ? { transform: `translate(${a.x},${a.y})` } : { transform: `translate(${a.x},${a.y}) rotate(${o})` };
	};
}
// node_modules/@antv/x6/es/registry/attr/main.js
var vg = /* @__PURE__ */ s({
	annotations: () => Nh,
	atConnectionLength: () => hg,
	atConnectionLengthIgnoreGradient: () => fg,
	atConnectionLengthKeepGradient: () => dg,
	atConnectionRatio: () => gg,
	atConnectionRatioIgnoreGradient: () => mg,
	atConnectionRatioKeepGradient: () => pg,
	connection: () => ug,
	displayEmpty: () => Fh,
	eol: () => Ph,
	fill: () => Th,
	filter: () => Uh,
	html: () => Hh,
	lineHeight: () => Ah,
	port: () => Wh,
	ref: () => Xm,
	refCx: () => sh,
	refCy: () => ch,
	refD: () => mh,
	refDKeepOffset: () => uh,
	refDResetOffset: () => lh,
	refDx: () => $m,
	refDy: () => eh,
	refHeight: () => nh,
	refHeight2: () => yh,
	refPoints: () => hh,
	refPointsKeepOffset: () => fh,
	refPointsResetOffset: () => dh,
	refR: () => ph,
	refRCircumscribed: () => oh,
	refRInscribed: () => ah,
	refRx: () => rh,
	refRy: () => ih,
	refWidth: () => th,
	refWidth2: () => vh,
	refX: () => Zm,
	refX2: () => gh,
	refY: () => Qm,
	refY2: () => _h,
	resetOffset: () => zh,
	sourceMarker: () => ig,
	stroke: () => Eh,
	style: () => Vh,
	targetMarker: () => ag,
	text: () => Dh,
	textPath: () => Mh,
	textVerticalAnchor: () => jh,
	textWrap: () => Oh,
	title: () => Ih,
	vertexMarker: () => og,
	xAlign: () => Lh,
	yAlign: () => Rh
}), yg = {
	xlinkHref: "xlink:href",
	xlinkShow: "xlink:show",
	xlinkRole: "xlink:role",
	xlinkType: "xlink:type",
	xlinkArcrole: "xlink:arcrole",
	xlinkTitle: "xlink:title",
	xlinkActuate: "xlink:actuate",
	xmlSpace: "xml:space",
	xmlBase: "xml:base",
	xmlLang: "xml:lang",
	preserveAspectRatio: "preserveAspectRatio",
	requiredExtension: "requiredExtension",
	requiredFeatures: "requiredFeatures",
	systemLanguage: "systemLanguage",
	externalResourcesRequired: "externalResourceRequired"
};
// node_modules/@antv/x6/es/registry/attr/index.js
function bg(e, t, n) {
	return !(e == null || typeof e != "string" && typeof e.qualify == "function" && !R(e.qualify, this, t, n));
}
var xg = Object.assign(Object.assign({}, yg), vg), Sg = Ym.create({ type: "attribute definition" });
Sg.register(xg, !0);
// node_modules/@antv/x6/es/registry/background/flip-x.js
var Cg = (e) => {
	let t = document.createElement("canvas"), n = e.width, r = e.height;
	t.width = n * 2, t.height = r;
	let i = t.getContext("2d");
	return i.drawImage(e, 0, 0, n, r), i.translate(2 * n, 0), i.scale(-1, 1), i.drawImage(e, 0, 0, n, r), t;
}, wg = (e) => {
	let t = document.createElement("canvas"), n = e.width, r = e.height;
	t.width = n, t.height = r * 2;
	let i = t.getContext("2d");
	return i.drawImage(e, 0, 0, n, r), i.translate(0, 2 * r), i.scale(1, -1), i.drawImage(e, 0, 0, n, r), t;
}, Tg = (e) => {
	let t = document.createElement("canvas"), n = e.width, r = e.height;
	t.width = 2 * n, t.height = 2 * r;
	let i = t.getContext("2d");
	return i.drawImage(e, 0, 0, n, r), i.setTransform(-1, 0, 0, -1, t.width, t.height), i.drawImage(e, 0, 0, n, r), i.setTransform(-1, 0, 0, 1, t.width, 0), i.drawImage(e, 0, 0, n, r), i.setTransform(1, 0, 0, -1, 0, t.height), i.drawImage(e, 0, 0, n, r), t;
}, Eg = (e, t) => {
	let n = e.width, r = e.height, i = document.createElement("canvas");
	i.width = n * 3, i.height = r * 3;
	let a = i.getContext("2d"), o = ru(t.angle == null ? -20 : -t.angle), s = i.width / 4, c = i.height / 4;
	for (let t = 0; t < 4; t += 1) for (let i = 0; i < 4; i += 1) (t + i) % 2 > 0 && (a.setTransform(1, 0, 0, 1, (2 * t - 1) * s, (2 * i - 1) * c), a.rotate(o), a.drawImage(e, -n / 2, -r / 2, n, r));
	return i;
}, Dg = Object.assign({}, /* @__PURE__ */ s({
	flipX: () => Cg,
	flipXY: () => Tg,
	flipY: () => wg,
	watermark: () => Eg
}));
Dg["flip-x"] = Cg, Dg["flip-y"] = wg, Dg["flip-xy"] = Tg;
var Og = Ym.create({ type: "background pattern" });
Og.register(Dg, !0);
// node_modules/@antv/x6/es/registry/connection-point/util.js
function kg(e, t, n) {
	let r;
	if (typeof n == "object") {
		if (Number.isFinite(n.y)) {
			let { start: r, end: i } = new V(t, e).parallel(n.y);
			t = r, e = i;
		}
		r = n.x;
	} else r = n;
	if (r == null || !Number.isFinite(r)) return e;
	let i = e.distance(t);
	return r === 0 && i > 0 ? e : e.move(t, -Math.min(r, i - 1));
}
function Ag(e) {
	let t = e.getAttribute("stroke-width");
	return t === null ? 0 : parseFloat(t) || 0;
}
function jg(e) {
	if (e == null) return null;
	let t = e;
	do {
		let e = t.tagName;
		if (typeof e != "string") return null;
		if (e = e.toUpperCase(), e === "G") t = t.firstElementChild;
		else if (e === "TITLE") t = t.nextElementSibling;
		else break;
	} while (t);
	return t;
}
// node_modules/@antv/x6/es/registry/connection-point/bbox.js
var Mg = (e, t, n, r) => {
	let i = t.getBBoxOfElement(n);
	r.stroked && i.inflate(Ag(n) / 2);
	let a = e.intersect(i);
	return kg(a && a.length ? e.start.closest(a) : e.end, e.start, r.offset);
}, Ng = function(e, t, n, r, i) {
	let a = t.cell, o = a.isNode() ? a.getAngle() : 0;
	if (o === 0) return R(Mg, this, e, t, n, r, i);
	let s = t.getUnrotatedBBoxOfElement(n);
	r.stroked && s.inflate(Ag(n) / 2);
	let c = s.getCenter(), l = e.clone().rotate(o, c), u = l.setLength(1e6).intersect(s);
	return kg(u && u.length ? l.start.closest(u).rotate(-o, c) : e.end, e.start, r.offset);
}, Pg = (e, t, n, r) => {
	let i, a, o = e.end, s = r.selector;
	if (i = typeof s == "string" ? t.findOne(s) : Array.isArray(s) ? rf(n, s) : jg(n), !Ku(i)) {
		if (i === n || !Ku(n)) return o;
		i = n;
	}
	let c = t.getShapeOfElement(i), l = t.getMatrixOfElement(i), u = t.getRootTranslatedMatrix(), d = t.getRootRotatedMatrix(), f = u.multiply(d).multiply(l), p = Vp(e, f.inverse()), m = p.start.clone(), h = t.getDataOfElement(i);
	if (r.insideout === !1) {
		h.shapeBBox ??= c.bbox();
		let e = h.shapeBBox;
		if (e != null && e.containsPoint(m)) return o;
	}
	r.extrapolate === !0 && p.setLength(1e6);
	let g;
	if (H.isPath(c)) {
		let e = r.precision || 2;
		h.segmentSubdivisions ??= c.getSegmentSubdivisions({ precision: e }), g = {
			precision: e,
			segmentSubdivisions: h.segmentSubdivisions
		}, a = p.intersect(c, g);
	} else a = p.intersect(c);
	a ? Array.isArray(a) && (a = m.closest(a)) : r.sticky === !0 && (a = B.isRectangle(c) ? c.getNearestPointToPoint(m) : fu.isEllipse(c) ? c.intersectsWithLineFromCenterToPoint(m) : c.closestPoint(m, g));
	let _ = a ? Bp(a, f) : o, v = r.offset || 0;
	return r.stroked !== !1 && (typeof v == "object" ? (v = Object.assign({}, v), v.x ?? (v.x = 0), v.x += Ag(i) / 2) : v += Ag(i) / 2), kg(_, e.start, v);
};
// node_modules/@antv/x6/es/registry/connection-point/anchor.js
function Fg(e, t, n = 0) {
	let { start: r, end: i } = e, a, o, s, c;
	switch (t) {
		case "left":
			c = "x", a = i, o = r, s = -1;
			break;
		case "right":
			c = "x", a = r, o = i, s = 1;
			break;
		case "top":
			c = "y", a = i, o = r, s = -1;
			break;
		case "bottom":
			c = "y", a = r, o = i, s = 1;
			break;
		default: return;
	}
	r[c] < i[c] ? a[c] = o[c] : o[c] = a[c], Number.isFinite(n) && (a[c] += s * n, o[c] += s * n);
}
var Ig = (e, t, n, r) => {
	let { alignOffset: i, align: a } = r;
	return a && Fg(e, a, i), kg(e.end, e.start, r.offset);
}, Lg = /* @__PURE__ */ s({
	anchor: () => Ig,
	bbox: () => Mg,
	boundary: () => Pg,
	rect: () => Ng
}), Rg = Ym.create({ type: "connection point" });
Rg.register(Lg, !0);
// node_modules/@antv/x6/es/registry/connector/jumpover.js
var zg = 1, Bg = 1 / 3, Vg = 2 / 3, Hg = [], Ug = [];
function Wg(e) {
	let t = e.graph._jumpOverUpdateList;
	if (t ?? (t = e.graph._jumpOverUpdateList = [], e.graph.on("cell:mouseup", () => {
		let t = e.graph._jumpOverUpdateList;
		setTimeout(() => {
			for (let e = 0; e < t.length; e += 1) t[e].update();
		});
	}), e.graph.on("model:reseted", () => {
		t = e.graph._jumpOverUpdateList = [];
	})), t.indexOf(e) < 0) {
		t.push(e);
		let n = () => t.splice(t.indexOf(e), 1);
		e.cell.once("change:connector", n), e.cell.once("removed", n);
	}
}
function Gg(e, t, n = []) {
	let r = [
		e,
		...n,
		t
	], i = [];
	return r.forEach((e, t) => {
		let n = r[t + 1];
		n != null && i.push(new V(e, n));
	}), i;
}
function Kg(e, t) {
	let n = [];
	return t.forEach((t) => {
		let r = e.intersectsWithLine(t);
		if (r) {
			let { x: e, y: i } = r, { start: a, end: o } = t, s = Math.round(a.x) === Math.round(e) && Math.round(a.y) === Math.round(i), c = Math.round(o.x) === Math.round(e) && Math.round(o.y) === Math.round(i);
			if (s || c) return;
			n.push(r);
		}
	}), n;
}
function qg(e, t) {
	return new V(e, t).squaredLength();
}
function Jg(e, t, n) {
	return t.reduce((r, i, a) => {
		if (Ug.includes(i)) return r;
		let o = r.pop() || e, s = z.create(i).move(o.start, -n), c = z.create(i).move(o.start, +n), l = t[a + 1];
		if (l != null) {
			let e = c.distance(l);
			e <= n && (c = l.move(o.start, e), Ug.push(l));
		} else if (s.distance(o.end) < n * 2 + zg) return r.push(o), r;
		if (c.distance(o.start) < n * 2 + zg) return r.push(o), r;
		let u = new V(s, c);
		return Hg.push(u), r.push(new V(o.start, s), u, new V(c, o.end)), r;
	}, []);
}
function Yg(e, t, n, r) {
	let i = new H(), a;
	return a = H.createSegment("M", e[0].start), i.appendSegment(a), e.forEach((o, s) => {
		if (Hg.includes(o)) {
			let e, r, s, c;
			if (n === "arc") {
				e = -90, r = o.start.diff(o.end), (r.x < 0 || r.x === 0 && r.y < 0) && (e += 180);
				let t = o.getCenter(), n = new V(t, o.end).rotate(e, t), l;
				l = new V(o.start, t), s = l.pointAt(2 / 3).rotate(e, o.start), c = n.pointAt(1 / 3).rotate(-e, n.end), a = H.createSegment("C", s, c, n.end), i.appendSegment(a), l = new V(t, o.end), s = n.pointAt(1 / 3).rotate(e, n.end), c = l.pointAt(1 / 3).rotate(-e, o.end), a = H.createSegment("C", s, c, o.end), i.appendSegment(a);
			} else if (n === "gap") a = H.createSegment("M", o.end), i.appendSegment(a);
			else if (n === "cubic") {
				e = o.start.theta(o.end);
				let n = t * .6, l = t * 1.35;
				r = o.start.diff(o.end), (r.x < 0 || r.x === 0 && r.y < 0) && (l *= -1), s = new z(o.start.x + n, o.start.y + l).rotate(e, o.start), c = new z(o.end.x - n, o.end.y + l).rotate(e, o.end), a = H.createSegment("C", s, c, o.end), i.appendSegment(a);
			}
		} else {
			let t = e[s + 1];
			r === 0 || !t || Hg.includes(t) ? (a = H.createSegment("L", o.end), i.appendSegment(a)) : Xg(r, i, o.end, o.start, t.end);
		}
	}), i;
}
function Xg(e, t, n, r, i) {
	let a = n.distance(r) / 2, o = n.distance(i) / 2, s = -Math.min(e, a), c = -Math.min(e, o), l = n.clone().move(r, s).round(), u = n.clone().move(i, c).round(), d = new z(Bg * l.x + Vg * n.x, Vg * n.y + Bg * l.y), f = new z(Bg * u.x + Vg * n.x, Vg * n.y + Bg * u.y), p;
	p = H.createSegment("L", l), t.appendSegment(p), p = H.createSegment("C", d, f, u), t.appendSegment(p);
}
var Zg = function(e, t, n, r = {}) {
	Hg = [], Ug = [], Wg(this);
	let i = r.size || 5, a = r.type || "arc", o = r.radius || 0, s = r.ignoreConnectors || ["smooth"], c = this.graph, l = c.model.getEdges();
	if (l.length === 1) return Yg(Gg(e, t, n), i, a, o);
	let u = this.cell, d = l.indexOf(u), f = c.options.connecting.connector || {}, p = l.filter((e, t) => {
		let n = e.getConnector() || f;
		return s.includes(n.name) ? !1 : t > d ? n.name !== "jumpover" : !0;
	}), m = p.map((e) => c.findViewByCell(e)), h = Gg(e, t, n), g = m.map((e) => e == null ? [] : e === this ? h : Gg(e.sourcePoint, e.targetPoint, e.routePoints)), _ = [];
	h.forEach((e) => {
		let t = p.reduce((t, n, r) => {
			if (n !== u) {
				let n = Kg(e, g[r]);
				t.push(...n);
			}
			return t;
		}, []).sort((t, n) => qg(e.start, t) - qg(e.start, n));
		t.length > 0 ? _.push(...Jg(e, t, i)) : _.push(e);
	});
	let v = Yg(_, i, a, o);
	return Hg = [], Ug = [], r.raw ? v : v.serialize();
}, Qg = (e, t, n, r = {}) => {
	let i = n.length === 3 ? 0 : 1, a = z.create(n[0 + i]), o = z.create(n[2 + i]), s = z.create(n[1 + i]);
	if (!z.equals(e, t)) {
		let n = new z((e.x + t.x) / 2, (e.y + t.y) / 2), r = n.angleBetween(z.create(e).rotate(90, n), s);
		r > 1 && (a.rotate(180 - r, n), o.rotate(180 - r, n), s.rotate(180 - r, n));
	}
	let c = `
     M ${e.x} ${e.y}
     Q ${a.x} ${a.y} ${s.x} ${s.y}
     Q ${o.x} ${o.y} ${t.x} ${t.y}
  `;
	return r.raw ? H.parse(c) : c;
}, $g = (e, t, n, r = {}) => {
	let i = new H(new yu([
		e,
		...n,
		t
	]));
	return r.raw ? i : i.serialize();
}, e_ = (e, t, n, r = {}) => {
	let i = new H();
	i.appendSegment(H.createSegment("M", e));
	let a = 1 / 3, o = 2 / 3, s = r.radius || 10, c, l;
	for (let r = 0, u = n.length; r < u; r += 1) {
		let u = z.create(n[r]), d = n[r - 1] || e, f = n[r + 1] || t;
		c = l || u.distance(d) / 2, l = u.distance(f) / 2;
		let p = -Math.min(s, c), m = -Math.min(s, l), h = u.clone().move(d, p).round(), g = u.clone().move(f, m).round(), _ = new z(a * h.x + o * u.x, o * u.y + a * h.y), v = new z(a * g.x + o * u.x, o * u.y + a * g.y);
		i.appendSegment(H.createSegment("L", h)), i.appendSegment(H.createSegment("C", _, v, g));
	}
	return i.appendSegment(H.createSegment("L", t)), r.raw ? i : i.serialize();
}, t_ = (e, t, n, r = {}) => {
	let i, a = r.direction;
	if (n && n.length !== 0) {
		let r = [
			e,
			...n,
			t
		];
		i = new H(bu.throughPoints(r));
	} else if (i = new H(), i.appendSegment(H.createSegment("M", e)), a ||= Math.abs(e.x - t.x) >= Math.abs(e.y - t.y) ? "H" : "V", a === "H") {
		let n = (e.x + t.x) / 2;
		i.appendSegment(H.createSegment("C", n, e.y, n, t.y, t.x, t.y));
	} else {
		let n = (e.y + t.y) / 2;
		i.appendSegment(H.createSegment("C", e.x, n, t.x, n, t.x, t.y));
	}
	return r.raw ? i : i.serialize();
}, n_ = /* @__PURE__ */ s({
	jumpover: () => Zg,
	loop: () => Qg,
	normal: () => $g,
	rounded: () => e_,
	smooth: () => t_
}), r_ = Ym.create({ type: "connector" });
r_.register(n_, !0);
// node_modules/@antv/x6/es/registry/node-anchor/util.js
function i_(e) {
	return function(t, n, r, i) {
		if (r instanceof Element) {
			let a = this.graph.findViewByElem(r), o;
			return o = a ? a.isEdgeElement(r) ? a_(a, i.fixedAt == null ? "50%" : i.fixedAt) : a.getBBoxOfElement(r).getCenter() : new z(), e.call(this, t, n, o, i);
		}
		return e.apply(this, arguments);
	};
}
function a_(e, t) {
	let n = Tl(t), r = typeof t == "string" ? parseFloat(t) : t;
	return n ? e.getPointAtRatio(r / 100) : e.getPointAtLength(r);
}
// node_modules/@antv/x6/es/registry/edge-anchor/closest.js
var o_ = (e, t, n, r) => e.getClosestPoint(n) ?? new z(), s_ = i_(o_), c_ = (e, t, n, r) => {
	let i = r.length == null ? 20 : r.length;
	return e.getPointAtLength(i);
}, l_ = i_(function(e, t, n, r) {
	let i = 1e6, a = e.getConnection(), o = e.getConnectionSubdivisions(), s = new V(n.clone().translate(0, i), n.clone().translate(0, -1e6)), c = new V(n.clone().translate(i, 0), n.clone().translate(-1e6, 0)), l = s.intersect(a, { segmentSubdivisions: o }), u = c.intersect(a, { segmentSubdivisions: o }), d = [];
	return l && d.push(...l), u && d.push(...u), d.length > 0 ? n.closest(d) : r.fallbackAt == null ? R(o_, this, e, t, n, r) : a_(e, r.fallbackAt);
}), u_ = (e, t, n, r) => {
	let i = r.ratio == null ? .5 : r.ratio;
	return i > 1 && (i /= 100), e.getPointAtRatio(i);
}, d_ = /* @__PURE__ */ s({
	closest: () => s_,
	length: () => c_,
	orth: () => l_,
	ratio: () => u_
}), f_ = Ym.create({ type: "edge endpoint" });
f_.register(d_, !0);
// node_modules/@antv/x6/es/registry/filter/util.js
function p_(e, t) {
	return e ?? t;
}
function m_(e, t) {
	return e != null && Number.isFinite(e) ? e : t;
}
// node_modules/@antv/x6/es/registry/filter/outline.js
function h_(e = {}) {
	let t = p_(e.color, "blue"), n = m_(e.width, 1), r = m_(e.margin, 2), i = m_(e.opacity, 1), a = r;
	return `
    <filter>
      <feFlood flood-color="${t}" flood-opacity="${i}" result="colored"/>
      <feMorphology in="SourceAlpha" result="morphedOuter" operator="dilate" radius="${r + n}" />
      <feMorphology in="SourceAlpha" result="morphedInner" operator="dilate" radius="${a}" />
      <feComposite result="morphedOuterColored" in="colored" in2="morphedOuter" operator="in"/>
      <feComposite operator="xor" in="morphedOuterColored" in2="morphedInner" result="outline"/>
      <feMerge>
        <feMergeNode in="outline"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `.trim();
}
// node_modules/@antv/x6/es/registry/filter/highlight.js
function g_(e = {}) {
	let t = p_(e.color, "red"), n = m_(e.blur, 0), r = m_(e.width, 1);
	return `
      <filter>
        <feFlood flood-color="${t}" flood-opacity="${m_(e.opacity, 1)}" result="colored"/>
        <feMorphology result="morphed" in="SourceGraphic" operator="dilate" radius="${r}"/>
        <feComposite result="composed" in="colored" in2="morphed" operator="in"/>
        <feGaussianBlur result="blured" in="composed" stdDeviation="${n}"/>
        <feBlend in="SourceGraphic" in2="blured" mode="normal"/>
      </filter>
    `.trim();
}
// node_modules/@antv/x6/es/registry/filter/blur.js
function __(e = {}) {
	let t = m_(e.x, 2);
	return `
    <filter>
      <feGaussianBlur stdDeviation="${e.y != null && Number.isFinite(e.y) ? [t, e.y] : t}"/>
    </filter>
  `.trim();
}
// node_modules/@antv/x6/es/registry/filter/drop-shadow.js
function v_(e = {}) {
	let t = m_(e.dx, 0), n = m_(e.dy, 0), r = p_(e.color, "black"), i = m_(e.blur, 4), a = m_(e.opacity, 1);
	return "SVGFEDropShadowElement" in window ? `<filter>
         <feDropShadow stdDeviation="${i}" dx="${t}" dy="${n}" flood-color="${r}" flood-opacity="${a}" />
       </filter>`.trim() : `<filter>
         <feGaussianBlur in="SourceAlpha" stdDeviation="${i}" />
         <feOffset dx="${t}" dy="${n}" result="offsetblur" />
         <feFlood flood-color="${r}" />
         <feComposite in2="offsetblur" operator="in" />
         <feComponentTransfer>
           <feFuncA type="linear" slope="${a}" />
         </feComponentTransfer>
         <feMerge>
           <feMergeNode/>
           <feMergeNode in="SourceGraphic"/>
         </feMerge>
       </filter>`.trim();
}
// node_modules/@antv/x6/es/registry/filter/gray-scale.js
function y_(e = {}) {
	let t = m_(e.amount, 1), n = .2126 + .7874 * (1 - t), r = .7152 - .7152 * (1 - t);
	return `
    <filter>
      <feColorMatrix type="matrix" values="${n} ${r} ${.0722 - .0722 * (1 - t)} 0 0 ${.2126 - .2126 * (1 - t)} ${.7152 + .2848 * (1 - t)} ${.0722 - .0722 * (1 - t)} 0 0 ${.2126 - .2126 * (1 - t)} ${r} ${.0722 + .9278 * (1 - t)} 0 0 0 0 0 1 0"/>
    </filter>
  `.trim();
}
// node_modules/@antv/x6/es/registry/filter/sepia.js
function b_(e = {}) {
	let t = m_(e.amount, 1);
	return `
      <filter>
        <feColorMatrix type="matrix" values="${.393 + .607 * (1 - t)} ${.769 - .769 * (1 - t)} ${.189 - .189 * (1 - t)} 0 0 ${.349 - .349 * (1 - t)} ${.686 + .314 * (1 - t)} ${.168 - .168 * (1 - t)} 0 0 ${.272 - .272 * (1 - t)} ${.534 - .534 * (1 - t)} ${.131 + .869 * (1 - t)} 0 0 0 0 0 1 0"/>
      </filter>
    `.trim();
}
// node_modules/@antv/x6/es/registry/filter/saturate.js
function x_(e = {}) {
	return `
      <filter>
        <feColorMatrix type="saturate" values="${1 - m_(e.amount, 1)}"/>
      </filter>
    `.trim();
}
// node_modules/@antv/x6/es/registry/filter/hue-rotate.js
function S_(e = {}) {
	return `
      <filter>
        <feColorMatrix type="hueRotate" values="${m_(e.angle, 0)}"/>
      </filter>
    `.trim();
}
// node_modules/@antv/x6/es/registry/filter/invert.js
function C_(e = {}) {
	let t = m_(e.amount, 1), n = 1 - t;
	return `
      <filter>
        <feComponentTransfer>
          <feFuncR type="table" tableValues="${t} ${n}"/>
          <feFuncG type="table" tableValues="${t} ${n}"/>
          <feFuncB type="table" tableValues="${t} ${n}"/>
        </feComponentTransfer>
      </filter>
    `.trim();
}
// node_modules/@antv/x6/es/registry/filter/brightness.js
function w_(e = {}) {
	let t = m_(e.amount, 1);
	return `
    <filter>
      <feComponentTransfer>
        <feFuncR type="linear" slope="${t}"/>
        <feFuncG type="linear" slope="${t}"/>
        <feFuncB type="linear" slope="${t}"/>
      </feComponentTransfer>
    </filter>
  `.trim();
}
// node_modules/@antv/x6/es/registry/filter/contrast.js
function T_(e = {}) {
	let t = m_(e.amount, 1), n = .5 - t / 2;
	return `
    <filter>
     <feComponentTransfer>
        <feFuncR type="linear" slope="${t}" intercept="${n}"/>
        <feFuncG type="linear" slope="${t}" intercept="${n}"/>
        <feFuncB type="linear" slope="${t}" intercept="${n}"/>
      </feComponentTransfer>
    </filter>
  `.trim();
}
// node_modules/@antv/x6/es/registry/filter/index.js
var E_ = /* @__PURE__ */ s({
	blur: () => __,
	brightness: () => w_,
	contrast: () => T_,
	dropShadow: () => v_,
	grayScale: () => y_,
	highlight: () => g_,
	hueRotate: () => S_,
	invert: () => C_,
	outline: () => h_,
	saturate: () => x_,
	sepia: () => b_
}), D_ = Ym.create({ type: "filter" });
D_.register(E_, !0);
// node_modules/@antv/x6/es/registry/grid/dot.js
var O_ = {
	color: "#aaaaaa",
	thickness: 1,
	markup: "rect",
	update(e, t) {
		let n = t.thickness * t.sx, r = t.thickness * t.sy;
		W(e, {
			width: n,
			height: r,
			rx: n,
			ry: r,
			fill: t.color
		});
	}
}, k_ = {
	color: "#aaaaaa",
	thickness: 1,
	markup: "rect",
	update(e, t) {
		let n = t.sx <= 1 ? t.thickness * t.sx : t.thickness;
		W(e, {
			width: n,
			height: n,
			rx: n,
			ry: n,
			fill: t.color
		});
	}
}, A_ = {
	color: "rgba(224,224,224,1)",
	thickness: 1,
	markup: "path",
	update(e, t) {
		let n, r = t.width, i = t.height, a = t.thickness;
		n = r - a >= 0 && i - a >= 0 ? [
			"M",
			r,
			0,
			"H0 M0 0 V0",
			i
		].join(" ") : "M 0 0 0 0", W(e, {
			d: n,
			stroke: t.color,
			"stroke-width": t.thickness
		});
	}
}, j_ = [{
	color: "rgba(224,224,224,1)",
	thickness: 1,
	markup: "path",
	update(e, t) {
		let n, r = t.width, i = t.height, a = t.thickness;
		n = r - a >= 0 && i - a >= 0 ? [
			"M",
			r,
			0,
			"H0 M0 0 V0",
			i
		].join(" ") : "M 0 0 0 0", W(e, {
			d: n,
			stroke: t.color,
			"stroke-width": t.thickness
		});
	}
}, {
	color: "rgba(224,224,224,0.2)",
	thickness: 3,
	factor: 4,
	markup: "path",
	update(e, t) {
		let n, r = t.factor || 1, i = t.width * r, a = t.height * r, o = t.thickness;
		n = i - o >= 0 && a - o >= 0 ? [
			"M",
			i,
			0,
			"H0 M0 0 V0",
			a
		].join(" ") : "M 0 0 0 0", t.width = i, t.height = a, W(e, {
			d: n,
			stroke: t.color,
			"stroke-width": t.thickness
		});
	}
}], M_ = /* @__PURE__ */ s({
	dot: () => O_,
	doubleMesh: () => j_,
	fixedDot: () => k_,
	mesh: () => A_
}), N_ = class {
	constructor() {
		this.patterns = {}, this.root = lf.create(Zu(), {
			width: "100%",
			height: "100%"
		}, [Xu("defs")]).node;
	}
	add(e, t) {
		let n = this.root.childNodes[0];
		n && n.appendChild(t), this.patterns[e] = t, lf.create("rect", {
			width: "100%",
			height: "100%",
			fill: `url(#${e})`
		}).appendTo(this.root);
	}
	get(e) {
		return this.patterns[e];
	}
	has(e) {
		return this.patterns[e] != null;
	}
}, P_ = M_, F_ = Ym.create({ type: "grid" });
F_.register(P_, !0);
// node_modules/@antv/x6/es/config/index.js
var J = {
	prefixCls: "x6",
	autoInsertCSS: !0,
	useCSSSelector: !0,
	prefix(e) {
		return `${J.prefixCls}-${e}`;
	}
}, I_ = J.prefix("highlighted"), L_ = {
	highlight(e, t, n) {
		U(t, n && n.className || I_);
	},
	unhighlight(e, t, n) {
		Vu(t, n && n.className || I_);
	}
}, R_ = J.prefix("highlight-opacity"), z_ = {
	highlight(e, t) {
		U(t, R_);
	},
	unhighlight(e, t) {
		Vu(t, R_);
	}
}, B_ = {
	padding: 3,
	rx: 0,
	ry: 0,
	attrs: {
		"stroke-width": 3,
		stroke: "#FEB663"
	}
}, V_ = {
	highlight(e, t, n) {
		let r = H_(t, n);
		if (G_(r)) return;
		n = Ac({}, n, B_);
		let i = lf.create(t), a, o;
		try {
			a = i.toPathData();
		} catch {
			o = Up(i.node, !0), a = jf(Object.assign(Object.assign({}, n), o));
		}
		let s = Xu("path");
		if (W(s, Object.assign({
			d: a,
			"pointer-events": "none",
			"vector-effect": "non-scaling-stroke",
			fill: "none"
		}, n.attrs ? wd(n.attrs) : null)), e.isEdgeElement(t)) W(s, "d", e.getConnectionPathData());
		else {
			let t = i.getTransformToElement(e.container), r = n.padding;
			if (r) {
				o ??= Up(i.node, !0);
				let e = o.x + o.width / 2, n = o.y + o.height / 2;
				o = Hp(o, t);
				let a = Math.max(o.width, 1), s = Math.max(o.height, 1), c = (a + r) / a, l = (s + r) / s, u = Rf({
					a: c,
					b: 0,
					c: 0,
					d: l,
					e: e - c * e,
					f: n - l * n
				});
				t = t.multiply(u);
			}
			Jf(s, t);
		}
		U(s, J.prefix("highlight-stroke"));
		let c = e.cell, l = () => K_(r);
		c.on("removed", l), c.model && c.model.on("reseted", l), e.container.appendChild(s), W_(r, s);
	},
	unhighlight(e, t, n) {
		K_(H_(t, n));
	}
};
function H_(e, t) {
	return Gu(e), e.id + JSON.stringify(t);
}
var U_ = {};
function W_(e, t) {
	U_[e] = t;
}
function G_(e) {
	return U_[e] != null;
}
function K_(e) {
	let t = U_[e];
	t && (ad(t), delete U_[e]);
}
// node_modules/@antv/x6/es/registry/highlighter/main.js
var q_ = /* @__PURE__ */ s({
	className: () => L_,
	opacity: () => z_,
	stroke: () => V_
});
// node_modules/@antv/x6/es/registry/highlighter/index.js
function J_(e, t) {
	if (typeof t.highlight != "function") throw Error(`Highlighter '${e}' is missing required \`highlight()\` method`);
	if (typeof t.unhighlight != "function") throw Error(`Highlighter '${e}' is missing required \`unhighlight()\` method`);
}
var Y_ = q_, X_ = Ym.create({ type: "highlighter" });
X_.register(Y_, !0);
// node_modules/@antv/x6/es/registry/node-anchor/bbox.js
var Z_ = ov("center"), Q_ = ov("topCenter"), $_ = ov("bottomCenter"), ev = ov("leftMiddle"), tv = ov("rightMiddle"), nv = ov("topLeft"), rv = ov("topRight"), iv = ov("bottomLeft"), av = ov("bottomRight");
function ov(e) {
	return (t, n, r, i = {}) => {
		let a;
		a = t.cell.visible ? i.rotate ? t.getUnrotatedBBoxOfElement(n) : t.getBBoxOfElement(n) : t.cell.getBBox();
		let o = a[e];
		o.x += El(i.dx, a.width), o.y += El(i.dy, a.height);
		let s = t.cell;
		return i.rotate ? o.rotate(-s.getAngle(), s.getBBox().getCenter()) : o;
	};
}
var sv = i_((e, t, n, r) => {
	let i = iu(e.cell.getAngle()), a = e.cell.visible ? e.getBBoxOfElement(t) : e.cell.getBBox(), o = a.getCenter(), s = a.getTopLeft(), c = a.getBottomRight(), l = r.padding;
	if (Number.isFinite(l) || (l = 0), s.y + l <= n.y && n.y <= c.y - l) {
		let e = n.y - o.y;
		o.x += i === 0 || i === 180 ? 0 : e * 1 / Math.tan(ru(i)), o.y += e;
	} else if (s.x + l <= n.x && n.x <= c.x - l) {
		let e = n.x - o.x;
		o.y += i === 90 || i === 270 ? 0 : e * Math.tan(ru(i)), o.x += e;
	}
	return o;
}), cv = function(e, t, n, r, i) {
	let a = e.cell.getConnectionPoint(this.cell, i);
	return (r.dx || r.dy) && a.translate(r.dx || 0, r.dy || 0), a;
}, lv = i_((e, t, n, r) => {
	let i, a = 0, o, s = e.cell;
	r.rotate ? (i = e.getUnrotatedBBoxOfElement(t), o = s.getBBox().getCenter(), a = s.getAngle()) : i = s.visible ? e.getBBoxOfElement(t) : e.cell.getBBox();
	let c = r.padding;
	c != null && Number.isFinite(c) && i.inflate(c), r.rotate && n.rotate(a, o);
	let l = i.getNearestSideToPoint(n), u;
	switch (l) {
		case "left":
			u = i.getLeftMiddle();
			break;
		case "right":
			u = i.getRightMiddle();
			break;
		case "top":
			u = i.getTopCenter();
			break;
		case "bottom": u = i.getBottomCenter();
	}
	let d = r.direction;
	return d === "H" ? (l === "top" || l === "bottom") && (u = n.x <= i.x + i.width ? i.getLeftMiddle() : i.getRightMiddle()) : d === "V" && (u = n.y <= i.y + i.height ? i.getTopCenter() : i.getBottomCenter()), r.rotate ? u.rotate(-a, o) : u;
}), uv = /* @__PURE__ */ s({
	bottom: () => $_,
	bottomLeft: () => iv,
	bottomRight: () => av,
	center: () => Z_,
	left: () => ev,
	midSide: () => lv,
	nodeCenter: () => cv,
	orth: () => sv,
	right: () => tv,
	top: () => Q_,
	topLeft: () => nv,
	topRight: () => rv
}), dv = Ym.create({ type: "node endpoint" });
dv.register(uv, !0);
// node_modules/@antv/x6/es/registry/port-label-layout/util.js
var fv = {
	position: {
		x: 0,
		y: 0
	},
	angle: 0,
	attrs: { ".": {
		y: "0",
		"text-anchor": "start"
	} }
};
function pv(e, t) {
	let { x: n, y: r, angle: i, attrs: a } = t || {};
	return Ac({}, {
		angle: i,
		attrs: a,
		position: {
			x: n,
			y: r
		}
	}, e, fv);
}
// node_modules/@antv/x6/es/registry/port-label-layout/side.js
var mv = (e, t, n) => pv({ position: t.getTopLeft() }, n), hv = (e, t, n) => pv({
	position: {
		x: -15,
		y: 0
	},
	attrs: { ".": {
		y: ".3em",
		"text-anchor": "end"
	} }
}, n), gv = (e, t, n) => pv({
	position: {
		x: 15,
		y: 0
	},
	attrs: { ".": {
		y: ".3em",
		"text-anchor": "start"
	} }
}, n), _v = (e, t, n) => pv({
	position: {
		x: 0,
		y: -15
	},
	attrs: { ".": { "text-anchor": "middle" } }
}, n), vv = (e, t, n) => pv({
	position: {
		x: 0,
		y: 15
	},
	attrs: { ".": {
		y: ".6em",
		"text-anchor": "middle"
	} }
}, n), yv = (e, t, n) => Cv(e, t, !1, n), bv = (e, t, n) => Cv(e, t, !0, n), xv = (e, t, n) => wv(e, t, !1, n), Sv = (e, t, n) => wv(e, t, !0, n);
function Cv(e, t, n, r) {
	let i = r.offset == null ? 15 : r.offset, a = t.getCenter().theta(e), o = Tv(t), s, c, l, u, d = 0;
	return a < o[1] || a > o[2] ? (s = ".3em", c = i, l = 0, u = "start") : a < o[0] ? (s = "0", c = 0, l = -i, n ? (d = -90, u = "start") : u = "middle") : a < o[3] ? (s = ".3em", c = -i, l = 0, u = "end") : (s = ".6em", c = 0, l = i, n ? (d = 90, u = "start") : u = "middle"), pv({
		position: {
			x: Math.round(c),
			y: Math.round(l)
		},
		angle: d,
		attrs: { ".": {
			y: s,
			"text-anchor": u
		} }
	}, r);
}
function wv(e, t, n, r) {
	let i = r.offset == null ? 15 : r.offset, a = t.getCenter().theta(e), o = Tv(t), s, c, l, u, d = 0;
	return a < o[1] || a > o[2] ? (s = ".3em", c = -i, l = 0, u = "end") : a < o[0] ? (s = ".6em", c = 0, l = i, n ? (d = 90, u = "start") : u = "middle") : a < o[3] ? (s = ".3em", c = i, l = 0, u = "start") : (s = "0em", c = 0, l = -i, n ? (d = -90, u = "start") : u = "middle"), pv({
		position: {
			x: Math.round(c),
			y: Math.round(l)
		},
		angle: d,
		attrs: { ".": {
			y: s,
			"text-anchor": u
		} }
	}, r);
}
function Tv(e) {
	let t = e.getCenter(), n = t.theta(e.getTopLeft()), r = t.theta(e.getBottomLeft()), i = t.theta(e.getBottomRight());
	return [
		n,
		t.theta(e.getTopRight()),
		i,
		r
	];
}
// node_modules/@antv/x6/es/registry/port-label-layout/radial.js
var Ev = (e, t, n) => Ov(e.diff(t.getCenter()), !1, n), Dv = (e, t, n) => Ov(e.diff(t.getCenter()), !0, n);
function Ov(e, t, n) {
	let r = n.offset == null ? 20 : n.offset, i = new z(0, 0), a = -e.theta(i), o = e.clone().move(i, r).diff(e).round(), s = ".3em", c, l = a;
	return (a + 90) % 180 == 0 ? (c = t ? "end" : "middle", !t && a === -270 && (s = "0em")) : a > -270 && a < -90 ? (c = "start", l = a - 180) : c = "end", pv({
		position: o.round().toJSON(),
		angle: t ? l : 0,
		attrs: { ".": {
			y: s,
			"text-anchor": c
		} }
	}, n);
}
// node_modules/@antv/x6/es/registry/port-label-layout/index.js
var kv = /* @__PURE__ */ s({
	bottom: () => vv,
	inside: () => xv,
	insideOriented: () => Sv,
	left: () => hv,
	manual: () => mv,
	outside: () => yv,
	outsideOriented: () => bv,
	radial: () => Ev,
	radialOriented: () => Dv,
	right: () => gv,
	top: () => _v
}), Av = Ym.create({ type: "port label layout" });
Av.register(kv, !0);
// node_modules/@antv/x6/es/registry/port-layout/util.js
function jv(e, t = {}) {
	return new z(El(t.x, e.width), El(t.y, e.height));
}
function Mv(e, t, n) {
	return Object.assign({
		angle: t,
		position: e.toJSON()
	}, n);
}
// node_modules/@antv/x6/es/registry/port-layout/absolute.js
var Nv = (e, t) => e.map(({ x: e, y: n, angle: r }) => Mv(jv(t, {
	x: e,
	y: n
}), r || 0)), Pv = (e, t, n) => {
	let r = n.start || 0, i = n.step || 20;
	return Iv(e, t, r, (e, t) => (e + .5 - t / 2) * i);
}, Fv = (e, t, n) => {
	let r = n.start || 0, i = n.step || 360 / e.length;
	return Iv(e, t, r, (e) => e * i);
};
function Iv(e, t, n, r) {
	let i = t.getCenter(), a = t.getTopCenter(), o = t.width / t.height, s = fu.fromRect(t), c = e.length;
	return e.map((e, t) => {
		let l = n + r(t, c), u = a.clone().rotate(-l, i).scale(o, 1, i), d = e.compensateRotate ? -s.tangentTheta(u) : 0;
		return (e.dx || e.dy) && u.translate(e.dx || 0, e.dy || 0), e.dr && u.move(i, e.dr), Mv(u.round(), d, e);
	});
}
// node_modules/@antv/x6/es/registry/port-layout/line.js
var Lv = (e, t, n) => Hv(e, jv(t, n.start || t.getOrigin()), jv(t, n.end || t.getCorner()), n), Rv = (e, t, n) => Hv(e, t.getTopLeft(), t.getBottomLeft(), n), zv = (e, t, n) => Hv(e, t.getTopRight(), t.getBottomRight(), n), Bv = (e, t, n) => Hv(e, t.getTopLeft(), t.getTopRight(), n), Vv = (e, t, n) => Hv(e, t.getBottomLeft(), t.getBottomRight(), n);
function Hv(e, t, n, r) {
	let i = new V(t, n), a = e.length;
	return e.map((e, t) => {
		var { strict: n } = e, o = d(e, ["strict"]);
		let s = n || r.strict ? (t + 1) / (a + 1) : (t + .5) / a, c = i.pointAt(s);
		return (o.dx || o.dy) && c.translate(o.dx || 0, o.dy || 0), Mv(c.round(), 0, o);
	});
}
// node_modules/@antv/x6/es/registry/port-layout/index.js
var Uv = /* @__PURE__ */ s({
	absolute: () => Nv,
	bottom: () => Vv,
	ellipse: () => Pv,
	ellipseSpread: () => Fv,
	left: () => Rv,
	line: () => Lv,
	right: () => zv,
	top: () => Bv
}), Wv = Ym.create({ type: "port layout" });
Wv.register(Uv, !0);
// node_modules/@antv/x6/es/registry/router/normal.js
var Gv = (e) => [...e], Kv = (e, t, n) => {
	let r = t.side || "bottom", i = Dl(t.padding || 40), a = n.sourceBBox, o = n.targetBBox, s = a.getCenter(), c = o.getCenter(), l, u, d;
	switch (r) {
		case "top":
			d = -1, l = "y", u = "height";
			break;
		case "left":
			d = -1, l = "x", u = "width";
			break;
		case "right":
			d = 1, l = "x", u = "width";
			break;
		default: d = 1, l = "y", u = "height";
	}
	return s[l] += d * (a[u] / 2 + i[r]), c[l] += d * (o[u] / 2 + i[r]), d * (s[l] - c[l]) > 0 ? c[l] = s[l] : s[l] = c[l], [
		s.toJSON(),
		...e,
		c.toJSON()
	];
};
// node_modules/@antv/x6/es/registry/router/util.js
function qv(e) {
	return new B(e.x, e.y, 0, 0);
}
function Jv(e = {}) {
	let t = Dl(e.padding || 20);
	return {
		x: -t.left,
		y: -t.top,
		width: t.left + t.right,
		height: t.top + t.bottom
	};
}
function Yv(e, t = {}) {
	return e.sourceBBox.clone().moveAndExpand(Jv(t));
}
function Xv(e, t = {}) {
	return e.targetBBox.clone().moveAndExpand(Jv(t));
}
function Zv(e, t = {}) {
	return e.sourceAnchor ? e.sourceAnchor : Yv(e, t).getCenter();
}
function Qv(e, t = {}) {
	return e.targetAnchor ? e.targetAnchor : Xv(e, t).getCenter();
}
// node_modules/@antv/x6/es/registry/router/orth.js
var $v = (e, t, n) => {
	let r = Yv(n, t), i = Xv(n, t), a = Zv(n, t), o = Qv(n, t);
	r = r.union(qv(a)), i = i.union(qv(o));
	let s = e.map((e) => z.create(e));
	s.unshift(a), s.push(o);
	let c = null, l = [];
	for (let e = 0, n = s.length - 1; e < n; e += 1) {
		let a = null, o = s[e], u = s[e + 1], d = iy(o, u) != null;
		if (e === 0) e + 1 === n ? r.intersectsWithRect(i.clone().inflate(1)) ? a = ly(o, u, r, i) : d || (a = cy(o, u, r, i)) : r.containsPoint(u) ? a = ly(o, u, r, qv(u).moveAndExpand(Jv(t))) : d || (a = oy(o, u, r));
		else if (e + 1 === n) {
			let e = d && iy(u, o) === c;
			i.containsPoint(o) || e ? a = ly(o, u, qv(o).moveAndExpand(Jv(t)), i, c) : d || (a = sy(o, u, i, c));
		} else d || (a = ay(o, u, c));
		a ? (l.push(...a.points), c = a.direction) : c = iy(o, u), e + 1 < n && l.push(u);
	}
	return l;
}, ey = {
	N: "S",
	S: "N",
	E: "W",
	W: "E"
}, ty = {
	N: -Math.PI / 2 * 3,
	S: -Math.PI / 2,
	E: 0,
	W: Math.PI
};
function ny(e, t, n) {
	let r = new z(e.x, t.y);
	return n.containsPoint(r) && (r = new z(t.x, e.y)), r;
}
function ry(e, t) {
	return e[t === "W" || t === "E" ? "width" : "height"];
}
function iy(e, t) {
	return e.x === t.x ? e.y > t.y ? "N" : "S" : e.y === t.y ? e.x > t.x ? "W" : "E" : null;
}
function ay(e, t, n) {
	let r = new z(e.x, t.y), i = new z(t.x, e.y), a = iy(e, r), o = iy(e, i), s = n ? ey[n] : null, c = a === n || a !== s && (o === s || o !== n) ? r : i;
	return {
		points: [c],
		direction: iy(c, t)
	};
}
function oy(e, t, n) {
	let r = ny(e, t, n);
	return {
		points: [r],
		direction: iy(r, t)
	};
}
function sy(e, t, n, r) {
	let i = [new z(e.x, t.y), new z(t.x, e.y)], a = i.filter((e) => !n.containsPoint(e)), o = a.filter((t) => iy(t, e) !== r), s;
	if (o.length > 0) return s = o.filter((t) => iy(e, t) === r).pop(), s ||= o[0], {
		points: [s],
		direction: iy(s, t)
	};
	{
		s = Pc(i, a)[0];
		let o = z.create(t).move(s, -ry(n, r) / 2);
		return {
			points: [ny(o, e, n), o],
			direction: iy(o, t)
		};
	}
}
function cy(e, t, n, r) {
	let i = oy(t, e, r), a = i.points[0];
	if (n.containsPoint(a)) {
		i = oy(e, t, n);
		let o = i.points[0];
		if (r.containsPoint(o)) {
			let s = new V(z.create(e).move(o, -ry(n, iy(e, o)) / 2), z.create(t).move(a, -ry(r, iy(t, a)) / 2)).getCenter(), c = oy(e, s, n), l = ay(s, t, c.direction);
			i.points = [c.points[0], l.points[0]], i.direction = l.direction;
		}
	}
	return i;
}
function ly(e, t, n, r, i) {
	let a = n.union(r).inflate(1), o = a.getCenter(), s = o.distance(t) > o.distance(e), c = s ? t : e, l = s ? e : t, u, d, f;
	i ? (u = z.fromPolar(a.width + a.height, ty[i], c), u = a.getNearestPointToPoint(u).move(u, -1)) : u = a.getNearestPointToPoint(c).move(c, 1), d = ny(u, l, a);
	let p;
	u.round().equals(d.round()) ? (d = z.fromPolar(a.width + a.height, ru(u.theta(c)) + Math.PI / 2, l), d = a.getNearestPointToPoint(d).move(l, 1).round(), f = ny(u, d, a), p = s ? [
		d,
		f,
		u
	] : [
		u,
		f,
		d
	]) : p = s ? [d, u] : [u, d];
	let m = iy(s ? u : d, t);
	return {
		points: p,
		direction: m
	};
}
// node_modules/@antv/x6/es/registry/router/manhattan/options.js
var uy = {
	step: 10,
	maxLoopCount: 2e3,
	precision: 1,
	maxDirectionChange: 90,
	perpendicular: !0,
	excludeTerminals: [],
	excludeNodes: [],
	excludeShapes: [],
	startDirections: [
		"top",
		"right",
		"bottom",
		"left"
	],
	endDirections: [
		"top",
		"right",
		"bottom",
		"left"
	],
	directionMap: {
		top: {
			x: 0,
			y: -1
		},
		right: {
			x: 1,
			y: 0
		},
		bottom: {
			x: 0,
			y: 1
		},
		left: {
			x: -1,
			y: 0
		}
	},
	cost() {
		return dy(this.step, this);
	},
	directions() {
		let e = dy(this.step, this), t = dy(this.cost, this);
		return [
			{
				cost: t,
				offsetX: e,
				offsetY: 0
			},
			{
				cost: t,
				offsetX: -e,
				offsetY: 0
			},
			{
				cost: t,
				offsetX: 0,
				offsetY: e
			},
			{
				cost: t,
				offsetX: 0,
				offsetY: -e
			}
		];
	},
	penalties() {
		let e = dy(this.step, this);
		return {
			0: 0,
			45: e / 2,
			90: e / 2
		};
	},
	paddingBox() {
		let e = dy(this.step, this);
		return {
			x: -e,
			y: -e,
			width: 2 * e,
			height: 2 * e
		};
	},
	fallbackRouter: $v,
	draggingRouter: null,
	snapToGrid: !0
};
function dy(e, t) {
	return typeof e == "function" ? e.call(t) : e;
}
function fy(e) {
	let t = Object.keys(e).reduce((t, n) => {
		let r = t;
		return r[n] = n === "fallbackRouter" || n === "draggingRouter" || n === "fallbackRoute" ? e[n] : dy(e[n], e), t;
	}, {});
	if (t.padding) {
		let e = Dl(t.padding);
		t.paddingBox = {
			x: -e.left,
			y: -e.top,
			width: e.left + e.right,
			height: e.top + e.bottom
		};
	}
	return t.directions.forEach((e) => {
		let t = new z(0, 0), n = new z(e.offsetX, e.offsetY);
		e.angle = iu(t.theta(n));
	}), t;
}
// node_modules/@antv/x6/es/registry/router/manhattan/obstacle-map.js
var py = class {
	constructor(e) {
		this.options = e, this.mapGridSize = 100, this.map = {};
	}
	build(e, t) {
		let n = this.options, r = n.excludeTerminals.reduce((n, r) => {
			let i = t[r];
			if (i) {
				let t = e.getCell(i.cell);
				t && n.push(t);
			}
			return n;
		}, []), i = [], a = e.getCell(t.getSourceCellId());
		a && (i = xl(i, a.getAncestors().map((e) => e.id)));
		let o = e.getCell(t.getTargetCellId());
		o && (i = xl(i, o.getAncestors().map((e) => e.id)));
		let s = this.mapGridSize;
		return e.getNodes().reduce((e, t) => {
			let a = r.some((e) => e.id === t.id), o = t.shape ? n.excludeShapes.includes(t.shape) : !1, c = n.excludeNodes.some((e) => typeof e == "string" ? t.id === e : e === t), l = i.includes(t.id), u = o || a || c || l;
			if (t.isVisible() && !u) {
				let r = t.getBBox().moveAndExpand(n.paddingBox), i = r.getOrigin().snapToGrid(s), a = r.getCorner().snapToGrid(s);
				for (let t = i.x; t <= a.x; t += s) for (let n = i.y; n <= a.y; n += s) {
					let i = new z(t, n).toString();
					e[i] ?? (e[i] = []), e[i].push(r);
				}
			}
			return e;
		}, this.map), this;
	}
	isAccessible(e) {
		let t = e.clone().snapToGrid(this.mapGridSize).toString(), n = this.map[t];
		return !n || n.every((t) => !t.containsPoint(e));
	}
}, my = /* @__PURE__ */ new WeakMap();
function hy(e) {
	let t = my.get(e);
	t && (t.dirty = !0);
}
function gy(e) {
	let t = my.get(e);
	t && !t.installed && (e.on("reseted", () => hy(e)), e.on("updated", () => hy(e)), e.on("cell:added", () => hy(e)), e.on("cell:removed", () => hy(e)), e.on("cell:change:position", () => hy(e)), e.on("cell:change:size", () => hy(e)), e.on("edge:change:source", () => hy(e)), e.on("edge:change:target", () => hy(e)), t.installed = !0);
}
function _y(e) {
	let t = e.paddingBox;
	return `${t == null ? "none" : `${t.x},${t.y},${t.width},${t.height}`}#${(e.excludeTerminals || []).map((e) => e).sort().join("|")}#${(e.excludeShapes || []).slice().sort().join("|")}#${(e.excludeNodes || []).map((e) => typeof e == "string" ? e : e?.id || "node").slice().sort().join("|")}`;
}
function vy(e, t, n) {
	let r = my.get(e);
	if (!r) {
		let i = new py(n).build(e, t);
		return r = {
			map: i,
			dirty: !1,
			installed: !1,
			optionsKey: _y(n)
		}, my.set(e, r), gy(e), i;
	}
	let i = _y(n);
	return (r.dirty || r.optionsKey !== i) && (r.map = new py(n).build(e, t), r.dirty = !1, r.optionsKey = i), r.map;
}
// node_modules/@antv/x6/es/registry/router/manhattan/sorted-set.js
var yy = 1, by = 2, xy = class {
	constructor() {
		this.items = [], this.hash = {}, this.values = {}, this.indexes = {};
	}
	swap(e, t) {
		let n = this.items[e], r = this.items[t];
		this.items[e] = r, this.items[t] = n, this.indexes[r] = e, this.indexes[n] = t;
	}
	less(e, t) {
		let n = this.items[e], r = this.items[t];
		return this.values[n] < this.values[r];
	}
	bubbleUp(e) {
		for (; e > 0;) {
			let t = e - 1 >> 1;
			if (this.less(e, t)) this.swap(e, t), e = t;
			else break;
		}
	}
	bubbleDown(e) {
		let t = this.items.length;
		for (;;) {
			let n = (e << 1) + 1, r = n + 1, i = e;
			if (n < t && this.less(n, i) && (i = n), r < t && this.less(r, i) && (i = r), i !== e) this.swap(e, i), e = i;
			else break;
		}
	}
	add(e, t) {
		let n = this.hash[e] === yy;
		if (this.values[e] = t, n) {
			let t = this.indexes[e];
			t != null && (this.bubbleUp(t), this.bubbleDown(t));
		} else {
			this.hash[e] = yy, this.items.push(e);
			let t = this.items.length - 1;
			this.indexes[e] = t, this.bubbleUp(t);
		}
	}
	pop() {
		if (this.items.length === 0) return;
		let e = this.items[0];
		this.hash[e] = by;
		let t = this.items.pop();
		return delete this.indexes[e], this.items.length > 0 && t != null && (this.items[0] = t, this.indexes[t] = 0, this.bubbleDown(0)), e;
	}
	isOpen(e) {
		return this.hash[e] === yy;
	}
	isClose(e) {
		return this.hash[e] === by;
	}
	isEmpty() {
		return this.items.length === 0;
	}
};
// node_modules/@antv/x6/es/registry/router/manhattan/util.js
function Sy(e, t) {
	let n = e.sourceBBox.clone();
	return t && t.paddingBox ? n.moveAndExpand(t.paddingBox) : n;
}
function Cy(e, t) {
	let n = e.targetBBox.clone();
	return t && t.paddingBox ? n.moveAndExpand(t.paddingBox) : n;
}
function wy(e, t) {
	return e.sourceAnchor ? e.sourceAnchor : Sy(e, t).getCenter();
}
function Ty(e, t) {
	return e.targetAnchor ? e.targetAnchor : Cy(e, t).getCenter();
}
function Ey(e, t, n, r, i) {
	let a = 360 / n, o = iu(e.theta(Dy(e, t, r, i)) + a / 2);
	return a * Math.floor(o / a);
}
function Dy(e, t, n, r) {
	let i = r.step, a = t.x - e.x, o = t.y - e.y, s = a / n.x, c = o / n.y, l = s * i, u = c * i;
	return new z(e.x + l, e.y + u);
}
function Oy(e, t) {
	let n = Math.abs(e - t);
	return n > 180 ? 360 - n : n;
}
function ky(e, t) {
	let n = t.step;
	return t.directions.forEach((t) => {
		t.gridOffsetX = t.offsetX / n * e.x, t.gridOffsetY = t.offsetY / n * e.y;
	}), t.directions;
}
function Ay(e, t, n) {
	return {
		source: t.clone(),
		x: jy(n.x - t.x, e),
		y: jy(n.y - t.y, e)
	};
}
function jy(e, t) {
	if (!e) return t;
	let n = Math.abs(e), r = Math.round(n / t);
	return r ? t + (n - r * t) / r : n;
}
function My(e, t) {
	let n = t.source;
	return new z(cu(e.x - n.x, t.x) + n.x, cu(e.y - n.y, t.y) + n.y);
}
function Ny(e, t) {
	return e.round(t);
}
function Py(e, t, n) {
	return Ny(My(e.clone(), t), n);
}
function Fy(e) {
	return e.toString();
}
function Iy(e) {
	return new z(e.x === 0 ? 0 : Math.abs(e.x) / e.x, e.y === 0 ? 0 : Math.abs(e.y) / e.y);
}
function Ly(e, t) {
	let n = Infinity;
	for (let r = 0, i = t.length; r < i; r += 1) {
		let i = e.manhattanDistance(t[r]);
		i < n && (n = i);
	}
	return n;
}
function Ry(e, t, n, r, i) {
	let a = i.precision, o = i.directionMap, s = e.diff(t.getCenter()), c = Object.keys(o).reduce((i, c) => {
		if (n.includes(c)) {
			let n = o[c], l = new V(e, new z(e.x + n.x * (Math.abs(s.x) + t.width), e.y + n.y * (Math.abs(s.y) + t.height))).intersect(t) || [], u, d = null;
			for (let t = 0; t < l.length; t += 1) {
				let n = l[t], r = e.squaredDistance(n);
				(u == null || r > u) && (u = r, d = n);
			}
			if (d) {
				let e = Py(d, r, a);
				t.containsPoint(e) && (e = Py(e.translate(n.x * r.x, n.y * r.y), r, a)), i.push(e);
			}
		}
		return i;
	}, []);
	return t.containsPoint(e) || c.push(Py(e, r, a)), c;
}
function zy(e, t, n, r, i) {
	let a = [], o = Iy(i.diff(n)), s = Fy(n), c = e[s], l;
	for (; c;) {
		l = t[s];
		let n = Iy(l.diff(c));
		n.equals(o) || (a.unshift(l), o = n), s = Fy(c), c = e[s];
	}
	let u = t[s];
	return Iy(u.diff(r)).equals(o) || a.unshift(u), a;
}
// node_modules/@antv/x6/es/registry/router/manhattan/router.js
function By(e, t, n, r, i) {
	let a = i.precision, o, s;
	o = B.isRectangle(t) ? Ny(wy(e, i).clone(), a) : Ny(t.clone(), a), s = B.isRectangle(n) ? Ny(Ty(e, i).clone(), a) : Ny(n.clone(), a);
	let c = Ay(i.step, o, s), l = o, u = s, d, f;
	if (d = B.isRectangle(t) ? Ry(l, t, i.startDirections, c, i) : [l], f = B.isRectangle(n) ? Ry(s, n, i.endDirections, c, i) : [u], d = d.filter((e) => r.isAccessible(e)), f = f.filter((e) => r.isAccessible(e)), d.length > 0 && f.length > 0) {
		let e = new xy(), t = {}, n = {}, o = {};
		for (let n = 0, r = d.length; n < r; n += 1) {
			let r = d[n], i = Fy(r);
			e.add(i, Ly(r, f)), t[i] = r, o[i] = 0;
		}
		let s = i.previousDirectionAngle, p = s === void 0, m, h, g = ky(c, i), _ = g.length, v = f.map((e) => Fy(e)), y = z.equalPoints(d, f), b = i.maxLoopCount;
		for (; !e.isEmpty() && b > 0;) {
			let d = e.pop();
			if (d == null) break;
			let x = t[d], S = n[d], C = o[d], w = x.equals(l), T = S == null, E;
			if (E = T ? p ? w ? null : Ey(l, x, _, c, i) : s : Ey(S, x, _, c, i), !(T && y) && v.indexOf(d) >= 0) return i.previousDirectionAngle = E, zy(n, t, x, l, u);
			for (let s = 0; s < _; s += 1) {
				m = g[s];
				let l = m.angle ?? 0;
				if (h = E == null ? 0 : Oy(E, l), !(p && w) && h > i.maxDirectionChange) continue;
				let d = Py(x.clone().translate(m.gridOffsetX || 0, m.gridOffsetY || 0), c, a), y = Fy(d);
				if (e.isClose(y) || !r.isAccessible(d) || v.indexOf(y) >= 0 && !d.equals(u) && Oy(l, Ey(d, u, _, c, i)) > i.maxDirectionChange) continue;
				let b = m.cost, S = w ? 0 : i.penalties[h], T = C + b + S;
				(!e.isOpen(y) || T < o[y]) && (t[y] = d, n[y] = x, o[y] = T, e.add(y, T + Ly(d, f)));
			}
			--b;
		}
	}
	return i.fallbackRoute ? R(i.fallbackRoute, this, l, u, i) : null;
}
function Vy(e, t = 10) {
	if (e.length <= 1) return e;
	for (let n = 0, r = e.length; n < r - 1; n += 1) {
		let r = e[n], i = e[n + 1];
		if (r.x === i.x) {
			let e = t * Math.round(r.x / t);
			r.x !== e && (r.x = e, i.x = e);
		} else if (r.y === i.y) {
			let e = t * Math.round(r.y / t);
			r.y !== e && (r.y = e, i.y = e);
		}
	}
	return e;
}
var Hy = function(e, t, n) {
	let r = fy(t), i = Sy(n, r), a = Cy(n, r), o = wy(n, r), s = vy(n.graph.model, n.cell, r), c = e.map((e) => z.create(e)), l = [], u = o, d, f;
	for (let t = 0, p = c.length; t <= p; t += 1) {
		let p = null;
		if (d = f || i, f = c[t], f == null) {
			f = a;
			let e = n.cell;
			if ((e.getSourceCellId() == null || e.getTargetCellId() == null) && typeof r.draggingRouter == "function") {
				let e = d === i ? o : d, t = f.getOrigin();
				p = R(r.draggingRouter, n, e, t, r);
			}
		}
		if (p ??= By(n, d, f, s, r), p === null) return console.warn("Unable to execute manhattan algorithm, use orth instead"), R(r.fallbackRouter, this, e, r, n);
		p[0]?.equals(u) && p.shift(), u = p[p.length - 1] || u, l.push(...p);
	}
	return r.snapToGrid ? Vy(l, n.graph.grid.getGridSize()) : l;
}, Uy = function(e, t, n) {
	return R(Hy, this, e, Object.assign(Object.assign({}, uy), t), n);
}, Wy = {
	maxDirectionChange: 45,
	directions() {
		let e = dy(this.step, this), t = dy(this.cost, this), n = Math.ceil(Math.sqrt(e * e << 1));
		return [
			{
				cost: t,
				offsetX: e,
				offsetY: 0
			},
			{
				cost: n,
				offsetX: e,
				offsetY: e
			},
			{
				cost: t,
				offsetX: 0,
				offsetY: e
			},
			{
				cost: n,
				offsetX: -e,
				offsetY: e
			},
			{
				cost: t,
				offsetX: -e,
				offsetY: 0
			},
			{
				cost: n,
				offsetX: -e,
				offsetY: -e
			},
			{
				cost: t,
				offsetX: 0,
				offsetY: -e
			},
			{
				cost: n,
				offsetX: e,
				offsetY: -e
			}
		];
	},
	fallbackRoute: Gy
};
function Gy(e, t, n) {
	let r = e.theta(t), i = [], a = {
		x: t.x,
		y: e.y
	}, o = {
		x: e.x,
		y: t.y
	};
	if (r % 180 > 90) {
		let e = a;
		a = o, o = e;
	}
	let s = r % 90 < 45 ? a : o, c = new V(e, s), l = 90 * Math.ceil(r / 90), u = new V(t, z.fromPolar(c.squaredLength(), ru(l + 135), s)), d = c.intersectsWithLine(u), f = d || e, p = 360 / n.directions.length, m = iu(f.theta(t) + p / 2);
	return n.previousDirectionAngle = p * Math.floor(m / p), d && !d.equals(e) && !d.equals(t) && i.push(d.round()), i;
}
var Ky = function(e, t, n) {
	return R(Uy, this, e, Object.assign(Object.assign({}, Wy), t), n);
}, qy = (e, t, n) => {
	let r = t.offset || 32, i = t.min == null ? 16 : t.min, a = 0, o = t.direction, s = n.sourceBBox, c = n.targetBBox, l = s.getCenter(), u = c.getCenter();
	if (typeof r == "number" && (a = r), o == null) {
		let e = c.left - s.right, t = c.top - s.bottom;
		e >= 0 && t >= 0 ? o = e >= t ? "L" : "T" : e <= 0 && t >= 0 ? (e = s.left - c.right, o = e >= 0 && e >= t ? "R" : "T") : e >= 0 && t <= 0 ? (t = s.top - c.bottom, o = t >= 0 ? e >= t ? "L" : "B" : "L") : (e = s.left - c.right, t = s.top - c.bottom, o = e >= 0 && t >= 0 ? e >= t ? "R" : "B" : e <= 0 && t >= 0 ? "B" : e >= 0 && t <= 0 || Math.abs(e) > Math.abs(t) ? "R" : "B");
	}
	o === "H" ? o = u.x - l.x >= 0 ? "L" : "R" : o === "V" && (o = u.y - l.y >= 0 ? "T" : "B"), r === "center" && (o === "L" ? a = (c.left - s.right) / 2 : o === "R" ? a = (s.left - c.right) / 2 : o === "T" ? a = (c.top - s.bottom) / 2 : o === "B" && (a = (s.top - c.bottom) / 2));
	let d, f, p, m = o === "L" || o === "R";
	if (m) {
		if (u.y === l.y) return [...e];
		p = o === "L" ? 1 : -1, d = "x", f = "width";
	} else {
		if (u.x === l.x) return [...e];
		p = o === "T" ? 1 : -1, d = "y", f = "height";
	}
	let h = l.clone(), g = u.clone();
	if (h[d] += p * (s[f] / 2 + a), g[d] -= p * (c[f] / 2 + a), m) {
		let e = h.x, t = g.x, n = s.width / 2 + i, r = c.width / 2 + i;
		u.x > l.x ? t <= e && (h.x = Math.max(t, l.x + n), g.x = Math.min(e, u.x - r)) : t >= e && (h.x = Math.min(t, l.x - n), g.x = Math.max(e, u.x + r));
	} else {
		let e = h.y, t = g.y, n = s.height / 2 + i, r = c.height / 2 + i;
		u.y > l.y ? t <= e && (h.y = Math.max(t, l.y + n), g.y = Math.min(e, u.y - r)) : t >= e && (h.y = Math.min(t, l.y - n), g.y = Math.max(e, u.y + r));
	}
	return [
		h.toJSON(),
		...e,
		g.toJSON()
	];
};
// node_modules/@antv/x6/es/registry/router/loop.js
function Jy(e, t) {
	if (t != null && t !== !1) {
		let n = typeof t == "boolean" ? 0 : t;
		if (n > 0) {
			let t = z.create(e[1]).move(e[2], n), r = z.create(e[1]).move(e[0], n);
			return [
				t.toJSON(),
				...e,
				r.toJSON()
			];
		}
		{
			let t = e[1];
			return [
				Object.assign({}, t),
				...e,
				Object.assign({}, t)
			];
		}
	}
	return e;
}
var Yy = (e, t, n) => {
	let r = t.width || 50, i = (t.height || 80) / 2, a = t.angle || "auto", o = n.sourceAnchor, s = n.targetAnchor, c = n.sourceBBox, l = n.targetBBox;
	if (o.equals(s)) {
		let e = (e) => {
			let t = ru(e), n = Math.sin(t), a = Math.cos(t), s = new z(o.x + a * r, o.y + n * r), c = new z(s.x - a * i, s.y - n * i), l = c.clone().rotate(-90, s), u = c.clone().rotate(90, s);
			return [
				l.toJSON(),
				s.toJSON(),
				u.toJSON()
			];
		}, n = (e) => {
			let t = new V(o.clone().move(e, -1), e);
			return !c.containsPoint(e) && !c.intersectsWithLine(t);
		}, s = [
			0,
			90,
			180,
			270,
			45,
			135,
			225,
			315
		];
		if (typeof a == "number") return Jy(e(a), t.merge);
		let l = c.getCenter();
		if (l.equals(o)) return Jy(e(0), t.merge);
		let u = l.angleBetween(o, l.clone().translate(1, 0)), d = e(u);
		if (n(d[1])) return Jy(d, t.merge);
		for (let r = 1, i = s.length; r < i; r += 1) if (d = e(u + s[r]), n(d[1])) return Jy(d, t.merge);
		return Jy(d, t.merge);
	}
	{
		let e = new V(o, s), a = e.parallel(-r), u = a.getCenter(), d = a.start.clone().move(a.end, i), f = a.end.clone().move(a.start, i), p = e.parallel(-1), m = new V(p.start, u), h = new V(p.end, u);
		if ((c.containsPoint(u) || l.containsPoint(u) || c.intersectsWithLine(m) || c.intersectsWithLine(h) || l.intersectsWithLine(m) || l.intersectsWithLine(h)) && (a = e.parallel(r), u = a.getCenter(), d = a.start.clone().move(a.end, i), f = a.end.clone().move(a.start, i)), t.merge) {
			let e = new V(o, s), t = new V(u, e.center).setLength(2 ** 53 - 1), r = c.intersectsWithLine(t), i = l.intersectsWithLine(t), a = r ? Array.isArray(r) ? r : [r] : [];
			i && (Array.isArray(i) ? a.push(...i) : a.push(i));
			let d = e.center.closest(a);
			d ? (n.sourceAnchor = d.clone(), n.targetAnchor = d.clone()) : (n.sourceAnchor = e.center.clone(), n.targetAnchor = e.center.clone());
		}
		return Jy([
			d.toJSON(),
			u.toJSON(),
			f.toJSON()
		], t.merge);
	}
}, Xy = /* @__PURE__ */ s({
	er: () => qy,
	loop: () => Yy,
	manhattan: () => Uy,
	metro: () => Ky,
	normal: () => Gv,
	oneSide: () => Kv,
	orth: () => $v
}), Zy = Ym.create({ type: "router" });
Zy.register(Xy, !0);
// node_modules/@antv/x6/es/view/markup.js
function Qy(e) {
	return e != null && !$y(e);
}
function $y(e) {
	return e != null && typeof e == "string";
}
function eb(e) {
	return e == null || $y(e) ? e : as(e);
}
function tb(e) {
	return `${e}`.trim().replace(/[\r|\n]/g, " ").replace(/>\s+</g, "><");
}
function nb(e, t = { ns: qu.svg }) {
	let n = document.createDocumentFragment(), r = {}, i = {}, a = [{
		markup: Array.isArray(e) ? e : [e],
		parent: n,
		ns: t.ns
	}];
	for (; a.length > 0;) {
		let e = a.pop(), t = e.ns || qu.svg, n = e.markup, o = e.parent;
		n.forEach((e) => {
			let n = e.tagName;
			if (!n) throw TypeError("Invalid tagName");
			e.ns && (t = e.ns);
			let s = t ? Yu(n, t) : Ju(n), c = e.attrs;
			c && W(s, wd(c));
			let l = e.style;
			l && G(s, l);
			let u = e.className;
			u != null && s.setAttribute("class", Array.isArray(u) ? u.join(" ") : u), e.textContent && (s.textContent = e.textContent);
			let d = e.selector;
			if (d != null) {
				if (i[d]) throw TypeError("Selector must be unique");
				i[d] = s;
			}
			if (e.groupSelector) {
				let t = e.groupSelector;
				Array.isArray(t) || (t = [t]), t.forEach((e) => {
					r[e] || (r[e] = []), r[e].push(s);
				});
			}
			o.appendChild(s);
			let f = e.children;
			Array.isArray(f) && a.push({
				ns: t,
				markup: f,
				parent: s
			});
		});
	}
	return Object.keys(r).forEach((e) => {
		if (i[e]) throw Error("Ambiguous group selector");
		i[e] = r[e];
	}), {
		fragment: n,
		selectors: i,
		groups: r
	};
}
function rb(e) {
	return e instanceof SVGElement ? Xu("g") : Ju("div");
}
function ib(e) {
	if ($y(e)) {
		let t = lf.createVectors(e), n = t.length;
		if (n === 1) return { elem: t[0].node };
		if (n > 1) {
			let e = rb(t[0].node);
			return t.forEach((t) => {
				e.appendChild(t.node);
			}), { elem: e };
		}
		return {};
	}
	let t = nb(e), n = t.fragment, r = null;
	return n.childNodes.length > 1 ? (r = rb(n.firstChild), r.appendChild(n)) : r = n.firstChild, {
		elem: r,
		selectors: t.selectors
	};
}
function ab(e) {
	let t = lf.createVectors(e), n = document.createDocumentFragment();
	for (let e = 0, r = t.length; e < r; e += 1) {
		let r = t[e].node;
		n.appendChild(r);
	}
	return {
		fragment: n,
		selectors: {}
	};
}
function ob(e, t, n) {
	if (e != null) {
		let r, i = e.tagName.toLowerCase();
		if (e === t) return r = typeof n == "string" ? `> ${i} > ${n}` : `> ${i}`, r;
		let a = e.parentNode;
		return r = a && a.childNodes.length > 1 ? `${i}:nth-child(${ed(e) + 1})` : i, n && (r += ` > ${n}`), ob(e.parentNode, t, r);
	}
	return n;
}
function sb() {
	return "g";
}
function cb() {
	return {
		tagName: "circle",
		selector: "circle",
		attrs: {
			r: 10,
			fill: "#FFFFFF",
			stroke: "#000000"
		}
	};
}
function lb() {
	return {
		tagName: "text",
		selector: "text",
		attrs: { fill: "#000000" }
	};
}
function ub() {
	return [{
		tagName: "path",
		selector: "wrap",
		groupSelector: "lines",
		attrs: {
			fill: "none",
			cursor: "pointer",
			stroke: "transparent",
			strokeLinecap: "round"
		}
	}, {
		tagName: "path",
		selector: "line",
		groupSelector: "lines",
		attrs: {
			fill: "none",
			pointerEvents: "none"
		}
	}];
}
function db(e = !1) {
	return {
		tagName: "foreignObject",
		selector: "fo",
		children: [{
			ns: qu.xhtml,
			tagName: "body",
			selector: "foBody",
			attrs: { xmlns: qu.xhtml },
			style: {
				width: "100%",
				height: "100%",
				background: "transparent"
			},
			children: e ? [] : [{
				tagName: "div",
				selector: "foContent",
				style: {
					width: "100%",
					height: "100%"
				}
			}]
		}]
	};
}
var fb = {
	isJSONMarkup: Qy,
	isStringMarkup: $y,
	clone: eb,
	sanitize: tb,
	parseJSONMarkup: nb,
	createContainer: rb,
	renderMarkup: ib,
	parseLabelStringMarkup: ab,
	getSelector: ob,
	getPortContainerMarkup: sb,
	getPortMarkup: cb,
	getPortLabelMarkup: lb,
	getEdgeMarkup: ub,
	getForeignObjectMarkup: db
}, pb = {};
function mb(e, t) {
	pb[e] = t;
}
function hb(e) {
	delete pb[e];
}
function gb(e, t) {
	return t ? Xu(e || "g") : Yu(e || "div");
}
function _b(e, t, n) {
	if (!e || e === ".") return { elems: [t] };
	if (n) {
		let t = n[e];
		if (t) return { elems: Array.isArray(t) ? t : [t] };
	}
	if (J.useCSSSelector) {
		let n = e.includes(">") ? `:scope ${e}` : e;
		return {
			isCSSSelector: !0,
			elems: Array.prototype.slice.call(t.querySelectorAll(n))
		};
	}
	return { elems: [] };
}
function vb(e) {
	let t = e, n = e.originalEvent?.changedTouches?.[0];
	if (n) {
		for (let t in e) n[t] === void 0 && (n[t] = e[t]);
		t = n;
	}
	return t;
}
// node_modules/@antv/x6/es/view/view/index.js
var yb = class extends Wm {
	get priority() {
		return 2;
	}
	get disposeContainer() {
		return !0;
	}
	constructor() {
		super(), this.cid = wl("v"), mb(this.cid, this);
	}
	confirmUpdate(e, t) {
		return 0;
	}
	empty(e = this.container) {
		return od(e), this;
	}
	unmount(e = this.container) {
		return ad(e), this;
	}
	remove(e = this.container) {
		return e === this.container ? (this.removeEventListeners(document), this.onRemove(), hb(this.cid), this.disposeContainer && this.unmount(e)) : this.unmount(e), this;
	}
	onRemove() {}
	setClass(e, t = this.container) {
		t.classList.value = Array.isArray(e) ? e.join(" ") : e;
	}
	addClass(e, t = this.container) {
		return U(t, Array.isArray(e) ? e.join(" ") : e), this;
	}
	removeClass(e, t = this.container) {
		return Vu(t, Array.isArray(e) ? e.join(" ") : e), this;
	}
	setStyle(e, t = this.container) {
		return G(t, e), this;
	}
	setAttrs(e, t = this.container) {
		return e != null && t != null && W(t, e), this;
	}
	findAttr(e, t = this.container) {
		let n = t;
		for (; n && n.nodeType === 1;) {
			let t = n.getAttribute(e);
			if (t != null) return t;
			if (n === this.container) return null;
			n = n.parentNode;
		}
		return null;
	}
	find(e, t = this.container, n = this.selectors) {
		return _b(e, t, n).elems;
	}
	findOne(e, t = this.container, n = this.selectors) {
		let r = this.find(e, t, n);
		return r.length > 0 ? r[0] : null;
	}
	findByAttr(e, t = this.container) {
		let n = t;
		for (; n?.getAttribute;) {
			let t = n.getAttribute(e);
			if ((t != null || n === this.container) && t !== "false") return n;
			n = n.parentNode;
		}
		return null;
	}
	getSelector(e, t) {
		let n;
		if (e === this.container) return typeof t == "string" && (n = `> ${t}`), n;
		if (e) {
			let r = ed(e) + 1;
			n = `${e.tagName.toLowerCase()}:nth-child(${r})`, t && (n += ` > ${t}`), n = this.getSelector(e.parentNode, n);
		}
		return n;
	}
	prefixClassName(e) {
		return J.prefix(e);
	}
	delegateEvents(e, t) {
		if (e == null) return this;
		t || this.undelegateEvents();
		let n = /^(\S+)\s*(.*)$/;
		return Object.keys(e).forEach((t) => {
			let r = t.match(n);
			if (r == null) return;
			let i = this.getEventHandler(e[t]);
			typeof i == "function" && this.delegateEvent(r[1], r[2], i);
		}), this;
	}
	undelegateEvents() {
		return K.off(this.container, this.getEventNamespace()), this;
	}
	delegateDocumentEvents(e, t) {
		return this.addEventListeners(document, e, t), this;
	}
	undelegateDocumentEvents() {
		return this.removeEventListeners(document), this;
	}
	delegateEvent(e, t, n) {
		return K.on(this.container, e + this.getEventNamespace(), t, n), this;
	}
	undelegateEvent(e, t, n) {
		let r = e + this.getEventNamespace();
		return t == null ? K.off(this.container, r) : typeof t == "string" ? K.off(this.container, r, t, n) : K.off(this.container, r, t), this;
	}
	addEventListeners(e, t, n) {
		if (t == null) return this;
		let r = this.getEventNamespace();
		return Object.keys(t).forEach((i) => {
			let a = this.getEventHandler(t[i]);
			typeof a == "function" && K.on(e, i + r, n, a);
		}), this;
	}
	removeEventListeners(e) {
		return e != null && K.off(e, this.getEventNamespace()), this;
	}
	getEventNamespace() {
		return `.${J.prefixCls}-event-${this.cid}`;
	}
	getEventHandler(e) {
		let t;
		if (typeof e == "string") {
			let n = this[e];
			typeof n == "function" && (t = (...e) => n.call(this, ...e));
		} else t = (...t) => e.call(this, ...t);
		return t;
	}
	getEventTarget(e, t = {}) {
		let { target: n, type: r, clientX: i = 0, clientY: a = 0 } = e;
		return t.fromPoint || r === "touchmove" || r === "touchend" ? document.elementFromPoint(i, a) : n;
	}
	stopPropagation(e) {
		return this.setEventData(e, { propagationStopped: !0 }), this;
	}
	isPropagationStopped(e) {
		return this.getEventData(e).propagationStopped === !0;
	}
	getEventData(e) {
		return this.eventData(e);
	}
	setEventData(e, t) {
		return this.eventData(e, t);
	}
	eventData(e, t) {
		if (e == null) throw TypeError("Event object required");
		let n = e.data, r = `__${this.cid}__`;
		return t == null ? n == null ? {} : n[r] || {} : (n ??= e.data = {}, n[r] == null ? n[r] = Object.assign({}, t) : n[r] = Object.assign(Object.assign({}, n[r]), t), n[r]);
	}
	normalizeEvent(e) {
		return vb(e);
	}
	dispose() {
		this.remove();
	}
};
f([q()], yb.prototype, "dispose", null);
// node_modules/@antv/x6/es/view/tool/util.js
var bb = 0;
function xb(e) {
	return e ? _d(e) : (bb += 1, `CustomTool${bb}`);
}
// node_modules/@antv/x6/es/view/tool/tool-item.js
var Sb = class e extends yb {
	static isToolItem(t) {
		if (t == null) return !1;
		if (t instanceof e) return !0;
		let n = t[Symbol.toStringTag], r = t;
		return !(n != null && n !== Cb || r.graph == null || r.cell == null || typeof r.config != "function" || typeof r.update != "function" || typeof r.focus != "function" || typeof r.blur != "function" || typeof r.show != "function" || typeof r.hide != "function" || typeof r.isVisible != "function");
	}
	static define(e) {
		let t = this, n = tf(xb(e.name), t);
		return n.config(e), n;
	}
	static getDefaults() {
		return this.defaults;
	}
	static config(e) {
		this.defaults = this.getOptions(e);
	}
	static getOptions(e) {
		return Qc(as(this.getDefaults()), e);
	}
	get graph() {
		return this.cellView.graph;
	}
	get cell() {
		return this.cellView.cell;
	}
	get name() {
		return this.options.name;
	}
	get [Symbol.toStringTag]() {
		return Cb;
	}
	constructor(e = {}) {
		super(), this.visible = !0, this.options = this.getOptions(e), this.container = gb(this.options.tagName || "g", this.options.isSVGElement !== !1), U(this.container, this.prefixClassName("cell-tool")), typeof this.options.className == "string" && U(this.container, this.options.className), this.init();
	}
	init() {}
	getOptions(e) {
		return this.constructor.getOptions(e);
	}
	delegateEvents() {
		return this.options.events && super.delegateEvents(this.options.events), this;
	}
	config(e, t) {
		return this.cellView = e, this.parent = t, this.stamp(this.container), this.cell.isEdge() ? U(this.container, this.prefixClassName("edge-tool")) : this.cell.isNode() && U(this.container, this.prefixClassName("node-tool")), this.name && this.container.setAttribute("data-tool-name", this.name), this.delegateEvents(), this;
	}
	render() {
		this.empty();
		let e = this.options.markup;
		if (e) {
			let t = fb.parseJSONMarkup(e);
			this.container.appendChild(t.fragment), this.childNodes = t.selectors;
		}
		return this.onRender(), this;
	}
	onRender() {}
	update() {
		return this;
	}
	stamp(e) {
		e && e.setAttribute("data-cell-id", this.cellView.cell.id);
	}
	show() {
		return this.container.style.display = "", this.visible = !0, this;
	}
	hide() {
		return this.container.style.display = "none", this.visible = !1, this;
	}
	isVisible() {
		return this.visible;
	}
	focus() {
		let e = this.options.focusOpacity;
		return e != null && Number.isFinite(e) && (this.container.style.opacity = `${e}`), this.parent.focus(this), this;
	}
	blur() {
		return this.container.style.opacity = "", this.parent.blur(this), this;
	}
	guard(e) {
		return this.graph == null || this.cellView == null || this.graph.view.guard(e, this.cellView);
	}
};
Sb.toStringTag = `X6.${Sb.name}`, Sb.defaults = {
	isSVGElement: !0,
	tagName: "g"
};
var Cb = `X6.${Sb.name}`, wb = class {
	constructor(e) {
		this.view = e;
	}
	get cell() {
		return this.view.cell;
	}
	getDefinition(e) {
		return this.cell.getAttrDefinition(e);
	}
	processAttrs(e, t) {
		let n, r, i, a, o = [];
		return Object.keys(t).forEach((r) => {
			let i = t[r], a = this.getDefinition(r), s = R(bg, this.view, a, i, {
				elem: e,
				attrs: t,
				cell: this.cell,
				view: this.view
			});
			if (a && s) typeof a == "string" ? (n ??= {}, n[a] = i) : i !== null && o.push({
				name: r,
				definition: a
			});
			else {
				n ??= {};
				let e = vd.includes(r) ? r : gd(r);
				n[e] = i;
			}
		}), o.forEach(({ name: e, definition: n }) => {
			let o = t[e];
			typeof n.set == "function" && (r ??= {}, r[e] = o), typeof n.offset == "function" && (i ??= {}, i[e] = o), typeof n.position == "function" && (a ??= {}, a[e] = o);
		}), {
			raw: t,
			normal: n,
			set: r,
			offset: i,
			position: a
		};
	}
	mergeProcessedAttrs(e, t) {
		e.set = Object.assign(Object.assign({}, e.set), t.set), e.position = Object.assign(Object.assign({}, e.position), t.position), e.offset = Object.assign(Object.assign({}, e.offset), t.offset);
		let n = e.normal?.transform;
		n != null && t.normal && (t.normal.transform = n), e.normal = t.normal;
	}
	findAttrs(e, t, n, r) {
		let i = [], a = new Gm();
		return Object.keys(e).forEach((o) => {
			let s = e[o];
			if (!Sr(s)) return;
			let { isCSSSelector: c, elems: l } = _b(o, t, r);
			n[o] = l;
			for (let e = 0, t = l.length; e < t; e += 1) {
				let n = l[e], u = r && r[o] === n, d = a.get(n);
				if (d) {
					d.array || (i.push(n), d.array = !0, d.attrs = [d.attrs], d.priority = [d.priority]);
					let e = d.attrs, r = d.priority;
					if (u) e.unshift(s), r.unshift(-1);
					else {
						let n = ml(r, c ? -1 : t);
						e.splice(n, 0, s), r.splice(n, 0, t);
					}
				} else a.set(n, {
					elem: n,
					attrs: s,
					priority: u ? -1 : t,
					array: !1
				});
			}
		}), i.forEach((e) => {
			let t = a.get(e);
			t.attrs = t.attrs.reduceRight((e, t) => Qc(e, t), {});
		}), a;
	}
	updateRelativeAttrs(e, t, n) {
		let r = t.raw || {}, i = t.normal || {}, a = t.set, o = t.position, s = t.offset, c = () => ({
			elem: e,
			cell: this.cell,
			view: this.view,
			attrs: r,
			refBBox: n.clone()
		});
		if (a != null && Object.keys(a).forEach((e) => {
			let t = a[e], n = this.getDefinition(e);
			if (n != null) {
				let r = R(n.set, this.view, t, c());
				typeof r == "object" ? i = Object.assign(Object.assign({}, i), r) : r != null && (i[e] = r);
			}
		}), e instanceof HTMLElement) {
			this.view.setAttrs(i, e);
			return;
		}
		let l = i.transform, u = Bf(l ? `${l}` : null), d = new z(u.e, u.f);
		l && (delete i.transform, u.e = 0, u.f = 0);
		let f = !1;
		o != null && Object.keys(o).forEach((e) => {
			let t = o[e], n = this.getDefinition(e);
			if (n != null) {
				let e = R(n.position, this.view, t, c());
				e != null && (f = !0, d.translate(z.create(e)));
			}
		}), this.view.setAttrs(i, e);
		let p = !1;
		if (s != null) {
			let t = this.view.getBoundingRectOfElement(e);
			if (t.width > 0 && t.height > 0) {
				let n = Hp(t, u);
				Object.keys(s).forEach((t) => {
					let i = s[t], a = this.getDefinition(t);
					if (a != null) {
						let t = R(a.offset, this.view, i, {
							elem: e,
							cell: this.cell,
							view: this.view,
							attrs: r,
							refBBox: n
						});
						t != null && (p = !0, d.translate(z.create(t)));
					}
				});
			}
		}
		(l != null || f || p) && (d.round(1), u.e = d.x, u.f = d.y, e.setAttribute("transform", Vf(u)));
	}
	update(e, t, n) {
		let r = {}, i = this.findAttrs(n.attrs || t, e, r, n.selectors), a = n.attrs ? this.findAttrs(t, e, r, n.selectors) : i, o = [];
		i.each((t) => {
			let i = t.elem, s = t.attrs, c = this.processAttrs(i, s);
			if (c.set == null && c.position == null && c.offset == null) this.view.setAttrs(c.normal, i);
			else {
				let t = a.get(i), l = t ? t.attrs : null, u = l && s.ref == null ? l.ref : s.ref, d;
				if (u) {
					if (d = (r[u] || this.view.find(u, e, n.selectors))[0], !d) throw Error(`"${u}" reference does not exist.`);
				} else d = null;
				let f = {
					node: i,
					refNode: d,
					attributes: l,
					processedAttributes: c
				}, p = o.findIndex((e) => e.refNode === i);
				p > -1 ? o.splice(p, 0, f) : o.push(f);
			}
		});
		let s = new Gm(), c;
		o.forEach((t) => {
			let r = t.node, i = t.refNode, a, o = i != null && n.rotatableNode != null && id(n.rotatableNode, i);
			if (i && (a = s.get(i)), !a) {
				let t = o ? n.rotatableNode : e;
				a = i ? Wp(i, { target: t }) : n.rootBBox, i && s.set(i, a);
			}
			let l;
			n.attrs && t.attributes ? (l = this.processAttrs(r, t.attributes), this.mergeProcessedAttrs(l, t.processedAttributes)) : l = t.processedAttributes;
			let u = a;
			o && n.rotatableNode != null && !n.rotatableNode.contains(r) && (c ||= Bf(W(n.rotatableNode, "transform")), u = Hp(a, c)), this.updateRelativeAttrs(r, l, u);
		});
	}
}, Tb = class {
	constructor(e) {
		this.view = e, this.clean();
	}
	clean() {
		this.elemCache && this.elemCache.dispose(), this.elemCache = new Gm(), this.pathCache = {};
	}
	get(e) {
		return this.elemCache.has(e) || this.elemCache.set(e, {}), this.elemCache.get(e);
	}
	getData(e) {
		let t = this.get(e);
		return t.data ||= {}, t.data;
	}
	getMatrix(e) {
		let t = this.get(e);
		if (t.matrix == null) {
			let n = this.view.container;
			t.matrix = $f(e, n);
		}
		return Rf(t.matrix);
	}
	getShape(e) {
		let t = this.get(e);
		return t.shape ??= Kp(e), t.shape.clone();
	}
	getBoundingRect(e) {
		let t = this.get(e);
		return t.boundingRect ??= Jp(e), t.boundingRect.clone();
	}
}, Eb = class {
	get cell() {
		return this.view.cell;
	}
	constructor(e, t, n = []) {
		this.view = e;
		let r = {}, i = {}, a = 0;
		Object.keys(t).forEach((e) => {
			let n = t[e];
			Array.isArray(n) || (n = [n]), n.forEach((t) => {
				let n = r[t];
				n ||= (a += 1, r[t] = 1 << a), i[e] |= n;
			});
		});
		let o = n;
		if (Array.isArray(o) || (o = [o]), o.forEach((e) => {
			r[e] || (a += 1, r[e] = 1 << a);
		}), a > 25) throw Error("Maximum number of flags exceeded.");
		this.flags = r, this.attrs = i, this.bootstrap = n;
	}
	getFlag(e) {
		let t = this.flags;
		return t == null ? 0 : Array.isArray(e) ? e.reduce((e, n) => e | t[n], 0) : t[e] | 0;
	}
	hasAction(e, t) {
		return e & this.getFlag(t);
	}
	removeAction(e, t) {
		return e ^ e & this.getFlag(t);
	}
	getBootstrapFlag() {
		return this.getFlag(this.bootstrap);
	}
	getChangedFlag() {
		let e = 0;
		return this.attrs && Object.keys(this.attrs).forEach((t) => {
			this.cell.hasChanged(t) && (e |= this.attrs[t]);
		}), e;
	}
}, Db = class e extends yb {
	static getDefaults() {
		return e.defaults;
	}
	static isCellView(t) {
		if (t == null) return !1;
		if (t instanceof e) return !0;
		let n = t[Symbol.toStringTag], r = t;
		return !(n != null && n !== Ob || typeof r.isNodeView != "function" || typeof r.isEdgeView != "function" || typeof r.confirmUpdate != "function");
	}
	static config(t) {
		e.defaults = e.getOptions(t);
	}
	static getOptions(t) {
		let n = (e, t) => t == null ? Array.isArray(e) ? [...e] : [e] : Sl([...Array.isArray(e) ? e : [e], ...Array.isArray(t) ? t : [t]]), r = as(e.getDefaults()), { bootstrap: i, actions: a, events: o, documentEvents: s } = t, c = d(t, [
			"bootstrap",
			"actions",
			"events",
			"documentEvents"
		]);
		return i && (r.bootstrap = n(r.bootstrap, i)), a && Object.entries(a).forEach(([e, t]) => {
			let i = r.actions[e];
			t && i ? r.actions[e] = n(i, t) : t && (r.actions[e] = n(t));
		}), o && (r.events = Object.assign(Object.assign({}, r.events), o)), t.documentEvents && (r.documentEvents = Object.assign(Object.assign({}, r.documentEvents), s)), Qc(r, c);
	}
	get [Symbol.toStringTag]() {
		return Ob;
	}
	constructor(e, t = {}) {
		super(), this.cell = e, this.options = this.ensureOptions(t), this.graph = this.options.graph, this.attr = new wb(this), this.flag = new Eb(this, this.options.actions, this.options.bootstrap), this.cache = new Tb(this), this.setContainer(this.ensureContainer()), this.setup(), this.init();
	}
	init() {}
	onRemove() {
		this.removeTools();
	}
	get priority() {
		return this.options.priority;
	}
	get rootSelector() {
		return this.options.rootSelector;
	}
	getConstructor() {
		return this.constructor;
	}
	ensureOptions(e) {
		return this.getConstructor().getOptions(e);
	}
	getContainerTagName() {
		return this.options.isSvgElement ? "g" : "div";
	}
	getContainerStyle() {}
	getContainerAttrs() {
		return {
			"data-cell-id": this.cell.id,
			"data-shape": this.cell.shape
		};
	}
	getContainerClassName() {
		return this.prefixClassName("cell");
	}
	ensureContainer() {
		return gb(this.getContainerTagName(), this.options.isSvgElement);
	}
	setContainer(e) {
		if (this.container !== e) {
			this.undelegateEvents(), this.container = e, this.options.events != null && this.delegateEvents(this.options.events);
			let t = this.getContainerAttrs();
			t != null && this.setAttrs(t, e);
			let n = this.getContainerStyle();
			n != null && this.setStyle(n, e);
			let r = this.getContainerClassName();
			r != null && this.addClass(r, e);
		}
		return this;
	}
	isNodeView() {
		return !1;
	}
	isEdgeView() {
		return !1;
	}
	render() {
		return this;
	}
	confirmUpdate(e, t = {}) {
		return 0;
	}
	getBootstrapFlag() {
		return this.flag.getBootstrapFlag();
	}
	getFlag(e) {
		return this.flag.getFlag(e);
	}
	hasAction(e, t) {
		return this.flag.hasAction(e, t);
	}
	removeAction(e, t) {
		return this.flag.removeAction(e, t);
	}
	handleAction(e, t, n, r) {
		if (this.hasAction(e, t)) {
			n();
			let i = [t];
			return r && (typeof r == "string" ? i.push(r) : i.push(...r)), this.removeAction(e, i);
		}
		return e;
	}
	setup() {
		this.cell.on("changed", this.onCellChanged, this);
	}
	onCellChanged({ options: e }) {
		this.onAttrsChange(e);
	}
	onAttrsChange(e) {
		let t = this.flag.getChangedFlag();
		!e.updated && t && (e.dirty && this.hasAction(t, "update") && (t |= this.getFlag("render")), e.toolId && (e.async = !1), this.graph != null && this.graph.renderer.requestViewUpdate(this, t, e));
	}
	parseJSONMarkup(e, t) {
		let n = fb.parseJSONMarkup(e), r = n.selectors, i = this.rootSelector;
		if (t && i) {
			if (r[i]) throw Error("Invalid root selector");
			r[i] = t;
		}
		return n;
	}
	can(e) {
		let t = this.graph.options.interacting;
		if (typeof t == "function" && (t = R(t, this.graph, this)), typeof t == "object") {
			let n = t[e];
			return typeof n == "function" && (n = R(n, this.graph, this)), n !== !1;
		}
		return typeof t == "boolean" && t;
	}
	cleanCache() {
		return this.cache.clean(), this;
	}
	getCache(e) {
		return this.cache.get(e);
	}
	getDataOfElement(e) {
		return this.cache.getData(e);
	}
	getMatrixOfElement(e) {
		return this.cache.getMatrix(e);
	}
	getShapeOfElement(e) {
		return this.cache.getShape(e);
	}
	getBoundingRectOfElement(e) {
		return this.cache.getBoundingRect(e);
	}
	getBBoxOfElement(e) {
		let t = this.getBoundingRectOfElement(e), n = this.getMatrixOfElement(e), r = this.getRootRotatedMatrix();
		return Hp(t, this.getRootTranslatedMatrix().multiply(r).multiply(n));
	}
	getUnrotatedBBoxOfElement(e) {
		let t = this.getBoundingRectOfElement(e), n = this.getMatrixOfElement(e);
		return Hp(t, this.getRootTranslatedMatrix().multiply(n));
	}
	getBBox(e = {}) {
		let t;
		if (e.useCellGeometry) {
			let e = this.cell, n = e.isNode() ? e.getAngle() : 0;
			t = e.getBBox().bbox(n);
		} else t = this.getBBoxOfElement(this.container);
		return this.graph.coord.localToGraphRect(t);
	}
	getRootTranslatedMatrix() {
		let e = this.cell, t = e.isNode() ? e.getPosition() : {
			x: 0,
			y: 0
		};
		return Rf().translate(t.x, t.y);
	}
	getRootRotatedMatrix() {
		let e = Rf(), t = this.cell, n = t.isNode() ? t.getAngle() : 0;
		if (n) {
			let r = t.getBBox(), i = r.width / 2, a = r.height / 2;
			e = e.translate(i, a).rotate(n).translate(-i, -a);
		}
		return e;
	}
	findMagnet(e = this.container) {
		return this.findByAttr("magnet", e);
	}
	updateAttrs(e, t, n = {}) {
		n.rootBBox ??= new B(), n.selectors ??= this.selectors, this.attr.update(e, t, n);
	}
	isEdgeElement(e) {
		return this.cell.isEdge() && (e == null || e === this.container);
	}
	prepareHighlight(e, t = {}) {
		let n = e || this.container;
		return t.partial = n === this.container, n;
	}
	highlight(e, t = {}) {
		let n = this.prepareHighlight(e, t);
		return this.notify("cell:highlight", {
			magnet: n,
			options: t,
			view: this,
			cell: this.cell
		}), this.isEdgeView() ? this.notify("edge:highlight", {
			magnet: n,
			options: t,
			view: this,
			edge: this.cell,
			cell: this.cell
		}) : this.isNodeView() && this.notify("node:highlight", {
			magnet: n,
			options: t,
			view: this,
			node: this.cell,
			cell: this.cell
		}), this;
	}
	unhighlight(e, t = {}) {
		let n = this.prepareHighlight(e, t);
		return this.notify("cell:unhighlight", {
			magnet: n,
			options: t,
			view: this,
			cell: this.cell
		}), this.isNodeView() ? this.notify("node:unhighlight", {
			magnet: n,
			options: t,
			view: this,
			node: this.cell,
			cell: this.cell
		}) : this.isEdgeView() && this.notify("edge:unhighlight", {
			magnet: n,
			options: t,
			view: this,
			edge: this.cell,
			cell: this.cell
		}), this;
	}
	notifyUnhighlight(e, t) {}
	getEdgeTerminal(e, t, n, r, i) {
		let a = this.cell, o = this.findAttr("port", e), s = e.getAttribute("data-selector"), c = { cell: a.id };
		return s != null && (c.magnet = s), o == null ? s == null && this.container !== e && (c.selector = this.getSelector(e)) : (c.port = o, a.isNode() && !a.hasPort(o) && s == null && (c.selector = this.getSelector(e))), c;
	}
	getMagnetFromEdgeTerminal(e) {
		let t = this.cell, n = this.container, r = e.port, i = e.magnet, a;
		return r != null && t.isNode() && t.hasPort(r) ? a = this.findPortElem(r, i) || n : (i ||= e.selector, !i && r != null && (i = `[port="${r}"]`), a = this.findOne(i, n, this.selectors)), a;
	}
	hasTools(e) {
		let t = this.tools;
		return t == null ? !1 : e == null || t.name === e;
	}
	addTools(e) {
		if (this.removeTools(), e) {
			if (!this.can("toolsAddable")) return this;
			let t = kb.isToolsView(e) ? e : new kb(e);
			this.tools = t, t.config({ view: this }), t.mount();
		}
		return this;
	}
	updateTools(e = {}) {
		return this.tools && this.tools.update(e), this;
	}
	removeTools() {
		return this.tools &&= (this.tools.remove(), null), this;
	}
	hideTools() {
		return this.tools && this.tools.hide(), this;
	}
	showTools() {
		return this.tools && this.tools.show(), this;
	}
	renderTools() {
		let e = this.cell.getTools();
		return this.addTools(e), this;
	}
	notify(e, t) {
		return this.trigger(e, t), this.graph.trigger(e, t), this;
	}
	getEventArgs(e, t, n) {
		let r = this, i = r.cell;
		return t == null || n == null ? {
			e,
			view: r,
			cell: i
		} : {
			e,
			x: t,
			y: n,
			view: r,
			cell: i
		};
	}
	onClick(e, t, n) {
		this.notify("cell:click", this.getEventArgs(e, t, n));
	}
	onDblClick(e, t, n) {
		this.notify("cell:dblclick", this.getEventArgs(e, t, n));
	}
	onContextMenu(e, t, n) {
		this.notify("cell:contextmenu", this.getEventArgs(e, t, n));
	}
	onMouseDown(e, t, n) {
		this.cell.model && (this.cachedModelForMouseEvent = this.cell.model, this.cachedModelForMouseEvent.startBatch("mouse")), this.notify("cell:mousedown", this.getEventArgs(e, t, n));
	}
	onMouseUp(e, t, n) {
		this.notify("cell:mouseup", this.getEventArgs(e, t, n)), this.cachedModelForMouseEvent &&= (this.cachedModelForMouseEvent.stopBatch("mouse", { cell: this.cell }), null);
	}
	onMouseMove(e, t, n) {
		this.notify("cell:mousemove", this.getEventArgs(e, t, n));
	}
	onMouseOver(e) {
		this.notify("cell:mouseover", this.getEventArgs(e));
	}
	onMouseOut(e) {
		this.notify("cell:mouseout", this.getEventArgs(e));
	}
	onMouseEnter(e) {
		this.notify("cell:mouseenter", this.getEventArgs(e));
	}
	onMouseLeave(e) {
		this.notify("cell:mouseleave", this.getEventArgs(e));
	}
	onMouseWheel(e, t, n, r) {
		this.notify("cell:mousewheel", Object.assign({ delta: r }, this.getEventArgs(e, t, n)));
	}
	onCustomEvent(e, t, n, r) {
		this.notify("cell:customevent", Object.assign({ name: t }, this.getEventArgs(e, n, r))), this.notify(t, Object.assign({}, this.getEventArgs(e, n, r)));
	}
	onMagnetMouseDown(e, t, n, r) {}
	onMagnetDblClick(e, t, n, r) {}
	onMagnetContextMenu(e, t, n, r) {}
	onLabelMouseDown(e, t, n) {}
	checkMouseleave(e) {
		let t = this.getEventTarget(e, { fromPoint: !0 }), n = this.graph.findViewByElem(t);
		n !== this && (this.onMouseLeave(e), n && n.onMouseEnter(e));
	}
	dispose() {
		this.cell.off("changed", this.onCellChanged, this);
	}
};
Db.defaults = {
	isSvgElement: !0,
	rootSelector: "root",
	priority: 0,
	bootstrap: [],
	actions: {}
}, Db.registry = Ym.create({ type: "view" }), f([q()], Db.prototype, "dispose", null);
var Ob = `X6.${Db.name}`, kb = class e extends yb {
	static isToolsView(t) {
		if (t == null) return !1;
		if (t instanceof e) return !0;
		let n = t[Symbol.toStringTag], r = t;
		return !(n != null && n !== Ab || r.graph == null || r.cell == null || typeof r.config != "function" || typeof r.update != "function" || typeof r.focus != "function" || typeof r.blur != "function" || typeof r.show != "function" || typeof r.hide != "function");
	}
	get name() {
		return this.options.name;
	}
	get graph() {
		return this.cellView.graph;
	}
	get cell() {
		return this.cellView.cell;
	}
	get [Symbol.toStringTag]() {
		return Ab;
	}
	constructor(e = {}) {
		super(), this.svgContainer = this.createContainer(!0, e), this.htmlContainer = this.createContainer(!1, e), this.config(e);
	}
	createContainer(e, t) {
		let n = e ? gb("g", !0) : gb("div", !1);
		return U(n, this.prefixClassName("cell-tools")), t.className && U(n, t.className), n;
	}
	config(e) {
		if (this.options = Object.assign(Object.assign({}, this.options), e), !Db.isCellView(e.view) || e.view === this.cellView) return this;
		this.cellView = e.view, this.cell.isEdge() ? (U(this.svgContainer, this.prefixClassName("edge-tools")), U(this.htmlContainer, this.prefixClassName("edge-tools"))) : this.cell.isNode() && (U(this.svgContainer, this.prefixClassName("node-tools")), U(this.htmlContainer, this.prefixClassName("node-tools"))), this.svgContainer.setAttribute("data-cell-id", this.cell.id), this.htmlContainer.setAttribute("data-cell-id", this.cell.id), this.name && (this.svgContainer.setAttribute("data-tools-name", this.name), this.htmlContainer.setAttribute("data-tools-name", this.name));
		let t = this.options.items;
		if (!Array.isArray(t)) return this;
		this.tools = [];
		let n = [];
		t.forEach((e) => {
			Sb.isToolItem(e) ? e.name === "vertices" ? n.unshift(e) : n.push(e) : (typeof e == "object" ? e.name : e) === "vertices" ? n.unshift(e) : n.push(e);
		});
		for (let e = 0; e < n.length; e += 1) {
			let t = n[e], r;
			if (Sb.isToolItem(t)) r = t;
			else {
				let e = typeof t == "object" ? t.name : t, n = typeof t == "object" && t.args || {};
				if (e) {
					if (this.cell.isNode()) {
						let t = ax.get(e);
						if (t) r = new t(n);
						else return ax.onNotFound(e);
					} else if (this.cell.isEdge()) {
						let t = sx.get(e);
						if (t) r = new t(n);
						else return sx.onNotFound(e);
					}
				}
			}
			r && (r.config(this.cellView, this), r.render(), (r.options.isSVGElement === !1 ? this.htmlContainer : this.svgContainer).appendChild(r.container), this.tools.push(r));
		}
		return this;
	}
	update(e = {}) {
		let t = this.tools;
		return t && t.forEach((t) => {
			e.toolId !== t.cid && t.isVisible() && t.update();
		}), this;
	}
	focus(e) {
		let t = this.tools;
		return t && t.forEach((t) => {
			e === t ? t.show() : t.hide();
		}), this;
	}
	blur(e) {
		let t = this.tools;
		return t && t.forEach((t) => {
			t !== e && !t.isVisible() && (t.show(), t.update());
		}), this;
	}
	hide() {
		return this.focus(null);
	}
	show() {
		return this.blur(null);
	}
	remove() {
		let e = this.tools;
		return e && (e.forEach((e) => e.remove()), this.tools = null), ad(this.svgContainer), ad(this.htmlContainer), super.remove();
	}
	mount() {
		let e = this.tools, t = this.cellView;
		if (t && e) {
			let n = e.some((e) => e.options.isSVGElement !== !1), r = e.some((e) => e.options.isSVGElement === !1);
			n && (this.options.local ? t.container : t.graph.view.decorator).appendChild(this.svgContainer), r && this.graph.container.appendChild(this.htmlContainer);
		}
		return this;
	}
};
kb.toStringTag = `X6.${kb.name}`;
var Ab = `X6.${kb.name}`, jb = (e) => e;
// node_modules/@antv/x6/es/registry/connection-strategy/pin.js
function Mb(e, t) {
	return t === 0 ? "0%" : `${Math.round(e / t * 100)}%`;
}
function Nb(e) {
	return (t, n, r, i) => n.isEdgeElement(r) ? Fb(e, t, n, r, i) : Pb(e, t, n, r, i);
}
function Pb(e, t, n, r, i) {
	let a = n.cell, o = a.getAngle(), s = n.getUnrotatedBBoxOfElement(r), c = a.getBBox().getCenter(), l = z.create(i).rotate(o, c), u = l.x - s.x, d = l.y - s.y;
	return e && (u = Mb(u, s.width), d = Mb(d, s.height)), t.anchor = {
		name: "topLeft",
		args: {
			dx: u,
			dy: d,
			rotate: !0
		}
	}, t;
}
function Fb(e, t, n, r, i) {
	let a = n.getConnection();
	if (!a) return t;
	let o = a.closestPointLength(i);
	return t.anchor = e ? {
		name: "ratio",
		args: { ratio: o / a.length() }
	} : {
		name: "length",
		args: { length: o }
	}, t;
}
var Ib = Nb(!0), Lb = Nb(!1), Rb = /* @__PURE__ */ s({
	noop: () => jb,
	pinAbsolute: () => Lb,
	pinRelative: () => Ib
});
Ym.create({ type: "connection strategy" }).register(Rb, !0);
// node_modules/@antv/x6/es/registry/tool/util.js
function zb(e, t, n, r) {
	return R(Rb.pinRelative, this.graph, {}, t, n, e, this.cell, r, {}).anchor;
}
function Bb(e, t) {
	return t ? e.cell.getBBox() : e.cell.isEdge() ? e.getConnection().bbox() : e.getUnrotatedBBoxOfElement(e.container);
}
// node_modules/@antv/x6/es/registry/tool/anchor.js
var Vb = class extends Sb {
	get type() {
		return this.options.type;
	}
	onRender() {
		U(this.container, this.prefixClassName(`edge-tool-${this.type}-anchor`)), this.toggleArea(!1), this.update();
	}
	update() {
		let e = this.type;
		return this.cellView.getTerminalView(e) ? (this.updateAnchor(), this.updateArea(), this.container.style.display = "") : this.container.style.display = "none", this;
	}
	updateAnchor() {
		let e = this.childNodes;
		if (!e) return;
		let t = e.anchor;
		if (!t) return;
		let n = this.type, r = this.cellView, i = this.options, a = r.getTerminalAnchor(n), o = r.cell.prop([n, "anchor"]);
		t.setAttribute("transform", `translate(${a.x}, ${a.y})`);
		let s = o ? i.customAnchorAttrs : i.defaultAnchorAttrs;
		s && Object.keys(s).forEach((e) => {
			t.setAttribute(e, s[e]);
		});
	}
	updateArea() {
		let e = this.childNodes;
		if (!e) return;
		let t = e.area;
		if (!t) return;
		let n = this.type, r = this.cellView, i = r.getTerminalView(n);
		if (i) {
			let e = i.cell, a = r.getTerminalMagnet(n), o = this.options.areaPadding || 0;
			Number.isFinite(o) || (o = 0);
			let s, c, l;
			i.isEdgeElement(a) ? (s = i.getBBox(), c = 0, l = s.getCenter()) : (s = i.getUnrotatedBBoxOfElement(a), c = e.getAngle(), l = s.getCenter(), c && l.rotate(-c, e.getBBox().getCenter())), s.inflate(o), W(t, {
				x: -s.width / 2,
				y: -s.height / 2,
				width: s.width,
				height: s.height,
				transform: `translate(${l.x}, ${l.y}) rotate(${c})`
			});
		}
	}
	toggleArea(e) {
		if (this.childNodes) {
			let t = this.childNodes.area;
			t && (t.style.display = e ? "" : "none");
		}
	}
	onMouseDown(e) {
		this.guard(e) || (e.stopPropagation(), e.preventDefault(), this.graph.view.undelegateEvents(), this.options.documentEvents && this.delegateDocumentEvents(this.options.documentEvents), this.focus(), this.toggleArea(this.options.restrictArea), this.cell.startBatch("move-anchor", {
			ui: !0,
			toolId: this.cid
		}));
	}
	resetAnchor(e) {
		let t = this.type, n = this.cell;
		e ? n.prop([t, "anchor"], e, {
			rewrite: !0,
			ui: !0,
			toolId: this.cid
		}) : n.removeProp([t, "anchor"], {
			ui: !0,
			toolId: this.cid
		});
	}
	onMouseMove(e) {
		let t = this.type, n = this.cellView, r = n.getTerminalView(t);
		if (r == null) return;
		let i = this.normalizeEvent(e), a = r.cell, o = n.getTerminalMagnet(t), s = this.graph.coord.clientToLocalPoint(i.clientX, i.clientY), c = this.options.snap;
		if (typeof c == "function") {
			let e = R(c, n, s, r, o, t, n, this);
			s = z.create(e);
		}
		if (this.options.restrictArea) {
			if (r.isEdgeElement(o)) {
				let e = r.getClosestPoint(s);
				e && (s = e);
			} else {
				let e = r.getUnrotatedBBoxOfElement(o), t = a.getAngle(), n = a.getBBox().getCenter(), i = s.clone().rotate(t, n);
				e.containsPoint(i) || (s = e.getNearestPointToPoint(i).rotate(-t, n));
			}
		}
		let l, u = this.options.anchor;
		typeof u == "function" && (l = R(u, n, s, r, o, t, n, this)), this.resetAnchor(l), this.update();
	}
	onMouseUp(e) {
		this.graph.view.delegateEvents(), this.undelegateDocumentEvents(), this.blur(), this.toggleArea(!1);
		let t = this.cellView;
		this.options.removeRedundancies && t.removeRedundantLinearVertices({
			ui: !0,
			toolId: this.cid
		}), this.cell.stopBatch("move-anchor", {
			ui: !0,
			toolId: this.cid
		});
	}
	onDblClick() {
		let e = this.options.resetAnchor;
		e && this.resetAnchor(e === !0 ? void 0 : e), this.update();
	}
};
Vb.defaults = Object.assign(Object.assign({}, Sb.getDefaults()), {
	tagName: "g",
	markup: [{
		tagName: "circle",
		selector: "anchor",
		attrs: { cursor: "pointer" }
	}, {
		tagName: "rect",
		selector: "area",
		attrs: {
			"pointer-events": "none",
			fill: "none",
			stroke: "#33334F",
			"stroke-dasharray": "2,4",
			rx: 5,
			ry: 5
		}
	}],
	events: {
		mousedown: "onMouseDown",
		touchstart: "onMouseDown",
		dblclick: "onDblClick"
	},
	documentEvents: {
		mousemove: "onMouseMove",
		touchmove: "onMouseMove",
		mouseup: "onMouseUp",
		touchend: "onMouseUp",
		touchcancel: "onMouseUp"
	},
	customAnchorAttrs: {
		"stroke-width": 4,
		stroke: "#33334F",
		fill: "#FFFFFF",
		r: 5
	},
	defaultAnchorAttrs: {
		"stroke-width": 2,
		stroke: "#FFFFFF",
		fill: "#33334F",
		r: 6
	},
	areaPadding: 6,
	snapRadius: 10,
	resetAnchor: !0,
	restrictArea: !0,
	removeRedundancies: !0,
	anchor: zb,
	snap(e, t, n, r, i, a) {
		let o = a.options.snapRadius || 0, s = r === "source", c = s ? 0 : -1, l = this.cell.getVertexAt(c) || this.getTerminalAnchor(s ? "target" : "source");
		return l && (Math.abs(l.x - e.x) < o && (e.x = l.x), Math.abs(l.y - e.y) < o && (e.y = l.y)), e;
	}
});
var Hb = class extends Vb {};
Hb.defaults = Object.assign(Object.assign({}, Vb.getDefaults()), {
	name: "source-anchor",
	type: "source"
});
var Ub = class extends Vb {};
Ub.defaults = Object.assign(Object.assign({}, Vb.getDefaults()), {
	name: "target-anchor",
	type: "target"
});
// node_modules/@antv/x6/es/registry/tool/arrowhead.js
var Wb = class extends Sb {
	get type() {
		return this.options.type;
	}
	get ratio() {
		return this.options.ratio;
	}
	init() {
		if (this.options.attrs) {
			let e = this.options.attrs, { class: t } = e, n = d(e, ["class"]);
			this.setAttrs(n, this.container), t && U(this.container, t);
		}
	}
	onRender() {
		U(this.container, this.prefixClassName(`edge-tool-${this.type}-arrowhead`)), this.update();
	}
	update() {
		let e = this.ratio, t = this.cellView, n = t.getTangentAtRatio(e), r = n ? n.start : t.getPointAtRatio(e), i = n && n.vector().vectorAngle(new z(1, 0)) || 0;
		if (!r) return this;
		let a = Rf().translate(r.x, r.y).rotate(i);
		return Jf(this.container, a, { absolute: !0 }), this;
	}
	onMouseDown(e) {
		if (this.guard(e)) return;
		e.stopPropagation(), e.preventDefault();
		let t = this.cellView;
		if (t.can("arrowheadMovable")) {
			t.cell.startBatch("move-arrowhead", {
				ui: !0,
				toolId: this.cid
			});
			let n = this.graph.snapToGrid(e.clientX, e.clientY), r = t.prepareArrowheadDragging(this.type, {
				x: n.x,
				y: n.y,
				options: Object.assign(Object.assign({}, this.options), { toolId: this.cid })
			});
			this.cellView.setEventData(e, r), this.delegateDocumentEvents(this.options.documentEvents, e.data), t.graph.view.undelegateEvents(), this.container.style.pointerEvents = "none";
		}
		this.focus();
	}
	onMouseMove(e) {
		let t = this.normalizeEvent(e), n = this.graph.snapToGrid(t.clientX, t.clientY);
		this.cellView.onMouseMove(t, n.x, n.y), this.update();
	}
	onMouseUp(e) {
		this.undelegateDocumentEvents();
		let t = this.normalizeEvent(e), n = this.cellView, r = this.graph.snapToGrid(t.clientX, t.clientY);
		n.onMouseUp(t, r.x, r.y), this.graph.view.delegateEvents(), this.blur(), this.container.style.pointerEvents = "", n.cell.stopBatch("move-arrowhead", {
			ui: !0,
			toolId: this.cid
		});
	}
};
Wb.defaults = Object.assign(Object.assign({}, Sb.getDefaults()), {
	tagName: "path",
	isSVGElement: !0,
	events: {
		mousedown: "onMouseDown",
		touchstart: "onMouseDown"
	},
	documentEvents: {
		mousemove: "onMouseMove",
		touchmove: "onMouseMove",
		mouseup: "onMouseUp",
		touchend: "onMouseUp",
		touchcancel: "onMouseUp"
	}
});
var Gb = class extends Wb {};
Gb.defaults = Object.assign(Object.assign({}, Wb.getDefaults()), {
	name: "source-arrowhead",
	type: "source",
	ratio: 0,
	attrs: {
		d: "M 10 -8 -10 0 10 8 Z",
		fill: "#333",
		stroke: "#fff",
		"stroke-width": 2,
		cursor: "move"
	}
});
var Kb = class extends Wb {};
Kb.defaults = Object.assign(Object.assign({}, Wb.getDefaults()), {
	name: "target-arrowhead",
	type: "target",
	ratio: 1,
	attrs: {
		d: "M -10 -8 10 0 -10 8 Z",
		fill: "#333",
		stroke: "#fff",
		"stroke-width": 2,
		cursor: "move"
	}
});
// node_modules/@antv/x6/es/registry/tool/boundary.js
var qb = class extends Sb {
	onRender() {
		if (U(this.container, this.prefixClassName("cell-tool-boundary")), this.options.attrs) {
			let e = this.options.attrs, { class: t } = e, n = d(e, ["class"]);
			W(this.container, wd(n)), t && U(this.container, t);
		}
		this.update();
	}
	update() {
		let e = this.cellView, t = this.options, { useCellGeometry: n, rotate: r } = t, i = Dl(t.padding), a = Bb(e, n);
		this.parent.options.local && (a = a.translate({
			x: -a.x,
			y: -a.y
		})), a = a.moveAndExpand({
			x: -i.left,
			y: -i.top,
			width: i.left + i.right,
			height: i.top + i.bottom
		});
		let o = e.cell;
		if (o.isNode()) {
			let e = o.getAngle();
			if (e != null) {
				if (r && !this.parent.options.local) {
					let t = o.getBBox().getCenter();
					Xf(this.container, e, t.x, t.y, { absolute: !0 });
				} else r || (a = a.bbox(e));
			}
		}
		return W(this.container, a.toJSON()), this;
	}
};
qb.defaults = Object.assign(Object.assign({}, Sb.getDefaults()), {
	name: "boundary",
	tagName: "rect",
	padding: 10,
	useCellGeometry: !0,
	attrs: {
		fill: "none",
		stroke: "#333",
		"stroke-width": .5,
		"stroke-dasharray": "5, 5",
		"pointer-events": "none"
	}
});
// node_modules/@antv/x6/es/registry/tool/button.js
var Jb = class extends Sb {
	onRender() {
		U(this.container, this.prefixClassName("cell-tool-button")), this.update();
	}
	update() {
		return this.updatePosition(), this;
	}
	updatePosition() {
		let e = this.cellView.cell.isEdge() ? this.getEdgeMatrix() : this.getNodeMatrix();
		Jf(this.container, e, { absolute: !0 });
	}
	getNodeMatrix() {
		let e = this.cellView, t = this.options, { x: n = 0, y: r = 0 } = t, { offset: i, useCellGeometry: a, rotate: o } = t, s = Bb(e, a), c = e.cell.getAngle();
		o || (s = s.bbox(c));
		let l = 0, u = 0;
		typeof i == "number" ? (l = i, u = i) : typeof i == "object" && (l = i.x, u = i.y), n = El(n, s.width), r = El(r, s.height);
		let d = Rf();
		return d = this.parent.options.local ? d.translate(s.width / 2, s.height / 2) : d.translate(s.x + s.width / 2, s.y + s.height / 2), o && (d = d.rotate(c)), d = d.translate(n + l - s.width / 2, r + u - s.height / 2), d;
	}
	getEdgeMatrix() {
		let e = this.cellView, { offset: t = 0, distance: n = 0, rotate: r } = this.options, i = El(n, 1), a = i >= 0 && i <= 1 ? e.getTangentAtRatio(i) : e.getTangentAtLength(i), o = a ? a.start : e.getConnection().start, s = a && a.vector().vectorAngle(new z(1, 0)) || 0, c = Rf().translate(o.x, o.y).rotate(s);
		return c = typeof t == "object" ? c.translate(t.x || 0, t.y || 0) : c.translate(0, t), r || (c = c.rotate(-s)), c;
	}
	onMouseDown(e) {
		if (this.guard(e)) return;
		e.stopPropagation(), e.preventDefault();
		let t = this.options.onClick;
		typeof t == "function" && R(t, this.cellView, {
			e,
			view: this.cellView,
			cell: this.cellView.cell,
			btn: this
		});
	}
};
Jb.defaults = Object.assign(Object.assign({}, Sb.getDefaults()), {
	name: "button",
	useCellGeometry: !0,
	events: {
		mousedown: "onMouseDown",
		touchstart: "onMouseDown"
	}
});
var Yb = class extends Jb {};
Yb.defaults = Object.assign(Object.assign({}, Jb.getDefaults()), {
	name: "button-remove",
	markup: [{
		tagName: "circle",
		selector: "button",
		attrs: {
			r: 7,
			fill: "#FF1D00",
			cursor: "pointer"
		}
	}, {
		tagName: "path",
		selector: "icon",
		attrs: {
			d: "M -3 -3 3 3 M -3 3 3 -3",
			fill: "none",
			stroke: "#FFFFFF",
			"stroke-width": 2,
			"pointer-events": "none"
		}
	}],
	distance: 60,
	offset: 0,
	useCellGeometry: !0,
	onClick({ view: e, btn: t }) {
		t.parent.remove(), e.cell.remove({
			ui: !0,
			toolId: t.cid
		});
	}
});
// node_modules/@antv/x6/es/registry/tool/editor.js
var Xb = class extends Sb {
	constructor() {
		super(...arguments), this.labelIndex = -1, this.distance = .5, this.dblClick = this.onCellDblClick.bind(this);
	}
	onRender() {
		let e = this.cellView;
		e && e.on("cell:dblclick", this.dblClick);
	}
	createElement() {
		let e = [this.prefixClassName(`${this.cell.isEdge() ? "edge" : "node"}-tool-editor`), this.prefixClassName("cell-tool-editor")];
		this.editor = gb("div", !1), this.addClass(e, this.editor), this.editor.contentEditable = "true", this.container.appendChild(this.editor);
	}
	removeElement() {
		this.undelegateDocumentEvents(), this.editor &&= (this.container.removeChild(this.editor), null);
	}
	updateEditor() {
		let { cell: e, editor: t } = this;
		if (!t) return;
		let { style: n } = t;
		e.isNode() ? this.updateNodeEditorTransform() : e.isEdge() && this.updateEdgeEditorTransform();
		let { attrs: r } = this.options;
		return n.fontSize = `${r.fontSize}px`, n.fontFamily = r.fontFamily, n.color = r.color, n.backgroundColor = r.backgroundColor, t.innerText = this.getCellText() || "", this.setCellText(""), this;
	}
	updateNodeEditorTransform() {
		let { graph: e, cell: t, editor: n } = this;
		if (!n) return;
		let r = z.create(), i = 20, a = "", { x: o, y: s } = this.options, { width: c, height: l } = this.options;
		if (o !== void 0 && s !== void 0) {
			let e = t.getBBox();
			o = El(o, e.width), s = El(s, e.height), r = e.topLeft.translate(o, s), i = e.width - o * 2;
		} else {
			let e = t.getBBox();
			r = e.center, i = e.width - 4, a = "translate(-50%, -50%)";
		}
		let u = e.scale(), { style: d } = n;
		r = e.localToGraph(r), d.left = `${r.x}px`, d.top = `${r.y}px`, d.transform = `scale(${u.sx}, ${u.sy}) ${a}`, d.minWidth = `${i}px`, typeof c == "number" && (d.width = `${c}px`), typeof l == "number" && (d.height = `${l}px`);
	}
	updateEdgeEditorTransform() {
		if (!this.event) return;
		let { graph: e, editor: t } = this;
		if (!t) return;
		let n = z.create(), r = 20, { style: i } = t, a = this.event.target, o = a.parentElement;
		if (o && Bu(o, this.prefixClassName("edge-label"))) {
			let e = o.getAttribute("data-index") || "0";
			this.labelIndex = parseInt(e, 10);
			let { translation: t } = Hf(o.getAttribute("transform"));
			n = new z(t.tx, t.ty), r = Wp(a).width;
		} else {
			if (!this.options.labelAddable) return this;
			n = e.clientToLocal(z.create(this.event.clientX, this.event.clientY));
			let t = this.cellView.path.closestPointLength(n);
			this.distance = t, this.labelIndex = -1;
		}
		n = e.localToGraph(n);
		let s = e.scale();
		i.left = `${n.x}px`, i.top = `${n.y}px`, i.minWidth = `${r}px`, i.transform = `scale(${s.sx}, ${s.sy}) translate(-50%, -50%)`;
	}
	updateCell() {
		let e = this.editor.innerText.replace(/\n$/, "") || "";
		this.setCellText(e === "" ? null : e), this.removeElement();
	}
	onDocumentMouseUp(e) {
		this.editor && e.target !== this.editor && this.updateCell();
	}
	onCellDblClick({ e }) {
		if (!this.editor) {
			e.stopPropagation(), this.removeElement(), this.event = e, this.createElement(), this.updateEditor(), this.autoFocus();
			let t = this.options.documentEvents;
			t && this.delegateDocumentEvents(t);
		}
	}
	onMouseDown(e) {
		e.stopPropagation();
	}
	autoFocus() {
		setTimeout(() => {
			this.editor && (this.editor.focus(), this.selectText());
		});
	}
	selectText() {
		if (window.getSelection && this.editor) {
			let e = document.createRange();
			e.selectNodeContents(this.editor);
			let t = window.getSelection();
			t?.removeAllRanges(), t?.addRange(e);
		}
	}
	getCellText() {
		let { getText: e } = this.options;
		if (typeof e == "function") return R(e, this.cellView, {
			cell: this.cell,
			index: this.labelIndex
		});
		if (typeof e == "string") {
			if (this.cell.isNode()) return this.cell.attr(e);
			if (this.cell.isEdge() && this.labelIndex !== -1) return this.cell.prop(`labels/${this.labelIndex}/attrs/${e}`);
		}
	}
	setCellText(e) {
		let t = this.options.setText;
		if (typeof t == "function") R(t, this.cellView, {
			cell: this.cell,
			value: e,
			index: this.labelIndex,
			distance: this.distance
		});
		else if (typeof t == "string") {
			if (this.cell.isNode()) {
				this.cell.attr(t, e === null ? "" : e);
				return;
			}
			if (this.cell.isEdge()) {
				let n = this.cell;
				if (this.labelIndex === -1) {
					if (e) {
						let r = {
							position: { distance: this.distance },
							attrs: {}
						};
						af(r, `attrs/${t}`, e), n.appendLabel(r);
					}
				} else e === null ? n.removeLabelAt(this.labelIndex) : n.prop(`labels/${this.labelIndex}/attrs/${t}`, e);
			}
		}
	}
	onRemove() {
		let e = this.cellView;
		e && e.off("cell:dblclick", this.dblClick), this.removeElement();
	}
};
Xb.defaults = Object.assign(Object.assign({}, Sb.getDefaults()), {
	tagName: "div",
	isSVGElement: !1,
	events: {
		mousedown: "onMouseDown",
		touchstart: "onMouseDown"
	},
	documentEvents: {
		mouseup: "onDocumentMouseUp",
		touchend: "onDocumentMouseUp",
		touchcancel: "onDocumentMouseUp"
	}
});
var Zb = class extends Xb {};
Zb.defaults = Qc({}, Xb.defaults, {
	attrs: {
		fontSize: 14,
		fontFamily: "Arial, helvetica, sans-serif",
		color: "#000",
		backgroundColor: "#fff"
	},
	getText: "text/text",
	setText: "text/text"
});
var Qb = class extends Xb {};
Qb.defaults = Qc({}, Xb.defaults, {
	attrs: {
		fontSize: 14,
		fontFamily: "Arial, helvetica, sans-serif",
		color: "#000",
		backgroundColor: "#fff"
	},
	labelAddable: !0,
	getText: "label/text",
	setText: "label/text"
});
// node_modules/@antv/x6/es/registry/tool/segments.js
var $b = class extends Sb {
	constructor() {
		super(...arguments), this.handles = [];
	}
	get vertices() {
		return this.cellView.cell.getVertices();
	}
	update() {
		return this.render(), this;
	}
	getPoints() {
		let e = this.cellView.routePoints;
		if (e.length <= 2) return e;
		let t = [e[0]];
		for (let n = 1; n < e.length - 1; n++) {
			let r = t[t.length - 1], i = e[n], a = e[n + 1];
			(i.x - r.x) * (a.y - r.y) - (i.y - r.y) * (a.x - r.x) !== 0 && t.push(i);
		}
		return t.push(e[e.length - 1]), t;
	}
	onRender() {
		U(this.container, this.prefixClassName("edge-tool-segments")), this.resetHandles();
		let e = this.cellView, t = [...this.getPoints()];
		t.unshift(e.sourcePoint), t.push(e.targetPoint);
		for (let e = 0, n = t.length; e < n - 1; e += 1) {
			let n = t[e], r = t[e + 1], i = this.renderHandle(n, r, e);
			this.stamp(i.container), this.handles.push(i);
		}
		return this;
	}
	renderHandle(e, t, n) {
		let r = this.options.createHandle({
			index: n,
			graph: this.graph,
			guard: (e) => this.guard(e),
			attrs: this.options.attrs || {}
		});
		return this.options.processHandle && this.options.processHandle(r), this.updateHandle(r, e, t), this.container.appendChild(r.container), this.startHandleListening(r), r;
	}
	startHandleListening(e) {
		e.on("change", this.onHandleChange, this), e.on("changing", this.onHandleChanging, this), e.on("changed", this.onHandleChanged, this);
	}
	stopHandleListening(e) {
		e.off("change", this.onHandleChange, this), e.off("changing", this.onHandleChanging, this), e.off("changed", this.onHandleChanged, this);
	}
	resetHandles() {
		let e = this.handles;
		this.handles = [], e && e.forEach((e) => {
			this.stopHandleListening(e), e.remove();
		});
	}
	shiftHandleIndexes(e) {
		let t = this.handles;
		for (let n = 0, r = t.length; n < r; n += 1) t[n].options.index += e;
	}
	resetAnchor(e, t) {
		let n = this.cellView.cell, r = {
			ui: !0,
			toolId: this.cid
		};
		t ? n.prop([e, "anchor"], t, r) : n.removeProp([e, "anchor"], r);
	}
	snapHandle(e, t, n) {
		let r = e.options.axis, i = e.options.index, a = this.cellView.cell.getVertices(), o = a[i - 2] || n.sourceAnchor, s = a[i + 1] || n.targetAnchor, c = this.options.snapRadius;
		return Math.abs(t[r] - o[r]) < c ? t[r] = o[r] : Math.abs(t[r] - s[r]) < c && (t[r] = s[r]), t;
	}
	onHandleChanging({ handle: e, e: t }) {
		let n = this.graph, r = this.options, i = this.cellView, a = r.anchor, o = e.options.axis, s = e.options.index - 1, c = this.getEventData(t), l = this.normalizeEvent(t), u = n.snapToGrid(l.clientX, l.clientY), d = this.snapHandle(e, u.clone(), c), f = as(this.vertices), p = f[s], m = f[s + 1], h = i.sourceView, g = i.sourceBBox, _ = !1, v = !1;
		if (p ? s === 0 ? g.containsPoint(p) ? (f.shift(), this.shiftHandleIndexes(-1), _ = !0) : (p[o] = d[o], v = !0) : p[o] = d[o] : (p = i.sourceAnchor.toJSON(), p[o] = d[o], g.containsPoint(p) ? _ = !0 : (f.unshift(p), this.shiftHandleIndexes(1), v = !0)), typeof a == "function" && h) {
			if (_) {
				let e = c.sourceAnchor.clone();
				e[o] = d[o];
				let t = R(a, i, e, h, i.sourceMagnet || h.container, "source", i, this);
				this.resetAnchor("source", t);
			}
			v && this.resetAnchor("source", c.sourceAnchorDef);
		}
		let y = i.targetView, b = i.targetBBox, x = !1, S = !1;
		if (m ? s === f.length - 2 ? b.containsPoint(m) ? (f.pop(), x = !0) : (m[o] = d[o], S = !0) : m[o] = d[o] : (m = i.targetAnchor.toJSON(), m[o] = d[o], b.containsPoint(m) ? x = !0 : (f.push(m), S = !0)), typeof a == "function" && y) {
			if (x) {
				let e = c.targetAnchor.clone();
				e[o] = d[o];
				let t = R(a, i, e, y, i.targetMagnet || y.container, "target", i, this);
				this.resetAnchor("target", t);
			}
			S && this.resetAnchor("target", c.targetAnchorDef);
		}
		z.equalPoints(f, this.vertices) || this.cellView.cell.setVertices(f, {
			ui: !0,
			toolId: this.cid
		}), this.updateHandle(e, p, m, 0), r.stopPropagation || i.notifyMouseMove(l, u.x, u.y);
	}
	onHandleChange({ handle: e, e: t }) {
		let n = this.options, r = this.handles, i = this.cellView, a = e.options.index;
		if (Array.isArray(r)) {
			for (let e = 0, t = r.length; e < t; e += 1) e !== a && r[e].hide();
			if (this.focus(), this.setEventData(t, {
				sourceAnchor: i.sourceAnchor.clone(),
				targetAnchor: i.targetAnchor.clone(),
				sourceAnchorDef: as(this.cell.prop(["source", "anchor"])),
				targetAnchorDef: as(this.cell.prop(["target", "anchor"]))
			}), this.cell.startBatch("move-segment", {
				ui: !0,
				toolId: this.cid
			}), !n.stopPropagation) {
				let e = this.normalizeEvent(t), n = this.graph.snapToGrid(e.clientX, e.clientY);
				i.notifyMouseDown(e, n.x, n.y);
			}
		}
	}
	onHandleChanged({ e }) {
		let t = this.options, n = this.cellView;
		t.removeRedundancies && n.removeRedundantLinearVertices({
			ui: !0,
			toolId: this.cid
		});
		let r = this.normalizeEvent(e), i = this.graph.snapToGrid(r.clientX, r.clientY);
		this.render(), this.blur(), this.cell.stopBatch("move-segment", {
			ui: !0,
			toolId: this.cid
		}), t.stopPropagation || n.notifyMouseUp(r, i.x, i.y), n.checkMouseleave(r), t.onChanged && t.onChanged({
			edge: n.cell,
			edgeView: n
		});
	}
	updateHandle(e, t, n, r = 0) {
		let i = this.options.precision || 0, a = Math.abs(t.x - n.x) < i, o = Math.abs(t.y - n.y) < i;
		if (a || o) {
			let i = new V(t, n);
			if (i.length() < this.options.threshold) e.hide();
			else {
				let t = i.getCenter(), n = a ? "x" : "y";
				t[n] += r || 0;
				let o = i.vector().vectorAngle(new z(1, 0));
				e.updatePosition(t.x, t.y, o, this.cellView), e.show(), e.options.axis = n;
			}
		} else e.hide();
	}
	onRemove() {
		this.resetHandles();
	}
};
$b.defaults = Object.assign(Object.assign({}, Sb.defaults), {
	name: "segments",
	precision: .5,
	threshold: 40,
	snapRadius: 10,
	stopPropagation: !0,
	removeRedundancies: !0,
	attrs: {
		width: 20,
		height: 8,
		x: -10,
		y: -4,
		rx: 4,
		ry: 4,
		fill: "#333",
		stroke: "#fff",
		"stroke-width": 2
	},
	createHandle: (e) => new ex(e),
	anchor: zb
});
var ex = class extends yb {
	constructor(e) {
		super(), this.options = e, this.render(), this.delegateEvents({
			mousedown: "onMouseDown",
			touchstart: "onMouseDown"
		});
	}
	render() {
		this.container = gb("rect", !0);
		let e = this.options.attrs;
		if (typeof e == "function") {
			let t = $b.getDefaults();
			this.setAttrs(Object.assign(Object.assign({}, t.attrs), e(this)));
		} else this.setAttrs(e);
		this.addClass(this.prefixClassName("edge-tool-segment"));
	}
	updatePosition(e, t, n, r) {
		let i = r.getClosestPoint(new z(e, t)) || new z(e, t), a = Rf().translate(i.x, i.y);
		if (i.equals({
			x: e,
			y: t
		})) a = a.rotate(n);
		else {
			let n = new V(e, t, i.x, i.y).vector().vectorAngle(new z(1, 0));
			n !== 0 && (n += 90), a = a.rotate(n);
		}
		this.setAttrs({
			transform: Vf(a),
			cursor: n % 180 == 0 ? "row-resize" : "col-resize"
		});
	}
	onMouseDown(e) {
		this.options.guard(e) || (this.trigger("change", {
			e,
			handle: this
		}), e.stopPropagation(), e.preventDefault(), this.options.graph.view.undelegateEvents(), this.delegateDocumentEvents({
			mousemove: "onMouseMove",
			touchmove: "onMouseMove",
			mouseup: "onMouseUp",
			touchend: "onMouseUp",
			touchcancel: "onMouseUp"
		}, e.data));
	}
	onMouseMove(e) {
		this.emit("changing", {
			e,
			handle: this
		});
	}
	onMouseUp(e) {
		this.emit("changed", {
			e,
			handle: this
		}), this.undelegateDocumentEvents(), this.options.graph.view.delegateEvents();
	}
	show() {
		this.container.style.display = "";
	}
	hide() {
		this.container.style.display = "none";
	}
}, tx = J.prefix("edge-tool-vertex-path"), nx = class extends Sb {
	constructor() {
		super(...arguments), this.handles = [];
	}
	get vertices() {
		return this.cellView.cell.getVertices();
	}
	onRender() {
		return this.addClass(this.prefixClassName("edge-tool-vertices")), this.options.addable && this.updatePath(), this.resetHandles(), this.renderHandles(), this;
	}
	update() {
		return this.vertices.length === this.handles.length ? this.updateHandles() : (this.resetHandles(), this.renderHandles()), this.options.addable && this.updatePath(), this;
	}
	resetHandles() {
		let e = this.handles;
		this.handles = [], e && e.forEach((e) => {
			this.stopHandleListening(e), e.remove();
		});
	}
	renderHandles() {
		let e = this.vertices;
		for (let t = 0, n = e.length; t < n; t += 1) {
			let n = e[t], r = this.options.createHandle, i = this.options.processHandle, a = r({
				index: t,
				graph: this.graph,
				guard: (e) => this.guard(e),
				attrs: this.options.attrs || {}
			});
			i && i(a), a.updatePosition(n.x, n.y), this.stamp(a.container), this.container.appendChild(a.container), this.handles.push(a), this.startHandleListening(a);
		}
	}
	updateHandles() {
		let e = this.vertices;
		for (let t = 0, n = e.length; t < n; t += 1) {
			let n = e[t], r = this.handles[t];
			r && r.updatePosition(n.x, n.y);
		}
	}
	updatePath() {
		let e = this.childNodes.connection;
		e && e.setAttribute("d", this.cellView.getConnectionPathData());
	}
	startHandleListening(e) {
		let t = this.cellView;
		t.can("vertexMovable") && (e.on("change", this.onHandleChange, this), e.on("changing", this.onHandleChanging, this), e.on("changed", this.onHandleChanged, this)), t.can("vertexDeletable") && e.on("remove", this.onHandleRemove, this);
	}
	stopHandleListening(e) {
		let t = this.cellView;
		t.can("vertexMovable") && (e.off("change", this.onHandleChange, this), e.off("changing", this.onHandleChanging, this), e.off("changed", this.onHandleChanged, this)), t.can("vertexDeletable") && e.off("remove", this.onHandleRemove, this);
	}
	getNeighborPoints(e) {
		let t = this.cellView, n = this.vertices, r = e > 0 ? n[e - 1] : t.sourceAnchor, i = e < n.length - 1 ? n[e + 1] : t.targetAnchor;
		return {
			prev: z.create(r),
			next: z.create(i)
		};
	}
	getMouseEventArgs(e) {
		let t = this.normalizeEvent(e), { x: n, y: r } = this.graph.snapToGrid(t.clientX, t.clientY);
		return {
			e: t,
			x: n,
			y: r
		};
	}
	onHandleChange({ e }) {
		this.focus();
		let t = this.cellView;
		if (t.cell.startBatch("move-vertex", {
			ui: !0,
			toolId: this.cid
		}), !this.options.stopPropagation) {
			let { e: n, x: r, y: i } = this.getMouseEventArgs(e);
			this.eventData(n, { start: {
				x: r,
				y: i
			} }), t.notifyMouseDown(n, r, i);
		}
	}
	onHandleChanging({ handle: e, e: t }) {
		let n = this.cellView, r = e.options.index, { e: i, x: a, y: o } = this.getMouseEventArgs(t), s = {
			x: a,
			y: o
		};
		this.snapVertex(s, r), n.cell.setVertexAt(r, s, {
			ui: !0,
			toolId: this.cid
		}), e.updatePosition(s.x, s.y), this.options.stopPropagation || n.notifyMouseMove(i, a, o);
	}
	stopBatch(e) {
		this.cell.stopBatch("move-vertex", {
			ui: !0,
			toolId: this.cid
		}), e && this.cell.stopBatch("add-vertex", {
			ui: !0,
			toolId: this.cid
		});
	}
	onHandleChanged({ e }) {
		let t = this.options, n = this.cellView;
		t.addable && this.updatePath(), t.removeRedundancies && n.removeRedundantLinearVertices({
			ui: !0,
			toolId: this.cid
		}) && this.render(), this.blur(), this.stopBatch(this.eventData(e).vertexAdded);
		let { e: r, x: i, y: a } = this.getMouseEventArgs(e);
		if (!this.options.stopPropagation) {
			n.notifyMouseUp(r, i, a);
			let { start: e } = this.eventData(r);
			if (e) {
				let { x: t, y: o } = e;
				t === i && o === a && n.onClick(r, i, a);
			}
		}
		n.checkMouseleave(r), t.onChanged && t.onChanged({
			edge: n.cell,
			edgeView: n
		});
	}
	snapVertex(e, t) {
		let n = this.options.snapRadius || 0;
		if (n > 0) {
			let r = this.getNeighborPoints(t), i = r.prev, a = r.next;
			Math.abs(e.x - i.x) < n ? e.x = i.x : Math.abs(e.x - a.x) < n && (e.x = a.x), Math.abs(e.y - i.y) < n ? e.y = r.prev.y : Math.abs(e.y - a.y) < n && (e.y = a.y);
		}
	}
	onHandleRemove({ handle: e, e: t }) {
		if (this.options.removable) {
			let n = e.options.index, r = this.cellView;
			r.cell.removeVertexAt(n, { ui: !0 }), this.options.addable && this.updatePath(), r.checkMouseleave(this.normalizeEvent(t));
		}
	}
	allowAddVertex(e) {
		let t = this.guard(e), n = this.options.addable && this.cellView.can("vertexAddable"), r = !this.options.modifiers || Jm(e, this.options.modifiers);
		return !t && n && r;
	}
	onPathMouseDown(e) {
		let t = this.cellView;
		if (!this.allowAddVertex(e)) return;
		e.stopPropagation(), e.preventDefault();
		let n = this.normalizeEvent(e), r = this.graph.snapToGrid(n.clientX, n.clientY).toJSON();
		t.cell.startBatch("add-vertex", {
			ui: !0,
			toolId: this.cid
		});
		let i = t.getVertexIndex(r.x, r.y);
		this.snapVertex(r, i), t.cell.insertVertex(r, i, {
			ui: !0,
			toolId: this.cid
		}), this.render();
		let a = this.handles[i];
		this.eventData(n, { vertexAdded: !0 }), a.onMouseDown(n);
	}
	onRemove() {
		this.resetHandles();
	}
};
nx.defaults = Object.assign(Object.assign({}, Sb.getDefaults()), {
	name: "vertices",
	snapRadius: 20,
	addable: !0,
	removable: !0,
	removeRedundancies: !0,
	stopPropagation: !0,
	attrs: {
		r: 6,
		fill: "#333",
		stroke: "#fff",
		cursor: "move",
		"stroke-width": 2
	},
	createHandle: (e) => new rx(e),
	markup: [{
		tagName: "path",
		selector: "connection",
		className: tx,
		attrs: {
			fill: "none",
			stroke: "transparent",
			"stroke-width": 10,
			cursor: "pointer"
		}
	}],
	events: {
		[`mousedown .${tx}`]: "onPathMouseDown",
		[`touchstart .${tx}`]: "onPathMouseDown"
	}
});
var rx = class extends yb {
	get graph() {
		return this.options.graph;
	}
	constructor(e) {
		super(), this.options = e, this.render(), this.delegateEvents({
			mousedown: "onMouseDown",
			touchstart: "onMouseDown",
			dblclick: "onDoubleClick"
		});
	}
	render() {
		this.container = gb("circle", !0);
		let e = this.options.attrs;
		if (typeof e == "function") {
			let t = nx.getDefaults();
			this.setAttrs(Object.assign(Object.assign({}, t.attrs), e(this)));
		} else this.setAttrs(e);
		this.addClass(this.prefixClassName("edge-tool-vertex"));
	}
	updatePosition(e, t) {
		this.setAttrs({
			cx: e,
			cy: t
		});
	}
	onMouseDown(e) {
		this.options.guard(e) || (e.stopPropagation(), e.preventDefault(), this.graph.view.undelegateEvents(), this.delegateDocumentEvents({
			mousemove: "onMouseMove",
			touchmove: "onMouseMove",
			mouseup: "onMouseUp",
			touchend: "onMouseUp",
			touchcancel: "onMouseUp"
		}, e.data), this.emit("change", {
			e,
			handle: this
		}));
	}
	onMouseMove(e) {
		this.emit("changing", {
			e,
			handle: this
		});
	}
	onMouseUp(e) {
		this.emit("changed", {
			e,
			handle: this
		}), this.undelegateDocumentEvents(), this.graph.view.delegateEvents();
	}
	onDoubleClick(e) {
		this.emit("remove", {
			e,
			handle: this
		});
	}
}, ix = {
	boundary: qb,
	button: Jb,
	"button-remove": Yb,
	"node-editor": Zb
}, ax = Ym.create({
	type: "node tool",
	process(e, t) {
		if (typeof t == "function") return t;
		let n = Sb, { inherit: r } = t, i = d(t, ["inherit"]);
		if (r) {
			let e = this.get(r);
			e == null ? this.onNotFound(r, "inherited") : n = e;
		}
		return i.name ??= e, n.define.call(n, i);
	}
});
ax.register(ix, !0);
var ox = {
	boundary: qb,
	vertices: nx,
	segments: $b,
	button: Jb,
	"button-remove": Yb,
	"source-anchor": Hb,
	"target-anchor": Ub,
	"source-arrowhead": Gb,
	"target-arrowhead": Kb,
	"edge-editor": Qb
}, sx = Ym.create({
	type: "edge tool",
	process(e, t) {
		if (typeof t == "function") return t;
		let n = Sb, { inherit: r } = t, i = d(t, ["inherit"]);
		if (r) {
			let e = this.get(r);
			e == null ? this.onNotFound(r, "inherited") : n = e;
		}
		return i.name ??= e, n.define.call(n, i);
	}
});
sx.register(ox, !0);
// node_modules/@antv/x6/es/model/animation/animationEvent.js
var cx = class {
	constructor(e, t, n, r) {
		this.target = e, this.cell = this.target.effect?.target, this.type = t, this.bubbles = !1, this.currentTarget = e, this.defaultPrevented = !1, this.eventPhase = 0, this.timeStamp = performance.now(), this.currentTime = n, this.timelineTime = r;
	}
};
// node_modules/@antv/x6/es/model/animation/utils.js
function lx(e) {
	return e !== "offset" && e !== "easing" && e !== "composite" && e !== "computedOffset";
}
function ux(e, t) {
	return e === "reverse" || e === "alternate" && t % 2 == 1 || e === "alternate-reverse" && t % 2 == 0;
}
// node_modules/@antv/x6/es/model/animation/animation.js
var dx = class {
	constructor(e, t) {
		this._effect = null, this._currentTime = null, this._playbackRate = 1, this._playState = "idle", this._rafId = null, this._startTime = null, this._pausedTime = null, this._timeline = null, this.id = "", this.onfinish = null, this.oncancel = null, this._effect = e, this._timeline = t ?? document.timeline;
	}
	get effect() {
		return this._effect;
	}
	get currentTime() {
		return this._currentTime;
	}
	set currentTime(e) {
		let t = this._timeline.currentTime;
		Jc(t) && (this._startTime = t - e, this._currentTime = e);
	}
	get playbackRate() {
		return this._playbackRate;
	}
	set playbackRate(e) {
		let t = this._playbackRate;
		this._playbackRate = e;
		let n = this._timeline.currentTime;
		if (this._playState === "running" && this._startTime != null && Jc(n)) {
			let r = (n - this._startTime) * t;
			this._startTime = n - r / e;
		}
	}
	get playState() {
		return this._playState;
	}
	get timeline() {
		return this._timeline;
	}
	play() {
		if (this._playState === "running" || !this._effect) return;
		let e = this._timeline.currentTime;
		Jc(e) && (this._playState === "paused" ? (this._startTime = e - this._pausedTime / this._playbackRate, this._pausedTime = null) : (this._currentTime = 0, this._startTime = e), this._playState = "running", this._tick());
	}
	pause() {
		this._playState === "running" && (this._rafId &&= (cancelAnimationFrame(this._rafId), null), this._pausedTime = this._currentTime, this._playState = "paused");
	}
	finish() {
		var e;
		if (!this._effect) return;
		let t = this._effect.getComputedTiming(), n = this._playbackRate < 0, { duration: r, endTime: i, direction: a, fill: o, iterations: s } = t;
		if (o === "forwards" || o === "both") {
			let e = ux(a, n ? 0 : s - 1);
			this._effect.apply(e || n ? 0 : r);
		} else (o === "none" || o === "backwards") && this._effect.apply(null);
		this._currentTime = n ? 0 : i, this._playState = "finished", this._rafId &&= (cancelAnimationFrame(this._rafId), null);
		let c = new cx(this, "finish", this._currentTime, this._timeline.currentTime);
		(e = this.onfinish) == null || e.call(this, c), this._effect.target.notify("animation:finish", c);
	}
	cancel() {
		var e;
		if (!this._effect) return;
		this._rafId &&= (cancelAnimationFrame(this._rafId), null), this._playState = "idle", this._currentTime = null, this._startTime = null, this._pausedTime = null, this._effect.apply(null);
		let t = new cx(this, "cancel", this._currentTime, this._timeline.currentTime);
		(e = this.oncancel) == null || e.call(this, t), this._effect.target.notify("animation:cancel", t);
	}
	updatePlaybackRate(e) {
		this.playbackRate = e;
	}
	reverse() {
		this.playbackRate *= -1;
	}
	_tick() {
		let e = this._timeline.currentTime;
		if (this._playState !== "running" || !this._effect || !Jc(e)) return;
		let { duration: t, delay: n, iterations: r, direction: i, endTime: a } = this._effect.getComputedTiming(), o = (e - this._startTime) * this._playbackRate, s = o - n, c = Math.floor(s / t);
		if (o >= a || o < 0 || t <= 0) this.finish();
		else {
			if (o >= n) {
				let e = s % t;
				c = Math.min(c, r - 1), ux(i, c) && (e = t - e), this._effect.apply(e);
			}
			this._currentTime = o, this._rafId = requestAnimationFrame(() => this._tick());
		}
	}
}, fx = class {
	constructor() {
		this.animations = [];
	}
	addAnimation(e) {
		this.animations.push(e);
	}
	getAnimations() {
		return this.animations;
	}
	cancelAnimations() {
		this.animations.forEach((e) => {
			e.cancel();
		});
	}
}, px = class {
	constructor(e, t, n) {
		this._originProps = {}, this._target = e, this._options = Jc(n) ? { duration: n } : Object.assign({}, n), this.setKeyframes(t);
	}
	get target() {
		return this._target;
	}
	getKeyframes() {
		if (!this._keyframes || this._keyframes.length === 0) return [];
		let e = [];
		if (Array.isArray(this._keyframes) && (e = [...this._keyframes]), Sr(this._keyframes)) {
			let t = Object.values(this._keyframes).map((e) => qi(e).length), n = Math.max(...t);
			for (let t = 0; t < n; t++) {
				let n = {};
				Object.entries(this._keyframes).forEach(([e, r]) => {
					let i = qi(r)[t];
					lx(e) && i != null && (n[e] = i);
				}), e.push(n);
			}
		}
		return e = e.map((e, t, n) => {
			let r = e ?? {}, i = {};
			return i.offset = r.offset, i.easing = r.easing ?? n[t - 1]?.easing ?? this.getComputedTiming().easing, Object.keys(r).forEach((e) => {
				lx(e) && (i[e] = r[e]);
			}), i;
		}), e = e.map((t, n) => (t.computedOffset = t.offset == null ? n === e.length - 1 ? 1 : n === 0 ? 0 : n / (e.length - 1) : t.offset, t)), e;
	}
	setKeyframes(e) {
		this._keyframes = e, this._computedKeyframes = this.getKeyframes(), this._computedKeyframes.forEach((e) => {
			Object.keys(e).forEach((e) => {
				lx(e) && this._originProps[e] == null && (this._originProps[e] = this.target.getPropByPath(e));
			});
		});
	}
	getTiming() {
		return xc(this._options, mx);
	}
	getComputedTiming() {
		let e = this.getTiming(), t = e.duration * e.iterations;
		return Object.assign(Object.assign({}, e), {
			activeDuration: t,
			endTime: t + e.delay
		});
	}
	apply(e) {
		if (!this._target || !this._computedKeyframes.length) return;
		if (e == null) {
			Object.entries(this._originProps).forEach(([e, t]) => {
				this.target.setPropByPath(e, t);
			});
			return;
		}
		let t = this.getComputedTiming().duration;
		if (t < 0) return;
		let n = Math.min(e / t, 1), r = this._computedKeyframes;
		if (r.length === 0) return;
		let i = { computedOffset: 0 }, a = { computedOffset: 1 };
		for (let e of r) if (n === 0 && e.computedOffset === 0 && (i = e), n === 1 && e.computedOffset === 1 && (a = e), e.computedOffset < n && (i = e), e.computedOffset > n) {
			a = e;
			break;
		}
		let o = i.computedOffset, s = a.computedOffset, c = (n - o) / (s - o), l = rm[Ki(i.easing ?? a.easing)] ?? im;
		for (let e in Object.assign(Object.assign({}, i), a)) if (lx(e) && (i[e] != null || a[e] != null)) {
			let t = i[e] ?? this._originProps[e], n = a[e] ?? this._originProps[e], r;
			r = String(t).startsWith("#") ? tm : e.endsWith("transform") && !Jc(t) ? nm : Qp.test(String(t)) || Qp.test(String(n)) ? em : $p;
			let o = r(t, n)(l(c));
			this.target.setPropByPath(e, o);
		}
	}
}, mx = {
	delay: 0,
	direction: "normal",
	duration: 0,
	easing: "linear",
	fill: "none",
	iterations: 1
}, hx = class extends Wm {
	constructor(e = {}) {
		super(), this.pending = !1, this.changing = !1, this.data = {}, this.mutate(as(e)), this.changed = {};
	}
	mutate(e, t = {}) {
		let n = t.unset === !0, r = t.silent === !0, i = [], a = this.changing;
		this.changing = !0, a || (this.previous = as(this.data), this.changed = {});
		let o = this.data, s = this.previous, c = this.changed;
		if (Object.keys(e).forEach((t) => {
			let r = t, a = e[r];
			Kc(o[r], a) || i.push(r), Kc(s[r], a) ? delete c[r] : c[r] = a, n ? delete o[r] : o[r] = a;
		}), !r && i.length > 0 && (this.pending = !0, this.pendingOptions = t, i.forEach((e) => {
			this.emit("change:*", {
				key: e,
				options: t,
				store: this,
				current: o[e],
				previous: s[e]
			});
		})), a) return this;
		if (!r) for (; this.pending;) this.pending = !1, this.emit("changed", {
			current: o,
			previous: s,
			store: this,
			options: this.pendingOptions
		});
		return this.pending = !1, this.changing = !1, this.pendingOptions = null, this;
	}
	get(e, t) {
		return e == null ? this.data : this.data[e] ?? t;
	}
	getPrevious(e) {
		if (this.previous) return this.previous[e] ?? void 0;
	}
	set(e, t, n) {
		return e != null && (typeof e == "object" ? this.mutate(e, t) : this.mutate({ [e]: t }, n)), this;
	}
	remove(e, t) {
		let n = {}, r;
		if (typeof e == "string") n[e] = void 0, r = t;
		else if (Array.isArray(e)) e.forEach((e) => n[e] = void 0), r = t;
		else {
			for (let e in this.data) n[e] = void 0;
			r = e;
		}
		return this.mutate(n, Object.assign(Object.assign({}, r), { unset: !0 })), this;
	}
	getByPath(e) {
		return rf(this.data, e, "/");
	}
	setByPath(e, t, n = {}) {
		let r = Array.isArray(e) ? [...e] : e.split("/"), i = Array.isArray(e) ? e.join("/") : e, a = r[0], o = r.length;
		if (n.propertyPath = i, n.propertyValue = t, n.propertyPathArray = r, o === 1) this.set(a, t, n);
		else {
			let i = {}, s = i, c = a;
			for (let e = 1; e < o; e += 1) {
				let t = r[e], n = Number.isFinite(Number(t));
				s = s[c] = n ? [] : {}, c = t;
			}
			af(i, r, t, "/");
			let l = as(this.data);
			n.rewrite && of(l, e, "/");
			let u = Qc(l, i);
			this.set(a, u[a], n);
		}
		return this;
	}
	removeByPath(e, t) {
		let n = Array.isArray(e) ? e : e.split("/"), r = n[0];
		if (n.length === 1) this.remove(r, t);
		else {
			let e = n.slice(1), i = as(this.get(r));
			i && of(i, e), this.set(r, i, t);
		}
		return this;
	}
	hasChanged(e) {
		return e == null ? Object.keys(this.changed).length > 0 : e in this.changed;
	}
	getChanges(e) {
		if (e == null) return this.hasChanged() ? as(this.changed) : null;
		let t = this.changing ? this.previous : this.data, n = {}, r;
		for (let i in e) {
			let a = e[i];
			Kc(t[i], a) || (n[i] = a, r = !0);
		}
		return r ? as(n) : null;
	}
	toJSON() {
		return as(this.data);
	}
	clone() {
		let e = this.constructor;
		return new e(this.data);
	}
	dispose() {
		this.off(), this.data = {}, this.previous = {}, this.changed = {}, this.pending = !1, this.changing = !1, this.pendingOptions = null, this.trigger("disposed", { store: this });
	}
};
f([q()], hx.prototype, "dispose", null);
// node_modules/@antv/x6/es/model/cell.js
var Y = class e extends Wm {
	static isCell(t) {
		if (t == null) return !1;
		if (t instanceof e) return !0;
		let n = t[Symbol.toStringTag], r = t;
		return !(n != null && n !== e.toStringTag || typeof r.isNode != "function" || typeof r.isEdge != "function" || typeof r.prop != "function" || typeof r.attr != "function");
	}
	static normalizeTools(e) {
		if (typeof e == "string") return { items: [e] };
		if (Array.isArray(e)) return { items: e };
		if (e.items) return e;
		if (Reflect.has(e, "local")) {
			let t = e, { local: n } = t;
			return {
				local: n,
				items: [d(t, ["local"])]
			};
		}
		return { items: [e] };
	}
	static getCommonAncestor(...e) {
		let t = e.filter((e) => e != null).map((e) => e.getAncestors()).sort((e, t) => e.length - t.length);
		return t.shift().find((e) => t.every((t) => t.includes(e))) || null;
	}
	static getCellsBBox(e, t = {}) {
		let n = null;
		for (let r = 0, i = e.length; r < i; r += 1) {
			let i = e[r], a = i.getBBox(t);
			if (a) {
				if (i.isNode()) {
					let e = i.getAngle();
					e != null && e !== 0 && (a = a.bbox(e));
				}
				n = n == null ? a : n.union(a);
			}
		}
		return n;
	}
	static deepClone(t) {
		let n = [t, ...t.getDescendants({ deep: !0 })];
		return e.cloneCells(n);
	}
	static cloneCells(e) {
		let t = Sl(e), n = t.reduce((e, t) => (e[t.id] = t.clone(), e), {});
		return t.forEach((e) => {
			let t = n[e.id];
			if (t.isEdge()) {
				let e = t.getSourceCellId(), r = t.getTargetCellId();
				e && n[e] && t.setSource(Object.assign(Object.assign({}, t.getSource()), { cell: n[e].id })), r && n[r] && t.setTarget(Object.assign(Object.assign({}, t.getTarget()), { cell: n[r].id }));
			}
			let r = e.getParent();
			r && n[r.id] && t.setParent(n[r.id]);
			let i = e.getChildren();
			if (i && i.length) {
				let e = i.reduce((e, t) => (n[t.id] && e.push(n[t.id]), e), []);
				e.length > 0 && t.setChildren(e);
			}
		}), n;
	}
	static config(e) {
		let { markup: t, propHooks: n, attrHooks: r } = e, i = d(e, [
			"markup",
			"propHooks",
			"attrHooks"
		]);
		t != null && (this.markup = t), n && (this.propHooks = this.propHooks.slice(), Array.isArray(n) ? this.propHooks.push(...n) : typeof n == "function" ? this.propHooks.push(n) : Object.values(n).forEach((e) => {
			typeof e == "function" && this.propHooks.push(e);
		})), r && (this.attrHooks = Object.assign(Object.assign({}, this.attrHooks), r)), this.defaults = Qc({}, this.defaults, i);
	}
	static getMarkup() {
		return this.markup;
	}
	static getDefaults(e) {
		return e ? this.defaults : as(this.defaults);
	}
	static getAttrHooks() {
		return this.attrHooks;
	}
	static applyPropHooks(e, t) {
		return this.propHooks.reduce((t, n) => n ? R(n, e, t) : t, t);
	}
	static generateId(e = {}) {
		return Vd();
	}
	get [Symbol.toStringTag]() {
		return e.toStringTag;
	}
	constructor(t = {}) {
		super();
		let n = this.constructor.getDefaults(!0), r = Qc({}, this.preprocess(n), this.preprocess(t));
		this.id = r.id || e.generateId(t), this.store = new hx(r), this.animationManager = new fx(), this.setup(), this.init(), this.postprocess(t);
	}
	init() {}
	get model() {
		return this._model;
	}
	set model(e) {
		this._model !== e && (this._model = e);
	}
	preprocess(t, n) {
		let r = t.id, i = this.constructor.applyPropHooks(this, t);
		return r == null && n !== !0 && (i.id = e.generateId(t)), i;
	}
	postprocess(e) {}
	setup() {
		this.store.on("change:*", (e) => {
			let { key: t, current: n, previous: r, options: i } = e;
			this.notify("change:*", {
				key: t,
				options: i,
				current: n,
				previous: r,
				cell: this
			}), this.notify(`change:${t}`, {
				options: i,
				current: n,
				previous: r,
				cell: this
			});
			let a = t;
			(a === "source" || a === "target") && this.notify("change:terminal", {
				type: a,
				current: n,
				previous: r,
				options: i,
				cell: this
			});
		}), this.store.on("changed", ({ options: e }) => this.notify("changed", {
			options: e,
			cell: this
		})), this.on("added", ({ cell: e }) => {
			let t = this.store.get("animation");
			Gc(t) || t.forEach((t) => {
				e.animate(...t);
			});
		});
	}
	notify(e, t) {
		this.trigger(e, t);
		let n = this.model;
		return n && (n.notify(`cell:${e}`, t), this.isNode() ? n.notify(`node:${e}`, Object.assign(Object.assign({}, t), { node: this })) : this.isEdge() && n.notify(`edge:${e}`, Object.assign(Object.assign({}, t), { edge: this }))), this;
	}
	isNode() {
		return !1;
	}
	isEdge() {
		return !1;
	}
	isSameStore(e) {
		return this.store === e.store;
	}
	get view() {
		return this.store.get("view");
	}
	get shape() {
		return this.store.get("shape", "");
	}
	getProp(e, t) {
		return e == null ? this.store.get() : this.store.get(e, t);
	}
	setProp(e, t, n) {
		if (typeof e == "string") this.store.set(e, t, n);
		else {
			let n = this.preprocess(e, !0);
			this.store.set(Qc({}, this.getProp(), n), t), this.postprocess(e);
		}
		return this;
	}
	removeProp(e, t) {
		return typeof e == "string" || Array.isArray(e) ? this.store.removeByPath(e, t) : this.store.remove(t), this;
	}
	hasChanged(e) {
		return e == null ? this.store.hasChanged() : this.store.hasChanged(e);
	}
	getPropByPath(e) {
		return this.store.getByPath(e);
	}
	setPropByPath(e, t, n = {}) {
		return this.model && (e === "children" ? this._children = t ? t.map((e) => this.model.getCell(e)).filter((e) => e != null) : null : e === "parent" && (this._parent = t ? this.model.getCell(t) : null)), this.store.setByPath(e, t, n), this;
	}
	removePropByPath(e, t = {}) {
		let n = Array.isArray(e) ? e : e.split("/");
		return n[0] === "attrs" && (t.dirty = !0), this.store.removeByPath(n, t), this;
	}
	prop(e, t, n) {
		return e == null ? this.getProp() : typeof e == "string" || Array.isArray(e) ? arguments.length === 1 ? this.getPropByPath(e) : t == null ? this.removePropByPath(e, n || {}) : this.setPropByPath(e, t, n || {}) : this.setProp(e, t || {});
	}
	previous(e) {
		return this.store.getPrevious(e);
	}
	get zIndex() {
		return this.getZIndex();
	}
	set zIndex(e) {
		e == null ? this.removeZIndex() : this.setZIndex(e);
	}
	getZIndex() {
		return this.store.get("zIndex");
	}
	setZIndex(e, t = {}) {
		return this.store.set("zIndex", e, t), this;
	}
	removeZIndex(e = {}) {
		return this.store.remove("zIndex", e), this;
	}
	toFront(e = {}) {
		let t = this.model;
		if (t) {
			let n = t.getMaxZIndex(), r;
			e.deep ? (r = this.getDescendants({
				deep: !0,
				breadthFirst: !0
			}), r.unshift(this)) : r = [this], n = n - r.length + 1;
			let i = t.total(), a = t.indexOf(this) !== i - r.length;
			a ||= r.some((e, t) => e.getZIndex() !== n + t), a && this.batchUpdate("to-front", () => {
				n += r.length, r.forEach((t, r) => {
					t.setZIndex(n + r, e);
				});
			});
		}
		return this;
	}
	toBack(e = {}) {
		let t = this.model;
		if (t) {
			let n = t.getMinZIndex(), r;
			e.deep ? (r = this.getDescendants({
				deep: !0,
				breadthFirst: !0
			}), r.unshift(this)) : r = [this];
			let i = t.indexOf(this) !== 0;
			i ||= r.some((e, t) => e.getZIndex() !== n + t), i && this.batchUpdate("to-back", () => {
				n -= r.length, r.forEach((t, r) => {
					t.setZIndex(n + r, e);
				});
			});
		}
		return this;
	}
	get markup() {
		return this.getMarkup();
	}
	set markup(e) {
		e == null ? this.removeMarkup() : this.setMarkup(e);
	}
	getMarkup() {
		let e = this.store.get("markup");
		return e ??= this.constructor.getMarkup(), e;
	}
	setMarkup(e, t = {}) {
		return this.store.set("markup", e, t), this;
	}
	removeMarkup(e = {}) {
		return this.store.remove("markup", e), this;
	}
	get attrs() {
		return this.getAttrs();
	}
	set attrs(e) {
		e == null ? this.removeAttrs() : this.setAttrs(e);
	}
	getAttrs() {
		let e = this.store.get("attrs");
		return e ? Object.assign({}, e) : {};
	}
	setAttrs(e, t = {}) {
		if (e == null) this.removeAttrs(t);
		else {
			let n = (e) => this.store.set("attrs", e, t);
			if (t.overwrite === !0) n(e);
			else {
				let r = this.getAttrs();
				t.deep === !1 ? n(Object.assign(Object.assign({}, r), e)) : n(Qc({}, r, e));
			}
		}
		return this;
	}
	replaceAttrs(e, t = {}) {
		return this.setAttrs(e, Object.assign(Object.assign({}, t), { overwrite: !0 }));
	}
	updateAttrs(e, t = {}) {
		return this.setAttrs(e, Object.assign(Object.assign({}, t), { deep: !1 }));
	}
	removeAttrs(e = {}) {
		return this.store.remove("attrs", e), this;
	}
	getAttrDefinition(e) {
		if (!e) return null;
		let t = this.constructor.getAttrHooks() || {}, n = t[e] || Sg.get(e);
		if (!n) {
			let r = Ki(e);
			n = t[r] || Sg.get(r);
		}
		return n || null;
	}
	getAttrByPath(e) {
		return e == null || e === "" ? this.getAttrs() : this.getPropByPath(this.prefixAttrPath(e));
	}
	setAttrByPath(e, t, n = {}) {
		return this.setPropByPath(this.prefixAttrPath(e), t, n), this;
	}
	removeAttrByPath(e, t = {}) {
		return this.removePropByPath(this.prefixAttrPath(e), t), this;
	}
	prefixAttrPath(e) {
		return Array.isArray(e) ? ["attrs"].concat(e) : `attrs/${e}`;
	}
	attr(e, t, n) {
		return e == null ? this.getAttrByPath() : typeof e == "string" || Array.isArray(e) ? arguments.length === 1 ? this.getAttrByPath(e) : t == null ? this.removeAttrByPath(e, n || {}) : this.setAttrByPath(e, t, n || {}) : this.setAttrs(e, t || {});
	}
	get visible() {
		return this.isVisible();
	}
	set visible(e) {
		this.setVisible(e);
	}
	setVisible(e, t = {}) {
		return this.store.set("visible", e, t), this;
	}
	isVisible() {
		return this.store.get("visible") !== !1;
	}
	show(e = {}) {
		return this.isVisible() || this.setVisible(!0, e), this;
	}
	hide(e = {}) {
		return this.isVisible() && this.setVisible(!1, e), this;
	}
	toggleVisible(e, t = {}) {
		let n = typeof e == "boolean" ? e : !this.isVisible(), r = typeof e == "boolean" ? t : e;
		return n ? this.show(r) : this.hide(r), this;
	}
	get data() {
		return this.getData();
	}
	set data(e) {
		this.setData(e);
	}
	getData() {
		return this.store.get("data");
	}
	setData(e, t = {}) {
		if (e == null) this.removeData(t);
		else {
			let n = (e) => this.store.set("data", e, t);
			if (t.overwrite === !0) n(e);
			else {
				let r = this.getData();
				t.deep === !1 ? n(typeof e == "object" ? Object.assign(Object.assign({}, r), e) : e) : n(Qc({}, r, e));
			}
		}
		return this;
	}
	replaceData(e, t = {}) {
		return this.setData(e, Object.assign(Object.assign({}, t), { overwrite: !0 }));
	}
	updateData(e, t = {}) {
		return this.setData(e, Object.assign(Object.assign({}, t), { deep: !1 }));
	}
	removeData(e = {}) {
		return this.store.remove("data", e), this;
	}
	get parent() {
		return this.getParent();
	}
	get children() {
		return this.getChildren();
	}
	getParentId() {
		return this.store.get("parent");
	}
	getParent() {
		let e = this.getParentId();
		if (e && this.model) {
			let t = this.model.getCell(e);
			return this._parent = t, t;
		}
		return null;
	}
	getChildren() {
		let e = this.store.get("children");
		if (e && e.length && this.model) {
			let t = e.map((e) => this.model?.getCell(e)).filter((e) => e != null);
			return this._children = t, [...t];
		}
		return null;
	}
	hasParent() {
		return this.parent != null;
	}
	isParentOf(e) {
		return e != null && e.getParent() === this;
	}
	isChildOf(e) {
		return e != null && this.getParent() === e;
	}
	eachChild(e, t) {
		return this.children && this.children.forEach(e, t), this;
	}
	filterChild(e, t) {
		return this.children ? this.children.filter(e, t) : [];
	}
	getChildCount() {
		return this.children == null ? 0 : this.children.length;
	}
	getChildIndex(e) {
		return this.children == null ? -1 : this.children.indexOf(e);
	}
	getChildAt(e) {
		return this.children != null && e >= 0 ? this.children[e] : null;
	}
	getAncestors(e = {}) {
		let t = [], n = this.getParent();
		for (; n;) t.push(n), n = e.deep === !1 ? null : n.getParent();
		return t;
	}
	getDescendants(e = {}) {
		if (e.deep !== !1) {
			if (e.breadthFirst) {
				let e = [], t = this.getChildren() || [];
				for (; t.length > 0;) {
					let n = t.shift(), r = n.getChildren();
					e.push(n), r && t.push(...r);
				}
				return e;
			}
			{
				let t = this.getChildren() || [];
				return t.forEach((n) => {
					t.push(...n.getDescendants(e));
				}), t;
			}
		}
		return this.getChildren() || [];
	}
	isDescendantOf(e, t = {}) {
		if (e == null) return !1;
		if (t.deep !== !1) {
			let t = this.getParent();
			for (; t;) {
				if (t === e) return !0;
				t = t.getParent();
			}
			return !1;
		}
		return this.isChildOf(e);
	}
	isAncestorOf(e, t = {}) {
		return e != null && e.isDescendantOf(this, t);
	}
	contains(e) {
		return this.isAncestorOf(e);
	}
	getCommonAncestor(...t) {
		return e.getCommonAncestor(this, ...t);
	}
	setParent(e, t = {}) {
		return this._parent = e, e ? this.store.set("parent", e.id, t) : this.store.remove("parent", t), this;
	}
	setChildren(e, t = {}) {
		return this._children = e, e == null ? this.store.remove("children", t) : this.store.set("children", e.map((e) => e.id), t), this;
	}
	unembed(e, t = {}) {
		let n = this.children;
		if (n != null && e != null) {
			let r = this.getChildIndex(e);
			r !== -1 && (n.splice(r, 1), e.setParent(null, t), this.setChildren(n, t));
		}
		return this;
	}
	embed(e, t = {}) {
		return e.addTo(this, t), this;
	}
	addTo(t, n = {}) {
		return e.isCell(t) ? t.addChild(this, n) : t.addCell(this, n), this;
	}
	insertTo(e, t, n = {}) {
		return e.insertChild(this, t, n), this;
	}
	addChild(e, t = {}) {
		return this.insertChild(e, void 0, t);
	}
	insertChild(e, t, n = {}) {
		if (e != null && e !== this) {
			let r = e.getParent(), i = this !== r, a = t;
			if (a ?? (a = this.getChildCount(), i || --a), r) {
				let t = r.getChildren();
				if (t) {
					let i = t.indexOf(e);
					i >= 0 && (e.setParent(null, n), t.splice(i, 1), r.setChildren(t, n));
				}
			}
			let o = this.children;
			if (o == null ? (o = [], o.push(e)) : o.splice(a, 0, e), e.setParent(this, n), this.setChildren(o, n), i && this.model) {
				let e = this.model.getIncomingEdges(this), t = this.model.getOutgoingEdges(this);
				e && e.forEach((e) => {
					e.updateParent(n);
				}), t && t.forEach((e) => {
					e.updateParent(n);
				});
			}
			this.model && this.model.addCell(e, n);
		}
		return this;
	}
	removeFromParent(e = {}) {
		let t = this.getParent();
		if (t != null) {
			let n = t.getChildIndex(this);
			t.removeChildAt(n, e);
		}
		return this;
	}
	removeChild(e, t = {}) {
		let n = this.getChildIndex(e);
		return this.removeChildAt(n, t);
	}
	removeChildAt(e, t = {}) {
		let n = this.getChildAt(e);
		return this.children != null && n != null && (this.unembed(n, t), n.remove(t)), n;
	}
	remove(e = {}) {
		return this.batchUpdate("remove", () => {
			let t = this.getParentId(), n = t && this.model ? this.model.getCell(t) : this._parent;
			if (n) {
				let t = n.store.get("children");
				if (t && t.length) {
					let r = t.filter((e) => e !== this.id);
					r.length !== t.length && (r.length ? n.store.set("children", r, e) : n.store.remove("children", e));
				}
			}
			this.setParent(null, e), e.deep !== !1 && this.eachChild((t) => t.remove(e)), this.model && this.model.removeCell(this, e), this.dispose();
		}), this;
	}
	animate(e, t) {
		let n = Jc(t) ? { duration: t } : Object.assign({}, t), r = new dx(new px(this, e, n), n.timeline);
		return this.animationManager.addAnimation(r), r.id = n.id ?? "", r.play(), r;
	}
	getAnimations() {
		return this.animationManager.getAnimations();
	}
	translate(e, t, n) {
		return this;
	}
	scale(e, t, n, r) {
		return this;
	}
	addTools(e, t, n) {
		let r = Array.isArray(e) ? e : [e], i = typeof t == "string" ? t : null, a = typeof t == "object" ? t : typeof n == "object" ? n : {};
		if (a.reset) return this.setTools({
			name: i,
			items: r,
			local: a.local
		}, a);
		let o = as(this.getTools());
		if (o == null || i == null || o.name === i) return o ??= {}, o.items || (o.items = []), o.name = i, o.items = [...o.items, ...r], this.setTools(Object.assign({}, o), a);
	}
	setTools(t, n = {}) {
		return t == null ? this.removeTools() : this.store.set("tools", e.normalizeTools(t), n), this;
	}
	getTools() {
		return this.store.get("tools");
	}
	removeTools(e = {}) {
		return this.store.remove("tools", e), this;
	}
	hasTools(e) {
		let t = this.getTools();
		return t == null ? !1 : e == null || t.name === e;
	}
	hasTool(e) {
		let t = this.getTools();
		return t != null && t.items.some((t) => typeof t == "string" ? t === e : t.name === e);
	}
	removeTool(e, t = {}) {
		let n = as(this.getTools());
		if (n) {
			let r = !1, i = n.items.slice(), a = (e) => {
				i.splice(e, 1), r = !0;
			};
			if (typeof e == "number") a(e);
			else for (let t = i.length - 1; t >= 0; --t) {
				let n = i[t];
				(typeof n == "string" ? n === e : n.name === e) && a(t);
			}
			r && (n.items = i, this.setTools(n, t));
		}
		return this;
	}
	getBBox(e) {
		return new B();
	}
	getConnectionPoint(e, t) {
		return new z();
	}
	toJSON(e = {}) {
		let t = Object.assign({}, this.store.get()), n = Object.prototype.toString, r = this.isNode() ? "node" : this.isEdge() ? "edge" : "cell";
		if (!t.shape) {
			let e = this.constructor;
			throw Error(`Unable to serialize ${r} missing "shape" prop, check the ${r} "${e.name || n.call(e)}"`);
		}
		let i = this.constructor, a = e.diff === !0, o = t.attrs || {}, s = i.getDefaults(!0), c = a ? this.preprocess(s, !0) : s, l = c.attrs || {}, u = {};
		Object.entries(t).forEach(([e, n]) => {
			if (n != null && !Array.isArray(n) && typeof n == "object" && !Sr(n)) throw Error(`Can only serialize ${r} with plain-object props, but got a "${toString.call(n)}" type of key "${e}" on ${r} "${this.id}"`);
			if (e !== "attrs" && e !== "shape" && a) {
				let r = c[e];
				Kc(n, r) && delete t[e];
			}
		}), Object.keys(o).forEach((e) => {
			let t = o[e], n = l[e];
			Object.keys(t).forEach((r) => {
				let i = t[r], a = n ? n[r] : null;
				typeof i == "object" && i && !Array.isArray(i) ? Object.keys(i).forEach((t) => {
					let o = i[t];
					if (n == null || a == null || !N(a) || !Kc(a[t], o)) {
						u[e] ?? (u[e] = {}), u[e][r] ?? (u[e][r] = {});
						let n = u[e][r];
						n[t] = o;
					}
				}) : n != null && Kc(a, i) || (u[e] ?? (u[e] = {}), u[e][r] = i);
			});
		});
		let d = Object.assign(Object.assign({}, t), { attrs: Gc(u) ? void 0 : u });
		d.attrs ?? delete d.attrs;
		let f = d;
		return f.angle === 0 && delete f.angle, as(f);
	}
	clone(t = {}) {
		if (!t.deep) {
			let e = Object.assign({}, this.store.get());
			t.keepId || delete e.id, delete e.parent, delete e.children;
			let n = this.constructor;
			return new n(e);
		}
		return e.deepClone(this)[this.id];
	}
	findView(e) {
		return e.findViewByCell(this);
	}
	startBatch(e, t = {}, n = this.model) {
		return this.notify("batch:start", {
			name: e,
			data: t,
			cell: this
		}), n && n.startBatch(e, Object.assign(Object.assign({}, t), { cell: this })), this;
	}
	stopBatch(e, t = {}, n = this.model) {
		return n && n.stopBatch(e, Object.assign(Object.assign({}, t), { cell: this })), this.notify("batch:stop", {
			name: e,
			data: t,
			cell: this
		}), this;
	}
	batchUpdate(e, t, n) {
		let r = this.model;
		this.startBatch(e, n, r);
		let i = t();
		return this.stopBatch(e, n, r), i;
	}
	dispose() {
		this.removeFromParent(), this.animationManager.cancelAnimations(), this.store.dispose();
	}
};
Y.toStringTag = "X6.cell", Y.defaults = {}, Y.attrHooks = {}, Y.propHooks = [], f([q()], Y.prototype, "dispose", null), Y.config({ propHooks(e) {
	var { tools: t } = e, n = d(e, ["tools"]);
	return t && (n.tools = Y.normalizeTools(t)), n;
} });
// node_modules/@antv/x6/es/model/port.js
var gx = class {
	constructor(e) {
		this.ports = [], this.groups = {}, this.init(as(e));
	}
	getPorts() {
		return this.ports;
	}
	getGroup(e) {
		return e == null ? null : this.groups[e];
	}
	getPortsByGroup(e) {
		return this.ports.filter((t) => t.group === e || t.group == null && e == null);
	}
	getPortsLayoutByGroup(e, t) {
		let n = this.getPortsByGroup(e), r = e ? this.getGroup(e) : null, i = r ? r.position : null, a = i ? i.name : null, o;
		if (a != null) {
			let e = Wv.get(a);
			if (e == null) return Wv.onNotFound(a);
			o = e;
		} else o = Uv.left;
		let s = n.map((e) => e && e.position && e.position.args || {}), c = i && i.args || {};
		return o(s, t, c).map((e, r) => {
			let i = n[r];
			return {
				portLayout: e,
				portId: i.id,
				portSize: i.size,
				portAttrs: i.attrs,
				labelSize: i.label.size,
				labelLayout: this.getPortLabelLayout(i, z.create(e.position), t)
			};
		});
	}
	init(e) {
		let { groups: t, items: n } = e;
		t != null && Object.keys(t).forEach((e) => {
			this.groups[e] = this.parseGroup(t[e]);
		}), Array.isArray(n) && n.forEach((e) => {
			this.ports.push(this.parsePort(e));
		});
	}
	parseGroup(e) {
		return Object.assign(Object.assign({}, e), {
			label: this.getLabel(e, !0),
			position: this.getPortPosition(e.position, !0)
		});
	}
	parsePort(e) {
		let t = Object.assign({}, e), n = this.getGroup(e.group) || {};
		return t.markup = t.markup || n.markup, t.attrs = Qc({}, n.attrs, t.attrs), t.position = this.createPosition(n, t), t.label = Qc({}, n.label, this.getLabel(t)), t.zIndex = this.getZIndex(n, t), t.size = Object.assign(Object.assign({}, n.size), t.size), t;
	}
	getZIndex(e, t) {
		return typeof t.zIndex == "number" ? t.zIndex : typeof e.zIndex == "number" || e.zIndex === "auto" ? e.zIndex : "auto";
	}
	createPosition(e, t) {
		return Qc({
			name: "left",
			args: {}
		}, e.position, { args: t.args });
	}
	getPortPosition(e, t = !1) {
		if (e == null) {
			if (t) return {
				name: "left",
				args: {}
			};
		} else {
			if (typeof e == "string") return {
				name: e,
				args: {}
			};
			if (Array.isArray(e)) return {
				name: "absolute",
				args: {
					x: e[0],
					y: e[1]
				}
			};
			if (typeof e == "object") return e;
		}
		return { args: {} };
	}
	getPortLabelPosition(e, t = !1) {
		if (e == null) {
			if (t) return {
				name: "left",
				args: {}
			};
		} else {
			if (typeof e == "string") return {
				name: e,
				args: {}
			};
			if (typeof e == "object") return e;
		}
		return { args: {} };
	}
	getLabel(e, t = !1) {
		let n = e.label || {};
		return n.position = this.getPortLabelPosition(n.position, t), n;
	}
	getPortLabelLayout(e, t, n) {
		let r = e.label.position.name || "left", i = e.label.position.args || {}, a = Av.get(r) || kv.left;
		return a ? a(t, n, i) : null;
	}
}, _x, vx;
function yx(e, t) {
	return t ? _x != null && _x.exist(e) : vx != null && vx.exist(e);
}
function bx(e) {
	_x = e;
}
function xx(e) {
	vx = e;
}
// node_modules/@antv/x6/es/model/node.js
var Sx = "X6.node", Cx = 0;
function wx(e) {
	return e ? _d(e) : (Cx += 1, `CustomNode${Cx}`);
}
var Tx = class e extends Y {
	static isNode(t) {
		if (t == null) return !1;
		if (t instanceof e) return !0;
		let n = t[Symbol.toStringTag], r = t;
		return !(n != null && n !== Sx || typeof r.isNode != "function" || typeof r.isEdge != "function" || typeof r.prop != "function" || typeof r.attr != "function" || typeof r.size != "function" || typeof r.position != "function");
	}
	static define(t) {
		let { constructorName: n, overwrite: r } = t, i = d(t, ["constructorName", "overwrite"]), a = tf(wx(n || i.shape), this);
		return a.config(i), i.shape && e.registry.register(i.shape, a, r), a;
	}
	static create(t) {
		let n = t.shape || "rect", r = e.registry.get(n);
		return r ? new r(t) : e.registry.onNotFound(n);
	}
	get [Symbol.toStringTag]() {
		return e.toStringTag;
	}
	constructor(e = {}) {
		super(e), this.initPorts();
	}
	preprocess(e, t) {
		let { x: n, y: r, width: i, height: a } = e, o = d(e, [
			"x",
			"y",
			"width",
			"height"
		]);
		if (n != null || r != null) {
			let e = o.position;
			o.position = Object.assign(Object.assign({}, e), {
				x: n ?? (e ? e.x : 0),
				y: r ?? (e ? e.y : 0)
			});
		}
		if (i != null || a != null) {
			let e = o.size;
			o.size = Object.assign(Object.assign({}, e), {
				width: i ?? (e ? e.width : 0),
				height: a ?? (e ? e.height : 0)
			});
		}
		return super.preprocess(o, t);
	}
	isNode() {
		return !0;
	}
	size(e, t, n) {
		return e === void 0 ? this.getSize() : typeof e == "number" ? this.setSize(e, t, n) : this.setSize(e, t);
	}
	getSize() {
		let e = this.store.get("size");
		return e ? Object.assign({}, e) : {
			width: 1,
			height: 1
		};
	}
	setSize(e, t, n) {
		return typeof e == "object" ? this.resize(e.width, e.height, t) : this.resize(e, t, n), this;
	}
	resize(e, t, n = {}) {
		this.startBatch("resize", n);
		let r = n.direction;
		if (r) {
			let i = this.getSize();
			switch (r) {
				case "left":
				case "right":
					t = i.height;
					break;
				case "top":
				case "bottom": e = i.width;
			}
			let a = {
				right: 0,
				"top-right": 0,
				top: 1,
				"top-left": 1,
				left: 2,
				"bottom-left": 2,
				bottom: 3,
				"bottom-right": 3
			}[r], o = iu(this.getAngle() || 0);
			n.absolute && (a += Math.floor((o + 45) / 90), a %= 4);
			let s = this.getBBox(), c;
			c = a === 0 ? s.getBottomLeft() : a === 1 ? s.getCorner() : a === 2 ? s.getTopRight() : s.getOrigin();
			let l = c.clone().rotate(-o, s.getCenter()), u = Math.sqrt(e * e + t * t) / 2, d = a * Math.PI / 2;
			d += Math.atan(a % 2 == 0 ? t / e : e / t), d -= ru(o);
			let f = z.fromPolar(u, d, l).clone().translate(e / -2, t / -2);
			this.store.set("size", {
				width: e,
				height: t
			}, n), this.setPosition(f.x, f.y, n);
		} else this.store.set("size", {
			width: e,
			height: t
		}, n);
		return this.stopBatch("resize", n), this;
	}
	scale(e, t, n, r = {}) {
		let i = this.getBBox().scale(e, t, n ?? void 0);
		return this.startBatch("scale", r), this.setPosition(i.x, i.y, r), this.resize(i.width, i.height, r), this.stopBatch("scale"), this;
	}
	position(e, t, n) {
		return typeof e == "number" ? this.setPosition(e, t, n) : this.getPosition(e);
	}
	getPosition(e = {}) {
		if (e.relative) {
			let e = this.getParent();
			if (e != null && e.isNode()) {
				let t = this.getPosition(), n = e.getPosition();
				return {
					x: t.x - n.x,
					y: t.y - n.y
				};
			}
		}
		let t = this.store.get("position");
		return t ? Object.assign({}, t) : {
			x: 0,
			y: 0
		};
	}
	setPosition(e, t, n = {}) {
		let r, i, a;
		if (typeof e == "object" ? (r = e.x, i = e.y, a = t || {}) : (r = e, i = t, a = n || {}), a.relative) {
			let e = this.getParent();
			if (e != null && e.isNode()) {
				let t = e.getPosition();
				r += t.x, i += t.y;
			}
		}
		if (a.deep) {
			let e = this.getPosition();
			this.translate(r - e.x, i - e.y, a);
		} else this.store.set("position", {
			x: r,
			y: i
		}, a);
		return this;
	}
	translate(e = 0, t = 0, n = {}) {
		if (e === 0 && t === 0) return this;
		n.translateBy = n.translateBy || this.id;
		let r = this.getPosition();
		if (n.restrict != null && n.translateBy === this.id) {
			let i = this.getBBox({ deep: !0 }), a = n.restrict, o = r.x - i.x, s = r.y - i.y, c = Math.max(a.x + o, Math.min(a.x + a.width + o - i.width, r.x + e)), l = Math.max(a.y + s, Math.min(a.y + a.height + s - i.height, r.y + t));
			e = c - r.x, t = l - r.y;
		}
		let i = {
			x: r.x + e,
			y: r.y + t
		};
		if (n.tx = e, n.ty = t, n.transition) {
			let r = typeof n.transition == "object" ? Object.assign({}, n.transition) : {};
			r = Object.assign({
				duration: 100,
				fill: "forwards"
			}, r), this.animate({
				"position/x": i.x,
				"position/y": i.y
			}, r), this.eachChild((r) => {
				n.exclude?.includes(r) || r.translate(e, t, n);
			});
		} else this.startBatch("translate", n), this.store.set("position", i, n), this.eachChild((r) => {
			n.exclude?.includes(r) || r.translate(e, t, n);
		}), this.stopBatch("translate", n);
		return this;
	}
	angle(e, t) {
		return e == null ? this.getAngle() : this.rotate(e, t);
	}
	getAngle() {
		return this.store.get("angle", 0);
	}
	rotate(e, t = {}) {
		let n = this.getAngle();
		if (t.center) {
			let r = this.getSize(), i = this.getPosition(), a = this.getBBox().getCenter();
			a.rotate(n - e, t.center);
			let o = a.x - r.width / 2 - i.x, s = a.y - r.height / 2 - i.y;
			this.startBatch("rotate", {
				angle: e,
				options: t
			}), this.setPosition(i.x + o, i.y + s, t), this.rotate(e, Object.assign(Object.assign({}, t), { center: null })), this.stopBatch("rotate");
		} else this.store.set("angle", t.absolute ? e : (n + e) % 360, t);
		return this;
	}
	getBBox(e = {}) {
		if (e.deep) {
			let e = this.getDescendants({
				deep: !0,
				breadthFirst: !0
			});
			return e.push(this), Y.getCellsBBox(e);
		}
		return B.fromPositionAndSize(this.getPosition(), this.getSize());
	}
	getConnectionPoint(e, t) {
		let n = this.getBBox(), r = n.getCenter(), i = e.getTerminal(t);
		if (i == null) return r;
		let a = i.port;
		if (!a || !this.hasPort(a)) return r;
		let o = this.getPort(a);
		if (!o || !o.group) return r;
		let s = this.getPortsPosition(o.group)[a].position, c = z.create(s).translate(n.getOrigin()), l = this.getAngle();
		return l && c.rotate(-l, r), c;
	}
	fit(e = {}) {
		let t = (this.getChildren() || []).filter((e) => e.isNode());
		if (t.length === 0) return this;
		this.startBatch("fit-embeds", e), e.deep && t.forEach((t) => {
			t.fit(e);
		});
		let { x: n, y: r, width: i, height: a } = Y.getCellsBBox(t), o = Dl(e.padding);
		return n -= o.left, r -= o.top, i += o.left + o.right, a += o.bottom + o.top, this.store.set({
			position: {
				x: n,
				y: r
			},
			size: {
				width: i,
				height: a
			}
		}, e), this.stopBatch("fit-embeds"), this;
	}
	get portContainerMarkup() {
		return this.getPortContainerMarkup();
	}
	set portContainerMarkup(e) {
		this.setPortContainerMarkup(e);
	}
	getDefaultPortContainerMarkup() {
		return this.store.get("defaultPortContainerMarkup") || fb.getPortContainerMarkup();
	}
	getPortContainerMarkup() {
		return this.store.get("portContainerMarkup") || this.getDefaultPortContainerMarkup();
	}
	setPortContainerMarkup(e, t = {}) {
		return this.store.set("portContainerMarkup", fb.clone(e), t), this;
	}
	get portMarkup() {
		return this.getPortMarkup();
	}
	set portMarkup(e) {
		this.setPortMarkup(e);
	}
	getDefaultPortMarkup() {
		return this.store.get("defaultPortMarkup") || fb.getPortMarkup();
	}
	getPortMarkup() {
		return this.store.get("portMarkup") || this.getDefaultPortMarkup();
	}
	setPortMarkup(e, t = {}) {
		return this.store.set("portMarkup", fb.clone(e), t), this;
	}
	get portLabelMarkup() {
		return this.getPortLabelMarkup();
	}
	set portLabelMarkup(e) {
		this.setPortLabelMarkup(e);
	}
	getDefaultPortLabelMarkup() {
		return this.store.get("defaultPortLabelMarkup") || fb.getPortLabelMarkup();
	}
	getPortLabelMarkup() {
		return this.store.get("portLabelMarkup") || this.getDefaultPortLabelMarkup();
	}
	setPortLabelMarkup(e, t = {}) {
		return this.store.set("portLabelMarkup", fb.clone(e), t), this;
	}
	get ports() {
		let e = this.store.get("ports", { items: [] });
		return e.items ??= [], e;
	}
	getPorts() {
		return as(this.ports.items);
	}
	getPortsByGroup(e) {
		return this.getPorts().filter((t) => t.group === e);
	}
	getPort(e) {
		return as(this.ports.items.find((t) => t.id && t.id === e));
	}
	getPortAt(e) {
		return this.ports.items[e] || null;
	}
	hasPorts() {
		return this.ports.items.length > 0;
	}
	hasPort(e) {
		return this.getPortIndex(e) !== -1;
	}
	getPortIndex(e) {
		let t = typeof e == "string" ? e : e.id;
		return t == null ? -1 : this.ports.items.findIndex((e) => e.id === t);
	}
	getPortsPosition(e) {
		let t = this.getSize();
		return this.port.getPortsLayoutByGroup(e, new B(0, 0, t.width, t.height)).reduce((e, t) => {
			let n = t.portLayout;
			return e[t.portId] = {
				position: Object.assign({}, n.position),
				angle: n.angle || 0
			}, e;
		}, {});
	}
	getPortProp(e, t) {
		return this.getPropByPath(this.prefixPortPath(e, t));
	}
	setPortProp(e, t, n, r) {
		if (typeof t == "string" || Array.isArray(t)) {
			let i = this.prefixPortPath(e, t), a = n;
			return this.setPropByPath(i, a, r);
		}
		let i = this.prefixPortPath(e), a = t;
		return this.setPropByPath(i, a, n);
	}
	removePortProp(e, t, n) {
		return typeof t == "string" || Array.isArray(t) ? this.removePropByPath(this.prefixPortPath(e, t), n) : this.removePropByPath(this.prefixPortPath(e), t);
	}
	portProp(e, t, n, r) {
		return t == null ? this.getPortProp(e) : typeof t == "string" || Array.isArray(t) ? arguments.length === 2 ? this.getPortProp(e, t) : n == null ? this.removePortProp(e, t, r) : this.setPortProp(e, t, n, r) : this.setPortProp(e, t, n);
	}
	prefixPortPath(e, t) {
		let n = this.getPortIndex(e);
		if (n === -1) throw Error(`Unable to find port with id: "${e}"`);
		return t == null || t === "" ? [
			"ports",
			"items",
			`${n}`
		] : Array.isArray(t) ? [
			"ports",
			"items",
			`${n}`,
			...t
		] : `ports/items/${n}/${t}`;
	}
	addPort(e, t) {
		let n = [...this.ports.items];
		return n.push(e), this.setPropByPath("ports/items", n, t), this;
	}
	addPorts(e, t) {
		return this.setPropByPath("ports/items", [...this.ports.items, ...e], t), this;
	}
	insertPort(e, t, n) {
		let r = [...this.ports.items];
		return r.splice(e, 0, t), this.setPropByPath("ports/items", r, n), this;
	}
	removePort(e, t = {}) {
		return this.removePortAt(this.getPortIndex(e), t);
	}
	removePortAt(e, t = {}) {
		if (e >= 0) {
			let n = [...this.ports.items];
			n.splice(e, 1), t.rewrite = !0, this.setPropByPath("ports/items", n, t);
		}
		return this;
	}
	removePorts(e, t) {
		let n;
		if (Array.isArray(e)) {
			if (n = t || {}, e.length) {
				n.rewrite = !0;
				let t = [...this.ports.items].filter((t) => !e.some((e) => {
					let n = typeof e == "string" ? e : e.id;
					return t.id === n;
				}));
				this.setPropByPath("ports/items", t, n);
			}
		} else n = e || {}, n.rewrite = !0, this.setPropByPath("ports/items", [], n);
		return this;
	}
	getParsedPorts() {
		return this.port.getPorts();
	}
	getParsedGroups() {
		return this.port.groups;
	}
	getPortsLayoutByGroup(e, t) {
		return this.port.getPortsLayoutByGroup(e, t);
	}
	initPorts() {
		this.updatePortData(), this.on("change:ports", () => {
			this.processRemovedPort(), this.updatePortData();
		});
	}
	processRemovedPort() {
		let e = this.ports, t = {};
		e.items.forEach((e) => {
			e.id && (t[e.id] = !0);
		});
		let n = {};
		(this.store.getPrevious("ports") || { items: [] }).items.forEach((e) => {
			e.id && !t[e.id] && (n[e.id] = !0);
		});
		let r = this.model;
		r && !Gc(n) && (r.getConnectedEdges(this, { incoming: !0 }).forEach((e) => {
			let t = e.getTargetPortId();
			t && n[t] && e.remove();
		}), r.getConnectedEdges(this, { outgoing: !0 }).forEach((e) => {
			let t = e.getSourcePortId();
			t && n[t] && e.remove();
		}));
	}
	validatePorts() {
		let e = {}, t = [];
		return this.ports.items.forEach((n) => {
			typeof n != "object" && t.push(`Invalid port ${n}.`), n.id ??= this.generatePortId(), e[n.id] && t.push("Duplicitied port id."), e[n.id] = !0;
		}), t;
	}
	generatePortId() {
		return Vd();
	}
	updatePortData() {
		let e = this.validatePorts();
		if (e.length > 0) throw this.store.set("ports", this.store.getPrevious("ports")), Error(e.join(" "));
		let t = this.port ? this.port.getPorts() : null;
		this.port = new gx(this.ports);
		let n = this.port.getPorts(), r = t ? n.filter((e) => t.find((t) => t.id === e.id) ? null : e) : [...n], i = t ? t.filter((e) => n.find((t) => t.id === e.id) ? null : e) : [];
		r.length > 0 && this.notify("ports:added", {
			added: r,
			cell: this,
			node: this
		}), i.length > 0 && this.notify("ports:removed", {
			removed: i,
			cell: this,
			node: this
		});
	}
};
Tx.toStringTag = Sx, Tx.registry = Ym.create({
	type: "node",
	process(e, t) {
		if (yx(e, !0)) throw Error(`Node with name '${e}' was registered by anthor Edge`);
		if (typeof t == "function") return t.config({ shape: e }), t;
		let n = Tx, { inherit: r } = t, i = d(t, ["inherit"]);
		if (r) {
			if (typeof r == "string") {
				let e = this.get(r);
				e == null ? this.onNotFound(r, "inherited") : n = e;
			} else n = r;
		}
		i.constructorName ??= e;
		let a = n.define.call(n, i);
		return a.config({ shape: e }), a;
	}
}), Tx.defaults = {
	angle: 0,
	position: {
		x: 0,
		y: 0
	},
	size: {
		width: 1,
		height: 1
	}
}, Tx.config({
	markup: [{
		tagName: "rect",
		selector: "body"
	}, {
		tagName: "text",
		selector: "label"
	}],
	propHooks(e) {
		var { ports: t } = e, n = d(e, ["ports"]);
		return t && (n.ports = Array.isArray(t) ? { items: t } : t), n;
	}
}), xx(Tx.registry);
// node_modules/@antv/x6/es/model/edge.js
var Ex = "X6.edge", Dx = "basic.edge", Ox = 0;
function kx(e) {
	return e ? _d(e) : (Ox += 1, `CustomEdge${Ox}`);
}
var Ax = class e extends Y {
	static parseStringLabel(e) {
		return { attrs: { label: { text: e } } };
	}
	static isEdge(t) {
		if (t == null) return !1;
		if (t instanceof e) return !0;
		let n = t[Symbol.toStringTag], r = t;
		return !(n != null && n !== Ex || typeof r.isNode != "function" || typeof r.isEdge != "function" || typeof r.prop != "function" || typeof r.attr != "function" || typeof r.disconnect != "function" || typeof r.getSource != "function" || typeof r.getTarget != "function");
	}
	static equalTerminals(e, t) {
		let n = e, r = t;
		return n.cell === r.cell ? n.port === r.port || n.port == null && r.port == null : !1;
	}
	static define(t) {
		let { constructorName: n, overwrite: r } = t, i = d(t, ["constructorName", "overwrite"]), a = tf(kx(n || i.shape), this);
		return a.config(i), i.shape && e.registry.register(i.shape, a, r), a;
	}
	static create(t) {
		let n = t.shape || "edge", r = e.registry.get(n);
		return r ? new r(t) : e.registry.onNotFound(n);
	}
	get [Symbol.toStringTag]() {
		return e.toStringTag;
	}
	constructor(e = {}) {
		super(e);
	}
	preprocess(e, t) {
		let { source: n, sourceCell: r, sourcePort: i, sourcePoint: a, target: o, targetCell: s, targetPort: c, targetPoint: l } = e, u = d(e, [
			"source",
			"sourceCell",
			"sourcePort",
			"sourcePoint",
			"target",
			"targetCell",
			"targetPort",
			"targetPoint"
		]), f = (e) => typeof e == "string" || typeof e == "number";
		if (n != null) {
			if (Y.isCell(n)) u.source = { cell: n.id };
			else if (f(n)) u.source = { cell: n };
			else if (z.isPoint(n)) u.source = n.toJSON();
			else if (Array.isArray(n)) u.source = {
				x: n[0],
				y: n[1]
			};
			else {
				let e = n.cell;
				u.source = Y.isCell(e) ? Object.assign(Object.assign({}, n), { cell: e.id }) : n;
			}
		}
		if (r != null || i != null) {
			let e = u.source;
			if (r != null) {
				let t = f(r) ? r : r.id;
				e ? e.cell = t : e = u.source = { cell: t };
			}
			i != null && e && (e.port = i);
		} else a != null && (u.source = z.create(a).toJSON());
		if (o != null) {
			if (Y.isCell(o)) u.target = { cell: o.id };
			else if (f(o)) u.target = { cell: o };
			else if (z.isPoint(o)) u.target = o.toJSON();
			else if (Array.isArray(o)) u.target = {
				x: o[0],
				y: o[1]
			};
			else {
				let e = o.cell;
				u.target = Y.isCell(e) ? Object.assign(Object.assign({}, o), { cell: e.id }) : o;
			}
		}
		if (s != null || c != null) {
			let e = u.target;
			if (s != null) {
				let t = f(s) ? s : s.id;
				e ? e.cell = t : e = u.target = { cell: t };
			}
			c != null && e && (e.port = c);
		} else l != null && (u.target = z.create(l).toJSON());
		return super.preprocess(u, t);
	}
	setup() {
		super.setup(), this.on("change:labels", (e) => this.onLabelsChanged(e)), this.on("change:vertices", (e) => this.onVertexsChanged(e));
	}
	isEdge() {
		return !0;
	}
	disconnect(e = {}) {
		return this.store.set({
			source: {
				x: 0,
				y: 0
			},
			target: {
				x: 0,
				y: 0
			}
		}, e), this;
	}
	get source() {
		return this.getSource();
	}
	set source(e) {
		this.setSource(e);
	}
	getSource() {
		return this.getTerminal("source");
	}
	getSourceCellId() {
		return this.source.cell;
	}
	getSourcePortId() {
		return this.source.port;
	}
	setSource(e, t, n = {}) {
		return this.setTerminal("source", e, t, n);
	}
	get target() {
		return this.getTarget();
	}
	set target(e) {
		this.setTarget(e);
	}
	getTarget() {
		return this.getTerminal("target");
	}
	getTargetCellId() {
		return this.target.cell;
	}
	getTargetPortId() {
		return this.target.port;
	}
	setTarget(e, t, n = {}) {
		return this.setTerminal("target", e, t, n);
	}
	getTerminal(e) {
		return Object.assign({}, this.store.get(e));
	}
	setTerminal(e, t, n, r = {}) {
		if (Y.isCell(t)) return this.store.set(e, Qc({}, n, { cell: t.id }), r), this;
		let i = t;
		return z.isPoint(t) || i.x != null && i.y != null ? (this.store.set(e, Qc({}, n, {
			x: i.x,
			y: i.y
		}), r), this) : (this.store.set(e, as(t), r), this);
	}
	getSourcePoint() {
		return this.getTerminalPoint("source");
	}
	getTargetPoint() {
		return this.getTerminalPoint("target");
	}
	getTerminalPoint(e) {
		let t = this[e];
		if (z.isPointLike(t)) return z.create(t);
		let n = this.getTerminalCell(e);
		return n ? n.getConnectionPoint(this, e) : new z();
	}
	getSourceCell() {
		return this.getTerminalCell("source");
	}
	getTargetCell() {
		return this.getTerminalCell("target");
	}
	getTerminalCell(e) {
		if (this.model) {
			let t = e === "source" ? this.getSourceCellId() : this.getTargetCellId();
			if (t) return this.model.getCell(t);
		}
		return null;
	}
	getSourceNode() {
		return this.getTerminalNode("source");
	}
	getTargetNode() {
		return this.getTerminalNode("target");
	}
	getTerminalNode(e) {
		let t = this, n = {};
		for (; t && t.isEdge();) {
			if (n[t.id]) return null;
			n[t.id] = !0, t = t.getTerminalCell(e);
		}
		return t && t.isNode() ? t : null;
	}
	get router() {
		return this.getRouter();
	}
	set router(e) {
		e == null ? this.removeRouter() : this.setRouter(e);
	}
	getRouter() {
		return this.store.get("router");
	}
	setRouter(e, t, n) {
		return typeof e == "object" ? this.store.set("router", e, t) : this.store.set("router", {
			name: e,
			args: t
		}, n), this;
	}
	removeRouter(e = {}) {
		return this.store.remove("router", e), this;
	}
	get connector() {
		return this.getConnector();
	}
	set connector(e) {
		e == null ? this.removeConnector() : this.setConnector(e);
	}
	getConnector() {
		return this.store.get("connector");
	}
	setConnector(e, t, n) {
		return typeof e == "object" ? this.store.set("connector", e, t) : this.store.set("connector", {
			name: e,
			args: t
		}, n), this;
	}
	removeConnector(e = {}) {
		return this.store.remove("connector", e);
	}
	getDefaultLabel() {
		let e = this.constructor;
		return as(this.store.get("defaultLabel") || e.defaultLabel || {});
	}
	get labels() {
		return this.getLabels();
	}
	set labels(e) {
		this.setLabels(e);
	}
	getLabels() {
		return [...this.store.get("labels", [])].map((e) => this.parseLabel(e));
	}
	setLabels(e, t = {}) {
		return this.store.set("labels", Array.isArray(e) ? e : [e], t), this;
	}
	insertLabel(e, t, n = {}) {
		let r = this.getLabels(), i = r.length, a = t != null && Number.isFinite(t) ? t : i;
		return a < 0 && (a = i + a + 1), r.splice(a, 0, this.parseLabel(e)), this.setLabels(r, n);
	}
	appendLabel(e, t = {}) {
		return this.insertLabel(e, -1, t);
	}
	getLabelAt(e) {
		let t = this.getLabels();
		return e != null && Number.isFinite(e) ? this.parseLabel(t[e]) : null;
	}
	setLabelAt(e, t, n = {}) {
		if (e != null && Number.isFinite(e)) {
			let r = this.getLabels();
			r[e] = this.parseLabel(t), this.setLabels(r, n);
		}
		return this;
	}
	removeLabelAt(e, t = {}) {
		let n = this.getLabels(), r = e != null && Number.isFinite(e) ? e : -1, i = n.splice(r, 1);
		return this.setLabels(n, t), i.length ? i[0] : null;
	}
	parseLabel(e) {
		return typeof e == "string" ? this.constructor.parseStringLabel(e) : e;
	}
	onLabelsChanged({ previous: e, current: t }) {
		let n = e && t ? t.filter((t) => e.find((e) => t === e || Kc(t, e)) ? null : t) : t ? [...t] : [], r = e && t ? e.filter((e) => t.find((t) => e === t || Kc(e, t)) ? null : e) : e ? [...e] : [];
		n.length > 0 && this.notify("labels:added", {
			added: n,
			cell: this,
			edge: this
		}), r.length > 0 && this.notify("labels:removed", {
			removed: r,
			cell: this,
			edge: this
		});
	}
	get vertices() {
		return this.getVertices();
	}
	set vertices(e) {
		this.setVertices(e);
	}
	getVertices() {
		return [...this.store.get("vertices", [])];
	}
	setVertices(e, t = {}) {
		let n = Array.isArray(e) ? e : [e];
		return this.store.set("vertices", n.map((e) => z.toJSON(e)), t), this;
	}
	insertVertex(e, t, n = {}) {
		let r = this.getVertices(), i = r.length, a = t != null && Number.isFinite(t) ? t : i;
		return a < 0 && (a = i + a + 1), r.splice(a, 0, z.toJSON(e)), this.setVertices(r, n);
	}
	appendVertex(e, t = {}) {
		return this.insertVertex(e, -1, t);
	}
	getVertexAt(e) {
		return e != null && Number.isFinite(e) ? this.getVertices()[e] : null;
	}
	setVertexAt(e, t, n = {}) {
		if (e != null && Number.isFinite(e)) {
			let r = this.getVertices();
			r[e] = t, this.setVertices(r, n);
		}
		return this;
	}
	removeVertexAt(e, t = {}) {
		let n = this.getVertices(), r = e != null && Number.isFinite(e) ? e : -1;
		return n.splice(r, 1), this.setVertices(n, t);
	}
	onVertexsChanged({ previous: e, current: t }) {
		let n = e && t ? t.filter((t) => e.find((e) => z.equals(t, e)) ? null : t) : t ? [...t] : [], r = e && t ? e.filter((e) => t.find((t) => z.equals(e, t)) ? null : e) : e ? [...e] : [];
		n.length > 0 && this.notify("vertexs:added", {
			added: n,
			cell: this,
			edge: this
		}), r.length > 0 && this.notify("vertexs:removed", {
			removed: r,
			cell: this,
			edge: this
		});
	}
	getDefaultMarkup() {
		return this.store.get("defaultMarkup") || fb.getEdgeMarkup();
	}
	getMarkup() {
		return super.getMarkup() || this.getDefaultMarkup();
	}
	translate(e, t, n = {}) {
		return n.translateBy = n.translateBy || this.id, n.tx = e, n.ty = t, this.applyToPoints((n) => ({
			x: (n.x || 0) + e,
			y: (n.y || 0) + t
		}), n);
	}
	scale(e, t, n, r = {}) {
		return this.applyToPoints((r) => z.create(r).scale(e, t, n).toJSON(), r);
	}
	applyToPoints(e, t = {}) {
		let n = {}, r = this.getSource(), i = this.getTarget();
		z.isPointLike(r) && (n.source = e(r)), z.isPointLike(i) && (n.target = e(i));
		let a = this.getVertices();
		return a.length > 0 && (n.vertices = a.map(e)), this.store.set(n, t), this;
	}
	getBBox() {
		return this.getPolyline().bbox();
	}
	getConnectionPoint() {
		return this.getPolyline().pointAt(.5);
	}
	getPolyline() {
		return new yu([
			this.getSourcePoint(),
			...this.getVertices().map((e) => z.create(e)),
			this.getTargetPoint()
		]);
	}
	updateParent(e) {
		let t = null, n = this.getSourceCell(), r = this.getTargetCell(), i = this.getParent();
		return n && r && (t = n === r || n.isDescendantOf(r) ? r : r.isDescendantOf(n) ? n : Y.getCommonAncestor(n, r)), i && t && t.id !== i.id && i.unembed(this, e), t && (!i || i.id !== t.id) && t.embed(this, e), t;
	}
	hasLoop(e = {}) {
		let t = this.getSource(), n = this.getTarget(), r = t.cell, i = n.cell;
		if (!r || !i) return !1;
		let a = r === i;
		if (!a && e.deep && this._model) {
			let t = this.getSourceCell(), n = this.getTargetCell();
			t && n && (a = t.isAncestorOf(n, e) || n.isAncestorOf(t, e));
		}
		return a;
	}
	getFragmentAncestor() {
		let e = [
			this,
			this.getSourceNode(),
			this.getTargetNode()
		].filter((e) => e != null);
		return this.getCommonAncestor(...e);
	}
	isFragmentDescendantOf(e) {
		let t = this.getFragmentAncestor();
		return !!t && (t.id === e.id || t.isDescendantOf(e));
	}
};
Ax.toStringTag = Ex, Ax.defaultLabel = {
	markup: [{
		tagName: "rect",
		selector: "body"
	}, {
		tagName: "text",
		selector: "label"
	}],
	attrs: {
		text: {
			fill: "#000",
			fontSize: 14,
			textAnchor: "middle",
			textVerticalAnchor: "middle",
			pointerEvents: "none"
		},
		rect: {
			ref: "label",
			fill: "#fff",
			rx: 3,
			ry: 3,
			refWidth: 1,
			refHeight: 1,
			refX: 0,
			refY: 0
		}
	},
	position: { distance: .5 }
}, Ax.registry = Ym.create({
	type: "edge",
	process(e, t) {
		if (yx(e, !1)) throw Error(`Edge with name '${e}' was registered by anthor Node`);
		if (typeof t == "function") return t.config({ shape: e }), t;
		let n = Ax, { inherit: r = "edge" } = t, i = d(t, ["inherit"]);
		if (typeof r == "string") {
			let e = this.get(r || "edge");
			e == null && r ? this.onNotFound(r, "inherited") : n = e;
		} else n = r;
		i.constructorName ??= e;
		let a = n.define.call(n, i);
		return a.config({ shape: e }), a;
	}
}), Ax.defaults = {}, bx(Ax.registry), Ax.config({
	shape: Dx,
	propHooks(e) {
		let { label: t, vertices: n } = e, r = d(e, ["label", "vertices"]);
		if (t) {
			r.labels ??= [];
			let e = typeof t == "string" ? Ax.parseStringLabel(t) : t;
			r.labels.push(e);
		}
		return n && Array.isArray(n) && (r.vertices = n.map((e) => z.create(e).toJSON())), r;
	}
}), Ax.registry.register(Dx, Ax);
// node_modules/@antv/x6/es/model/collection.js
var jx = class extends Wm {
	constructor(e, t = {}) {
		super(), this.length = 0, this.comparator = t.comparator || "zIndex", this.clean(), e && this.reset(e, { silent: !0 });
	}
	toJSON() {
		return this.cells.map((e) => e.toJSON());
	}
	add(e, t, n) {
		let r, i;
		typeof t == "number" ? (r = t, i = Object.assign({ merge: !1 }, n)) : (r = this.length, i = Object.assign({ merge: !1 }, t)), r > this.length && (r = this.length), r < 0 && (r += this.length + 1);
		let a = Array.isArray(e) ? e : [e], o = this.comparator && typeof t != "number" && i.sort !== !1, s = this.comparator || null, c = !1, l = [], u = [];
		return a.forEach((e) => {
			let t = this.get(e);
			t ? i.merge && !e.isSameStore(t) && (t.setProp(e.getProp(), n), u.push(t), o && !c && (c = s == null || typeof s == "function" ? t.hasChanged() : typeof s == "string" ? t.hasChanged(s) : s.some((e) => t.hasChanged(e)))) : (l.push(e), this.reference(e));
		}), l.length && (o && (c = !0), this.cells.splice(r, 0, ...l), this.length = this.cells.length), c && this.sort({ silent: !0 }), i.silent || (l.forEach((e, t) => {
			let n = {
				cell: e,
				index: r + t,
				options: i
			};
			this.trigger("added", n), i.dryrun || e.notify("added", Object.assign({}, n));
		}), c && this.trigger("sorted"), (l.length || u.length) && this.trigger("updated", {
			added: l,
			merged: u,
			removed: [],
			options: i
		})), this;
	}
	remove(e, t = {}) {
		let n = Array.isArray(e) ? e : [e], r = this.removeCells(n, t);
		return !t.silent && r.length > 0 && this.trigger("updated", {
			options: t,
			removed: r,
			added: [],
			merged: []
		}), Array.isArray(e) ? r : r[0];
	}
	removeCells(e, t) {
		let n = [];
		for (let r = 0; r < e.length; r += 1) {
			let i = this.get(e[r]);
			if (i == null) continue;
			let a = this.cells.indexOf(i);
			this.cells.splice(a, 1), --this.length, delete this.map[i.id], n.push(i), this.unreference(i), t.silent || (this.trigger("removed", {
				cell: i,
				index: a,
				options: t
			}), t.dryrun || i.notify("removed", {
				cell: i,
				index: a,
				options: t
			})), t.dryrun || i.remove();
		}
		return n;
	}
	reset(e, t = {}) {
		let n = this.cells.slice();
		if (t.diff || (n.forEach((e) => {
			this.unreference(e), e.remove();
		}), this.clean()), this.add(e, Object.assign({ silent: !0 }, t)), !t.silent) {
			let e = this.cells.slice();
			this.trigger("reseted", {
				options: t,
				previous: n,
				current: e
			});
			let r = [], i = [];
			e.forEach((e) => {
				n.some((t) => t.id === e.id) || r.push(e);
			}), n.forEach((t) => {
				e.some((e) => e.id === t.id) || i.push(t);
			}), this.trigger("updated", {
				options: t,
				added: r,
				removed: i,
				merged: []
			});
		}
		return this;
	}
	push(e, t) {
		return this.add(e, this.length, t);
	}
	pop(e) {
		let t = this.at(this.length - 1);
		return t ? this.remove(t, e) : null;
	}
	unshift(e, t) {
		return this.add(e, 0, t);
	}
	shift(e) {
		let t = this.at(0);
		return t ? this.remove(t, e) : null;
	}
	get(e) {
		if (e == null) return null;
		let t = typeof e == "string" || typeof e == "number" ? e : e.id;
		return this.map[t] || null;
	}
	has(e) {
		return this.get(e) != null;
	}
	at(e) {
		return e < 0 && (e += this.length), this.cells[e] || null;
	}
	first() {
		return this.at(0);
	}
	last() {
		return this.at(-1);
	}
	indexOf(e) {
		return this.cells.indexOf(e);
	}
	toArray() {
		return this.cells.slice();
	}
	sort(e = {}) {
		return this.comparator != null && (this.cells = sl(this.cells, this.comparator), e.silent || this.trigger("sorted")), this;
	}
	clone() {
		let e = this.constructor;
		return new e(this.cells.slice(), { comparator: this.comparator });
	}
	reference(e) {
		this.map[e.id] = e, e.on("*", this.notifyCellEvent, this);
	}
	unreference(e) {
		e.off("*", this.notifyCellEvent, this), delete this.map[e.id];
	}
	notifyCellEvent(e, t) {
		let n = t.cell;
		this.trigger(`cell:${e}`, t), n && (n.isNode() ? this.trigger(`node:${e}`, Object.assign(Object.assign({}, t), { node: n })) : n.isEdge() && this.trigger(`edge:${e}`, Object.assign(Object.assign({}, t), { edge: n })));
	}
	clean() {
		this.length = 0, this.cells = [], this.map = {};
	}
	dispose() {
		this.reset([]);
	}
};
f([q()], jx.prototype, "dispose", null);
// node_modules/@antv/x6/es/model/model.js
var Mx = "X6.Model", Nx = class e extends Wm {
	static isModel(t) {
		if (t == null) return !1;
		if (t instanceof e) return !0;
		let n = t[Symbol.toStringTag], r = t;
		return !(n != null && n !== Mx || typeof r.addNode != "function" || typeof r.addEdge != "function" || r.collection == null);
	}
	static toJSON(e, t = {}) {
		return { cells: e.map((e) => e.toJSON(t)) };
	}
	static fromJSON(e) {
		let t = [];
		return Array.isArray(e) ? t.push(...e) : (e.cells && t.push(...e.cells), e.nodes && e.nodes.forEach((e) => {
			e.shape ??= "rect", t.push(e);
		}), e.edges && e.edges.forEach((e) => {
			e.shape ??= "edge", t.push(e);
		})), t.map((e) => {
			let t = e.shape;
			if (t) {
				if (Tx.registry.exist(t)) return Tx.create(e);
				if (Ax.registry.exist(t)) return Ax.create(e);
			}
			throw Error("The `shape` should be specified when creating a node/edge instance");
		});
	}
	constructor(e = []) {
		super(), this.batches = {}, this.addings = /* @__PURE__ */ new WeakMap(), this.nodes = {}, this.edges = {}, this.outgoings = {}, this.incomings = {}, this.collection = new jx(e), this.setup();
	}
	notify(e, t) {
		this.trigger(e, t);
		let n = this.graph;
		return n && (e === "sorted" || e === "reseted" || e === "updated" ? n.trigger(`model:${e}`, t) : n.trigger(e, t)), this;
	}
	setup() {
		let e = this.collection;
		e.on("sorted", () => this.notify("sorted", null)), e.on("updated", (e) => this.notify("updated", e)), e.on("cell:change:zIndex", () => this.sortOnChangeZ()), e.on("added", ({ cell: e }) => {
			this.onCellAdded(e);
		}), e.on("removed", (e) => {
			let t = e.cell;
			this.onCellRemoved(t, e.options), this.notify("cell:removed", e), t.isNode() ? this.notify("node:removed", Object.assign(Object.assign({}, e), { node: t })) : t.isEdge() && this.notify("edge:removed", Object.assign(Object.assign({}, e), { edge: t }));
		}), e.on("reseted", (e) => {
			this.onReset(e.current), this.notify("reseted", e);
		}), e.on("edge:change:source", ({ edge: e }) => this.onEdgeTerminalChanged(e, "source")), e.on("edge:change:target", ({ edge: e }) => {
			this.onEdgeTerminalChanged(e, "target");
		});
	}
	sortOnChangeZ() {
		this.collection.sort();
	}
	onCellAdded(e) {
		let t = e.id;
		e.isEdge() ? (e.updateParent(), this.edges[t] = !0, this.onEdgeTerminalChanged(e, "source"), this.onEdgeTerminalChanged(e, "target")) : this.nodes[t] = !0;
	}
	onCellRemoved(e, t) {
		let n = e.id;
		if (e.isEdge()) {
			delete this.edges[n];
			let t = e.getSource(), r = e.getTarget();
			if (t?.cell) {
				let e = this.outgoings[t.cell], r = e ? e.indexOf(n) : -1;
				r >= 0 && (e.splice(r, 1), e.length === 0 && delete this.outgoings[t.cell]);
			}
			if (r?.cell) {
				let e = this.incomings[r.cell], t = e ? e.indexOf(n) : -1;
				t >= 0 && (e.splice(t, 1), e.length === 0 && delete this.incomings[r.cell]);
			}
		} else delete this.nodes[n];
		t.clear || (t.disconnectEdges ? this.disconnectConnectedEdges(e, t) : this.removeConnectedEdges(e, t)), e.model === this && (e.model = null);
	}
	onReset(e) {
		this.nodes = {}, this.edges = {}, this.outgoings = {}, this.incomings = {}, e.forEach((e) => {
			this.onCellAdded(e);
		});
	}
	onEdgeTerminalChanged(e, t) {
		let n = t === "source" ? this.outgoings : this.incomings, r = e.previous(t);
		if (r?.cell) {
			let t = Y.isCell(r.cell) ? r.cell.id : r.cell, i = n[t], a = i ? i.indexOf(e.id) : -1;
			a >= 0 && (i.splice(a, 1), i.length === 0 && delete n[t]);
		}
		let i = e.getTerminal(t);
		if (i?.cell) {
			let t = Y.isCell(i.cell) ? i.cell.id : i.cell, r = n[t] || [];
			r.indexOf(e.id) === -1 && r.push(e.id), n[t] = r;
		}
	}
	prepareCell(e, t) {
		return e.model || t && t.dryrun || (e.model = this), e.zIndex ?? e.setZIndex(this.getMaxZIndex() + 1, { silent: !0 }), e;
	}
	resetCells(e, t = {}) {
		return e.map((e) => this.prepareCell(e, Object.assign(Object.assign({}, t), { dryrun: !0 }))), this.collection.reset(e, t), e.map((e) => this.prepareCell(e, { options: t })), this;
	}
	clear(e = {}) {
		let t = this.getCells();
		if (t.length === 0) return this;
		let n = Object.assign(Object.assign({}, e), { clear: !0 });
		return this.batchUpdate("clear", () => {
			let e = t.sort((e, t) => (e.isEdge() ? 1 : 2) - (t.isEdge() ? 1 : 2));
			for (; e.length > 0;) {
				let t = e.shift();
				t && t.remove(n);
			}
		}, n), this;
	}
	addNode(e, t = {}) {
		let n = Tx.isNode(e) ? e : this.createNode(e);
		return this.addCell(n, t), n;
	}
	updateNode(e, t = {}) {
		let n = this.createNode(e), r = n.getProp();
		return n.dispose(), this.updateCell(r, t);
	}
	createNode(e) {
		return Tx.create(e);
	}
	addEdge(e, t = {}) {
		let n = Ax.isEdge(e) ? e : this.createEdge(e);
		return this.addCell(n, t), n;
	}
	createEdge(e) {
		return Ax.create(e);
	}
	updateEdge(e, t = {}) {
		let n = this.createEdge(e), r = n.getProp();
		return n.dispose(), this.updateCell(r, t);
	}
	addCell(e, t = {}) {
		return Array.isArray(e) ? this.addCells(e, t) : (!this.collection.has(e) && !this.addings.has(e) && (this.addings.set(e, !0), this.collection.add(this.prepareCell(e, t), t), e.eachChild((e) => this.addCell(e, t)), this.addings.delete(e)), this);
	}
	addCells(e, t = {}) {
		let n = e.length;
		if (n === 0) return this;
		let r = Object.assign(Object.assign({}, t), {
			position: n - 1,
			maxPosition: n - 1
		});
		return this.startBatch("add", Object.assign(Object.assign({}, r), { cells: e })), e.forEach((e) => {
			this.addCell(e, r), --r.position;
		}), this.stopBatch("add", Object.assign(Object.assign({}, r), { cells: e })), this;
	}
	updateCell(e, t = {}) {
		let n = e.id && this.getCell(e.id);
		return n ? this.batchUpdate("update", () => (Object.entries(e).forEach(([e, r]) => {
			n.setProp(e, r, t);
		}), !0), e) : !1;
	}
	removeCell(e, t = {}) {
		let n = typeof e == "string" ? this.getCell(e) : e;
		return n && this.has(n) ? this.collection.remove(n, t) : null;
	}
	updateCellId(e, t) {
		if (e.id === t) return;
		this.startBatch("update", { id: t }), e.prop("id", t);
		let n = e.clone({ keepId: !0 });
		return this.addCell(n), this.getConnectedEdges(e).forEach((n) => {
			let r = n.getSourceCell(), i = n.getTargetCell();
			r === e && n.setSource(Object.assign(Object.assign({}, n.getSource()), { cell: t })), i === e && n.setTarget(Object.assign(Object.assign({}, n.getTarget()), { cell: t }));
		}), this.removeCell(e), this.stopBatch("update", { id: t }), n;
	}
	removeCells(e, t = {}) {
		return e.length ? this.batchUpdate("remove", () => e.map((e) => this.removeCell(e, t))) : [];
	}
	removeConnectedEdges(e, t = {}) {
		let n = this.getConnectedEdges(e);
		return n.forEach((e) => {
			e.remove(t);
		}), n;
	}
	disconnectConnectedEdges(e, t = {}) {
		let n = typeof e == "string" ? e : e.id;
		this.getConnectedEdges(e).forEach((e) => {
			let r = e.getSourceCellId(), i = e.getTargetCellId();
			r === n && e.setSource({
				x: 0,
				y: 0
			}, t), i === n && e.setTarget({
				x: 0,
				y: 0
			}, t);
		});
	}
	has(e) {
		return this.collection.has(e);
	}
	total() {
		return this.collection.length;
	}
	indexOf(e) {
		return this.collection.indexOf(e);
	}
	getCell(e) {
		return this.collection.get(e);
	}
	getCells() {
		return this.collection.toArray();
	}
	getFirstCell() {
		return this.collection.first();
	}
	getLastCell() {
		return this.collection.last();
	}
	getMinZIndex() {
		let e = this.collection.first();
		return e && e.getZIndex() || 0;
	}
	getMaxZIndex() {
		let e = this.collection.last();
		return e && e.getZIndex() || 0;
	}
	getCellsFromCache(e) {
		return e ? Object.keys(e).map((e) => this.getCell(e)).filter((e) => e != null) : [];
	}
	getNodes() {
		return this.getCellsFromCache(this.nodes);
	}
	getEdges() {
		return this.getCellsFromCache(this.edges);
	}
	getOutgoingEdges(e) {
		let t = typeof e == "string" ? e : e.id, n = this.outgoings[t];
		return n ? n.map((e) => this.getCell(e)).filter((e) => e?.isEdge()) : null;
	}
	getIncomingEdges(e) {
		let t = typeof e == "string" ? e : e.id, n = this.incomings[t];
		return n ? n.map((e) => this.getCell(e)).filter((e) => e?.isEdge()) : null;
	}
	getConnectedEdges(e, t = {}) {
		let n = [], r = typeof e == "string" ? this.getCell(e) : e;
		if (r == null) return n;
		let i = {}, a = t.indirect, o = t.incoming, s = t.outgoing;
		o == null && s == null && (o = s = !0);
		let c = (e, t) => {
			if ((t ? this.getOutgoingEdges(e) : this.getIncomingEdges(e))?.forEach((e) => {
				i[e.id] || (n.push(e), i[e.id] = !0, a && (o && c(e, !1), s && c(e, !0)));
			}), a && e.isEdge()) {
				let r = t ? e.getTargetCell() : e.getSourceCell();
				r?.isEdge() && (i[r.id] || (n.push(r), c(r, t)));
			}
		};
		if (s && c(r, !0), o && c(r, !1), t.deep) {
			let e = r.getDescendants({ deep: !0 }), a = {};
			e.forEach((e) => {
				e.isNode() && (a[e.id] = !0);
			});
			let c = (e, r) => {
				(r ? this.getOutgoingEdges(e.id) : this.getIncomingEdges(e.id))?.forEach((e) => {
					if (!i[e.id]) {
						let r = e.getSourceCell(), o = e.getTargetCell();
						if (!t.enclosed && r && a[r.id] && o && a[o.id]) return;
						n.push(e), i[e.id] = !0;
					}
				});
			};
			e.forEach((e) => {
				e.isEdge() || (s && c(e, !0), o && c(e, !1));
			});
		}
		return n;
	}
	isBoundary(e, t) {
		let n = typeof e == "string" ? this.getCell(e) : e, r = t ? this.getIncomingEdges(n) : this.getOutgoingEdges(n);
		return r == null || r.length === 0;
	}
	getBoundaryNodes(e) {
		let t = [];
		return Object.keys(this.nodes).forEach((n) => {
			if (this.isBoundary(n, e)) {
				let e = this.getCell(n);
				e && t.push(e);
			}
		}), t;
	}
	getRoots() {
		return this.getBoundaryNodes(!0);
	}
	getLeafs() {
		return this.getBoundaryNodes(!1);
	}
	isRoot(e) {
		return this.isBoundary(e, !0);
	}
	isLeaf(e) {
		return this.isBoundary(e, !1);
	}
	getNeighbors(e, t = {}) {
		let n = t.incoming, r = t.outgoing;
		n == null && r == null && (n = r = !0);
		let i = this.getConnectedEdges(e, t).reduce((i, a) => {
			let o = a.hasLoop(t), s = a.getSourceCell(), c = a.getTargetCell();
			return n && s && s.isNode() && !i[s.id] && (!o && (s === e || t.deep && s.isDescendantOf(e)) || (i[s.id] = s)), r && c && c.isNode() && !i[c.id] && (!o && (c === e || t.deep && c.isDescendantOf(e)) || (i[c.id] = c)), i;
		}, {});
		if (e.isEdge()) {
			if (n) {
				let t = e.getSourceCell();
				t?.isNode() && !i[t.id] && (i[t.id] = t);
			}
			if (r) {
				let t = e.getTargetCell();
				t?.isNode() && !i[t.id] && (i[t.id] = t);
			}
		}
		return Object.keys(i).map((e) => i[e]);
	}
	isNeighbor(e, t, n = {}) {
		let r = n.incoming, i = n.outgoing;
		return r == null && i == null && (r = i = !0), this.getConnectedEdges(e, n).some((e) => {
			let n = e.getSourceCell(), a = e.getTargetCell();
			return !!(r && n && n.id === t.id || i && a && a.id === t.id);
		});
	}
	getSuccessors(e, t = {}) {
		let n = [];
		return this.search(e, (r, i) => {
			r !== e && this.matchDistance(i, t.distance) && n.push(r);
		}, Object.assign(Object.assign({}, t), { outgoing: !0 })), n;
	}
	isSuccessor(e, t, n = {}) {
		let r = !1;
		return this.search(e, (i, a) => {
			if (i === t && i !== e && this.matchDistance(a, n.distance)) return r = !0, !1;
		}, Object.assign(Object.assign({}, n), { outgoing: !0 })), r;
	}
	getPredecessors(e, t = {}) {
		let n = [];
		return this.search(e, (r, i) => {
			r !== e && this.matchDistance(i, t.distance) && n.push(r);
		}, Object.assign(Object.assign({}, t), { incoming: !0 })), n;
	}
	isPredecessor(e, t, n = {}) {
		let r = !1;
		return this.search(e, (i, a) => {
			if (i === t && i !== e && this.matchDistance(a, n.distance)) return r = !0, !1;
		}, Object.assign(Object.assign({}, n), { incoming: !0 })), r;
	}
	matchDistance(e, t) {
		return t == null ? !0 : typeof t == "function" ? t(e) : Array.isArray(t) && t.includes(e) ? !0 : e === t;
	}
	getCommonAncestor(...e) {
		let t = [];
		return e.forEach((e) => {
			e && (Array.isArray(e) ? t.push(...e) : t.push(e));
		}), Y.getCommonAncestor(...t);
	}
	getSubGraph(e, t = {}) {
		let n = [], r = {}, i = [], a = [], o = (e) => {
			r[e.id] || (n.push(e), r[e.id] = e, e.isEdge() && a.push(e), e.isNode() && i.push(e));
		};
		return e.forEach((e) => {
			o(e), t.deep && e.getDescendants({ deep: !0 }).forEach((e) => {
				o(e);
			});
		}), a.forEach((e) => {
			let t = e.getSourceCell(), a = e.getTargetCell();
			t && !r[t.id] && (n.push(t), r[t.id] = t, t.isNode() && i.push(t)), a && !r[a.id] && (n.push(a), r[a.id] = a, a.isNode() && i.push(a));
		}), i.forEach((e) => {
			this.getConnectedEdges(e, t).forEach((e) => {
				let t = e.getSourceCell(), i = e.getTargetCell();
				!r[e.id] && t && r[t.id] && i && r[i.id] && (n.push(e), r[e.id] = e);
			});
		}), n;
	}
	cloneSubGraph(e, t = {}) {
		let n = this.getSubGraph(e, t);
		return this.cloneCells(n);
	}
	cloneCells(e) {
		return Y.cloneCells(e);
	}
	getNodesFromPoint(e, t) {
		let n = typeof e == "number" ? {
			x: e,
			y: t || 0
		} : e;
		return this.getNodes().filter((e) => e.getBBox().containsPoint(n));
	}
	getNodesInArea(e, t, n, r, i) {
		let a = typeof e == "number" ? new B(e, t, n, r) : B.create(e), o = (typeof e == "number" ? i : t)?.strict;
		return this.getNodes().filter((e) => {
			let t = e.angle(), n = e.getBBox().bbox(t);
			return o ? a.containsRect(n) : a.isIntersectWithRect(n);
		});
	}
	getEdgesInArea(e, t, n, r, i) {
		let a = typeof e == "number" ? new B(e, t, n, r) : B.create(e), o = (typeof e == "number" ? i : t)?.strict;
		return this.getEdges().filter((e) => {
			let t = e.getBBox();
			return t.width === 0 ? t.inflate(1, 0) : t.height === 0 && t.inflate(0, 1), o ? a.containsRect(t) : a.isIntersectWithRect(t);
		});
	}
	getNodesUnderNode(e, t = {}) {
		let n = e.getBBox();
		return (t.by == null || t.by === "bbox" ? this.getNodesInArea(n) : this.getNodesFromPoint(n[t.by])).filter((t) => e.id !== t.id && !t.isDescendantOf(e));
	}
	getAllCellsBBox() {
		return this.getCellsBBox(this.getCells());
	}
	getCellsBBox(e, t = {}) {
		return Y.getCellsBBox(e, t);
	}
	search(e, t, n = {}) {
		n.breadthFirst ? this.breadthFirstSearch(e, t, n) : this.depthFirstSearch(e, t, n);
	}
	breadthFirstSearch(e, t, n = {}) {
		let r = [], i = {}, a = {};
		for (r.push(e), a[e.id] = 0; r.length > 0;) {
			let e = r.shift();
			e == null || i[e.id] || (i[e.id] = !0, R(t, this, e, a[e.id]) !== !1 && this.getNeighbors(e, n).forEach((t) => {
				a[t.id] = a[e.id] + 1, r.push(t);
			}));
		}
	}
	depthFirstSearch(e, t, n = {}) {
		let r = [], i = {}, a = {};
		for (r.push(e), a[e.id] = 0; r.length > 0;) {
			let e = r.pop();
			if (e == null || i[e.id] || (i[e.id] = !0, R(t, this, e, a[e.id]) === !1)) continue;
			let o = this.getNeighbors(e, n), s = r.length;
			o.forEach((t) => {
				a[t.id] = a[e.id] + 1, r.splice(s, 0, t);
			});
		}
	}
	getShortestPath(e, t, n = {}) {
		let r = {};
		this.getEdges().forEach((e) => {
			let t = e.getSourceCellId(), i = e.getTargetCellId();
			t && i && (r[t] || (r[t] = []), r[i] || (r[i] = []), r[t].push(i), n.directed || r[i].push(t));
		});
		let i = Zp(r, typeof e == "string" ? e : e.id, n.weight), a = [], o = typeof t == "string" ? t : t.id;
		for (i[o] && a.push(o); i[o];) {
			let e = i[o];
			a.unshift(e), o = e;
		}
		return a;
	}
	translate(e, t, n) {
		return this.getCells().filter((e) => !e.hasParent()).forEach((r) => {
			r.translate(e, t, n);
		}), this;
	}
	resize(e, t, n) {
		return this.resizeCells(e, t, this.getCells(), n);
	}
	resizeCells(e, t, n, r = {}) {
		let i = this.getCellsBBox(n);
		if (i) {
			let a = Math.max(e / i.width, 0), o = Math.max(t / i.height, 0), s = i.getOrigin();
			n.forEach((e) => {
				e.scale(a, o, s, r);
			});
		}
		return this;
	}
	toJSON(t = {}) {
		return e.toJSON(this.getCells(), t);
	}
	parseJSON(t) {
		return e.fromJSON(t);
	}
	fromJSON(e, t = {}) {
		let n = [];
		if (!t.diff) n = this.parseJSON(e);
		else {
			let t = e, { nodes: r = [], edges: i = [] } = t, a = d(t, ["nodes", "edges"]), o = r.filter((e) => !this.nodes[e.id]) || [], s = i.filter((e) => !this.edges[e.id]) || [];
			n = this.parseJSON(Object.assign(Object.assign({}, a), {
				nodes: o,
				edges: s
			}));
		}
		return this.resetCells(n, t), this;
	}
	startBatch(e, t = {}) {
		return this.batches[e] = (this.batches[e] || 0) + 1, this.notify("batch:start", {
			name: e,
			data: t
		}), this;
	}
	stopBatch(e, t = {}) {
		return this.batches[e] = (this.batches[e] || 0) - 1, this.notify("batch:stop", {
			name: e,
			data: t
		}), this;
	}
	batchUpdate(e, t, n = {}) {
		this.startBatch(e, n);
		let r = t();
		return this.stopBatch(e, n), r;
	}
	hasActiveBatch(e = Object.keys(this.batches)) {
		return (Array.isArray(e) ? e : [e]).some((e) => this.batches[e] > 0);
	}
	dispose() {
		this.collection.dispose();
	}
};
f([q()], Nx.prototype, "dispose", null);
// node_modules/@antv/x6/es/shape/base.js
var Px = {
	fill: "#ffffff",
	stroke: "#333333",
	strokeWidth: 2
}, Fx = {
	fontSize: 14,
	fill: "#000000",
	refX: .5,
	refY: .5,
	textAnchor: "middle",
	textVerticalAnchor: "middle",
	fontFamily: "Arial, helvetica, sans-serif"
}, Ix = class extends Tx {
	get label() {
		return this.getLabel();
	}
	set label(e) {
		this.setLabel(e);
	}
	getLabel() {
		return this.getAttrByPath("text/text");
	}
	setLabel(e, t) {
		return e == null ? this.removeLabel() : this.setAttrByPath("text/text", e, t), this;
	}
	removeLabel() {
		return this.removeAttrByPath("text/text"), this;
	}
};
Ix.config({
	attrs: { text: Object.assign({}, Fx) },
	propHooks(e) {
		let { label: t } = e, n = d(e, ["label"]);
		return t != null && af(n, "attrs/text/text", t), n;
	},
	visible: !0
});
// node_modules/@antv/x6/es/shape/util.js
function Lx(e, t = "body") {
	return [{
		tagName: e,
		selector: t
	}, {
		tagName: "text",
		selector: "label"
	}];
}
function Rx(e = "xlink:href") {
	return (t) => {
		let { imageUrl: n, imageWidth: r, imageHeight: i } = t, a = d(t, [
			"imageUrl",
			"imageWidth",
			"imageHeight"
		]);
		if (n != null || r != null || i != null) {
			let t = () => {
				if (a.attrs) {
					let t = a.attrs.image;
					n != null && (t[e] = n), r != null && (t.width = r), i != null && (t.height = i), a.attrs.image = t;
				}
			};
			a.attrs ? (a.attrs.image ?? (a.attrs.image = {}), t()) : (a.attrs = { image: {} }, t());
		}
		return a;
	};
}
function zx(e, t, n = {}) {
	let r = {
		constructorName: e,
		markup: Lx(e, n.selector),
		attrs: { [e]: Object.assign({}, Px) }
	};
	return (n.parent || Ix).define(Qc(r, t, { shape: e }));
}
function Bx(e) {
	return typeof e == "string" ? e : e.map((e) => Array.isArray(e) ? e.join(",") : z.isPointLike(e) ? `${e.x}, ${e.y}` : "").join(" ");
}
zx("circle", { attrs: { body: {
	refCx: "50%",
	refCy: "50%",
	refR: "50%"
} } });
// node_modules/@antv/x6/es/shape/edge.js
var Vx = Ax.define({
	shape: "edge",
	markup: [{
		tagName: "path",
		selector: "wrap",
		groupSelector: "lines",
		attrs: {
			fill: "none",
			cursor: "pointer",
			stroke: "transparent",
			strokeLinecap: "round"
		}
	}, {
		tagName: "path",
		selector: "line",
		groupSelector: "lines",
		attrs: {
			fill: "none",
			pointerEvents: "none"
		}
	}],
	attrs: {
		lines: {
			connection: !0,
			strokeLinejoin: "round"
		},
		wrap: { strokeWidth: 10 },
		line: {
			stroke: "#333",
			strokeWidth: 2,
			targetMarker: "classic"
		}
	}
});
zx("ellipse", { attrs: { body: {
	refCx: "50%",
	refCy: "50%",
	refRx: "50%",
	refRy: "50%"
} } });
// node_modules/@antv/x6/es/graph/base.js
var Hx = class extends Um {
	get options() {
		return this.graph.options;
	}
	get model() {
		return this.graph.model;
	}
	get view() {
		return this.graph.view;
	}
	constructor(e) {
		super(), this.graph = e, this.init();
	}
	init() {}
}, Ux = {
	mousemove: "onMouseMove",
	touchmove: "onMouseMove",
	mouseup: "onMouseUp",
	touchend: "onMouseUp",
	touchcancel: "onDragEnd"
}, Wx = 1 << 30, Gx = class e extends Db {
	constructor() {
		super(...arguments), this.portsCache = {};
	}
	static isNodeView(t) {
		if (t == null) return !1;
		if (t instanceof e) return !0;
		let n = t[Symbol.toStringTag], r = t;
		return !(n != null && n !== Kx || typeof r.isNodeView != "function" || typeof r.isEdgeView != "function" || typeof r.confirmUpdate != "function" || typeof r.update != "function" || typeof r.findPortElem != "function" || typeof r.resize != "function" || typeof r.rotate != "function" || typeof r.translate != "function");
	}
	get [Symbol.toStringTag]() {
		return Kx;
	}
	getContainerClassName() {
		let e = [super.getContainerClassName(), this.prefixClassName("node")];
		return this.can("nodeMovable") || e.push(this.prefixClassName("node-immovable")), e.join(" ");
	}
	updateClassName(e) {
		let t = e.target;
		if (t.hasAttribute("magnet")) {
			let e = this.prefixClassName("port-unconnectable");
			this.can("magnetConnectable") ? Vu(t, e) : U(t, e);
		} else {
			let e = this.prefixClassName("node-immovable");
			this.can("nodeMovable") ? this.removeClass(e) : this.addClass(e);
		}
	}
	isNodeView() {
		return !0;
	}
	confirmUpdate(e, t = {}) {
		let n = e, r = this.hasAction(e, [
			"resize",
			"translate",
			"rotate"
		]);
		return this.hasAction(n, "ports") && (this.removePorts(), this.cleanPortsCache()), this.hasAction(n, "render") ? (this.render(), n = this.removeAction(n, [
			"render",
			"update",
			"resize",
			"translate",
			"rotate",
			"ports",
			"tools"
		])) : (n = this.handleAction(n, "resize", () => this.resize(), "update"), n = this.handleAction(n, "update", () => this.update(), J.useCSSSelector ? "ports" : null), n = this.handleAction(n, "translate", () => this.translate()), n = this.handleAction(n, "rotate", () => this.rotate()), n = this.handleAction(n, "ports", () => this.renderPorts()), n = this.handleAction(n, "tools", () => {
			let e = this.cell.getTools() != null;
			!r || this.tools == null || !e ? this.renderTools() : this.updateTools(t);
		})), n;
	}
	update(e) {
		this.cleanCache(), J.useCSSSelector && this.removePorts();
		let t = this.cell, n = t.getSize(), r = t.getAttrs();
		this.updateAttrs(this.container, r, {
			attrs: e === r ? null : e,
			rootBBox: new B(0, 0, n.width, n.height),
			selectors: this.selectors
		}), J.useCSSSelector && this.renderPorts();
	}
	renderMarkup() {
		let e = this.cell.markup;
		if (e) {
			if (typeof e == "string") throw TypeError("Not support string markup.");
			return this.renderJSONMarkup(e);
		}
		throw TypeError("Invalid node markup.");
	}
	renderJSONMarkup(e) {
		let t = this.parseJSONMarkup(e, this.container);
		this.selectors = t.selectors, this.container.appendChild(t.fragment);
	}
	render() {
		return this.empty(), this.renderMarkup(), this.resize(), this.updateTransform(), J.useCSSSelector || this.renderPorts(), this.renderTools(), this.notify("view:render", { view: this }), this;
	}
	resize() {
		this.cell.getAngle() && this.rotate(), this.update();
	}
	translate() {
		this.updateTransform();
	}
	rotate() {
		this.updateTransform();
	}
	getTranslationString() {
		let e = this.cell.getPosition();
		return `translate(${e.x},${e.y})`;
	}
	getRotationString() {
		let e = this.cell.getAngle();
		if (e) {
			let t = this.cell.getSize();
			return `rotate(${e},${t.width / 2},${t.height / 2})`;
		}
	}
	updateTransform() {
		let e = this.getTranslationString(), t = this.getRotationString();
		t && (e += ` ${t}`), this.container.setAttribute("transform", e);
	}
	findPortElem(e, t) {
		let n = e ? this.portsCache[e] : null;
		if (!n) return null;
		let r = n.portContentElement, i = n.portContentSelectors || {};
		return this.findOne(t, r, i);
	}
	cleanPortsCache() {
		this.portsCache = {};
	}
	removePorts() {
		Object.values(this.portsCache).forEach((e) => {
			ad(e.portElement);
		});
	}
	renderPorts() {
		let e = this.container, t = [];
		e.childNodes.forEach((e) => {
			t.push(e);
		});
		let n = Lc(this.cell.getParsedPorts(), "zIndex"), r = "auto";
		n[r] && n[r].forEach((n) => {
			let r = this.getPortElement(n);
			e.append(r), t.push(r);
		}), Object.keys(n).forEach((e) => {
			if (e !== r) {
				let r = parseInt(e, 10);
				this.appendPorts(n[e], r, t);
			}
		}), this.updatePorts(), this.cleanCache(), this.updateConnectedEdges();
	}
	updateConnectedEdges() {
		let e = this.graph, t = this.cell, n = e.model.getConnectedEdges(t);
		for (let r = 0, i = n.length; r < i; r += 1) {
			let i = n[r], a = i.findView(e);
			if (!a || !e.renderer.isViewMounted(a)) continue;
			let o = ["update"];
			i.getSourceCell() === t && o.push("source"), i.getTargetCell() === t && o.push("target"), e.renderer.requestViewUpdate(a, a.getFlag(o));
		}
	}
	appendPorts(e, t, n) {
		let r = e.map((e) => this.getPortElement(e));
		n[t] || t < 0 ? ld(n[Math.max(t, 0)], r) : sd(this.container, r);
	}
	getPortElement(e) {
		let t = this.portsCache[e.id];
		return t ? t.portElement : this.createPortElement(e);
	}
	createPortElement(e) {
		let t = fb.renderMarkup(this.cell.getPortContainerMarkup()), n = t.elem;
		if (n == null) throw Error("Invalid port container markup.");
		t = fb.renderMarkup(this.getPortMarkup(e));
		let r = t.elem, i = t.selectors;
		if (r == null) throw Error("Invalid port markup.");
		this.setAttrs({
			port: e.id,
			"port-group": e.group
		}, r);
		let a = "x6-port";
		e.group && (a += ` x6-port-${e.group}`), U(n, a), U(n, "x6-port"), U(r, "x6-port-body"), n.appendChild(r);
		let o = i, s, c;
		if (this.existPortLabel(e)) {
			if (t = fb.renderMarkup(this.getPortLabelMarkup(e.label)), s = t.elem, c = t.selectors, s == null) throw Error("Invalid port label markup.");
			if (i && c) {
				for (let e in c) if (i[e] && e !== this.rootSelector) throw Error("Selectors within port must be unique.");
				o = Object.assign(Object.assign({}, i), c);
			}
			U(s, "x6-port-label"), n.appendChild(s);
		}
		return this.portsCache[e.id] = {
			portElement: n,
			portSelectors: o,
			portLabelElement: s,
			portLabelSelectors: c,
			portContentElement: r,
			portContentSelectors: i
		}, this.graph.options.onPortRendered && this.graph.options.onPortRendered({
			port: e,
			node: this.cell,
			container: n,
			selectors: o,
			labelContainer: s,
			labelSelectors: c,
			contentContainer: r,
			contentSelectors: i
		}), n;
	}
	updatePorts() {
		let e = this.cell.getParsedGroups(), t = Object.keys(e);
		t.length === 0 ? this.updatePortGroup() : t.forEach((e) => {
			this.updatePortGroup(e);
		});
	}
	updatePortGroup(e) {
		let t = B.fromSize(this.cell.getSize()), n = this.cell.getPortsLayoutByGroup(e, t);
		for (let e = 0, t = n.length; e < t; e += 1) {
			let t = n[e], r = t.portId, i = this.portsCache[r] || {}, a = t.portLayout;
			if (this.applyPortTransform(i.portElement, a), t.portAttrs != null) {
				let e = { selectors: i.portSelectors || {} };
				t.portSize && (e.rootBBox = B.fromSize(t.portSize)), this.updateAttrs(i.portElement, t.portAttrs, e);
			}
			let o = t.labelLayout;
			if (o && i.portLabelElement && (this.applyPortTransform(i.portLabelElement, o, -(a.angle || 0)), o.attrs)) {
				let e = { selectors: i.portLabelSelectors || {} };
				t.labelSize && (e.rootBBox = B.fromSize(t.labelSize)), this.updateAttrs(i.portLabelElement, o.attrs, e);
			}
		}
	}
	applyPortTransform(e, t, n = 0) {
		let r = t.angle, i = t.position;
		Jf(e, Rf().rotate(n).translate(i.x || 0, i.y || 0).rotate(r || 0), { absolute: !0 });
	}
	getPortMarkup(e) {
		return e.markup || this.cell.portMarkup;
	}
	getPortLabelMarkup(e) {
		return e.markup || this.cell.portLabelMarkup;
	}
	existPortLabel(e) {
		return e.attrs && e.attrs.text;
	}
	getEventArgs(e, t, n) {
		let r = this, i = r.cell, a = i;
		return t == null || n == null ? {
			e,
			view: r,
			node: i,
			cell: a
		} : {
			e,
			x: t,
			y: n,
			view: r,
			node: i,
			cell: a
		};
	}
	getPortEventArgs(e, t, n) {
		let r = this, i = r.cell, a = i;
		return n ? {
			e,
			x: n.x,
			y: n.y,
			view: r,
			node: i,
			cell: a,
			port: t
		} : {
			e,
			view: r,
			node: i,
			cell: a,
			port: t
		};
	}
	notifyMouseDown(e, t, n) {
		super.onMouseDown(e, t, n), this.notify("node:mousedown", this.getEventArgs(e, t, n));
	}
	notifyMouseMove(e, t, n) {
		super.onMouseMove(e, t, n), this.notify("node:mousemove", this.getEventArgs(e, t, n));
	}
	notifyMouseUp(e, t, n) {
		super.onMouseUp(e, t, n), this.notify("node:mouseup", this.getEventArgs(e, t, n));
	}
	notifyPortEvent(e, t, n) {
		let r = this.findAttr("port", t.target);
		if (r) {
			let i = t.type;
			e === "node:port:mouseenter" ? t.type = "mouseenter" : e === "node:port:mouseleave" && (t.type = "mouseleave"), this.notify(e, this.getPortEventArgs(t, r, n)), t.type = i;
		}
	}
	onClick(e, t, n) {
		super.onClick(e, t, n), this.notify("node:click", this.getEventArgs(e, t, n)), this.notifyPortEvent("node:port:click", e, {
			x: t,
			y: n
		});
	}
	onDblClick(e, t, n) {
		super.onDblClick(e, t, n), this.notify("node:dblclick", this.getEventArgs(e, t, n)), this.notifyPortEvent("node:port:dblclick", e, {
			x: t,
			y: n
		});
	}
	onContextMenu(e, t, n) {
		super.onContextMenu(e, t, n), this.notify("node:contextmenu", this.getEventArgs(e, t, n)), this.notifyPortEvent("node:port:contextmenu", e, {
			x: t,
			y: n
		});
	}
	onMouseDown(e, t, n) {
		this.isPropagationStopped(e) || (this.notifyMouseDown(e, t, n), this.notifyPortEvent("node:port:mousedown", e, {
			x: t,
			y: n
		}), this.startNodeDragging(e, t, n));
	}
	onMouseMove(e, t, n) {
		let r = this.getEventData(e), i = r.action;
		if (i === "magnet") this.dragMagnet(e, t, n);
		else {
			if (i === "move") {
				let i = r.targetView || this;
				i.dragNode(e, t, n), i.notify("node:moving", {
					e,
					x: t,
					y: n,
					view: i,
					cell: i.cell,
					node: i.cell
				});
			}
			this.notifyMouseMove(e, t, n), this.notifyPortEvent("node:port:mousemove", e, {
				x: t,
				y: n
			});
		}
		this.setEventData(e, r);
	}
	onMouseUp(e, t, n) {
		let r = this.getEventData(e), i = r.action;
		i === "magnet" ? this.stopMagnetDragging(e, t, n) : (this.notifyMouseUp(e, t, n), this.notifyPortEvent("node:port:mouseup", e, {
			x: t,
			y: n
		}), i === "move" && (r.targetView || this).stopNodeDragging(e, t, n));
		let a = r.targetMagnet;
		a && this.onMagnetClick(e, a, t, n), this.checkMouseleave(e);
	}
	onMouseOver(e) {
		super.onMouseOver(e), this.notify("node:mouseover", this.getEventArgs(e)), this.notifyPortEvent("node:port:mouseenter", e), this.notifyPortEvent("node:port:mouseover", e);
	}
	onMouseOut(e) {
		super.onMouseOut(e), this.notify("node:mouseout", this.getEventArgs(e)), this.notifyPortEvent("node:port:mouseleave", e), this.notifyPortEvent("node:port:mouseout", e);
	}
	onMouseEnter(e) {
		this.updateClassName(e), super.onMouseEnter(e), this.notify("node:mouseenter", this.getEventArgs(e));
	}
	onMouseLeave(e) {
		super.onMouseLeave(e), this.notify("node:mouseleave", this.getEventArgs(e));
	}
	onMouseWheel(e, t, n, r) {
		super.onMouseWheel(e, t, n, r), this.notify("node:mousewheel", Object.assign({ delta: r }, this.getEventArgs(e, t, n)));
	}
	onMagnetClick(e, t, n, r) {
		let i = this.graph;
		i.view.getMouseMovedCount(e) > i.options.clickThreshold || this.notify("node:magnet:click", Object.assign({ magnet: t }, this.getEventArgs(e, n, r)));
	}
	onMagnetDblClick(e, t, n, r) {
		this.notify("node:magnet:dblclick", Object.assign({ magnet: t }, this.getEventArgs(e, n, r)));
	}
	onMagnetContextMenu(e, t, n, r) {
		this.notify("node:magnet:contextmenu", Object.assign({ magnet: t }, this.getEventArgs(e, n, r)));
	}
	onMagnetMouseDown(e, t, n, r) {
		this.startMagnetDragging(e, n, r);
	}
	onCustomEvent(e, t, n, r) {
		this.notify("node:customevent", Object.assign({ name: t }, this.getEventArgs(e, n, r))), super.onCustomEvent(e, t, n, r);
	}
	prepareEmbedding(e) {
		let t = this.graph, n = this.getEventData(e).cell || this.cell, r = t.findViewByCell(n), i = t.snapToGrid(e.clientX, e.clientY);
		this.notify("node:embed", {
			e,
			node: n,
			view: r,
			cell: n,
			x: i.x,
			y: i.y,
			currentParent: n.getParent()
		});
	}
	processEmbedding(e, t) {
		let n = t.cell || this.cell, r = t.graph || this.graph, i = r.options.embedding, a = i.findParent, o = typeof a == "function" ? R(a, r, {
			view: this,
			node: this.cell
		}).filter((e) => Y.isCell(e) && this.cell.id !== e.id && !e.isDescendantOf(this.cell)) : r.model.getNodesUnderNode(n, { by: a });
		if (i.frontOnly && o.length > 0) {
			let e = Lc(o, "zIndex"), t = Zc(Object.keys(e).map((e) => parseInt(e, 10)));
			t && (o = e[t]);
		}
		o = o.filter((e) => e.visible);
		let s = null, c = t.candidateEmbedView, l = i.validate;
		for (let e = o.length - 1; e >= 0; --e) {
			let t = o[e];
			if (c && c.cell.id === t.id) {
				s = c;
				break;
			}
			{
				let e = t.findView(r);
				if (l && R(l, r, {
					child: this.cell,
					parent: e.cell,
					childView: this,
					parentView: e
				})) {
					s = e;
					break;
				}
			}
		}
		this.clearEmbedding(t), s && s.highlight(null, { type: "embedding" }), t.candidateEmbedView = s;
		let u = r.snapToGrid(e.clientX, e.clientY);
		this.notify("node:embedding", {
			e,
			cell: n,
			node: n,
			view: r.findViewByCell(n),
			x: u.x,
			y: u.y,
			currentParent: n.getParent(),
			candidateParent: s ? s.cell : null
		});
	}
	clearEmbedding(e) {
		let t = e.candidateEmbedView;
		t && (t.unhighlight(null, { type: "embedding" }), e.candidateEmbedView = null);
	}
	finalizeEmbedding(e, t) {
		this.graph.startBatch("embedding");
		let n = t.cell || this.cell, r = t.graph || this.graph, i = r.findViewByCell(n), a = n.getParent(), o = t.candidateEmbedView;
		if (o ? (o.unhighlight(null, { type: "embedding" }), t.candidateEmbedView = null, (a == null || a.id !== o.cell.id) && o.cell.insertChild(n, void 0, { ui: !0 })) : a && a.unembed(n, { ui: !0 }), r.model.getConnectedEdges(n, { deep: !0 }).forEach((e) => {
			e.updateParent({ ui: !0 });
		}), i && o) {
			let t = r.snapToGrid(e.clientX, e.clientY);
			i.notify("node:embedded", {
				e,
				cell: n,
				x: t.x,
				y: t.y,
				node: n,
				view: r.findViewByCell(n),
				previousParent: a,
				currentParent: n.getParent()
			});
		}
		this.graph.stopBatch("embedding");
	}
	getDelegatedView() {
		let e = this.cell, t = this;
		for (; t && !e.isEdge();) {
			if (!e.hasParent() || t.can("stopDelegateOnDragging")) return t;
			e = e.getParent(), t = this.graph.findViewByCell(e);
		}
		return null;
	}
	validateMagnet(e, t, n) {
		if (t.getAttribute("magnet") !== "passive") {
			let r = this.graph.options.connecting.validateMagnet;
			return !r || R(r, this.graph, {
				e: n,
				magnet: t,
				view: e,
				cell: e.cell
			});
		}
		return !1;
	}
	startMagnetDragging(e, t, n) {
		if (!this.can("magnetConnectable")) return;
		e.stopPropagation();
		let r = e.currentTarget, i = this.graph;
		this.setEventData(e, { targetMagnet: r }), this.validateMagnet(this, r, e) ? (i.options.magnetThreshold <= 0 && this.startConnectting(e, r, t, n), this.setEventData(e, { action: "magnet" }), this.stopPropagation(e)) : this.onMouseDown(e, t, n), i.view.delegateDragEvents(e, this);
	}
	startConnectting(e, t, n, r) {
		this.graph.model.startBatch("add-edge");
		let i = this.createEdgeFromMagnet(t, n, r);
		i.setEventData(e, i.prepareArrowheadDragging("target", {
			x: n,
			y: r,
			isNewEdge: !0,
			fallbackAction: "remove"
		})), this.setEventData(e, { edgeView: i }), i.notifyMouseDown(e, n, r);
	}
	getDefaultEdge(e, t) {
		let n, r = this.graph.options.connecting.createEdge;
		return r && (n = R(r, this.graph, {
			sourceMagnet: t,
			sourceView: e,
			sourceCell: e.cell
		})), n;
	}
	createEdgeFromMagnet(e, t, n) {
		let r = this.graph, i = r.model, a = this.getDefaultEdge(this, e);
		return a.setSource(Object.assign(Object.assign({}, a.getSource()), this.getEdgeTerminal(e, t, n, a, "source"))), a.setTarget(Object.assign(Object.assign({}, a.getTarget()), {
			x: t,
			y: n
		})), a.addTo(i, {
			async: !1,
			ui: !0
		}), a.findView(r);
	}
	dragMagnet(e, t, n) {
		let r = this.getEventData(e), i = r.edgeView;
		if (i) i.onMouseMove(e, t, n), this.autoScrollGraph(e.clientX, e.clientY);
		else {
			let i = this.graph, a = i.options.magnetThreshold, o = this.getEventTarget(e), s = r.targetMagnet;
			if (a === "onleave") {
				if (s === o || s.contains(o)) return;
			} else if (i.view.getMouseMovedCount(e) <= a) return;
			this.startConnectting(e, s, t, n);
		}
	}
	stopMagnetDragging(e, t, n) {
		let r = this.eventData(e).edgeView;
		r && (r.onMouseUp(e, t, n), this.graph.model.stopBatch("add-edge"));
	}
	notifyUnhandledMouseDown(e, t, n) {
		this.notify("node:unhandled:mousedown", {
			e,
			x: t,
			y: n,
			view: this,
			cell: this.cell,
			node: this.cell
		});
	}
	notifyNodeMove(e, t, n, r, i) {
		let a = [i], o = this.graph.getPlugin("selection");
		if (o && o.isSelectionMovable()) {
			let e = o.getSelectedCells();
			e.includes(i) && (a = e.filter((e) => e.isNode()));
		}
		a.forEach((i) => {
			this.notify(e, {
				e: t,
				x: n,
				y: r,
				cell: i,
				node: i,
				view: i.findView(this.graph)
			});
		});
	}
	getRestrictArea(e) {
		let t = this.graph.options.translating.restrict, n = typeof t == "function" ? R(t, this.graph, e) : t;
		return typeof n == "number" ? this.graph.transform.getGraphArea().inflate(n) : n === !0 ? this.graph.transform.getGraphArea() : n || null;
	}
	startNodeDragging(e, t, n) {
		let r = this.getDelegatedView();
		if (r == null || !r.can("nodeMovable")) return this.notifyUnhandledMouseDown(e, t, n);
		this.setEventData(e, {
			targetView: r,
			action: "move"
		});
		let i = z.create(r.cell.getPosition());
		r.setEventData(e, {
			moving: !1,
			offset: i.diff(t, n),
			restrict: this.getRestrictArea(r)
		});
	}
	dragNode(e, t, n) {
		let r = this.cell, i = this.graph, a = i.getGridSize(), o = this.getEventData(e), s = o.offset, c = o.restrict;
		o.moving || (o.moving = !0, this.addClass("node-moving"), this.notifyNodeMove("node:move", e, t, n, this.cell)), this.autoScrollGraph(e.clientX, e.clientY);
		let l = cu(t + s.x, a), u = cu(n + s.y, a);
		r.setPosition(l, u, {
			restrict: c,
			deep: !0,
			ui: !0
		}), i.options.embedding.enabled && (o.embedding ||= (this.prepareEmbedding(e), !0), this.processEmbedding(e, o));
	}
	autoOffsetNode() {
		let e = this.cell, t = this.graph, n = Object.assign({ id: e.id }, e.getPosition()), r = t.getNodes().map((e) => {
			let t = e.getPosition();
			return {
				id: e.id,
				x: t.x,
				y: t.y
			};
		}).filter((e) => e.id !== n.id), i = [
			[1, 1],
			[1, -1],
			[-1, 1],
			[-1, -1]
		], a = t.getGridSize(), o = (e) => r.some((t) => t.x === e.x && t.y === e.y);
		for (; o(n);) {
			let r = !1;
			for (let t = 0; t < i.length; t += 1) {
				let s = i[t];
				if (!o({
					x: n.x + s[0] * a,
					y: n.y + s[1] * a
				})) {
					e.translate(s[0] * a, s[1] * a), r = !0;
					break;
				}
			}
			if (r) break;
			a += t.getGridSize();
		}
	}
	stopNodeDragging(e, t, n) {
		let r = this.getEventData(e), i = this.graph;
		r.embedding && this.finalizeEmbedding(e, r), r.moving && (i.options.translating.autoOffset && this.autoOffsetNode(), this.removeClass("node-moving"), this.notifyNodeMove("node:moved", e, t, n, this.cell)), r.moving = !1, r.embedding = !1;
	}
	autoScrollGraph(e, t) {
		let n = this.graph.getPlugin("scroller");
		n && n.autoScroll(e, t);
	}
}, Kx = `X6.${Gx.name}`;
Gx.config({
	isSvgElement: !0,
	priority: 0,
	bootstrap: ["render"],
	actions: {
		view: ["render"],
		markup: ["render"],
		attrs: ["update"],
		size: [
			"resize",
			"ports",
			"tools"
		],
		angle: ["rotate", "tools"],
		position: ["translate", "tools"],
		ports: ["ports"],
		tools: ["tools"]
	}
}), Gx.registry.register("node", Gx, !0);
// node_modules/@antv/x6/es/view/edge/index.js
var qx = class e extends Db {
	constructor() {
		super(...arguments), this.POINT_ROUNDING = 2, this.labelDestroyFn = {};
	}
	static isEdgeView(t) {
		if (t == null) return !1;
		if (t instanceof e) return !0;
		let n = t[Symbol.toStringTag], r = t;
		return !(n != null && n !== Jx || typeof r.isNodeView != "function" || typeof r.isEdgeView != "function" || typeof r.confirmUpdate != "function" || typeof r.update != "function" || typeof r.getConnection != "function");
	}
	get [Symbol.toStringTag]() {
		return Jx;
	}
	getContainerClassName() {
		return [super.getContainerClassName(), this.prefixClassName("edge")].join(" ");
	}
	get sourceBBox() {
		let e = this.sourceView;
		if (!e || !this.graph.renderer.isViewMounted(e)) {
			let e = this.cell.getSourceCell();
			if (e) return e.getBBox();
			let t = this.cell.getSourcePoint();
			return new B(t.x, t.y);
		}
		let t = this.sourceMagnet;
		return e.isEdgeElement(t) ? new B(this.sourceAnchor.x, this.sourceAnchor.y) : e.getBBoxOfElement(t || e.container);
	}
	get targetBBox() {
		let e = this.targetView;
		if (!e || !this.graph.renderer.isViewMounted(e)) {
			let e = this.cell.getTargetCell();
			if (e) return e.getBBox();
			let t = this.cell.getTargetPoint();
			return new B(t.x, t.y);
		}
		let t = this.targetMagnet;
		return e.isEdgeElement(t) ? new B(this.targetAnchor.x, this.targetAnchor.y) : e.getBBoxOfElement(t || e.container);
	}
	isEdgeView() {
		return !0;
	}
	confirmUpdate(e, t = {}) {
		let n = e;
		if (this.hasAction(n, "source")) {
			if (!this.updateTerminalProperties("source")) return n;
			n = this.removeAction(n, "source");
		}
		if (this.hasAction(n, "target")) {
			if (!this.updateTerminalProperties("target")) return n;
			n = this.removeAction(n, "target");
		}
		return this.hasAction(n, "render") ? (this.render(), n = this.removeAction(n, [
			"render",
			"update",
			"labels",
			"tools"
		]), n) : (n = this.handleAction(n, "update", () => this.update(t)), n = this.handleAction(n, "labels", () => this.onLabelsChange(t)), n = this.handleAction(n, "tools", () => this.renderTools()), n);
	}
	render() {
		return this.empty(), this.renderMarkup(), this.labelContainer = null, this.renderLabels(), this.update(), this.renderTools(), this.notify("view:render", { view: this }), this;
	}
	renderMarkup() {
		let e = this.cell.markup;
		if (e) {
			if (typeof e == "string") throw TypeError("Not support string markup.");
			return this.renderJSONMarkup(e);
		}
		throw TypeError("Invalid edge markup.");
	}
	renderJSONMarkup(e) {
		let t = this.parseJSONMarkup(e, this.container);
		this.selectors = t.selectors, this.container.append(t.fragment);
	}
	customizeLabels() {
		if (this.labelContainer) {
			let e = this.cell, t = e.labels;
			for (let n = 0, r = t.length; n < r; n += 1) {
				let r = t[n], i = this.labelCache[n], a = this.labelSelectors[n], o = this.graph.options.onEdgeLabelRendered;
				if (o) {
					let t = o({
						edge: e,
						label: r,
						container: i,
						selectors: a
					});
					t && (this.labelDestroyFn[n] = t);
				}
			}
		}
	}
	destroyCustomizeLabels() {
		let e = this.cell.labels;
		if (this.labelCache && this.labelSelectors && this.labelDestroyFn) for (let t = 0, n = e.length; t < n; t += 1) {
			let n = this.labelDestroyFn[t], r = this.labelCache[t], i = this.labelSelectors[t];
			n && r && i && n({
				edge: this.cell,
				label: e[t],
				container: r,
				selectors: i
			});
		}
		this.labelDestroyFn = {};
	}
	renderLabels() {
		let e = this.cell, t = e.getLabels(), n = t.length, r = this.labelContainer;
		if (this.labelCache = {}, this.labelSelectors = {}, n <= 0) return r?.parentNode && r.parentNode.removeChild(r), this;
		r ? this.empty(r) : (r = Xu("g"), this.addClass(this.prefixClassName("edge-labels"), r), this.labelContainer = r);
		for (let n = 0, i = t.length; n < i; n += 1) {
			let i = t[n], a = this.normalizeLabelMarkup(this.parseLabelMarkup(i.markup)), o, s;
			if (a) o = a.node, s = a.selectors;
			else {
				let t = e.getDefaultLabel(), n = this.normalizeLabelMarkup(this.parseLabelMarkup(t.markup));
				o = n.node, s = n.selectors;
			}
			o.setAttribute("data-index", `${n}`), r.appendChild(o);
			let c = this.rootSelector;
			if (s[c]) throw Error("Ambiguous label root selector.");
			s[c] = o, this.labelCache[n] = o, this.labelSelectors[n] = s;
		}
		return r.parentNode ?? this.container.appendChild(r), this.updateLabels(), this.customizeLabels(), this;
	}
	onLabelsChange(e = {}) {
		this.destroyCustomizeLabels(), this.shouldRerenderLabels(e) ? this.renderLabels() : this.updateLabels(), this.updateLabelPositions();
	}
	shouldRerenderLabels(e = {}) {
		let t = this.cell.previous("labels");
		if (t == null) return !0;
		if ("propertyPathArray" in e && "propertyValue" in e) {
			let n = e.propertyPathArray || [], r = n.length;
			if (r > 1 && t[n[1]]) {
				if (r === 2) return typeof e.propertyValue == "object" && Vc(e.propertyValue, "markup");
				if (n[2] !== "markup") return !1;
			}
		}
		return !0;
	}
	parseLabelMarkup(e) {
		return e ? typeof e == "string" ? this.parseLabelStringMarkup(e) : this.parseJSONMarkup(e) : null;
	}
	parseLabelStringMarkup(e) {
		let t = lf.createVectors(e), n = document.createDocumentFragment();
		for (let e = 0, r = t.length; e < r; e += 1) {
			let r = t[e].node;
			n.appendChild(r);
		}
		return {
			fragment: n,
			selectors: {}
		};
	}
	normalizeLabelMarkup(e) {
		if (e == null) return;
		let t = e.fragment;
		if (!(t instanceof DocumentFragment) || !t.hasChildNodes()) throw Error("Invalid label markup.");
		let n, r = t.childNodes;
		return n = r.length > 1 || r[0].nodeName.toUpperCase() !== "G" ? lf.create("g").append(t) : lf.create(r[0]), n.addClass(this.prefixClassName("edge-label")), {
			node: n.node,
			selectors: e.selectors
		};
	}
	updateLabels() {
		if (this.labelContainer) {
			let e = this.cell, t = e.labels, n = this.can("edgeLabelMovable"), r = e.getDefaultLabel();
			for (let e = 0, i = t.length; e < i; e += 1) {
				let i = this.labelCache[e], a = this.labelSelectors[e];
				i.setAttribute("cursor", n ? "move" : "default");
				let o = t[e], s = Qc({}, r.attrs, o.attrs);
				this.updateAttrs(i, s, {
					selectors: a,
					rootBBox: o.size ? B.fromSize(o.size) : void 0
				});
			}
		}
	}
	renderTools() {
		let e = this.cell.getTools();
		return this.addTools(e), this;
	}
	update(e = {}) {
		this.cleanCache(), this.updateConnection(e);
		let t = this.cell.getAttrs(), { text: n } = t, r = d(t, ["text"]);
		if (r != null) {
			if (this.container?.tagName === "g" && this.isEdgeElement(this.container) && Pl) {
				let e = this.container.parentNode;
				if (e) {
					let t = this.container.nextSibling;
					e.removeChild(this.container), e.insertBefore(this.container, t);
				}
			}
			this.updateAttrs(this.container, r, { selectors: this.selectors });
		}
		return this.updateLabelPositions(), this.updateTools(e), this;
	}
	removeRedundantLinearVertices(e = {}) {
		let t = this.cell, n = t.getVertices(), r = [
			this.sourceAnchor,
			...n,
			this.targetAnchor
		], i = r.length, a = new yu(r);
		a.simplify({ threshold: .01 });
		let o = a.points.map((e) => e.toJSON()), s = o.length;
		return i === s ? 0 : (t.setVertices(o.slice(1, s - 1), e), i - s);
	}
	getTerminalView(e) {
		switch (e) {
			case "source": return this.sourceView || null;
			case "target": return this.targetView || null;
			default: throw Error(`Unknown terminal type '${e}'`);
		}
	}
	getTerminalAnchor(e) {
		switch (e) {
			case "source": return z.create(this.sourceAnchor);
			case "target": return z.create(this.targetAnchor);
			default: throw Error(`Unknown terminal type '${e}'`);
		}
	}
	getTerminalConnectionPoint(e) {
		switch (e) {
			case "source": return z.create(this.sourcePoint);
			case "target": return z.create(this.targetPoint);
			default: throw Error(`Unknown terminal type '${e}'`);
		}
	}
	getTerminalMagnet(e, t = {}) {
		switch (e) {
			case "source": {
				if (t.raw) return this.sourceMagnet;
				let e = this.sourceView;
				return e ? this.sourceMagnet || e.container : null;
			}
			case "target": {
				if (t.raw) return this.targetMagnet;
				let e = this.targetView;
				return e ? this.targetMagnet || e.container : null;
			}
			default: throw Error(`Unknown terminal type '${e}'`);
		}
	}
	updateConnection(e = {}) {
		let t = this.cell;
		if (e.translateBy && t.isFragmentDescendantOf(e.translateBy)) {
			let t = e.tx || 0, n = e.ty || 0;
			this.routePoints = new yu(this.routePoints).translate(t, n).points, this.translateConnectionPoints(t, n), this.path.translate(t, n);
		} else {
			let e = t.getVertices(), n = this.findAnchors(e);
			this.sourceAnchor = n.source, this.targetAnchor = n.target, this.routePoints = this.findRoutePoints(e);
			let r = this.findConnectionPoints(this.routePoints, this.sourceAnchor, this.targetAnchor);
			this.sourcePoint = r.source, this.targetPoint = r.target;
			let i = this.findMarkerPoints(this.routePoints, this.sourcePoint, this.targetPoint);
			this.path = this.findPath(this.routePoints, i.source || this.sourcePoint, i.target || this.targetPoint);
		}
		this.cleanCache();
	}
	findAnchors(e) {
		let t = this.cell, n = t.source, r = t.target, i = e[0], a = e[e.length - 1];
		return r.priority && !n.priority ? this.findAnchorsOrdered("target", a, "source", i) : this.findAnchorsOrdered("source", i, "target", a);
	}
	findAnchorsOrdered(e, t, n, r) {
		let i, a, o = this.cell, s = o[e], c = o[n], l = this.getTerminalView(e), u = this.getTerminalView(n), d = this.getTerminalMagnet(e), f = this.getTerminalMagnet(n);
		if (l) {
			let n;
			n = t ? z.create(t) : u ? f : z.create(c), i = this.getAnchor(s.anchor, l, d, n, e);
		} else i = z.create(s);
		if (u) {
			let e = z.create(r || i);
			a = this.getAnchor(c.anchor, u, f, e, n);
		} else a = z.isPointLike(c) ? z.create(c) : new z();
		return {
			[e]: i,
			[n]: a
		};
	}
	getAnchor(e, t, n, r, i) {
		let a = t.isEdgeElement(n), o = this.graph.options.connecting, s = typeof e == "string" ? { name: e } : e;
		if (!s) {
			let e = a ? (i === "source" ? o.sourceEdgeAnchor : o.targetEdgeAnchor) || o.edgeAnchor : (i === "source" ? o.sourceAnchor : o.targetAnchor) || o.anchor;
			s = typeof e == "string" ? { name: e } : e;
		}
		if (!s) throw Error("Anchor should be specified.");
		let c, l = s.name;
		if (a) {
			let e = f_.get(l);
			if (typeof e != "function") return f_.onNotFound(l);
			c = R(e, this, t, n, r, s.args || {}, i);
		} else {
			let e = dv.get(l);
			if (typeof e != "function") return dv.onNotFound(l);
			c = R(e, this, t, n, r, s.args || {}, i);
		}
		return c ? c.round(this.POINT_ROUNDING) : new z();
	}
	findRoutePoints(e = []) {
		let t = this.graph.options.connecting.router || Xy.normal, n = this.cell.getRouter() || t, r;
		if (typeof n == "function") r = R(n, this, e, {}, this);
		else {
			let t = typeof n == "string" ? n : n.name, i = typeof n == "string" ? {} : n.args || {}, a = t ? Zy.get(t) : Xy.normal;
			if (typeof a != "function") return Zy.onNotFound(t);
			r = R(a, this, e, i, this);
		}
		return r == null ? e.map((e) => z.create(e)) : r.map((e) => z.create(e));
	}
	findConnectionPoints(e, t, n) {
		let r = this.cell, i = this.graph.options.connecting, a = r.getSource(), o = r.getTarget(), s = this.sourceView, c = this.targetView, l = e[0], u = e[e.length - 1], d;
		if (s && !s.isEdgeElement(this.sourceMagnet)) {
			let e = this.sourceMagnet || s.container, r = new V(l || n, t), o = a.connectionPoint || i.sourceConnectionPoint || i.connectionPoint;
			d = this.getConnectionPoint(o, s, e, r, "source");
		} else d = t;
		let f;
		if (c && !c.isEdgeElement(this.targetMagnet)) {
			let e = this.targetMagnet || c.container, r = o.connectionPoint || i.targetConnectionPoint || i.connectionPoint, a = new V(u || t, n);
			f = this.getConnectionPoint(r, c, e, a, "target");
		} else f = n;
		return {
			source: d,
			target: f
		};
	}
	getConnectionPoint(e, t, n, r, i) {
		let a = r.end;
		if (e == null) return a;
		let o = typeof e == "string" ? e : e.name, s = typeof e == "string" ? {} : e.args, c = Rg.get(o);
		if (typeof c != "function") return Rg.onNotFound(o);
		let l = R(c, this, r, t, n, s || {}, i);
		return l ? l.round(this.POINT_ROUNDING) : a;
	}
	findMarkerPoints(e, t, n) {
		let r = (e) => {
			let t = this.cell.getAttrs(), n = Object.keys(t);
			for (let r = 0, i = n.length; r < i; r += 1) {
				let i = t[n[r]];
				if (i[`${e}Marker`] || i[`${e}-marker`]) {
					let e = i.strokeWidth || i["stroke-width"];
					if (e) return parseFloat(e);
					break;
				}
			}
			return null;
		}, i = e[0], a = e[e.length - 1], o, s, c = r("source");
		c && (o = t.clone().move(i || n, -c));
		let l = r("target");
		return l && (s = n.clone().move(a || t, -l)), this.sourceMarkerPoint = o || t.clone(), this.targetMarkerPoint = s || n.clone(), {
			source: o,
			target: s
		};
	}
	findPath(e, t, n) {
		let r = this.cell.getConnector() || this.graph.options.connecting.connector, i, a, o;
		if (typeof r == "string" ? i = r : (i = r.name, a = r.args), i) {
			let e = r_.get(i);
			if (typeof e != "function") return r_.onNotFound(i);
			o = e;
		} else o = n_.normal;
		let s = R(o, this, t, n, e, Object.assign(Object.assign({}, a), { raw: !0 }), this);
		return typeof s == "string" ? H.parse(s) : s;
	}
	translateConnectionPoints(e, t) {
		this.sourcePoint.translate(e, t), this.targetPoint.translate(e, t), this.sourceAnchor.translate(e, t), this.targetAnchor.translate(e, t), this.sourceMarkerPoint.translate(e, t), this.targetMarkerPoint.translate(e, t);
	}
	updateLabelPositions() {
		if (this.labelContainer == null || !this.path) return this;
		let e = this.cell, t = e.getLabels();
		if (t.length === 0) return this;
		let n = e.getDefaultLabel(), r = this.normalizeLabelPosition(n.position);
		for (let e = 0, n = t.length; e < n; e += 1) {
			let n = t[e], i = this.labelCache[e];
			if (!i) continue;
			let a = Qc({}, r, this.normalizeLabelPosition(n.position)), o = this.getLabelTransformationMatrix(a);
			i.setAttribute("transform", Vf(o));
		}
		return this;
	}
	updateTerminalProperties(e) {
		let t = this.cell, n = this.graph, r = t[e], i = r && r.cell, a = `${e}View`;
		if (!i) return this[a] = null, this.updateTerminalMagnet(e), !0;
		let o = n.getCellById(i);
		if (!o) throw Error(`Edge's ${e} node with id "${i}" not exists`);
		let s = o.findView(n);
		return s ? (this[a] = s, this.updateTerminalMagnet(e), !0) : !1;
	}
	updateTerminalMagnet(e) {
		let t = `${e}Magnet`, n = this.getTerminalView(e);
		if (n) {
			let r = n.getMagnetFromEdgeTerminal(this.cell[e]);
			r === n.container && (r = null), this[t] = r;
		} else this[t] = null;
	}
	getLabelPositionAngle(e) {
		let t = this.cell.getLabelAt(e);
		return t && t.position && typeof t.position == "object" && t.position.angle || 0;
	}
	getLabelPositionArgs(e) {
		let t = this.cell.getLabelAt(e);
		if (t && t.position && typeof t.position == "object") return t.position.options;
	}
	getDefaultLabelPositionArgs() {
		let e = this.cell.getDefaultLabel();
		if (e && e.position && typeof e.position == "object") return e.position.options;
	}
	mergeLabelPositionArgs(e, t) {
		return e === null ? null : e === void 0 ? t === null ? null : t : Qc({}, t, e);
	}
	getConnection() {
		return this.path == null ? null : this.path.clone();
	}
	getConnectionPathData() {
		if (this.path == null) return "";
		let e = this.cache.pathCache;
		return Vc(e, "data") || (e.data = this.path.serialize()), e.data || "";
	}
	getConnectionSubdivisions() {
		if (this.path == null) return null;
		let e = this.cache.pathCache;
		return Vc(e, "segmentSubdivisions") || (e.segmentSubdivisions = this.path.getSegmentSubdivisions()), e.segmentSubdivisions;
	}
	getConnectionLength() {
		if (this.path == null) return 0;
		let e = this.cache.pathCache;
		return Vc(e, "length") || (e.length = this.path.length({ segmentSubdivisions: this.getConnectionSubdivisions() })), e.length;
	}
	getPointAtLength(e) {
		return this.path == null ? null : this.path.pointAtLength(e, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getPointAtRatio(e) {
		return this.path == null ? null : (Tl(e) && (e = parseFloat(e) / 100), this.path.pointAt(e, { segmentSubdivisions: this.getConnectionSubdivisions() }));
	}
	getTangentAtLength(e) {
		return this.path == null ? null : this.path.tangentAtLength(e, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getTangentAtRatio(e) {
		return this.path == null ? null : this.path.tangentAt(e, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getClosestPoint(e) {
		return this.path == null ? null : this.path.closestPoint(e, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getClosestPointLength(e) {
		return this.path == null ? null : this.path.closestPointLength(e, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getClosestPointRatio(e) {
		return this.path == null ? null : this.path.closestPointNormalizedLength(e, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getLabelPosition(e, t, n, r) {
		let i = { distance: 0 }, a = 0, o;
		typeof n == "number" ? (a = n, o = r) : o = n, o != null && (i.options = o);
		let s = o?.absoluteOffset, c = !o?.absoluteDistance, l = o?.absoluteDistance && o.reverseDistance, u = this.path, d = { segmentSubdivisions: this.getConnectionSubdivisions() }, f = new z(e, t), p = u.closestPointT(f, d) ?? 0, m = this.getConnectionLength() || 0, h = u.lengthAtT(p, d);
		c && (h = m > 0 ? h / m : 0), l && (h = -1 * (m - h) || 1), i.distance = h;
		let g;
		s || (g = u.tangentAtT(p));
		let _;
		if (g) _ = g.pointOffset(f);
		else {
			let e = u.pointAtT(p);
			if (e) {
				let t = f.diff(e);
				_ = {
					x: t.x,
					y: t.y
				};
			} else _ = {
				x: 0,
				y: 0
			};
		}
		return i.offset = _, i.angle = a, i;
	}
	normalizeLabelPosition(e) {
		return typeof e == "number" ? { distance: e } : e;
	}
	getLabelTransformationMatrix(e) {
		let t = this.normalizeLabelPosition(e), n = t.options || {}, r = t.angle || 0, i = t.distance, a = i > 0 && i <= 1, o = 0, s = {
			x: 0,
			y: 0
		}, c = t.offset;
		c && (typeof c == "number" ? o = c : (c.x != null && (s.x = c.x), c.y != null && (s.y = c.y)));
		let l = s.x !== 0 || s.y !== 0 || o === 0, u = n.keepGradient, d = n.ensureLegibility, f = this.path, p = { segmentSubdivisions: this.getConnectionSubdivisions() }, m = a ? i * (this.getConnectionLength() || 0) : i, h = f.tangentAtLength(m, p), g, _ = r;
		if (h) {
			if (l) g = h.start, g.translate(s);
			else {
				let e = h.clone();
				e.rotate(-90, h.start), e.setLength(o), g = e.end;
			}
			u && (_ = h.angle() + r, d && (_ = iu((_ + 90) % 180 - 90)));
		} else g = f.pointAtLength(0, p) || new z(), l && g.translate(s);
		return Rf().translate(g.x, g.y).rotate(_);
	}
	getVertexIndex(e, t) {
		let n = this.cell.getVertices(), r = this.getClosestPointLength(new z(e, t)), i = 0;
		if (r != null) for (let e = n.length; i < e; i += 1) {
			let e = n[i], t = this.getClosestPointLength(e);
			if (t != null && r < t) break;
		}
		return i;
	}
	getEventArgs(e, t, n) {
		let r = this, i = r.cell, a = i;
		return t == null || n == null ? {
			e,
			view: r,
			edge: i,
			cell: a
		} : {
			e,
			x: t,
			y: n,
			view: r,
			edge: i,
			cell: a
		};
	}
	notifyUnhandledMouseDown(e, t, n) {
		this.notify("edge:unhandled:mousedown", {
			e,
			x: t,
			y: n,
			view: this,
			cell: this.cell,
			edge: this.cell
		});
	}
	notifyMouseDown(e, t, n) {
		super.onMouseDown(e, t, n), this.notify("edge:mousedown", this.getEventArgs(e, t, n));
	}
	notifyMouseMove(e, t, n) {
		super.onMouseMove(e, t, n), this.notify("edge:mousemove", this.getEventArgs(e, t, n));
	}
	notifyMouseUp(e, t, n) {
		super.onMouseUp(e, t, n), this.notify("edge:mouseup", this.getEventArgs(e, t, n));
	}
	onClick(e, t, n) {
		super.onClick(e, t, n), this.notify("edge:click", this.getEventArgs(e, t, n));
	}
	onDblClick(e, t, n) {
		super.onDblClick(e, t, n), this.notify("edge:dblclick", this.getEventArgs(e, t, n));
	}
	onContextMenu(e, t, n) {
		super.onContextMenu(e, t, n), this.notify("edge:contextmenu", this.getEventArgs(e, t, n));
	}
	onMouseDown(e, t, n) {
		this.notifyMouseDown(e, t, n), this.startEdgeDragging(e, t, n);
	}
	onMouseMove(e, t, n) {
		let r = this.getEventData(e);
		switch (r.action) {
			case "drag-label":
				this.dragLabel(e, t, n);
				break;
			case "drag-arrowhead":
				this.dragArrowhead(e, t, n);
				break;
			case "drag-edge": this.dragEdge(e, t, n);
		}
		return this.notifyMouseMove(e, t, n), r;
	}
	onMouseUp(e, t, n) {
		let r = this.getEventData(e);
		switch (r.action) {
			case "drag-label":
				this.stopLabelDragging(e, t, n);
				break;
			case "drag-arrowhead":
				this.stopArrowheadDragging(e, t, n);
				break;
			case "drag-edge": this.stopEdgeDragging(e, t, n);
		}
		return this.notifyMouseUp(e, t, n), this.checkMouseleave(e), r;
	}
	onMouseOver(e) {
		super.onMouseOver(e), this.notify("edge:mouseover", this.getEventArgs(e));
	}
	onMouseOut(e) {
		super.onMouseOut(e), this.notify("edge:mouseout", this.getEventArgs(e));
	}
	onMouseEnter(e) {
		super.onMouseEnter(e), this.notify("edge:mouseenter", this.getEventArgs(e));
	}
	onMouseLeave(e) {
		super.onMouseLeave(e), this.notify("edge:mouseleave", this.getEventArgs(e));
	}
	onMouseWheel(e, t, n, r) {
		super.onMouseWheel(e, t, n, r), this.notify("edge:mousewheel", Object.assign({ delta: r }, this.getEventArgs(e, t, n)));
	}
	onCustomEvent(e, t, n, r) {
		if (rd(e.target, "edge-tool", this.container)) {
			if (e.stopPropagation(), this.can("useEdgeTools")) {
				if (t === "edge:remove") {
					this.cell.remove({ ui: !0 });
					return;
				}
				this.notify("edge:customevent", Object.assign({ name: t }, this.getEventArgs(e, n, r)));
			}
			this.notifyMouseDown(e, n, r);
		} else this.notify("edge:customevent", Object.assign({ name: t }, this.getEventArgs(e, n, r))), super.onCustomEvent(e, t, n, r);
	}
	onLabelMouseDown(e, t, n) {
		this.notifyMouseDown(e, t, n), this.startLabelDragging(e, t, n), this.getEventData(e).stopPropagation && e.stopPropagation();
	}
	startEdgeDragging(e, t, n) {
		this.can("edgeMovable") ? this.setEventData(e, {
			x: t,
			y: n,
			moving: !1,
			action: "drag-edge"
		}) : this.notifyUnhandledMouseDown(e, t, n);
	}
	dragEdge(e, t, n) {
		let r = this.getEventData(e);
		r.moving || (r.moving = !0, this.addClass("edge-moving"), this.notify("edge:move", {
			e,
			x: t,
			y: n,
			view: this,
			cell: this.cell,
			edge: this.cell
		})), this.cell.translate(t - r.x, n - r.y, { ui: !0 }), this.setEventData(e, {
			x: t,
			y: n
		}), this.notify("edge:moving", {
			e,
			x: t,
			y: n,
			view: this,
			cell: this.cell,
			edge: this.cell
		});
	}
	stopEdgeDragging(e, t, n) {
		let r = this.getEventData(e);
		r.moving && (this.removeClass("edge-moving"), this.notify("edge:moved", {
			e,
			x: t,
			y: n,
			view: this,
			cell: this.cell,
			edge: this.cell
		})), r.moving = !1;
	}
	prepareArrowheadDragging(e, t) {
		let n = this.getTerminalMagnet(e), r = {
			action: "drag-arrowhead",
			x: t.x,
			y: t.y,
			isNewEdge: t.isNewEdge === !0,
			terminalType: e,
			initialMagnet: n,
			initialTerminal: ns(this.cell[e]),
			fallbackAction: t.fallbackAction || "revert",
			getValidateConnectionArgs: this.createValidateConnectionArgs(e),
			options: t.options
		};
		return this.beforeArrowheadDragging(r), r;
	}
	createValidateConnectionArgs(e) {
		let t = [
			void 0,
			void 0,
			void 0,
			void 0,
			e,
			this
		], n, r = 0, i = 0;
		e === "source" ? (r = 2, n = "target") : (i = 2, n = "source");
		let a = this.cell[n], o = a.cell;
		if (o) {
			let e, n = this.graph.findViewByCell(o);
			t[r] = n, n && (e = n.getMagnetFromEdgeTerminal(a), e === n.container && (e = void 0)), t[r + 1] = e;
		}
		return (e, n) => (t[i] = e, t[i + 1] = e.container === n ? void 0 : n, t);
	}
	beforeArrowheadDragging(e) {
		e.zIndex = this.cell.zIndex, this.cell.toFront();
		let t = this.container.style;
		e.pointerEvents = t.pointerEvents, t.pointerEvents = "none", this.graph.options.connecting.highlight && this.highlightAvailableMagnets(e);
	}
	afterArrowheadDragging(e) {
		e.zIndex != null && (this.cell.setZIndex(e.zIndex, { ui: !0 }), e.zIndex = null);
		let t = this.container;
		t.style.pointerEvents = e.pointerEvents || "", this.graph.options.connecting.highlight && this.unhighlightAvailableMagnets(e);
	}
	validateConnection(t, n, r, i, a, o, s) {
		let c = this.graph.options.connecting, l = c.allowLoop, u = c.allowNode, d = c.allowEdge, f = c.allowPort, p = c.allowMulti, m = c.validateConnection, h = o ? o.cell : null, g = a === "target" ? r : t, _ = a === "target" ? i : n, v = !0, y = (e) => {
			let c = a === "source" ? s ? s.port : null : h ? h.getSourcePortId() : null, l = a === "target" ? s ? s.port : null : h ? h.getTargetPortId() : null;
			return R(e, this.graph, {
				edge: h,
				edgeView: o,
				sourceView: t,
				targetView: r,
				sourcePort: c,
				targetPort: l,
				sourceMagnet: n,
				targetMagnet: i,
				sourceCell: t ? t.cell : null,
				targetCell: r ? r.cell : null,
				type: a
			});
		};
		if (l != null && t != null && t === r && (typeof l == "boolean" ? l || (v = !1) : v = y(l)), v && f != null && (typeof f == "boolean" ? !f && _ && (v = !1) : v = y(f)), v && d != null && (typeof d == "boolean" ? !d && e.isEdgeView(g) && (v = !1) : v = y(d)), v && u != null && _ == null && (typeof u == "boolean" ? !u && Gx.isNodeView(g) && (v = !1) : v = y(u)), v && p != null && o) {
			let e = o.cell, t = a === "source" ? s : e.getSource(), n = a === "target" ? s : e.getTarget(), r = s ? this.graph.getCellById(s.cell) : null;
			if (t && n && t.cell && n.cell && r) {
				if (typeof p == "function") v = y(p);
				else {
					let e = this.graph.model.getConnectedEdges(r, {
						outgoing: a === "source",
						incoming: a === "target"
					});
					e.length && (p === "withPort" ? e.some((e) => {
						let r = e.getSource(), i = e.getTarget();
						return r && i && r.cell === t.cell && i.cell === n.cell && r.port != null && r.port === t.port && i.port != null && i.port === n.port;
					}) && (v = !1) : p || e.some((e) => {
						let r = e.getSource(), i = e.getTarget();
						return r && i && r.cell === t.cell && i.cell === n.cell;
					}) && (v = !1));
				}
			}
		}
		return v && m != null && (v = y(m)), v;
	}
	allowConnectToBlank(e) {
		let t = this.graph, n = t.options.connecting.allowBlank;
		if (typeof n != "function") return !!n;
		let r = t.findViewByCell(e), i = e.getSourceCell(), a = e.getTargetCell();
		return R(n, t, {
			edge: e,
			edgeView: r,
			sourceCell: i,
			targetCell: a,
			sourceView: t.findViewByCell(i),
			targetView: t.findViewByCell(a),
			sourcePort: e.getSourcePortId(),
			targetPort: e.getTargetPortId(),
			sourceMagnet: r.sourceMagnet,
			targetMagnet: r.targetMagnet
		});
	}
	validateEdge(e, t, n) {
		let r = this.graph;
		if (!this.allowConnectToBlank(e)) {
			let t = e.getSourceCellId(), n = e.getTargetCellId();
			if (!(t && n)) return !1;
		}
		let i = r.options.connecting.validateEdge;
		return !i || R(i, r, {
			edge: e,
			type: t,
			previous: n
		});
	}
	arrowheadDragging(e, t, n, r) {
		r.x = t, r.y = n, r.currentTarget !== e && (r.currentMagnet && r.currentView && r.currentView.unhighlight(r.currentMagnet, { type: "magnetAdsorbed" }), r.currentView = this.graph.findViewByElem(e), r.currentView ? (r.currentMagnet = r.currentView.findMagnet(e), r.currentMagnet && this.validateConnection(...r.getValidateConnectionArgs(r.currentView, r.currentMagnet), r.currentView.getEdgeTerminal(r.currentMagnet, t, n, this.cell, r.terminalType)) ? r.currentView.highlight(r.currentMagnet, { type: "magnetAdsorbed" }) : r.currentMagnet = null) : r.currentMagnet = null), r.currentTarget = e, this.cell.prop(r.terminalType, {
			x: t,
			y: n
		}, Object.assign(Object.assign({}, r.options), { ui: !0 }));
	}
	arrowheadDragged(e, t, n) {
		let r = e.currentView, i = e.currentMagnet;
		if (!i || !r) return;
		r.unhighlight(i, { type: "magnetAdsorbed" });
		let a = e.terminalType, o = r.getEdgeTerminal(i, t, n, this.cell, a);
		this.cell.setTerminal(a, o, { ui: !0 });
	}
	snapArrowhead(e, t, n) {
		let r = this.graph, { snap: i, allowEdge: a } = r.options.connecting, o = typeof i == "object" && i.radius || 50, s = typeof i == "object" && i.anchor || "center", c = r.renderer.findViewsInArea({
			x: e - o,
			y: t - o,
			width: 2 * o,
			height: 2 * o
		}, { nodeOnly: !0 });
		if (a) {
			let n = r.renderer.findEdgeViewsFromPoint({
				x: e,
				y: t
			}, o).filter((e) => e !== this);
			c.push(...n);
		}
		let l = n.closestView || null, u = n.closestMagnet || null;
		n.closestView = null, n.closestMagnet = null;
		let d, f = 2 ** 53 - 1, p = new z(e, t);
		c.forEach((r) => {
			if (r.container.getAttribute("magnet") !== "false") {
				if (r.isNodeView()) d = s === "center" ? r.cell.getBBox().getCenter().distance(p) : r.cell.getBBox().getNearestPointToPoint(p).distance(p);
				else if (r.isEdgeView()) {
					let e = r.getClosestPoint(p);
					d = e ? e.distance(p) : 2 ** 53 - 1;
				}
				d < o && d < f && (u === r.container || this.validateConnection(...n.getValidateConnectionArgs(r, null), r.getEdgeTerminal(r.container, e, t, this.cell, n.terminalType))) && (f = d, n.closestView = r, n.closestMagnet = r.container);
			}
			r.container.querySelectorAll("[magnet]").forEach((i) => {
				if (i.getAttribute("magnet") !== "false") {
					let a = r.getBBoxOfElement(i);
					d = s === "center" ? p.distance(a.getCenter()) : p.distance(a.getNearestPointToPoint(p)), d < o && d < f && (u === i || this.validateConnection(...n.getValidateConnectionArgs(r, i), r.getEdgeTerminal(i, e, t, this.cell, n.terminalType))) && (f = d, n.closestView = r, n.closestMagnet = i);
				}
			});
		});
		let m = n.terminalType, h = n.closestView, g = n.closestMagnet, _ = u !== g;
		if (l && _ && l.unhighlight(u, { type: "magnetAdsorbed" }), h) {
			if (!_) return;
			h.highlight(g, { type: "magnetAdsorbed" }), this.cell.setTerminal(m, h.getEdgeTerminal(g, e, t, this.cell, m), {}, Object.assign(Object.assign({}, n.options), { ui: !0 }));
		} else this.cell.setTerminal(m, {
			x: e,
			y: t
		}, {}, Object.assign(Object.assign({}, n.options), { ui: !0 }));
	}
	snapArrowheadEnd(e) {
		let t = e.closestView, n = e.closestMagnet;
		t && n && (t.unhighlight(n, { type: "magnetAdsorbed" }), e.currentMagnet = t.findMagnet(n)), e.closestView = null, e.closestMagnet = null;
	}
	finishEmbedding(e) {
		this.graph.options.embedding.enabled && this.cell.updateParent() && (e.zIndex = null);
	}
	fallbackConnection(e) {
		switch (e.fallbackAction) {
			case "remove":
				this.cell.remove({ ui: !0 });
				break;
			default: this.cell.prop(e.terminalType, e.initialTerminal, { ui: !0 });
		}
	}
	notifyConnectionEvent(e, t) {
		let n = e.terminalType, r = e.initialTerminal, i = this.cell[n];
		if (i && !Ax.equalTerminals(r, i)) {
			let a = this.graph, o = r, s = o.cell ? a.getCellById(o.cell) : null, c = o.port, l = s ? a.findViewByCell(s) : null, u = s || e.isNewEdge ? null : z.create(r).toJSON(), d = i, f = d.cell ? a.getCellById(d.cell) : null, p = d.port, m = f ? a.findViewByCell(f) : null, h = f ? null : z.create(i).toJSON();
			this.notify("edge:connected", {
				e: t,
				previousCell: s,
				previousPort: c,
				previousView: l,
				previousPoint: u,
				currentCell: f,
				currentView: m,
				currentPort: p,
				currentPoint: h,
				previousMagnet: e.initialMagnet,
				currentMagnet: e.currentMagnet,
				edge: this.cell,
				view: this,
				type: n,
				isNew: e.isNewEdge
			});
		}
	}
	highlightAvailableMagnets(e) {
		let t = this.graph, n = t.model.getCells();
		e.marked = {};
		for (let r = 0, i = n.length; r < i; r += 1) {
			let i = t.findViewByCell(n[r]);
			if (!i || i.cell.id === this.cell.id) continue;
			let a = Array.prototype.slice.call(i.container.querySelectorAll("[magnet]"));
			i.container.getAttribute("magnet") !== "false" && a.push(i.container);
			let o = a.filter((t) => this.validateConnection(...e.getValidateConnectionArgs(i, t), i.getEdgeTerminal(t, e.x, e.y, this.cell, e.terminalType)));
			if (o.length > 0) {
				for (let e = 0, t = o.length; e < t; e += 1) i.highlight(o[e], { type: "magnetAvailable" });
				i.highlight(null, { type: "nodeAvailable" }), e.marked[i.cell.id] = o;
			}
		}
	}
	unhighlightAvailableMagnets(e) {
		let t = e.marked || {};
		Object.keys(t).forEach((e) => {
			let n = this.graph.findViewByCell(e);
			n && (t[e].forEach((e) => {
				n.unhighlight(e, { type: "magnetAvailable" });
			}), n.unhighlight(null, { type: "nodeAvailable" }));
		}), e.marked = null;
	}
	startArrowheadDragging(e, t, n) {
		if (!this.can("arrowheadMovable")) {
			this.notifyUnhandledMouseDown(e, t, n);
			return;
		}
		let r = e.target.getAttribute("data-terminal"), i = this.prepareArrowheadDragging(r, {
			x: t,
			y: n
		});
		this.setEventData(e, i);
	}
	dragArrowhead(e, t, n) {
		let r = this.getEventData(e);
		this.graph.options.connecting.snap ? this.snapArrowhead(t, n, r) : this.arrowheadDragging(this.getEventTarget(e), t, n, r);
	}
	stopArrowheadDragging(e, t, n) {
		let r = this.graph, i = this.getEventData(e);
		r.options.connecting.snap ? this.snapArrowheadEnd(i) : this.arrowheadDragged(i, t, n), this.validateEdge(this.cell, i.terminalType, i.initialTerminal) ? (this.finishEmbedding(i), this.notifyConnectionEvent(i, e)) : this.fallbackConnection(i), this.afterArrowheadDragging(i);
	}
	startLabelDragging(e, t, n) {
		if (this.can("edgeLabelMovable")) {
			let t = e.currentTarget, n = parseInt(t.getAttribute("data-index"), 10), r = this.getLabelPositionAngle(n), i = this.getLabelPositionArgs(n), a = this.getDefaultLabelPositionArgs(), o = this.mergeLabelPositionArgs(i, a);
			this.setEventData(e, {
				index: n,
				positionAngle: r,
				positionArgs: o,
				stopPropagation: !0,
				action: "drag-label"
			});
		} else this.setEventData(e, { stopPropagation: !0 });
		this.graph.view.delegateDragEvents(e, this);
	}
	dragLabel(e, t, n) {
		let r = this.getEventData(e), i = Qc({}, this.cell.getLabelAt(r.index), { position: this.getLabelPosition(t, n, r.positionAngle, r.positionArgs) });
		this.cell.setLabelAt(r.index, i);
	}
	stopLabelDragging(e, t, n) {}
}, Jx = `X6.${qx.name}`;
qx.config({
	isSvgElement: !0,
	priority: 1,
	bootstrap: [
		"render",
		"source",
		"target"
	],
	actions: {
		view: ["render"],
		markup: ["render"],
		attrs: ["update"],
		source: ["source", "update"],
		target: ["target", "update"],
		router: ["update"],
		connector: ["update"],
		labels: ["labels"],
		defaultLabel: ["labels"],
		tools: ["tools"],
		vertices: ["vertices", "update"]
	}
}), qx.registry.register("edge", qx, !0);
// node_modules/@antv/x6/es/renderer/queueJob.js
var Yx = {
	idle: "idle",
	raf: "raf",
	timeout: "timeout"
}, Xx = class {
	constructor() {
		this.isFlushing = !1, this.isFlushPending = !1, this.scheduleId = 0, this.queue = [], this.frameInterval = 16, this.initialTime = Date.now(), this.pendingJobs = /* @__PURE__ */ new Map(), this.scheduleMode = null;
	}
	queueJob(e) {
		if (e.priority & Zx.PRIOR) e.cb();
		else {
			let t = this.pendingJobs.get(e.id);
			if (t) {
				if (t.cb = e.cb, e.priority !== t.priority) {
					t.priority = e.priority;
					let n = this.queue.indexOf(t);
					if (n >= 0) {
						this.queue.splice(n, 1);
						let e = this.findInsertionIndex(t);
						this.queue.splice(e, 0, t);
					}
				}
			} else {
				let t = this.findInsertionIndex(e);
				this.queue.splice(t, 0, e), this.pendingJobs.set(e.id, e);
			}
		}
	}
	queueFlush() {
		!this.isFlushing && !this.isFlushPending && (this.isFlushPending = !0, this.scheduleJob());
	}
	queueFlushSync() {
		!this.isFlushing && !this.isFlushPending && (this.isFlushPending = !0, this.flushJobsSync());
	}
	clearJobs() {
		this.queue.length = 0, this.pendingJobs.clear(), this.isFlushing = !1, this.isFlushPending = !1, this.cancelScheduleJob();
	}
	flushJobs(e) {
		this.isFlushPending = !1, this.isFlushing = !0;
		let t = this.getCurrentTime(), n = this.frameInterval;
		if (e && typeof e.timeRemaining == "function") {
			let t = e.timeRemaining();
			n = Math.max(0, Math.min(n, t));
		}
		for (; this.queue.length > 0;) {
			let e = this.queue.shift();
			if (e.cb(), this.pendingJobs.delete(e.id), this.getCurrentTime() - t >= n) break;
		}
		this.isFlushing = !1, this.queue.length && this.queueFlush();
	}
	flushJobsSync() {
		for (this.isFlushPending = !1, this.isFlushing = !0; this.queue.length > 0;) {
			let e = this.queue.shift();
			try {
				e.cb();
			} catch (e) {
				console.error(e);
			}
			this.pendingJobs.delete(e.id);
		}
		this.isFlushing = !1;
	}
	findInsertionIndex(e) {
		let t = 0, n = this.queue.length, r = n - 1, i = e.priority;
		for (; t <= r;) {
			let e = (r - t >> 1) + t;
			i <= this.queue[e].priority ? t = e + 1 : (n = e, r = e - 1);
		}
		return n;
	}
	scheduleJob() {
		this.scheduleId && this.cancelScheduleJob(), "requestAnimationFrame" in window ? (this.scheduleMode = Yx.raf, this.scheduleId = window.requestAnimationFrame(() => this.flushJobs())) : "requestIdleCallback" in window ? (this.scheduleMode = Yx.idle, this.scheduleId = window.requestIdleCallback((e) => this.flushJobs(e), { timeout: 100 })) : (this.scheduleMode = Yx.timeout, this.scheduleId = window.setTimeout(() => this.flushJobs()));
	}
	cancelScheduleJob() {
		if (!this.scheduleId) return;
		let e = {
			[Yx.idle]: window == null ? void 0 : window.cancelIdleCallback,
			[Yx.raf]: window == null ? void 0 : window.cancelAnimationFrame,
			[Yx.timeout]: window == null ? void 0 : window.clearTimeout
		}, t = this.scheduleMode, n = t ? e[t] : void 0;
		typeof n == "function" && n(this.scheduleId), this.scheduleId = 0, this.scheduleMode = null;
	}
	getCurrentTime() {
		return typeof performance == "object" && typeof performance.now == "function" ? performance.now() : Date.now() - this.initialTime;
	}
}, Zx;
(function(e) {
	e[e.Update = 2] = "Update", e[e.RenderEdge = 4] = "RenderEdge", e[e.RenderNode = 8] = "RenderNode", e[e.PRIOR = 1048576] = "PRIOR";
})(Zx ||= {});
// node_modules/@antv/x6/es/renderer/scheduler.js
var Qx;
(function(e) {
	e[e.CREATED = 0] = "CREATED", e[e.MOUNTED = 1] = "MOUNTED", e[e.WAITING = 2] = "WAITING";
})(Qx ||= {});
var $x = class extends Um {
	get model() {
		return this.graph.model;
	}
	get container() {
		return this.graph.view.stage;
	}
	constructor(e) {
		super(), this.views = {}, this.willRemoveViews = {}, this.queue = new Xx(), this.graph = e, this.init();
	}
	init() {
		this.startListening(), this.renderViews(this.model.getCells());
	}
	startListening() {
		this.model.on("reseted", this.onModelReseted, this), this.model.on("cell:added", this.onCellAdded, this), this.model.on("cell:removed", this.onCellRemoved, this), this.model.on("cell:change:zIndex", this.onCellZIndexChanged, this), this.model.on("cell:change:visible", this.onCellVisibleChanged, this);
	}
	stopListening() {
		this.model.off("reseted", this.onModelReseted, this), this.model.off("cell:added", this.onCellAdded, this), this.model.off("cell:removed", this.onCellRemoved, this), this.model.off("cell:change:zIndex", this.onCellZIndexChanged, this), this.model.off("cell:change:visible", this.onCellVisibleChanged, this);
	}
	onModelReseted({ options: e, previous: t }) {
		let n = this.model.getCells();
		if (!e?.diff) this.queue.clearJobs(), this.removeZPivots(), this.resetViews();
		else {
			let e = new Set(t);
			n = n.filter((t) => !e.has(t));
		}
		this.renderViews(n, Object.assign(Object.assign({}, e), { queue: n.map((e) => e.id) }));
	}
	onCellAdded({ cell: e, options: t }) {
		this.renderViews([e], t);
	}
	onCellRemoved({ cell: e }) {
		this.removeViews([e]);
	}
	onCellZIndexChanged({ cell: e, options: t }) {
		let n = this.views[e.id];
		n && this.requestViewUpdate(n.view, Wx, t, Zx.Update, !0);
	}
	onCellVisibleChanged({ cell: e, current: t }) {
		this.toggleVisible(e, !!t);
	}
	requestViewUpdate(e, t, n = {}, r = Zx.Update, i = !0) {
		let a = e.cell.id, o = this.views[a];
		if (!o) return;
		o.flag |= t;
		let s = o.options || {}, c = n || {};
		s.queue && c.queue == null && (c.queue = s.queue), (s.async === !1 || c.async === !1) && (c.async = !1), o.options = c, (e.hasAction(t, [
			"translate",
			"resize",
			"rotate"
		]) || c.async === !1) && (r = Zx.PRIOR, i = !1), this.queue.queueJob({
			id: a,
			priority: r,
			cb: () => {
				let e = this.views[a];
				if (!e) return;
				let t = e.options || {};
				this.renderViewInArea(e.view, e.flag, t);
				let n = t.queue;
				if (n) {
					let t = n.indexOf(e.view.cell.id);
					t >= 0 && n.splice(t, 1), n.length === 0 && this.graph.trigger("render:done");
				}
			}
		}), this.getEffectedEdges(e).forEach((e) => {
			this.requestViewUpdate(e.view, e.flag, n, r, !1);
		}), i && this.flush();
	}
	setRenderArea(e) {
		this.renderArea = e, Object.values(this.views).forEach((e) => {
			if (!e) return;
			let { view: t } = e;
			e.state === Qx.MOUNTED && (this.isUpdatable(t) || (t.remove(), this.graph.trigger("view:unmounted", { view: t }), e.state = Qx.WAITING, e.flag |= Wx | t.getBootstrapFlag()));
		}), this.flushWaitingViews();
	}
	isViewMounted(e) {
		if (e == null) return !1;
		let t = this.views[e.cell.id];
		return t ? t.state === Qx.MOUNTED : !1;
	}
	renderViews(e, t = {}) {
		e.sort((e, t) => e.isNode() && t.isEdge() ? -1 : 0), e.forEach((e) => {
			let n = e.id, r = this.views, i = 0, a = r[n];
			if (a) i = Wx;
			else {
				let r = this.createCellView(e);
				r && (r.graph = this.graph, i = Wx | r.getBootstrapFlag(), a = {
					view: r,
					flag: i,
					options: t,
					state: Qx.CREATED
				}, this.views[n] = a);
			}
			a && this.requestViewUpdate(a.view, i, t, this.getRenderPriority(a.view), !1);
		}), this.flush();
	}
	renderViewInArea(e, t, n = {}) {
		let r = e.cell, i = r.id, a = this.views[i];
		if (!a) return;
		let o = 0;
		this.isUpdatable(e) ? (o = this.updateView(e, t, n), a.flag = o) : (a.state === Qx.MOUNTED && (e.remove(), this.graph.trigger("view:unmounted", { view: e }), o = 0), a.state = Qx.WAITING, a.flag = t | Wx | e.getBootstrapFlag()), o && r.isEdge() && (o & e.getFlag(["source", "target"])) === 0 && this.queue.queueJob({
			id: i,
			priority: Zx.RenderEdge,
			cb: () => {
				this.updateView(e, t, n);
			}
		});
	}
	removeViews(e) {
		e.forEach((e) => {
			let t = e.id, n = this.views[t];
			n && (this.willRemoveViews[t] = n, delete this.views[t], this.queue.queueJob({
				id: t,
				priority: this.getRenderPriority(n.view),
				cb: () => {
					this.removeView(n.view);
				}
			}));
		}), this.flush();
	}
	flush() {
		this.graph.options.async ? this.queue.queueFlush() : this.queue.queueFlushSync();
	}
	flushWaitingViews() {
		Object.values(this.views).forEach((e) => {
			if (e && e.state === Qx.WAITING) {
				let { view: t, flag: n, options: r } = e;
				this.requestViewUpdate(t, n, r, this.getRenderPriority(t), !1);
			}
		}), this.flush();
	}
	updateView(e, t, n = {}) {
		if (e == null) return 0;
		if (Db.isCellView(e)) {
			if (t & 536870912) return this.removeView(e), 0;
			t & 1073741824 && (this.insertView(e), t ^= Wx);
		}
		return t ? e.confirmUpdate(t, n) : 0;
	}
	insertView(e) {
		let t = this.views[e.cell.id];
		if (t) {
			let n = e.cell.getZIndex(), r = this.addZPivot(n);
			this.container.insertBefore(e.container, r), e.cell.isVisible() || this.toggleVisible(e.cell, !1), t.state = Qx.MOUNTED, this.graph.trigger("view:mounted", { view: e });
		}
	}
	resetViews() {
		this.willRemoveViews = Object.assign(Object.assign({}, this.views), this.willRemoveViews), Object.values(this.willRemoveViews).forEach((e) => {
			e && this.removeView(e.view);
		}), this.views = {}, this.willRemoveViews = {};
	}
	removeView(e) {
		let t = e.cell, n = this.willRemoveViews[t.id];
		n && e && (n.view.remove(), delete this.willRemoveViews[t.id], this.graph.trigger("view:unmounted", { view: e }));
	}
	toggleVisible(e, t) {
		let n = this.model.getConnectedEdges(e);
		for (let e = 0, r = n.length; e < r; e += 1) {
			let r = n[e];
			if (t) {
				let e = r.getSourceCell(), t = r.getTargetCell();
				if (e && !e.isVisible() || t && !t.isVisible()) continue;
				this.toggleVisible(r, !0);
			} else this.toggleVisible(r, !1);
		}
		let r = this.views[e.id];
		r && G(r.view.container, { display: t ? "unset" : "none" });
	}
	addZPivot(e = 0) {
		this.zPivots ??= {};
		let t = this.zPivots, n = t[e];
		if (n) return n;
		n = t[e] = document.createComment(`z-index:${e + 1}`);
		let r = -Infinity;
		for (let n in t) {
			let t = +n;
			t < e && t > r && (r = t, e - 1);
		}
		let i = this.container;
		if (r !== -Infinity) {
			let e = t[r];
			i.insertBefore(n, e.nextSibling);
		} else i.insertBefore(n, i.firstChild);
		return n;
	}
	removeZPivots() {
		this.zPivots && Object.values(this.zPivots).forEach((e) => {
			e && e.parentNode && e.parentNode.removeChild(e);
		}), this.zPivots = {};
	}
	createCellView(e) {
		let t = { graph: this.graph }, n = this.graph.options.createCellView;
		if (n) {
			let r = R(n, this.graph, e);
			if (r) return new r(e, t);
			if (r === null) return null;
		}
		let r = e.view;
		if (r != null && typeof r == "string") {
			let n = Db.registry.get(r);
			return n ? new n(e, t) : Db.registry.onNotFound(r);
		}
		return e.isNode() ? new Gx(e, t) : e.isEdge() ? new qx(e, t) : null;
	}
	getEffectedEdges(e) {
		let t = [], n = e.cell, r = this.model.getConnectedEdges(n);
		for (let e = 0, i = r.length; e < i; e += 1) {
			let i = r[e], a = this.views[i.id];
			if (!a) continue;
			let o = a.view;
			if (!this.isViewMounted(o)) continue;
			let s = ["update"];
			i.getTargetCell() === n && s.push("target"), i.getSourceCell() === n && s.push("source"), t.push({
				id: i.id,
				view: o,
				flag: o.getFlag(s)
			});
		}
		return t;
	}
	isUpdatable(e) {
		if (e.isNodeView()) return !this.renderArea || this.renderArea.isIntersectWithRect(e.cell.getBBox());
		if (e.isEdgeView()) {
			let t = e.cell, n = !this.renderArea || this.renderArea.isIntersectWithRect(t.getBBox());
			if (this.graph.virtualRender.isVirtualEnabled()) return n;
			let r = t.getSourceCell(), i = t.getTargetCell();
			if (this.renderArea && r && i) return this.renderArea.isIntersectWithRect(r.getBBox()) || this.renderArea.isIntersectWithRect(i.getBBox());
		}
		return !0;
	}
	getRenderPriority(e) {
		return e.cell.isNode() ? Zx.RenderNode : Zx.RenderEdge;
	}
	dispose() {
		this.stopListening(), Object.keys(this.views).forEach((e) => {
			this.views[e].view.dispose();
		}), this.views = {};
	}
};
f([q()], $x.prototype, "dispose", null);
// node_modules/@antv/x6/es/renderer/renderer.js
var eS = class extends Hx {
	constructor() {
		super(...arguments), this.schedule = new $x(this.graph);
	}
	requestViewUpdate(e, t, n = {}) {
		this.schedule.requestViewUpdate(e, t, n);
	}
	isViewMounted(e) {
		return this.schedule.isViewMounted(e);
	}
	setRenderArea(e) {
		this.schedule.setRenderArea(e);
	}
	findViewByElem(e) {
		if (e == null) return null;
		let t = this.options.container, n = typeof e == "string" ? t.querySelector(e) : e instanceof Element ? e : e[0];
		if (n) {
			let e = this.graph.view.findAttr("data-cell-id", n);
			if (e) {
				let t = this.schedule.views;
				if (t[e]) return t[e].view;
			}
		}
		return null;
	}
	findViewByCell(e) {
		if (e == null) return null;
		let t = Y.isCell(e) ? e.id : e, n = this.schedule.views;
		return n[t] ? n[t].view : null;
	}
	findViewsFromPoint(e) {
		let t = {
			x: e.x,
			y: e.y
		};
		return this.model.getCells().map((e) => this.findViewByCell(e)).filter((e) => e != null && Wp(e.container, { target: this.view.stage }).containsPoint(t));
	}
	findEdgeViewsFromPoint(e, t = 5) {
		return this.model.getEdges().map((e) => this.findViewByCell(e)).filter((n) => {
			if (n != null) {
				let r = n.getClosestPoint(e);
				if (r) return r.distance(e) <= t;
			}
			return !1;
		});
	}
	findViewsInArea(e, t = {}) {
		let n = B.create(e);
		return this.model.getCells().map((e) => this.findViewByCell(e)).filter((e) => {
			if (e) {
				if (t.nodeOnly && !e.isNodeView()) return !1;
				let r = Wp(e.container, { target: this.view.stage });
				return r.width === 0 ? r.inflate(1, 0) : r.height === 0 && r.inflate(0, 1), t.strict ? n.containsRect(r) : n.isIntersectWithRect(r);
			}
			return !1;
		});
	}
	dispose() {
		this.schedule.dispose();
	}
};
f([q()], eS.prototype, "dispose", null);
// node_modules/@antv/x6/es/graph/background.js
var tS = class extends Hx {
	get elem() {
		return this.view.background;
	}
	init() {
		this.startListening(), this.options.background && this.draw(this.options.background);
	}
	startListening() {
		this.graph.on("scale", this.update, this), this.graph.on("translate", this.update, this);
	}
	stopListening() {
		this.graph.off("scale", this.update, this), this.graph.off("translate", this.update, this);
	}
	updateBackgroundImage(e = {}) {
		let t = e.size || "auto auto", n = e.position || "center", r = this.graph.transform.getScale(), i = this.graph.translate();
		typeof n == "object" && (n = `${i.tx + r.sx * (n.x || 0)}px ${i.ty + r.sy * (n.y || 0)}px`), typeof t == "object" && (t = B.fromSize(t).scale(r.sx, r.sy), t = `${t.width}px ${t.height}px`), this.elem.style.backgroundSize = t, this.elem.style.backgroundPosition = n;
	}
	drawBackgroundImage(e, t = {}) {
		if (!(e instanceof HTMLImageElement)) {
			this.elem.style.backgroundImage = "";
			return;
		}
		let n = this.optionsCache;
		if (n && n.image !== t.image) return;
		let r, i = t.opacity, a = t.size, o = t.repeat || "no-repeat", s = Og.get(o);
		if (typeof s == "function") {
			let n = t.quality || 1;
			e.width *= n, e.height *= n;
			let i = s(e, t);
			if (!(i instanceof HTMLCanvasElement)) throw Error("Background pattern must return an HTML Canvas instance");
			r = i.toDataURL("image/png"), o = t.repeat && o !== t.repeat ? t.repeat : "repeat", typeof a == "object" ? (a.width *= i.width / e.width, a.height *= i.height / e.height) : a === void 0 && (t.size = {
				width: i.width / n,
				height: i.height / n
			});
		} else r = e.src, a === void 0 && (t.size = {
			width: e.width,
			height: e.height
		});
		n != null && typeof t.size == "object" && t.image === n.image && t.repeat === n.repeat && t.quality === n.quality && (n.size = ns(t.size));
		let c = this.elem.style;
		c.backgroundImage = `url(${r})`, c.backgroundRepeat = o, c.opacity = i == null || i >= 1 ? "" : `${i}`, this.updateBackgroundImage(t);
	}
	updateBackgroundColor(e) {
		this.elem.style.backgroundColor = e || "";
	}
	updateBackgroundOptions(e) {
		this.graph.options.background = e;
	}
	update() {
		this.optionsCache && this.updateBackgroundImage(this.optionsCache);
	}
	draw(e) {
		let t = e || {};
		if (this.updateBackgroundOptions(e), this.updateBackgroundColor(t.color), t.image) {
			this.optionsCache = ns(t);
			let n = document.createElement("img");
			n.onload = () => this.drawBackgroundImage(n, e), n.setAttribute("crossorigin", "anonymous"), n.src = t.image;
		} else this.drawBackgroundImage(null), this.optionsCache = null;
	}
	clear() {
		this.draw();
	}
	dispose() {
		this.clear(), this.stopListening();
	}
};
f([q()], tS.prototype, "dispose", null);
// node_modules/@antv/x6/es/graph/coord.js
var nS = class extends Hx {
	getClientMatrix() {
		return Rf(this.view.stage.getScreenCTM());
	}
	getClientOffset() {
		let e = this.view.svg.getBoundingClientRect();
		return new z(e.left, e.top);
	}
	getPageOffset() {
		return this.getClientOffset().translate(window.scrollX, window.scrollY);
	}
	snapToGrid(e, t) {
		return (typeof e == "number" ? this.clientToLocalPoint(e, t) : this.clientToLocalPoint(e.x, e.y)).snapToGrid(this.graph.getGridSize());
	}
	localToGraphPoint(e, t) {
		return Bp(z.create(e, t), this.graph.matrix());
	}
	localToClientPoint(e, t) {
		return Bp(z.create(e, t), this.getClientMatrix());
	}
	localToPagePoint(e, t) {
		return (typeof e == "number" ? this.localToGraphPoint(e, t) : this.localToGraphPoint(e)).translate(this.getPageOffset());
	}
	localToGraphRect(e, t, n, r) {
		return Hp(B.create(e, t, n, r), this.graph.matrix());
	}
	localToClientRect(e, t, n, r) {
		return Hp(B.create(e, t, n, r), this.getClientMatrix());
	}
	localToPageRect(e, t, n, r) {
		return (typeof e == "number" ? this.localToGraphRect(e, t, n, r) : this.localToGraphRect(e)).translate(this.getPageOffset());
	}
	graphToLocalPoint(e, t) {
		return Bp(z.create(e, t), this.graph.matrix().inverse());
	}
	clientToLocalPoint(e, t) {
		return Bp(z.create(e, t), this.getClientMatrix().inverse());
	}
	clientToGraphPoint(e, t) {
		return Bp(z.create(e, t), this.graph.matrix().multiply(this.getClientMatrix().inverse()));
	}
	pageToLocalPoint(e, t) {
		let n = z.create(e, t).diff(this.getPageOffset());
		return this.graphToLocalPoint(n);
	}
	graphToLocalRect(e, t, n, r) {
		return Hp(B.create(e, t, n, r), this.graph.matrix().inverse());
	}
	clientToLocalRect(e, t, n, r) {
		return Hp(B.create(e, t, n, r), this.getClientMatrix().inverse());
	}
	clientToGraphRect(e, t, n, r) {
		return Hp(B.create(e, t, n, r), this.graph.matrix().multiply(this.getClientMatrix().inverse()));
	}
	pageToLocalRect(e, t, n, r) {
		let i = B.create(e, t, n, r), a = this.getPageOffset();
		return i.x -= a.x, i.y -= a.y, this.graphToLocalRect(i);
	}
}, rS = ".x6-graph {\n  position: relative;\n  overflow: hidden;\n  outline: none;\n  touch-action: none;\n}\n.x6-graph-background,\n.x6-graph-grid,\n.x6-graph-svg {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n}\n.x6-graph-background-stage,\n.x6-graph-grid-stage,\n.x6-graph-svg-stage {\n  user-select: none;\n}\n.x6-graph.x6-graph-pannable {\n  cursor: grab;\n  cursor: -moz-grab;\n  cursor: -webkit-grab;\n}\n.x6-graph.x6-graph-panning {\n  cursor: grabbing;\n  cursor: -moz-grabbing;\n  cursor: -webkit-grabbing;\n  user-select: none;\n}\n.x6-node {\n  cursor: move;\n  /* stylelint-disable-next-line */\n}\n.x6-node.x6-node-immovable {\n  cursor: default;\n}\n.x6-node * {\n  -webkit-user-drag: none;\n}\n.x6-node .scalable * {\n  vector-effect: non-scaling-stroke;\n}\n.x6-node [magnet='true'] {\n  cursor: crosshair;\n  transition: opacity 0.3s;\n}\n.x6-node [magnet='true']:hover {\n  opacity: 0.7;\n}\n.x6-node foreignObject {\n  display: block;\n  overflow: visible;\n  background-color: transparent;\n}\n.x6-node foreignObject > body {\n  position: static;\n  width: 100%;\n  height: 100%;\n  margin: 0;\n  padding: 0;\n  overflow: visible;\n  background-color: transparent;\n}\n.x6-edge .source-marker,\n.x6-edge .target-marker {\n  vector-effect: non-scaling-stroke;\n}\n.x6-edge .connection {\n  stroke-linejoin: round;\n  fill: none;\n}\n.x6-edge .connection-wrap {\n  cursor: move;\n  opacity: 0;\n  fill: none;\n  stroke: #000;\n  stroke-width: 15;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}\n.x6-edge .connection-wrap:hover {\n  opacity: 0.4;\n  stroke-opacity: 0.4;\n}\n.x6-edge .vertices {\n  cursor: move;\n  opacity: 0;\n}\n.x6-edge .vertices .vertex {\n  fill: #1abc9c;\n}\n.x6-edge .vertices .vertex :hover {\n  fill: #34495e;\n  stroke: none;\n}\n.x6-edge .vertices .vertex-remove {\n  cursor: pointer;\n  fill: #fff;\n}\n.x6-edge .vertices .vertex-remove-area {\n  cursor: pointer;\n  opacity: 0.1;\n}\n.x6-edge .vertices .vertex-group:hover .vertex-remove-area {\n  opacity: 1;\n}\n.x6-edge .arrowheads {\n  cursor: move;\n  opacity: 0;\n}\n.x6-edge .arrowheads .arrowhead {\n  fill: #1abc9c;\n}\n.x6-edge .arrowheads .arrowhead :hover {\n  fill: #f39c12;\n  stroke: none;\n}\n.x6-edge .tools {\n  cursor: pointer;\n  opacity: 0;\n}\n.x6-edge .tools .tool-options {\n  display: none;\n}\n.x6-edge .tools .tool-remove circle {\n  fill: #f00;\n}\n.x6-edge .tools .tool-remove path {\n  fill: #fff;\n}\n.x6-edge:hover .vertices,\n.x6-edge:hover .arrowheads,\n.x6-edge:hover .tools {\n  opacity: 1;\n}\n.x6-highlight-opacity {\n  opacity: 0.3;\n}\n.x6-cell-tool-editor {\n  position: relative;\n  display: inline-block;\n  min-height: 1em;\n  margin: 0;\n  padding: 0;\n  line-height: 1;\n  white-space: normal;\n  text-align: center;\n  vertical-align: top;\n  overflow-wrap: normal;\n  outline: none;\n  transform-origin: 0 0;\n  -webkit-user-drag: none;\n  cursor: text;\n}\n.x6-edge-tool-editor {\n  border: 1px solid #275fc5;\n  border-radius: 2px;\n}\n", iS = class extends Hx {
	init() {
		J.autoInsertCSS && Vl("core", rS);
	}
	dispose() {
		Hl("core");
	}
};
f([q()], iS.prototype, "dispose", null);
// node_modules/@antv/x6/es/graph/defs.js
var aS = class extends Hx {
	get cid() {
		return this.graph.view.cid;
	}
	get svg() {
		return this.view.svg;
	}
	get defs() {
		return this.view.defs;
	}
	isDefined(e) {
		return this.svg.getElementById(e) != null;
	}
	filter(e) {
		let t = e.id, n = e.name;
		if (t ||= `filter-${n}-${this.cid}-${Bd(JSON.stringify(e))}`, !this.isDefined(t)) {
			let r = D_.get(n);
			if (r == null) return D_.onNotFound(n);
			let i = r(e.args || {}), a = Object.assign(Object.assign({
				x: -1,
				y: -1,
				width: 3,
				height: 3,
				filterUnits: "objectBoundingBox"
			}, e.attrs), { id: t });
			lf.create(fb.sanitize(i), a).appendTo(this.defs);
		}
		return t;
	}
	gradient(e) {
		let t = e.id, n = e.type;
		if (t ||= `gradient-${n}-${this.cid}-${Bd(JSON.stringify(e))}`, !this.isDefined(t)) {
			let r = `<${n}>${e.stops.map((e) => {
				let t = e.opacity != null && Number.isFinite(e.opacity) ? e.opacity : 1;
				return `<stop offset="${e.offset}" stop-color="${e.color}" stop-opacity="${t}"/>`;
			}).join("")}</${n}>`, i = Object.assign({ id: t }, e.attrs);
			lf.create(r, i).appendTo(this.defs);
		}
		return t;
	}
	marker(e) {
		let { id: t, refX: n, refY: r, markerUnits: i, markerOrient: a, tagName: o, children: s } = e, c = d(e, [
			"id",
			"refX",
			"refY",
			"markerUnits",
			"markerOrient",
			"tagName",
			"children"
		]), l = t;
		if (l ||= `marker-${this.cid}-${Bd(JSON.stringify(e))}`, !this.isDefined(l)) {
			o !== "path" && delete c.d;
			let e = lf.create("marker", {
				refX: n,
				refY: r,
				id: l,
				overflow: "visible",
				orient: a ?? "auto",
				markerUnits: i || "userSpaceOnUse"
			}, s ? s.map((e) => {
				var { tagName: t } = e, n = d(e, ["tagName"]);
				return lf.create(`${t}` || "path", wd(Object.assign(Object.assign({}, c), n)));
			}) : [lf.create(o || "path", wd(c))]);
			this.defs.appendChild(e.node);
		}
		return l;
	}
	remove(e) {
		let t = this.svg.getElementById(e);
		t && t.parentNode && t.parentNode.removeChild(t);
	}
}, oS = class extends Hx {
	get elem() {
		return this.view.grid;
	}
	get grid() {
		return this.options.grid;
	}
	init() {
		this.startListening(), this.draw(this.grid);
	}
	startListening() {
		this.graph.on("scale", this.update, this), this.graph.on("translate", this.update, this);
	}
	stopListening() {
		this.graph.off("scale", this.update, this), this.graph.off("translate", this.update, this);
	}
	setVisible(e) {
		this.grid.visible !== e && (this.grid.visible = e, this.update());
	}
	getGridSize() {
		return this.grid.size;
	}
	setGridSize(e) {
		this.grid.size = Math.max(e, 1), this.update();
	}
	show() {
		this.setVisible(!0), this.update();
	}
	hide() {
		this.setVisible(!1), this.update();
	}
	clear() {
		this.elem.style.backgroundImage = "";
	}
	draw(e) {
		this.clear(), this.instance = null, Object.assign(this.grid, e), this.patterns = this.resolveGrid(e), this.update();
	}
	update(e = {}) {
		let t = this.grid.size;
		if (t <= 1 || !this.grid.visible) return this.clear();
		let n = this.graph.matrix(), r = this.getInstance(), i = Array.isArray(e) ? e : [e];
		this.patterns.forEach((e, a) => {
			let o = `pattern_${a}`, s = n.a || 1, c = n.d || 1, { update: l, markup: u } = e, f = d(e, ["update", "markup"]), p = Object.assign(Object.assign(Object.assign({}, f), i[a]), {
				sx: s,
				sy: c,
				ox: n.e || 0,
				oy: n.f || 0,
				width: t * s,
				height: t * c
			});
			r.has(o) || r.add(o, lf.create("pattern", {
				id: o,
				patternUnits: "userSpaceOnUse"
			}, lf.createVectors(u)).node);
			let m = r.get(o);
			typeof l == "function" && l(m.childNodes[0], p);
			let h = p.ox % p.width;
			h < 0 && (h += p.width);
			let g = p.oy % p.height;
			g < 0 && (g += p.height), W(m, {
				x: h,
				y: g,
				width: p.width,
				height: p.height
			});
		});
		let a = new XMLSerializer().serializeToString(r.root), o = `url(data:image/svg+xml;base64,${btoa(a)})`;
		this.elem.style.backgroundImage = o;
	}
	getInstance() {
		return this.instance ||= new N_(), this.instance;
	}
	resolveGrid(e) {
		if (!e) return [];
		let t = e.type;
		if (t == null) return [Object.assign(Object.assign({}, P_.dot), e.args)];
		let n = F_.get(t);
		if (n) {
			let t = e.args || [];
			return Array.isArray(t) || (t = [t]), Array.isArray(n) ? n.map((e, n) => Object.assign(Object.assign({}, e), t[n])) : [Object.assign(Object.assign({}, n), t[0])];
		}
		return F_.onNotFound(t);
	}
	dispose() {
		this.stopListening(), this.clear();
	}
};
f([q()], oS.prototype, "dispose", null);
// node_modules/@antv/x6/es/graph/highlight.js
var sS = class extends Hx {
	constructor() {
		super(...arguments), this.highlights = {};
	}
	init() {
		this.startListening();
	}
	startListening() {
		this.graph.on("cell:highlight", this.onCellHighlight, this), this.graph.on("cell:unhighlight", this.onCellUnhighlight, this);
	}
	stopListening() {
		this.graph.off("cell:highlight", this.onCellHighlight, this), this.graph.off("cell:unhighlight", this.onCellUnhighlight, this);
	}
	onCellHighlight({ view: e, magnet: t, options: n = {} }) {
		let r = this.resolveHighlighter(n);
		if (!r) return;
		let i = this.getHighlighterId(t, r);
		if (!this.highlights[i]) {
			let n = r.highlighter;
			n.highlight(e, t, Object.assign({}, r.args)), this.highlights[i] = {
				cellView: e,
				magnet: t,
				highlighter: n,
				args: r.args
			};
		}
	}
	onCellUnhighlight({ magnet: e, options: t = {} }) {
		let n = this.resolveHighlighter(t);
		if (!n) return;
		let r = this.getHighlighterId(e, n);
		this.unhighlight(r);
	}
	resolveHighlighter(e) {
		let t = this.options, n = e.highlighter;
		if (n == null) {
			let r = e.type;
			n = r && t.highlighting[r] || t.highlighting.default;
		}
		if (n == null) return null;
		let r = typeof n == "string" ? { name: n } : n, i = r.name, a = X_.get(i);
		return a == null ? X_.onNotFound(i) : (J_(i, a), {
			name: i,
			highlighter: a,
			args: r.args || {}
		});
	}
	getHighlighterId(e, t) {
		return Gu(e), t.name + e.id + JSON.stringify(t.args);
	}
	unhighlight(e) {
		let t = this.highlights[e];
		t && (t.highlighter.unhighlight(t.cellView, t.magnet, t.args), delete this.highlights[e]);
	}
	dispose() {
		Object.keys(this.highlights).forEach((e) => this.unhighlight(e)), this.stopListening();
	}
};
f([q()], sS.prototype, "dispose", null);
// node_modules/@antv/x6/es/graph/mousewheel.js
var cS = class extends Hx {
	constructor() {
		super(...arguments), this.cumulatedFactor = 1;
	}
	get widgetOptions() {
		return this.options.mousewheel;
	}
	init() {
		this.container = this.graph.container, this.target = this.widgetOptions.global ? document : this.container, this.mousewheelHandle = new Fp(this.target, this.onMouseWheel.bind(this), this.allowMouseWheel.bind(this)), this.widgetOptions.enabled && this.enable(!0);
	}
	get disabled() {
		return this.widgetOptions.enabled !== !0;
	}
	enable(e) {
		(this.disabled || e) && (this.widgetOptions.enabled = !0, this.mousewheelHandle.enable());
	}
	disable() {
		this.disabled || (this.widgetOptions.enabled = !1, this.mousewheelHandle.disable());
	}
	allowMouseWheel(e) {
		let t = this.widgetOptions.guard;
		return (t == null || t(e)) && Jm(e, this.widgetOptions.modifiers);
	}
	onMouseWheel(e) {
		let t = this.widgetOptions.guard;
		if ((t == null || t(e)) && Jm(e, this.widgetOptions.modifiers)) {
			let t = this.widgetOptions.factor || 1.2;
			this.currentScale ??= (this.startPos = {
				x: e.clientX,
				y: e.clientY
			}, this.graph.transform.getScale().sx), e.deltaY < 0 ? (this.cumulatedFactor = this.currentScale < .15 ? (this.currentScale + .01) / this.currentScale : Math.round(this.currentScale * t * 20) / 20 / this.currentScale, this.cumulatedFactor <= 1 && (this.cumulatedFactor = 1.05)) : (this.cumulatedFactor = this.currentScale <= .15 ? (this.currentScale - .01) / this.currentScale : Math.round(this.currentScale * (1 / t) * 20) / 20 / this.currentScale, this.cumulatedFactor >= 1 && (this.cumulatedFactor = .95)), this.cumulatedFactor = Math.max(.01, Math.min(this.currentScale * this.cumulatedFactor, 160) / this.currentScale);
			let n = this.currentScale, r = this.graph.transform.clampScale(n * this.cumulatedFactor), i = this.widgetOptions.minScale || -(2 ** 53 - 1), a = this.widgetOptions.maxScale || 2 ** 53 - 1;
			if (r = Yi(r, i, a), r !== n) {
				if (this.widgetOptions.zoomAtMousePosition) {
					let e = this.graph.getPlugin("scroller") ? this.graph.clientToLocal(this.startPos) : this.graph.clientToGraph(this.startPos);
					this.graph.zoom(r, {
						absolute: !0,
						center: e.clone()
					});
				} else this.graph.zoom(r, { absolute: !0 });
			}
			this.currentScale = null, this.cumulatedFactor = 1;
		}
	}
	dispose() {
		this.disable();
	}
};
f([q()], cS.prototype, "dispose", null);
// node_modules/@antv/x6/es/graph/options.js
function lS(e) {
	let { container: t, grid: n, panning: r, mousewheel: i, embedding: a } = e, o = d(e, [
		"container",
		"grid",
		"panning",
		"mousewheel",
		"embedding"
	]), s = uS(t);
	o.width ??= s.clientWidth, o.height ??= s.clientHeight;
	let c = Qc({}, fS, o, { container: s }), l = {
		size: 10,
		visible: !1
	};
	return c.grid = typeof n == "number" ? {
		size: n,
		visible: !1
	} : typeof n == "boolean" ? Object.assign(Object.assign({}, l), { visible: n }) : Object.assign(Object.assign({}, l), n), [
		"panning",
		"mousewheel",
		"embedding"
	].forEach((t) => {
		let n = e[t];
		typeof n == "boolean" ? c[t].enabled = n : n != null && (c[t] = Object.assign(Object.assign({}, c[t]), n));
	}), c;
}
function uS(e) {
	if (typeof e != "string") {
		if (dS(e)) return e;
		throw Error("Ensure the container of the graph is specified and valid");
	}
	let t = e.trim(), n = t ? document.getElementById(t) : null;
	if (!dS(n)) throw Error(`Cannot find the graph container: "${e}"`);
	return n;
}
function dS(e) {
	if (typeof e != "object" || !e) return !1;
	let t = e.ownerDocument?.defaultView;
	return t != null && e instanceof t.HTMLElement;
}
var fS = {
	x: 0,
	y: 0,
	scaling: {
		min: .01,
		max: 16
	},
	grid: {
		size: 10,
		visible: !1
	},
	background: !1,
	panning: {
		enabled: !0,
		eventTypes: ["leftMouseDown"]
	},
	mousewheel: {
		enabled: !1,
		factor: 1.2,
		zoomAtMousePosition: !0
	},
	highlighting: {
		default: {
			name: "stroke",
			args: { padding: 3 }
		},
		nodeAvailable: {
			name: "className",
			args: { className: J.prefix("available-node") }
		},
		magnetAvailable: {
			name: "className",
			args: { className: J.prefix("available-magnet") }
		}
	},
	connecting: {
		snap: !1,
		allowLoop: !0,
		allowNode: !0,
		allowEdge: !1,
		allowPort: !0,
		allowBlank: !0,
		allowMulti: !0,
		highlight: !1,
		anchor: "center",
		edgeAnchor: "ratio",
		connectionPoint: "boundary",
		router: "normal",
		connector: "normal",
		validateConnection({ type: e, sourceView: t, targetView: n }) {
			return (e === "target" ? n : t) != null;
		},
		createEdge() {
			return new Vx();
		}
	},
	translating: { restrict: !1 },
	embedding: {
		enabled: !1,
		findParent: "bbox",
		frontOnly: !0,
		validate: () => !0
	},
	moveThreshold: 0,
	clickThreshold: 0,
	magnetThreshold: 0,
	preventDefaultDblClick: !0,
	preventDefaultMouseDown: !1,
	preventDefaultContextMenu: !0,
	preventDefaultBlankAction: !0,
	interacting: { edgeLabelMovable: !1 },
	async: !0,
	virtual: !1,
	guard: () => !1
}, pS = class extends Hx {
	get widgetOptions() {
		return this.options.panning;
	}
	get pannable() {
		return this.widgetOptions && this.widgetOptions.enabled === !0;
	}
	init() {
		this.onRightMouseDown = this.onRightMouseDown.bind(this), this.onKeyDown = this.onKeyDown.bind(this), this.onKeyUp = this.onKeyUp.bind(this), this.startListening(), this.updateClassName();
	}
	startListening() {
		this.graph.on("blank:mousedown", this.onMouseDown, this), this.graph.on("node:unhandled:mousedown", this.onMouseDown, this), this.graph.on("edge:unhandled:mousedown", this.onMouseDown, this), K.on(this.graph.container, "mousedown", this.onRightMouseDown), K.on(document.body, {
			keydown: this.onKeyDown,
			keyup: this.onKeyUp
		}), this.mousewheelHandle = new Fp(this.graph.container, this.onMouseWheel.bind(this), this.allowMouseWheel.bind(this)), this.mousewheelHandle.enable();
	}
	stopListening() {
		this.graph.off("blank:mousedown", this.onMouseDown, this), this.graph.off("node:unhandled:mousedown", this.onMouseDown, this), this.graph.off("edge:unhandled:mousedown", this.onMouseDown, this), K.off(this.graph.container, "mousedown", this.onRightMouseDown), K.off(document.body, {
			keydown: this.onKeyDown,
			keyup: this.onKeyUp
		}), this.mousewheelHandle && this.mousewheelHandle.disable();
	}
	allowPanning(e, t) {
		return e.spaceKey = this.isSpaceKeyPressed, this.pannable && Jm(e, this.widgetOptions.modifiers, t);
	}
	startPanning(e) {
		let t = this.view.normalizeEvent(e);
		this.clientX = t.clientX, this.clientY = t.clientY, this.panning = !0, this.updateClassName(e), K.on(document.body, {
			"mousemove.panning touchmove.panning": this.pan.bind(this),
			"mouseup.panning touchend.panning": this.stopPanning.bind(this),
			"mouseleave.panning": this.stopPanning.bind(this)
		}), K.on(window, "mouseup.panning", this.stopPanning.bind(this));
	}
	pan(e) {
		let t = this.view.normalizeEvent(e), n = t.clientX - this.clientX, r = t.clientY - this.clientY;
		this.clientX = t.clientX, this.clientY = t.clientY, this.graph.translateBy(n, r);
	}
	stopPanning(e) {
		this.panning = !1, this.updateClassName(e), K.off(document.body, ".panning"), K.off(window, ".panning");
	}
	updateClassName(e) {
		let t = this.widgetOptions.eventTypes;
		if (t?.length === 1 && t.includes("mouseWheel")) return;
		let n = this.view.container, r = this.view.prefixClassName("graph-panning"), i = this.view.prefixClassName("graph-pannable"), a = this.graph.getPlugin("selection"), o = a && a.allowRubberband(e, !0), s = t?.includes("leftMouseDown") && !o;
		this.allowPanning(e ?? {}, !0) || this.allowPanning(e ?? {}) && s ? this.panning ? (U(n, r), Vu(n, i)) : (Vu(n, r), U(n, i)) : this.panning || (Vu(n, r), Vu(n, i));
	}
	onMouseDown({ e }) {
		if (!this.allowBlankMouseDown(e)) return;
		let t = this.graph.getPlugin("selection"), n = t && t.allowRubberband(e, !0);
		(this.allowPanning(e, !0) || this.allowPanning(e) && !n) && this.startPanning(e);
	}
	onRightMouseDown(e) {
		this.widgetOptions.eventTypes?.includes("rightMouseDown") && e.button === 2 && this.allowPanning(e, !0) && this.startPanning(e);
	}
	onMouseWheel(e, t, n) {
		this.graph.translateBy(-t, -n);
	}
	onKeyDown(e) {
		e.which === 32 && (this.isSpaceKeyPressed = !0), this.updateClassName(e);
	}
	onKeyUp(e) {
		e.which === 32 && (this.isSpaceKeyPressed = !1), this.updateClassName(e);
	}
	allowBlankMouseDown(e) {
		let t = this.widgetOptions.eventTypes;
		return typeof e.type == "string" && e.type.startsWith("touch") || e.pointerType === "touch" ? t?.includes("leftMouseDown") : t?.includes("leftMouseDown") && e.button === 0 || t?.includes("mouseWheelDown") && e.button === 1;
	}
	allowMouseWheel(e) {
		return this.pannable && !e.ctrlKey && this.widgetOptions.eventTypes?.includes("mouseWheel");
	}
	autoPanning(e, t) {
		let n = this.graph.getGraphArea(), r = 0, i = 0;
		e <= n.left + 10 && (r = -10), t <= n.top + 10 && (i = -10), e >= n.right - 10 && (r = 10), t >= n.bottom - 10 && (i = 10), (r !== 0 || i !== 0) && this.graph.translateBy(-r, -i);
	}
	enablePanning() {
		this.pannable || (this.widgetOptions.enabled = !0, this.updateClassName());
	}
	disablePanning() {
		this.pannable && (this.widgetOptions.enabled = !1, this.updateClassName());
	}
	dispose() {
		this.stopListening();
	}
};
f([q()], pS.prototype, "dispose", null);
// node_modules/@antv/x6/es/graph/size.js
var mS = class extends Hx {
	getScroller() {
		let e = this.graph.getPlugin("scroller");
		return e && e.options.enabled ? e : null;
	}
	getContainer() {
		let e = this.getScroller();
		return e ? e.container.parentElement : this.graph.container.parentElement;
	}
	getSensorTarget() {
		let e = this.options.autoResize;
		if (e) return typeof e == "boolean" ? this.getContainer() || void 0 : e;
	}
	init() {
		if (this.options.autoResize) {
			let e = this.getSensorTarget();
			if (e) {
				if (typeof ResizeObserver > "u") return;
				this.ro = new ResizeObserver((e) => {
					if (!e || e.length === 0) return;
					let { width: t, height: n } = e[0].contentRect;
					this.resize(Math.round(t), Math.round(n));
				}), this.ro.observe(e);
				let t = e.offsetWidth, n = e.offsetHeight;
				this.resize(t, n);
			}
		}
	}
	resize(e, t) {
		let n = this.getScroller();
		n ? n.resize(e, t) : this.graph.transform.resize(e, t);
	}
	dispose() {
		this.ro &&= (this.ro.disconnect(), void 0);
	}
};
f([q()], mS.prototype, "dispose", null);
// node_modules/@antv/x6/es/graph/transform.js
var hS = class extends Hx {
	get container() {
		return this.graph.view.container;
	}
	get viewport() {
		return this.graph.view.viewport;
	}
	get stage() {
		return this.graph.view.stage;
	}
	init() {
		this.resize();
	}
	getMatrix() {
		let e = this.viewport.getAttribute("transform");
		return e !== this.viewportTransformString && (this.viewportMatrix = this.viewport.getCTM(), this.viewportTransformString = e), Rf(this.viewportMatrix);
	}
	setMatrix(e) {
		let t = Rf(e), n = Vf(t);
		this.viewport.setAttribute("transform", n), this.viewportMatrix = t, this.viewportTransformString = n;
	}
	resize(e, t) {
		let n = e === void 0 ? this.options.width : e, r = t === void 0 ? this.options.height : t;
		this.options.width = n, this.options.height = r, typeof n == "number" && (n = Math.round(n)), typeof r == "number" && (r = Math.round(r)), this.container.style.width = n == null ? "" : `${n}px`, this.container.style.height = r == null ? "" : `${r}px`;
		let i = this.getComputedSize();
		return this.graph.trigger("resize", Object.assign({}, i)), this;
	}
	getComputedSize() {
		let e = this.options.width, t = this.options.height;
		return Jc(e) || (e = this.container.clientWidth), Jc(t) || (t = this.container.clientHeight), {
			width: e,
			height: t
		};
	}
	getScale() {
		return Gf(this.getMatrix());
	}
	scale(e, t = e, n = 0, r = 0, i = !0) {
		if (e = this.clampScale(e), t = this.clampScale(t), i && (n || r)) {
			let i = this.getTranslation(), a = this.getScale(), o = n - (n - i.tx) * (e / a.sx), s = r - (r - i.ty) * (t / a.sy);
			(o !== i.tx || s !== i.ty) && this.translate(o, s);
		}
		let a = this.getMatrix();
		return a.a = e, a.d = t, this.setMatrix(a), this.graph.trigger("scale", {
			sx: e,
			sy: t,
			ox: n,
			oy: r
		}), this;
	}
	clampScale(e) {
		let t = this.graph.options.scaling;
		return Yi(e, t.min || .01, t.max || 16);
	}
	getZoom() {
		return this.getScale().sx;
	}
	zoom(e, t) {
		t ||= {};
		let n = e, r = e, i = this.getScale(), a = this.getComputedSize(), o = a.width / 2, s = a.height / 2;
		return t.absolute || (n += i.sx, r += i.sy), t.scaleGrid && (n = Math.round(n / t.scaleGrid) * t.scaleGrid, r = Math.round(r / t.scaleGrid) * t.scaleGrid), t.maxScale && (n = Math.min(t.maxScale, n), r = Math.min(t.maxScale, r)), t.minScale && (n = Math.max(t.minScale, n), r = Math.max(t.minScale, r)), t.center && (o = t.center.x, s = t.center.y), n = this.clampScale(n), r = this.clampScale(r), this.scale(n, r, o, s), this;
	}
	getRotation() {
		return Kf(this.getMatrix());
	}
	rotate(e, t, n) {
		if (t == null || n == null) {
			let e = Wp(this.stage);
			t = e.width / 2, n = e.height / 2;
		}
		let r = this.getMatrix().translate(t, n).rotate(e).translate(-t, -n);
		return this.setMatrix(r), this;
	}
	getTranslation() {
		return qf(this.getMatrix());
	}
	translate(e, t) {
		let n = this.getMatrix();
		n.e = e || 0, n.f = t || 0, this.setMatrix(n);
		let r = this.getTranslation();
		return this.options.x = r.tx, this.options.y = r.ty, this.graph.trigger("translate", Object.assign({}, r)), this;
	}
	setOrigin(e, t) {
		return this.translate(e || 0, t || 0);
	}
	fitToContent(e, t, n, r) {
		if (typeof e == "object") {
			let i = e;
			e = i.gridWidth || 1, t = i.gridHeight || 1, n = i.padding || 0, r = i;
		} else e ||= 1, t ||= 1, n ||= 0, r ??= {};
		let i = Dl(n), a = r.border || 0, o = r.contentArea ? B.create(r.contentArea) : this.getContentArea(r);
		a > 0 && o.inflate(a);
		let s = this.getScale(), c = this.getTranslation(), l = s.sx, u = s.sy;
		o.x *= l, o.y *= u, o.width *= l, o.height *= u;
		let d = Math.max(Math.ceil((o.width + o.x) / e), 1) * e, f = Math.max(Math.ceil((o.height + o.y) / t), 1) * t, p = 0, m = 0;
		(r.allowNewOrigin === "negative" && o.x < 0 || r.allowNewOrigin === "positive" && o.x >= 0 || r.allowNewOrigin === "any") && (p = Math.ceil(-o.x / e) * e, p += i.left, d += p), (r.allowNewOrigin === "negative" && o.y < 0 || r.allowNewOrigin === "positive" && o.y >= 0 || r.allowNewOrigin === "any") && (m = Math.ceil(-o.y / t) * t, m += i.top, f += m), d += i.right, f += i.bottom, d = Math.max(d, r.minWidth || 0), f = Math.max(f, r.minHeight || 0), d = Math.min(d, r.maxWidth || 2 ** 53 - 1), f = Math.min(f, r.maxHeight || 2 ** 53 - 1);
		let h = this.getComputedSize(), g = d !== h.width || f !== h.height;
		return (p !== c.tx || m !== c.ty) && this.translate(p, m), g && this.resize(d, f), new B(-p / l, -m / u, d / l, f / u);
	}
	scaleContentToFit(e = {}) {
		this.scaleContentToFitImpl(e);
	}
	scaleContentToFitImpl(e = {}, t = !0) {
		let n, r;
		if (e.contentArea) {
			let t = e.contentArea;
			n = this.graph.localToGraph(t), r = z.create(t);
		} else n = this.getContentBBox(e), r = this.graph.graphToLocal(n);
		if (!n.width || !n.height) return;
		let i = Dl(e.padding), a = e.minScale || 0, o = e.maxScale || 2 ** 53 - 1, s = e.minScaleX || a, c = e.maxScaleX || o, l = e.minScaleY || a, u = e.maxScaleY || o, d;
		if (e.viewportArea) d = e.viewportArea;
		else {
			let e = this.getComputedSize(), t = this.getTranslation();
			d = {
				x: t.tx,
				y: t.ty,
				width: e.width,
				height: e.height
			};
		}
		d = B.create(d).moveAndExpand({
			x: i.left,
			y: i.top,
			width: -i.left - i.right,
			height: -i.top - i.bottom
		});
		let f = this.getScale(), p = d.width / n.width * f.sx, m = d.height / n.height * f.sy;
		e.preserveAspectRatio !== !1 && (p = m = Math.min(p, m));
		let h = e.scaleGrid;
		if (h && (p = h * Math.floor(p / h), m = h * Math.floor(m / h)), p = Yi(p, s, c), m = Yi(m, l, u), this.scale(p, m), t) {
			let e = this.options, t = d.x - r.x * p - e.x, n = d.y - r.y * m - e.y;
			this.translate(t, n);
		}
	}
	getContentArea(e = {}) {
		return e.useCellGeometry === !1 ? Wp(this.stage) : this.model.getAllCellsBBox() || new B();
	}
	getContentBBox(e = {}) {
		return this.graph.localToGraph(this.getContentArea(e));
	}
	getGraphArea() {
		let e = B.fromSize(this.getComputedSize());
		return this.graph.graphToLocal(e);
	}
	zoomToRect(e, t = {}) {
		let n = B.create(e), r = this.graph;
		t.contentArea = n, t.viewportArea ??= {
			x: r.options.x,
			y: r.options.y,
			width: this.options.width,
			height: this.options.height
		}, this.scaleContentToFitImpl(t, !1);
		let i = n.getCenter();
		return this.centerPoint(i.x, i.y), this;
	}
	zoomToFit(e = {}) {
		return this.zoomToRect(this.getContentArea(e), e);
	}
	centerPoint(e, t) {
		let n = this.getComputedSize(), r = this.getScale(), i = this.getTranslation(), a = n.width / 2, o = n.height / 2;
		e = typeof e == "number" ? e : a, t = typeof t == "number" ? t : o, e = a - e * r.sx, t = o - t * r.sy, (i.tx !== e || i.ty !== t) && this.translate(e, t);
	}
	centerContent(e) {
		let t = this.graph.getContentArea(e).getCenter();
		this.centerPoint(t.x, t.y);
	}
	centerCell(e) {
		return this.positionCell(e, "center");
	}
	positionPoint(e, t, n) {
		let r = this.getComputedSize();
		t = El(t, Math.max(0, r.width)), t < 0 && (t = r.width + t), n = El(n, Math.max(0, r.height)), n < 0 && (n = r.height + n);
		let i = this.getTranslation(), a = this.getScale(), o = t - e.x * a.sx, s = n - e.y * a.sy;
		(i.tx !== o || i.ty !== s) && this.translate(o, s);
	}
	positionRect(e, t) {
		let n = B.create(e);
		switch (t) {
			case "center": return this.positionPoint(n.getCenter(), "50%", "50%");
			case "top": return this.positionPoint(n.getTopCenter(), "50%", 0);
			case "top-right": return this.positionPoint(n.getTopRight(), "100%", 0);
			case "right": return this.positionPoint(n.getRightMiddle(), "100%", "50%");
			case "bottom-right": return this.positionPoint(n.getBottomRight(), "100%", "100%");
			case "bottom": return this.positionPoint(n.getBottomCenter(), "50%", "100%");
			case "bottom-left": return this.positionPoint(n.getBottomLeft(), 0, "100%");
			case "left": return this.positionPoint(n.getLeftMiddle(), 0, "50%");
			case "top-left": return this.positionPoint(n.getTopLeft(), 0, 0);
			default: return this;
		}
	}
	positionCell(e, t) {
		let n = e.getBBox();
		return this.positionRect(n, t);
	}
	positionContent(e, t) {
		let n = this.graph.getContentArea(t);
		return this.positionRect(n, e);
	}
}, gS = `${J.prefixCls}-graph`, _S = class e extends yb {
	static snapshoot(e) {
		let t = e.cloneNode();
		return e.childNodes.forEach((e) => {
			t.appendChild(e);
		}), () => {
			for (od(e); e.attributes.length > 0;) e.removeAttribute(e.attributes[0].name);
			for (let n = 0, r = t.attributes.length; n < r; n += 1) {
				let r = t.attributes[n];
				e.setAttribute(r.name, r.value);
			}
			t.childNodes.forEach((t) => {
				e.appendChild(t);
			});
		};
	}
	get disposeContainer() {
		return !1;
	}
	get options() {
		return this.graph.options;
	}
	constructor(t) {
		super(), this.graph = t;
		let { selectors: n, fragment: r } = fb.parseJSONMarkup(e.markup);
		this.background = n.background, this.grid = n.grid, this.svg = n.svg, this.defs = n.defs, this.viewport = n.viewport, this.primer = n.primer, this.stage = n.stage, this.decorator = n.decorator, this.overlay = n.overlay, this.container = this.options.container, this.restore = e.snapshoot(this.container), U(this.container, this.prefixClassName("graph")), sd(this.container, r), this.delegateEvents();
	}
	delegateEvents() {
		let e = this.constructor;
		return super.delegateEvents(e.events), this;
	}
	guard(e, t) {
		return e.type === "mousedown" && e.button === 2 || this.options.guard && this.options.guard(e, t) ? !0 : e.data && e.data.guarded !== void 0 ? e.data.guarded : !(t && t.cell && Y.isCell(t.cell) || this.svg === e.target || this.container === e.target || this.svg.contains(e.target));
	}
	findView(e) {
		return this.graph.findViewByElem(e);
	}
	onDblClick(e) {
		this.options.preventDefaultDblClick && e.preventDefault();
		let t = this.normalizeEvent(e), n = this.findView(t.target);
		if (this.guard(t, n)) return;
		let r = this.graph.snapToGrid(t.clientX, t.clientY);
		n ? n.onDblClick(t, r.x, r.y) : this.graph.trigger("blank:dblclick", {
			e: t,
			x: r.x,
			y: r.y
		});
	}
	onClick(e) {
		if (this.getMouseMovedCount(e) <= this.options.clickThreshold) {
			let t = this.normalizeEvent(e), n = this.findView(t.target);
			if (this.guard(t, n)) return;
			let r = this.graph.snapToGrid(t.clientX, t.clientY);
			n ? n.onClick(t, r.x, r.y) : this.graph.trigger("blank:click", {
				e: t,
				x: r.x,
				y: r.y
			});
		}
	}
	isPreventDefaultContextMenu(e) {
		let t = this.options.preventDefaultContextMenu;
		return typeof t == "function" && (t = R(t, this.graph, { view: e })), t;
	}
	onContextMenu(e) {
		let t = this.normalizeEvent(e), n = this.findView(t.target);
		if (this.isPreventDefaultContextMenu(n) && e.preventDefault(), this.guard(t, n)) return;
		let r = this.graph.snapToGrid(t.clientX, t.clientY);
		n ? n.onContextMenu(t, r.x, r.y) : this.graph.trigger("blank:contextmenu", {
			e: t,
			x: r.x,
			y: r.y
		});
	}
	delegateDragEvents(e, t) {
		e.data ??= {}, this.setEventData(e, {
			currentView: t || null,
			mouseMovedCount: 0,
			startPosition: {
				x: e.clientX,
				y: e.clientY
			}
		});
		let n = this.constructor;
		this.delegateDocumentEvents(n.documentEvents, e.data), this.undelegateEvents();
	}
	getMouseMovedCount(e) {
		return this.getEventData(e).mouseMovedCount || 0;
	}
	onMouseDown(e) {
		let t = this.normalizeEvent(e), n = this.findView(t.target);
		if (this.guard(t, n)) return;
		this.options.preventDefaultMouseDown && e.preventDefault();
		let r = this.graph.snapToGrid(t.clientX, t.clientY);
		n ? n.onMouseDown(t, r.x, r.y) : (this.options.preventDefaultBlankAction && ["touchstart"].includes(t.type) && e.preventDefault(), this.graph.trigger("blank:mousedown", {
			e: t,
			x: r.x,
			y: r.y
		})), this.delegateDragEvents(t, n);
	}
	onMouseMove(e) {
		let t = this.getEventData(e), n = t.startPosition;
		if (n && n.x === e.clientX && n.y === e.clientY || (t.mouseMovedCount ??= 0, t.mouseMovedCount += 1, t.mouseMovedCount <= this.options.moveThreshold)) return;
		let r = this.normalizeEvent(e), i = this.graph.snapToGrid(r.clientX, r.clientY), a = t.currentView;
		a ? a.onMouseMove(r, i.x, i.y) : this.graph.trigger("blank:mousemove", {
			e: r,
			x: i.x,
			y: i.y
		}), this.setEventData(r, t);
	}
	onMouseUp(e) {
		this.undelegateDocumentEvents();
		let t = this.normalizeEvent(e), n = this.graph.snapToGrid(t.clientX, t.clientY), r = this.getEventData(e).currentView;
		if (r ? r.onMouseUp(t, n.x, n.y) : this.graph.trigger("blank:mouseup", {
			e: t,
			x: n.x,
			y: n.y
		}), !e.isPropagationStopped()) {
			let t = new Dp(e, {
				type: "click",
				data: e.data
			});
			this.onClick(t);
		}
		e.stopImmediatePropagation(), this.delegateEvents();
	}
	onMouseOver(e) {
		let t = this.normalizeEvent(e), n = this.findView(t.target);
		if (!this.guard(t, n)) {
			if (n) n.onMouseOver(t);
			else {
				if (this.container === t.target) return;
				this.graph.trigger("blank:mouseover", { e: t });
			}
		}
	}
	onMouseOut(e) {
		let t = this.normalizeEvent(e), n = this.findView(t.target);
		if (!this.guard(t, n)) {
			if (n) n.onMouseOut(t);
			else {
				if (this.container === t.target) return;
				this.graph.trigger("blank:mouseout", { e: t });
			}
		}
	}
	onMouseEnter(e) {
		let t = this.normalizeEvent(e), n = this.findView(t.target);
		if (this.guard(t, n)) return;
		let r = this.graph.findViewByElem(t.relatedTarget);
		if (n) {
			if (r === n) return;
			n.onMouseEnter(t);
		} else {
			if (r) return;
			this.graph.trigger("graph:mouseenter", { e: t });
		}
	}
	onMouseLeave(e) {
		let t = this.normalizeEvent(e), n = this.findView(t.target);
		if (this.guard(t, n)) return;
		let r = this.graph.findViewByElem(t.relatedTarget);
		if (n) {
			if (r === n) return;
			n.onMouseLeave(t);
		} else {
			if (r) return;
			this.graph.trigger("graph:mouseleave", { e: t });
		}
	}
	onMouseWheel(e) {
		let t = this.normalizeEvent(e), n = this.findView(t.target);
		if (this.guard(t, n)) return;
		let r = t.originalEvent, i = this.graph.snapToGrid(r.clientX, r.clientY), a = Math.max(-1, Math.min(1, r.wheelDelta || -r.detail));
		n ? n.onMouseWheel(t, i.x, i.y, a) : this.graph.trigger("blank:mousewheel", {
			e: t,
			delta: a,
			x: i.x,
			y: i.y
		});
	}
	onCustomEvent(e) {
		let t = e.currentTarget, n = t.getAttribute("event") || t.getAttribute("data-event");
		if (n) {
			let r = this.findView(t);
			if (r) {
				let t = this.normalizeEvent(e);
				if (this.guard(t, r)) return;
				let i = this.graph.snapToGrid(t.clientX, t.clientY);
				r.onCustomEvent(t, n, i.x, i.y);
			}
		}
	}
	handleMagnetEvent(e, t) {
		let n = e.currentTarget, r = n.getAttribute("magnet");
		if (r && r.toLowerCase() !== "false") {
			let r = this.findView(n);
			if (r) {
				let i = this.normalizeEvent(e);
				if (this.guard(i, r)) return;
				let a = this.graph.snapToGrid(i.clientX, i.clientY);
				R(t, this.graph, r, i, n, a.x, a.y);
			}
		}
	}
	onMagnetMouseDown(e) {
		this.handleMagnetEvent(e, (e, t, n, r, i) => {
			e.onMagnetMouseDown(t, n, r, i);
		});
	}
	onMagnetDblClick(e) {
		this.handleMagnetEvent(e, (e, t, n, r, i) => {
			e.onMagnetDblClick(t, n, r, i);
		});
	}
	onMagnetContextMenu(e) {
		let t = this.findView(e.target);
		this.isPreventDefaultContextMenu(t) && e.preventDefault(), this.handleMagnetEvent(e, (e, t, n, r, i) => {
			e.onMagnetContextMenu(t, n, r, i);
		});
	}
	onLabelMouseDown(e) {
		let t = e.currentTarget, n = this.findView(t);
		if (n) {
			let t = this.normalizeEvent(e);
			if (this.guard(t, n)) return;
			let r = this.graph.snapToGrid(t.clientX, t.clientY);
			n.onLabelMouseDown(t, r.x, r.y);
		}
	}
	onImageDragStart() {
		return !1;
	}
	dispose() {
		this.undelegateEvents(), this.undelegateDocumentEvents(), this.restore(), this.restore = () => {};
	}
};
_S.markup = [
	{
		ns: qu.xhtml,
		tagName: "div",
		selector: "background",
		className: `${gS}-background`
	},
	{
		ns: qu.xhtml,
		tagName: "div",
		selector: "grid",
		className: `${gS}-grid`
	},
	{
		ns: qu.svg,
		tagName: "svg",
		selector: "svg",
		className: `${gS}-svg`,
		attrs: {
			width: "100%",
			height: "100%",
			"xmlns:xlink": qu.xlink
		},
		children: [{
			tagName: "defs",
			selector: "defs"
		}, {
			tagName: "g",
			selector: "viewport",
			className: `${gS}-svg-viewport`,
			children: [
				{
					tagName: "g",
					selector: "primer",
					className: `${gS}-svg-primer`
				},
				{
					tagName: "g",
					selector: "stage",
					className: `${gS}-svg-stage`
				},
				{
					tagName: "g",
					selector: "decorator",
					className: `${gS}-svg-decorator`
				},
				{
					tagName: "g",
					selector: "overlay",
					className: `${gS}-svg-overlay`
				}
			]
		}]
	}
], _S.events = {
	dblclick: "onDblClick",
	contextmenu: "onContextMenu",
	touchstart: "onMouseDown",
	mousedown: "onMouseDown",
	mouseover: "onMouseOver",
	mouseout: "onMouseOut",
	mouseenter: "onMouseEnter",
	mouseleave: "onMouseLeave",
	mousewheel: "onMouseWheel",
	DOMMouseScroll: "onMouseWheel",
	[`mouseenter  .${J.prefixCls}-cell`]: "onMouseEnter",
	[`mouseleave  .${J.prefixCls}-cell`]: "onMouseLeave",
	[`mouseenter  .${J.prefixCls}-cell-tools`]: "onMouseEnter",
	[`mouseleave  .${J.prefixCls}-cell-tools`]: "onMouseLeave",
	[`mousedown   .${J.prefixCls}-cell [event]`]: "onCustomEvent",
	[`touchstart  .${J.prefixCls}-cell [event]`]: "onCustomEvent",
	[`mousedown   .${J.prefixCls}-cell [data-event]`]: "onCustomEvent",
	[`touchstart  .${J.prefixCls}-cell [data-event]`]: "onCustomEvent",
	[`dblclick    .${J.prefixCls}-cell [magnet]`]: "onMagnetDblClick",
	[`contextmenu .${J.prefixCls}-cell [magnet]`]: "onMagnetContextMenu",
	[`mousedown   .${J.prefixCls}-cell [magnet]`]: "onMagnetMouseDown",
	[`touchstart  .${J.prefixCls}-cell [magnet]`]: "onMagnetMouseDown",
	[`dblclick    .${J.prefixCls}-cell [data-magnet]`]: "onMagnetDblClick",
	[`contextmenu .${J.prefixCls}-cell [data-magnet]`]: "onMagnetContextMenu",
	[`mousedown   .${J.prefixCls}-cell [data-magnet]`]: "onMagnetMouseDown",
	[`touchstart  .${J.prefixCls}-cell [data-magnet]`]: "onMagnetMouseDown",
	[`dragstart   .${J.prefixCls}-cell image`]: "onImageDragStart",
	[`mousedown   .${J.prefixCls}-edge .${J.prefixCls}-edge-label`]: "onLabelMouseDown",
	[`touchstart  .${J.prefixCls}-edge .${J.prefixCls}-edge-label`]: "onLabelMouseDown"
}, _S.documentEvents = {
	mousemove: "onMouseMove",
	touchmove: "onMouseMove",
	mouseup: "onMouseUp",
	touchend: "onMouseUp",
	touchcancel: "onMouseUp"
}, f([q()], _S.prototype, "dispose", null);
// node_modules/@antv/x6/es/graph/virtual-render.js
var vS = 120, yS = class extends Hx {
	init() {
		this.resetRenderArea = _l(this.resetRenderArea, 200, { leading: !0 }), this.resetRenderArea(), this.startListening();
	}
	bindScrollerEvents(e) {
		this.scrollerRef = e, typeof e.on == "function" && (e.on("pan:start", this.resetRenderArea, this), e.on("panning", this.resetRenderArea, this), e.on("pan:stop", this.resetRenderArea, this));
		let t = e.container;
		t && (this.scrollerScrollHandler = (e) => {
			this.resetRenderArea();
		}, K.on(t, "scroll", this.scrollerScrollHandler));
	}
	startListening() {
		this.graph.on("translate", this.resetRenderArea, this), this.graph.on("scale", this.resetRenderArea, this), this.graph.on("resize", this.resetRenderArea, this);
		let e = this.graph.getPlugin("scroller");
		e && this.bindScrollerEvents(e);
	}
	stopListening() {
		this.graph.off("translate", this.resetRenderArea, this), this.graph.off("scale", this.resetRenderArea, this), this.graph.off("resize", this.resetRenderArea, this), this.unbindScroller();
	}
	onScrollerReady(e) {
		this.scrollerRef !== e && (this.unbindScroller(), this.bindScrollerEvents(e), this.resetRenderArea());
	}
	unbindScroller() {
		if (this.scrollerRef) {
			typeof this.scrollerRef.off == "function" && (this.scrollerRef.off("pan:start", this.resetRenderArea, this), this.scrollerRef.off("panning", this.resetRenderArea, this), this.scrollerRef.off("pan:stop", this.resetRenderArea, this));
			let e = this.scrollerRef.container;
			e && this.scrollerScrollHandler && K.off(e, "scroll", this.scrollerScrollHandler), this.scrollerRef = void 0, this.scrollerScrollHandler = void 0;
		}
	}
	setVirtualEnabled(e) {
		let t = this.options.virtual;
		if (typeof t == "object") {
			let n = t;
			this.options.virtual = Object.assign(Object.assign({}, n), { enabled: e });
		} else this.options.virtual = e;
	}
	enableVirtualRender() {
		this.setVirtualEnabled(!0), this.resetRenderArea();
	}
	disableVirtualRender() {
		this.setVirtualEnabled(!1), this.graph.renderer.setRenderArea(void 0);
	}
	isVirtualEnabled() {
		let e = this.options.virtual;
		return typeof e == "object" && e ? e.enabled !== !1 : !!e;
	}
	getVirtualMargin() {
		let e = this.options.virtual;
		if (typeof e == "object") {
			let t = e.margin;
			return typeof t == "number" ? t : vS;
		}
		return vS;
	}
	resetRenderArea() {
		if (this.isVirtualEnabled()) {
			let e = this.graph.getGraphArea();
			if (e) {
				let t = this.getVirtualMargin(), n = e.clone();
				n.inflate(t, t), this.graph.renderer.setRenderArea(n);
				return;
			}
		}
	}
	dispose() {
		this.stopListening();
	}
};
f([q()], yS.prototype, "dispose", null);
// node_modules/@antv/x6/es/graph/graph.js
var X = class e extends Wm {
	static isGraph(t) {
		if (t == null) return !1;
		if (t instanceof e) return !0;
		let n = t[Symbol.toStringTag];
		return n == null || n === e.toStringTag;
	}
	static render(t, n) {
		let r = typeof t == "string" || t instanceof HTMLElement ? new e({ container: t }) : new e(t);
		return n != null && r.fromJSON(n), r;
	}
	get container() {
		return this.options.container;
	}
	get [Symbol.toStringTag]() {
		return e.toStringTag;
	}
	constructor(e) {
		super(), this.installedPlugins = /* @__PURE__ */ new Set(), this.options = lS(e), this.css = new iS(this), this.view = new _S(this), this.defs = new aS(this), this.coord = new nS(this), this.transform = new hS(this), this.highlight = new sS(this), this.grid = new oS(this), this.background = new tS(this), this.options.model ? this.model = this.options.model : (this.model = new Nx(), this.model.graph = this), this.renderer = new eS(this), this.panning = new pS(this), this.mousewheel = new cS(this), this.virtualRender = new yS(this), this.size = new mS(this);
	}
	isNode(e) {
		return e.isNode();
	}
	isEdge(e) {
		return e.isEdge();
	}
	resetCells(e, t = {}) {
		return this.model.resetCells(e, t), this;
	}
	clearCells(e = {}) {
		return this.model.clear(e), this;
	}
	toJSON(e = {}) {
		return this.model.toJSON(e);
	}
	parseJSON(e) {
		return this.model.parseJSON(e);
	}
	fromJSON(e, t = {}) {
		return this.model.fromJSON(e, t), this;
	}
	getCellById(e) {
		return this.model.getCell(e);
	}
	addNode(e, t = {}) {
		return this.model.addNode(e, t);
	}
	addNodes(e, t = {}) {
		return this.addCell(e.map((e) => Tx.isNode(e) ? e : this.createNode(e)), t);
	}
	createNode(e) {
		return this.model.createNode(e);
	}
	removeNode(e, t = {}) {
		return this.model.removeCell(e, t);
	}
	addEdge(e, t = {}) {
		return this.model.addEdge(e, t);
	}
	addEdges(e, t = {}) {
		return this.addCell(e.map((e) => Ax.isEdge(e) ? e : this.createEdge(e)), t);
	}
	removeEdge(e, t = {}) {
		return this.model.removeCell(e, t);
	}
	createEdge(e) {
		return this.model.createEdge(e);
	}
	addCell(e, t = {}) {
		return this.model.addCell(e, t), this;
	}
	removeCell(e, t = {}) {
		return this.model.removeCell(e, t);
	}
	removeCells(e, t = {}) {
		return this.model.removeCells(e, t);
	}
	removeConnectedEdges(e, t = {}) {
		return this.model.removeConnectedEdges(e, t);
	}
	disconnectConnectedEdges(e, t = {}) {
		return this.model.disconnectConnectedEdges(e, t), this;
	}
	hasCell(e) {
		return this.model.has(e);
	}
	getCells() {
		return this.model.getCells();
	}
	getCellCount() {
		return this.model.total();
	}
	getNodes() {
		return this.model.getNodes();
	}
	getEdges() {
		return this.model.getEdges();
	}
	getOutgoingEdges(e) {
		return this.model.getOutgoingEdges(e);
	}
	getIncomingEdges(e) {
		return this.model.getIncomingEdges(e);
	}
	getConnectedEdges(e, t = {}) {
		return this.model.getConnectedEdges(e, t);
	}
	getRootNodes() {
		return this.model.getRoots();
	}
	getLeafNodes() {
		return this.model.getLeafs();
	}
	isRootNode(e) {
		return this.model.isRoot(e);
	}
	isLeafNode(e) {
		return this.model.isLeaf(e);
	}
	getNeighbors(e, t = {}) {
		return this.model.getNeighbors(e, t);
	}
	isNeighbor(e, t, n = {}) {
		return this.model.isNeighbor(e, t, n);
	}
	getSuccessors(e, t = {}) {
		return this.model.getSuccessors(e, t);
	}
	isSuccessor(e, t, n = {}) {
		return this.model.isSuccessor(e, t, n);
	}
	getPredecessors(e, t = {}) {
		return this.model.getPredecessors(e, t);
	}
	isPredecessor(e, t, n = {}) {
		return this.model.isPredecessor(e, t, n);
	}
	getCommonAncestor(...e) {
		return this.model.getCommonAncestor(...e);
	}
	getSubGraph(e, t = {}) {
		return this.model.getSubGraph(e, t);
	}
	cloneSubGraph(e, t = {}) {
		return this.model.cloneSubGraph(e, t);
	}
	cloneCells(e) {
		return this.model.cloneCells(e);
	}
	getNodesFromPoint(e, t) {
		return this.model.getNodesFromPoint(e, t);
	}
	getNodesInArea(e, t, n, r, i) {
		return this.model.getNodesInArea(e, t, n, r, i);
	}
	getNodesUnderNode(e, t = {}) {
		return this.model.getNodesUnderNode(e, t);
	}
	searchCell(e, t, n = {}) {
		return this.model.search(e, t, n), this;
	}
	getShortestPath(e, t, n = {}) {
		return this.model.getShortestPath(e, t, n);
	}
	getAllCellsBBox() {
		return this.model.getAllCellsBBox();
	}
	getCellsBBox(e, t = {}) {
		return this.model.getCellsBBox(e, t);
	}
	startBatch(e, t = {}) {
		this.model.startBatch(e, t);
	}
	stopBatch(e, t = {}) {
		this.model.stopBatch(e, t);
	}
	batchUpdate(e, t, n) {
		let r = typeof e == "string" ? e : "update", i = typeof e == "string" ? t : e, a = typeof t == "function" ? n : t;
		this.startBatch(r, a);
		let o = i();
		return this.stopBatch(r, a), o;
	}
	updateCellId(e, t) {
		return this.model.updateCellId(e, t);
	}
	findView(e) {
		return Y.isCell(e) ? this.findViewByCell(e) : this.findViewByElem(e);
	}
	findViews(e) {
		return B.isRectangleLike(e) ? this.findViewsInArea(e) : z.isPointLike(e) ? this.findViewsFromPoint(e) : [];
	}
	findViewByCell(e) {
		return this.renderer.findViewByCell(e);
	}
	findViewByElem(e) {
		return this.renderer.findViewByElem(e);
	}
	findViewsFromPoint(e, t) {
		let n = typeof e == "number" ? {
			x: e,
			y: t
		} : e;
		return this.renderer.findViewsFromPoint(n);
	}
	findViewsInArea(e, t, n, r, i) {
		let a = typeof e == "number" ? {
			x: e,
			y: t,
			width: n,
			height: r
		} : e, o = typeof e == "number" ? i : t;
		return this.renderer.findViewsInArea(a, o);
	}
	matrix(e) {
		return e === void 0 ? this.transform.getMatrix() : (this.transform.setMatrix(e), this);
	}
	resize(e, t) {
		let n = this.getPlugin("scroller");
		return n ? n.resize(e, t) : this.transform.resize(e, t), this;
	}
	scale(e, t = e, n = 0, r = 0) {
		return e === void 0 ? this.transform.getScale() : (this.transform.scale(e, t, n, r), this);
	}
	zoom(e, t) {
		let n = this.getPlugin("scroller");
		if (n) {
			if (e === void 0) return n.zoom();
			n.zoom(e, t);
		} else {
			if (e === void 0) return this.transform.getZoom();
			this.transform.zoom(e, t);
		}
		return this;
	}
	zoomTo(e, t = {}) {
		let n = this.getPlugin("scroller");
		return n ? n.zoom(e, Object.assign(Object.assign({}, t), { absolute: !0 })) : this.transform.zoom(e, Object.assign(Object.assign({}, t), { absolute: !0 })), this;
	}
	zoomToRect(e, t = {}) {
		let n = this.getPlugin("scroller");
		return n ? n.zoomToRect(e, t) : this.transform.zoomToRect(e, t), this;
	}
	zoomToFit(e = {}) {
		let t = this.getPlugin("scroller");
		return t ? t.zoomToFit(e) : this.transform.zoomToFit(e), this;
	}
	rotate(e, t, n) {
		return e === void 0 ? this.transform.getRotation() : (this.transform.rotate(e, t, n), this);
	}
	translate(e, t) {
		return e === void 0 ? this.transform.getTranslation() : (this.transform.translate(e, t), this);
	}
	translateBy(e, t) {
		let n = this.translate(), r = n.tx + e, i = n.ty + t;
		return this.translate(r, i);
	}
	getGraphArea() {
		let e = this.getPlugin("scroller");
		if (e) {
			let t = e.getVisibleArea?.call(e);
			if (t) return t;
		}
		return this.transform.getGraphArea();
	}
	getContentArea(e = {}) {
		return this.transform.getContentArea(e);
	}
	getContentBBox(e = {}) {
		return this.transform.getContentBBox(e);
	}
	fitToContent(e, t, n, r) {
		return this.transform.fitToContent(e, t, n, r);
	}
	scaleContentToFit(e = {}) {
		return this.transform.scaleContentToFit(e), this;
	}
	center(e) {
		return this.centerPoint(e);
	}
	centerPoint(e, t, n) {
		let r = this.getPlugin("scroller");
		return r ? r.centerPoint(e, t, n) : this.transform.centerPoint(e, t), this;
	}
	centerContent(e) {
		let t = this.getPlugin("scroller");
		return t ? t.centerContent(e) : this.transform.centerContent(e), this;
	}
	centerCell(e, t) {
		let n = this.getPlugin("scroller");
		return n ? n.centerCell(e, t) : this.transform.centerCell(e), this;
	}
	positionPoint(e, t, n, r = {}) {
		let i = this.getPlugin("scroller");
		return i ? i.positionPoint(e, t, n, r) : this.transform.positionPoint(e, t, n), this;
	}
	positionRect(e, t, n) {
		let r = this.getPlugin("scroller");
		return r ? r.positionRect(e, t, n) : this.transform.positionRect(e, t), this;
	}
	positionCell(e, t, n) {
		let r = this.getPlugin("scroller");
		return r ? r.positionCell(e, t, n) : this.transform.positionCell(e, t), this;
	}
	positionContent(e, t) {
		let n = this.getPlugin("scroller");
		return n ? n.positionContent(e, t) : this.transform.positionContent(e, t), this;
	}
	snapToGrid(e, t) {
		return this.coord.snapToGrid(e, t);
	}
	pageToLocal(e, t, n, r) {
		return B.isRectangleLike(e) ? this.coord.pageToLocalRect(e) : typeof e == "number" && typeof t == "number" && typeof n == "number" && typeof r == "number" ? this.coord.pageToLocalRect(e, t, n, r) : this.coord.pageToLocalPoint(e, t);
	}
	localToPage(e, t, n, r) {
		return B.isRectangleLike(e) ? this.coord.localToPageRect(e) : typeof e == "number" && typeof t == "number" && typeof n == "number" && typeof r == "number" ? this.coord.localToPageRect(e, t, n, r) : this.coord.localToPagePoint(e, t);
	}
	clientToLocal(e, t, n, r) {
		return B.isRectangleLike(e) ? this.coord.clientToLocalRect(e) : typeof e == "number" && typeof t == "number" && typeof n == "number" && typeof r == "number" ? this.coord.clientToLocalRect(e, t, n, r) : this.coord.clientToLocalPoint(e, t);
	}
	localToClient(e, t, n, r) {
		return B.isRectangleLike(e) ? this.coord.localToClientRect(e) : typeof e == "number" && typeof t == "number" && typeof n == "number" && typeof r == "number" ? this.coord.localToClientRect(e, t, n, r) : this.coord.localToClientPoint(e, t);
	}
	localToGraph(e, t, n, r) {
		return B.isRectangleLike(e) ? this.coord.localToGraphRect(e) : typeof e == "number" && typeof t == "number" && typeof n == "number" && typeof r == "number" ? this.coord.localToGraphRect(e, t, n, r) : this.coord.localToGraphPoint(e, t);
	}
	graphToLocal(e, t, n, r) {
		return B.isRectangleLike(e) ? this.coord.graphToLocalRect(e) : typeof e == "number" && typeof t == "number" && typeof n == "number" && typeof r == "number" ? this.coord.graphToLocalRect(e, t, n, r) : this.coord.graphToLocalPoint(e, t);
	}
	clientToGraph(e, t, n, r) {
		return B.isRectangleLike(e) ? this.coord.clientToGraphRect(e) : typeof e == "number" && typeof t == "number" && typeof n == "number" && typeof r == "number" ? this.coord.clientToGraphRect(e, t, n, r) : this.coord.clientToGraphPoint(e, t);
	}
	defineFilter(e) {
		return this.defs.filter(e);
	}
	defineGradient(e) {
		return this.defs.gradient(e);
	}
	defineMarker(e) {
		return this.defs.marker(e);
	}
	getGridSize() {
		return this.grid.getGridSize();
	}
	setGridSize(e) {
		return this.grid.setGridSize(e), this;
	}
	showGrid() {
		return this.grid.show(), this;
	}
	hideGrid() {
		return this.grid.hide(), this;
	}
	clearGrid() {
		return this.grid.clear(), this;
	}
	drawGrid(e) {
		return this.grid.draw(e), this;
	}
	updateBackground() {
		return this.background.update(), this;
	}
	drawBackground(e, t) {
		let n = this.getPlugin("scroller");
		return n != null && (this.options.background == null || !t) ? n.drawBackground(e, t) : this.background.draw(e), this;
	}
	clearBackground(e) {
		let t = this.getPlugin("scroller");
		return t != null && (this.options.background == null || !e) ? t.clearBackground(e) : this.background.clear(), this;
	}
	enableVirtualRender() {
		return this.virtualRender.enableVirtualRender(), this;
	}
	disableVirtualRender() {
		return this.virtualRender.disableVirtualRender(), this;
	}
	isMouseWheelEnabled() {
		return !this.mousewheel.disabled;
	}
	enableMouseWheel() {
		return this.mousewheel.enable(), this;
	}
	disableMouseWheel() {
		return this.mousewheel.disable(), this;
	}
	toggleMouseWheel(e) {
		return e == null ? this.isMouseWheelEnabled() ? this.disableMouseWheel() : this.enableMouseWheel() : e ? this.enableMouseWheel() : this.disableMouseWheel(), this;
	}
	isPannable() {
		let e = this.getPlugin("scroller");
		return e ? e.isPannable() : this.panning.pannable;
	}
	enablePanning() {
		let e = this.getPlugin("scroller");
		return e ? e.enablePanning() : this.panning.enablePanning(), this;
	}
	disablePanning() {
		let e = this.getPlugin("scroller");
		return e ? e.disablePanning() : this.panning.disablePanning(), this;
	}
	togglePanning(e) {
		return e == null ? this.isPannable() ? this.disablePanning() : this.enablePanning() : e !== this.isPannable() && (e ? this.enablePanning() : this.disablePanning()), this;
	}
	handleScrollerPluginStateChange(e, t) {
		e.name === "scroller" && (t ? this.virtualRender.onScrollerReady(e) : this.virtualRender.unbindScroller());
	}
	use(e, ...t) {
		return this.installedPlugins.has(e) || (this.installedPlugins.add(e), e.init(this, ...t), this.handleScrollerPluginStateChange(e, !0)), this;
	}
	getPlugin(e) {
		return Array.from(this.installedPlugins).find((t) => t.name === e);
	}
	getPlugins(e) {
		return Array.from(this.installedPlugins).filter((t) => e.includes(t.name));
	}
	enablePlugins(e) {
		let t = e;
		return Array.isArray(t) || (t = [t]), this.getPlugins(t)?.forEach((e) => {
			var t;
			(t = e?.enable) == null || t.call(e), this.handleScrollerPluginStateChange(e, !0);
		}), this;
	}
	disablePlugins(e) {
		let t = e;
		return Array.isArray(t) || (t = [t]), this.getPlugins(t)?.forEach((e) => {
			var t;
			(t = e?.disable) == null || t.call(e), this.handleScrollerPluginStateChange(e, !1);
		}), this;
	}
	isPluginEnabled(e) {
		let t = this.getPlugin(e);
		return (t?.isEnabled)?.call(t);
	}
	disposePlugins(e) {
		let t = e;
		return Array.isArray(t) || (t = [t]), this.getPlugins(t)?.forEach((e) => {
			e.dispose(), this.handleScrollerPluginStateChange(e, !1), this.installedPlugins.delete(e);
		}), this;
	}
	dispose(e = !0) {
		e && this.model.dispose(), this.css.dispose(), this.defs.dispose(), this.grid.dispose(), this.coord.dispose(), this.transform.dispose(), this.highlight.dispose(), this.background.dispose(), this.mousewheel.dispose(), this.panning.dispose(), this.view.dispose(), this.renderer.dispose(), this.installedPlugins.forEach((e) => {
			e.dispose();
		});
	}
};
X.toStringTag = `X6.${X.name}`, X.registerNode = Tx.registry.register, X.registerEdge = Ax.registry.register, X.registerView = Db.registry.register, X.registerAttr = Sg.register, X.registerGrid = F_.register, X.registerFilter = D_.register, X.registerNodeTool = ax.register, X.registerEdgeTool = sx.register, X.registerBackground = Og.register, X.registerHighlighter = X_.register, X.registerPortLayout = Wv.register, X.registerPortLabelLayout = Av.register, X.registerMarker = ng.register, X.registerRouter = Zy.register, X.registerConnector = r_.register, X.registerAnchor = dv.register, X.registerEdgeAnchor = f_.register, X.registerConnectionPoint = Rg.register, X.unregisterNode = Tx.registry.unregister, X.unregisterEdge = Ax.registry.unregister, X.unregisterView = Db.registry.unregister, X.unregisterAttr = Sg.unregister, X.unregisterGrid = F_.unregister, X.unregisterFilter = D_.unregister, X.unregisterNodeTool = ax.unregister, X.unregisterEdgeTool = sx.unregister, X.unregisterBackground = Og.unregister, X.unregisterHighlighter = X_.unregister, X.unregisterPortLayout = Wv.unregister, X.unregisterPortLabelLayout = Av.unregister, X.unregisterMarker = ng.unregister, X.unregisterRouter = Zy.unregister, X.unregisterConnector = r_.unregister, X.unregisterAnchor = dv.unregister, X.unregisterEdgeAnchor = f_.unregister, X.unregisterConnectionPoint = Rg.unregister, f([q()], X.prototype, "dispose", null);
// node_modules/@antv/x6/es/shape/html.js
var bS = "html", xS = {}, SS = class extends Tx {
	static register(e) {
		let { shape: t, html: n, effect: r, inherit: i } = e, a = d(e, [
			"shape",
			"html",
			"effect",
			"inherit"
		]);
		if (!t) throw Error("HTML.register should specify `shape` in config.");
		xS[t] = {
			html: n,
			effect: r
		}, X.registerNode(t, Object.assign({ inherit: i || "html" }, a), !0);
	}
};
SS.config({
	view: "html-view",
	markup: [
		{
			tagName: "rect",
			selector: "body"
		},
		Object.assign({}, fb.getForeignObjectMarkup()),
		{
			tagName: "text",
			selector: "label"
		}
	],
	attrs: {
		body: {
			fill: "none",
			stroke: "none",
			refWidth: "100%",
			refHeight: "100%"
		},
		fo: {
			refWidth: "100%",
			refHeight: "100%"
		}
	}
}), Tx.registry.register("html", SS, !0);
var CS = class extends Gx {
	init() {
		super.init(), this.cell.on("change:*", this.onCellChangeAny, this);
	}
	onCellChangeAny({ key: e }) {
		let t = xS[this.cell.shape];
		if (t) {
			let { effect: n } = t;
			(!n || n.includes(e)) && this.renderHTMLComponent();
		}
	}
	confirmUpdate(e) {
		let t = super.confirmUpdate(e);
		return this.handleAction(t, bS, () => this.renderHTMLComponent());
	}
	renderHTMLComponent() {
		let e = this.selectors && this.selectors.foContent;
		if (e) {
			od(e);
			let t = xS[this.cell.shape];
			if (!t) return;
			let { html: n } = t;
			typeof n == "function" && (n = n(this.cell)), n && (typeof n == "string" ? e.innerHTML = n : sd(e, n));
		}
	}
	dispose() {
		this.cell.off("change:*", this.onCellChangeAny, this);
	}
};
f([q()], CS.prototype, "dispose", null), CS.config({
	bootstrap: [bS],
	actions: { html: bS }
}), Gx.registry.register("html-view", CS, !0), zx("image", {
	attrs: { image: {
		refWidth: "100%",
		refHeight: "100%"
	} },
	propHooks: Rx()
}, { selector: "image" }), Ix.define({
	shape: "path",
	markup: [
		{
			tagName: "rect",
			selector: "bg"
		},
		{
			tagName: "path",
			selector: "body"
		},
		{
			tagName: "text",
			selector: "label"
		}
	],
	attrs: {
		bg: {
			refWidth: "100%",
			refHeight: "100%",
			fill: "none",
			stroke: "none",
			pointerEvents: "all"
		},
		body: {
			fill: "none",
			stroke: "#000",
			strokeWidth: 2
		}
	},
	propHooks(e) {
		let { path: t } = e, n = d(e, ["path"]);
		return t && af(n, "attrs/body/refD", t), n;
	}
});
// node_modules/@antv/x6/es/shape/poly.js
var wS = class extends Ix {
	get points() {
		return this.getPoints();
	}
	set points(e) {
		this.setPoints(e);
	}
	getPoints() {
		return this.getAttrByPath("body/refPoints");
	}
	setPoints(e, t) {
		return e == null ? this.removePoints() : this.setAttrByPath("body/refPoints", Bx(e), t), this;
	}
	removePoints() {
		return this.removeAttrByPath("body/refPoints"), this;
	}
};
wS.config({ propHooks(e) {
	let { points: t } = e, n = d(e, ["points"]);
	if (t) {
		let e = Bx(t);
		e && af(n, "attrs/body/refPoints", e);
	}
	return n;
} }), zx("polygon", {}, { parent: wS }), zx("polyline", {}, { parent: wS }), zx("rect", { attrs: { body: {
	refWidth: "100%",
	refHeight: "100%"
} } });
// node_modules/@antv/x6/es/shape/text-block.js
function TS(e) {
	return e ? {
		tagName: "foreignObject",
		selector: "foreignObject",
		children: [{
			tagName: "div",
			ns: qu.xhtml,
			selector: "label",
			style: {
				width: "100%",
				height: "100%",
				position: "static",
				backgroundColor: "transparent",
				textAlign: "center",
				margin: 0,
				padding: "0px 5px",
				boxSizing: "border-box",
				display: "flex",
				alignItems: "center",
				justifyContent: "center"
			}
		}]
	} : {
		tagName: "text",
		selector: "label",
		attrs: { textAnchor: "middle" }
	};
}
var ES = {
	shape: "text-block",
	markup: [{
		tagName: "rect",
		selector: "body"
	}, TS(Fl)],
	attrs: {
		body: Object.assign(Object.assign({}, Px), {
			refWidth: "100%",
			refHeight: "100%"
		}),
		foreignObject: {
			refWidth: "100%",
			refHeight: "100%"
		},
		label: { style: { fontSize: 14 } }
	},
	propHooks(e) {
		let { text: t } = e, n = d(e, ["text"]);
		return t && af(n, "attrs/label/text", t), n;
	},
	attrHooks: { text: {
		set(e, { cell: t, view: n, refBBox: r, elem: i, attrs: a }) {
			if (i instanceof HTMLElement) i.textContent = e;
			else {
				let o = a.style || {}, s = {
					text: e,
					width: -5,
					height: "100%"
				}, c = Object.assign({ textVerticalAnchor: "middle" }, o), l = xg.textWrap;
				return R(l.set, this, s, {
					cell: t,
					view: n,
					elem: i,
					refBBox: r,
					attrs: c
				}), { fill: o.color || null };
			}
		},
		position(e, { refBBox: t, elem: n }) {
			if (n instanceof SVGElement) return t.getCenter();
		}
	} }
};
Ix.define(ES);
// node_modules/@antv/x6/es/plugin/clipboard/storage.js
var DS = `${J.prefixCls}.clipboard.cells`;
function OS(e) {
	if (window.localStorage) {
		let t = e.map((e) => e.toJSON());
		localStorage.setItem(DS, JSON.stringify(t));
	}
}
function kS() {
	if (window.localStorage) {
		let e = localStorage.getItem(DS), t = e ? JSON.parse(e) : [];
		if (t) return Nx.fromJSON(t);
	}
}
function AS() {
	window.localStorage && localStorage.removeItem(DS);
}
// node_modules/@antv/x6/es/plugin/clipboard/clipboard.js
var jS = class {
	constructor() {
		this.cells = [];
	}
	copy(e, t, n = {}) {
		this.options = Object.assign({}, n);
		let r = (Nx.isModel(t) ? t : t.model).cloneSubGraph(e, n);
		this.cells = sl(Object.keys(r).map((e) => r[e]), (e) => e.isEdge() ? 2 : 1), this.serialize(n);
	}
	cut(e, t, n = {}) {
		this.copy(e, t, n), (X.isGraph(t) ? t.model : t).batchUpdate("cut", () => {
			e.forEach((e) => e.remove());
		});
	}
	paste(e, t = {}) {
		let n = Object.assign(Object.assign({}, this.options), t), { offset: r, edgeProps: i, nodeProps: a } = n, o = 20, s = 20;
		r && (o = typeof r == "number" ? r : r.dx, s = typeof r == "number" ? r : r.dy), this.deserialize(n);
		let c = this.cells;
		c.forEach((e) => {
			e.model = null, e.removeProp("zIndex"), (o || s) && e.translate(o, s), a && e.isNode() && e.prop(a), i && e.isEdge() && e.prop(i);
		});
		let l = X.isGraph(e) ? e.model : e;
		return l.batchUpdate("paste", () => {
			l.addCells(this.cells);
		}), this.copy(c, e, t), c;
	}
	serialize(e) {
		e.useLocalStorage !== !1 && OS(this.cells);
	}
	deserialize(e) {
		if (e.useLocalStorage) {
			let e = kS();
			e && (this.cells = e);
		}
	}
	isEmpty(e = {}) {
		return e.useLocalStorage && this.deserialize(e), this.cells.length <= 0;
	}
	clean() {
		this.options = {}, this.cells = [], AS();
	}
};
X.prototype.isClipboardEnabled = function() {
	let e = this.getPlugin("clipboard");
	return e ? e.isEnabled() : !1;
}, X.prototype.enableClipboard = function() {
	let e = this.getPlugin("clipboard");
	return e && e.enable(), this;
}, X.prototype.disableClipboard = function() {
	let e = this.getPlugin("clipboard");
	return e && e.disable(), this;
}, X.prototype.toggleClipboard = function(e) {
	let t = this.getPlugin("clipboard");
	return t && t.toggleEnabled(e), this;
}, X.prototype.isClipboardEmpty = function(e) {
	let t = this.getPlugin("clipboard");
	return !t || t.isEmpty(e);
}, X.prototype.getCellsInClipboard = function() {
	let e = this.getPlugin("clipboard");
	return e ? e.getCellsInClipboard() : [];
}, X.prototype.cleanClipboard = function() {
	let e = this.getPlugin("clipboard");
	return e && e.clean(), this;
}, X.prototype.copy = function(e, t) {
	let n = this.getPlugin("clipboard");
	return n && n.copy(e, t), this;
}, X.prototype.cut = function(e, t) {
	let n = this.getPlugin("clipboard");
	return n && n.cut(e, t), this;
}, X.prototype.paste = function(e, t) {
	let n = this.getPlugin("clipboard");
	return n ? n.paste(e, t) : [];
};
// node_modules/@antv/x6/es/plugin/clipboard/index.js
var MS = class extends Wm {
	get disabled() {
		return this.options.enabled !== !0;
	}
	get cells() {
		return this.clipboardImpl.cells;
	}
	constructor(e = {}) {
		super(), this.name = "clipboard", this.options = Object.assign({ enabled: !0 }, e);
	}
	init(e) {
		this.graph = e, this.clipboardImpl = new jS(), this.clipboardImpl.deserialize(this.options);
	}
	isEnabled() {
		return !this.disabled;
	}
	enable() {
		this.disabled && (this.options.enabled = !0);
	}
	disable() {
		this.disabled || (this.options.enabled = !1);
	}
	toggleEnabled(e) {
		return e === void 0 && (e = !this.isEnabled()), e ? this.enable() : this.disable(), this;
	}
	isEmpty(e = {}) {
		return this.clipboardImpl.isEmpty(e);
	}
	getCellsInClipboard() {
		return this.cells;
	}
	clean(e) {
		return (!this.disabled || e) && (this.clipboardImpl.clean(), this.notify("clipboard:changed", { cells: [] })), this;
	}
	copy(e, t = {}) {
		return this.disabled || (this.clipboardImpl.copy(e, this.graph, Object.assign(Object.assign({}, this.commonOptions), t)), this.notify("clipboard:changed", { cells: e })), this;
	}
	cut(e, t = {}) {
		return this.disabled || (this.clipboardImpl.cut(e, this.graph, Object.assign(Object.assign({}, this.commonOptions), t)), this.notify("clipboard:changed", { cells: e })), this;
	}
	paste(e = {}, t = this.graph) {
		return this.disabled ? [] : this.clipboardImpl.paste(t, Object.assign(Object.assign({}, this.commonOptions), e));
	}
	get commonOptions() {
		let e = this.options, { enabled: t } = e;
		return d(e, ["enabled"]);
	}
	notify(e, t) {
		this.trigger(e, t), this.graph.trigger(e, t);
	}
	dispose() {
		this.clean(!0), this.off();
	}
};
f([q()], MS.prototype, "dispose", null);
// node_modules/dom-align/dist-web/index.js
function NS(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function PS(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? NS(Object(n), !0).forEach(function(t) {
			IS(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : NS(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function FS(e) {
	"@babel/helpers - typeof";
	return FS = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, FS(e);
}
function IS(e, t, n) {
	return t in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
var LS, RS = {
	Webkit: "-webkit-",
	Moz: "-moz-",
	ms: "-ms-",
	O: "-o-"
};
function zS() {
	if (LS !== void 0) return LS;
	LS = "";
	var e = document.createElement("p").style, t = "Transform";
	for (var n in RS) n + t in e && (LS = n);
	return LS;
}
function BS() {
	return zS() ? `${zS()}TransitionProperty` : "transitionProperty";
}
function VS() {
	return zS() ? `${zS()}Transform` : "transform";
}
function HS(e, t) {
	var n = BS();
	n && (e.style[n] = t, n !== "transitionProperty" && (e.style.transitionProperty = t));
}
function US(e, t) {
	var n = VS();
	n && (e.style[n] = t, n !== "transform" && (e.style.transform = t));
}
function WS(e) {
	return e.style.transitionProperty || e.style[BS()];
}
function GS(e) {
	var t = window.getComputedStyle(e, null), n = t.getPropertyValue("transform") || t.getPropertyValue(VS());
	if (n && n !== "none") {
		var r = n.replace(/[^0-9\-.,]/g, "").split(",");
		return {
			x: parseFloat(r[12] || r[4], 0),
			y: parseFloat(r[13] || r[5], 0)
		};
	}
	return {
		x: 0,
		y: 0
	};
}
var KS = /matrix\((.*)\)/, qS = /matrix3d\((.*)\)/;
function JS(e, t) {
	var n = window.getComputedStyle(e, null), r = n.getPropertyValue("transform") || n.getPropertyValue(VS());
	if (r && r !== "none") {
		var i, a = r.match(KS);
		a ? (a = a[1], i = a.split(",").map(function(e) {
			return parseFloat(e, 10);
		}), i[4] = t.x, i[5] = t.y, US(e, `matrix(${i.join(",")})`)) : (i = r.match(qS)[1].split(",").map(function(e) {
			return parseFloat(e, 10);
		}), i[12] = t.x, i[13] = t.y, US(e, `matrix3d(${i.join(",")})`));
	} else US(e, `translateX(${t.x}px) translateY(${t.y}px) translateZ(0)`);
}
var YS = "[\\-+]?(?:\\d*\\.|)\\d+(?:[eE][\\-+]?\\d+|)", XS;
function ZS(e) {
	var t = e.style.display;
	e.style.display = "none", e.offsetHeight, e.style.display = t;
}
function QS(e, t, n) {
	var r = n;
	if (FS(t) === "object") for (var i in t) t.hasOwnProperty(i) && QS(e, i, t[i]);
	else if (r !== void 0) typeof r == "number" && (r = `${r}px`), e.style[t] = r;
	else return XS(e, t);
}
function $S(e) {
	var t, n, r, i = e.ownerDocument, a = i.body, o = i && i.documentElement;
	return t = e.getBoundingClientRect(), n = Math.floor(t.left), r = Math.floor(t.top), n -= o.clientLeft || a.clientLeft || 0, r -= o.clientTop || a.clientTop || 0, {
		left: n,
		top: r
	};
}
function eC(e, t) {
	var n = e[`page${t ? "Y" : "X"}Offset`], r = `scroll${t ? "Top" : "Left"}`;
	if (typeof n != "number") {
		var i = e.document;
		n = i.documentElement[r], typeof n != "number" && (n = i.body[r]);
	}
	return n;
}
function tC(e) {
	return eC(e);
}
function nC(e) {
	return eC(e, !0);
}
function rC(e) {
	var t = $S(e), n = e.ownerDocument, r = n.defaultView || n.parentWindow;
	return t.left += tC(r), t.top += nC(r), t;
}
function iC(e) {
	return e != null && e == e.window;
}
function aC(e) {
	return iC(e) ? e.document : e.nodeType === 9 ? e : e.ownerDocument;
}
function oC(e, t, n) {
	var r = n, i = "", a = aC(e);
	return r ||= a.defaultView.getComputedStyle(e, null), r && (i = r.getPropertyValue(t) || r[t]), i;
}
var sC = RegExp(`^(${YS})(?!px)[a-z%]+\$`, "i"), cC = /^(top|right|bottom|left)$/, lC = "currentStyle", uC = "runtimeStyle", dC = "left", fC = "px";
function pC(e, t) {
	var n = e[lC] && e[lC][t];
	if (sC.test(n) && !cC.test(t)) {
		var r = e.style, i = r[dC], a = e[uC][dC];
		e[uC][dC] = e[lC][dC], r[dC] = t === "fontSize" ? "1em" : n || 0, n = r.pixelLeft + fC, r[dC] = i, e[uC][dC] = a;
	}
	return n === "" ? "auto" : n;
}
typeof window < "u" && (XS = window.getComputedStyle ? oC : pC);
function mC(e, t) {
	return e === "left" ? t.useCssRight ? "right" : e : t.useCssBottom ? "bottom" : e;
}
function hC(e) {
	if (e === "left") return "right";
	if (e === "right") return "left";
	if (e === "top") return "bottom";
	if (e === "bottom") return "top";
}
function gC(e, t, n) {
	QS(e, "position") === "static" && (e.style.position = "relative");
	var r = -999, i = -999, a = mC("left", n), o = mC("top", n), s = hC(a), c = hC(o);
	a !== "left" && (r = 999), o !== "top" && (i = 999);
	var l = "", u = rC(e);
	("left" in t || "top" in t) && (l = WS(e) || "", HS(e, "none")), "left" in t && (e.style[s] = "", e.style[a] = `${r}px`), "top" in t && (e.style[c] = "", e.style[o] = `${i}px`), ZS(e);
	var d = rC(e), f = {};
	for (var p in t) if (t.hasOwnProperty(p)) {
		var m = mC(p, n), h = p === "left" ? r : i, g = u[p] - d[p];
		f[m] = m === p ? h + g : h - g;
	}
	QS(e, f), ZS(e), ("left" in t || "top" in t) && HS(e, l);
	var _ = {};
	for (var v in t) if (t.hasOwnProperty(v)) {
		var y = mC(v, n), b = t[v] - u[v];
		_[y] = v === y ? f[y] + b : f[y] - b;
	}
	QS(e, _);
}
function _C(e, t) {
	var n = rC(e), r = GS(e), i = {
		x: r.x,
		y: r.y
	};
	"left" in t && (i.x = r.x + t.left - n.left), "top" in t && (i.y = r.y + t.top - n.top), JS(e, i);
}
function vC(e, t, n) {
	if (n.ignoreShake) {
		var r = rC(e), i = r.left.toFixed(0), a = r.top.toFixed(0), o = t.left.toFixed(0), s = t.top.toFixed(0);
		if (i === o && a === s) return;
	}
	n.useCssRight || n.useCssBottom ? gC(e, t, n) : n.useCssTransform && VS() in document.body.style ? _C(e, t) : gC(e, t, n);
}
function yC(e, t) {
	for (var n = 0; n < e.length; n++) t(e[n]);
}
function bC(e) {
	return XS(e, "boxSizing") === "border-box";
}
var xC = [
	"margin",
	"border",
	"padding"
], SC = -1, CC = 2, wC = 1, TC = 0;
function EC(e, t, n) {
	var r = {}, i = e.style, a;
	for (a in t) t.hasOwnProperty(a) && (r[a] = i[a], i[a] = t[a]);
	for (a in n.call(e), t) t.hasOwnProperty(a) && (i[a] = r[a]);
}
function DC(e, t, n) {
	for (var r = 0, i, a = 0, o; a < t.length; a++) if (i = t[a], i) for (o = 0; o < n.length; o++) {
		var s = void 0;
		s = i === "border" ? `${i}${n[o]}Width` : i + n[o], r += parseFloat(XS(e, s)) || 0;
	}
	return r;
}
var OC = { getParent: function(e) {
	var t = e;
	do
		t = t.nodeType === 11 && t.host ? t.host : t.parentNode;
	while (t && t.nodeType !== 1 && t.nodeType !== 9);
	return t;
} };
yC(["Width", "Height"], function(e) {
	OC[`doc${e}`] = function(t) {
		var n = t.document;
		return Math.max(n.documentElement[`scroll${e}`], n.body[`scroll${e}`], OC[`viewport${e}`](n));
	}, OC[`viewport${e}`] = function(t) {
		var n = `client${e}`, r = t.document, i = r.body, a = r.documentElement[n];
		return r.compatMode === "CSS1Compat" && a || i && i[n] || a;
	};
});
function kC(e, t, n) {
	var r = n;
	if (iC(e)) return t === "width" ? OC.viewportWidth(e) : OC.viewportHeight(e);
	if (e.nodeType === 9) return t === "width" ? OC.docWidth(e) : OC.docHeight(e);
	var i = t === "width" ? ["Left", "Right"] : ["Top", "Bottom"], a = Math.floor(t === "width" ? e.getBoundingClientRect().width : e.getBoundingClientRect().height), o = bC(e), s = 0;
	(a == null || a <= 0) && (a = void 0, s = XS(e, t), (s == null || Number(s) < 0) && (s = e.style[t] || 0), s = Math.floor(parseFloat(s)) || 0), r === void 0 && (r = o ? wC : SC);
	var c = a !== void 0 || o, l = a || s;
	return r === SC ? c ? l - DC(e, ["border", "padding"], i) : s : c ? r === wC ? l : l + (r === CC ? -DC(e, ["border"], i) : DC(e, ["margin"], i)) : s + DC(e, xC.slice(r), i);
}
var AC = {
	position: "absolute",
	visibility: "hidden",
	display: "block"
};
function jC() {
	var e = [...arguments], t, n = e[0];
	return n.offsetWidth === 0 ? EC(n, AC, function() {
		t = kC.apply(void 0, e);
	}) : t = kC.apply(void 0, e), t;
}
yC(["width", "height"], function(e) {
	var t = e.charAt(0).toUpperCase() + e.slice(1);
	OC[`outer${t}`] = function(t, n) {
		return t && jC(t, e, n ? TC : wC);
	};
	var n = e === "width" ? ["Left", "Right"] : ["Top", "Bottom"];
	OC[e] = function(t, r) {
		var i = r;
		return i === void 0 ? t && jC(t, e, SC) : t ? (bC(t) && (i += DC(t, ["padding", "border"], n)), QS(t, e, i)) : void 0;
	};
});
function MC(e, t) {
	for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n]);
	return e;
}
var Z = {
	getWindow: function(e) {
		if (e && e.document && e.setTimeout) return e;
		var t = e.ownerDocument || e;
		return t.defaultView || t.parentWindow;
	},
	getDocument: aC,
	offset: function(e, t, n) {
		if (t !== void 0) vC(e, t, n || {});
		else return rC(e);
	},
	isWindow: iC,
	each: yC,
	css: QS,
	clone: function(e) {
		var t, n = {};
		for (t in e) e.hasOwnProperty(t) && (n[t] = e[t]);
		if (e.overflow) for (t in e) e.hasOwnProperty(t) && (n.overflow[t] = e.overflow[t]);
		return n;
	},
	mix: MC,
	getWindowScrollLeft: function(e) {
		return tC(e);
	},
	getWindowScrollTop: function(e) {
		return nC(e);
	},
	merge: function() {
		for (var e = {}, t = 0; t < arguments.length; t++) Z.mix(e, t < 0 || arguments.length <= t ? void 0 : arguments[t]);
		return e;
	},
	viewportWidth: 0,
	viewportHeight: 0
};
MC(Z, OC);
var NC = Z.getParent;
function PC(e) {
	if (Z.isWindow(e) || e.nodeType === 9) return null;
	var t = Z.getDocument(e).body, n, r = Z.css(e, "position");
	if (r !== "fixed" && r !== "absolute") return e.nodeName.toLowerCase() === "html" ? null : NC(e);
	for (n = NC(e); n && n !== t && n.nodeType !== 9; n = NC(n)) if (r = Z.css(n, "position"), r !== "static") return n;
	return null;
}
var FC = Z.getParent;
function IC(e) {
	if (Z.isWindow(e) || e.nodeType === 9) return !1;
	var t = Z.getDocument(e), n = t.body, r = null;
	for (r = FC(e); r && r !== n && r !== t; r = FC(r)) if (Z.css(r, "position") === "fixed") return !0;
	return !1;
}
function LC(e, t) {
	for (var n = {
		left: 0,
		right: Infinity,
		top: 0,
		bottom: Infinity
	}, r = PC(e), i = Z.getDocument(e), a = i.defaultView || i.parentWindow, o = i.body, s = i.documentElement; r;) {
		if ((navigator.userAgent.indexOf("MSIE") === -1 || r.clientWidth !== 0) && r !== o && r !== s && Z.css(r, "overflow") !== "visible") {
			var c = Z.offset(r);
			c.left += r.clientLeft, c.top += r.clientTop, n.top = Math.max(n.top, c.top), n.right = Math.min(n.right, c.left + r.clientWidth), n.bottom = Math.min(n.bottom, c.top + r.clientHeight), n.left = Math.max(n.left, c.left);
		} else if (r === o || r === s) break;
		r = PC(r);
	}
	var l = null;
	!Z.isWindow(e) && e.nodeType !== 9 && (l = e.style.position, Z.css(e, "position") === "absolute" && (e.style.position = "fixed"));
	var u = Z.getWindowScrollLeft(a), d = Z.getWindowScrollTop(a), f = Z.viewportWidth(a), p = Z.viewportHeight(a), m = s.scrollWidth, h = s.scrollHeight, g = window.getComputedStyle(o);
	if (g.overflowX === "hidden" && (m = a.innerWidth), g.overflowY === "hidden" && (h = a.innerHeight), e.style && (e.style.position = l), t || IC(e)) n.left = Math.max(n.left, u), n.top = Math.max(n.top, d), n.right = Math.min(n.right, u + f), n.bottom = Math.min(n.bottom, d + p);
	else {
		var _ = Math.max(m, u + f);
		n.right = Math.min(n.right, _);
		var v = Math.max(h, d + p);
		n.bottom = Math.min(n.bottom, v);
	}
	return n.top >= 0 && n.left >= 0 && n.bottom > n.top && n.right > n.left ? n : null;
}
function RC(e, t, n, r) {
	var i = Z.clone(e), a = {
		width: t.width,
		height: t.height
	};
	return r.adjustX && i.left < n.left && (i.left = n.left), r.resizeWidth && i.left >= n.left && i.left + a.width > n.right && (a.width -= i.left + a.width - n.right), r.adjustX && i.left + a.width > n.right && (i.left = Math.max(n.right - a.width, n.left)), r.adjustY && i.top < n.top && (i.top = n.top), r.resizeHeight && i.top >= n.top && i.top + a.height > n.bottom && (a.height -= i.top + a.height - n.bottom), r.adjustY && i.top + a.height > n.bottom && (i.top = Math.max(n.bottom - a.height, n.top)), Z.mix(i, a);
}
function zC(e) {
	var t, n, r;
	if (!Z.isWindow(e) && e.nodeType !== 9) t = Z.offset(e), n = Z.outerWidth(e), r = Z.outerHeight(e);
	else {
		var i = Z.getWindow(e);
		t = {
			left: Z.getWindowScrollLeft(i),
			top: Z.getWindowScrollTop(i)
		}, n = Z.viewportWidth(i), r = Z.viewportHeight(i);
	}
	return t.width = n, t.height = r, t;
}
function BC(e, t) {
	var n = t.charAt(0), r = t.charAt(1), i = e.width, a = e.height, o = e.left, s = e.top;
	return n === "c" ? s += a / 2 : n === "b" && (s += a), r === "c" ? o += i / 2 : r === "r" && (o += i), {
		left: o,
		top: s
	};
}
function VC(e, t, n, r, i) {
	var a = BC(t, n[1]), o = BC(e, n[0]), s = [o.left - a.left, o.top - a.top];
	return {
		left: Math.round(e.left - s[0] + r[0] - i[0]),
		top: Math.round(e.top - s[1] + r[1] - i[1])
	};
}
function HC(e, t, n) {
	return e.left < n.left || e.left + t.width > n.right;
}
function UC(e, t, n) {
	return e.top < n.top || e.top + t.height > n.bottom;
}
function WC(e, t, n) {
	return e.left > n.right || e.left + t.width < n.left;
}
function GC(e, t, n) {
	return e.top > n.bottom || e.top + t.height < n.top;
}
function KC(e, t, n) {
	var r = [];
	return Z.each(e, function(e) {
		r.push(e.replace(t, function(e) {
			return n[e];
		}));
	}), r;
}
function qC(e, t) {
	return e[t] = -e[t], e;
}
function JC(e, t) {
	return (/%$/.test(e) ? parseInt(e.substring(0, e.length - 1), 10) / 100 * t : parseInt(e, 10)) || 0;
}
function YC(e, t) {
	e[0] = JC(e[0], t.width), e[1] = JC(e[1], t.height);
}
function XC(e, t, n, r) {
	var i = n.points, a = n.offset || [0, 0], o = n.targetOffset || [0, 0], s = n.overflow, c = n.source || e;
	a = [].concat(a), o = [].concat(o), s ||= {};
	var l = {}, u = 0, d = LC(c, !!(s && s.alwaysByViewport)), f = zC(c);
	YC(a, f), YC(o, t);
	var p = VC(f, t, i, a, o), m = Z.merge(f, p);
	if (d && (s.adjustX || s.adjustY) && r) {
		if (s.adjustX && HC(p, f, d)) {
			var h = KC(i, /[lr]/gi, {
				l: "r",
				r: "l"
			}), g = qC(a, 0), _ = qC(o, 0);
			WC(VC(f, t, h, g, _), f, d) || (u = 1, i = h, a = g, o = _);
		}
		if (s.adjustY && UC(p, f, d)) {
			var v = KC(i, /[tb]/gi, {
				t: "b",
				b: "t"
			}), y = qC(a, 1), b = qC(o, 1);
			GC(VC(f, t, v, y, b), f, d) || (u = 1, i = v, a = y, o = b);
		}
		u && (p = VC(f, t, i, a, o), Z.mix(m, p));
		var x = HC(p, f, d), S = UC(p, f, d);
		if (x || S) {
			var C = i;
			x && (C = KC(i, /[lr]/gi, {
				l: "r",
				r: "l"
			})), S && (C = KC(i, /[tb]/gi, {
				t: "b",
				b: "t"
			})), i = C, a = n.offset || [0, 0], o = n.targetOffset || [0, 0];
		}
		l.adjustX = s.adjustX && x, l.adjustY = s.adjustY && S, (l.adjustX || l.adjustY) && (m = RC(p, f, d, l));
	}
	return m.width !== f.width && Z.css(c, "width", Z.width(c) + m.width - f.width), m.height !== f.height && Z.css(c, "height", Z.height(c) + m.height - f.height), Z.offset(c, {
		left: m.left,
		top: m.top
	}, {
		useCssRight: n.useCssRight,
		useCssBottom: n.useCssBottom,
		useCssTransform: n.useCssTransform,
		ignoreShake: n.ignoreShake
	}), {
		points: i,
		offset: a,
		targetOffset: o,
		overflow: l
	};
}
function ZC(e, t, n) {
	var r, i, a = Z.getDocument(e), o = a.defaultView || a.parentWindow, s = Z.getWindowScrollLeft(o), c = Z.getWindowScrollTop(o), l = Z.viewportWidth(o), u = Z.viewportHeight(o);
	r = "pageX" in t ? t.pageX : s + t.clientX, i = "pageY" in t ? t.pageY : c + t.clientY;
	var d = {
		left: r,
		top: i,
		width: 0,
		height: 0
	}, f = r >= 0 && r <= s + l && i >= 0 && i <= c + u, p = [n.points[0], "cc"];
	return XC(e, d, PS(PS({}, n), {}, { points: p }), f);
}
// node_modules/@antv/x6/es/plugin/dnd/style/raw.js
var QC = ".x6-widget-dnd {\n  position: absolute;\n  top: -10000px;\n  left: -10000px;\n  z-index: 999999;\n  display: none;\n  cursor: move;\n  opacity: 0.7;\n}\n.x6-widget-dnd.dragging {\n  display: inline-block;\n}\n.x6-widget-dnd.dragging * {\n  pointer-events: none !important;\n}\n.x6-widget-dnd .x6-graph {\n  background: transparent;\n  box-shadow: none;\n}\n", $C = {
	getDragNode: (e) => e.clone(),
	getDropNode: (e) => e.clone()
}, ew = class extends yb {
	get targetScroller() {
		return this.options.target.getPlugin("scroller");
	}
	get targetGraph() {
		return this.options.target;
	}
	get targetModel() {
		return this.targetGraph.model;
	}
	get snapline() {
		return this.options.target.getPlugin("snapline");
	}
	constructor(e) {
		super(), this.name = "dnd", this.options = Object.assign(Object.assign({}, $C), e), this.init();
	}
	init() {
		Vl(this.name, QC), this.container = document.createElement("div"), U(this.container, this.prefixClassName("widget-dnd")), this.draggingGraph = new X(Object.assign(Object.assign({}, this.options.delegateGraphOptions), {
			container: document.createElement("div"),
			width: 1,
			height: 1,
			async: !1
		})), sd(this.container, this.draggingGraph.container);
	}
	start(e, t) {
		var n;
		let r = t;
		r.preventDefault(), this.targetModel.startBatch("dnd"), U(this.container, "dragging"), dd(this.container, this.options.draggingContainer || document.body), this.sourceNode = e, this.prepareDragging(e, r.clientX, r.clientY);
		let i = this.updateNodePosition(r.clientX, r.clientY);
		this.isSnaplineEnabled() && (this.snapline.captureCursorOffset({
			e: r,
			node: e,
			cell: e,
			view: this.draggingView,
			x: i.x,
			y: i.y
		}), (n = this.draggingNode) == null || n.on("change:position", this.snap, this)), this.delegateDocumentEvents(Ux, r.data);
	}
	isSnaplineEnabled() {
		return this.snapline?.isEnabled();
	}
	prepareDragging(e, t, n) {
		let r = this.draggingGraph, i = r.model, a = this.options.getDragNode(e, {
			sourceNode: e,
			draggingGraph: r,
			targetGraph: this.targetGraph
		});
		a.position(0, 0);
		let o = 5;
		if (this.isSnaplineEnabled() && (o += this.snapline.options.tolerance || 0), this.isSnaplineEnabled() || this.options.scaled) {
			let e = this.targetGraph.transform.getScale();
			r.scale(e.sx, e.sy), o *= Math.max(e.sx, e.sy);
		} else r.scale(1, 1);
		this.clearDragging(), i.resetCells([a]);
		let s = r.findViewByCell(a);
		s.undelegateEvents(), s.cell.off("changed"), r.fitToContent({
			padding: o,
			allowNewOrigin: "any",
			useCellGeometry: !1
		});
		let c = s.getBBox();
		this.geometryBBox = s.getBBox({ useCellGeometry: !0 }), this.delta = this.geometryBBox.getTopLeft().diff(c.getTopLeft()), this.draggingNode = a, this.draggingView = s, this.draggingBBox = a.getBBox(), this.padding = o, this.updateGraphPosition(t, n);
	}
	updateGraphPosition(e, t) {
		let n = this.delta, r = this.geometryBBox, i = this.padding || 5, a = {
			left: e - n.x - r.width / 2 - i,
			top: t - n.y - r.height / 2 - i
		};
		this.draggingGraph && ZC(this.container, {
			clientX: a.left,
			clientY: a.top
		}, { points: ["tl"] });
	}
	updateNodePosition(e, t) {
		let n = this.targetGraph.clientToLocal(e, t), r = this.draggingBBox;
		return r && (n.x -= r.width / 2, n.y -= r.height / 2, this.draggingNode.position(n.x, n.y)), n;
	}
	snap({ cell: e, current: t, options: n }) {
		let r = e;
		if (n.snapped) {
			let e = this.draggingBBox;
			r.position(e.x + n.tx, e.y + n.ty, { silent: !0 }), this.draggingView.translate(), r.position(t.x, t.y, { silent: !0 }), this.snapOffset = {
				x: n.tx,
				y: n.ty
			};
		} else this.snapOffset = null;
	}
	onMouseMove(e) {
		this.onDragging(e);
	}
	onMouseUp(e) {
		this.onDragEnd(e);
	}
	onDragging(e) {
		let t = this.draggingView;
		if (t) {
			e.preventDefault();
			let n = this.normalizeEvent(e), r = n.clientX, i = n.clientY;
			this.updateGraphPosition(r, i);
			let a = this.updateNodePosition(r, i), o = this.targetGraph.options.embedding.enabled, s = (o || this.isSnaplineEnabled()) && this.isInsideValidArea({
				x: r,
				y: i
			});
			if (o) {
				t.setEventData(n, {
					graph: this.targetGraph,
					candidateEmbedView: this.candidateEmbedView
				});
				let e = t.getEventData(n);
				s ? t.processEmbedding(n, e) : t.clearEmbedding(e), this.candidateEmbedView = e.candidateEmbedView;
			}
			this.isSnaplineEnabled() && (s ? this.snapline.snapOnMoving({
				e: n,
				view: t,
				x: a.x,
				y: a.y
			}) : this.snapline.hide());
		}
	}
	onDragEnd(e) {
		let t = this.draggingNode;
		if (t) {
			let n = this.normalizeEvent(e), r = this.draggingView, i = this.draggingBBox, a = this.snapOffset, o = i.x, s = i.y;
			a && (o += a.x, s += a.y), t.position(o, s, { silent: !0 });
			let c = this.drop(t, {
				x: n.clientX,
				y: n.clientY
			}), l = (e) => {
				e ? (this.onDropped(t), this.targetGraph.options.embedding.enabled && r && (r.setEventData(n, {
					cell: e,
					graph: this.targetGraph,
					candidateEmbedView: this.candidateEmbedView
				}), r.finalizeEmbedding(n, r.getEventData(n)))) : this.onDropInvalid(), this.candidateEmbedView = null, this.targetModel.stopBatch("dnd");
			};
			Ql(c) ? (this.undelegateDocumentEvents(), c.then(l)) : l(c);
		}
	}
	clearDragging() {
		this.draggingNode && (this.sourceNode = null, this.draggingNode.remove(), this.draggingNode = null, this.draggingView = null, this.delta = null, this.padding = null, this.snapOffset = null, this.undelegateDocumentEvents());
	}
	onDropped(e) {
		this.draggingNode === e && (this.clearDragging(), Vu(this.container, "dragging"), ad(this.container));
	}
	onDropInvalid() {
		let e = this.draggingNode;
		e && this.onDropped(e);
	}
	isInsideValidArea(e) {
		let t, n = null, r = this.targetGraph, i = this.targetScroller;
		this.options.dndContainer && (n = this.getDropArea(this.options.dndContainer));
		let a = n?.containsPoint(e);
		if (i) {
			if (i.options.autoResize) t = this.getDropArea(i.container);
			else {
				let e = this.getDropArea(i.container);
				t = this.getDropArea(r.container).intersectsWithRect(e);
			}
		} else t = this.getDropArea(r.container);
		return !a && t && t.containsPoint(e);
	}
	getDropArea(e) {
		let t = Ip(e), n = document.body.scrollTop || document.documentElement.scrollTop, r = document.body.scrollLeft || document.documentElement.scrollLeft;
		return B.create({
			x: t.left + parseInt(G(e, "border-left-width"), 10) - r,
			y: t.top + parseInt(G(e, "border-top-width"), 10) - n,
			width: e.clientWidth,
			height: e.clientHeight
		});
	}
	drop(e, t) {
		if (this.isInsideValidArea(t)) {
			let n = this.targetGraph, r = n.model, i = n.clientToLocal(t), a = this.sourceNode, o = this.options.getDropNode(e, {
				sourceNode: a,
				draggingNode: e,
				targetGraph: this.targetGraph,
				draggingGraph: this.draggingGraph
			}), s = o.getBBox();
			i.x += s.x - s.width / 2, i.y += s.y - s.height / 2;
			let c = this.snapOffset ? 1 : n.getGridSize();
			o.position(cu(i.x, c), cu(i.y, c)), o.removeZIndex();
			let l = this.options.validateNode, u = !l || l(o, {
				sourceNode: a,
				draggingNode: e,
				droppingNode: o,
				targetGraph: n,
				draggingGraph: this.draggingGraph
			});
			return typeof u == "boolean" ? u ? (r.addCell(o, { stencil: this.cid }), o) : null : eu(u).then((e) => e ? (r.addCell(o, { stencil: this.cid }), o) : null);
		}
		return null;
	}
	onRemove() {
		this.draggingGraph && (this.draggingGraph.view.remove(), this.draggingGraph.dispose());
	}
	dispose() {
		this.remove(), Hl(this.name);
	}
};
f([q()], ew.prototype, "dispose", null), X.prototype.toSVG = function(e, t) {
	let n = this.getPlugin("export");
	n && n.toSVG(e, t);
}, X.prototype.toSVGAsync = function(e) {
	return p(this, void 0, void 0, function* () {
		return new Promise((t) => {
			this.toSVG(t, e);
		});
	});
}, X.prototype.toPNG = function(e, t) {
	let n = this.getPlugin("export");
	n && n.toPNG(e, t);
}, X.prototype.toPNGAsync = function(e) {
	return p(this, void 0, void 0, function* () {
		return new Promise((t) => {
			this.toPNG(t, e);
		});
	});
}, X.prototype.toJPEG = function(e, t) {
	let n = this.getPlugin("export");
	n && n.toJPEG(e, t);
}, X.prototype.toJPEGAsync = function(e) {
	return p(this, void 0, void 0, function* () {
		return new Promise((t) => {
			this.toJPEG(t, e);
		});
	});
}, X.prototype.exportPNG = function(e, t) {
	let n = this.getPlugin("export");
	n && n.exportPNG(e, t);
}, X.prototype.exportJPEG = function(e, t) {
	let n = this.getPlugin("export");
	n && n.exportJPEG(e, t);
}, X.prototype.exportSVG = function(e, t) {
	let n = this.getPlugin("export");
	n && n.exportSVG(e, t);
};
// node_modules/@antv/x6/es/plugin/export/index.js
var tw = class extends Wm {
	constructor() {
		super(...arguments), this.name = "export";
	}
	get view() {
		return this.graph.view;
	}
	init(e) {
		this.graph = e;
	}
	exportPNG(e = "chart", t = {}) {
		this.toPNG((t) => {
			Yl(t, e);
		}, t);
	}
	exportJPEG(e = "chart", t = {}) {
		this.toJPEG((t) => {
			Yl(t, e);
		}, t);
	}
	exportSVG(e = "chart", t = {}) {
		this.toSVG((t) => {
			Yl(Xl(t), e);
		}, t);
	}
	toSVG(e, t = {}) {
		this.notify("before:export", t), Object.hasOwn(t, "copyStyles") || (t.copyStyles = !0), Object.hasOwn(t, "serializeImages") || (t.serializeImages = !0);
		let n = this.view.svg, r = lf.create(n).clone(), i = r.node, a = r.findOne(`.${this.view.prefixClassName("graph-svg-stage")}`), o = t.viewBox || this.graph.graphToLocal(this.graph.getContentBBox()), s = t.preserveDimensions;
		if (s) {
			let e = typeof s == "boolean" ? o : s;
			r.attr({
				width: e.width,
				height: e.height
			});
		}
		if (r.removeAttribute("style").attr("viewBox", [
			o.x,
			o.y,
			o.width,
			o.height
		].join(" ")), a.removeAttribute("transform"), t.copyStyles) {
			let e = n.ownerDocument, t = Array.from(n.querySelectorAll("*")), r = Array.from(i.querySelectorAll("*")), a = e.implementation.createHTMLDocument("x6-export-defaults"), o = a.importNode(n, !0);
			a.body.appendChild(o);
			let s = Array.from(o.querySelectorAll("*")), c = {};
			s.forEach((e, t) => {
				let n = window.getComputedStyle(e, null), r = {};
				for (let e = 0; e < n.length; e += 1) {
					let t = n[e];
					r[t] = n.getPropertyValue(t);
				}
				c[t] = r;
			});
			let l = {};
			t.forEach((e, t) => {
				let n = window.getComputedStyle(e, null), r = c[t] || {}, i = {};
				for (let e = 0; e < n.length; e += 1) {
					let t = n[e], a = n.getPropertyValue(t);
					a !== r[t] && (i[t] = a);
				}
				l[t] = i;
			}), r.forEach((e, t) => {
				G(e, l[t]);
			});
		}
		let c = t.stylesheet;
		if (typeof c == "string") {
			let e = n.ownerDocument.implementation.createDocument(null, "xml", null).createCDATASection(c);
			r.prepend(lf.create("style", { type: "text/css" }, [e]));
		}
		let l = () => {
			let n = t.beforeSerialize;
			if (typeof n == "function") {
				let e = R(n, this.graph, i);
				e instanceof SVGSVGElement && (i = e);
			}
			let r = new XMLSerializer().serializeToString(i).replace(/&nbsp;/g, "\xA0");
			this.notify("after:export", t), e(r);
		};
		if (t.serializeImages) {
			let e = r.find("image").map((e) => new Promise((t) => {
				Kl(e.attr("xlink:href") || e.attr("href"), (n, r) => {
					!n && r && (e.attr("xlink:href", r), e.attr("href", r)), t();
				});
			}));
			Promise.all(e).then(l);
		} else l();
	}
	toDataURL(e, t) {
		let n = t.viewBox || this.graph.getContentBBox(), r = Dl(t.padding);
		t.width && t.height && (r.left + r.right >= t.width && (r.left = r.right = 0), r.top + r.bottom >= t.height && (r.top = r.bottom = 0));
		let i = new B(-r.left, -r.top, r.left + r.right, r.top + r.bottom);
		if (t.width && t.height) {
			let e = n.width + r.left + r.right, a = n.height + r.top + r.bottom;
			i.scale(e / t.width, a / t.height);
		}
		n = B.create(n).moveAndExpand(i);
		let a = typeof t.width == "number" && typeof t.height == "number" ? {
			width: t.width,
			height: t.height
		} : n, o = t.ratio ? t.ratio : 1;
		Number.isFinite(o) && o !== 0 || (o = 1);
		let s = {
			width: Math.max(Math.round(a.width * o), 1),
			height: Math.max(Math.round(a.height * o), 1)
		};
		{
			let e = document.createElement("canvas"), t = e.getContext("2d");
			e.width = s.width, e.height = s.height;
			let n = s.width - 1, r = s.height - 1;
			t.fillStyle = "rgb(1,1,1)", t.fillRect(n, r, 1, 1);
			let i = t.getImageData(n, r, 1, 1).data;
			if (i[0] !== 1 || i[1] !== 1 || i[2] !== 1) throw Error("size exceeded");
		}
		let c = new Image();
		c.onload = () => {
			let n = document.createElement("canvas");
			n.width = s.width, n.height = s.height;
			let r = n.getContext("2d");
			r.fillStyle = t.backgroundColor || "white", r.fillRect(0, 0, s.width, s.height);
			try {
				r.drawImage(c, 0, 0, s.width, s.height), e(n.toDataURL(t.type, t.quality));
			} catch {}
		}, this.toSVG((e) => {
			c.src = `data:image/svg+xml,${encodeURIComponent(e)}`;
		}, Object.assign(Object.assign({}, t), {
			viewBox: n,
			serializeImages: !0,
			preserveDimensions: Object.assign({}, s)
		}));
	}
	toPNG(e, t = {}) {
		this.toDataURL(e, Object.assign(Object.assign({}, t), { type: "image/png" }));
	}
	toJPEG(e, t = {}) {
		this.toDataURL(e, Object.assign(Object.assign({}, t), { type: "image/jpeg" }));
	}
	notify(e, t) {
		this.trigger(e, t), this.graph.trigger(e, t);
	}
	dispose() {
		this.off();
	}
};
f([q()], tw.prototype, "dispose", null);
// node_modules/@antv/x6/es/plugin/history/util.js
function nw(e) {
	return e === "cell:added";
}
function rw(e) {
	return e === "cell:removed";
}
function iw(e) {
	return e != null && e.startsWith("cell:change:");
}
function aw(e) {
	let t = [
		"cell:added",
		"cell:removed",
		"cell:change:*"
	], n = ["batch:start", "batch:stop"], r = e.eventNames ? e.eventNames.filter((e) => !(iw(e) || t.includes(e) || n.includes(e))) : t;
	return Object.assign(Object.assign({ enabled: !0 }, e), {
		eventNames: r,
		applyOptionsList: e.applyOptionsList || ["propertyPath"],
		revertOptionsList: e.revertOptionsList || ["propertyPath"]
	});
}
function ow(e) {
	let t = [];
	for (let n = 0, r = e.length; n < r; n += 1) {
		let r = e[n], i = null;
		if (nw(r.event)) {
			let t = r.data.id;
			for (let r = 0; r < n; r += 1) if (e[r].data.id === t) {
				i = r;
				break;
			}
		}
		i === null ? t.push(r) : t.splice(i, 0, r);
	}
	return t;
}
// node_modules/@antv/x6/es/plugin/history/validator.js
var sw = class extends Wm {
	constructor(e) {
		super(), this.map = {}, this.command = e.history, this.cancelInvalid = e.cancelInvalid !== !1, this.command.on("add", this.onCommandAdded, this);
	}
	onCommandAdded({ cmds: e }) {
		return Array.isArray(e) ? e.every((e) => this.isValidCommand(e)) : this.isValidCommand(e);
	}
	isValidCommand(e) {
		if (e.options && e.options.validation === !1) return !0;
		let t = e.event && this.map[e.event] || [], n = null;
		return t.forEach((t) => {
			let r = 0, i = (a) => {
				let o = t[r];
				r += 1;
				try {
					o ? o(a, e, i) : n = a;
				} catch (e) {
					i(e);
				}
			};
			i(n);
		}), !n || (this.cancelInvalid && this.command.cancel(), this.emit("invalid", { err: n }), !1);
	}
	validate(e, ...t) {
		let n = Array.isArray(e) ? e : e.split(/\s+/);
		return t.forEach((e) => {
			if (typeof e != "function") throw Error(`${n.join(" ")} requires callback functions.`);
		}), n.forEach((e) => {
			this.map[e] ?? (this.map[e] = []), this.map[e].push(t);
		}), this;
	}
	dispose() {
		this.command.off("add", this.onCommandAdded, this);
	}
};
f([q()], sw.prototype, "dispose", null), X.prototype.isHistoryEnabled = function() {
	let e = this.getPlugin("history");
	return e ? e.isEnabled() : !1;
}, X.prototype.enableHistory = function() {
	let e = this.getPlugin("history");
	return e && e.enable(), this;
}, X.prototype.disableHistory = function() {
	let e = this.getPlugin("history");
	return e && e.disable(), this;
}, X.prototype.toggleHistory = function(e) {
	let t = this.getPlugin("history");
	return t && t.toggleEnabled(e), this;
}, X.prototype.undo = function(e) {
	let t = this.getPlugin("history");
	return t && t.undo(e), this;
}, X.prototype.redo = function(e) {
	let t = this.getPlugin("history");
	return t && t.redo(e), this;
}, X.prototype.undoAndCancel = function(e) {
	let t = this.getPlugin("history");
	return t && t.cancel(e), this;
}, X.prototype.canUndo = function() {
	let e = this.getPlugin("history");
	return e ? e.canUndo() : !1;
}, X.prototype.canRedo = function() {
	let e = this.getPlugin("history");
	return e ? e.canRedo() : !1;
}, X.prototype.cleanHistory = function(e) {
	let t = this.getPlugin("history");
	return t && t.clean(e), this;
}, X.prototype.getHistoryStackSize = function() {
	return this.getPlugin("history").getSize();
}, X.prototype.getUndoStackSize = function() {
	return this.getPlugin("history").getUndoSize();
}, X.prototype.getRedoStackSize = function() {
	return this.getPlugin("history").getRedoSize();
}, X.prototype.getUndoRemainSize = function() {
	return this.getPlugin("history").getUndoRemainSize();
};
// node_modules/@antv/x6/es/plugin/history/index.js
var cw = class extends Wm {
	constructor(e = {}) {
		super(), this.name = "history", this.batchCommands = null, this.batchLevel = 0, this.lastBatchIndex = -1, this.freezed = !1, this.stackSize = 0, this.handlers = [];
		let { stackSize: t = 0 } = e;
		this.stackSize = t, this.options = aw(e), this.validator = new sw({
			history: this,
			cancelInvalid: this.options.cancelInvalid
		});
	}
	init(e) {
		this.graph = e, this.model = this.graph.model, this.clean(), this.startListening();
	}
	isEnabled() {
		return !this.disabled;
	}
	enable() {
		this.disabled && (this.options.enabled = !0);
	}
	disable() {
		this.disabled || (this.options.enabled = !1);
	}
	toggleEnabled(e) {
		return e == null ? this.isEnabled() ? this.disable() : this.enable() : e !== this.isEnabled() && (e ? this.enable() : this.disable()), this;
	}
	undo(e = {}) {
		if (!this.disabled) {
			let t = this.undoStack.pop();
			t && (this.revertCommand(t, e), this.redoStack.push(t), this.notify("undo", t, e));
		}
		return this;
	}
	redo(e = {}) {
		if (!this.disabled) {
			let t = this.redoStack.pop();
			t && (this.applyCommand(t, e), this.undoStackPush(t), this.notify("redo", t, e));
		}
		return this;
	}
	cancel(e = {}) {
		if (!this.disabled) {
			let t = this.undoStack.pop();
			t && (this.revertCommand(t, e), this.redoStack = [], this.notify("cancel", t, e));
		}
		return this;
	}
	getSize() {
		return this.stackSize;
	}
	getUndoRemainSize() {
		let e = this.undoStack.length;
		return this.stackSize - e;
	}
	getUndoSize() {
		return this.undoStack.length;
	}
	getRedoSize() {
		return this.redoStack.length;
	}
	canUndo() {
		return !this.disabled && this.undoStack.length > 0;
	}
	canRedo() {
		return !this.disabled && this.redoStack.length > 0;
	}
	clean(e = {}) {
		return this.undoStack = [], this.redoStack = [], this.notify("clean", null, e), this;
	}
	get disabled() {
		return this.options.enabled !== !0;
	}
	validate(e, ...t) {
		return this.validator.validate(e, ...t), this;
	}
	startListening() {
		this.model.on("batch:start", this.initBatchCommand, this), this.model.on("batch:stop", this.storeBatchCommand, this), this.options.eventNames && this.options.eventNames.forEach((e, t) => {
			this.handlers[t] = this.addCommand.bind(this, e), this.model.on(e, this.handlers[t]);
		}), this.validator.on("invalid", (e) => this.trigger("invalid", e));
	}
	stopListening() {
		this.model.off("batch:start", this.initBatchCommand, this), this.model.off("batch:stop", this.storeBatchCommand, this), this.options.eventNames && (this.options.eventNames.forEach((e, t) => {
			this.model.off(e, this.handlers[t]);
		}), this.handlers.length = 0), this.validator.off("invalid");
	}
	createCommand(e) {
		return {
			batch: e ? e.batch : !1,
			data: {}
		};
	}
	revertCommand(e, t) {
		this.freezed = !0;
		let n = Array.isArray(e) ? ow(e) : [e];
		for (let e = n.length - 1; e >= 0; --e) {
			let r = n[e], i = Object.assign(Object.assign({}, t), ol(r.options, this.options.revertOptionsList || []));
			this.executeCommand(r, !0, i);
		}
		this.freezed = !1;
	}
	applyCommand(e, t) {
		this.freezed = !0;
		let n = Array.isArray(e) ? ow(e) : [e];
		for (let e = 0; e < n.length; e += 1) {
			let r = n[e], i = Object.assign(Object.assign({}, t), ol(r.options, this.options.applyOptionsList || []));
			this.executeCommand(r, !1, i);
		}
		this.freezed = !1;
	}
	executeCommand(e, t, n) {
		let r = this.model, i = r.getCell(e.data.id), a = e.event;
		if (nw(a) && t || rw(a) && !t) i && i.remove(n);
		else if (nw(a) && !t || rw(a) && t) {
			let t = e.data;
			t.node ? r.addNode(t.props, n) : t.edge && r.addEdge(t.props, n);
		} else if (iw(a)) {
			let r = e.data, a = r.key;
			if (a && i) {
				let e = t ? r.prev[a] : r.next[a];
				r.key === "attrs" && this.ensureUndefinedAttrs(e, t ? r.next[a] : r.prev[a]) && (n.dirty = !0), i.prop(a, e, n);
			}
		} else {
			let r = this.options.executeCommand;
			r && R(r, this, e, t, n);
		}
	}
	addCommand(e, t) {
		if (this.freezed || this.disabled) return;
		let n = t, r = n.options || {};
		if (r.dryrun || nw(e) && this.options.ignoreAdd || rw(e) && this.options.ignoreRemove || iw(e) && this.options.ignoreChange) return;
		let i = this.options.beforeAddCommand;
		if (i != null && R(i, this, e, t) === !1) return;
		e === "cell:change:*" && (e = `cell:change:${n.key}`);
		let a = n.cell, o = Nx.isModel(a), s;
		if (this.batchCommands) {
			s = this.batchCommands[Math.max(this.lastBatchIndex, 0)];
			let t = o && !s.modelChange || s.data.id !== a.id, n = s.event !== e;
			if (this.lastBatchIndex >= 0 && (t || n)) {
				let t = this.batchCommands.findIndex((t) => (o && t.modelChange || t.data.id === a.id) && t.event === e);
				t < 0 || nw(e) || rw(e) ? s = this.createCommand({ batch: !0 }) : (s = this.batchCommands[t], this.batchCommands.splice(t, 1)), this.batchCommands.push(s), this.lastBatchIndex = this.batchCommands.length - 1;
			}
		} else s = this.createCommand({ batch: !1 });
		if (nw(e) || rw(e)) {
			let t = s.data;
			return s.event = e, s.options = r, t.id = a.id, t.props = as(a.toJSON()), a.isEdge() ? t.edge = !0 : a.isNode() && (t.node = !0), this.push(s, r);
		}
		if (iw(e)) {
			let n = t.key, i = s.data;
			return s.batch && s.event || (s.event = e, s.options = r, i.key = n, i.prev ??= {}, i.prev[n] = as(a.previous(n)), o ? s.modelChange = !0 : i.id = a.id), i.next ??= {}, i.next[n] = as(a.prop(n)), this.push(s, r);
		}
		let c = this.options.afterAddCommand;
		c && R(c, this, e, t, s), this.push(s, r);
	}
	initBatchCommand(e) {
		this.freezed || (this.batchCommands ? this.batchLevel += 1 : (this.batchCommands = [this.createCommand({ batch: !0 })], this.batchLevel = 0, this.lastBatchIndex = -1));
	}
	storeBatchCommand(e) {
		if (!this.freezed) {
			if (this.batchCommands && this.batchLevel <= 0) {
				let t = this.filterBatchCommand(this.batchCommands);
				t.length > 0 && (this.redoStack = [], this.undoStackPush(t), this.consolidateCommands(), this.notify("add", t, e)), this.batchCommands = null, this.lastBatchIndex = -1, this.batchLevel = 0;
			} else this.batchCommands && this.batchLevel > 0 && --this.batchLevel;
		}
	}
	filterBatchCommand(e) {
		let t = e.slice(), n = [];
		for (; t.length > 0;) {
			let e = t.shift(), r = e.event, i = e.data.id;
			if (r != null && (i != null || e.modelChange)) {
				if (nw(r)) {
					let e = t.findIndex((e) => rw(e.event) && e.data.id === i);
					if (e >= 0) {
						t = t.filter((t, n) => e < n || t.data.id !== i);
						continue;
					}
				} else if (rw(r)) {
					let e = t.findIndex((e) => nw(e.event) && e.data.id === i);
					if (e >= 0) {
						t.splice(e, 1);
						continue;
					}
				} else if (iw(r)) {
					let t = e.data;
					if (Kc(t.prev, t.next)) continue;
				}
				n.push(e);
			}
		}
		return n;
	}
	notify(e, t, n) {
		let r = t == null ? null : Array.isArray(t) ? t : [t];
		this.emit(e, {
			cmds: r,
			options: n
		}), this.graph.trigger(`history:${e}`, {
			cmds: r,
			options: n
		}), this.emit("change", {
			cmds: r,
			options: n
		}), this.graph.trigger("history:change", {
			cmds: r,
			options: n
		});
	}
	push(e, t) {
		this.redoStack = [], e.batch ? (this.lastBatchIndex = Math.max(this.lastBatchIndex, 0), this.emit("batch", {
			cmd: e,
			options: t
		})) : (this.undoStackPush(e), this.consolidateCommands(), this.notify("add", e, t));
	}
	consolidateCommands() {
		let e = this.undoStack[this.undoStack.length - 1], t = this.undoStack[this.undoStack.length - 2];
		if (!Array.isArray(e)) return;
		let n = new Set(e.map((e) => e.event));
		if (n.size !== 2 || !n.has("cell:change:parent") || !n.has("cell:change:children") || !e.every((e) => e.batch && e.options?.ui) || !Array.isArray(t) || t.length !== 1) return;
		let r = t[0];
		r.event === "cell:change:position" && r.options?.ui && (t.push(...e), this.undoStack.pop());
	}
	undoStackPush(e) {
		this.stackSize === 0 || this.undoStack.length >= this.stackSize && this.undoStack.shift(), this.undoStack.push(e);
	}
	ensureUndefinedAttrs(e, t) {
		let n = !1;
		return e !== null && t !== null && typeof e == "object" && typeof t == "object" && Object.keys(t).forEach((r) => {
			e[r] === void 0 && t[r] !== void 0 ? (e[r] = void 0, n = !0) : typeof e[r] == "object" && typeof t[r] == "object" && (n = this.ensureUndefinedAttrs(e[r], t[r]));
		}), n;
	}
	dispose() {
		this.validator.dispose(), this.clean(), this.stopListening(), this.off();
	}
};
f([q()], cw.prototype, "dispose", null);
// node_modules/@antv/x6/es/plugin/keyboard/util.js
var lw = /* @__PURE__ */ l((/* @__PURE__ */ o(((e, t) => {
	(function(e, n, r) {
		if (!e) return;
		for (var i = {
			8: "backspace",
			9: "tab",
			13: "enter",
			16: "shift",
			17: "ctrl",
			18: "alt",
			20: "capslock",
			27: "esc",
			32: "space",
			33: "pageup",
			34: "pagedown",
			35: "end",
			36: "home",
			37: "left",
			38: "up",
			39: "right",
			40: "down",
			45: "ins",
			46: "del",
			91: "meta",
			93: "meta",
			224: "meta"
		}, a = {
			106: "*",
			107: "+",
			109: "-",
			110: ".",
			111: "/",
			186: ";",
			187: "=",
			188: ",",
			189: "-",
			190: ".",
			191: "/",
			192: "`",
			219: "[",
			220: "\\",
			221: "]",
			222: "'"
		}, o = {
			"~": "`",
			"!": "1",
			"@": "2",
			"#": "3",
			$: "4",
			"%": "5",
			"^": "6",
			"&": "7",
			"*": "8",
			"(": "9",
			")": "0",
			_: "-",
			"+": "=",
			":": ";",
			"\"": "'",
			"<": ",",
			">": ".",
			"?": "/",
			"|": "\\"
		}, s = {
			option: "alt",
			command: "meta",
			return: "enter",
			escape: "esc",
			plus: "+",
			mod: /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "meta" : "ctrl"
		}, c, l = 1; l < 20; ++l) i[111 + l] = "f" + l;
		for (l = 0; l <= 9; ++l) i[l + 96] = l.toString();
		function u(e, t, n) {
			e.addEventListener ? e.addEventListener(t, n, !1) : e.attachEvent("on" + t, n);
		}
		function d(e) {
			if (e.type == "keypress") {
				var t = String.fromCharCode(e.which);
				return e.shiftKey || (t = t.toLowerCase()), t;
			}
			return i[e.which] ? i[e.which] : a[e.which] ? a[e.which] : String.fromCharCode(e.which).toLowerCase();
		}
		function f(e, t) {
			return e.sort().join(",") === t.sort().join(",");
		}
		function p(e) {
			var t = [];
			return e.shiftKey && t.push("shift"), e.altKey && t.push("alt"), e.ctrlKey && t.push("ctrl"), e.metaKey && t.push("meta"), t;
		}
		function m(e) {
			e.preventDefault ? e.preventDefault() : e.returnValue = !1;
		}
		function h(e) {
			e.stopPropagation ? e.stopPropagation() : e.cancelBubble = !0;
		}
		function g(e) {
			return e == "shift" || e == "ctrl" || e == "alt" || e == "meta";
		}
		function _() {
			if (!c) for (var e in c = {}, i) e > 95 && e < 112 || i.hasOwnProperty(e) && (c[i[e]] = e);
			return c;
		}
		function v(e, t, n) {
			return n ||= _()[e] ? "keydown" : "keypress", n == "keypress" && t.length && (n = "keydown"), n;
		}
		function y(e) {
			return e === "+" ? ["+"] : (e = e.replace(/\+{2}/g, "+plus"), e.split("+"));
		}
		function b(e, t) {
			var n, r, i, a = [];
			for (n = y(e), i = 0; i < n.length; ++i) r = n[i], s[r] && (r = s[r]), t && t != "keypress" && o[r] && (r = o[r], a.push("shift")), g(r) && a.push(r);
			return t = v(r, a, t), {
				key: r,
				modifiers: a,
				action: t
			};
		}
		function x(e, t) {
			return e === null || e === n ? !1 : e === t || x(e.parentNode, t);
		}
		function S(e) {
			var t = this;
			if (e ||= n, !(t instanceof S)) return new S(e);
			t.target = e, t._callbacks = {}, t._directMap = {};
			var r = {}, i, a = !1, o = !1, s = !1;
			function c(e) {
				e ||= {};
				var t = !1, n;
				for (n in r) e[n] ? t = !0 : r[n] = 0;
				t || (s = !1);
			}
			function l(e, n, i, a, o, s) {
				var c, l, u = [], d = i.type;
				if (!t._callbacks[e]) return [];
				for (d == "keyup" && g(e) && (n = [e]), c = 0; c < t._callbacks[e].length; ++c) if (l = t._callbacks[e][c], (a || !l.seq || r[l.seq] == l.level) && d == l.action && (d == "keypress" && !i.metaKey && !i.ctrlKey || f(n, l.modifiers))) {
					var p = !a && l.combo == o, m = a && l.seq == a && l.level == s;
					(p || m) && t._callbacks[e].splice(c, 1), u.push(l);
				}
				return u;
			}
			function _(e, n, r, i) {
				t.stopCallback(n, n.target || n.srcElement, r, i) || e(n, r) === !1 && (m(n), h(n));
			}
			t._handleKey = function(e, t, n) {
				var r = l(e, t, n), i, a = {}, u = 0, d = !1;
				for (i = 0; i < r.length; ++i) r[i].seq && (u = Math.max(u, r[i].level));
				for (i = 0; i < r.length; ++i) if (r[i].seq) {
					if (r[i].level != u) continue;
					d = !0, a[r[i].seq] = 1, _(r[i].callback, n, r[i].combo, r[i].seq);
				} else d || _(r[i].callback, n, r[i].combo);
				var f = n.type == "keypress" && o;
				n.type == s && !g(e) && !f && c(a), o = d && n.type == "keydown";
			};
			function v(e) {
				typeof e.which != "number" && (e.which = e.keyCode);
				var n = d(e);
				n && (e.type == "keyup" && a === n ? a = !1 : t.handleKey(n, p(e), e));
			}
			function y() {
				clearTimeout(i), i = setTimeout(c, 1e3);
			}
			function x(e, t, n, i) {
				r[e] = 0;
				function o(t) {
					return function() {
						s = t, ++r[e], y();
					};
				}
				function l(t) {
					_(n, t, e), i !== "keyup" && (a = d(t)), setTimeout(c, 10);
				}
				for (var u = 0; u < t.length; ++u) {
					var f = u + 1 === t.length ? l : o(i || b(t[u + 1]).action);
					C(t[u], f, i, e, u);
				}
			}
			function C(e, n, r, i, a) {
				t._directMap[e + ":" + r] = n, e = e.replace(/\s+/g, " ");
				var o = e.split(" "), s;
				o.length > 1 ? x(e, o, n, r) : (s = b(e, r), t._callbacks[s.key] = t._callbacks[s.key] || [], l(s.key, s.modifiers, { type: s.action }, i, e, a), t._callbacks[s.key][i ? "unshift" : "push"]({
					callback: n,
					modifiers: s.modifiers,
					action: s.action,
					seq: i,
					level: a,
					combo: e
				}));
			}
			t._bindMultiple = function(e, t, n) {
				for (var r = 0; r < e.length; ++r) C(e[r], t, n);
			}, u(e, "keypress", v), u(e, "keydown", v), u(e, "keyup", v);
		}
		S.prototype.bind = function(e, t, n) {
			var r = this;
			return e = e instanceof Array ? e : [e], r._bindMultiple.call(r, e, t, n), r;
		}, S.prototype.unbind = function(e, t) {
			var n = this;
			return n.bind.call(n, e, function() {}, t);
		}, S.prototype.trigger = function(e, t) {
			var n = this;
			return n._directMap[e + ":" + t] && n._directMap[e + ":" + t]({}, e), n;
		}, S.prototype.reset = function() {
			var e = this;
			return e._callbacks = {}, e._directMap = {}, e;
		}, S.prototype.stopCallback = function(e, t) {
			var n = this;
			if ((" " + t.className + " ").indexOf(" mousetrap ") > -1 || x(t, n.target)) return !1;
			if ("composedPath" in e && typeof e.composedPath == "function") {
				var r = e.composedPath()[0];
				r !== e.target && (t = r);
			}
			return t.tagName == "INPUT" || t.tagName == "SELECT" || t.tagName == "TEXTAREA" || t.isContentEditable;
		}, S.prototype.handleKey = function() {
			var e = this;
			return e._handleKey.apply(e, arguments);
		}, S.addKeycodes = function(e) {
			for (var t in e) e.hasOwnProperty(t) && (i[t] = e[t]);
			c = null;
		}, S.init = function() {
			var e = S(n);
			for (var t in e) t.charAt(0) !== "_" && (S[t] = function(t) {
				return function() {
					return e[t].apply(e, arguments);
				};
			}(t));
		}, S.init(), e.Mousetrap = S, t !== void 0 && t.exports && (t.exports = S), typeof define == "function" && define.amd && define(function() {
			return S;
		});
	})(typeof window < "u" ? window : null, typeof window < "u" ? document : null);
})))(), 1);
function uw(e, t, n) {
	let r = e.toLocaleLowerCase().replace(/\s/g, "").replace("delete", "del").replace("cmd", "command").replace("arrowup", "up").replace("arrowright", "right").replace("arrowdown", "down").replace("arrowleft", "left");
	return t ? R(t, n, r) : r;
}
function dw(e) {
	let t = e.target, n = (t?.tagName)?.toLowerCase(), r = ["input", "textarea"].includes(n);
	return W(t, "contenteditable") === "true" && (r = !0), r;
}
function fw(e, t, n) {
	let r = e.target, i = e.currentTarget;
	return r ? r === t || i === t || r === document.body || id(n, r) : !1;
}
// node_modules/@antv/x6/es/plugin/keyboard/keyboard.js
function pw(e) {
	let t = new lw.default(e.target), n = t.stopCallback;
	return t.stopCallback = (r, i, a) => e.isEnabledForEvent(r) ? n ? n.call(t, r, i, a) : !1 : !0, t;
}
var mw = class extends Um {
	get graph() {
		return this.options.graph;
	}
	constructor(e) {
		super(), this.options = e;
		let t = this.graph.getPlugin("scroller");
		this.container = t ? t.container : this.graph.container, e.global ? this.target = document : (this.target = this.container, this.disabled || this.target.setAttribute("tabindex", "-1"), this.graph.on("cell:mouseup", this.focus.bind(this), this), this.graph.on("blank:mouseup", this.focus.bind(this), this)), this.mousetrap = pw(this);
	}
	get disabled() {
		return this.options.enabled !== !0;
	}
	enable() {
		this.disabled && (this.options.enabled = !0, this.target instanceof HTMLElement && this.target.setAttribute("tabindex", "-1"));
	}
	disable() {
		this.disabled || (this.options.enabled = !1, this.target instanceof HTMLElement && this.target.removeAttribute("tabindex"));
	}
	on(e, t, n) {
		this.mousetrap.bind(this.getKeys(e), t, n);
	}
	off(e, t) {
		this.mousetrap.unbind(this.getKeys(e), t);
	}
	clear() {
		this.mousetrap.reset();
	}
	trigger(e, t) {
		this.mousetrap.trigger(uw(e, this.options.format, this.graph), t);
	}
	focus(e) {
		dw(e.e) || this.target.focus({ preventScroll: !0 });
	}
	getKeys(e) {
		return (Array.isArray(e) ? e : [e]).map((e) => uw(e, this.options.format, this.graph));
	}
	isEnabledForEvent(e) {
		let t = !this.disabled && fw(e, this.target, this.container), n = dw(e);
		if (t) {
			if (n && (e.key === "Backspace" || e.key === "Delete")) return !1;
			if (this.options.guard) return R(this.options.guard, this.graph, e);
		}
		return t;
	}
	dispose() {
		this.mousetrap.reset();
	}
};
f([q()], mw.prototype, "dispose", null), X.prototype.isKeyboardEnabled = function() {
	let e = this.getPlugin("keyboard");
	return e ? e.isEnabled() : !1;
}, X.prototype.enableKeyboard = function() {
	let e = this.getPlugin("keyboard");
	return e && e.enable(), this;
}, X.prototype.disableKeyboard = function() {
	let e = this.getPlugin("keyboard");
	return e && e.disable(), this;
}, X.prototype.toggleKeyboard = function(e) {
	let t = this.getPlugin("keyboard");
	return t && t.toggleEnabled(e), this;
}, X.prototype.bindKey = function(e, t, n) {
	let r = this.getPlugin("keyboard");
	return r && r.bindKey(e, t, n), this;
}, X.prototype.unbindKey = function(e, t) {
	let n = this.getPlugin("keyboard");
	return n && n.unbindKey(e, t), this;
}, X.prototype.clearKeys = function() {
	let e = this.getPlugin("keyboard");
	return e && e.clear(), this;
}, X.prototype.triggerKey = function(e, t) {
	let n = this.getPlugin("keyboard");
	return n && n.trigger(e, t), this;
};
// node_modules/@antv/x6/es/plugin/keyboard/index.js
var hw = class extends Um {
	constructor(e = {}) {
		super(), this.name = "keyboard", this.options = Object.assign({ enabled: !0 }, e);
	}
	init(e) {
		this.keyboardImpl = new mw(Object.assign(Object.assign({}, this.options), { graph: e }));
	}
	isEnabled() {
		return !this.keyboardImpl.disabled;
	}
	enable() {
		this.keyboardImpl.enable();
	}
	disable() {
		this.keyboardImpl.disable();
	}
	toggleEnabled(e) {
		return e === void 0 && (e = !this.isEnabled()), e ? this.enable() : this.disable(), this;
	}
	bindKey(e, t, n) {
		return this.keyboardImpl.on(e, t, n), this;
	}
	trigger(e, t) {
		return this.keyboardImpl.trigger(e, t), this;
	}
	clear() {
		return this.keyboardImpl.clear(), this;
	}
	unbindKey(e, t) {
		return this.keyboardImpl.off(e, t), this;
	}
	dispose() {
		this.keyboardImpl.dispose();
	}
};
f([q()], hw.prototype, "dispose", null);
// node_modules/@antv/x6/es/plugin/selection/selection.js
var gw = class e extends yb {
	get graph() {
		return this.options.graph;
	}
	get boxClassName() {
		return this.prefixClassName(vw.box);
	}
	get $boxes() {
		return md(this.container, this.boxClassName);
	}
	get handleOptions() {
		return this.options;
	}
	constructor(e) {
		super(), this.updateThrottleTimer = null, this.isDragging = !1, this.batchUpdating = !1, this.dragRafId = null, this.transformRafId = null, this.dragPendingOffset = null, this.containerLocalOffsetX = 0, this.containerLocalOffsetY = 0, this.containerOffsetX = 0, this.containerOffsetY = 0, this.draggingPreviewMode = "translate", this.translatingCache = null, this.movingRouterRestoreCache = null, this.movingRouterRestoreTimer = null, this.lastMovingTs = null, this.movingDegradeActivatedTs = null, this.options = e, this.options.model && (this.options.collection = this.options.model.collection), this.options.collection ? this.collection = this.options.collection : (this.collection = new jx([], { comparator: bw }), this.options.collection = this.collection), this.boxCount = 0, this.boxesUpdated = !1, this.createContainer(), this.startListening();
	}
	startListening() {
		let e = this.graph, t = this.collection;
		this.delegateEvents({
			[`mousedown .${this.boxClassName}`]: "onSelectionBoxMouseDown",
			[`touchstart .${this.boxClassName}`]: "onSelectionBoxMouseDown",
			[`mousedown .${this.prefixClassName(vw.inner)}`]: "onSelectionContainerMouseDown",
			[`touchstart .${this.prefixClassName(vw.inner)}`]: "onSelectionContainerMouseDown"
		}, !0), e.on("scale", this.onGraphTransformed, this), e.on("translate", this.onGraphTransformed, this), e.model.on("updated", this.onModelUpdated, this), t.on("added", this.onCellAdded, this), t.on("removed", this.onCellRemoved, this), t.on("reseted", this.onReseted, this), t.on("updated", this.onCollectionUpdated, this), t.on("node:change:position", this.onNodePositionChanged, this), t.on("cell:changed", this.onCellChanged, this);
	}
	stopListening() {
		let e = this.graph, t = this.collection;
		this.undelegateEvents(), e.off("scale", this.onGraphTransformed, this), e.off("translate", this.onGraphTransformed, this), this.transformRafId != null && (cancelAnimationFrame(this.transformRafId), this.transformRafId = null), this.updateThrottleTimer &&= (clearTimeout(this.updateThrottleTimer), null), e.model.off("updated", this.onModelUpdated, this), t.off("added", this.onCellAdded, this), t.off("removed", this.onCellRemoved, this), t.off("reseted", this.onReseted, this), t.off("updated", this.onCollectionUpdated, this), t.off("node:change:position", this.onNodePositionChanged, this), t.off("cell:changed", this.onCellChanged, this);
	}
	onRemove() {
		this.stopListening();
	}
	onGraphTransformed() {
		this.updateThrottleTimer &&= (clearTimeout(this.updateThrottleTimer), null), this.transformRafId ??= window.requestAnimationFrame(() => {
			this.transformRafId = null, !(this.collection.length <= 0) && (this.isDragging ? (this.repositionSelectionBoxesInPlace(), this.options.following ? this.resetContainerPosition() : this.syncContainerPosition()) : this.refreshSelectionBoxes());
		});
	}
	onCellChanged() {
		this.updateSelectionBoxes();
	}
	onNodePositionChanged({ node: e, options: t }) {
		let { showNodeSelectionBox: n, pointerEvents: r } = this.options, { ui: i, selection: a, translateBy: o, snapped: s } = t, c = (n !== !0 || r && this.getPointerEventsValue(r) === "none") && !this.translating && !a, l = i && o && e.id === o;
		if (c && (l || s)) {
			this.translating = !0;
			let n = e.position(), r = e.previous("position");
			if (r) {
				let i = n.x - r.x, a = n.y - r.y;
				(i !== 0 || a !== 0) && this.translateSelectedNodes(i, a, e, t);
			}
			this.translating = !1;
		}
	}
	onModelUpdated({ removed: e }) {
		e?.length && this.unselect(e);
	}
	isEmpty() {
		return this.length <= 0;
	}
	isSelected(e) {
		return this.collection.has(e);
	}
	get length() {
		return this.collection.length;
	}
	get cells() {
		return this.collection.toArray();
	}
	select(e, t = {}) {
		t.dryrun = !0;
		let n = this.filter(Array.isArray(e) ? e : [e]);
		return this.collection.add(n, t), this;
	}
	unselect(e, t = {}) {
		return t.dryrun = !0, this.collection.remove(Array.isArray(e) ? e : [e], t), this;
	}
	reset(e, t = {}) {
		if (e) {
			this.batchUpdating = !!t.batch;
			let n = this.cells, r = this.filter(Array.isArray(e) ? e : [e]), i = {}, a = {};
			for (let e of n) i[e.id] = e;
			for (let e of r) a[e.id] = e;
			let o = [], s = [];
			return r.forEach((e) => {
				i[e.id] || o.push(e);
			}), n.forEach((e) => {
				a[e.id] || s.push(e);
			}), s.length && this.unselect(s, Object.assign(Object.assign({}, t), { ui: !0 })), o.length && this.select(o, Object.assign(Object.assign({}, t), { ui: !0 })), this.updateContainer(), this.batchUpdating = !1, this;
		}
		return this.clean(t);
	}
	clean(e = {}) {
		return this.length && this.unselect(this.cells, e), this.resetContainerPosition(), this.draggingPreviewMode = "translate", this;
	}
	setFilter(e) {
		this.options.filter = e;
	}
	setContent(e) {
		this.options.content = e;
	}
	startSelecting(e) {
		e = this.normalizeEvent(e), this.clean();
		let t, n, r = this.graph.container;
		if (e.offsetX != null && e.offsetY != null && r.contains(e.target)) t = e.offsetX, n = e.offsetY;
		else {
			let i = Ip(r), a = r.scrollLeft, o = r.scrollTop;
			t = e.clientX - i.left + window.pageXOffset + a, n = e.clientY - i.top + window.pageYOffset + o;
		}
		G(this.container, {
			top: n,
			left: t,
			width: 1,
			height: 1
		}), this.setEventData(e, {
			action: "selecting",
			clientX: e.clientX,
			clientY: e.clientY,
			offsetX: t,
			offsetY: n,
			scrollerX: 0,
			scrollerY: 0,
			moving: !1
		});
		let i = this.graph.snapToGrid(e.clientX, e.clientY);
		this.notifyBoxEvent("box:mousedown", e, i.x, i.y, []), this.delegateDocumentEvents(yw, e.data);
	}
	filter(e) {
		let t = this.options.filter;
		return e.filter((e) => Array.isArray(t) ? t.some((t) => typeof t == "string" ? e.shape === t : e.id === t.id) : typeof t != "function" || R(t, this.graph, e));
	}
	stopSelecting(e) {
		this.isDragging = !1, this.boxesUpdated = !1, this.updateThrottleTimer &&= (clearTimeout(this.updateThrottleTimer), null);
		let t = this.graph;
		switch (this.getEventData(e).action) {
			case "selecting": {
				let n = t.snapToGrid(e.clientX, e.clientY), r = this.getSelectingRect(), i = this.getCellsInArea(r);
				this.reset(i, { batch: !0 }), this.hideRubberband(), this.notifyBoxEvent("box:mouseup", e, n.x, n.y, i);
				break;
			}
			case "translating": {
				let n = t.snapToGrid(e.clientX, e.clientY);
				if (this.dragPendingOffset) {
					let e = this.dragPendingOffset;
					this.dragPendingOffset = null, this.applyDraggingPreview(e);
				}
				this.dragRafId != null && (cancelAnimationFrame(this.dragRafId), this.dragRafId = null), this.resetContainerPosition(), this.movingRouterRestoreTimer &&= (clearTimeout(this.movingRouterRestoreTimer), null), this.restoreMovingRouters(), this.graph.model.stopBatch("move-selection"), this.translatingCache = null, this.draggingPreviewMode = "translate", this.notifyBoxEvent("box:mouseup", e, n.x, n.y), this.repositionSelectionBoxesInPlace();
				break;
			}
			default: this.clean();
		}
		this.undelegateDocumentEvents();
	}
	onMouseUp(e) {
		let t = this.normalizeEvent(e);
		this.getEventData(t) && this.stopSelecting(e);
	}
	onSelectionBoxMouseDown(e) {
		this.handleSelectionMouseDown(e, !0);
	}
	onSelectionContainerMouseDown(e) {
		this.handleSelectionMouseDown(e, !1);
	}
	handleSelectionMouseDown(e, t) {
		var n;
		e.stopPropagation(), (n = e.preventDefault) == null || n.call(e);
		let r = this.normalizeEvent(e), i = this.graph.snapToGrid(r.clientX, r.clientY);
		if (!t && Jm(r, this.options.multipleSelectionModifiers)) {
			let e = this.graph.findViewsFromPoint(i.x, i.y).find((e) => e.isNodeView());
			if (e) {
				let t = e.cell;
				this.isSelected(t) ? this.unselect(t, { ui: !0 }) : this.options.multiple === !1 ? this.reset(t, { ui: !0 }) : this.select(t, { ui: !0 });
			}
			return;
		}
		this.options.movable && this.startTranslating(r);
		let a = t ? this.getCellViewFromElem(r.target) : null;
		if (!a && (a = this.graph.findViewsFromPoint(i.x, i.y).filter((e) => this.isSelected(e.cell))[0] || null, !a)) {
			let e = this.collection.first();
			e && (a = this.graph.renderer.findViewByCell(e));
		}
		a && (this.setEventData(r, { activeView: a }), t && this.notifyBoxEvent("box:mousedown", r, i.x, i.y), this.delegateDocumentEvents(yw, r.data));
	}
	startTranslating(e) {
		this.graph.model.startBatch("move-selection");
		let t = this.graph.snapToGrid(e.clientX, e.clientY);
		this.setEventData(e, {
			action: "translating",
			clientX: t.x,
			clientY: t.y,
			originX: t.x,
			originY: t.y
		}), this.prepareTranslatingCache(), this.draggingPreviewMode = this.getDraggingPreviewMode();
	}
	getRestrictArea() {
		let e = this.graph.options.translating.restrict, t = typeof e == "function" ? R(e, this.graph, null) : e;
		return typeof t == "number" ? this.graph.transform.getGraphArea().inflate(t) : t === !0 ? this.graph.transform.getGraphArea() : t || null;
	}
	prepareTranslatingCache() {
		let e = this.collection.toArray().filter((e) => e.isNode()), t = new Set(e.map((e) => e.id)), n = this.collection.toArray().filter((e) => e.isEdge()), r = /* @__PURE__ */ new Set(), i = (e) => e.getVertices().length > 0 || !e.getSourceCellId() || !e.getTargetCellId();
		this.graph.model.getEdges().forEach((e) => {
			let n = e.getSourceCellId(), a = e.getTargetCellId();
			(n != null && t.has(n) || a != null && t.has(a)) && i(e) && r.add(e);
		}), n.forEach((e) => {
			i(e) && r.add(e);
		}), this.translatingCache = {
			selectedNodes: e,
			nodeIdSet: t,
			edgesToTranslate: Array.from(r)
		};
	}
	applyMovingRouterFallback() {
		if (this.movingRouterRestoreCache) return;
		let e = this.translatingCache?.selectedNodes;
		if (!e || e.length < 2) return;
		let t = this.options.movingRouterFallback;
		if (!t || !Zy.exist(t)) return;
		let n = { name: t }, r = {}, i = /* @__PURE__ */ new Set();
		e.forEach((e) => {
			this.graph.model.getConnectedEdges(e).forEach((e) => {
				if (i.has(e.id)) return;
				i.add(e.id);
				let t = e.getRouter();
				r[e.id] = t, e.setRouter(n, { silent: !0 });
			});
		}), this.movingRouterRestoreCache = r, this.movingDegradeActivatedTs = Date.now();
	}
	restoreMovingRouters() {
		let e = this.movingRouterRestoreCache;
		e && (Object.keys(e).forEach((t) => {
			let n = this.graph.getCellById(t);
			if (!n || !n.isEdge()) return;
			let r = e[t];
			r == null ? n.removeRouter({ silent: !0 }) : n.setRouter(r, { silent: !0 });
			let i = this.graph.findViewByCell(n);
			i && this.graph.renderer.requestViewUpdate(i, i.getFlag("update"), { async: !0 });
		}), this.movingRouterRestoreCache = null);
	}
	scheduleMovingRouterRestoreThrottle() {
		this.movingRouterRestoreTimer &&= (clearTimeout(this.movingRouterRestoreTimer), null), this.movingRouterRestoreTimer = setTimeout(() => {
			let t = Date.now(), n = t - (this.lastMovingTs || 0), r = this.movingDegradeActivatedTs == null ? Infinity : t - this.movingDegradeActivatedTs;
			if (n < e.RESTORE_IDLE_TIME || r < e.RESTORE_HOLD_TIME) {
				let t = Math.max(e.RESTORE_IDLE_TIME - n, e.RESTORE_HOLD_TIME - r, e.MIN_RESTORE_WAIT_TIME);
				this.movingRouterRestoreTimer = setTimeout(() => {
					this.movingRouterRestoreTimer = null, this.restoreMovingRouters();
				}, t);
			} else this.movingRouterRestoreTimer = null, this.restoreMovingRouters();
		}, e.RESTORE_IDLE_TIME);
	}
	getSelectionOffset(e, t) {
		let n = e.x - t.clientX, r = e.y - t.clientY, i = this.getRestrictArea();
		if (i) {
			let a = this.collection.toArray(), o = Y.getCellsBBox(a, { deep: !0 }) || B.create(), s = i.x - o.x, c = i.y - o.y, l = i.x + i.width - (o.x + o.width), u = i.y + i.height - (o.y + o.height);
			if (n < s && (n = s), r < c && (r = c), l < n && (n = l), u < r && (r = u), !this.options.following) {
				let i = e.x - t.originX, a = e.y - t.originY;
				n = i <= s || i >= l ? 0 : n, r = a <= c || a >= u ? 0 : r;
			}
		}
		return {
			dx: n,
			dy: r
		};
	}
	updateSelectedNodesPosition(e) {
		(e.dx !== 0 || e.dy !== 0) && (this.dragPendingOffset ? (this.dragPendingOffset.dx += e.dx, this.dragPendingOffset.dy += e.dy) : this.dragPendingOffset = {
			dx: e.dx,
			dy: e.dy
		}, this.dragRafId ??= requestAnimationFrame(() => {
			let e = this.dragPendingOffset || {
				dx: 0,
				dy: 0
			};
			this.dragPendingOffset = null, this.dragRafId = null, this.applyDraggingPreview(e), this.boxesUpdated = !0, this.isDragging = !0;
		}));
	}
	autoScrollGraph(e, t) {
		let n = this.graph.getPlugin("scroller");
		return n?.autoScroll ? n.autoScroll(e, t) : {
			scrollerX: 0,
			scrollerY: 0
		};
	}
	adjustSelection(e) {
		let t = this.normalizeEvent(e), n = this.getEventData(t);
		switch (n.action) {
			case "selecting": {
				let r = n;
				r.moving !== !0 && (dd(this.container, this.graph.container), this.showRubberband(), r.moving = !0);
				let { scrollerX: i, scrollerY: a } = this.autoScrollGraph(t.clientX, t.clientY);
				r.scrollerX += i, r.scrollerY += a;
				let o = t.clientX - r.clientX + r.scrollerX, s = t.clientY - r.clientY + r.scrollerY;
				G(this.container, {
					left: o < 0 ? r.offsetX + o : r.offsetX,
					top: s < 0 ? r.offsetY + s : r.offsetY,
					width: Math.abs(o),
					height: Math.abs(s)
				});
				let c = this.graph.snapToGrid(t.clientX, t.clientY), l = this.getSelectingRect(), u = this.getCellsInArea(l);
				this.notifyBoxEvent("box:mousemove", e, c.x, c.y, u);
				break;
			}
			case "translating": {
				this.isDragging = !0;
				let r = this.graph.snapToGrid(t.clientX, t.clientY), i = n, a = this.getSelectionOffset(r, i);
				this.options.following ? this.updateSelectedNodesPosition(a) : this.updateContainerPosition(a), a.dx && (i.clientX = r.x), a.dy && (i.clientY = r.y), (a.dx !== 0 || a.dy !== 0) && (this.lastMovingTs = Date.now(), this.applyMovingRouterFallback(), this.scheduleMovingRouterRestoreThrottle()), this.notifyBoxEvent("box:mousemove", e, r.x, r.y);
				break;
			}
		}
		this.boxesUpdated = !1;
	}
	translateSelectedNodes(e, t, n, r) {
		let i = {}, a = [];
		if (n && (i[n.id] = !0), this.collection.toArray().forEach((e) => {
			e.getDescendants({ deep: !0 }).forEach((e) => {
				i[e.id] = !0;
			});
		}), r?.translateBy) {
			let e = this.graph.getCellById(r.translateBy);
			e && (i[e.id] = !0, e.getDescendants({ deep: !0 }).forEach((e) => {
				i[e.id] = !0;
			}), a.push(e));
		}
		let o = Object.assign(Object.assign({}, r), {
			selection: this.cid,
			exclude: a
		}), s = (this.translatingCache?.selectedNodes ?? this.collection.toArray().filter((e) => e.isNode())).filter((e) => !i[e.id]);
		s.forEach((n) => {
			n.translate(e, t, o);
		});
		let c = this.translatingCache?.edgesToTranslate, l = /* @__PURE__ */ new Set();
		if (c) c.forEach((e) => {
			l.add(e);
		});
		else {
			let e = new Set(s.map((e) => e.id));
			this.graph.model.getEdges().forEach((t) => {
				let n = t.getSourceCellId(), r = t.getTargetCellId(), i = n ? e.has(n) : !1, a = r ? e.has(r) : !1;
				(i || a) && (t.getVertices().length > 0 || !n || !r) && l.add(t);
			});
		}
		this.collection.toArray().filter((e) => e.isEdge() && !i[e.id]).forEach((e) => {
			let t = e.getVertices().length > 0, n = !e.getSourceCellId() || !e.getTargetCellId();
			(t || n) && l.add(e);
		}), l.forEach((n) => {
			n.translate(e, t, o);
		});
	}
	getCellViewsInArea(e) {
		let t = this.graph, n = { strict: this.options.strict }, r = [];
		return this.options.rubberNode && (r = r.concat(t.model.getNodesInArea(e, n).map((e) => t.renderer.findViewByCell(e)).filter((e) => e != null))), this.options.rubberEdge && (r = r.concat(t.model.getEdgesInArea(e, n).map((e) => t.renderer.findViewByCell(e)).filter((e) => e != null))), r;
	}
	getCellsInArea(e) {
		return this.filter(this.getCellViewsInArea(e).map((e) => e.cell));
	}
	getSelectingRect() {
		let e = Lp(this.container), t = Rp(this.container), n = Ip(this.container), r = this.graph.pageToLocal(n.left, n.top), i = this.graph.transform.getScale();
		return e /= i.sx, t /= i.sy, new B(r.x, r.y, e, t);
	}
	getBoxEventCells(e, t = null) {
		let n = [], r = [], i = t;
		return (e ?? this.cells).forEach((e) => {
			let t = this.graph.getCellById(e.id);
			t && (i ||= this.graph.renderer.findViewByCell(t), t.isNode() ? n.push(t) : t.isEdge() && r.push(t));
		}), {
			view: i,
			cell: i?.cell ?? null,
			nodes: n,
			edges: r
		};
	}
	notifyBoxEvent(e, t, n, r, i) {
		let a = this.getEventData(t)?.activeView ?? null, { view: o, cell: s, nodes: c, edges: l } = this.getBoxEventCells(i, a);
		this.trigger(e, {
			e: t,
			view: o,
			x: n,
			y: r,
			cell: s,
			nodes: c,
			edges: l
		});
	}
	getSelectedClassName(e) {
		return this.prefixClassName(`${e.isNode() ? "node" : "edge"}-selected`);
	}
	addCellSelectedClassName(e) {
		let t = this.graph.renderer.findViewByCell(e);
		t && t.addClass(this.getSelectedClassName(e));
	}
	removeCellUnSelectedClassName(e) {
		let t = this.graph.renderer.findViewByCell(e);
		t && t.removeClass(this.getSelectedClassName(e));
	}
	destroySelectionBox(e) {
		this.removeCellUnSelectedClassName(e), this.canShowSelectionBox(e) && (ad(this.container.querySelector(`[data-cell-id="${e.id}"]`)), this.$boxes.length === 0 && this.hide(), this.boxCount = Math.max(0, this.boxCount - 1));
	}
	destroyAllSelectionBoxes(e) {
		e.forEach((e) => {
			this.removeCellUnSelectedClassName(e);
		}), this.hide(), ad(this.$boxes), this.boxCount = 0;
	}
	hide() {
		Vu(this.container, this.prefixClassName(vw.rubberband)), Vu(this.container, this.prefixClassName(vw.selected));
	}
	showRubberband() {
		U(this.container, this.prefixClassName(vw.rubberband));
	}
	hideRubberband() {
		Vu(this.container, this.prefixClassName(vw.rubberband));
	}
	showSelected() {
		bd(this.container, "style"), U(this.container, this.prefixClassName(vw.selected));
	}
	createContainer() {
		this.container = document.createElement("div"), U(this.container, this.prefixClassName(vw.root)), this.options.className && U(this.container, this.options.className), G(this.container, { willChange: "transform" }), this.selectionContainer = document.createElement("div"), U(this.selectionContainer, this.prefixClassName(vw.inner)), this.selectionContent = document.createElement("div"), U(this.selectionContent, this.prefixClassName(vw.content)), sd(this.selectionContainer, this.selectionContent), W(this.selectionContainer, "data-selection-length", this.collection.length), cd(this.container, this.selectionContainer);
	}
	getDraggingPreviewMode() {
		return this.options.following && this.collection.toArray().some((e) => e.isEdge() && this.canShowSelectionBox(e)) ? "geometry" : "translate";
	}
	applyDraggingPreview(e) {
		(e.dx !== 0 || e.dy !== 0) && (this.options.following && (this.translateSelectedNodes(e.dx, e.dy), this.draggingPreviewMode === "geometry") ? (this.repositionSelectionBoxesInPlace(), this.resetContainerPosition()) : this.updateContainerPosition(e));
	}
	resetContainerPosition() {
		this.containerLocalOffsetX = 0, this.containerLocalOffsetY = 0, this.containerOffsetX = 0, this.containerOffsetY = 0, G(this.container, "transform", "");
	}
	syncContainerPosition() {
		let e = this.graph.coord.localToGraphPoint(0, 0), t = this.graph.coord.localToGraphPoint(this.containerLocalOffsetX, this.containerLocalOffsetY);
		this.containerOffsetX = t.x - e.x, this.containerOffsetY = t.y - e.y, this.containerOffsetX === 0 && this.containerOffsetY === 0 ? G(this.container, "transform", "") : G(this.container, "transform", `translate3d(${this.containerOffsetX}px, ${this.containerOffsetY}px, 0)`);
	}
	updateContainerPosition(e) {
		(e.dx || e.dy) && (this.containerLocalOffsetX += e.dx, this.containerLocalOffsetY += e.dy, this.syncContainerPosition());
	}
	updateContainer() {
		let e = {
			x: Infinity,
			y: Infinity
		}, t = {
			x: 0,
			y: 0
		};
		this.collection.toArray().filter((e) => this.canShowSelectionBox(e)).forEach((n) => {
			let r = this.graph.renderer.findViewByCell(n);
			if (r) {
				let n = r.getBBox({ useCellGeometry: !0 });
				e.x = Math.min(e.x, n.x), e.y = Math.min(e.y, n.y), t.x = Math.max(t.x, n.x + n.width), t.y = Math.max(t.y, n.y + n.height);
			}
		}), G(this.selectionContainer, {
			position: "absolute",
			pointerEvents: this.options.movable ? "auto" : "none",
			cursor: this.options.movable ? "move" : "default",
			left: e.x,
			top: e.y,
			width: t.x - e.x,
			height: t.y - e.y
		}), W(this.selectionContainer, "data-selection-length", this.collection.length);
		let n = this.options.content;
		if (n) {
			if (typeof n == "function") {
				let e = R(n, this.graph, this, this.selectionContent);
				e && (this.selectionContent.innerHTML = e);
			} else this.selectionContent.innerHTML = n;
		}
		this.collection.length > 0 && !this.container.parentNode ? dd(this.container, this.graph.container) : this.collection.length <= 0 && this.container.parentNode && this.container.parentNode.removeChild(this.container);
	}
	canShowSelectionBox(e) {
		return e.isNode() && this.options.showNodeSelectionBox === !0 || e.isEdge() && this.options.showEdgeSelectionBox === !0;
	}
	getPointerEventsValue(e) {
		return typeof e == "string" ? e : e(this.cells);
	}
	createSelectionBox(e) {
		if (this.addCellSelectedClassName(e), this.canShowSelectionBox(e)) {
			let t = this.graph.renderer.findViewByCell(e);
			if (t) {
				let n = t.getBBox({ useCellGeometry: !0 }), r = this.boxClassName, i = document.createElement("div"), a = this.options.pointerEvents;
				U(i, r), U(i, `${r}-${e.isNode() ? "node" : "edge"}`), W(i, "data-cell-id", e.id), G(i, {
					position: "absolute",
					left: n.x,
					top: n.y,
					width: n.width,
					height: n.height,
					pointerEvents: a ? this.getPointerEventsValue(a) : "auto"
				}), dd(i, this.container), this.showSelected(), this.boxCount += 1;
			}
		}
	}
	updateSelectionBoxes() {
		if (this.collection.length > 0) {
			if (this.isDragging) return;
			this.updateThrottleTimer && clearTimeout(this.updateThrottleTimer), this.updateThrottleTimer = setTimeout(() => {
				this.refreshSelectionBoxes(), this.updateThrottleTimer = null;
			}, 16);
		}
	}
	refreshSelectionBoxes() {
		ad(this.$boxes), this.boxCount = 0, this.collection.toArray().forEach((e) => {
			this.createSelectionBox(e);
		}), this.updateContainer(), this.boxesUpdated = !0;
	}
	repositionSelectionBoxesInPlace() {
		let e = this.$boxes;
		if (e.length === 0) this.refreshSelectionBoxes();
		else {
			for (let t of e) {
				let e = t.getAttribute("data-cell-id");
				if (!e) continue;
				let n = this.collection.get(e);
				if (!n) continue;
				let r = this.graph.renderer.findViewByCell(n);
				if (!r) continue;
				let i = r.getBBox({ useCellGeometry: !0 });
				G(t, {
					left: i.x,
					top: i.y,
					width: i.width,
					height: i.height
				});
			}
			this.updateContainer(), this.boxesUpdated = !0;
		}
	}
	getCellViewFromElem(e) {
		let t = e.getAttribute("data-cell-id");
		if (t) {
			let e = this.collection.get(t);
			if (e) return this.graph.renderer.findViewByCell(e);
		}
		return null;
	}
	onCellRemoved({ cell: e }) {
		this.destroySelectionBox(e), this.batchUpdating || this.updateContainer();
	}
	onReseted({ previous: e, current: t }) {
		this.destroyAllSelectionBoxes(e), t.forEach((e) => {
			this.listenCellRemoveEvent(e), this.createSelectionBox(e);
		}), this.updateContainer();
	}
	onCellAdded({ cell: e }) {
		this.listenCellRemoveEvent(e), this.createSelectionBox(e), this.batchUpdating || this.updateContainer();
	}
	listenCellRemoveEvent(e) {
		e.off("removed", this.onCellRemoved, this), e.on("removed", this.onCellRemoved, this);
	}
	onCollectionUpdated({ added: e, removed: t, options: n }) {
		e.forEach((e) => {
			this.trigger("cell:selected", {
				cell: e,
				options: n
			}), e.isNode() ? this.trigger("node:selected", {
				cell: e,
				options: n,
				node: e
			}) : e.isEdge() && this.trigger("edge:selected", {
				cell: e,
				options: n,
				edge: e
			});
		}), t.forEach((e) => {
			this.trigger("cell:unselected", {
				cell: e,
				options: n
			}), e.isNode() ? this.trigger("node:unselected", {
				cell: e,
				options: n,
				node: e
			}) : e.isEdge() && this.trigger("edge:unselected", {
				cell: e,
				options: n,
				edge: e
			});
		});
		let r = {
			added: e,
			removed: t,
			options: n,
			selected: this.cells.filter((e) => !!this.graph.getCellById(e.id))
		};
		this.trigger("selection:changed", r);
	}
	dispose() {
		this.clean(), this.remove(), this.off();
	}
};
gw.RESTORE_IDLE_TIME = 100, gw.RESTORE_HOLD_TIME = 150, gw.MIN_RESTORE_WAIT_TIME = 50, f([q()], gw.prototype, "dispose", null);
var _w = "widget-selection", vw = {
	root: _w,
	inner: `${_w}-inner`,
	box: `${_w}-box`,
	content: `${_w}-content`,
	rubberband: `${_w}-rubberband`,
	selected: `${_w}-selected`
}, yw = {
	mousemove: "adjustSelection",
	touchmove: "adjustSelection",
	mouseup: "onMouseUp",
	touchend: "onMouseUp",
	touchcancel: "onMouseUp"
};
function bw(e) {
	return e.getAncestors().length;
}
// node_modules/@antv/x6/es/plugin/selection/style/raw.js
var xw = ".x6-widget-selection {\n  position: absolute;\n  top: 0;\n  left: 0;\n  display: none;\n  width: 0;\n  height: 0;\n  touch-action: none;\n}\n.x6-widget-selection-rubberband {\n  display: block;\n  overflow: visible;\n  opacity: 0.3;\n}\n.x6-widget-selection-selected {\n  display: block;\n}\n.x6-widget-selection-box {\n  cursor: move;\n}\n.x6-widget-selection-inner[data-selection-length='0'],\n.x6-widget-selection-inner[data-selection-length='1'] {\n  display: none;\n}\n.x6-widget-selection-content {\n  position: absolute;\n  top: 100%;\n  right: -20px;\n  left: -20px;\n  margin-top: 30px;\n  padding: 6px;\n  line-height: 14px;\n  text-align: center;\n  border-radius: 6px;\n}\n.x6-widget-selection-content:empty {\n  display: none;\n}\n.x6-widget-selection-rubberband {\n  background-color: #3498db;\n  border: 2px solid #2980b9;\n}\n.x6-widget-selection-box {\n  box-sizing: content-box !important;\n  margin-top: -4px;\n  margin-left: -4px;\n  padding-right: 4px;\n  padding-bottom: 4px;\n  border: 2px dashed #feb663;\n  box-shadow: 2px 2px 5px #d3d3d3;\n}\n.x6-widget-selection-inner {\n  box-sizing: content-box !important;\n  margin-top: -8px;\n  margin-left: -8px;\n  padding-right: 12px;\n  padding-bottom: 12px;\n  border: 2px solid #feb663;\n  box-shadow: 2px 2px 5px #d3d3d3;\n}\n.x6-widget-selection-content {\n  color: #fff;\n  font-size: 10px;\n  background-color: #6a6b8a;\n}\n";
X.prototype.isSelectionEnabled = function() {
	let e = this.getPlugin("selection");
	return e ? e.isEnabled() : !1;
}, X.prototype.enableSelection = function() {
	let e = this.getPlugin("selection");
	return e && e.enable(), this;
}, X.prototype.disableSelection = function() {
	let e = this.getPlugin("selection");
	return e && e.disable(), this;
}, X.prototype.toggleSelection = function(e) {
	let t = this.getPlugin("selection");
	return t && t.toggleEnabled(e), this;
}, X.prototype.isMultipleSelection = function() {
	let e = this.getPlugin("selection");
	return e ? e.isMultipleSelection() : !1;
}, X.prototype.enableMultipleSelection = function() {
	let e = this.getPlugin("selection");
	return e && e.enableMultipleSelection(), this;
}, X.prototype.disableMultipleSelection = function() {
	let e = this.getPlugin("selection");
	return e && e.disableMultipleSelection(), this;
}, X.prototype.toggleMultipleSelection = function(e) {
	let t = this.getPlugin("selection");
	return t && t.toggleMultipleSelection(e), this;
}, X.prototype.isSelectionMovable = function() {
	let e = this.getPlugin("selection");
	return e ? e.isSelectionMovable() : !1;
}, X.prototype.enableSelectionMovable = function() {
	let e = this.getPlugin("selection");
	return e && e.enableSelectionMovable(), this;
}, X.prototype.disableSelectionMovable = function() {
	let e = this.getPlugin("selection");
	return e && e.disableSelectionMovable(), this;
}, X.prototype.toggleSelectionMovable = function(e) {
	let t = this.getPlugin("selection");
	return t && t.toggleSelectionMovable(e), this;
}, X.prototype.isRubberbandEnabled = function() {
	let e = this.getPlugin("selection");
	return e ? e.isRubberbandEnabled() : !1;
}, X.prototype.enableRubberband = function() {
	let e = this.getPlugin("selection");
	return e && e.enableRubberband(), this;
}, X.prototype.disableRubberband = function() {
	let e = this.getPlugin("selection");
	return e && e.disableRubberband(), this;
}, X.prototype.toggleRubberband = function(e) {
	let t = this.getPlugin("selection");
	return t && t.toggleRubberband(e), this;
}, X.prototype.isStrictRubberband = function() {
	let e = this.getPlugin("selection");
	return e ? e.isStrictRubberband() : !1;
}, X.prototype.enableStrictRubberband = function() {
	let e = this.getPlugin("selection");
	return e && e.enableStrictRubberband(), this;
}, X.prototype.disableStrictRubberband = function() {
	let e = this.getPlugin("selection");
	return e && e.disableStrictRubberband(), this;
}, X.prototype.toggleStrictRubberband = function(e) {
	let t = this.getPlugin("selection");
	return t && t.toggleStrictRubberband(e), this;
}, X.prototype.setRubberbandModifiers = function(e) {
	let t = this.getPlugin("selection");
	return t && t.setRubberbandModifiers(e), this;
}, X.prototype.setSelectionFilter = function(e) {
	let t = this.getPlugin("selection");
	return t && t.setSelectionFilter(e), this;
}, X.prototype.setSelectionDisplayContent = function(e) {
	let t = this.getPlugin("selection");
	return t && t.setSelectionDisplayContent(e), this;
}, X.prototype.isSelectionEmpty = function() {
	let e = this.getPlugin("selection");
	return !e || e.isEmpty();
}, X.prototype.cleanSelection = function(e) {
	let t = this.getPlugin("selection");
	return t && t.clean(e), this;
}, X.prototype.resetSelection = function(e, t) {
	let n = this.getPlugin("selection");
	return n && n.reset(e, t), this;
}, X.prototype.getSelectedCells = function() {
	let e = this.getPlugin("selection");
	return e ? e.getSelectedCells() : [];
}, X.prototype.getSelectedCellCount = function() {
	let e = this.getPlugin("selection");
	return e ? e.getSelectedCellCount() : 0;
}, X.prototype.isSelected = function(e) {
	let t = this.getPlugin("selection");
	return t ? t.isSelected(e) : !1;
}, X.prototype.select = function(e, t) {
	let n = this.getPlugin("selection");
	return n && n.select(e, t), this;
}, X.prototype.unselect = function(e, t) {
	let n = this.getPlugin("selection");
	return n && n.unselect(e, t), this;
};
// node_modules/@antv/x6/es/plugin/selection/index.js
var Sw = {
	rubberband: !1,
	rubberNode: !0,
	rubberEdge: !1,
	pointerEvents: "auto",
	multiple: !0,
	multipleSelectionModifiers: ["ctrl", "meta"],
	movable: !0,
	strict: !1,
	selectCellOnMoved: !1,
	selectNodeOnMoved: !1,
	selectEdgeOnMoved: !1,
	following: !0,
	content: null,
	eventTypes: ["leftMouseDown", "mouseWheelDown"]
}, Cw = class extends Wm {
	get rubberbandDisabled() {
		return this.options.enabled !== !0 || this.options.rubberband !== !0;
	}
	get disabled() {
		return this.options.enabled !== !0;
	}
	get length() {
		return this.selectionImpl.length;
	}
	get cells() {
		return this.selectionImpl.cells;
	}
	constructor(e = {}) {
		super(), this.name = "selection", this.movedMap = /* @__PURE__ */ new WeakMap(), this.unselectMap = /* @__PURE__ */ new WeakMap(), this.options = Object.assign(Object.assign({ enabled: !0 }, Sw), e), Vl(this.name, xw);
	}
	init(e) {
		this.graph = e, this.selectionImpl = new gw(Object.assign(Object.assign({}, this.options), { graph: e })), this.resolvePanningSelectionConflict(), this.setup(), this.startListening();
	}
	isEnabled() {
		return !this.disabled;
	}
	enable() {
		this.disabled && (this.options.enabled = !0);
	}
	disable() {
		this.disabled || (this.options.enabled = !1);
	}
	toggleEnabled(e) {
		return e == null ? this.isEnabled() ? this.disable() : this.enable() : e !== this.isEnabled() && (e ? this.enable() : this.disable()), this;
	}
	isMultipleSelection() {
		return this.isMultiple();
	}
	enableMultipleSelection() {
		return this.enableMultiple(), this;
	}
	disableMultipleSelection() {
		return this.disableMultiple(), this;
	}
	toggleMultipleSelection(e) {
		return e == null ? this.isMultipleSelection() ? this.disableMultipleSelection() : this.enableMultipleSelection() : e !== this.isMultipleSelection() && (e ? this.enableMultipleSelection() : this.disableMultipleSelection()), this;
	}
	isSelectionMovable() {
		return this.options.movable !== !1;
	}
	enableSelectionMovable() {
		return this.selectionImpl.options.movable = !0, this;
	}
	disableSelectionMovable() {
		return this.selectionImpl.options.movable = !1, this;
	}
	toggleSelectionMovable(e) {
		return e == null ? this.isSelectionMovable() ? this.disableSelectionMovable() : this.enableSelectionMovable() : e !== this.isSelectionMovable() && (e ? this.enableSelectionMovable() : this.disableSelectionMovable()), this;
	}
	isRubberbandEnabled() {
		return !this.rubberbandDisabled;
	}
	enableRubberband() {
		return this.rubberbandDisabled && (this.options.rubberband = !0), this;
	}
	disableRubberband() {
		return this.rubberbandDisabled || (this.options.rubberband = !1), this;
	}
	toggleRubberband(e) {
		return e == null ? this.isRubberbandEnabled() ? this.disableRubberband() : this.enableRubberband() : e !== this.isRubberbandEnabled() && (e ? this.enableRubberband() : this.disableRubberband()), this;
	}
	isStrictRubberband() {
		return this.selectionImpl.options.strict === !0;
	}
	enableStrictRubberband() {
		return this.selectionImpl.options.strict = !0, this;
	}
	disableStrictRubberband() {
		return this.selectionImpl.options.strict = !1, this;
	}
	toggleStrictRubberband(e) {
		return e == null ? this.isStrictRubberband() ? this.disableStrictRubberband() : this.enableStrictRubberband() : e !== this.isStrictRubberband() && (e ? this.enableStrictRubberband() : this.disableStrictRubberband()), this;
	}
	setRubberbandModifiers(e) {
		this.setModifiers(e);
	}
	setSelectionFilter(e) {
		return this.setFilter(e), this;
	}
	setSelectionDisplayContent(e) {
		return this.setContent(e), this;
	}
	isEmpty() {
		return this.length <= 0;
	}
	clean(e = {}) {
		return this.selectionImpl.clean(e), this;
	}
	reset(e, t = {}) {
		return this.selectionImpl.reset(e ? this.getCells(e) : [], t), this;
	}
	getSelectedCells() {
		return this.cells;
	}
	getSelectedCellCount() {
		return this.length;
	}
	isSelected(e) {
		return this.selectionImpl.isSelected(e);
	}
	select(e, t = {}) {
		let n = this.getCells(e);
		return n.length && (this.isMultiple() ? this.selectionImpl.select(n, t) : this.reset(n.slice(0, 1), t)), this;
	}
	unselect(e, t = {}) {
		return this.selectionImpl.unselect(this.getCells(e), t), this;
	}
	setup() {
		this.selectionImpl.on("*", (e, t) => {
			this.trigger(e, t), this.graph.trigger(e, t);
		});
	}
	startListening() {
		this.graph.on("blank:mousedown", this.onBlankMouseDown, this), this.graph.on("blank:click", this.onBlankClick, this), this.graph.on("cell:mousemove", this.onCellMouseMove, this), this.graph.on("cell:mouseup", this.onCellMouseUp, this), this.selectionImpl.on("box:mousedown", this.onBoxMouseDown, this);
	}
	stopListening() {
		this.graph.off("blank:mousedown", this.onBlankMouseDown, this), this.graph.off("blank:click", this.onBlankClick, this), this.graph.off("cell:mousemove", this.onCellMouseMove, this), this.graph.off("cell:mouseup", this.onCellMouseUp, this), this.selectionImpl.off("box:mousedown", this.onBoxMouseDown, this);
	}
	onBlankMouseDown({ e }) {
		if (!this.allowBlankMouseDown(e)) return;
		let t = this.graph.panning.allowPanning(e, !0), n = this.graph.getPlugin("scroller"), r = n && n.allowPanning(e, !0);
		(this.allowRubberband(e, !0) || this.allowRubberband(e) && !r && !t) && this.startRubberband(e);
	}
	allowBlankMouseDown(e) {
		let t = this.options.eventTypes;
		return typeof e.type == "string" && e.type.startsWith("touch") || e.pointerType === "touch" ? t?.includes("leftMouseDown") : t?.includes("leftMouseDown") && e.button === 0 || t?.includes("mouseWheelDown") && e.button === 1;
	}
	onBlankClick() {
		this.clean();
	}
	allowRubberband(e, t) {
		let n = e ?? {
			altKey: !1,
			ctrlKey: !1,
			metaKey: !1,
			shiftKey: !1
		};
		return !this.rubberbandDisabled && Jm(n, this.options.modifiers, t);
	}
	resolvePanningSelectionConflict() {
		if (this.options.enabled !== !0 || this.options.rubberband !== !0) return;
		let e = this.graph.options.panning;
		e && e.enabled !== !1 && (() => {
			let t = this.options.eventTypes ?? [], n = e.eventTypes ?? [], r = new Set(n), i = t.some((e) => r.has(e)), a = qm(e.modifiers, this.options.modifiers);
			return i && a;
		})() && this.graph.panning.disablePanning();
	}
	allowMultipleSelection(e) {
		return this.isMultiple() && Jm(e, this.options.multipleSelectionModifiers);
	}
	onCellMouseMove({ cell: e }) {
		this.movedMap.set(e, !0);
	}
	onCellMouseUp({ e, cell: t }) {
		let n = this.options, r = this.disabled;
		!r && this.movedMap.has(t) && (r = n.selectCellOnMoved === !1, r ||= n.selectNodeOnMoved === !1 && t.isNode(), r ||= n.selectEdgeOnMoved === !1 && t.isEdge()), r || (this.allowMultipleSelection(e) ? this.unselectMap.has(t) ? this.unselectMap.delete(t) : this.isSelected(t) ? this.unselect(t) : this.select(t) : this.reset(t)), this.movedMap.delete(t);
	}
	onBoxMouseDown({ e, cell: t }) {
		!this.disabled && t && this.allowMultipleSelection(e) && (this.unselect(t), this.unselectMap.set(t, !0));
	}
	getCells(e) {
		return (Array.isArray(e) ? e : [e]).map((e) => typeof e == "string" ? this.graph.getCellById(e) : e).filter((e) => e != null);
	}
	startRubberband(e) {
		return this.rubberbandDisabled || this.selectionImpl.startSelecting(e), this;
	}
	isMultiple() {
		return this.options.multiple !== !1;
	}
	enableMultiple() {
		return this.options.multiple = !0, this;
	}
	disableMultiple() {
		return this.options.multiple = !1, this;
	}
	setModifiers(e) {
		return this.options.modifiers = e, this;
	}
	setContent(e) {
		return this.selectionImpl.setContent(e), this;
	}
	setFilter(e) {
		return this.selectionImpl.setFilter(e), this;
	}
	dispose() {
		this.stopListening(), this.off(), this.selectionImpl.dispose(), Hl(this.name);
	}
};
f([q()], Cw.prototype, "dispose", null);
// node_modules/@antv/x6/es/plugin/minimap/style/raw.js
var ww = ".x6-widget-minimap {\n  position: relative;\n  display: table-cell;\n  box-sizing: border-box;\n  overflow: hidden;\n  text-align: center;\n  vertical-align: middle;\n  background-color: #fff;\n  user-select: none;\n}\n.x6-widget-minimap .x6-graph {\n  display: inline-block;\n  box-shadow: 0 0 4px 0 #eee;\n  cursor: pointer;\n}\n.x6-widget-minimap .x6-graph > svg {\n  pointer-events: none;\n  shape-rendering: optimizespeed;\n}\n.x6-widget-minimap .x6-graph .x6-node * {\n  /* stylelint-disable-next-line */\n  vector-effect: initial;\n}\n.x6-widget-minimap-viewport {\n  position: absolute;\n  box-sizing: content-box !important;\n  margin: -2px 0 0 -2px;\n  border: 2px solid #31d0c6;\n  cursor: move;\n}\n.x6-widget-minimap-viewport-zoom {\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  box-sizing: border-box;\n  width: 12px;\n  height: 12px;\n  margin: 0 -6px -6px 0;\n  background-color: #fff;\n  border: 2px solid #31d0c6;\n  border-radius: 50%;\n  cursor: nwse-resize;\n}\n", Tw = {
	width: 300,
	height: 200,
	padding: 10,
	scalable: !0,
	minScale: .01,
	maxScale: 16,
	graphOptions: {},
	createGraph: (e) => new X(e)
}, Ew = {
	mousemove: "doAction",
	touchmove: "doAction",
	mouseup: "stopAction",
	touchend: "stopAction"
}, Dw = "widget-minimap", Ow = `${Dw}-viewport`, kw = `${Ow}-zoom`, Aw = class extends yb {
	get scroller() {
		return this.graph.getPlugin("scroller");
	}
	get graphContainer() {
		return this.scroller ? this.scroller.container : this.graph.container;
	}
	constructor(e) {
		super(), this.name = "minimap", this.options = Object.assign(Object.assign({}, Tw), e), Vl(this.name, ww);
	}
	init(e) {
		this.graph = e, this.updateViewport = vc(this.updateViewport.bind(this), 0), this.container = document.createElement("div"), U(this.container, this.prefixClassName(Dw));
		let t = document.createElement("div");
		this.container.appendChild(t), this.viewport = document.createElement("div"), U(this.viewport, this.prefixClassName(Ow)), this.options.scalable && (this.zoomHandle = document.createElement("div"), U(this.zoomHandle, this.prefixClassName(kw)), dd(this.zoomHandle, this.viewport)), sd(this.container, this.viewport), G(this.container, {
			width: this.options.width,
			height: this.options.height,
			padding: this.options.padding
		}), this.options.container && this.options.container.appendChild(this.container), this.sourceGraph = this.graph;
		let n = Object.assign(Object.assign({}, this.options.graphOptions), {
			container: t,
			model: this.sourceGraph.model,
			interacting: !1,
			grid: !1,
			background: !1,
			embedding: !1,
			panning: !1
		});
		this.targetGraph = this.options.createGraph ? this.options.createGraph(n) : new X(n), this.updatePaper(this.sourceGraph.options.width, this.sourceGraph.options.height), this.startListening();
	}
	startListening() {
		this.scroller ? K.on(this.graphContainer, `scroll${this.getEventNamespace()}`, this.updateViewport) : (this.sourceGraph.on("translate", this.onTransform, this), this.sourceGraph.on("scale", this.onTransform, this), this.sourceGraph.on("model:updated", this.onModelUpdated, this)), this.sourceGraph.on("resize", this.updatePaper, this), this.delegateEvents({
			mousedown: "startAction",
			touchstart: "startAction",
			[`mousedown .${this.prefixClassName("graph")}`]: "scrollTo",
			[`touchstart .${this.prefixClassName("graph")}`]: "scrollTo"
		});
	}
	stopListening() {
		this.scroller ? K.off(this.graphContainer, this.getEventNamespace()) : (this.sourceGraph.off("translate", this.onTransform, this), this.sourceGraph.off("scale", this.onTransform, this), this.sourceGraph.off("model:updated", this.onModelUpdated, this)), this.sourceGraph.off("resize", this.updatePaper, this), this.undelegateEvents();
	}
	onRemove() {
		this.stopListening(), this.targetGraph.dispose(!1);
	}
	onTransform(e) {
		(e.ui || this.targetGraphTransforming || !this.scroller) && this.updateViewport();
	}
	onModelUpdated() {
		this.targetGraph.zoomToFit();
	}
	updatePaper(e, t) {
		let n, r;
		typeof e == "object" ? (n = e.width, r = e.height) : (n = e, r = t);
		let i = this.sourceGraph.options, a = this.sourceGraph.transform.getScale(), o = this.options.width - 2 * this.options.padding, s = this.options.height - 2 * this.options.padding;
		n /= a.sx, r /= a.sy, this.ratio = Math.min(o / n, s / r);
		let c = this.ratio, l = i.x * c / a.sx, u = i.y * c / a.sy;
		return n *= c, r *= c, this.targetGraph.resize(n, r), this.targetGraph.translate(l, u), this.scroller ? this.targetGraph.scale(c, c) : this.targetGraph.zoomToFit(), this.updateViewport(), this;
	}
	updateViewport() {
		let e = this.sourceGraph.transform.getScale(), t = this.targetGraph.transform.getScale(), n = this.scroller ? this.scroller.clientToLocalPoint(0, 0) : this.graph.graphToLocal(0, 0), r = zp(this.targetGraph.container), i = this.targetGraph.translate();
		i.ty = i.ty || 0, this.geometry = {
			top: r.top + n.y * t.sy + i.ty,
			left: r.left + n.x * t.sx + i.tx,
			width: this.graphContainer.clientWidth * t.sx / e.sx,
			height: this.graphContainer.clientHeight * t.sy / e.sy
		}, G(this.viewport, this.geometry);
	}
	startAction(e) {
		let t = this.normalizeEvent(e), n = t.target === this.zoomHandle ? "zooming" : "panning", { tx: r, ty: i } = this.sourceGraph.translate(), a = {
			action: n,
			clientX: t.clientX,
			clientY: t.clientY,
			scrollLeft: this.graphContainer.scrollLeft,
			scrollTop: this.graphContainer.scrollTop,
			zoom: this.sourceGraph.zoom(),
			scale: this.sourceGraph.transform.getScale(),
			geometry: this.geometry,
			translateX: r,
			translateY: i
		};
		this.targetGraphTransforming = !0, this.delegateDocumentEvents(Ew, a);
	}
	doAction(e) {
		let t = this.normalizeEvent(e), n = t.clientX, r = t.clientY, i = t.data;
		switch (i.action) {
			case "panning": {
				let e = this.sourceGraph.transform.getScale(), t = (n - i.clientX) * e.sx, a = (r - i.clientY) * e.sy;
				this.scroller ? (this.graphContainer.scrollLeft = i.scrollLeft + t / this.ratio, this.graphContainer.scrollTop = i.scrollTop + a / this.ratio) : this.sourceGraph.translate(i.translateX - t / this.ratio, i.translateY - a / this.ratio);
				break;
			}
			case "zooming": {
				let e = i.scale, t = i.geometry, r = 1 + (i.clientX - n) / t.width / e.sx;
				i.frameId && cancelAnimationFrame(i.frameId), i.frameId = requestAnimationFrame(() => {
					this.sourceGraph.zoom(r * i.zoom, {
						absolute: !0,
						minScale: this.options.minScale,
						maxScale: this.options.maxScale
					});
				});
				break;
			}
		}
	}
	stopAction() {
		this.undelegateDocumentEvents(), this.targetGraphTransforming = !1;
	}
	scrollTo(e) {
		let t = this.normalizeEvent(e), n, r, i = this.targetGraph.translate();
		if (i.ty = i.ty || 0, t.offsetX == null) {
			let e = Ip(this.targetGraph.container);
			n = t.pageX - e.left, r = t.pageY - e.top;
		} else n = t.offsetX, r = t.offsetY;
		let a = (n - i.tx) / this.ratio, o = (r - i.ty) / this.ratio;
		this.sourceGraph.centerPoint(a, o);
	}
	dispose() {
		this.remove(), Hl(this.name);
	}
};
f([q()], Aw.prototype, "dispose", null);
// node_modules/@antv/x6/es/plugin/scroller/scroller.js
var jw = "graph-scroller", Mw = `${jw}-paged`, Nw = `${jw}-content`, Pw = `${jw}-background`, Fw = "transition-in-progress", Iw = "transitionend.graph-scroller-transition", Lw = {
	padding() {
		let e = this.getClientSize(), t = Math.max(this.options.minVisibleWidth || 0, 1) || 1, n = Math.max(this.options.minVisibleHeight || 0, 1) || 1, r = Math.max(e.width - t, 0), i = Math.max(e.height - n, 0);
		return {
			left: r,
			top: i,
			right: r,
			bottom: i
		};
	},
	minVisibleWidth: 50,
	minVisibleHeight: 50,
	pageVisible: !1,
	pageBreak: !1,
	autoResize: !0
};
function Rw(e) {
	let t = Qc({}, Lw, e);
	t.pageWidth ??= e.graph.options.width, t.pageHeight ??= e.graph.options.height;
	let n = e.graph.options;
	return n.background && t.enabled && t.background == null && (t.background = n.background, e.graph.background.clear()), t;
}
var zw = class extends yb {
	get graph() {
		return this.options.graph;
	}
	get model() {
		return this.graph.model;
	}
	constructor(e) {
		super(), this.padding = {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0
		}, this.options = Rw(e), this.onUpdate = vc(this.onUpdate, 200);
		let t = this.graph.transform.getScale();
		this.sx = t.sx, this.sy = t.sy;
		let n = this.options.width || this.graph.options.width, r = this.options.height || this.graph.options.height;
		this.container = document.createElement("div"), U(this.container, this.prefixClassName(jw)), G(this.container, {
			width: n,
			height: r
		}), this.options.pageVisible && U(this.container, this.prefixClassName(Mw)), this.options.className && U(this.container, this.options.className);
		let i = this.graph.container;
		i.parentNode && ld(i, this.container), this.content = document.createElement("div"), U(this.content, this.prefixClassName(Nw)), G(this.content, {
			width: this.graph.options.width,
			height: this.graph.options.height
		}), this.background = document.createElement("div"), U(this.background, this.prefixClassName(Pw)), sd(this.content, this.background), this.options.pageVisible || sd(this.content, this.graph.view.grid), sd(this.content, i), dd(this.content, this.container), this.startListening(), this.options.pageVisible || this.graph.grid.update(), this.backgroundManager = new Bw(this), this.options.autoResize || this.update();
	}
	startListening() {
		let e = this.graph, t = this.model;
		e.on("scale", this.onScale, this), e.on("resize", this.onResize, this), e.on("before:print", this.storeScrollPosition, this), e.on("before:export", this.storeScrollPosition, this), e.on("after:print", this.restoreScrollPosition, this), e.on("after:export", this.restoreScrollPosition, this), t.on("reseted", this.onUpdate, this), t.on("cell:added", this.onUpdate, this), t.on("cell:removed", this.onUpdate, this), t.on("cell:changed", this.onUpdate, this), this.delegateBackgroundEvents();
	}
	stopListening() {
		let e = this.graph, t = this.model;
		e.off("scale", this.onScale, this), e.off("resize", this.onResize, this), e.off("beforeprint", this.storeScrollPosition, this), e.off("beforeexport", this.storeScrollPosition, this), e.off("afterprint", this.restoreScrollPosition, this), e.off("afterexport", this.restoreScrollPosition, this), t.off("reseted", this.onUpdate, this), t.off("cell:added", this.onUpdate, this), t.off("cell:removed", this.onUpdate, this), t.off("cell:changed", this.onUpdate, this), this.undelegateBackgroundEvents();
	}
	enableAutoResize() {
		this.options.autoResize = !0;
	}
	disableAutoResize() {
		this.options.autoResize = !1;
	}
	onUpdate() {
		this.options.autoResize && this.update();
	}
	delegateBackgroundEvents(e) {
		let t = e || _S.events;
		this.delegatedHandlers = Object.keys(t).reduce((e, n) => {
			let r = t[n];
			if (n.indexOf(" ") === -1) {
				if (typeof r == "function") e[n] = r;
				else {
					let t = this.graph.view[r];
					typeof t == "function" && (t = t.bind(this.graph.view), e[n] = t);
				}
			}
			return e;
		}, {}), this.onBackgroundEvent = this.onBackgroundEvent.bind(this), Object.keys(this.delegatedHandlers).forEach((e) => {
			this.delegateEvent(e, { guarded: !1 }, this.onBackgroundEvent);
		});
	}
	undelegateBackgroundEvents() {
		Object.keys(this.delegatedHandlers).forEach((e) => {
			this.undelegateEvent(e, this.onBackgroundEvent);
		});
	}
	onBackgroundEvent(e) {
		let t = !1, n = e.target;
		if (this.options.pageVisible) t = this.options.background ? this.background === n : this.content === n;
		else {
			let e = this.graph.view;
			t = e.background === n || e.grid === n;
		}
		if (t) {
			let t = this.delegatedHandlers[e.type];
			typeof t == "function" && t.apply(this.graph, arguments);
		}
	}
	onResize() {
		this.cachedCenterPoint && (this.centerPoint(this.cachedCenterPoint.x, this.cachedCenterPoint.y), this.updatePageBreak());
	}
	onScale({ sx: e, sy: t, ox: n, oy: r }) {
		this.updateScale(e, t), (n || r) && (this.centerPoint(n, r), this.updatePageBreak()), typeof this.options.autoResizeOptions == "function" && this.update();
	}
	storeScrollPosition() {
		this.cachedScrollLeft = this.container.scrollLeft, this.cachedScrollTop = this.container.scrollTop;
	}
	restoreScrollPosition() {
		this.container.scrollLeft = this.cachedScrollLeft, this.container.scrollTop = this.cachedScrollTop, this.cachedScrollLeft = null, this.cachedScrollTop = null;
	}
	storeClientSize() {
		this.cachedClientSize = {
			width: this.container.clientWidth,
			height: this.container.clientHeight
		};
	}
	restoreClientSize() {
		this.cachedClientSize = null;
	}
	beforeManipulation() {
		(Ml || Nl) && G(this.container, { visibility: "hidden" });
	}
	afterManipulation() {
		(Ml || Nl) && G(this.container, { visibility: "visible" });
	}
	updatePageSize(e, t) {
		e != null && (this.options.pageWidth = e), t != null && (this.options.pageHeight = t), this.updatePageBreak();
	}
	updatePageBreak() {
		if (this.pageBreak && this.pageBreak.parentNode && this.pageBreak.parentNode.removeChild(this.pageBreak), this.pageBreak = null, this.options.pageVisible && this.options.pageBreak) {
			let e = this.graph.options.width, t = this.graph.options.height, n = this.options.pageWidth * this.sx, r = this.options.pageHeight * this.sy;
			if (n === 0 || r === 0) return;
			if (e > n || t > r) {
				let i = !1, a = document.createElement("div");
				for (let t = 1, r = Math.floor(e / n); t < r; t += 1) {
					let e = document.createElement("div");
					U(e, this.prefixClassName("graph-pagebreak-vertical")), G(e, { left: t * n }), dd(e, a), i = !0;
				}
				for (let e = 1, n = Math.floor(t / r); e < n; e += 1) {
					let t = document.createElement("div");
					U(t, this.prefixClassName("graph-pagebreak-horizontal")), G(t, { top: e * r }), dd(t, a), i = !0;
				}
				i && (U(a, this.prefixClassName("graph-pagebreak")), ud(this.graph.view.grid, a), this.pageBreak = a);
			}
		}
	}
	update() {
		let e = this.getClientSize();
		this.cachedCenterPoint = this.clientToLocalPoint(e.width / 2, e.height / 2);
		let t = this.options.autoResizeOptions;
		typeof t == "function" && (t = R(t, this, this));
		let n = Object.assign({
			gridWidth: this.options.pageWidth,
			gridHeight: this.options.pageHeight,
			allowNewOrigin: "negative"
		}, t);
		this.graph.fitToContent(this.getFitToContentOptions(n));
	}
	getFitToContentOptions(e) {
		let t = this.sx, n = this.sy;
		return e.gridWidth && (e.gridWidth *= t), e.gridHeight && (e.gridHeight *= n), e.minWidth && (e.minWidth *= t), e.minHeight && (e.minHeight *= n), typeof e.padding == "object" ? e.padding = {
			left: (e.padding.left || 0) * t,
			right: (e.padding.right || 0) * t,
			top: (e.padding.top || 0) * n,
			bottom: (e.padding.bottom || 0) * n
		} : typeof e.padding == "number" && (e.padding *= t), this.options.autoResize || (e.contentArea = B.create()), e;
	}
	updateScale(e, t) {
		let n = this.graph.options, r = e / this.sx, i = t / this.sy;
		this.sx = e, this.sy = t, this.graph.translate(n.x * r, n.y * i), this.graph.transform.resize(n.width * r, n.height * i);
	}
	scrollbarPosition(e, t) {
		if (e == null && t == null) return {
			left: this.container.scrollLeft,
			top: this.container.scrollTop
		};
		let n = {};
		return typeof e == "number" && (n.scrollLeft = e), typeof t == "number" && (n.scrollTop = t), Yd(this.container, n), this;
	}
	scrollToPoint(e, t) {
		let n = this.getClientSize(), r = this.graph.matrix(), i = {};
		return typeof e == "number" && (i.scrollLeft = e - n.width / 2 + r.e + (this.padding.left || 0)), typeof t == "number" && (i.scrollTop = t - n.height / 2 + r.f + (this.padding.top || 0)), Yd(this.container, i), this;
	}
	scrollToContent() {
		let e = this.sx, t = this.sy, n = this.graph.getContentArea().getCenter();
		return this.scrollToPoint(n.x * e, n.y * t);
	}
	scrollToCell(e) {
		let t = this.sx, n = this.sy, r = e.getBBox().getCenter();
		return this.scrollToPoint(r.x * t, r.y * n);
	}
	center(e) {
		return this.centerPoint(e);
	}
	centerPoint(e, t, n) {
		let r = this.graph.matrix(), i = r.a, a = r.d, o = -r.e, s = -r.f, c = o + this.graph.options.width, l = s + this.graph.options.height, u;
		if (this.storeClientSize(), typeof e == "number" || typeof t == "number") {
			u = n;
			let r = this.getVisibleArea().getCenter();
			typeof e == "number" ? e *= i : e = r.x, typeof t == "number" ? t *= a : t = r.y;
		} else u = e, e = (o + c) / 2, t = (s + l) / 2;
		if (u && u.padding) return this.positionPoint({
			x: e,
			y: t
		}, "50%", "50%", u);
		let d = this.getPadding(), f = this.getClientSize(), p = f.width / 2, m = f.height / 2, h = p - d.left - e + o, g = p - d.right + e - c, _ = m - d.top - t + s, v = m - d.bottom + t - l;
		this.addPadding(Math.max(h, 0), Math.max(g, 0), Math.max(_, 0), Math.max(v, 0));
		let y = this.scrollToPoint(e, t);
		return this.restoreClientSize(), y;
	}
	centerContent(e) {
		return this.positionContent("center", e);
	}
	centerCell(e, t) {
		return this.positionCell(e, "center", t);
	}
	positionContent(e, t) {
		let n = this.graph.getContentArea(t);
		return this.positionRect(n, e, t);
	}
	positionCell(e, t, n) {
		let r = e.getBBox();
		return this.positionRect(r, t, n);
	}
	positionRect(e, t, n) {
		let r = B.create(e);
		switch (t) {
			case "center": return this.positionPoint(r.getCenter(), "50%", "50%", n);
			case "top": return this.positionPoint(r.getTopCenter(), "50%", 0, n);
			case "top-right": return this.positionPoint(r.getTopRight(), "100%", 0, n);
			case "right": return this.positionPoint(r.getRightMiddle(), "100%", "50%", n);
			case "bottom-right": return this.positionPoint(r.getBottomRight(), "100%", "100%", n);
			case "bottom": return this.positionPoint(r.getBottomCenter(), "50%", "100%", n);
			case "bottom-left": return this.positionPoint(r.getBottomLeft(), 0, "100%", n);
			case "left": return this.positionPoint(r.getLeftMiddle(), 0, "50%", n);
			case "top-left": return this.positionPoint(r.getTopLeft(), 0, 0, n);
			default: return this;
		}
	}
	positionPoint(e, t, n, r = {}) {
		let { padding: i } = r, a = d(r, ["padding"]), o = Dl(i), s = B.fromSize(this.getClientSize()), c = s.clone().moveAndExpand({
			x: o.left,
			y: o.top,
			width: -o.right - o.left,
			height: -o.top - o.bottom
		});
		t = El(t, Math.max(0, c.width)), t < 0 && (t = c.width + t), n = El(n, Math.max(0, c.height)), n < 0 && (n = c.height + n);
		let l = c.getTopLeft().translate(t, n), u = s.getCenter().diff(l), f = this.zoom(), p = u.scale(1 / f, 1 / f), m = z.create(e).translate(p);
		return this.centerPoint(m.x, m.y, a);
	}
	zoom(e, t) {
		if (e == null) return this.sx;
		t ||= {};
		let n, r, i = this.getClientSize(), a = this.clientToLocalPoint(i.width / 2, i.height / 2), o = e, s = e;
		if (t.absolute || (o += this.sx, s += this.sy), t.scaleGrid && (o = Math.round(o / t.scaleGrid) * t.scaleGrid, s = Math.round(s / t.scaleGrid) * t.scaleGrid), t.maxScale && (o = Math.min(t.maxScale, o), s = Math.min(t.maxScale, s)), t.minScale && (o = Math.max(t.minScale, o), s = Math.max(t.minScale, s)), o = this.graph.transform.clampScale(o), s = this.graph.transform.clampScale(s), t.center) {
			let e = o / this.sx, i = s / this.sy;
			n = t.center.x - (t.center.x - a.x) / e, r = t.center.y - (t.center.y - a.y) / i;
		} else n = a.x, r = a.y;
		return this.beforeManipulation(), this.graph.transform.scale(o, s, n, r, !1), this.centerPoint(n, r), this.afterManipulation(), this;
	}
	zoomToRect(e, t = {}) {
		let n = B.create(e), r = this.graph;
		if (t.contentArea = n, t.viewportArea == null) {
			let e = this.container.getBoundingClientRect();
			t.viewportArea = {
				x: r.options.x,
				y: r.options.y,
				width: e.width,
				height: e.height
			};
		}
		this.beforeManipulation(), r.transform.scaleContentToFitImpl(t, !1);
		let i = n.getCenter();
		return this.centerPoint(i.x, i.y), this.afterManipulation(), this;
	}
	zoomToFit(e = {}) {
		return this.zoomToRect(this.graph.getContentArea(e), e);
	}
	transitionToPoint(e, t, n) {
		typeof e == "object" ? (n = t, t = e.y, e = e.x) : t = t, n ??= {};
		let r, i, a = this.sx, o = Math.max(n.scale || a, 1e-6), s = this.getClientSize(), c = new z(e, t), l = this.clientToLocalPoint(s.width / 2, s.height / 2);
		if (a === o) {
			let e = l.diff(c).scale(a, a).round();
			r = `translate(${e.x}px,${e.y}px)`;
		} else {
			let e = o / (a - o) * c.distance(l), t = l.clone().move(c, e), n = this.localToBackgroundPoint(t).round();
			r = `scale(${o / a})`, i = `${n.x}px ${n.y}px`;
		}
		let u = n.onTransitionEnd;
		return U(this.container, Fw), K.off(this.content, Iw), K.on(this.content, Iw, (n) => {
			this.syncTransition(o, {
				x: e,
				y: t
			}), typeof u == "function" && R(u, this, n.originalEvent);
		}), G(this.content, {
			transform: r,
			transformOrigin: i,
			transition: "transform",
			transitionDuration: n.duration || "1s",
			transitionDelay: n.delay,
			transitionTimingFunction: n.timing
		}), this;
	}
	syncTransition(e, t) {
		return this.beforeManipulation(), this.graph.scale(e), this.removeTransition(), this.centerPoint(t.x, t.y), this.afterManipulation(), this;
	}
	removeTransition() {
		return Vu(this.container, Fw), K.off(this.content, Iw), G(this.content, {
			transform: "",
			transformOrigin: "",
			transition: "",
			transitionDuration: "",
			transitionDelay: "",
			transitionTimingFunction: ""
		}), this;
	}
	transitionToRect(e, t = {}) {
		let n = B.create(e), r = t.maxScale || Infinity, i = t.minScale || Number.MIN_VALUE, a = t.scaleGrid || null, o = t.visibility || 1, s = t.center ? z.create(t.center) : n.getCenter(), c = this.getClientSize(), l = c.width * o, u = c.height * o, d = new B(s.x - l / 2, s.y - u / 2, l, u).getMaxUniformScaleToFit(n, s);
		return d = Math.min(d, r), a && (d = Math.floor(d / a) * a), d = Math.max(i, d), this.transitionToPoint(s, Object.assign({ scale: d }, t));
	}
	startPanning(e) {
		let t = this.normalizeEvent(e);
		this.clientX = t.clientX, this.clientY = t.clientY, this.trigger("pan:start", { e: t }), K.on(document.body, {
			"mousemove.panning touchmove.panning": this.pan.bind(this),
			"mouseup.panning touchend.panning": this.stopPanning.bind(this),
			"mouseleave.panning": this.stopPanning.bind(this)
		}), K.on(window, "mouseup.panning", this.stopPanning.bind(this));
	}
	pan(e) {
		let t = this.normalizeEvent(e), n = t.clientX - this.clientX, r = t.clientY - this.clientY;
		this.container.scrollTop -= r, this.container.scrollLeft -= n, this.clientX = t.clientX, this.clientY = t.clientY, this.trigger("panning", { e: t });
	}
	stopPanning(e) {
		K.off(document.body, ".panning"), K.off(window, ".panning"), this.trigger("pan:stop", { e });
	}
	clientToLocalPoint(e, t) {
		let n = typeof e == "object" ? e.x : e, r = typeof e == "object" ? e.y : t, i = this.graph.matrix();
		return n += this.container.scrollLeft - this.padding.left - i.e, r += this.container.scrollTop - this.padding.top - i.f, new z(n / i.a, r / i.d);
	}
	localToBackgroundPoint(e, t) {
		let n = typeof e == "object" ? z.create(e) : new z(e, t), r = this.graph.matrix(), i = this.padding;
		return Bp(n, r).translate(i.left, i.top);
	}
	resize(e, t) {
		let n = e ?? this.container.offsetWidth, r = t ?? this.container.offsetHeight;
		typeof n == "number" && (n = Math.round(n)), typeof r == "number" && (r = Math.round(r)), this.options.width = n, this.options.height = r, G(this.container, {
			width: n,
			height: r
		}), this.update();
	}
	getClientSize() {
		return this.cachedClientSize ? this.cachedClientSize : {
			width: this.container.clientWidth,
			height: this.container.clientHeight
		};
	}
	autoScroll(e, t) {
		let n = this.container, r = n.getBoundingClientRect(), i = 0, a = 0;
		return e <= r.left + 10 && (i = -10), t <= r.top + 10 && (a = -10), e >= r.right - 10 && (i = 10), t >= r.bottom - 10 && (a = 10), i !== 0 && (n.scrollLeft += i), a !== 0 && (n.scrollTop += a), {
			scrollerX: i,
			scrollerY: a
		};
	}
	addPadding(e, t, n, r) {
		let i = this.getPadding();
		this.padding = {
			left: Math.round(i.left + (e || 0)),
			top: Math.round(i.top + (n || 0)),
			bottom: Math.round(i.bottom + (r || 0)),
			right: Math.round(i.right + (t || 0))
		}, i = this.padding, G(this.content, {
			width: i.left + this.graph.options.width + i.right,
			height: i.top + this.graph.options.height + i.bottom
		});
		let a = this.graph.container;
		return a.style.left = `${this.padding.left}px`, a.style.top = `${this.padding.top}px`, this;
	}
	getPadding() {
		let e = this.options.padding;
		return Dl(typeof e == "function" ? R(e, this, this) : e);
	}
	getVisibleArea() {
		let e = this.graph.matrix(), t = this.getClientSize(), n = Hp({
			x: this.container.scrollLeft || 0,
			y: this.container.scrollTop || 0,
			width: t.width,
			height: t.height
		}, e.inverse());
		return n.x -= (this.padding.left || 0) / this.sx, n.y -= (this.padding.top || 0) / this.sy, n;
	}
	isCellVisible(e, t = {}) {
		let n = e.getBBox(), r = this.getVisibleArea();
		return t.strict ? r.containsRect(n) : r.isIntersectWithRect(n);
	}
	isPointVisible(e) {
		return this.getVisibleArea().containsPoint(e);
	}
	lock() {
		return G(this.container, { overflow: "hidden" }), this;
	}
	unlock() {
		return G(this.container, { overflow: "scroll" }), this;
	}
	onRemove() {
		this.stopListening();
	}
	dispose() {
		ld(this.container, this.graph.container), this.remove();
	}
};
f([q()], zw.prototype, "dispose", null);
var Bw = class extends tS {
	get elem() {
		return this.scroller.background;
	}
	constructor(e) {
		super(e.graph), this.scroller = e, e.options.background && this.draw(e.options.background);
	}
	init() {
		this.graph.on("scale", this.update, this), this.graph.on("translate", this.update, this);
	}
	updateBackgroundOptions(e) {
		this.scroller.options.background = e;
	}
}, Vw = ".x6-graph-scroller {\n  position: relative;\n  box-sizing: border-box;\n  overflow: scroll;\n  outline: none;\n}\n.x6-graph-scroller-content {\n  position: relative;\n}\n.x6-graph-scroller-background {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n}\n.x6-graph-scroller .x6-graph {\n  position: absolute;\n  display: inline-block;\n  margin: 0;\n  box-shadow: none;\n}\n.x6-graph-scroller .x6-graph > svg {\n  display: block;\n}\n.x6-graph-scroller.x6-graph-scroller-paged .x6-graph {\n  box-shadow: 0 0 4px 0 #eee;\n}\n.x6-graph-scroller.x6-graph-scroller-pannable[data-panning='false'] {\n  cursor: grab;\n}\n.x6-graph-scroller.x6-graph-scroller-pannable[data-panning='true'] {\n  cursor: grabbing;\n  user-select: none;\n}\n.x6-graph-pagebreak {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n}\n.x6-graph-pagebreak-vertical {\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  box-sizing: border-box;\n  width: 1px;\n  border-left: 1px dashed #bdbdbd;\n}\n.x6-graph-pagebreak-horizontal {\n  position: absolute;\n  right: 0;\n  left: 0;\n  box-sizing: border-box;\n  height: 1px;\n  border-top: 1px dashed #bdbdbd;\n}\n";
X.prototype.lockScroller = function() {
	let e = this.getPlugin("scroller");
	return e && e.lockScroller(), this;
}, X.prototype.unlockScroller = function() {
	let e = this.getPlugin("scroller");
	return e && e.unlockScroller(), this;
}, X.prototype.updateScroller = function() {
	let e = this.getPlugin("scroller");
	return e && e.updateScroller(), this;
}, X.prototype.getScrollbarPosition = function() {
	let e = this.getPlugin("scroller");
	return e ? e.getScrollbarPosition() : {
		left: 0,
		top: 0
	};
}, X.prototype.setScrollbarPosition = function(e, t) {
	let n = this.getPlugin("scroller");
	return n && n.setScrollbarPosition(e, t), this;
};
// node_modules/@antv/x6/es/plugin/scroller/index.js
var Hw = class extends Wm {
	get pannable() {
		return this.options ? typeof this.options.pannable == "object" ? this.options.pannable.enabled : !!this.options.pannable : !1;
	}
	get container() {
		return this.scrollerImpl.container;
	}
	constructor(e = {}) {
		super(), this.name = "scroller", this.options = e, Vl(this.name, Vw);
	}
	init(e) {
		this.graph = e;
		let t = Rw(Object.assign(Object.assign({ enabled: !0 }, this.options), { graph: e }));
		this.options = t, this.scrollerImpl = new zw(t), this.setup(), this.autoDisableGraphPanning(), this.startListening(), this.updateClassName(), this.scrollerImpl.center();
	}
	resize(e, t) {
		this.scrollerImpl.resize(e, t);
	}
	resizePage(e, t) {
		this.scrollerImpl.updatePageSize(e, t);
	}
	zoom(e, t) {
		return e === void 0 ? this.scrollerImpl.zoom() : (this.scrollerImpl.zoom(e, t), this);
	}
	zoomTo(e, t = {}) {
		return this.scrollerImpl.zoom(e, Object.assign(Object.assign({}, t), { absolute: !0 })), this;
	}
	zoomToRect(e, t = {}) {
		return this.scrollerImpl.zoomToRect(e, t), this;
	}
	zoomToFit(e = {}) {
		return this.scrollerImpl.zoomToFit(e), this;
	}
	center(e) {
		return this.centerPoint(e);
	}
	centerPoint(e, t, n) {
		return this.scrollerImpl.centerPoint(e, t, n), this;
	}
	centerContent(e) {
		return this.scrollerImpl.centerContent(e), this;
	}
	centerCell(e, t) {
		return this.scrollerImpl.centerCell(e, t), this;
	}
	positionPoint(e, t, n, r = {}) {
		return this.scrollerImpl.positionPoint(e, t, n, r), this;
	}
	positionRect(e, t, n) {
		return this.scrollerImpl.positionRect(e, t, n), this;
	}
	positionCell(e, t, n) {
		return this.scrollerImpl.positionCell(e, t, n), this;
	}
	positionContent(e, t) {
		return this.scrollerImpl.positionContent(e, t), this;
	}
	drawBackground(e, t) {
		return this.graph.options.background != null && t || this.scrollerImpl.backgroundManager.draw(e), this;
	}
	clearBackground(e) {
		return this.graph.options.background != null && e || this.scrollerImpl.backgroundManager.clear(), this;
	}
	isPannable() {
		return this.pannable;
	}
	enablePanning() {
		this.pannable || (this.options.pannable = !0, this.updateClassName());
	}
	disablePanning() {
		this.pannable && (this.options.pannable = !1, this.updateClassName());
	}
	togglePanning(e) {
		return e == null ? this.isPannable() ? this.disablePanning() : this.enablePanning() : e !== this.isPannable() && (e ? this.enablePanning() : this.disablePanning()), this;
	}
	lockScroller() {
		return this.scrollerImpl.lock(), this;
	}
	unlockScroller() {
		return this.scrollerImpl.unlock(), this;
	}
	updateScroller() {
		return this.scrollerImpl.update(), this;
	}
	getScrollbarPosition() {
		return this.scrollerImpl.scrollbarPosition();
	}
	setScrollbarPosition(e, t) {
		return this.scrollerImpl.scrollbarPosition(e, t), this;
	}
	scrollToPoint(e, t) {
		return this.scrollerImpl.scrollToPoint(e, t), this;
	}
	scrollToContent() {
		return this.scrollerImpl.scrollToContent(), this;
	}
	scrollToCell(e) {
		return this.scrollerImpl.scrollToCell(e), this;
	}
	transitionToPoint(e, t, n) {
		return this.scrollerImpl.transitionToPoint(e, t, n), this;
	}
	transitionToRect(e, t = {}) {
		return this.scrollerImpl.transitionToRect(e, t), this;
	}
	enableAutoResize() {
		this.scrollerImpl.enableAutoResize();
	}
	disableAutoResize() {
		this.scrollerImpl.disableAutoResize();
	}
	autoScroll(e, t) {
		return this.scrollerImpl.autoScroll(e, t);
	}
	clientToLocalPoint(e, t) {
		return this.scrollerImpl.clientToLocalPoint(e, t);
	}
	getVisibleArea() {
		return this.scrollerImpl.getVisibleArea();
	}
	isCellVisible(e, t = {}) {
		return this.scrollerImpl.isCellVisible(e, t);
	}
	isPointVisible(e) {
		return this.scrollerImpl.isPointVisible(e);
	}
	setup() {
		this.scrollerImpl.on("*", (e, t) => {
			this.trigger(e, t);
		});
	}
	startListening() {
		let e = [], t = this.options.pannable;
		e = typeof t == "object" ? t.eventTypes || [] : ["leftMouseDown"], e.includes("leftMouseDown") && (this.graph.on("blank:mousedown", this.preparePanning, this), this.graph.on("node:unhandled:mousedown", this.preparePanning, this), this.graph.on("edge:unhandled:mousedown", this.preparePanning, this)), e.includes("rightMouseDown") && (this.onRightMouseDown = this.onRightMouseDown.bind(this), K.on(this.scrollerImpl.container, "mousedown", this.onRightMouseDown));
	}
	stopListening() {
		let e = [], t = this.options.pannable;
		e = typeof t == "object" ? t.eventTypes || [] : ["leftMouseDown"], e.includes("leftMouseDown") && (this.graph.off("blank:mousedown", this.preparePanning, this), this.graph.off("node:unhandled:mousedown", this.preparePanning, this), this.graph.off("edge:unhandled:mousedown", this.preparePanning, this)), e.includes("rightMouseDown") && K.off(this.scrollerImpl.container, "mousedown", this.onRightMouseDown);
	}
	onRightMouseDown(e) {
		e.button === 2 && this.allowPanning(e, !0) && (this.updateClassName(!0), this.scrollerImpl.startPanning(e), this.scrollerImpl.once("pan:stop", () => this.updateClassName(!1)));
	}
	preparePanning({ e }) {
		let t = this.allowPanning(e, !0), n = this.graph.getPlugin("selection"), r = n && n.allowRubberband(e, !0);
		(t || this.allowPanning(e) && !r) && (this.updateClassName(!0), this.scrollerImpl.startPanning(e), this.scrollerImpl.once("pan:stop", () => this.updateClassName(!1)));
	}
	allowPanning(e, t) {
		return this.pannable && Jm(e, this.options.modifiers, t);
	}
	updateClassName(e) {
		let t = this.scrollerImpl.container, n = J.prefix("graph-scroller-pannable");
		this.pannable ? (U(t, n), t.dataset.panning = (!!e).toString()) : Vu(t, n);
	}
	autoDisableGraphPanning() {
		let e = this.graph?.panning;
		e?.pannable && (e.disablePanning(), console.warn("Detected Scroller plugin; Graph panning has been disabled by default to avoid conflicts."));
	}
	dispose() {
		this.scrollerImpl.dispose(), this.stopListening(), this.off(), Hl(this.name);
	}
};
f([q()], Hw.prototype, "dispose", null);
// node_modules/@antv/x6/es/plugin/stencil/grid.js
function Uw(e, t) {
	return e.reduce((e, n) => Math.max(n?.getSize()[t], e), 0);
}
function Ww(e, t, n) {
	let r = [];
	for (let i = n * t, a = i + n; i < a; i += 1) e[i] && r.push(e[i]);
	return r;
}
function Gw(e, t, n) {
	let r = [];
	for (let i = t, a = e.length; i < a; i += n) e[i] && r.push(e[i]);
	return r;
}
function Kw(e, t) {
	return e.reduce((e, t, n) => (e.push(e[n] + t), e), [t || 0]);
}
function qw(e, t = {}) {
	let n = Nx.isModel(e) ? e : new Nx().resetCells(e, {
		sort: !1,
		dryrun: !0
	}), r = n.getNodes(), i = t.columns || 1, a = Math.ceil(r.length / i), o = t.dx || 0, s = t.dy || 0, c = t.center !== !1, l = t.resizeToFit === !0, u = t.marginX || 0, d = t.marginY || 0, f = [], p = t.columnWidth;
	if (p === "compact") for (let e = 0; e < i; e += 1) {
		let t = Gw(r, e, i);
		f.push(Uw(t, "width") + o);
	}
	else {
		(p == null || p === "auto") && (p = Uw(r, "width") + o);
		for (let e = 0; e < i; e += 1) f.push(p);
	}
	let m = Kw(f, u), h = [], g = t.rowHeight;
	if (g === "compact") for (let e = 0; e < a; e += 1) {
		let t = Ww(r, e, i);
		h.push(Uw(t, "height") + s);
	}
	else {
		(g == null || g === "auto") && (g = Uw(r, "height") + s);
		for (let e = 0; e < a; e += 1) h.push(g);
	}
	let _ = Kw(h, d);
	n.startBatch("layout"), r.forEach((e, n) => {
		let r = n % i, a = Math.floor(n / i), u = f[r], d = h[a], p = 0, g = 0, v = e.getSize();
		if (l) {
			let n = u - 2 * o, r = d - 2 * s, i = v.height * (v.width ? n / v.width : 1), a = v.width * (v.height ? r / v.height : 1);
			d < i ? n = a : r = i, v = {
				width: n,
				height: r
			}, e.setSize(v, t);
		}
		c && (p = (u - v.width) / 2, g = (d - v.height) / 2), e.position(m[r] + o + p, _[a] + s + g, t);
	}), n.stopBatch("layout");
}
// node_modules/@antv/x6/es/plugin/stencil/style/raw.js
var Jw = ".x6-widget-dnd {\n  position: absolute;\n  top: -10000px;\n  left: -10000px;\n  z-index: 999999;\n  display: none;\n  cursor: move;\n  opacity: 0.7;\n  pointer-events: 'cursor';\n}\n.x6-widget-dnd.dragging {\n  display: inline-block;\n}\n.x6-widget-dnd.dragging * {\n  pointer-events: none !important;\n}\n.x6-widget-dnd .x6-graph {\n  background: transparent;\n  box-shadow: none;\n}\n.x6-widget-stencil {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n}\n.x6-widget-stencil::after {\n  position: absolute;\n  top: 0;\n  display: block;\n  width: 100%;\n  height: 20px;\n  padding: 8px 0;\n  line-height: 20px;\n  text-align: center;\n  opacity: 0;\n  transition: top 0.1s linear, opacity 0.1s linear;\n  content: ' ';\n  pointer-events: none;\n}\n.x6-widget-stencil-content {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  height: auto;\n  overflow-x: hidden;\n  overflow-y: auto;\n}\n.x6-widget-stencil .x6-node [magnet]:not([magnet='passive']) {\n  pointer-events: none;\n}\n.x6-widget-stencil-group {\n  padding: 0;\n  padding-bottom: 8px;\n  overflow: hidden;\n  user-select: none;\n}\n.x6-widget-stencil-group.collapsed {\n  height: auto;\n  padding-bottom: 0;\n}\n.x6-widget-stencil-group-title {\n  position: relative;\n  margin-top: 0;\n  margin-bottom: 0;\n  padding: 4px;\n  cursor: pointer;\n}\n.x6-widget-stencil-title,\n.x6-widget-stencil-group > .x6-widget-stencil-group-title {\n  overflow: hidden;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n  user-select: none;\n}\n.x6-widget-stencil .unmatched {\n  opacity: 0.3;\n}\n.x6-widget-stencil .x6-node.unmatched {\n  display: none;\n}\n.x6-widget-stencil-group.unmatched {\n  display: none;\n}\n.x6-widget-stencil-search-text {\n  position: relative;\n  z-index: 1;\n  box-sizing: border-box;\n  width: 100%;\n  height: 30px;\n  max-height: 30px;\n  line-height: 30px;\n  outline: 0;\n}\n.x6-widget-stencil.not-found::after {\n  opacity: 1;\n  content: attr(data-not-found-text);\n}\n.x6-widget-stencil.not-found.searchable::after {\n  top: 30px;\n}\n.x6-widget-stencil.not-found.searchable.collapsable::after {\n  top: 50px;\n}\n.x6-widget-stencil {\n  color: #333;\n  background: #f5f5f5;\n}\n.x6-widget-stencil-content {\n  position: absolute;\n  top: 32px;\n}\n.x6-widget-stencil.searchable > .x6-widget-stencil-content {\n  top: 80px;\n}\n.x6-widget-stencil.not-found::after {\n  position: absolute;\n}\n.x6-widget-stencil.not-found.searchable.collapsable::after {\n  top: 80px;\n}\n.x6-widget-stencil.not-found.searchable::after {\n  top: 60px;\n}\n.x6-widget-stencil-group {\n  height: auto;\n  margin-bottom: 1px;\n  padding: 0;\n  transition: none;\n}\n  .x6-widget-stencil-group .x6-graph {\n    background: transparent;\n    box-shadow: none;\n  }\n\n  .x6-widget-stencil .x6-node.x6-node-immovable {\n    cursor: move;\n  }\n.x6-widget-stencil-group.collapsed {\n  height: auto;\n  max-height: 32px;\n}\n.x6-widget-stencil-title,\n.x6-widget-stencil-group > .x6-widget-stencil-group-title {\n  position: relative;\n  left: 0;\n  box-sizing: border-box;\n  width: 100%;\n  height: 32px;\n  padding: 0 5px 0 8px;\n  color: #666;\n  font-weight: 700;\n  font-size: 12px;\n  line-height: 32px;\n  cursor: default;\n  transition: all 0.3;\n}\n.x6-widget-stencil-title:hover,\n.x6-widget-stencil-group > .x6-widget-stencil-group-title:hover {\n  color: #444;\n}\n.x6-widget-stencil-title {\n  background: #e9e9e9;\n}\n.x6-widget-stencil-group > .x6-widget-stencil-group-title {\n  background: #ededed;\n}\n.x6-widget-stencil.collapsable > .x6-widget-stencil-title,\n.x6-widget-stencil-group.collapsable > .x6-widget-stencil-group-title {\n  padding-left: 32px;\n  cursor: pointer;\n}\n.x6-widget-stencil.collapsable > .x6-widget-stencil-title::before,\n.x6-widget-stencil-group.collapsable > .x6-widget-stencil-group-title::before {\n  position: absolute;\n  top: 6px;\n  left: 8px;\n  display: block;\n  width: 18px;\n  height: 18px;\n  margin: 0;\n  padding: 0;\n  background-color: transparent;\n  background-repeat: no-repeat;\n  background-position: 0 0;\n  border: none;\n  content: ' ';\n}\n.x6-widget-stencil.collapsable > .x6-widget-stencil-title::before,\n.x6-widget-stencil-group.collapsable > .x6-widget-stencil-group-title::before {\n  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzAwMCIgZmlsbC1ydWxlPSJub256ZXJvIj48cGF0aCBkPSJNOS4zNzUuNUM0LjY4Ny41Ljg3NSA0LjMxMy44NzUgOWMwIDQuNjg4IDMuODEyIDguNSA4LjUgOC41IDQuNjg3IDAgOC41LTMuODEyIDguNS04LjUgMC00LjY4Ny0zLjgxMy04LjUtOC41LTguNXptMCAxNS44ODZDNS4zMDMgMTYuMzg2IDEuOTkgMTMuMDcyIDEuOTkgOXMzLjMxMi03LjM4NSA3LjM4NS03LjM4NVMxNi43NiA0LjkyOCAxNi43NiA5YzAgNC4wNzItMy4zMTMgNy4zODYtNy4zODUgNy4zODZ6Ii8+PHBhdGggZD0iTTEyLjc1MyA4LjQ0M0g1Ljk5N2EuNTU4LjU1OCAwIDAwMCAxLjExNmg2Ljc1NmEuNTU4LjU1OCAwIDAwMC0xLjExNnoiLz48L2c+PC9zdmc+');\n  opacity: 0.4;\n  transition: all 0.3s;\n}\n.x6-widget-stencil.collapsable > .x6-widget-stencil-title:hover::before,\n.x6-widget-stencil-group.collapsable > .x6-widget-stencil-group-title:hover::before {\n  opacity: 0.6;\n}\n.x6-widget-stencil.collapsable.collapsed > .x6-widget-stencil-title::before,\n.x6-widget-stencil-group.collapsable.collapsed > .x6-widget-stencil-group-title::before {\n  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzAwMCIgZmlsbC1ydWxlPSJub256ZXJvIj48cGF0aCBkPSJNOS4zNzUuNUM0LjY4Ny41Ljg3NSA0LjMxMy44NzUgOWMwIDQuNjg4IDMuODEyIDguNSA4LjUgOC41IDQuNjg3IDAgOC41LTMuODEyIDguNS04LjUgMC00LjY4Ny0zLjgxMy04LjUtOC41LTguNXptMCAxNS44ODZDNS4zMDMgMTYuMzg2IDEuOTkgMTMuMDcyIDEuOTkgOXMzLjMxMi03LjM4NSA3LjM4NS03LjM4NVMxNi43NiA0LjkyOCAxNi43NiA5YzAgNC4wNzItMy4zMTMgNy4zODYtNy4zODUgNy4zODZ6Ii8+PHBhdGggZD0iTTEyLjc1MyA4LjQ0M0g1Ljk5N2EuNTU4LjU1OCAwIDAwMCAxLjExNmg2Ljc1NmEuNTU4LjU1OCAwIDAwMC0xLjExNnoiLz48cGF0aCBkPSJNOC44MTcgNS42MjN2Ni43NTZhLjU1OC41NTggMCAwMDEuMTE2IDBWNS42MjNhLjU1OC41NTggMCAxMC0xLjExNiAweiIvPjwvZz48L3N2Zz4=');\n  opacity: 0.4;\n}\n.x6-widget-stencil.collapsable.collapsed > .x6-widget-stencil-title:hover::before,\n.x6-widget-stencil-group.collapsable.collapsed > .x6-widget-stencil-group-title:hover::before {\n  opacity: 0.6;\n}\n.x6-widget-stencil input[type='search'] {\n  appearance: textfield;\n}\n.x6-widget-stencil input[type='search']::-webkit-search-cancel-button,\n.x6-widget-stencil input[type='search']::-webkit-search-decoration {\n  appearance: none;\n}\n.x6-widget-stencil-search-text {\n  display: block;\n  width: 90%;\n  margin: 8px 5%;\n  padding-left: 8px;\n  color: #333;\n  background: #fff;\n  border: 1px solid #e9e9e9;\n  border-radius: 12px;\n  outline: 0;\n}\n.x6-widget-stencil-search-text:focus {\n  outline: 0;\n}\n.x6-widget-stencil::after {\n  color: #808080;\n  font-weight: 600;\n  font-size: 12px;\n  background: 0 0;\n}\n", Yw = {
	base: "widget-stencil",
	title: "widget-stencil-title",
	search: "widget-stencil-search",
	searchText: "widget-stencil-search-text",
	content: "widget-stencil-content",
	group: "widget-stencil-group",
	groupTitle: "widget-stencil-group-title",
	groupContent: "widget-stencil-group-content"
}, Xw = "__default__", Zw = Object.assign({
	stencilGraphWidth: 200,
	stencilGraphHeight: 800,
	title: "Stencil",
	collapsable: !1,
	placeholder: "Search",
	notFoundText: "No matches found",
	layout(e, t) {
		let n = {
			columnWidth: this.options.stencilGraphWidth / 2 - 10,
			columns: 2,
			rowHeight: 80,
			resizeToFit: !1,
			dx: 10,
			dy: 10
		};
		qw(e, Object.assign(Object.assign(Object.assign({}, n), this.options.layoutOptions), t ? t.layoutOptions : {}));
	}
}, $C), Qw = class extends yb {
	get targetScroller() {
		return this.options.target.getPlugin("scroller");
	}
	get targetGraph() {
		return this.options.target;
	}
	get targetModel() {
		return this.targetGraph.model;
	}
	constructor(e = {}) {
		super(), this.name = "stencil", Vl(this.name, Jw), this.graphs = {}, this.groups = {}, this.options = Object.assign(Object.assign({}, Zw), e), this.init();
	}
	init() {
		this.dnd = new ew(this.options), this.onSearch = vc(this.onSearch, 200), this.initContainer(), this.initSearch(), this.initContent(), this.initGroups(), this.setTitle(), this.startListening();
	}
	load(e, t) {
		return Array.isArray(e) ? this.loadGroup(e, t) : this.options.groups && Object.keys(this.options.groups).forEach((t) => {
			e[t] && this.loadGroup(e[t], t);
		}), this;
	}
	unload(e, t) {
		return Array.isArray(e) ? this.loadGroup(e, t, !0) : this.options.groups && Object.keys(this.options.groups).forEach((t) => {
			e[t] && this.loadGroup(e[t], t, !0);
		}), this;
	}
	toggleGroup(e) {
		return this.isGroupCollapsed(e) ? this.expandGroup(e) : this.collapseGroup(e), this;
	}
	collapseGroup(e) {
		if (this.isGroupCollapsable(e)) {
			let t = this.groups[e];
			t && !this.isGroupCollapsed(e) && (this.trigger("group:collapse", { name: e }), U(t, "collapsed"));
		}
		return this;
	}
	expandGroup(e) {
		if (this.isGroupCollapsable(e)) {
			let t = this.groups[e];
			t && this.isGroupCollapsed(e) && (this.trigger("group:expand", { name: e }), Vu(t, "collapsed"));
		}
		return this;
	}
	isGroupCollapsable(e) {
		let t = this.groups[e];
		return Bu(t, "collapsable");
	}
	isGroupCollapsed(e) {
		let t = this.groups[e];
		return t && Bu(t, "collapsed");
	}
	collapseGroups() {
		return Object.keys(this.groups).forEach((e) => {
			this.collapseGroup(e);
		}), this;
	}
	expandGroups() {
		return Object.keys(this.groups).forEach((e) => {
			this.expandGroup(e);
		}), this;
	}
	resizeGroup(e, t) {
		let n = this.graphs[e];
		return n && n.resize(t.width, t.height), this;
	}
	addGroup(e) {
		let t = Array.isArray(e) ? e : [e];
		this.options.groups ? this.options.groups.push(...t) : this.options.groups = t, t.forEach((e) => {
			this.initGroup(e);
		});
	}
	removeGroup(e) {
		let t = Array.isArray(e) ? e : [e];
		this.options.groups && (this.options.groups = this.options.groups.filter((e) => !t.includes(e.name)), t.forEach((e) => {
			let t = this.graphs[e];
			this.unregisterGraphEvents(t), t.dispose(), delete this.graphs[e];
			let n = this.groups[e];
			ad(n), delete this.groups[e];
		}));
	}
	initContainer() {
		this.container = document.createElement("div"), U(this.container, this.prefixClassName(Yw.base)), W(this.container, "data-not-found-text", this.options.notFoundText || "No matches found");
	}
	initContent() {
		this.content = document.createElement("div"), U(this.content, this.prefixClassName(Yw.content)), dd(this.content, this.container);
	}
	buildGraphConfig(e) {
		let t = this.options.stencilGraphOptions || {}, n = e?.graphOptions, r = Object.assign(Object.assign({}, t), n);
		return r.panning ??= !1, {
			mergedGraphOptions: r,
			width: e && e.graphWidth || this.options.stencilGraphWidth,
			height: e && e.graphHeight || this.options.stencilGraphHeight,
			model: r.model || new Nx()
		};
	}
	createStencilGraph(e, t, n, r) {
		let i = new X(Object.assign(Object.assign({}, e), {
			container: document.createElement("div"),
			model: r,
			width: t,
			height: n,
			interacting: !1,
			preventDefaultBlankAction: !1
		}));
		return this.registerGraphEvents(i), i;
	}
	initSearch() {
		this.options.search && (U(this.container, "searchable"), sd(this.container, this.renderSearch()));
	}
	initGroup(e) {
		let t = document.createElement("div");
		U(t, this.prefixClassName(Yw.group)), W(t, "data-name", e.name), (e.collapsable == null && this.options.collapsable || e.collapsable !== !1) && U(t, "collapsable"), Hu(t, "collapsed", e.collapsed === !0);
		let n = document.createElement("h3");
		U(n, this.prefixClassName(Yw.groupTitle)), n.innerHTML = e.title || e.name;
		let r = document.createElement("div");
		U(r, this.prefixClassName(Yw.groupContent));
		let { mergedGraphOptions: i, width: a, height: o, model: s } = this.buildGraphConfig(e), c = this.createStencilGraph(i, a, o, s);
		sd(r, c.container), sd(t, [n, r]), dd(t, this.content), this.groups[e.name] = t, this.graphs[e.name] = c;
	}
	initGroups() {
		if (this.clearGroups(), this.setCollapsableState(), this.options.groups && this.options.groups.length) this.options.groups.forEach((e) => {
			this.initGroup(e);
		});
		else {
			let { mergedGraphOptions: e, width: t, height: n, model: r } = this.buildGraphConfig(), i = this.createStencilGraph(e, t, n, r);
			sd(this.content, i.container), this.graphs[Xw] = i;
		}
	}
	setCollapsableState() {
		this.options.collapsable = this.options.collapsable && this.options.groups && this.options.groups.some((e) => e.collapsable !== !1), this.options.collapsable ? (U(this.container, "collapsable"), this.options.groups && this.options.groups.every((e) => e.collapsed || e.collapsable === !1) ? U(this.container, "collapsed") : Vu(this.container, "collapsed")) : Vu(this.container, "collapsable");
	}
	setTitle() {
		let e = document.createElement("div");
		U(e, this.prefixClassName(Yw.title)), e.innerHTML = this.options.title, dd(e, this.container);
	}
	renderSearch() {
		let e = document.createElement("div");
		U(e, this.prefixClassName(Yw.search));
		let t = document.createElement("input");
		return W(t, {
			type: "search",
			placeholder: this.options.placeholder || "Search"
		}), U(t, this.prefixClassName(Yw.searchText)), sd(e, t), e;
	}
	startListening() {
		let e = this.prefixClassName(Yw.title), t = this.prefixClassName(Yw.searchText), n = this.prefixClassName(Yw.groupTitle);
		this.delegateEvents({
			[`click .${e}`]: "onTitleClick",
			[`touchstart .${e}`]: "onTitleClick",
			[`click .${n}`]: "onGroupTitleClick",
			[`touchstart .${n}`]: "onGroupTitleClick",
			[`input .${t}`]: "onSearch",
			[`focusin .${t}`]: "onSearchFocusIn",
			[`focusout .${t}`]: "onSearchFocusOut"
		});
	}
	stopListening() {
		this.undelegateEvents();
	}
	registerGraphEvents(e) {
		e.on("cell:mousedown", this.onDragStart, this);
	}
	unregisterGraphEvents(e) {
		e.off("cell:mousedown", this.onDragStart, this);
	}
	getGraphHeight(e) {
		let t = this.getGroup(e);
		return t && t.graphHeight != null ? t.graphHeight : this.options.stencilGraphHeight;
	}
	loadGroup(e, t, n) {
		let r = this.getModel(t);
		if (r) {
			let t = e.map((e) => Tx.isNode(e) ? e : Tx.create(e));
			n === !0 ? r.removeCells(t) : r.resetCells(t);
		}
		let i = this.getGroup(t), a = this.getGraphHeight(t), o = i && i.layout || this.options.layout;
		if (o && r && R(o, this, r, i), !a) {
			let e = this.getGraph(t);
			e.fitToContent({
				minWidth: e.options.width,
				gridHeight: 1,
				padding: i && i.graphPadding || this.options.stencilGraphPadding || 10
			});
		}
		return this;
	}
	onDragStart(e) {
		let { e: t, node: n } = e, r = this.getGroupByNode(n);
		if (r && r.nodeMovable === !1) return;
		let i = this.getGraph(r ? r.name : void 0), a = i && typeof i.isPannable == "function" ? i.isPannable() : !1;
		a && i.disablePanning();
		let o = () => {
			a && i.enablePanning(), this.undelegateDocumentEvents();
		};
		this.delegateDocumentEvents({
			mouseup: o,
			touchend: o,
			touchcancel: o
		}), this.dnd.start(n, t);
	}
	filter(e, t) {
		let n = Object.keys(this.graphs).reduce((n, r) => {
			let i = this.graphs[r], a = r === "__default__" ? null : r, o = i.model.getNodes().filter((n) => {
				let r = !1;
				r = typeof t == "function" ? R(t, this, n, e, a, this) : typeof t == "boolean" ? t : this.isCellMatched(n, e, t, e.toLowerCase() !== e);
				let o = i.renderer.findViewByCell(n);
				return o && Hu(o.container, "unmatched", !r), r;
			}), s = o.length > 0, c = this.options, l = new Nx();
			return l.resetCells(o), c.layout && R(c.layout, this, l, this.getGroup(r)), this.groups[r] && Hu(this.groups[r], "unmatched", !s), this.getGraphHeight(r) || i.fitToContent({
				gridWidth: 1,
				gridHeight: 1,
				padding: c.stencilGraphPadding || 10,
				contentArea: l.getAllCellsBBox() || {
					x: 0,
					y: 0,
					width: 0,
					height: 0
				}
			}), n || s;
		}, !1);
		Hu(this.container, "not-found", !n);
	}
	isCellMatched(e, t, n, r) {
		return t && n ? Object.keys(n).some((i) => {
			if (i === "*" || e.shape === i) {
				let a = n[i];
				return typeof a == "boolean" ? a : (Array.isArray(a) ? a : [a]).some((n) => {
					let i = e.getPropByPath(n);
					return i != null && (i = `${i}`, r || (i = i.toLowerCase()), i.indexOf(t) >= 0);
				});
			}
			return !1;
		}) : !0;
	}
	onSearch(e) {
		this.filter(e.target.value, this.options.search);
	}
	onSearchFocusIn() {
		U(this.container, "is-focused");
	}
	onSearchFocusOut() {
		Vu(this.container, "is-focused");
	}
	onTitleClick() {
		this.options.collapsable && (Hu(this.container, "collapsed"), Bu(this.container, "collapsed") ? this.collapseGroups() : this.expandGroups());
	}
	onGroupTitleClick(e) {
		let t = e.target.closest(`.${this.prefixClassName(Yw.group)}`);
		t && this.toggleGroup(W(t, "data-name") || "");
		let n = Object.keys(this.groups).every((e) => {
			let t = this.getGroup(e), n = this.groups[e];
			return t && t.collapsable === !1 || Bu(n, "collapsed");
		});
		Hu(this.container, "collapsed", n);
	}
	getModel(e) {
		let t = this.getGraph(e);
		return t ? t.model : null;
	}
	getGraph(e) {
		return this.graphs[e || "__default__"];
	}
	getGroup(e) {
		let t = this.options.groups;
		return e != null && t && t.length ? t.find((t) => t.name === e) : null;
	}
	getGroupByNode(e) {
		let t = this.options.groups;
		return t ? t.find((t) => {
			let n = this.getModel(t.name);
			return n ? n.has(e.id) : !1;
		}) : null;
	}
	clearGroups() {
		Object.keys(this.graphs).forEach((e) => {
			let t = this.graphs[e];
			this.unregisterGraphEvents(t), t.dispose();
		}), Object.keys(this.groups).forEach((e) => {
			let t = this.groups[e];
			ad(t);
		}), this.graphs = {}, this.groups = {};
	}
	onRemove() {
		this.clearGroups(), this.dnd.remove(), this.stopListening(), this.undelegateDocumentEvents();
	}
	dispose() {
		this.remove(), Hl(this.name);
	}
};
f([q()], Qw.prototype, "dispose", null);
// node_modules/@antv/x6/es/plugin/snapline/snapline.js
var $w = class extends yb {
	get model() {
		return this.graph.model;
	}
	get containerClassName() {
		return this.prefixClassName("widget-snapline");
	}
	get verticalClassName() {
		return `${this.containerClassName}-vertical`;
	}
	get horizontalClassName() {
		return `${this.containerClassName}-horizontal`;
	}
	constructor(e) {
		super();
		let { graph: t } = e, n = d(e, ["graph"]);
		this.graph = t, this.options = Object.assign({}, n), this.offset = {
			x: 0,
			y: 0
		}, this.render(), this.disabled || this.startListening();
	}
	get disabled() {
		return this.options.enabled !== !0;
	}
	enable() {
		this.disabled && (this.options.enabled = !0, this.startListening());
	}
	disable() {
		this.disabled || (this.options.enabled = !1, this.stopListening());
	}
	setFilter(e) {
		this.options.filter = e;
	}
	render() {
		let e = this.containerWrapper = new lf("svg"), t = this.horizontal = new lf("line"), n = this.vertical = new lf("line");
		e.addClass(this.containerClassName), t.addClass(this.horizontalClassName), n.addClass(this.verticalClassName), e.setAttribute("width", "100%"), e.setAttribute("height", "100%"), t.setAttribute("display", "none"), n.setAttribute("display", "none"), e.append([t, n]), this.options.className && e.addClass(this.options.className), this.container = this.containerWrapper.node;
	}
	startListening() {
		this.stopListening(), this.graph.on("node:mousedown", this.captureCursorOffset, this), this.graph.on("node:mousemove", this.snapOnMoving, this), this.model.on("batch:stop", this.onBatchStop, this), this.delegateDocumentEvents({
			mouseup: "hide",
			touchend: "hide"
		});
	}
	stopListening() {
		this.graph.off("node:mousedown", this.captureCursorOffset, this), this.graph.off("node:mousemove", this.snapOnMoving, this), this.model.off("batch:stop", this.onBatchStop, this), this.undelegateDocumentEvents();
	}
	onBatchStop({ name: e, data: t }) {
		e === "resize" && this.snapOnResizing(t.cell, t);
	}
	captureCursorOffset({ view: e, x: t, y: n }) {
		let r = e.getDelegatedView();
		if (r && this.isNodeMovable(r)) {
			let r = e.cell.getPosition();
			this.offset = {
				x: t - r.x,
				y: n - r.y
			};
		}
	}
	isNodeMovable(e) {
		return e && e.cell.isNode() && e.can("nodeMovable");
	}
	getRestrictArea(e) {
		let t = this.graph.options.translating.restrict, n = typeof t == "function" ? R(t, this.graph, e) : t;
		return typeof n == "number" ? this.graph.transform.getGraphArea().inflate(n) : n === !0 ? this.graph.transform.getGraphArea() : n || null;
	}
	snapOnResizing(e, t) {
		if (this.options.resizing && !t.snapped && t.ui && t.direction && t.trueDirection) {
			let n = this.graph.renderer.findViewByCell(e);
			if (n && n.cell.isNode()) {
				let r = e.getBBox(), i = r.bbox(e.getAngle()), a = i.getTopLeft(), o = i.getBottomRight(), s = iu(e.getAngle()), c = this.options.tolerance || 0, l, u, d, f, p, m, h = {
					vertical: 0,
					horizontal: 0
				}, g = t.direction, _ = t.trueDirection, v = t.relativeDirection;
				h.vertical = _.indexOf("right") === -1 ? a.x : o.x, h.horizontal = _.indexOf("bottom") === -1 ? a.y : o.y, this.model.getNodes().some((t) => {
					if (this.isIgnored(e, t)) return !1;
					let n = t.getBBox().bbox(t.getAngle()), r = n.getTopLeft(), a = n.getBottomRight(), s = {
						vertical: [r.x, a.x],
						horizontal: [r.y, a.y]
					}, g = {};
					return Object.keys(s).forEach((e) => {
						let t = e, n = s[t].map((e) => ({
							position: e,
							distance: Math.abs(e - h[t])
						})).filter((e) => e.distance <= c);
						g[t] = sl(n, (e) => e.distance);
					}), l == null && g.vertical.length > 0 && (l = g.vertical[0].position, u = Math.min(i.y, n.y), d = Math.max(o.y, a.y) - u), f == null && g.horizontal.length > 0 && (f = g.horizontal[0].position, p = Math.min(i.x, n.x), m = Math.max(o.x, a.x) - p), l != null && f != null;
				}), this.hide();
				let y = 0, b = 0;
				(f != null || l != null) && (l != null && (y = _.indexOf("right") === -1 ? a.x - l : l - o.x), f != null && (b = _.indexOf("bottom") === -1 ? a.y - f : f - o.y));
				let x = 0, S = 0;
				if (s % 90 == 0) s === 90 || s === 270 ? (x = b, S = y) : (x = y, S = b);
				else {
					let e = s >= 0 && s < 90 ? 1 : s >= 90 && s < 180 ? 4 : s >= 180 && s < 270 ? 3 : 2;
					f != null && l != null && (y < b ? (b = 0, f = void 0) : (y = 0, l = void 0));
					let t = ru(s % 90);
					y && (x = e === 3 ? y / Math.cos(t) : y / Math.sin(t)), b && (S = e === 3 ? b / Math.cos(t) : b / Math.sin(t));
					let n = e === 1 || e === 3;
					switch (v) {
						case "top":
						case "bottom":
							S = b ? b / (n ? Math.cos(t) : Math.sin(t)) : y / (n ? Math.sin(t) : Math.cos(t));
							break;
						case "left":
						case "right": x = y ? y / (n ? Math.cos(t) : Math.sin(t)) : b / (n ? Math.sin(t) : Math.cos(t));
					}
				}
				switch (v) {
					case "top":
					case "bottom":
						x = 0;
						break;
					case "left":
					case "right": S = 0;
				}
				let C = this.graph.getGridSize(), w = Math.max(r.width + x, C), T = Math.max(r.height + S, C);
				t.minWidth && t.minWidth > C && (w = Math.max(w, t.minWidth)), t.minHeight && t.minHeight > C && (T = Math.max(T, t.minHeight)), t.maxWidth && (w = Math.min(w, t.maxWidth)), t.maxHeight && (T = Math.min(T, t.maxHeight)), t.preserveAspectRatio && (S < x ? T = w * (r.height / r.width) : w = T * (r.width / r.height)), (w !== r.width || T !== r.height) && (e.resize(w, T, {
					direction: g,
					relativeDirection: v,
					trueDirection: _,
					snapped: !0,
					snaplines: this.cid,
					restrict: this.getRestrictArea(n)
				}), d && (d += T - r.height), m && (m += w - r.width));
				let E = e.getBBox().bbox(s);
				l && Math.abs(E.x - l) > 1 && Math.abs(E.width + E.x - l) > 1 && (l = void 0), f && Math.abs(E.y - f) > 1 && Math.abs(E.height + E.y - f) > 1 && (f = void 0), this.update({
					verticalLeft: l,
					verticalTop: u,
					verticalHeight: d,
					horizontalTop: f,
					horizontalLeft: p,
					horizontalWidth: m
				});
			}
		}
	}
	snapOnMoving({ view: e, e: t, x: n, y: r }) {
		let i = e.getEventData(t).delegatedView || e;
		if (!this.isNodeMovable(i)) return;
		let a = i.cell, o = a.getSize(), s = a.getPosition(), c = new B(n - this.offset.x, r - this.offset.y, o.width, o.height), l = a.getAngle(), u = c.getCenter(), d = c.bbox(l), f = d.getTopLeft(), p = d.getBottomRight(), m = this.options.tolerance || 0, h, g, _, v, y, b, x = 0, S = 0;
		if (this.model.getNodes().some((e) => {
			if (this.isIgnored(a, e)) return !1;
			let t = e.getBBox().bbox(e.getAngle()), n = t.getCenter(), r = t.getTopLeft(), i = t.getBottomRight();
			return h ?? (Math.abs(n.x - u.x) < m ? (h = n.x, x = .5) : Math.abs(r.x - f.x) < m ? (h = r.x, x = 0) : Math.abs(r.x - p.x) < m ? (h = r.x, x = 1) : Math.abs(i.x - p.x) < m ? (h = i.x, x = 1) : Math.abs(i.x - f.x) < m && (h = i.x), h != null && (g = Math.min(d.y, t.y), _ = Math.max(p.y, i.y) - g)), v ?? (Math.abs(n.y - u.y) < m ? (v = n.y, S = .5) : Math.abs(r.y - f.y) < m ? v = r.y : Math.abs(r.y - p.y) < m ? (v = r.y, S = 1) : Math.abs(i.y - p.y) < m ? (v = i.y, S = 1) : Math.abs(i.y - f.y) < m && (v = i.y), v != null && (y = Math.min(d.x, t.x), b = Math.max(p.x, i.x) - y)), h != null && v != null;
		}), this.hide(), v != null || h != null) {
			v != null && (d.y = v - S * d.height), h != null && (d.x = h - x * d.width);
			let e = d.getCenter(), t = e.x - c.width / 2, n = e.y - c.height / 2, r = t - s.x, o = n - s.y;
			(r !== 0 || o !== 0) && (a.translate(r, o, {
				snapped: !0,
				restrict: this.getRestrictArea(i)
			}), b && (b += r), _ && (_ += o)), this.update({
				verticalLeft: h,
				verticalTop: g,
				verticalHeight: _,
				horizontalTop: v,
				horizontalLeft: y,
				horizontalWidth: b
			});
		}
	}
	isIgnored(e, t) {
		return t.id === e.id || t.isDescendantOf(e) || !this.filter(t);
	}
	filter(e) {
		let t = this.options.filter;
		return Array.isArray(t) ? t.some((t) => typeof t == "string" ? e.shape === t : e.id === t.id) : typeof t != "function" || R(t, this.graph, e);
	}
	update(e) {
		if (e.horizontalTop) {
			let t = this.graph.localToGraph(new z(e.horizontalLeft, e.horizontalTop)), n = this.graph.localToGraph(new z(e.horizontalLeft + e.horizontalWidth, e.horizontalTop));
			this.horizontal.setAttributes({
				x1: this.options.sharp ? `${t.x}` : "0",
				y1: `${t.y}`,
				x2: this.options.sharp ? `${n.x}` : "100%",
				y2: `${n.y}`,
				display: "inherit"
			});
		} else this.horizontal.setAttribute("display", "none");
		if (e.verticalLeft) {
			let t = this.graph.localToGraph(new z(e.verticalLeft, e.verticalTop)), n = this.graph.localToGraph(new z(e.verticalLeft, e.verticalTop + e.verticalHeight));
			this.vertical.setAttributes({
				x1: `${t.x}`,
				y1: this.options.sharp ? `${t.y}` : "0",
				x2: `${n.x}`,
				y2: this.options.sharp ? `${n.y}` : "100%",
				display: "inherit"
			});
		} else this.vertical.setAttribute("display", "none");
		this.show();
	}
	resetTimer() {
		this.timer &&= (clearTimeout(this.timer), null);
	}
	show() {
		return this.resetTimer(), this.container.parentNode ?? this.graph.container.appendChild(this.container), this;
	}
	hide() {
		this.resetTimer(), this.vertical.setAttribute("display", "none"), this.horizontal.setAttribute("display", "none");
		let e = this.options.clean, t = typeof e == "number" ? e : e === !1 ? 0 : 3e3;
		return t > 0 && (this.timer = window.setTimeout(() => {
			this.container.parentNode !== null && this.unmount();
		}, t)), this;
	}
	onRemove() {
		this.stopListening(), this.hide();
	}
	dispose() {
		this.remove();
	}
};
f([q()], $w.prototype, "dispose", null);
// node_modules/@antv/x6/es/plugin/snapline/style/raw.js
var eT = ".x6-widget-snapline {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  pointer-events: none;\n}\n.x6-widget-snapline-vertical,\n.x6-widget-snapline-horizontal {\n  stroke: #2ecc71;\n  stroke-width: 1px;\n}\n";
X.prototype.isSnaplineEnabled = function() {
	let e = this.getPlugin("snapline");
	return e ? e.isEnabled() : !1;
}, X.prototype.enableSnapline = function() {
	let e = this.getPlugin("snapline");
	return e && e.enable(), this;
}, X.prototype.disableSnapline = function() {
	let e = this.getPlugin("snapline");
	return e && e.disable(), this;
}, X.prototype.toggleSnapline = function() {
	let e = this.getPlugin("snapline");
	return e && e.toggleEnabled(), this;
}, X.prototype.hideSnapline = function() {
	let e = this.getPlugin("snapline");
	return e && e.hide(), this;
}, X.prototype.setSnaplineFilter = function(e) {
	let t = this.getPlugin("snapline");
	return t && t.setFilter(e), this;
}, X.prototype.isSnaplineOnResizingEnabled = function() {
	let e = this.getPlugin("snapline");
	return e ? e.isOnResizingEnabled() : !1;
}, X.prototype.enableSnaplineOnResizing = function() {
	let e = this.getPlugin("snapline");
	return e && e.enableOnResizing(), this;
}, X.prototype.disableSnaplineOnResizing = function() {
	let e = this.getPlugin("snapline");
	return e && e.disableOnResizing(), this;
}, X.prototype.toggleSnaplineOnResizing = function(e) {
	let t = this.getPlugin("snapline");
	return t && t.toggleOnResizing(e), this;
}, X.prototype.isSharpSnapline = function() {
	let e = this.getPlugin("snapline");
	return e ? e.isSharp() : !1;
}, X.prototype.enableSharpSnapline = function() {
	let e = this.getPlugin("snapline");
	return e && e.enableSharp(), this;
}, X.prototype.disableSharpSnapline = function() {
	let e = this.getPlugin("snapline");
	return e && e.disableSharp(), this;
}, X.prototype.toggleSharpSnapline = function(e) {
	let t = this.getPlugin("snapline");
	return t && t.toggleSharp(e), this;
}, X.prototype.getSnaplineTolerance = function() {
	let e = this.getPlugin("snapline");
	if (e) return e.getTolerance();
}, X.prototype.setSnaplineTolerance = function(e) {
	let t = this.getPlugin("snapline");
	return t && t.setTolerance(e), this;
};
// node_modules/@antv/x6/es/plugin/snapline/index.js
var tT = class extends Um {
	constructor(e = {}) {
		super(), this.name = "snapline", this.options = Object.assign({
			enabled: !0,
			tolerance: 10
		}, e), Vl(this.name, eT);
	}
	init(e) {
		this.snaplineImpl = new $w(Object.assign(Object.assign({}, this.options), { graph: e }));
	}
	isEnabled() {
		return !this.snaplineImpl.disabled;
	}
	enable() {
		this.snaplineImpl.enable();
	}
	disable() {
		this.snaplineImpl.disable();
	}
	toggleEnabled(e) {
		if (e != null) e !== this.isEnabled() && (e ? this.enable() : this.disable());
		else return this.isEnabled() ? this.disable() : this.enable(), this;
	}
	hide() {
		return this.snaplineImpl.hide(), this;
	}
	setFilter(e) {
		return this.snaplineImpl.setFilter(e), this;
	}
	isOnResizingEnabled() {
		return this.snaplineImpl.options.resizing === !0;
	}
	enableOnResizing() {
		return this.snaplineImpl.options.resizing = !0, this;
	}
	disableOnResizing() {
		return this.snaplineImpl.options.resizing = !1, this;
	}
	toggleOnResizing(e) {
		return e == null ? this.isOnResizingEnabled() ? this.disableOnResizing() : this.enableOnResizing() : e !== this.isOnResizingEnabled() && (e ? this.enableOnResizing() : this.disableOnResizing()), this;
	}
	isSharp() {
		return this.snaplineImpl.options.sharp === !0;
	}
	enableSharp() {
		return this.snaplineImpl.options.sharp = !0, this;
	}
	disableSharp() {
		return this.snaplineImpl.options.sharp = !1, this;
	}
	toggleSharp(e) {
		return e == null ? this.isSharp() ? this.disableSharp() : this.enableSharp() : e !== this.isSharp() && (e ? this.enableSharp() : this.disableSharp()), this;
	}
	getTolerance() {
		return this.snaplineImpl.options.tolerance;
	}
	setTolerance(e) {
		return this.snaplineImpl.options.tolerance = e, this;
	}
	captureCursorOffset(e) {
		this.snaplineImpl.captureCursorOffset(e);
	}
	snapOnMoving(e) {
		this.snaplineImpl.snapOnMoving(e);
	}
	dispose() {
		this.snaplineImpl.dispose(), Hl(this.name);
	}
};
f([q()], tT.prototype, "dispose", null);
// node_modules/@antv/x6/es/plugin/transform/style/raw.js
var nT = ".x6-widget-transform {\n  position: absolute;\n  box-sizing: content-box !important;\n  margin: -5px 0 0 -5px;\n  padding: 4px;\n  border: 1px dashed #000;\n  border-radius: 5px;\n  user-select: none;\n  pointer-events: none;\n}\n.x6-widget-transform > div {\n  position: absolute;\n  box-sizing: border-box;\n  background-color: #fff;\n  border: 1px solid #000;\n  transition: background-color 0.2s;\n  pointer-events: auto;\n  -webkit-user-drag: none;\n  user-drag: none;\n  /* stylelint-disable-line */\n}\n.x6-widget-transform > div:hover {\n  background-color: #d3d3d3;\n}\n.x6-widget-transform-cursor-n {\n  cursor: n-resize;\n}\n.x6-widget-transform-cursor-s {\n  cursor: s-resize;\n}\n.x6-widget-transform-cursor-e {\n  cursor: e-resize;\n}\n.x6-widget-transform-cursor-w {\n  cursor: w-resize;\n}\n.x6-widget-transform-cursor-ne {\n  cursor: ne-resize;\n}\n.x6-widget-transform-cursor-nw {\n  cursor: nw-resize;\n}\n.x6-widget-transform-cursor-se {\n  cursor: se-resize;\n}\n.x6-widget-transform-cursor-sw {\n  cursor: sw-resize;\n}\n.x6-widget-transform-resize {\n  width: 10px;\n  height: 10px;\n  border-radius: 6px;\n}\n.x6-widget-transform-resize[data-position='top-left'] {\n  top: -5px;\n  left: -5px;\n}\n.x6-widget-transform-resize[data-position='top-right'] {\n  top: -5px;\n  right: -5px;\n}\n.x6-widget-transform-resize[data-position='bottom-left'] {\n  bottom: -5px;\n  left: -5px;\n}\n.x6-widget-transform-resize[data-position='bottom-right'] {\n  right: -5px;\n  bottom: -5px;\n}\n.x6-widget-transform-resize[data-position='top'] {\n  top: -5px;\n  left: 50%;\n  margin-left: -5px;\n}\n.x6-widget-transform-resize[data-position='bottom'] {\n  bottom: -5px;\n  left: 50%;\n  margin-left: -5px;\n}\n.x6-widget-transform-resize[data-position='left'] {\n  top: 50%;\n  left: -5px;\n  margin-top: -5px;\n}\n.x6-widget-transform-resize[data-position='right'] {\n  top: 50%;\n  right: -5px;\n  margin-top: -5px;\n}\n.x6-widget-transform.prevent-aspect-ratio .x6-widget-transform-resize[data-position='top'],\n.x6-widget-transform.prevent-aspect-ratio .x6-widget-transform-resize[data-position='bottom'],\n.x6-widget-transform.prevent-aspect-ratio .x6-widget-transform-resize[data-position='left'],\n.x6-widget-transform.prevent-aspect-ratio .x6-widget-transform-resize[data-position='right'] {\n  display: none;\n}\n.x6-widget-transform.no-orth-resize .x6-widget-transform-resize[data-position='bottom'],\n.x6-widget-transform.no-orth-resize .x6-widget-transform-resize[data-position='left'],\n.x6-widget-transform.no-orth-resize .x6-widget-transform-resize[data-position='right'],\n.x6-widget-transform.no-orth-resize .x6-widget-transform-resize[data-position='top'] {\n  display: none;\n}\n.x6-widget-transform.no-resize .x6-widget-transform-resize {\n  display: none;\n}\n.x6-widget-transform-rotate {\n  top: -20px;\n  left: -20px;\n  width: 12px;\n  height: 12px;\n  border-radius: 6px;\n  cursor: crosshair;\n}\n.x6-widget-transform.no-rotate .x6-widget-transform-rotate {\n  display: none;\n}\n.x6-widget-transform-active {\n  border-color: transparent;\n  pointer-events: all;\n}\n.x6-widget-transform-active > div {\n  display: none;\n}\n.x6-widget-transform-active > .x6-widget-transform-active-handle {\n  display: block;\n  background-color: #808080;\n}\n", rT = "has-widget-transform", iT = [
	"nw",
	"n",
	"ne",
	"e",
	"se",
	"s",
	"sw",
	"w"
], aT = [
	"top-left",
	"top",
	"top-right",
	"right",
	"bottom-right",
	"bottom",
	"bottom-left",
	"left"
], oT = {
	minWidth: 0,
	minHeight: 0,
	maxWidth: Infinity,
	maxHeight: Infinity,
	rotateGrid: 15,
	rotatable: !0,
	preserveAspectRatio: !1,
	orthogonalResizing: !0,
	restrictedResizing: !1,
	autoScrollOnResizing: !0,
	allowReverse: !0
}, sT = class extends yb {
	get model() {
		return this.graph.model;
	}
	get view() {
		return this.graph.renderer.findViewByCell(this.node);
	}
	get containerClassName() {
		return this.prefixClassName("widget-transform");
	}
	get resizeClassName() {
		return `${this.containerClassName}-resize`;
	}
	get rotateClassName() {
		return `${this.containerClassName}-rotate`;
	}
	constructor(e, t, n) {
		super(), this.node = t, this.graph = n, this.options = Object.assign(Object.assign({}, oT), e), this.render(), this.startListening();
	}
	startListening() {
		this.delegateEvents({
			[`mousedown .${this.resizeClassName}`]: "startResizing",
			[`touchstart .${this.resizeClassName}`]: "startResizing",
			[`mousedown .${this.rotateClassName}`]: "startRotating",
			[`touchstart .${this.rotateClassName}`]: "startRotating"
		}), this.model.on("*", this.update, this), this.graph.on("scale", this.update, this), this.graph.on("translate", this.update, this), this.node.on("removed", this.remove, this), this.model.on("reseted", this.remove, this), this.view.on("cell:knob:mousedown", this.onKnobMouseDown, this), this.view.on("cell:knob:mouseup", this.onKnobMouseUp, this);
	}
	stopListening() {
		this.undelegateEvents(), this.model.off("*", this.update, this), this.graph.off("scale", this.update, this), this.graph.off("translate", this.update, this), this.node.off("removed", this.remove, this), this.model.off("reseted", this.remove, this), this.view.off("cell:knob:mousedown", this.onKnobMouseDown, this), this.view.off("cell:knob:mouseup", this.onKnobMouseUp, this);
	}
	renderHandles() {
		this.container = document.createElement("div");
		let e = document.createElement("div");
		W(e, "draggable", "false");
		let t = e.cloneNode(!0);
		U(t, this.rotateClassName);
		let n = aT.map((t) => {
			let n = e.cloneNode(!0);
			return U(n, this.resizeClassName), W(n, "data-position", t), n;
		});
		this.empty(), sd(this.container, [...n, t]);
	}
	render() {
		return this.renderHandles(), this.view && this.view.addClass(rT), U(this.container, this.containerClassName), Hu(this.container, "no-orth-resize", this.options.preserveAspectRatio || !this.options.orthogonalResizing), Hu(this.container, "no-resize", !this.options.resizable), Hu(this.container, "no-rotate", !this.options.rotatable), this.options.className && U(this.container, this.options.className), this.graph.container.appendChild(this.container), this.update();
	}
	update() {
		let e = this.graph.matrix(), t = this.node.getBBox();
		t.x *= e.a, t.x += e.e, t.y *= e.d, t.y += e.f, t.width *= e.a, t.height *= e.d;
		let n = iu(this.node.getAngle()), r = n === 0 ? "" : `rotate(${n}deg)`;
		return G(this.container, {
			transform: r,
			width: t.width,
			height: t.height,
			left: t.x,
			top: t.y
		}), this.updateResizerDirections(), this;
	}
	remove() {
		return this.view && this.view.removeClass(rT), super.remove();
	}
	onKnobMouseDown() {
		this.startHandle();
	}
	onKnobMouseUp() {
		this.stopHandle();
	}
	updateResizerDirections() {
		let e = iu(this.node.getAngle()), t = Math.floor(e * (iT.length / 360));
		if (t !== this.prevShift) {
			let e = iT.slice(t).concat(iT.slice(0, t)), n = (e) => `${this.containerClassName}-cursor-${e}`;
			this.container.querySelectorAll(`.${this.resizeClassName}`).forEach((t, r) => {
				Vu(t, iT.map((e) => n(e)).join(" ")), U(t, n(e[r]));
			}), this.prevShift = t;
		}
	}
	getTrueDirection(e) {
		let t = iu(this.node.getAngle()), n = aT.indexOf(e);
		return n += Math.floor(t * (aT.length / 360)), n %= aT.length, aT[n];
	}
	toValidResizeDirection(e) {
		return {
			top: "top-left",
			bottom: "bottom-right",
			left: "bottom-left",
			right: "top-right"
		}[e] || e;
	}
	startResizing(e) {
		e.stopPropagation(), this.model.startBatch("resize", { cid: this.cid });
		let t = W(e.target, "data-position");
		this.prepareResizing(e, t), this.startAction(e);
	}
	prepareResizing(e, t) {
		let n = this.getTrueDirection(t), r = 0, i = 0;
		t.split("-").forEach((e) => {
			r = {
				left: -1,
				right: 1
			}[e] || r, i = {
				top: -1,
				bottom: 1
			}[e] || i;
		});
		let a = this.toValidResizeDirection(t), o = {
			"top-right": "bottomLeft",
			"top-left": "bottomRight",
			"bottom-left": "topRight",
			"bottom-right": "topLeft"
		}[a], s = iu(this.node.getAngle());
		this.setEventData(e, {
			selector: o,
			direction: a,
			trueDirection: n,
			relativeDirection: t,
			angle: s,
			resizeX: r,
			resizeY: i,
			action: "resizing"
		});
	}
	startRotating(e) {
		e.stopPropagation(), this.model.startBatch("rotate", { cid: this.cid });
		let t = this.node.getBBox().getCenter(), n = this.normalizeEvent(e), r = this.graph.snapToGrid(n.clientX, n.clientY);
		this.setEventData(e, {
			center: t,
			action: "rotating",
			angle: iu(this.node.getAngle()),
			start: z.create(r).theta(t)
		}), this.startAction(e);
	}
	onMouseMove(e) {
		let t = this.graph.findViewByCell(this.node), n = this.getEventData(e);
		if (n.action) {
			let r = this.normalizeEvent(e), i = r.clientX, a = r.clientY, o = this.graph.getPlugin("scroller"), s = this.options.restrictedResizing;
			if (s === !0 || typeof s == "number") {
				let e = s === !0 ? 0 : s, t = o ? Math.max(e, 8) : e, n = this.graph.container.getBoundingClientRect();
				i = Yi(i, n.left + t, n.right - t), a = Yi(a, n.top + t, n.bottom - t);
			} else this.options.autoScrollOnResizing && o && o.autoScroll(i, a);
			let c = this.graph.snapToGrid(i, a), l = this.graph.getGridSize(), u = this.node, d = this.options;
			if (n.action === "resizing") {
				n = n, n.resized || (t && (t.addClass("node-resizing"), this.notify("node:resize", e, t)), n.resized = !0);
				let r = u.getBBox(), i = z.create(c).rotate(n.angle, r.getCenter()).diff(r[n.selector]), a = n.resizeX ? i.x * n.resizeX : r.width, o = n.resizeY ? i.y * n.resizeY : r.height, s = a, f = o;
				if (a = cu(a, l), o = cu(o, l), a = Math.max(a, d.minWidth || l), o = Math.max(o, d.minHeight || l), a = Math.min(a, d.maxWidth || Infinity), o = Math.min(o, d.maxHeight || Infinity), d.preserveAspectRatio) {
					let e = r.width * o / r.height, t = r.height * a / r.width;
					a < e ? o = t : a = e;
				}
				let p = n.relativeDirection;
				if (d.allowReverse && (s <= -a || f <= -o)) {
					let t;
					p === "left" ? s <= -a && (t = "right") : p === "right" ? s <= -a && (t = "left") : p === "top" ? f <= -o && (t = "bottom") : p === "bottom" ? f <= -o && (t = "top") : p === "top-left" ? s <= -a && f <= -o ? t = "bottom-right" : s <= -a ? t = "top-right" : f <= -o && (t = "bottom-left") : p === "top-right" ? s <= -a && f <= -o ? t = "bottom-left" : s <= -a ? t = "top-left" : f <= -o && (t = "bottom-right") : p === "bottom-left" ? s <= -a && f <= -o ? t = "top-right" : s <= -a ? t = "bottom-right" : f <= -o && (t = "top-left") : p === "bottom-right" && (s <= -a && f <= -o ? t = "top-left" : s <= -a ? t = "bottom-left" : f <= -o && (t = "top-right"));
					let n = t;
					this.stopHandle();
					let r = this.container.querySelector(`.${this.resizeClassName}[data-position="${n}"]`);
					this.startHandle(r), this.prepareResizing(e, n), this.onMouseMove(e);
				}
				if (r.width !== a || r.height !== o) {
					let r = {
						ui: !0,
						direction: n.direction,
						relativeDirection: n.relativeDirection,
						trueDirection: n.trueDirection,
						minWidth: d.minWidth,
						minHeight: d.minHeight,
						maxWidth: d.maxWidth,
						maxHeight: d.maxHeight,
						preserveAspectRatio: d.preserveAspectRatio === !0
					};
					u.resize(a, o, r), this.notify("node:resizing", e, t);
				}
			} else if (n.action === "rotating") {
				n = n, n.rotated || (t && (t.addClass("node-rotating"), this.notify("node:rotate", e, t)), n.rotated = !0);
				let r = u.getAngle(), i = n.start - z.create(c).theta(n.center), a = n.angle + i;
				d.rotateGrid && (a = cu(a, d.rotateGrid)), a = iu(a), r !== a && (u.rotate(a, { absolute: !0 }), this.notify("node:rotating", e, t));
			}
		}
	}
	onMouseUp(e) {
		let t = this.getEventData(e);
		t.action && (this.stopAction(e), this.model.stopBatch(t.action === "resizing" ? "resize" : "rotate", { cid: this.cid }));
	}
	startHandle(e) {
		if (this.handle = e || null, U(this.container, `${this.containerClassName}-active`), e) {
			U(e, `${this.containerClassName}-active-handle`);
			let t = e.getAttribute("data-position");
			if (t) {
				let e = iT[aT.indexOf(t)];
				U(this.container, `${this.containerClassName}-cursor-${e}`);
			}
		}
	}
	stopHandle() {
		if (Vu(this.container, `${this.containerClassName}-active`), this.handle) {
			Vu(this.handle, `${this.containerClassName}-active-handle`);
			let e = this.handle.getAttribute("data-position");
			if (e) {
				let t = iT[aT.indexOf(e)];
				Vu(this.container, `${this.containerClassName}-cursor-${t}`);
			}
			this.handle = null;
		}
	}
	startAction(e) {
		this.startHandle(e.target), this.graph.view.undelegateEvents(), this.delegateDocumentEvents(Ux, e.data);
	}
	stopAction(e) {
		this.stopHandle(), this.undelegateDocumentEvents(), this.graph.view.delegateEvents();
		let t = this.graph.findViewByCell(this.node), n = this.getEventData(e);
		t && (t.removeClass(`node-${n.action}`), n.action === "resizing" && n.resized ? this.notify("node:resized", e, t) : n.action === "rotating" && n.rotated && this.notify("node:rotated", e, t));
	}
	notify(e, t, n, r = {}) {
		if (n) {
			let i = n.graph, a = i.view.normalizeEvent(t), o = i.snapToGrid(a.clientX, a.clientY);
			this.trigger(e, Object.assign({
				e: a,
				view: n,
				node: n.cell,
				cell: n.cell,
				x: o.x,
				y: o.y
			}, r));
		}
	}
	dispose() {
		this.stopListening(), this.remove(), this.off();
	}
};
f([q()], sT.prototype, "dispose", null), X.prototype.createTransformWidget = function(e) {
	let t = this.getPlugin("transform");
	return t && t.createWidget(e), this;
}, X.prototype.clearTransformWidgets = function() {
	let e = this.getPlugin("transform");
	return e && e.clearWidgets(), this;
};
// node_modules/@antv/x6/es/plugin/transform/index.js
var cT = class extends Wm {
	constructor(e = {}) {
		super(), this.name = "transform", this.widgets = /* @__PURE__ */ new Map(), this.disabled = !1, this.options = e, Vl(this.name, nT);
	}
	init(e) {
		this.graph = e, !this.disabled && this.startListening();
	}
	startListening() {
		this.graph.on("node:click", this.onNodeClick, this), this.graph.on("blank:mousedown", this.onBlankMouseDown, this);
	}
	stopListening() {
		this.graph.off("node:click", this.onNodeClick, this), this.graph.off("blank:mousedown", this.onBlankMouseDown, this);
	}
	enable() {
		this.disabled && (this.disabled = !1, this.startListening());
	}
	disable() {
		this.disabled || (this.disabled = !0, this.stopListening());
	}
	isEnabled() {
		return !this.disabled;
	}
	createWidget(e) {
		this.clearWidgets();
		let t = this.createTransform(e);
		t && (this.widgets.set(e, t), t.on("*", (e, t) => {
			this.trigger(e, t), this.graph.trigger(e, t);
		}));
	}
	onNodeClick({ node: e }) {
		this.createWidget(e);
	}
	onBlankMouseDown() {
		this.clearWidgets();
	}
	createTransform(e) {
		let t = this.getTransformOptions(e);
		return t.resizable || t.rotatable ? new sT(t, e, this.graph) : null;
	}
	parseOptionGroup(e, t, n) {
		let r = {};
		return Object.keys(n || {}).forEach((i) => {
			let a = n[i];
			r[i] = typeof a == "function" ? a.call(e, t) : a;
		}), r;
	}
	getTransformOptions(e) {
		this.options.resizing || (this.options.resizing = { enabled: !1 }), this.options.rotating || (this.options.rotating = { enabled: !1 }), typeof this.options.resizing == "boolean" && (this.options.resizing = { enabled: this.options.resizing }), typeof this.options.rotating == "boolean" && (this.options.rotating = { enabled: this.options.rotating });
		let t = this.parseOptionGroup(this.graph, e, this.options.resizing), n = this.parseOptionGroup(this.graph, e, this.options.rotating);
		return {
			resizable: !!t.enabled,
			minWidth: t.minWidth || 0,
			maxWidth: t.maxWidth || 2 ** 53 - 1,
			minHeight: t.minHeight || 0,
			maxHeight: t.maxHeight || 2 ** 53 - 1,
			orthogonalResizing: typeof t.orthogonal != "boolean" || t.orthogonal,
			restrictedResizing: !!t.restrict,
			autoScrollOnResizing: typeof t.autoScroll != "boolean" || t.autoScroll,
			preserveAspectRatio: !!t.preserveAspectRatio,
			allowReverse: typeof t.allowReverse != "boolean" || t.allowReverse,
			rotatable: !!n.enabled,
			rotateGrid: n.grid || 15
		};
	}
	clearWidgets() {
		this.widgets.forEach((e, t) => {
			this.graph.getCellById(t.id) && e.dispose();
		}), this.widgets.clear();
	}
	dispose() {
		this.clearWidgets(), this.stopListening(), this.off(), Hl(this.name);
	}
};
f([q()], cT.prototype, "dispose", null);
// node_modules/lodash/_listCacheClear.js
var lT = /* @__PURE__ */ o(((e, t) => {
	function n() {
		this.__data__ = [], this.size = 0;
	}
	t.exports = n;
})), uT = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return e === t || e !== e && t !== t;
	}
	t.exports = n;
})), dT = /* @__PURE__ */ o(((e, t) => {
	var n = uT();
	function r(e, t) {
		for (var r = e.length; r--;) if (n(e[r][0], t)) return r;
		return -1;
	}
	t.exports = r;
})), fT = /* @__PURE__ */ o(((e, t) => {
	var n = dT(), r = Array.prototype.splice;
	function i(e) {
		var t = this.__data__, i = n(t, e);
		return i < 0 ? !1 : (i == t.length - 1 ? t.pop() : r.call(t, i, 1), --this.size, !0);
	}
	t.exports = i;
})), pT = /* @__PURE__ */ o(((e, t) => {
	var n = dT();
	function r(e) {
		var t = this.__data__, r = n(t, e);
		return r < 0 ? void 0 : t[r][1];
	}
	t.exports = r;
})), mT = /* @__PURE__ */ o(((e, t) => {
	var n = dT();
	function r(e) {
		return n(this.__data__, e) > -1;
	}
	t.exports = r;
})), hT = /* @__PURE__ */ o(((e, t) => {
	var n = dT();
	function r(e, t) {
		var r = this.__data__, i = n(r, e);
		return i < 0 ? (++this.size, r.push([e, t])) : r[i][1] = t, this;
	}
	t.exports = r;
})), gT = /* @__PURE__ */ o(((e, t) => {
	var n = lT(), r = fT(), i = pT(), a = mT(), o = hT();
	function s(e) {
		var t = -1, n = e == null ? 0 : e.length;
		for (this.clear(); ++t < n;) {
			var r = e[t];
			this.set(r[0], r[1]);
		}
	}
	s.prototype.clear = n, s.prototype.delete = r, s.prototype.get = i, s.prototype.has = a, s.prototype.set = o, t.exports = s;
})), _T = /* @__PURE__ */ o(((e, t) => {
	var n = gT();
	function r() {
		this.__data__ = new n(), this.size = 0;
	}
	t.exports = r;
})), vT = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = this.__data__, n = t.delete(e);
		return this.size = t.size, n;
	}
	t.exports = n;
})), yT = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return this.__data__.get(e);
	}
	t.exports = n;
})), bT = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return this.__data__.has(e);
	}
	t.exports = n;
})), xT = /* @__PURE__ */ o(((e, t) => {
	t.exports = typeof global == "object" && global && global.Object === Object && global;
})), ST = /* @__PURE__ */ o(((e, t) => {
	var n = xT(), r = typeof self == "object" && self && self.Object === Object && self;
	t.exports = n || r || Function("return this")();
})), CT = /* @__PURE__ */ o(((e, t) => {
	t.exports = ST().Symbol;
})), wT = /* @__PURE__ */ o(((e, t) => {
	var n = CT(), r = Object.prototype, i = r.hasOwnProperty, a = r.toString, o = n ? n.toStringTag : void 0;
	function s(e) {
		var t = i.call(e, o), n = e[o];
		try {
			e[o] = void 0;
			var r = !0;
		} catch {}
		var s = a.call(e);
		return r && (t ? e[o] = n : delete e[o]), s;
	}
	t.exports = s;
})), TT = /* @__PURE__ */ o(((e, t) => {
	var n = Object.prototype.toString;
	function r(e) {
		return n.call(e);
	}
	t.exports = r;
})), ET = /* @__PURE__ */ o(((e, t) => {
	var n = CT(), r = wT(), i = TT(), a = "[object Null]", o = "[object Undefined]", s = n ? n.toStringTag : void 0;
	function c(e) {
		return e == null ? e === void 0 ? o : a : s && s in Object(e) ? r(e) : i(e);
	}
	t.exports = c;
})), DT = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = typeof e;
		return e != null && (t == "object" || t == "function");
	}
	t.exports = n;
})), OT = /* @__PURE__ */ o(((e, t) => {
	var n = ET(), r = DT(), i = "[object AsyncFunction]", a = "[object Function]", o = "[object GeneratorFunction]", s = "[object Proxy]";
	function c(e) {
		if (!r(e)) return !1;
		var t = n(e);
		return t == a || t == o || t == i || t == s;
	}
	t.exports = c;
})), kT = /* @__PURE__ */ o(((e, t) => {
	t.exports = ST()["__core-js_shared__"];
})), AT = /* @__PURE__ */ o(((e, t) => {
	var n = kT(), r = function() {
		var e = /[^.]+$/.exec(n && n.keys && n.keys.IE_PROTO || "");
		return e ? "Symbol(src)_1." + e : "";
	}();
	function i(e) {
		return !!r && r in e;
	}
	t.exports = i;
})), jT = /* @__PURE__ */ o(((e, t) => {
	var n = Function.prototype.toString;
	function r(e) {
		if (e != null) {
			try {
				return n.call(e);
			} catch {}
			try {
				return e + "";
			} catch {}
		}
		return "";
	}
	t.exports = r;
})), MT = /* @__PURE__ */ o(((e, t) => {
	var n = OT(), r = AT(), i = DT(), a = jT(), o = /[\\^$.*+?()[\]{}|]/g, s = /^\[object .+?Constructor\]$/, c = Function.prototype, l = Object.prototype, u = c.toString, d = l.hasOwnProperty, f = RegExp("^" + u.call(d).replace(o, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
	function p(e) {
		return !i(e) || r(e) ? !1 : (n(e) ? f : s).test(a(e));
	}
	t.exports = p;
})), NT = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return e?.[t];
	}
	t.exports = n;
})), PT = /* @__PURE__ */ o(((e, t) => {
	var n = MT(), r = NT();
	function i(e, t) {
		var i = r(e, t);
		return n(i) ? i : void 0;
	}
	t.exports = i;
})), FT = /* @__PURE__ */ o(((e, t) => {
	t.exports = PT()(ST(), "Map");
})), IT = /* @__PURE__ */ o(((e, t) => {
	t.exports = PT()(Object, "create");
})), LT = /* @__PURE__ */ o(((e, t) => {
	var n = IT();
	function r() {
		this.__data__ = n ? n(null) : {}, this.size = 0;
	}
	t.exports = r;
})), RT = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = this.has(e) && delete this.__data__[e];
		return this.size -= +!!t, t;
	}
	t.exports = n;
})), zT = /* @__PURE__ */ o(((e, t) => {
	var n = IT(), r = "__lodash_hash_undefined__", i = Object.prototype.hasOwnProperty;
	function a(e) {
		var t = this.__data__;
		if (n) {
			var a = t[e];
			return a === r ? void 0 : a;
		}
		return i.call(t, e) ? t[e] : void 0;
	}
	t.exports = a;
})), BT = /* @__PURE__ */ o(((e, t) => {
	var n = IT(), r = Object.prototype.hasOwnProperty;
	function i(e) {
		var t = this.__data__;
		return n ? t[e] !== void 0 : r.call(t, e);
	}
	t.exports = i;
})), VT = /* @__PURE__ */ o(((e, t) => {
	var n = IT(), r = "__lodash_hash_undefined__";
	function i(e, t) {
		var i = this.__data__;
		return this.size += +!this.has(e), i[e] = n && t === void 0 ? r : t, this;
	}
	t.exports = i;
})), HT = /* @__PURE__ */ o(((e, t) => {
	var n = LT(), r = RT(), i = zT(), a = BT(), o = VT();
	function s(e) {
		var t = -1, n = e == null ? 0 : e.length;
		for (this.clear(); ++t < n;) {
			var r = e[t];
			this.set(r[0], r[1]);
		}
	}
	s.prototype.clear = n, s.prototype.delete = r, s.prototype.get = i, s.prototype.has = a, s.prototype.set = o, t.exports = s;
})), UT = /* @__PURE__ */ o(((e, t) => {
	var n = HT(), r = gT(), i = FT();
	function a() {
		this.size = 0, this.__data__ = {
			hash: new n(),
			map: new (i || r)(),
			string: new n()
		};
	}
	t.exports = a;
})), WT = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = typeof e;
		return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
	}
	t.exports = n;
})), GT = /* @__PURE__ */ o(((e, t) => {
	var n = WT();
	function r(e, t) {
		var r = e.__data__;
		return n(t) ? r[typeof t == "string" ? "string" : "hash"] : r.map;
	}
	t.exports = r;
})), KT = /* @__PURE__ */ o(((e, t) => {
	var n = GT();
	function r(e) {
		var t = n(this, e).delete(e);
		return this.size -= +!!t, t;
	}
	t.exports = r;
})), qT = /* @__PURE__ */ o(((e, t) => {
	var n = GT();
	function r(e) {
		return n(this, e).get(e);
	}
	t.exports = r;
})), JT = /* @__PURE__ */ o(((e, t) => {
	var n = GT();
	function r(e) {
		return n(this, e).has(e);
	}
	t.exports = r;
})), YT = /* @__PURE__ */ o(((e, t) => {
	var n = GT();
	function r(e, t) {
		var r = n(this, e), i = r.size;
		return r.set(e, t), this.size += r.size == i ? 0 : 1, this;
	}
	t.exports = r;
})), XT = /* @__PURE__ */ o(((e, t) => {
	var n = UT(), r = KT(), i = qT(), a = JT(), o = YT();
	function s(e) {
		var t = -1, n = e == null ? 0 : e.length;
		for (this.clear(); ++t < n;) {
			var r = e[t];
			this.set(r[0], r[1]);
		}
	}
	s.prototype.clear = n, s.prototype.delete = r, s.prototype.get = i, s.prototype.has = a, s.prototype.set = o, t.exports = s;
})), ZT = /* @__PURE__ */ o(((e, t) => {
	var n = gT(), r = FT(), i = XT(), a = 200;
	function o(e, t) {
		var o = this.__data__;
		if (o instanceof n) {
			var s = o.__data__;
			if (!r || s.length < a - 1) return s.push([e, t]), this.size = ++o.size, this;
			o = this.__data__ = new i(s);
		}
		return o.set(e, t), this.size = o.size, this;
	}
	t.exports = o;
})), QT = /* @__PURE__ */ o(((e, t) => {
	var n = gT(), r = _T(), i = vT(), a = yT(), o = bT(), s = ZT();
	function c(e) {
		var t = this.__data__ = new n(e);
		this.size = t.size;
	}
	c.prototype.clear = r, c.prototype.delete = i, c.prototype.get = a, c.prototype.has = o, c.prototype.set = s, t.exports = c;
})), $T = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		for (var n = -1, r = e == null ? 0 : e.length; ++n < r && t(e[n], n, e) !== !1;);
		return e;
	}
	t.exports = n;
})), eE = /* @__PURE__ */ o(((e, t) => {
	var n = PT();
	t.exports = function() {
		try {
			var e = n(Object, "defineProperty");
			return e({}, "", {}), e;
		} catch {}
	}();
})), tE = /* @__PURE__ */ o(((e, t) => {
	var n = eE();
	function r(e, t, r) {
		t == "__proto__" && n ? n(e, t, {
			configurable: !0,
			enumerable: !0,
			value: r,
			writable: !0
		}) : e[t] = r;
	}
	t.exports = r;
})), nE = /* @__PURE__ */ o(((e, t) => {
	var n = tE(), r = uT(), i = Object.prototype.hasOwnProperty;
	function a(e, t, a) {
		var o = e[t];
		(!(i.call(e, t) && r(o, a)) || a === void 0 && !(t in e)) && n(e, t, a);
	}
	t.exports = a;
})), rE = /* @__PURE__ */ o(((e, t) => {
	var n = nE(), r = tE();
	function i(e, t, i, a) {
		var o = !i;
		i ||= {};
		for (var s = -1, c = t.length; ++s < c;) {
			var l = t[s], u = a ? a(i[l], e[l], l, i, e) : void 0;
			u === void 0 && (u = e[l]), o ? r(i, l, u) : n(i, l, u);
		}
		return i;
	}
	t.exports = i;
})), iE = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		for (var n = -1, r = Array(e); ++n < e;) r[n] = t(n);
		return r;
	}
	t.exports = n;
})), aE = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return typeof e == "object" && !!e;
	}
	t.exports = n;
})), oE = /* @__PURE__ */ o(((e, t) => {
	var n = ET(), r = aE(), i = "[object Arguments]";
	function a(e) {
		return r(e) && n(e) == i;
	}
	t.exports = a;
})), sE = /* @__PURE__ */ o(((e, t) => {
	var n = oE(), r = aE(), i = Object.prototype, a = i.hasOwnProperty, o = i.propertyIsEnumerable;
	t.exports = n(function() {
		return arguments;
	}()) ? n : function(e) {
		return r(e) && a.call(e, "callee") && !o.call(e, "callee");
	};
})), cE = /* @__PURE__ */ o(((e, t) => {
	t.exports = Array.isArray;
})), lE = /* @__PURE__ */ o(((e, t) => {
	function n() {
		return !1;
	}
	t.exports = n;
})), uE = /* @__PURE__ */ o(((e, t) => {
	var n = ST(), r = lE(), i = typeof e == "object" && e && !e.nodeType && e, a = i && typeof t == "object" && t && !t.nodeType && t, o = a && a.exports === i ? n.Buffer : void 0;
	t.exports = (o ? o.isBuffer : void 0) || r;
})), dE = /* @__PURE__ */ o(((e, t) => {
	var n = /^(?:0|[1-9]\d*)$/;
	function r(e, t) {
		var r = typeof e;
		return t ??= 9007199254740991, !!t && (r == "number" || r != "symbol" && n.test(e)) && e > -1 && e % 1 == 0 && e < t;
	}
	t.exports = r;
})), fE = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return typeof e == "number" && e > -1 && e % 1 == 0 && e <= 9007199254740991;
	}
	t.exports = n;
})), pE = /* @__PURE__ */ o(((e, t) => {
	var n = ET(), r = fE(), i = aE(), a = "[object Arguments]", o = "[object Array]", s = "[object Boolean]", c = "[object Date]", l = "[object Error]", u = "[object Function]", d = "[object Map]", f = "[object Number]", p = "[object Object]", m = "[object RegExp]", h = "[object Set]", g = "[object String]", _ = "[object WeakMap]", v = "[object ArrayBuffer]", y = "[object DataView]", b = "[object Float32Array]", x = "[object Float64Array]", S = "[object Int8Array]", C = "[object Int16Array]", w = "[object Int32Array]", T = "[object Uint8Array]", E = "[object Uint8ClampedArray]", D = "[object Uint16Array]", O = "[object Uint32Array]", k = {};
	k[b] = k[x] = k[S] = k[C] = k[w] = k[T] = k[E] = k[D] = k[O] = !0, k[a] = k[o] = k[v] = k[s] = k[y] = k[c] = k[l] = k[u] = k[d] = k[f] = k[p] = k[m] = k[h] = k[g] = k[_] = !1;
	function A(e) {
		return i(e) && r(e.length) && !!k[n(e)];
	}
	t.exports = A;
})), mE = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return function(t) {
			return e(t);
		};
	}
	t.exports = n;
})), hE = /* @__PURE__ */ o(((e, t) => {
	var n = xT(), r = typeof e == "object" && e && !e.nodeType && e, i = r && typeof t == "object" && t && !t.nodeType && t, a = i && i.exports === r && n.process;
	t.exports = function() {
		try {
			return i && i.require && i.require("util").types || a && a.binding && a.binding("util");
		} catch {}
	}();
})), gE = /* @__PURE__ */ o(((e, t) => {
	var n = pE(), r = mE(), i = hE(), a = i && i.isTypedArray;
	t.exports = a ? r(a) : n;
})), _E = /* @__PURE__ */ o(((e, t) => {
	var n = iE(), r = sE(), i = cE(), a = uE(), o = dE(), s = gE(), c = Object.prototype.hasOwnProperty;
	function l(e, t) {
		var l = i(e), u = !l && r(e), d = !l && !u && a(e), f = !l && !u && !d && s(e), p = l || u || d || f, m = p ? n(e.length, String) : [], h = m.length;
		for (var g in e) (t || c.call(e, g)) && !(p && (g == "length" || d && (g == "offset" || g == "parent") || f && (g == "buffer" || g == "byteLength" || g == "byteOffset") || o(g, h))) && m.push(g);
		return m;
	}
	t.exports = l;
})), vE = /* @__PURE__ */ o(((e, t) => {
	var n = Object.prototype;
	function r(e) {
		var t = e && e.constructor;
		return e === (typeof t == "function" && t.prototype || n);
	}
	t.exports = r;
})), yE = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return function(n) {
			return e(t(n));
		};
	}
	t.exports = n;
})), bE = /* @__PURE__ */ o(((e, t) => {
	t.exports = yE()(Object.keys, Object);
})), xE = /* @__PURE__ */ o(((e, t) => {
	var n = vE(), r = bE(), i = Object.prototype.hasOwnProperty;
	function a(e) {
		if (!n(e)) return r(e);
		var t = [];
		for (var a in Object(e)) i.call(e, a) && a != "constructor" && t.push(a);
		return t;
	}
	t.exports = a;
})), SE = /* @__PURE__ */ o(((e, t) => {
	var n = OT(), r = fE();
	function i(e) {
		return e != null && r(e.length) && !n(e);
	}
	t.exports = i;
})), CE = /* @__PURE__ */ o(((e, t) => {
	var n = _E(), r = xE(), i = SE();
	function a(e) {
		return i(e) ? n(e) : r(e);
	}
	t.exports = a;
})), wE = /* @__PURE__ */ o(((e, t) => {
	var n = rE(), r = CE();
	function i(e, t) {
		return e && n(t, r(t), e);
	}
	t.exports = i;
})), TE = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = [];
		if (e != null) for (var n in Object(e)) t.push(n);
		return t;
	}
	t.exports = n;
})), EE = /* @__PURE__ */ o(((e, t) => {
	var n = DT(), r = vE(), i = TE(), a = Object.prototype.hasOwnProperty;
	function o(e) {
		if (!n(e)) return i(e);
		var t = r(e), o = [];
		for (var s in e) (s != "constructor" || !t && a.call(e, s)) && o.push(s);
		return o;
	}
	t.exports = o;
})), DE = /* @__PURE__ */ o(((e, t) => {
	var n = _E(), r = EE(), i = SE();
	function a(e) {
		return i(e) ? n(e, !0) : r(e);
	}
	t.exports = a;
})), OE = /* @__PURE__ */ o(((e, t) => {
	var n = rE(), r = DE();
	function i(e, t) {
		return e && n(t, r(t), e);
	}
	t.exports = i;
})), kE = /* @__PURE__ */ o(((e, t) => {
	var n = ST(), r = typeof e == "object" && e && !e.nodeType && e, i = r && typeof t == "object" && t && !t.nodeType && t, a = i && i.exports === r ? n.Buffer : void 0, o = a ? a.allocUnsafe : void 0;
	function s(e, t) {
		if (t) return e.slice();
		var n = e.length, r = o ? o(n) : new e.constructor(n);
		return e.copy(r), r;
	}
	t.exports = s;
})), AE = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		var n = -1, r = e.length;
		for (t ||= Array(r); ++n < r;) t[n] = e[n];
		return t;
	}
	t.exports = n;
})), jE = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		for (var n = -1, r = e == null ? 0 : e.length, i = 0, a = []; ++n < r;) {
			var o = e[n];
			t(o, n, e) && (a[i++] = o);
		}
		return a;
	}
	t.exports = n;
})), ME = /* @__PURE__ */ o(((e, t) => {
	function n() {
		return [];
	}
	t.exports = n;
})), NE = /* @__PURE__ */ o(((e, t) => {
	var n = jE(), r = ME(), i = Object.prototype.propertyIsEnumerable, a = Object.getOwnPropertySymbols;
	t.exports = a ? function(e) {
		return e == null ? [] : (e = Object(e), n(a(e), function(t) {
			return i.call(e, t);
		}));
	} : r;
})), PE = /* @__PURE__ */ o(((e, t) => {
	var n = rE(), r = NE();
	function i(e, t) {
		return n(e, r(e), t);
	}
	t.exports = i;
})), FE = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		for (var n = -1, r = t.length, i = e.length; ++n < r;) e[i + n] = t[n];
		return e;
	}
	t.exports = n;
})), IE = /* @__PURE__ */ o(((e, t) => {
	t.exports = yE()(Object.getPrototypeOf, Object);
})), LE = /* @__PURE__ */ o(((e, t) => {
	var n = FE(), r = IE(), i = NE(), a = ME();
	t.exports = Object.getOwnPropertySymbols ? function(e) {
		for (var t = []; e;) n(t, i(e)), e = r(e);
		return t;
	} : a;
})), RE = /* @__PURE__ */ o(((e, t) => {
	var n = rE(), r = LE();
	function i(e, t) {
		return n(e, r(e), t);
	}
	t.exports = i;
})), zE = /* @__PURE__ */ o(((e, t) => {
	var n = FE(), r = cE();
	function i(e, t, i) {
		var a = t(e);
		return r(e) ? a : n(a, i(e));
	}
	t.exports = i;
})), BE = /* @__PURE__ */ o(((e, t) => {
	var n = zE(), r = NE(), i = CE();
	function a(e) {
		return n(e, i, r);
	}
	t.exports = a;
})), VE = /* @__PURE__ */ o(((e, t) => {
	var n = zE(), r = LE(), i = DE();
	function a(e) {
		return n(e, i, r);
	}
	t.exports = a;
})), HE = /* @__PURE__ */ o(((e, t) => {
	t.exports = PT()(ST(), "DataView");
})), UE = /* @__PURE__ */ o(((e, t) => {
	t.exports = PT()(ST(), "Promise");
})), WE = /* @__PURE__ */ o(((e, t) => {
	t.exports = PT()(ST(), "Set");
})), GE = /* @__PURE__ */ o(((e, t) => {
	t.exports = PT()(ST(), "WeakMap");
})), KE = /* @__PURE__ */ o(((e, t) => {
	var n = HE(), r = FT(), i = UE(), a = WE(), o = GE(), s = ET(), c = jT(), l = "[object Map]", u = "[object Object]", d = "[object Promise]", f = "[object Set]", p = "[object WeakMap]", m = "[object DataView]", h = c(n), g = c(r), _ = c(i), v = c(a), y = c(o), b = s;
	(n && b(new n(/* @__PURE__ */ new ArrayBuffer(1))) != m || r && b(new r()) != l || i && b(i.resolve()) != d || a && b(new a()) != f || o && b(new o()) != p) && (b = function(e) {
		var t = s(e), n = t == u ? e.constructor : void 0, r = n ? c(n) : "";
		if (r) switch (r) {
			case h: return m;
			case g: return l;
			case _: return d;
			case v: return f;
			case y: return p;
		}
		return t;
	}), t.exports = b;
})), qE = /* @__PURE__ */ o(((e, t) => {
	var n = Object.prototype.hasOwnProperty;
	function r(e) {
		var t = e.length, r = new e.constructor(t);
		return t && typeof e[0] == "string" && n.call(e, "index") && (r.index = e.index, r.input = e.input), r;
	}
	t.exports = r;
})), JE = /* @__PURE__ */ o(((e, t) => {
	t.exports = ST().Uint8Array;
})), YE = /* @__PURE__ */ o(((e, t) => {
	var n = JE();
	function r(e) {
		var t = new e.constructor(e.byteLength);
		return new n(t).set(new n(e)), t;
	}
	t.exports = r;
})), XE = /* @__PURE__ */ o(((e, t) => {
	var n = YE();
	function r(e, t) {
		var r = t ? n(e.buffer) : e.buffer;
		return new e.constructor(r, e.byteOffset, e.byteLength);
	}
	t.exports = r;
})), ZE = /* @__PURE__ */ o(((e, t) => {
	var n = /\w*$/;
	function r(e) {
		var t = new e.constructor(e.source, n.exec(e));
		return t.lastIndex = e.lastIndex, t;
	}
	t.exports = r;
})), QE = /* @__PURE__ */ o(((e, t) => {
	var n = CT(), r = n ? n.prototype : void 0, i = r ? r.valueOf : void 0;
	function a(e) {
		return i ? Object(i.call(e)) : {};
	}
	t.exports = a;
})), $E = /* @__PURE__ */ o(((e, t) => {
	var n = YE();
	function r(e, t) {
		var r = t ? n(e.buffer) : e.buffer;
		return new e.constructor(r, e.byteOffset, e.length);
	}
	t.exports = r;
})), eD = /* @__PURE__ */ o(((e, t) => {
	var n = YE(), r = XE(), i = ZE(), a = QE(), o = $E(), s = "[object Boolean]", c = "[object Date]", l = "[object Map]", u = "[object Number]", d = "[object RegExp]", f = "[object Set]", p = "[object String]", m = "[object Symbol]", h = "[object ArrayBuffer]", g = "[object DataView]", _ = "[object Float32Array]", v = "[object Float64Array]", y = "[object Int8Array]", b = "[object Int16Array]", x = "[object Int32Array]", S = "[object Uint8Array]", C = "[object Uint8ClampedArray]", w = "[object Uint16Array]", T = "[object Uint32Array]";
	function E(e, t, E) {
		var D = e.constructor;
		switch (t) {
			case h: return n(e);
			case s:
			case c: return new D(+e);
			case g: return r(e, E);
			case _:
			case v:
			case y:
			case b:
			case x:
			case S:
			case C:
			case w:
			case T: return o(e, E);
			case l: return new D();
			case u:
			case p: return new D(e);
			case d: return i(e);
			case f: return new D();
			case m: return a(e);
		}
	}
	t.exports = E;
})), tD = /* @__PURE__ */ o(((e, t) => {
	var n = DT(), r = Object.create;
	t.exports = function() {
		function e() {}
		return function(t) {
			if (!n(t)) return {};
			if (r) return r(t);
			e.prototype = t;
			var i = new e();
			return e.prototype = void 0, i;
		};
	}();
})), nD = /* @__PURE__ */ o(((e, t) => {
	var n = tD(), r = IE(), i = vE();
	function a(e) {
		return typeof e.constructor == "function" && !i(e) ? n(r(e)) : {};
	}
	t.exports = a;
})), rD = /* @__PURE__ */ o(((e, t) => {
	var n = KE(), r = aE(), i = "[object Map]";
	function a(e) {
		return r(e) && n(e) == i;
	}
	t.exports = a;
})), iD = /* @__PURE__ */ o(((e, t) => {
	var n = rD(), r = mE(), i = hE(), a = i && i.isMap;
	t.exports = a ? r(a) : n;
})), aD = /* @__PURE__ */ o(((e, t) => {
	var n = KE(), r = aE(), i = "[object Set]";
	function a(e) {
		return r(e) && n(e) == i;
	}
	t.exports = a;
})), oD = /* @__PURE__ */ o(((e, t) => {
	var n = aD(), r = mE(), i = hE(), a = i && i.isSet;
	t.exports = a ? r(a) : n;
})), sD = /* @__PURE__ */ o(((e, t) => {
	var n = QT(), r = $T(), i = nE(), a = wE(), o = OE(), s = kE(), c = AE(), l = PE(), u = RE(), d = BE(), f = VE(), p = KE(), m = qE(), h = eD(), g = nD(), _ = cE(), v = uE(), y = iD(), b = DT(), x = oD(), S = CE(), C = DE(), w = 1, T = 2, E = 4, D = "[object Arguments]", O = "[object Array]", k = "[object Boolean]", A = "[object Date]", ee = "[object Error]", te = "[object Function]", ne = "[object GeneratorFunction]", j = "[object Map]", re = "[object Number]", ie = "[object Object]", ae = "[object RegExp]", oe = "[object Set]", se = "[object String]", M = "[object Symbol]", ce = "[object WeakMap]", le = "[object ArrayBuffer]", N = "[object DataView]", P = "[object Float32Array]", ue = "[object Float64Array]", de = "[object Int8Array]", fe = "[object Int16Array]", pe = "[object Int32Array]", me = "[object Uint8Array]", he = "[object Uint8ClampedArray]", F = "[object Uint16Array]", ge = "[object Uint32Array]", I = {};
	I[D] = I[O] = I[le] = I[N] = I[k] = I[A] = I[P] = I[ue] = I[de] = I[fe] = I[pe] = I[j] = I[re] = I[ie] = I[ae] = I[oe] = I[se] = I[M] = I[me] = I[he] = I[F] = I[ge] = !0, I[ee] = I[te] = I[ce] = !1;
	function _e(e, t, O, k, A, ee) {
		var j, re = t & w, ae = t & T, oe = t & E;
		if (O && (j = A ? O(e, k, A, ee) : O(e)), j !== void 0) return j;
		if (!b(e)) return e;
		var se = _(e);
		if (se) {
			if (j = m(e), !re) return c(e, j);
		} else {
			var M = p(e), ce = M == te || M == ne;
			if (v(e)) return s(e, re);
			if (M == ie || M == D || ce && !A) {
				if (j = ae || ce ? {} : g(e), !re) return ae ? u(e, o(j, e)) : l(e, a(j, e));
			} else {
				if (!I[M]) return A ? e : {};
				j = h(e, M, re);
			}
		}
		ee ||= new n();
		var le = ee.get(e);
		if (le) return le;
		ee.set(e, j), x(e) ? e.forEach(function(n) {
			j.add(_e(n, t, O, n, e, ee));
		}) : y(e) && e.forEach(function(n, r) {
			j.set(r, _e(n, t, O, r, e, ee));
		});
		var N = se ? void 0 : (oe ? ae ? f : d : ae ? C : S)(e);
		return r(N || e, function(n, r) {
			N && (r = n, n = e[r]), i(j, r, _e(n, t, O, r, e, ee));
		}), j;
	}
	t.exports = _e;
})), cD = /* @__PURE__ */ o(((e, t) => {
	var n = sD(), r = 4;
	function i(e) {
		return n(e, r);
	}
	t.exports = i;
})), lD = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return function() {
			return e;
		};
	}
	t.exports = n;
})), uD = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return function(t, n, r) {
			for (var i = -1, a = Object(t), o = r(t), s = o.length; s--;) {
				var c = o[e ? s : ++i];
				if (n(a[c], c, a) === !1) break;
			}
			return t;
		};
	}
	t.exports = n;
})), dD = /* @__PURE__ */ o(((e, t) => {
	t.exports = uD()();
})), fD = /* @__PURE__ */ o(((e, t) => {
	var n = dD(), r = CE();
	function i(e, t) {
		return e && n(e, t, r);
	}
	t.exports = i;
})), pD = /* @__PURE__ */ o(((e, t) => {
	var n = SE();
	function r(e, t) {
		return function(r, i) {
			if (r == null) return r;
			if (!n(r)) return e(r, i);
			for (var a = r.length, o = t ? a : -1, s = Object(r); (t ? o-- : ++o < a) && i(s[o], o, s) !== !1;);
			return r;
		};
	}
	t.exports = r;
})), mD = /* @__PURE__ */ o(((e, t) => {
	var n = fD();
	t.exports = pD()(n);
})), hD = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return e;
	}
	t.exports = n;
})), gD = /* @__PURE__ */ o(((e, t) => {
	var n = hD();
	function r(e) {
		return typeof e == "function" ? e : n;
	}
	t.exports = r;
})), _D = /* @__PURE__ */ o(((e, t) => {
	var n = $T(), r = mD(), i = gD(), a = cE();
	function o(e, t) {
		return (a(e) ? n : r)(e, i(t));
	}
	t.exports = o;
})), vD = /* @__PURE__ */ o(((e, t) => {
	t.exports = _D();
})), yD = /* @__PURE__ */ o(((e, t) => {
	var n = mD();
	function r(e, t) {
		var r = [];
		return n(e, function(e, n, i) {
			t(e, n, i) && r.push(e);
		}), r;
	}
	t.exports = r;
})), bD = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return this.__data__.set(e, "__lodash_hash_undefined__"), this;
	}
	t.exports = n;
})), xD = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return this.__data__.has(e);
	}
	t.exports = n;
})), SD = /* @__PURE__ */ o(((e, t) => {
	var n = XT(), r = bD(), i = xD();
	function a(e) {
		var t = -1, r = e == null ? 0 : e.length;
		for (this.__data__ = new n(); ++t < r;) this.add(e[t]);
	}
	a.prototype.add = a.prototype.push = r, a.prototype.has = i, t.exports = a;
})), CD = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		for (var n = -1, r = e == null ? 0 : e.length; ++n < r;) if (t(e[n], n, e)) return !0;
		return !1;
	}
	t.exports = n;
})), wD = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return e.has(t);
	}
	t.exports = n;
})), TD = /* @__PURE__ */ o(((e, t) => {
	var n = SD(), r = CD(), i = wD(), a = 1, o = 2;
	function s(e, t, s, c, l, u) {
		var d = s & a, f = e.length, p = t.length;
		if (f != p && !(d && p > f)) return !1;
		var m = u.get(e), h = u.get(t);
		if (m && h) return m == t && h == e;
		var g = -1, _ = !0, v = s & o ? new n() : void 0;
		for (u.set(e, t), u.set(t, e); ++g < f;) {
			var y = e[g], b = t[g];
			if (c) var x = d ? c(b, y, g, t, e, u) : c(y, b, g, e, t, u);
			if (x !== void 0) {
				if (x) continue;
				_ = !1;
				break;
			}
			if (v) {
				if (!r(t, function(e, t) {
					if (!i(v, t) && (y === e || l(y, e, s, c, u))) return v.push(t);
				})) {
					_ = !1;
					break;
				}
			} else if (!(y === b || l(y, b, s, c, u))) {
				_ = !1;
				break;
			}
		}
		return u.delete(e), u.delete(t), _;
	}
	t.exports = s;
})), ED = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = -1, n = Array(e.size);
		return e.forEach(function(e, r) {
			n[++t] = [r, e];
		}), n;
	}
	t.exports = n;
})), DD = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = -1, n = Array(e.size);
		return e.forEach(function(e) {
			n[++t] = e;
		}), n;
	}
	t.exports = n;
})), OD = /* @__PURE__ */ o(((e, t) => {
	var n = CT(), r = JE(), i = uT(), a = TD(), o = ED(), s = DD(), c = 1, l = 2, u = "[object Boolean]", d = "[object Date]", f = "[object Error]", p = "[object Map]", m = "[object Number]", h = "[object RegExp]", g = "[object Set]", _ = "[object String]", v = "[object Symbol]", y = "[object ArrayBuffer]", b = "[object DataView]", x = n ? n.prototype : void 0, S = x ? x.valueOf : void 0;
	function C(e, t, n, x, C, w, T) {
		switch (n) {
			case b:
				if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset) return !1;
				e = e.buffer, t = t.buffer;
			case y: return !(e.byteLength != t.byteLength || !w(new r(e), new r(t)));
			case u:
			case d:
			case m: return i(+e, +t);
			case f: return e.name == t.name && e.message == t.message;
			case h:
			case _: return e == t + "";
			case p: var E = o;
			case g:
				var D = x & c;
				if (E ||= s, e.size != t.size && !D) return !1;
				var O = T.get(e);
				if (O) return O == t;
				x |= l, T.set(e, t);
				var k = a(E(e), E(t), x, C, w, T);
				return T.delete(e), k;
			case v: if (S) return S.call(e) == S.call(t);
		}
		return !1;
	}
	t.exports = C;
})), kD = /* @__PURE__ */ o(((e, t) => {
	var n = BE(), r = 1, i = Object.prototype.hasOwnProperty;
	function a(e, t, a, o, s, c) {
		var l = a & r, u = n(e), d = u.length;
		if (d != n(t).length && !l) return !1;
		for (var f = d; f--;) {
			var p = u[f];
			if (!(l ? p in t : i.call(t, p))) return !1;
		}
		var m = c.get(e), h = c.get(t);
		if (m && h) return m == t && h == e;
		var g = !0;
		c.set(e, t), c.set(t, e);
		for (var _ = l; ++f < d;) {
			p = u[f];
			var v = e[p], y = t[p];
			if (o) var b = l ? o(y, v, p, t, e, c) : o(v, y, p, e, t, c);
			if (!(b === void 0 ? v === y || s(v, y, a, o, c) : b)) {
				g = !1;
				break;
			}
			_ ||= p == "constructor";
		}
		if (g && !_) {
			var x = e.constructor, S = t.constructor;
			x != S && "constructor" in e && "constructor" in t && !(typeof x == "function" && x instanceof x && typeof S == "function" && S instanceof S) && (g = !1);
		}
		return c.delete(e), c.delete(t), g;
	}
	t.exports = a;
})), AD = /* @__PURE__ */ o(((e, t) => {
	var n = QT(), r = TD(), i = OD(), a = kD(), o = KE(), s = cE(), c = uE(), l = gE(), u = 1, d = "[object Arguments]", f = "[object Array]", p = "[object Object]", m = Object.prototype.hasOwnProperty;
	function h(e, t, h, g, _, v) {
		var y = s(e), b = s(t), x = y ? f : o(e), S = b ? f : o(t);
		x = x == d ? p : x, S = S == d ? p : S;
		var C = x == p, w = S == p, T = x == S;
		if (T && c(e)) {
			if (!c(t)) return !1;
			y = !0, C = !1;
		}
		if (T && !C) return v ||= new n(), y || l(e) ? r(e, t, h, g, _, v) : i(e, t, x, h, g, _, v);
		if (!(h & u)) {
			var E = C && m.call(e, "__wrapped__"), D = w && m.call(t, "__wrapped__");
			if (E || D) {
				var O = E ? e.value() : e, k = D ? t.value() : t;
				return v ||= new n(), _(O, k, h, g, v);
			}
		}
		return T ? (v ||= new n(), a(e, t, h, g, _, v)) : !1;
	}
	t.exports = h;
})), jD = /* @__PURE__ */ o(((e, t) => {
	var n = AD(), r = aE();
	function i(e, t, a, o, s) {
		return e === t ? !0 : e == null || t == null || !r(e) && !r(t) ? e !== e && t !== t : n(e, t, a, o, i, s);
	}
	t.exports = i;
})), MD = /* @__PURE__ */ o(((e, t) => {
	var n = QT(), r = jD(), i = 1, a = 2;
	function o(e, t, o, s) {
		var c = o.length, l = c, u = !s;
		if (e == null) return !l;
		for (e = Object(e); c--;) {
			var d = o[c];
			if (u && d[2] ? d[1] !== e[d[0]] : !(d[0] in e)) return !1;
		}
		for (; ++c < l;) {
			d = o[c];
			var f = d[0], p = e[f], m = d[1];
			if (u && d[2]) {
				if (p === void 0 && !(f in e)) return !1;
			} else {
				var h = new n();
				if (s) var g = s(p, m, f, e, t, h);
				if (!(g === void 0 ? r(m, p, i | a, s, h) : g)) return !1;
			}
		}
		return !0;
	}
	t.exports = o;
})), ND = /* @__PURE__ */ o(((e, t) => {
	var n = DT();
	function r(e) {
		return e === e && !n(e);
	}
	t.exports = r;
})), PD = /* @__PURE__ */ o(((e, t) => {
	var n = ND(), r = CE();
	function i(e) {
		for (var t = r(e), i = t.length; i--;) {
			var a = t[i], o = e[a];
			t[i] = [
				a,
				o,
				n(o)
			];
		}
		return t;
	}
	t.exports = i;
})), FD = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return function(n) {
			return n != null && n[e] === t && (t !== void 0 || e in Object(n));
		};
	}
	t.exports = n;
})), ID = /* @__PURE__ */ o(((e, t) => {
	var n = MD(), r = PD(), i = FD();
	function a(e) {
		var t = r(e);
		return t.length == 1 && t[0][2] ? i(t[0][0], t[0][1]) : function(r) {
			return r === e || n(r, e, t);
		};
	}
	t.exports = a;
})), LD = /* @__PURE__ */ o(((e, t) => {
	var n = ET(), r = aE(), i = "[object Symbol]";
	function a(e) {
		return typeof e == "symbol" || r(e) && n(e) == i;
	}
	t.exports = a;
})), RD = /* @__PURE__ */ o(((e, t) => {
	var n = cE(), r = LD(), i = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, a = /^\w*$/;
	function o(e, t) {
		if (n(e)) return !1;
		var o = typeof e;
		return o == "number" || o == "symbol" || o == "boolean" || e == null || r(e) ? !0 : a.test(e) || !i.test(e) || t != null && e in Object(t);
	}
	t.exports = o;
})), zD = /* @__PURE__ */ o(((e, t) => {
	var n = XT(), r = "Expected a function";
	function i(e, t) {
		if (typeof e != "function" || t != null && typeof t != "function") throw TypeError(r);
		var a = function() {
			var n = arguments, r = t ? t.apply(this, n) : n[0], i = a.cache;
			if (i.has(r)) return i.get(r);
			var o = e.apply(this, n);
			return a.cache = i.set(r, o) || i, o;
		};
		return a.cache = new (i.Cache || n)(), a;
	}
	i.Cache = n, t.exports = i;
})), BD = /* @__PURE__ */ o(((e, t) => {
	var n = zD(), r = 500;
	function i(e) {
		var t = n(e, function(e) {
			return i.size === r && i.clear(), e;
		}), i = t.cache;
		return t;
	}
	t.exports = i;
})), VD = /* @__PURE__ */ o(((e, t) => {
	var n = BD(), r = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, i = /\\(\\)?/g;
	t.exports = n(function(e) {
		var t = [];
		return e.charCodeAt(0) === 46 && t.push(""), e.replace(r, function(e, n, r, a) {
			t.push(r ? a.replace(i, "$1") : n || e);
		}), t;
	});
})), HD = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		for (var n = -1, r = e == null ? 0 : e.length, i = Array(r); ++n < r;) i[n] = t(e[n], n, e);
		return i;
	}
	t.exports = n;
})), UD = /* @__PURE__ */ o(((e, t) => {
	var n = CT(), r = HD(), i = cE(), a = LD(), o = 1 / 0, s = n ? n.prototype : void 0, c = s ? s.toString : void 0;
	function l(e) {
		if (typeof e == "string") return e;
		if (i(e)) return r(e, l) + "";
		if (a(e)) return c ? c.call(e) : "";
		var t = e + "";
		return t == "0" && 1 / e == -o ? "-0" : t;
	}
	t.exports = l;
})), WD = /* @__PURE__ */ o(((e, t) => {
	var n = UD();
	function r(e) {
		return e == null ? "" : n(e);
	}
	t.exports = r;
})), GD = /* @__PURE__ */ o(((e, t) => {
	var n = cE(), r = RD(), i = VD(), a = WD();
	function o(e, t) {
		return n(e) ? e : r(e, t) ? [e] : i(a(e));
	}
	t.exports = o;
})), KD = /* @__PURE__ */ o(((e, t) => {
	var n = LD(), r = 1 / 0;
	function i(e) {
		if (typeof e == "string" || n(e)) return e;
		var t = e + "";
		return t == "0" && 1 / e == -r ? "-0" : t;
	}
	t.exports = i;
})), qD = /* @__PURE__ */ o(((e, t) => {
	var n = GD(), r = KD();
	function i(e, t) {
		t = n(t, e);
		for (var i = 0, a = t.length; e != null && i < a;) e = e[r(t[i++])];
		return i && i == a ? e : void 0;
	}
	t.exports = i;
})), JD = /* @__PURE__ */ o(((e, t) => {
	var n = qD();
	function r(e, t, r) {
		var i = e == null ? void 0 : n(e, t);
		return i === void 0 ? r : i;
	}
	t.exports = r;
})), YD = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return e != null && t in Object(e);
	}
	t.exports = n;
})), XD = /* @__PURE__ */ o(((e, t) => {
	var n = GD(), r = sE(), i = cE(), a = dE(), o = fE(), s = KD();
	function c(e, t, c) {
		t = n(t, e);
		for (var l = -1, u = t.length, d = !1; ++l < u;) {
			var f = s(t[l]);
			if (!(d = e != null && c(e, f))) break;
			e = e[f];
		}
		return d || ++l != u ? d : (u = e == null ? 0 : e.length, !!u && o(u) && a(f, u) && (i(e) || r(e)));
	}
	t.exports = c;
})), ZD = /* @__PURE__ */ o(((e, t) => {
	var n = YD(), r = XD();
	function i(e, t) {
		return e != null && r(e, t, n);
	}
	t.exports = i;
})), QD = /* @__PURE__ */ o(((e, t) => {
	var n = jD(), r = JD(), i = ZD(), a = RD(), o = ND(), s = FD(), c = KD(), l = 1, u = 2;
	function d(e, t) {
		return a(e) && o(t) ? s(c(e), t) : function(a) {
			var o = r(a, e);
			return o === void 0 && o === t ? i(a, e) : n(t, o, l | u);
		};
	}
	t.exports = d;
})), $D = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return function(t) {
			return t?.[e];
		};
	}
	t.exports = n;
})), eO = /* @__PURE__ */ o(((e, t) => {
	var n = qD();
	function r(e) {
		return function(t) {
			return n(t, e);
		};
	}
	t.exports = r;
})), tO = /* @__PURE__ */ o(((e, t) => {
	var n = $D(), r = eO(), i = RD(), a = KD();
	function o(e) {
		return i(e) ? n(a(e)) : r(e);
	}
	t.exports = o;
})), nO = /* @__PURE__ */ o(((e, t) => {
	var n = ID(), r = QD(), i = hD(), a = cE(), o = tO();
	function s(e) {
		return typeof e == "function" ? e : e == null ? i : typeof e == "object" ? a(e) ? r(e[0], e[1]) : n(e) : o(e);
	}
	t.exports = s;
})), rO = /* @__PURE__ */ o(((e, t) => {
	var n = jE(), r = yD(), i = nO(), a = cE();
	function o(e, t) {
		return (a(e) ? n : r)(e, i(t, 3));
	}
	t.exports = o;
})), iO = /* @__PURE__ */ o(((e, t) => {
	var n = Object.prototype.hasOwnProperty;
	function r(e, t) {
		return e != null && n.call(e, t);
	}
	t.exports = r;
})), aO = /* @__PURE__ */ o(((e, t) => {
	var n = iO(), r = XD();
	function i(e, t) {
		return e != null && r(e, t, n);
	}
	t.exports = i;
})), oO = /* @__PURE__ */ o(((e, t) => {
	var n = xE(), r = KE(), i = sE(), a = cE(), o = SE(), s = uE(), c = vE(), l = gE(), u = "[object Map]", d = "[object Set]", f = Object.prototype.hasOwnProperty;
	function p(e) {
		if (e == null) return !0;
		if (o(e) && (a(e) || typeof e == "string" || typeof e.splice == "function" || s(e) || l(e) || i(e))) return !e.length;
		var t = r(e);
		if (t == u || t == d) return !e.size;
		if (c(e)) return !n(e).length;
		for (var p in e) if (f.call(e, p)) return !1;
		return !0;
	}
	t.exports = p;
})), sO = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return e === void 0;
	}
	t.exports = n;
})), cO = /* @__PURE__ */ o(((e, t) => {
	var n = mD(), r = SE();
	function i(e, t) {
		var i = -1, a = r(e) ? Array(e.length) : [];
		return n(e, function(e, n, r) {
			a[++i] = t(e, n, r);
		}), a;
	}
	t.exports = i;
})), lO = /* @__PURE__ */ o(((e, t) => {
	var n = HD(), r = nO(), i = cO(), a = cE();
	function o(e, t) {
		return (a(e) ? n : i)(e, r(t, 3));
	}
	t.exports = o;
})), uO = /* @__PURE__ */ o(((e, t) => {
	function n(e, t, n, r) {
		var i = -1, a = e == null ? 0 : e.length;
		for (r && a && (n = e[++i]); ++i < a;) n = t(n, e[i], i, e);
		return n;
	}
	t.exports = n;
})), dO = /* @__PURE__ */ o(((e, t) => {
	function n(e, t, n, r, i) {
		return i(e, function(e, i, a) {
			n = r ? (r = !1, e) : t(n, e, i, a);
		}), n;
	}
	t.exports = n;
})), fO = /* @__PURE__ */ o(((e, t) => {
	var n = uO(), r = mD(), i = nO(), a = dO(), o = cE();
	function s(e, t, s) {
		var c = o(e) ? n : a, l = arguments.length < 3;
		return c(e, i(t, 4), s, l, r);
	}
	t.exports = s;
})), pO = /* @__PURE__ */ o(((e, t) => {
	var n = ET(), r = cE(), i = aE(), a = "[object String]";
	function o(e) {
		return typeof e == "string" || !r(e) && i(e) && n(e) == a;
	}
	t.exports = o;
})), mO = /* @__PURE__ */ o(((e, t) => {
	t.exports = $D()("length");
})), hO = /* @__PURE__ */ o(((e, t) => {
	var n = RegExp("[\\u200d\\ud800-\\udfff\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff\\ufe0e\\ufe0f]");
	function r(e) {
		return n.test(e);
	}
	t.exports = r;
})), gO = /* @__PURE__ */ o(((e, t) => {
	var n = "\\ud800-\\udfff", r = "\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff", i = "\\ufe0e\\ufe0f", a = "[" + n + "]", o = "[" + r + "]", s = "\\ud83c[\\udffb-\\udfff]", c = "(?:" + o + "|" + s + ")", l = "[^" + n + "]", u = "(?:\\ud83c[\\udde6-\\uddff]){2}", d = "[\\ud800-\\udbff][\\udc00-\\udfff]", f = "\\u200d", p = c + "?", m = "[" + i + "]?", h = "(?:" + f + "(?:" + [
		l,
		u,
		d
	].join("|") + ")" + m + p + ")*", g = m + p + h, _ = "(?:" + [
		l + o + "?",
		o,
		u,
		d,
		a
	].join("|") + ")", v = RegExp(s + "(?=" + s + ")|" + _ + g, "g");
	function y(e) {
		for (var t = v.lastIndex = 0; v.test(e);) ++t;
		return t;
	}
	t.exports = y;
})), _O = /* @__PURE__ */ o(((e, t) => {
	var n = mO(), r = hO(), i = gO();
	function a(e) {
		return r(e) ? i(e) : n(e);
	}
	t.exports = a;
})), vO = /* @__PURE__ */ o(((e, t) => {
	var n = xE(), r = KE(), i = SE(), a = pO(), o = _O(), s = "[object Map]", c = "[object Set]";
	function l(e) {
		if (e == null) return 0;
		if (i(e)) return a(e) ? o(e) : e.length;
		var t = r(e);
		return t == s || t == c ? e.size : n(e).length;
	}
	t.exports = l;
})), yO = /* @__PURE__ */ o(((e, t) => {
	var n = $T(), r = tD(), i = fD(), a = nO(), o = IE(), s = cE(), c = uE(), l = OT(), u = DT(), d = gE();
	function f(e, t, f) {
		var p = s(e), m = p || c(e) || d(e);
		if (t = a(t, 4), f == null) {
			var h = e && e.constructor;
			f = m ? p ? new h() : [] : u(e) && l(h) ? r(o(e)) : {};
		}
		return (m ? n : i)(e, function(e, n, r) {
			return t(f, e, n, r);
		}), f;
	}
	t.exports = f;
})), bO = /* @__PURE__ */ o(((e, t) => {
	var n = CT(), r = sE(), i = cE(), a = n ? n.isConcatSpreadable : void 0;
	function o(e) {
		return i(e) || r(e) || !!(a && e && e[a]);
	}
	t.exports = o;
})), xO = /* @__PURE__ */ o(((e, t) => {
	var n = FE(), r = bO();
	function i(e, t, a, o, s) {
		var c = -1, l = e.length;
		for (a ||= r, s ||= []; ++c < l;) {
			var u = e[c];
			t > 0 && a(u) ? t > 1 ? i(u, t - 1, a, o, s) : n(s, u) : o || (s[s.length] = u);
		}
		return s;
	}
	t.exports = i;
})), SO = /* @__PURE__ */ o(((e, t) => {
	function n(e, t, n) {
		switch (n.length) {
			case 0: return e.call(t);
			case 1: return e.call(t, n[0]);
			case 2: return e.call(t, n[0], n[1]);
			case 3: return e.call(t, n[0], n[1], n[2]);
		}
		return e.apply(t, n);
	}
	t.exports = n;
})), CO = /* @__PURE__ */ o(((e, t) => {
	var n = SO(), r = Math.max;
	function i(e, t, i) {
		return t = r(t === void 0 ? e.length - 1 : t, 0), function() {
			for (var a = arguments, o = -1, s = r(a.length - t, 0), c = Array(s); ++o < s;) c[o] = a[t + o];
			o = -1;
			for (var l = Array(t + 1); ++o < t;) l[o] = a[o];
			return l[t] = i(c), n(e, this, l);
		};
	}
	t.exports = i;
})), wO = /* @__PURE__ */ o(((e, t) => {
	var n = lD(), r = eE(), i = hD();
	t.exports = r ? function(e, t) {
		return r(e, "toString", {
			configurable: !0,
			enumerable: !1,
			value: n(t),
			writable: !0
		});
	} : i;
})), TO = /* @__PURE__ */ o(((e, t) => {
	var n = Date.now;
	function r(e) {
		var t = 0, r = 0;
		return function() {
			var i = n(), a = 16 - (i - r);
			if (r = i, a > 0) {
				if (++t >= 800) return arguments[0];
			} else t = 0;
			return e.apply(void 0, arguments);
		};
	}
	t.exports = r;
})), EO = /* @__PURE__ */ o(((e, t) => {
	var n = wO();
	t.exports = TO()(n);
})), DO = /* @__PURE__ */ o(((e, t) => {
	var n = hD(), r = CO(), i = EO();
	function a(e, t) {
		return i(r(e, t, n), e + "");
	}
	t.exports = a;
})), OO = /* @__PURE__ */ o(((e, t) => {
	function n(e, t, n, r) {
		for (var i = e.length, a = n + (r ? 1 : -1); r ? a-- : ++a < i;) if (t(e[a], a, e)) return a;
		return -1;
	}
	t.exports = n;
})), kO = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return e !== e;
	}
	t.exports = n;
})), AO = /* @__PURE__ */ o(((e, t) => {
	function n(e, t, n) {
		for (var r = n - 1, i = e.length; ++r < i;) if (e[r] === t) return r;
		return -1;
	}
	t.exports = n;
})), jO = /* @__PURE__ */ o(((e, t) => {
	var n = OO(), r = kO(), i = AO();
	function a(e, t, a) {
		return t === t ? i(e, t, a) : n(e, r, a);
	}
	t.exports = a;
})), MO = /* @__PURE__ */ o(((e, t) => {
	var n = jO();
	function r(e, t) {
		return !!(e != null && e.length) && n(e, t, 0) > -1;
	}
	t.exports = r;
})), NO = /* @__PURE__ */ o(((e, t) => {
	function n(e, t, n) {
		for (var r = -1, i = e == null ? 0 : e.length; ++r < i;) if (n(t, e[r])) return !0;
		return !1;
	}
	t.exports = n;
})), PO = /* @__PURE__ */ o(((e, t) => {
	function n() {}
	t.exports = n;
})), FO = /* @__PURE__ */ o(((e, t) => {
	var n = WE(), r = PO(), i = DD();
	t.exports = n && 1 / i(new n([, -0]))[1] == 1 / 0 ? function(e) {
		return new n(e);
	} : r;
})), IO = /* @__PURE__ */ o(((e, t) => {
	var n = SD(), r = MO(), i = NO(), a = wD(), o = FO(), s = DD(), c = 200;
	function l(e, t, l) {
		var u = -1, d = r, f = e.length, p = !0, m = [], h = m;
		if (l) p = !1, d = i;
		else if (f >= c) {
			var g = t ? null : o(e);
			if (g) return s(g);
			p = !1, d = a, h = new n();
		} else h = t ? [] : m;
		outer: for (; ++u < f;) {
			var _ = e[u], v = t ? t(_) : _;
			if (_ = l || _ !== 0 ? _ : 0, p && v === v) {
				for (var y = h.length; y--;) if (h[y] === v) continue outer;
				t && h.push(v), m.push(_);
			} else d(h, v, l) || (h !== m && h.push(v), m.push(_));
		}
		return m;
	}
	t.exports = l;
})), LO = /* @__PURE__ */ o(((e, t) => {
	var n = SE(), r = aE();
	function i(e) {
		return r(e) && n(e);
	}
	t.exports = i;
})), RO = /* @__PURE__ */ o(((e, t) => {
	var n = xO(), r = DO(), i = IO(), a = LO();
	t.exports = r(function(e) {
		return i(n(e, 1, a, !0));
	});
})), zO = /* @__PURE__ */ o(((e, t) => {
	var n = HD();
	function r(e, t) {
		return n(t, function(t) {
			return e[t];
		});
	}
	t.exports = r;
})), BO = /* @__PURE__ */ o(((e, t) => {
	var n = zO(), r = CE();
	function i(e) {
		return e == null ? [] : n(e, r(e));
	}
	t.exports = i;
})), VO = /* @__PURE__ */ o(((e, t) => {
	var n;
	if (typeof u == "function") try {
		n = {
			clone: cD(),
			constant: lD(),
			each: vD(),
			filter: rO(),
			has: aO(),
			isArray: cE(),
			isEmpty: oO(),
			isFunction: OT(),
			isUndefined: sO(),
			keys: CE(),
			map: lO(),
			reduce: fO(),
			size: vO(),
			transform: yO(),
			union: RO(),
			values: BO()
		};
	} catch {}
	n ||= window._, t.exports = n;
})), HO = /* @__PURE__ */ o(((e, t) => {
	var n = VO();
	t.exports = o;
	var r = "\0", i = "\0", a = "";
	function o(e) {
		this._isDirected = !n.has(e, "directed") || e.directed, this._isMultigraph = n.has(e, "multigraph") ? e.multigraph : !1, this._isCompound = n.has(e, "compound") ? e.compound : !1, this._label = void 0, this._defaultNodeLabelFn = n.constant(void 0), this._defaultEdgeLabelFn = n.constant(void 0), this._nodes = {}, this._isCompound && (this._parent = {}, this._children = {}, this._children[i] = {}), this._in = {}, this._preds = {}, this._out = {}, this._sucs = {}, this._edgeObjs = {}, this._edgeLabels = {};
	}
	o.prototype._nodeCount = 0, o.prototype._edgeCount = 0, o.prototype.isDirected = function() {
		return this._isDirected;
	}, o.prototype.isMultigraph = function() {
		return this._isMultigraph;
	}, o.prototype.isCompound = function() {
		return this._isCompound;
	}, o.prototype.setGraph = function(e) {
		return this._label = e, this;
	}, o.prototype.graph = function() {
		return this._label;
	}, o.prototype.setDefaultNodeLabel = function(e) {
		return n.isFunction(e) || (e = n.constant(e)), this._defaultNodeLabelFn = e, this;
	}, o.prototype.nodeCount = function() {
		return this._nodeCount;
	}, o.prototype.nodes = function() {
		return n.keys(this._nodes);
	}, o.prototype.sources = function() {
		var e = this;
		return n.filter(this.nodes(), function(t) {
			return n.isEmpty(e._in[t]);
		});
	}, o.prototype.sinks = function() {
		var e = this;
		return n.filter(this.nodes(), function(t) {
			return n.isEmpty(e._out[t]);
		});
	}, o.prototype.setNodes = function(e, t) {
		var r = arguments, i = this;
		return n.each(e, function(e) {
			r.length > 1 ? i.setNode(e, t) : i.setNode(e);
		}), this;
	}, o.prototype.setNode = function(e, t) {
		return n.has(this._nodes, e) ? (arguments.length > 1 && (this._nodes[e] = t), this) : (this._nodes[e] = arguments.length > 1 ? t : this._defaultNodeLabelFn(e), this._isCompound && (this._parent[e] = i, this._children[e] = {}, this._children[i][e] = !0), this._in[e] = {}, this._preds[e] = {}, this._out[e] = {}, this._sucs[e] = {}, ++this._nodeCount, this);
	}, o.prototype.node = function(e) {
		return this._nodes[e];
	}, o.prototype.hasNode = function(e) {
		return n.has(this._nodes, e);
	}, o.prototype.removeNode = function(e) {
		var t = this;
		if (n.has(this._nodes, e)) {
			var r = function(e) {
				t.removeEdge(t._edgeObjs[e]);
			};
			delete this._nodes[e], this._isCompound && (this._removeFromParentsChildList(e), delete this._parent[e], n.each(this.children(e), function(e) {
				t.setParent(e);
			}), delete this._children[e]), n.each(n.keys(this._in[e]), r), delete this._in[e], delete this._preds[e], n.each(n.keys(this._out[e]), r), delete this._out[e], delete this._sucs[e], --this._nodeCount;
		}
		return this;
	}, o.prototype.setParent = function(e, t) {
		if (!this._isCompound) throw Error("Cannot set parent in a non-compound graph");
		if (n.isUndefined(t)) t = i;
		else {
			t += "";
			for (var r = t; !n.isUndefined(r); r = this.parent(r)) if (r === e) throw Error("Setting " + t + " as parent of " + e + " would create a cycle");
			this.setNode(t);
		}
		return this.setNode(e), this._removeFromParentsChildList(e), this._parent[e] = t, this._children[t][e] = !0, this;
	}, o.prototype._removeFromParentsChildList = function(e) {
		delete this._children[this._parent[e]][e];
	}, o.prototype.parent = function(e) {
		if (this._isCompound) {
			var t = this._parent[e];
			if (t !== i) return t;
		}
	}, o.prototype.children = function(e) {
		if (n.isUndefined(e) && (e = i), this._isCompound) {
			var t = this._children[e];
			if (t) return n.keys(t);
		} else if (e === i) return this.nodes();
		else if (this.hasNode(e)) return [];
	}, o.prototype.predecessors = function(e) {
		var t = this._preds[e];
		if (t) return n.keys(t);
	}, o.prototype.successors = function(e) {
		var t = this._sucs[e];
		if (t) return n.keys(t);
	}, o.prototype.neighbors = function(e) {
		var t = this.predecessors(e);
		if (t) return n.union(t, this.successors(e));
	}, o.prototype.isLeaf = function(e) {
		return (this.isDirected() ? this.successors(e) : this.neighbors(e)).length === 0;
	}, o.prototype.filterNodes = function(e) {
		var t = new this.constructor({
			directed: this._isDirected,
			multigraph: this._isMultigraph,
			compound: this._isCompound
		});
		t.setGraph(this.graph());
		var r = this;
		n.each(this._nodes, function(n, r) {
			e(r) && t.setNode(r, n);
		}), n.each(this._edgeObjs, function(e) {
			t.hasNode(e.v) && t.hasNode(e.w) && t.setEdge(e, r.edge(e));
		});
		var i = {};
		function a(e) {
			var n = r.parent(e);
			return n === void 0 || t.hasNode(n) ? (i[e] = n, n) : n in i ? i[n] : a(n);
		}
		return this._isCompound && n.each(t.nodes(), function(e) {
			t.setParent(e, a(e));
		}), t;
	}, o.prototype.setDefaultEdgeLabel = function(e) {
		return n.isFunction(e) || (e = n.constant(e)), this._defaultEdgeLabelFn = e, this;
	}, o.prototype.edgeCount = function() {
		return this._edgeCount;
	}, o.prototype.edges = function() {
		return n.values(this._edgeObjs);
	}, o.prototype.setPath = function(e, t) {
		var r = this, i = arguments;
		return n.reduce(e, function(e, n) {
			return i.length > 1 ? r.setEdge(e, n, t) : r.setEdge(e, n), n;
		}), this;
	}, o.prototype.setEdge = function() {
		var e, t, r, i, a = !1, o = arguments[0];
		typeof o == "object" && o && "v" in o ? (e = o.v, t = o.w, r = o.name, arguments.length === 2 && (i = arguments[1], a = !0)) : (e = o, t = arguments[1], r = arguments[3], arguments.length > 2 && (i = arguments[2], a = !0)), e = "" + e, t = "" + t, n.isUndefined(r) || (r = "" + r);
		var c = l(this._isDirected, e, t, r);
		if (n.has(this._edgeLabels, c)) return a && (this._edgeLabels[c] = i), this;
		if (!n.isUndefined(r) && !this._isMultigraph) throw Error("Cannot set a named edge when isMultigraph = false");
		this.setNode(e), this.setNode(t), this._edgeLabels[c] = a ? i : this._defaultEdgeLabelFn(e, t, r);
		var d = u(this._isDirected, e, t, r);
		return e = d.v, t = d.w, Object.freeze(d), this._edgeObjs[c] = d, s(this._preds[t], e), s(this._sucs[e], t), this._in[t][c] = d, this._out[e][c] = d, this._edgeCount++, this;
	}, o.prototype.edge = function(e, t, n) {
		var r = arguments.length === 1 ? d(this._isDirected, arguments[0]) : l(this._isDirected, e, t, n);
		return this._edgeLabels[r];
	}, o.prototype.hasEdge = function(e, t, r) {
		var i = arguments.length === 1 ? d(this._isDirected, arguments[0]) : l(this._isDirected, e, t, r);
		return n.has(this._edgeLabels, i);
	}, o.prototype.removeEdge = function(e, t, n) {
		var r = arguments.length === 1 ? d(this._isDirected, arguments[0]) : l(this._isDirected, e, t, n), i = this._edgeObjs[r];
		return i && (e = i.v, t = i.w, delete this._edgeLabels[r], delete this._edgeObjs[r], c(this._preds[t], e), c(this._sucs[e], t), delete this._in[t][r], delete this._out[e][r], this._edgeCount--), this;
	}, o.prototype.inEdges = function(e, t) {
		var r = this._in[e];
		if (r) {
			var i = n.values(r);
			return t ? n.filter(i, function(e) {
				return e.v === t;
			}) : i;
		}
	}, o.prototype.outEdges = function(e, t) {
		var r = this._out[e];
		if (r) {
			var i = n.values(r);
			return t ? n.filter(i, function(e) {
				return e.w === t;
			}) : i;
		}
	}, o.prototype.nodeEdges = function(e, t) {
		var n = this.inEdges(e, t);
		if (n) return n.concat(this.outEdges(e, t));
	};
	function s(e, t) {
		e[t] ? e[t]++ : e[t] = 1;
	}
	function c(e, t) {
		--e[t] || delete e[t];
	}
	function l(e, t, i, o) {
		var s = "" + t, c = "" + i;
		if (!e && s > c) {
			var l = s;
			s = c, c = l;
		}
		return s + a + c + a + (n.isUndefined(o) ? r : o);
	}
	function u(e, t, n, r) {
		var i = "" + t, a = "" + n;
		if (!e && i > a) {
			var o = i;
			i = a, a = o;
		}
		var s = {
			v: i,
			w: a
		};
		return r && (s.name = r), s;
	}
	function d(e, t) {
		return l(e, t.v, t.w, t.name);
	}
})), UO = /* @__PURE__ */ o(((e, t) => {
	t.exports = "2.1.8";
})), WO = /* @__PURE__ */ o(((e, t) => {
	t.exports = {
		Graph: HO(),
		version: UO()
	};
})), GO = /* @__PURE__ */ o(((e, t) => {
	var n = VO(), r = HO();
	t.exports = {
		write: i,
		read: s
	};
	function i(e) {
		var t = {
			options: {
				directed: e.isDirected(),
				multigraph: e.isMultigraph(),
				compound: e.isCompound()
			},
			nodes: a(e),
			edges: o(e)
		};
		return n.isUndefined(e.graph()) || (t.value = n.clone(e.graph())), t;
	}
	function a(e) {
		return n.map(e.nodes(), function(t) {
			var r = e.node(t), i = e.parent(t), a = { v: t };
			return n.isUndefined(r) || (a.value = r), n.isUndefined(i) || (a.parent = i), a;
		});
	}
	function o(e) {
		return n.map(e.edges(), function(t) {
			var r = e.edge(t), i = {
				v: t.v,
				w: t.w
			};
			return n.isUndefined(t.name) || (i.name = t.name), n.isUndefined(r) || (i.value = r), i;
		});
	}
	function s(e) {
		var t = new r(e.options).setGraph(e.value);
		return n.each(e.nodes, function(e) {
			t.setNode(e.v, e.value), e.parent && t.setParent(e.v, e.parent);
		}), n.each(e.edges, function(e) {
			t.setEdge({
				v: e.v,
				w: e.w,
				name: e.name
			}, e.value);
		}), t;
	}
})), KO = /* @__PURE__ */ o(((e, t) => {
	var n = VO();
	t.exports = r;
	function r(e) {
		var t = {}, r = [], i;
		function a(r) {
			n.has(t, r) || (t[r] = !0, i.push(r), n.each(e.successors(r), a), n.each(e.predecessors(r), a));
		}
		return n.each(e.nodes(), function(e) {
			i = [], a(e), i.length && r.push(i);
		}), r;
	}
})), qO = /* @__PURE__ */ o(((e, t) => {
	var n = VO();
	t.exports = r;
	function r() {
		this._arr = [], this._keyIndices = {};
	}
	r.prototype.size = function() {
		return this._arr.length;
	}, r.prototype.keys = function() {
		return this._arr.map(function(e) {
			return e.key;
		});
	}, r.prototype.has = function(e) {
		return n.has(this._keyIndices, e);
	}, r.prototype.priority = function(e) {
		var t = this._keyIndices[e];
		if (t !== void 0) return this._arr[t].priority;
	}, r.prototype.min = function() {
		if (this.size() === 0) throw Error("Queue underflow");
		return this._arr[0].key;
	}, r.prototype.add = function(e, t) {
		var r = this._keyIndices;
		if (e = String(e), !n.has(r, e)) {
			var i = this._arr, a = i.length;
			return r[e] = a, i.push({
				key: e,
				priority: t
			}), this._decrease(a), !0;
		}
		return !1;
	}, r.prototype.removeMin = function() {
		this._swap(0, this._arr.length - 1);
		var e = this._arr.pop();
		return delete this._keyIndices[e.key], this._heapify(0), e.key;
	}, r.prototype.decrease = function(e, t) {
		var n = this._keyIndices[e];
		if (t > this._arr[n].priority) throw Error("New priority is greater than current priority. Key: " + e + " Old: " + this._arr[n].priority + " New: " + t);
		this._arr[n].priority = t, this._decrease(n);
	}, r.prototype._heapify = function(e) {
		var t = this._arr, n = 2 * e, r = n + 1, i = e;
		n < t.length && (i = t[n].priority < t[i].priority ? n : i, r < t.length && (i = t[r].priority < t[i].priority ? r : i), i !== e && (this._swap(e, i), this._heapify(i)));
	}, r.prototype._decrease = function(e) {
		for (var t = this._arr, n = t[e].priority, r; e !== 0 && (r = e >> 1, !(t[r].priority < n));) this._swap(e, r), e = r;
	}, r.prototype._swap = function(e, t) {
		var n = this._arr, r = this._keyIndices, i = n[e], a = n[t];
		n[e] = a, n[t] = i, r[a.key] = e, r[i.key] = t;
	};
})), JO = /* @__PURE__ */ o(((e, t) => {
	var n = VO(), r = qO();
	t.exports = a;
	var i = n.constant(1);
	function a(e, t, n, r) {
		return o(e, String(t), n || i, r || function(t) {
			return e.outEdges(t);
		});
	}
	function o(e, t, n, i) {
		var a = {}, o = new r(), s, c, l = function(e) {
			var t = e.v === s ? e.w : e.v, r = a[t], i = n(e), l = c.distance + i;
			if (i < 0) throw Error("dijkstra does not allow negative edge weights. Bad edge: " + e + " Weight: " + i);
			l < r.distance && (r.distance = l, r.predecessor = s, o.decrease(t, l));
		};
		for (e.nodes().forEach(function(e) {
			var n = e === t ? 0 : Infinity;
			a[e] = { distance: n }, o.add(e, n);
		}); o.size() > 0 && (s = o.removeMin(), c = a[s], c.distance !== Infinity);) i(s).forEach(l);
		return a;
	}
})), YO = /* @__PURE__ */ o(((e, t) => {
	var n = JO(), r = VO();
	t.exports = i;
	function i(e, t, i) {
		return r.transform(e.nodes(), function(r, a) {
			r[a] = n(e, a, t, i);
		}, {});
	}
})), XO = /* @__PURE__ */ o(((e, t) => {
	var n = VO();
	t.exports = r;
	function r(e) {
		var t = 0, r = [], i = {}, a = [];
		function o(s) {
			var c = i[s] = {
				onStack: !0,
				lowlink: t,
				index: t++
			};
			if (r.push(s), e.successors(s).forEach(function(e) {
				n.has(i, e) ? i[e].onStack && (c.lowlink = Math.min(c.lowlink, i[e].index)) : (o(e), c.lowlink = Math.min(c.lowlink, i[e].lowlink));
			}), c.lowlink === c.index) {
				var l = [], u;
				do
					u = r.pop(), i[u].onStack = !1, l.push(u);
				while (s !== u);
				a.push(l);
			}
		}
		return e.nodes().forEach(function(e) {
			n.has(i, e) || o(e);
		}), a;
	}
})), ZO = /* @__PURE__ */ o(((e, t) => {
	var n = VO(), r = XO();
	t.exports = i;
	function i(e) {
		return n.filter(r(e), function(t) {
			return t.length > 1 || t.length === 1 && e.hasEdge(t[0], t[0]);
		});
	}
})), QO = /* @__PURE__ */ o(((e, t) => {
	var n = VO();
	t.exports = i;
	var r = n.constant(1);
	function i(e, t, n) {
		return a(e, t || r, n || function(t) {
			return e.outEdges(t);
		});
	}
	function a(e, t, n) {
		var r = {}, i = e.nodes();
		return i.forEach(function(e) {
			r[e] = {}, r[e][e] = { distance: 0 }, i.forEach(function(t) {
				e !== t && (r[e][t] = { distance: Infinity });
			}), n(e).forEach(function(n) {
				var i = n.v === e ? n.w : n.v, a = t(n);
				r[e][i] = {
					distance: a,
					predecessor: e
				};
			});
		}), i.forEach(function(e) {
			var t = r[e];
			i.forEach(function(n) {
				var a = r[n];
				i.forEach(function(n) {
					var r = a[e], i = t[n], o = a[n], s = r.distance + i.distance;
					s < o.distance && (o.distance = s, o.predecessor = i.predecessor);
				});
			});
		}), r;
	}
})), $O = /* @__PURE__ */ o(((e, t) => {
	var n = VO();
	t.exports = r, r.CycleException = i;
	function r(e) {
		var t = {}, r = {}, a = [];
		function o(s) {
			if (n.has(r, s)) throw new i();
			n.has(t, s) || (r[s] = !0, t[s] = !0, n.each(e.predecessors(s), o), delete r[s], a.push(s));
		}
		if (n.each(e.sinks(), o), n.size(t) !== e.nodeCount()) throw new i();
		return a;
	}
	function i() {}
	i.prototype = /* @__PURE__ */ Error();
})), ek = /* @__PURE__ */ o(((e, t) => {
	var n = $O();
	t.exports = r;
	function r(e) {
		try {
			n(e);
		} catch (e) {
			if (e instanceof n.CycleException) return !1;
			throw e;
		}
		return !0;
	}
})), tk = /* @__PURE__ */ o(((e, t) => {
	var n = VO();
	t.exports = r;
	function r(e, t, r) {
		n.isArray(t) || (t = [t]);
		var a = (e.isDirected() ? e.successors : e.neighbors).bind(e), o = [], s = {};
		return n.each(t, function(t) {
			if (!e.hasNode(t)) throw Error("Graph does not have node: " + t);
			i(e, t, r === "post", s, a, o);
		}), o;
	}
	function i(e, t, r, a, o, s) {
		n.has(a, t) || (a[t] = !0, r || s.push(t), n.each(o(t), function(t) {
			i(e, t, r, a, o, s);
		}), r && s.push(t));
	}
})), nk = /* @__PURE__ */ o(((e, t) => {
	var n = tk();
	t.exports = r;
	function r(e, t) {
		return n(e, t, "post");
	}
})), rk = /* @__PURE__ */ o(((e, t) => {
	var n = tk();
	t.exports = r;
	function r(e, t) {
		return n(e, t, "pre");
	}
})), ik = /* @__PURE__ */ o(((e, t) => {
	var n = VO(), r = HO(), i = qO();
	t.exports = a;
	function a(e, t) {
		var a = new r(), o = {}, s = new i(), c;
		function l(e) {
			var n = e.v === c ? e.w : e.v, r = s.priority(n);
			if (r !== void 0) {
				var i = t(e);
				i < r && (o[n] = c, s.decrease(n, i));
			}
		}
		if (e.nodeCount() === 0) return a;
		n.each(e.nodes(), function(e) {
			s.add(e, Infinity), a.setNode(e);
		}), s.decrease(e.nodes()[0], 0);
		for (var u = !1; s.size() > 0;) {
			if (c = s.removeMin(), n.has(o, c)) a.setEdge(c, o[c]);
			else if (u) throw Error("Input graph is not connected: " + e);
			else u = !0;
			e.nodeEdges(c).forEach(l);
		}
		return a;
	}
})), ak = /* @__PURE__ */ o(((e, t) => {
	t.exports = {
		components: KO(),
		dijkstra: JO(),
		dijkstraAll: YO(),
		findCycles: ZO(),
		floydWarshall: QO(),
		isAcyclic: ek(),
		postorder: nk(),
		preorder: rk(),
		prim: ik(),
		tarjan: XO(),
		topsort: $O()
	};
})), ok = /* @__PURE__ */ o(((e, t) => {
	var n = WO();
	t.exports = {
		Graph: n.Graph,
		json: GO(),
		alg: ak(),
		version: n.version
	};
})), sk = /* @__PURE__ */ o(((e, t) => {
	var n;
	if (typeof u == "function") try {
		n = ok();
	} catch {}
	n ||= window.graphlib, t.exports = n;
})), ck = /* @__PURE__ */ o(((e, t) => {
	var n = sD(), r = 1, i = 4;
	function a(e) {
		return n(e, r | i);
	}
	t.exports = a;
})), lk = /* @__PURE__ */ o(((e, t) => {
	var n = uT(), r = SE(), i = dE(), a = DT();
	function o(e, t, o) {
		if (!a(o)) return !1;
		var s = typeof t;
		return (s == "number" ? r(o) && i(t, o.length) : s == "string" && t in o) ? n(o[t], e) : !1;
	}
	t.exports = o;
})), uk = /* @__PURE__ */ o(((e, t) => {
	var n = DO(), r = uT(), i = lk(), a = DE(), o = Object.prototype, s = o.hasOwnProperty;
	t.exports = n(function(e, t) {
		e = Object(e);
		var n = -1, c = t.length, l = c > 2 ? t[2] : void 0;
		for (l && i(t[0], t[1], l) && (c = 1); ++n < c;) for (var u = t[n], d = a(u), f = -1, p = d.length; ++f < p;) {
			var m = d[f], h = e[m];
			(h === void 0 || r(h, o[m]) && !s.call(e, m)) && (e[m] = u[m]);
		}
		return e;
	});
})), dk = /* @__PURE__ */ o(((e, t) => {
	var n = nO(), r = SE(), i = CE();
	function a(e) {
		return function(t, a, o) {
			var s = Object(t);
			if (!r(t)) {
				var c = n(a, 3);
				t = i(t), a = function(e) {
					return c(s[e], e, s);
				};
			}
			var l = e(t, a, o);
			return l > -1 ? s[c ? t[l] : l] : void 0;
		};
	}
	t.exports = a;
})), fk = /* @__PURE__ */ o(((e, t) => {
	var n = /\s/;
	function r(e) {
		for (var t = e.length; t-- && n.test(e.charAt(t)););
		return t;
	}
	t.exports = r;
})), pk = /* @__PURE__ */ o(((e, t) => {
	var n = fk(), r = /^\s+/;
	function i(e) {
		return e && e.slice(0, n(e) + 1).replace(r, "");
	}
	t.exports = i;
})), mk = /* @__PURE__ */ o(((e, t) => {
	var n = pk(), r = DT(), i = LD(), a = NaN, o = /^[-+]0x[0-9a-f]+$/i, s = /^0b[01]+$/i, c = /^0o[0-7]+$/i, l = parseInt;
	function u(e) {
		if (typeof e == "number") return e;
		if (i(e)) return a;
		if (r(e)) {
			var t = typeof e.valueOf == "function" ? e.valueOf() : e;
			e = r(t) ? t + "" : t;
		}
		if (typeof e != "string") return e === 0 ? e : +e;
		e = n(e);
		var u = s.test(e);
		return u || c.test(e) ? l(e.slice(2), u ? 2 : 8) : o.test(e) ? a : +e;
	}
	t.exports = u;
})), hk = /* @__PURE__ */ o(((e, t) => {
	var n = mk(), r = 1 / 0, i = 17976931348623157e292;
	function a(e) {
		return e ? (e = n(e), e === r || e === -r ? (e < 0 ? -1 : 1) * i : e === e ? e : 0) : e === 0 ? e : 0;
	}
	t.exports = a;
})), gk = /* @__PURE__ */ o(((e, t) => {
	var n = hk();
	function r(e) {
		var t = n(e), r = t % 1;
		return t === t ? r ? t - r : t : 0;
	}
	t.exports = r;
})), _k = /* @__PURE__ */ o(((e, t) => {
	var n = OO(), r = nO(), i = gk(), a = Math.max;
	function o(e, t, o) {
		var s = e == null ? 0 : e.length;
		if (!s) return -1;
		var c = o == null ? 0 : i(o);
		return c < 0 && (c = a(s + c, 0)), n(e, r(t, 3), c);
	}
	t.exports = o;
})), vk = /* @__PURE__ */ o(((e, t) => {
	t.exports = dk()(_k());
})), yk = /* @__PURE__ */ o(((e, t) => {
	var n = xO();
	function r(e) {
		return e != null && e.length ? n(e, 1) : [];
	}
	t.exports = r;
})), bk = /* @__PURE__ */ o(((e, t) => {
	var n = dD(), r = gD(), i = DE();
	function a(e, t) {
		return e == null ? e : n(e, r(t), i);
	}
	t.exports = a;
})), xk = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = e == null ? 0 : e.length;
		return t ? e[t - 1] : void 0;
	}
	t.exports = n;
})), Sk = /* @__PURE__ */ o(((e, t) => {
	var n = tE(), r = fD(), i = nO();
	function a(e, t) {
		var a = {};
		return t = i(t, 3), r(e, function(e, r, i) {
			n(a, r, t(e, r, i));
		}), a;
	}
	t.exports = a;
})), Ck = /* @__PURE__ */ o(((e, t) => {
	var n = LD();
	function r(e, t, r) {
		for (var i = -1, a = e.length; ++i < a;) {
			var o = e[i], s = t(o);
			if (s != null && (c === void 0 ? s === s && !n(s) : r(s, c))) var c = s, l = o;
		}
		return l;
	}
	t.exports = r;
})), wk = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return e > t;
	}
	t.exports = n;
})), Tk = /* @__PURE__ */ o(((e, t) => {
	var n = Ck(), r = wk(), i = hD();
	function a(e) {
		return e && e.length ? n(e, i, r) : void 0;
	}
	t.exports = a;
})), Ek = /* @__PURE__ */ o(((e, t) => {
	var n = tE(), r = uT();
	function i(e, t, i) {
		(i !== void 0 && !r(e[t], i) || i === void 0 && !(t in e)) && n(e, t, i);
	}
	t.exports = i;
})), Dk = /* @__PURE__ */ o(((e, t) => {
	var n = ET(), r = IE(), i = aE(), a = "[object Object]", o = Function.prototype, s = Object.prototype, c = o.toString, l = s.hasOwnProperty, u = c.call(Object);
	function d(e) {
		if (!i(e) || n(e) != a) return !1;
		var t = r(e);
		if (t === null) return !0;
		var o = l.call(t, "constructor") && t.constructor;
		return typeof o == "function" && o instanceof o && c.call(o) == u;
	}
	t.exports = d;
})), Ok = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		if ((t !== "constructor" || typeof e[t] != "function") && t != "__proto__") return e[t];
	}
	t.exports = n;
})), kk = /* @__PURE__ */ o(((e, t) => {
	var n = rE(), r = DE();
	function i(e) {
		return n(e, r(e));
	}
	t.exports = i;
})), Ak = /* @__PURE__ */ o(((e, t) => {
	var n = Ek(), r = kE(), i = $E(), a = AE(), o = nD(), s = sE(), c = cE(), l = LO(), u = uE(), d = OT(), f = DT(), p = Dk(), m = gE(), h = Ok(), g = kk();
	function _(e, t, _, v, y, b, x) {
		var S = h(e, _), C = h(t, _), w = x.get(C);
		if (w) n(e, _, w);
		else {
			var T = b ? b(S, C, _ + "", e, t, x) : void 0, E = T === void 0;
			if (E) {
				var D = c(C), O = !D && u(C), k = !D && !O && m(C);
				T = C, D || O || k ? c(S) ? T = S : l(S) ? T = a(S) : O ? (E = !1, T = r(C, !0)) : k ? (E = !1, T = i(C, !0)) : T = [] : p(C) || s(C) ? (T = S, s(S) ? T = g(S) : (!f(S) || d(S)) && (T = o(C))) : E = !1;
			}
			E && (x.set(C, T), y(T, C, v, b, x), x.delete(C)), n(e, _, T);
		}
	}
	t.exports = _;
})), jk = /* @__PURE__ */ o(((e, t) => {
	var n = QT(), r = Ek(), i = dD(), a = Ak(), o = DT(), s = DE(), c = Ok();
	function l(e, t, u, d, f) {
		e !== t && i(t, function(i, s) {
			if (f ||= new n(), o(i)) a(e, t, s, u, l, d, f);
			else {
				var p = d ? d(c(e, s), i, s + "", e, t, f) : void 0;
				p === void 0 && (p = i), r(e, s, p);
			}
		}, s);
	}
	t.exports = l;
})), Mk = /* @__PURE__ */ o(((e, t) => {
	var n = DO(), r = lk();
	function i(e) {
		return n(function(t, n) {
			var i = -1, a = n.length, o = a > 1 ? n[a - 1] : void 0, s = a > 2 ? n[2] : void 0;
			for (o = e.length > 3 && typeof o == "function" ? (a--, o) : void 0, s && r(n[0], n[1], s) && (o = a < 3 ? void 0 : o, a = 1), t = Object(t); ++i < a;) {
				var c = n[i];
				c && e(t, c, i, o);
			}
			return t;
		});
	}
	t.exports = i;
})), Nk = /* @__PURE__ */ o(((e, t) => {
	var n = jk();
	t.exports = Mk()(function(e, t, r) {
		n(e, t, r);
	});
})), Pk = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return e < t;
	}
	t.exports = n;
})), Fk = /* @__PURE__ */ o(((e, t) => {
	var n = Ck(), r = Pk(), i = hD();
	function a(e) {
		return e && e.length ? n(e, i, r) : void 0;
	}
	t.exports = a;
})), Ik = /* @__PURE__ */ o(((e, t) => {
	var n = Ck(), r = nO(), i = Pk();
	function a(e, t) {
		return e && e.length ? n(e, r(t, 2), i) : void 0;
	}
	t.exports = a;
})), Lk = /* @__PURE__ */ o(((e, t) => {
	var n = ST();
	t.exports = function() {
		return n.Date.now();
	};
})), Rk = /* @__PURE__ */ o(((e, t) => {
	var n = nE(), r = GD(), i = dE(), a = DT(), o = KD();
	function s(e, t, s, c) {
		if (!a(e)) return e;
		t = r(t, e);
		for (var l = -1, u = t.length, d = u - 1, f = e; f != null && ++l < u;) {
			var p = o(t[l]), m = s;
			if (p === "__proto__" || p === "constructor" || p === "prototype") return e;
			if (l != d) {
				var h = f[p];
				m = c ? c(h, p, f) : void 0, m === void 0 && (m = a(h) ? h : i(t[l + 1]) ? [] : {});
			}
			n(f, p, m), f = f[p];
		}
		return e;
	}
	t.exports = s;
})), zk = /* @__PURE__ */ o(((e, t) => {
	var n = qD(), r = Rk(), i = GD();
	function a(e, t, a) {
		for (var o = -1, s = t.length, c = {}; ++o < s;) {
			var l = t[o], u = n(e, l);
			a(u, l) && r(c, i(l, e), u);
		}
		return c;
	}
	t.exports = a;
})), Bk = /* @__PURE__ */ o(((e, t) => {
	var n = zk(), r = ZD();
	function i(e, t) {
		return n(e, t, function(t, n) {
			return r(e, n);
		});
	}
	t.exports = i;
})), Vk = /* @__PURE__ */ o(((e, t) => {
	var n = yk(), r = CO(), i = EO();
	function a(e) {
		return i(r(e, void 0, n), e + "");
	}
	t.exports = a;
})), Hk = /* @__PURE__ */ o(((e, t) => {
	var n = Bk();
	t.exports = Vk()(function(e, t) {
		return e == null ? {} : n(e, t);
	});
})), Uk = /* @__PURE__ */ o(((e, t) => {
	var n = Math.ceil, r = Math.max;
	function i(e, t, i, a) {
		for (var o = -1, s = r(n((t - e) / (i || 1)), 0), c = Array(s); s--;) c[a ? s : ++o] = e, e += i;
		return c;
	}
	t.exports = i;
})), Wk = /* @__PURE__ */ o(((e, t) => {
	var n = Uk(), r = lk(), i = hk();
	function a(e) {
		return function(t, a, o) {
			return o && typeof o != "number" && r(t, a, o) && (a = o = void 0), t = i(t), a === void 0 ? (a = t, t = 0) : a = i(a), o = o === void 0 ? t < a ? 1 : -1 : i(o), n(t, a, o, e);
		};
	}
	t.exports = a;
})), Gk = /* @__PURE__ */ o(((e, t) => {
	t.exports = Wk()();
})), Kk = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		var n = e.length;
		for (e.sort(t); n--;) e[n] = e[n].value;
		return e;
	}
	t.exports = n;
})), qk = /* @__PURE__ */ o(((e, t) => {
	var n = LD();
	function r(e, t) {
		if (e !== t) {
			var r = e !== void 0, i = e === null, a = e === e, o = n(e), s = t !== void 0, c = t === null, l = t === t, u = n(t);
			if (!c && !u && !o && e > t || o && s && l && !c && !u || i && s && l || !r && l || !a) return 1;
			if (!i && !o && !u && e < t || u && r && a && !i && !o || c && r && a || !s && a || !l) return -1;
		}
		return 0;
	}
	t.exports = r;
})), Jk = /* @__PURE__ */ o(((e, t) => {
	var n = qk();
	function r(e, t, r) {
		for (var i = -1, a = e.criteria, o = t.criteria, s = a.length, c = r.length; ++i < s;) {
			var l = n(a[i], o[i]);
			if (l) return i >= c ? l : l * (r[i] == "desc" ? -1 : 1);
		}
		return e.index - t.index;
	}
	t.exports = r;
})), Yk = /* @__PURE__ */ o(((e, t) => {
	var n = HD(), r = qD(), i = nO(), a = cO(), o = Kk(), s = mE(), c = Jk(), l = hD(), u = cE();
	function d(e, t, d) {
		t = t.length ? n(t, function(e) {
			return u(e) ? function(t) {
				return r(t, e.length === 1 ? e[0] : e);
			} : e;
		}) : [l];
		var f = -1;
		return t = n(t, s(i)), o(a(e, function(e, r, i) {
			return {
				criteria: n(t, function(t) {
					return t(e);
				}),
				index: ++f,
				value: e
			};
		}), function(e, t) {
			return c(e, t, d);
		});
	}
	t.exports = d;
})), Xk = /* @__PURE__ */ o(((e, t) => {
	var n = xO(), r = Yk(), i = DO(), a = lk();
	t.exports = i(function(e, t) {
		if (e == null) return [];
		var i = t.length;
		return i > 1 && a(e, t[0], t[1]) ? t = [] : i > 2 && a(t[0], t[1], t[2]) && (t = [t[0]]), r(e, n(t, 1), []);
	});
})), Zk = /* @__PURE__ */ o(((e, t) => {
	var n = WD(), r = 0;
	function i(e) {
		var t = ++r;
		return n(e) + t;
	}
	t.exports = i;
})), Qk = /* @__PURE__ */ o(((e, t) => {
	function n(e, t, n) {
		for (var r = -1, i = e.length, a = t.length, o = {}; ++r < i;) {
			var s = r < a ? t[r] : void 0;
			n(o, e[r], s);
		}
		return o;
	}
	t.exports = n;
})), $k = /* @__PURE__ */ o(((e, t) => {
	var n = nE(), r = Qk();
	function i(e, t) {
		return r(e || [], t || [], n);
	}
	t.exports = i;
})), eA = /* @__PURE__ */ o(((e, t) => {
	var n;
	if (typeof u == "function") try {
		n = {
			cloneDeep: ck(),
			constant: lD(),
			defaults: uk(),
			each: vD(),
			filter: rO(),
			find: vk(),
			flatten: yk(),
			forEach: _D(),
			forIn: bk(),
			has: aO(),
			isUndefined: sO(),
			last: xk(),
			map: lO(),
			mapValues: Sk(),
			max: Tk(),
			merge: Nk(),
			min: Fk(),
			minBy: Ik(),
			now: Lk(),
			pick: Hk(),
			range: Gk(),
			reduce: fO(),
			sortBy: Xk(),
			uniqueId: Zk(),
			values: BO(),
			zipObject: $k()
		};
	} catch {}
	n ||= window._, t.exports = n;
})), tA = /* @__PURE__ */ o(((e, t) => {
	t.exports = n;
	function n() {
		var e = {};
		e._next = e._prev = e, this._sentinel = e;
	}
	n.prototype.dequeue = function() {
		var e = this._sentinel, t = e._prev;
		if (t !== e) return r(t), t;
	}, n.prototype.enqueue = function(e) {
		var t = this._sentinel;
		e._prev && e._next && r(e), e._next = t._next, t._next._prev = e, t._next = e, e._prev = t;
	}, n.prototype.toString = function() {
		for (var e = [], t = this._sentinel, n = t._prev; n !== t;) e.push(JSON.stringify(n, i)), n = n._prev;
		return "[" + e.join(", ") + "]";
	};
	function r(e) {
		e._prev._next = e._next, e._next._prev = e._prev, delete e._next, delete e._prev;
	}
	function i(e, t) {
		if (e !== "_next" && e !== "_prev") return t;
	}
})), nA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = sk().Graph, i = tA();
	t.exports = o;
	var a = n.constant(1);
	function o(e, t) {
		if (e.nodeCount() <= 1) return [];
		var r = l(e, t || a), i = s(r.graph, r.buckets, r.zeroIdx);
		return n.flatten(n.map(i, function(t) {
			return e.outEdges(t.v, t.w);
		}), !0);
	}
	function s(e, t, n) {
		for (var r = [], i = t[t.length - 1], a = t[0], o; e.nodeCount();) {
			for (; o = a.dequeue();) c(e, t, n, o);
			for (; o = i.dequeue();) c(e, t, n, o);
			if (e.nodeCount()) {
				for (var s = t.length - 2; s > 0; --s) if (o = t[s].dequeue(), o) {
					r = r.concat(c(e, t, n, o, !0));
					break;
				}
			}
		}
		return r;
	}
	function c(e, t, r, i, a) {
		var o = a ? [] : void 0;
		return n.forEach(e.inEdges(i.v), function(n) {
			var i = e.edge(n), s = e.node(n.v);
			a && o.push({
				v: n.v,
				w: n.w
			}), s.out -= i, u(t, r, s);
		}), n.forEach(e.outEdges(i.v), function(n) {
			var i = e.edge(n), a = n.w, o = e.node(a);
			o.in -= i, u(t, r, o);
		}), e.removeNode(i.v), o;
	}
	function l(e, t) {
		var a = new r(), o = 0, s = 0;
		n.forEach(e.nodes(), function(e) {
			a.setNode(e, {
				v: e,
				in: 0,
				out: 0
			});
		}), n.forEach(e.edges(), function(e) {
			var n = a.edge(e.v, e.w) || 0, r = t(e), i = n + r;
			a.setEdge(e.v, e.w, i), s = Math.max(s, a.node(e.v).out += r), o = Math.max(o, a.node(e.w).in += r);
		});
		var c = n.range(s + o + 3).map(function() {
			return new i();
		}), l = o + 1;
		return n.forEach(a.nodes(), function(e) {
			u(c, l, a.node(e));
		}), {
			graph: a,
			buckets: c,
			zeroIdx: l
		};
	}
	function u(e, t, n) {
		n.out ? n.in ? e[n.out - n.in + t].enqueue(n) : e[e.length - 1].enqueue(n) : e[0].enqueue(n);
	}
})), rA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = nA();
	t.exports = {
		run: i,
		undo: o
	};
	function i(e) {
		var t = e.graph().acyclicer === "greedy" ? r(e, i(e)) : a(e);
		n.forEach(t, function(t) {
			var r = e.edge(t);
			e.removeEdge(t), r.forwardName = t.name, r.reversed = !0, e.setEdge(t.w, t.v, r, n.uniqueId("rev"));
		});
		function i(e) {
			return function(t) {
				return e.edge(t).weight;
			};
		}
	}
	function a(e) {
		var t = [], r = {}, i = {};
		function a(o) {
			n.has(i, o) || (i[o] = !0, r[o] = !0, n.forEach(e.outEdges(o), function(e) {
				n.has(r, e.w) ? t.push(e) : a(e.w);
			}), delete r[o]);
		}
		return n.forEach(e.nodes(), a), t;
	}
	function o(e) {
		n.forEach(e.edges(), function(t) {
			var n = e.edge(t);
			if (n.reversed) {
				e.removeEdge(t);
				var r = n.forwardName;
				delete n.reversed, delete n.forwardName, e.setEdge(t.w, t.v, n, r);
			}
		});
	}
})), iA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = sk().Graph;
	t.exports = {
		addDummyNode: i,
		simplify: a,
		asNonCompoundGraph: o,
		successorWeights: s,
		predecessorWeights: c,
		intersectRect: l,
		buildLayerMatrix: u,
		normalizeRanks: d,
		removeEmptyRanks: f,
		addBorderNode: p,
		maxRank: m,
		partition: h,
		time: g,
		notime: _
	};
	function i(e, t, r, i) {
		var a;
		do
			a = n.uniqueId(i);
		while (e.hasNode(a));
		return r.dummy = t, e.setNode(a, r), a;
	}
	function a(e) {
		var t = new r().setGraph(e.graph());
		return n.forEach(e.nodes(), function(n) {
			t.setNode(n, e.node(n));
		}), n.forEach(e.edges(), function(n) {
			var r = t.edge(n.v, n.w) || {
				weight: 0,
				minlen: 1
			}, i = e.edge(n);
			t.setEdge(n.v, n.w, {
				weight: r.weight + i.weight,
				minlen: Math.max(r.minlen, i.minlen)
			});
		}), t;
	}
	function o(e) {
		var t = new r({ multigraph: e.isMultigraph() }).setGraph(e.graph());
		return n.forEach(e.nodes(), function(n) {
			e.children(n).length || t.setNode(n, e.node(n));
		}), n.forEach(e.edges(), function(n) {
			t.setEdge(n, e.edge(n));
		}), t;
	}
	function s(e) {
		var t = n.map(e.nodes(), function(t) {
			var r = {};
			return n.forEach(e.outEdges(t), function(t) {
				r[t.w] = (r[t.w] || 0) + e.edge(t).weight;
			}), r;
		});
		return n.zipObject(e.nodes(), t);
	}
	function c(e) {
		var t = n.map(e.nodes(), function(t) {
			var r = {};
			return n.forEach(e.inEdges(t), function(t) {
				r[t.v] = (r[t.v] || 0) + e.edge(t).weight;
			}), r;
		});
		return n.zipObject(e.nodes(), t);
	}
	function l(e, t) {
		var n = e.x, r = e.y, i = t.x - n, a = t.y - r, o = e.width / 2, s = e.height / 2;
		if (!i && !a) throw Error("Not possible to find intersection inside of the rectangle");
		var c, l;
		return Math.abs(a) * o > Math.abs(i) * s ? (a < 0 && (s = -s), c = s * i / a, l = s) : (i < 0 && (o = -o), c = o, l = o * a / i), {
			x: n + c,
			y: r + l
		};
	}
	function u(e) {
		var t = n.map(n.range(m(e) + 1), function() {
			return [];
		});
		return n.forEach(e.nodes(), function(r) {
			var i = e.node(r), a = i.rank;
			n.isUndefined(a) || (t[a][i.order] = r);
		}), t;
	}
	function d(e) {
		var t = n.min(n.map(e.nodes(), function(t) {
			return e.node(t).rank;
		}));
		n.forEach(e.nodes(), function(r) {
			var i = e.node(r);
			n.has(i, "rank") && (i.rank -= t);
		});
	}
	function f(e) {
		var t = n.min(n.map(e.nodes(), function(t) {
			return e.node(t).rank;
		})), r = [];
		n.forEach(e.nodes(), function(n) {
			var i = e.node(n).rank - t;
			r[i] || (r[i] = []), r[i].push(n);
		});
		var i = 0, a = e.graph().nodeRankFactor;
		n.forEach(r, function(t, r) {
			n.isUndefined(t) && r % a !== 0 ? --i : i && n.forEach(t, function(t) {
				e.node(t).rank += i;
			});
		});
	}
	function p(e, t, n, r) {
		var a = {
			width: 0,
			height: 0
		};
		return arguments.length >= 4 && (a.rank = n, a.order = r), i(e, "border", a, t);
	}
	function m(e) {
		return n.max(n.map(e.nodes(), function(t) {
			var r = e.node(t).rank;
			if (!n.isUndefined(r)) return r;
		}));
	}
	function h(e, t) {
		var r = {
			lhs: [],
			rhs: []
		};
		return n.forEach(e, function(e) {
			t(e) ? r.lhs.push(e) : r.rhs.push(e);
		}), r;
	}
	function g(e, t) {
		var r = n.now();
		try {
			return t();
		} finally {
			console.log(e + " time: " + (n.now() - r) + "ms");
		}
	}
	function _(e, t) {
		return t();
	}
})), aA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = iA();
	t.exports = {
		run: i,
		undo: o
	};
	function i(e) {
		e.graph().dummyChains = [], n.forEach(e.edges(), function(t) {
			a(e, t);
		});
	}
	function a(e, t) {
		var n = t.v, i = e.node(n).rank, a = t.w, o = e.node(a).rank, s = t.name, c = e.edge(t), l = c.labelRank;
		if (o !== i + 1) {
			e.removeEdge(t);
			var u, d, f = 0;
			for (++i; i < o; ++f, ++i) c.points = [], d = {
				width: 0,
				height: 0,
				edgeLabel: c,
				edgeObj: t,
				rank: i
			}, u = r.addDummyNode(e, "edge", d, "_d"), i === l && (d.width = c.width, d.height = c.height, d.dummy = "edge-label", d.labelpos = c.labelpos), e.setEdge(n, u, { weight: c.weight }, s), f === 0 && e.graph().dummyChains.push(u), n = u;
			e.setEdge(n, a, { weight: c.weight }, s);
		}
	}
	function o(e) {
		n.forEach(e.graph().dummyChains, function(t) {
			var n = e.node(t), r = n.edgeLabel, i;
			for (e.setEdge(n.edgeObj, r); n.dummy;) i = e.successors(t)[0], e.removeNode(t), r.points.push({
				x: n.x,
				y: n.y
			}), n.dummy === "edge-label" && (r.x = n.x, r.y = n.y, r.width = n.width, r.height = n.height), t = i, n = e.node(t);
		});
	}
})), oA = /* @__PURE__ */ o(((e, t) => {
	var n = eA();
	t.exports = {
		longestPath: r,
		slack: i
	};
	function r(e) {
		var t = {};
		function r(i) {
			var a = e.node(i);
			if (n.has(t, i)) return a.rank;
			t[i] = !0;
			var o = n.min(n.map(e.outEdges(i), function(t) {
				return r(t.w) - e.edge(t).minlen;
			}));
			return (o === Infinity || o == null) && (o = 0), a.rank = o;
		}
		n.forEach(e.sources(), r);
	}
	function i(e, t) {
		return e.node(t.w).rank - e.node(t.v).rank - e.edge(t).minlen;
	}
})), sA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = sk().Graph, i = oA().slack;
	t.exports = a;
	function a(e) {
		var t = new r({ directed: !1 }), n = e.nodes()[0], a = e.nodeCount();
		t.setNode(n, {});
		for (var l, u; o(t, e) < a;) l = s(t, e), u = t.hasNode(l.v) ? i(e, l) : -i(e, l), c(t, e, u);
		return t;
	}
	function o(e, t) {
		function r(a) {
			n.forEach(t.nodeEdges(a), function(n) {
				var o = n.v, s = a === o ? n.w : o;
				!e.hasNode(s) && !i(t, n) && (e.setNode(s, {}), e.setEdge(a, s, {}), r(s));
			});
		}
		return n.forEach(e.nodes(), r), e.nodeCount();
	}
	function s(e, t) {
		return n.minBy(t.edges(), function(n) {
			if (e.hasNode(n.v) !== e.hasNode(n.w)) return i(t, n);
		});
	}
	function c(e, t, r) {
		n.forEach(e.nodes(), function(e) {
			t.node(e).rank += r;
		});
	}
})), cA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = sA(), i = oA().slack, a = oA().longestPath, o = sk().alg.preorder, s = sk().alg.postorder, c = iA().simplify;
	t.exports = l, l.initLowLimValues = p, l.initCutValues = u, l.calcCutValue = f, l.leaveEdge = h, l.enterEdge = g, l.exchangeEdges = _;
	function l(e) {
		e = c(e), a(e);
		var t = r(e);
		p(t), u(t, e);
		for (var n, i; n = h(t);) i = g(t, e, n), _(t, e, n, i);
	}
	function u(e, t) {
		var r = s(e, e.nodes());
		r = r.slice(0, r.length - 1), n.forEach(r, function(n) {
			d(e, t, n);
		});
	}
	function d(e, t, n) {
		var r = e.node(n).parent;
		e.edge(n, r).cutvalue = f(e, t, n);
	}
	function f(e, t, r) {
		var i = e.node(r).parent, a = !0, o = t.edge(r, i), s = 0;
		return o ||= (a = !1, t.edge(i, r)), s = o.weight, n.forEach(t.nodeEdges(r), function(n) {
			var o = n.v === r, c = o ? n.w : n.v;
			if (c !== i) {
				var l = o === a, u = t.edge(n).weight;
				if (s += l ? u : -u, y(e, r, c)) {
					var d = e.edge(r, c).cutvalue;
					s += l ? -d : d;
				}
			}
		}), s;
	}
	function p(e, t) {
		arguments.length < 2 && (t = e.nodes()[0]), m(e, {}, 1, t);
	}
	function m(e, t, r, i, a) {
		var o = r, s = e.node(i);
		return t[i] = !0, n.forEach(e.neighbors(i), function(a) {
			n.has(t, a) || (r = m(e, t, r, a, i));
		}), s.low = o, s.lim = r++, a ? s.parent = a : delete s.parent, r;
	}
	function h(e) {
		return n.find(e.edges(), function(t) {
			return e.edge(t).cutvalue < 0;
		});
	}
	function g(e, t, r) {
		var a = r.v, o = r.w;
		t.hasEdge(a, o) || (a = r.w, o = r.v);
		var s = e.node(a), c = e.node(o), l = s, u = !1;
		s.lim > c.lim && (l = c, u = !0);
		var d = n.filter(t.edges(), function(t) {
			return u === b(e, e.node(t.v), l) && u !== b(e, e.node(t.w), l);
		});
		return n.minBy(d, function(e) {
			return i(t, e);
		});
	}
	function _(e, t, n, r) {
		var i = n.v, a = n.w;
		e.removeEdge(i, a), e.setEdge(r.v, r.w, {}), p(e), u(e, t), v(e, t);
	}
	function v(e, t) {
		var r = o(e, n.find(e.nodes(), function(e) {
			return !t.node(e).parent;
		}));
		r = r.slice(1), n.forEach(r, function(n) {
			var r = e.node(n).parent, i = t.edge(n, r), a = !1;
			i || (i = t.edge(r, n), a = !0), t.node(n).rank = t.node(r).rank + (a ? i.minlen : -i.minlen);
		});
	}
	function y(e, t, n) {
		return e.hasEdge(t, n);
	}
	function b(e, t, n) {
		return n.low <= t.lim && t.lim <= n.lim;
	}
})), lA = /* @__PURE__ */ o(((e, t) => {
	var n = oA().longestPath, r = sA(), i = cA();
	t.exports = a;
	function a(e) {
		switch (e.graph().ranker) {
			case "network-simplex":
				c(e);
				break;
			case "tight-tree":
				s(e);
				break;
			case "longest-path":
				o(e);
				break;
			default: c(e);
		}
	}
	var o = n;
	function s(e) {
		n(e), r(e);
	}
	function c(e) {
		i(e);
	}
})), uA = /* @__PURE__ */ o(((e, t) => {
	var n = eA();
	t.exports = r;
	function r(e) {
		var t = a(e);
		n.forEach(e.graph().dummyChains, function(n) {
			for (var r = e.node(n), a = r.edgeObj, o = i(e, t, a.v, a.w), s = o.path, c = o.lca, l = 0, u = s[l], d = !0; n !== a.w;) {
				if (r = e.node(n), d) {
					for (; (u = s[l]) !== c && e.node(u).maxRank < r.rank;) l++;
					u === c && (d = !1);
				}
				if (!d) {
					for (; l < s.length - 1 && e.node(u = s[l + 1]).minRank <= r.rank;) l++;
					u = s[l];
				}
				e.setParent(n, u), n = e.successors(n)[0];
			}
		});
	}
	function i(e, t, n, r) {
		var i = [], a = [], o = Math.min(t[n].low, t[r].low), s = Math.max(t[n].lim, t[r].lim), c = n, l;
		do
			c = e.parent(c), i.push(c);
		while (c && (t[c].low > o || s > t[c].lim));
		for (l = c, c = r; (c = e.parent(c)) !== l;) a.push(c);
		return {
			path: i.concat(a.reverse()),
			lca: l
		};
	}
	function a(e) {
		var t = {}, r = 0;
		function i(a) {
			var o = r;
			n.forEach(e.children(a), i), t[a] = {
				low: o,
				lim: r++
			};
		}
		return n.forEach(e.children(), i), t;
	}
})), dA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = iA();
	t.exports = {
		run: i,
		cleanup: c
	};
	function i(e) {
		var t = r.addDummyNode(e, "root", {}, "_root"), i = o(e), c = n.max(n.values(i)) - 1, l = 2 * c + 1;
		e.graph().nestingRoot = t, n.forEach(e.edges(), function(t) {
			e.edge(t).minlen *= l;
		});
		var u = s(e) + 1;
		n.forEach(e.children(), function(n) {
			a(e, t, l, u, c, i, n);
		}), e.graph().nodeRankFactor = l;
	}
	function a(e, t, i, o, s, c, l) {
		var u = e.children(l);
		if (!u.length) l !== t && e.setEdge(t, l, {
			weight: 0,
			minlen: i
		});
		else {
			var d = r.addBorderNode(e, "_bt"), f = r.addBorderNode(e, "_bb"), p = e.node(l);
			e.setParent(d, l), p.borderTop = d, e.setParent(f, l), p.borderBottom = f, n.forEach(u, function(n) {
				a(e, t, i, o, s, c, n);
				var r = e.node(n), u = r.borderTop ? r.borderTop : n, p = r.borderBottom ? r.borderBottom : n, m = r.borderTop ? o : 2 * o, h = u === p ? s - c[l] + 1 : 1;
				e.setEdge(d, u, {
					weight: m,
					minlen: h,
					nestingEdge: !0
				}), e.setEdge(p, f, {
					weight: m,
					minlen: h,
					nestingEdge: !0
				});
			}), e.parent(l) || e.setEdge(t, d, {
				weight: 0,
				minlen: s + c[l]
			});
		}
	}
	function o(e) {
		var t = {};
		function r(i, a) {
			var o = e.children(i);
			o && o.length && n.forEach(o, function(e) {
				r(e, a + 1);
			}), t[i] = a;
		}
		return n.forEach(e.children(), function(e) {
			r(e, 1);
		}), t;
	}
	function s(e) {
		return n.reduce(e.edges(), function(t, n) {
			return t + e.edge(n).weight;
		}, 0);
	}
	function c(e) {
		var t = e.graph();
		e.removeNode(t.nestingRoot), delete t.nestingRoot, n.forEach(e.edges(), function(t) {
			e.edge(t).nestingEdge && e.removeEdge(t);
		});
	}
})), fA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = iA();
	t.exports = i;
	function i(e) {
		function t(r) {
			var i = e.children(r), o = e.node(r);
			if (i.length && n.forEach(i, t), n.has(o, "minRank")) {
				o.borderLeft = [], o.borderRight = [];
				for (var s = o.minRank, c = o.maxRank + 1; s < c; ++s) a(e, "borderLeft", "_bl", r, o, s), a(e, "borderRight", "_br", r, o, s);
			}
		}
		n.forEach(e.children(), t);
	}
	function a(e, t, n, i, a, o) {
		var s = {
			width: 0,
			height: 0,
			rank: o,
			borderType: t
		}, c = a[t][o - 1], l = r.addDummyNode(e, "border", s, n);
		a[t][o] = l, e.setParent(l, i), c && e.setEdge(c, l, { weight: 1 });
	}
})), pA = /* @__PURE__ */ o(((e, t) => {
	var n = eA();
	t.exports = {
		adjust: r,
		undo: i
	};
	function r(e) {
		var t = e.graph().rankdir.toLowerCase();
		(t === "lr" || t === "rl") && a(e);
	}
	function i(e) {
		var t = e.graph().rankdir.toLowerCase();
		(t === "bt" || t === "rl") && s(e), (t === "lr" || t === "rl") && (l(e), a(e));
	}
	function a(e) {
		n.forEach(e.nodes(), function(t) {
			o(e.node(t));
		}), n.forEach(e.edges(), function(t) {
			o(e.edge(t));
		});
	}
	function o(e) {
		var t = e.width;
		e.width = e.height, e.height = t;
	}
	function s(e) {
		n.forEach(e.nodes(), function(t) {
			c(e.node(t));
		}), n.forEach(e.edges(), function(t) {
			var r = e.edge(t);
			n.forEach(r.points, c), n.has(r, "y") && c(r);
		});
	}
	function c(e) {
		e.y = -e.y;
	}
	function l(e) {
		n.forEach(e.nodes(), function(t) {
			u(e.node(t));
		}), n.forEach(e.edges(), function(t) {
			var r = e.edge(t);
			n.forEach(r.points, u), n.has(r, "x") && u(r);
		});
	}
	function u(e) {
		var t = e.x;
		e.x = e.y, e.y = t;
	}
})), mA = /* @__PURE__ */ o(((e, t) => {
	var n = eA();
	t.exports = r;
	function r(e) {
		var t = {}, r = n.filter(e.nodes(), function(t) {
			return !e.children(t).length;
		}), i = n.max(n.map(r, function(t) {
			return e.node(t).rank;
		})), a = n.map(n.range(i + 1), function() {
			return [];
		});
		function o(r) {
			n.has(t, r) || (t[r] = !0, a[e.node(r).rank].push(r), n.forEach(e.successors(r), o));
		}
		var s = n.sortBy(r, function(t) {
			return e.node(t).rank;
		});
		return n.forEach(s, o), a;
	}
})), hA = /* @__PURE__ */ o(((e, t) => {
	var n = eA();
	t.exports = r;
	function r(e, t) {
		for (var n = 0, r = 1; r < t.length; ++r) n += i(e, t[r - 1], t[r]);
		return n;
	}
	function i(e, t, r) {
		for (var i = n.zipObject(r, n.map(r, function(e, t) {
			return t;
		})), a = n.flatten(n.map(t, function(t) {
			return n.sortBy(n.map(e.outEdges(t), function(t) {
				return {
					pos: i[t.w],
					weight: e.edge(t).weight
				};
			}), "pos");
		}), !0), o = 1; o < r.length;) o <<= 1;
		var s = 2 * o - 1;
		--o;
		var c = n.map(Array(s), function() {
			return 0;
		}), l = 0;
		return n.forEach(a.forEach(function(e) {
			var t = e.pos + o;
			c[t] += e.weight;
			for (var n = 0; t > 0;) t % 2 && (n += c[t + 1]), t = t - 1 >> 1, c[t] += e.weight;
			l += e.weight * n;
		})), l;
	}
})), gA = /* @__PURE__ */ o(((e, t) => {
	var n = eA();
	t.exports = r;
	function r(e, t) {
		return n.map(t, function(t) {
			var r = e.inEdges(t);
			if (r.length) {
				var i = n.reduce(r, function(t, n) {
					var r = e.edge(n), i = e.node(n.v);
					return {
						sum: t.sum + r.weight * i.order,
						weight: t.weight + r.weight
					};
				}, {
					sum: 0,
					weight: 0
				});
				return {
					v: t,
					barycenter: i.sum / i.weight,
					weight: i.weight
				};
			}
			return { v: t };
		});
	}
})), _A = /* @__PURE__ */ o(((e, t) => {
	var n = eA();
	t.exports = r;
	function r(e, t) {
		var r = {};
		return n.forEach(e, function(e, t) {
			var i = r[e.v] = {
				indegree: 0,
				in: [],
				out: [],
				vs: [e.v],
				i: t
			};
			n.isUndefined(e.barycenter) || (i.barycenter = e.barycenter, i.weight = e.weight);
		}), n.forEach(t.edges(), function(e) {
			var t = r[e.v], i = r[e.w];
			!n.isUndefined(t) && !n.isUndefined(i) && (i.indegree++, t.out.push(r[e.w]));
		}), i(n.filter(r, function(e) {
			return !e.indegree;
		}));
	}
	function i(e) {
		var t = [];
		function r(e) {
			return function(t) {
				t.merged || (n.isUndefined(t.barycenter) || n.isUndefined(e.barycenter) || t.barycenter >= e.barycenter) && a(e, t);
			};
		}
		function i(t) {
			return function(n) {
				n.in.push(t), --n.indegree === 0 && e.push(n);
			};
		}
		for (; e.length;) {
			var o = e.pop();
			t.push(o), n.forEach(o.in.reverse(), r(o)), n.forEach(o.out, i(o));
		}
		return n.map(n.filter(t, function(e) {
			return !e.merged;
		}), function(e) {
			return n.pick(e, [
				"vs",
				"i",
				"barycenter",
				"weight"
			]);
		});
	}
	function a(e, t) {
		var n = 0, r = 0;
		e.weight && (n += e.barycenter * e.weight, r += e.weight), t.weight && (n += t.barycenter * t.weight, r += t.weight), e.vs = t.vs.concat(e.vs), e.barycenter = n / r, e.weight = r, e.i = Math.min(t.i, e.i), t.merged = !0;
	}
})), vA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = iA();
	t.exports = i;
	function i(e, t) {
		var i = r.partition(e, function(e) {
			return n.has(e, "barycenter");
		}), s = i.lhs, c = n.sortBy(i.rhs, function(e) {
			return -e.i;
		}), l = [], u = 0, d = 0, f = 0;
		s.sort(o(!!t)), f = a(l, c, f), n.forEach(s, function(e) {
			f += e.vs.length, l.push(e.vs), u += e.barycenter * e.weight, d += e.weight, f = a(l, c, f);
		});
		var p = { vs: n.flatten(l, !0) };
		return d && (p.barycenter = u / d, p.weight = d), p;
	}
	function a(e, t, r) {
		for (var i; t.length && (i = n.last(t)).i <= r;) t.pop(), e.push(i.vs), r++;
		return r;
	}
	function o(e) {
		return function(t, n) {
			return t.barycenter < n.barycenter ? -1 : t.barycenter > n.barycenter ? 1 : e ? n.i - t.i : t.i - n.i;
		};
	}
})), yA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = gA(), i = _A(), a = vA();
	t.exports = o;
	function o(e, t, l, u) {
		var d = e.children(t), f = e.node(t), p = f ? f.borderLeft : void 0, m = f ? f.borderRight : void 0, h = {};
		p && (d = n.filter(d, function(e) {
			return e !== p && e !== m;
		}));
		var g = r(e, d);
		n.forEach(g, function(t) {
			if (e.children(t.v).length) {
				var r = o(e, t.v, l, u);
				h[t.v] = r, n.has(r, "barycenter") && c(t, r);
			}
		});
		var _ = i(g, l);
		s(_, h);
		var v = a(_, u);
		if (p && (v.vs = n.flatten([
			p,
			v.vs,
			m
		], !0), e.predecessors(p).length)) {
			var y = e.node(e.predecessors(p)[0]), b = e.node(e.predecessors(m)[0]);
			n.has(v, "barycenter") || (v.barycenter = 0, v.weight = 0), v.barycenter = (v.barycenter * v.weight + y.order + b.order) / (v.weight + 2), v.weight += 2;
		}
		return v;
	}
	function s(e, t) {
		n.forEach(e, function(e) {
			e.vs = n.flatten(e.vs.map(function(e) {
				return t[e] ? t[e].vs : e;
			}), !0);
		});
	}
	function c(e, t) {
		n.isUndefined(e.barycenter) ? (e.barycenter = t.barycenter, e.weight = t.weight) : (e.barycenter = (e.barycenter * e.weight + t.barycenter * t.weight) / (e.weight + t.weight), e.weight += t.weight);
	}
})), bA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = sk().Graph;
	t.exports = i;
	function i(e, t, i) {
		var o = a(e), s = new r({ compound: !0 }).setGraph({ root: o }).setDefaultNodeLabel(function(t) {
			return e.node(t);
		});
		return n.forEach(e.nodes(), function(r) {
			var a = e.node(r), c = e.parent(r);
			(a.rank === t || a.minRank <= t && t <= a.maxRank) && (s.setNode(r), s.setParent(r, c || o), n.forEach(e[i](r), function(t) {
				var i = t.v === r ? t.w : t.v, a = s.edge(i, r), o = n.isUndefined(a) ? 0 : a.weight;
				s.setEdge(i, r, { weight: e.edge(t).weight + o });
			}), n.has(a, "minRank") && s.setNode(r, {
				borderLeft: a.borderLeft[t],
				borderRight: a.borderRight[t]
			}));
		}), s;
	}
	function a(e) {
		for (var t; e.hasNode(t = n.uniqueId("_root")););
		return t;
	}
})), xA = /* @__PURE__ */ o(((e, t) => {
	var n = eA();
	t.exports = r;
	function r(e, t, r) {
		var i = {}, a;
		n.forEach(r, function(n) {
			for (var r = e.parent(n), o, s; r;) {
				if (o = e.parent(r), o ? (s = i[o], i[o] = r) : (s = a, a = r), s && s !== r) {
					t.setEdge(s, r);
					return;
				}
				r = o;
			}
		});
	}
})), SA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = mA(), i = hA(), a = yA(), o = bA(), s = xA(), c = sk().Graph, l = iA();
	t.exports = u;
	function u(e) {
		var t = l.maxRank(e), a = d(e, n.range(1, t + 1), "inEdges"), o = d(e, n.range(t - 1, -1, -1), "outEdges"), s = r(e);
		p(e, s);
		for (var c = Infinity, u, m = 0, h = 0; h < 4; ++m, ++h) {
			f(m % 2 ? a : o, m % 4 >= 2), s = l.buildLayerMatrix(e);
			var g = i(e, s);
			g < c && (h = 0, u = n.cloneDeep(s), c = g);
		}
		p(e, u);
	}
	function d(e, t, r) {
		return n.map(t, function(t) {
			return o(e, t, r);
		});
	}
	function f(e, t) {
		var r = new c();
		n.forEach(e, function(e) {
			var i = e.graph().root, o = a(e, i, r, t);
			n.forEach(o.vs, function(t, n) {
				e.node(t).order = n;
			}), s(e, r, o.vs);
		});
	}
	function p(e, t) {
		n.forEach(t, function(t) {
			n.forEach(t, function(t, n) {
				e.node(t).order = n;
			});
		});
	}
})), CA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = sk().Graph, i = iA();
	t.exports = {
		positionX: g,
		findType1Conflicts: a,
		findType2Conflicts: o,
		addConflict: c,
		hasConflict: l,
		verticalAlignment: u,
		horizontalCompaction: d,
		alignCoordinates: m,
		findSmallestWidthAlignment: p,
		balance: h
	};
	function a(e, t) {
		var r = {};
		function i(t, i) {
			var a = 0, o = 0, l = t.length, u = n.last(i);
			return n.forEach(i, function(t, d) {
				var f = s(e, t), p = f ? e.node(f).order : l;
				(f || t === u) && (n.forEach(i.slice(o, d + 1), function(t) {
					n.forEach(e.predecessors(t), function(n) {
						var i = e.node(n), o = i.order;
						(o < a || p < o) && !(i.dummy && e.node(t).dummy) && c(r, n, t);
					});
				}), o = d + 1, a = p);
			}), i;
		}
		return n.reduce(t, i), r;
	}
	function o(e, t) {
		var r = {};
		function i(t, i, a, o, s) {
			var l;
			n.forEach(n.range(i, a), function(i) {
				l = t[i], e.node(l).dummy && n.forEach(e.predecessors(l), function(t) {
					var n = e.node(t);
					n.dummy && (n.order < o || n.order > s) && c(r, t, l);
				});
			});
		}
		function a(t, r) {
			var a = -1, o, s = 0;
			return n.forEach(r, function(n, c) {
				if (e.node(n).dummy === "border") {
					var l = e.predecessors(n);
					l.length && (o = e.node(l[0]).order, i(r, s, c, a, o), s = c, a = o);
				}
				i(r, s, r.length, o, t.length);
			}), r;
		}
		return n.reduce(t, a), r;
	}
	function s(e, t) {
		if (e.node(t).dummy) return n.find(e.predecessors(t), function(t) {
			return e.node(t).dummy;
		});
	}
	function c(e, t, n) {
		if (t > n) {
			var r = t;
			t = n, n = r;
		}
		var i = e[t];
		i || (e[t] = i = {}), i[n] = !0;
	}
	function l(e, t, r) {
		if (t > r) {
			var i = t;
			t = r, r = i;
		}
		return n.has(e[t], r);
	}
	function u(e, t, r, i) {
		var a = {}, o = {}, s = {};
		return n.forEach(t, function(e) {
			n.forEach(e, function(e, t) {
				a[e] = e, o[e] = e, s[e] = t;
			});
		}), n.forEach(t, function(e) {
			var t = -1;
			n.forEach(e, function(e) {
				var c = i(e);
				if (c.length) {
					c = n.sortBy(c, function(e) {
						return s[e];
					});
					for (var u = (c.length - 1) / 2, d = Math.floor(u), f = Math.ceil(u); d <= f; ++d) {
						var p = c[d];
						o[e] === e && t < s[p] && !l(r, e, p) && (o[p] = e, o[e] = a[e] = a[p], t = s[p]);
					}
				}
			});
		}), {
			root: a,
			align: o
		};
	}
	function d(e, t, r, i, a) {
		var o = {}, s = f(e, t, r, a), c = a ? "borderLeft" : "borderRight";
		function l(e, t) {
			for (var n = s.nodes(), r = n.pop(), i = {}; r;) i[r] ? e(r) : (i[r] = !0, n.push(r), n = n.concat(t(r))), r = n.pop();
		}
		function u(e) {
			o[e] = s.inEdges(e).reduce(function(e, t) {
				return Math.max(e, o[t.v] + s.edge(t));
			}, 0);
		}
		function d(t) {
			var n = s.outEdges(t).reduce(function(e, t) {
				return Math.min(e, o[t.w] - s.edge(t));
			}, Infinity), r = e.node(t);
			n !== Infinity && r.borderType !== c && (o[t] = Math.max(o[t], n));
		}
		return l(u, s.predecessors.bind(s)), l(d, s.successors.bind(s)), n.forEach(i, function(e) {
			o[e] = o[r[e]];
		}), o;
	}
	function f(e, t, i, a) {
		var o = new r(), s = e.graph(), c = _(s.nodesep, s.edgesep, a);
		return n.forEach(t, function(t) {
			var r;
			n.forEach(t, function(t) {
				var n = i[t];
				if (o.setNode(n), r) {
					var a = i[r], s = o.edge(a, n);
					o.setEdge(a, n, Math.max(c(e, t, r), s || 0));
				}
				r = t;
			});
		}), o;
	}
	function p(e, t) {
		return n.minBy(n.values(t), function(t) {
			var r = -Infinity, i = Infinity;
			return n.forIn(t, function(t, n) {
				var a = v(e, n) / 2;
				r = Math.max(t + a, r), i = Math.min(t - a, i);
			}), r - i;
		});
	}
	function m(e, t) {
		var r = n.values(t), i = n.min(r), a = n.max(r);
		n.forEach(["u", "d"], function(r) {
			n.forEach(["l", "r"], function(o) {
				var s = r + o, c = e[s], l;
				if (c !== t) {
					var u = n.values(c);
					l = o === "l" ? i - n.min(u) : a - n.max(u), l && (e[s] = n.mapValues(c, function(e) {
						return e + l;
					}));
				}
			});
		});
	}
	function h(e, t) {
		return n.mapValues(e.ul, function(r, i) {
			if (t) return e[t.toLowerCase()][i];
			var a = n.sortBy(n.map(e, i));
			return (a[1] + a[2]) / 2;
		});
	}
	function g(e) {
		var t = i.buildLayerMatrix(e), r = n.merge(a(e, t), o(e, t)), s = {}, c;
		return n.forEach(["u", "d"], function(i) {
			c = i === "u" ? t : n.values(t).reverse(), n.forEach(["l", "r"], function(t) {
				t === "r" && (c = n.map(c, function(e) {
					return n.values(e).reverse();
				}));
				var a = (i === "u" ? e.predecessors : e.successors).bind(e), o = u(e, c, r, a), l = d(e, c, o.root, o.align, t === "r");
				t === "r" && (l = n.mapValues(l, function(e) {
					return -e;
				})), s[i + t] = l;
			});
		}), m(s, p(e, s)), h(s, e.graph().align);
	}
	function _(e, t, r) {
		return function(i, a, o) {
			var s = i.node(a), c = i.node(o), l = 0, u;
			if (l += s.width / 2, n.has(s, "labelpos")) switch (s.labelpos.toLowerCase()) {
				case "l":
					u = -s.width / 2;
					break;
				case "r": u = s.width / 2;
			}
			if (u && (l += r ? u : -u), u = 0, l += (s.dummy ? t : e) / 2, l += (c.dummy ? t : e) / 2, l += c.width / 2, n.has(c, "labelpos")) switch (c.labelpos.toLowerCase()) {
				case "l":
					u = c.width / 2;
					break;
				case "r": u = -c.width / 2;
			}
			return u && (l += r ? u : -u), u = 0, l;
		};
	}
	function v(e, t) {
		return e.node(t).width;
	}
})), wA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = iA(), i = CA().positionX;
	t.exports = a;
	function a(e) {
		e = r.asNonCompoundGraph(e), o(e), n.forEach(i(e), function(t, n) {
			e.node(n).x = t;
		});
	}
	function o(e) {
		var t = r.buildLayerMatrix(e), i = e.graph().ranksep, a = 0;
		n.forEach(t, function(t) {
			var r = n.max(n.map(t, function(t) {
				return e.node(t).height;
			}));
			n.forEach(t, function(t) {
				e.node(t).y = a + r / 2;
			}), a += r + i;
		});
	}
})), TA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = rA(), i = aA(), a = lA(), o = iA().normalizeRanks, s = uA(), c = iA().removeEmptyRanks, l = dA(), u = fA(), d = pA(), f = SA(), p = wA(), m = iA(), h = sk().Graph;
	t.exports = g;
	function g(e, t) {
		var n = t && t.debugTiming ? m.time : m.notime;
		n("layout", function() {
			var t = n("  buildLayoutGraph", function() {
				return D(e);
			});
			n("  runLayout", function() {
				_(t, n);
			}), n("  updateInputGraph", function() {
				v(e, t);
			});
		});
	}
	function _(e, t) {
		t("    makeSpaceForEdgeLabels", function() {
			O(e);
		}), t("    removeSelfEdges", function() {
			ae(e);
		}), t("    acyclic", function() {
			r.run(e);
		}), t("    nestingGraph.run", function() {
			l.run(e);
		}), t("    rank", function() {
			a(m.asNonCompoundGraph(e));
		}), t("    injectEdgeLabelProxies", function() {
			k(e);
		}), t("    removeEmptyRanks", function() {
			c(e);
		}), t("    nestingGraph.cleanup", function() {
			l.cleanup(e);
		}), t("    normalizeRanks", function() {
			o(e);
		}), t("    assignRankMinMax", function() {
			A(e);
		}), t("    removeEdgeLabelProxies", function() {
			ee(e);
		}), t("    normalize.run", function() {
			i.run(e);
		}), t("    parentDummyChains", function() {
			s(e);
		}), t("    addBorderSegments", function() {
			u(e);
		}), t("    order", function() {
			f(e);
		}), t("    insertSelfEdges", function() {
			oe(e);
		}), t("    adjustCoordinateSystem", function() {
			d.adjust(e);
		}), t("    position", function() {
			p(e);
		}), t("    positionSelfEdges", function() {
			se(e);
		}), t("    removeBorderNodes", function() {
			ie(e);
		}), t("    normalize.undo", function() {
			i.undo(e);
		}), t("    fixupEdgeLabelCoords", function() {
			j(e);
		}), t("    undoCoordinateSystem", function() {
			d.undo(e);
		}), t("    translateGraph", function() {
			te(e);
		}), t("    assignNodeIntersects", function() {
			ne(e);
		}), t("    reversePoints", function() {
			re(e);
		}), t("    acyclic.undo", function() {
			r.undo(e);
		});
	}
	function v(e, t) {
		n.forEach(e.nodes(), function(n) {
			var r = e.node(n), i = t.node(n);
			r && (r.x = i.x, r.y = i.y, t.children(n).length && (r.width = i.width, r.height = i.height));
		}), n.forEach(e.edges(), function(r) {
			var i = e.edge(r), a = t.edge(r);
			i.points = a.points, n.has(a, "x") && (i.x = a.x, i.y = a.y);
		}), e.graph().width = t.graph().width, e.graph().height = t.graph().height;
	}
	var y = [
		"nodesep",
		"edgesep",
		"ranksep",
		"marginx",
		"marginy"
	], b = {
		ranksep: 50,
		edgesep: 20,
		nodesep: 50,
		rankdir: "tb"
	}, x = [
		"acyclicer",
		"ranker",
		"rankdir",
		"align"
	], S = ["width", "height"], C = {
		width: 0,
		height: 0
	}, w = [
		"minlen",
		"weight",
		"width",
		"height",
		"labeloffset"
	], T = {
		minlen: 1,
		weight: 1,
		width: 0,
		height: 0,
		labeloffset: 10,
		labelpos: "r"
	}, E = ["labelpos"];
	function D(e) {
		var t = new h({
			multigraph: !0,
			compound: !0
		}), r = ce(e.graph());
		return t.setGraph(n.merge({}, b, M(r, y), n.pick(r, x))), n.forEach(e.nodes(), function(r) {
			var i = ce(e.node(r));
			t.setNode(r, n.defaults(M(i, S), C)), t.setParent(r, e.parent(r));
		}), n.forEach(e.edges(), function(r) {
			var i = ce(e.edge(r));
			t.setEdge(r, n.merge({}, T, M(i, w), n.pick(i, E)));
		}), t;
	}
	function O(e) {
		var t = e.graph();
		t.ranksep /= 2, n.forEach(e.edges(), function(n) {
			var r = e.edge(n);
			r.minlen *= 2, r.labelpos.toLowerCase() !== "c" && (t.rankdir === "TB" || t.rankdir === "BT" ? r.width += r.labeloffset : r.height += r.labeloffset);
		});
	}
	function k(e) {
		n.forEach(e.edges(), function(t) {
			var n = e.edge(t);
			if (n.width && n.height) {
				var r = e.node(t.v), i = {
					rank: (e.node(t.w).rank - r.rank) / 2 + r.rank,
					e: t
				};
				m.addDummyNode(e, "edge-proxy", i, "_ep");
			}
		});
	}
	function A(e) {
		var t = 0;
		n.forEach(e.nodes(), function(r) {
			var i = e.node(r);
			i.borderTop && (i.minRank = e.node(i.borderTop).rank, i.maxRank = e.node(i.borderBottom).rank, t = n.max(t, i.maxRank));
		}), e.graph().maxRank = t;
	}
	function ee(e) {
		n.forEach(e.nodes(), function(t) {
			var n = e.node(t);
			n.dummy === "edge-proxy" && (e.edge(n.e).labelRank = n.rank, e.removeNode(t));
		});
	}
	function te(e) {
		var t = Infinity, r = 0, i = Infinity, a = 0, o = e.graph(), s = o.marginx || 0, c = o.marginy || 0;
		function l(e) {
			var n = e.x, o = e.y, s = e.width, c = e.height;
			t = Math.min(t, n - s / 2), r = Math.max(r, n + s / 2), i = Math.min(i, o - c / 2), a = Math.max(a, o + c / 2);
		}
		n.forEach(e.nodes(), function(t) {
			l(e.node(t));
		}), n.forEach(e.edges(), function(t) {
			var r = e.edge(t);
			n.has(r, "x") && l(r);
		}), t -= s, i -= c, n.forEach(e.nodes(), function(n) {
			var r = e.node(n);
			r.x -= t, r.y -= i;
		}), n.forEach(e.edges(), function(r) {
			var a = e.edge(r);
			n.forEach(a.points, function(e) {
				e.x -= t, e.y -= i;
			}), n.has(a, "x") && (a.x -= t), n.has(a, "y") && (a.y -= i);
		}), o.width = r - t + s, o.height = a - i + c;
	}
	function ne(e) {
		n.forEach(e.edges(), function(t) {
			var n = e.edge(t), r = e.node(t.v), i = e.node(t.w), a, o;
			n.points ? (a = n.points[0], o = n.points[n.points.length - 1]) : (n.points = [], a = i, o = r), n.points.unshift(m.intersectRect(r, a)), n.points.push(m.intersectRect(i, o));
		});
	}
	function j(e) {
		n.forEach(e.edges(), function(t) {
			var r = e.edge(t);
			if (n.has(r, "x")) switch ((r.labelpos === "l" || r.labelpos === "r") && (r.width -= r.labeloffset), r.labelpos) {
				case "l":
					r.x -= r.width / 2 + r.labeloffset;
					break;
				case "r": r.x += r.width / 2 + r.labeloffset;
			}
		});
	}
	function re(e) {
		n.forEach(e.edges(), function(t) {
			var n = e.edge(t);
			n.reversed && n.points.reverse();
		});
	}
	function ie(e) {
		n.forEach(e.nodes(), function(t) {
			if (e.children(t).length) {
				var r = e.node(t), i = e.node(r.borderTop), a = e.node(r.borderBottom), o = e.node(n.last(r.borderLeft)), s = e.node(n.last(r.borderRight));
				r.width = Math.abs(s.x - o.x), r.height = Math.abs(a.y - i.y), r.x = o.x + r.width / 2, r.y = i.y + r.height / 2;
			}
		}), n.forEach(e.nodes(), function(t) {
			e.node(t).dummy === "border" && e.removeNode(t);
		});
	}
	function ae(e) {
		n.forEach(e.edges(), function(t) {
			if (t.v === t.w) {
				var n = e.node(t.v);
				n.selfEdges ||= [], n.selfEdges.push({
					e: t,
					label: e.edge(t)
				}), e.removeEdge(t);
			}
		});
	}
	function oe(e) {
		var t = m.buildLayerMatrix(e);
		n.forEach(t, function(t) {
			var r = 0;
			n.forEach(t, function(t, i) {
				var a = e.node(t);
				a.order = i + r, n.forEach(a.selfEdges, function(t) {
					m.addDummyNode(e, "selfedge", {
						width: t.label.width,
						height: t.label.height,
						rank: a.rank,
						order: i + ++r,
						e: t.e,
						label: t.label
					}, "_se");
				}), delete a.selfEdges;
			});
		});
	}
	function se(e) {
		n.forEach(e.nodes(), function(t) {
			var n = e.node(t);
			if (n.dummy === "selfedge") {
				var r = e.node(n.e.v), i = r.x + r.width / 2, a = r.y, o = n.x - i, s = r.height / 2;
				e.setEdge(n.e, n.label), e.removeNode(t), n.label.points = [
					{
						x: i + 2 * o / 3,
						y: a - s
					},
					{
						x: i + 5 * o / 6,
						y: a - s
					},
					{
						x: i + o,
						y: a
					},
					{
						x: i + 5 * o / 6,
						y: a + s
					},
					{
						x: i + 2 * o / 3,
						y: a + s
					}
				], n.label.x = n.x, n.label.y = n.y;
			}
		});
	}
	function M(e, t) {
		return n.mapValues(n.pick(e, t), Number);
	}
	function ce(e) {
		var t = {};
		return n.forEach(e, function(e, n) {
			t[n.toLowerCase()] = e;
		}), t;
	}
})), EA = /* @__PURE__ */ o(((e, t) => {
	var n = eA(), r = iA(), i = sk().Graph;
	t.exports = { debugOrdering: a };
	/* istanbul ignore next */
	function a(e) {
		var t = r.buildLayerMatrix(e), a = new i({
			compound: !0,
			multigraph: !0
		}).setGraph({});
		return n.forEach(e.nodes(), function(t) {
			a.setNode(t, { label: t }), a.setParent(t, "layer" + e.node(t).rank);
		}), n.forEach(e.edges(), function(e) {
			a.setEdge(e.v, e.w, {}, e.name);
		}), n.forEach(t, function(e, t) {
			var r = "layer" + t;
			a.setNode(r, { rank: "same" }), n.reduce(e, function(e, t) {
				return a.setEdge(e, t, { style: "invis" }), t;
			});
		}), a;
	}
})), DA = /* @__PURE__ */ o(((e, t) => {
	t.exports = "0.8.5";
})), OA = /* @__PURE__ */ l((/* @__PURE__ */ o(((e, t) => {
	t.exports = {
		graphlib: sk(),
		layout: TA(),
		debug: EA(),
		util: {
			time: iA().time,
			notime: iA().notime
		},
		version: DA()
	};
})))(), 1), kA = /\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\))/g;
function AA(e) {
	return String(e).replace(kA, "");
}
// public/flow-overview.js
function jA(e) {
	let t = e?.stack ?? [], n = e?.parentCallId ?? (t.at(-1) === e?.callId ? t.at(-2) : t.at(-1));
	return n === e?.callId ? void 0 : n;
}
function MA(e, t) {
	if (e?.kind !== "call" || t?.kind !== "enter" || jA(t) !== e.callId) return !1;
	let n = (e) => e.values?.task ?? e.values?.taskId ?? e.taskId, r = (e) => e.values?.thread ?? e.thread;
	return n(e) === n(t) && r(e) === r(t);
}
function NA(e = []) {
	let t = /* @__PURE__ */ new Map(), n = [];
	for (let [r, i] of e.entries()) {
		if (i?.kind !== "enter" || !i.callId || t.has(i.callId)) continue;
		let a = i.symbolId ?? "Unknown symbol", o = i.source?.file, s = o && a.startsWith(`${o}:`) ? o : /^(.+\.[a-z0-9]{1,12}):(?=[^:])(.+)$/i.exec(a)?.[1], c = s ? a.slice(s.length + 1) : a, l = Math.max(c.lastIndexOf("::"), c.lastIndexOf(".")), u = l >= 0 ? c.slice(0, l) : "", d = s ? u ? `${u} · ${s}` : s : u || "Functions", f = l >= 0 ? c.slice(l + (c.slice(l, l + 2) === "::" ? 2 : 1)) : c, p = jA(i), m = {
			callId: i.callId,
			symbol: a,
			className: d || "Functions",
			methodName: f || a,
			parentCallId: p === i.callId ? void 0 : p,
			index: r + 1,
			callSiteIndex: MA(e[r - 1], i) ? r : void 0,
			certainty: i.certainty ?? "unverified"
		};
		t.set(i.callId, m), n.push(m);
	}
	let r = /* @__PURE__ */ new Map();
	for (let e of n) {
		let n = t.get(e.parentCallId), i = {
			...e,
			parentSymbol: n?.symbol,
			parentKnown: !!n
		};
		r.has(i.className) || r.set(i.className, []), r.get(i.className).push(i);
	}
	return {
		invocations: n.map((e) => ({
			...e,
			parentSymbol: t.get(e.parentCallId)?.symbol,
			parentKnown: t.has(e.parentCallId)
		})),
		classCount: r.size
	};
}
function PA(e, t = []) {
	let n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
	for (let i of e) {
		let e = t[i.index - 1]?.source?.file ?? "", a = e && i.symbol.startsWith(e + ":") ? i.symbol.slice(e.length + 1) : i.symbol, o = "function:" + JSON.stringify([e, a]);
		n.has(o) || n.set(o, {
			id: o,
			symbol: i.symbol,
			invocations: []
		}), n.get(o).invocations.push(i), r.set(i.callId, o);
	}
	let i = e.filter((e) => r.has(e.parentCallId)).map((e) => ({
		source: r.get(e.parentCallId),
		target: r.get(e.callId),
		callId: e.callId,
		parentCallId: e.parentCallId,
		index: e.callSiteIndex ?? e.index
	}));
	return {
		functions: [...n.values()],
		byCall: r,
		relationships: i
	};
}
// public/diagram-drilldown.js
function FA(e = [], t = {}) {
	let n = new Set(e.filter((e) => e.kind === "enter").map((e) => e.callId)), r = NA(e.map((e) => n.has(e.callId) ? e : (n.add(e.callId), {
		...e,
		kind: "enter"
	}))).invocations, i = new Map(r.map((e) => [e.callId, e])), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = e.map((e) => i.get(e.callId)?.className), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map();
	for (let t of r) {
		let n = e[t.index - 1], r = {
			id: `method:${t.callId}`,
			kind: "method",
			index: t.index,
			label: t.methodName,
			symbol: t.symbol,
			callId: t.callId,
			owner: t.className,
			source: n?.source,
			certainty: n?.certainty,
			event: n
		};
		c.set(t.callId, r), a.has(t.className) || a.set(t.className, []), a.get(t.className).push(r), o.set(t.callId, []);
	}
	for (let [n, r] of e.entries()) {
		let e = n + 1, a = o.get(r.callId), d = r.source;
		d && Object.hasOwn(t, d.file) && !l.has(d.file) && l.set(d.file, t[d.file].split(/\r?\n/));
		let f = l.get(d?.file)?.[d.line - 1], p = s[n];
		u.has(p) || u.set(p, /* @__PURE__ */ new Set()), u.get(p).add(r.certainty ?? "unverified"), a?.push({
			id: `step:${e}`,
			kind: "step",
			index: e,
			label: f?.trim() || r.label,
			symbol: r.symbolId,
			callId: r.callId,
			source: d,
			certainty: r.certainty,
			event: r,
			code: f
		});
		let m = c.get(r.callId);
		if (m?.index === e) {
			let e = i.get(r.callId)?.parentCallId;
			m && e !== r.callId && o.get(e)?.push(m);
		}
	}
	let d = [...a].map(([e, t]) => ({
		id: `class:${e}`,
		kind: "class",
		owner: e,
		label: e,
		symbol: e,
		index: t[0].index,
		certainty: [...u.get(e)].join(" / "),
		count: t.length
	})), f = new Set(r.map((e) => e.callSiteIndex).filter(Boolean)), p = new Map([...o].map(([e, t]) => [e, t.filter((e) => e.kind === "method" || e.certainty === "unresolved" || e.event.kind !== "enter" && !f.has(e.index))])), m = /* @__PURE__ */ new Map();
	function h(e, t) {
		let n = JSON.stringify([e, t]);
		if (m.has(n)) return m.get(n);
		let r = /* @__PURE__ */ new Set(), a = e;
		for (; a && !r.has(a) && a !== t;) r.add(a), a = i.get(a)?.parentCallId;
		let o = a === t;
		return m.set(n, o), o;
	}
	let g = /* @__PURE__ */ new Map();
	function _(t) {
		let n = JSON.stringify(t);
		if (g.has(n)) return g.get(n);
		let r = [0];
		for (let [n, a] of e.entries()) {
			let o = !0;
			t?.kind === "classes" ? o = n === 0 || s[n] !== s[n - 1] : t?.kind === "class" ? o = n === 0 || a.callId !== e[n - 1].callId : t?.kind === "method" && (o = a.callId === t.id || !h(a.callId, t.id) || c.get(a.callId)?.index === n + 1 && i.get(a.callId)?.parentCallId === t.id), (o || n === e.length - 1) && r.push(n + 1);
		}
		return g.set(n, r), r;
	}
	function v(t, n, r) {
		if (!n) return Math.max(0, Math.min(e.length, t + r));
		let i = _(n), a = 0, o = i.length;
		for (; a < o;) {
			let e = a + o >>> 1;
			i[e] < t || r > 0 && i[e] === t ? a = e + 1 : o = e;
		}
		return r > 0 ? i[a] ?? e.length : i[a - 1] ?? 0;
	}
	return {
		classes: d,
		methods: (e) => a.get(e) ?? [],
		steps: (e) => o.get(e) ?? [],
		flowSteps: (e) => p.get(e) ?? [],
		owner: (e) => i.get(e)?.className,
		contains: h,
		next: (e, t) => v(e, t, 1),
		previous: (e, t) => v(e, t, -1)
	};
}
// public/diagram-returns.js
function IA(e, t) {
	let n = new Map(t.map((e) => [e.callId, e])), r = /* @__PURE__ */ new Map();
	for (let [t, i] of e.entries()) {
		if (i.kind !== "return") continue;
		let e = n.get(i.callId);
		if (!e?.parentCallId || e.parentCallId === e.callId || !n.has(e.parentCallId) || i.parentCallId && i.parentCallId !== e.parentCallId) continue;
		let a = Object.hasOwn(i, "result") ? JSON.stringify(i.result) ?? "value unavailable" : "value unavailable", o = i.certainty === "mock" ? "simulated" : i.certainty ?? "unverified", s = {
			from: e.callId,
			to: e.parentCallId,
			index: t + 1,
			label: `${e.symbol || e.callId} returns\n${a.length > 36 ? a.slice(0, 33) + "…" : a} (${o})`,
			description: `Prepared ${o} return at step ${t + 1}: ${e.callId} to ${e.parentCallId}; ${a}`
		};
		r.has(e.callId) || r.set(e.callId, []), r.get(e.callId).push(s);
	}
	return r;
}
// public/diagram-routing.js
var Q = 16, LA = (e, t) => `${e},${t}`, RA = (e, t, n, r = 6) => e.x === t.x ? e.x > n.x - r && e.x < n.x + n.width + r && Math.max(e.y, t.y) > n.y - r && Math.min(e.y, t.y) < n.y + n.height + r : e.y > n.y - r && e.y < n.y + n.height + r && Math.max(e.x, t.x) > n.x - r && Math.min(e.x, t.x) < n.x + n.width + r, zA = (e, t, n, r) => e.x === t.x && n.x === r.x && e.x === n.x ? Math.min(Math.max(e.y, t.y), Math.max(n.y, r.y)) > Math.max(Math.min(e.y, t.y), Math.min(n.y, r.y)) : e.y === t.y && n.y === r.y && e.y === n.y && Math.min(Math.max(e.x, t.x), Math.max(n.x, r.x)) > Math.max(Math.min(e.x, t.x), Math.min(n.x, r.x));
function BA(e) {
	let t = [], n = [], r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Map(), a = Math.floor(Math.min(...e.map((e) => e.x)) / Q) - 8, o = Math.floor(Math.min(...e.map((e) => e.y)) / Q) - 8, s = Math.ceil(Math.max(...e.map((e) => e.x + e.width)) / Q) + 8, c = Math.ceil(Math.max(...e.map((e) => e.y + e.height)) / Q) + 8, l = (e, r) => !t.some(([t, n]) => zA(e, r, t, n)) && !n.some((t) => RA(e, r, t)), u = (t) => {
		let n = [];
		for (let i of t.sides ?? [
			"right",
			"left",
			"bottom",
			"top"
		]) {
			let a = i === "right" || i === "left", o = a ? t.y : t.x, s = o + (a ? t.height : t.width), c = [];
			for (let e = Math.ceil((o + 16) / Q) * Q; e <= s - 16; e += Q) c.push(e);
			c.sort((e, t) => Math.abs(e - (o + s) / 2) - Math.abs(t - (o + s) / 2));
			for (let u of c) {
				if (t.centered && Math.abs(u - (o + s) / 2) > Q) continue;
				let c = t.shape === "diamond" ? Math.abs(u - (o + s) / 2) * (a ? t.width / t.height : t.height / t.width) : 0, d = a ? t.x + (i === "right" ? t.width - c : c) : t.y + (i === "bottom" ? t.height - c : c), f = a ? t.x + (i === "right" ? t.width : 0) : t.y + (i === "bottom" ? t.height : 0), p = (i === "right" || i === "bottom" ? Math.ceil((f + 8) / Q) : Math.floor((f - 8) / Q)) * Q, m = a ? {
					x: d,
					y: u
				} : {
					x: u,
					y: d
				}, h = a ? {
					x: p,
					y: u
				} : {
					x: u,
					y: p
				};
				!r.has(LA(m.x, m.y)) && l(m, h) && !e.some((e) => e.id !== t.id && RA(m, h, e)) && n.push({
					point: m,
					grid: h
				});
			}
		}
		return n;
	};
	return { route(d, f, p = "") {
		let m = u(d), h = new Map(u(f).map((e) => [LA(e.grid.x / Q, e.grid.y / Q), e]));
		if (!m.length || !h.size) return null;
		let g = [], _ = /* @__PURE__ */ new Map(), v = (e) => {
			let t = g.length;
			for (g.push(e); t > 0;) {
				let n = t - 1 >> 1;
				if (g[n].score <= e.score) break;
				g[t] = g[n], t = n;
			}
			g[t] = e;
		}, y = () => {
			let e = g[0], t = g.pop();
			if (g.length) {
				let e = 0;
				for (; e * 2 + 1 < g.length;) {
					let n = e * 2 + 1;
					if (n + 1 < g.length && g[n + 1].score < g[n].score && n++, g[n].score >= t.score) break;
					g[e] = g[n], e = n;
				}
				g[e] = t;
			}
			return e;
		}, b = (e, t) => (Math.max(f.x - e * Q, 0, e * Q - f.x - f.width) + Math.max(f.y - t * Q, 0, t * Q - f.y - f.height)) / Q;
		for (let e of m) {
			let t = e.grid.x / Q, n = e.grid.y / Q, r = LA(t, n), i = {
				x: t,
				y: n,
				id: r,
				port: e,
				cost: 0,
				score: b(t, n)
			};
			_.has(r) || (_.set(r, i), v(i));
		}
		let x;
		for (let t = 0; g.length && t < 12e4; t++) {
			let t = y();
			if (_.get(t.id) === t) {
				if (h.has(t.id)) {
					x = t;
					break;
				}
				for (let [n, r] of [
					[1, 0],
					[-1, 0],
					[0, 1],
					[0, -1]
				]) {
					let u = t.x + n, d = t.y + r, f = LA(u, d);
					if (u < a || u > s || d < o || d > c) continue;
					let p = t.cost + 1 + (t.dx !== void 0 && (t.dx !== n || t.dy !== r) ? .25 : 0);
					if (_.has(f) && _.get(f).cost <= p) continue;
					let m = {
						x: t.x * Q,
						y: t.y * Q
					}, h = {
						x: u * Q,
						y: d * Q
					}, g = [t.id, f].sort().join("|");
					if (i.has(g) || i.set(g, e.some((e) => RA(m, h, e))), i.get(g) || !l(m, h)) continue;
					let y = {
						x: u,
						y: d,
						id: f,
						dx: n,
						dy: r,
						cost: p,
						score: p + b(u, d),
						previous: t
					};
					_.set(f, y), v(y);
				}
			}
		}
		if (!x) return null;
		let S = h.get(x.id), C = [S.point], w = x;
		for (; w && (C.push({
			x: w.x * Q,
			y: w.y * Q
		}), w.previous);) w = w.previous;
		C.push(w.port.point);
		let T = C.reverse().filter((e, t, n) => !t || t === n.length - 1 || !(n[t - 1].x === e.x && e.x === n[t + 1].x || n[t - 1].y === e.y && e.y === n[t + 1].y));
		for (let e = 1; e < T.length; e++) t.push([T[e - 1], T[e]]);
		r.add(LA(T[0].x, T[0].y)), r.add(LA(S.point.x, S.point.y));
		let E, D = 0;
		if (p) {
			let r = Math.max(...p.split("\n").map((e) => e.length * 6)) + 20, i = p.split("\n").length * 14 + 12;
			for (let a = 1; a < T.length && !E; a++) {
				let o = T[a - 1], s = T[a], c = o.y === s.y, l = Math.abs(o.x - s.x) + Math.abs(o.y - s.y);
				for (let a = 24; a < l - 24 && !E; a += Q) {
					let l = o.x + Math.sign(s.x - o.x) * a, u = o.y + Math.sign(s.y - o.y) * a;
					for (let o of [-1, 1]) {
						let s = c ? {
							x: 0,
							y: o * (i / 2 + 12)
						} : {
							x: o * (r / 2 + 12),
							y: 0
						}, d = {
							x: l + s.x - r / 2,
							y: u + s.y - i / 2,
							width: r,
							height: i
						};
						if (!([...e, ...n].some((e) => d.x < e.x + e.width + 6 && d.x + r + 6 > e.x && d.y < e.y + e.height + 6 && d.y + i + 6 > e.y) || t.some(([e, t]) => RA(e, t, d)))) {
							E = {
								distance: D + a,
								offset: s,
								box: d
							}, n.push(d);
							break;
						}
					}
				}
				D += l;
			}
		}
		return {
			points: T,
			label: E
		};
	} };
}
// public/semantic-flow-model.js
function VA(e) {
	let t = e.split(""), n = "code", r = (n) => {
		e[n] !== "\n" && (t[n] = " ");
	};
	for (let t = 0; t < e.length; t++) {
		let i = e[t], a = e[t + 1];
		if (n === "code") i === "/" && a === "/" ? (r(t), r(++t), n = "line") : i === "/" && a === "*" ? (r(t), r(++t), n = "comment") : e.slice(t, t + 3) === "\"\"\"" ? (r(t), r(++t), r(++t), n = "triple") : (i === "\"" || i === "'" || i === "`") && (r(t), n = i);
		else if (n === "line") i === "\n" ? n = "code" : r(t);
		else if (n === "comment") r(t), i === "*" && a === "/" && (r(++t), n = "code");
		else if (n === "triple") r(t), e.slice(t, t + 3) === "\"\"\"" && (r(++t), r(++t), n = "code");
		else {
			if (i === "\n" && n !== "`") return;
			r(t), i === "\\" && a !== void 0 ? r(++t) : i === n && (n = "code");
		}
	}
	return n === "code" || n === "line" ? t.join("") : void 0;
}
function HA(e, t) {
	if (typeof e != "string" || !/\.(?:[cm]?[jt]sx?|java|cs|kt|c|cpp|h|go|rs)$/.test(t)) return [];
	let n = VA(e);
	if (n === void 0) return [];
	let r = /* @__PURE__ */ new Map(), i = [], a = [], o = 1;
	for (let e = 0; e < n.length; e++) if (a[e] = o, n[e] === "\n" && o++, "({".includes(n[e])) i.push(e);
	else if (")}".includes(n[e])) {
		let t = i.pop();
		if (t !== void 0 && (n[t] === "(" && n[e] === ")" || n[t] === "{" && n[e] === "}")) r.set(t, e);
		else return [];
	}
	if (i.length) return [];
	let s = /* @__PURE__ */ new Set();
	for (let e of n.matchAll(/\bclass\b/g)) {
		let t = n.indexOf("{", e.index + e[0].length);
		t >= 0 && r.has(t) && !/[;{}]/.test(n.slice(e.index + e[0].length, t)) && s.add(t);
	}
	let c = /* @__PURE__ */ new Set();
	for (let [e] of r) {
		if (n[e] !== "{" || s.has(e)) continue;
		let t = e - 1;
		for (; t >= 0 && /\s/.test(n[t]);) t--;
		let r = n[t], i = n.slice(Math.max(0, t - 160), t + 1);
		!(r === ":" && /\b(?:case\s+[^:;{}]*|default)\s*:$/.test(i)) && (r === "=" && n[t - 1] !== ">" || r === ":" || r === "(" || /\b(?:return|default)$/.test(i)) && c.add(e);
	}
	let l = [...r].filter(([e]) => n[e] === "{").sort(([e], [t]) => e - t), u = [], d = 0, f = (e) => {
		for (; d < l.length && l[d][0] < e;) {
			let [e, t] = l[d++];
			for (; u.length && u.at(-1)[1] < e;) u.pop();
			u.push([e, t]);
		}
		for (; u.length && u.at(-1)[1] <= e;) u.pop();
		let t = u.at(-1)?.[0];
		return s.has(t) || c.has(t);
	}, p = (e) => {
		for (; e < n.length && /\s/.test(n[e]);) e++;
		return e;
	};
	function m(i, o) {
		let s = p(i + o.length);
		if ((o !== "try" || n[s] === "{" || t.endsWith(".java") && n[s] === "(") && !([
			"if",
			"for",
			"while",
			"foreach",
			"switch"
		].includes(o) && n[s] !== "(")) {
			if (n[s] === "(") {
				let e = r.get(s);
				if (e === void 0) return;
				s = p(e + 1);
			}
			if (n[s] === "{" && r.has(s)) return {
				start: i,
				open: s,
				end: r.get(s),
				line: a[i],
				bodyLine: a[s],
				title: e.slice(i, s).trim(),
				keyword: o
			};
		}
	}
	function h(e) {
		let t = p(e.end + 1);
		if (!/^else\b/.test(n.slice(t))) return { end: e.end };
		let r = p(t + 4);
		if (!/^if\b/.test(n.slice(r))) {
			let e = m(t, "else");
			return e ? {
				end: e.end,
				alternative: {
					label: "No · condition false",
					start: e.open + 1,
					end: e.end,
					line: e.line
				}
			} : void 0;
		}
		let i = r, o = m(r, "if");
		if (!o) return;
		let s = o.end;
		for (;;) {
			let e = p(s + 1);
			if (!/^else\b/.test(n.slice(e))) break;
			let t = p(e + 4);
			if (/^if\b/.test(n.slice(t))) {
				if (o = m(t, "if"), !o) return;
				s = o.end;
			} else {
				let t = m(e, "else");
				if (!t) return;
				s = t.end;
				break;
			}
		}
		return {
			end: s,
			alternative: {
				label: "No · condition false",
				start: i,
				end: s,
				line: a[i]
			}
		};
	}
	let g = [];
	for (let t of n.matchAll(/\b(if|for|while|foreach|try|switch)\b/g)) {
		if (f(t.index)) continue;
		let r = m(t.index, t[0]);
		if (!r) continue;
		let i = [{
			label: r.keyword === "if" ? "Yes · condition true" : r.keyword === "try" ? "Try · normal path" : "Body",
			start: r.open + 1,
			end: r.end,
			line: r.line
		}], o = r.end;
		if (r.keyword === "if") {
			let e = h(r);
			if (!e) continue;
			e.alternative && i.push(e.alternative), o = e.end;
		} else if (r.keyword === "try") for (;;) {
			let e = p(o + 1), t = /^(else|catch|finally)\b/.exec(n.slice(e))?.[1];
			if (!t || t === "else") break;
			let r = m(e, t);
			if (!r) break;
			i.push({
				label: t === "catch" ? "Catch · recover" : "Finally · cleanup",
				start: r.open + 1,
				end: r.end,
				line: r.line
			}), o = r.end;
		}
		r.keyword === "if" && i.length === 1 && i.push({
			label: "No · continue without body",
			start: -1,
			end: -1,
			line: -1
		});
		let s = [
			"for",
			"while",
			"foreach"
		].includes(r.keyword) ? "loop" : r.keyword === "try" ? "try" : r.keyword === "switch" ? "switch" : "decision";
		if (r.keyword === "switch") {
			i.length = 0;
			let t = 0;
			for (let o = r.open + 1; o < r.end; o++) {
				if (n[o] === "{" && t++, n[o] === "}" && t--, t || o > 0 && /[\w$]/.test(n[o - 1])) continue;
				let s = /^(case\b[^:\n]*|default)\s*:/.exec(n.slice(o, r.end));
				s && (i.length && (i.at(-1).end = o - 1), i.push({
					label: e.slice(o, o + s[0].length).trim(),
					start: o,
					end: r.end,
					line: a[o]
				}), o += s[0].length - 1);
			}
			if (!i.length || new Set(i.map((e) => e.line)).size !== i.length) continue;
		}
		a[r.open] !== a[o] && g.push({
			...r,
			end: o,
			endLine: a[o],
			type: s,
			branches: i.map((e) => ({
				...e,
				endLine: e.end < 0 ? -1 : a[e.end]
			}))
		});
	}
	return g.sort((e, t) => e.start - t.start || t.end - e.end);
}
var UA = (e) => ({
	branch: "decision",
	loop: "loop",
	call: "call",
	return: "return",
	console: "output",
	assign: "change",
	mutate: "change",
	transform: "change",
	throw: "throw",
	catch: "catch",
	unresolved: "unresolved"
})[e] ?? "step";
function WA(e) {
	let t = e.trace?.events?.length ? e.trace.events : (e.steps ?? []).map((t, n) => ({
		id: `prepared-${n}`,
		kind: "statement",
		callId: t.from ?? "flow",
		symbolId: t.from ?? e.endpoint,
		label: t.dtoName,
		values: t.dtoFields ?? {},
		certainty: "unresolved",
		stack: [],
		note: "No trace evidence; prepared order only."
	})), n = e.trace?.sourceFiles, r = new Map(Object.entries(n && typeof n == "object" ? n : {}).map(([e, t]) => [e, HA(t, e)])), i = NA(t).invocations, a = new Map(i.map((e) => [e.callId, e])), o = new Map(i.filter((e) => e.callSiteIndex).map((e) => [e.callSiteIndex, e.callId])), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map(), f = t.map((e) => {
		let t = JSON.stringify([
			e.callId ?? e.symbolId ?? "flow",
			e.id ?? null,
			e.kind
		]), n = d.get(t) ?? 0;
		return d.set(t, n + 1), n;
	});
	t.forEach((e, t) => {
		let n = e.callId || e.symbolId || "flow";
		c.has(n) || c.set(n, []), c.get(n).push(t + 1), s.set(t + 1, n);
		let r = e.values?.task ?? e.values?.taskId ?? e.taskId, i = e.values?.thread ?? e.thread;
		l.has(n) || l.set(n, /* @__PURE__ */ new Set()), l.get(n).add(JSON.stringify([r ?? null, i ?? null])), e.kind === "enter" && u.set(n, (u.get(n) ?? 0) + 1);
	});
	let p = new Set([...l].filter(([e, t]) => t.size > 1 || (u.get(e) ?? 0) > 1).map(([e]) => e));
	function m(e) {
		let n = t[e - 1], r = n.callId ?? n.symbolId ?? "flow", i = n.id ?? null, a = f[e - 1];
		return {
			eventId: i,
			invocationId: r,
			visitIdentity: JSON.stringify([
				r,
				i,
				n.kind,
				a
			]),
			evidenceIdentity: JSON.stringify([
				e,
				r,
				i,
				a
			])
		};
	}
	function h(e) {
		let n = t[e - 1], r = n.kind === "branch" || n.kind === "loop";
		return {
			id: `event-${e}`,
			type: r ? "unresolved" : UA(n.kind),
			title: n.label || n.kind,
			indices: [e],
			event: n,
			...m(e),
			...r ? { ownershipStatus: "unresolved" } : {},
			...o.has(e) ? { targetId: o.get(e) } : {},
			...r ? { note: "Unresolved source ownership; prepared order only." } : {}
		};
	}
	function g(e, n) {
		let r = [];
		for (let i = 0; i < e.length;) {
			let a = e[i], o = t[a - 1], s = n.find((e) => o.source?.line >= e.line && o.source.line <= e.endLine && o.kind !== "enter" && (e.type !== "decision" || o.kind === "branch" && o.source.line === e.line) && (e.type !== "loop" || o.kind === "loop" && o.source.line === e.line));
			if (!s) {
				r.push(h(a)), i++;
				continue;
			}
			let c = i + 1;
			for (; c < e.length;) {
				let n = t[e[c] - 1];
				if (n.source?.file !== o.source.file || n.source.line < s.line || n.source.line > s.endLine || s.type === "decision" && n.kind === "branch" && n.source.line === s.line) break;
				c++;
			}
			let l = e.slice(i, c), u = n.filter((e) => e.start > s.start && e.end <= s.end), d = {
				id: `structure-${a}`,
				type: s.type,
				title: s.title,
				indices: l,
				event: o,
				...m(a)
			};
			if (s.type === "loop") {
				let e = [];
				for (let n of l) {
					let r = t[n - 1];
					(!e.length || r.kind === "loop" && r.source.line === s.line) && e.push([]), e.at(-1).push(n);
				}
				d.iterations = e.map((e, n) => ({
					label: `${n + 1} · ${t[e[0] - 1].label}`,
					indices: e,
					children: g(e, u).map((e) => e.event.kind === "loop" && e.event.source?.line === s.line ? {
						...e,
						type: "step",
						note: void 0,
						ownershipStatus: "source-proven"
					} : e)
				})), d.note = "Prepared visits only. Initialization, updates and exit are shown when supplied; no unseen iterations inferred.";
			} else {
				d.branches = s.branches.map((e) => ({
					label: e.label,
					indices: [],
					children: []
				}));
				let e = [], n = [];
				for (let r of l) {
					let i = t[r - 1], a = i.source.line, o = s.branches.flatMap((e, t) => e.line >= 0 && a >= e.line && a <= e.endLine ? [t] : []), c = o.at(-1) ?? -1;
					if (o.length > 1) {
						if (i.kind === "catch") c = o.find((e) => e > 0) ?? -1;
						else {
							n.push(r);
							continue;
						}
					}
					a === s.line || c < 0 ? e.push(r) : d.branches[c].indices.push(r);
				}
				for (let [e, t] of d.branches.entries()) {
					let n = s.branches[e];
					t.children = g(t.indices, u.filter((e) => e.start >= n.start && e.end <= n.end));
				}
				if (d.children = [...e.map((e) => ({
					...h(e),
					type: "step",
					note: void 0
				})), ...n.map((e) => ({
					...h(e),
					type: "unresolved",
					ownershipStatus: "unresolved",
					note: "Unresolved shared-line branch ownership; prepared event only."
				}))].sort((e, t) => e.indices[0] - t.indices[0]), s.type === "decision") {
					let e = o.values?.condition;
					typeof e == "boolean" && d.branches.length === 2 ? d.branches.some((t, n) => n === 0 !== e && t.indices.length > 0) ? (d.ownershipStatus = "unresolved", d.note = "Contradictory evidence: prepared source membership conflicts with the supplied branch outcome; no arm selected.") : d.branches.forEach((t, n) => {
						t.selected = n === 0 === e;
					}) : d.note = "Branch outcome not supplied; lanes show source membership, not an inferred condition result.";
				}
			}
			r.push(d), i = c;
		}
		return r;
	}
	let _ = [...c].map(([e, n]) => {
		let i = t[n[0] - 1], o = a.get(e), s = new Set(n.map((e) => t[e - 1].source?.file)).size === 1 && !p.has(e) ? r.get(i.source?.file) ?? [] : [], c = n.map((e) => t[e - 1]).findLast((e) => e.kind === "return");
		return {
			id: e,
			symbol: i.symbolId,
			title: i.symbolId,
			source: i.source,
			indices: n,
			items: g(n, s),
			inputs: i.inputs,
			result: c?.result,
			parentId: o?.parentCallId,
			...p.has(e) ? { note: "Unresolved invocation ownership: conflicting or incomplete task/entry identity for one callId; prepared order only." } : {}
		};
	}), v = new Set(_.map((e) => e.id));
	return {
		methods: _,
		roots: _.filter((e) => !v.has(e.parentId)).map((e) => e.id),
		byEvent: s
	};
}
// public/diagram-control-layout.js
function GA(e, { cursor: t = 0, visits: n = /* @__PURE__ */ new Map(), methodCallId: r } = {}) {
	let i = [], a = [], o = [], s = /* @__PURE__ */ new Map(), c = [], l = (e) => r ?? e.invocationId ?? e.event?.callId ?? "flow", u = (e, t) => `${encodeURIComponent(l(e))}:region:${encodeURIComponent(e.id)}:${t}`;
	function d(e) {
		return e.type === "unresolved" || e.ownershipStatus === "unresolved" || e.event?.certainty === "unresolved" || !e.event?.source?.file || !Number.isInteger(e.event?.source?.line);
	}
	function f(e, t, n, r = {}, a = e) {
		if (!Number.isInteger(t) || s.has(t)) return;
		let o = {
			id: `${encodeURIComponent(l(e))}:event:${t}:${encodeURIComponent(a.evidenceIdentity ?? a.eventId ?? a.id)}`,
			node: e,
			index: t,
			parentRegionId: n,
			event: a.event,
			eventId: a.eventId,
			evidenceIdentity: a.evidenceIdentity,
			visitIdentity: a.visitIdentity,
			invocationId: a.invocationId,
			...r,
			unresolved: d(a) || r.unresolved === !0
		};
		s.set(t, o), i.push(o);
	}
	function p(e, t, r = !1) {
		let i;
		for (let o of e ?? []) if (o.iterations) {
			let e = Math.min(o.iterations.length - 1, Math.max(0, n.get(o.id) ?? 0));
			o.iterations.forEach((n, i) => {
				let s = u(o, `visit:${i}`);
				a.push({
					id: s,
					type: "loop",
					label: n.label ?? `Prepared visit ${i + 1}`,
					selected: i === e,
					parentRegionId: t
				});
				let c = n.children?.find((e) => e.indices?.[0] === n.indices[0]) ?? o;
				f(o, n.indices[0], s, {
					control: "loop",
					visit: i,
					unresolved: r
				}, c), p(n.children, s, r);
			});
		} else if (o.branches) {
			let e = u(o, "scope");
			a.push({
				id: e,
				type: o.type,
				label: o.title ?? o.type,
				parentRegionId: t
			}), f(o, o.indices[0], e, {
				control: o.type,
				unresolved: r || o.ownershipStatus === "unresolved"
			}), p(o.children, e, r || o.ownershipStatus === "unresolved"), o.branches.forEach((t, n) => {
				let i = u(o, `arm:${n}`);
				a.push({
					id: i,
					type: o.type === "decision" ? "branch" : o.type,
					label: t.label,
					selected: t.selected,
					parentRegionId: e
				}), p(t.children, i, r || o.ownershipStatus === "unresolved"), o.type === "decision" && t.label?.startsWith("No · continue without body") && !t.indices?.length && !t.children?.length && c.push({
					node: o,
					branch: t,
					regionId: e
				});
			});
		} else {
			let e = r || d(o), n = t;
			e && (i || (i = u(o, "unresolved"), a.push({
				id: i,
				type: "unresolved",
				label: "Unresolved · source ownership not proven",
				parentRegionId: t
			})), n = i), f(o, o.indices?.[0], n, { unresolved: e }), p(o.children, n, e);
		}
	}
	p(e), i.sort((e, t) => e.index - t.index);
	let m = new Map(a.map((e) => [e.id, e]));
	function h(e, t) {
		for (let n = e.parentRegionId; n; n = m.get(n)?.parentRegionId) if (m.get(n)?.label?.toLowerCase().startsWith(t)) return !0;
		return !1;
	}
	function g(e, t) {
		for (let n = e.parentRegionId; n; n = m.get(n)?.parentRegionId) if (n === t) return !0;
		return !1;
	}
	function _(e, t) {
		let n = /* @__PURE__ */ new Set();
		for (let t = e.parentRegionId; t; t = m.get(t)?.parentRegionId) m.get(t)?.type === "try" && n.add(t);
		for (let e = t.parentRegionId; e; e = m.get(e)?.parentRegionId) if (n.has(e)) return !0;
		return !1;
	}
	function v(e) {
		for (let t = e.parentRegionId; t; t = m.get(t)?.parentRegionId) {
			let e = m.get(t);
			if (e?.type === "branch" && m.get(e.parentRegionId)?.type === "decision") return {
				id: t,
				parent: e.parentRegionId
			};
		}
	}
	let y;
	for (let e = 1; e < i.length; e++) {
		let t = i[e - 1], n = i[e];
		if (l(t.node) !== l(n.node)) continue;
		(t.event?.kind === "return" || t.event?.kind === "throw") && (y = t);
		let r = y?.event?.kind === "throw" && n.event?.kind === "catch" && _(y, n), a = y && h(n, "finally") && _(y, n);
		if (y && !r && !a) continue;
		r && (y = void 0);
		let s = n.control === "loop" && n.visit > 0 && g(t, u(n.node, `visit:${n.visit - 1}`)) ? "loopback" : n.event?.kind === "catch" ? "catch" : h(n, "finally") ? "finally" : h(n, "yes") || h(n, "no") ? "branch" : "step", c = v(t), d = v(n), f = c && d && c.parent === d.parent && c.id !== d.id;
		o.push({
			id: `${t.id}->${n.id}`,
			source: t.id,
			target: n.id,
			kind: s,
			status: t.unresolved || n.unresolved || f || n.index !== t.index + 1 ? "unknown" : "prepared"
		});
	}
	for (let { node: e, branch: t, regionId: n } of c) {
		let r = s.get(e.indices[0]), a = Math.max(...e.indices), c = i.find((t) => t.index > a && l(t.node) === l(e) && !g(t, n));
		r && c && !o.some((e) => e.source === r.id && e.target === c.id) && o.push({
			id: `${r.id}->${c.id}:branch:${t.label}`,
			source: r.id,
			target: c.id,
			kind: "branch",
			label: t.label,
			status: r.unresolved || c.unresolved ? "unknown" : t.selected === !1 ? "not-selected" : t.selected === void 0 ? "possible" : "prepared"
		});
	}
	return {
		cards: i,
		regions: a,
		edges: o,
		topologyKey: JSON.stringify([
			i.map(({ id: e, parentRegionId: t }) => [e, t]),
			a.map(({ id: e, parentRegionId: t, selected: n }) => [
				e,
				t,
				n
			]),
			o.map(({ id: e, kind: t, status: n }) => [
				e,
				t,
				n
			])
		])
	};
}
// public/diagram-elk-layout.js
var KA = 3e4, qA = {
	vertical: "DOWN",
	horizontal: "RIGHT"
}, JA = (e, t) => {
	if (!Number.isFinite(e) || e < 0) throw Error(`Invalid ${t}: expected nonnegative finite geometry`);
	return e;
};
function YA(e) {
	if (!e || !Array.isArray(e.cards) || !Array.isArray(e.regions) || !Array.isArray(e.edges)) throw Error("Invalid prepared control-flow topology");
	let t = /* @__PURE__ */ new Set();
	for (let n of [
		...e.cards,
		...e.regions,
		...e.edges
	]) {
		if (typeof n.id != "string" || !n.id || t.has(n.id)) throw Error(`Duplicate or invalid topology id: ${n.id}`);
		t.add(n.id);
	}
	let n = new Map(e.regions.map((e) => [e.id, e]));
	for (let t of [...e.regions, ...e.cards]) {
		let e = /* @__PURE__ */ new Set();
		for (let r = t.parentRegionId; r; r = n.get(r)?.parentRegionId) {
			if (!n.has(r) || r === t.id || e.has(r)) throw Error(`Invalid parent region or cycle for ${t.id}`);
			e.add(r);
		}
	}
	let r = new Set(e.cards.map((e) => e.id));
	for (let t of e.edges) if (!r.has(t.source) || !r.has(t.target)) throw Error(`Invalid edge endpoint for ${t.id}`);
	return n;
}
function XA(e, t, n) {
	if (YA(e), t !== "vertical" && t !== "horizontal") throw Error(`Invalid layout direction: ${t}`);
	if (typeof n != "function") throw TypeError("extraHeight must be a function");
	let r = {
		id: "control-flow",
		layoutOptions: {
			"elk.algorithm": "layered",
			"elk.direction": qA[t],
			"elk.layered.wrapping.strategy": t === "horizontal" ? "MULTI_EDGE" : "OFF",
			"elk.aspectRatio": 2,
			"elk.hierarchyHandling": "INCLUDE_CHILDREN",
			"elk.edgeRouting": "ORTHOGONAL",
			"elk.padding": "[top=16,left=16,bottom=16,right=16]"
		},
		children: [],
		edges: []
	}, i = /* @__PURE__ */ new Map([["", r]]);
	for (let n of e.regions) {
		let r = e.cards.filter((e) => e.parentRegionId === n.id).length + e.regions.filter((e) => e.parentRegionId === n.id).length, a = {
			id: n.id,
			layoutOptions: {
				"elk.algorithm": "layered",
				"elk.direction": qA[t],
				"elk.layered.wrapping.strategy": t === "horizontal" && r >= 8 ? "MULTI_EDGE" : "OFF",
				"elk.aspectRatio": 2,
				"elk.padding": "[top=40,left=16,bottom=16,right=16]"
			},
			children: []
		};
		i.set(n.id, a);
	}
	for (let t of e.regions) i.get(t.parentRegionId || "").children.push(i.get(t.id));
	for (let t of e.cards) {
		let e = t.node?.title ?? t.event?.label ?? "", r = n(t.node?.id ?? t.id);
		JA(r, `extraHeight for ${t.id}`);
		let a = t.control === "loop" ? 136 : t.control === "decision" ? 144 : 120;
		i.get(t.parentRegionId || "").children.push({
			id: t.id,
			width: 260,
			height: a + Math.max(0, Math.ceil(e.length / 30) - 1) * 20 + r
		});
	}
	return r.edges = e.edges.map(({ id: e, source: t, target: n }) => ({
		id: e,
		sources: [t],
		targets: [n]
	})), r;
}
function ZA(e, t) {
	if (YA(t), !e || typeof e != "object" || !Array.isArray(e.children)) throw Error("Malformed ELK graph");
	let n = JA(e.width, "graph width"), r = JA(e.height, "graph height"), i = new Set([...t.cards, ...t.regions].map(({ id: e }) => e)), a = new Map([...t.cards, ...t.regions].map(({ id: e, parentRegionId: t }) => [e, t || ""])), o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set();
	function l(e, t, n) {
		if (!e || typeof e != "object") throw Error("Invalid ELK edge point");
		return {
			x: JA(e.x + t, "edge x"),
			y: JA(e.y + n, "edge y")
		};
	}
	function u(e, n, r, d = "") {
		if (c.has(e)) throw Error("ELK child cycle");
		c.add(e);
		for (let i of e.edges ?? []) {
			if (!i || !t.edges.some((e) => e.id === i.id) || s.has(i.id)) throw Error(`Duplicate or unknown ELK edge ${i?.id}`);
			if (!Array.isArray(i.sections) || !i.sections.length) throw Error(`Invalid ELK edge route ${i.id}`);
			let e = i.sections.map((e) => [
				l(e.startPoint, n, r),
				...(e.bendPoints ?? []).map((e) => l(e, n, r)),
				l(e.endPoint, n, r)
			]);
			s.set(i.id, e);
		}
		if (!Array.isArray(e.children)) throw Error("Malformed ELK children");
		for (let t of e.children) {
			if (!t || !i.has(t.id) || o.has(t.id)) throw Error(`Duplicate or unknown ELK child ${t?.id}`);
			if (a.get(t.id) !== d) throw Error(`Invalid ELK parent ownership for ${t.id}`);
			let e = n + JA(t.x, `${t.id} x`), s = r + JA(t.y, `${t.id} y`), c = JA(t.width, `${t.id} width`), l = JA(t.height, `${t.id} height`);
			if (o.set(t.id, {
				x: e,
				y: s,
				width: c,
				height: l
			}), t.children) u(t, e, s, t.id);
			else if (t.edges?.length) throw Error(`Invalid ELK edges inside leaf ${t.id}`);
		}
	}
	if (u(e, 0, 0), o.size !== i.size || s.size !== t.edges.length) throw Error("Malformed ELK graph: missing card, region or edge geometry");
	let d = t.cards.map((e) => ({
		...e,
		...o.get(e.id)
	})), f = t.regions.map((e) => ({
		...e,
		...o.get(e.id)
	})), p = new Map(f.map((e) => [e.id, e]));
	for (let e of d) {
		let t = p.get(e.parentRegionId);
		if (t && (e.x < t.x || e.y < t.y || e.x + e.width > t.x + t.width || e.y + e.height > t.y + t.height)) throw Error(`Invalid ELK ownership geometry for ${e.id}`);
	}
	return {
		cards: d,
		regions: f,
		edges: t.edges.map((e) => {
			let t = s.get(e.id), n = [...t[0]];
			for (let r of t.slice(1)) {
				let t = n.at(-1);
				if (t.x !== r[0].x || t.y !== r[0].y) throw Error(`Invalid disconnected ELK edge sections for ${e.id}`);
				n.push(...r.slice(1));
			}
			return {
				...e,
				sections: t,
				points: n
			};
		}),
		width: n,
		height: r
	};
}
function QA({ workerUrl: e = "/vendor/elk-worker.min.js" } = {}) {
	let t = 0, n = 0, r = 0, i, a, o = !1;
	function s(e, t, n) {
		e && !e.settled && (e.settled = !0, clearTimeout(e.timer), e.signal?.removeEventListener("abort", e.onAbort), a?.requests.delete(e.id), t ? e.reject(t) : e.resolve(n));
	}
	function c(e) {
		let n = a;
		if (n) {
			a = void 0, n.worker.terminate();
			for (let t of n.requests.values()) s(t, e);
			n.requests.clear(), t++;
		}
	}
	function l(e, n) {
		if (a !== e || e.epoch !== t) return;
		let o = n?.data;
		if (!o || typeof o != "object" || !Number.isInteger(o.id)) {
			c(/* @__PURE__ */ Error("Malformed Worker response"));
			return;
		}
		if (o.id === e.registerId && !e.registered) {
			if (o.error || "data" in o) {
				c(/* @__PURE__ */ Error("Malformed Worker register ACK"));
				return;
			}
			e.registered = !0;
			for (let t of e.requests.values()) if (!t.settled) try {
				e.worker.postMessage(t.message);
			} catch (e) {
				c(e);
				return;
			}
			return;
		}
		let l = e.requests.get(o.id);
		if (l && !l.settled) {
			if (l.epoch !== t || l.generation !== r || l.geometryKey !== i || "workerEpoch" in o && o.workerEpoch !== l.epoch || "geometryKey" in o && o.geometryKey !== l.geometryKey) s(l, /* @__PURE__ */ Error("Stale Worker epoch/request/geometry mismatch"));
			else if ("error" in o) {
				let e = o.error?.message ?? String(o.error);
				s(l, /* @__PURE__ */ Error(`ELK Worker error: ${e}`));
			} else try {
				s(l, null, ZA(o.data, l.prepared));
			} catch (e) {
				s(l, e);
			}
		}
	}
	function u() {
		if (a) return a;
		let r = new Worker(e), i = {
			worker: r,
			epoch: t,
			registerId: n++,
			registered: !1,
			requests: /* @__PURE__ */ new Map()
		};
		a = i, r.onmessage = (e) => l(i, e), r.onerror = (e) => {
			a === i && t === i.epoch && c(/* @__PURE__ */ Error(`ELK Worker failed: ${e?.message ?? "unknown error"}`));
		}, r.onmessageerror = () => {
			a === i && t === i.epoch && c(/* @__PURE__ */ Error("ELK Worker message error"));
		};
		try {
			r.postMessage({
				cmd: "register",
				algorithms: ["layered"],
				id: i.registerId
			});
		} catch (e) {
			throw c(e), e;
		}
		return i;
	}
	function d(e, { direction: t = "vertical", extraHeight: l = () => 0, signal: d, timeoutMs: f = KA } = {}) {
		if (o) return Promise.reject(/* @__PURE__ */ Error("Control layout disposed"));
		if (d?.aborted) return Promise.reject(/* @__PURE__ */ Error("Control layout aborted"));
		let p;
		try {
			if (p = XA(e, t, l), !Number.isFinite(f) || f <= 0) throw Error("Invalid Worker timeout");
		} catch (e) {
			return Promise.reject(e);
		}
		let m = JSON.stringify([
			e.topologyKey,
			t,
			p
		]);
		r++, i = m;
		for (let e of a?.requests.values() ?? []) s(e, /* @__PURE__ */ Error("Stale control layout request"));
		let h;
		try {
			h = u();
		} catch (e) {
			return Promise.reject(e);
		}
		return new Promise((t, i) => {
			let a = n++, o = {
				id: a,
				resolve: t,
				reject: i,
				prepared: e,
				signal: d,
				geometryKey: m,
				epoch: h.epoch,
				generation: r,
				settled: !1,
				message: {
					cmd: "layout",
					graph: p,
					layoutOptions: {},
					options: {
						logging: !1,
						measureExecutionTime: !1
					},
					id: a
				}
			};
			if (o.onAbort = () => c(/* @__PURE__ */ Error("Control layout aborted")), h.requests.set(a, o), d?.addEventListener("abort", o.onAbort, { once: !0 }), o.timer = setTimeout(() => c(/* @__PURE__ */ Error("ELK Worker timeout")), f), h.registered) try {
				h.worker.postMessage(o.message);
			} catch (e) {
				c(e);
			}
		});
	}
	return {
		layout: d,
		dispose() {
			o || (o = !0, c(/* @__PURE__ */ Error("Control layout disposed")));
		}
	};
}
// public/diagram-label-placement.js
var $A = (e, t) => e.x < t.x + t.width + 6 && e.x + e.width + 6 > t.x && e.y < t.y + t.height + 6 && e.y + e.height + 6 > t.y;
function ej(e, t, n, r) {
	if (!Array.isArray(e) || e.length < 2 || !t) return null;
	let i = String(t).split("\n"), a = Math.max(46, ...i.map((e) => e.length * 6 + 20)), o = i.length * 14 + 12, s = [];
	for (let t = 1; t < e.length; t++) {
		let n = e[t - 1], r = e[t];
		if (![
			n.x,
			n.y,
			r.x,
			r.y
		].every(Number.isFinite)) return null;
		let i = n.y === r.y, a = n.x === r.x, o = Math.abs(n.x - r.x) + Math.abs(n.y - r.y);
		!i && !a || o < 32 || s.push({
			a: n,
			b: r,
			horizontal: i,
			length: o
		});
	}
	s.sort((e, t) => t.length - e.length);
	for (let { a: e, b: t, horizontal: i } of s) for (let s of [
		.5,
		.25,
		.75,
		.125,
		.875
	]) {
		let c = e.x + (t.x - e.x) * s, l = e.y + (t.y - e.y) * s;
		for (let e of [-1, 1]) {
			let t = i ? {
				x: c - a / 2,
				y: l + (e < 0 ? -o - 10 : 10),
				width: a,
				height: o
			} : {
				x: c + (e < 0 ? -a - 10 : 10),
				y: l - o / 2,
				width: a,
				height: o
			};
			if (![...n, ...r].some((e) => $A(t, e))) return r.push(t), t;
		}
	}
	return null;
}
// public/diagram.js
J.autoInsertCSS = !1;
var tj = 260, nj = 116, rj = 64, ij = 3, $ = (e, t, n) => {
	let r = document.createElement(e);
	return r.textContent = t, n && (r.className = n), r;
}, aj = (e) => {
	if (e?.output !== void 0) return AA(e.output);
	let t = e && Object.hasOwn(e, "result") ? e.result : e?.after ?? e?.inputs;
	return t === void 0 ? "No value snapshot" : JSON.stringify(t, null, 2);
};
SS.register({
	shape: "code-anime-card",
	width: tj,
	height: nj,
	effect: ["data"],
	html(e) {
		let t = e.getData();
		if (t.placeholder) {
			let e = $("div", t.label, "diagram-path-note");
			return e.dataset.nodeId = t.id, e.dataset.parentId = t.parentId, e;
		}
		let n = $("article", "", "diagram-card" + (t.active ? " is-active" : ""));
		n.dataset.nodeId = t.id, n.dataset.controlType = t.control ?? t.kind, t.unresolved && (n.dataset.sourceOwnership = "unresolved"), t.control && n.classList.add("diagram-control"), n.translate = !1, n.dataset.step = t.index, n.dataset.callId = t.callId ?? "", t.parentId && (n.dataset.parentId = t.parentId), t.expanded && !t.parentId && n.classList.add("diagram-expanded-method"), t.active && n.setAttribute("aria-current", "step");
		let r = $("div", "", "diagram-card-header");
		if (r.append($("span", String(t.index).padStart(2, "0"), "diagram-step"), $("span", t.simulated ?? t.kind, "diagram-kind"), $("span", t.active ? `Current · ${t.certainty}` : t.certainty, "diagram-state")), t.simulated) {
			let e = r.querySelector(".diagram-kind");
			e.title = t.simulated, Object.assign(e.style, {
				minWidth: "0",
				flex: "1",
				whiteSpace: "nowrap",
				overflow: "hidden",
				textOverflow: "ellipsis",
				textTransform: "none"
			}), r.querySelector(".diagram-step").style.flexShrink = "0", r.querySelector(".diagram-state").style.flexShrink = "0";
		}
		let i = $("button", t.label, "diagram-name");
		i.type = "button", i.title = t.code ?? t.symbol, t.simulated && (i.style.whiteSpace = "nowrap"), i.setAttribute("aria-label", t.expandLabel ?? "Expand method " + t.symbol), i.onclick = () => t.onExpand(t), t.expandable !== !1 && i.setAttribute("aria-expanded", String(!!t.expanded));
		let a = t.source ? `${t.source.file}:${t.source.line}` : t.group ?? "Prepared flow", o = $("div", a, "diagram-location");
		o.title = a;
		let s = $("details", "", "diagram-values");
		s.open = !!t.valuesOpen;
		let c = $("summary", "Values · prepared", "diagram-values-summary");
		c.setAttribute("aria-label", "Toggle values for " + t.label), t.kind === "function" && t.inputs === void 0 && (c.textContent = "Inputs unavailable · values"), t.inputs !== void 0 && (c.textContent = "Inputs + values · simulated", c.title = "Inputs: " + JSON.stringify(t.inputs)), s.append(c, $("pre", t.inputs === void 0 ? t.value : "Inputs (simulated)\n" + JSON.stringify(t.inputs, null, 2) + "\n\nCurrent value (prepared)\n" + t.value, "diagram-value")), c.onclick = (e) => {
			e.preventDefault(), t.onValues(t.id);
		};
		let l = $("button", "Go to step " + t.index + " ›", "diagram-seek");
		l.type = "button", l.title = "Go to source step " + t.index, l.onclick = () => t.onSeek(t.index);
		let u = $("div", "", "diagram-card-actions");
		if (u.append(l), t.callId) {
			let e = $("button", "Inspect", "diagram-inspect");
			e.type = "button", e.title = "Inspect method " + t.symbol, e.setAttribute("aria-label", "Inspect method " + t.symbol), e.onclick = () => t.onSelect(t.symbol, t.callId), u.append(e);
		}
		let d = $("span", t.level === "step" ? "View source step" : t.inline ? t.expanded ? "− Collapse steps" : "+ Expand steps" : "Open details", "diagram-action-cue");
		if (d.setAttribute("aria-hidden", "true"), i.append(d), n.append(r, i, o), t.control === "decision" && n.append($("strong", typeof t.event?.values?.condition == "boolean" ? `Condition ${t.event.values.condition}` : "Outcome unknown", "diagram-condition")), t.visits?.length) {
			let e = $("select", "", "diagram-visit");
			e.setAttribute("aria-label", "Visit for " + t.label), t.visits.forEach((t, n) => {
				let r = $("option", t.label);
				r.value = String(n), e.append(r);
			}), e.value = String(t.visit), e.onchange = () => t.onVisit(Number(e.value)), n.append(e);
		}
		if (t.invocations?.length > 1) {
			let e = $("select", "", "diagram-invocation");
			e.setAttribute("aria-label", "Invocation of " + t.symbol);
			for (let n of t.invocations) {
				let t = $("option", `${n.callId} · step ${n.index} · from ${n.parentSymbol ?? "entry"}`);
				t.value = n.callId, e.append(t);
			}
			e.value = t.callId, e.onchange = () => t.onInvocation(e.value), n.append(e);
		}
		return (t.kind === "function" || t.inputs !== void 0 || t.value !== "{}" && t.value !== "No value snapshot") && n.append(s), n.append(u), n;
	}
}), SS.register({
	shape: "code-anime-control-region",
	effect: ["data"],
	html(e) {
		let t = e.getData(), n = $("div", "", "diagram-control-region");
		return n.dataset.controlType = t.type, n.dataset.selected = String(t.selected), t.type === "unresolved" && (n.dataset.status = "unknown"), n.setAttribute("aria-label", `${t.label} · ${t.selected === !1 ? "not selected" : t.type === "unresolved" ? "unknown source ownership" : "prepared source scope"}`), n.append($("span", t.label)), n;
	}
}), SS.register({
	shape: "code-anime-group",
	effect: ["data"],
	html(e) {
		let t = e.getData(), n = $("section", "", `diagram-boundary diagram-boundary-${t.kind}${t.active ? " is-active" : ""}`);
		n.dataset.groupId = t.id, n.dataset.groupKind = t.kind, n.setAttribute("aria-label", `${t.kind}: ${t.label}`);
		let r = $("div", `${t.kind === "file" ? "File" : "Class / owner"} · ${t.label}`, "diagram-boundary-label");
		return r.title = r.textContent, n.append(r), n;
	}
});
function oj(e, { onSelect: t, onSeek: n, onPause: r }) {
	e.className = "diagram-canvas";
	let i = $("div", "", "diagram-heading"), a = $("strong", "Execution path"), o = $("span", "Prepared steps · not runtime execution");
	i.append(a, o);
	let s = $("span", "◇ Decision · ↻ Loop · ! Recovery · ↩ Return", "diagram-control-legend");
	i.append(s);
	let c = $("div", "", "diagram-surface");
	c.setAttribute("aria-label", "Interactive execution diagram. Arrow keys pan; plus and minus zoom."), c.tabIndex = 0;
	let l = $("div", "", "diagram-footer"), u = $("div", "", "diagram-pages"), d = $("div", "", "diagram-controls");
	d.setAttribute("role", "group"), d.setAttribute("aria-label", "Diagram navigation controls");
	let f = (e, t, n) => {
		let r = $("button", e);
		return r.type = "button", r.title = t, r.setAttribute("aria-label", t), r.onclick = n, r;
	}, p = "code-anime-diagram-orientation", m = "vertical";
	try {
		let e = localStorage.getItem(p);
		if (e === "vertical" || e === "horizontal") m = e;
		else if (e === null) {
			let e = localStorage.getItem("code-anime-layout");
			if (e === "vertical" || e === "horizontal") {
				m = e;
				try {
					localStorage.setItem(p, m);
				} catch {}
			}
		}
	} catch {}
	let h = f("", "", () => {
		m = m === "vertical" ? "horizontal" : "vertical";
		try {
			localStorage.setItem(p, m);
		} catch {}
		_(), ie = "", ze(E);
	});
	h.className = "diagram-orientation";
	let g = $("span", "", "diagram-layout-icon");
	g.setAttribute("aria-hidden", "true"), h.append(g);
	function _() {
		let t = m === "vertical" ? "Horizontal layout" : "Vertical layout";
		h.title = t, h.setAttribute("aria-label", t), g.style.transform = m === "vertical" ? "" : "rotate(90deg)", e.dataset.direction = m;
	}
	_(), d.append(h, f("−", "Zoom out", () => Fe(-.15)), f("Fit", "Fit diagram", () => Pe({ full: !0 })), f("+", "Zoom in", () => Fe(.15)));
	let v = $("div", "", "diagram-pan-buttons");
	v.setAttribute("role", "group"), v.setAttribute("aria-label", "Pan diagram");
	for (let [e, t, n] of [
		[
			"Left",
			80,
			0
		],
		[
			"Right",
			-80,
			0
		],
		[
			"Up",
			0,
			80
		],
		[
			"Down",
			0,
			-80
		]
	]) v.append(f(e, "Pan " + e.toLowerCase(), () => j(t, n)));
	d.prepend(v);
	let y = $("details", "", "diagram-routing-status");
	y.hidden = !0;
	let b = $("div", "", "diagram-layout-status");
	b.setAttribute("role", "status"), b.setAttribute("aria-live", "polite"), b.hidden = !0, l.append(u, b, y, d), e.replaceChildren(i, c, l);
	let x = new X({
		container: c,
		async: !1,
		autoResize: !1,
		panning: !0,
		mousewheel: {
			enabled: !0,
			modifiers: ["ctrl", "meta"]
		},
		interacting: !1,
		preventDefaultMouseDown: !1,
		background: { color: "transparent" }
	}), S, C = [], w = [], T = /* @__PURE__ */ new Map(), E = {}, D = 0, O = !1, k, A = $("div", "", "diagram-selection");
	A.hidden = !0, i.append(A);
	function ee(e) {
		k = e;
		let n = F.get(e)?.getData();
		A.hidden = !n, n ? (te(), A.replaceChildren($("span", n.label), f("Read", "Read selected node", () => {
			x.zoomTo(1), x.centerCell(F.get(e));
		}), f(n.level === "step" ? "Source" : "Expand / collapse", "Open selected node", () => je(F.get(e).getData())), f("Values", "Toggle selected node values", () => Ee(e)), f("Inspect", "Inspect selected node", () => t(n.symbol, n.callId)), f("Close", "Close selected node actions", () => {
			ee(void 0), te(), c.focus({ preventScroll: !0 });
		}))) : (k = void 0, A.replaceChildren());
	}
	function te() {
		let e = F.get(k)?.getData().callId;
		for (let t of I) {
			let n = !!e && t.getData().callId === e;
			t.attr("root/data-selected-pair", n ? "true" : "false"), t.attr("line/strokeWidth", n ? 3.5 : t.attr("line/stroke") === "#4f46e5" ? 2.5 : 1.5);
		}
	}
	x.on("node:click", ({ node: e }) => {
		F.has(e.id) && ee(e.id);
	});
	let ne = (e) => {
		let t = e.target.closest(".diagram-card");
		t && e.target.matches(":focus-visible") && k !== t.dataset.nodeId && ee(t.dataset.nodeId);
	};
	e.addEventListener("focusin", ne);
	function j(e, t) {
		let n = x.translate();
		x.translate(n.tx + e, n.ty + t);
	}
	c.addEventListener("keydown", (e) => {
		if (e.target !== c) return;
		let t = {
			ArrowLeft: [80, 0],
			ArrowRight: [-80, 0],
			ArrowUp: [0, 80],
			ArrowDown: [0, -80]
		};
		t[e.key] ? (e.preventDefault(), e.stopPropagation(), j(...t[e.key])) : [
			"+",
			"=",
			"-"
		].includes(e.key) && (e.preventDefault(), e.stopPropagation(), Fe(e.key === "-" ? -.15 : .15));
	});
	let re = 0;
	x.on("translate", () => ++re), x.on("scale", () => {
		++re, e.classList.toggle("diagram-overview", x.zoom() < .6);
	});
	let ie = "", ae = -1, oe = !1, se = 0, M = QA(), ce = /* @__PURE__ */ new Map(), le = /* @__PURE__ */ new Map(), N = /* @__PURE__ */ new Map(), P, ue = 0, de = !1, fe = 0, pe = !1;
	function me() {
		let t = [...N.keys()].filter((e) => le.has(e)), n = [...N.keys()].filter((e) => !ce.has(e) && !le.has(e));
		b.hidden = !n.length && !t.length;
		let r = (n.length || t.length) && F.size > 0 && se !== ue;
		b.textContent = t.length ? `ELK Worker layout failed: ${le.get(t[0])}. Prepared playback remains available; no route was invented.${r ? " Previous trace layout shown; not current prepared evidence." : ""}` : n.length ? `ELK Worker layout pending for ${n.length} expanded method${n.length === 1 ? "" : "s"}. ${r ? "Previous trace layout shown; not current prepared evidence until replacement finishes." : "Existing diagram retained."}` : "", e.dataset.layoutState = r ? "stale" : n.length ? "pending" : t.length ? "failed" : "ready";
	}
	function he(e, t) {
		let n = [...e.keys()];
		if (P && !e.has(P.key) && P.abort.abort(), N = e, n.some((e) => !ce.has(e) && !le.has(e)) ? t && !de && (de = !0, pe = !1, fe = re) : P || (de = !1), me(), P) return;
		let r = n.find((e) => !ce.has(e) && !le.has(e));
		if (!r) return;
		let { prepared: i, direction: a, extraHeights: o } = e.get(r), s = new AbortController(), c = ue;
		P = {
			key: r,
			abort: s
		}, M.layout(i, {
			direction: a,
			extraHeight: (e) => o.get(e) ?? 0,
			signal: s.signal
		}).then((e) => {
			!oe && c === ue && N.has(r) && ce.set(r, e);
		}, (e) => {
			!oe && !s.signal.aborted && c === ue && N.has(r) && le.set(r, e.message);
		}).finally(() => {
			if (!(oe || P?.key !== r)) {
				if (P = void 0, me(), [...N.keys()].some((e) => !ce.has(e) && !le.has(e))) he(N, de);
				else {
					let e = de && fe === re, t = pe;
					de = !1, ze(E, !1), e && !oe && Pe({ full: t });
				}
			}
		});
	}
	let F = /* @__PURE__ */ new Map(), ge = /* @__PURE__ */ new Map(), I = [], _e = /* @__PURE__ */ new Set(), ve = /* @__PURE__ */ new Set(), ye = /* @__PURE__ */ new Map(), be = /* @__PURE__ */ new Map(), xe, Se = /* @__PURE__ */ new Set(), Ce = 0, we = (e) => Se.has(e) ? 160 : 0;
	function Te(e) {
		let t = F.get(e), n = t && x.findViewByCell(t)?.container.querySelector(".diagram-values-summary");
		if (!n) return;
		let r = n.getBoundingClientRect(), i = c.getBoundingClientRect(), a = i.left + 12, o = i.right - 12, s = i.top + 12, l = i.bottom - 12, u = document.querySelector(".playback-dock")?.getBoundingClientRect();
		if (u && u.top < l && u.bottom > s && u.left < o && u.right > a && (l = Math.min(l, u.top - 12)), l <= s || o <= a) return;
		let d = r.left < a ? a - r.left : r.right > o ? o - r.right : 0, f = r.top < s ? s - r.top : r.bottom > l ? l - r.bottom : 0;
		(d || f) && j(d, f);
	}
	let Ee = (e) => {
		r?.(), de = !1, pe = !1;
		let t = !Se.has(e);
		t ? Se.add(e) : Se.delete(e);
		let n = ++Ce;
		ze(E, !1), t && requestAnimationFrame(() => {
			!oe && n === Ce && Se.has(e) && Te(e);
		});
	}, De, L = null, Oe = [], ke = $("div", "", "diagram-navigation");
	i.append(ke);
	function Ae(e, t = !1) {
		r?.(), t ? Oe = [] : Oe.push(L), L = e, D = 0, O = !1, ie = "", ze(E), ke.querySelector("button")?.focus({ preventScroll: !0 });
	}
	function je(t) {
		if (t.level === "class") Ae({
			kind: "class",
			id: t.owner
		});
		else if (t.level === "step") n(t.index);
		else if (t.callId && C.length) {
			if (E.mode === "map" && !L) {
				r?.();
				let n = F.has(t.id) ? t.id : t.callId, i = (t) => [...e.querySelectorAll(".diagram-card")].find((e) => e.dataset.nodeId === t)?.getBoundingClientRect(), a = i(n);
				ve.has(t.id) ? ve.delete(t.id) : ve.add(t.id), ie = "", ze(E, !1);
				let o = F.get(n) ?? F.get(t.callId);
				if (o && a) {
					let e = i(o.id);
					e && j(a.x - e.x, a.y - e.y), ee(o.id);
				}
			} else Ae({
				kind: "method",
				id: t.callId
			});
		} else n(t.index);
	}
	function Me(e, t = 1) {
		return t < 0 ? De.previous(e, L) : De.next(e, L);
	}
	let Ne = $("div", "", "diagram-groups");
	i.append(Ne);
	function Pe({ full: e = !1 } = {}) {
		if (!oe && c.clientWidth && c.clientHeight && x.getNodes().length) {
			if (x.resize(c.clientWidth, c.clientHeight), e) {
				x.zoomToFit({
					padding: 24,
					maxScale: 1
				}), [...N.keys()].some((e) => !ce.has(e) && !le.has(e)) && (de = !0, pe = !0, fe = re);
				return;
			}
			if (x.zoomToFit({
				padding: 24,
				minScale: .9,
				maxScale: 1
			}), x.zoom() <= .9) {
				let e = [...F.values()].find((e) => e.getData().control === "loop") ?? [...F.values()][0];
				if (e) {
					x.centerCell(e);
					let t = F.get(e.getData().parentId);
					if (t) {
						let n = t.getBBox(), r = e.getBBox();
						n.width * x.zoom() <= c.clientWidth - 48 && j((r.center.x - n.center.x) * x.zoom(), 0);
					}
				}
			}
		}
	}
	function Fe(e) {
		x.zoomTo(Math.max(.25, Math.min(1.6, x.zoom() + e)));
	}
	let Ie = !1, Le = new ResizeObserver(() => {
		if (oe || !c.clientWidth || !c.clientHeight) return;
		x.resize(c.clientWidth, c.clientHeight);
		let e = !Ie;
		Ie = !0, ze(E, e);
	});
	Le.observe(c);
	function Re(e, t = !1) {
		ue++, ce.clear(), le.clear(), N = /* @__PURE__ */ new Map(), de = !1, pe = !1, P?.abort.abort(), ++Ce, S = e, C = e.trace?.events ?? [], De = FA(C, e.trace?.sourceFiles), xe = WA(e), t || (L = null, Oe = [], ve.clear(), Se.clear(), ye.clear(), be.clear(), k = void 0, A.hidden = !0, A.replaceChildren()), w = NA(C).invocations, T = IA(C, w), w.length || (w = [...new Set(e.steps.flatMap((e) => [e.from, e.to]))].map((t) => ({
			callId: t,
			symbol: t,
			methodName: t.split(/[.:]/).at(-1),
			className: "Prepared structure",
			index: e.steps.findIndex((e) => e.from === t || e.to === t) + 1,
			certainty: "unverified"
		}))), ie = "", ae = -1, D = 0, O = !1, _e.clear();
	}
	function ze(i = {}, s = !0) {
		if (!S || oe) return;
		let l = document.activeElement, p = l?.closest(".diagram-card"), h = e.contains(l) ? p ? `.diagram-card[data-node-id="${CSS.escape(p.dataset.nodeId)}"] ${l.hasAttribute("aria-label") ? `[aria-label="${CSS.escape(l.getAttribute("aria-label"))}"]` : "." + l.className}` : l.hasAttribute("aria-label") ? `button[aria-label="${CSS.escape(l.getAttribute("aria-label"))}"]` : void 0 : void 0, g = E.mode;
		E = {
			mode: "map",
			cursor: 0,
			follow: !0,
			reducedMotion: !1,
			duration: 500,
			...i
		};
		let { mode: _, cursor: v, follow: b, reducedMotion: A, duration: ne } = E;
		g && g !== _ && (L = null, Oe = [], ie = ""), c.dataset.motion = A ? "reduced" : "full", c.style.setProperty("--diagram-duration", `${Math.max(100, ne)}ms`), (v !== ae || g !== _) && (O = !1);
		let re = C[Math.max(0, v - 1)], M = w.find((e) => e.callSiteIndex === v)?.callId ?? re?.callId ?? S.steps[Math.max(0, v - 1)]?.to, N = m === "vertical", P = [], de = [], fe = new Map(w.map((e) => [e.callId, e])), pe = PA(w, C), Ce = pe.byCall.get(M);
		ke.replaceChildren(), C.length && _ === "map" && !L ? ve.size && ke.append(f("Collapse methods", "Collapse expanded methods", () => {
			r?.(), ve.clear(), ie = "", ze(E);
		})) : C.length && (_ !== "map" && ke.append(f("Classes", "Show class-level diagram", () => Ae({ kind: "classes" }, !0))), L && (ke.append(f("↑ Collapse", "Collapse diagram level", () => {
			r?.(), L = Oe.pop() ?? null, D = 0, O = !1, ie = "", ze(E), ke.querySelector("button")?.focus({ preventScroll: !0 });
		})), ke.append(f("All steps", "Show all prepared steps", () => Ae(null, !0)))));
		let Te, Me;
		if (L) {
			if (Te = (L.kind === "classes" ? De.classes : L.kind === "class" ? De.methods(L.id) : De.flowSteps(L.id)).map((e) => ({
				...e,
				level: e.kind,
				kind: e.kind === "step" ? e.event.kind : e.kind,
				expandLabel: e.kind === "class" ? "Expand class " + e.owner : e.kind === "step" ? "Go to source step " + e.index : "Expand method " + e.symbol,
				expandable: e.kind !== "step",
				value: e.kind === "class" ? `${e.count} method invocations` : aj(e.event),
				active: v > 0 && (e.kind === "class" ? e.owner === De.owner(M) : e.kind === "method" ? L.kind === "class" ? M === e.callId : De.contains(M, e.callId) : e.index === v)
			})), b && !O) {
				let e = Te.findIndex((e) => e.active);
				e >= 0 && (D = Math.floor(e / ij));
			}
			D = Math.max(0, Math.min(D, Math.ceil(Te.length / ij) - 1)), P = Te.slice(D * ij, (D + 1) * ij), de = P.slice(1).map((e, t) => [P[t].id, e.id]), a.textContent = L.kind === "classes" ? "Classes / modules" : L.kind === "class" ? L.id : (fe.get(L.id)?.symbol ?? L.id) + " · " + L.id, o.textContent = L.kind === "classes" ? "Class-level playback · expand a class" : L.kind === "class" ? "Method-level playback · expand an invocation" : "Source-step playback · expand nested calls", o.textContent += " · arrows: " + (L.kind === "method" ? "prepared step order" : "first appearance order, not calls"), v > 0 && !Te.some((e) => e.active) && (o.textContent += " · cursor outside this scope");
		} else {
			a.textContent = "Execution path", o.textContent = "Prepared steps · not runtime execution", P = pe.functions.filter((e) => !_e.has(e.invocations[0].className)).map((e) => {
				let t = v > 0 && e.id === Ce;
				t && b && v !== ae && ye.set(e.id, M);
				let i = e.invocations.find((t) => t.callId === ye.get(e.id)) ?? e.invocations[0], a = C[i.index - 1], o = t && i.callId === M;
				return {
					id: e.id,
					invocations: e.invocations,
					onInvocation: (t) => {
						r?.(), ye.set(e.id, t), n(fe.get(t).index), ze(E, !1);
					},
					index: o ? v : i.index,
					symbol: i.symbol,
					label: i.methodName,
					callId: i.callId,
					group: i.className,
					file: a?.source?.file ?? "Source unavailable",
					source: t && re?.callId === i.callId ? re.source : a?.source,
					kind: "function",
					certainty: o ? re?.certainty : i.certainty,
					value: aj(o ? re : a),
					inputs: a?.inputs ?? C[i.callSiteIndex - 1]?.inputs,
					expanded: ve.has(e.id),
					steps: ve.has(e.id) ? De.steps(i.callId).filter((e) => e.kind === "step" && (e.event.kind !== "enter" || e.certainty === "unresolved")) : [],
					cursor: v,
					active: t
				};
			});
			let e = new Set(P.map((e) => e.id));
			de = pe.relationships.filter((t) => e.has(t.source) && e.has(t.target)).map((e) => [
				e.source,
				e.target,
				e.callId
			]);
		}
		if (L) Ne.replaceChildren();
		else if (_ === "map" && (ie === "" || g !== _)) {
			Ne.replaceChildren();
			for (let e of new Set(w.map((e) => e.className))) {
				let t = f(e, "Toggle group " + e, () => {
					_e.has(e) ? _e.delete(e) : _e.add(e), ie = "", ze(E);
				});
				t.setAttribute("aria-pressed", String(!_e.has(e))), Ne.append(t, f("›", "Open class " + e + " details", () => Ae({
					kind: "class",
					id: e
				})));
			}
		}
		let Fe = _ === "map" && !L, Ie = /* @__PURE__ */ new Map(), Le = /* @__PURE__ */ new Map();
		if (Fe) {
			let e = new Set(P.map((e) => e.id)), t = (t, n, r = "") => {
				let i = JSON.stringify([
					t,
					n,
					r
				]);
				if (!Ie.has(i)) {
					let a = "group:" + Ie.size;
					for (; e.has(a);) a += ":";
					e.add(a), Ie.set(i, {
						id: a,
						kind: t,
						label: t === "file" ? n : r,
						members: []
					});
				}
				return Ie.get(i);
			};
			for (let e of P) {
				let n = t("file", e.file);
				if (n.members.push(e.id), e.group === "Functions" || e.group === e.file) Le.set(e.id, n.id);
				else {
					let r = t("owner", e.file, e.group);
					r.parent = n.id, r.members.push(e.id), Le.set(e.id, r.id);
				}
			}
		}
		let Re = [], Be = [], Ve = /* @__PURE__ */ new Set([...P.map((e) => e.id), ...[...Ie.values()].map((e) => e.id)]), He = [], Ue = [], We = /* @__PURE__ */ new Set(), Ge = /* @__PURE__ */ new Map(), Ke = !1;
		for (let e of P) {
			let t = xe.methods.find((t) => t.id === e.callId);
			if (e.expanded && t) {
				let i = GA(t.items, {
					cursor: b ? v : 0,
					visits: be,
					methodCallId: e.callId
				}), a = new Map(i.regions.map((e) => [e.id, e]));
				for (let e of i.cards) for (let t = e.parentRegionId; t; t = a.get(t)?.parentRegionId) {
					let n = a.get(t);
					if (n?.type === "loop" && n.selected === !1) {
						We.add(e.index);
						break;
					}
				}
				let o = /* @__PURE__ */ new Map();
				for (let t of i.cards) {
					let n = we(JSON.stringify([
						"control",
						e.id,
						t.id
					]));
					o.set(t.node.id, Math.max(o.get(t.node.id) ?? 0, n));
				}
				let s = JSON.stringify([
					ue,
					e.id,
					i.topologyKey,
					m,
					c.clientWidth,
					[...o]
				]);
				Ge.set(s, {
					prepared: i,
					direction: m,
					extraHeights: o
				});
				let l = ce.get(s);
				if (!l) {
					le.has(s) || (Ke = !0);
					continue;
				}
				e.controlLayout = l, e.width = Math.max(tj, l.width + 32);
				let u = new Map(l.cards.map((t) => [t.id, JSON.stringify([
					"control",
					e.id,
					t.id
				])]));
				for (let t of l.cards) {
					if (t.placeholder) {
						Re.push({
							id: u.get(t.id),
							parentId: e.id,
							placeholder: !0,
							label: t.node.title,
							x: t.x,
							layoutY: t.y,
							width: t.width,
							height: t.height
						});
						continue;
					}
					let i = t.index ?? t.node.indices[0], a = C[i - 1] ?? t.event, o = e.steps.find((e) => e.index === i);
					Re.push({
						id: u.get(t.id),
						parentId: e.id,
						parentRegionId: t.parentRegionId ? JSON.stringify([e.id, t.parentRegionId]) : void 0,
						index: i,
						event: a,
						symbol: a?.symbolId ?? "Unknown prepared source",
						callId: e.callId,
						source: a?.source,
						certainty: a?.certainty ?? "unresolved",
						level: "step",
						kind: a?.kind ?? "unresolved",
						control: t.control,
						label: t.control ? t.node.title : o?.label ?? a?.label ?? "Unresolved prepared event",
						code: o?.code,
						simulated: t.control ? void 0 : `Simulated: ${a.label}`,
						x: t.x,
						layoutY: t.y,
						width: t.width,
						height: t.height,
						expandLabel: "Go to source step " + i,
						expandable: !1,
						value: aj(a),
						unresolved: t.unresolved || !C[i - 1],
						active: v === i,
						visits: t.control === "loop" ? t.node.iterations : void 0,
						visit: t.visit,
						onVisit: (e) => {
							r?.(), be.set(t.node.id, e), n(t.node.iterations[e].indices[0]), ie = "", ze(E, !1);
						}
					});
				}
				Ue.push(...l.edges.map((e) => ({
					...e,
					source: u.get(e.source),
					target: u.get(e.target)
				}))), He.push(...l.regions.map((t) => ({
					...t,
					id: JSON.stringify([e.id, t.id]),
					parentId: e.id,
					parentRegionId: t.parentRegionId ? JSON.stringify([e.id, t.parentRegionId]) : void 0
				})));
				continue;
			}
			if (e.columns = Math.min(e.steps?.length || 1, N ? 2 : 4), e.width = e.expanded ? e.columns * 324 - rj + 32 : tj, !e.expanded) continue;
			let i;
			for (let [t, n] of e.steps.entries()) {
				let r = JSON.stringify([
					"inline",
					e.id,
					n.id
				]);
				for (; Ve.has(r);) r += ":";
				Ve.add(r);
				let a = {
					...n,
					id: r,
					parentId: e.id,
					row: Math.floor(t / e.columns),
					column: Math.floor(t / e.columns) % 2 ? e.columns - 1 - t % e.columns : t % e.columns,
					level: "step",
					kind: n.event.kind,
					label: n.event.kind === "call" ? n.label || n.event.label || "Call" : n.event.label || n.event.kind,
					expandLabel: "Go to source step " + n.index,
					expandable: !1,
					value: aj(n.event),
					active: v > 0 && n.index === v
				};
				Re.push(a), i && Be.push([i, r]), i = r;
			}
		}
		if (he(Ge, s), Ke || [...Ge.keys()].some((e) => le.has(e))) {
			if (se === ue) {
				let e = /* @__PURE__ */ new Set();
				for (let [t, n] of F) {
					let r = n.getData(), i = r.level === "step" ? r.index === v : r.kind === "function" ? t === Ce && v > 0 : r.active;
					i && e.add(t), i !== r.active && n.setData({
						...r,
						active: i
					});
				}
				for (let t of I) {
					let n = t.getData(), r = n.status === "prepared" && (n.kind === "return" ? n.index === v : n.kind === "call" && Fe ? v > 0 && re?.kind !== "return" && n.callId === M : n.kind !== "first-appearance" && e.has(t.getTargetCellId()));
					t.attr("line/stroke", r ? "#4f46e5" : "#64748b"), t.attr("line/strokeWidth", r ? 2.5 : 1.5);
				}
				ae = v;
			}
			if (h && !l.isConnected) {
				let t = e.querySelector(h);
				(t && !t.disabled ? t : d.querySelector("button[aria-label=\"Fit diagram\"]")).focus({ preventScroll: !0 });
			}
			return;
		}
		for (let e of P) {
			e.headerHeight = nj + we(e.id) + (e.invocations?.length > 1 ? 36 : 0);
			let t = Re.filter((t) => t.parentId === e.id);
			if (e.controlLayout) {
				for (let n of t) n.offsetY = e.headerHeight + 16 + n.layoutY;
				e.height = e.headerHeight + 16 + e.controlLayout.height + 32;
				continue;
			}
			let n = [];
			for (let e of t) e.height = nj + we(e.id), n[e.row] = Math.max(n[e.row] ?? 0, e.height);
			for (let r of t) r.offsetY = e.headerHeight + 16 + n.slice(0, r.row).reduce((e, t) => e + t + rj, 0);
			e.height = e.headerHeight + (t.length ? n.reduce((e, t) => e + t + rj, 16) : 0);
		}
		let qe = [...P, ...Re];
		for (let e of qe) e.inline = Fe, e.valuesOpen = Se.has(e.id), e.onValues = Ee;
		let Je = JSON.stringify([
			_,
			N,
			N ? null : c.clientWidth,
			qe.map((e) => [
				e.id,
				e.width,
				e.height,
				e.expanded
			]),
			[...Ie.values()],
			de
		]), Ye = Je !== ie;
		if (Ye) {
			ie = Je, x.clearCells(), F = /* @__PURE__ */ new Map(), ge = /* @__PURE__ */ new Map(), I = [];
			let e = new OA.default.graphlib.Graph({ compound: Fe }).setGraph({
				rankdir: N ? "TB" : "LR",
				align: "UL",
				ranksep: Fe ? 64 : 40,
				nodesep: Fe ? 28 : 24,
				marginx: 20,
				marginy: 20
			}).setDefaultEdgeLabel(() => ({}));
			for (let t of P) e.setNode(t.id, {
				width: t.width,
				height: t.height
			});
			for (let t of Ie.values()) e.setNode(t.id, {});
			for (let t of Ie.values()) t.parent && e.setParent(t.id, t.parent);
			for (let [t, n] of Le) e.setParent(t, n);
			for (let [t, n, r] of de) {
				let i = Fe ? (T.get(r) ?? []).map((e) => e.label) : [];
				e.setEdge(t, n, i.length ? {
					width: Math.max(...i.flatMap((e) => e.split("\n").map((e) => e.length * 6))) + 16,
					height: 40,
					labelpos: "c"
				} : {});
			}
			if (OA.default.layout(e), Fe && !N) {
				let t = [...Ie.values()].filter((e) => e.kind === "file").sort((t, n) => e.node(t.id).x - e.node(n.id).x), n = 20, r = 0, i;
				i = Math.min(...t.map((t) => {
					let n = e.node(t.id);
					return n.y - n.height / 2;
				}));
				for (let a of t) {
					let t = e.node(a.id);
					n > 20 && n + t.width > c.clientWidth - 40 && (n = 20, i += r + 64, r = 0);
					let o = i - (t.y - t.height / 2), s = n - (t.x - t.width / 2);
					n += t.width + 64, r = Math.max(r, t.height);
					for (let t of [
						a.id,
						...a.members,
						...[...Ie.values()].filter((e) => e.parent === a.id).map((e) => e.id)
					]) e.node(t).y += o, e.node(t).x += s;
				}
			}
			for (let t of Ie.values()) {
				let n = e.node(t.id), r = x.addNode({
					id: t.id,
					shape: "code-anime-group",
					x: n.x - n.width / 2,
					y: n.y - n.height / 2 - (t.kind === "file" ? 20 : 0),
					width: n.width,
					height: n.height + (t.kind === "file" ? 20 : 0),
					zIndex: t.kind === "file" ? -3 : -2,
					data: {
						...t,
						active: v > 0 && t.members.includes(Fe ? Ce : M)
					}
				});
				ge.set(t.id, r);
			}
			for (let e of Ie.values()) e.parent && ge.get(e.parent).addChild(ge.get(e.id));
			for (let r of P) {
				let i = e.node(r.id), a = x.addNode({
					id: r.id,
					shape: "code-anime-card",
					x: i.x - r.width / 2,
					y: i.y - r.height / 2,
					width: r.width,
					height: r.height,
					zIndex: r.expanded ? 0 : 2,
					data: {
						...r,
						onSelect: t,
						onSeek: n,
						onExpand: je
					}
				});
				F.set(r.id, a), Le.has(r.id) && ge.get(Le.get(r.id)).addChild(a);
			}
			for (let e of He) {
				let t = F.get(e.parentId), n = t.position(), r = x.addNode({
					id: e.id,
					shape: "code-anime-control-region",
					x: n.x + 16 + e.x,
					y: n.y + t.getData().headerHeight + 16 + e.y,
					width: e.width,
					height: Math.max(1, e.height),
					zIndex: 1,
					data: e
				}), i = e.parentRegionId ? x.getCellById(e.parentRegionId) : t;
				if (!i) throw Error(`Missing source-proven parent region for ${e.id}`);
				i.addChild(r);
			}
			for (let e of Re) {
				let r = F.get(e.parentId), i = r.position(), a = x.addNode({
					id: e.id,
					shape: "code-anime-card",
					x: i.x + 16 + (e.x ?? e.column * 324),
					y: i.y + e.offsetY,
					width: e.width ?? tj,
					height: e.height,
					zIndex: 2,
					data: {
						...e,
						onSelect: t,
						onSeek: n,
						onExpand: je
					}
				}), o = e.parentRegionId ? x.getCellById(e.parentRegionId) : r;
				if (!o) throw Error(`Missing source-proven parent region for ${e.id}`);
				o.addChild(a), F.set(e.id, a);
			}
			let r = new Map(Re.filter((e) => e.level === "step").map((e) => [e.index, e.id])), i = (e) => {
				let t = F.get(e).getBBox();
				return {
					x: t.x + t.width / 2,
					y: t.y + t.height / 2,
					width: t.width,
					height: t.height
				};
			}, a = qe.map((e) => {
				let t = F.get(e.id).getBBox();
				return {
					id: e.id,
					x: t.x,
					y: t.y,
					width: t.width,
					height: e.expanded && !e.parentId ? e.headerHeight : t.height
				};
			});
			for (let [e, t] of ge) {
				let n = t.getBBox();
				a.push({
					id: e,
					x: n.x,
					y: n.y,
					width: n.width,
					height: 28
				});
			}
			for (let e of He) {
				let t = x.getCellById(e.id), n = x.findViewByCell(t)?.container.querySelector(".diagram-control-region > span");
				if (!n) continue;
				let r = t.getBBox();
				a.push({
					id: e.id + "-label",
					x: r.x + n.offsetLeft,
					y: r.y + n.offsetTop,
					width: n.offsetWidth,
					height: n.offsetHeight
				});
			}
			let o = new Map(a.map((e) => [e.id, e])), l = BA(a), u = Ue.map((e) => ({
				...e,
				kind: e.kind ?? "step-order"
			}));
			for (let [e, t, n] of [...Be, ...de]) {
				let i = !!F.get(t).getData().parentId, a = n ?? t, o = fe.get(a), s = Fe && !i, c = !Fe && !i && L?.kind !== "method";
				if (Fe && !i && F.get(e).getData().expanded && o?.callSiteIndex && (!r.has(o.callSiteIndex) || We.has(o.callSiteIndex))) continue;
				let l = Fe && !i ? r.get(o?.callSiteIndex) ?? e : e, d = Fe && !i ? r.get(o?.index) ?? t : t;
				if (u.push({
					source: l,
					target: d,
					kind: s ? "call" : c ? "first-appearance" : "step-order",
					callId: s ? a : void 0,
					index: s ? o?.callSiteIndex ?? o?.index : void 0,
					label: c ? "First appearance order—not a call" : void 0,
					description: s ? `Call ${a}: ${o?.parentSymbol ?? e} to ${o?.symbol ?? t} · step ${o?.callSiteIndex ?? o?.index}` : c ? `First appearance order—not a call: ${e} to ${t}` : void 0,
					fallback: s && (!r.has(o?.callSiteIndex) || !r.has(o?.index)) ? "Exact call/entry card unavailable; connected to method overview" : void 0
				}), Fe && !i) for (let e of T.get(a) ?? []) u.push({
					source: r.get(e.index) ?? t,
					target: l,
					kind: "return",
					callId: a,
					fallback: !r.has(e.index) || !r.has(o?.callSiteIndex) ? "Exact return/call card unavailable; connected to method overview" : void 0,
					...e
				});
			}
			let d = [], f = [], p = 0, m = (e, t) => {
				let n = i(e);
				return {
					cell: e,
					anchor: {
						name: "center",
						args: {
							dx: t.x - n.x,
							dy: t.y - n.y
						}
					},
					connectionPoint: { name: "anchor" }
				};
			};
			for (let e of u) {
				let t = F.get(e.source), n = F.get(e.target);
				if (!t || !n) {
					p++, d.push(`${e.kind}: missing prepared endpoint; no route drawn`);
					continue;
				}
				let r = t.getData(), i = n.getData(), s = r.parentId && r.parentId === i.parentId, c = F.get(r.parentId)?.position(), u = F.get(r.parentId)?.getData(), h = e.points?.map((e) => ({
					x: e.x + c.x + 16,
					y: e.y + c.y + u.headerHeight + 16
				})), g = h ? h.length >= 2 ? { points: h } : null : l.route({
					...o.get(e.source),
					...r.control === "decision" ? { shape: "diamond" } : {},
					...s ? {
						sides: !N && e.kind === "branch" ? ["right", "bottom"] : [e.sourceSide ?? (N ? "bottom" : "right")],
						centered: !0
					} : {}
				}, e.kind === "call" && F.get(e.target).getData().expanded ? {
					...o.get(e.target),
					height: nj,
					sides: ["left", "right"]
				} : {
					...o.get(e.target),
					...i.control === "decision" ? { shape: "diamond" } : {},
					...s ? {
						sides: !N && e.kind === "branch" ? ["left", "top"] : [e.targetSide ?? (N ? "top" : "left")],
						centered: !0
					} : {}
				}, e.label);
				if (!g) {
					p++, d.push(`${e.kind} (${e.status ?? "unavailable"}): ${r.symbol ?? e.source} to ${i.symbol ?? e.target}; no route drawn`);
					continue;
				}
				let { points: _, label: v } = g, y = e.status ?? (e.inactive ? "not-selected" : "prepared"), b = e.fallback, S = e.label ?? (e.kind === "branch" ? "BRANCH" : e.kind === "catch" ? "EXCEPTION" : e.kind === "finally" ? "FINALLY" : e.kind === "loopback" ? "LOOP" : void 0), C = v?.box ?? (S ? ej(_, S, a, f) : null);
				v?.box && f.push(v.box), I.push(x.addEdge({
					source: m(e.source, _[0]),
					target: m(e.target, _.at(-1)),
					vertices: _.slice(1, -1),
					connector: {
						name: "jumpover",
						args: {
							size: 6,
							type: "arc",
							radius: 8
						}
					},
					zIndex: 1,
					data: {
						kind: e.kind,
						index: e.index,
						callId: e.callId,
						inactive: e.inactive,
						status: y
					},
					attrs: {
						root: {
							"aria-label": `${e.description ?? `${S ?? e.kind}: ${e.source} to ${e.target}`} · ${y}${b ? ` · ${b}` : ""}`,
							"data-edge-kind": e.kind,
							"data-edge-status": y,
							"data-fallback": b ?? "",
							"data-source-node": e.source,
							"data-target-node": e.target,
							"data-route": JSON.stringify(_),
							"data-label-box": C ? JSON.stringify(C) : ""
						},
						line: {
							stroke: "#64748b",
							strokeWidth: 1.5,
							strokeDasharray: y === "unknown" ? "8 4 2 4" : y === "possible" ? "4 4" : y === "not-selected" ? "2 6" : e.kind === "return" || e.kind === "first-appearance" ? "5 7" : "",
							targetMarker: {
								name: "block",
								width: 7,
								height: 6
							}
						}
					},
					labels: S && C ? [{
						position: {
							distance: 0,
							offset: {
								x: C.x + C.width / 2 - _[0].x,
								y: C.y + C.height / 2 - _[0].y
							}
						},
						attrs: {
							label: {
								text: S,
								fontSize: 10,
								fill: "var(--diagram-ink)"
							},
							body: {
								fill: "var(--diagram-card)",
								stroke: "var(--diagram-border)",
								rx: 3,
								ry: 3
							}
						}
					}] : []
				}));
			}
			if (y.replaceChildren(), y.hidden = d.length === 0, d.length) {
				let e = $("summary", `${p} connections not drawn`);
				e.setAttribute("aria-live", "polite");
				let t = $("ul");
				for (let e of d) t.append($("li", e));
				y.append(e, $("p", "Collapse unrelated methods or filter owners to free routing space. Inspect a method for its prepared return value."), t);
			}
			k && ee(k), s && Pe(), se = ue, me();
		} else if (v !== ae) for (let e of qe) F.get(e.id)?.setData({
			...e,
			onSelect: t,
			onSeek: n,
			onExpand: je
		});
		for (let e of Ie.values()) ge.get(e.id)?.setData({
			...e,
			active: v > 0 && e.members.includes(Fe ? Ce : M)
		});
		let Xe = Re.find((e) => e.active && e.level === "step") ?? P.find((e) => e.active), Ze = new Set(qe.filter((e) => e.active).map((e) => e.id));
		for (let e of I) {
			let t = e.getData().kind === "return", n = e.getData().kind === "first-appearance", r = e.getData().status !== "prepared" || n ? !1 : t ? e.getData().index === v : Fe && e.getData().kind === "call" ? v > 0 && re?.kind !== "return" && e.getData().callId === M : Ze.has(e.getTargetCellId());
			e.attr("line/stroke", r ? "#4f46e5" : "#64748b"), e.attr("line/strokeWidth", r ? 2.5 : 1.5), e.attr("line/class", r && (t || !Fe) && !A ? "diagram-edge-active" : ""), e.attr("line/strokeDasharray", e.getData().status === "unknown" ? "8 4 2 4" : e.getData().status === "possible" ? "4 4" : e.getData().status === "not-selected" ? "2 6" : t || n || e.getData().inactive || !Fe && r && !A ? "5 7" : "");
		}
		if (te(), !Ye && b && v !== ae && Xe) {
			if (L) Pe();
			else {
				let e = F.get(Xe.id), t = x.localToClient(e.getBBox()), n = c.getBoundingClientRect(), r = d.getBoundingClientRect();
				if (t.x + t.width > r.left && t.x < r.right && t.y + t.height > r.top || t.x < n.left + 12 || t.y < n.top + 12 || t.x + t.width > n.right - 12 || t.y + t.height > n.bottom - 12) {
					x.centerCell(e);
					let t = x.localToClient(e.getBBox());
					t.x + t.width > r.left && t.x < r.right && j(0, Math.min(0, r.top - 12 - t.y - t.height));
				}
			}
		}
		if (ae = v, Ye || !u.childNodes.length) {
			if (u.replaceChildren(), L) {
				let e = Te?.length ?? Me ?? S.steps.length, t = (e) => {
					D += e, O = !0, ze(E);
				}, n = f("‹", "Previous diagram page", () => t(-1)), r = f("›", "Next diagram page", () => t(1));
				n.disabled = D === 0, r.disabled = (D + 1) * ij >= e, u.append(n, $("span", e ? `${D * ij + 1}–${Math.min((D + 1) * ij, e)} / ${e}` : "No steps"), r);
			} else u.append($("span", `${P.length} visible · drag to pan`));
		}
		if (h && !l.isConnected) {
			let t = e.querySelector(h);
			(t && !t.disabled ? t : d.querySelector("button[aria-label=\"Fit diagram\"]")).focus({ preventScroll: !0 });
		}
	}
	function Be() {
		oe = !0, P?.abort.abort(), M.dispose(), Le.disconnect(), e.removeEventListener("focusin", ne), x.dispose(), e.replaceChildren();
	}
	return {
		setFlow: Re,
		render: ze,
		zoom: Fe,
		fit: Pe,
		dispose: Be,
		advance: Me
	};
}
export { oj as createDiagram };
