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
 */
(function () {

  function BugBin(console, name, options) {
    options = options || {},
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



    //private
    function log(args, type) {
      let color;

      args = Array.prototype.slice.call(args, 0);
      if (opts.enabled) {
        if (opts.inline) {
          const elem = document.querySelector(opts.element);
          elem.className = opts.elemClass;
          elem.append(printDisplay(type, args, name));
        }
        if (colorSupported && name !== undefined && colorTypes.indexOf(type) !== -1) {
          color = (type !== 'dir') ? '%c ' : '';
          args.unshift(color + name + ' ', 'color:' + opts.color + '; background:' + opts.background + '; font-weight:bold');
          console[type].apply(console, args);
          args.splice(0, 1);
        } else {
          console[type].apply(console, args);
        }
      }
      //cleanLogs.push(args);
      if (opts.verbose) {
        getStack(type, args);
      }
      args.push(new Date()); //add timestamp
      logs.push(args);

    }

    function argumentsToArray(args) {
      return Array.prototype.slice.call(args, 0);
    }

    function isColorSupported() {
      const ua = navigator.userAgent.toLowerCase();
      return ua.indexOf('firefox') != -1 || ua.indexOf('chrome') != -1;
    }
      
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
        container = new BugBin(console, name, options);
        containers[name] = container;
      }

      return container;
    };

    this.on = function (name) {
      if (typeof name != 'undefined') {
        containers[name].on();
      } else {
        opts.enabled = true;
      }
    };

    this.off = function (name) {
      if (typeof name != 'undefined') {
        containers[name].off();
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

  //override window.console
  console = window.console;
  window.console = new BugBin(console);

})();
