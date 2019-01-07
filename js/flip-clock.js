var FlipClock = function (options) {
    var key;
    this.element = undefined;
    this.seconds = false;
    this.twentyFourHour = false;
    this.hasOneFlipWindow = false;
    this.hasColons = true;
    if (options instanceof HTMLElement) {
        this.element = options;
    } else if (options instanceof Object) {
        for (key in options) {
            if (options.hasOwnProperty(key)) {
                this[key] = options[key];
            }
        }
    }
    this.empty();
    this.initializeElements();
    this.run();
};

FlipClock.prototype.empty = function () {
    while (this.element && this.element.hasChildNodes()) {
        this.element.removeChild(this.element.firstChild);
    }
};

FlipClock.prototype.initializeHoursElements = function () {
    this.cells.hours = new FlipClock.Cell({
        numStates: 24,
        debug: true,
        hoursMode: this.twentyFourHour ? 24 : 12,
        audioURL: this.audioURL
    });
    if (this.hasOneFlipWindow) {
        this.flipWindow.appendChild(this.cells.hours.element);
    } else {
        this.hoursFlipWindow = document.createElement('span');
        this.hoursFlipWindow.classList.add('flip-clock-window');
        this.hoursFlipWindow.appendChild(this.cells.hours.element);
        this.element.appendChild(this.hoursFlipWindow);
    }
};

FlipClock.prototype.initializeMinutesElements = function () {
    this.cells.minutes = new FlipClock.Cell({
        numDigits: 2,
        numStates: 60,
        audioURL: this.audioURL
    });
    if (this.hasOneFlipWindow) {
        this.flipWindow.appendChild(this.cells.minutes.element);
    } else {
        this.minutesFlipWindow = document.createElement('span');
        this.minutesFlipWindow.classList.add('flip-clock-window');
        this.minutesFlipWindow.appendChild(this.cells.minutes.element);

        if (this.hasColons) {
            this.colons.minutes = new FlipClock.Text(':');
            this.element.appendChild(this.colons.minutes.element);
        }
        this.element.appendChild(this.minutesFlipWindow);
    }
};

FlipClock.prototype.initializeSecondsElements = function () {
    this.cells.seconds = new FlipClock.Cell({
        numDigits: 2,
        numStates: 60,
        audioURL: this.audioURL
    });
    if (!this.seconds) {
        return;
    }
    if (this.hasOneFlipWindow) {
        this.flipWindow.appendChild(this.cells.seconds.element);
    } else {
        this.secondsFlipWindow = document.createElement('span');
        this.secondsFlipWindow.classList.add('flip-clock-window');
        this.secondsFlipWindow.appendChild(this.cells.seconds.element);

        if (this.hasColons) {
            this.colons.seconds = new FlipClock.Text(':');
            this.element.appendChild(this.colons.seconds.element);
        }
        this.element.appendChild(this.secondsFlipWindow);
    }
};

FlipClock.prototype.initializeElements = function () {
    this.colons = {};
    this.cells = {};

    if (this.hasOneFlipWindow) {
        this.flipWindow = document.createElement('span');
        this.flipWindow.classList.add('flip-clock-window');
        this.element.appendChild(this.flipWindow);
    }

    this.initializeHoursElements();
    this.initializeMinutesElements();
    this.initializeSecondsElements();
};

FlipClock.prototype.run = function () {
    var date = this.update();
    var msec = 1000 - date.getMilliseconds();
    this.timeout = setTimeout(this.run.bind(this), msec);
};

FlipClock.prototype.stop = function () {
    if (this.timeout) {
        var timeout = this.timeout;
        delete this.timeout;
        clearTimeout(timeout);
    }
};

FlipClock.prototype.update = function () {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var delay = 0;
    var changedHours = this.cells.hours.setState(hours, delay);
    if (changedHours) {
        delay += 5;
    }
    var changedMinutes = this.cells.minutes.setState(minutes, delay);
    if (changedMinutes) {
        delay += 5;
    }
    var changedSeconds = this.cells.seconds.setState(seconds, delay);
    return date;
};

