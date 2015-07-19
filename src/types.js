
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
    
    by_length_desc = function( a, b ) {
        return b.length - a.length;
    },
    
    get_alternate_pattern = function( alts ) {
        return alts.sort( by_length_desc ).map( esc_re ).join( '|' );
    },
    
    pad = function( s, len, ch ) {
        var sp = s.toString( ), n = len-sp.length;
        return n > 0 ? new Array(n+1).join(ch||' ')+sp : sp;
    },

    default_date_locale = {
        meridian: { am:'am', pm:'pm', AM:'AM', PM:'PM' },
        ordinal: { ord:{1:'st',2:'nd',3:'rd'}, nth:'th' },
        timezone: [ 'UTC','EST','MDT' ],
        timezone_short: [ 'UTC','EST','MDT' ],
        day: [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ],
        day_short: [ 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ],
        month: [ 'January','February','March','April','May','June','July','August','September','October','November','December' ],
        month_short: [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ]
    },
    
    get_date_pattern = function( format, locale ) {
        locale = locale || default_date_locale;
        
        // (php) date formats
        // http://php.net/manual/en/function.date.php
        var D = {
        // Day --
        // Day of month w/leading 0; 01..31
         d: '(31|30|29|28|27|26|25|24|23|22|21|20|19|18|17|16|15|14|13|12|11|10|09|08|07|06|05|04|03|02|01)'
        // Shorthand day name; Mon...Sun
        ,D: '(' + get_alternate_pattern( locale.day_short ) + ')'
        // Day of month; 1..31
        ,j: '(31|30|29|28|27|26|25|24|23|22|21|20|19|18|17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1)'
        // Full day name; Monday...Sunday
        ,l: '(' + get_alternate_pattern( locale.day ) + ')'
        // ISO-8601 day of week; 1[Mon]..7[Sun]
        ,N: '([1-7])'
        // Ordinal suffix for day of month; st, nd, rd, th
        ,S: '' // added below
        // Day of week; 0[Sun]..6[Sat]
        ,w: '([0-6])'
        // Day of year; 0..365
        ,z: '([1-3]?[0-9]{1,2})'

        // Week --
        // ISO-8601 week number
        ,W: '([0-5]?[0-9])'

        // Month --
        // Full month name; January...December
        ,F: '(' + get_alternate_pattern( locale.month ) + ')'
        // Month w/leading 0; 01...12
        ,m: '(12|11|10|09|08|07|06|05|04|03|02|01)'
        // Shorthand month name; Jan...Dec
        ,M: '(' + get_alternate_pattern( locale.month_short ) + ')'
        // Month; 1...12
        ,n: '(12|11|10|9|8|7|6|5|4|3|2|1)'
        // Days in month; 28...31
        ,t: '(31|30|29|28)'
        
        // Year --
        // Is leap year?; 0 or 1
        ,L: '([01])'
        // ISO-8601 year
        ,o: '(\\d{2,4})'
        // Full year; e.g. 1980...2010
        ,Y: '([12][0-9]{3})'
        // Last two digits of year; 00...99
        ,y: '([0-9]{2})'

        // Time --
        // am or pm
        ,a: '(' + get_alternate_pattern( [
            locale.meridian.am /*|| default_date_locale.meridian.am*/,
            locale.meridian.pm /*|| default_date_locale.meridian.pm*/
        ] ) + ')'
        // AM or PM
        ,A: '(' + get_alternate_pattern( [
            locale.meridian.AM /*|| default_date_locale.meridian.AM*/,
            locale.meridian.PM /*|| default_date_locale.meridian.PM*/
        ] ) + ')'
        // Swatch Internet time; 000..999
        ,B: '([0-9]{3})'
        // 12-Hours; 1..12
        ,g: '(12|11|10|9|8|7|6|5|4|3|2|1)'
        // 24-Hours; 0..23
        ,G: '(23|22|21|20|19|18|17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1|0)'
        // 12-Hours w/leading 0; 01..12
        ,h: '(12|11|10|09|08|07|06|05|04|03|02|01)'
        // 24-Hours w/leading 0; 00..23
        ,H: '(23|22|21|20|19|18|17|16|15|14|13|12|11|10|09|08|07|06|05|04|03|02|01|00)'
        // Minutes w/leading 0; 00..59
        ,i: '([0-5][0-9])'
        // Seconds w/leading 0; 00..59
        ,s: '([0-5][0-9])'
        // Microseconds; 000000-999000
        ,u: '([0-9]{6})'

        // Timezone --
        // Timezone identifier; e.g. Atlantic/Azores, ...
        ,e: '(' + get_alternate_pattern( locale.timezone /*|| default_date_locale.timezone*/ ) + ')'
        // DST observed?; 0 or 1
        ,I: '([01])'
        // Difference to GMT in hour format; e.g. +0200
        ,O: '([+-][0-9]{4})'
        // Difference to GMT w/colon; e.g. +02:00
        ,P: '([+-][0-9]{2}:[0-9]{2})'
        // Timezone abbreviation; e.g. EST, MDT, ...
        ,T: '(' + get_alternate_pattern( locale.timezone_short /*|| default_date_locale.timezone_short*/ ) + ')'
        // Timezone offset in seconds (-43200...50400)
        ,Z: '(-?[0-9]{5})'

        // Full Date/Time --
        // Seconds since UNIX epoch
        ,U: '([0-9]{1,8})'
        // ISO-8601 date. Y-m-d\\TH:i:sP
        ,c: '' // added below
        // RFC 2822 D, d M Y H:i:s O
        ,r: '' // added below
        };
        // Ordinal suffix for day of month; st, nd, rd, th
        var lord = locale.ordinal.ord, lords = [], i;
        for (i in lord) if ( lord[HAS](i) ) lords.push( lord[i] );
        lords.push( locale.ordinal.nth );
        D.S = '(' + get_alternate_pattern( lords ) + ')';
        // ISO-8601 date. Y-m-d\\TH:i:sP
        D.c = D.Y+'-'+D.m+'-'+D.d+'\\\\'+D.T+D.H+':'+D.i+':'+D.s+D.P;
        // RFC 2822 D, d M Y H:i:s O
        D.r = D.D+',\\s'+D.d+'\\s'+D.M+'\\s'+D.Y+'\\s'+D.H+':'+D.i+':'+D.s+'\\s'+D.O;
        
        var re = '', f, i, l;
        for (i=0,l=format.length; i<l; i++)
        {
            f = format.charAt( i );
            re += D[HAS](f) ? D[ f ] : esc_re( f );
        }
        return new Regex('^'+re+'$','');
    },
    
    get_formatted_date = function( d, format, locale ) {
        var formatted_datetime, f, i, l, 
            date_type = get_type( d ), jsdate;
        
        if ( T_STR & date_type ) return d; // already string format, return it
        
        // undefined
        if ( (T_NULL|T_UNDEF) & date_type ) jsdate = new Date( );
        // JS Date
        else if ( T_DATE & date_type ) jsdate = new Date( d );
        // UNIX timestamp (auto-convert to int)
        else if ( T_NUM & date_type ) jsdate =  new Date(d/* * 1000*/);
        
        locale = locale || default_date_locale;
        var D = { }, tzo = jsdate.getTimezoneOffset( ), atzo = abs(tzo), m = jsdate.getMonth( ), jmod10;
        // 24-Hours; 0..23
        D.G = jsdate.getHours( );
        // Day of month; 1..31
        D.j = jsdate.getDate( ); jmod10 = D.j%10;
        // Month; 1...12
        D.n = m + 1;
        // Full year; e.g. 1980...2010
        D.Y = jsdate.getFullYear( );
        // Day of week; 0[Sun]..6[Sat]
        D.w = jsdate.getDay( );
        // ISO-8601 day of week; 1[Mon]..7[Sun]
        D.N = D.w || 7;
        // Day of month w/leading 0; 01..31
        D.d = pad(D.j, 2, '0');
        // Shorthand day name; Mon...Sun
        D.D = locale.day_short[ D.w ];
        // Full day name; Monday...Sunday
        D.l = locale.day[ D.w ];
        // Ordinal suffix for day of month; st, nd, rd, th
        D.S = locale.ordinal.ord[ D.j ] ? locale.ordinal.ord[ D.j ] : (locale.ordinal.ord[ jmod10 ] ? locale.ordinal.ord[ jmod10 ] : locale.ordinal.nth);
        // Day of year; 0..365
        D.z = round((new Date(D.Y, m, D.j) - new Date(D.Y, 0, 1)) / 864e5);
        // ISO-8601 week number
        D.W = pad(1 + round((new Date(D.Y, m, D.j - D.N + 3) - new Date(D.Y, 0, 4)) / 864e5 / 7), 2, '0');
        // Full month name; January...December
        D.F = locale.month[ m ];
        // Month w/leading 0; 01...12
        D.m = pad(D.n, 2, '0');
        // Shorthand month name; Jan...Dec
        D.M = locale.month_short[ m ];
        // Days in month; 28...31
        D.t = (new Date(D.Y, m+1, 0)).getDate( );
        // Is leap year?; 0 or 1
        D.L = D.Y % 4 === 0 & D.Y % 100 !== 0 | D.Y % 400 === 0;
        // ISO-8601 year
        D.o = D.Y + (11 === m && D.W < 9 ? 1 : (0 === m && D.W > 9 ? -1 : 0));
        // Last two digits of year; 00...99
        D.y = D.Y.toString( ).slice(-2);
        // am or pm
        D.a = D.G > 11 ? locale.meridian.pm : locale.meridian.am;
        // AM or PM
        D.A = D.G > 11 ? locale.meridian.PM : locale.meridian.AM;
        // Swatch Internet time; 000..999
        D.B = pad(floor((jsdate.getUTCHours( ) * 36e2 + jsdate.getUTCMinutes( ) * 60 + jsdate.getUTCSeconds( ) + 36e2) / 86.4) % 1e3, 3, '0');
        // 12-Hours; 1..12
        D.g = (D.G % 12) || 12;
        // 12-Hours w/leading 0; 01..12
        D.h = pad(D.g, 2, '0');
        // 24-Hours w/leading 0; 00..23
        D.H = pad(D.G, 2, '0');
        // Minutes w/leading 0; 00..59
        D.i = pad(jsdate.getMinutes( ), 2, '0');
        // Seconds w/leading 0; 00..59
        D.s = pad(jsdate.getSeconds( ), 2, '0');
        // Microseconds; 000000-999000
        D.u = pad(jsdate.getMilliseconds( ) * 1000, 6, '0');
        // Timezone identifier; e.g. Atlantic/Azores, ...
        // The following works, but requires inclusion of the very large
        // timezone_abbreviations_list() function.
        /*              return that.date_default_timezone_get();
        */
        D.e = '';
        // DST observed?; 0 or 1
        D.I = ((new Date(D.Y, 0) - Date.UTC(D.Y, 0)) !== (new Date(D.Y, 6) - Date.UTC(D.Y, 6))) ? 1 : 0;
        // Difference to GMT in hour format; e.g. +0200
        D.O = (tzo > 0 ? "-" : "+") + pad(floor(atzo / 60) * 100 + atzo % 60, 4, '0');
        // Difference to GMT w/colon; e.g. +02:00
        D.P = (D.O.substr(0, 3) + ":" + D.O.substr(3, 2));
        // Timezone abbreviation; e.g. EST, MDT, ...
        D.T = 'UTC';
        // Timezone offset in seconds (-43200...50400)
        D.Z = -tzo * 60;
        // Seconds since UNIX epoch
        D.U = jsdate / 1000 | 0;
        // ISO-8601 date. 'Y-m-d\\TH:i:sP'
        D.c = [ D.Y,'-',D.m,'-',D.d,'\\',D.T,D.H,':',D.i,':',D.s,D.P ].join('');
        // RFC 2822 'D, d M Y H:i:s O'
        D.r = [ D.D,', ',D.d,' ',D.M,' ',D.Y,' ',D.H,':',D.i,':',D.s,' ',D.O ].join('');
            
        formatted_datetime = '';
        for (i=0,l=format.length; i<l; i++)
        {
            f = format.charAt( i );
            formatted_datetime += D[HAS](f) ? D[ f ] : f;
        }
        return formatted_datetime;
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
    
/**[DOC_MARKDOWN]
####Types 
**(used with Models)**

```javascript
// modelview.js type casters

[/DOC_MARKDOWN]**/
    Type = {
        
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
                    var self = this, field, type, val, l, i;
                    for ( field in typesPerField )
                    {
                        if ( typesPerField[HAS](field) )
                        {
                            type = typesPerField[ field ]; val = v[ field ];
                            if ( type.fEach && is_type(val, T_ARRAY) )
                            {
                               l = val.length;
                               for (i=0; i<l; i++) val[ i ] = type.f.call( self, val[ i ] );
                               v[ field ] = val;
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
// cast to lowercase string
ModelView.Type.Cast.LCASE;

[/DOC_MARKDOWN]**/
            LCASE: function( v ) { 
                return Str(v).toLowerCase( );
            },
/**[DOC_MARKDOWN]
// cast to uppercase string
ModelView.Type.Cast.UCASE;

[/DOC_MARKDOWN]**/
            UCASE: function( v ) { 
                return Str(v).toUpperCase( );
            },
/**[DOC_MARKDOWN]
// cast to padded string (pad type can be "L"=LEFT, "R"=RIGHT, "LR"=LEFT-RIGHT)
ModelView.Type.Cast.PAD(pad_char, pad_size, pad_type="L");

[/DOC_MARKDOWN]**/
            PAD: function( pad_char, pad_size, pad_type ) { 
                pad_type = pad_type || 'L';
                return function( v ) {
                    var vs = Str(v), len = vs.length, n = pad_size-len, l, r;
                    if ( n > 0 )
                    {
                        if ( 'LR' === pad_type )
                        {
                            r = ~~(n/2); l = n-r;
                            vs = new Array(l+1).join(pad_char)+vs+new Array(r+1).join(pad_char);
                        }
                        else if ( 'R' === pad_type )
                        {
                            vs += new Array(n+1).join(pad_char);
                        }
                        else if ( 'L' === pad_type )
                        {
                            vs = new Array(n+1).join(pad_char) + vs;
                        }
                    }
                    return vs;
                };
            },
/**[DOC_MARKDOWN]
// cast to string
ModelView.Type.Cast.STR;

[/DOC_MARKDOWN]**/
            STR: function( v ) { 
                return (''+v); 
            },
/**[DOC_MARKDOWN]
// cast to (localised) datetime-formatted string [datetime php formats](http://php.net/manual/en/function.date.php)
ModelView.Type.Cast.DATETIME( format="Y-m-d", locale=default_locale );

// default locale is:
 
{
    meridian: { am:'am', pm:'pm', AM:'AM', PM:'PM' },
    ordinal: { ord:{1:'st',2:'nd',3:'rd'}, nth:'th' },
    timezone: [ 'UTC','EST','MDT' ],
    timezone_short: [ 'UTC','EST','MDT' ],
    day: [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ],
    day_short: [ 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ],
    month: [ 'January','February','March','April','May','June','July','August','September','October','November','December' ],
    month_short: [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ]
}

[/DOC_MARKDOWN]**/
            DATETIME: function( format, locale ) {
                format = format || "Y-m-d";
                locale = locale || default_date_locale;
                return function( v ) { 
                    return get_formatted_date( v, format, locale ); 
                }
            },
/**[DOC_MARKDOWN]
// cast to formatted output based on given template
ModelView.Type.Cast.FORMAT( String | ModelView.Tpl | Function tpl );

[/DOC_MARKDOWN]**/
            FORMAT: function( tpl ) {
                if ( is_type(tpl, T_STR) ) 
                {
                    tpl = new Tpl(tpl, tpl_$0_re);
                    return function( v ) { return tpl.render( {$0:v} ); };
                }
                else if ( tpl instanceof Tpl ) 
                    return function( v ) { return tpl.render( v ); };
                else if ( is_type(tpl, T_FUNC) ) 
                    return function( v ) { return tpl( v ); };
                else return function( v ) { return Str(v); };
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

```javascript
// modelview.js validators

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
                    return ( -1 < vals.indexOf( v ) ); 
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
                    return ( 0 > vals.indexOf( v ) ); 
                }); 
            },
/**[DOC_MARKDOWN]
// validate array/collection of items contains at least 'limit' items (use optional item_filter to only filtered items)
ModelView.Validation.Validate.MIN_ITEMS( limit [, item_filter] );

[/DOC_MARKDOWN]**/
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
/**[DOC_MARKDOWN]
// validate array/collection of items contains at maximum 'limit' items (use optional item_filter to only filtered items)
ModelView.Validation.Validate.MAX_ITEMS( limit [, item_filter] );

[/DOC_MARKDOWN]**/
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
            },
/**[DOC_MARKDOWN]
// validate value is valid email pattern
ModelView.Validation.Validate.EMAIL;

[/DOC_MARKDOWN]**/
            EMAIL: (function( email_pattern ){
                return VC(function( v ) { return email_pattern.test( v ); }); 
            })(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/),
/**[DOC_MARKDOWN]
// validate value is valid url pattern (including mailto|http|https|ftp)
ModelView.Validation.Validate.URL;

[/DOC_MARKDOWN]**/
            URL: (function( url_pattern ){
                return VC(function( v ) { return url_pattern.test( v ); }); 
            })(new Regex('^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$', 'i')),
/**[DOC_MARKDOWN]
// validate (string) value is valid (localised) datetime pattern according to [format](http://php.net/manual/en/function.date.php)
ModelView.Validation.Validate.DATETIME( format="Y-m-d", locale=default_locale );

// default locale is:
 
{
    meridian: { am:'am', pm:'pm', AM:'AM', PM:'PM' },
    ordinal: { ord:{1:'st',2:'nd',3:'rd'}, nth:'th' },
    timezone: [ 'UTC','EST','MDT' ],
    timezone_short: [ 'UTC','EST','MDT' ],
    day: [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ],
    day_short: [ 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ],
    month: [ 'January','February','March','April','May','June','July','August','September','October','November','December' ],
    month_short: [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ]
}

[/DOC_MARKDOWN]**/
            DATETIME: function( format, locale ) { 
                var date_pattern = get_date_pattern( format || "Y-m-d", locale || default_date_locale );
                return VC(function( v ) { return date_pattern.test( v ); }); 
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
