
(function () {
	const navLinksUrl = document.querySelector('.nav-links-url');
	if (!navLinksUrl) return;

	const hamburger = navLinksUrl.querySelector('.nav-bar-container');

	
	if (hamburger) {
		hamburger.setAttribute('role', 'button');
		hamburger.setAttribute('tabindex', '0');
		hamburger.setAttribute('aria-label', 'Toggle navigation menu');
		hamburger.setAttribute('aria-expanded', 'false');

		const toggle = (open) => {
			const willOpen = typeof open === 'boolean' ? open : !navLinksUrl.classList.contains('open');
			if (willOpen) {
				navLinksUrl.classList.add('open');
				hamburger.classList.add('open');
				hamburger.setAttribute('aria-expanded', 'true');
			} else {
				navLinksUrl.classList.remove('open');
				hamburger.classList.remove('open');
				hamburger.setAttribute('aria-expanded', 'false');
			}
		};

		hamburger.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
		hamburger.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
			if (e.key === 'Escape') { toggle(false); }
		});

		
		document.addEventListener('click', (e) => {
			if (!navLinksUrl.classList.contains('open')) return;
			if (!navLinksUrl.contains(e.target)) toggle(false);
		});

		
		document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
	}
})();