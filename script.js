// In script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const calendarGrid = document.querySelector('.calendar-grid');
    const timeColumn = document.querySelector('.time-column');
    const instructorFilter = document.getElementById('instructor-filter');
    const typeFilter = document.getElementById('type-filter');
    const courseCheckboxesContainer = document.getElementById('course-checkboxes');
    const resetBtn = document.getElementById('reset-filters');

    // --- Configuration ---
    const START_HOUR = 7;
    const END_HOUR = 20;
    const dayMap = { 'M': 'Mo', 'T': 'Tu', 'W': 'We', 'R': 'Th', 'F': 'Fr' };
    let allCourses = [];
    const courseColorMap = new Map(); // To store a unique color for each course

    // --- Initial Setup ---
    generateTimeSlots();
    fetchDataAndInitialize();

    // --- Event Listeners ---
    instructorFilter.addEventListener('change', filterAndRedrawCalendar);
    typeFilter.addEventListener('change', filterAndRedrawCalendar);
    courseCheckboxesContainer.addEventListener('change', filterAndRedrawCalendar);
    resetBtn.addEventListener('click', () => {
        instructorFilter.value = 'all';
        typeFilter.value = 'all';
        document.querySelectorAll('#course-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
        filterAndRedrawCalendar();
    });

    // --- Functions ---

    /**
     * NEW: Generates a color based on a string.
     * This ensures the same course always gets the same color.
     */
    function stringToHslColor(str, s = 60, l = 75) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = hash % 360;
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

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
        const uniqueCourses = [...new Set(courses.map(course => course.course_number))].sort();
        
        // NEW: Assign a color to each unique course
        uniqueCourses.forEach(courseName => {
            courseColorMap.set(courseName, stringToHslColor(courseName));
        });

        // (The rest of this function is the same)
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
        const uniqueTypes = [...new Set(courses.map(course => course.type))].sort();
        uniqueTypes.forEach(typeName => {
            if (typeName && typeName.toLowerCase() !== 'nan') {
                const option = document.createElement('option');
                option.value = typeName;
                option.textContent = typeName;
                typeFilter.appendChild(option);
            }
        });
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

        const selectedInstructor = instructorFilter.value;
        const selectedType = typeFilter.value;
        const selectedCourses = Array.from(document.querySelectorAll('#course-checkboxes input:checked')).map(cb => cb.value);

        const filteredCourses = allCourses.filter(course => {
            const instructorMatch = (selectedInstructor === 'all' || course.instructors.includes(selectedInstructor));
            const typeMatch = (selectedType === 'all' || course.type === selectedType);
            const courseMatch = (selectedCourses.length === 0 || selectedCourses.includes(course.course_number));
            return instructorMatch && typeMatch && courseMatch;
        });

        // --- NEW: Collision detection and positioning logic ---
        const eventLayouts = {}; // Key: "day-start-end", Value: [course1, course2]

        filteredCourses.forEach(course => {
            if (!course || !course.time_of_day) return;
            const timeString = course.time_of_day;
            const timeParts = timeString.match(/(\d{1,2}:\d{2})(AM|PM)/);
            if (!timeParts) return;
            const [time, ampm] = [timeParts[1], timeParts[2]];
            let [hour, minute] = time.split(':').map(Number);
            if (ampm === 'PM' && hour !== 12) hour += 12;
            if (ampm === 'AM' && hour === 12) hour = 0;
            const startMinutes = (hour * 60) + minute;
            const endMinutes = startMinutes + course.duration;

            const days = course.days.split('').map(dayChar => dayMap[dayChar]).filter(Boolean);
            days.forEach(day => {
                const key = `${day}-${startMinutes}-${endMinutes}`;
                if (!eventLayouts[key]) {
                    eventLayouts[key] = [];
                }
                eventLayouts[key].push(course);
            });
        });

        // Now place events with calculated widths and offsets
        Object.values(eventLayouts).forEach(collidingEvents => {
            const totalInSlot = collidingEvents.length;
            collidingEvents.forEach((course, indexInSlot) => {
                const width = 100 / totalInSlot;
                const left = indexInSlot * width;
                placeCourseOnCalendar(course, width, left);
            });
        });
    }
    
    // --- UPDATED: placeCourseOnCalendar now accepts width and left parameters ---
    function placeCourseOnCalendar(course, width = 100, left = 0) {
        if (!course || !course.days || !course.time_of_day) return;

        const days = course.days.split('').map(dayChar => dayMap[dayChar]).filter(Boolean);
        if (days.length === 0) return;

        const dayToPlace = days.find(d => calendarGrid.querySelector(`.day-column[data-day="${d}"]`));
        if (!dayToPlace) return;

        const column = calendarGrid.querySelector(`.day-column[data-day="${dayToPlace}"]`);
        
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
        
        // --- Apply new styles ---
        eventDiv.style.top = `${topPosition}px`;
        eventDiv.style.height = `${height}px`;
        eventDiv.style.width = `calc(${width}% - 4px)`; // Subtract a little for margins
        eventDiv.style.left = `${left}%`;
        
        const color = courseColorMap.get(course.course_number) || '#a3c4f3';
        eventDiv.style.backgroundColor = color;
        // Make border slightly darker than the background
        eventDiv.style.borderColor = `hsl(${parseInt(color.substring(4))}, 50%, 60%)`;

        eventDiv.innerHTML = `
            <div class="event-title">${course.course_number}</div>
            <div class="event-tooltip">
                <strong>Course:</strong> ${course.course_number}<br>
                <strong>Instructor:</strong> ${course.instructors}<br>
                <strong>Time:</strong> ${course.time_of_day}<br>
                <strong>Location:</strong> ${course.location}<br>
                <strong>Type:</strong> ${course.type}<br>
                <strong>Duration:</strong> ${course.duration} min
            </div>`;
            
        column.appendChild(eventDiv);
    }
});
