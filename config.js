/* ------------------------------------------------------------------
   Ms.Cookiza Spin & Win — settings
   Everything you are likely to edit lives in this file.
------------------------------------------------------------------- */
window.COOKIZA_CONFIG = {
    brandName: "Ms.Cookiza",

    // TODO: replace with the real Ms.Cookiza Instagram page
    instagramUrl: "https://www.instagram.com/mscookieza.om/",

    // true  = each browser can spin once (prize is remembered in localStorage).
    // false = unlimited spins (handy while testing).
    // Tip: open index.html?reset=1 to clear a saved prize on your own device.
    oneSpinPerDevice: true,

    // Google Apps Script web-app URL that logs every win to your Google Sheet.
    // Leave "" to disable logging. Setup steps: README > "Win log".
    logEndpoint: "https://script.google.com/macros/s/AKfycbzM0Y3h2_T4S54J7zd-3wY3HJC589vSDzxOPcePo9r91IVblvZLrSjInXU9_2fac7TJnQ/exec",

    /* Prizes, ordered from MOST likely to LEAST likely.
       `weight` is the chance of winning in percent. The values are normalised,
       so they do not have to add up to exactly 100.
       Slices on the wheel are drawn the same size, whatever their weight.   */
    prizes: [
        { id: "off10", weight: 30, label: ["10%", "OFF"], title: "10% Off", description: "Enjoy 10% off your order." },
        { id: "off15", weight: 24, label: ["15%", "OFF"], title: "15% Off", description: "Enjoy 15% off your order." },
        { id: "bites", weight: 16, label: ["FREE", "Cookiza Bites"], title: "Free Cookiza Bites", description: "A small cup of Cookiza Bites, on us." },
        { id: "triple", weight: 12, label: ["FREE Mini", "Triple Choc"], title: "Free Mini Triple Chocolate", description: "A free Mini Triple Chocolate cookie." },
        { id: "off20", weight: 9, label: ["20%", "OFF"], title: "20% Off", description: "Enjoy 20% off your order." },
        { id: "classic", weight: 6, label: ["FREE Mini", "Classic"], title: "Free Mini Classic Cookiza", description: "A free Mini Classic Cookiza cookie." },
        { id: "buy2", weight: 3, label: ["Buy 2 Get", "3rd FREE"], title: "Buy 2, Get the 3rd Free", description: "Buy any 2 cookies and get the third one free." }
    ]
};