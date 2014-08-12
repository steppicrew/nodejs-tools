'use strict';

var crypto= require('crypto');

var _md5= function( key ) {
    var hash= crypto.createHash('md5');
    hash.update(String(key));
    return hash.digest('hex');
};

var _forEach= function( data, level, fn ) {
    if ( level ) {
        for ( var key in data ) {
            _forEach(data[key], level - 1, fn);
        }
        return;
    }
    for ( var key in data ) {
        fn(key, data[key]);
    }
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

var _keys= function() {
    var keys= [];
    _forEach(data, levels, function( name ) {
        keys.push(name);
    });
    return keys;
};

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
        return _keys(data);
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
    if ( arguments.length < 2 ) {
        levels= init || 1;
        init= undefined;
    }
    if ( levels < 1 ) levels= 1;
    if ( levels > 11 ) levels= 11;

    var data= {};

    var proxy= Proxy.create({
        getOwnPropertyDescriptor: function () {},
        getOwnPropertyNames: _keys,
        getPropertyNames: _keys,
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
        enumerate: _keys,
        keys: _keys,
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
