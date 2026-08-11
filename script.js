"use strict";


/* ==========================================================
   OUR STORY
   ========================================================== */


/* ==========================================================
   DOM REFERENCES
   ========================================================== */

const revealElements =
    document.querySelectorAll(".reveal");

const cake =
    document.getElementById("cake");

const wishButton =
    document.getElementById("wishButton");

const tapBlowButton =
    document.getElementById("tapBlowButton");

const cakeInstruction =
    document.getElementById("cakeInstruction");

const wishResult =
    document.getElementById("wishResult");


const prefersReducedMotion =
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;



/* ==========================================================
   SCROLL REVEAL
   ========================================================== */

function setupScrollReveal() {

    if (prefersReducedMotion) {

        revealElements.forEach((element) => {
            element.classList.add("is-visible");
        });

        return;
    }


    /*
       IntersectionObserver is more efficient than listening
       to every scroll event.
    */

    const observer =
        new IntersectionObserver(

            (entries, currentObserver) => {

                entries.forEach((entry) => {

                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add(
                        "is-visible"
                    );

                    currentObserver.unobserve(
                        entry.target
                    );

                });

            },

            {
                threshold: 0.12,
                rootMargin:
                    "0px 0px -40px 0px"
            }

        );


    revealElements.forEach((element) => {
        observer.observe(element);
    });

}



/* ==========================================================
   CAKE STATE
   ========================================================== */

let candlesAreBlown = false;

let microphoneStream = null;
let audioContext = null;
let analyser = null;

let detectionFrame = null;



/* ==========================================================
   COMPLETE THE WISH
   ========================================================== */

function blowOutCandles() {

    if (candlesAreBlown) {
        return;
    }


    candlesAreBlown = true;


    cake.classList.add("is-blown");


    cakeInstruction.textContent =
        "you got them!";


    wishButton.hidden = true;
    tapBlowButton.hidden = true;


    /*
       Wait briefly so she sees the candles extinguish
       before the final message appears.
    */

    window.setTimeout(() => {

        wishResult.classList.add(
            "is-visible"
        );

    }, 600);


    stopMicrophone();

}



/* ==========================================================
   MICROPHONE CLEANUP
   ========================================================== */

function stopMicrophone() {

    if (detectionFrame !== null) {

        cancelAnimationFrame(
            detectionFrame
        );

        detectionFrame = null;

    }


    if (microphoneStream) {

        microphoneStream
            .getTracks()
            .forEach((track) => {
                track.stop();
            });

        microphoneStream = null;

    }


    if (
        audioContext &&
        audioContext.state !== "closed"
    ) {

        audioContext.close();

    }


    audioContext = null;
    analyser = null;

}



/* ==========================================================
   AUDIO VOLUME
   ========================================================== */

function calculateVolume(samples) {

    let total = 0;


    for (
        let index = 0;
        index < samples.length;
        index++
    ) {

        /*
           Audio samples arrive between 0 and 255.

           Convert them to roughly -1 through +1.
        */

        const normalized =
            (samples[index] - 128) / 128;


        total +=
            normalized * normalized;

    }


    /*
       Root mean square gives us a simple measurement
       of the current microphone loudness.
    */

    return Math.sqrt(
        total / samples.length
    );

}



/* ==========================================================
   CALIBRATION
   ========================================================== */

function calibrateMicrophone(samples) {

    return new Promise((resolve) => {

        const measurements = [];

        const startedAt =
            performance.now();


        function measureRoomNoise() {

            analyser.getByteTimeDomainData(
                samples
            );


            measurements.push(
                calculateVolume(samples)
            );


            const elapsed =
                performance.now() -
                startedAt;


            if (elapsed < 800) {

                requestAnimationFrame(
                    measureRoomNoise
                );

                return;

            }


            const averageNoise =
                measurements.reduce(
                    (sum, value) =>
                        sum + value,
                    0
                ) /
                measurements.length;


            resolve(averageNoise);

        }


        measureRoomNoise();

    });

}



/* ==========================================================
   BLOW DETECTION
   ========================================================== */

function listenForBlow(
    samples,
    threshold
) {

    let loudFrames = 0;


    function detect() {

        if (
            candlesAreBlown ||
            !analyser
        ) {
            return;
        }


        analyser.getByteTimeDomainData(
            samples
        );


        const volume =
            calculateVolume(samples);


        /*
           One loud noise isn't enough.

           The microphone has to stay above the threshold
           for several frames, which makes accidental triggers
           less likely.
        */

        if (volume > threshold) {

            loudFrames += 1;

        } else {

            loudFrames =
                Math.max(
                    0,
                    loudFrames - 1
                );

        }


        if (loudFrames >= 7) {

            blowOutCandles();

            return;
        }


        detectionFrame =
            requestAnimationFrame(
                detect
            );

    }


    detect();

}



/* ==========================================================
   START MICROPHONE
   ========================================================== */

async function startBlowDetection() {

    if (candlesAreBlown) {
        return;
    }


    /*
       Old browsers or unusual WebViews may not support
       mediaDevices. Use the tap fallback in that case.
    */

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        showTapFallback();

        return;
    }


    wishButton.disabled = true;

    wishButton.textContent =
        "getting ready…";


    cakeInstruction.textContent =
        "allow microphone access";


    try {

        microphoneStream =
            await navigator.mediaDevices
                .getUserMedia({

                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }

                });


        const BrowserAudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!BrowserAudioContext) {

            showTapFallback();

            return;
        }


        audioContext =
            new BrowserAudioContext();


        /*
           iOS Safari may create the AudioContext
           in a suspended state.
        */

        if (
            audioContext.state ===
            "suspended"
        ) {

            await audioContext.resume();

        }


        const microphoneSource =
            audioContext
                .createMediaStreamSource(
                    microphoneStream
                );


        analyser =
            audioContext.createAnalyser();


        analyser.fftSize = 512;

        analyser.smoothingTimeConstant =
            0.2;


        microphoneSource.connect(
            analyser
        );


        const samples =
            new Uint8Array(
                analyser.fftSize
            );


        /*
           Measure the room first so the blow threshold
           adapts to her environment.
        */

        cakeInstruction.textContent =
            "hold still for just a second…";


        const roomNoise =
            await calibrateMicrophone(
                samples
            );


        /*
           Never let the threshold get too low.

           Otherwise a quiet room could make normal speech
           extinguish the candles.
        */

        const blowThreshold =
            Math.max(
                0.06,
                roomNoise * 3.2
            );


        wishButton.textContent =
            "listening…";


        cakeInstruction.textContent =
            "okay… blow out the candles";


        listenForBlow(
            samples,
            blowThreshold
        );

    }

    catch (error) {

        console.warn(
            "Microphone access failed:",
            error
        );


        showTapFallback();

    }

}



/* ==========================================================
   FALLBACK
   ========================================================== */

function showTapFallback() {

    stopMicrophone();


    wishButton.hidden = true;

    tapBlowButton.hidden = false;


    cakeInstruction.textContent =
        "you can still make your wish";

}



/* ==========================================================
   EVENT LISTENERS
   ========================================================== */

wishButton.addEventListener(
    "click",
    startBlowDetection
);


tapBlowButton.addEventListener(
    "click",
    blowOutCandles
);



/* ==========================================================
   INITIALIZE
   ========================================================== */

setupScrollReveal();
