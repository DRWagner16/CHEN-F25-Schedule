// In script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const calendarGrid = document.querySelector('.calendar-grid');
    const timeColumn = document.querySelector('.time-column');
    const instructorFilter = document.getElementById('instructor-filter');
    const typeFilter = document.getElementById('type-filter'); // New
    const courseCheckboxesContainer = document.getElementById('course-checkboxes'); // New
    const resetBtn = document.getElementById('reset-filters');

    // --- Configuration ---
    const START_HOUR = 7;
    const END_HOUR = 20;
    const dayMap = { 'M': 'Mo', 'T': 'Tu', 'W': 'We', 'R': 'Th', 'F': 'Fr' };
    let allCourses = [];

    // --- Initial Setup ---
    generateTimeSlots();
    fetchDataAndInitialize();

    // --- Event Listeners ---
    instructorFilter.addEventListener('change', filterAndRedrawCalendar);
    typeFilter.addEventListener('change', filterAndRedrawCalendar); // New
    courseCheckboxesContainer.addEventListener('change', filterAndRedrawCalendar); // New

    resetBtn.addEventListener('click', () => {
        instructorFilter.value = 'all';
        typeFilter.value = 'all';
        // Uncheck all course checkboxes
        document.querySelectorAll('#course-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
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
                allCourses = data;
                populateFilters(data);
                filterAndRedrawCalendar();
            })
            .catch(error => console.error('[FATAL] Error loading schedule data:', error));
    }

    function populateFilters(courses) {
        // --- Populate Instructors ---
        const allInstructorNames = courses.flatMap(course => course.instructors.split(';').map(name => name.trim()));
        const uniqueInstructors = [...new Set(allInstructorNames)].sort();
        uniqueInstructors.forEach(name => {
            if (name && name.toLowerCase() !== 'nan') {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                instructorFilter.appendChild(option);
            }
        });

        // --- Populate Types (New) ---
        const uniqueTypes = [...new Set(courses.map(course => course.type))].sort();
        uniqueTypes.forEach(typeName => {
            if (typeName && typeName.toLowerCase() !== 'nan') {
                const option = document.createElement('option');
                option.value = typeName;
                option.textContent = typeName;
                typeFilter.appendChild(option);
            }
        });

        // --- Populate Courses as Checkboxes (New) ---
        const uniqueCourses = [...new Set(courses.map(course => course.course_number))].sort();
        uniqueCourses.forEach(courseName => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'checkbox-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = courseName;
            checkbox.value = courseName;

            const label = document.createElement('label');
            label.htmlFor = courseName;
            label.textContent = courseName;

            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(label);
            courseCheckboxesContainer.appendChild(itemDiv);
        });
    }

    function filterAndRedrawCalendar() {
        document.querySelectorAll('.class-event').forEach(event => event.remove());

        // --- Updated Filter Logic ---
        const selectedInstructor = instructorFilter.value;
        const selectedType = typeFilter.value;
        
        // Get an array of all checked course names
        const selectedCourses = Array.from(document.querySelectorAll('#course-checkboxes input:checked')).map(cb => cb.value);

        const filteredCourses = allCourses.filter(course => {
            const instructorMatch = (selectedInstructor === 'all' || course.instructors.includes(selectedInstructor));
            const typeMatch = (selectedType === 'all' || course.type === selectedType);
            
            // If no courses are checked, show all. Otherwise, check if the course is in the selected list.
            const courseMatch = (selectedCourses.length === 0 || selectedCourses.includes(course.course_number));

            return instructorMatch && typeMatch && courseMatch;
        });

        filteredCourses.forEach(course => placeCourseOnCalendar(course));
    }
    
    // The placeCourseOnCalendar function remains exactly the same as the previous version
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
            eventDiv.innerHTML = `<div class="event-title">${course.course_number}</div><div class="event-tooltip"><strong>Course:</strong> ${course.course_number}<br><strong>Instructor:</strong> ${course.instructors}<br><strong>Time:</strong> ${course.time_of_day}<br><strong>Location:</strong> ${course.location}<br><strong>Type:</strong> ${course.type}<br><strong>Duration:</strong> ${course.duration} min</div>`;
            column.appendChild(eventDiv);
        });
    }
});