FlipClock.Cell = function (options) {
    var i, key;
    this.element = document.createElement('span');
    this.element.appendChild(document.createTextNode(FlipClock.Unicode.NO_BREAK_SPACE));
    this.element.classList.add('flip-clock-cell');
    if (options instanceof Object) {
        for (key in options) {
            if (options.hasOwnProperty(key)) {
                this[key] = options[key];
            }
        }
    }
    if (!('state' in this)) {
        this.state = 0;
        this.stateFrame = 0;
    }
    if (!('strings' in this)) {
        if (this.hoursMode === 24) {
            this.set24HourStrings();
        } else if (this.hoursMode === 12) {
            this.set12HourStrings();
        } else {
            this.setNumericStrings(this.numDigits);
        }
    }

    this.busy = false;

    this.topFlap = document.createElement('span');
    this.topFlap.classList.add('flip-clock-flap',
                               'flip-clock-static-flap',
                               'flip-clock-top-flap');
    this.bottomFlap = document.createElement('span');
    this.bottomFlap.classList.add('flip-clock-flap',
                                  'flip-clock-static-flap',
                                  'flip-clock-bottom-flap');
    this.topFlapText = document.createElement('span');
    this.bottomFlapText = document.createElement('span');
    this.topFlapText.textContent = this.strings[this.stateFrame];
    this.bottomFlapText.textContent = this.strings[this.stateFrame];
    this.topFlapIndicator = document.createElement('span');
    this.bottomFlapIndicator = document.createElement('span');
    this.topFlapIndicator.textContent = this.indicators ? this.indicators[this.stateFrame] : '';
    this.bottomFlapIndicator.textContent = this.indicators ? this.indicators[this.stateFrame] : '';
    this.topFlapIndicator.classList.add('indicator');
    this.bottomFlapIndicator.classList.add('indicator');

    this.element.appendChild(this.topFlap);
    this.element.appendChild(this.bottomFlap);
    this.topFlap.appendChild(this.topFlapText);
    this.bottomFlap.appendChild(this.bottomFlapText);
    this.topFlap.appendChild(this.topFlapIndicator);
    this.bottomFlap.appendChild(this.bottomFlapIndicator);

    this.rotator = document.createElement('span');
    this.rotator.classList.add('flip-clock-rotator');
    this.obverse = document.createElement('span');
    this.obverse.classList.add('obverse');
    this.reverse = document.createElement('span');
    this.reverse.classList.add('reverse');
    this.obverseInner = document.createElement('span');
    this.obverseInner.classList.add('inner', 'flip-clock-flap');
    this.reverseInner = document.createElement('span');
    this.reverseInner.classList.add('inner', 'flip-clock-flap');
    this.obverseText = document.createElement('span');
    this.reverseText = document.createElement('span');
    this.obverseText.textContent = FlipClock.Unicode.NO_BREAK_SPACE;
    this.reverseText.textContent = FlipClock.Unicode.NO_BREAK_SPACE;
    this.obverseIndicator = document.createElement('span');
    this.reverseIndicator = document.createElement('span');
    this.obverseIndicator.classList.add('indicator');
    this.reverseIndicator.classList.add('indicator');

    this.element.appendChild(this.rotator);
    this.rotator.appendChild(this.obverse);
    this.rotator.appendChild(this.reverse);
    this.obverse.appendChild(this.obverseInner);
    this.reverse.appendChild(this.reverseInner);
    this.obverseInner.appendChild(this.obverseText);
    this.reverseInner.appendChild(this.reverseText);
    this.obverseInner.appendChild(this.obverseIndicator);
    this.reverseInner.appendChild(this.reverseIndicator);

    if (this.audioURL) {
        this.audio = new Audio(this.audioURL);
        this.element.appendChild(this.audio);
    }

    if (!FlipClock.whichTransitionEvent) {
        var e = document.createElement('fakeelement');
        if (e.style.transition !== undefined) {
            FlipClock.whichTransitionEvent = 'transitionend';
        } else if (e.style.OTransition !== undefined) {
            FlipClock.whichTransitionEvent = 'oTransitionEnd';
        } else if (e.style.MozTransition !== undefined) {
            FlipClock.whichTransitionEvent = 'transitionend';
        } else if (e.style.WebkitTransition !== undefined) {
            FlipClock.whichTransitionEvent = 'webkitTransitionEnd';
        }
    }
};

FlipClock.Cell.prototype.setNumericStrings = function () {
    var i, s;
    this.strings = [];
    for (i = 0; i < this.numStates; i += 1) {
        s = FlipClock.Util.pad(i, this.numDigits);
        this.strings.push(s);
    }
    if (this.topFlapText) {
        this.topFlapText.textContent    = this.strings[this.stateFrame];
        this.bottomFlapText.textContent = this.strings[this.stateFrame];
        this.topFlapIndicator.textContent    = this.indicators ? this.indicators[this.stateFrame] : '';
        this.bottomFlapIndicator.textContent = this.indicators ? this.indicators[this.stateFrame] : '';
    }
};

