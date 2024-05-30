/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,ts}"],
	theme: {
		extend: {},
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
