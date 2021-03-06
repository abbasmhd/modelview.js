/**
*
*   ModelView.js
*   @version: 0.81.1
*   @built on 2016-05-22 18:23:10
*
*   A simple/extendable MV* (MVVM) framework
*   optionaly integrates into both jQuery as MVVM plugin and jQueryUI as MVC widget
*   https://github.com/foo123/modelview.js
*
**/!function( root, name, factory ) {
"use strict";
var m;
if ( ('object'===typeof module)&&module.exports ) /* CommonJS */
    module.exports = factory.call( root, {} );
else if ( ('undefined'!==typeof System)&&('function'===typeof System.register)&&('function'===typeof System['import']) ) /* ES6 module */
    System.register(name,[],function($__export){$__export(name, factory.call(root,{}));});
else if ( ('function'===typeof define)&&define.amd&&('function'===typeof require)&&('function'===typeof require.specified)&&require.specified(name) ) /* AMD */
    define(name,['require','exports','module'],function(){return factory.call(root,{});});
else if ( !(name in root) ) /* Browser/WebWorker/.. */
    (root[ name ] = (m=factory.call(root,{})))&&('function'===typeof(define))&&define.amd&&define(function(){return m;} );
}(  /* current root */          this, 
    /* module name */           "ModelView",
    /* module factory */        function( exports ) {
/* main code starts here */

/**
*
*   ModelView.js
*   @version: 0.81.1
*   @built on 2016-05-22 18:23:10
*
*   A simple/extendable MV* (MVVM) framework
*   optionaly integrates into both jQuery as MVVM plugin and jQueryUI as MVC widget
*   https://github.com/foo123/modelview.js
*
**/

"use strict";
/**
*   uses concepts from various MV* frameworks like:
*       knockoutjs 
*       agility.js
*       backbone.js
*       http://stackoverflow.com/questions/16483560/how-to-implement-dom-data-binding-in-javascript/23618763#23618763 
**/

/**[DOC_MARKDOWN]
###ModelView API

**Version 0.81.1**

###Contents

* [Types](#types)
* [Validators](#validators)
* [Cache](#cache)
* [Model](#model)
* [Tpl](#tpl)
* [View](#view)
* [View Actions](#view-actions)
* [Examples](#examples)

[/DOC_MARKDOWN]**/    
///////////////////////////////////////////////////////////////////////////////////////
//
//
// utilities
//
//
///////////////////////////////////////////////////////////////////////////////////////

var undef = undefined, bindF = function( f, scope ) { return f.bind(scope); },
    proto = "prototype", Arr = Array, AP = Arr[proto], Regex = RegExp, Num = Number,
    Obj = Object, OP = Obj[proto], Create = Obj.create, Keys = Obj.keys,
    Func = Function, FP = Func[proto], Str = String, SP = Str[proto],
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    //FPCall = FP.call, hasProp = bindF(FPCall, OP.hasOwnProperty),
    toString = OP.toString, slice = AP.slice,
    tostr = function( s ){ return Str(s); },
    newFunc = function( args, code ){ return new Func(args, code); },
    is_instance = function( o, T ){ return o instanceof T; },
    
    INF = Infinity, rnd = Math.random, 
    
    ESCAPED_RE = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
    esc_re = function( s ) { 
        return s.replace(ESCAPED_RE, "\\$&"); 
    },
    
    del = function( o, k, soft ) { 
        o[k] = undef; if ( !soft ) delete o[k];
        return o;
    },
    
    // types
    T_UNKNOWN = 4, T_UNDEF = 8, T_NULL = 16,
    T_NUM = 32, T_INF = 33, T_NAN = 34, T_BOOL = 64,
    T_STR = 128, T_CHAR = 129, 
    T_ARRAY = 256, T_OBJ = 512, T_FUNC = 1024, T_REGEX = 2048, T_DATE = 4096,
    T_BLOB = 8192, T_FILE = 8192,
    T_STR_OR_ARRAY = T_STR|T_ARRAY, T_OBJ_OR_ARRAY = T_OBJ|T_ARRAY,
    T_ARRAY_OR_STR = T_STR|T_ARRAY, T_ARRAY_OR_OBJ = T_OBJ|T_ARRAY,
    TYPE_STRING = {
    "[object Number]"   : T_NUM,
    "[object String]"   : T_STR,
    "[object Array]"    : T_ARRAY,
    "[object RegExp]"   : T_REGEX,
    "[object Date]"     : T_DATE,
    "[object Function]" : T_FUNC,
    "[object File]"     : T_FILE,
    "[object Blob]"     : T_BLOB,
    "[object Object]"   : T_OBJ
    },
    get_type = function( v ) {
        var T = 0;
        if      ( null === v )                T = T_NULL;
        else if ( true === v || false === v || 
                       v instanceof Boolean ) T = T_BOOL;
        else if ( undef === v )               T = T_UNDEF;
        else
        {
        T = TYPE_STRING[ toString.call( v ) ] || T_UNKNOWN;
        if      ( T_NUM === T   || v instanceof Number )   T = isNaN(v) ? T_NAN : (isFinite(v) ? T_NUM : T_INF);
        else if ( T_STR === T   || v instanceof String )   T = 1 === v.length ? T_CHAR : T_STR;
        else if ( T_ARRAY === T || v instanceof Array )    T = T_ARRAY;
        else if ( T_REGEX === T || v instanceof RegExp )   T = T_REGEX;
        else if ( T_DATE === T  || v instanceof Date )     T = T_DATE;
        else if ( T_FILE === T  || v instanceof File )     T = T_FILE;
        else if ( T_BLOB === T  || v instanceof Blob )     T = T_BLOB;
        else if ( T_FUNC === T  || v instanceof Function ) T = T_FUNC;
        else if ( T_OBJ === T )                            T = T_OBJ;
        else                                               T = T_UNKNOWN;
        }
        return T;
    },
    
    is_type = function( v, type ) { return !!( type & get_type( v ) ); },

    // http://stackoverflow.com/questions/6449611/how-to-check-whether-a-value-is-a-number-in-javascript-or-jquery
    is_numeric = function( n ) { return !isNaN( parseFloat( n, 10 ) ) && isFinite( n ); },

    is_array_index = function( n ) {
        if ( is_numeric( n ) ) // is numeric
        {
            n = +n;  // make number if not already
            if ( (0 === n % 1) && n >= 0 ) // and is positive integer
                return true;
        }
        return false
    },
    
    // http://jsperf.com/functional-loop-unrolling/2
    // http://jsperf.com/functional-loop-unrolling/3
    operate = function operate( a, f, f0 ) {
        var i, l=a.length, r=l&15, q=r&1, fv=q?f(f0,a[0]):f0;
        for (i=q; i<r; i+=2)  fv = f(f(fv,a[i]),a[i+1]);
        for (i=r; i<l; i+=16) fv = f(f(f(f(f(f(f(f(f(f(f(f(f(f(f(f(fv,a[i]),a[i+1]),a[i+2]),a[i+3]),a[i+4]),a[i+5]),a[i+6]),a[i+7]),a[i+8]),a[i+9]),a[i+10]),a[i+11]),a[i+12]),a[i+13]),a[i+14]),a[i+15]);
        return fv;
    },
    map = function map( a, f ) {
        var i, l=a.length, r=l&15, q=r&1, fv=new Array(l);
        if ( q ) fv[0] = f(a[0]);
        for (i=q; i<r; i+=2)
        { 
            fv[i  ] = f(a[i  ]);
            fv[i+1] = f(a[i+1]);
        }
        for (i=r; i<l; i+=16)
        {
            fv[i  ] = f(a[i  ]);
            fv[i+1] = f(a[i+1]);
            fv[i+2] = f(a[i+2]);
            fv[i+3] = f(a[i+3]);
            fv[i+4] = f(a[i+4]);
            fv[i+5] = f(a[i+5]);
            fv[i+6] = f(a[i+6]);
            fv[i+7] = f(a[i+7]);
            fv[i+8] = f(a[i+8]);
            fv[i+9] = f(a[i+9]);
            fv[i+10] = f(a[i+10]);
            fv[i+11] = f(a[i+11]);
            fv[i+12] = f(a[i+12]);
            fv[i+13] = f(a[i+13]);
            fv[i+14] = f(a[i+14]);
            fv[i+15] = f(a[i+15]);
        }
        return fv;
    },
    filter = function filter( a, f ) {
        var i, l=a.length, r=l&15, q=r&1, fv=[];
        if ( q && f(a[0]) ) fv.push(a[0]);
        for (i=q; i<r; i+=2)
        { 
            if ( f(a[i  ]) ) fv.push(a[i  ]);
            if ( f(a[i+1]) ) fv.push(a[i+1]);
        }
        for (i=r; i<l; i+=16)
        {
            if ( f(a[i  ]) ) fv.push(a[i  ]);
            if ( f(a[i+1]) ) fv.push(a[i+1]);
            if ( f(a[i+2]) ) fv.push(a[i+2]);
            if ( f(a[i+3]) ) fv.push(a[i+3]);
            if ( f(a[i+4]) ) fv.push(a[i+4]);
            if ( f(a[i+5]) ) fv.push(a[i+5]);
            if ( f(a[i+6]) ) fv.push(a[i+6]);
            if ( f(a[i+7]) ) fv.push(a[i+7]);
            if ( f(a[i+8]) ) fv.push(a[i+8]);
            if ( f(a[i+9]) ) fv.push(a[i+9]);
            if ( f(a[i+10]) ) fv.push(a[i+10]);
            if ( f(a[i+11]) ) fv.push(a[i+11]);
            if ( f(a[i+12]) ) fv.push(a[i+12]);
            if ( f(a[i+13]) ) fv.push(a[i+13]);
            if ( f(a[i+14]) ) fv.push(a[i+14]);
            if ( f(a[i+15]) ) fv.push(a[i+15]);
        }
        return fv;
    },
    each = function each( a, f ) {
        var i, l=a.length, r=l&15, q=r&1;
        if ( q ) f(a[0]);
        for (i=q; i<r; i+=2)
        { 
            f(a[i  ]);
            f(a[i+1]);
        }
        for (i=r; i<l; i+=16)
        {
            f(a[i  ]);
            f(a[i+1]);
            f(a[i+2]);
            f(a[i+3]);
            f(a[i+4]);
            f(a[i+5]);
            f(a[i+6]);
            f(a[i+7]);
            f(a[i+8]);
            f(a[i+9]);
            f(a[i+10]);
            f(a[i+11]);
            f(a[i+12]);
            f(a[i+13]);
            f(a[i+14]);
            f(a[i+15]);
        }
        return a;
    },
    iterate = function( F, i0, i1, F0 ) {
        if ( i0 > i1 ) return F0;
        else if ( i0 === i1 ) { F(i0, F0, i0, i1); return F0; }
        var l=i1-i0+1, i, k, r=l&15, q=r&1;
        if ( q ) F(i0, F0, i0, i1);
        for (i=q; i<r; i+=2)
        { 
            k = i0+i;
            F(  k, F0, i0, i1);
            F(++k, F0, i0, i1);
        }
        for (i=r; i<l; i+=16)
        {
            k = i0+i;
            F(  k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
        }
        return F0;
    },
    
    Merge = function(/* var args here.. */) { 
        var args = arguments, argslen, 
            o1, o2, v, p, i, T ;
        o1 = args[0] || {}; 
        argslen = args.length;
        for (i=1; i<argslen; i++)
        {
            o2 = args[ i ];
            if ( T_OBJ === get_type( o2 ) )
            {
                for (p in o2)
                {            
                    v = o2[ p ];
                    T = get_type( v );
                    
                    if ( T_NUM & T )
                        // shallow copy for numbers, better ??
                        o1[ p ] = 0 + v;  
                    
                    else if ( T_ARRAY_OR_STR & T )
                        // shallow copy for arrays or strings, better ??
                        o1[ p ] = v.slice( 0 );  
                    
                    else
                        // just reference copy
                        o1[ p ] = v;  
                }
            }
        }
        return o1; 
    },

    HAS = 'hasOwnProperty',
    ATTR = 'getAttribute', SET_ATTR = 'setAttribute', HAS_ATTR = 'hasAttribute', DEL_ATTR = 'removeAttribute',
    CHECKED = 'checked', DISABLED = 'disabled', SELECTED = 'selected',
    NAME = 'name', TAG = 'tagName', TYPE = 'type', VAL = 'value', 
    OPTIONS = 'options', SELECTED_INDEX = 'selectedIndex', PARENT = 'parentNode',
    STYLE = 'style', CLASS = 'className', HTML = 'innerHTML', TEXT = 'innerText', TEXTC = 'textContent',
    
    // use native methods and abbreviation aliases if available
    fromJSON = JSON.parse, toJSON = JSON.stringify, 
    
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
    trim = SP.trim 
            ? function( s ){ return s.trim( ); } 
            : function( s ){ return s.replace(/^\s+|\s+$/g, ''); }, 
    
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    startsWith = SP.startsWith 
            ? function( str, pre, pos ){ return str.startsWith(pre, pos||0); } 
            : function( str, pre, pos ){ return ( pre === str.slice(pos||0, pre.length) ); },
    
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
    NOW = Date.now ? Date.now : function( ) { return new Date( ).getTime( ); },
    
    // Array multi - sorter utility
    // returns a sorter that can (sub-)sort by multiple (nested) fields 
    // each ascending or descending independantly
    sorter = function( ) {
        var arr = this, i, args = arguments, l = args.length,
            a, b, avar, bvar, variables, step, lt, gt,
            field, filter_args, sorter_args, desc, dir, sorter,
            ASC = '|^', DESC = '|v';
        // |^ after a (nested) field indicates ascending sorting (default), 
        // example "a.b.c|^"
        // |v after a (nested) field indicates descending sorting, 
        // example "b.c.d|v"
        if ( l )
        {
            step = 1;
            sorter = [];
            variables = [];
            sorter_args = [];
            filter_args = []; 
            for (i=l-1; i>=0; i--)
            {
                field = args[i];
                // if is array, it contains a filter function as well
                filter_args.unshift('f'+i);
                if ( field.push )
                {
                    sorter_args.unshift(field[1]);
                    field = field[0];
                }
                else
                {
                    sorter_args.unshift(null);
                }
                dir = field.slice(-2);
                if ( DESC === dir ) 
                {
                    desc = true;
                    field = field.slice(0,-2);
                }
                else if ( ASC === dir )
                {
                    desc = false;
                    field = field.slice(0,-2);
                }
                else
                {
                    // default ASC
                    desc = false;
                }
                field = field.length ? '["' + field.split('.').join('"]["') + '"]' : '';
                a = "a"+field; b = "b"+field;
                if ( sorter_args[0] ) 
                {
                    a = filter_args[0] + '(' + a + ')';
                    b = filter_args[0] + '(' + b + ')';
                }
                avar = 'a_'+i; bvar = 'b_'+i;
                variables.unshift(''+avar+'='+a+','+bvar+'='+b+'');
                lt = desc ?(''+step):('-'+step); gt = desc ?('-'+step):(''+step);
                sorter.unshift("("+avar+" < "+bvar+" ? "+lt+" : ("+avar+" > "+bvar+" ? "+gt+" : 0))");
                step <<= 1;
            }
            // use optional custom filters as well
            return (newFunc(
                    filter_args.join(','), 
                    ['return function(a,b) {',
                     '  var '+variables.join(',')+';',
                     '  return '+sorter.join('+')+';',
                     '};'].join("\n")
                    ))
                    .apply(null, sorter_args);
        }
        else
        {
            a = "a"; b = "b"; lt = '-1'; gt = '1';
            sorter = ""+a+" < "+b+" ? "+lt+" : ("+a+" > "+b+" ? "+gt+" : 0)";
            return newFunc("a,b", 'return '+sorter+';');
        }
    },
    
    // http://stackoverflow.com/a/11762728/3591273
    node_index = function( node ) {
        var index = 0;
        while ( (node=node.previousSibling) ) index++;
        return index;
    },
    
    node_closest_index = function( node, root ) {
        var closest = node;
        if ( root ) while ( closest[PARENT] && closest[PARENT] !== root ) closest = closest[PARENT];
        return node_index( closest );
    },
    
    find_node = function( root, node_type, node_index ) {
        var ndList = root.childNodes, len = ndList.length, 
            n, node = null, i = 0, node_ith = 0;
        node_index = node_index || 1;
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
        // TEXT_NODE = 3, COMMENT_NODE = 8
        // return node.nodeValue
        while ( i < len )
        {
            n = ndList[i++];
            if ( node_type === n.nodeType )
            {
                node = n;
                if (++node_ith === node_index) break;
            }
        }
        return node;
    },
    
    join_text_nodes = function( nodes ) {
        var i, l = nodes.length, txt = l ? nodes[0].nodeValue : '';
        if ( l > 1 ) for (i=1; i<l; i++) txt += nodes[i].nodeValue;
        return txt;
    },
    
    // http://youmightnotneedjquery.com/
    $id = function( id, el ) {
        return [ (el || document).getElementById( id ) ];
    },
    $tag = function( tagname, el ) {
        return slice.call( (el || document).getElementsByTagName( tagname ), 0 );
    },
    $sel = function( selector, el, single ) {
        return true === single 
            ? [ (el || document).querySelector( selector ) ]
            : slice.call( (el || document).querySelectorAll( selector ), 0 )
        ;
    },
    
    get_dom_ref = function( el, ref ) {
        // shortcut to get domRefs relative to current element $el, represented as "$this::" in ref selector
        return ( /*ref &&*/ startsWith(ref, "$this::") ) ? $sel( ref.slice( 7 ), el/*, true*/ ) : $sel( ref, null/*, true*/ );
    },
    
    // http://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
    str2dom = function( str ) {
        var d = document, n, 
            a = d.createElement("div"),
            b = d.createDocumentFragment();
        a.innerHTML = str;
        while ( n = a.firstChild ) b.appendChild( n );
        return b;
    },
    
    // http://stackoverflow.com/questions/1750815/get-the-string-representation-of-a-dom-node
    dom2str = (function() {
        var DIV = document.createElement("div");

        if ( 'outerHTML' in DIV )
            return function(node) { return node.outerHTML; };

        return function(node) {
            var div = DIV.cloneNode();
            div.appendChild( node.cloneNode(true) );
            return div.innerHTML;
        };

    })(),
    
    // http://youmightnotneedjquery.com/
    MATCHES = (function( P ) {
        if ( !P || P.matches ) return 'matches';
        else if ( P.matchesSelector ) return 'matchesSelector';
        else if ( P.webkitMatchesSelector ) return 'webkitMatchesSelector';
        else if ( P.mozMatchesSelector ) return 'mozMatchesSelector';
        else if ( P.msMatchesSelector ) return 'msMatchesSelector';
        else if ( P.oMatchesSelector ) return 'oMatchesSelector';
    }(this.Element ? this.Element[proto] : null)),

    get_textnode = function( txt ) { return document.createTextNode(txt||''); },
    
    // http://stackoverflow.com/a/2364000/3591273
    get_style = 'undefined' !== typeof window && window.getComputedStyle 
        ? function( el ){ return window.getComputedStyle(el, null); } 
        : function( el ) { return el.currentStyle; },
    
    show = function( el ) {
        if ( !el._displayCached ) el._displayCached = get_style( el ).display || 'block';
        el[STYLE].display = 'none' !== el._displayCached ? el._displayCached : 'block';
        el._displayCached = undef;
    },
    
    hide = function( el ) {
        if ( !el._displayCached ) el._displayCached = get_style( el ).display || 'block';
        el[STYLE].display = 'none';
    },
    
    opt_val = function( o ) {
        // attributes.value is undefined in Blackberry 4.7 but
        // uses .value. See #6932
        var val = o.attributes[VAL];
        return !val || val.specified ? o[VAL] : o.text;
    },
    
    // adapted from jQuery
    select_get = function( el ) {
        var val, opt, options = el[OPTIONS], sel_index = el[SELECTED_INDEX],
            one = "select-one" === el[TYPE] || sel_index < 0,
            values = one ? null : [],
            max = one ? sel_index + 1 : options.length,
            i = sel_index < 0 ? max : (one ? sel_index : 0)
        ;

        // Loop through all the selected options
        for ( ; i<max; i++ ) 
        {
            opt = options[ i ];

            // oldIE doesn't update selected after form reset (#2551)
            if ( ( opt[SELECTED] || i === sel_index ) &&
                // Don't return options that are disabled or in a disabled optgroup
                ( !opt[DISABLED] ) &&
                ( !opt[PARENT][DISABLED] || "OPTGROUP" !== opt[PARENT][TAG] ) 
            ) 
            {
                // Get the specific value for the option
                val = opt_val( opt );
                // We don't need an array for one selects
                if ( one ) return val;
                // Multi-Selects return an array
                values.push( val );
            }
        }
        return values;
    },
    
    select_set = function( el, v ) {
        var values = map( [ ].concat( v ), tostr ), 
            options = el[OPTIONS],
            opt, i, sel_index = -1
        ;
        
        for (i=0; i<options.length; i++ )
        {
            opt = options[ i ];
            opt[SELECTED] = -1 < values.indexOf( opt_val( opt ) );
        }
        if ( !values.length ) el[SELECTED_INDEX] = -1;
    },
    
    get_val = function( el ) {
        if ( !el ) return;
        var value_alt = null;
        if ( el[HAS_ATTR]('data-alt-value') ) value_alt = el[ATTR]('data-alt-value');
        switch( el[TAG] )
        {
            case 'INPUT': return 'file' === el.type.toLowerCase( ) ? ((!!value_alt) && (null!=el[value_alt]) && el[value_alt].length ?el[value_alt] : (el.files.length ? el.files : null)) : ((!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : el[VAL]);
            case 'TEXTAREA':return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : el[VAL];
            case 'SELECT': return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : select_get( el );
            default: return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : ((TEXTC in el) ? el[TEXTC] : el[TEXT]);
        }
    },
    
    set_val = function( el, v ) {
        if ( !el ) return;
        var value_alt = null;
        if ( el[HAS_ATTR]('data-alt-value') ) value_alt = el[ATTR]('data-alt-value');
        switch( el[TAG] )
        {
            case 'INPUT': if ( 'file' === el.type.toLowerCase( ) ) {} else { el[VAL] = Str(v); if (!!value_alt) el[value_alt] = null; } break;
            case 'TEXTAREA': el[VAL] = Str(v);  if (!!value_alt) el[value_alt] = null; break;
            case 'SELECT': select_set( el, v );  if (!!value_alt) el[value_alt] = null; break;
            default: 
                if ( TEXTC in el ) el[TEXTC] = Str(v); 
                else el[TEXT] = Str(v);
                 if (!!value_alt) el[value_alt] = null;
                break;
        }
    },
    
    notEmpty = function( s ){ return s.length > 0; }, SPACES = /\s+/g,
    
    // adapted from jQuery
    getNS = function( evt ) {
        var ns = evt.split('.'), e = ns[ 0 ];
        ns = filter( ns.slice( 1 ), notEmpty );
        return [e, ns.sort( )];
    },
    getNSMatcher = function( givenNamespaces ) {
        return givenNamespaces.length 
            ? new Regex( "(^|\\.)" + givenNamespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) 
            : false;
    },
    
    Node = function( val, next ) {
        var self = this;
        self.v = val || null;
        self.n = next || {};
    },
    
    WILDCARD = "*", NAMESPACE = "modelview",
    
    // UUID counter for ModelViews
    _uuid = 0,
        
    // get a Universal Unique Identifier (UUID)
    uuid =  function( namespace ) {
        return [ namespace||'UUID', ++_uuid, NOW( ) ].join( '_' );
    }
;


//
// DOM Events polyfils and delegation

// adapted from https://github.com/jonathantneal/EventListener
if ( !HTMLElement.prototype.addEventListener ) !function( ){
    
    function addToPrototype( name, method ) 
    {
        Window.prototype[name] = HTMLDocument.prototype[name] = HTMLElement.prototype[name] = Element.prototype[name] = method;
    }

    // add
    addToPrototype("addEventListener", function (type, listener) {
        var
        target = this,
        listeners = target.addEventListener.listeners = target.addEventListener.listeners || {},
        typeListeners = listeners[type] = listeners[type] || [];

        // if no events exist, attach the listener
        if (!typeListeners.length) {
            typeListeners.event = function (event) {
                var documentElement = target.document && target.document.documentElement || target.documentElement || { scrollLeft: 0, scrollTop: 0 };

                // polyfill w3c properties and methods
                event.currentTarget = target;
                event.pageX = event.clientX + documentElement.scrollLeft;
                event.pageY = event.clientY + documentElement.scrollTop;
                event.preventDefault = function () { event.returnValue = false };
                event.relatedTarget = event.fromElement || null;
                event.stopImmediatePropagation = function () { immediatePropagation = false; event.cancelBubble = true };
                event.stopPropagation = function () { event.cancelBubble = true };
                event.target = event.srcElement || target;
                event.timeStamp = +new Date;

                // create an cached list of the master events list (to protect this loop from breaking when an event is removed)
                for (var i = 0, typeListenersCache = [].concat(typeListeners), typeListenerCache, immediatePropagation = true; immediatePropagation && (typeListenerCache = typeListenersCache[i]); ++i) {
                    // check to see if the cached event still exists in the master events list
                    for (var ii = 0, typeListener; typeListener = typeListeners[ii]; ++ii) {
                        if (typeListener == typeListenerCache) {
                            typeListener.call(target, event);

                            break;
                        }
                    }
                }
            };
            if ( target.attachEvent ) target.attachEvent("on" + type, typeListeners.event);
            else target["on" + type] = typeListeners.event;
        }

        // add the event to the master event list
        typeListeners.push(listener);
    });

    // remove
    addToPrototype("removeEventListener", function (type, listener) {
        var
        target = this,
        listeners = target.addEventListener.listeners = target.addEventListener.listeners || {},
        typeListeners = listeners[type] = listeners[type] || [];

        // remove the newest matching event from the master event list
        for (var i = typeListeners.length - 1, typeListener; typeListener = typeListeners[i]; --i) {
            if (typeListener == listener) {
                typeListeners.splice(i, 1);

                break;
            }
        }

        // if no events exist, detach the listener
        if (!typeListeners.length && typeListeners.event) {
            if ( target.detachEvent ) target.detachEvent("on" + type, typeListeners.event);
            else target["on" + type] = false;
        }
    });

    // dispatch
    addToPrototype("dispatchEvent", function (eventObject) {
        var
        target = this,
        type = eventObject.type,
        listeners = target.addEventListener.listeners = target.addEventListener.listeners || {},
        typeListeners = listeners[type] = listeners[type] || [];
        
        try {
            return target.fireEvent("on" + type, eventObject);
        } catch (error) {
            if (typeListeners.event) {
                typeListeners.event(eventObject);
            }

            return;
        }
    });
}( );

// namespaced events, play nice with possible others
function NSEvent( evt, namespace ) 
{ 
    var nsevent = [ ( evt || "" ), NAMESPACE ]; 
    if ( namespace ) nsevent = nsevent.concat( namespace );
    return nsevent.join( '.' )
}

// adapted from https://github.com/ftlabs/ftdomdelegate
var EVENTSTOPPED = "DOMEVENT_STOPPED", 
    captureEvts = ['blur', 'error', 'focus', 'focusin', 'focusout', 'load', 'resize', 'scroll']
;
function captureForType( eventType ){ return -1 < captureEvts.indexOf( eventType ); }
function matchesRoot( root, element ){ return root === element; }
function matchesTag( tagName, element ){ return tagName.toLowerCase( ) === element.tagName.toLowerCase( ); }
function matchesId( id, element ){ return id === element.id; }
function matchesSelector( selector, element ){ return element[MATCHES](selector); }

function DOMEvent( el ) 
{
    var self = this;
    if ( !(self instanceof DOMEvent) ) return new DOMEvent( el );
    if ( el ) self.element( el );
    self.$handle = DOMEvent.Handler.bind( self );
}
DOMEvent.Handler = function( event ) {
    if ( event[EVENTSTOPPED] ) return;
    
    var self = this, i, l, listeners,
        type = event.type, target = event.target/*?event.target:event.srcElement*/, 
        root, phase, listener, returned, listenerList = [ ];

    // Hardcode value of Node.TEXT_NODE
    // as not defined in IE8
    if ( target && 3 === target.nodeType ) target = target.parentNode;

    root = self.$element;
    listeners = root.$listeners;
    phase = event.eventPhase || ( event.target !== event.currentTarget ? 3 : 2 );

    switch ( phase ) 
    {
        case 1: //Event.CAPTURING_PHASE:
            listenerList = listeners[1][type];
            break;
        case 2: //Event.AT_TARGET:
            if (listeners[0] && listeners[0][type]) listenerList = listenerList.concat( listeners[0][type] );
            if (listeners[1] && listeners[1][type]) listenerList = listenerList.concat( listeners[1][type] );
            break;
        case 3: //Event.BUBBLING_PHASE:
            listenerList = listeners[0][type];
            break;
    }
    if ( !listenerList ) return;
    
    // Need to continuously check
    // that the specific list is
    // still populated in case one
    // of the callbacks actually
    // causes the list to be destroyed.
    l = listenerList.length;
    while ( l && target ) 
    {
        for (i=0; i<l; i++) 
        {
            if ( !listenerList ) return;
            listener = listenerList[i];
            if ( !listener ) break;

            if ( listener.matcher( listener.matcherParam, target ) ) 
            {
                returned = listener.handler.call( target, event, target );
            }

            // Stop propagation to subsequent
            // callbacks if the callback returned
            // false
            if ( false === returned || false === event.returnValue ) 
            {
                event[EVENTSTOPPED] = true;
                event.preventDefault( );
                return;
            }
        }

        // TODO:MCG:20120117: Need a way to
        // check if event#stopPropagation
        // was called. If so, break looping
        // through the DOM. Stop if the
        // delegation root has been reached
        if ( /*event.isPropagationStopped( ) ||*/ root === target )  break;
        l = listenerList.length;
        target = target.parentElement;
    }
};
DOMEvent.Dispatch = function( event, element, data ) {
    var evt; // The custom event that will be created
    if ( document.createEvent )
    {
        evt = document.createEvent( "HTMLEvents" );
        evt.initEvent( event, true, true );
        evt.eventName = event;
        if ( null != data ) evt.data = data;
        element.dispatchEvent( evt );
    }
    else
    {
        evt = document.createEventObject( );
        evt.eventType = event;
        evt.eventName = event;
        if ( null != data ) evt.data = data;
        element.fireEvent( "on" + evt.eventType, evt );
    }
};

DOMEvent[proto] = {
    constructor: DOMEvent,
    
    $element: null,
    $handle: null,
    
    dispose: function( ){
        var self = this;
        self.off( ).element( );
        self.$element = null;
        self.$handle = null;
        return self;
    },
    
    element: function( el ) {
        var self = this, listeners, element = self.$element, 
            eventTypes, k;

        // Remove master event listeners
        if ( element ) 
        {
            listeners = element.$listeners;
            eventTypes = Keys( listeners[1] );
            for (k=0; k<eventTypes.length; k++ )
                element.removeEventListener( eventTypes[k], self.$handle, true );
            eventTypes = Keys( listeners[0] );
            for (k=0; k<eventTypes.length; k++ )
                element.removeEventListener( eventTypes[k], self.$handle, false );
            element.$listeners = undef;
        }

        // If no root or root is not
        // a dom node, then remove internal
        // root reference and exit here
        if ( !el || !el.addEventListener) 
        {
            self.$element = null;
            return self;
        }

        self.$element = el;
        el.$listeners = el.$listeners || [{}, {}];

        return self;
    },

    on: function( eventType, selector, handler, useCapture ) {
        var self = this, root, listeners, matcher, i, l, matcherParam, eventTypes, capture;

        root = self.$element; if ( !root ) return self;
        
        if ( !eventType )
            throw new TypeError('Invalid event type: ' + eventType);
        
        eventTypes = eventType.split( SPACES ).map( getNS );
        if ( !eventTypes.length ) return self;
        
        // handler can be passed as
        // the second or third argument
        if ( 'function' === typeof selector ) 
        {
            useCapture = handler;
            handler = selector;
            selector = null;
        }

        if ( 'function' !== typeof handler )
            throw new TypeError('Handler must be a type of Function');

        // Add master handler for type if not created yet
        for (i=0,l=eventTypes.length; i<l; i++)
        {
            // Fallback to sensible defaults
            // if useCapture not set
            if ( undef === useCapture ) 
                capture = captureForType( eventTypes[i][0] );
            else
                capture = !!useCapture;
            listeners = root.$listeners[capture ? 1 : 0];

            if ( !listeners[eventTypes[i][0]] ) 
            {
                listeners[ eventTypes[i][0] ] = [ ];
                root.addEventListener( eventTypes[i][0], self.$handle, capture );
            }

            if ( !selector ) 
            {
                matcherParam = root;
                matcher = matchesRoot;
            } 
            else if ( /^[a-z]+$/i.test( selector ) ) 
            {
                // Compile a matcher for the given selector
                matcherParam = selector;
                matcher = matchesTag;
            } 
            else if ( /^#[a-z0-9\-_]+$/i.test( selector ) ) 
            {
                matcherParam = selector.slice( 1 );
                matcher = matchesId;
            } 
            else 
            {
                matcherParam = selector;
                matcher = matchesSelector;
            }

            // Add to the list of listeners
            listeners[ eventTypes[i][0] ].push({
                selector: selector,
                handler: handler,
                matcher: matcher,
                matcherParam: matcherParam,
                namespace: eventTypes[ i ][ 1 ].join('.')
            });
        }
        return self;
    },

    off: function( eventType, selector, handler, useCapture ) {
        var self = this, i, listener, listeners, listenerList, e, c,
            root = self.$element,
            singleEventType, singleEventNS, nsMatcher, eventTypes, allCaptures = false;

        if ( !root ) return self;
        
        // Handler can be passed as
        // the second or third argument
        if ( 'function' === typeof selector ) 
        {
            useCapture = handler;
            handler = selector;
            selector = null;
        }

        // If useCapture not set, remove
        // all event listeners
        if ( undef === useCapture ) allCaptures = [0, 1];
        else allCaptures = useCapture ? [1] : [0];

        eventTypes = eventType ? eventType.split( /\s+/g ).map( getNS ) : [ ];
        
        if ( !eventTypes.length ) 
        {
            for (c=0; c<allCaptures.length; c++)
            {
                listeners = root.$listeners[ allCaptures[c] ];
                for ( singleEventType in listeners ) 
                {
                    listenerList = listeners[ singleEventType ];
                    if ( !listenerList || !listenerList.length ) continue;
                    // Remove only parameter matches
                    // if specified
                    for (i=listenerList.length-1; i>=0; i--) 
                    {
                        listener = listenerList[ i ];
                        if ( (!selector || selector === listener.selector) && 
                            (!handler || handler === listener.handler) )
                            listenerList.splice( i, 1 );
                    }
                    // All listeners removed
                    if ( !listenerList.length ) 
                    {
                        delete listeners[ singleEventType ];
                        // Remove the main handler
                        root.removeEventListener( singleEventType, self.$handle, !!allCaptures[c] );
                    }
                }
            }
        }
        else
        {
            for (c=0; c<allCaptures.length; c++)
            {
                listeners = root.$listeners[ allCaptures[c] ];
                for (e=0; e<eventTypes.length; e++)
                {
                    singleEventNS = eventTypes[e][1];
                    singleEventType = eventTypes[e][0];
                    nsMatcher = getNSMatcher( singleEventNS );
                    if ( singleEventType.length )
                    {
                        listenerList = listeners[ singleEventType ];
                        if ( !listenerList || !listenerList.length ) continue;
                        // Remove only parameter matches
                        // if specified
                        for (i=listenerList.length-1; i>=0; i--) 
                        {
                            listener = listenerList[ i ];
                            if ( (!selector || selector === listener.selector) && 
                                (!handler || handler === listener.handler) &&
                                (!nsMatcher || nsMatcher.test(listener.namespace))
                            )
                                listenerList.splice( i, 1 );
                        }
                        // All listeners removed
                        if ( !listenerList.length ) 
                        {
                            delete listeners[ singleEventType ];
                            // Remove the main handler
                            root.removeEventListener( singleEventType, self.$handle, !!allCaptures[c] );
                        }
                    }
                    else
                    {
                        for ( singleEventType in listeners ) 
                        {
                            listenerList = listeners[ singleEventType ];
                            if ( !listenerList || !listenerList.length ) continue;
                            // Remove only parameter matches
                            // if specified
                            for (i=listenerList.length-1; i>=0; i--) 
                            {
                                listener = listenerList[ i ];
                                if ( (!selector || selector === listener.selector) && 
                                    (!handler || handler === listener.handler) &&
                                    (!nsMatcher || nsMatcher.test(listener.namespace))
                                )
                                    listenerList.splice( i, 1 );
                            }
                            // All listeners removed
                            if ( !listenerList.length ) 
                            {
                                delete listeners[ singleEventType ];
                                // Remove the main handler
                                root.removeEventListener( singleEventType, self.$handle, !!allCaptures[c] );
                            }
                        }
                    }
                }
            }
        }
        return self;
    }
};

//
// PublishSubscribe (Interface)
var CAPTURING_PHASE = 1, AT_TARGET = 2, BUBBLING_PHASE = 3,
    
    PBEvent = function( evt, target, ns ) {
        var self = this;
        if ( !(self instanceof PBEvent) ) return new PBEvent( evt, target, ns );
        // http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-Event
        self.type = evt;
        self.target = target;
        self.currentTarget = target;
        self.timeStamp = NOW( );
        self.eventPhase = AT_TARGET;
        self.namespace = ns || null;
    }
;
PBEvent[proto] = {
    constructor: PBEvent
    
    ,type: null
    ,target: null
    ,currentTarget: null
    ,timeStamp: null
    ,eventPhase: AT_TARGET
    ,bubbles: false
    ,cancelable: false
    ,namespace: null
    
    ,stopPropagation: function( ) {
        this.bubbles = false;
    }
    ,preventDefault: function( ) {
    }
};
var PublishSubscribe = {

    $PB: null
    ,namespace: null
    
    ,initPubSub: function( ) {
        var self = this;
        self.$PB = { };
        return self;
    }
    
    ,disposePubSub: function( ) {
        var self = this;
        self.$PB = null;
        return self;
    }
    
    ,trigger: function( evt, data ) {
        var self = this, PB = self.$PB, queue, q, qq, i, l, ns, ns_evt;
        ns = getNS( evt ); evt = ns[ 0 ]; ns_evt = 'evt_' + evt;
        if ( PB[HAS](ns_evt) && (queue=PB[ns_evt]) && (l=queue.length) )
        {
            q = queue.slice( 0 ); ns = ns[1].join('.');
            evt = new PBEvent( evt, self, ns );
            for (i=0; i<l; i++) 
            {
                qq = q[ i ];
                // oneOff and already called
                if ( qq[ 2 ] && qq[ 3 ] ) continue;
                qq[ 3 ] = 1; // handler called
                if ( false === qq[ 0 ]( evt, data ) ) break;
            }
            if ( PB[HAS](ns_evt) && (queue=PB[ns_evt]) && (l=queue.length) )
            {
                // remove any oneOffs that were called this time
                if ( queue.oneOffs > 0 )
                {
                    for (i=l-1; i>=0; i--) 
                    {
                        q = queue[ i ];
                        if ( q[2] && q[3] ) 
                        {
                            queue.splice( i, 1 );
                            queue.oneOffs = queue.oneOffs > 0 ? (queue.oneOffs-1) : 0;
                        }
                    }
                }
                else
                {
                    queue.oneOffs = 0;
                }
            }
        }
        return self;
    }
    
    ,on: function( evt, callback, oneOff/*, thisRef*/ ) {
        var self = this, PB = self.$PB, ns, evts, ns_evt, i, l;
        if ( evt && evt.length && is_type( callback, T_FUNC ) )
        {
            oneOff = !!oneOff;
            evts = evt.split( SPACES ).map( getNS );
            if ( !(l=evts.length) ) return self;
            for (i=0; i<l; i++)
            {
                evt = evts[ i ][ 0 ]; ns = evts[ i ][ 1 ].join('.');
                ns_evt = 'evt_' + evt;
                if ( !PB[HAS](ns_evt) ) 
                {
                    PB[ns_evt] = [ ];
                    PB[ns_evt].oneOffs = 0;
                }
                PB[ns_evt].push( [callback, ns, oneOff, 0/*, thisRef||null*/] );
                if ( oneOff ) PB[ns_evt].oneOffs++;
            }
        }
        return self;
    }
    
    ,onTo: function( pubSub, evt, callback, oneOff ) {
        var self = this;
        if ( is_type( callback, T_FUNC ) ) callback = bindF( callback, self );
        pubSub.on( evt, callback, oneOff );
        return self;
    }
    
    ,off: function( evt, callback ) {
        var self = this, queue, e, i, l, q, PB = self.$PB, ns, isFunc, evts, j, jl, ns_evt;
        if ( !evt || !evt.length )
        {
            for (e in PB) 
            {
                if ( PB[HAS](e) ) delete PB[ e ];
            }
        }
        else 
        {
            isFunc = is_type( callback, T_FUNC );
            evts = evt.split( SPACES ).map( getNS );
            for (j=0,jl=evts.length; j<jl; j++)
            {
                evt = evts[ j ][ 0 ]; ns = getNSMatcher( evts[ j ][ 1 ] );
                if ( evt.length )
                {
                    ns_evt = 'evt_' + evt;
                    if ( PB[HAS](ns_evt) && (queue=PB[ns_evt]) && (l=queue.length) )
                    {
                        for (i=l-1; i>=0; i--)
                        {
                            q = queue[ i ];
                            if ( (!isFunc || callback === q[0]) && 
                                (!ns || ns.test(q[1]))
                            ) 
                            {
                                // oneOff
                                if ( q[ 2 ] ) queue.oneOffs = queue.oneOffs > 0 ? (queue.oneOffs-1) : 0;
                                queue.splice( i, 1 );
                            }
                        }
                    }
                }
                else if ( isFunc || ns )
                {
                    for (e in PB) 
                    {
                        if ( PB[HAS](e) )
                        {
                            queue = PB[ e ];
                            if ( !queue || !(l=queue.length) ) continue;
                            for (i=l-1; i>=0; i--)
                            {
                                q = queue[ i ];
                                if ( (!isFunc || callback === q[0]) && 
                                    (!ns || ns.test(q[1]))
                                ) 
                                {
                                    // oneOff
                                    if ( q[ 2 ] ) queue.oneOffs = queue.oneOffs > 0 ? (queue.oneOffs-1) : 0;
                                    queue.splice( i, 1 );
                                }
                            }
                        }
                    }
                }
            }
        }
        return self;
    }
    
    ,offFrom: function( pubSub, evt, callback ) {
        var self = this;
        //if ( is_type( callback, T_FUNC ) ) callback = bindF( callback, self );
        pubSub.off( evt, callback );
        return self;
    }
};
// aliases
PublishSubscribe.publish = PublishSubscribe.trigger;
/**[DOC_MARKDOWN]
####Cache

ModelView.Cache is a cache class for caching key/values for limited time and space. Used internaly by ModelView.View and ModelView.Model, but also available as public class via ModelView.Cache.

```javascript
// modelview.js cache methods

var cache = new ModelView.Cache( Number cacheSize=Infinity, Number refreshInterval=Infinity );

[/DOC_MARKDOWN]**/
//
// Cache with max duration and max size conditions
var Cache = function( cacheSize, refreshInterval ) {
    var self = this, argslen = arguments.length;
    self.$store = { };
    self.$size = INF;
    self.$interval = INF;
    if ( argslen > 0 && cacheSize > 0 ) self.$size = cacheSize;
    if ( argslen > 1 && refreshInterval > 0 ) self.$interval = refreshInterval;
};
Cache[proto] = {
    
    constructor: Cache
    
    ,$store: null
    ,$size: null
    ,$interval: null
    
/**[DOC_MARKDOWN]
// dispose cache
cache.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function( ) {
        var self = this;
        self.$store = null;
        self.$size = null;
        self.$interval = null;
        return self;
    }

/**[DOC_MARKDOWN]
// reset cache, clear key/value store
cache.reset( );

[/DOC_MARKDOWN]**/
    ,reset: function( ) {
        this.$store = { };
        return this;
    }
    
/**[DOC_MARKDOWN]
// get/set cache  key/value store size
cache.size( [Number size] );

[/DOC_MARKDOWN]**/
    ,size: function( size ) {
        if ( arguments.length )
        {
            if ( size > 0 ) this.$size = size;
            return this;
        }
        return this.$size;
    }
    
/**[DOC_MARKDOWN]
// get/set cache  key/value store refresh interval
cache.interval( [Number interval] );

[/DOC_MARKDOWN]**/
    ,interval: function( interval ) {
        if ( arguments.length )
        {
            if ( interval > 0 ) this.$interval = interval;
            return this;
        }
        return this.$interval;
    }
    
/**[DOC_MARKDOWN]
// whether cache has given key
cache.has( key );

[/DOC_MARKDOWN]**/
    ,has: function( key ) {
        var self = this, sk = key ? self.$store[ '_'+key ] : null;
        return !!(sk && ( NOW( ) - sk.time ) <= self.$interval);
    }
    
/**[DOC_MARKDOWN]
// get cache key (if exists and valid)
cache.get( key );

[/DOC_MARKDOWN]**/
    ,get: function( key ) {
        if ( key )
        {
            var self = this, store = self.$store, k = '_'+key, sk;
            if ( store[HAS]( k ) )
            {
                sk = store[ k ];
                if ( ( NOW( ) - sk.time ) > self.$interval )
                {
                    delete store[ k ];
                    return undef;
                }
                else
                {
                    return sk.data;
                }
            }
        }
        return undef;
    }
    
/**[DOC_MARKDOWN]
// set cache key to val
cache.set( key, val );

[/DOC_MARKDOWN]**/
    ,set: function( key, val ) {
        var self = this, store, size, storekeys, k;
        if ( key )
        {
            k = '_'+key;
            store = self.$store; size = self.$size; storekeys = Keys( store );
            // assuming js hash-keys maintain order in which they were added
            // then this same order is also chronological
            // and can remove top-k elements which should be the k-outdated also
            while ( storekeys.length >= size ) delete store[ storekeys.shift( ) ];
            store[ k ] = { key: key, data: val, time: NOW( ) };
        }
        return self;
    }
    
/**[DOC_MARKDOWN]
// delete cache key (if exists)
cache.del( key );

[/DOC_MARKDOWN]**/
    ,del: function( key ) {
        var k = key ? ('_'+key) : null;
        if ( k && this.$store[HAS]( k ) ) delete this.$store[ k ];
        return this;
    }

    ,toString: function( ) {
        return '[ModelView.Cache]';
    }
};
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/

//
// Data Types / Validators for Models (Static)
var 
    ModelField = function ModelField( modelField ) {
        if ( !is_instance(this, ModelField) ) return new ModelField( modelField );
        this.f = modelField || null;
    },
    
    CollectionEach = function CollectionEach( f ) {
        if ( !is_instance(this, CollectionEach) ) return new CollectionEach( f );
        this.f = f || null;
        this.fEach = 1;
    },
    
    floor = Math.floor, round = Math.round, abs = Math.abs,
    
    pad = function( s, len, ch ) {
        var sp = String(s), n = len-sp.length;
        return n > 0 ? new Array(n+1).join(ch||' ')+sp : sp;
    },

    tpl_$0_re = /\$0/g,
    
    // Validator Compositor
    VC = function VC( V ) {
        
        V.NOT = function( ) { 
            return VC(function( v, k ) { 
                return !V.call(this, v, k); 
            }); 
        };
        
        V.AND = function( V2 ) { 
            return VC(function( v, k ) { 
                var self = this;
                return V.call(self, v, k) && V2.call(self, v, k);
            }); 
        };
        
        V.OR = function( V2 ) { 
            return VC(function( v, k ) { 
                var self = this;
                return V.call(self, v, k) || V2.call(self, v, k);
            }); 
        };

        V.XOR = function( V2 ) { 
            return VC(function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return (r1 && !r2) || (r2 && !r1);
            }); 
        };
        
        V.EQ = function( V2, strict ) { 
            return VC(false !== strict
            ? function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 === r2;
            }
            : function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 == r2;
            }); 
        };
        
        V.NEQ = function( V2, strict ) { 
            return VC(false !== strict
            ? function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 !== r2;
            }
            : function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 != r2;
            }); 
        };
        
        return V;
    },
    
