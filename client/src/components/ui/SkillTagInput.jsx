import { useState, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * SkillTagInput — tag/chip input for adding and removing skills.
 *
 * Props:
 *   skills       — array of { skillName, category }
 *   onChange     — called with updated array
 *   suggestions  — array of { label, category } to show as clickable chips
 *   category     — default category for typed entries ('technical' | 'soft' | 'transferable')
 *   placeholder  — input placeholder text
 *   maxItems     — optional limit
 */
export function SkillTagInput({
  skills = [],
  onChange,
  suggestions = [],
  category = 'technical',
  placeholder = 'Type a skill and press Enter…',
  maxItems,
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const existingNames = new Set(skills.map(s => s.skillName.toLowerCase()));

  // Filter suggestions: not already added, matches current input
  const filtered = suggestions.filter(s => {
    const label = s.label.toLowerCase();
    return !existingNames.has(label) && (
      !inputValue || label.includes(inputValue.toLowerCase())
    );
  }).slice(0, 8);

  function addSkill(name, cat) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (existingNames.has(trimmed.toLowerCase())) return;
    if (maxItems && skills.length >= maxItems) return;
    onChange([...skills, { skillName: trimmed, category: cat || category }]);
    setInputValue('');
    setShowSuggestions(false);
  }

  function removeSkill(index) {
    const next = skills.filter((_, i) => i !== index);
    onChange(next);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputValue, category);
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      removeSkill(skills.length - 1);
    }
  }

  const categoryColour = {
    technical:    'badge-green',
    soft:         'badge-gray',
    transferable: 'badge-amber',
    domain:       'badge-amber',  // legacy alias
  };

  return (
    <div className="space-y-3">
      {/* Input */}
      <div
        className="min-h-[44px] w-full bg-white border border-border rounded-lg px-3 py-2 flex flex-wrap gap-1.5 cursor-text focus-within:ring-2 focus-within:ring-brand-green focus-within:border-transparent"
        onClick={() => inputRef.current?.focus()}
      >
        {skills.map((s, i) => (
          <span
            key={i}
            className={`${categoryColour[s.category] ?? 'badge-gray'} badge pr-1 gap-1`}
          >
            {s.skillName}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeSkill(i); }}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
              aria-label={`Remove ${s.skillName}`}
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={skills.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[140px] outline-none text-sm text-text-primary placeholder-text-muted bg-transparent"
        />
      </div>

      {/* Dropdown suggestions */}
      {showSuggestions && filtered.length > 0 && (
        <div className="bg-white border border-border rounded-lg shadow-md py-1 max-h-48 overflow-y-auto">
          {filtered.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => { e.preventDefault(); addSkill(s.label, s.category); }}
              className="w-full text-left px-3.5 py-2 text-sm hover:bg-surface transition-colors flex items-center justify-between"
            >
              <span>{s.label}</span>
              <span className="text-xs text-text-muted capitalize">{s.category}</span>
            </button>
          ))}
        </div>
      )}

      {/* Suggestion chips — always-visible quick-add */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions
            .filter(s => !existingNames.has(s.label.toLowerCase()))
            .slice(0, 12)
            .map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addSkill(s.label, s.category)}
                className="px-2.5 py-1 text-xs bg-surface border border-border rounded-full text-text-secondary hover:border-brand-green hover:text-brand-green transition-colors"
                disabled={!!maxItems && skills.length >= maxItems}
              >
                + {s.label}
              </button>
            ))}
        </div>
      )}

      <p className="text-xs text-text-muted">
        Type and press Enter to add, or click a suggestion.
        {maxItems ? ` (${skills.length}/${maxItems})` : ` ${skills.length} added.`}
      </p>
    </div>
  );
}
