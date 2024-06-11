/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,ts}"],
	theme: {
		extend: {
			fontFamily: {
				lato: ['Lato', 'sans-serif'],
				openSans: ['Open Sans', 'sans-serif'],
				roboto: ['Roboto', 'sans-serif'],
			  },
		},
	},
	plugins: [
		require("daisyui"),
		require("tailwind-scrollbar")({ preferredStrategy: "pseudoelements" }),
		require('@tailwindcss/typography'),
	],
	daisyui: {
		themes: ["emerald"],
	},
};