/**[DOC_MARKDOWN]
####Types 
**(used with Models)**

```javascript
// modelview.js type casters

[/DOC_MARKDOWN]**/
    Type = {
        
        tpl_$0: tpl_$0_re,
        
        TypeCaster: function( typecaster ){ return typecaster; }
        
        // default type casters
        ,Cast: {
/**[DOC_MARKDOWN]
// functionaly compose typeCasters, i.e final TypeCaster = TypeCaster1(TypeCaster2(...(value)))
ModelView.Type.Cast.COMPOSITE( TypeCaster1, TypeCaster2 [, ...] );

[/DOC_MARKDOWN]**/
            // composite type caster
            COMPOSITE: function( ) {
                var args = arguments;
                if ( is_type(args[ 0 ], T_ARRAY) ) args = args[ 0 ];
                return function( v, k ) {
                   var l = args.length;
                   while ( l-- ) v = args[l].call(this, v, k);
                   return v;
                };
            },
            
/**[DOC_MARKDOWN]
// cast to "eachTypeCaster" for each element in a collection (see examples)
ModelView.Type.Cast.EACH( eachTypeCaster );

[/DOC_MARKDOWN]**/
            // collection for each item type caster
            EACH: CollectionEach,
            
/**[DOC_MARKDOWN]
// cast fields of an object with a FIELDS TypeCaster
ModelView.Type.Cast.FIELDS({
    'field1': ModelView.Type.Cast.STR,
    'field2': ModelView.Type.Cast.BOOL,
    'field3': ModelView.Type.TypeCaster(function(v) { return v; }) // a custom type caster
    // etc..
});

[/DOC_MARKDOWN]**/
            // type caster for each specific field of an object
            FIELDS: function( typesPerField ) {
                //var notbinded = true;
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                typesPerField = Merge( {}, typesPerField || {} );
                return function( v ) { 
                    var self = this, field, type, val;
                    for ( field in typesPerField )
                    {
                        if ( typesPerField[HAS](field) )
                        {
                            type = typesPerField[ field ]; val = v[ field ];
                            if ( type.fEach && is_type(val, T_ARRAY) )
                            {
                               v[ field ] = iterate(function( i, val ) {
                                   val[ i ] = type.f.call( self, val[ i ] );
                               }, 0, val.length-1, val);
                            }
                            else
                            {
                                v[ field ] = type.call( self, val );
                            }
                        }
                    }
                    return v;
                }; 
            },
            
/**[DOC_MARKDOWN]
// cast to defaultValue if value not set or empty string
ModelView.Type.Cast.DEFAULT( defaultValue );

[/DOC_MARKDOWN]**/
            DEFAULT: function( defaultValue ) {  
                return function( v ) { 
                    var T = get_type( v );
                    if ( (T_UNDEF & T) || ((T_STR & T) && !trim(v).length)  ) v = defaultValue;
                    return v;
                }; 
            },
/**[DOC_MARKDOWN]
// cast to boolean
ModelView.Type.Cast.BOOL;

[/DOC_MARKDOWN]**/
            BOOL: function( v ) { 
                // handle string representation of booleans as well
                if ( is_type(v, T_STR) && v.length )
                {
                    var vs = v.toLowerCase( );
                    return "true" === vs || "on" === vs || "1" === vs;
                }
                return !!v; 
            },
/**[DOC_MARKDOWN]
// cast to integer
ModelView.Type.Cast.INT;

[/DOC_MARKDOWN]**/
            INT: function( v ) { 
                // convert NaN to 0 if needed
                return parseInt(v, 10) || 0;
            },
/**[DOC_MARKDOWN]
// cast to float
ModelView.Type.Cast.FLOAT;

[/DOC_MARKDOWN]**/
            FLOAT: function( v ) { 
                // convert NaN to 0 if needed
                return parseFloat(v, 10) || 0;
            },
/**[DOC_MARKDOWN]
// min if value is less than
ModelView.Type.Cast.MIN( min );

[/DOC_MARKDOWN]**/
            MIN: function( m ) {  
                return function( v ) { return (v < m) ? m : v; }; 
            },
/**[DOC_MARKDOWN]
// max if value is greater than
ModelView.Type.Cast.MAX( max );

[/DOC_MARKDOWN]**/
            MAX: function( M ) {  
                return function( v ) { return (v > M) ? M : v; }; 
            },
/**[DOC_MARKDOWN]
// clamp between min-max (included)
ModelView.Type.Cast.CLAMP( min, max );

[/DOC_MARKDOWN]**/
            CLAMP: function( m, M ) {  
                // swap
                if ( m > M ) { var tmp = M; M = m; m = tmp; }
                return function( v ) { return (v < m) ? m : ((v > M) ? M : v); }; 
            },
/**[DOC_MARKDOWN]
// cast to trimmed string of spaces
ModelView.Type.Cast.TRIM;

[/DOC_MARKDOWN]**/
            TRIM: function( v ) { 
                return trim(Str(v));
            },
/**[DOC_MARKDOWN]
// cast to string
ModelView.Type.Cast.STR;

[/DOC_MARKDOWN]**/
            STR: function( v ) { 
                return (''+v); 
            }
        }
        
/**[DOC_MARKDOWN]
// add a custom typecaster
ModelView.Type.add( name, typeCaster );

[/DOC_MARKDOWN]**/
        ,add: function( type, handler ) {
            if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) 
                Type.Cast[ type ] = handler;
            return Type;
        }
        
