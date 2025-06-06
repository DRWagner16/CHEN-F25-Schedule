document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const calendarGrid = document.querySelector('.calendar-grid');
    const timeColumn = document.querySelector('.time-column');
    const courseFilter = document.getElementById('course-filter');
    const instructorFilter = document.getElementById('instructor-filter');
    const resetBtn = document.getElementById('reset-filters');

    // --- Configuration ---
    const START_HOUR = 7;
    const END_HOUR = 20;
    const dayMap = { 'M': 'Mo', 'T': 'Tu', 'W': 'We', 'R': 'Th', 'F': 'Fr' };
    let allCourses = []; // To store the original full list of courses

    // --- Initial Setup ---
    generateTimeSlots();
    fetchDataAndInitialize();

    // --- Event Listeners ---
    courseFilter.addEventListener('change', filterAndRedrawCalendar);
    instructorFilter.addEventListener('change', filterAndRedrawCalendar);
    resetBtn.addEventListener('click', () => {
        courseFilter.value = 'all';
        instructorFilter.value = 'all';
        filterAndRedrawCalendar();
    });

    // --- Functions ---
    function generateTimeSlots() {
        for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.classList.add('time-slot');
            timeSlot.innerText = `${hour}:00`;
            timeColumn.appendChild(timeSlot);
        }
    }

    function fetchDataAndInitialize() {
        fetch('schedule.json')
            .then(response => response.json())
            .then(data => {
                allCourses = data; // Store the original data
                populateFilters(data);
                filterAndRedrawCalendar();
            })
            .catch(error => console.error('[FATAL] Error loading schedule data:', error));
    }

    function populateFilters(courses) {
        const uniqueCourses = [...new Set(courses.map(course => course.course_number))].sort();
        const uniqueInstructors = [...new Set(courses.map(course => course.instructors))].sort();

        uniqueCourses.forEach(courseName => {
            const option = document.createElement('option');
            option.value = courseName;
            option.textContent = courseName;
            courseFilter.appendChild(option);
        });

        uniqueInstructors.forEach(instructorName => {
            const option = document.createElement('option');
            option.value = instructorName;
            option.textContent = instructorName;
            instructorFilter.appendChild(option);
        });
    }

    function filterAndRedrawCalendar() {
        // Clear all existing events from the calendar
        document.querySelectorAll('.class-event').forEach(event => event.remove());

        const selectedCourse = courseFilter.value;
        const selectedInstructor = instructorFilter.value;

        // Filter the courses based on dropdown selections
        const filteredCourses = allCourses.filter(course => {
            const courseMatch = (selectedCourse === 'all' || course.course_number === selectedCourse);
            const instructorMatch = (selectedInstructor === 'all' || course.instructors === selectedInstructor);
            return courseMatch && instructorMatch;
        });

        // Draw the filtered courses
        filteredCourses.forEach(course => placeCourseOnCalendar(course));
    }

    function placeCourseOnCalendar(course) {
        if (!course || !course.days || !course.time_of_day) return;

        const days = course.days.split('').map(dayChar => dayMap[dayChar]).filter(Boolean);
        if (days.length === 0) return;

        days.forEach(day => {
            const column = calendarGrid.querySelector(`.day-column[data-day="${day}"]`);
            if (!column) return;

            const timeString = course.time_of_day;
            const timeParts = timeString.match(/(\d{1,2}:\d{2})(AM|PM)/);
            if (!timeParts) return;

            const [time, ampm] = [timeParts[1], timeParts[2]];
            let [hour, minute] = time.split(':').map(Number);

            if (ampm === 'PM' && hour !== 12) hour += 12;
            if (ampm === 'AM' && hour === 12) hour = 0;

            const startMinutes = (hour * 60) + minute;
            const topPosition = ((startMinutes / 60) - START_HOUR) * 60;
            const height = course.duration;

            if (!height || topPosition < 0 || startMinutes > END_HOUR * 60) return;

            const eventDiv = document.createElement('div');
            eventDiv.className = 'class-event';
            eventDiv.style.top = `${topPosition}px`;
            eventDiv.style.height = `${height}px`;

            // --- Tooltip and Event Content ---
            eventDiv.innerHTML = `
                <div class="event-title">${course.course_number}</div>
                <div class="event-tooltip">
                    <strong>Course:</strong> ${course.course_number}<br>
                    <strong>Instructor:</strong> ${course.instructors}<br>
                    <strong>Time:</strong> ${course.time_of_day}<br>
                    <strong>Location:</strong> ${course.location}<br>
                    <strong>Duration:</strong> ${course.duration} min
                </div>
            `;
            
            column.appendChild(eventDiv);
        });
    }
});
