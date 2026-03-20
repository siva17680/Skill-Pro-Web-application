document.addEventListener('DOMContentLoaded', () => {
    const authGuard = () => {
        auth.onAuthStateChanged(user => {
            if (user) {
                db.ref('users/' + user.uid).once('value').then(snapshot => {
                    const userData = snapshot.val();
                    if (userData?.role === 'admin') {
                        initializeAdminPanel(userData);
                    } else {
                        alert("Access Denied. Admins only.");
                        auth.signOut();
                        window.location.href = 'login.html';
                    }
                }).catch(err => {
                    console.error("Auth Error:", err);
                    auth.signOut();
                    window.location.href = 'login.html';
                });
            } else {
                window.location.href = 'login.html';
            }
        });
    };

    let allCourses = {}, allInstructors = {}, currentInstructorId = null;

    const alertMessage = document.getElementById('alert-message');
    const userNameDisplay = document.getElementById('user-name');

    const coursesRef = db.ref('courses');
    const instructorsRef = db.ref('instructors');
    const eventsRef = db.ref('events');
    const usersRef = db.ref('users');

    const addCourseForm = document.getElementById('add-course-form');
    const editCourseId = document.getElementById('edit-course-id');
    const courseFormTitle = document.getElementById('course-form-title');
    const submitCourseBtn = document.getElementById('submit-course-btn');
    const cancelCourseEditBtn = document.getElementById('cancel-course-edit-btn');

    const addEventForm = document.getElementById('add-event-form');
    const editEventId = document.getElementById('edit-event-id');
    const eventFormTitle = document.getElementById('event-form-title');
    const submitEventBtn = document.getElementById('submit-event-btn');
    const cancelEventEditBtn = document.getElementById('cancel-event-edit-btn');

    const coursesTbody = document.querySelector('#courses-table tbody');
    const instructorsTbody = document.querySelector('#instructors-table tbody');
    const eventsTbody = document.querySelector('#events-table tbody');
    const usersTbody = document.querySelector('#users-table tbody');

    const assignmentModal = document.getElementById('assignment-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalInstructorName = document.getElementById('modal-instructor-name');
    const assignedCoursesList = document.getElementById('assigned-courses-list');
    const unassignedCoursesSelect = document.getElementById('unassigned-courses-select');
    const assignCourseBtn = document.getElementById('assign-course-btn');

    const showAlert = (msg, success = true) => {
        alertMessage.textContent = msg;
        alertMessage.className = `alert-message ${success ? 'success' : 'error'}`;
        alertMessage.style.display = 'block';
        setTimeout(() => { alertMessage.style.display = 'none'; }, 3000);
    };

    const initializeAdminPanel = (adminData) => {
        userNameDisplay.textContent = `Welcome, ${adminData.name || 'Admin'}`;
        loadCourses();
        loadEvents();
        loadInstructors();
        loadUsers();
    };

    const resetCourseForm = () => {
        addCourseForm.reset();
        editCourseId.value = '';
        submitCourseBtn.textContent = 'Add Course';
        cancelCourseEditBtn.style.display = 'none';
    };

    const resetEventForm = () => {
        addEventForm.reset();
        editEventId.value = '';
        submitEventBtn.textContent = 'Add Event';
        cancelEventEditBtn.style.display = 'none';
    };

    cancelCourseEditBtn.addEventListener('click', resetCourseForm);
    cancelEventEditBtn.addEventListener('click', resetEventForm);

    addCourseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const courseData = {
            title: document.getElementById('course-title').value,
            category: document.getElementById('course-category').value,
            location: document.getElementById('course-location').value,
            duration: document.getElementById('course-duration').value,
            mode: document.getElementById('course-mode').value,
            price: document.getElementById('course-price').value,
            imageUrl: document.getElementById('course-image-url').value
        };
        const key = editCourseId.value;
        if (key) {
            coursesRef.child(key).update(courseData)
                .then(() => { showAlert('Course updated!'); resetCourseForm(); })
                .catch(err => showAlert(err.message, false));
        } else {
            coursesRef.push(courseData)
                .then(() => { showAlert('Course added!'); addCourseForm.reset(); })
                .catch(err => showAlert(err.message, false));
        }
    });

    addEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const eventData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            description: document.getElementById('event-description').value
        };
        const key = editEventId.value;
        if (key) {
            eventsRef.child(key).update(eventData)
                .then(() => { showAlert('Event updated!'); resetEventForm(); })
                .catch(err => showAlert(err.message, false));
        } else {
            eventsRef.push(eventData)
                .then(() => { showAlert('Event added!'); addEventForm.reset(); })
                .catch(err => showAlert(err.message, false));
        }
    });

    const loadCourses = () => {
        coursesRef.on('value', snapshot => {
            coursesTbody.innerHTML = '';
            allCourses = snapshot.val() || {};
            Object.entries(allCourses).forEach(([id, course]) => {
                const row = `<tr>
                    <td>${course.title}</td>
                    <td>${course.category}</td>
                    <td>${course.location || 'N/A'}</td>
                    <td>${course.price || 'N/A'}</td>
                    <td>${course.duration}</td>
                    <td>${course.mode}</td>
                    <td>
                        <button class="btn-edit" data-id="${id}" data-type="courses">Edit</button>
                        <button class="btn-delete" data-id="${id}" data-type="courses">Delete</button>
                    </td>
                </tr>`;
                coursesTbody.innerHTML += row;
            });
        });
    };

    const loadEvents = () => {
        eventsRef.on('value', snapshot => {
            eventsTbody.innerHTML = '';
            snapshot.forEach(child => {
                const id = child.key;
                const e = child.val();
                const row = `<tr>
                    <td>${e.title}</td>
                    <td>${e.date}</td>
                    <td>${e.description}</td>
                    <td>
                        <button class="btn-edit" data-id="${id}" data-type="events">Edit</button>
                        <button class="btn-delete" data-id="${id}" data-type="events">Delete</button>
                    </td>
                </tr>`;
                eventsTbody.innerHTML += row;
            });
        });
    };

    const loadInstructors = () => {
        instructorsRef.on('value', snapshot => {
            instructorsTbody.innerHTML = '';
            allInstructors = snapshot.val() || {};
            Object.entries(allInstructors).forEach(([id, inst]) => {
                const row = `<tr>
                    <td>${inst.name}</td>
                    <td>${inst.expertise}</td>
                    <td>
                        <button class="btn-assign" data-id="${id}" data-name="${inst.name}">Assign Course</button>
                    </td>
                </tr>`;
                instructorsTbody.innerHTML += row;
            });
        });
    };

    const loadUsers = () => {
        usersRef.on('value', snapshot => {
            usersTbody.innerHTML = '';
            snapshot.forEach(child => {
                const uid = child.key;
                const u = child.val();
                let actions = '';
                if (u.role === 'instructor') {
                    actions = `<button class="btn-delete" data-id="${uid}" data-type="users">Delete</button>`;
                } else {
                    actions = `<button class="btn-promote" data-id="${uid}" data-name="${u.name}">Promote</button>`;
                }
                const row = `<tr>
                    <td>${u.name || 'N/A'}</td>
                    <td>${u.email}</td>
                    <td>${u.role}</td>
                    <td>${actions}</td>
                </tr>`;
                usersTbody.innerHTML += row;
            });
        });
    };

    document.body.addEventListener('click', (e) => {
        const btn = e.target;
        if (btn.classList.contains('btn-edit')) {
            const id = btn.dataset.id, type = btn.dataset.type;
            if (type === 'courses') {
                const c = allCourses[id];
                if (!c) return;
                editCourseId.value = id;
                document.getElementById('course-title').value = c.title;
                document.getElementById('course-category').value = c.category;
                document.getElementById('course-location').value = c.location || '';
                document.getElementById('course-price').value = c.price || '';
                document.getElementById('course-duration').value = c.duration;
                document.getElementById('course-mode').value = c.mode;
                document.getElementById('course-image-url').value = c.imageUrl;
                submitCourseBtn.textContent = 'Update Course';
                cancelCourseEditBtn.style.display = 'inline-block';
                courseFormTitle.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (btn.classList.contains('btn-delete')) {
            const id = btn.dataset.id;
            const type = btn.dataset.type;
            if (confirm("Are you sure you want to delete this item?")) {
                db.ref(`${type}/${id}`).remove().then(() => {
                    showAlert('Deleted successfully!');
                });
            }
        } else if (btn.classList.contains('btn-promote')) {
    const uid = btn.dataset.id, name = btn.dataset.name;

    // Check user role before promoting
    db.ref(`users/${uid}`).once('value').then(snapshot => {
        const user = snapshot.val();
        if (!user) {
            showAlert("User not found", false);
            return;
        }

        if (user.role !== 'student') {
            // Only allow students to be promoted
            showAlert(`${name} cannot be promoted because their role is "${user.role}".`, false);
            return;
        }

        // Add instructor profile to instructors list
        const profile = {
            uid,
            name,
            expertise: 'To be updated',
            courseIds: {},
            imageUrl: `https://placehold.co/400x400/005A9E/FFFFFF?text=${name.charAt(0)}`
        };

        // Push instructor profile
        instructorsRef.push(profile)
            .then(() => {
                // Update the user's role to instructor in users table
                db.ref(`users/${uid}/role`).set('instructor');
                showAlert(`${name} is now an instructor!`);
            })
            .catch(err => showAlert(err.message, false));
    });
}
 else if (btn.classList.contains('btn-assign')) {
            openAssignmentModal(btn.dataset.id, btn.dataset.name);
        } else if (btn.classList.contains('btn-unassign')) {
            handleUnassignCourse(btn.dataset.courseId);
        }
    });

    const openAssignmentModal = (instructorId, instructorName) => {
        currentInstructorId = instructorId;
        modalInstructorName.textContent = `Assign Courses to ${instructorName}`;
        assignedCoursesList.innerHTML = '';
        unassignedCoursesSelect.innerHTML = '<option value="">Select a course</option>';
        db.ref('instructors/' + instructorId + '/courseIds').once('value', snapshot => {
            const assignedIds = snapshot.val() || {};
            Object.entries(allCourses).forEach(([cid, course]) => {
                if (assignedIds[cid]) {
                    assignedCoursesList.innerHTML += `<div class="assigned-course-item">
                        <span>${course.title}</span>
                        <button class="btn-unassign" data-course-id="${cid}">&times;</button>
                    </div>`;
                } else if (!course.instructorId) {
                    unassignedCoursesSelect.innerHTML += `<option value="${cid}">${course.title}</option>`;
                }
            });
            if (!Object.keys(assignedIds).length) {
                assignedCoursesList.innerHTML = '<p>No courses assigned yet.</p>';
            }
            assignmentModal.classList.add('show');
        });
    };

    const handleUnassignCourse = (courseId) => {
        const updates = {};
        updates[`/courses/${courseId}/instructorId`] = null;
        updates[`/instructors/${currentInstructorId}/courseIds/${courseId}`] = null;
        db.ref().update(updates).then(() => {
            const instructorName = modalInstructorName.textContent.replace('Assign Courses to ', '');
            openAssignmentModal(currentInstructorId, instructorName);
            showAlert('Course unassigned!');
        });
    };

    assignCourseBtn.addEventListener('click', () => {
        const courseId = unassignedCoursesSelect.value;
        if (!courseId) return;
        const updates = {};
        updates[`/courses/${courseId}/instructorId`] = currentInstructorId;
        updates[`/instructors/${currentInstructorId}/courseIds/${courseId}`] = true;
        db.ref().update(updates).then(() => {
            const instructorName = modalInstructorName.textContent.replace('Assign Courses to ', '');
            openAssignmentModal(currentInstructorId, instructorName);
            showAlert('Course assigned!');
        });
    });

    modalCloseBtn.addEventListener('click', () => {
        assignmentModal.classList.remove('show');
        currentInstructorId = null;
    });

    authGuard();
});
const logoutBtn = document.getElementById('logout-btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        }).catch(err => {
            showAlert("Logout failed: " + err.message, false);
        });
    });
}