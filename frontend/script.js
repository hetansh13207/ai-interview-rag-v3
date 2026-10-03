// =====================================================
// THEME
// =====================================================

const themeToggle =
    document.getElementById(
        "themeToggle"
    );


const savedTheme =
    localStorage.getItem(
        "platform-theme"
    );


// =====================================================
// LOAD SAVED THEME
// =====================================================

if (
    savedTheme === "dark"
) {

    document.body.classList.add(
        "dark-theme"
    );

    themeToggle.textContent =
        "☀ Light";
}


// =====================================================
// TOGGLE THEME
// =====================================================

themeToggle.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-theme"
        );


        const darkMode =
            document.body.classList.contains(
                "dark-theme"
            );


        if (darkMode) {

            themeToggle.textContent =
                "☀ Light";


            localStorage.setItem(
                "platform-theme",
                "dark"
            );

        } else {

            themeToggle.textContent =
                "🌙 Dark";


            localStorage.setItem(
                "platform-theme",
                "light"
            );

        }

    }
);