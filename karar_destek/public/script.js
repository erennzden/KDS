document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Sayfanın yenilenmesini engelle

    const name = document.getElementById("name").value.trim();
    const password = document.getElementById("password").value.trim();

    // Ad ve şifre kontrolü
    if (name === "" || password === "") {
        showError("Lütfen tüm alanları doldurun!");
        return;
    }

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: name, password })
        });

        if (response.redirected) {
            window.location.href = response.url; // Başarılı girişte yönlendirme
        } else {
            const errorMessage = await response.text();
            showError(errorMessage || "Geçersiz kullanıcı adı veya şifre!");
        }
    } catch (error) {
        console.error("Hata oluştu:", error);
        showError("Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.");
    }
});

function showError(message) {
    const errorDiv = document.getElementById("error-message");
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
}

function togglePassword() {
    const passwordField = document.getElementById("password");
    const passwordToggle = document.querySelector(".toggle-password");
    if (passwordField.type === "password") {
        passwordField.type = "text";
        passwordToggle.textContent = "🙈";
    } else {
        passwordField.type = "password";
        passwordToggle.textContent = "👁";
    }
}

function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (dropdown) {
        dropdown.classList.toggle('show'); // 'show' sınıfını ekle/çıkar
    }
}
document.querySelectorAll('.dropdown > span').forEach(span => {
    span.addEventListener('click', () => {
        const id = span.getAttribute('onclick').match(/'([^']+)'/)[1];
        const dropdown = document.getElementById(id);
        dropdown.classList.toggle('show');
    });
});