/**[DOC_MARKDOWN]
// delete custom typecaster
ModelView.Type.del( name );

[/DOC_MARKDOWN]**/
        ,del: function( type ) {
            if ( is_type( type, T_STR ) && Type.Cast[HAS]( type ) ) delete Type.Cast[ type ];
            return Type;
        }
    
        ,toString: function( ) {
            return '[ModelView.Type]';
        }
    },
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/
    
/**[DOC_MARKDOWN]
####Validators 
**(used with Models)**

(extra validators are available in `modelview.validation.js`)

```javascript
// modelview.js validators
// (extra validators are available in `modelview.validation.js`)

[/DOC_MARKDOWN]**/
    Validation = {
        
        Validator: VC
        
        // default validators
        ,Validate: {
/**[DOC_MARKDOWN]
// validate each element in a collection using "eachValidator"
ModelView.Validation.Validate.EACH( eachValidator );

[/DOC_MARKDOWN]**/
            // collection for each item validator
            EACH: CollectionEach,
            
/**[DOC_MARKDOWN]
// validate fields of an object with a FIELDS Validator
ModelView.Validation.Validate.FIELDS({
    'field1': ModelView.Validation.Validate.GREATER_THAN( 0 ),
    'field2': ModelView.Validation.Validate.BETWEEN( v1, v2 ),
    'field3': ModelView.Validation.Validator(function(v) { return true; }) // a custom validator
    // etc..
});

[/DOC_MARKDOWN]**/
            // validator for each specific field of an object
            FIELDS: function( validatorsPerField ) {
                //var notbinded = true;
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                validatorsPerField = Merge( {}, validatorsPerField || {} );
                return VC(function( v ) { 
                    var self = this, field, validator, val, l, i;
                    for ( field in validatorsPerField )
                    {
                        if ( validatorsPerField[HAS](field) )
                        {
                            validator = validatorsPerField[ field ]; val = v[ field ];
                            if ( validator.fEach && is_type(val, T_ARRAY) )
                            {
                               l = val.length;
                               for (i=0; i<l; i++) if ( !validator.f.call( self, val[ i ] ) )  return false;
                            }
                            else
                            {
                                if ( !validator.call( self, val ) ) return false;
                            }
                        }
                    }
                    return true;
                }); 
            },

/**[DOC_MARKDOWN]
// validate (string) is numeric
ModelView.Validation.Validate.NUMERIC;

[/DOC_MARKDOWN]**/
            NUMERIC: VC(function( v ) { 
                return is_numeric( v ); 
            }),
/**[DOC_MARKDOWN]
// validate (string) empty (can be used as optional)
ModelView.Validation.Validate.EMPTY;

[/DOC_MARKDOWN]**/
            EMPTY: VC(function( v ){
                return !v || !trim(Str(v)).length;
            }),
/**[DOC_MARKDOWN]
// validate (string) not empty
ModelView.Validation.Validate.NOT_EMPTY;

[/DOC_MARKDOWN]**/
            NOT_EMPTY: VC(function( v ) { 
                return !!( v && (0 < trim(Str(v)).length) ); 
            }),
/**[DOC_MARKDOWN]
// validate (string) maximum length
ModelView.Validation.Validate.MAXLEN( len=0 );

[/DOC_MARKDOWN]**/
            MAXLEN: function( len ) {
                return VC(newFunc("v", "return v.length <= "+(len||0)+";")); 
            },
/**[DOC_MARKDOWN]
// validate (string) minimum length
ModelView.Validation.Validate.MINLEN( len=0 );

[/DOC_MARKDOWN]**/
            MINLEN: function( len ) {
                return VC(newFunc("v", "return v.length >= "+(len||0)+";")); 
            },
/**[DOC_MARKDOWN]
// validate value matches regex pattern
ModelView.Validation.Validate.MATCH( regex );

[/DOC_MARKDOWN]**/
            MATCH: function( regex_pattern ) { 
                return VC(function( v ) { return regex_pattern.test( v ); }); 
            },
/**[DOC_MARKDOWN]
// validate value not matches regex pattern
ModelView.Validation.Validate.NOT_MATCH( regex );

[/DOC_MARKDOWN]**/
            NOT_MATCH: function( regex_pattern ) { 
                return VC(function( v ) { return !regex_pattern.test( v ); }); 
            },
/**[DOC_MARKDOWN]
// validate equal to value (or model field)
ModelView.Validation.Validate.EQUAL( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            EQUAL: function( val, strict ) { 
                if ( is_instance(val, ModelField) ) 
                    return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "===" : "==")+" v;")); 
                return false !== strict 
                    ? VC(function( v ) { return val === v; })
                    : VC(function( v ) { return val == v; })
                ; 
            },
/**[DOC_MARKDOWN]
// validate not equal to value (or model field)
ModelView.Validation.Validate.NOT_EQUAL( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            NOT_EQUAL: function( val, strict ) { 
                if ( is_instance(val, ModelField) ) 
                    return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "!==" : "!=")+" v;"));
                return false !== strict 
                    ? VC(function( v ) { return val !== v; })
                    : VC(function( v ) { return val != v; })
                ; 
            },
/**[DOC_MARKDOWN]
// validate greater than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.GREATER_THAN( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            GREATER_THAN: function( m, strict ) { 
                if ( is_instance(m, ModelField) ) m = "this.$data."+m.f;
                else if ( is_type(m, T_STR) ) m = '"' + m + '"';
                return VC(newFunc("v", "return "+m+" "+(false !== strict ? "<" : "<=")+" v;")); 
            },
/**[DOC_MARKDOWN]
// validate less than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.LESS_THAN( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            LESS_THAN: function( M, strict ) { 
                if ( is_instance(M, ModelField) ) M = "this.$data."+M.f;
                else if ( is_type(M, T_STR) ) M = '"' + M + '"';
                return VC(newFunc("v", "return "+M+" "+(false !== strict ? ">" : ">=")+" v;")); 
            },
/**[DOC_MARKDOWN]
// validate between (or equal if "strict" is false) the interval [value1, value2]
ModelView.Validation.Validate.BETWEEN( value1 | Model.Field("a.model.field"), value2 | Model.Field("another.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            BETWEEN: function( m, M, strict ) {  
                if ( is_type(m, T_ARRAY) ) { strict = M; M = m[1]; m=m[0]; }
                
                var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
                // swap
                if ( !is_m_field && !is_M_field && m > M ) { tmp = M; M = m; m = tmp; }
                m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
                M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
                return false !== strict 
                    ? VC(newFunc("v", "return ( "+m+" < v ) && ( "+M+" > v );"))
                    : VC(newFunc("v", "return ( "+m+" <= v ) && ( "+M+" >= v );"))
                ; 
            },
/**[DOC_MARKDOWN]
// validate not between (or equal if "strict" is false) the interval [value1, value2]
ModelView.Validation.Validate.NOT_BETWEEN( value1 | Model.Field("a.model.field"), value2 | Model.Field("another.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            NOT_BETWEEN: function( m, M, strict ) {  
                if ( is_type(m, T_ARRAY) ) { strict = M; M = m[1]; m=m[0]; }
                
                var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
                // swap
                if ( !is_m_field && !is_M_field && m > M ) { tmp = M; M = m; m = tmp; }
                m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
                M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
                return false !== strict 
                    ? VC(newFunc("v", "return ( "+m+" > v ) || ( "+M+" < v );"))
                    : VC(newFunc("v", "return ( "+m+" >= v ) || ( "+M+" <= v );"))
                ; 
            },
/**[DOC_MARKDOWN]
// validate value is one of value1, value2, ...
ModelView.Validation.Validate.IN( value1, value2 [, ...] );

[/DOC_MARKDOWN]**/
            IN: function( /* vals,.. */ ) { 
                var vals = slice.call( arguments ); 
                if ( is_type(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                return VC(function( v ) { 
                    return -1 < vals.indexOf( v ); 
                }); 
            },
/**[DOC_MARKDOWN]
// validate value is not one of value1, value2, ...
ModelView.Validation.Validate.NOT_IN( value1, value2 [, ...] );

[/DOC_MARKDOWN]**/
            NOT_IN: function( /* vals,.. */ ) { 
                var vals = slice.call( arguments ); 
                if ( is_type(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                return VC(function( v ) { 
                    return 0 > vals.indexOf( v ); 
                }); 
            }
        }
/**[DOC_MARKDOWN]
// add a custom validator
ModelView.Validation.add( name, validator );

[/DOC_MARKDOWN]**/
        ,add: function( type, handler ) {
            if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) 
                Validation.Validate[ type ] = is_type( handler.XOR, T_FUNC ) ? handler : VC( handler );
            return Validation;
        }
        
/**[DOC_MARKDOWN]
// delete custom validator
ModelView.Validation.del( name );

[/DOC_MARKDOWN]**/
        ,del: function( type ) {
            if ( is_type( type, T_STR ) && Validation.Validate[HAS]( type ) ) delete Validation.Validate[ type ];
            return Validation;
        }
    
        ,toString: function( ) {
            return '[ModelView.Validation]';
        }
    }
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/
;

/**[DOC_MARKDOWN]
**example**
```javascript

// example

$dom.modelview({

    id: 'view',
    
    autobind: true,
    bindAttribute: 'data-bind',
    events: [ 'change', 'click' ],
    
    model: {
        
        id: 'model',
        
        data: {
            // model data here ..
            
            mode: 'all',
            user: 'foo',
            collection: [ ]
        },
        
        types: {
            // data type-casters here ..
            
            mode: $.ModelView.Type.Cast.STR,
            user: $.ModelView.Type.Cast.STR,
            
            // support wildcard assignment of typecasters
            'collection.*': $.ModelView.Type.Cast.FIELDS({
                // type casters can be composed in an algebraic/functional way..
                
                'field1': $.ModelView.Type.Cast.COMPOSITE($.ModelView.Type.Cast.DEFAULT( "default" ), $.ModelView.Type.Cast.STR),
                
                'field2': $.ModelView.Type.Cast.BOOL
            })
            // this is equivalent to:
            //'collection': $.ModelView.Type.Cast.EACH($.ModelView.Type.Cast.FIELDS( .. ))
        },
        
        validators: {
            // data validators here ..
            
            mode: $.ModelView.Validation.Validate.IN( 'all', 'active', 'completed' ),
            
            // support wildcard assignment of validators
            'collection.*': $.ModelView.Validation.Validate.FIELDS({
                // validators can be combined (using AND/OR/NOT/XOR) in an algebraic/functional way
                
                'field1': $.ModelView.Validation.Validate.NOT_EMPTY.AND( $.ModelView.Validation.Validate.MATCH( /item\d+/ ) ),
                
                'field2': $.ModelView.Validation.Validate.BETWEEN( v1, v2 ).OR( $.ModelView.Validation.Validate.GREATER_THAN( v3 ) )
            })
            // this is equivalent to:
            //'collection': $.ModelView.Validation.Validate.EACH($.ModelView.Validation.Validate.FIELDS( .. ))
        },
        
        dependencies: {
            // data inter-dependencies (if any) here..
            
            // 'mode' field value depends on 'user' field value, e.g by a custom getter
            mode: ['user']
        }
    },
    
    actions: { 
        // custom view actions (if any) here ..
    }
});


```
[/DOC_MARKDOWN]**/

// Model utils
var 
    get_next = function( a, k ) {
        if ( !a ) return null;
        var b = iterate(function( i, b ){
            var ai = a[ i ];
            if ( ai )
            {
                if ( ai[HAS]( k ) ) b.push( ai[ k ].n );
                if ( ai[HAS]( WILDCARD ) ) b.push( ai[ WILDCARD ].n );
            }
        }, 0, a.length-1, []);
        return b.length ? b : null;
    },
    
    get_value = function( a, k ) {
        if ( !a ) return null;
        var i, ai, l = a.length;
        if ( undef !== k )
        {
            for (i=0; i<l; i++)
            {
                ai = a[ i ];
                if ( ai )
                {
                    if ( ai[HAS]( k ) && ai[ k ].v ) return ai[ k ].v;
                    if ( ai[HAS]( WILDCARD ) && ai[ WILDCARD ].v ) return ai[ WILDCARD ].v;
                }
            }
        }
        else
        {
            for (i=0; i<l; i++)
            {
                ai = a[ i ];
                if ( ai && ai.v ) return ai.v;
            }
        }
        return null;
    },
    
    walk_and_add = function( v, p, obj, isCollectionEach ) {
        var o = obj, k, i = 0, l = p.length;
        while ( i < l )
        {
            k = p[i++];
            if ( !o[HAS](k) ) o[ k ] = new Node( );
            o = o[ k ];
            if ( i < l ) 
            {
                o = o.n;
            }
            else 
            {
                if ( isCollectionEach )
                {
                    if ( !o.n[HAS](WILDCARD) ) o.n[ WILDCARD ] = new Node( );
                    o.n[ WILDCARD ].v = v;
                }
                else
                {
                    o.v = v;
                }
            }
        }
        return obj;
    },
    
    walk_and_check = function( p, obj, aux, C ) {
        var o = obj, a = aux ? [aux] : null, k, to, i = 0, l = p.length;
        while ( i < l ) 
        {
            k = p[i++];
            to = get_type( o );
            if ( i < l )
            {
                if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) )
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if ( o instanceof C ) return [C, o, p.slice(i)];
                    a && (a = get_next( a, k ));
                }
                else if ( !a || !(a = get_next( a, k )) )
                {
                    return false;
                }
            }
            else
            {
                if ( a && get_value( a, k ) ) return true;
                else if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) ) return true;
                else if ( T_OBJ === to && 'length' == k ) return true;
                return false;
            }
        }
        return false;
    },
    
    walk_and_get2 = function( p, obj, aux, C ) {
        var o = obj, a = aux ? [aux] : null, k, to, i = 0, l = p.length;
        while ( i < l ) 
        {
            k = p[i++]; to = get_type( o );
            if ( i < l )
            {
                if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) )
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if ( o instanceof C ) return [C, o, p.slice(i)];
                    a && (a = get_next( a, k ));
                }
                else if ( !a || !(a = get_next( a, k )) )
                {
                    return false;
                }
            }
            else
            {
                if ( a && (a = get_value( a, k )) ) return [false, a];
                else if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) ) return [true, o[k]];
                else if ( T_OBJ === to && 'length' == k ) return [true, Keys(o).length];
                return false;
            }
        }
        return false;
    },
    
    walk_and_get_value2 = function( p, obj, aux, C ) {
        var o = obj, a = aux, k, to, i = 0, l = p.length;
        while ( i < l ) 
        {
            k = p[i++]; to = get_type( o );
            if ( i < l )
            {
                if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) )
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if ( o instanceof C ) return [C, o, p.slice(i)];
                    else if ( !a || !(a = get_next( a, k )) ) return false;
                }
                else
                {
                    return false;
                }
            }
            else
            {
                // nested sub-composite class
                if ( o[k] instanceof C ) return [C, o[k], p.slice(i)];
                else if ( a /*&& get_value( a, k )*/ && (to&T_ARRAY_OR_OBJ) && o[HAS](k) ) return [true, o, k, a];
                return false;
            }
        }
        return false;
    },
    
    walk_and_get3 = function( p, obj, aux1, aux2, aux3, C, all3 ) {
        var o = obj, a1 = null, a2 = null, a3 = null, 
            k, to, i = 0, l = p.length
        ;
        all3 = false !== all3;
        if ( all3 ) { a1 = [aux1]; a2 = [aux2]; a3 = [aux3]; }
        
        while ( i < l ) 
        {
            k = p[i++];
            to = get_type( o );
            if ( i < l )
            {
                if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) )
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if ( o instanceof C ) return [C, o, p.slice(i), 0, null, null, null];
                    if ( all3 )
                    {
                        a1 = get_next( a1, k );
                        a2 = get_next( a2, k );
                        a3 = get_next( a3, k );
                    }
                }
                // fixed, it bypassed setters which had multiple virtual levels
                else if ( all3 && a3 && (a3 = get_next( a3, k )) )
                {
                    a1 = get_next( a1, k );
                    a2 = get_next( a2, k );
                }
                else
                {
                    return [false, o, k, p, null, null, null];
                }
            }
            else if ( (to&T_ARRAY_OR_OBJ) ) 
            {
                
                // nested sub-composite class
                if ( o[ k ] instanceof C )
                    return [C, o[k], p.slice(i), 0, null, null, null];
                else if ( o[HAS](k) /*|| (to === T_OBJ && "length" === k)*/) 
                    return [true, o, k, p.slice(i), a1, a2, a3];
                return [false, o, k, p.slice(i), a1, a2, a3];
            }
        }
        return [false, o, k, p.slice(i), null, null, null];
    },
    
    // http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
    index_to_prop_re = /\[([^\]]*)\]/g, trailing_dots_re = /^\.+|\.+$/g,
    dotted = function( key ) {
        //        convert indexes to properties     strip leading/trailing dots
        return key.replace(index_to_prop_re, '.$1').replace(trailing_dots_re, '');
    },
    bracketed = function( dottedKey ) { 
        return '['+dottedKey.split('.').join('][')+']'; 
    },
    
    removePrefix = function( prefix ) {
        // strict mode (after prefix, a key follows)
        var regex = new Regex( '^' + prefix + '([\\.|\\[])' );
        return function( key, to_dotted ) { 
            var k = key.replace( regex, '$1' );
            return to_dotted ? dotted( k ) : k;
        };
    },

    keyLevelUp = function( dottedKey, level ) {
        return dottedKey && (0 > level) ? dottedKey.split('.').slice(0, level).join('.') : dottedKey;
    },
    
    addModelTypeValidator = function addModelTypeValidator( model, dottedKey, typeOrValidator, modelTypesValidators ) {
        var k, t, isCollectionEach = false;
        if ( isCollectionEach=is_instance( typeOrValidator, CollectionEach ) )
        {
            // each wrapper
            typeOrValidator = typeOrValidator.f; //bindF( typeOrValidator.f, model );
            // bind the typeOrValidator handler to 'this model'
            walk_and_add( typeOrValidator, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelTypesValidators, isCollectionEach );
        }
        else
        {
            t = get_type( typeOrValidator );
            if ( T_FUNC & t )
            {
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                //typeOrValidator = bindF( typeOrValidator, model );
                // bind the typeOrValidator handler to 'this model'
                walk_and_add( typeOrValidator, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelTypesValidators, isCollectionEach );
            }
            else if ( T_ARRAY_OR_OBJ & t )
            {
                // nested keys given, recurse
                for ( k in typeOrValidator ) 
                {
                    if ( typeOrValidator[HAS](k) )
                        addModelTypeValidator( model, dottedKey + '.' + k, typeOrValidator[ k ], modelTypesValidators );
                }
            }
        }
    },
    
    addModelGetterSetter = function addModelGetterSetter( model, dottedKey, getterOrSetter, modelGettersSetters ) {
        var k, t;
        t = get_type( getterOrSetter );
        if ( T_FUNC & t )
        {
            // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
            // bind the getterOrSetter handler to 'this model'
            walk_and_add( getterOrSetter /*bindF( getterOrSetter, model )*/, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelGettersSetters );
        }
        else if ( T_ARRAY_OR_OBJ & t )
        {
            // nested keys given, recurse
            for ( k in getterOrSetter ) 
            {
                if ( getterOrSetter[HAS](k) )
                    addModelGetterSetter( model, dottedKey + '.' + k, getterOrSetter[ k ], modelGettersSetters );
            }
        }
    },
    
    modelDefaults = function modelDefaults( model, data, defaults ) {
        var k, v;
        for (k in defaults) 
        {
            if ( defaults[HAS](k) )
            {
                v = defaults[ k ];
                if ( !data[HAS]( k ) )
                {
                    data[ k ] = v;
                }
                else if ( is_type( data[k], T_ARRAY_OR_OBJ ) && is_type( v, T_ARRAY_OR_OBJ ) )
                {
                    data[ k ] = modelDefaults( model, data[k], v );
                }
            }
        }
        return data;
    },
    
    // handle sub-composite models as data, via walking the data
    serializeModel = function serializeModel( model_instance, model_class, data, dataType ) {
        var key, type;
        if ( arguments.length < 3 ) data = model_instance.$data;
        
        while ( data instanceof model_class ) { data = data.data( ); }
        
        type = dataType || get_type( data );
        data = (T_OBJ & type) ? Merge({}, data) : ((T_ARRAY & type) ? data.slice(0) : data);
        
        if ( T_ARRAY_OR_OBJ & type )
        {
            for (key in data)
            {
                if ( data[HAS](key) )
                {
                    if ( data[ key ] instanceof model_class )
                        data[ key ] = serializeModel( data[ key ], model_class, Merge( {}, data[ key ].data( ) ) );
                    else if ( T_ARRAY_OR_OBJ & (type=get_type(data[ key ])) )
                        data[ key ] = serializeModel( model_instance, model_class, data[ key ], type );
                }
            }
        }
        
        return data;
    },
    
    // handle sub-composite models via walking the data and any attached typecasters
    typecastModel = function typecastModel( model, modelClass, dottedKey, data, typecasters, prefixKey ) {
        var o, key, val, typecaster, r, res, nestedKey, splitKey;
        prefixKey = !!prefixKey ? (prefixKey+'.') : '';
        data = data || model.$data;
        typecasters = typecasters || [model.$types];
        
        if ( typecasters && typecasters.length )
        {
            if ( !!dottedKey )
            {
                if ( (r = walk_and_get_value2( splitKey=dottedKey.split('.'), o=data, typecasters, modelClass )) )
                {
                    o = r[ 1 ]; key = r[ 2 ];
                    
                    if ( modelClass === r[ 0 ]  ) 
                    {
                        nestedKey = splitKey.slice(0, splitKey.length-key.length).join('.');
                        // nested sub-model
                        typecastModel( o, modelClass, key.length ? key.join('.') : null );
                    }
                    else
                    {
                        nestedKey = splitKey.slice(0, -1).join('.');
                        val = o[ key ]; typecaster = get_value( r[3], key );
                        if ( typecaster ) 
                        {
                            o[ key ] = typecaster.call(model, val, prefixKey+dottedKey);
                        }
                        if ( (T_ARRAY_OR_OBJ & get_type( val )) && (typecasters=get_next( r[3], key )) && typecasters.length )
                        {
                            nestedKey += !!nestedKey ? ('.' + key) : key;
                            nestedKey = prefixKey+nestedKey;
                            for (key in val)
                            {
                                if ( val[HAS](key) )
                                {
                                    typecastModel( model, modelClass, key, val, typecasters, nestedKey );
                                }
                            }
                        }
                    }
                }
            }
            else if ( T_ARRAY_OR_OBJ & get_type( data ) )
            {
                for (key in data)
                {
                    if ( data[HAS](key) )
                    {
                        typecastModel( model, modelClass, key, data, typecasters );
                    }
                }
            }
        }
    },
    
    // handle sub-composite models via walking the data and any attached validators
    validateModel = function validateModel( model, modelClass, breakOnError, dottedKey, data, validators ) {
        var o, key, val, validator, r, res, nestedKey, splitKey, fixKey,
            result = {isValid: true, errors: [ ]}
        ;
        //breakOnError = !!breakOnError;
        data = data || model.$data;
        validators = validators || [model.$validators];
        
        if ( validators && validators.length )
        {
            if ( !!dottedKey )
            {
                fixKey = function( k ){ return !!nestedKey ? (nestedKey + '.' + k) : k; };
                
                if ( (r = walk_and_get_value2( splitKey=dottedKey.split('.'), o=data, validators, modelClass )) )
                {
                    o = r[ 1 ]; key = r[ 2 ];
                    
                    if ( modelClass === r[ 0 ]  ) 
                    {
                        nestedKey = splitKey.slice(0, splitKey.length-key.length).join('.');
                        
                        // nested sub-model
                        res = validateModel( o, modelClass, breakOnError, key.length ? key.join('.') : null );
                        if ( !res.isValid )
                        {
                            result.errors = result.errors.concat( map( res.errors, fixKey ) );
                            result.isValid = false;
                        }
                        if ( !result.isValid && breakOnError ) return result;
                    }
                    else
                    {
                        nestedKey = splitKey.slice(0, -1).join('.');
                        
                        val = o[ key ]; validator = get_value( r[3], key );
                        if ( validator && !validator.call( model, val, dottedKey ) ) 
                        {
                            result.errors.push( dottedKey/*fixKey( key )*/ );
                            result.isValid = false;
                            if ( breakOnError ) return result;
                        }
                        if ( (T_ARRAY_OR_OBJ & get_type( val )) && (validators=get_next( r[3], key )) && validators.length )
                        {
                            nestedKey += !!nestedKey ? ('.' + key) : key;
                            
                            for (key in val)
                            {
                                if ( val[HAS](key) )
                                {
                                    res = validateModel( model, modelClass, breakOnError, key, val, validators );
                                    if ( !res.isValid )
                                    {
                                        result.errors = result.errors.concat( map( res.errors, fixKey ) );
                                        result.isValid = false;
                                    }
                                    if ( breakOnError && !result.isValid  ) return result;
                                }
                            }
                        }
                    }
                }
            }
            else if ( T_ARRAY_OR_OBJ & get_type( data ) )
            {
                for (key in data)
                {
                    if ( data[HAS](key) )
                    {
                        res = validateModel( model, modelClass, breakOnError, key, data, validators );
                        if ( !res.isValid )
                        {
                            result.errors = result.errors.concat( res.errors );
                            result.isValid = false;
                        }
                        if ( breakOnError && !result.isValid ) return result;
                    }
                }
            }
        }
        return result;
    },
    
    syncHandler = function( evt, data ) {
        var model = evt.target, $syncTo = model.$syncTo, 
            key = data.key, val, keyDot, allKeys, allKeyslen,
            otherkey, othermodel, callback, k, skey,
            syncedKeys, i, l, prev_atomic, prev_atom, __syncing
        ;
        if ( key )
        {
            // make this current key an atom, so as to avoid any circular-loop of updates on same keys
            keyDot = key + '.';
            allKeys = Keys( $syncTo ); allKeyslen = allKeys.length;
            prev_atomic = model.atomic; prev_atom = model.$atom;
            model.atomic = true; model.$atom = key;
            //val = data[HAS]('value') ? data.value : model.get( key );
            for (k=0; k<allKeyslen; k++)
            {
                skey = allKeys[ k ];
                if ( skey === key || startsWith(skey, keyDot) )
                {
                    syncedKeys = $syncTo[skey]; val = model.get( skey );
                    for (i=0,l=syncedKeys.length; i<l; i++)
                    {
                        othermodel = syncedKeys[i][0]; otherkey = syncedKeys[i][1];
                        // fixed, too much recursion, when keys notified other keys, which then were re-synced
                        model.__syncing[othermodel.$id] = model.__syncing[othermodel.$id] || [ ];
                        __syncing = model.__syncing[othermodel.$id];
                        if ( 0 > __syncing.indexOf( otherkey ) )
                        {
                            __syncing.push( otherkey );
                            if ( (callback=syncedKeys[i][2]) ) callback.call( othermodel, otherkey, val, skey, model );
                            else othermodel.set( otherkey, val, 1 );
                            __syncing.pop( );
                        }
                        //model.__syncing[othermodel.$id].__syncing = null;
                    }
                }
            }
            model.$atom = prev_atom; model.atomic = prev_atomic;
        }
    }
