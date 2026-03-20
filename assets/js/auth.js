document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader-wrapper');
  const loginFormContainer = document.getElementById('login-form-container');
  const signupFormContainer = document.getElementById('signup-form-container');
  const showSignupLink = document.getElementById('show-signup');
  const showLoginLink = document.getElementById('show-login');

  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');

  const signupForm = document.getElementById('signup-form');
  const signupName = document.getElementById('signup-name');
  const signupEmail = document.getElementById('signup-email');
  const signupPhone = document.getElementById('signup-phone');
  const signupNIC = document.getElementById('signup-nic');
  const signupAddress = document.getElementById('signup-address');
  const signupDOB = document.getElementById('signup-dob');
  const signupPassword = document.getElementById('signup-password');
  const signupConfirmPassword = document.getElementById('signup-confirm-password');
  const signupRole = document.getElementById('signup-role');

  const googleSignInBtn = document.getElementById('google-signin-btn');
  const toast = document.getElementById('toast');
  // Password strength checker
signupPassword?.addEventListener('input', () => {
  const strengthText = document.getElementById('password-strength-text');
  const val = signupPassword.value;

  let strength = '';
  let color = 'gray';

  const length = val.length >= 8;
  const hasUpper = /[A-Z]/.test(val);
  const hasLower = /[a-z]/.test(val);
  const hasNumber = /\d/.test(val);
  const hasSpecial = /[!@#$%^&*]/.test(val);

  const score = [length, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  switch (score) {
    case 5:
      strength = 'Very Strong';
      color = 'green';
      break;
    case 4:
      strength = 'Strong';
      color = 'limegreen';
      break;
    case 3:
      strength = 'Medium';
      color = 'orange';
      break;
    case 2:
      strength = 'Weak';
      color = 'orangered';
      break;
    default:
      strength = 'Very Weak';
      color = 'red';
  }

  strengthText.textContent = `Password Strength: ${strength}`;
  strengthText.style.color = color;
 });

  // === UI Helpers ===
  function showLoader() {
    if (loader) loader.style.display = 'flex';
  }

  function hideLoader() {
    if (loader) loader.style.display = 'none';
  }

  function showToast(msg, type = 'error') {
    if (!toast) return;

    // Reset animation by hiding first
    toast.style.display = 'none';
    setTimeout(() => {
      toast.textContent = msg;
      toast.className = `alert-message ${type}`;
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 3000);
    }, 50);
  }

  // === Toggle Forms ===
  showSignupLink?.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormContainer.style.display = 'none';
    signupFormContainer.style.display = 'block';
  });

  showLoginLink?.addEventListener('click', (e) => {
    e.preventDefault();
    signupFormContainer.style.display = 'none';
    loginFormContainer.style.display = 'block';
  });

  // === Login Handler ===
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    showLoader();

    auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value)
      .then(cred => redirectUser(cred.user.uid))
      .catch(err => {
        let message = "Wrong mail or Password.";
        if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
          message = "Incorrect username or password.";
        } else if (err.code === "auth/invalid-email") {
          message = "Invalid email address format.";
        } else if (err.code === "auth/too-many-requests") {
          message = "Too many attempts. Please try again later.";
        }
        showToast(message, 'error');
        hideLoader();
      });
  });

  // === Signup Handler ===
  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (signupPassword.value !== signupConfirmPassword.value) {
      showToast("Passwords do not match.", 'error');
      return;
    }

    if (!signupRole.value) {
      showToast("Please select a role.", 'error');
      return;
    }

    showLoader();

    auth.createUserWithEmailAndPassword(signupEmail.value, signupPassword.value)
      .then(cred => {
        const user = cred.user;
        const userData = {
          name: signupName.value,
          email: user.email,
          phone: signupPhone.value,
          nic: signupNIC.value,
          address: signupAddress.value,
          dob: signupDOB.value,
          role: signupRole.value,
          createdAt: new Date().toISOString()
        };
        return db.ref('users/' + user.uid).set(userData).then(() => {
          redirectUser(user.uid);
        });
      })
      .catch(err => {
        showToast(err.message, 'error');
        hideLoader();
      });
  });

  // === Google Auth ===
  googleSignInBtn?.addEventListener('click', () => {
    showLoader();
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.signInWithPopup(provider)
      .then(result => redirectUser(result.user.uid))
      .catch(err => {
        showToast(err.message, 'error');
        hideLoader();
      });
  });

  // === Toggle Password Visibility ===
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
      const input = button.parentElement.querySelector('input');
      const icon = button.querySelector('i');
      const isVisible = input.type === 'text';

      input.type = isVisible ? 'password' : 'text';
      icon.className = isVisible ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill';
    });
  });

  // === Role-Based Redirect ===
  function redirectUser(uid) {
    db.ref('users/' + uid).once('value')
      .then(snapshot => {
        const userData = snapshot.val();

        if (userData && userData.role) {
          window.location.href = 'index.html';
        } else {
          const user = auth.currentUser;
          const fallbackUser = {
            name: user.displayName || "User",
            email: user.email,
            role: 'student',
            createdAt: new Date().toISOString()
          };
          db.ref('users/' + uid).set(fallbackUser).then(() => {
            window.location.href = 'index.html';
          });
        }
      })
.catch(err => {
  console.error("Login error:", err.code, err.message);
  let message;
  if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
    message = "Incorrect username or password.";
  } else if (err.code === "auth/invalid-email") {
    message = "Invalid email address.";
  } else {
    message = "An unexpected error occurred.";
  }
  showToast(message, 'error');
  hideLoader();
});
  }
});
