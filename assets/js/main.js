document.addEventListener("DOMContentLoaded", () => {
  const loginDesktop = document.getElementById("desktop-login");
  const dashboardDesktop = document.getElementById("desktop-dashboard");
  const loginMobile = document.getElementById("mobile-login");
  const dashboardMobile = document.getElementById("mobile-dashboard");

  const auth = firebase.auth();
  const db = firebase.database();

  auth.onAuthStateChanged(user => {
    if (user) {
      db.ref("users/" + user.uid).once("value").then(snapshot => {
        const role = snapshot.val()?.role || "student";
        let dashURL = "student-dashboard.html";
        if (role === "admin") dashURL = "admin-dashboard.html";
        else if (role === "instructor") dashURL = "instructor-dashboard.html";

        // Hide login buttons
        loginDesktop.style.display = "none";
        loginMobile.style.display = "none";

        // Show dashboard buttons
        dashboardDesktop.href = dashURL;
        dashboardMobile.href = dashURL;
        dashboardDesktop.style.display = "inline-flex";
        dashboardMobile.style.display = "block";
      });
    } else {
      // Not logged in
      loginDesktop.style.display = "inline-flex";
      loginMobile.style.display = "block";
      dashboardDesktop.style.display = "none";
      dashboardMobile.style.display = "none";
    }
  });

  // Animate scroll elements
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".animate-on-scroll").forEach(el => observer.observe(el));
});

// Hide loader after page load
window.addEventListener("load", () => {
  const loader = document.getElementById("loader-wrapper");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
    }, 500);
  }
});
