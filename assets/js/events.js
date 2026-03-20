document.addEventListener('DOMContentLoaded', () => {
    const eventsList = document.getElementById('events-list');
    const loader = document.getElementById('loader-wrapper');
    if (!eventsList) return;

    // ** FIX: Show loader before fetching data **
    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }

    const eventsRef = db.ref('events').orderByChild('date');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    eventsRef.on('value', (snapshot) => {
        eventsList.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const event = childSnapshot.val();
                const eventDate = new Date(event.date);
                const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
                const day = eventDate.getDate();
                const item = document.createElement('div');
                item.className = 'event-item animate-on-scroll';
                item.innerHTML = `
                    <div class="event-date">
                        <span>${month}</span>
                        <strong>${day}</strong>
                    </div>
                    <div class="event-details">
                        <h3>${event.title}</h3>
                        <p>${event.description}</p>
                    </div>
                `;
                eventsList.appendChild(item);
                observer.observe(item);
            });
        } else {
            eventsList.innerHTML = '<p>No upcoming events.</p>';
        }

        // ** FIX: Hide loader after data is fetched and displayed **
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    }, (error) => {
        console.error("Firebase Read Error:", error);
        eventsList.innerHTML = '<p>Could not load events due to a database error.</p>';
        // ** FIX: Hide loader even if there is an error **
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    });
});