/**
 * StayHub Date Range Picker
 * Usage: new StayHubDatePicker({ trigger, fromInput, toInput, onApply })
 */
class StayHubDatePicker {
  constructor({ trigger, fromInput, toInput, onApply, minDate }) {
    this.trigger = trigger;
    this.fromInput = fromInput;
    this.toInput = toInput;
    this.onApply = onApply;
    this.minDate = minDate || new Date();
    this.minDate.setHours(0, 0, 0, 0);

    this.startDate = fromInput.value ? new Date(fromInput.value) : null;
    this.endDate = toInput.value ? new Date(toInput.value) : null;
    this.hoverDate = null;
    this.currentMonth = this.startDate ? new Date(this.startDate) : new Date();
    this.currentMonth.setDate(1);

    this.popover = null;
    this.isOpen = false;

    this._build();
    this._bindTrigger();
    this._updateTriggerLabel();
  }

  _build() {
    // Create backdrop overlay
    this.backdrop = document.createElement("div");
    this.backdrop.className = "dp-backdrop";
    document.body.appendChild(this.backdrop);

    // Create popover inside backdrop so it scrolls within it
    this.popover = document.createElement("div");
    this.popover.className = "dp-popover";
    this.backdrop.appendChild(this.popover);
  }

  _bindTrigger() {
    this.trigger.addEventListener("click", (e) => {
      if (e.target.closest(".dp-clear")) {
        e.stopPropagation();
        this._clear();
        return;
      }
      this.isOpen ? this._close() : this._open();
    });

    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.trigger.contains(e.target) && !this.popover.contains(e.target)) {
        this._close();
      }
    });

    // Close on backdrop click (the transparent area around the popover)
    this.backdrop.addEventListener("click", (e) => {
      if (e.target === this.backdrop) {
        this._close();
      }
    });
  }

  _positionPopover() {
    // Position popover near trigger within the scrollable backdrop
    const rect = this.trigger.getBoundingClientRect();
    const scrollTop = window.scrollY;
    this.popover.style.position = "absolute";
    this.popover.style.top = (rect.bottom + scrollTop + 8) + "px";

    const popWidth = this.popover.offsetWidth || 600;
    if (rect.left + popWidth > window.innerWidth) {
      this.popover.style.left = "auto";
      this.popover.style.right = "16px";
    } else {
      this.popover.style.left = Math.max(8, rect.left) + "px";
      this.popover.style.right = "auto";
    }
  }

  _open() {
    this.isOpen = true;
    this.trigger.classList.add("active");
    this._render();
    this.backdrop.classList.add("show");
    this.popover.classList.add("show");
    this._positionPopover();
    // Scroll backdrop so the popover top is visible
    const rect = this.trigger.getBoundingClientRect();
    const scrollTop = window.scrollY;
    this.backdrop.scrollTop = rect.bottom + scrollTop;
    // Lock body scroll
    document.body.classList.add("dp-open");
  }

  _close() {
    this.isOpen = false;
    this.trigger.classList.remove("active");
    this.backdrop.classList.remove("show");
    this.popover.classList.remove("show");
    document.body.classList.remove("dp-open");
  }

  _clear() {
    this.startDate = null;
    this.endDate = null;
    this.fromInput.value = "";
    this.toInput.value = "";
    this._updateTriggerLabel();
    if (this.isOpen) this._render();
  }

  _updateTriggerLabel() {
    const label = this.trigger.querySelector(".dp-label, .dp-placeholder");
    if (!label) return;
    if (this.startDate && this.endDate) {
      label.className = "dp-label";
      label.textContent = this._formatShort(this.startDate) + "  →  " + this._formatShort(this.endDate);
      // Show clear button
      let clear = this.trigger.querySelector(".dp-clear");
      if (!clear) {
        clear = document.createElement("span");
        clear.className = "dp-clear";
        clear.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        this.trigger.appendChild(clear);
      }
      clear.style.display = "";
    } else {
      label.className = "dp-placeholder";
      label.textContent = "Select dates";
      const clear = this.trigger.querySelector(".dp-clear");
      if (clear) clear.style.display = "none";
    }
  }

  _formatShort(d) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return d.getDate() + " " + months[d.getMonth()];
  }

  _formatISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  _sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  _render() {
    const m1 = new Date(this.currentMonth);
    const m2 = new Date(this.currentMonth);
    m2.setMonth(m2.getMonth() + 1);

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    this.popover.innerHTML = `
      <div class="dp-header">
        <button class="dp-nav dp-prev" type="button"><i class="fa-solid fa-chevron-left"></i></button>
        <span class="dp-month-title">${months[m1.getMonth()]} ${m1.getFullYear()}</span>
        <span class="dp-month-title">${months[m2.getMonth()]} ${m2.getFullYear()}</span>
        <button class="dp-nav dp-next" type="button"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
      <div class="dp-calendars">
        <div class="dp-calendar">${this._renderMonth(m1)}</div>
        <div class="dp-calendar">${this._renderMonth(m2)}</div>
      </div>
      <div class="dp-footer">
        <div class="dp-selection-info">${this._getSelectionInfo()}</div>
        <div class="dp-actions">
          <button class="dp-btn-clear" type="button">Clear</button>
          <button class="dp-btn-apply" type="button" ${!this.startDate || !this.endDate ? "disabled" : ""}>Apply</button>
        </div>
      </div>
    `;

    // Bind nav
    this.popover.querySelector(".dp-prev").addEventListener("click", (e) => {
      e.stopPropagation();
      this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
      this._render();
    });
    this.popover.querySelector(".dp-next").addEventListener("click", (e) => {
      e.stopPropagation();
      this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
      this._render();
    });

    // Bind days
    this.popover.querySelectorAll(".dp-day:not(.dp-empty):not(.dp-disabled)").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const d = new Date(el.dataset.date);
        this._selectDate(d);
      });
      el.addEventListener("mouseenter", () => {
        if (this.startDate && !this.endDate) {
          this.hoverDate = new Date(el.dataset.date);
          this._updateRangeHighlight();
        }
      });
    });

    // Bind footer
    this.popover.querySelector(".dp-btn-clear").addEventListener("click", (e) => {
      e.stopPropagation();
      this._clear();
    });
    this.popover.querySelector(".dp-btn-apply").addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.startDate && this.endDate) {
        this.fromInput.value = this._formatISO(this.startDate);
        this.toInput.value = this._formatISO(this.endDate);
        // Dispatch change events so listeners on hidden inputs fire
        this.fromInput.dispatchEvent(new Event("change", { bubbles: true }));
        this.toInput.dispatchEvent(new Event("change", { bubbles: true }));
        this._updateTriggerLabel();
        this._close();
        if (this.onApply) this.onApply(this.startDate, this.endDate);
      }
    });
  }

  _renderMonth(monthDate) {
    const days = ["Su","Mo","Tu","We","Th","Fr","Sa"];
    let html = '<div class="dp-weekdays">';
    for (const d of days) html += `<div>${d}</div>`;
    html += '</div><div class="dp-days">';

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);

    // Empty cells
    for (let i = 0; i < firstDay; i++) html += '<div class="dp-day dp-empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = this._formatISO(date);
      let cls = "dp-day";

      if (date < this.minDate) {
        cls += " dp-disabled";
      } else {
        if (this._sameDay(date, today)) cls += " dp-today";
        if (this._sameDay(date, this.startDate) && this._sameDay(date, this.endDate)) {
          cls += " dp-range-start dp-range-end";
        } else if (this._sameDay(date, this.startDate)) {
          cls += " dp-range-start";
        } else if (this._sameDay(date, this.endDate)) {
          cls += " dp-range-end";
        } else if (this.startDate && this.endDate && date > this.startDate && date < this.endDate) {
          cls += " dp-in-range";
        }
      }

      html += `<div class="${cls}" data-date="${iso}">${d}</div>`;
    }

    html += '</div>';
    return html;
  }

  _selectDate(d) {
    if (!this.startDate || (this.startDate && this.endDate)) {
      // Start fresh selection
      this.startDate = d;
      this.endDate = null;
    } else {
      // Second click
      if (d <= this.startDate) {
        this.startDate = d;
        this.endDate = null;
      } else {
        this.endDate = d;
      }
    }
    this.hoverDate = null;
    this._render();
    if (this.isOpen) this._positionPopover();
  }

  _updateRangeHighlight() {
    this.popover.querySelectorAll(".dp-day:not(.dp-empty):not(.dp-disabled)").forEach(el => {
      const d = new Date(el.dataset.date);
      el.classList.remove("dp-in-range");
      if (this.startDate && this.hoverDate && !this.endDate) {
        const rangeEnd = this.hoverDate > this.startDate ? this.hoverDate : this.startDate;
        const rangeStart = this.hoverDate > this.startDate ? this.startDate : this.hoverDate;
        if (d > rangeStart && d < rangeEnd) {
          el.classList.add("dp-in-range");
        }
      }
    });
  }

  _getSelectionInfo() {
    if (this.startDate && this.endDate) {
      const nights = Math.ceil((this.endDate - this.startDate) / (1000*60*60*24));
      return `<span>${this._formatShort(this.startDate)}</span> → <span>${this._formatShort(this.endDate)}</span> · ${nights} night${nights > 1 ? 's' : ''}`;
    }
    if (this.startDate) return `<span>${this._formatShort(this.startDate)}</span> → Select check-out`;
    return "Select check-in date";
  }
}
