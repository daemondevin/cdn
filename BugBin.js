/**
 * ## BugBin
 * Container-based console logging for the browser.
 * 
 * Split your debugging logs into seperate categoryies 
 * to allow you to organize your logs by name called 
 * containers. The "container" method creates a new 
 * console object enabling shorthand use like the 
 * following:
 * 
 *     const spiders = console.container('spiders');
 * 
 *     spiders.info('Things Eaten:');
 *     spiders.log('Flies');
 *     spiders.log('Moths');
 * 
 * Create sub-containers like the following: 
 *
 *     const spiders = console.container('spiders');
 * 
 *     const tarantulas = spiders.container('tarantulas');
 *     const huntsman = spiders.container('huntsman');
 *
 *     huntsman.info('Can have a leg span up to 1 ft in length.);
 *     tarantulas.warn('Can bite painfully hard!');
 * 
 * Turn on/off logging globally or for certain containers like so:
 * 
 *     // Turn off info about all creepy spiders
 *     console.container('spiders').off(); 
 *     // or...
 *     console.off('spiders');
 *     // The following fact will not show in the console
 *     spiders.info('The Black Widow is the 2nd most common spider');
 *     // Miss the fun facts?
 *     console.conatiner('spiders').on(); // console.on('spiders');
 * 
 * All logging statements are still being recorded regardless of 
 * the use of the off() method. See all log statements that have 
 * been recorded with the following:
 * 
 *     console.container('spiders').logs();
 * 
 * For a more verbose output with stack tracing, make sure in your 
 * options object you have set { 'verbose': true } and then you
 * could simply:
 * 
 *     console.container('spiders').verbose();
 * 
 * Here's the default settings object: 
 *
 *     {
 *         "enabled": true,
 *         "verbose": true,
 *         "inline": true,
 *         "color": "darkorange", // if the browser supports styles
 *         "background": "#111", // automatically checks for suport
 *     }
 * 
 * @todo Add support for console logging levels
 * @todo Add support for log filtering by type (e.g., only show errors)
 * @todo Add support for log filtering by time (e.g., only show logs from the last hour)
 * @todo Add support for log filtering by container (e.g., only show logs from a specific container)
 * @todo Add support for log filtering by message content (e.g., only show logs containing a specific keyword)
 *
 * @see {@link https://github.com/daemondevin/cdn/blob/main/BugBin.js}
 */