;

/**[DOC_MARKDOWN]
####Model

```javascript
// modelview.js model methods

var model = new ModelView.Model( [String id=UUID, Object data={}, Object types=null, Object validators=null, Object getters=null, Object setters=null, Object dependencies=null] );

[/DOC_MARKDOWN]**/
//
// Model Class
var Model = function Model( id, data, types, validators, getters, setters, dependencies ) {
    var model = this;
    
    // constructor-factory pattern
    if ( !(model instanceof Model) ) return new Model( id, data, types, validators, getters, setters, dependencies );
    
    model.$id = uuid('Model');
    model.namespace = model.id = id || model.$id;
    model.key = removePrefix( model.id );
    
    model.$view = null;
    model.atomic = false;  model.$atom = null;
    model.$autovalidate = true;
    model.$types = { }; model.$validators = { }; model.$getters = { }; model.$setters = { };
    model.$idependencies = { }; model.$syncTo = { };
    model.data( data || { } )
        .types( types ).validators( validators )
        .getters( getters ).setters( setters )
        .dependencies( dependencies )
        .initPubSub( )
    ;
};
// STATIC
Model.count = function( o ) {
    if ( !arguments.length ) return 0;
    var T = get_type( o );

    if ( T_OBJ === T ) return Keys( o ).length;
    else if ( T_ARRAY === T ) return o.length;
    else if ( T_UNDEF !== T ) return 1; //  is scalar value, set count to 1
    return 0;
};
// return a sorter to sort model data in custom ways, easily
Model.Sorter = sorter;
Model.Field = ModelField;

