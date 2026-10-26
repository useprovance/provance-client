// utils/openEmail.ts
export function openEmail() {
	const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

	const mailto = 'mailto:aniokechukwudi7@gmail.com?subject=Project inquiry';

	const gmail =
		'https://mail.google.com/mail/?view=cm&fs=1&to=aniokechukwudi7@gmail.com&su=Project%20inquiry';

	const link = isMobile ? mailto : gmail;

	window.open(link, '_blank');
}
