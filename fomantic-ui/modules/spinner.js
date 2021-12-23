/*!
 * # Fomantic-UI - Spinner
 * http://github.com/daemondevin/cdn/fomantic-ui/modules/spinner.js
 *
 *
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 * @todo Add support for multiple types of spinners (i.e. currency, year, month, day, etc.)
 * @todo Add support for rules for each type of spinner
 */
;(function ($, window, document, undefined) {

    "use strict";

    window = (typeof window != 'undefined' && window.Math === Math)
        ? window
        : (typeof self != 'undefined' && self.Math === Math)
            ? self
            : Function('return this')()
    ;

    $.fn.spinner = function(parameters) {

        let $allModules = $(this),
            $window = $(window),

            moduleSelector = $allModules.selector || '',

            time = new Date().getTime(),
            performance = [],

            query = arguments[0],
            methodInvoked = (typeof query == 'string'),
            queryArguments = [].slice.call(arguments, 1),

            SINGLE_STEP = 1,
            BIG_STEP = 2,
            NO_STEP = 0,
            SINGLE_BACKSTEP = -1,
            BIG_BACKSTEP = -2,

            // Used to manage document bound events.
            // Use this so that we can distinguish between which document events are bound to which spinner.
            currentQuantity = 0,

            returnedValue
        ;

        $allModules
            .each(function (events, handler) {

                let settings          = ($.isPlainObject(parameters))
                        ? $.extend(true, {}, $.fn.spinner.settings, parameters)
                        : $.extend({}, $.fn.spinner.settings),

                    className         = settings.className,
                    types             = ['quantity', 'year', 'month', 'day', 'currency'],
                    type              = (types.includes(settings.type.toLowerCase())) ? settings.type.toLowerCase() : "quantity",
                    metadata          = settings.metadata,
                    namespace         = settings.namespace,
                    error             = settings.error,
                    keys              = settings.keys,
                    negative          = settings.negative,
                    positive          = settings.positive,

                    isHover = false,
                    eventNamespace = '.' + namespace,
                    selectorNamespace = '.' + type + '-' + namespace,
                    moduleNamespace   = 'module-' + type + '-' + namespace,

                    $module           = $(this),
                    $input,
                    $label,
                    $increment,
                    increment,
                    $decrement,
                    decrement,

                    input,
                    element           = this,
                    instance          = $module.data(moduleNamespace),

                    documentEventID,

                    value,
                    precision,
                    isTouch,
                    previousValue,

                    initialLoad,
                    module
                ;

                module = {

                    initialize: function() {
                        module.debug('Initializing spinner', settings);
                        initialLoad = true;

                        currentQuantity += 1;
                        documentEventID = currentQuantity;

                        isTouch = module.setup.testOutTouch();
                        module.setup.layout();

                        if(!module.is.disabled()) {
                            module.bind.events();
                        }

                        module.read.metadata();
                        module.read.settings();

                        initialLoad = false;
                        module.instantiate();
                    },
                    instantiate: function() {
                        module.verbose('Storing instance of spinner', module);
                        instance = module;
                        $module
                            .data(moduleNamespace, module)
                        ;
                    },
                    destroy: function() {
                        module.verbose('Destroying previous spinner for', $module);
                        clearInterval(instance.interval);
                        module.unbind.events();
                        module.unbind.togglingEvents();
                        $module.removeData(moduleNamespace);
                        instance = undefined;
                    },
                    setup: {
                        layout: function() {
                            if ($module.attr('tabindex') === undefined) {
                                $module.attr('tabindex', 0);
                            }

                            /**
                             * Checks to see if our input spinner is one of the defined spinner modules
                             * Defaults to using "quantity" if not
                             *
                             * @todo Add switch conditionals to support multiple input spinners based on spinner type
                             */
                            switch (type) {
                                case "quantity":
                                    if ($module.find('.quantity').length === 0) {
                                        $module.append("<label class='quantity'>"
                                            + "<div class='decrement'></div>"
                                            + "<input type='number' class='quantity-spinner'/>"
                                            + "<div class='increment'></div>"
                                            + "</label>");
                                    }
                                    break;
                                case "currency":
                                case "year":
                                case "month":
                                case "day":
                                default:
                                    console.log("The " + moduleNamespace + " is still being written!");
                                    break;
                            }

                            precision = module.get.precision();
                            $input = $module.find(selectorNamespace);
                            input = $input[0];
                            $increment = $module.find('.increment');
                            increment = $increment[0];
                            $decrement = $module.find('.decrement');
                            decrement = $decrement[0];
                            increment.innerHTML = settings.useIcon === true ? '<i class="tiny ' + (settings.inverted ? 'inverted ' : '') + settings.incIcon + ' link icon"></i>' : '<span class="ui medium' + (settings.inverted ? 'inverted ' : '') + ' green text">'+settings.incChar+'</span>';
                            decrement.innerHTML = settings.useIcon === true ? '<i class="tiny ' + (settings.inverted ? 'inverted ' : '') + settings.decIcon + ' link icon"></i>' : '<span class="ui medium' + (settings.inverted ? 'inverted ' : '') + ' red text">'+settings.decChar+'</span>';
                        },
                        testOutTouch: function() {
                            try {
                                document.createEvent('TouchEvent');
                                return true;
                            } catch (e) {
                                return false;
                            }
                        },
                    },
                    bind: {
                        events: function() {
                            module.bind.globalKeyboardEvents();
                            module.bind.keyboardEvents();
                            module.bind.mouseEvents();
                            if(module.is.touch()) {
                                module.bind.touchEvents();
                            }
                        },
                        keyboardEvents: function() {
                            module.verbose('Binding keyboard events');
                            $module.on('keydown' + eventNamespace, module.event.keydown);
                            $module.on('keypress' + eventNamespace, function(e) {
                                if (e.keyCode < 48 || e.keyCode > 57) {
                                    //codes for backspace, delete, enter
                                    if (e.keyCode !== 0 && e.keyCode !== 8 && e.keyCode !== 13 && e.keyCode !== 45 && !e.ctrlKey) {
                                        e.preventDefault();
                                    }
                                }
                            });
                        },
                        globalKeyboardEvents: function () {
                            $(document).on('keydown' + eventNamespace + documentEventID, module.event.activateFocus);
                        },
                        mouseEvents: function() {
                            module.verbose('Binding mouse events');
                            $module.on('click' + eventNamespace, '.decrement', function(e) {
                                module.decrease();
                                e.preventDefault();
                            });
                            $module.on('click' + eventNamespace, '.increment', function(e) {
                                module.increase();
                                e.preventDefault();
                            });
                            $module.on('wheel' + eventNamespace, selectorNamespace, function(e, delta){
                                const value = module.get.defaultValue() + delta;
                                if (!settings.negative) {
                                    if (value >= 0) {
                                        e.currentTarget.value = value;
                                    }
                                } else if (!settings.positive) {
                                    if (value <= 0) {
                                        e.currentTarget.value = value;
                                    }
                                } else {
                                    e.currentTarget.value = value;
                                }
                            });
                            $module.on('mouseenter' + eventNamespace, function(e) {
                                isHover = true;
                            });
                            $module.on('mouseleave' + eventNamespace, function(e) {
                                isHover = false;
                            });
                        },
                        touchEvents: function() {
                            module.verbose('Binding touch events');
                            $module.on('touchstart' + eventNamespace, selectorNamespace, function(event) {
                                event.stopImmediatePropagation();
                                event.preventDefault();
                                module.event.down(event);
                            });
                            $module.on('touchstart' + eventNamespace, module.event.down);
                            $module.on('touchstart' + eventNamespace, '.increment', function (e) {
                                module.increase();
                                e.preventDefault();
                            });
                            $module.on('touchstart' + eventNamespace, '.decrement', function (e) {
                                module.decrease();
                                e.preventDefault();
                            });
                        },
                        togglingEvents: function() {
                            // these don't need the identifier because we only ever want one of them to be registered with document
                            module.verbose('Binding page wide events while spinner is being toggled');
                            if(module.is.touch()) {
                                $(document).on('touchmove' + eventNamespace, module.event.toggle);
                                $(document).on('touchend' + eventNamespace, module.event.up);
                            }
                        }
                    },

                    unbind: {
                        events: function() {
                            $module.find(type).off('mousedown' + eventNamespace);
                            $module.find(type).off('touchstart' + eventNamespace);
                            $module.off('mousedown' + eventNamespace);
                            $module.off('mouseenter' + eventNamespace);
                            $module.off('mouseleave' + eventNamespace);
                            $module.off('touchstart' + eventNamespace);
                            $module.off('keydown' + eventNamespace);
                            $module.off('keypress' + eventNamespace);
                            $module.off('focusout' + eventNamespace);
                            $(document).off('keydown' + eventNamespace + documentEventID, module.event.activateFocus);
                        },
                        togglingEvents: function() {
                            if(module.is.touch()) {
                                $(document).off('touchmove' + eventNamespace);
                                $(document).off('touchend' + eventNamespace);
                            }
                        },
                    },
                    event: {
                        down: function(e) {
                            e.preventDefault();
                            previousValue = module.get.value();

                            if(!module.is.disabled()) {
                                module.bind.togglingEvents();
                            }
                        },
                        toggle: function(e) {
                            e.preventDefault();
                            let value = module.determine.valueFromEvent(e);

                            if (module.get.step() === 0) {
                                const inputVal = module.inputVal;
                                value = Math.abs(inputVal);
                                settings.onToggle.call(element, value, inputVal);
                            } else {
                                module.update.value(value, function(value, inputVal) {
                                    settings.onToggle.call(element, value, inputVal);
                                });
                            }
                        },
                        up: function(event) {
                            event.preventDefault();
                            const value = module.determine.valueFromEvent(event);
                            module.set.value(value);
                            module.unbind.togglingEvents();
                            if (previousValue !== undefined) {
                                previousValue = undefined;
                            }
                        },
                        keydown: function(event, first) {
                            if (module.is.focused()) {
                                $(document).trigger(event);
                            }
                            if (first || module.is.focused()) {
                                const step = module.determine.keyMovement(event);
                                if (step !== NO_STEP) {
                                    event.preventDefault();
                                    switch(step) {
                                        case SINGLE_STEP:
                                            module.increase();
                                            break;
                                        case BIG_STEP:
                                            module.increase(module.get.multiplier());
                                            break;
                                        case SINGLE_BACKSTEP:
                                            module.decrease();
                                            break;
                                        case BIG_BACKSTEP:
                                            module.decrease(module.get.multiplier());
                                            break;
                                    }
                                }
                            }
                        },
                        activateFocus: function(event) {
                            if(!module.is.focused() && module.is.hover() && module.determine.keyMovement(event) !== NO_STEP) {
                                event.preventDefault();
                                module.event.keydown(event, true);
                                $module.focus();
                            }
                        },
                    },
                    increase: function(x) {
                        let
                            multiplier = x !== undefined ? x : 1,
                            step = module.get.step(),
                            currValue = module.get.inputValue()
                        ;
                        module.verbose('Increasing');
                        if(step > 0) {
                            if(!positive && currValue <= 0) {
                                module.set.value(currValue + step * multiplier);
                            } else {
                                module.set.value(currValue + step * multiplier);
                            }
                        } else if (step === 0){
                            const precision = module.get.precision(),
                                newValue = currValue + (multiplier / precision)
                            ;
                            if(!positive && newValue <= 0) {
                                module.set.value(Math.round(newValue * precision) / precision);
                            } else {
                                module.set.value(Math.round(newValue * precision) / precision);
                            }
                        }
                    },
                    decrease: function(x) {
                        var
                            multiplier = x != undefined ? x : 1,
                            step = module.get.step(),
                            currValue = module.get.inputValue()
                        ;
                        module.verbose('Decreasing');
                        if(step > 0) {
                            if(!negative && currValue >= 0) {
                                module.set.value(currValue - step * multiplier);
                            } else {
                                module.set.value(currValue - step * multiplier);
                            }
                        } else if (step === 0) {
                            const precision = module.get.precision(),
                                newValue = currValue - (multiplier / precision)
                            ;
                            if(!negative && newValue >= 0) {
                                module.set.value(Math.round(newValue * precision) / precision);
                            } else {
                                module.set.value(Math.round(newValue * precision) / precision);
                            }
                        }
                    },
                    is: {
                        hover: function() {
                            return isHover;
                        },
                        focused: function() {
                            return $module.is(':focus');
                        },
                        disabled: function() {
                            return $module.hasClass(settings.className.disabled);
                        },
                        touch: function() {
                            return isTouch;
                        }
                    },
                    get: {
                        precision: function() {
                            let decimalPlaces,
                                step = module.get.step()
                            ;
                            if(step !== 0) {
                                const split = String(step).split('.');
                                if(split.length === 2) {
                                    decimalPlaces = split[1].length;
                                } else {
                                    decimalPlaces = 0;
                                }
                            } else {
                                decimalPlaces = settings.decimalPlaces;
                            }
                            const precision = Math.pow(10, decimalPlaces);
                            module.debug('Precision determined', precision);
                            return precision;
                        },
                        min: function() {
                            return settings.min;
                        },
                        max: function() {
                            const step = module.get.step(),
                                min = module.get.min(),
                                quotient = step === 0 ? 0 : Math.floor((settings.max - min) / step),
                                remainder = step === 0 ? 0 : (settings.max - min) % step;
                            return remainder === 0 ? settings.max : min + quotient * step;
                        },
                        step: function() {
                            return settings.step;
                        },
                        value: function() {
                            return value;
                        },
                        inputValue: function() {
                            return module.inputVal;
                        },
                        defaultValue: function() {
                            return parseInt(settings.start) || 0;
                        },
                        incrementValue: function() {
                            let val = module.get.defaultValue();
                            return ++val;
                        },
                        decrementValue: function() {
                            let val = module.get.defaultValue();
                            return --val;
                        },
                        multiplier: function() {
                            return settings.pageMultiplier;
                        },
                    },
                    determine: {
                        value: function(value) {
                            return value - module.get.defaultValue();
                        },
                        valueFromEvent: function(e) {
                            let eventValue = module.determine.eventValue(e),
                                newValue = module.determine.value(eventValue),
                                value
                            ;
                            if (!settings.negative) {
                                value = module.is.reversed() ? module.get.max() : module.get.min();
                            } else if(eventValue > module.get.trackOffset() + module.get.trackLength()) {
                                value = module.is.reversed() ? module.get.min() : module.get.max();
                            } else {
                                value = module.determine.value(newValue);
                            }
                            return value;
                        },
                        eventValue: function(e) {
                            if (module.is.touch()) {
                                const touchEvent = e.changedTouches ? e : e.originalEvent,
                                    touches = touchEvent.changedTouches[0] ? touchEvent.changedTouches : touchEvent.touches;
                                return touches[0].pageY;
                            }
                            const wheelY = e.deltaY || e.originalEvent.deltaY,
                                wheelX = e.deltaX || e.originalEvent.deltaX
                            ;
                            return wheelY || wheelX;
                        },
                        keyMovement: function(event) {
                            var key = event.which;
                            if (key === keys.downArrow || key === keys.leftArrow) {
                                return SINGLE_BACKSTEP;
                            } else if (key === keys.upArrow || key === keys.rightArrow) {
                                return SINGLE_STEP;
                            } else if (key === keys.pageDown) {
                                return BIG_BACKSTEP;
                            } else if (key === keys.pageUp) {
                                return BIG_STEP;
                            } else {
                                return NO_STEP;
                            }
                        }
                    },
                    set: {
                        value: function(newValue, fireChange) {
                            fireChange = fireChange !== false;
                            const toReset = previousValue === undefined;
                            previousValue = previousValue === undefined ? module.get.value() : previousValue;
                            module.update.value(newValue, function(value, inputVal) {
                                if ((!initialLoad || settings.fireOnInit) && fireChange){
                                    if (newValue !== previousValue) {
                                        settings.onChange.call(element, value, inputVal);
                                    }
                                    settings.onToggle.call(element, value, inputVal);
                                }
                                if (toReset) {
                                    previousValue = undefined;
                                }
                            });
                        }
                    },
                    update: {
                        value: function(newValue, callback) {
                            const min = module.get.min(),
                                max = module.get.max()
                            ;
                            if (newValue <= min) {
                                newValue = min;
                            } else if(newValue >= max){
                                newValue = max;
                            }
                            value = newValue;
                            module.inputVal = value;
                            module.debug('Setting spinner value to ' + value);
                            input.value = value;
                            if (typeof callback === 'function') {
                                callback(value, module.inputVal);
                            }
                        }
                    },
                    read: {
                        metadata: function() {
                            const data = {
                                    initValue: $module.data(metadata.initValue),
                                }
                            ;
                            if (data.initValue) {
                                module.debug('Current value set from metadata', data.initValue);
                                module.set.value(data.initValue);
                            }
                        },
                        settings: function() {
                            if (settings.start !== false) {
                                module.debug('Start position set from settings', settings.start);
                                module.set.value(settings.start);
                            }
                        }
                    },
                    setting: function(name, value) {
                        module.debug('Changing setting', name, value);
                        if(  $.isPlainObject(name) ) {
                            $.extend(true, settings, name);
                        }
                        else if (value !== undefined) {
                            if ($.isPlainObject(settings[name])) {
                                $.extend(true, settings[name], value);
                            }
                            else {
                                settings[name] = value;
                            }
                        }
                        else {
                            return settings[name];
                        }
                    },
                    internal: function(name, value) {
                        if ( $.isPlainObject(name) ) {
                            $.extend(true, module, name);
                        }
                        else if (value !== undefined) {
                            module[name] = value;
                        }
                        else {
                            return module[name];
                        }
                    },
                    debug: function() {
                        if (!settings.silent && settings.debug) {
                            if (settings.performance) {
                                module.performance.log(arguments);
                            }
                            else {
                                module.debug = Function.prototype.bind.call(console.info, console, settings.name + ':');
                                module.debug.apply(console, arguments);
                            }
                        }
                    },
                    verbose: function() {
                        if (!settings.silent && settings.verbose && settings.debug) {
                            if (settings.performance) {
                                module.performance.log(arguments);
                            }
                            else {
                                module.verbose = Function.prototype.bind.call(console.info, console, settings.name + ':');
                                module.verbose.apply(console, arguments);
                            }
                        }
                    },
                    error: function() {
                        if (!settings.silent) {
                            module.error = Function.prototype.bind.call(console.error, console, settings.name + ':');
                            module.error.apply(console, arguments);
                        }
                    },
                    performance: {
                        log: function(message) {
                            let currentTime,
                                executionTime,
                                previousTime
                            ;
                            if (settings.performance) {
                                currentTime   = new Date().getTime();
                                previousTime  = time || currentTime;
                                executionTime = currentTime - previousTime;
                                time          = currentTime;
                                performance.push({
                                    'Name'           : message[0],
                                    'Arguments'      : [].slice.call(message, 1) || '',
                                    'Element'        : element,
                                    'Execution Time' : executionTime
                                });
                            }
                            clearTimeout(module.performance.timer);
                            module.performance.timer = setTimeout(module.performance.display, 500);
                        },
                        display: function() {
                            let title = settings.name + ':',
                                totalTime = 0
                            ;
                            time = false;
                            clearTimeout(module.performance.timer);
                            $.each(performance, function(index, data) {
                                totalTime += data['Execution Time'];
                            });
                            title += ' ' + totalTime + 'ms';
                            if (selectorNamespace) {
                                title += ' \'' + selectorNamespace + '\'';
                            }
                            if ((console.group !== undefined || console.table !== undefined) && performance.length > 0) {
                                console.groupCollapsed(title);
                                if (console.table) {
                                    console.table(performance);
                                }
                                else {
                                    $.each(performance, function(index, data) {
                                        console.log(data['Name'] + ': ' + data['Execution Time']+'ms');
                                    });
                                }
                                console.groupEnd();
                            }
                            performance = [];
                        }
                    },
                    invoke: function(query, passedArguments, context) {
                        let object = instance,
                            maxDepth,
                            found,
                            response
                        ;
                        passedArguments = passedArguments || queryArguments;
                        context         = element         || context;
                        if (typeof query == 'string' && object !== undefined) {
                            query    = query.split(/[\. ]/);
                            maxDepth = query.length - 1;
                            $.each(query, function(depth, value) {
                                const camelCaseValue = (depth !== maxDepth)
                                    ? value + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1)
                                    : query
                                ;
                                if ( $.isPlainObject(object[camelCaseValue]) && (depth !== maxDepth) ) {
                                    object = object[camelCaseValue];
                                }
                                else if (object[camelCaseValue] !== undefined) {
                                    found = object[camelCaseValue];
                                    return false;
                                }
                                else if(  $.isPlainObject(object[value]) && (depth !== maxDepth) ) {
                                    object = object[value];
                                }
                                else if (object[value] !== undefined) {
                                    found = object[value];
                                    return false;
                                }
                                else {
                                    module.error(error.method, query);
                                    return false;
                                }
                            });
                        }
                        if ($.isFunction( found ) ) {
                            response = found.apply(context, passedArguments);
                        }
                        else if (found !== undefined) {
                            response = found;
                        }
                        if ($.isArray(returnedValue)) {
                            returnedValue.push(response);
                        }
                        else if (returnedValue !== undefined) {
                            returnedValue = [returnedValue, response];
                        }
                        else if (response !== undefined) {
                            returnedValue = response;
                        }
                        return found;
                    }
                };
                if (methodInvoked) {
                    if (instance === undefined) {
                        module.initialize();
                    }
                    module.invoke(query);
                }
                else {
                    if (instance !== undefined) {
                        instance.invoke('destroy');
                    }
                    module.initialize();
                }
            })
        ;

        return (returnedValue !== undefined)
            ? returnedValue
            : this
            ;

    };

    $.fn.spinner.settings = {

        silent       : false,
        debug        : false,
        verbose      : false,
        performance  : true,

        name         : 'Spinner',
        namespace    : 'spinner',
        type         : '',

        error    : {
            method    : 'The method you called is not defined.'
        },

        metadata: {
            initValue        : 'initValue',
        },

        step             : 1,
        start            : 0,
        negative         : true,
        positive         : true,
        useIcon          : false,
        incIcon          : 'angle up',
        decIcon          : 'angle down',
        incChar          : '+',
        decChar          : '-',
        fireOnInit       : false,

        //the decimal place to round to if step is undefined
        decimalPlaces  : 2,

        // page up/down multiplier. How many more times the steps to take on page up/down press
        pageMultiplier : 2,

        selector: {

        },

        className     : {
            disabled : 'disabled'
        },

        keys : {
            pageUp     : 33,
            pageDown   : 34,
            leftArrow  : 37,
            upArrow    : 38,
            rightArrow : 39,
            downArrow  : 40
        },

        onChange : function(value, inputVal){},
        onToggle   : function(value, inputVal){},
    };


})(jQuery, window, document);
