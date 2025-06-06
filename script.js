document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.querySelector('.calendar-grid');
    const timeColumn = document.querySelector('.time-column');
    
    // --- Configuration ---
    const START_HOUR = 7; // Calendar starts at 7 AM
    const END_HOUR = 20; // Calendar ends at 8 PM (20:00)

    // --- Generate Time Slots ---
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.classList.add('time-slot');
        timeSlot.innerText = `${hour}:00`;
        timeColumn.appendChild(timeSlot);
    }

    // --- Fetch and Display Schedule Data ---
    console.log("[INFO] Starting to fetch schedule.json...");
    
    fetch('schedule.json')
        .then(response => {
            console.log("[INFO] Received a response from fetch.");
            // Check if the request was successful
            if (!response.ok) {
                // Throw an error if the server responded with a status like 404 or 500
                throw new Error(`Network response was not ok. Status: ${response.status}`);
            }
            // Proceed to parse the response body as JSON
            return response.json();
        })
        .then(data => {
            console.log("[INFO] Successfully parsed JSON data.", data);
            if (!data || data.length === 0) {
                console.warn("[WARN] Data is empty or null after parsing.");
                return;
            }

            data.forEach(course => {
                placeCourseOnCalendar(course);
            });
            console.log("[INFO] Finished processing all courses.");
        })
        .catch(error => {
            // --- THIS IS THE NEW, IMPORTANT PART ---
            // If any part of the fetch/parse process fails, this will catch the error
            // and print a detailed message to the browser's console.
            console.error('[FATAL] An error occurred while loading or processing schedule.json:', error);
            alert("Could not load schedule data. Please check the Developer Console for more information.");
        });

    function placeCourseOnCalendar(course) {
        // Basic check to ensure the course object and its 'days' property are valid
        if (!course || !course.days) {
            console.warn("[WARN] Skipping a course with missing 'days' data.", course);
            return;
        }

        // Example days: "MoWeFr", "TuTh"
        const days = course.days.match(/.{1,2}/g);
        if (!days) return; // Skip if days are empty or in an unexpected format

        days.forEach(day => {
            const column = calendarGrid.querySelector(`.day-column[data-day="${day}"]`);
            if (!column) return; 

            const [startTimeStr] = course.time_of_day.split(' - ');
            const [time, ampm] = startTimeStr.split(' ');
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