(function () {

    /**
     * BugBin is a customizable logging utility that wraps around a console-like object,
     * providing enhanced logging features such as colorized output, inline display in the DOM,
     * verbosity with stack traces, and log containers for namespaced logging.
     *
     * @constructor
     * @param {Object} consoleObj - The console-like object to use for logging (e.g., window.console).
     * @param {string} name - The name or namespace for this logger instance.
     * @param {Object} [options] - Configuration options for the logger.
     * @param {boolean} [options.enabled=true] - Whether logging is enabled.
     * @param {boolean} [options.verbose=true] - Whether to capture verbose logs with stack traces.
     * @param {boolean} [options.inline=true] - Whether to display logs inline in the DOM.
     * @param {string|Element} [options.element='#debugger'] - Selector or element for inline log display.
     * @param {string} [options.elemClass='ui small inverted divided list'] - CSS class for the inline log container.
     * @param {string} [options.color='darkorange'] - Text color for colorized logs.
     * @param {string} [options.background='#111'] - Background color for colorized logs.
     *
     * @example
     * const logger = new BugBin(console, 'App', { color: 'blue', inline: false });
     * logger.log('Hello world!');
     */
    function BugBin(consoleObj, name, options) {
      let options = options || {},
          opts = {
            enabled: typeof options.enabled != 'undefined' ? options.enabled : true,
            verbose: typeof options.verbose != 'undefined' ? options.verbose : true,
            inline: typeof options.inline != 'undefined' ? options.inline : true,
            element: typeof options.element !== 'undefined' ? options.element : '#debugger',
            elemClass: typeof options.elemClass !== 'undefined' ? options.elemClass : 'ui small inverted divided list',
            color: typeof options.color != 'undefined' ? options.color : 'darkorange',
            background: typeof options.background != 'undefined' ? options.background : '#111'
          },
          colorTypes = 'dir|dirxml|error|info|log|warn',
          colorSupported = isColorSupported(),
          containers = {}, cleanLogs = [], logs = [], verbose = [];
  
      /**
       * Logs messages to the console and/or a specified DOM element with optional styling and verbosity.
       *
       * @param {IArguments|Array} args - The arguments to log. Typically the arguments object from another function.
       * @param {string} type - The type of log (e.g., 'log', 'warn', 'error', 'dir').
       *
       * @description
       * Depending on the options (`opts`), this function can:
       * - Output logs to the console with optional color styling.
       * - Append logs to a DOM element if inline logging is enabled.
       * - Add timestamps to logs.
       * - Store logs in an internal array.
       * - Optionally include stack traces if verbose mode is enabled.
       */
      function log(args, type) {
        let color;
  
        args = Array.prototype.slice.call(args, 0);
        if (opts.enabled) {
          if (opts.inline) {
            const elem = document.querySelector(opts.element);
            if (elem) {
              elem.className = opts.elemClass;
              elem.append(printDisplay(type, args, name));
            }
          }
          if (colorSupported && name !== undefined && colorTypes.indexOf(type) !== -1) {
            color = (type !== 'dir') ? '%c ' : '';
            args.unshift(color + name + ' ', 'color:' + opts.color + '; background:' + opts.background + '; font-weight:bold');
            consoleObj[type].apply(consoleObj, args);
            args.splice(0, 1);
          } else {
            consoleObj[type].apply(consoleObj, args);
          }
        }
        //cleanLogs.push(args);
        if (opts.verbose) {
          getStack(type, args);
        }
        args.push(new Date()); //add timestamp
        logs.push(args);
  
      }

      /**
       * Checks if the current browser supports color features based on the user agent.
       *
       * @returns {boolean} Returns true if the browser is Firefox or Chrome, otherwise false.
       */
      function isColorSupported() {
        const ua = navigator.userAgent.toLowerCase();
        return ua.indexOf('firefox') != -1 || ua.indexOf('chrome') != -1;
      }
        
      /**
       * Creates a styled DOM element to display a message with a specific type and name.
       *
       * @param {string} type - The type of message (e.g., "error", "info", "success").
       * @param {*} msg - The message content to display. Can be any type; objects will be stringified.
       * @param {string} name - The name or source to display in the message header.
       * @returns {HTMLDivElement} The constructed DOM element representing the message.
       */
      function printDisplay(type, msg, name) {
          let content, header, item, strong;
              item = document.createElement("div");
              item.className = type + " item";
              content = document.createElement("div");
              content.className = "content";
              header = document.createElement("div");
              header.className = "header";
              strong = document.createElement("strong");
              strong.append("[" + name.toUpperCase() + "] | " + type.toUpperCase() + ":")
              header.append(strong);
              content.append(header);
              if (typeof msg.toString() === "object") {
                  content.append(JSON.stringify(msg, null, "\t") + "");
              } else {
                  content.append(" " + msg.toString());
              }
              item.append(content);
              return item;
      }
  
      /**
       * Captures and logs a stack trace along with the provided log type, timestamp, and arguments.
       *
       * @param {string} [type='log'] - The type of log entry (e.g., 'log', 'error', etc.).
       * @param {Array} args - The arguments to log. If empty or not provided, the function returns early.
       * @returns {void}
       */
      function getStack(type, args) {
          const time = new Date().toUTCString();
          
          if (!type) type = 'log';
          if (!args || args.length === 0) return;
  
          let stack = false;
            try { throw Error('') } catch (error) {
              let stackParts = error.stack.split('\n');
              stack = [];
              for (let i = 0; i < stackParts.length; i++) {
                if (stackParts[i].indexOf('BugBin.js') > -1 ||
                stackParts[i] === 'Error') {
                  continue;
                }
                stack.push(stackParts[i].trim());
              }
            }
            verbose.push({ type: type, timestamp: time, arguments: args, stack: stack });
      }
  
      this.container = function (name, options) {
        let container = containers[name];
  
        if (!container) {
          container = new BugBin(consoleObj, name, options);
          containers[name] = container;
        }
  
        return container;
      };
  
      this.on = function (name) {
        if (typeof name != 'undefined') {
          if (containers[name]) containers[name].on();
        } else {
          opts.enabled = true;
        }
      };
  
      this.off = function (name) {
        if (typeof name != 'undefined') {
          if (containers[name]) containers[name].off();
        } else {
          opts.enabled = false;
        }
      };
  
      this.logs = function () {
        return logs;
      };
  
      this.cleanLogs = function () {
        return cleanLogs;
      };
  
      this.verbose = function () {
        return verbose;
      };
  
      this.color = function (color) {
        opts.color = color;
      };
  
      this.background = function (background) {
        opts.background = background;
      };
        
      this.assert = function () { log(arguments, 'assert'); };
      this.clear = function () { log(arguments, 'clear'); };
      this.count = function () { log(arguments, 'count'); };
      this.debug = function () { log(arguments, 'debug'); };
      this.dir = function () { log(arguments, 'dir'); };
      this.dirxml = function () { log(arguments, 'dirxml'); };
      this.error = function () { log(arguments, 'error'); };
      this.exception = function () { log(arguments, 'exception'); };
      this.group = function () { log(arguments, 'group'); };
      this.groupCollapsed = function () { log(arguments, 'groupCollapsed'); };
      this.groupEnd = function () { log(arguments, 'groupEnd'); };
      this.info = function () { log(arguments, 'info'); };
      this.log = function () { log(arguments, 'log'); };
      this.profile = function () { log(arguments, 'profile'); };
      this.profileEnd = function () { log(arguments, 'profileEnd'); };
      this.table = function () { log(arguments, 'table'); };
      this.time = function () { log(arguments, 'time'); };
      this.timeEnd = function () { log(arguments, 'timeEnd'); };
      this.timeStamp = function () { log(arguments, 'timeStamp'); };
      this.trace = function () { log(arguments, 'trace'); };
      this.warn = function () { log(arguments, 'warn'); };
    }

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
      module.exports = function(consoleObj) { return new BugBin(consoleObj); }; // Node / CommonJS...
    } else if (typeof define === 'function' && define.amd) {
      define([], () => function(consoleObj) { return new BugBin(consoleObj); }); // or RequireJS / AMD...
    } else {
      const originalConsole = window.console;
      window.console = new BugBin(originalConsole);
    }
  
  })();
