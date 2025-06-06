document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.querySelector('.calendar-grid');
    const timeColumn = document.querySelector('.time-column');
    
    // --- Configuration ---
    const START_HOUR = 8; // Calendar starts at 8 AM
    const END_HOUR = 18; // Calendar ends at 6 PM (18:00)

    // --- Generate Time Slots ---
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.classList.add('time-slot');
        timeSlot.innerText = `${hour}:00`;
        timeColumn.appendChild(timeSlot);
    }

    // --- Fetch and Display Schedule Data ---
    fetch('schedule.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(course => {
                placeCourseOnCalendar(course);
            });
        })
        .catch(error => {
            console.error('Error loading schedule data:', error);
            alert('Could not load schedule data. Make sure schedule.json is present.');
        });

    function placeCourseOnCalendar(course) {
        // Example days: "MoWeFr", "TuTh"
        const days = course.days.match(/.{1,2}/g); // Splits "MoWeFr" into ["Mo", "We", "Fr"]
        if (!days) return;

        days.forEach(day => {
            const column = calendarGrid.querySelector(`.day-column[data-day="${day}"]`);
            if (!column) return; // Skip if it's a weekend or other day

            // --- Calculate Position and Height ---
            const [startTimeStr] = course.time_of_day.split(' - ');
            const [time, ampm] = startTimeStr.split(' ');
            let [hour, minute] = time.split(':').map(Number);

            if (ampm === 'PM' && hour !== 12) {
                hour += 12;
            }
            if (ampm === 'AM' && hour === 12) { // Midnight case
                hour = 0;
            }

            const startMinutes = (hour * 60) + minute;
            const topPosition = ((startMinutes / 60) - START_HOUR) * 60; // Position from the top of the grid in pixels
            const height = course.duration;

            // --- Create Event Element ---
            const eventDiv = document.createElement('div');
            eventDiv.className = 'class-event';
            eventDiv.style.top = `${topPosition}px`;
            eventDiv.style.height = `${height}px`;

            eventDiv.innerHTML = `
                <div class="event-title">${course.course_number}</div>
                <div class="event-details">
                    ${course.instructors}<br>
                    ${course.time_of_day}<br>
                    ${course.location}
                </div>
            `;
            
            column.appendChild(eventDiv);
        });
    }
});