FlipClock.Cell.prototype.set12HourStrings = function () {
    var i, h, s;
    delete this.numDigits;
    this.indicators = [];
    this.strings = [];
    for (i = 0; i < this.numStates; i += 1) {
        h = (i + 11) % 12 + 1;
        s = FlipClock.Util.pad(h, 2, FlipClock.Unicode.FIGURE_SPACE);
        this.strings.push(s);
        if (i >= 12) {
            this.indicators.push('PM');
        } else {
            this.indicators.push('AM');
        }
    }
};

FlipClock.Cell.prototype.set24HourStrings = function () {
    delete this.indicators;
    this.numDigits = 2;
    this.setNumericStrings();
};

FlipClock.Cell.prototype.tick = function () {
    if (!this.audio) {
        return;
    }
    var promise = this.audio.play();
    promise.then(function () {
        // do nothing
    }.bind(this)).catch(function (error) {
        // do nothing
    }.bind(this));
};

FlipClock.Cell.prototype.flip = function (delay) {
    if (this.stateFrame === this.state) {
        this.busy = false;
        this.element.classList.remove('rushing');
        return;
    }
    if (delay) {
        setTimeout(this.flip.bind(this, 0), delay);
        return;
    }
    requestAnimationFrame(function () {
        this.nextStateFrame = (this.stateFrame + 1) % this.numStates;
        if (this.nextStateFrame !== this.state) {
            this.element.classList.add('rushing');
        }
        if (this.audio) {
            this.tick();
        }
        this.rotator.classList.remove('visible');
        this.obverseText.textContent = this.strings[this.stateFrame];
        this.reverseText.textContent = this.strings[this.nextStateFrame];
        this.obverseIndicator.textContent = this.indicators ? this.indicators[this.stateFrame]     : '';
        this.reverseIndicator.textContent = this.indicators ? this.indicators[this.nextStateFrame] : '';
        this.rotator.classList.remove('down');
        this.rotator.classList.add('visible');
        this.topFlapText.textContent = this.strings[this.nextStateFrame];
        this.topFlapIndicator.textContent = this.indicators ? this.indicators[this.nextStateFrame] : '';
        var complete = function () {
            this.bottomFlapText.textContent = this.strings[this.nextStateFrame];
            this.bottomFlapIndicator.textContent = this.indicators ? this.indicators[this.nextStateFrame] : '';
            this.rotator.classList.remove('visible');
            this.rotator.classList.remove('down');
            this.stateFrame = this.nextStateFrame;
        }.bind(this);
        var once;
        once = function () {
            this.rotator.removeEventListener(FlipClock.whichTransitionEvent, once);
            complete();
            requestAnimationFrame(this.flip.bind(this, 0));
        }.bind(this);
        this.rotator.addEventListener(FlipClock.whichTransitionEvent, once);
        this.rotator.classList.add('down');
    }.bind(this));
};

FlipClock.Cell.prototype.setState = function (state, delay) {
    var changed = (state !== this.state);
    this.state = state;
    if (this.busy) {
        return;
    }
    this.busy = true;
    this.flip(delay);
    return changed;
};

FlipClock.Text = function (options) {
    var key;
    this.element = document.createElement('span');
    this.element.classList.add('flip-clock-text');
    if (options instanceof Object) {
        for (key in options) {
            if (options.hasOwnProperty(key)) {
                this[key] = options[key];
            }
        }
        if ('text' in options) {
        }
    } else if (options instanceof String) {
        this.text = String(options);
    } else if (typeof options === 'string') {
        this.text = options;
    }
    this.element.appendChild(document.createTextNode(this.text));
};

FlipClock.Util = {
    pad: function (number, numDigits, char) {
        if (char === null || char === undefined) {
            char = '0';
        }
        var result = String(number);
        if (numDigits && (numDigits instanceof Number || typeof numDigits === 'number')) {
            while (result.length < numDigits) {
                result = char + result;
            }
        }
        return result;
    },
};

FlipClock.Unicode = {
    NO_BREAK_SPACE: "\u00a0",
    FIGURE_SPACE: "\u2007"
};
