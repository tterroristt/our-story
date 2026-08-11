"use strict";


/* =========================================================
   OUR STORY
   Minimal JavaScript only.
   ========================================================= */


/* =========================================================
   SCROLL REVEALS
   ========================================================= */

const revealElements =
    document.querySelectorAll(".reveal");


const prefersReducedMotion =
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;


/*
   If the user has reduced motion enabled,
   show everything immediately.
*/

if (prefersReducedMotion) {

    revealElements.forEach((element) => {

        element.classList.add("visible");

    });

}


/*
   Otherwise, reveal sections gently while scrolling.
*/

else {

    const revealObserver =
        new IntersectionObserver(

            (entries, observer) => {

                entries.forEach((entry) => {

                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add("visible");

                    observer.unobserve(entry.target);

                });

            },

            {
                threshold: 0.12,
                rootMargin: "0px 0px -40px 0px"
            }

        );


    revealElements.forEach((element) => {

        revealObserver.observe(element);

    });

}



/* =========================================================
   REPLAY BUTTON
   ========================================================= */

const replayButton =
    document.getElementById("replayButton");


if (replayButton) {

    replayButton.addEventListener(
        "click",
        () => {

            window.scrollTo({

                top: 0,

                behavior:
                    prefersReducedMotion
                        ? "auto"
                        : "smooth"

            });

        }
    );

}



/* =========================================================
   REMOVE URL HASH AFTER PAGE LOAD

   Example:
   /our-story/#story

   becomes:
   /our-story/

   This keeps reloads from opening halfway down the page.
   ========================================================= */

window.addEventListener(
    "load",
    () => {

        if (window.location.hash) {

            history.replaceState(
                null,
                "",
                window.location.pathname +
                window.location.search
            );

        }

    }
);
