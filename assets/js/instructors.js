document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-wrapper');
    const userNameDisplay = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    // Show loader immediately
    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }

    // Bypass Auth: load instructors directly
    db.ref('instructors').once('value').then(snapshot => {
        const instructors = snapshot.val();
        const grid = document.getElementById('instructor-grid');
        grid.innerHTML = '';

        if (!instructors) {
            grid.innerHTML = '<p>No instructors available.</p>';
            return;
        }

        Object.entries(instructors).forEach(([id, instructor]) => {
            const card = document.createElement('div');
            card.className = 'instructor-card';
            card.innerHTML = `
                <img src="${instructor.imageUrl || 'https://via.placeholder.com/300x300?text=Instructor'}" alt="${instructor.name}">
                <div class="instructor-info">
                    <h3>${instructor.name}</h3>
                    <span>${instructor.expertise}</span>
                </div>
            `;
            grid.appendChild(card);
        });

        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    }).catch(error => {
        console.error("Failed to load instructors:", error);
        const grid = document.getElementById('instructor-grid');
        grid.innerHTML = '<p>Error loading instructors.</p>';
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    });

    // Hide logout if public page
    if (logoutBtn) logoutBtn.style.display = 'none';
});
