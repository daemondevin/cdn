/**
 * Custom Physics2DPlugin for GSAP
 * A from-scratch implementation providing 2D physics simulation
 * (velocity, angle, acceleration, gravity, friction)
 *
 * Compatible with GSAP 3.x plugin API
 * Usage: gsap.registerPlugin(Physics2DPlugin)
 */
const Physics2DPlugin = {
    version: "1.0.0",
    name: "physics2D",

    // Called once when the plugin is registered
    init(target, config, tween) {
        const DEG_TO_RAD = Math.PI / 180;

        const velocity         = +config.velocity         || 0;
        const angle            = (+config.angle           || 0) * DEG_TO_RAD;
        const acceleration     = +config.acceleration     || 0;
        const accAngle         = (config.accelerationAngle !== undefined
                                    ? +config.accelerationAngle
                                    : (config.angle || 0)) * DEG_TO_RAD;
        const gravity          = +config.gravity          || 0;  // pixels/s² downward
        const friction         = Math.min(Math.max(+config.friction || 0, 0), 1);

        const xProp = config.xProp || "x";
        const yProp = config.yProp || "y";

        // Gravity always acts straight down (90°)
        const gravAngle = 90 * DEG_TO_RAD;

        // velocities in px/s
        this._vx = Math.cos(angle) * velocity;
        this._vy = Math.sin(angle) * velocity;

        this._ax = Math.cos(accAngle) * acceleration;
        this._ay = Math.sin(accAngle) * acceleration;

        // Add gravity to y-acceleration
        this._ay += gravity;  // gravity pulls downward (+y)

        this._friction = 1 - friction;

        const gsapData = target._gsap;
        const getVal   = (prop) => parseFloat(gsapData ? gsapData.get(target, prop) : 0) || 0;

        this._startX  = getVal(xProp);
        this._startY  = getVal(yProp);

        this._xProp = xProp;
        this._yProp = yProp;
        this._target = target;
        this._tween  = tween;

        // Register the properties so GSAP knows this plugin owns them
        this._props.push(xProp, yProp);
    },

    // Called every frame with the tween's normalised progress (ratio 0→1)
    render(ratio, data) {
        const tween    = data._tween;
        const duration = tween.duration();

        // Elapsed seconds in the forward direction (handles _from tweens too)
        const elapsed = tween._from
            ? (1 - ratio) * duration
            : ratio * duration;

        let x, y;

        if (data._friction >= 1) {
            //   pos = start + v₀·t + ½·a·t²
            const t  = elapsed;
            const t2 = t * t * 0.5;

            x = data._startX + data._vx * t + data._ax * t2;
            y = data._startY + data._vy * t + data._ay * t2;
        } else {
            // We integrate in discrete steps so friction feels consistent
            // regardless of frame rate or tween duration.
            const STEPS_PER_SEC = 60;
            const dt            = 1 / STEPS_PER_SEC;
            const totalSteps    = Math.round(elapsed * STEPS_PER_SEC);
            const fr            = Math.pow(data._friction, dt); // per-step multiplier

            let vx = data._vx;
            let vy = data._vy;
            let px = data._startX;
            let py = data._startY;

            for (let i = 0; i < totalSteps; i++) {
                vx  = (vx + data._ax * dt) * fr;
                vy  = (vy + data._ay * dt) * fr;
                px += vx * dt;
                py += vy * dt;
            }

            // Fractional remainder step
            const rem = (elapsed * STEPS_PER_SEC) - totalSteps;
            if (rem > 0) {
                vx  = (vx + data._ax * dt) * fr;
                vy  = (vy + data._ay * dt) * fr;
                px += vx * dt * rem;
                py += vy * dt * rem;
            }

            x = px;
            y = py;
        }

        const gsapData = data._target._gsap;
        if (gsapData) {
            gsapData.set(data._target, data._xProp)(data._target, data._xProp, Math.round(x * 10000) / 10000);
            gsapData.set(data._target, data._yProp)(data._target, data._yProp, Math.round(y * 10000) / 10000);
        }
    },

    // Called if a conflicting tween kills one of our properties
    kill(property) {
        if (property === this._xProp) this._xProp = null;
        if (property === this._yProp) this._yProp = null;
    }
};

// Auto-register if GSAP is already on the page
if (typeof gsap !== "undefined") {
    gsap.registerPlugin(Physics2DPlugin);
}

// Support CommonJS / ES module / global usage
if (typeof module !== "undefined" && module.exports) {
    module.exports = Physics2DPlugin;
} else if (typeof define === "function" && define.amd) {
    define([], () => Physics2DPlugin);
} else if (typeof window !== "undefined") {
    window.Physics2DPlugin = Physics2DPlugin;
}
