/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
	  fontFamily: {
		inter: ["Inter", "sans-serif"],
		"edu-sa": ["Edu SA Beginner", "cursive"],
		mono: ["Roboto Mono", "monospace"],
	  },
	  colors: {
		white: "#fff",
		black: "#000",
		transparent: "#ffffff00",
		richblack: {
		  5: "#F1F2FF",
		  25: "#DBDDEA",
		  50: "#C5C7D4",
		  100: "#AFB2BF",
		  200: "#999DAA",
		  300: "#838894",
		  400: "#6E727F",
		  500: "#585D69",
		  600: "#424854",
		  700: "#2C333F",
		  800: "#161D29",
		  900: "#000814",
		},
		richblue: {
		  5: "#ECF5FF",
		  25: "#C6D6E1",
		  50: "#A0B7C3",
		  100: "#7A98A6",
		  200: "#537988",
		  300: "#2D5A6A",
		  400: "#073B4C",
		  500: "#063544",
		  600: "#042E3B",
		  700: "#032833",
		  800: "#01212A",
		  900: "#001B22",
		},
		blue: {
		  100: "#DCEEFB",
		  200: "#B6E0FE",
		  300: "#84C5F4",
		  400: "#62B0E8",
		  500: "#4098D7",
		  600: "#2680C2",
		  700: "#186FAF",
		  800: "#0F609B",
		  900: "#0A558C",
		},
		yellow: {
		  100: "#FFFBEA",
		  200: "#FFF3C4",
		  300: "#FCE588",
		  400: "#FADB5F",
		  500: "#F7C948",
		  600: "#F0B429",
		  700: "#DE911D",
		  800: "#CB6E17",
		  900: "#B44D12",
		},
	  },
	  extend: {},
	},
	plugins: [],
  };
  