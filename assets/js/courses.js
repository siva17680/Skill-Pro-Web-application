document.addEventListener('DOMContentLoaded', () => {
  const courseList = document.getElementById('course-list');
  const loader = document.getElementById('loader-wrapper');
  const enrollToast = document.getElementById('enroll-toast');
  const enrollToastClose = document.getElementById('enroll-toast-close');

  // Filter inputs
  const searchInput = document.getElementById('course-search-input');
  const categoryFilter = document.getElementById('category-filter');
  const locationFilter = document.getElementById('location-filter');
  const modeFilter = document.getElementById('mode-filter');

  let allCourses = [];
  let selectedCourseId = null; // hold course ID for enroll after login

  // 🔹 build login modal dynamically
  const loginModal = document.createElement('div');
  loginModal.className = 'modal';
  loginModal.id = 'enroll-login-modal';
  loginModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Login to Enroll</h3>
        <button class="modal-close" id="enroll-login-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="input-group">
          <input type="email" id="enroll-login-email" placeholder="Email" required>
        </div>
        <div class="input-group">
          <input type="password" id="enroll-login-password" placeholder="Password" required>
        </div>
        <button id="enroll-login-submit" class="btn btn-primary">Login & Enroll</button>
      </div>
    </div>
  `;
  document.body.appendChild(loginModal);

  const showLoader = () => loader && (loader.style.display = 'flex');
  const hideLoader = () => {
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.style.display = 'none', 500);
    }
  };

  const showToast = () => enrollToast.classList.add('show');
  const hideToast = () => enrollToast.classList.remove('show');

  // 🔹 Render courses
  const renderCourses = (coursesToRender) => {
    courseList.innerHTML = '';

    if (!coursesToRender.length) {
      courseList.innerHTML = '<p>No courses found matching your filters.</p>';
      return;
    }

    coursesToRender.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.style.backgroundImage = `url('${course.imageUrl || "https://via.placeholder.com/600x400?text=Course"}')`;

      card.innerHTML = `
        <div class="card-overlay"></div>
        <div class="course-content">
          <span class="category-tag">${course.category || 'General'}</span>
          <h3>${course.title}</h3>
          <p>Location: ${course.location || 'N/A'}</p>
          <p>Price: Rs.${course.price || 'Free'}</p>
          <div class="course-details">
            <span><i class="bi bi-clock"></i> ${course.duration || 'N/A'}</span>
            <span><i class="bi bi-laptop"></i> ${course.mode || 'N/A'}</span>
          </div>
          <button class="btn btn-accent enroll-btn" data-course-id="${course.id}" data-course-title="${course.title}">Enroll</button>
        </div>
      `;
      courseList.appendChild(card);
    });
  };

  // 🔹 Filter courses
  const filterCourses = () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value.toLowerCase();
    const selectedLocation = locationFilter.value.toLowerCase();
    const selectedMode = modeFilter.value.toLowerCase();

    const filtered = allCourses.filter(course => {
      const titleMatch = course.title?.toLowerCase().includes(searchTerm);
      const categoryMatch = selectedCategory === 'all' || (course.category?.toLowerCase() === selectedCategory);
      const locationMatch = selectedLocation === 'all' || (course.location?.toLowerCase() === selectedLocation);
      const modeMatch = selectedMode === 'all' || (course.mode?.toLowerCase() === selectedMode);

      return titleMatch && categoryMatch && locationMatch && modeMatch;
    });

    renderCourses(filtered);
  };

  // 🔹 Load courses from Firebase
  const loadCoursesFromFirebase = () => {
    const coursesRef = db.ref('courses');
    coursesRef.on('value', snapshot => {
      allCourses = [];
      snapshot.forEach(child => {
        const course = child.val();
        course.id = child.key;
        allCourses.push(course);
      });
      filterCourses(); 
      hideLoader();
    }, error => {
      console.error("Error loading courses:", error);
      courseList.innerHTML = '<p>Error loading courses.</p>';
      hideLoader();
    });
  };

  // 🔹 Actually enroll the user in Firebase DB
  function enrollCourse(uid, courseId) {
    db.ref(`enrollments/${uid}/${courseId}`).set(true)
      .then(() => {
        showToast();
        selectedCourseId = null; // reset after success
      })
      .catch(err => {
        console.error("Enrollment failed:", err);
        alert("Enrollment failed. Please try again later.");
      });
  }

  // 🔹 Enroll click
  courseList.addEventListener('click', (e) => {
    const btn = e.target.closest('.enroll-btn');
    if (!btn) return;

    const courseId = btn.dataset.courseId;
    const courseTitle = btn.dataset.courseTitle;

    selectedCourseId = courseId; // store BEFORE login prompt

    if (!confirm(`Are you sure you want to enroll in "${courseTitle}"?`)) return;

    const user = auth.currentUser;
    if (!user) {
      loginModal.classList.add('show');
      return;
    }

    // check if student
    db.ref(`users/${user.uid}`).once('value').then(snapshot => {
      const data = snapshot.val();
      if (data && data.role === 'student') {
        enrollCourse(user.uid, courseId);
      } else {
        alert('Access denied. Only students can enroll.');
      }
    });
  });

  // 🔹 handle login modal close
  document.getElementById('enroll-login-close').addEventListener('click', () => {
    loginModal.classList.remove('show');
  });

  // 🔹 handle login submit
  document.getElementById('enroll-login-submit').addEventListener('click', () => {
    const email = document.getElementById('enroll-login-email').value;
    const password = document.getElementById('enroll-login-password').value;

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    auth.signInWithEmailAndPassword(email, password)
      .then(userCred => {
        loginModal.classList.remove('show');
        const user = userCred.user;

        if (!selectedCourseId) {
          alert("Please click enroll again.");
          return;
        }

        db.ref(`users/${user.uid}`).once('value').then(snapshot => {
          const data = snapshot.val();
          if (data && data.role === 'student') {
            enrollCourse(user.uid, selectedCourseId);
          } else {
            alert('Access denied. Only students can enroll.');
          }
        });
      })
      .catch(err => {
        alert('Login failed: ' + err.message);
      });
  });

  enrollToastClose.addEventListener('click', hideToast);

  // Filter listeners
  [searchInput, categoryFilter, locationFilter, modeFilter].forEach(el =>
    el.addEventListener('input', filterCourses)
  );

  showLoader();
  loadCoursesFromFirebase();
});
