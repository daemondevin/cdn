/*!
 * # Fomantic-UI - Spinner
 * http://github.com/daemondevin/cdn/fomantic-ui/modules/spinner.js
 *
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 * @todo Add support for multiple types of spinners (currency, year, month, day)
 * @todo Add validation rules per type
 */
;(function ($, window, document, undefined) {

    'use strict';

    window = (typeof window !== 'undefined' && window.Math === Math)
        ? window
        : (typeof self !== 'undefined' && self.Math === Math)
            ? self
            : Function('return this')()
    ;

    $.fn.spinner = function (parameters) {

        let $allModules    = $(this),
            moduleSelector = $allModules.selector || '',

            time        = new Date().getTime(),
            performance = [],

            query           = arguments[0],
            methodInvoked   = (typeof query === 'string'),
            queryArguments  = [].slice.call(arguments, 1),

            // Step direction constants
            SINGLE_STEP     =  1,
            BIG_STEP        =  2,
            NO_STEP         =  0,
            SINGLE_BACKSTEP = -1,
            BIG_BACKSTEP    = -2,

            // Counter used to give each bound document event a unique suffix so
            // multiple spinners on the same page don't interfere with each other.
            currentQuantity = 0,

            returnedValue
        ;

        $allModules.each(function () {

            let settings = ($.isPlainObject(parameters))
                    ? $.extend(true, {}, $.fn.spinner.settings, parameters)
                    : $.extend({}, $.fn.spinner.settings),

                className  = settings.className,
                types      = ['quantity', 'year', 'month', 'day', 'currency'],
                type       = types.includes(settings.type.toLowerCase())
                    ? settings.type.toLowerCase()
                    : 'quantity',
                metadata   = settings.metadata,
                namespace  = settings.namespace,
                error      = settings.error,
                keys       = settings.keys,

                isHover = false,

                eventNamespace    = '.' + namespace,
                selectorNamespace = '.' + type + '-' + namespace,
                moduleNamespace   = 'module-' + type + '-' + namespace,

                $module    = $(this),
                $input,
                $increment,
                $decrement,
                input,

                element  = this,
                instance = $module.data(moduleNamespace),

                documentEventID,

                value,
                isTouch,
                previousValue,
                initialLoad,

                module
            ;

            module = {

                initialize: function () {
                    module.debug('Initializing spinner', settings);
                    initialLoad = true;

                    currentQuantity += 1;
                    documentEventID  = currentQuantity;

                    isTouch = module.setup.testTouch();
                    module.setup.layout();

                    if (!module.is.disabled()) {
                        module.bind.events();
                    }

                    module.read.metadata();
                    module.read.settings();

                    initialLoad = false;
                    module.instantiate();
                },

                instantiate: function () {
                    module.verbose('Storing instance of spinner', module);
                    instance = module;
                    $module.data(moduleNamespace, module);
                },

                destroy: function () {
                    module.verbose('Destroying previous spinner for', $module);
                    clearInterval(instance.interval);
                    module.unbind.events();
                    module.unbind.togglingEvents();
                    $module.removeData(moduleNamespace);
                    instance = undefined;
                },

                setup: {
                    layout: function () {
                        if ($module.attr('tabindex') === undefined) {
                            $module.attr('tabindex', 0);
                        }

                        switch (type) {
                            case 'quantity':
                                if ($module.find('.quantity').length === 0) {
                                    $module.append(
                                        '<label class="quantity">'
                                        + '<div class="decrement"></div>'
                                        + '<input type="number" class="quantity-spinner" />'
                                        + '<div class="increment"></div>'
                                        + '</label>'
                                    );
                                }
                                break;
                            case 'currency':
                            case 'year':
                            case 'month':
                            case 'day':
                            default:
                                module.debug('The ' + moduleNamespace + ' type is not yet implemented.');
                                return;
                        }

                        $input     = $module.find(selectorNamespace);
                        input      = $input[0];
                        $increment = $module.find('.increment');
                        $decrement = $module.find('.decrement');

                        // Build increment/decrement button content.
                        const invertedClass = settings.inverted ? ' inverted' : '';

                        if (settings.useIcon) {
                            $increment[0].innerHTML =
                                `<i class="tiny${invertedClass} ${settings.incIcon} link icon"></i>`;
                            $decrement[0].innerHTML =
                                `<i class="tiny${invertedClass} ${settings.decIcon} link icon"></i>`;
                        } else {
                            $increment[0].innerHTML =
                                `<span class="ui medium${invertedClass} green text">${settings.incChar}</span>`;
                            $decrement[0].innerHTML =
                                `<span class="ui medium${invertedClass} red text">${settings.decChar}</span>`;
                        }
                    },

                    testTouch: function () {
                        try {
                            document.createEvent('TouchEvent');
                            return true;
                        } catch (e) {
                            return false;
                        }
                    },
                },

                bind: {
                    events: function () {
                        module.bind.globalKeyboardEvents();
                        module.bind.keyboardEvents();
                        module.bind.mouseEvents();
                        if (module.is.touch()) {
                            module.bind.touchEvents();
                        }
                    },

                    keyboardEvents: function () {
                        module.verbose('Binding keyboard events');
                        $module.on('keydown' + eventNamespace, module.event.keydown);
                        // Allow: digits 0-9, backspace (8), delete (46), enter (13),
                        // minus/hyphen (45), and all ctrl/cmd combos.
                        $module.on('keypress' + eventNamespace, function (e) {
                            const isDigit  = e.keyCode >= 48 && e.keyCode <= 57;
                            const isAllowed = e.keyCode === 0    // non-character key
                                           || e.keyCode === 8    // backspace
                                           || e.keyCode === 13   // enter
                                           || e.keyCode === 45   // minus
                                           || e.ctrlKey
                                           || e.metaKey;
                            if (!isDigit && !isAllowed) {
                                e.preventDefault();
                            }
                        });
                        // Enforce bounds and sync internal value when user types directly.
                        $module.on('focusout' + eventNamespace, selectorNamespace, function () {
                            const parsed = parseFloat(input.value);
                            module.set.value(isNaN(parsed) ? module.get.min() : parsed);
                        });
                    },

                    globalKeyboardEvents: function () {
                        $(document).on(
                            'keydown' + eventNamespace + documentEventID,
                            module.event.activateFocus
                        );
                    },

                    mouseEvents: function () {
                        module.verbose('Binding mouse events');

                        $module.on('click' + eventNamespace, '.decrement', function (e) {
                            module.decrease();
                            e.preventDefault();
                        });
                        $module.on('click' + eventNamespace, '.increment', function (e) {
                            module.increase();
                            e.preventDefault();
                        });

                        $module.on('wheel' + eventNamespace, selectorNamespace, function (e) {
                            e.preventDefault();
                            const delta = e.originalEvent.deltaY || e.originalEvent.deltaX || 0;
                            if (delta < 0) {
                                module.increase();
                            } else if (delta > 0) {
                                module.decrease();
                            }
                        });

                        $module.on('mouseenter' + eventNamespace, function () {
                            isHover = true;
                        });
                        $module.on('mouseleave' + eventNamespace, function () {
                            isHover = false;
                        });
                    },

                    touchEvents: function () {
                        module.verbose('Binding touch events');
                        $module.on('touchstart' + eventNamespace, '.increment', function (e) {
                            module.increase();
                            e.preventDefault();
                        });
                        $module.on('touchstart' + eventNamespace, '.decrement', function (e) {
                            module.decrease();
                            e.preventDefault();
                        });
                        $module.on('touchstart' + eventNamespace, module.event.down);
                    },

                    togglingEvents: function () {
                        module.verbose('Binding page-wide events while spinner is being toggled');
                        if (module.is.touch()) {
                            $(document).on('touchmove' + eventNamespace, module.event.toggle);
                            $(document).on('touchend'  + eventNamespace, module.event.up);
                        }
                    },
                },

                unbind: {
                    events: function () {
                        $module.off('click'      + eventNamespace);
                        $module.off('wheel'      + eventNamespace);
                        $module.off('mouseenter' + eventNamespace);
                        $module.off('mouseleave' + eventNamespace);
                        $module.off('touchstart' + eventNamespace);
                        $module.off('keydown'    + eventNamespace);
                        $module.off('keypress'   + eventNamespace);
                        $module.off('focusout'   + eventNamespace);
                        $(document).off('keydown' + eventNamespace + documentEventID);
                    },

                    togglingEvents: function () {
                        if (module.is.touch()) {
                            $(document).off('touchmove' + eventNamespace);
                            $(document).off('touchend'  + eventNamespace);
                        }
                    },
                },

                event: {
                    down: function (e) {
                        e.preventDefault();
                        previousValue = module.get.value();
                        if (!module.is.disabled()) {
                            module.bind.togglingEvents();
                        }
                    },

                    toggle: function (e) {
                        e.preventDefault();
                        const step = module.get.step();
                        if (step === 0) {
                            const inputVal = module.get.inputValue();
                            settings.onToggle.call(element, Math.abs(inputVal), inputVal);
                        } else {
                            const newValue = module.determine.valueFromTouchEvent(e);
                            module.update.value(newValue, function (val, inputVal) {
                                settings.onToggle.call(element, val, inputVal);
                            });
                        }
                    },

                    up: function (e) {
                        e.preventDefault();
                        const newValue = module.determine.valueFromTouchEvent(e);
                        module.set.value(newValue);
                        module.unbind.togglingEvents();
                        previousValue = undefined;
                    },

                    keydown: function (event, delegated) {
                        if (module.is.focused()) {
                            $(document).trigger(event);
                        }
                        if (delegated || module.is.focused()) {
                            const step = module.determine.keyMovement(event);
                            if (step !== NO_STEP) {
                                event.preventDefault();
                                switch (step) {
                                    case SINGLE_STEP:     module.increase();                        break;
                                    case BIG_STEP:        module.increase(module.get.multiplier()); break;
                                    case SINGLE_BACKSTEP: module.decrease();                        break;
                                    case BIG_BACKSTEP:    module.decrease(module.get.multiplier()); break;
                                }
                            }
                        }
                    },

                    activateFocus: function (event) {
                        if (
                            !module.is.focused()
                            && module.is.hover()
                            && module.determine.keyMovement(event) !== NO_STEP
                        ) {
                            event.preventDefault();
                            module.event.keydown(event, true);
                            $module.focus();
                        }
                    },
                },

                increase: function (multiplier) {
                    multiplier = multiplier !== undefined ? multiplier : 1;
                    const step      = module.get.step(),
                          currValue = module.get.inputValue()
                    ;
                    module.verbose('Increasing value');
                    if (step > 0) {
                        // when positive=false, don't allow value to go above 0.
                        const next = currValue + step * multiplier;
                        if (!settings.positive && next > 0) {
                            module.set.value(0);
                        } else {
                            module.set.value(next);
                        }
                    } else if (step === 0) {
                        const precision = module.get.precision(),
                              next      = Math.round((currValue + multiplier / precision) * precision) / precision
                        ;
                        if (!settings.positive && next > 0) {
                            module.set.value(0);
                        } else {
                            module.set.value(next);
                        }
                    }
                },

                decrease: function (multiplier) {
                    multiplier = multiplier !== undefined ? multiplier : 1;
                    const step      = module.get.step(),
                          currValue = module.get.inputValue()
                    ;
                    module.verbose('Decreasing value');
                    if (step > 0) {
                        // when negative=false, don't allow value to go below 0.
                        const next = currValue - step * multiplier;
                        if (!settings.negative && next < 0) {
                            module.set.value(0);
                        } else {
                            module.set.value(next);
                        }
                    } else if (step === 0) {
                        const precision = module.get.precision(),
                              next      = Math.round((currValue - multiplier / precision) * precision) / precision
                        ;
                        if (!settings.negative && next < 0) {
                            module.set.value(0);
                        } else {
                            module.set.value(next);
                        }
                    }
                },

                is: {
                    hover:    function () { return isHover; },
                    focused:  function () { return $module.is(':focus'); },
                    disabled: function () { return $module.hasClass(settings.className.disabled); },
                    touch:    function () { return isTouch; },
                },

                get: {
                    precision: function () {
                        const step = module.get.step();
                        if (step !== 0) {
                            const parts = String(step).split('.');
                            const decimalPlaces = parts.length === 2 ? parts[1].length : 0;
                            return Math.pow(10, decimalPlaces);
                        }
                        return Math.pow(10, settings.decimalPlaces);
                    },

                    min: function () {
                        return settings.min;
                    },

                    max: function () {
                        const step      = module.get.step(),
                              min       = module.get.min(),
                              max       = settings.max,
                              quotient  = step === 0 ? 0 : Math.floor((max - min) / step),
                              remainder = step === 0 ? 0 : (max - min) % step
                        ;
                        return remainder === 0 ? max : min + quotient * step;
                    },

                    step: function () {
                        return settings.step;
                    },

                    value: function () {
                        return value;
                    },

                    inputValue: function () {
                        // Read live from the DOM so direct keyboard edits are respected.
                        return parseFloat(input.value) || 0;
                    },

                    defaultValue: function () {
                        return parseInt(settings.start, 10) || 0;
                    },

                    multiplier: function () {
                        return settings.pageMultiplier;
                    },
                },

                determine: {
                    // Resolve a touch-swipe delta into a new absolute value.
                    // The original code reused slider geometry helpers that don't exist on
                    // a spinner; we simply nudge by one step per call instead.
                    valueFromTouchEvent: function (e) {
                        const touchEvent = e.originalEvent || e,
                              touches    = touchEvent.changedTouches || touchEvent.touches
                        ;
                        if (!touches || !touches[0]) {
                            return module.get.value();
                        }
                        // Swipe up (decreasing Y) → increase; swipe down → decrease.
                        const deltaY = (module._touchStartY || 0) - touches[0].pageY;
                        const step   = module.get.step() || 1;
                        return module.get.value() + Math.sign(deltaY) * step;
                    },

                    keyMovement: function (event) {
                        const key = event.which;
                        if      (key === keys.downArrow  || key === keys.leftArrow)  return SINGLE_BACKSTEP;
                        else if (key === keys.upArrow    || key === keys.rightArrow) return SINGLE_STEP;
                        else if (key === keys.pageDown)                              return BIG_BACKSTEP;
                        else if (key === keys.pageUp)                                return BIG_STEP;
                        else                                                         return NO_STEP;
                    },
                },

                set: {
                    value: function (newValue, fireChange) {
                        fireChange = fireChange !== false;
                        const toReset = previousValue === undefined;
                        if (toReset) {
                            previousValue = module.get.value();
                        }
                        module.update.value(newValue, function (val, inputVal) {
                            if ((!initialLoad || settings.fireOnInit) && fireChange) {
                                if (val !== previousValue) {
                                    settings.onChange.call(element, val, inputVal);
                                }
                                settings.onToggle.call(element, val, inputVal);
                            }
                            if (toReset) {
                                previousValue = undefined;
                            }
                        });
                    },
                },

                update: {
                    value: function (newValue, callback) {
                        const min = module.get.min(),
                              max = module.get.max()
                        ;
                        newValue = Math.min(Math.max(newValue, min), max);
                        value    = newValue;
                        module.debug('Setting spinner value to', value);
                        input.value = value;
                        if (typeof callback === 'function') {
                            callback(value, value);
                        }
                    },
                },

                read: {
                    metadata: function () {
                        const initValue = $module.data(metadata.initValue);
                        if (initValue !== undefined) {
                            module.debug('Current value set from metadata', initValue);
                            module.set.value(initValue);
                        }
                    },

                    settings: function () {
                        if (settings.start !== false) {
                            module.debug('Start position set from settings', settings.start);
                            module.set.value(settings.start);
                        }
                    },
                },

                setting: function (name, val) {
                    module.debug('Changing setting', name, val);
                    if ($.isPlainObject(name)) {
                        $.extend(true, settings, name);
                    } else if (val !== undefined) {
                        if ($.isPlainObject(settings[name])) {
                            $.extend(true, settings[name], val);
                        } else {
                            settings[name] = val;
                        }
                    } else {
                        return settings[name];
                    }
                },

                internal: function (name, val) {
                    if ($.isPlainObject(name)) {
                        $.extend(true, module, name);
                    } else if (val !== undefined) {
                        module[name] = val;
                    } else {
                        return module[name];
                    }
                },

                debug: function () {
                    if (!settings.silent && settings.debug) {
                        if (settings.performance) {
                            module.performance.log(arguments);
                        } else {
                            module.debug = Function.prototype.bind.call(console.info, console, settings.name + ':');
                            module.debug.apply(console, arguments);
                        }
                    }
                },

                verbose: function () {
                    if (!settings.silent && settings.verbose && settings.debug) {
                        if (settings.performance) {
                            module.performance.log(arguments);
                        } else {
                            module.verbose = Function.prototype.bind.call(console.info, console, settings.name + ':');
                            module.verbose.apply(console, arguments);
                        }
                    }
                },

                error: function () {
                    if (!settings.silent) {
                        module.error = Function.prototype.bind.call(console.error, console, settings.name + ':');
                        module.error.apply(console, arguments);
                    }
                },

                performance: {
                    log: function (message) {
                        if (settings.performance) {
                            const currentTime   = new Date().getTime(),
                                  previousTime  = time || currentTime,
                                  executionTime = currentTime - previousTime
                            ;
                            time = currentTime;
                            performance.push({
                                'Name'           : message[0],
                                'Arguments'      : [].slice.call(message, 1) || '',
                                'Element'        : element,
                                'Execution Time' : executionTime,
                            });
                        }
                        clearTimeout(module.performance.timer);
                        module.performance.timer = setTimeout(module.performance.display, 500);
                    },

                    display: function () {
                        let title     = settings.name + ':',
                            totalTime = 0
                        ;
                        time = false;
                        clearTimeout(module.performance.timer);
                        $.each(performance, function (index, data) {
                            totalTime += data['Execution Time'];
                        });
                        title += ' ' + totalTime + 'ms';
                        if (selectorNamespace) {
                            title += ' \'' + selectorNamespace + '\'';
                        }
                        if (performance.length > 0) {
                            console.groupCollapsed(title);
                            if (console.table) {
                                console.table(performance);
                            } else {
                                $.each(performance, function (index, data) {
                                    console.log(data['Name'] + ': ' + data['Execution Time'] + 'ms');
                                });
                            }
                            console.groupEnd();
                        }
                        performance = [];
                    },
                },

                invoke: function (query, passedArguments, context) {
                    let object   = instance,
                        maxDepth,
                        found,
                        response
                    ;
                    passedArguments = passedArguments || queryArguments;
                    context         = element         || context;

                    if (typeof query === 'string' && object !== undefined) {
                        query    = query.split(/[\. ]/);
                        maxDepth = query.length - 1;
                        $.each(query, function (depth, val) {
                            const camelCaseValue = (depth !== maxDepth)
                                ? val + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1)
                                : query
                            ;
                            if ($.isPlainObject(object[camelCaseValue]) && depth !== maxDepth) {
                                object = object[camelCaseValue];
                            } else if (object[camelCaseValue] !== undefined) {
                                found = object[camelCaseValue];
                                return false;
                            } else if ($.isPlainObject(object[val]) && depth !== maxDepth) {
                                object = object[val];
                            } else if (object[val] !== undefined) {
                                found = object[val];
                                return false;
                            } else {
                                module.error(error.method, query);
                                return false;
                            }
                        });
                    }

                    if (typeof found === 'function') {          // was: $.isFunction (removed in jQuery 3.7)
                        response = found.apply(context, passedArguments);
                    } else if (found !== undefined) {
                        response = found;
                    }

                    if (Array.isArray(returnedValue)) {          // was: $.isArray (deprecated/removed)
                        returnedValue.push(response);
                    } else if (returnedValue !== undefined) {
                        returnedValue = [returnedValue, response];
                    } else if (response !== undefined) {
                        returnedValue = response;
                    }

                    return found;
                },
            };

            if (methodInvoked) {
                if (instance === undefined) {
                    module.initialize();
                }
                module.invoke(query);
            } else {
                if (instance !== undefined) {
                    instance.invoke('destroy');
                }
                module.initialize();
            }
        });

        return (returnedValue !== undefined)
            ? returnedValue
            : this
        ;
    };

    $.fn.spinner.settings = {

        silent      : false,
        debug       : false,
        verbose     : false,
        performance : true,

        name      : 'Spinner',
        namespace : 'spinner',

        // Supported: 'quantity' (others are stubs, see @todo above)
        type : '',

        error: {
            method : 'The method you called is not defined.',
        },

        metadata: {
            initValue : 'initValue',
        },

        step  : 1,
        start : 0,
        min   : 0,
        max   : 100,

        // negative: allow the value to go below zero
        // positive: allow the value to go above zero
        negative : true,
        positive : true,

        useIcon  : false,
        inverted : false,
        incIcon  : 'angle up',
        decIcon  : 'angle down',
        incChar  : '+',
        decChar  : '-',

        fireOnInit : false,

        // Decimal places to round to when step is 0 (free-form precision mode)
        decimalPlaces : 2,

        // How many extra steps page-up/down applies relative to a single step
        pageMultiplier : 2,

        className : {
            disabled : 'disabled',
        },

        keys : {
            pageUp     : 33,
            pageDown   : 34,
            leftArrow  : 37,
            upArrow    : 38,
            rightArrow : 39,
            downArrow  : 40,
        },

        onChange : function (value, inputVal) {},
        onToggle : function (value, inputVal) {},
    };

})(jQuery, window, document);
