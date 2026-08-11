/* =========================================
   OUR STORY — JAVASCRIPT
   ========================================= */


/* =========================================
   SCROLL REVEAL
   ========================================= */

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                // Once revealed, we don't need to observe it anymore.
                revealObserver.unobserve(entry.target);

            }

        });

    },
    {
        threshold: 0.15
    }
);


revealElements.forEach((element) => {
    revealObserver.observe(element);
});


/* =========================================
   REPLAY BUTTON
   ========================================= */

const replayButton = document.getElementById("replayButton");

if (replayButton) {

    replayButton.addEventListener("click", () => {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


/* =========================================
   HEART PARTICLES
   ========================================= */

function createHeart() {

    const heart = document.createElement("span");

    heart.innerHTML = Math.random() > 0.5 ? "♡" : "♥";

    heart.style.position = "fixed";
    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.bottom = "-30px";
    heart.style.fontSize = `${12 + Math.random() * 18}px`;
    heart.style.color = "#e98f9d";
    heart.style.opacity = "0";
    heart.style.pointerEvents = "none";
    heart.style.zIndex = "100";

    document.body.appendChild(heart);

    const duration = 4000 + Math.random() * 3000;

    const animation = heart.animate(
        [
            {
                transform: "translateY(0) rotate(0deg)",
                opacity: 0
            },
            {
                transform: `translateY(-30vh) rotate(20deg)`,
                opacity: 0.7,
                offset: 0.2
            },
            {
                transform: `translateY(-110vh) rotate(-20deg)`,
                opacity: 0
            }
        ],
        {
            duration: duration,
            easing: "ease-out"
        }
    );

    animation.onfinish = () => {
        heart.remove();
    };
}


/* Occasionally create floating hearts */

setInterval(() => {

    if (Math.random() > 0.35) {
        createHeart();
    }

}, 2500);


/* =========================================
   POLAROID PARALLAX
   ========================================= */

const polaroids = document.querySelectorAll(".polaroid");

window.addEventListener("scroll", () => {

    const viewportCenter = window.innerHeight / 2;

    polaroids.forEach((polaroid) => {

        const rect = polaroid.getBoundingClientRect();

        const elementCenter = rect.top + rect.height / 2;

        const distance = elementCenter - viewportCenter;

        if (Math.abs(distance) < window.innerHeight) {

            const movement = distance * -0.015;

            polaroid.style.translate = `0 ${movement}px`;

        }

    });

});


/* =========================================
   CONSOLE MESSAGE
   ========================================= */

console.log(
    "%c♡ Made for Kai",
    "font-size: 20px; color: #e98f9d;"
);
