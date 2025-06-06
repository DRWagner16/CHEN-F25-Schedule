document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.querySelector('.calendar-grid');
    const timeColumn = document.querySelector('.time-column');
    
    const START_HOUR = 7; // Calendar starts at 7 AM
    const END_HOUR = 20;  // Calendar ends at 8 PM (20:00)

    // Generate Time Slots
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.classList.add('time-slot');
        timeSlot.innerText = `${hour}:00`;
        timeColumn.appendChild(timeSlot);
    }
    
    // --- This object maps the single-letter days from your data to the two-letter codes in the HTML ---
    const dayMap = { 'M': 'Mo', 'T': 'Tu', 'W': 'We', 'R': 'Th', 'F': 'Fr' };

    fetch('schedule.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(course => {
                placeCourseOnCalendar(course);
            });
        })
        .catch(error => {
            console.error('[FATAL] An error occurred while loading or processing schedule.json:', error);
        });

    function placeCourseOnCalendar(course) {
        if (!course || !course.days || !course.time_of_day) return;

        // --- FIX #1: Correctly parse the single-letter days ---
        const days = course.days.split('').map(dayChar => dayMap[dayChar]).filter(Boolean);
        if (days.length === 0) return;

        days.forEach(day => {
            const column = calendarGrid.querySelector(`.day-column[data-day="${day}"]`);
            if (!column) return; 

            // --- FIX #2: Correctly parse time without a space (e.g., "10:45AM") ---
            const timeString = course.time_of_day;
            const timeParts = timeString.match(/(\d{1,2}:\d{2})(AM|PM)/);
            if (!timeParts) return; // Skip if the time format is unexpected

            const startTimeStr = timeParts[0];
            const [time, ampm] = [timeParts[1], timeParts[2]];
            let [hour, minute] = time.split(':').map(Number);

            if (ampm === 'PM' && hour !== 12) {
                hour += 12;
            }
            if (ampm === 'AM' && hour === 12) {
                hour = 0;
            }

            const startMinutes = (hour * 60) + minute;
            const topPosition = ((startMinutes / 60) - START_HOUR) * 60;
            const height = course.duration;
            
            // Do not render events that are outside the calendar's visible hours
            if (!height || topPosition < 0 || startMinutes > END_HOUR * 60) {
                return;
            }

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
