const TIMER_START = new Date('2021-04-05T05:00:00.000Z');
const TIMER_END = new Date('2021-04-07T17:00:00.000Z');

function dom_time_elements() {
    return {
        // days: $('#t #d'),
        hours: $('#t #h'),
        minutes: $('#t #m'),
        seconds: $('#t #s'),
        miseconds: $('#t #ms'),
        progress: $('#tp > div'),
        label: $('#tl')
    };
}


const UNIT_SECOND = 1000;
const UNIT_MINUTE = UNIT_SECOND * 60;
const UNIT_HOUR = UNIT_MINUTE * 60;
const UNIT_DAY = UNIT_HOUR * 24;
const L_FLOORMOD = (num, mod) => Math.floor(num) % mod;
const L_FIXED = (num, pre, length) => (pre + num).slice(-length);

function util_time_remaining(misecDiff) {
    return {
        // days: fl(misecDiff / UNIT_DAY, 1),
        hours: L_FIXED(Math.floor(misecDiff / UNIT_HOUR), '00', 2),
        minutes: L_FIXED(L_FLOORMOD(misecDiff / UNIT_MINUTE, 60), '00', 2),
        seconds: L_FIXED(L_FLOORMOD(misecDiff / UNIT_SECOND, 60), '00', 2),
        miseconds: L_FIXED(L_FLOORMOD(misecDiff, 1000), '000', 3)
    };
}

function co_render_expired(misecDiff, dCtrl) {
    // Drop our timer DOM
    $('.time').remove();
    $(".pre-progress #symb").remove();

    $('title').text('Security Warning :: Orders Recieved')

    dCtrl.progress.css('width', '100%');
    dCtrl.label.text('Orders received.')
}

function co_render_normal(misecDiff, dCtrl, remain) {
    for (const key in remain) {
        dCtrl[key].text(remain[key]);
    }
}

const EVENTS = {TIMER_POG: false};
function co_think_handle(remain, misecDiff, dCtrl) {
    // We don't need no fancy event disbatch system.

    if (! EVENTS.TIMER_POG && remain.hours <= 1) {
        dCtrl.miseconds.removeClass('hide');
        EVENTS.TIMER_POG = true;
    }

    if (misecDiff <= 0) {
        clearInterval(TIMER);
        co_render_expired(misecDiff, dCtrl);
        return;
    }

    co_render_normal(misecDiff, dCtrl, remain);
}

let bMutex = false;
function co_update_time(dCtrl) {
    if (bMutex) return;
    bMutex = true;

    const misecDiff = TIMER_END - new Date();
    const length = TIMER_END - TIMER_START
    const deltaTime = (length - misecDiff) / length;

    dCtrl.progress.css('width', `${deltaTime * 100}%`);

    if (misecDiff <= 0) {
        if (timer) clearInterval(timer);
        co_render_expired(misecDiff, dCtrl);

        return;
    }

    co_think_handle(remain, misecDiff, dCtrl)

    bMutex = false;
}


function co_create_thread(dCtrl) {
    return () => {
        co_update_time(dCtrl);
    }
}

let TIMER;
function main() {
    const dCtrl = dom_time_elements();
    // Pop this off of the main thread.
    TIMER = setInterval(co_create_thread(dCtrl, TIMER), 7);
}

$(window).on('load', main);
