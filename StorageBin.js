/**
 * StorageBin
 *
 * A lightweight, backend-independent storage abstraction.
 *
 * Supported backends:
 *     "auto"           Automatically select localStorage, then cookies.
 *     "localStorage"   Browser localStorage.
 *     "sessionStorage" Browser sessionStorage.
 *     "cookie"         Browser cookies.
 *     "memory"         In-memory storage.
 *
 * Example:
 *
 *     const prefs = new StorageBin();
 *
 *     prefs.set("theme", "dark");
 *     prefs.set("enabled", true);
 *     prefs.set("settings", {
 *         sidebar: true,
 *         compact: false
 *     });
 *
 *     prefs.get("theme");
 *     prefs.contains("enabled");
 *     prefs.del("theme");
 *
 *     // Explicit backend:
 *     const session = new StorageBin({
 *         backend: "sessionStorage"
 *     });
 *
 *     // Cookie storage:
 *     const cookies = new StorageBin({
 *         backend: "cookie"
 *     });
 *
 *     // Automatic fallback:
 *     const storage = new StorageBin({
 *         backend: "auto"
 *     });
 */
const StorageBin = (() => {
    "use strict";

    const TEST_KEY = "__storagebin_test__";

    /**
     * Serialization
     */
    
    const encode = (value) => {
        if (typeof value === "string") {
            return value;
        }

        try {
            const result = JSON.stringify(value);

            /**
             * JSON.stringify(undefined) returns undefined rather than
             * a string. Storage backends require a string value.
             */
            if (typeof result === "undefined") {
                throw new TypeError(
                    "StorageBin: undefined cannot be stored."
                );
            }

            return result;
        } catch (error) {
            if (error instanceof TypeError) {
                throw error;
            }

            throw new TypeError(
                "StorageBin: value could not be serialized."
            );
        }
    };

    const decode = (value) => {
        if (value === null) {
            return null;
        }

        /**
         * Strings are stored without JSON encoding, so try JSON and
         * fall back to the original string.
         */
        try {
            return JSON.parse(value);
        } catch (error) {
            return value;
        }
    };

    /**
     * Web Storage backend factory
     */
    
    const createWebStorageBackend = (name) => {
        const getStorage = () => {
            if (
                typeof window === "undefined" ||
                !window[name]
            ) {
                return null;
            }

            return window[name];
        };

        return {
            name,

            available() {
                try {
                    const storage = getStorage();

                    if (!storage) {
                        return false;
                    }

                    storage.setItem(TEST_KEY, TEST_KEY);

                    const works =
                        storage.getItem(TEST_KEY) === TEST_KEY;

                    storage.removeItem(TEST_KEY);

                    return works;
                } catch (error) {
                    return false;
                }
            },

            set(key, value) {
                getStorage().setItem(key, value);
            },

            get(key) {
                return getStorage().getItem(key);
            },

            has(key) {
                return getStorage().getItem(key) !== null;
            },

            remove(key) {
                getStorage().removeItem(key);
            },

            keys() {
                const storage = getStorage();
                const result = [];

                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);

                    if (key !== null) {
                        result.push(key);
                    }
                }

                return result;
            },

            clear() {
                getStorage().clear();
            }
        };
    };

    /**
     * Cookie backend
     */

    const cookieBackend = {
        name: "cookie",

        available() {
            if (typeof document === "undefined") {
                return false;
            }

            try {
                const key = TEST_KEY;
                const value = TEST_KEY;

                this.set(key, value);

                const works = this.get(key) === value;

                this.remove(key);

                return works;
            } catch (error) {
                return false;
            }
        },

        set(key, value) {
            document.cookie =
                encodeURIComponent(key) +
                "=" +
                encodeURIComponent(value) +
                "; path=/";
        },

        get(key) {
            const target =
                encodeURIComponent(key) + "=";

            const cookies = document.cookie
                ? document.cookie.split(";")
                : [];

            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();

                if (cookie.indexOf(target) === 0) {
                    const value =
                        cookie.substring(target.length);

                    try {
                        return decodeURIComponent(value);
                    } catch (error) {
                        return value;
                    }
                }
            }

            return null;
        },

        has(key) {
            return this.get(key) !== null;
        },

        remove(key) {
            document.cookie =
                encodeURIComponent(key) +
                "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        },

        keys() {
            if (
                typeof document === "undefined" ||
                !document.cookie
            ) {
                return [];
            }

            return document.cookie
                .split(";")
                .map(cookie => cookie.trim())
                .filter(Boolean)
                .map(cookie => {
                    const index = cookie.indexOf("=");

                    const key =
                        index === -1
                            ? cookie
                            : cookie.substring(0, index);

                    try {
                        return decodeURIComponent(key);
                    } catch (error) {
                        return key;
                    }
                });
        },

        clear() {
            this.keys().forEach(key => {
                this.remove(key);
            });
        }
    };

    /**
     * Memory backend
     *
     * Useful when:
     *
     *     - Running tests
     *     - Running without browser storage
     *     - Running in unusual environments
     *     - A temporary storage area is desired
     */

    const createMemoryBackend = () => {
        const data = Object.create(null);

        return {
            name: "memory",

            available() {
                return true;
            },

            set(key, value) {
                data[key] = value;
            },

            get(key) {
                return Object.prototype.hasOwnProperty.call(
                    data,
                    key
                )
                    ? data[key]
                    : null;
            },

            has(key) {
                return Object.prototype.hasOwnProperty.call(
                    data,
                    key
                );
            },

            remove(key) {
                delete data[key];
            },

            keys() {
                return Object.keys(data);
            },

            clear() {
                Object.keys(data).forEach(key => {
                    delete data[key];
                });
            }
        };
    };

    /**
     * Backend registry
     */

    const createBackends = () => ({
        localStorage:
            createWebStorageBackend("localStorage"),

        sessionStorage:
            createWebStorageBackend("sessionStorage"),

        cookie:
            cookieBackend,

        memory:
            createMemoryBackend()
    });

    /**
     * Backend selection
     */

    const selectBackend = (requested, backends) => {
        const name = requested || "auto";

        if (name === "auto") {
            if (backends.localStorage.available()) {
                return backends.localStorage;
            }

            if (backends.cookie.available()) {
                return backends.cookie;
            }

            return backends.memory;
        }

        if (!backends[name]) {
            throw new TypeError(
                "StorageBin: unknown backend \"" +
                name +
                "\". Supported backends are: " +
                Object.keys(backends).join(", ") +
                "."
            );
        }

        if (!backends[name].available()) {
            throw new Error(
                "StorageBin: backend \"" +
                name +
                "\" is not available."
            );
        }

        return backends[name];
    };

    /**
     * StorageBin constructor
     */

    class StorageBin {
        constructor(options = {}) {
            if (
                options === null ||
                typeof options !== "object" ||
                Array.isArray(options)
            ) {
                throw new TypeError(
                    "StorageBin: options must be an object."
                );
            }

            const backends = createBackends();

            this._backend = selectBackend(
                options.backend || "auto",
                backends
            );

            this._backendName = this._backend.name;
        }

        /**
         * Backend information
         */
        get backend() {
            return this._backendName;
        }

        /**
         * set()
         */
        set(key, value) {
            if (typeof key !== "string") {
                throw new TypeError(
                    "StorageBin.set(): key must be a string."
                );
            }

            this._backend.set(
                key,
                encode(value)
            );

            return this;
        }

        /**
         * store()
         */
        store(values) {
            if (
                values === null ||
                typeof values !== "object" ||
                Array.isArray(values)
            ) {
                throw new TypeError(
                    "StorageBin.store(): argument must be an object."
                );
            }

            Object.keys(values).forEach(key => {
                this.set(key, values[key]);
            });

            return this;
        }

        /**
         * get()
         */
        get(key, defaultValue = null) {
            if (typeof key !== "string") {
                throw new TypeError(
                    "StorageBin.get(): key must be a string."
                );
            }

            const value = this._backend.get(key);

            if (value === null) {
                return defaultValue;
            }

            return decode(value);
        }

        /**
         * getKeys()
         */
        getKeys() {
            return this._backend.keys();
        }

        /**
         * contains()
         */
        contains(key) {
            if (typeof key !== "string") {
                throw new TypeError(
                    "StorageBin.contains(): key must be a string."
                );
            }

            return this._backend.has(key);
        }

        /**
         * del()
         */
        del(keys) {
            if (typeof keys === "string") {
                this._backend.remove(keys);
                return this;
            }

            if (Array.isArray(keys)) {
                keys.forEach((key, index) => {
                    if (typeof key !== "string") {
                        throw new TypeError(
                            "StorageBin.del(): key at index " +
                            index +
                            " must be a string."
                        );
                    }

                    this._backend.remove(key);
                });

                return this;
            }

            throw new TypeError(
                "StorageBin.del(): key must be a string or array."
            );
        }

        /**
         * empty()
         */
        empty() {
            return this.clear();
        }

        /**
         * clear()
         */
        clear() {
            this._backend.clear();

            return this;
        }

        /**
         * toObject()
         */
        toObject() {
            const result = {};

            this.getKeys().forEach(key => {
                result[key] = this.get(key);
            });

            return result;
        }
    }

    return StorageBin;
})();