// Model implements PublishSubscribe pattern
Model[proto] = Merge( Create( Obj[proto] ), PublishSubscribe, {
    
    constructor: Model
    
    ,id: null
    ,$id: null
    ,$view: null
    ,$data: null
    ,$types: null
    ,$idependencies: null
    ,$validators: null
    ,$getters: null
    ,$setters: null
    ,atomic: false
    ,$atom: null
    ,$autovalidate: true
    ,$syncTo: null
    ,$syncHandler: null
    ,__syncing: null
    
/**[DOC_MARKDOWN]
// dispose model
model.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function( ) {
        var model = this;
        model.disposePubSub( ).$view = null;
        model.$data = null;
        model.$types = null;
        model.$idependencies = null;
        model.$validators = null;
        model.$getters = null;
        model.$setters = null;
        model.atomic = false;
        model.$atom = null;
        model.key = null;
        model.$autovalidate = false;
        model.$syncTo = null;
        model.$syncHandler = null;
        model.__syncing = null;
        return model;
    }
    
    ,view: function( v ) {
        var model = this;
        if ( arguments.length )
        {
            model.$view = v;
            return model;
        }
        return model.$view;
    }
    
/**[DOC_MARKDOWN]
// get / set model data
model.data( [Object data] );

[/DOC_MARKDOWN]**/
    ,data: function( d ) {
        var model = this;
        if ( arguments.length )
        {
            model.$data = d;
            return model;
        }
        return model.$data;
    }
    
/**[DOC_MARKDOWN]
// add model field (inter-)dependencies in {model.key: [array of model.keys it depends on]} format
// when a model.key (model field) changes or updates, it will notify any other fields that depend on it automaticaly
// NOTE: (inter-)dependencies can also be handled by custom model getters/setters as well
model.dependencies( Object dependencies );

[/DOC_MARKDOWN]**/
    ,dependencies: function( deps ) {
        var model = this, k, dependencies = model.$idependencies, d, i, dk, kk, j;
        if ( is_type(deps, T_OBJ) )
        {
            for (k in deps) 
            {
                if ( deps[HAS](k) )
                {
                    // inverse dependencies, used by model
                    d = deps[ k ] ? [].concat( deps[ k ] ) : [];
                    for (i=0; i<d.length; i++)
                    {
                        // add hierarchical/dotted key, all levels
                        kk = d[i].split('.');
                        dk = kk[0];
                        if ( !dependencies[HAS](dk) ) dependencies[ dk ] = [ ];
                        if ( 0 > dependencies[ dk ].indexOf( k ) ) dependencies[ dk ].push( k );
                        for (j=1; j<kk.length; j++)
                        {
                            dk += '.' + kk[j];
                            if ( !dependencies[HAS](dk) ) dependencies[ dk ] = [ ];
                            if ( 0 > dependencies[ dk ].indexOf( k ) ) dependencies[ dk ].push( k );
                        }
                    }
                }
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// add default values given in {key: defaults} format
model.defaults( Object defaults );

[/DOC_MARKDOWN]**/
    ,defaults: function( defaults ) {
        var model = this, k, v, data = model.$data;
        if ( is_type(defaults, T_OBJ) )
        {
            for (k in defaults) 
            {
                if ( defaults[HAS](k) )
                {
                    v = defaults[ k ];
                    if ( !data[HAS]( k ) )
                    {
                        data[ k ] = v;
                    }
                    else if ( is_type( data[k], T_ARRAY_OR_OBJ ) && is_type( v, T_ARRAY_OR_OBJ ) )
                    {
                        data[ k ] = modelDefaults( model, data[k], v );
                    }
                }
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// add typecasters given in {dottedKey: typecaster} format
model.types( Object typeCasters );

[/DOC_MARKDOWN]**/
    ,types: function( types ) {
        var model = this, k;
        if ( is_type(types, T_OBJ) )
        {
            for (k in types) 
            {
                if ( types[HAS](k) )
                    addModelTypeValidator( model, k, types[ k ], model.$types );
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// add validators given in {dottedKey: validator} format
model.validators( Object validators );

[/DOC_MARKDOWN]**/
    ,validators: function( validators ) {
        var model = this, k;
        if ( is_type(validators, T_OBJ) )
        {
            for (k in validators) 
            {
                if ( validators[HAS](k) )
                    addModelTypeValidator( model, k, validators[ k ], model.$validators );
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// add custom getters (i.e computed/virtual observables) given in {dottedKey: getter} format
model.getters( Object getters );

[/DOC_MARKDOWN]**/
    ,getters: function( getters ) {
        var model = this, k;
        if ( is_type(getters, T_OBJ) )
        {
            for (k in getters) 
            {
                if ( getters[HAS](k) )
                    addModelGetterSetter( model, k, getters[ k ], model.$getters );
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// add custom setters given in {dottedKey: setter} format
model.setters( Object setters );

[/DOC_MARKDOWN]**/
    ,setters: function( setters ) {
        var model = this, k;
        if ( is_type(setters, T_OBJ) )
        {
            for (k in setters) 
            {
                if ( setters[HAS](k) )
                    addModelGetterSetter( model, k, setters[ k ], model.$setters );
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// get model data in plain JS Object format
// handles nested composite models automaticaly
model.serialize( );

[/DOC_MARKDOWN]**/
    // handle sub-composite models as data, via walking the data
    ,serialize: function( ) {
        return serializeModel( this, Model );
    }
    
/**[DOC_MARKDOWN]
// typecast model for given key or all data with any attached model typecasters
// handles nested composite models automaticaly
model.typecast( [String dottedKey=undefined] );

[/DOC_MARKDOWN]**/
    // handle sub-composite models via walking the data and any attached typecasters
    ,typecast: function( dottedKey ) {
        typecastModel( this, Model, dottedKey );
        return this;
    }
    
/**[DOC_MARKDOWN]
// validate model for given key or all data with any attached model validators
// (return on first not valid value if  breakOnFirstError is true )
// handles nested composite models automaticaly
// returns: { isValid: [true|false], errors:[Array of (nested) model keys which are not valid] }
model.validate( [Boolean breakOnFirstError=false, String dottedKey=undefined] );

[/DOC_MARKDOWN]**/
    // handle sub-composite models via walking the data and any attached validators
    ,validate: function( breakOnFirstError, dottedKey ) {
        return validateModel( this, Model, !!breakOnFirstError, dottedKey );
    }
    
/**[DOC_MARKDOWN]
// get/set model auto-validate flag, if TRUE validates each field that has attached validators live as it changes
model.autovalidate( [Boolean enabled] );

[/DOC_MARKDOWN]**/
    ,autovalidate: function( enabled ) {
        var model = this;
        if ( arguments.length )
        {
            model.$autovalidate = !!enabled;
            return model;
        }
        return model.$autovalidate;
    }
    
/**[DOC_MARKDOWN]
// whether model has given key (bypass custom model getters if RAW is true)
model.has( String dottedKey [, Boolean RAW=false ] );

[/DOC_MARKDOWN]**/
    ,has: function( dottedKey, RAW ) {
        var model = this, data = model.$data, getters = model.$getters, r;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') && ( data[HAS](dottedKey) || (!RAW && (r=getters[dottedKey]||getters[WILDCARD]) && r.v) ) )
        {
            // handle single key fast
            return true;
        }
        else if ( (r = walk_and_check( dottedKey.split('.'), data, RAW ? null : getters, Model )) )
        {
            return (true === r) ? true : r[1].has(r[2].join('.'));
        }
        return false;
    }
    
/**[DOC_MARKDOWN]
// model get given key (bypass custom model getters if RAW is true)
model.get( String dottedKey [, Boolean RAW=false ] );

[/DOC_MARKDOWN]**/
    ,get: function( dottedKey, RAW ) {
        var model = this, data = model.$data, getters = model.$getters, r;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            if ( !RAW && (r=getters[dottedKey]||getters[WILDCARD]) && r.v ) return r.v.call( model, dottedKey );
            return data[ dottedKey ];
        }
        else if ( (r = walk_and_get2( dottedKey.split('.'), data, RAW ? null : getters, Model )) )
        {
            // nested sub-model
            if ( Model === r[ 0 ] ) return r[ 1 ].get(r[ 2 ].join('.'), RAW);
            // custom getter
            else if ( false === r[ 0 ] ) return r[ 1 ].call( model, dottedKey );
            // model field
            return r[ 1 ];
        }
        return undef;
    }
    
/**[DOC_MARKDOWN]
// model get all matching keys including wildcards (bypass custom model getters if RAW is true)
model.getAll( Array dottedKeys [, Boolean RAW=false ] );

[/DOC_MARKDOWN]**/
    ,getAll: function( fields, RAW ) {
        var model = this, keys, kk, k,
            f, fl, p, l, i, o, t, getters, g, getter,
            data, stack, to_get, dottedKey, results = [];
        
        if ( !fields || !fields.length ) return results;
        if ( fields.substr ) fields = [fields];
        RAW = true === RAW;
        data = model.$data;
        getters = RAW ? null : [model.$getters];
        for (f=0,fl=fields.length; f<fl; f++)
        {
            dottedKey = fields[f];
            stack = [ [data, dottedKey, getters] ];
            while ( stack.length )
            {
                to_get = stack.pop( );
                o = to_get[0];
                dottedKey = to_get[1];
                g = to_get[2];
                p = dottedKey.split('.');
                i = 0; l = p.length;
                while (i < l)
                {
                    k = p[i++];
                    if ( i < l )
                    {
                        t = get_type( o );
                        if ( t & T_OBJ ) 
                        {
                            if ( WILDCARD === k ) 
                            {
                                k = p.slice(i).join('.');
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; kk++)
                                    stack.push( [o, keys[kk] + '.' + k, get_next(g, keys[kk])] );
                                break;
                            }
                            else if ( o[HAS](k) ) 
                            {
                                o = o[k];
                                g = get_next(g, k);
                            }
                        }
                        else if ( t & T_ARRAY ) 
                        {
                            if ( WILDCARD === k ) 
                            {
                                k = p.slice(i).join('.');
                                for (kk=0; kk<o.length; kk++)
                                    stack.push( [o, '' + kk + '.' + k, get_next(g, ''+kk)] );
                                break;
                            }
                            else if ( o[HAS](k) ) 
                            {
                                o = o[k];
                                g = get_next(g, k);
                            }
                        }
                        else break; // key does not exist
                    }
                    else
                    {
                        t = get_type( o );
                        if ( t & T_OBJ ) 
                        {
                            if ( WILDCARD === k )
                            {
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; kk++)
                                {
                                    if ( RAW )
                                    {
                                        results.push( o[keys[kk]] );
                                    }
                                    else
                                    {
                                        if ( (getter=get_value(g, keys[kk])) || (getter=get_value(g, k)) )
                                            results.push( getter.call(model, o[keys[kk]]) );
                                        else
                                            results.push( o[keys[kk]] );
                                    }
                                }
                            }
                            else if ( !RAW && (getter=get_value(g, k)) )
                            {
                                results.push( getter.call(model, o[k]) );
                            }
                            else if ( o[HAS](k) )
                            {
                                results.push( o[k] );
                            }
                        }
                        else if ( t & T_ARRAY ) 
                        {
                            if ( WILDCARD === k )
                            {
                                for (kk=0; kk<o.length; kk++)
                                {
                                    if ( RAW )
                                    {
                                        results.push( o[kk] );
                                    }
                                    else
                                    {
                                        if ( (getter=get_value(g, kk)) || (getter=get_value(g, k)) )
                                            results.push( getter.call(model, o[kk]) );
                                        else
                                            results.push( o[kk] );
                                    }
                                }
                            }
                            else if ( !RAW && (getter=get_value(g, k)) )
                            {
                                results.push( getter.call(model, o[k]) );
                            }
                            else if ( o[HAS](k) )
                            {
                                results.push( o[k] );
                            }
                        }
                    }
                }
            }
        }
        return results;
    }
    
/**[DOC_MARKDOWN]
// model set key to val
model.set( String dottedKey, * val [, Boolean publish=false] );

[/DOC_MARKDOWN]**/
    // set/add, it can add last node also if not there
    ,set: function ( dottedKey, val, pub, callData ) {
        var model = this, r, cr, o, k, p, i, l,
            type, validator, setter,
            collection_type = null, collection_validator = null,
            is_collection = false,
            types, validators, setters, ideps,
            prevval, canSet = false, validated,
            autovalidate = model.$autovalidate
        ;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        o = model.$data;
        types = model.$types; 
        validators = model.$validators; 
        setters = model.$setters;
        ideps = model.$idependencies;
        is_collection = T_ARRAY & get_type( val );
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            k = dottedKey;
            setter = (r=setters[k]) ? r.v : null;
            type = (r=types[k] || types[WILDCARD]) ? r.v : null;
            validator = autovalidate && (r=validators[k] || validators[WILDCARD]) ? r.v : null;
            if ( is_collection )
            {
                if ( !type ) 
                    collection_type = (cr=types[k] || types[WILDCARD]) && cr.n[WILDCARD] ? cr.n[WILDCARD].v : null;
                if ( autovalidate && !validator )
                    collection_validator = (cr=validators[k] || validators[WILDCARD]) && cr.n[WILDCARD] ? cr.n[WILDCARD].v : null;
            }
            canSet = true;
        }
        else if ( (r = walk_and_get3( dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model )) )
        {
            o = r[ 1 ]; k = r[ 2 ];
            
            if ( Model === r[ 0 ]  ) 
            {
                // nested sub-model
                if ( k.length ) 
                {
                    k = k.join('.');
                    prevval = o.get( k );
                    if ( prevval !== val ) o.set( k, val, pub, callData ); 
                    else  pub = false;
                }
                else 
                {
                    prevval = o.data( );
                    if ( prevval !== val ) o.data( val );
                    else  pub = false;
                }
                
                if ( pub )
                {
                    model.publish('change', {
                        key: dottedKey, 
                        value: val, 
                        action: 'set',
                        valuePrev: prevval,
                        $callData: callData
                    });
                    
                    // notify any dependencies as well
                    if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                }
                return model;
            }
            
            setter = get_value( r[6], k );
            if ( !setter  && (false === r[0] && r[3].length) )
            {
                // cannot add intermediate values
                return model;
            }
            
            type = get_value( r[4], k );
            validator = get_value( r[5], k );
            if ( is_collection )
            {
                if ( !type ) 
                    collection_type = get_value( get_next( r[4], k ), WILDCARD );
                if ( autovalidate && !validator )
                    collection_validator = get_value( get_next( r[5], k ), WILDCARD );
            }
            canSet = true;
        }
        
        if ( canSet )
        {
            if ( type ) 
            {
                val = type.call( model, val, dottedKey );
            }
            else if ( collection_type )
            {
                for (i=0,l=val.length; i<l; i++)
                    val[i] = collection_type.call( model, val[i], dottedKey );
            }
            
            validated = true;
            if ( validator )
            {
                validated = validator.call( model, val, dottedKey );
            }
            else if ( collection_validator )
            {
                for (i=0,l=val.length; i<l; i++)
                    if ( !collection_validator.call( model, val[i], dottedKey ) )
                    {
                        validated = false;
                        break;
                    }
            }
            if ( !validated )
            {
                if ( pub )
                {
                    if ( callData ) callData.error = true;
                    model.publish('error', {
                        key: dottedKey, 
                        value: o[k], 
                        action: 'set',
                        $callData: callData
                    });
                }
                return model;
            }
            
            // custom setter
            if ( setter ) 
            {
                if ( false !== setter.call( model, dottedKey, val, pub ) ) 
                {
                    if ( pub )
                    {
                        model.publish('change', {
                            key: dottedKey, 
                            value: val,
                            action: 'set',
                            $callData: callData
                        });
                        
                        // notify any dependencies as well
                        if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                    }
                    if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                }
                return model;
            }
            
            prevval = o[ k ];
            // update/set only if different
            if ( prevval !== val )
            {
                // modify or add final node here
                o[ k ] = val;
            
                if ( pub )
                {
                    model.publish('change', {
                        key: dottedKey, 
                        value: val, 
                        valuePrev: prevval,
                        action: 'set',
                        $callData: callData
                    });
                    
                    // notify any dependencies as well
                    if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                }
                
                if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// model add/append val to key (if key is array-like)
model.[add|append]( String dottedKey, * val [, Boolean publish=false] );

[/DOC_MARKDOWN]**/
    // add/append value (for arrays like structures)
    ,add: function ( dottedKey, val, pub, callData ) {
        var model = this, r, cr, o, k, p, i, l, index = -1,
            type, validator, setter,
            collection_type = null, collection_validator = null,
            is_collection = false,
            types, validators, setters, ideps,
            canSet = false, validated,
            autovalidate = model.$autovalidate
        ;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        o = model.$data;
        types = model.$types; 
        validators = model.$validators; 
        setters = model.$setters;
        ideps = model.$idependencies;
        is_collection = T_ARRAY & get_type( val );
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            k = dottedKey;
            setter = (r=setters[k]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            type = (r=types[k] || types[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            validator = autovalidate && (r=validators[k] || validators[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            if ( is_collection )
            {
                if ( !type ) 
                    collection_type = get_value(get_next(get_next([types[k] || types[WILDCARD]], WILDCARD), WILDCARD), WILDCARD);
                if ( autovalidate && !validator )
                    collection_validator = get_value(get_next(get_next([validators[k] || validators[WILDCARD]], WILDCARD), WILDCARD), WILDCARD);
            }
            canSet = true;
        }
        else if ( (r = walk_and_get3( dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model )) )
        {
            o = r[ 1 ]; k = r[ 2 ];
            
            if ( Model === r[ 0 ]  ) 
            {
                // nested sub-model
                if ( k.length ) 
                {
                    k = k.join('.');
                    o.add( k, val, pub, callData ); 
                }
                else 
                {
                    index = 0;
                    o.data( val );
                }
                
                if ( pub )
                {
                    model.publish('change', {
                        key: dottedKey, 
                        value: val,
                        action: 'append',
                        index: index,
                        $callData: callData
                    });
                    
                    // notify any dependencies as well
                    if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                }
                return model;
            }
            
            setter = get_value( get_next( r[6], k ), WILDCARD );
            if ( !setter && (false === r[0] && r[3].length) )
            {
                // cannot add intermediate values or not array
                return model;
            }
            
            type = get_value( get_next( r[4], k ), WILDCARD );
            validator = get_value( get_next( r[5], k ), WILDCARD );
            if ( is_collection )
            {
                if ( !type ) 
                    collection_type = get_value( get_next(get_next( r[4], k ), WILDCARD), WILDCARD );
                if ( autovalidate && !validator )
                    collection_validator = get_value( get_next(get_next( r[5], k ), WILDCARD), WILDCARD );
            }
            canSet = true;
        }
        
        if ( canSet )
        {
            if ( type ) 
            {
                val = type.call( model, val, dottedKey );
            }
            else if ( collection_type )
            {
                for (i=0,l=val.length; i<l; i++)
                    val[i] = collection_type.call( model, val[i], dottedKey );
            }
            
            validated = true;
            if ( validator )
            {
                validated = validator.call( model, val, dottedKey );
            }
            else if ( collection_validator )
            {
                for (i=0,l=val.length; i<l; i++)
                    if ( !collection_validator.call( model, val[i], dottedKey ) )
                    {
                        validated = false;
                        break;
                    }
            }
            if ( !validated )
            {
                if ( pub )
                {
                    if ( callData ) callData.error = true;
                    model.publish('error', {
                        key: dottedKey, 
                        value: /*val*/undef,
                        action: 'append',
                        index: -1,
                        $callData: callData
                    });
                }
                return model;
            }
            
            // custom setter
            if ( setter ) 
            {
                if ( false !== setter.call( model, dottedKey, val, pub ) ) 
                {
                    if ( pub )
                    {
                        if ( T_ARRAY === get_type( o[ k ] ) )
                        {
                            index = o[ k ].length;
                        }
                        model.publish('change', {
                            key: dottedKey, 
                            value: val,
                            action: 'append',
                            index: index,
                            $callData: callData
                        });
                        
                        // notify any dependencies as well
                        if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                    }
                    if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                }
                return model;
            }
            
            if ( T_ARRAY === get_type( o[ k ] ) )
            {
                // append node here
                index = o[ k ].length;
                o[ k ].push( val );
            }
            else
            {
                // not array-like, do a set operation, in case
                index = -1;
                o[ k ] = val;
            }
        
            if ( pub )
            {
                model.publish('change', {
                    key: dottedKey, 
                    value: val,
                    action: 'append',
                    index: index,
                    $callData: callData
                });
                
                // notify any dependencies as well
                if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
            }
            if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// model insert val to key (if key is array-like) at specified position/index
model.[ins|insert]( String dottedKey, * val, Number index [, Boolean publish=false] );

[/DOC_MARKDOWN]**/
    // insert value at index (for arrays like structures)
    ,ins: function ( dottedKey, val, index, pub, callData ) {
        var model = this, r, cr, o, k, p, i, l,
            type, validator, setter,
            collection_type = null, collection_validator = null,
            is_collection = false,
            types, validators, setters, ideps,
            canSet = false, validated,
            autovalidate = model.$autovalidate
        ;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        o = model.$data;
        types = model.$types; 
        validators = model.$validators; 
        setters = model.$setters;
        ideps = model.$idependencies;
        is_collection = T_ARRAY & get_type( val );
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            k = dottedKey;
            setter = (r=setters[k]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            type = (r=types[k] || types[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            validator = autovalidate && (r=validators[k] || validators[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            canSet = true;
            if ( is_collection )
            {
                if ( !type ) 
                    collection_type = get_value(get_next(get_next([types[k] || types[WILDCARD]], WILDCARD), WILDCARD), WILDCARD);
                if ( autovalidate && !validator )
                    collection_validator = get_value(get_next(get_next([validators[k] || validators[WILDCARD]], WILDCARD), WILDCARD), WILDCARD);
            }
        }
        else if ( (r = walk_and_get3( dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model )) )
        {
            o = r[ 1 ]; k = r[ 2 ];
            
            if ( Model === r[ 0 ]  ) 
            {
                // nested sub-model
                if ( k.length ) 
                {
                    k = k.join('.');
                    o.ins( k, val, index, pub, callData ); 
                }
                else 
                {
                    //index = 0;
                    o.data( val );
                }
                
                if ( pub )
                {
                    model.publish('change', {
                        key: dottedKey, 
                        value: val,
                        action: 'insert',
                        index: index,
                        $callData: callData
                    });
                    
                    // notify any dependencies as well
                    if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                }
                return model;
            }
            
            setter = get_value( get_next( r[6], k ), WILDCARD );
            if ( !setter && (false === r[0] && r[3].length) )
            {
                // cannot add intermediate values or not array
                return model;
            }
            
            type = get_value( get_next( r[4], k ), WILDCARD );
            validator = get_value( get_next( r[5], k ), WILDCARD );
            if ( is_collection )
            {
                if ( !type ) 
                    collection_type = get_value( get_next(get_next( r[4], k ), WILDCARD), WILDCARD );
                if ( autovalidate && !validator )
                    collection_validator = get_value( get_next(get_next( r[5], k ), WILDCARD), WILDCARD );
            }
            canSet = true;
        }
        
        if ( canSet )
        {
            if ( type ) 
            {
                val = type.call( model, val, dottedKey );
            }
            else if ( collection_type )
            {
                for (i=0,l=val.length; i<l; i++)
                    val[i] = collection_type.call( model, val[i], dottedKey );
            }
            
            validated = true;
            if ( validator )
            {
                validated = validator.call( model, val, dottedKey );
            }
            else if ( collection_validator )
            {
                for (i=0,l=val.length; i<l; i++)
                    if ( !collection_validator.call( model, val[i], dottedKey ) )
                    {
                        validated = false;
                        break;
                    }
            }
            if ( !validated )
            {
                if ( pub )
                {
                    if ( callData ) callData.error = true;
                    model.publish('error', {
                        key: dottedKey, 
                        value: /*val*/undef,
                        action: 'insert',
                        index: -1,
                        $callData: callData
                    });
                }
                return model;
            }
            
            // custom setter
            if ( setter ) 
            {
                if ( false !== setter.call( model, dottedKey, val, pub ) ) 
                {
                    if ( pub )
                    {
                        model.publish('change', {
                            key: dottedKey, 
                            value: val,
                            action: 'insert',
                            index: index,
                            $callData: callData
                        });
                        
                        // notify any dependencies as well
                        if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                    }
                    if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                }
                return model;
            }
            
            if ( T_ARRAY === get_type( o[ k ] ) )
            {
                // insert node here
                o[ k ].splice( index, 0, val );
            }
            else
            {
                // not array-like, do a set operation, in case
                index = -1;
                o[ k ] = val;
            }
        
            if ( pub )
            {
                model.publish('change', {
                    key: dottedKey, 
                    value: val,
                    action: 'insert',
                    index: index,
                    $callData: callData
                });
                
                // notify any dependencies as well
                if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
            }
            if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// model delete/remove key (with or without re-arranging array indexes)
model.[del|delete|remove]( String dottedKey [, Boolean publish=false, Boolean reArrangeIndexes=true] );

[/DOC_MARKDOWN]**/
    // delete/remove, with or without re-arranging (array) indexes
    ,del: function( dottedKey, pub, reArrangeIndexes, callData ) {
        var model = this, r, o, k, p, val, index = -1, canDel = false;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        reArrangeIndexes = false !== reArrangeIndexes;
        o = model.$data;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            k = dottedKey;
            canDel = true;
        }
        else if ( (r = walk_and_get3( dottedKey.split('.'), o, null, null, null, Model, false )) )
        {
            o = r[ 1 ]; k = r[ 2 ];
            
            if ( Model === r[ 0 ] && k.length ) 
            {
                // nested sub-model
                k = k.join('.');
                val = o.get( k );
                o.del( k, reArrangeIndexes, pub, callData ); 
                pub && model.publish('change', {
                        key: dottedKey, 
                        value: val,
                        action: 'delete',
                        index: index,
                        rearrange: reArrangeIndexes,
                        $callData: callData
                    });
                
                if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                return model;
            }
            else if ( r[ 3 ].length )
            {
                // cannot remove intermediate values
                return model;
            }
            canDel = true;
        }
        
        if ( canDel )
        {
            val = o[ k ]; o[ k ] = undef; 
            if ( reArrangeIndexes )
            {
                T = get_type( o );
                 // re-arrange indexes
                if ( T_ARRAY == T && is_array_index( k ) ) {index = +k; o.splice( index, 1 );}
                else if ( T_OBJ == T ) delete o[ k ];
            }
            else
            {
                delete o[ k ]; // not re-arrange indexes
            }
            pub && model.publish('change', {
                    key: dottedKey, 
                    value: val,
                    action: 'delete',
                    index: index,
                    rearrange: reArrangeIndexes,
                    $callData: callData
                });
            
            if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// model delete all matching keys (with or without re-arranging array indexes) including wildcards
model.[delAll|deleteAll]( Array dottedKeys [, Boolean reArrangeIndexes=true] );

[/DOC_MARKDOWN]**/
    ,delAll: function( fields, reArrangeIndexes ) {
        var model = this, keys, kk, k,
            f, fl, p, l, i, o, t, 
            data, stack, to_remove, dottedKey;
        
        if ( !fields || !fields.length ) return model;
        if ( fields.substr ) fields = [fields];
        reArrangeIndexes = false !== reArrangeIndexes;
        data = model.$data;
        for (f=0,fl=fields.length; f<fl; f++)
        {
            dottedKey = fields[f];
            stack = [ [data, dottedKey] ];
            while ( stack.length )
            {
                to_remove = stack.pop( );
                o = to_remove[0];
                dottedKey = to_remove[1];
                p = dottedKey.split('.');
                i = 0; l = p.length;
                while (i < l)
                {
                    k = p[i++];
                    if ( i < l )
                    {
                        t = get_type( o );
                        if ( t & T_OBJ ) 
                        {
                            if ( WILDCARD === k ) 
                            {
                                k = p.slice(i).join('.');
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; kk++)
                                    stack.push( [o, keys[kk] + '.' + k] );
                                break;
                            }
                            else if ( o[HAS](k) ) 
                            {
                                o = o[k];
                            }
                        }
                        else if ( t & T_ARRAY ) 
                        {
                            if ( WILDCARD === k ) 
                            {
                                k = p.slice(i).join('.');
                                for (kk=0; kk<o.length; kk++)
                                    stack.push( [o, '' + kk + '.' + k] );
                                break;
                            }
                            else if ( o[HAS](k) ) 
                            {
                                o = o[k];
                            }
                        }
                        else break; // key does not exist
                    }
                    else
                    {
                        t = get_type( o );
                        if ( t & T_OBJ ) 
                        {
                            if ( WILDCARD === k )
                            {
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; kk++)
                                    delete o[keys[kk]];
                            }
                            else if ( o[HAS](k) )
                            {
                                delete o[k];
                            }
                        }
                        else if ( t & T_ARRAY ) 
                        {
                            if ( WILDCARD === k )
                            {
                                for (kk=o.length-1; kk>=0; kk--)
                                {
                                    if ( reArrangeIndexes )
                                    {
                                         // re-arrange indexes
                                        o.splice( kk, 1 );
                                    }
                                    else
                                    {
                                        delete o[ kk ]; // not re-arrange indexes
                                    }
                                }
                            }
                            else if ( o[HAS](k) )
                            {
                                if ( reArrangeIndexes && is_array_index( k ) )
                                {
                                     // re-arrange indexes
                                    o.splice( +k, 1 );
                                }
                                else
                                {
                                    delete o[ k ]; // not re-arrange indexes
                                }
                            }
                        }
                    }
                }
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// shortcut to synchronise specific fields of this model to other fields of another model
model.sync( Model otherModel, Object fieldsMap );

[/DOC_MARKDOWN]**/
    // synchronize fields to other model(s)
    ,sync: function( otherModel, fieldsMap ) {
        var model = this, key, otherKey, callback, list, i, l, addIt;
        for (key in fieldsMap)
        {
            if ( fieldsMap[HAS](key) )
            {
                otherKey = fieldsMap[key]; model.$syncTo[key] = model.$syncTo[key] || [];
                callback = null;
                if ( T_ARRAY === get_type(otherKey) )
                {
                    callback = otherKey[1] || null;
                    otherKey = otherKey[0];
                }
                list = model.$syncTo[key]; addIt = 1;
                for (i=list.length-1; i>=0; i--)
                {
                    if ( otherModel === list[i][0] && otherKey === list[i][1] )
                    {
                        list[i][2] = callback;
                        addIt = 0; 
                        break;
                    }
                }
                // add it if not already added
                if ( addIt ) list.push([otherModel, otherKey, callback]);
            }
        }
        if ( !model.$syncHandler ) // lazy, only if needed
        {
            // fixed, too much recursion, when keys notified other keys, which then were re-synced
            model.__syncing = model.__syncing || { };
            model.on('change', model.$syncHandler = syncHandler/*.bind( model )*/);
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// shortcut to un-synchronise any fields of this model to other fields of another model
model.unsync( Model otherModel );

[/DOC_MARKDOWN]**/
    // un-synchronize fields off other model(s)
    ,unsync: function( otherModel ) {
        var model = this, key, syncTo = model.$syncTo, list, i;
        for (key in syncTo)
        {
            if ( syncTo[HAS](key) )
            {
                if ( !(list=syncTo[ key ]) || !list.length ) continue;
                for (i=list.length-1; i>=0; i--)
                {
                    if ( otherModel === list[i][0] ) 
                    {
                        if ( model.__syncing && model.__syncing[otherModel.$id] ) del(model.__syncing, otherModel.$id);
                        list.splice(i, 1);
                    }
                }
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// shortcut to model publich change event for key(s) (and nested keys)
model.notify( String | Array dottedKeys [, String event="change", Object calldata=null] );

[/DOC_MARKDOWN]**/
    // shortcut to trigger "model:change" per given key(s) (given as string or array)
    ,notify: function( dottedKey, evt, data ) {
        var model = this, ideps = model.$idependencies, 
            k, l, d, dk, t, deps = [], deps2, keys = {};
        if ( dottedKey )
        {
            t = get_type( dottedKey );
            evt = evt || 'change';  
            d = {key: '', action: 'set'};
            if ( data )
            {
                if ( data[HAS]('value') ) d.value = data.value;
                if ( data[HAS]('action') ) d.action = data.action;
                if ( data[HAS]('index') ) d.index = data.index;
                if ( data[HAS]('rearrange') ) d.rearrange = data.rearrange;
                if ( data[HAS]('$callData') ) d.$callData = data.$callData;
            }
            
            if ( T_STR === t )
            {
                d.key = dottedKey;
                // notify any dependencies as well
                keys['_'+dottedKey] = 1;
                if ( ideps[HAS](dottedKey) ) deps = deps.concat( ideps[dottedKey] );
                model.publish( evt, d );
            }
            else if ( T_ARRAY === t )
            {
                // notify multiple keys
                l = dottedKey.length;
                for (k=0; k<l; k++)
                {
                    d.key = dk = dottedKey[ k ];
                    if ( keys[HAS]('_'+dk) ) continue;
                    // notify any dependencies as well
                    keys['_'+dk] = 1;
                    if ( ideps[HAS](dk) ) deps = deps.concat( ideps[dk] );
                    model.publish( evt, d );
                }
            }
            
            while ( l = deps.length )
            {
                // notify any dependencies as well
                deps2 = [];
                d = {key: '', action: 'set'};
                for (k=0; k<l; k++)
                {
                    dk = deps[ k ];
                    // avoid already notified keys previously
                    if ( keys[HAS]('_'+dk) ) continue;
                    keys['_'+dk] = 1;
                    if ( ideps[HAS](dk) ) deps2 = deps2.concat( ideps[dk] );
                    d.key = dk; 
                    model.publish( "change", d );
                }
                deps = deps2;
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// model enable / disable atomic operations, do next update operations on key (and nested keys) as one atom
model.atom( String dottedKey | Boolean false );

[/DOC_MARKDOWN]**/
    // atomic (update) operation(s) by key
    ,atom: function( dottedKey ) {
        var model = this;
        if ( undef !== dottedKey )
        {
            if ( false === dottedKey )
            {
                model.atomic = false;
                model.$atom = null;
            }
            else
            {
                model.atomic = false;
                model.$atom = dottedKey;
            }
        }
        return model;
    }
    
    ,toString: function( ) {
        return '[ModelView.Model id: '+this.id+']';
    }
});
// aliases
Model[proto].append = Model[proto].add;
Model[proto].insert = Model[proto].ins;
Model[proto].remove = Model[proto]['delete'] = Model[proto].del;
Model[proto].deleteAll = Model[proto].delAll;
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/

// Tpl utils
var POS = 'lastIndexOf', MATCH = 'match'
    ,VALUE = 'nodeValue', NODETYPE = 'nodeType', PARENTNODE = 'parentNode'
    ,G = 'global', I = 'ignoreCase'
    ,ATT_RE = /[a-zA-Z0-9_\-]/
    ,to_int = function(v){return parseInt(v,10);}
    
    ,multisplit_string = function multisplit_string( str, re_keys, revivable ) {
        var tpl = [ ], i = 0, m, sel_pos, sel, ch, ind,
            atName = false, atIndex, atKeyStart = -1, atKeyEnd = -1, atPos = 0,
            openTag, closeTag, tagEnd, insideTag = false, tpl_keys = {}, key;
        // find and split the tpl_keys
        while ( m = re_keys.exec( str ) )
        {
            sel_pos = re_keys.lastIndex - m[0].length;
            sel = str.slice(i, sel_pos);
            tagEnd = -1;
            if ( revivable )
            {
                openTag = sel[POS]('<'); closeTag = sel[POS]('>');
                // match and annotate open close xml tags as well
                if ( openTag > closeTag /*&& '/' !== sel.charAt(openTag+1)*/ ) 
                {
                    tagEnd = -1; insideTag = true;
                }
                else if ( closeTag > openTag ) 
                {
                    tagEnd = closeTag+1; insideTag = false;
                }
            }
            tpl.push([1, insideTag, sel, tagEnd]);
            
            // match and annotate attributes
            if ( insideTag )
            {
                if ( -1 < (ind=sel[POS]('=')) )
                {
                    atName = ''; atIndex = ind;
                    while ( -1 < ind && ATT_RE.test(ch=sel.charAt(--ind)) ) atName = ch + atName;
                    atKeyStart = sel_pos - i - atIndex-2;
                    atPos = atKeyStart + m[0].length;
                }
                else if ( atName )
                {
                    atKeyStart = atPos + sel_pos - i - 2 -1;
                    atPos += atKeyStart + m[0].length;
                }
            }
            else
            {
                atName = false; atPos = 0; atKeyStart = -1;
            }
            key = m[1] ? m[1] : m[0];
            if ( !tpl_keys[HAS](key) ) tpl_keys[key] = [tpl.length];
            else tpl_keys[key].push(tpl.length);
            tpl.push([0, insideTag, key, undef, atName, atKeyStart]);
            i = re_keys.lastIndex;
        }
        sel = str.slice(i);
        tagEnd = -1;
        if ( revivable )
        {
            openTag = sel[POS]('<'); closeTag = sel[POS]('>');
            // match and annotate open close xml tags as well
            if ( openTag > closeTag /*&& '/' !== sel.charAt(openTag+1)*/ ) 
            {
                tagEnd = -1; insideTag = true;
            }
            else if ( closeTag > openTag ) 
            {
                tagEnd = closeTag+1; insideTag = false;
            }
        }
        tpl.push([1, insideTag, sel, tagEnd]);
        return [tpl_keys, tpl];
    }
    ,multisplit_node = function multisplit_node( node, re_keys, revivable ) {
        var tpl_keys, matchedNodes, matchedAtts, i, l, m, matched, matches, ml, n, a, key, 
            keyNode, atnodes, aNodes, aNodesCached, txt, txtkey, txtcnt = 0, atName, att, pos, rest, stack
        ;
         matchedNodes = [ ]; matchedAtts = [ ]; n = node;
        // find the nodes having tpl_keys
        if ( n.attributes && (l=n.attributes.length) ) 
        {
            // revive: match key:val attribute annotations in wrapping comments
            if ( revivable && n.firstChild && 8 === n.firstChild[NODETYPE] && 'att:' === n.firstChild[VALUE].slice(0,4) )
            {
                matches = n.firstChild[VALUE].split("\n"); l = matches.length; 
                atnodes = {};
                for (i=0; i<l; i++)
                {
                    m = matches[i].split('|'); atName = m[0].slice(4); a = n.attributes[atName];
                    if ( !atnodes[HAS](atName) )
                    {
                        atnodes[atName] = [1, []];
                        matchedAtts.push([a, atnodes[atName], n]);
                    }
                    atnodes[atName][1].push([m[1].slice(4),m[2].split(',').map(to_int)]);
                }
            }
            else
            {
                for (i=0; i<l; i++)
                {
                    a = n.attributes[ i ];
                    if ( m=a[VALUE][MATCH](re_keys) ) matchedAtts.push([0, a, m, n]);
                }
            }
        }
        if ( 3 === n[NODETYPE] ) // textNode 
        {
            // revive: match key:val annotations in wrapping comments
            if ( revivable && n.previousSibling && n.nextSibling && 
                8 === n.previousSibling[NODETYPE] && 8 === n.nextSibling[NODETYPE] &&
                'key:' === (key=n.previousSibling[VALUE]).slice(0,4) &&
                '/key' === n.nextSibling[VALUE]
            ) 
            {
                m = [n[VALUE], key.slice(4)];
                matchedNodes.push([n, m, n[PARENTNODE]]);
            }
            else if ( m=n[VALUE][MATCH](re_keys) ) 
            {
                matchedNodes.push([n, m, n[PARENTNODE]]);
            }
        }  
        else if ( n.firstChild )
        {
            stack = [ n=n.firstChild ];
            while ( stack.length ) 
            {
                if ( n.attributes && (l=n.attributes.length) ) 
                {
                    // revive: match key:val attribute annotations in wrapping comments
                    if ( revivable && n.firstChild && 8 === n.firstChild[NODETYPE] && 'att:' === n.firstChild[VALUE].slice(0,4) )
                    {
                        matches = n.firstChild[VALUE].split("\n"); l = matches.length; 
                        atnodes = {};
                        for (i=0; i<l; i++)
                        {
                            m = matches[i].split('|'); atName = m[0].slice(4); a = n.attributes[atName];
                            if ( !atnodes[HAS](atName) )
                            {
                                atnodes[atName] = [1, []];
                                matchedAtts.push([a, atnodes[atName], n]);
                            }
                            atnodes[atName][1].push([m[1].slice(4),m[2].split(',').map(to_int)]);
                        }
                    }
                    else
                    {
                        for (i=0; i<l; i++)
                        {
                            a = n.attributes[ i ];
                            if ( m=a[VALUE][MATCH](re_keys) ) matchedAtts.push([a, m, n]);
                        }
                    }
                }
                if ( n.firstChild ) stack.push( n=n.firstChild );
                else 
                {
                    if ( 3 === n[NODETYPE] )
                    {
                        // revive: match key:val annotations in wrapping comments
                        if ( revivable && n.previousSibling && n.nextSibling && 
                            8 === n.previousSibling[NODETYPE] && 8 === n.nextSibling[NODETYPE] &&
                            'key:' === (key=n.previousSibling[VALUE]).slice(0,4) &&
                            '/key' === n.nextSibling[VALUE]
                        ) 
                        {
                            m = [n[VALUE], key.slice(4)];
                            matchedNodes.push([n, m, n[PARENTNODE]]);
                        }
                        else if ( (m=n[VALUE][MATCH](re_keys)) ) 
                        {
                            matchedNodes.push([n, m, n[PARENTNODE]]);
                        }
                    }
                    n = stack.pop( );
                    while ( stack.length && !n.nextSibling ) n = stack.pop( );
                    if ( n.nextSibling ) stack.push( n=n.nextSibling );
                }
            }
        }
        // split the tpl_keys nodes
        tpl_keys = { };
        for (i=0,l=matchedNodes.length; i<l; i++)
        {
            matched = matchedNodes[ i ];
            rest = matched[0]; m = matched[1]; n = matched[2];
            txt = rest[VALUE];  
            if ( txt.length > m[0].length )
            {
                // node contains more text than just the $(key) ref
                do {
                    key = m[1] ? m[1] : m[0]; keyNode = rest.splitText( m.index );
                    rest = keyNode.splitText( m[0].length );
                    if ( !tpl_keys[HAS](key) ) tpl_keys[key] = [[[keyNode, n]]/*KEYS*/, []/*ATTS*/];
                    else tpl_keys[key][0/*KEYS*/].push( [keyNode, n] );
                    m = rest[VALUE][MATCH]( re_keys );
                } while ( m );
            }
            else
            {
                key = m[1] ? m[1] : m[0]; keyNode = rest;
                if ( !tpl_keys[HAS](key) ) tpl_keys[key] = [[[keyNode, n]]/*KEYS*/, []/*ATTS*/];
                else tpl_keys[key][0/*KEYS*/].push( [keyNode, n] );
            }
        }
        //aNodes = { };
        for (i=0,l=matchedAtts.length; i<l; i++)
        {
            matched = matchedAtts[ i ];
            a = matched[0]; m = matched[1]; n = matched[2];
            txt = a[VALUE];  //txtkey = txt; aNodesCached = (txtkey in aNodes);
            //if ( aNodesCached ) {txtkey += '_' + (++txtcnt); aNodesCached = false;}
            /*if ( !aNodesCached ) 
            {*/
                rest = document.createTextNode(txt||''); aNodes/*[ txtkey ]*/ = [[], [ rest ]];
                if ( 1 === m[0] ) // revived attribute
                {
                    matches = m[1]; ml = matches.length; pos = 0;
                    for (i=0; i<ml; i++)
                    {
                        att = matches[i];
                        key = att[0];
                        keyNode = rest.splitText( att[1][0]-pos );
                        rest = keyNode.splitText( att[1][1] );
                        aNodes/*[ txtkey ]*/[0].push( key );
                        aNodes/*[ txtkey ]*/[1].push( keyNode, rest ); 
                        if ( !tpl_keys[HAS](key) ) {tpl_keys[key] = [[[keyNode, n]]/*KEYS*/, [[a, aNodes/*[ txtkey ]*/[1], txt, n]]/*ATTS*/];}
                        else {tpl_keys[key][0/*KEYS*/].push( [keyNode, n] ); tpl_keys[key][1/*ATTS*/].push( [a, aNodes/*[ txtkey ]*/[1], txt, n] );}
                        pos += att[1][1] + att[1][0];
                    }
                }
                else if ( txt.length > m[0].length )
                {
                    // attr contains more text than just the $(key) ref
                    do {
                        key = m[1] ? m[1] : m[0];
                        keyNode = rest.splitText( m.index );
                        rest = keyNode.splitText( m[0].length );
                        aNodes/*[ txtkey ]*/[0].push( key );
                        aNodes/*[ txtkey ]*/[1].push( keyNode, rest ); 
                        if ( !tpl_keys[HAS](key) ) {tpl_keys[key] = [[[keyNode, n]]/*KEYS*/, [[a, aNodes/*[ txtkey ]*/[1], txt, n]]/*ATTS*/];}
                        else {tpl_keys[key][0/*KEYS*/].push( [keyNode, n] ); tpl_keys[key][1/*ATTS*/].push( [a, aNodes/*[ txtkey ]*/[1], txt, n] );}
                        m = rest[VALUE][MATCH]( re_keys );
                    } while ( m );
                }
                else
                {
                    keyNode = rest; key = m[1] ? m[1] : m[0];
                    aNodes/*[ txtkey ]*/[0].push( key );
                    if ( !tpl_keys[HAS](key) ) {tpl_keys[key] = [[[keyNode, n]]/*KEYS*/, [[a, aNodes/*[ txtkey ]*/[1], txt, n]]/*ATTS*/];}
                    else {tpl_keys[key][0/*KEYS*/].push( [keyNode, n] ); tpl_keys[key][1/*ATTS*/].push( [a, aNodes/*[ txtkey ]*/[1], txt, n] );}
                }
            /*}
            else
            {
                // share txt nodes between same (value) attributes
                for (m=0; m<aNodes[ txtkey ][0].length; m++)
                {
                    key = aNodes[ txtkey ][0][m];
                    tpl_keys[key][1/*ATTS* /].push( [a, aNodes[ txtkey ][1], txt, n] );
                }
            }*/
        }
        return [tpl_keys, node];
    }
    
    ,renderer_string = function( data ) {
        var tpl = this.$tpl[1/*TPL*/], revivable = this.$revivable, 
            l = tpl.length, t, atts = [],
            i, notIsSub, s, insideTag, out = ''
        ;
        for (i=0; i<l; i++)
        {
            t = tpl[ i ]; 
            notIsSub = t[ 0 ]; 
            insideTag = t[ 1 ];
            s = t[ 2 ];
            if ( notIsSub )
            {
                // add comment annotations for template to be revived on client-side
                if ( revivable && !insideTag && t[ 3 ] > -1 && atts.length )
                {
                    s = s.slice(0,t[ 3 ]) + '<!--' + atts.join("\n") + '-->' + s.slice(t[ 3 ]);
                    atts = [];
                }
                out += s;
            }
            else
            {
                // enable to render/update tempate with partial data updates only
                // check if not key set and re-use the previous value (if any)
                if ( data[HAS](s) ) t[ 3 ] = String(data[ s ]);
                // add comment annotations for template to be revived on client-side
                if ( revivable ) 
                {
                    if ( insideTag )
                    {
                        out += t[ 3 ];
                        if ( t[ 4 ] ) atts.push('att:'+t[ 4 ]+'|key:'+s+'|'+[t[ 5 ],t[ 3 ].length].join(','));
                    }
                    else
                    {
                        out += '<!--key:'+s+'-->' + t[ 3 ] + '<!--/key-->';
                    }
                }
                else out += t[ 3 ];
            }
        }
        return out;
    }
    ,renderer_node = function( data ) {
        var att, i, l, keys, key, k, kl, val, keyNodes, keyAtts, nodes, ni, nl, txt, 
            tpl_keys = this.$tpl[0/*KEYS*/];
        keys = Keys(data); kl = keys.length
        for (k=0; k<kl; k++)
        {
            key = keys[k]; val = String(data[key]);
            if ( !tpl_keys[HAS](key) ) continue;
            
            // element live text nodes
            keyNodes = tpl_keys[key][0/*KEYS*/]; 
            for (i=0,l=keyNodes.length; i<l; i++) 
            {
                keyNodes[i][0][VALUE] = val;
            }
            
            // element live attributes
            keyAtts = tpl_keys[key][1/*ATTS*/];
            for (i=0,l=keyAtts.length; i<l; i++) 
            {
                att = keyAtts[i]; 
                // inline join_text_nodes
                nodes = att[1]; nl = nodes.length; 
                txt = nl ? nodes[0][VALUE] : '';
                if ( nl > 1 ) for (ni=1; ni<nl; ni++) txt += nodes[ni][VALUE];
                att[0][VALUE] = txt;
            }
        }
        return this;
    }
;

/**[DOC_MARKDOWN]
####Tpl

ModelView.Tpl is an adaptation of Tao.js, an isomorphic class to handle inline templates both from/to string format and live dom update format. Used internaly by ModelView.View and also available as public class ModelView.Tpl.

```javascript
// modelview.js tpl methods
// adapted from https://github.com/foo123/Tao.js

var tpl = new ModelView.Tpl( String|DOMNode tpl );

[/DOC_MARKDOWN]**/
//
// String and LiveDom Isomorphic (Inline) Template Class
// adapted from https://github.com/foo123/Tao.js
var Tpl = function Tpl( template, re_keys, revivable ) {
    var tpl = this;
    // constructor-factory pattern
    if ( !(tpl instanceof Tpl) ) return new Tpl( template, re_keys, revivable );
    tpl.initPubSub( );
    tpl.$revivable = true === revivable;
    if ( template.substr && template.substring )
    {
        tpl.$key = re_keys[G] ? re_keys : new RegExp(re_keys.source, re_keys[I]?"gi":"g"); /* make sure global flag is added */
        tpl.$tpl = Tpl.multisplit_string( template, tpl.$key, tpl.$revivable );
        tpl.render = renderer_string;
    }
    else //if (tpl is dom_node)
    {
        tpl.$key = re_keys[G] ? new RegExp(re_keys.source, re_keys[I]?"i":"") : re_keys; /* make sure global flag is removed */
        tpl.$tpl = multisplit_node( template, tpl.$key, tpl.$revivable );
        tpl.render = renderer_node;
    }
};
Tpl.multisplit_string = multisplit_string;
Tpl.multisplit_node = multisplit_node;
// Tpl implements PublishSubscribe pattern
Tpl[proto] = Merge( Create( Obj[proto] ), PublishSubscribe, {
    
    constructor: Tpl
    
    ,id: null
    ,$tpl: null
    ,$key: null
    ,$revivable: false
    
/**[DOC_MARKDOWN]
// dispose tpl
tpl.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function( ) {
        var tpl = this;
        tpl.disposePubSub( );
        tpl.$key = null;
        tpl.$tpl = null;
        tpl.$revivable = null;
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// get the template dynamic keys
tpl.keys( );

[/DOC_MARKDOWN]**/
    ,keys: function( ) {
        return Keys(this.$tpl[0]);
    }
    
/**[DOC_MARKDOWN]
// render/update and return the template string with given data
tpl.render( Object|Array data );

[/DOC_MARKDOWN]**/
    ,render: function( data ) {
        // override
    }
    
/**[DOC_MARKDOWN]
// tpl bind a new Dom node added to the template (if tpl represents a dom template)
tpl.bind( Node el );

[/DOC_MARKDOWN]**/
    ,bind: function( el ) {  
        var tpl = this;
        if ( el ) 
        {
            var key, $keys = tpl.$tpl[0], 
                tpl_keys = multisplit_node( el, tpl.$key, false/*tpl.$revivable*/ )[0];
            for (key in tpl_keys)
            {
                if ( tpl_keys[HAS](key) )
                {
                    if ( $keys[HAS](key) ) 
                    {
                        $keys[key][0] = $keys[key][0].concat(tpl_keys[key][0]);
                        $keys[key][1] = $keys[key][1].concat(tpl_keys[key][1]);
                    }
                    else
                    {                        
                        $keys[key] = tpl_keys[key];
                    }
                }
            }
        }
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// tpl free the Dom node removed from the template (if tpl represents a dom template)
tpl.free( Node el );

[/DOC_MARKDOWN]**/
    ,free: function( el ) {  
        var tpl = this;
        if ( el ) 
        {
            var key, i, l, k, 
                $keys = tpl.$tpl[0],
                tpl_keys = Keys($keys),
                kl = tpl_keys.length,
                nodes, keyNodes, atNodes
            ;
            for (k=0; k<kl; k++)
            {
                key = tpl_keys[k]; nodes = $keys[key];
                
                // remove key text nodes
                keyNodes = nodes[0];
                l = keyNodes.length;
                for (i=l-1; i>=0; i--)
                {
                    if ( /*el === keyNodes[i][1]*/el.contains(keyNodes[i][1]) )
                        keyNodes.splice(i, 1);
                }
                
                // remove attribute nodes
                atNodes = nodes[1];
                l = atNodes.length;
                for (i=l-1; i>=0; i--)
                {
                    if ( /*el === atNodes[i][3]*/el.contains(atNodes[i][3]) )
                        atNodes.splice(i, 1);
                }
            }
        }
        return tpl;
    }
    
    /*
    ,clone: function( ) {
        // todo
    }
    */
    
    ,toString: function( ) {
        return '[ModelView.Tpl id: '+this.id+']';
    }
});
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/

// View utils
var namedKeyProp = "mv_namedkey",

    contains_non_strict = function( collection, value ) {
        if ( collection )
        {
            for (var i=0,l=collection.length; i<l; i++)
                if ( value == Str(collection[i]) ) return true;
        }
        return false;
    },
    
    getInlineTplRE = function( InlineTplFormat, modelID ) {
        return new Regex(
            esc_re( InlineTplFormat )
            .replace('__MODEL__', esc_re( modelID || ''))
            .replace('__KEY__', '(\\S+?)')
        ,'');
    },
    
    getSelectors = function( bind, livebind, autobind ) {
        return [
            bind ? '[' + bind + ']' : null,
            
            livebind 
            ? (livebind[1] ? '[' + livebind[0] + '*="|'+livebind[1]+'"]' : '[' + livebind[0] + ']')
            : null,
            
            autobind 
            ? (autobind[1] 
                /* exact */ ? 'input[name="' + autobind[0] + '"],textarea[name="' + autobind[0] + '"],select[name="' + autobind[0] + '"]'
                /* prefix */ : 'input[name^="' + autobind[0] + '"],textarea[name^="' + autobind[0] + '"],select[name^="' + autobind[0] + '"]'
            ) 
            : null
        ];
    },
    
    getBindData = function( event, bind ) {
        if ( bind && bind[ event ] )
        {
            if ( is_type(bind[ event ], T_STR) ) bind[ event ] = { action: bind[ event ] };
            return bind[ event ];
        }
    },
    
    numeric_re = /^\d+$/,
    empty_brackets_re = /\[\s*\]$/,
    
    fields2model = function( view, elements ) {
        var model = view.$model,
            model_prefix = model.id + '.',
            checkboxes_done = { }
        ;
        
        iterate(function( i ) {
            var el, name, key, k, j, o, alternative,
            val, input_type, is_dynamic_array, checkboxes;
            el = elements[i]; name = el[ATTR]("name");
            if ( !name ) return;
            
            input_type = (el[TYPE]||'').toLowerCase( );
            
            key = dotted( name );
            if ( startsWith(key, model_prefix) ) key = key.slice( model_prefix.length );
            
            k = key.split('.'); o = model.$data;
            while ( k.length )
            {
                j = k.shift( );
                if ( k.length ) 
                {
                    if ( !o[HAS]( j ) ) o[ j ] = numeric_re.test( k[0] ) ? [ ] : { };
                    o = o[ j ];
                }
                else 
                {
                    if ( 'radio' === input_type )
                    {
                        if ( !checkboxes_done[name] )
                        {
                            val = '';
                            checkboxes = view.get('input[type="radio"][name="'+name+'"]', 0, 1);
                            if ( checkboxes.length > 1 )
                            {
                                each(checkboxes, function(c){
                                   if ( el[CHECKED] ) val = el[VAL];
                                });
                            }
                            else if ( el[CHECKED] )
                            {
                                val = el[VAL];
                            }
                            checkboxes_done[name] = 1;
                            model.set( key, val );
                        }
                    }
                    else if ( 'checkbox' === input_type )
                    {
                        if ( !checkboxes_done[name] )
                        {
                            is_dynamic_array = empty_brackets_re.test( name );
                            checkboxes = view.get('input[type="checkbox"][name="'+name+'"]', 0, 1);
                            
                            if ( is_dynamic_array )
                            {
                                // multiple checkboxes [name="model[key][]"] dynamic array
                                // only checked items are in the list
                                val = [ ];
                                each(checkboxes, function( c ) {
                                    if ( c[CHECKED] ) val.push( c[VAL] );
                                });
                            }
                            else if ( checkboxes.length > 1 )
                            {
                                // multiple checkboxes [name="model[key]"] static array
                                // all items are in the list either with values or defaults
                                val = [ ];
                                each(checkboxes, function( c ) {
                                    if ( c[CHECKED] ) val.push( c[VAL] );
                                    else val.push( !!(alternative=c[ATTR]('data-else')) ? alternative : '' );
                                });
                            }
                            else if ( el[CHECKED] )
                            {
                                // single checkbox, checked
                                val = el[VAL];
                            }
                            else
                            {
                                // single checkbox, un-checked
                                // use alternative value in [data-else] attribute, if needed, else empty
                                val = !!(alternative=el[ATTR]('data-else')) ? alternative : '';
                            }
                            checkboxes_done[name] = 1;
                            model.set( key, val );
                        }
                    }
                    else
                    {
                        val = get_val( el );
                        model.set( key, val );
                    }
                }
            }
        }, 0, elements.length-1);
    },

    serialize_fields = function( node, name_prefix ) {
        var data = { },
            model_prefix = name_prefix&&name_prefix.length ? name_prefix + '.' : null,
            elements = $sel( 'input,textarea,select', node ), checkboxes_done = { }
        ;
        
        iterate(function( i ) {
            var el, name, key, k, j, o,
            val, input_type, is_dynamic_array, checkboxes;
            el = elements[i]; name = el[ATTR]("name");
            if ( !name ) return;
            
            input_type = (el[TYPE]||'').toLowerCase( );
            
            key = dotted( name );
            if ( model_prefix )
            {
                if ( !startsWith(key, model_prefix) ) return;
                key = key.slice( model_prefix.length );
            }
            
            k = key.split('.'); o = data;
            while ( k.length )
            {
                j = k.shift( );
                if ( k.length ) 
                {
                    if ( !o[HAS]( j ) ) o[ j ] = numeric_re.test( k[0] ) ? [ ] : { };
                    o = o[ j ];
                }
                else 
                {
                    if ( !o[HAS]( j ) ) o[ j ] = '';
                    
                    if ( 'radio' === input_type )
                    {
                        if ( !checkboxes_done[name] )
                        {
                            val = '';
                            checkboxes = $sel( 'input[type="radio"][name="'+name+'"]', node );
                            if ( checkboxes.length > 1 )
                            {
                                each(checkboxes, function(c){
                                   if ( el[CHECKED] ) val = el[VAL];
                                });
                            }
                            else if ( el[CHECKED] )
                            {
                                val = el[VAL];
                            }
                            checkboxes_done[name] = 1;
                            o[ j ] = val;
                        }
                    }
                    else if ( 'checkbox' === input_type )
                    {
                        if ( !checkboxes_done[name] )
                        {
                            is_dynamic_array = empty_brackets_re.test( name );
                            checkboxes = $sel( 'input[type="radio"][name="'+name+'"]', node );
                            
                            if ( is_dynamic_array )
                            {
                                // multiple checkboxes [name="model[key][]"] dynamic array
                                // only checked items are in the list
                                val = [ ];
                                each(checkboxes, function( c ) {
                                    if ( c[CHECKED] ) val.push( c[VAL] );
                                });
                            }
                            else if ( checkboxes.length > 1 )
                            {
                                // multiple checkboxes [name="model[key]"] static array
                                // all items are in the list either with values or defaults
                                val = [ ];
                                each(checkboxes, function( c ) {
                                    if ( c[CHECKED] ) val.push( c[VAL] );
                                    else val.push( !!(alternative=c[ATTR]('data-else')) ? alternative : '' );
                                });
                            }
                            else if ( el[CHECKED] )
                            {
                                // single checkbox, checked
                                val = el[VAL];
                            }
                            else
                            {
                                // single checkbox, un-checked
                                // use alternative value in [data-else] attribute, if needed, else empty
                                val = !!(alternative=el[ATTR]('data-else')) ? alternative : '';
                            }
                            checkboxes_done[name] = 1;
                            o[ j ] = val;
                        }
                    }
                    else
                    {
                        val = get_val( el );
                        o[ j ] = val;
                    }
                }
            }
        }, 0, elements.length-1);
        return data;
    },

    do_bind_action = function( view, evt, elements, fromModel ) {
        var model = view.$model, isSync = 'sync' == evt.type, 
            event = isSync ? 'change' : evt.type, 
            modelkey = fromModel && fromModel.key ? fromModel.key : null,
            notmodelkey = !modelkey, modelkeyDot = modelkey ? (modelkey+'.') : null,
            isAtom = model.atomic, atom = model.$atom,
            atomDot = isAtom ? (atom+'.') : null
        ;
            
        iterate(function( i ) {
            var el, bind, do_action, name, key;
            el = elements[i]; if ( !el ) return;
            bind = getBindData( event, view.attr(el, 'bind') );
            // during sync, dont do any actions based on (other) events
            if ( !bind || !bind[HAS]("action") ) return;
            
            do_action = 'do_' + bind.action;
            if ( !is_type( view[ do_action ], T_FUNC ) ) return;
            
            name = el[NAME]; key = bind.key;
            if ( !key )
            {
                if  ( !el[namedKeyProp] && !!name ) el[namedKeyProp] = model.key(name, 1);
                key = el[namedKeyProp];
            }
            // "model:change" event and element does not reference the (nested) model key
            // OR model atomic operation(s)
            if ( (isAtom && key && ((atom === key) || startsWith( key, atomDot ))) || (modelkey && !key) ) return;
            
            if ( notmodelkey || key === modelkey || startsWith( key, modelkeyDot ) ) view[ do_action ]( evt, el, bind );
        }, 0, elements.length-1);
    },
    
    do_auto_bind_action = function( view, evt, elements, fromModel ) {
        var model = view.$model, cached = { };
        
        iterate(function( i ) {
            var el, name, key, ns_key, value;
            el = elements[i];  if ( !el ) return;
            name = el[NAME]; key = 0;
            if ( !el[namedKeyProp] && !!name ) el[namedKeyProp] = model.key( name, 1 );
            key = el[namedKeyProp]; if ( !key ) return;
            
            // use already cached key/value
            ns_key = '_'+key;
            if ( cached[HAS]( ns_key ) )  value = cached[ ns_key ][ 0 ];
            else if ( model.has( key ) ) cached[ ns_key ] = [ value=model.get( key ) ];
            else return;  // nothing to do here
            
            // call default action (ie: live update)
            view.do_bind( evt, el, {name:name, key:key, value:value} );
        }, 0, elements.length-1);
    },
    
    do_live_bind_action = function( view, evt, fromModel ) {
        var model = view.$model, isSync = 'sync' == evt.type, hasData = false,
            key, keyDot, keys = view.$tpl.keys(), kl = keys.length, data = {}
        ;
        if ( isSync )
        {
            iterate(function( k )  {
                var kk = keys[k];
                data[kk] = model.get(kk);
                hasData = true;
            }, 0, kl-1);
        }
        else if ( fromModel && fromModel.key )
        {
            key = fromModel.key; keyDot = key + '.';
            iterate(function( k )  {
                var kk = keys[k];
                if ( key === kk || startsWith(kk, keyDot) )
                {
                    data[kk] = model.get(kk);
                    hasData = true;
                }
            }, 0, kl-1);
        }
        if ( hasData ) view.$tpl.render( data );
    },
    
    //Work around for stupid Shift key bug created by using lowercase - as a result the shift+num combination was broken
    shift_nums = {
     "~" : "`"
    ,"!" : "1"
    ,"@" : "2"
    ,"#" : "3"
    ,"$" : "4"
    ,"%" : "5"
    ,"^" : "6"
    ,"&" : "7"
    ,"*" : "8"
    ,"(" : "9"
    ,")" : "0"
    ,"_" : "-"
    ,"+" : "="
    ,":" : ";"
    ,"\"": "'"
    ,"<" : ","
    ,">" : "."
    ,"?" : "/"
    ,"|" : "\\"
    },
    //Special Keys - and their codes
    special_keys = {
     27 : 'escape'
    ,9  : 'tab'
    ,32 : 'space'
    ,13 : 'enter'
    ,8  : 'backspace'

    ,145 : 'scrolllock'
    ,20  : 'capslock'
    ,144 : 'numlock'
    
    ,19 : 'pause'
    //,19 : 'break'
    
    ,45 : 'insert'
    ,36 : 'home'
    ,46 : 'delete'
    ,35 : 'end'
    
    ,33 : 'pageup'
    ,34 : 'pagedown'

    ,37 : 'left'
    ,38 : 'up'
    ,39 : 'right'
    ,40 : 'down'

    ,112 : 'f1'
    ,113 : 'f2'
    ,114 : 'f3'
    ,115 : 'f4'
    ,116 : 'f5'
    ,117 : 'f6'
    ,118 : 'f7'
    ,119 : 'f8'
    ,120 : 'f9'
    ,121 : 'f10'
    ,122 : 'f11'
    ,123 : 'f12'
    },
    
    viewHandler = function( view, method ) {
        return function(evt){return view[method](evt, {el:this});};
    }
;

/**[DOC_MARKDOWN]
####View

```javascript
// modelview.js view methods

var view = new ModelView.View( [String id=UUID, Model model=new Model(), Object viewAttributes={bind:"data-bind"}, Integer cacheSize=View._CACHE_SIZE, Integer refreshInterval=View._REFRESH_INTERVAL] );

[/DOC_MARKDOWN]**/
//
// View Class
var View = function View( id, model, atts, cacheSize, refreshInterval ) {
    var view = this;
    
    // constructor-factory pattern
    if ( !(view instanceof View) ) return new View( id, model, atts, cacheSize, refreshInterval );
    
    view.namespace = view.id = id || uuid('View');
    if ( !(atts=atts||{})[HAS]('bind') ) atts['bind'] = "data-bind";
    view.$atts = atts;
    cacheSize = cacheSize || View._CACHE_SIZE;
    refreshInterval = refreshInterval || View._REFRESH_INTERVAL;
    view.$memoize = new Cache( cacheSize, INF );
    view.$selectors = new Cache( cacheSize, refreshInterval );
    view.$atbind = view.attribute( "bind" );
    //view.$atkeys = view.attribute( "keys" );
    view.$shortcuts = { };
    view.$num_shortcuts = 0;
    view.model( model || new Model( ) ).initPubSub( );
};
// STATIC
View._CACHE_SIZE = 600; // cache size
View._REFRESH_INTERVAL = INF; // refresh cache interval
View.node = find_node;
View.index = node_index;
View.indexClosest = node_closest_index;
View.getDomRef = get_dom_ref;
View.serialize = serialize_fields;
// View implements PublishSubscribe pattern
View[proto] = Merge( Create( Obj[proto] ), PublishSubscribe, {
    
    constructor: View
    
    ,id: null
    ,$dom: null
    ,$tpl: null
    ,$model: null
    ,$livebind: null
    ,$autobind: false
    ,$isomorphic: false
    ,$bindbubble: false
    ,$template: null
    ,$atts: null
    ,$memoize: null
    ,$selectors: null
    ,$atbind: null
    //,$atkeys: null
    ,$shortcuts: null
    ,$num_shortcuts: null
    
/**[DOC_MARKDOWN]
// dispose view (and model)
view.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function( ) {
        var view = this;
        view.unbind( ).disposePubSub( );
        if ( view.$model ) view.$model.dispose( );
        view.$model = null;
        view.$dom = null;
        if ( view.$tpl ) view.$tpl.dispose( );
        view.$tpl = null;
        view.$template = null;
        view.$atts = null;
        view.$memoize.dispose( );
        view.$memoize = null;
        view.$selectors.dispose( );
        view.$selectors = null;
        view.$livebind = null;
        view.$isomorphic = null;
        view.$atbind = null;
        //view.$atkeys = null;
        view.$shortcuts = null;
        view.$num_shortcuts = null;
        return view;
    }
    
/**[DOC_MARKDOWN]
// get / set view model
view.model( [Model model] );

[/DOC_MARKDOWN]**/
    ,model: function( model ) {
        var view = this;
        if ( arguments.length )
        {
            if ( view.$model ) view.$model.dispose( );
            view.$model = model.view( view );
            return view;
        }
        return view.$model;
    }
    
/**[DOC_MARKDOWN]
// get/set the name of view-specific attribute (e.g "bind": "data-bind" )
view.attribute( String name [, String att] );

[/DOC_MARKDOWN]**/
    ,attribute: function( name, att ) {
        var view = this;
        if ( arguments.length > 1 )
        {
            view.$atts[ name ] = att;
            view.$atbind = view.$atts.bind;
            view.$atkeys = view.$atts.keys;
            return view;
        }
        return name ? (view.$atts[ name ] || undef) : undef;
    }
    
    ,template: function( renderer ) {
        var view = this;
        if ( arguments.length )
        {
            if ( is_type( renderer, T_FUNC ) ) view.$template = renderer;
            return view;
        }
        return view.$template;
    }
    
/**[DOC_MARKDOWN]
// add custom view event handlers for model/view/dom/document in {"target:eventName": handler} format
view.events( Object events );

[/DOC_MARKDOWN]**/
    ,events: function( events ) {
        var view = this, k;
        if ( is_type(events, T_OBJ) )
        {
            for ( k in events ) 
                if ( events[HAS](k) && is_type(events[k], T_FUNC) )
                    view[ 'on_' + k.split(':').join('_') ] = events[k];
        }
        return view;
    }
    
/**[DOC_MARKDOWN]
// add/remove custom view keyboard shortcuts/hotkeys in {"key+combination": actionName|handler|false} format
view.shortcuts( Object shortcuts );

[/DOC_MARKDOWN]**/
    ,shortcuts: function( shortcuts ) {
        var view = this, k, key, keys, modifiers, i, view_shortcuts = view.$shortcuts;
        if ( is_type(shortcuts, T_OBJ) )
        {
            for ( k in shortcuts ) 
            {
                if ( shortcuts[HAS](k) )
                {
                    modifiers = [];
                    keys = k.toLowerCase().split('+').map(trim);
                    for (i=keys.length-1; i>=0; i--)
                    {
                        key = keys[ i ];
                        if ( 'alt' === key || 'ctrl' === key || 'shift' === key || 'meta' === key )
                        {
                            modifiers.push( key );
                            keys.splice(i, 1);
                        }
                    }
                    key = modifiers.sort().concat(keys).join('+');
                    
                    if ( false === shortcuts[k] )
                    {
                        if ( view_shortcuts[HAS](key) ) 
                        {
                            del(view_shortcuts, key);
                            view.$num_shortcuts--;
                        }
                    }
                    else
                    {
                        if ( !view_shortcuts[HAS](key) ) view.$num_shortcuts++;
                        view_shortcuts[ key ] = shortcuts[ k ];
                    }
                }
            }
        }
        return view;
    }
    
/**[DOC_MARKDOWN]
// add custom view named actions in {actionName: handler} format
view.actions( Object actions );

[/DOC_MARKDOWN]**/
    ,actions: function( actions ) {
        var view = this, k;
        if ( is_type(actions, T_OBJ) )
        {
            for ( k in actions ) 
                if ( actions[HAS](k) && is_type(actions[k], T_FUNC) )
                    view[ 'do_' + k ] = actions[k];
        }
        return view;
    }
    
/**[DOC_MARKDOWN]
// get/set associated model auto-validate flag
view.autovalidate( [Boolean enabled] );

[/DOC_MARKDOWN]**/
    ,autovalidate: function( enabled ) {
        if ( arguments.length )
        {
            this.$model.autovalidate( enabled );
            return this;
        }
        return this.$model.autovalidate( );
    }
    
/**[DOC_MARKDOWN]
// get / set livebind, 
// livebind automatically binds DOM live nodes to model keys according to {model.key} inline tpl format
// e.g <span>model.key is $(model.key)</span>
view.livebind( [String format | Boolean false] );

[/DOC_MARKDOWN]**/
    ,livebind: function( format ) {
        var view = this;
        if ( arguments.length )
        {
            view.$livebind = !!format ? getInlineTplRE( format, view.$model ? view.$model.id : '' ) : null;
            return view;
        }
        return view.$livebind;
    }
    
/**[DOC_MARKDOWN]
// get / set isomorphic flag, 
// isomorphic flag enables ModelView API to run both on server and browser and seamlessly and continously pass from one to the other
view.isomorphic( [Boolean false] );

[/DOC_MARKDOWN]**/
    ,isomorphic: function( bool ) {
        var view = this;
        if ( arguments.length )
        {
            view.$isomorphic = !!bool;
            return view;
        }
        return view.$isomorphic;
    }
    
/**[DOC_MARKDOWN]
// get / set autobind, 
// autobind automatically binds (2-way) input elements to model keys via name attribute 
// e.g <input name="model[key]" />, <select name="model[key]"></select>
view.autobind( [Boolean bool] );

[/DOC_MARKDOWN]**/
    ,autobind: function( enable ) {
        var view = this;
        if ( arguments.length )
        {
            view.$autobind = !!enable;
            return view;
        }
        return view.$autobind;                        
    }
    
    ,bindbubble: function( enable ) {
        var view = this;
        if ( arguments.length )
        {
            view.$bindbubble = !!enable;
            return view;
        }
        return view.$bindbubble;                        
    }
    
    // cache selectors for even faster performance
    ,get: function( selector, $dom, addRoot, not_cached ) {
        var view = this, selectorsCache = view.$selectors, elements;
        
        $dom = $dom || view.$dom;
        
        if ( not_cached || !(elements=selectorsCache.get( selector )) ) 
        {
            elements = $sel( selector, $dom );
            if ( addRoot && $dom[MATCHES](selector) ) elements.push( $dom );
            if ( !not_cached ) selectorsCache.set( selector, elements );
        }
        
        return elements;
    }
    
    // http://stackoverflow.com/questions/10892322/javascript-hashtable-use-object-key
    // http://stackoverflow.com/questions/2937120/how-to-get-javascript-object-references-or-reference-count
    ,attr: function( el, att ) {
        var view = this, attr = view.$atts[ att ],
            memoizeCache = view.$memoize, attribute, attbind
        ;
        
        // use memoization/caching
        if ( !!(attr=el[ATTR]( attr )) )
        {
            attribute = memoizeCache.get( attr );
            
            if ( undef === attribute )
            {
                attribute = fromJSON( attr );
                
                // shortcut abbreviations for some default actions
                if ( attribute.set )
                {
                    attribute.click = attribute.set;
                    attribute.click.action = "set";
                    del(attribute, 'set');
                }
                
                if ( attribute.each )
                {
                    attribute.change = {action:"each", key:attribute.each};
                    del(attribute, 'each');
                }
                
                if ( attribute.show )
                {
                    attribute.change = {action:"show", key:attribute.show};
                    del(attribute, 'show');
                }
                if ( attribute.hide )
                {
                    attribute.change = {action:"hide", key:attribute.hide};
                    del(attribute, 'hide');
                }
                
                if ( attribute.html )
                {
                    attribute.change = {action:"html", key:attribute.html};
                    del(attribute, 'html'); del(attribute, 'text');
                }
                else if ( attribute.text )
                {
                    attribute.change = {action:"html", key:attribute.text, text:1};
                    del(attribute, 'text');
                }
                
                if ( attribute.css )
                {
                    attribute.change = {action:"css", css:attribute.css};
                    del(attribute, 'css');
                }
                
                if ( attribute.value )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.value = attribute.value;
                    else
                        attribute.change = {action:"prop", prop:{value:attribute.value}};
                    del(attribute, 'value');
                }
                if ( attribute.checked )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.checked = attribute.checked;
                    else
                        attribute.change = {action:"prop", prop:{checked:attribute.checked}};
                    del(attribute, 'checked');
                }
                if ( attribute.disabled )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.disabled = attribute.disabled;
                    else
                        attribute.change = {action:"prop", prop:{disabled:attribute.disabled}};
                    del(attribute, 'disabled');
                }
                if ( attribute.options )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.options = attribute.options;
                    else
                        attribute.change = {action:"prop", prop:{options:attribute.options}};
                    del(attribute, 'options');
                }
                
                if ( (attbind=attribute.change) )
                {
                    // domRef referenced in separate data-domref attribute
                    //if ( !attbind.domRef && attribute.domRef ) attbind.domRef = attribute.domRef;
                    if ( !attbind.key && attribute.key ) attbind.key = attribute.key;
                }
                
                // parsing is expensive, use memoize cache
                memoizeCache.set( attr, attribute );
            }
            
            return attribute;
        }
        
        return undef;
    }
    
    ,add: function( el, and_sync ) {  
        var view = this;
        if ( el )
        {
            if ( view.$tpl ) view.$tpl.bind( el );
            if ( false !== and_sync ) view.sync( null, el );
        }
        return view;
    }
    
    ,remove: function( el, and_reset ) {  
        var view = this;
        if ( el ) 
        {
            if ( view.$tpl ) view.$tpl.free( el );
            if ( false !== and_reset ) view.$selectors.reset( );
        }
        return view;
    }
    
/**[DOC_MARKDOWN]
// bind view to dom listening given events (default: ['change', 'click'])
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body] );

[/DOC_MARKDOWN]**/
    ,bind: function( events, dom ) {
        var view = this, model = view.$model,
            sels = getSelectors( view.$atbind, null/*[view.$atkeys]*/, [model.id+'['] ),
            bindSelector = sels[ 0 ], autobindSelector = sels[ 2 ],
            method, evt, namespaced, 
            autobind = view.$autobind, livebind = !!view.$livebind,
            hasDocument = 'undefined' !== typeof document
        ;
        
        events = events || ['change', 'click'];
        view.$dom = dom || (hasDocument ? document.body : null);
        
        namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
        
        // live update dom nodes via special isomorphic Tpl live dom class
        if ( livebind ) view.$tpl = Tpl( view.$dom, view.$livebind, view.$isomorphic );
        
        // default view/dom binding events
        if ( hasDocument && view.on_view_change && events.length )
        {
            // use one event handler for bind and autobind
            // avoid running same (view) action twice on autobind and bind elements
            DOMEvent( view.$dom ).on( 
                map( events, namespaced ).join( ' ' ), 
                
                autobind ? [ autobindSelector, bindSelector ].join( ',' ) : bindSelector,
                
                function( evt ) {
                    // avoid "ghosting" events on other elements which may be inside a bind element
                    // Chrome issue on nested button clicked, when data-bind on original button
                    // add "bubble" option in modelview data-bind params
                    var el = this,
                        isAutoBind = false, isBind = false, 
                        bind = view.$bindbubble ? view.attr(el, 'bind') : null
                    ;
                    if ( (evt.target === el) || (bind && bind.bubble) )
                    {
                        // view/dom change events
                        isBind = view.$bindbubble ? !!bind : el[MATCHES](bindSelector);
                        // view change autobind events
                        isAutoBind = autobind && "change" == evt.type && el[MATCHES](autobindSelector);
                        if ( isBind || isAutoBind ) 
                            view.on_view_change( evt, {el:el, isBind:isBind, isAutoBind:isAutoBind} );
                    }
                    return true;
                }
            );
        }
        
        // bind model/view/dom/document (custom) event handlers
        for (method in view)
        {
            if ( !is_type( view[ method ], T_FUNC ) ) continue;
            
            if ( startsWith( method, 'on_model_' ) )
            {
                evt = method.slice(9);
                evt.length && view.onTo( model, evt, view[ method ] );
            }
            else if ( hasDocument )
            {
                if ( startsWith( method, 'on_document_' ) )
                {
                    evt = method.slice(12);
                    evt.length && DOMEvent( document.body ).on( 
                        namespaced(evt), 
                        viewHandler( view, method )
                    );
                }
                else if ( startsWith( method, 'on_view_' ) && 'on_view_change' !== method )
                {
                    evt = method.slice(8);
                    evt.length && DOMEvent( view.$dom ).on( 
                        namespaced(evt), 
                        autobind ? [ autobindSelector, bindSelector ].join( ',' ) : bindSelector, 
                        viewHandler( view, method )
                    );
                }
                else if ( startsWith( method, 'on_dom_' ) )
                {
                    evt = method.slice(7);
                    evt.length && DOMEvent( view.$dom ).on( 
                        namespaced(evt), 
                        viewHandler( view, method )
                    );
                }
            }
        }
        
        return view;
    }
    
/**[DOC_MARKDOWN]
// unbind view from dom listening to events or all events (if no events given)
view.unbind( [Array events=null, DOMNode dom=view.$dom] );

[/DOC_MARKDOWN]**/
    ,unbind: function( events, dom ) {
        var view = this, model = view.$model,
            sels = getSelectors( view.$atbind, null/*[view.$atkeys]*/, [model.id+'['] ),
            namespaced, $dom, viewEvent = NSEvent('', view.namespace),
            autobind = view.$autobind, livebind = !!view.$livebind,
            hasDocument = 'undefined' !== typeof document
        ;
        
        events = events || null;
        $dom = dom || view.$dom;
        
        namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
         
        // view/dom change events
        if ( hasDocument && view.on_view_change )
        {
            DOMEvent( $dom ).off( 
                
                events && events.length ? map( events, namespaced ).join(' ') : viewEvent, 
                
                autobind ? [ sels[ 2 ], sels[ 0 ] ].join( ',' ) : sels[ 0 ]
            );
        }
        
        // model events
        view.offFrom( model );
        if ( hasDocument )
        {
            DOMEvent( $dom ).off( viewEvent );
            DOMEvent( document.body ).off( viewEvent );
        }
        // live update dom nodes
        if ( view.$tpl )
        {
            view.$tpl.dispose();
            view.$tpl = null;
        }
        
        return view;
    }
    
/**[DOC_MARKDOWN]
// reset view caches and re-bind to dom UI
view.rebind( [Array events=['change', 'click'], DOMNOde dom=document.body] );

[/DOC_MARKDOWN]**/
    ,rebind: function( events, $dom ) {
        var view = this;
        // refresh caches
        view.$memoize.reset( );
        view.$selectors.reset( );
        // re-bind to UI
        return view.unbind( ).bind( events, $dom );
    }
    
/**[DOC_MARKDOWN]
// synchronize dom (or part of it) to underlying model
view.sync( [DOMNode dom=view.$dom] );

[/DOC_MARKDOWN]**/
    ,sync: function( $dom, el ) {
        var view = this, 
            autobind = view.$autobind, livebind = !!view.$livebind, 
            s = getSelectors( view.$atbind, null/*livebind ? [view.$atkeys] : 0*/, autobind ? [view.$model.id+'['] : 0 ),
            syncEvent = PBEvent('sync', view), binds, autobinds, livebinds, 
            hasDocument = 'undefined' !== typeof document,
            andCache;
        
        view.$selectors.reset( );
        if ( el )
        {
            syncEvent.currentTarget = el;
            if ( hasDocument )
            {
                binds = view.get( s[ 0 ], el, 0, 1 );
                if ( autobind ) autobinds = view.get( s[ 2 ], el, 0, 1 );
                //if ( livebind ) livebinds = view.get( s[ 1 ], el, 1, 1 );
            }
        }
        else if ( hasDocument )
        {
            $dom = $dom || view.$dom; andCache = !($dom === view.$dom);
            binds = view.get( s[ 0 ], $dom, 0, andCache );
            if ( autobind ) autobinds = view.get( s[ 2 ], $dom, 0, andCache );
            //if ( livebind ) livebinds = view.get( s[ 1 ], $dom, 1, andCache );
        }
        if ( hasDocument && binds.length ) do_bind_action( view, syncEvent, binds );
        if ( hasDocument && autobind && autobinds.length ) do_auto_bind_action( view, syncEvent, autobinds );
        if ( livebind && /*livebinds.length*/view.$tpl ) do_live_bind_action( view, syncEvent );
        return view;
    }
    
/**[DOC_MARKDOWN]
// synchronize model to underlying dom (or part of it)
view.sync_model( [DOMNode dom=view.$dom] );

[/DOC_MARKDOWN]**/
    ,sync_model: function( $dom ) {
        var view = this, s,
            autobind = view.$autobind, 
            autobinds, hasDocument = 'undefined' !== typeof document
        ;
        
        if ( hasDocument && autobind )
        {
            s = getSelectors( null, null, [view.$model.id+'['] );
            view.$selectors.reset( );
            autobinds = view.get( s[ 2 ], $dom || view.$dom, 0, 1 );
            if ( autobinds.length ) fields2model( view, autobinds );
        }
        return view;
    }
    
/**[DOC_MARKDOWN]
// reset view caches only
view.reset( );

[/DOC_MARKDOWN]**/
    ,reset: function( ) {
        var view = this;
        // refresh caches
        view.$memoize.reset( );
        view.$selectors.reset( );
        return view;
    }
    
    //
    // view "on_event" methods
    //
    
    ,on_view_change: function( evt, data ) {
        var view = this, model = view.$model, 
            el = data.el, name, key, val, 
            checkboxes, is_dynamic_array, input_type, alternative,
            modeldata = { }
        ;
        
        // update model and propagate to other elements of same view (via model publish hook)
        if ( data.isAutoBind && !!(name=el[NAME]) )
        {
            if ( !el[namedKeyProp] ) el[namedKeyProp] = model.key( name, 1 );
            key = el[namedKeyProp];
            
            if ( key /*&& model.has( key )*/ )
            {
                input_type = el[TYPE].toLowerCase( );
                
                if ( 'checkbox' === input_type )
                {
                    is_dynamic_array = empty_brackets_re.test( name );
                    checkboxes = view.get('input[type="checkbox"][name="'+name+'"]');
                    
                    if ( is_dynamic_array )
                    {
                        // multiple checkboxes [name="model[key][]"] dynamic array
                        // only checked items are in the list
                        val = [ ];
                        each(checkboxes, function( c ) {
                            if ( c[CHECKED] ) val.push( c[VAL] );
                        });
                    }
                    else if ( checkboxes.length > 1 )
                    {
                        // multiple checkboxes [name="model[key]"] static array
                        // all items are in the list either with values or defaults
                        val = [ ];
                        each(checkboxes, function( c ) {
                            if ( c[CHECKED] ) val.push( c[VAL] );
                            else val.push( !!(alternative=c[ATTR]('data-else')) ? alternative : '' );
                        });
                    }
                    else if ( el[CHECKED] )
                    {
                        // single checkbox, checked
                        val = el[VAL];
                    }
                    else
                    {
                        // single checkbox, un-checked
                        // use alternative value in [data-else] attribute, if needed, else empty
                        val = !!(alternative=el[ATTR]('data-else')) ? alternative : '';
                    }
                }
                else
                {
                    val = get_val( el );
                }
                
                modeldata.$trigger = el;
                model.set( key, val, 1, modeldata );
            }
        }
        
        // if not model update error and element is bind element
        // do view action
        if ( !modeldata.error && data.isBind ) do_bind_action( view, evt, [el]/*, data*/ );
        
        // notify any 3rd-party also if needed
        view.publish( 'change', data );
    }
    
    ,on_document_keydown: function( evt, data ) {
        var view = this, view_shortcuts = view.$shortcuts, 
            el = data.el, callback, ret, input_type,
            key, code, character, modifiers;
        
        // adapted from shortcuts.js, http://www.openjs.com/scripts/events/keyboard_shortcuts/
        //
        input_type = 'TEXTAREA' === el.tagName ? 'text' : ('INPUT' === el.tagName ? el[TYPE].toLowerCase( ) : '');
        // no hotkeys assigned or text input element is the target, bypass
        if ( !view.$num_shortcuts || 'text' === input_type || 'email' === input_type || 'url' === input_type || 'number' === input_type ) return;
        
        // find which key is pressed
        code = evt.keyCode || evt.which; 

        // key modifiers (in alphabetical order)
        modifiers = [];
        if ( !!evt.altKey ) modifiers.push('alt');
        if ( !!evt.ctrlKey ) modifiers.push('ctrl');
        if ( !!evt.metaKey ) modifiers.push('meta');	// meta is Mac specific
        if ( !!evt.shiftKey ) modifiers.push('shift');
        
        // if it is a special key
        if ( special_keys[HAS]( code ) ) 
        {
            key = special_keys[ code ];
        }
        else
        {
            if ( 188 === code )         character = ","; //If the user presses , when the type is onkeydown
            else if ( 190 === code )    character = "."; //If the user presses , when the type is onkeydown
            else                        character = Str.fromCharCode(code).toLowerCase( );
            // stupid Shift key bug created by using lowercase
            if ( !!evt.shiftKey && shift_nums[HAS](character) ) character = shift_nums[character];
            key = character;
            //if ( '+' === key ) key = 'plus';
        }
        key = modifiers.concat(key).join('+');
        if ( !!key && view_shortcuts[HAS](key) && view_shortcuts[key] ) 
        {
            callback = view_shortcuts[key]; ret = true;
            if ( callback.substr )
            {
                // view action id given
                if ( is_type(view['do_' + callback], T_FUNC) )
                {
                    /*ret = */view['do_' + callback](evt, el, {});
                    ret = false;
                }
            }
            else
            {
                // actual function handler given
                ret = callback.call(view, evt, el, {});
            }
            if ( false === ret ) 
            { 
                // stop the event
                evt.stopPropagation( );
                evt.preventDefault( );
                return false;
            }
        }
    }
    
    ,on_model_change: function( evt, data ) {
        var view = this, model = view.$model,
            autobind = view.$autobind, livebind = !!view.$livebind, 
            s = getSelectors( view.$atbind, null/*livebind ? [view.$atkeys, data.key] : 0*/, autobind ? [model.id + bracketed( data.key )] : 0 ),
            bindElements, autoBindElements, liveBindings,  
            hasDocument = 'undefined' !== typeof document,
            notTriggerElem
        ;
        
        if ( hasDocument )
        {
            bindElements = view.get( s[ 0 ] );
            if ( autobind ) autoBindElements = view.get( s[ 2 ] );
            //if ( livebind ) liveBindings = view.get( s[ 1 ], 0, 1 );
            
            // bypass element that triggered the "model:change" event
            if ( data.$callData && data.$callData.$trigger )
            {
                notTriggerElem = function( ele ){ return ele !== data.$callData.$trigger; };
                bindElements = filter( bindElements, notTriggerElem );
                if ( autobind ) autoBindElements = filter( autoBindElements, notTriggerElem );
                data.$callData = null;
            }
        }
        
        // do actions ..
        
        // do view action first
        if ( hasDocument && bindElements.length ) do_bind_action( view, evt, bindElements, data );
        // do view autobind action to bind input elements that map to the model, afterwards
        if ( hasDocument && autobind && autoBindElements.length ) do_auto_bind_action( view, evt, autoBindElements, data );
        // do view live DOM bindings update action
        if ( livebind && /*liveBindings.length*/view.$tpl ) do_live_bind_action( view, evt, data );
    }

    ,on_model_error: function( evt, data ) {
        var view = this, model = view.$model,
            autobind = view.$autobind, livebind = !!view.$livebind, 
            s = getSelectors( view.$atbind, null/*livebind ? [view.$atkeys, data.key] : 0*/, autobind ? [model.id + bracketed( data.key )] : 0 ),
            hasDocument = 'undefined' !== typeof document,
            bindElements, autoBindElements, liveBindings
        ;

        // do actions ..
        
        // do view bind action first
        if ( hasDocument && (bindElements=view.get( s[ 0 ] )).length ) do_bind_action( view, evt, bindElements, data );
        // do view autobind action to bind input elements that map to the model, afterwards
        if ( hasDocument && autobind && (autoBindElements=view.get( s[ 2 ] )).length ) do_auto_bind_action( view, evt, autoBindElements, data );
        // do view live DOM bindings update action
        if ( livebind && /*(liveBindings=view.get( s[ 1 ], 0, 1 )).length*/view.$tpl ) do_live_bind_action( view, evt, data );
    }
    
    //
    // view "do_action" methods
    //
    
    // NOP action
    ,do_nop: null
    
    // update element each nodes dependiong on a model collection key
    ,do_each: function( evt, el, data ) {
        // in progress
    }
    
    // set element(s) attributes/properties according to binding
    ,do_prop: function( evt, el, data ) {
        if ( !is_type(data.prop, T_OBJ) ) return;
        
        var view = this, model = view.$model, 
            prop = data.prop, p, k, v, vT, domref
        ;
        
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length ) return;
            
        each(el, function( el ){
            if ( !el ) return;
            for (p in prop)
            {
                if ( prop[HAS](p) )
                {
                    k = prop[ p ];
                    if ( !model.has( k ) ) continue;
                    v = model.get( k ); vT = get_type( v );
                    switch( p )
                    {
                        case 'value':
                            set_val(el, v);
                            break;
                        
                        case 'checked': case 'disabled':
                            el[p] = ( T_BOOL === vT ) ? v : (Str(v) == el[VAL]);
                            break;
                        
                        case 'options':
                            if ( 'SELECT' === el[TAG] && (T_ARRAY === vT) )
                            {
                                var sel, ii, vl = v.length,
                                    _options = '', group = $tag( 'optgroup', el );
                                sel = select_get( el ); // get selected value
                                group = group.length ? group[ 0 ] : el;
                                each($tag( 'option', group ), function( o ){ group.removeChild( o ); });
                                for (ii=0; ii<vl; ii++)
                                {
                                    if ( v[ii] && v[ii].label )
                                        _options += '<option value="' + v[ii].value + '">' + v[ii].label + '</option>';
                                    else
                                        _options += '<option value="' + v[ii] + '">' + v[ii] + '</option>';
                                }
                                group[HTML] = _options;
                                select_set( el, sel ); // select the appropriate option
                            }
                            break;
                        
                        default:
                            el[SET_ATTR](p, v);
                            break;
                    }
                }
            }
        });
    }
    
    // set element(s) html/text prop based on model key value
    ,do_html: function( evt, el, data ) {
        if ( !data.key ) return;
        var view = this, model = view.$model, key = data.key, domref;
        
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length || !key || !model.has( key ) ) return;
            
        each(el, function( el ){
            if ( !el ) return;
            el[data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML] = model.get( key );
        });
    }
    
    // set element(s) css props based on model key value
    ,do_css: function( evt, el, data ) {
        if ( !is_type(data.css, T_OBJ) ) return;
        var view = this, model = view.$model, css = data.css, k, p, v, domref;
        
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length ) return;
            
        each(el, function( el ){
            if ( !el ) return;
            // css attributes
            for ( p in css )
            {
                if ( css[HAS](p) )
                {
                    k = css[ p ]; v = model.get( k );
                    if ( /*model.has( k )*/v ) el.style[ p ] = v;
                }
            }
        });
    }
    
    // update/set a model field with a given value
    ,do_set: function( evt, el, data ) {
        var view = this, model = view.$model, key = null, val, domref;
        
        if ( data.key ) 
        {
            key = data.key;
        }
        else if ( el[NAME] )
        {
            if ( !el[namedKeyProp] ) el[namedKeyProp] = model.key( el[NAME], 1 );
            key = el[namedKeyProp];
        }
        
        if ( !!key ) 
        {
            if ( data[HAS]("value") ) 
            {
                val = data.value;
            }
            else
            {
                if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref )[0];
                val = get_val( el );
            }
            model.set( key, val, 1 );
        }
    }
    
    // render an element using a custom template and model data
    ,do_tpl: function( evt, el, data ) {
        var view = this, model, 
            key = data.key, tplID = data.tpl,
            mode, html, domref
        ;
        if ( !view.$template || !key || !tplID ) return;
        model = view.$model;
        if ( !key || !model.has( key ) ) return;
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length ) return;
        mode = data.mode || 'replace';
        html = view.$template( tplID, model.get( key ) );
            
        each(el, function( el ){
            if ( !el ) return;
            if ( 'replace' == mode ) el[HTML] = '';
            if ( html ) el[HTML] += html;
        });
    }
    
    // show/hide element(s) according to binding
    ,do_show: function( evt, el, data ) {
        var view = this, model = view.$model, key = data.key, 
            modelkey, domref, enabled;
        
        if ( !key ) return;
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length ) return;
            
        modelkey = model.get( key );
        // show if data[key] is value, else hide
        // show if data[key] is true, else hide
        enabled = data[HAS]('value') ? data.value === modelkey : !!modelkey;
        each(el, function( el ){
            if ( !el ) return;
            if ( enabled ) show(el);
            else hide(el);
        });
    }
    
    // hide/show element(s) according to binding
    ,do_hide: function( evt, el, data ) {
        var view = this, model = view.$model, key = data.key, 
            modelkey, domref, enabled;
        
        if ( !key ) return;
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length ) return;
            
        modelkey = model.get( key );
        // hide if data[key] is value, else show
        // hide if data[key] is true, else show
        enabled = data[HAS]('value') ? data.value === modelkey : !!modelkey;
        each(el, function( el ){
            if ( !el ) return;
            if ( enabled ) hide(el);
            else show(el);
        });
    }
    
    // default bind/update element(s) values according to binding on model:change
    ,do_bind: function( evt, el, data ) {
        var view = this, model = view.$model, 
            name = data.name, key = data.key, 
            input_type = el[TYPE].toLowerCase( ),
            value, value_type, checkboxes, is_dynamic_array
        ;
        
        // use already computed/cached key/value from calling method passed in "data"
        if ( !key ) return;
        value = data.value; value_type = get_type( value );
        
        if ( 'radio' === input_type )
        {
            if ( Str(value) == el[VAL] )
            {
                each(view.get('input[name="'+name+'"]'), function( ele ){
                    if ( el !== ele )
                        ele[CHECKED] = false;
                });
                el[CHECKED] = true;
            }
        }
        
        else if ( 'checkbox' === input_type )
        {
            is_dynamic_array = empty_brackets_re.test( name );
            //checkboxes = view.get('input[type="checkbox"][name="'+name+'"]'); 
            
            if ( is_dynamic_array )
            {
                value = T_ARRAY === value_type ? value : [value];
                el[CHECKED] = contains_non_strict(value, el[VAL]);
                // eventually all same name checkboxes will be updated similarly from autobind
                // so update only one element at a time here
                /*each(checkboxes, function( cb ) {
                    if ( -1 < value.indexOf( cb[VAL] ) ) cb[CHECKED] = true;
                    else cb[CHECKED] = false;
                });*/
            }
            else if ( /*checkboxes.length > 1 &&*/ (T_ARRAY === value_type) )
            {
                el[CHECKED] = contains_non_strict(value, el[VAL]);
                // eventually all same name checkboxes will be updated similarly from autobind
                // so update only one element at a time here
                /*each(checkboxes, function( cb ) {
                    if ( -1 < value.indexOf( cb[VAL] ) ) cb[CHECKED] = true;
                    else cb[CHECKED] = false;
                });*/
            }
            
            else
            {
                el[CHECKED] = T_BOOL === value_type ? value : (Str(value) == el[VAL]);
            }
        }
        else
        {
            set_val(el, value);
        }
    }
    
    ,toString: function( ) {
        return '[ModelView.View id: '+this.id+']';
    }
});
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/
/**[DOC_MARKDOWN]

####View Actions

Default View Actions (inherited by sub-views)


The declarative view binding format is like:

```html
<element bind-attr="JSON"></element>

<!-- for example: -->
<div data-bind='{"event_name":{"action":"action_name","key":"a.model.key","anotherparam":"anotherparamvalue"}}'></div>

<!-- for some actions there are shorthand formats (see below) e.g -->
<div data-bind='{"hide":"a.model.key"}'></div>

<!-- is shorthand for: -->
<div data-bind='{"change":{"action":"hide","key":"a.model.key"}}'></div>

<!-- or -->
<div data-bind='{"event_name":"action_name"}'></div>

<!-- is shorthand for: -->
<div data-bind='{"event_name":{"action":"action_name"}}'></div>
```

<table>
<thead>
<tr>
    <td>Declarative Binding</td>
    <td>Method Name</td>
    <td>Bind Example</td>
    <td>Description</td>
</tr>
</thead>
<tbody>
<tr>
    <td><code>each</code></td>
    <td><code>view.do_each</code></td>
    <td>

<code><pre>
&lt;ul data-bind='{"each":"a.model.collection.key"}'>&lt;/ul>
&lt;!-- is shorthand for: -->
&lt;ul data-bind='{"change":{"action":"each","key":"a.model.collection.key"}}'>&lt;/ul>
</pre></code>

    </td>
    <td>update element each child node depending on model collection key (TODO)</td>
</tr>
<tr>
    <td><code>prop</code></td>
    <td><code>view.do_prop</code></td>
    <td>

<code><pre>
&lt;input type="text" data-bind='{"value":"a.model.key"}' />
&lt;!-- is shorthand for: -->
&lt;input type="text" data-bind='{"change":{"action":"prop","prop":{"value":"a.model.key"}}}' />

&lt;input type="checkbox" data-bind='{"checked":"a.model.key"}' />
&lt;!-- is shorthand for: -->
&lt;input type="checkbox" data-bind='{"change":{"action":"prop","prop":{"checked":"a.model.key"}}}' />

&lt;input type="text" data-bind='{"disabled":"a.model.key"}' />
&lt;!-- is shorthand for: -->
&lt;input type="text" data-bind='{"change":{"action":"prop","prop":{"disabled":"a.model.key"}}}' />

&lt;select data-bind='{"options":"a.model.key"}'>&lt;/select>
&lt;!-- is shorthand for: -->
&lt;select data-bind='{"change":{"action":"prop","prop":{"options":"a.model.key"}}}'>&lt;/select>
</pre></code>

    </td>
    <td>set element properties based on model data keys</td>
</tr>
<tr>
    <td><code>html</code> / <code>text</code></td>
    <td><code>view.do_html</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"html":"a.model.key"}'>&lt;/div>
&lt;span data-bind='{"text":"a.model.key"}'>&lt;/span>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"html","key":"a.model.key"}}'>&lt;/div>
&lt;span data-bind='{"change":{"action":"text","key":"a.model.key"}}'>&lt;/span>
</pre></code>

    </td>
    <td>set element html/text property based on model data key</td>
</tr>
<tr>
    <td><code>css</code></td>
    <td><code>view.do_css</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"css":{"color":"a.model.key","background":"another.model.key"}}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"css","css":{"color":"a.model.key","background":"another.model.key"}}}'>&lt;/div>
</pre></code>

    </td>
    <td>set element css style(s) based on model data key(s)</td>
</tr>
<tr>
    <td><code>show</code></td>
    <td><code>view.do_show</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"show":"a.model.key"}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"show","key":"a.model.key"}}'>&lt;/div>
</pre></code>

    </td>
    <td>show/hide element based on model data key (interpreted as *truthy value*)</td>
</tr>
<tr>
    <td><code>hide</code></td>
    <td><code>view.do_hide</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"hide":"a.model.key"}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"hide","key":"a.model.key"}}'>&lt;/div>
</pre></code>

    </td>
    <td>hide/show element based on model data key (interpreted as *truthy value*)</td>
</tr>
<tr>
    <td><code>tpl</code></td>
    <td><code>view.do_tpl</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"click":{"action":"tpl","tpl":"tplID","key":"a.model.key"}}'>&lt;/div>
</pre></code>

    </td>
    <td>element render a template based on model data key</td>
</tr>
<tr>
    <td><code>set</code></td>
    <td><code>view.do_set</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"set":{"key":"akey","value":"aval"}}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"click":{"action":"set","key":"a.model.key","value":"aval"}}'>&lt;/div>
</pre></code>

    </td>
    <td>set/update model data key with given value on a UI event (default "click")</td>
</tr>
<tr>
    <td><code>bind</code></td>
    <td><code>view.do_bind</code></td>
    <td>

<code><pre>
&lt;input name="model[a][model][key]" />
&lt;select name="model[another][model][key]">&lt;/select>
</pre></code>

    </td>
    <td>input element default two-way autobind action (automaticaly update value on input elements based on changed model data key or vice-versa)</td>
</tr>
</tbody>
</table>

[/DOC_MARKDOWN]**/
/**[DOC_MARKDOWN]
####Examples 

[See it](https://foo123.github.io/examples/modelview-todomvc/hello-world.html)


**markup**

```html
<div id="screen">
    Hello $(model.msg) &nbsp;&nbsp;(updated live on <i>change</i>)
    <br /><br />
    <input type="text" name="model[msg]" size="50" value="" />
    <button class="button" title="$(model.msg)" data-bind='{"click":"alert_msg"}'>Hello</button>
    <button class="button" data-bind='{"set":{"key":"msg","value":"You"}}'>Hello You</button>
    <button class="button" data-bind='{"click":"hello_world"}'>Hello World</button>
</div>
```

**javascript** (*standalone*)
```javascript
// standalone

new ModelView.View(
    'view', 
    new ModelView.Model(
        'model', 
        // model data here ..
        { msg: 'Earth!' }
    )
    // model data type-casters (if any) here ..
    .types({ msg: ModelView.Type.Cast.STR })
    // model data validators (if any) here ..
    .validators({ msg: ModelView.Validation.Validate.NOT_EMPTY })
)
.shortcuts({
    'alt+h': 'alert_msg'
})
.actions({
    // custom view actions (if any) here ..
    alert_msg: function( evt, el, bindData ) {
        alert( this.$model.get('msg') );
        // this also works
        //alert( this.model().get('msg') );
        // or even this, if you want the raw data without any processing
        //alert( this.$model.$data.msg );
    },
    hello_world: function( evt, el, bindData ) {
        // set msg to "World" and publish the change
        this.$model.set('msg', "World", true);
    }
})
.attribute( 'bind', 'data-bind' ) // default
.livebind( '$(__MODEL__.__KEY__)' )
.autobind( true )
.isomorphic( false ) // default
.bind( [ 'change', 'click' ], document.getElementById('screen') )
.sync( )
;
```

**javascript** (*as a jquery plugin/widget, include the jquery.modelview.js file*)
```javascript
// as a jQuery plugin/widget

// make sure the modelview jQuery plugin is added if not already
if ( ModelView.jquery ) ModelView.jquery( $ );
$('#screen').modelview({
    id: 'view',
    
    bindAttribute: 'data-bind', // default
    events: [ 'change', 'click' ], // default
    livebind: '$(__MODEL__.__KEY__)',
    autobind: true,
    isomorphic: false, // default
    autoSync: true, // default
    
    model: {
        id: 'model',
        
        data: {
            // model data here ..
            msg: 'Earth!'
        },
        
        types: {
            // model data type-casters (if any) here ..
            msg: ModelView.Type.Cast.STR
        },
        
        validators: {
            // model data validators (if any) here ..
            msg: ModelView.Validation.Validate.NOT_EMPTY
        }
    },
    
    shortcuts: {
        'alt+h': 'alert_msg'
    },
    
    actions: {
        // custom view actions (if any) here ..
        alert_msg: function( evt, el, bindData ) {
            alert( this.$model.get('msg') );
            // this also works
            //alert( this.model().get('msg') );
            // or even this, if you want the raw data without any processing
            //alert( this.$model.$data.msg );
        },
        hello_world: function( evt, el, bindData ) {
            // set msg to "World" and publish the change
            this.$model.set('msg', "World", true);
        }
    }
});
```


[/DOC_MARKDOWN]**/

// main
// export it
exports['ModelView'] = {

    VERSION: "0.81.1"
    
    ,UUID: uuid
    
    ,Extend: Merge
    
    //,Field: ModelField
    // transfered to Model.Field
    ,Event: DOMEvent
    
    ,Type: Type
    
    ,Validation: Validation
    
    ,PublishSubscribeInterface: PublishSubscribe
    
    ,Cache: Cache
    
    ,Model: Model
    
    ,Tpl: Tpl
    
    ,View: View
};
/**
*
*   ModelView.js (jQuery plugin, jQueryUI widget optional)
*   @version: 0.81.1
*
*   A micro-MV* (MVVM) framework for complex (UI) screens
*   https://github.com/foo123/modelview.js
*
**/
!function( ModelView, window, undef ) {
"use strict";
ModelView.jquery = function( $ ) {
    "use strict";
    
    if ( !$.ModelView )
    {
        // add it to root jQuery object as a jQuery reference
        $.ModelView = ModelView;
        
        var slice = Function.prototype.call.bind( Array.prototype.slice ),
            extend = $.extend, View = ModelView.View, Model = ModelView.Model;
        
        // modelview jQuery plugin
        $.fn.modelview = function( arg0, arg1, arg2 ) {
            var argslen = arguments.length, 
                method = argslen ? arg0 : null, options = arg0,
                isInit = true, optionsParsed = false,  map = [ ]
            ;
            
            // apply for each matched element (better use one element per time)
            this.each(function( ) {
                
                var $dom = $(this), model, view, defaultModel, defaultOptions;
                
                // modelview already set on element
                if ( $dom.data( 'modelview' ) )
                {
                    isInit = false;
                    
                    view = $dom.data( 'modelview' );
                    model = view.$model;
                    
                    // methods
                    if ( 'view' === method ) 
                    {
                        map.push( view );
                    }
                    else if ( 'model' === method ) 
                    {
                        if ( argslen > 1 )
                        {
                            view.model( arg1 ); 
                            return this;
                        }
                            
                        map.push( model );
                    }
                    else if ( 'data' === method ) 
                    {
                        if ( argslen > 1 )
                        {
                            model.data( arg1 ); 
                            return this;
                        }
                            
                        map.push( model.data( ) );
                    }
                    else if ( 'sync' === method ) 
                    {
                        view.sync( arg1 );
                    }
                    else if ( 'reset' === method ) 
                    {
                        view.reset( );
                    }
                    else if ( 'dispose' === method ) 
                    {
                        $dom.data( 'modelview', null );
                        view.dispose( );
                    }
                    
                    return this;
                }
                
                if ( !optionsParsed )
                {
                    defaultModel = {
                        id: 'model'
                        ,data: { }
                        ,types: { }
                        ,validators: { }
                        ,getters: { }
                        ,setters: { }
                        ,dependencies: { }
                    };
                    defaultOptions = {
                        
                        viewClass: View
                        ,modelClass: Model
                        
                        ,id: 'view'
                        ,bindAttribute: 'data-bind' // default
                        ,livebind: null
                        ,autobind: false
                        ,isomorphic: false
                        ,bindbubble: false
                        ,autovalidate: true
                        ,events: null
                        ,autoSync: true
                        ,cacheSize: View._CACHE_SIZE
                        ,refreshInterval: View._REFRESH_INTERVAL
                        
                        ,model: null
                        ,template: null
                        ,actions: { }
                        ,handlers: { }
                        ,shortcuts: { }
                    };
                    // parse options once
                    options = extend( {}, defaultOptions, options );
                    
                    if ( options.model && !(options.model instanceof Model) )
                    {
                        options.model = extend( {}, defaultModel, options.model );
                    }
                    
                    optionsParsed = true;
                }
                
                if ( !options.model ) return this;
                
                model = (options.model instanceof Model) 
                        ? options.model 
                        : new options.modelClass(
                            options.model.id, 
                            options.model.data, 
                            options.model.types, 
                            options.model.validators, 
                            options.model.getters, 
                            options.model.setters,
                            options.model.dependencies
                        )
                    ;
                
                view = new options.viewClass(
                    options.id, model, 
                    { bind: options.bindAttribute || 'data-bind' },
                    options.cacheSize, options.refreshInterval
                )
                // custom view template renderer
                .template( options.template )
                // custom view event handlers
                .events( options.handlers )
                // custom view hotkeys/keyboard shortcuts
                .shortcuts( options.shortcuts )
                // custom view actions
                .actions( options.actions )
                // init view
                .livebind( options.livebind )
                .autobind( options.autobind )
                .isomorphic( options.isomorphic )
                .bindbubble( options.bindbubble )
                .autovalidate( options.autovalidate )
                .bind( options.events, $dom[0] )
                ;
                $dom.data( 'modelview', view );
                if ( options.autoSync ) view.sync( );
            });
            
            // chainable or values return
            return ( !isInit && map.length ) ? ( 1 == this.length ? map[ 0 ] : map ) : this;
        };
    }
    
    // add modelview as a jQueryUI widget as well if jQueryuI is loaded
    // to create state-full, self-contained, full-MVC widgets (e.g calendars, grids, etc..)
    if ( $.widget && (!$.mvc || !$.mvc.ModelViewWidget) )
    {
        $.widget( 'mvc.ModelViewWidget', {
            
            options: { },
            $view: null,
            
            _create: function() {
                var self = this;
                self.$view = self.element.modelview( self.options ).modelview( 'view' );
            },
            
            value: function( k, v ) {
                var self = this;
                if ( 1 < arguments.length ) 
                {
                    self.$view.$model.set( k, v, 1 );
                    return self.element;
                }
                return self.$view.$model.get( k );
            },
            
            view: function( ) {
                return this.$view;
            },
            
            model: function( ) {
                return this.$view.$model;
            },
            
            _destroy: function() {
                var self = this.
                self.$view = null;
                self.element.modelview( 'dispose' );
            }
        });
    }
};

// add to jQuery if available/accesible now
if ( 'undefined' !== typeof window.jQuery ) ModelView.jquery( window.jQuery );
}( exports['ModelView'], this );

/* main code ends here */
/* export the module */
return exports["ModelView"];
});