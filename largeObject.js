'use strict';

var crypto= require('crypto');

var _md5= function( key ) {
    var hash= crypto.createHash('md5');
    hash.update(String(key));
    return hash.digest('hex');
};

var __forEach= function( data, level, fn ) {
    if ( level ) {
        for ( var key in data ) {
            if ( __forEach(data[key], level - 1, fn) === false ) {
                return false;
            }
        }
        return;
    }
    return fn(data);
};

var _forEach= function( data, level, fn ) {
    return __forEach(data, level, function( data ) {
        for ( var key in data ) {
            if ( fn(key, data[key]) === false ) {
                return false;
            }
        }
    });
};

var _segments= function( key, levels ) {
    var md5= _md5(key);
    var result= [];
    var i= 0;
    while ( levels-- > 0 ) {
        result.push(md5.substring(i, i + 3));
        i+= 3;
    }
    return result.reverse();
};

var _get= function( data, segs, key, hasOnly ) {
    if ( segs.length === 0 ) return hasOnly ? key in data : data[key];

    var seg= segs.pop();
    if ( data[seg] ) return _get(data[seg], segs, key, hasOnly);
    return undefined;
};

var _set= function( data, segs, key, value ) {
    if ( segs.length === 0 ) return data[key]= value;

    var seg= segs.pop();
    if ( !data[seg] ) data[seg]= {};
    return _set(data[seg], segs, key, value);
};

var _delete= function( data, segs, key ) {
    if ( segs.length === 0 ) return delete data[key];

    var seg= segs.pop();
    if ( data[seg] ) return _delete(data[seg], segs, key);
};


// push version of keys
var _keys_push= function( data, levels ) {
// var time= process.hrtime();
    var keys= [];
    _forEach(data, levels, function( key ) {
        keys.push(key)
    });
// console.log('keys generate took', process.hrtime(time));
    return keys;
};

// concat version of keys
var _keys_concat= function( data, levels ) {
// var time= process.hrtime();
    var keys= [];
    __forEach(data, levels, function( data ) {
        keys= keys.concat(Object.keys(data));
    });
// console.log('keys generate took', process.hrtime(time));
    return keys;
};

var _keys= _keys_push;

var LargeObject= function( init, levels ) {
    if ( arguments.length < 2 ) {
        levels= init || 1;
        init= undefined;
    }
    if ( levels < 1 ) levels= 1;
    if ( levels > 11 ) levels= 11;

    var data= {};

    var lo= function( key, value ) {
        var segs= _segments(key, levels);
        if ( arguments.length === 1 ) return _get(data, segs, key);
        return _set(data, segs, key, value);
    };

    lo.forEach= function( fn ) {
        return _forEach(data, levels, fn);
    };

    lo.has= function( key ) {
        return _get(data, _segments(key, levels), key, true);
    };

    lo.delete= function( key ) {
        return _delete(data, _segments(key, levels), key);
    };

    lo.keys= function() {
        return _keys(data, levels);
    };

    if ( init ) {
        if ( typeof init === 'function' ) {
            init.forEach(function( key, value ) { lo(key, value); });
        }
        else {
            for ( var key in init ) {
                lo(key, init[key]);
            }
        }
    };

    return lo;
};

var LargeObjectProxy= function( init, levels ) {
    if ( typeof Proxy === 'undefined' ) {
        console.error('Proxy does not exist. Try starting node with parameter --harmony!');
        console.error('Using fallback with simple objects');
        return init;
    }

    if ( arguments.length < 2 ) {
        levels= init || 1;
        init= undefined;
    }
    if ( levels < 1 ) levels= 1;
    if ( levels > 11 ) levels= 11;

    var data= {};

    var keys= function() {
        return _keys(data, levels);
    };

    var proxy= Proxy.createFunction({
        getOwnPropertyDescriptor: function () {},
        getOwnPropertyNames: keys,
        getPropertyNames: keys,
        delete: function( name ) {
            return _delete(data, _segments(name, levels), name);
        },
        has: function( name ) {
            return _get(data, _segments(name, levels), name, true);
        },
        get: function( receiver, name ) {
            return _get(data, _segments(name, levels), name, false);
        },
        set: function( receiver, name, value ) {
            _set(data, _segments(name, levels), name, value);
            return true;
        },
        enumerate: keys,
        keys: keys,
    }, function( arg ) {
        switch ( arg ) {
            case 'forEach': return _forEach(data, levels, arguments[1]);
            case 'empty':
                return __forEach(data, levels, function( data ) {
                    return Object.keys(data).length === 0;
                }) !== false;
        }
    });

    if ( init ) {
        for ( var key in init ) {
            proxy[key]= init[key];
        }
    };

    return proxy;
};

exports.LargeObject= LargeObject;
exports.LargeObjectProxy= LargeObjectProxy;

