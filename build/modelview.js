/**
*
*   ModelView.js
*   @version: 0.53
*
*   A simple/extendable MV* (MVVM) framework
*   optionaly integrates into both jQuery as MVVM plugin and jQueryUI as MVC widget
*   https://github.com/foo123/modelview.js
*
**/!function( root, name, factory ) {
    "use strict";
    
    //
    // export the module, umd-style (no other dependencies)
    var isCommonJS = ("object" === typeof(module)) && module.exports, 
        isAMD = ("function" === typeof(define)) && define.amd, m;
    
    // CommonJS, node, etc..
    if ( isCommonJS ) 
        module.exports = (module.$deps = module.$deps || {})[ name ] = module.$deps[ name ] || (factory.call( root, {NODE:module} ) || 1);
    
    // AMD, requireJS, etc..
    else if ( isAMD && ("function" === typeof(require)) && ("function" === typeof(require.specified)) && require.specified(name) ) 
        define( name, ['require', 'exports', 'module'], function( require, exports, module ){ return factory.call( root, {AMD:module} ); } );
    
    // browser, web worker, etc.. + AMD, other loaders
    else if ( !(name in root) ) 
        (root[ name ] = (m=factory.call( root, {} ) || 1)) && isAMD && define( name, [], function( ){ return m; } );


}(  /* current root */          this, 
    /* module name */           "ModelView",
    /* module factory */        function( exports ) {
        
    /* main code starts here */

/**
*
*   ModelView.js
*   @version: 0.53
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
**/
    
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
    Func = Function, FP = Func[proto], Str = String, SP = Str[proto], FPCall = FP.call,
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    /*hasProp = bindF(FPCall, OP.hasOwnProperty),*/ toStr = bindF(FPCall, OP.toString), slice = bindF(FPCall, AP.slice),
    newFunc = function( args, code ){ return new Func(args, code); },
    is_instance = function( o, T ){ return o instanceof T; },
    
    tostr = function( s ){ return Str(s); },
    INF = Infinity, rnd = Math.random, 
    
    esc_re = function( s ) { return s.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); },
    
    del = function( o, k, soft ) { 
        o[k] = undef; if ( !soft ) delete o[k];
        return o;
    },
    
    // types
    T_NUM = 2, T_NAN = 3, /*T_INF = 3,*/ T_BOOL = 4, T_STR = 8, T_CHAR = 9,
    T_ARRAY = 16, T_OBJ = 32, T_FUNC = 64, T_REGEX = 128,  
    T_NULL = 256, T_UNDEF = 512, T_UNKNOWN = 1024, 
    T_ARRAY_OR_OBJ = T_ARRAY | T_OBJ, T_ARRAY_OR_STR = T_ARRAY | T_STR,
    TO_STRING = {
        "[object Array]"    : T_ARRAY,
        "[object RegExp]"   : T_REGEX,
        "[object Number]"   : T_NUM,
        "[object String]"   : T_STR,
        "[object Function]" : T_FUNC,
        "[object Object]"   : T_OBJ
    },
    get_type = function( v ) {
        var /*type_of,*/ to_string;
        
        if (null === v)  return T_NULL;
        else if (true === v || false === v)  return T_BOOL;
        else if (undef === v /*|| "undefined" === type_of*/)  return T_UNDEF;
        
        //type_of = typeOf(v);
        to_string = toString.call( v );
        //to_string = TO_STRING[HAS](to_string) ? TO_STRING[to_string] : T_UNKNOWN;
        to_string = TO_STRING[to_string] || T_UNKNOWN;
        
        //if (undef === v /*|| "undefined" === type_of*/)  return T_UNDEF;
        if (T_NUM === to_string || v instanceof Num)  return isNaN(v) ? T_NAN : T_NUM;
        else if (T_STR === to_string || v instanceof Str) return (1 === v.length) ? T_CHAR : T_STR;
        else if (T_ARRAY === to_string || v instanceof Arr)  return T_ARRAY;
        else if (T_REGEX === to_string || v instanceof Regex)  return T_REGEX;
        else if (T_FUNC === to_string || v instanceof Func)  return T_FUNC;
        else if (T_OBJ === to_string)  return T_OBJ;
        // unkown type
        return T_UNKNOWN;
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
    ATTR = 'getAttribute', SET_ATTR = 'setAttribute', 
    CHECKED = 'checked', DISABLED = 'disabled', SELECTED = 'selected',
    NAME = 'name', TAG = 'tagName', TYPE = 'type', VAL = 'value', 
    OPTIONS = 'options', SELECTED_INDEX = 'selectedIndex', PARENT = 'parentNode',
    STYLE = 'style', CLASS = 'className', HTML = 'innerHTML', TEXT = 'innerText', TEXTC = 'textContent',
    
    // http://youmightnotneedjquery.com/
    $id = function( id, el ) {
        return [ (el || document).getElementById( id ) ];
    },
    $tag = function( tagname, el ) {
        return AP.slice.call( (el || document).getElementsByTagName( tagname ), 0 );
    },
    $sel = function( selector, el, single ) {
        return true === single 
            ? [ (el || document).querySelector( selector ) ]
            : AP.slice.call( (el || document).querySelectorAll( selector ), 0 )
        ;
    },
    
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
    get_style = window.getComputedStyle 
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
                ( !opt[PARENT][DISABLED] || "optgroup" !== opt[PARENT][TAG] ) 
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
        var values = [ ].concat( v ).map( tostr ), 
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
        switch( el[TAG].toLowerCase( ) )
        {
            case 'textarea':case 'input': return el[VAL];
            case 'select': return select_get( el );
            default: return (TEXTC in el) ? el[TEXTC] : el[TEXT];
        }
    },
    
    set_val = function( el, v ) {
        if ( !el ) return;
        switch( el[TAG].toLowerCase( ) )
        {
            case 'textarea':case 'input': el[VAL] = Str(v); break;
            case 'select': select_set( el, v ); break;
            default: 
                if ( TEXTC in el ) el[TEXTC] = Str(v); 
                else el[TEXT] = Str(v);
                break;
        }
    },
    
    notEmpty = function( s ){ return s.length > 0; }, SPACES = /\s+/g,
    
    // adapted from jQuery
    getNS = function( evt ) {
        var ns = evt.split('.'), e = ns[ 0 ];
        ns = ns.slice( 1 ).filter( notEmpty );
        return [e, ns.sort( )];
    },
    getNSMatcher = function( givenNamespaces ) {
        return givenNamespaces.length 
            ? new Regex( "(^|\\.)" + givenNamespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) 
            : false;
    },
    
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
    
    Node = function( val, next ) {
        this.v = val || null;
        this.n = next || {};
    },
    
    WILDCARD = "*", NAMESPACE = "modelview",
    
    // UUID counter for Modelviews
    _uuid = 0,
        
    // get a Universal Unique Identifier (UUID)
    uuid =  function( namespace ) {
        return [ namespace||'UUID', ++_uuid, NOW( ) ].join( '_' );
    }
;


//
// DOM Events polyfils and delegation

// adapted from https://github.com/jonathantneal/EventListener
if ( this.Element && /*this.Element[proto].attachEvent &&*/ !this.Element[proto].addEventListener )
!function( ){
    
    function addToPrototype( name, method ) 
    {
        Window[proto][name] = HTMLDocument[proto][name] = Element[proto][name] = method;
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
        var self = this, PB = self.$PB, queue, q, i, l, ns, ns_evt;
        ns = getNS( evt ); evt = ns[ 0 ]; ns_evt = 'evt_' + evt;
        if ( PB[HAS](ns_evt) && (queue=PB[ns_evt]) && (l=queue.length) )
        {
            q = queue.slice( 0 ); ns = ns[1].join('.');
            evt = new PBEvent( evt, self, ns );
            for (i=0; i<l; i++) 
            {
                q[ i ][ 3 ] = 1; // handler called
                if ( false === q[ i ][ 0 ]( evt, data ) ) break;
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
    
    ,dispose: function( ) {
        var self = this;
        self.$store = null;
        self.$size = null;
        self.$interval = null;
        return self;
    }

    ,reset: function( ) {
        this.$store = { };
        return this;
    }
    
    ,size: function( size ) {
        if ( arguments.length )
        {
            if ( size > 0 ) this.$size = size;
            return this;
        }
        return this.$size;
    }
    
    ,interval: function( interval ) {
        if ( arguments.length )
        {
            if ( interval > 0 ) this.$interval = interval;
            return this;
        }
        return this.$interval;
    }
    
    ,has: function( key ) {
        var self = this, sk = key ? self.$store[ '_'+key ] : null;
        return !!(sk && ( NOW( ) - sk.time ) <= self.$interval);
    }
    
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
    
    ,del: function( key ) {
        var k = key ? ('_'+key) : null;
        if ( k && this.$store[HAS]( k ) ) delete this.$store[ k ];
        return this;
    }

    ,toString: function( ) {
        return '[ModelView.Cache]';
    }
};

//
// Data Types / Validators for Models (Static)
var 
    ModelField = function( modelField ) {
        if ( !is_instance(this, ModelField) ) return new ModelField( modelField );
        this.f = modelField || null;
    },
    
    CollectionEach = function( f ) {
        if ( !is_instance(this, CollectionEach) ) return new CollectionEach( f );
        this.f = f || null;
    },
    
    bindFieldsToModel = function( /*model,*/ fields ) {
        // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
        var p, t;
        for ( p in fields )
        {
            if ( fields[HAS](p) )
            {
                t = fields[ p ];
                if ( is_instance( t, CollectionEach ) )
                {
                    fields[ p ] = t.f;//bindF( t.f, model );
                    fields[ p ].fEach = 1;
                }
                else
                {
                    fields[ p ] = t;//bindF( t, model );
                }
            }
        }
        return fields;
    },
    
    // Type Compositor
    TC = function TC( T ) {
        
        T.BEFORE = function( T2 ) {
            return TC(function( v, k ) { 
                var self = this;
                return T2.call(self, T.call(self, v, k), k);
            }); 
        };
        T.AFTER = function( T2 ) {
            return TC(function( v, k ) { 
                var self = this;
                return T.call(self, T2.call(self, v, k), k);
            }); 
        };
        
        return T;
    },
        
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
        
        V.EQ = function( V2 ) { 
            return VC(function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 == r2;
            }); 
        };
        
        V.NEQ = function( V2 ) { 
            return VC(function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 != r2;
            }); 
        };
        
        return V;
    },
    
    Type = {
        
        TypeCaster: TC
        
        // default type casters
        ,Cast: {
            // collection for each item type caster
            EACH: CollectionEach,
            
            // type caster for each specific field of an object
            FIELDS: function( typesPerField ) {
                //var notbinded = true;
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                typesPerField = bindFieldsToModel( Merge( {}, typesPerField || {} ) );
                return TC(function( v ) { 
                    var self = this, field, type, val, l, i;
                    //if ( notbinded ) { bindFieldsToModel( this, typesPerField ); notbinded = false; }
                    for ( field in typesPerField )
                    {
                        if ( typesPerField[HAS](field) )
                        {
                            type = typesPerField[ field ]; val = v[ field ];
                            if ( type.fEach && is_type(val, T_ARRAY) )
                            {
                               l = val.length;
                               for (i=0; i<l; i++) val[ i ] = type.call( self, val[ i ] );
                               v[ field ] = val;
                            }
                            else
                            {
                                v[ field ] = type.call( self, val );
                            }
                        }
                    }
                    return v;
                }); 
            },
            
            DEFAULT: function( defaultValue ) {  
                return TC(function( v ) { 
                    var T = get_type( v );
                    if ( (T_UNDEF & T) || ((T_STR & T) && !trim(v).length)  ) v = defaultValue;
                    return v;
                }); 
            },
            BOOL: TC(function( v ) { 
                return !!v; 
            }),
            INT: TC(function( v ) { 
                return parseInt(v, 10);
            }),
            FLOAT: TC(function( v ) { 
                return parseFloat(v, 10); 
            }),
            MIN: function( m ) {  
                return TC(function( v ) { return (v < m) ? m : v; }); 
            },
            MAX: function( M ) {  
                return TC(function( v ) { return (v > M) ? M : v; }); 
            },
            CLAMP: function( m, M ) {  
                // swap
                if ( m > M ) { var tmp = M; M = m; m = tmp; }
                return TC(function( v ) { return (v < m) ? m : ((v > M) ? M : v); }); 
            },
            TRIM: TC(function( v ) { 
                return trim(Str(v));
            }),
            LCASE: TC(function( v ) { 
                return Str(v).toLowerCase( );
            }),
            UCASE: TC(function( v ) { 
                return Str(v).toUpperCase( );
            }),
            STR: TC(function( v ) { 
                return (''+v); 
            })
        }
        
        ,add: function( type, handler ) {
            if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) 
                Type.Cast[ type ] = is_type( handler.AFTER, T_FUNC ) ? handler : TC( handler );
            return Type;
        }
        
        ,del: function( type ) {
            if ( is_type( type, T_STR ) && Type.Cast[HAS]( type ) ) delete Type.Cast[ type ];
            return Type;
        }
    
        ,toString: function( ) {
            return '[ModelView.Type]';
        }
    },
    
    Validation = {
        
        Validator: VC
        
        // default validators
        ,Validate: {
            // collection for each item validator
            EACH: CollectionEach,
            
            // validator for each specific field of an object
            FIELDS: function( validatorsPerField ) {
                //var notbinded = true;
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                validatorsPerField = bindFieldsToModel( Merge( {}, validatorsPerField || {} ) );
                return VC(function( v ) { 
                    var self = this, field, validator, val, l, i;
                    //if ( notbinded ) { bindFieldsToModel( this, validatorsPerField ); notbinded = false; }
                    for ( field in validatorsPerField )
                    {
                        if ( validatorsPerField[HAS](field) )
                        {
                            validator = validatorsPerField[ field ]; val = v[ field ];
                            if ( validator.fEach && is_type(val, T_ARRAY) )
                            {
                               l = val.length;
                               for (i=0; i<l; i++) if ( !validator.call( self, val[ i ] ) )  return false;
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

            NUMERIC: VC(function( v ) { 
                return is_numeric( v ); 
            }),
            NOT_EMPTY: VC(function( v ) { 
                return !!( v && (0 < trim(Str(v)).length) ); 
            }),
            MAXLEN: function( len ) {
                return VC(newFunc("v", "return v.length <= "+len+";")); 
            },
            MINLEN: function( len ) {
                return VC(newFunc("v", "return v.length >= "+len+";")); 
            },
            MATCH: function( regex_pattern ) { 
                return VC(function( v ) { return regex_pattern.test( v ); }); 
            },
            NOT_MATCH: function( regex_pattern ) { 
                return VC(function( v ) { return !regex_pattern.test( v ); }); 
            },
            EQUAL: function( val, strict ) { 
                if ( is_instance(val, ModelField) ) 
                    return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "===" : "==")+" v;")); 
                return false !== strict 
                    ? VC(function( v ) { return val === v; })
                    : VC(function( v ) { return val == v; })
                ; 
            },
            NOT_EQUAL: function( val, strict ) { 
                if ( is_instance(val, ModelField) ) 
                    return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "!==" : "!=")+" v;"));
                return false !== strict 
                    ? VC(function( v ) { return val !== v; })
                    : VC(function( v ) { return val != v; })
                ; 
            },
            GREATER_THAN: function( m, strict ) { 
                if ( is_instance(m, ModelField) ) m = "this.$data."+m.f;
                else if ( is_type(m, T_STR) ) m = '"' + m + '"';
                return VC(newFunc("v", "return "+m+" "+(false !== strict ? "<" : "<=")+" v;")); 
            },
            LESS_THAN: function( M, strict ) { 
                if ( is_instance(M, ModelField) ) M = "this.$data."+M.f;
                else if ( is_type(M, T_STR) ) M = '"' + M + '"';
                return VC(newFunc("v", "return "+M+" "+(false !== strict ? ">" : ">=")+" v;")); 
            },
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
            IN: function( /* vals,.. */ ) { 
                var vals = slice( arguments ); 
                if ( is_type(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                return VC(function( v ) { 
                    return ( -1 < vals.indexOf( v ) ); 
                }); 
            },
            NOT_IN: function( /* vals,.. */ ) { 
                var vals = slice( arguments ); 
                if ( is_type(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                return VC(function( v ) { 
                    return ( 0 > vals.indexOf( v ) ); 
                }); 
            },
            MIN_ITEMS: function( limit, item_filter ) {
                limit = parseInt(limit, 10);
                if ( T_FUNC === get_type(item_filter) )
                    return VC(function( v ) {
                        return v.length >= limit && v.filter( item_filter ).length >= limit;
                    });
                else
                    return VC(function( v ) {
                        return v.length >= limit;
                    });
            },
            MAX_ITEMS: function( limit, item_filter ) {
                limit = parseInt(limit, 10);
                if ( T_FUNC === get_type(item_filter) )
                    return VC(function( v ) {
                        return v.filter( item_filter ).length <= limit;
                    });
                else
                    return VC(function( v ) {
                        return v.length <= limit;
                    });
            }
        }
        
        ,add: function( type, handler ) {
            if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) 
                Validation.Validate[ type ] = is_type( handler.XOR, T_FUNC ) ? handler : VC( handler );
            return Validation;
        }
        
        ,del: function( type ) {
            if ( is_type( type, T_STR ) && Validation.Validate[HAS]( type ) ) delete Validation.Validate[ type ];
            return Validation;
        }
    
        ,toString: function( ) {
            return '[ModelView.Validation]';
        }
    }
;

// Model utils
var 
    getNext = function( a, k ) {
        if ( !a ) return null;
        var b = [ ], i, ai, l = a.length;
        for (i=0; i<l; i++)
        {
            ai = a[ i ];
            if ( ai )
            {
                if ( ai[HAS]( k ) ) b.push( ai[ k ].n );
                if ( ai[HAS]( WILDCARD ) ) b.push( ai[ WILDCARD ].n );
            }
        }
        return b.length ? b : null;
    },
    
    getValue = function( a, k ) {
        if ( !a ) return null;
        var i, ai, l = a.length;
        if ( k )
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
    
    walkadd = function( v, p, obj, isCollectionEach ) {
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
    
    walkcheck = function( p, obj, aux, C ) {
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
                    a && (a = getNext( a, k ));
                }
                else if ( !a || !(a = getNext( a, k )) )
                {
                    return false;
                }
            }
            else
            {
                if ( a && getValue( a, k ) ) return true;
                else if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) ) return true;
                else if ( T_OBJ === to && 'length' == k ) return true;
                return false;
            }
        }
        return false;
    },
    
    walk2 = function( p, obj, aux, C ) {
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
                    a && (a = getNext( a, k ));
                }
                else if ( !a || !(a = getNext( a, k )) )
                {
                    return false;
                }
            }
            else
            {
                if ( a && (a = getValue( a, k )) ) return [false, a];
                else if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) ) return [true, o[k]];
                else if ( T_OBJ === to && 'length' == k ) return [true, Keys(o).length];
                return false;
            }
        }
        return false;
    },
    
    walk2v = function( p, obj, aux, C ) {
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
                    else if ( !a || !(a = getNext( a, k )) ) return false;
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
                else if ( a /*&& getValue( a, k )*/ && (to&T_ARRAY_OR_OBJ) && o[HAS](k) ) return [true, o, k, a];
                return false;
            }
        }
        return false;
    },
    
    walk3 = function( p, obj, aux1, aux2, aux3, C, all3 ) {
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
                        a1 = getNext( a1, k );
                        a2 = getNext( a2, k );
                        a3 = getNext( a3, k );
                    }
                }
                // fixed, it bypassed setters which had multiple virtual levels
                else if ( all3 && a3 && (a3 = getNext( a3, k )) )
                {
                    a1 = getNext( a1, k );
                    a2 = getNext( a2, k );
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
    dotted = function( key ) {
        return key
                .replace(/\[([^\]]*)\]/g, '.$1')         // convert indexes to properties
                .replace(/^\.+/, '')                       // strip a leading dot
                .replace(/\.+$/, '')                       // strip trailing dots
        ;
    },
    
    bracketed = function( dottedKey ) { return '['+dottedKey.split('.').join('][')+']'; },
    
    removePrefix = function( prefix ) {
        // strict mode (after prefix, a key follows)
        var regex = new Regex( '^' + prefix + '([\\.|\\[])' );
        return function( key, to_dotted ) { 
            var k = key.replace( regex, '$1' );
            return to_dotted ? dotted( k ) : k;
        };
    },

    /*keyLevelUp = function( dottedKey, level ) {
        return dottedKey && (0 > level) ? dottedKey.split('.').slice(0, level).join('.') : dottedKey;
    },*/
    
    addModelTypeValidator = function addModelTypeValidator( model, dottedKey, typeOrValidator, modelTypesValidators ) {
        var k, t, isCollectionEach = false;
        t = get_type( typeOrValidator );
        if ( T_FUNC & t )
        {
            isCollectionEach = is_instance( typeOrValidator, CollectionEach );
            // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
            // each wrapper
            if ( isCollectionEach ) typeOrValidator = typeOrValidator.f; //bindF( typeOrValidator.f, model );
            //else typeOrValidator = bindF( typeOrValidator, model );
            // bind the typeOrValidator handler to 'this model'
            walkadd( typeOrValidator, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelTypesValidators, isCollectionEach );
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
    },
    
    addModelGetterSetter = function addModelGetterSetter( model, dottedKey, getterOrSetter, modelGettersSetters ) {
        var k, t;
        t = get_type( getterOrSetter );
        if ( T_FUNC & t )
        {
            // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
            // bind the getterOrSetter handler to 'this model'
            walkadd( getterOrSetter /*bindF( getterOrSetter, model )*/, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelGettersSetters );
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
                
                if ( (r = walk2v( splitKey=dottedKey.split('.'), o=data, validators, modelClass )) )
                {
                    o = r[ 1 ]; key = r[ 2 ];
                    
                    if ( modelClass === r[ 0 ]  ) 
                    {
                        nestedKey = splitKey.slice(0, splitKey.length-key.length).join('.');
                        
                        // nested sub-model
                        res = validateModel( o, modelClass, breakOnError, key.length ? key.join('.') : null );
                        if ( !res.isValid )
                        {
                            result.errors = result.errors.concat( res.errors.map( fixKey ) );
                            result.isValid = false;
                        }
                        if ( !result.isValid && breakOnError ) return result;
                    }
                    else
                    {
                        nestedKey = splitKey.slice(0, -1).join('.');
                        
                        val = o[ key ]; validator = getValue( r[3], key );
                        if ( validator && !validator.call( model, val, dottedKey ) ) 
                        {
                            result.errors.push( dottedKey/*fixKey( key )*/ );
                            result.isValid = false;
                            if ( breakOnError ) return result;
                        }
                        if ( (T_ARRAY_OR_OBJ & get_type( val )) && (validators=getNext( r[3], key )) && validators.length )
                        {
                            nestedKey += !!nestedKey ? ('.' + key) : key;
                            
                            for (key in val)
                            {
                                if ( val[HAS](key) )
                                {
                                    res = validateModel( model, modelClass, breakOnError, key, val, validators );
                                    if ( !res.isValid )
                                    {
                                        result.errors = result.errors.concat( res.errors.map( fixKey ) );
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

//
// Model Class
var Model = function( id, data, types, validators, getters, setters, dependencies ) {
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
    
    ,data: function( d ) {
        var model = this;
        if ( arguments.length )
        {
            model.$data = d;
            return model;
        }
        return model.$data;
    }
    
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
    
    // handle sub-composite models as data, via walking the data
    ,serialize: function( ) {
        return serializeModel( this, Model );
    }
    
    // handle sub-composite models via walking the data and any attached validators
    ,validate: function( breakOnFirstError, dottedKey ) {
        return validateModel( this, Model, !!breakOnFirstError, dottedKey );
    }
    
    ,autovalidate: function( enabled ) {
        var model = this;
        if ( arguments.length )
        {
            model.$autovalidate = !!enabled;
            return model;
        }
        return model.$autovalidate;
    }
    
    ,toJSON: function( dottedKey ) {
        var model = this, json, data, T, e;
        
        if ( arguments.length ) data = model.get( dottedKey );
        else data = model.data( );
        
        try { json = toJSON( serializeModel( model, Model ) ); } 
        catch( e ) { throw e; return; }
        
        return json;
    }
    
    ,fromJSON: function( dataJson, dottedKey, pub ) {
        var model = this, data, e;
        if ( dataJson )
        {
            try { data = fromJSON( dataJson ); } 
            catch( e ) { throw e; return; }
            
            if ( dottedKey ) model.set( dottedKey, data, true === pub );
            else model.data( data );
        }
        return model;
    }
    
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
        else if ( (r = walkcheck( dottedKey.split('.'), data, RAW ? null : getters, Model )) )
        {
            return (true === r) ? true : r[1].has(r[2].join('.'));
        }
        return false;
    }
    
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
        else if ( (r = walk2( dottedKey.split('.'), data, RAW ? null : getters, Model )) )
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
    
    // set/add, it can add last node also if not there
    ,set: function ( dottedKey, val, pub, callData ) {
        var model = this, r, o, k, p,
            type, validator, setter,
            types, validators, setters, ideps,
            prevval, canSet = false,
            autovalidate = model.$autovalidate
        ;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        o = model.$data;
        types = model.$types; 
        validators = model.$validators; 
        setters = model.$setters;
        ideps = model.$idependencies;
        
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
            canSet = true;
        }
        else if ( (r = walk3( dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model )) )
        {
            o = r[ 1 ]; k = r[ 2 ];
            type = getValue( r[4], k );
            validator = getValue( r[5], k );
            setter = getValue( r[6], k );
            
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
                        valuePrev: prevval,
                        $callData: callData
                    });
                    
                    // notify any dependencies as well
                    if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                }
                return model;
            }
            else if ( !setter  && (false === r[0] && r[3].length) )
            {
                // cannot add intermediate values
                return model;
            }
            canSet = true;
        }
        
        if ( canSet )
        {
            if ( type ) val = type.call( model, val, dottedKey );
            if ( validator && !validator.call( model, val, dottedKey ) )
            {
                if ( pub )
                {
                    if ( callData ) callData.error = true;
                    model.publish('error', {
                        key: dottedKey, 
                        value: o[k], 
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
    
    // add/append value (for arrays like structures)
    ,add: function ( dottedKey, val, pub, callData ) {
        var model = this, r, o, k, p,
            type, validator, setter,
            types, validators, setters, ideps,
            canSet = false,
            autovalidate = model.$autovalidate
        ;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        o = model.$data;
        types = model.$types; 
        validators = model.$validators; 
        setters = model.$setters;
        ideps = model.$idependencies;
        
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
        }
        else if ( (r = walk3( dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model )) )
        {
            o = r[ 1 ]; k = r[ 2 ];
            type = getValue( getNext( r[4], k ), WILDCARD );
            validator = getValue( getNext( r[5], k ), WILDCARD );
            setter = getValue( getNext( r[6], k ), WILDCARD );
            
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
                    o.data( val );
                }
                
                if ( pub )
                {
                    model.publish('append', {
                        key: dottedKey, 
                        value: val,
                        $callData: callData
                    });
                    
                    // notify any dependencies as well
                    if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                }
                return model;
            }
            else if ( !setter && (false === r[0] && r[3].length) )
            {
                // cannot add intermediate values or not array
                return model;
            }
            canSet = true;
        }
        
        if ( canSet )
        {
            if ( type ) val = type.call( model, val, dottedKey );
            if ( validator && !validator.call( model, val, dottedKey ) )
            {
                if ( pub )
                {
                    if ( callData ) callData.error = true;
                    model.publish('error', {
                        key: dottedKey, 
                        value: /*val*/undef,
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
                        model.publish('append', {
                            key: dottedKey, 
                            value: val,
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
                o[ k ].push( val );
            }
            else
            {
                // not array-like, do a set operation, in case
                o[ k ] = val;
            }
        
            if ( pub )
            {
                model.publish('append', {
                    key: dottedKey, 
                    value: val,
                    $callData: callData
                });
                
                // notify any dependencies as well
                if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
            }
            if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
        }
        return model;
    }
    
    // delete/remove, with or without re-arranging (array) indexes
    ,del: function( dottedKey, pub, reArrangeIndexes, callData ) {
        var model = this, r, o, k, p, val, canDel = false;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        reArrangeIndexes = !!reArrangeIndexes;
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
        else if ( (r = walk3( dottedKey.split('.'), o, null, null, null, Model, false )) )
        {
            o = r[ 1 ]; k = r[ 2 ];
            
            if ( Model === r[ 0 ] && k.length ) 
            {
                // nested sub-model
                k = k.join('.');
                val = o.get( k );
                o.del( k, reArrangeIndexes, pub, callData ); 
                pub && model.publish('delete', {
                        key: dottedKey, 
                        value: val,
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
            val = o[ k ];
            if ( reArrangeIndexes )
            {
                o[ k ] = undef; T = get_type( o );
                 // re-arrange indexes
                if ( T_ARRAY == T && is_array_index( k ) ) o.splice( +k, 1 );
                else if ( T_OBJ == T ) delete o[ k ];
            }
            else
            {
                delete o[ k ]; // not re-arrange indexes
            }
            pub && model.publish('delete', {
                    key: dottedKey, 
                    value: val,
                    $callData: callData
                });
            
            if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
        }
        return model;
    }
    
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
    
    // shortcut to trigger "model:change" per given key(s) (given as string or array)
    ,notify: function( dottedKey, evt, data ) {
        var model = this, ideps = model.$idependencies, 
            k, l, d, dk, t, deps = [], deps2, keys = {};
        if ( dottedKey )
        {
            t = get_type( dottedKey );
            evt = evt || 'change';  
            d = {key: ''};
            if ( data )
            {
                if ( data[HAS]('value') ) d.value = data.value;
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
                d = {key: ''};
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
Model[proto].rem = Model[proto].del;

// View utils
var
    getInlineTplRE = function( InlineTplFormat, modelID ) {
        return new Regex(
            esc_re( InlineTplFormat )
            .replace('__MODEL__', esc_re( modelID || ''))
            .replace('__KEY__', '(\\S+?)')
        ,'');
    },
    
    joinTextNodes = function( nodes ) {
        var i, l = nodes.length, txt = l ? nodes[0].nodeValue : '';
        if ( l > 1 ) for (i=1; i<l; i++) txt += nodes[i].nodeValue;
        return txt;
    },
    
    namedKeyProp = "mv_namedkey", nUUID = 'mv_uuid',
    // use hexadecimal string representation in order to have optimal key distribution in hash (??)
    nuuid = 0, node_uuid = function( n ) { return n[nUUID] = n[nUUID] || n.id || ('_'+(++nuuid).toString(16)); },
    
    removeKeyTextNodes = function( node, hash, atKeys ) {
        var nid;
        if ( hash && (nid=node[nUUID]) && hash[HAS](nid) ) del(hash, nid);
        if ( node[ATTR](atKeys) ) node.removeAttribute( atKeys );
        return hash;
    },
    
    getKeyTextNodes = function( node, re_key, hash, atKeys ) {
        if ( !re_key ) return hash;
        
        var matchedNodes, matchedAtts, i, l, m, matched, n, a, key, nid, atnodes,
            keyNode, aNodes, aNodesCached, txt, rest, stack, keyNodes, keyAtts
        ;
        
        hash = hash || {};
        if ( node )
        {
            // http://www.geeksforgeeks.org/inorder-tree-traversal-without-recursion/
            /*
            1) Create an empty stack S.
            2) Initialize current node as root
            3) Push the current node to S and set current = current->left until current is NULL
            4) If current is NULL and stack is not empty then 
                 a) Pop the top item from stack.
                 b) Print the popped item, set current = current->right 
                 c) Go to step 3.
            5) If current is NULL and stack is empty then we are done.            
            */
            matchedNodes = [ ]; matchedAtts = [ ]; n = node;
            if ( n.attributes && (l=n.attributes.length) ) 
            {
                for (i=0; i<l; i++)
                {
                    a = n.attributes[ i ];
                    if ( m=a.nodeValue.match(re_key) ) matchedAtts.push([a, m, n]);
                }
            }
            if ( 3 === n.nodeType ) 
            {
                if ( m=n.nodeValue.match(re_key) ) matchedNodes.push([n, m, n[PARENT]]);
            }  
            else if ( n.firstChild )
            {
                stack = [ n=n.firstChild ];
                while ( stack.length ) 
                {
                    if ( n.attributes && (l=n.attributes.length) ) 
                    {
                        for (i=0; i<l; i++)
                        {
                            a = n.attributes[ i ];
                            if ( m=a.nodeValue.match(re_key) ) matchedAtts.push([a, m, n]);
                        }
                    }
                    if ( n.firstChild ) stack.push( n=n.firstChild );
                    else 
                    {
                        if ( 3 === n.nodeType && (m=n.nodeValue.match(re_key)) ) matchedNodes.push([n, m, n[PARENT]]);
                        n = stack.pop( );
                        while ( stack.length && !n.nextSibling ) n = stack.pop( );
                        if ( n.nextSibling ) stack.push( n=n.nextSibling );
                    }
                }
            }
            atnodes = { };
            for (i=0,l=matchedNodes.length; i<l; i++)
            {
                matched = matchedNodes[ i ];
                rest = matched[0]; m = matched[1]; n = matched[2];
                nid = node_uuid( n ); //if ( hash[nid] && hash[nid].keys ) continue;
                hash[nid] = hash[nid] || { }; atnodes[nid] = n;
                hash[nid].keys = hash[nid].keys || { }; keyNodes = hash[nid].keys;
                txt = rest.nodeValue;  
                if ( txt.length > m[0].length )
                {
                    // node contains more text than just the $(key) ref
                    do {
                        key = m[1]; keyNode = rest.splitText( m.index );
                        rest = keyNode.splitText( m[0].length );
                        (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                        m = rest.nodeValue.match( re_key );
                    } while ( m );
                }
                else
                {
                    key = m[1]; keyNode = rest;
                    (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                }
                //if ( !n[ATTR](atKeys) ) n[SET_ATTR](atKeys, 1);
            }
            aNodes = { };
            for (i=0,l=matchedAtts.length; i<l; i++)
            {
                matched = matchedAtts[ i ];
                a = matched[0]; m = matched[1]; n = matched[2];
                nid = node_uuid( n ); //if ( hash[nid] && hash[nid].atts ) continue;
                hash[nid] = hash[nid] || { }; atnodes[nid] = n;
                hash[nid].keys = hash[nid].keys || { }; keyNodes = hash[nid].keys;
                hash[nid].atts = hash[nid].atts || { }; keyAtts = hash[nid].atts;
                txt = a.nodeValue;  aNodesCached = (txt in aNodes);
                if ( !aNodesCached ) 
                {
                    rest = get_textnode( txt ); aNodes[ txt ] = [[], [ rest ]];
                    if ( txt.length > m[0].length )
                    {
                        // attr contains more text than just the $(key) ref
                        do {
                            key = m[1]; 
                            keyNode = rest.splitText( m.index );
                            rest = keyNode.splitText( m[0].length );
                            aNodes[ txt ][0].push( key );
                            aNodes[ txt ][1].push( keyNode ); 
                            aNodes[ txt ][1].push( rest );
                            (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                            (keyAtts[key]=keyAtts[key]||[]).push( [a, aNodes[ txt ][1], txt] );
                            m = rest.nodeValue.match( re_key );
                        } while ( m );
                    }
                    else
                    {
                        keyNode = rest;
                        aNodes[ txt ][0].push( key );
                        (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                        (keyAtts[key]=keyAtts[key]||[]).push( [a, aNodes[ txt ][1], txt] );
                    }
                }
                else
                {
                    // share txt nodes between same (value) attributes
                    for (m=0; m<aNodes[ txt ][0].length; m++)
                        keyAtts[aNodes[ txt ][0][m]].push( [a, aNodes[ txt ][1], txt] );
                }
                //if ( !n[ATTR](atKeys) ) n[SET_ATTR](atKeys, 1);
            }
            key = Keys( atnodes );
            for (m=0; m<key.length; m++)
            {
                n = atnodes[ nid=key[m] ];
                n[SET_ATTR](atKeys, '|'+Keys(hash[nid].keys).join('|'));
            }
        }
        return hash;
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
    
    doBindAction = function( view, elements, evt, fromModel ) {
        var model = view.$model, isSync = 'sync' == evt.type, 
            event = isSync ? 'change' : evt.type, i, l = elements.length,
            modelkey = fromModel && fromModel.key ? fromModel.key : null,
            notmodelkey = !modelkey,
            modelkeyDot = modelkey ? (modelkey+'.') : null,
            el, bind, do_action, name, key, 
            isAtom = model.atomic, atom = model.$atom,
            atomDot = isAtom ? (atom+'.') : null
        ;
            
        for (i=0; i<l; i++)
        {
            el = elements[i]; if ( !el ) continue;
            bind = getBindData( event, view.attr(el, 'bind') );
            // during sync, dont do any actions based on (other) events
            if ( !bind || !bind[HAS]("action") ) continue;
            
            do_action = 'do_' + bind.action;
            if ( !is_type( view[ do_action ], T_FUNC ) ) continue;
            
            name = el[NAME]; key = bind.key;
            if ( !key )
            {
                if  ( !el[namedKeyProp] && !!name ) el[namedKeyProp] = model.key(name, 1);
                key = el[namedKeyProp];
            }
            // "model:change" event and element does not reference the (nested) model key
            // OR model atomic operation(s)
            if ( (isAtom && key && ((atom === key) || startsWith( key, atomDot ))) || (modelkey && !key) ) continue;
            
            if ( notmodelkey || key === modelkey || startsWith( key, modelkeyDot ) )
                view[ do_action ]( evt, el, bind );
        }
    },
    
    doAutoBindAction = function( view, elements, evt, fromModel ) {
        var model = view.$model, cached = { }, i, l = elements.length,
            el, name, key, ns_key, value
        ;
        
        for (i=0; i<l; i++)
        {
            el = elements[i];  if ( !el ) continue;
            name = el[NAME]; key = 0;
            if ( !el[namedKeyProp] && !!name ) el[namedKeyProp] = model.key( name, 1 );
            key = el[namedKeyProp]; if ( !key ) continue;
            
            // use already cached key/value
            ns_key = '_'+key;
            if ( cached[HAS]( ns_key ) )  value = cached[ ns_key ][ 0 ];
            else if ( model.has( key ) ) cached[ ns_key ] = [ value=model.get( key ) ];
            else continue;  // nothing to do here
            
            // call default action (ie: live update)
            view.do_bind( evt, el, {name:name, key:key, value:value} );
        }
    },
    
    doLiveBindAction = function( view, elements, evt, key, val ) {
        var model = view.$model, els_len = elements.length, el, e, att,
            i, nodes, l, keys, k, kk, nkk, kl, v, keyDot, keyNodes, keyAtts,
            isSync = 'sync' == evt.type, hash = view.$keynodes, cached = { }, nid
        ;
        
        if ( !hash ) return;
        
        if ( key )
        {
            keyDot = key + '.'; val = '' + model.get(key); //val;
            for (e=0; e<els_len; e++)
            {
                el = elements[ e ]; if ( !el || !(nid=el[nUUID]) || !hash[HAS](nid) ) continue;
                
                // element live text nodes
                if ( (keyNodes=hash[nid].keys) )
                {
                    if ( keyNodes[HAS](key) )
                    {
                        nodes=keyNodes[key];
                        for (i=0,l=nodes.length; i<l; i++) nodes[i].nodeValue = val;
                    }
                    keys = Keys(keyNodes);
                    for (k=0,kl=keys.length; k<kl; k++)
                    {
                        kk = keys[k]; if ( key === kk ) continue;
                        if ( startsWith( kk, keyDot ) && (nodes=keyNodes[kk]).length )
                        {
                            // use already cached key/value
                            nkk = '_' + kk;
                            if ( cached[HAS]( nkk ) ) v = cached[ nkk ][ 0 ];
                            else cached[ nkk ] = [ v='' + model.get( kk ) ];
                            for (i=0,l=nodes.length; i<l; i++) nodes[i].nodeValue = v;
                        }
                    }
                }
                
                // element live attributes
                if ( (keyAtts=hash[nid].atts) )
                {
                    if ( keyAtts && keyAtts[HAS](key) )
                    {
                        nodes=keyAtts[key];
                        for (i=0,l=nodes.length; i<l; i++) nodes[i][0].nodeValue = joinTextNodes( nodes[i][1] );
                    }
                    keys = Keys(keyAtts);
                    for (k=0,kl=keys.length; k<kl; k++)
                    {
                        kk = keys[k]; if ( key === kk ) continue;
                        if ( startsWith( kk, keyDot ) && (nodes=keyAtts[kk]).length )
                        {
                            for (i=0,l=nodes.length; i<l; i++) 
                            {
                                att = nodes[i];
                                // use already cached key/value
                                nkk = '_' + att[2];
                                if ( cached[HAS]( nkk ) ) v = cached[ nkk ][ 0 ];
                                else cached[ nkk ] = [ v=joinTextNodes( att[1] ) ];
                                att[0].nodeValue = v;
                            }
                        }
                    }
                }
            }
        }
        else if ( isSync )
        {
            for (e=0; e<els_len; e++)
            {
                el = elements[ e ]; if ( !el || !(nid=el[nUUID]) || !hash[nid] ) continue;
                
                // element live text nodes
                if ( (keyNodes=hash[nid].keys) )
                {
                    keys = Keys(keyNodes);
                    for (k=0,kl=keys.length; k<kl; k++)
                    {
                        kk = keys[k];
                        if ( (nodes=keyNodes[kk]) && (l=nodes.length) )
                        {
                            // use already cached key/value
                            nkk = '_' + kk;
                            if ( cached[HAS]( nkk ) ) v = cached[ nkk ][ 0 ];
                            else cached[ nkk ] = [ v='' + model.get( kk ) ];
                            for (i=0; i<l; i++) nodes[i].nodeValue = v;
                        }
                    }
                }
                
                // element live attributes
                if ( (keyAtts=hash[nid].atts) )
                {
                    keys = Keys(keyAtts);
                    for (k=0,kl=keys.length; k<kl; k++)
                    {
                        kk = keys[k];
                        if ( (nodes=keyAtts[kk]) && (l=nodes.length) )
                        {
                            for (i=0; i<l; i++) 
                            {
                                att = nodes[i];
                                // use already cached key/value
                                nkk = '_' + att[2];
                                if ( cached[HAS]( nkk ) ) v = cached[ nkk ][ 0 ];
                                else cached[ nkk ] = [ v=joinTextNodes( att[1] ) ];
                                att[0].nodeValue = v;
                            }
                        }
                    }
                }
            }
        }
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

//
// View Class
var View = function( id, model, atts, cacheSize, refreshInterval ) {
    var view = this;
    
    // constructor-factory pattern
    if ( !(view instanceof View) ) return new View( id, model, atts, cacheSize, refreshInterval );
    
    view.namespace = view.id = id || uuid('View');
    if ( !(atts=atts||{})[HAS]('bind') ) atts['bind'] = "data-bind";
    if ( !atts[HAS]('keys') ) atts['keys'] = "data-mvkeys" + (++nuuid);
    view.$atts = atts;
    cacheSize = cacheSize || View._CACHE_SIZE;
    refreshInterval = refreshInterval || View._REFRESH_INTERVAL;
    view.$memoize = new Cache( cacheSize, INF );
    view.$selectors = new Cache( cacheSize, refreshInterval );
    view.$atbind = view.attribute( "bind" );
    view.$atkeys = view.attribute( "keys" );
    view.$shortcuts = { };
    view.$num_shortcuts = 0;
    view.model( model || new Model( ) ).initPubSub( );
};
// STATIC
View._CACHE_SIZE = 600; // cache size
View._REFRESH_INTERVAL = INF; // refresh cache interval
// View implements PublishSubscribe pattern
View[proto] = Merge( Create( Obj[proto] ), PublishSubscribe, {
    
    constructor: View
    
    ,id: null
    ,$dom: null
    ,$model: null
    ,$livebind: null
    ,$autobind: false
    ,$bindbubble: false
    ,$template: null
    ,$atts: null
    ,$memoize: null
    ,$selectors: null
    ,$keynodes: null
    ,$atbind: null
    ,$atkeys: null
    ,$shortcuts: null
    ,$num_shortcuts: null
    
    ,dispose: function( ) {
        var view = this;
        view.unbind( ).disposePubSub( );
        if ( view.$model ) view.$model.dispose( );
        view.$model = null;
        view.$dom = null;
        view.$template = null;
        view.$atts = null;
        view.$memoize.dispose( );
        view.$memoize = null;
        view.$selectors.dispose( );
        view.$selectors = null;
        view.$livebind = null;
        view.$keynodes = null;
        view.$atbind = null;
        view.$atkeys = null;
        view.$shortcuts = null;
        view.$num_shortcuts = null;
        return view;
    }
    
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
    
    ,autovalidate: function( enabled ) {
        if ( arguments.length )
        {
            this.$model.autovalidate( enabled );
            return this;
        }
        return this.$model.autovalidate( );
    }
    
    ,livebind: function( format ) {
        var view = this;
        if ( arguments.length )
        {
            view.$livebind = !!format ? getInlineTplRE( format, view.$model ? view.$model.id : '' ) : null;
            return view;
        }
        return view.$livebind;
    }
    
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
    
    // http://stackoverflow.com/a/11762728/3591273
    ,index: function( node ) {
        var index = 0;
        while ( (node=node.previousSibling) ) index++;
        return index;
    }
    
    // cache selectors for even faster performance
    ,get: function( selector, $dom, addRoot, bypass ) {
        var view = this, selectorsCache = view.$selectors, elements;
        
        $dom = $dom || view.$dom;
        
        if ( bypass || !(elements=selectorsCache.get( selector )) ) 
        {
            elements = $sel( selector, $dom );
            if ( addRoot && $dom[MATCHES](selector) ) elements.push( $dom );
            if ( !bypass ) selectorsCache.set( selector, elements );
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
                    if ( !attbind.domRef && attribute.domRef ) attbind.domRef = attribute.domRef;
                    if ( !attbind.key && attribute.key ) attbind.key = attribute.key;
                }
                
                // parsing is expensive, use memoize cache
                memoizeCache.set( attr, attribute );
            }
            
            return attribute;
        }
        
        return undef;
    }
    
    ,getDomRef: function( el, ref ) {
        // shortcut to get domRefs relative to current element $el, represented as "$this::" in ref selector
        return ( /*ref &&*/ startsWith(ref, "$this::") ) ? $sel( ref.slice( 7 ), el, 1 ) : $sel( ref, null, 1 );
    }
    
    ,add: function( el, and_sync ) {  
        var view = this;
        if ( el )
        {
            if ( !!view.$livebind )
                view.$keynodes = getKeyTextNodes( el, view.$livebind, view.$keynodes, view.$atkeys );
            if ( false !== and_sync ) view.sync( null, el );
        }
        return view;
    }
    
    ,remove: function( el, and_reset ) {  
        var view = this;
        if ( el ) 
        {
            view.$keynodes = removeKeyTextNodes( el, view.$keynodes, view.$atkeys );
            if ( false !== and_reset ) view.$selectors.reset( );
        }
        return view;
    }
    
    ,bind: function( events, dom ) {
        var view = this, model = view.$model,
            sels = getSelectors( view.$atbind, [view.$atkeys], [model.id+'['] ),
            bindSelector = sels[ 0 ], autobindSelector = sels[ 2 ],
            method, evt, namespaced, 
            autobind = view.$autobind, livebind = !!view.$livebind
        ;
        
        events = events || ['change', 'click'];
        view.$dom = dom || document.body;
        
        namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
        
        // live update dom nodes
        if ( livebind )
            view.$keynodes = getKeyTextNodes( view.$dom, view.$livebind, null, view.$atkeys );
        
        // default view/dom binding events
        if ( view.on_view_change && events.length )
        {
            // use one event handler for bind and autobind
            // avoid running same (view) action twice on autobind and bind elements
            DOMEvent( view.$dom ).on( 
                events.map( namespaced ).join( ' ' ), 
                
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
            
            if ( startsWith( method, 'on_document_' ) )
            {
                evt = method.slice(12);
                evt.length && DOMEvent( document.body ).on( 
                    namespaced(evt), 
                    viewHandler( view, method )
                );
            }
            else if ( startsWith( method, 'on_model_' ) )
            {
                evt = method.slice(9);
                evt.length && view.onTo( model, evt, view[ method ] );
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
        
        return view;
    }
    
    ,unbind: function( events, dom ) {
        var view = this, model = view.$model,
            sels = getSelectors( view.$atbind, [view.$atkeys], [model.id+'['] ),
            namespaced, $dom, viewEvent = NSEvent('', view.namespace),
            autobind = view.$autobind, livebind = !!view.$livebind
        ;
        
        events = events || null;
        $dom = dom || view.$dom;
        
        namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
         
        // view/dom change events
        if ( view.on_view_change )
        {
            DOMEvent( $dom ).off( 
                
                events && events.length ? events.map( namespaced ).join(' ') : viewEvent, 
                
                autobind ? [ sels[ 2 ], sels[ 0 ] ].join( ',' ) : sels[ 0 ]
            );
        }
        
        // model events
        view.offFrom( model );
        DOMEvent( $dom ).off( viewEvent );
        DOMEvent( document.body ).off( viewEvent );
        // live update dom nodes
        view.$keynodes = null;
        
        return view;
    }
    
    ,rebind: function( events, $dom ) {
        var view = this;
        // refresh caches
        view.$memoize.reset( );
        view.$selectors.reset( );
        // re-bind to UI
        return view.unbind( ).bind( events, $dom );
    }
    
    ,sync: function( $dom, el ) {
        var view = this, 
            autobind = view.$autobind, livebind = !!view.$livebind, 
            s = getSelectors( view.$atbind, livebind ? [view.$atkeys] : 0, autobind ? [view.$model.id+'['] : 0 ),
            syncEvent = PBEvent('sync', view), binds, autobinds, livebinds, 
            andCache;
        
        view.$selectors.reset( );
        if ( el )
        {
            syncEvent.currentTarget = el;
            binds = view.get( s[ 0 ], el, 0, 1 );
            if ( autobind ) autobinds = view.get( s[ 2 ], el, 0, 1 );
            if ( livebind ) livebinds = view.get( s[ 1 ], el, 1, 1 );
        }
        else
        {
            $dom = $dom || view.$dom; andCache = !($dom === view.$dom);
            binds = view.get( s[ 0 ], $dom, 0, andCache );
            if ( autobind ) autobinds = view.get( s[ 2 ], $dom, 0, andCache );
            if ( livebind ) livebinds = view.get( s[ 1 ], $dom, 1, andCache );
        }
        if ( binds.length ) doBindAction( view, binds, syncEvent );
        if ( autobind && autobinds.length ) doAutoBindAction( view, autobinds, syncEvent );
        if ( livebind && livebinds.length ) doLiveBindAction( view, livebinds, syncEvent );
        return view;
    }
    
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
            checkbox, modeldata = { }
        ;
        
        // update model and propagate to other elements of same view (via model publish hook)
        if ( data.isAutoBind && !!(name=el[NAME]) )
        {
            if ( !el[namedKeyProp] ) el[namedKeyProp] = model.key( name, 1 );
            key = el[namedKeyProp];
            
            if ( key && model.has( key ) )
            {
                if ( 'checkbox' === el[TYPE].toLowerCase( ) )
                {
                    checkbox = view.get('input[type="checkbox"][name="'+name+'"]');
                    
                    if ( checkbox.length > 1 )
                    {
                        val = [ ];
                        checkbox.forEach(function( c ) {
                            val.push( c[CHECKED] ? c[VAL] : '' );
                        });
                    }
                    else if ( el[CHECKED] )
                    {
                        val = el[VAL];
                    }
                    else
                    {
                        val = '';
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
        if ( !modeldata.error && data.isBind ) doBindAction( view, [el], evt/*, data*/ );
        
        // notify any 3rd-party also if needed
        view.publish( 'change', data );
    }
    
    ,on_document_keydown: function( evt, data ) {
        var view = this, view_shortcuts = view.$shortcuts, 
            el = data.el, callback, ret,
            key, code, character, modifiers;
        
        // adapted from shortcuts.js, http://www.openjs.com/scripts/events/keyboard_shortcuts/
        //
        // no hotkeys assigned or text input element is the target, bypass
        if ( !view.$num_shortcuts || 'TEXTAREA' === el.tagName || 'INPUT' === el.tagName ) return;
        
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
            s = getSelectors( view.$atbind, livebind ? [view.$atkeys, data.key] : 0, autobind ? [model.id + bracketed( data.key )] : 0 ),
            bindElements, autoBindElements, liveBindings,  
            notTriggerElem
        ;
        
        bindElements = view.get( s[ 0 ] );
        if ( autobind ) autoBindElements = view.get( s[ 2 ] );
        if ( livebind ) liveBindings = view.get( s[ 1 ], 0, 1 );
        
        // bypass element that triggered the "model:change" event
        if ( data.$callData && data.$callData.$trigger )
        {
            notTriggerElem = function( ele ){ return ele !== data.$callData.$trigger; };
            bindElements = bindElements.filter( notTriggerElem );
            if ( autobind ) autoBindElements = autoBindElements.filter( notTriggerElem );
            data.$callData = null;
        }
        
        // do actions ..
        
        // do view action first
        if ( bindElements.length ) doBindAction( view, bindElements, evt, data );
        // do view autobind action to bind input elements that map to the model, afterwards
        if ( autobind && autoBindElements.length ) doAutoBindAction( view, autoBindElements, evt, data );
        // do view live DOM bindings update action
        if ( livebind && liveBindings.length ) doLiveBindAction( view, liveBindings, evt, data.key, data.value );
    }

    ,on_model_error: function( evt, data ) {
        var view = this, model = view.$model,
            autobind = view.$autobind, livebind = !!view.$livebind, 
            s = getSelectors( view.$atbind, livebind ? [view.$atkeys, data.key] : 0, autobind ? [model.id + bracketed( data.key )] : 0 ),
            bindElements, autoBindElements, liveBindings
        ;

        // do actions ..
        
        // do view bind action first
        if ( (bindElements=view.get( s[ 0 ] )).length ) doBindAction( view, bindElements, evt, data );
        // do view autobind action to bind input elements that map to the model, afterwards
        if ( autobind && (autoBindElements=view.get( s[ 2 ] )).length ) doAutoBindAction( view, autoBindElements, evt, data );
        // do view live DOM bindings update action
        if ( livebind && (liveBindings=view.get( s[ 1 ], 0, 1 )).length ) doLiveBindAction( view, liveBindings, evt, data.key, data.value );
    }
    
    //
    // view "do_action" methods
    //
    
    // NOP action
    ,do_nop: null
    
    // set element(s) attributes/properties according to binding
    ,do_prop: function( evt, el, data ) {
        if ( !is_type(data.prop, T_OBJ) ) return;
        
        var view = this, model = view.$model, 
            prop = data.prop, p, k, v, vT
        ;
        
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
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
                        if ( 'select' === el[TAG] && (T_ARRAY === vT) )
                        {
                            var sel, ii, vl = v.length,
                                _options = '', group = $tag( 'optgroup', el );
                            sel = select_get( el ); // get selected value
                            group = group.length ? group[ 0 ] : el;
                            $tag( 'option', group ).forEach(function( o ){ group.removeChild( o ); });
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
    }
    
    // set element(s) html/text prop based on model key value
    ,do_html: function( evt, el, data ) {
        if ( !data.key ) return;
        var view = this, model = view.$model, key = data.key;
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
        if ( !el || !key || !model.has( key ) ) return;
        el[data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML] = model.get( key );
    }
    
    // set element(s) css props based on model key value
    ,do_css: function( evt, el, data ) {
        if ( !is_type(data.css, T_OBJ) ) return;
        var view = this, model = view.$model, css = data.css, k, p, v;
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[ 0 ];
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
    }
    
    // update/set a model field with a given value
    ,do_set: function( evt, el, data ) {
        var view = this, model = view.$model, key = null, val;
        
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
                if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
                val = get_val( el );
            }
            model.set( key, val, 1 );
        }
    }
    
    // render an element using a custom template and model data
    ,do_tpl: function( evt, el, data ) {
        var view = this, model, 
            key = data.key, tplID = data.tpl,
            mode, html
        ;
        if ( !view.$template || !key || !tplID ) return;
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
        if ( !el ) return;
        
        model = view.$model;
        if ( !key || !model.has( key ) ) return;
        
        mode = data.mode || 'replace';
        if ( 'replace' == mode ) el[HTML] = '';
        html = view.$template( tplID, model.get( key ) );
        if ( html ) el[HTML] += html;
    }
    
    // show/hide element(s) according to binding
    ,do_show: function( evt, el, data ) {
        var view = this, model = view.$model, key = data.key;
        
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
        if ( !el || !key ) return;
        if ( data[HAS]('value') )
        {
            // show if data[key] is value, else hide
            if ( data.value === model.get( key ) ) show(el);
            else hide(el);
        }
        else
        {
            // show if data[key] is true, else hide
            if ( !!model.get( key ) ) show(el);
            else hide(el);
        }
    }
    
    // hide/show element(s) according to binding
    ,do_hide: function( evt, el, data ) {
        var view = this, model = view.$model, key = data.key;
        
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
        if ( !el || !key ) return;
        if ( data[HAS]('value') )
        {
            // hide if data[key] is value, else show
            if ( data.value === model.get( key ) ) hide(el);
            else show(el);
        }
        else
        {
            // hide if data[key] is true, else show
            if ( !!model.get( key ) ) hide(el);
            else show(el);
        }
    }
    
    // default bind/update element(s) values according to binding on model:change
    ,do_bind: function( evt, el, data ) {
        var view = this, model = view.$model, 
            name = data.name, key = data.key, 
            elType = el[TYPE].toLowerCase( ),
            value, valueType
        ;
        
        // use already computed/cached key/value from calling method passed in "data"
        if ( !key ) return;
        value = data.value; valueType = get_type( value );
        
        if ( 'radio' === elType )
        {
            if ( Str(value) == el[VAL] )
            {
                view.get('input[name="'+name+'"]').forEach(function( ele ){
                    if ( el !== ele )
                        ele[CHECKED] = false;
                });
                el[CHECKED] = true;
            }
        }
        
        else if ( 'checkbox' === elType )
        {
            var checkbox = view.get('input[type="checkbox"][name="'+name+'"]'); 
            
            if ( checkbox.length > 1 && (T_ARRAY === valueType) )
            {
                checkbox.forEach(function( cb ) {
                    if ( -1 < value.indexOf( cb[VAL] ) ) cb[CHECKED] = true;
                    else cb[CHECKED] = false;
                });
            }
            
            else
            {
                el[CHECKED] = T_BOOL === valueType ? value : (Str(value) == el[VAL]);
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

// main
// export it
exports['ModelView'] = {

    VERSION: "0.53"
    
    ,UUID: uuid
    
    ,Extend: Merge
    
    ,Field: ModelField
    
    ,Type: Type
    
    ,Validation: Validation
    
    ,Cache: Cache
    
    ,Model: Model
    
    ,View: View
};
/**
*
*   ModelView.js (jQuery plugin, jQueryUI widget optional)
*   @version: 0.53
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