document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader-wrapper');
  const userNameDisplay = document.getElementById('user-name');
  const logoutBtn = document.getElementById('logout-btn');
  const enrolledList = document.getElementById('enrolled-courses-list');
  const announcementsList = document.getElementById('announcements-list');

  const showLoader = () => loader && (loader.style.display = 'flex');
  const hideLoader = () => {
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.style.display = 'none', 500);
    }
  };

  const renderCourseCard = (course) => {
    return `
      <div class="course-card" style="background-image: url('${course.imageUrl || "https://via.placeholder.com/600x400?text=Course"}')">
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
        </div>
      </div>
    `;
  };

  const loadStudentDashboard = (userData, uid) => {
    if (userNameDisplay) {
      userNameDisplay.textContent = `Welcome, ${userData.name || 'Student'}`;
    }

    // Fetch all courses and enrolled ones
    db.ref('courses').once('value').then(courseSnap => {
      const allCourses = courseSnap.val() || {};

      db.ref(`enrollments/${uid}`).once('value').then(enrollSnap => {
        const enrolledIds = enrollSnap.val() || {};

        enrolledList.innerHTML = '';

        const matchedCourses = Object.entries(allCourses).filter(([id]) => enrolledIds[id]);

        if (matchedCourses.length === 0) {
          enrolledList.innerHTML = '<p>You are not currently enrolled in any courses.</p>';
        } else {
          matchedCourses.forEach(([id, course]) => {
            enrolledList.innerHTML += renderCourseCard(course);
          });
        }

        hideLoader();
      });
    });
  };

  // Init Firebase Auth
  showLoader();
  auth.onAuthStateChanged(user => {
    if (user) {
      db.ref(`users/${user.uid}`).once('value').then(snapshot => {
        const userData = snapshot.val();
        if (userData && userData.role === 'student') {
          loadStudentDashboard(userData, user.uid);
        } else {
          alert("Access Denied. You are not registered as a student.");
          window.location.href = 'login.html';
        }
      }).catch(err => {
        console.error("Firebase error:", err);
        alert("Could not verify your role. Please try again.");
        window.location.href = 'login.html';
      });
    } else {
      window.location.href = 'login.html';
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.signOut().then(() => {
        window.location.href = 'index.html';
      });
    });
  }
});
