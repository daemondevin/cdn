/**
 * ## StorageBin
 * A localStorage wrapper with a cookie fallback
 * 
 * All methods checks for localStorage support first
 * 
 * If no support is found then all methods will 
 * fallback to implementing cookies instead.
 */
const prefs = new function StorageBin () {
    let self = this,
        test = "a";

    const supported = () => {
        let granted;
        try {
            window.localStorage.setItem(test, test);
            window.localStorage.removeItem(test);
            granted = true;
        } catch (e) {
            granted = false;
        }
        return granted;
    };

    /**
     * Stores the specified key/value pair allowing
     * for the following types: <em>string</em>, <em>number</em>,
     * <em>boolean</em>, <em>object</em>, and <em>array</em>.<br />
     * If no key is supplied and only an object is passed,
     * this function acts as an alias for <code>StorageBin.store()</code>.
     * 
     * @param {string/int/boolean/object/array} key 
     * @param {object/string} value
     */
    StorageBin.prototype.set = function(key, value) {
        if (supported) {
            if (arguments.length === 1) {
                self.store(key);
            } else if (typeof key === "string") {
                if (typeof value === "object") {
                    value = JSON.stringify(value);
                }
                window.localStorage.setItem(key, value);
            } else {
                throw new TypeError("Failed to execute StorageBin.set(): one or more arguments are invalid");
            }
        } else {
            document.cookie = key + "=" + value + "; path=/";
        }
    };

    /**
     * Stores the object in localStorage, allowing access to individual object properties
     * @param {object} value
     */
    StorageBin.prototype.store = function(value) {
        if (typeof value === "object" && !(value instanceof Array)) {
            for (const property in value) {
                if(value.hasOwnProperty(property)) {
                    window.localStorage.setItem(property, value[property]);
                }
            }
        } else {
            throw new TypeError("Failed to execute StorageBin.store(): argument must be of type object! " + typeof(value) + " given.");
        }
    };
    
    /**
     * Returns the value of a specified key in localStorage.
     * This value is converted to its proper type upon retrieval.
     * If the key is not in local storage, then defaultValue is
     * returned if specified.
     * @param key
     * @param defaultValue
     * @returns {string|boolean|null|number|any}
     */
    StorageBin.prototype.get = function(key, defaultValue) {
        if (supported) {
            if (typeof key !== "string") {
                throw new TypeError("Failed to execute StorageBin.get(): key must be of type string! " + typeof(key) + " given.");
            }

            let value = window.localStorage.getItem(key); // retrieve value
            let number = parseFloat(value); // to allow for number checking

            if (value === null) {
                // Returns default value if key is not set, otherwise returns null
                return arguments.length === 2 ? defaultValue : null;
            } else if (!isNaN(number)) {
                return number; // value was of type number
            } else if (
                value.toLowerCase() === "true" ||
                value.toLowerCase() === "false"
            ) {
                return value === "true"; //value was of type boolean
            } else {
                try {
                    value = JSON.parse(value);
                    return value;
                } catch (e) {
                    return value;
                }
            }
        } else {
            let key_equals = key + "=",
                cookies = document.cookie.split(";");
            for (let i = 0, j = cookies.length; i < j; i++) {
                let this_cookie = cookies[i];
                while (this_cookie.charAt(0) === " ") {
                    this_cookie = this_cookie.substring(1, this_cookie.length);
                }
                if (this_cookie.indexOf(key_equals) === 0) {
                    return this_cookie.substring(
                        key_equals.length,
                        this_cookie.length
                    );
                }
            }
            return null;
        }
    };

    /**
     * Returns an array of keys currently stored in localStorage
     * @returns {*[]}
     */
    StorageBin.prototype.getKeys = function() {
        let result = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            result.push(window.localStorage.key(i));
        }
        return result;
    };

    /**
     * Checks if localStorage contains the specified key
     * @param {string} key
     * @returns {boolean}
     */
    StorageBin.prototype.contains = function(key) {
        if (typeof key !== "string") {
            throw new TypeError("Failed to execute StorageBin.contains(): key must be of type string! " + typeof(key) + " given.");
        }
        return self.getKeys().indexOf(key) !== -1;
    };

    /**
     * Removes the specified key/value pair from localStorage given a key<br/>
     * Optionally takes an array to remove key/value pairs specified in the array
     * @param {string/array} key
     */
    StorageBin.prototype.del = function(key) {
        if (supported) {
            if (typeof key === "string") {
                window.localStorage.removeItem(key);
            } else if (key instanceof Array) {
                for (let i = 0; i < key.length; i++) {
                    if (typeof key[i] === "string") {
                        window.localStorage.removeItem(key[i]);
                    } else {
                        throw new TypeError("Failed to execute StorageBin.del(): the array key at index " + i + " must be of type string! " + typeof(key[i]) + " given.");
                    }
                }
            } else {
                throw new TypeError("Failed to execute StorageBin.del(): key must be of type string! " + typeof(key) + " given.");
            }
        } else {
            self.set(key, "");
        }
    };

    /**
     * An alias for <code>StorageBin.clear()</code>
     */
    StorageBin.prototype.empty = function() {
        self.clear();
    };

    /**
     * Removes all key/value pairs from localStorage
     */
    StorageBin.prototype.clear = function() {
        if (supported) {
            window.localStorage.clear();
        } else {
            let cookies = document.cookie.split(";");
            let i = 0,
                j = cookies.length;
            for (; i < j; i++) {
                let this_cookie = cookies[i];
                let equals_position = this_cookie.indexOf("=");
                let name =
                    equals_position > -1 ? this_cookie.substr(0, equals_position) : this_cookie;
                document.cookie =
                    name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
        }
    };

    /**
     * Returns an object representation of the current state of localStorage
     * @returns {{}}
     */
    StorageBin.prototype.toObject = function() {
        const o = {};
        const keys = self.getKeys();

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            o[key] = self.get(key);
        }
        return o;
    };
}();
