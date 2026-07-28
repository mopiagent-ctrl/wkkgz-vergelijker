// Cookie consent for WkkgzVergelijker.nl
(function(){
    // Check if consent was already given
    var consent = localStorage.getItem('cookie-consent');
    
    // Only load GA4 if consent was accepted
    if (consent === 'accepted') {
        enableAnalytics();
    }
    
    // If no decision yet, show banner
    if (consent === null) {
        showBanner();
    }
    // If declined, do nothing (analytics stay off)
    
    function enableAnalytics() {
        var gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-PCSQ4RQTV9';
        document.head.appendChild(gaScript);
        
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-PCSQ4RQTV9');
    }
    
    function showBanner() {
        var banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.innerHTML = 
            '<div class="cookie-banner__text">' +
            'WkkgzVergelijker gebruikt cookies (alleen Google Analytics) om anoniem bezoekersgedrag te meten. ' +
            'Geen tracking, geen advertenties, geen persoonsgegevens. ' +
            '<a href="privacy.html">Privacyverklaring</a> · <a href="cookie.html">Cookiebeleid</a>' +
            '</div>' +
            '<button class="cookie-banner__btn cookie-banner__btn--decline" id="cookie-decline">Weigeren</button>' +
            '<button class="cookie-banner__btn" id="cookie-accept">Accepteren</button>';
        
        document.body.appendChild(banner);
        
        document.getElementById('cookie-accept').onclick = function() {
            localStorage.setItem('cookie-consent', 'accepted');
            banner.classList.add('hidden');
            enableAnalytics();
        };
        
        document.getElementById('cookie-decline').onclick = function() {
            localStorage.setItem('cookie-consent', 'declined');
            banner.classList.add('hidden');
        };
    }
})();
