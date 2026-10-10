/**
 * Reusable PasswordStrengthMeter Component
 * 
 * Evaluates 4 requirements:
 * 1. 8+ Characters (length >= 8)
 * 2. Letters (A-Z) (/[a-zA-Z]/)
 * 3. Numbers (0-9) (/[0-9]/)
 * 4. Special (@,$,!,%,*) (/[@$!%*#?&_\^~+\-=/\\|<>{}[\]():;,.]/)
 * 
 * Levels:
 * - 0-1 met: "Very Weak", red, bar ~25% (0% if empty)
 * - 2 met:   "Weak", orange, 50%
 * - 3 met:   "Good", yellow, 75%
 * - 4 met:   "Strong", green, 100%
 */

const EXCLAMATION_ICON = `
  <svg class="w-3.5 h-3.5 flex-shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
`;

const CHECK_ICON = `
  <svg class="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="m9 12 2 2 4-4"></path>
  </svg>
`;

class PasswordStrengthMeter {
  constructor({ container, input, submitButton, onStateChange } = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.input = typeof input === 'string' ? document.querySelector(input) : input;
    this.submitButton = typeof submitButton === 'string' ? document.querySelector(submitButton) : submitButton;
    this.onStateChange = onStateChange;

    if (!this.container || !this.input) return;

    this.rules = [
      { id: 'length', text: '8+ Characters', test: (p) => p.length >= 8 },
      { id: 'letters', text: 'Letters (A-Z)', test: (p) => /[a-zA-Z]/.test(p) },
      { id: 'numbers', text: 'Numbers (0-9)', test: (p) => /[0-9]/.test(p) },
      { id: 'special', text: 'Special (@,$,!,%,*)', test: (p) => /[@$!%*#?&_\^~+\-=/\\|<>{}[\]():;,.]/.test(p) }
    ];

    this.render();
    this.bindEvents();
    this.evaluate(this.input.value || '');
  }

  render() {
    this.container.innerHTML = `
      <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5 text-xs shadow-inner select-none transition-all duration-200">
        <!-- Top Row: Strength Label -->
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400 font-medium">Password Strength:</span>
          <span id="psm-level-label" class="font-bold text-slate-500 transition-colors duration-200" aria-live="polite">Very Weak</span>
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden">
          <div id="psm-progress-bar" class="h-full rounded-full transition-all duration-300 ease-out w-0 bg-rose-500"></div>
        </div>

        <!-- 2x2 Requirements Grid -->
        <div class="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] pt-0.5">
          <div id="psm-rule-length" class="flex items-center gap-1.5 text-slate-500 transition-colors duration-200">
            <span class="psm-icon">${EXCLAMATION_ICON}</span>
            <span class="psm-text truncate">8+ Characters</span>
          </div>
          <div id="psm-rule-letters" class="flex items-center gap-1.5 text-slate-500 transition-colors duration-200">
            <span class="psm-icon">${EXCLAMATION_ICON}</span>
            <span class="psm-text truncate">Letters (A-Z)</span>
          </div>
          <div id="psm-rule-numbers" class="flex items-center gap-1.5 text-slate-500 transition-colors duration-200">
            <span class="psm-icon">${EXCLAMATION_ICON}</span>
            <span class="psm-text truncate">Numbers (0-9)</span>
          </div>
          <div id="psm-rule-special" class="flex items-center gap-1.5 text-slate-500 transition-colors duration-200">
            <span class="psm-icon">${EXCLAMATION_ICON}</span>
            <span class="psm-text truncate">Special (@,$,!,%,*)</span>
          </div>
        </div>
      </div>
    `;

    this.labelEl = this.container.querySelector('#psm-level-label');
    this.barEl = this.container.querySelector('#psm-progress-bar');
    this.ruleEls = {
      length: this.container.querySelector('#psm-rule-length'),
      letters: this.container.querySelector('#psm-rule-letters'),
      numbers: this.container.querySelector('#psm-rule-numbers'),
      special: this.container.querySelector('#psm-rule-special')
    };
  }

  bindEvents() {
    this.input.addEventListener('input', () => {
      this.evaluate(this.input.value || '');
    });
    this.input.addEventListener('focus', () => {
      if ((this.input.value || '').length > 0) {
        this.container.classList.remove('hidden');
      }
    });
  }

  evaluate(password) {
    const val = password || '';
    const results = {};
    let score = 0;

    // Dynamically show the meter only when the user enters characters into the password field
    if (val.length > 0) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }

    for (const rule of this.rules) {
      const isMet = rule.test(val);
      results[rule.id] = isMet;
      if (isMet) score++;

      const el = this.ruleEls[rule.id];
      if (el) {
        const iconSpan = el.querySelector('.psm-icon');
        const textSpan = el.querySelector('.psm-text');
        if (isMet) {
          el.className = 'flex items-center gap-1.5 text-emerald-400 font-medium transition-colors duration-200';
          if (iconSpan) iconSpan.innerHTML = CHECK_ICON;
        } else {
          el.className = 'flex items-center gap-1.5 text-slate-500 transition-colors duration-200';
          if (iconSpan) iconSpan.innerHTML = EXCLAMATION_ICON;
        }
      }
    }

    // Config: label, text color, bar width, bar color
    let label = 'Very Weak';
    let textColor = 'text-rose-500';
    let barWidth = '25%';
    let barColor = 'bg-rose-500';

    if (val.length === 0) {
      label = 'Very Weak';
      textColor = 'text-slate-500';
      barWidth = '0%';
      barColor = 'bg-slate-700';
    } else if (score <= 1) {
      label = 'Very Weak';
      textColor = 'text-rose-500';
      barWidth = '25%';
      barColor = 'bg-rose-500';
    } else if (score === 2) {
      label = 'Weak';
      textColor = 'text-amber-500';
      barWidth = '50%';
      barColor = 'bg-amber-500';
    } else if (score === 3) {
      label = 'Good';
      textColor = 'text-yellow-400';
      barWidth = '75%';
      barColor = 'bg-yellow-400';
    } else if (score === 4) {
      label = 'Strong';
      textColor = 'text-emerald-400';
      barWidth = '100%';
      barColor = 'bg-emerald-500';
    }

    if (this.labelEl) {
      this.labelEl.textContent = label;
      this.labelEl.className = `font-bold ${textColor} transition-colors duration-200`;
    }

    if (this.barEl) {
      this.barEl.style.width = barWidth;
      this.barEl.className = `h-full rounded-full transition-all duration-300 ease-out ${barColor}`;
    }

    const isValid = score === 4;

    // Optional submit button control for registration
    if (this.submitButton) {
      const isRegisterMode = (typeof currentAuthGateTab !== 'undefined' && currentAuthGateTab === 'register');
      if (isRegisterMode) {
        if (isValid) {
          this.submitButton.disabled = false;
          this.submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
          this.submitButton.removeAttribute('title');
        } else {
          this.submitButton.disabled = true;
          this.submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          this.submitButton.title = 'Please meet all 4 password requirements to continue';
        }
      }
    }

    if (typeof this.onStateChange === 'function') {
      this.onStateChange({ score, isValid, results });
    }

    return { score, isValid, results };
  }
}

// Global factory function
window.PasswordStrengthMeter = PasswordStrengthMeter;
window.createPasswordStrengthMeter = function(options) {
  return new PasswordStrengthMeter(options);
};
