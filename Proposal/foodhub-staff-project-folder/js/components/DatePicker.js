/**
 * FOODHUB Custom Date Picker Component
 * Replaces native <input type="date"> with fully stylable calendar
 * Supports Light Classic & Dark Midnight themes
 */
export class DatePicker {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            format: options.format || 'YYYY-MM-DD',
            placeholder: options.placeholder || 'Select date',
            allowClear: options.allowClear !== false,
            minDate: options.minDate || null,
            maxDate: options.maxDate || null,
            ...options
        };

        this.isOpen = false;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.calendarEl = null;

        this.init();
    }

    init() {
        // Hide native input
        this.input.type = 'text';
        this.input.setAttribute('autocomplete', 'off');
        this.input.readOnly = true;
        this.input.placeholder = this.options.placeholder;

        // Set initial value if input has value
        if (this.input.value) {
            this.selectedDate = this.parseDate(this.input.value);
            if (this.selectedDate) {
                this.input.value = this.formatDate(this.selectedDate);
                this.currentDate = new Date(this.selectedDate);
            }
        }

        // Create wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'fp-datepicker-wrapper';
        this.input.parentNode.insertBefore(this.wrapper, this.input);
        this.wrapper.appendChild(this.input);

        // Create calendar
        this.createCalendar();

        // Bind events
        this.bindEvents();
    }

    createCalendar() {
        this.calendarEl = document.createElement('div');
        this.calendarEl.className = 'fp-datepicker';
        this.calendarEl.innerHTML = this.renderCalendar();
        this.wrapper.appendChild(this.calendarEl);
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = `
            <div class="fp-header">
                <button type="button" class="fp-nav-btn fp-prev-month" aria-label="Previous month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <div class="fp-title">
                    <span class="fp-month">${monthNames[month]}</span>
                    <span class="fp-year">${year}</span>
                </div>
                <button type="button" class="fp-nav-btn fp-next-month" aria-label="Next month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
            <div class="fp-weekdays">
                ${dayNames.map(d => `<span>${d}</span>`).join('')}
            </div>
            <div class="fp-days">`;

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const date = new Date(year, month - 1, day);
            html += `<button type="button" class="fp-day fp-other-month" data-date="${this.formatDate(date)}">${day}</button>`;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);

            let classes = 'fp-day';
            if (date.getTime() === today.getTime()) classes += ' fp-today';
            if (this.selectedDate && date.getTime() === this.selectedDate.getTime()) classes += ' fp-selected';
            if (this.options.minDate && date < this.options.minDate) classes += ' fp-disabled';
            if (this.options.maxDate && date > this.options.maxDate) classes += ' fp-disabled';

            html += `<button type="button" class="${classes}" data-date="${this.formatDate(date)}" ${classes.includes('fp-disabled') ? 'disabled' : ''}>${day}</button>`;
        }

        // Next month days
        const totalCells = firstDay + daysInMonth;
        const nextMonthDays = Math.ceil(totalCells / 7) * 7 - totalCells;
        for (let day = 1; day <= nextMonthDays; day++) {
            const date = new Date(year, month + 1, day);
            html += `<button type="button" class="fp-day fp-other-month" data-date="${this.formatDate(date)}">${day}</button>`;
        }

        html += `
            </div>
            <div class="fp-footer">
                <button type="button" class="fp-today-btn">Today</button>
                <button type="button" class="fp-clear-btn">Clear</button>
            </div>
        `;

        return html;
    }

    bindEvents() {
        // Input click - toggle calendar
        this.input.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Calendar clicks
        this.calendarEl.addEventListener('click', (e) => {
            e.stopPropagation();

            const dayBtn = e.target.closest('.fp-day:not(.fp-disabled)');
            if (dayBtn) {
                const dateStr = dayBtn.dataset.date;
                this.selectDate(dateStr);
                return;
            }

            if (e.target.closest('.fp-prev-month')) {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.refreshCalendar();
            }

            if (e.target.closest('.fp-next-month')) {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.refreshCalendar();
            }

            if (e.target.closest('.fp-today-btn')) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                this.currentDate = new Date(today);
                this.selectDate(this.formatDate(today));
            }

            if (e.target.closest('.fp-clear-btn')) {
                this.clear();
            }
        });

        // Close on outside click
        document.addEventListener('click', () => this.close());

        // Keyboard navigation
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        this.wrapper.classList.add('fp-open');
        this.calendarEl.style.display = 'block';
        // Position calendar
        this.positionCalendar();
    }

    close() {
        this.isOpen = false;
        this.wrapper.classList.remove('fp-open');
        this.calendarEl.style.display = 'none';
    }

    positionCalendar() {
        const rect = this.input.getBoundingClientRect();
        this.calendarEl.style.top = `${rect.height + 4}px`;
        this.calendarEl.style.left = '0';
    }

    refreshCalendar() {
        this.calendarEl.innerHTML = this.renderCalendar();
    }

    selectDate(dateStr) {
        const date = this.parseDate(dateStr);
        if (!date) return;

        this.selectedDate = date;
        this.input.value = this.formatDate(date);
        this.currentDate = new Date(date);

        // Trigger change event
        this.input.dispatchEvent(new Event('change', { bubbles: true }));

        this.close();
    }

    clear() {
        this.selectedDate = null;
        this.input.value = '';
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
        this.close();
    }

    parseDate(str) {
        // Parse YYYY-MM-DD format
        const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        const [, year, month, day] = match.map(Number);
        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? null : date;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Public API
    getValue() {
        return this.selectedDate ? this.formatDate(this.selectedDate) : '';
    }

    setValue(dateStr) {
        const date = this.parseDate(dateStr);
        if (date) {
            this.selectedDate = date;
            this.input.value = this.formatDate(date);
            this.currentDate = new Date(date);
        }
    }

    destroy() {
        this.close();
        if (this.calendarEl) this.calendarEl.remove();
        if (this.wrapper) {
            this.wrapper.parentNode.insertBefore(this.input, this.wrapper);
            this.wrapper.remove();
        }
        this.input.type = 'date';
        this.input.readOnly = false;
    }
}

/**
 * Initialize date pickers on all inputs with [data-datepicker] attribute
 */
export function initDatePickers(selector = '[data-datepicker]') {
    const inputs = document.querySelectorAll(selector);
    const pickers = [];

    inputs.forEach(input => {
        if (!input._datepicker) {
            const options = {};
            if (input.dataset.min) options.minDate = new Date(input.dataset.min);
            if (input.dataset.max) options.maxDate = new Date(input.dataset.max);
            if (input.dataset.placeholder) options.placeholder = input.dataset.placeholder;

            input._datepicker = new DatePicker(input, options);
            pickers.push(input._datepicker);
        }
    });

    return pickers;
}

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initDatePickers();
});